import PostLayout from '../../components/PostLayout';
import { useLocale, localeFromPathname } from '../../lib/locale';
import type { MetaFunction } from 'react-router';
import { createPostMeta } from '../../lib/seo';

export const meta: MetaFunction = ({ location }) =>
  createPostMeta('typed-errors-and-response-schemas', localeFromPathname(location.pathname));

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
        <p>Error handling has a clean layer split: the Domain and Application layers raise a plain <code>Exception</code>, never a framework-specific HTTP exception like FastAPI's <code>HTTPException</code>, and the Interface layer (the router handler) is the only place that catches an error and converts it into an HTTP status code. That separation keeps Domain and Application free of any HTTP dependency at all, and concentrates the one messy job, "translate this into a status code," in one place.</p>
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
        <p>If someone bypasses the enum and writes the raw string directly instead, two things break without any warning. A typo in a hand-written <code>raise Exception('Order not fund.')</code> produces no error at all when the file is linted or type-checked, because it's just a string literal. And separately, the Interface layer's comparison against <code>OrderErrorMessage.ORDER_NOT_FOUND</code> now fails to match, so that error falls through to an unhandled 500 instead of the 404 it was supposed to become. Routing every raise site <em>through</em> the enum member (<code>raise Exception(OrderErrorMessage.ORDER_NOT_FOUND)</code>) means the same typo, now a misspelled member name, is instead an error ruff and mypy catch before the code ever ships, instead of surfacing as a wrong status code weeks later.</p>
        <h2>Codes Are a Second, Independent Axis</h2>
        <p>If the HTTP status code is the category, the error code is the precise cause, and it needs to be independent of the message text, because the client is expected to branch on <code>code</code>, not on parsing the message string, which can be translated or edited without warning.</p>
        <pre><code>{`class OrderErrorCode(str, Enum):
    ORDER_NOT_FOUND = "ORDER_NOT_FOUND"
    ORDER_ALREADY_CANCELLED = "ORDER_ALREADY_CANCELLED"
    ORDER_PAID_NOT_CANCELLABLE = "ORDER_PAID_NOT_CANCELLABLE"
    ORDER_ITEMS_REQUIRED = "ORDER_ITEMS_REQUIRED"`}</code></pre>
        <p>Codes are <code>SCREAMING_SNAKE_CASE</code>, unique across the whole project (add a domain prefix if two domains would otherwise collide), and every entry in a domain's error-message enum has exactly one code mapped to it, a 1:1 relationship rather than a many-to-one shortcut.</p>
        <h2>Where the Conversion Happens</h2>
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
        <p>An error with no entry in this mapping table becomes a 500 Internal Server Error, which is the correct default. An unmapped error means either an unexpected failure or a domain error the router handler forgot to declare. Either way, surfacing it as an opaque 500 rather than guessing at a status code is the honest behavior.</p>
        <h2>One Response Shape, Everywhere</h2>
        <pre><code>{`class ErrorResponse(BaseModel):
    statusCode: int
    code: str
    message: str
    error: str


ErrorResponse(statusCode=404, code="ORDER_NOT_FOUND", message="Order not found.", error="Not Found")`}</code></pre>
        <p>Four fields, every time: <code>statusCode</code> is the HTTP status; <code>code</code> is the stable value the client branches on; <code>message</code> is for display, sourced from the error-message enum; <code>error</code> is the HTTP status text. A validation failure gets a fixed code regardless of which field failed:</p>
        <pre><code>{`{
  "statusCode": 400,
  "code": "VALIDATION_FAILED",
  "message": ["order_id must be a string"],
  "error": "Bad Request"
}`}</code></pre>
        <h2>The Same Discipline on the Success Side</h2>
        <p>List responses use the plural of the domain object as the key (<code>orders</code>, <code>users</code>, <code>payments</code>), never a generic <code>result</code>, <code>data</code>, or <code>items</code>, alongside a <code>count</code> that reflects the total after filters, not just the current page's size:</p>
        <pre><code>{`{
  "orders": [
    { "order_id": "abc123", "status": "pending", "total_amount": 30000 }
  ],
  "count": 42
}`}</code></pre>
        <p>A single-record response is returned as the domain object directly, never wrapped in a generic envelope like <code>{`{"success": True, "data": {...}}`}</code>. The HTTP status code already tells the client whether the request succeeded; an envelope duplicates that information and adds an unwrapping step to every client's code for no benefit.</p>
        <p>On the Repository side, this same "no generic key" discipline extends one layer further: a single-record lookup isn't a separate method at all. Callers pass <code>take=1</code> to the same list-lookup method and pull the record out of the returned tuple:</p>
        <pre><code>{`orders, _ = await self.order_repository.find_orders(order_id=order_id, take=1, page=0)
order = orders[0] if orders else None

if not order:
    raise Exception(OrderErrorMessage.ORDER_NOT_FOUND)`}</code></pre>
        <p>Keeping a separate <code>find_one</code> would duplicate the dynamic filter-condition logic between two methods; unifying it into one path keeps there being one place to add a new optional filter later.</p>
        <h2>Documenting the Contract This Implies</h2>
        <p>Every non-2xx status a handler can return should be declared in the API documentation, cross-checked against that handler's own error-mapping table, along with the success response. This is the most common way API docs rot: the docs UI renders, the endpoint appears "documented," but nothing tells a client what a 404 or 409 from that specific endpoint looks like, because only the happy path was ever written down.</p>
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
    lede: "raise Exception('Order not found.')는 처음엔 아무 문제 없어 보인다. 그러다 다른 사람이 다른 파일에서 같은 문자열을 살짝 다르게 적으면, 그때부터 같은 실패가 어느 파일에서 던졌느냐에 따라 서로 다른 코드 2개로 나온다.",
    body: (
      <>
        <p>에러 처리는 계층별로 역할을 나눈다. Domain과 Application 계층은 그냥 <code>Exception</code>을 던진다. FastAPI의 <code>HTTPException</code> 같은 프레임워크 전용 HTTP 예외는 쓰지 않는다. 에러를 잡아서 HTTP 상태 코드로 바꾸는 건 Interface 계층, 즉 라우터 핸들러에서만 한다. 이렇게 나눠 두면 Domain과 Application에는 HTTP 의존성이 하나도 없고, 상태 코드로 옮기는 귀찮은 일은 한 곳에 모인다.</p>
        <pre><code>{`# domain/order.py — inside the Aggregate
if self._status == "cancelled":
    raise Exception(OrderErrorMessage.ORDER_ALREADY_CANCELLED)

# application/command/order_command_service.py
if not order:
    raise Exception(OrderErrorMessage.ORDER_NOT_FOUND)`}</code></pre>
        <h2>메시지를 문자열 대신 enum으로 두는 이유</h2>
        <pre><code>{`class OrderErrorMessage(str, Enum):
    ORDER_NOT_FOUND = "Order not found."
    ORDER_ALREADY_CANCELLED = "This order has already been cancelled."
    ORDER_PAID_NOT_CANCELLABLE = "A paid order cannot be cancelled."
    ORDER_ITEMS_REQUIRED = "An order must have at least one item."`}</code></pre>
        <p>Interface 계층은 런타임에 <code>str(exc)</code>를 이 enum 값과 비교해서 변환한다.</p>
        <pre><code>{`# The Interface layer's mapping
(OrderErrorMessage.ORDER_NOT_FOUND, 404, OrderErrorCode.ORDER_NOT_FOUND)
#  ↑ the enum member (checked by the type checker)      ↑ this value is compared against str(exc) at runtime`}</code></pre>
        <p>누가 enum을 건너뛰고 문자열을 직접 적으면 두 군데가 아무 경고 없이 깨진다. 먼저 <code>raise Exception('Order not fund.')</code>처럼 오타를 내도 그냥 문자열 리터럴이라 린트도 타입 검사도 그냥 넘어간다. 그리고 Interface 계층이 <code>OrderErrorMessage.ORDER_NOT_FOUND</code>와 비교할 때 값이 맞지 않으니, 404가 돼야 할 에러가 처리되지 않은 500으로 빠진다.</p>
        <p>던지는 곳마다 <code>raise Exception(OrderErrorMessage.ORDER_NOT_FOUND)</code>처럼 enum 멤버를 <em>거치게</em> 하면 같은 오타가 멤버 이름 오타가 된다. 그러면 몇 주 뒤 엉뚱한 상태 코드로 드러나기 전에, 배포하기 전에 ruff와 mypy가 잡는다.</p>
        <h2>에러 코드는 따로 둔다</h2>
        <p>HTTP 상태 코드가 큰 분류라면 에러 코드는 구체적인 원인이다. 에러 코드는 메시지 문구와 따로 움직여야 한다. 메시지는 예고 없이 번역되거나 고쳐질 수 있으니, 클라이언트는 메시지를 파싱하지 말고 <code>code</code>를 보고 분기해야 한다.</p>
        <pre><code>{`class OrderErrorCode(str, Enum):
    ORDER_NOT_FOUND = "ORDER_NOT_FOUND"
    ORDER_ALREADY_CANCELLED = "ORDER_ALREADY_CANCELLED"
    ORDER_PAID_NOT_CANCELLABLE = "ORDER_PAID_NOT_CANCELLABLE"
    ORDER_ITEMS_REQUIRED = "ORDER_ITEMS_REQUIRED"`}</code></pre>
        <p>코드는 <code>SCREAMING_SNAKE_CASE</code>로 쓰고, 프로젝트 전체에서 겹치지 않아야 한다. 두 도메인 이름이 겹칠 것 같으면 도메인 접두사를 붙인다. 에러 메시지 enum의 항목 하나에는 코드도 하나만 대응한다. 여러 메시지를 코드 하나로 뭉뚱그리지 않고 1:1로 맞춘다.</p>
        <h2>변환은 라우터에서 한다</h2>
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
        <p>매핑 테이블에 없는 에러는 500 Internal Server Error가 된다. 메워야 할 빈틈처럼 보이지만 이게 맞는 기본값이다. 매핑에 없다는 건 예상하지 못한 실패이거나, 라우터 핸들러가 선언을 빠뜨린 도메인 에러라는 뜻이다. 어느 쪽이든 상태 코드를 짐작해서 끼워 맞추는 것보다 500으로 그대로 드러내는 편이 정직하다.</p>
        <h2>응답 모양은 하나로</h2>
        <pre><code>{`class ErrorResponse(BaseModel):
    statusCode: int
    code: str
    message: str
    error: str


ErrorResponse(statusCode=404, code="ORDER_NOT_FOUND", message="Order not found.", error="Not Found")`}</code></pre>
        <p>필드는 늘 4개다. <code>statusCode</code>는 HTTP 상태이고, <code>code</code>는 클라이언트가 분기에 쓰는 바뀌지 않는 값이다. <code>message</code>는 화면에 보여 줄 문구로 에러 메시지 enum에서 가져오고, <code>error</code>는 HTTP 상태 텍스트다. 검증 실패는 어느 필드가 틀렸든 같은 코드를 받는다.</p>
        <pre><code>{`{
  "statusCode": 400,
  "code": "VALIDATION_FAILED",
  "message": ["order_id must be a string"],
  "error": "Bad Request"
}`}</code></pre>
        <h2>성공 응답도 마찬가지다</h2>
        <p>목록 응답은 <code>orders</code>, <code>users</code>, <code>payments</code>처럼 도메인 객체의 복수형을 키로 쓴다. <code>result</code>, <code>data</code>, <code>items</code> 같은 범용 키는 쓰지 않는다. 옆에는 <code>count</code>를 함께 넣는데, 현재 페이지에 담긴 개수 말고 필터를 적용한 뒤의 전체 개수다.</p>
        <pre><code>{`{
  "orders": [
    { "order_id": "abc123", "status": "pending", "total_amount": 30000 }
  ],
  "count": 42
}`}</code></pre>
        <p>레코드 하나를 돌려줄 때는 도메인 객체를 그대로 반환한다. <code>{`{"success": True, "data": {...}}`}</code> 같은 envelope으로 감싸지 않는다. 성공했는지는 HTTP 상태 코드가 이미 알려 준다. envelope은 같은 정보를 한 번 더 싣고, 클라이언트마다 껍질을 벗기는 코드만 늘린다.</p>
        <p>Repository에서도 같은 생각을 한 단계 더 밀고 간다. 단건 조회용 메서드를 따로 만들지 않는다. 호출하는 쪽에서 목록 조회 메서드에 <code>take=1</code>을 넘기고, 돌아온 튜플에서 레코드를 꺼낸다.</p>
        <pre><code>{`orders, _ = await self.order_repository.find_orders(order_id=order_id, take=1, page=0)
order = orders[0] if orders else None

if not order:
    raise Exception(OrderErrorMessage.ORDER_NOT_FOUND)`}</code></pre>
        <p><code>find_one</code>을 따로 두면 동적 필터 조건을 만드는 로직이 두 메서드에 똑같이 들어간다. 하나로 합쳐 두면 나중에 선택 필터를 추가할 곳도 한 군데뿐이다.</p>
        <h2>에러 응답도 문서에 적는다</h2>
        <p>API 문서에는 성공 응답만이 아니라 핸들러가 돌려줄 수 있는 non-2xx 상태도 모두 적어야 하고, 그 목록을 핸들러의 에러 매핑 테이블과 맞춰 봐야 한다. API 문서가 낡는 가장 흔한 경로가 여기다. 문서 UI는 잘 뜨고 엔드포인트도 문서화된 것처럼 보인다. 그런데 그 엔드포인트의 404나 409가 어떻게 생겼는지는 어디에도 없다. 처음부터 happy path만 적었기 때문이다.</p>
        <div className="article-note"><strong>저장소에서 더 볼 것</strong><p>
          <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/docs/architecture/error-handling.md" target="_blank" rel="noreferrer">docs/architecture/error-handling.md</a>(에러 메시지·에러 코드 enum 패턴 전체) · <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/docs/architecture/api-response.md" target="_blank" rel="noreferrer">docs/architecture/api-response.md</a>(페이지네이션, 응답 모양, OpenAPI 문서를 어디까지 채울지)
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
