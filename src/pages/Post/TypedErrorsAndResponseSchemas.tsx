import PostLayout from '../../components/PostLayout';
import { useLocale } from '../../lib/locale';

const content = {
  en: {
    kicker: 'API Design · Conventions',
    title: (
      <>
        Typed Errors and a<br /><em>Consistent Response Schema</em>
      </>
    ),
    lede: "raise Exception('Order not found.') looks completely fine until a second person writes the string slightly differently somewhere else, and now the same failure produces two different codes depending on which file threw it.",
    body: (
      <>
        <p>Error handling has a clean layer split: the Domain and Application layers raise a plain <code>Exception</code>, never a framework-specific HTTP exception like FastAPI's <code>HTTPException</code>, and the Interface layer — the router handler — is the only place that catches an error and converts it into an HTTP status code. That separation keeps Domain and Application free of any HTTP dependency at all, and concentrates the one messy job, "translate this into a status code," in exactly one place.</p>
        <pre><code>{`# domain/order.py — inside the Aggregate
if self._status == "cancelled":
    raise Exception(OrderErrorMessage.ORDER_ALREADY_CANCELLED)

# application/command/order_command_service.py
if not order:
    raise Exception(OrderErrorMessage.ORDER_NOT_FOUND)`}</code></pre>
        <h2>Why the Message Is an Enum Key, Not a Free-Form String</h2>
        <pre><code>{`class OrderErrorMessage(str, Enum):
    ORDER_NOT_FOUND = "Order not found."
    ORDER_ALREADY_CANCELLED = "This order has already been cancelled."
    ORDER_PAID_NOT_CANCELLABLE = "A paid order cannot be cancelled."
    ORDER_ITEMS_REQUIRED = "An order must have at least one item."`}</code></pre>
        <p>The Interface layer's conversion works by comparing <code>str(exc)</code> against these enum values at runtime:</p>
        <pre><code>{`# The Interface layer's mapping
(OrderErrorMessage.ORDER_NOT_FOUND, 404, OrderErrorCode.ORDER_NOT_FOUND)
#  ↑ the enum member (checked by the type checker)      ↑ this value is compared against str(exc) at runtime`}</code></pre>
        <p>If someone bypasses the enum and writes the raw string directly instead, two things break silently. A typo in a hand-written <code>raise Exception('Order not fund.')</code> produces no error at all when the file is linted or type-checked, because it's just a string literal. And separately, the Interface layer's comparison against <code>OrderErrorMessage.ORDER_NOT_FOUND</code> now fails to match, so that error falls through to an unhandled 500 instead of the 404 it was supposed to become. Routing every raise site <em>through</em> the enum member — <code>raise Exception(OrderErrorMessage.ORDER_NOT_FOUND)</code> — means the exact same typo, now a misspelled member name, is instead an error ruff and mypy catch before the code ever ships, instead of surfacing as a wrong status code weeks later.</p>
        <h2>Codes Are a Second, Independent Axis</h2>
        <p>If the HTTP status code is the category, the error code is the precise cause — and it needs to be independent of the message text, because the client is expected to branch on <code>code</code>, not on parsing the message string, which can be translated or edited without warning.</p>
        <pre><code>{`class OrderErrorCode(str, Enum):
    ORDER_NOT_FOUND = "ORDER_NOT_FOUND"
    ORDER_ALREADY_CANCELLED = "ORDER_ALREADY_CANCELLED"
    ORDER_PAID_NOT_CANCELLABLE = "ORDER_PAID_NOT_CANCELLABLE"
    ORDER_ITEMS_REQUIRED = "ORDER_ITEMS_REQUIRED"`}</code></pre>
        <p>Codes are <code>SCREAMING_SNAKE_CASE</code>, unique across the whole project (add a domain prefix if two domains would otherwise collide), and every entry in a domain's error-message enum has exactly one code mapped to it — a 1:1 relationship, not a many-to-one shortcut.</p>
        <h2>Where the Conversion Actually Happens</h2>
        <pre><code>{`async def get_order(
    param: GetOrderRequestParam,
    order_query_service: OrderQueryService = Depends(get_order_query_service),
) -> GetOrderResponseBody:
    try:
        return await order_query_service.get_order(param)
    except Exception as exc:
        raise convert_to_http_error(
            str(exc),
            [
                (OrderErrorMessage.ORDER_NOT_FOUND, 404, OrderErrorCode.ORDER_NOT_FOUND),
                (OrderErrorMessage.ORDER_ALREADY_CANCELLED, 400, OrderErrorCode.ORDER_ALREADY_CANCELLED),
            ],
        ) from exc`}</code></pre>
        <p>An error with no entry in this mapping table becomes a 500 Internal Server Error — which is the correct default, not a gap to patch over. An unmapped error means either a genuinely unexpected failure, or a domain error the router handler forgot to declare — either way, surfacing it as an opaque 500 rather than guessing at a status code is the honest behavior.</p>
        <h2>One Response Shape, Everywhere</h2>
        <pre><code>{`class ErrorResponse(BaseModel):
    statusCode: int
    code: str
    message: str
    error: str


ErrorResponse(statusCode=404, code="ORDER_NOT_FOUND", message="Order not found.", error="Not Found")`}</code></pre>
        <p>Four fields, every time: <code>statusCode</code> is the HTTP status; <code>code</code> is the stable value the client actually branches on; <code>message</code> is for display, sourced from the error-message enum; <code>error</code> is the HTTP status text. A validation failure gets a fixed code regardless of which field failed:</p>
        <pre><code>{`{
  "statusCode": 400,
  "code": "VALIDATION_FAILED",
  "message": ["order_id must be a string"],
  "error": "Bad Request"
}`}</code></pre>
        <h2>The Same Discipline on the Success Side</h2>
        <p>List responses use the plural of the domain object as the key — <code>orders</code>, <code>users</code>, <code>payments</code> — never a generic <code>result</code>, <code>data</code>, or <code>items</code>, alongside a <code>count</code> that reflects the total after filters, not just the current page's size:</p>
        <pre><code>{`{
  "orders": [
    { "order_id": "abc123", "status": "pending", "total_amount": 30000 }
  ],
  "count": 42
}`}</code></pre>
        <p>A single-record response is returned as the domain object directly — never wrapped in a generic envelope like <code>{`{"success": True, "data": {...}}`}</code>. The HTTP status code already tells the client whether the request succeeded; an envelope duplicates that information and adds an unwrapping step to every client's code for no benefit.</p>
        <p>On the Repository side, this same "no generic key" discipline extends one layer further: a single-record lookup isn't a separate method at all. Callers pass <code>take=1</code> to the same list-lookup method and pull the record out of the returned tuple:</p>
        <pre><code>{`orders, _ = await self.order_repository.find_orders(order_id=order_id, take=1, page=0)
order = orders[0] if orders else None

if not order:
    raise Exception(OrderErrorMessage.ORDER_NOT_FOUND)`}</code></pre>
        <p>Keeping a separate <code>find_one</code> would duplicate the dynamic filter-condition logic between two methods; unifying it into one path keeps there being exactly one place to add a new optional filter later.</p>
        <h2>Documenting the Contract This Implies</h2>
        <p>Every non-2xx status a handler can actually return should be declared in the API documentation, cross-checked against that handler's own error-mapping table — not just the success response. This is the single most common way API docs quietly rot: the docs UI renders, the endpoint appears "documented," but nothing tells a client what a 404 or 409 from that specific endpoint actually looks like, because only the happy path was ever written down.</p>
        <div className="article-note"><strong>Further reading in the repo</strong><p>
          <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/docs/architecture/error-handling.md" target="_blank" rel="noreferrer">docs/architecture/error-handling.md</a> — the full error-message/error-code enum pattern · <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/docs/architecture/api-response.md" target="_blank" rel="noreferrer">docs/architecture/api-response.md</a> — pagination, response shape, and the OpenAPI completeness bar
        </p></div>
      </>
    ),
  },
  ko: {
    kicker: 'API Design · Conventions',
    title: (
      <>
        타입이 있는 에러와<br /><em>일관된 응답 스키마</em>
      </>
    ),
    lede: "raise Exception('Order not found.')는 완전히 멀쩡해 보인다 — 다른 어딘가에서 두 번째 사람이 문자열을 살짝 다르게 적기 전까지는. 그러면 그 순간부터 같은 실패가 어느 파일에서 던져졌는지에 따라 서로 다른 두 개의 코드로 나오게 된다.",
    body: (
      <>
        <p>에러 처리는 계층이 명확하게 나뉘어 있다: Domain과 Application 계층은 FastAPI의 <code>HTTPException</code> 같은 프레임워크 전용 HTTP 예외가 아니라 순수한 <code>Exception</code>을 raise하고, Interface 계층 — 라우터 핸들러 — 만이 에러를 붙잡아 HTTP 상태 코드로 변환하는 유일한 지점이다. 이 분리 덕분에 Domain과 Application은 HTTP 의존성을 전혀 갖지 않게 되고, "이걸 상태 코드로 번역한다"는 지저분한 작업 하나가 정확히 한 곳으로 집중된다.</p>
        <pre><code>{`# domain/order.py — inside the Aggregate
if self._status == "cancelled":
    raise Exception(OrderErrorMessage.ORDER_ALREADY_CANCELLED)

# application/command/order_command_service.py
if not order:
    raise Exception(OrderErrorMessage.ORDER_NOT_FOUND)`}</code></pre>
        <h2>메시지가 자유 문자열이 아니라 enum 키인 이유</h2>
        <pre><code>{`class OrderErrorMessage(str, Enum):
    ORDER_NOT_FOUND = "Order not found."
    ORDER_ALREADY_CANCELLED = "This order has already been cancelled."
    ORDER_PAID_NOT_CANCELLABLE = "A paid order cannot be cancelled."
    ORDER_ITEMS_REQUIRED = "An order must have at least one item."`}</code></pre>
        <p>Interface 계층의 변환은 런타임에 <code>str(exc)</code>를 이 enum 값들과 비교하는 방식으로 동작한다:</p>
        <pre><code>{`# The Interface layer's mapping
(OrderErrorMessage.ORDER_NOT_FOUND, 404, OrderErrorCode.ORDER_NOT_FOUND)
#  ↑ the enum member (checked by the type checker)      ↑ this value is compared against str(exc) at runtime`}</code></pre>
        <p>만약 누군가 enum을 거치지 않고 원본 문자열을 직접 적어버린다면, 두 가지가 조용히 깨진다. 손으로 쓴 <code>raise Exception('Order not fund.')</code>의 오타는 단순 문자열 리터럴이기 때문에 린트나 타입 검사 단계에서 아무 에러도 만들어내지 않는다. 그리고 별개로, Interface 계층이 <code>OrderErrorMessage.ORDER_NOT_FOUND</code>와 비교할 때 더 이상 매치되지 않으므로, 그 에러는 원래 되어야 했던 404 대신 처리되지 않은 500으로 흘러가버린다. 모든 raise 지점이 enum 멤버를 <em>거쳐</em> 가도록 강제하면 — <code>raise Exception(OrderErrorMessage.ORDER_NOT_FOUND)</code> — 완전히 같은 오타라도 이제는 멤버 이름 오타가 되므로, 몇 주 뒤에 잘못된 상태 코드로 드러나는 대신 ruff와 mypy가 배포 전에 미리 잡아낸다.</p>
        <h2>코드는 별개의 두 번째 축이다</h2>
        <p>HTTP 상태 코드가 분류(category)라면 에러 코드는 정확한 원인이다 — 그리고 이 코드는 메시지 텍스트와 독립적이어야 한다. 클라이언트는 <code>code</code>를 기준으로 분기해야지, 예고 없이 번역되거나 수정될 수 있는 메시지 문자열을 파싱해서 분기해서는 안 되기 때문이다.</p>
        <pre><code>{`class OrderErrorCode(str, Enum):
    ORDER_NOT_FOUND = "ORDER_NOT_FOUND"
    ORDER_ALREADY_CANCELLED = "ORDER_ALREADY_CANCELLED"
    ORDER_PAID_NOT_CANCELLABLE = "ORDER_PAID_NOT_CANCELLABLE"
    ORDER_ITEMS_REQUIRED = "ORDER_ITEMS_REQUIRED"`}</code></pre>
        <p>코드는 <code>SCREAMING_SNAKE_CASE</code>로 작성하고, 프로젝트 전체에서 유일해야 하며(두 도메인이 충돌할 여지가 있다면 도메인 접두사를 붙인다), 한 도메인의 에러 메시지 enum에 있는 모든 항목은 정확히 하나의 코드에 매핑된다 — 다대일(many-to-one)로 대충 묶는 게 아니라 1:1 관계다.</p>
        <h2>변환이 실제로 일어나는 곳</h2>
        <pre><code>{`async def get_order(
    param: GetOrderRequestParam,
    order_query_service: OrderQueryService = Depends(get_order_query_service),
) -> GetOrderResponseBody:
    try:
        return await order_query_service.get_order(param)
    except Exception as exc:
        raise convert_to_http_error(
            str(exc),
            [
                (OrderErrorMessage.ORDER_NOT_FOUND, 404, OrderErrorCode.ORDER_NOT_FOUND),
                (OrderErrorMessage.ORDER_ALREADY_CANCELLED, 400, OrderErrorCode.ORDER_ALREADY_CANCELLED),
            ],
        ) from exc`}</code></pre>
        <p>이 매핑 테이블에 항목이 없는 에러는 500 Internal Server Error가 된다 — 이건 메꿔야 할 빈틈이 아니라 올바른 기본값이다. 매핑되지 않은 에러는 정말로 예상치 못한 실패이거나, 라우터 핸들러가 선언을 빠뜨린 도메인 에러, 둘 중 하나다 — 어느 쪽이든, 상태 코드를 추측해서 끼워맞추는 대신 불투명한 500으로 그대로 드러내는 쪽이 정직한 태도다.</p>
        <h2>어디서나 하나의 응답 형태</h2>
        <pre><code>{`class ErrorResponse(BaseModel):
    statusCode: int
    code: str
    message: str
    error: str


ErrorResponse(statusCode=404, code="ORDER_NOT_FOUND", message="Order not found.", error="Not Found")`}</code></pre>
        <p>필드는 언제나 네 개다: <code>statusCode</code>는 HTTP 상태, <code>code</code>는 클라이언트가 실제로 분기 기준으로 삼는 안정적인 값, <code>message</code>는 에러 메시지 enum에서 가져온 화면 표시용 텍스트, <code>error</code>는 HTTP 상태 텍스트. 검증 실패는 어떤 필드가 실패했는지와 무관하게 고정된 코드를 받는다:</p>
        <pre><code>{`{
  "statusCode": 400,
  "code": "VALIDATION_FAILED",
  "message": ["order_id must be a string"],
  "error": "Bad Request"
}`}</code></pre>
        <h2>성공 응답에도 같은 원칙이 적용된다</h2>
        <p>목록 응답은 도메인 객체의 복수형을 키로 쓴다 — <code>orders</code>, <code>users</code>, <code>payments</code> — 절대 <code>result</code>, <code>data</code>, <code>items</code> 같은 범용 키를 쓰지 않으며, 현재 페이지의 개수가 아니라 필터 적용 후 전체 개수를 반영하는 <code>count</code>를 함께 넣는다:</p>
        <pre><code>{`{
  "orders": [
    { "order_id": "abc123", "status": "pending", "total_amount": 30000 }
  ],
  "count": 42
}`}</code></pre>
        <p>단일 레코드 응답은 도메인 객체 자체를 그대로 반환한다 — <code>{`{"success": True, "data": {...}}`}</code> 같은 범용 envelope으로 감싸지 않는다. HTTP 상태 코드가 이미 요청 성공 여부를 클라이언트에 알려주고 있으므로, envelope은 같은 정보를 중복시키고 모든 클라이언트 코드에 불필요한 언래핑(unwrapping) 단계를 하나 더 추가할 뿐이다.</p>
        <p>Repository 쪽에서도 이 "범용 키를 쓰지 않는다"는 원칙이 한 계층 더 이어진다: 단일 레코드 조회는 별도 메서드로 만들지 않는다. 호출자는 같은 목록 조회 메서드에 <code>take=1</code>을 넘기고, 반환된 튜플에서 레코드를 꺼낸다:</p>
        <pre><code>{`orders, _ = await self.order_repository.find_orders(order_id=order_id, take=1, page=0)
order = orders[0] if orders else None

if not order:
    raise Exception(OrderErrorMessage.ORDER_NOT_FOUND)`}</code></pre>
        <p>별도의 <code>find_one</code>을 유지하면 두 메서드 사이에 동적 필터 조건 로직이 중복될 뿐이다. 하나의 경로로 통합해두면 나중에 선택적 필터를 추가할 자리가 정확히 한 곳만 남는다.</p>
        <h2>이 구조가 암시하는 계약을 문서화하기</h2>
        <p>성공 응답뿐 아니라, 핸들러가 실제로 반환할 수 있는 모든 non-2xx 상태도 API 문서에 선언되어야 하고, 그 핸들러 자신의 에러 매핑 테이블과 대조 검증되어야 한다. 이것이 API 문서가 조용히 썩어가는 가장 흔한 방식이다: 문서 UI는 렌더링되고 엔드포인트는 "문서화됨"으로 보이지만, 그 특정 엔드포인트에서 나오는 404나 409가 실제로 어떤 모양인지는 아무것도 말해주지 않는다 — 정상 경로(happy path)만 기록되었을 뿐이기 때문이다.</p>
        <div className="article-note"><strong>저장소 내 추가 자료</strong><p>
          <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/docs/architecture/error-handling.md" target="_blank" rel="noreferrer">docs/architecture/error-handling.md</a> — 전체 에러 메시지/에러 코드 enum 패턴 · <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/docs/architecture/api-response.md" target="_blank" rel="noreferrer">docs/architecture/api-response.md</a> — 페이지네이션, 응답 형태, OpenAPI 완성도 기준
        </p></div>
      </>
    ),
  },
};

export default function TypedErrorsAndResponseSchemas() {
  const { locale } = useLocale();
  const c = content[locale];

  return (
    <PostLayout slug="typed-errors-and-response-schemas" kicker={c.kicker} title={c.title} lede={c.lede}>
      {c.body}
    </PostLayout>
  );
}
