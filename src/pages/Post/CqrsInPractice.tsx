import PostLayout from '../../components/PostLayout';
import { useLocale } from '../../lib/locale';

const content = {
  en: {
    kicker: 'CQRS · Architecture',
    title: (
      <>
        CQRS in Practice:<br /><em>Why a Query Can't Use a Repository</em>
      </>
    ),
    lede: "CQRS sounds like an architecture decision you make once, up front. In practice it's a boundary you have to keep re-enforcing — because the easiest possible way to satisfy a new read requirement is always to reach for the write-side Repository that's already sitting right there.",
    body: (
      <>
        <p>CQRS — Command Query Responsibility Segregation — separates the responsibilities of writing and reading. It keeps the same underlying principles as the base architecture: the Domain layer stays independent, an Aggregate encapsulates business rules, and the Repository pattern holds. What changes is that use cases get split into an independent Command side and Query side, each with its own model.</p>
        <h2>Two Levels of CQRS</h2>
        <p>Splitting an Application Service into a Command Service and a Query Service is already a lightweight form of CQRS, and it's enough for most domains. Handler-based CQRS — splitting each use case into its own Handler struct, each holding its dependencies directly and exposing a single <code>Handle</code> method — is worth adopting once the Service is getting bloated with too many use cases, or once the write and read models genuinely need to be separate stores. With few use cases and a Service class that's staying simple, the lighter form is enough; don't reach for Handlers just because the pattern has a name.</p>
        <pre><code>{`internal/
  domain/
    order/
      order.go                       # Aggregate — unchanged
      repository.go                  # the Query interface + Repository (adds the write method)
  application/
    command/
      cancel_order_handler.go        # CancelOrderCommand + CancelOrderHandler (the write logic)
    query/
      get_orders_handler.go          # GetOrdersQuery + GetOrdersHandler (the read logic)
  interface/
    http/
      order_handler.go               # holds the Command/Query Handlers, calls Handle(ctx, ...) directly`}</code></pre>
        <h2>The Rule That's Easy to State and Easy to Violate</h2>
        <p>A QueryHandler depends on a read-only interface — <code>order.Query</code>, not <code>order.Repository</code>. It queries the DB directly, with no Aggregate reconstitution.</p>
        <pre><code>{`// internal/domain/order/repository.go — the Query interface
type Query interface {
	FindOrders(ctx context.Context, q FindQuery) ([]*Order, int, error)
}

// Repository adds the write method on top of Query. Because Go interfaces
// use structural typing, one implementation satisfies both — there's no
// need for two separate implementations.
type Repository interface {
	Query
	SaveOrder(ctx context.Context, order *Order) error
}

// internal/infrastructure/persistence/order_repository.go — the implementation
func (r *OrderRepository) FindOrders(ctx context.Context, q order.FindQuery) ([]*order.Order, int, error) {
	// a query optimized for reading, with no Aggregate reconstitution
}`}</code></pre>
        <pre><code>{`// internal/application/query/get_orders_handler.go
type GetOrdersQuery struct {
	Page int
	Take int
}

type GetOrdersHandler struct {
	orders order.Query
}

func NewGetOrdersHandler(orders order.Query) *GetOrdersHandler {
	return &GetOrdersHandler{orders: orders}
}

func (h *GetOrdersHandler) Handle(ctx context.Context, q GetOrdersQuery) (*GetOrdersResult, error) {
	orders, count, err := h.orders.FindOrders(ctx, order.FindQuery{Page: q.Page, Take: q.Take})
	if err != nil {
		return nil, err
	}
	return &GetOrdersResult{Orders: orders, Count: count}, nil
}`}</code></pre>
        <p>This looks like a naming nuance — <code>order.Query</code> instead of <code>order.Repository</code> — and that's exactly what makes it easy to violate without anyone noticing. <code>Repository</code> embeds <code>Query</code>, so it satisfies the narrower interface too: the same concrete <code>*OrderRepository</code> that's already wired into the Command Handler, already tested, already has a <code>FindOrders</code> method that returns exactly what a list screen needs, will type-check just fine as the field on a Query Handler. Declaring that field as <code>order.Repository</code> instead of <code>order.Query</code> compiles, passes review, and quietly reopens a door CQRS exists to close: the read path now has write capability (<code>SaveOrder</code>) sitting right next to it, and the two models are no longer actually separate.</p>
        <h2>A Real Case Where This Went Wrong — and the Doc Agreed</h2>
        <p>A cross-implementation audit of this repo's five language ports once turned up this exact bug for real, and in a way worth being specific about, because it's more instructive than the abstract warning above. In the FastAPI implementation, a Query Handler was directly injected with the write-capable Repository — there was no separate read interface at all. That alone would be a straightforward fix. What made it a structural problem rather than a one-off slip was that FastAPI's own <code>cqrs-pattern.md</code> had documented this exact code as the correct example. The doc and the code agreed with each other and were both wrong.</p>
        <p>That's a failure mode no "does the code match its own docs" audit can ever catch, by construction — the audit only checks agreement, and here the doc and the code were in perfect agreement about the wrong thing. It took checking the code against the <em>root</em> principle, not the local doc, to surface it. Two other languages had softer versions of the same drift: one Query Service had been fixed while a second, structurally identical Query Service in the same codebase was left on the old pattern; two more had already separated Command and Query functionally but named the Query interface <code>XxxQueryRepository</code>, which quietly reintroduces the word this pattern exists to keep out of the read path's vocabulary.</p>
        <div className="article-note"><strong>Why this kept slipping through</strong><p>No harness rule existed yet that specifically flagged a Repository type showing up inside <code>application/query/</code>. Structural checks — is there a domain folder, does the interface layer avoid infrastructure imports — don't catch a wrong dependency choice one layer down. Once a rule was written for exactly this shape, it caught the same violation independently in three more languages the very first time it ran.</p></div>
        <h2>The Interface Layer Barely Changes</h2>
        <p>From the HTTP Handler's side, adopting CQRS is mostly a routing change — call the right Handler's <code>Handle</code> method instead of the right service method:</p>
        <pre><code>{`func (h *OrderHandler) CancelOrder(w http.ResponseWriter, r *http.Request) {
	orderID := r.PathValue("orderId")
	if _, err := h.cancelOrder.Handle(r.Context(), command.CancelOrderCommand{OrderID: orderID}); err != nil {
		writeOrderError(w, r, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h *OrderHandler) GetOrders(w http.ResponseWriter, r *http.Request) {
	page, take := parsePagination(r)
	result, err := h.getOrders.Handle(r.Context(), query.GetOrdersQuery{Page: page, Take: take})
	if err != nil {
		writeOrderError(w, r, err)
		return
	}
	writeJSON(w, r, result)
}`}</code></pre>
        <p>A Domain Event still doesn't use an in-process event bus for cross-cutting follow-up work — it's delivered through the Outbox → message queue → EventConsumer path, the same as in the base architecture. CQRS changes how a single request is routed to its handler; it doesn't change how a fact that already happened gets communicated afterward.</p>
        <h2>What CQRS Doesn't Change</h2>
        <p>Both the base architecture and Handler-based CQRS keep Domain-layer independence, Aggregate encapsulation, and the Repository pattern exactly the same. CQRS is a routing and read-model decision sitting on top of that foundation, not a replacement for it — which is precisely why a Query Handler reaching for a Repository is so easy to write and so easy to miss: everything underneath it still compiles, still passes the unit tests, and still looks, at a glance, like the same architecture it's quietly no longer following.</p>
        <div className="article-note"><strong>Further reading in the repo</strong><p>
          <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/docs/architecture/cqrs-pattern.md" target="_blank" rel="noreferrer">docs/architecture/cqrs-pattern.md</a> — the full Command/Query/Handler structure · <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/docs/architecture/repository-pattern.md" target="_blank" rel="noreferrer">docs/architecture/repository-pattern.md</a> — the Repository pattern the Query side deliberately avoids
        </p></div>
      </>
    ),
  },
  ko: {
    kicker: 'CQRS · Architecture',
    title: (
      <>
        CQRS 실전 적용기:<br /><em>Query가 Repository를 쓰면 안 되는 이유</em>
      </>
    ),
    lede: 'CQRS는 처음에 한 번 내리고 끝나는 아키텍처 결정처럼 들린다. 하지만 실제로는 계속 다시 지켜내야 하는 경계선이다 — 새로운 읽기 요구사항을 충족시키는 가장 쉬운 방법은 언제나 이미 바로 옆에 있는 Command 쪽 Repository를 가져다 쓰는 것이기 때문이다.',
    body: (
      <>
        <p>CQRS — Command Query Responsibility Segregation — 는 쓰기와 읽기의 책임을 분리한다. 기반 아키텍처와 동일한 원칙을 그대로 유지한다: Domain 계층은 독립적으로 남고, Aggregate는 비즈니스 규칙을 캡슐화하며, Repository 패턴도 그대로다. 달라지는 것은 유스케이스가 독립된 Command 쪽과 Query 쪽으로 나뉘고, 각각 자기만의 모델을 갖게 된다는 점이다.</p>
        <h2>두 단계의 CQRS</h2>
        <p>Application Service를 Command Service와 Query Service로 나누는 것만으로도 이미 가벼운 형태의 CQRS이며, 대부분의 도메인에는 이걸로 충분하다. Handler 기반 CQRS — 각 유스케이스를 독립된 Handler struct로 분리하고, 각 Handler가 자신의 의존성을 직접 들고 있으면서 <code>Handle</code> 메서드 하나만 노출하는 방식 — 은 Service가 너무 많은 유스케이스로 비대해지거나, 쓰기 모델과 읽기 모델이 정말로 별도의 저장소여야 할 때 도입할 가치가 있다. 유스케이스가 적고 Service 클래스가 계속 단순하게 유지된다면 가벼운 형태로 충분하다 — 패턴에 이름이 붙어 있다는 이유만으로 Handler를 끌어다 쓰지 말 것.</p>
        <pre><code>{`internal/
  domain/
    order/
      order.go                       # Aggregate — unchanged
      repository.go                  # the Query interface + Repository (adds the write method)
  application/
    command/
      cancel_order_handler.go        # CancelOrderCommand + CancelOrderHandler (the write logic)
    query/
      get_orders_handler.go          # GetOrdersQuery + GetOrdersHandler (the read logic)
  interface/
    http/
      order_handler.go               # holds the Command/Query Handlers, calls Handle(ctx, ...) directly`}</code></pre>
        <h2>말하기는 쉽지만 어기기도 쉬운 규칙</h2>
        <p>QueryHandler는 읽기 전용 인터페이스에 의존한다 — <code>order.Repository</code>가 아니라 <code>order.Query</code>다. DB를 직접 조회하며, Aggregate 재구성은 일어나지 않는다.</p>
        <pre><code>{`// internal/domain/order/repository.go — the Query interface
type Query interface {
	FindOrders(ctx context.Context, q FindQuery) ([]*Order, int, error)
}

// Repository adds the write method on top of Query. Because Go interfaces
// use structural typing, one implementation satisfies both — there's no
// need for two separate implementations.
type Repository interface {
	Query
	SaveOrder(ctx context.Context, order *Order) error
}

// internal/infrastructure/persistence/order_repository.go — the implementation
func (r *OrderRepository) FindOrders(ctx context.Context, q order.FindQuery) ([]*order.Order, int, error) {
	// a query optimized for reading, with no Aggregate reconstitution
}`}</code></pre>
        <pre><code>{`// internal/application/query/get_orders_handler.go
type GetOrdersQuery struct {
	Page int
	Take int
}

type GetOrdersHandler struct {
	orders order.Query
}

func NewGetOrdersHandler(orders order.Query) *GetOrdersHandler {
	return &GetOrdersHandler{orders: orders}
}

func (h *GetOrdersHandler) Handle(ctx context.Context, q GetOrdersQuery) (*GetOrdersResult, error) {
	orders, count, err := h.orders.FindOrders(ctx, order.FindQuery{Page: q.Page, Take: q.Take})
	if err != nil {
		return nil, err
	}
	return &GetOrdersResult{Orders: orders, Count: count}, nil
}`}</code></pre>
        <p>이건 그저 네이밍의 뉘앙스 차이처럼 보인다 — <code>order.Query</code> 대신 <code>order.Repository</code> — 그리고 바로 그 점이 아무도 눈치채지 못한 채 규칙을 어기기 쉽게 만든다. <code>Repository</code>는 <code>Query</code>를 임베드하고 있어서, 더 좁은 인터페이스도 함께 만족시킨다: 이미 Command Handler에 연결되어 있고, 이미 테스트도 되어 있으며, 목록 화면이 필요로 하는 것을 정확히 반환하는 <code>FindOrders</code> 메서드도 이미 갖고 있는 바로 그 <code>*OrderRepository</code>가, Query Handler의 필드 타입으로도 아무 문제 없이 타입 체크를 통과한다. 그 필드를 <code>order.Query</code> 대신 <code>order.Repository</code>로 선언해도 컴파일이 되고 리뷰도 통과하지만, CQRS가 존재하는 이유인 바로 그 문을 조용히 다시 열어버린다: 이제 읽기 경로 바로 옆에 쓰기 능력(<code>SaveOrder</code>)이 놓이게 되고, 두 모델은 더 이상 실질적으로 분리되어 있지 않다.</p>
        <h2>실제로 이게 잘못됐던 사례 — 그리고 문서마저 동의하고 있었다</h2>
        <p>이 저장소의 다섯 개 언어 포트를 대상으로 한 크로스 구현 감사에서 실제로 이 정확한 버그를 발견한 적이 있는데, 위의 추상적인 경고보다 훨씬 시사하는 바가 크기 때문에 구체적으로 짚어볼 만하다. FastAPI 구현에서는 Query Handler에 쓰기 능력을 가진 Repository가 직접 주입되어 있었다 — 별도의 읽기 인터페이스 자체가 아예 없었다. 그것만이라면 간단히 고치면 될 문제였다. 이걸 일회성 실수가 아니라 구조적 문제로 만든 것은, FastAPI 자체의 <code>cqrs-pattern.md</code> 문서가 바로 이 코드를 올바른 예시로 문서화해 두고 있었다는 사실이었다. 문서와 코드가 서로 동의하고 있었고, 둘 다 틀려 있었다.</p>
        <p>이건 "코드가 자신의 문서와 일치하는가"를 검사하는 감사로는 원리상 절대 잡아낼 수 없는 실패 유형이다 — 그런 감사는 오직 일치 여부만 확인하는데, 여기서는 문서와 코드가 틀린 내용에 대해 완벽하게 일치하고 있었기 때문이다. 이걸 드러내려면 지역 문서가 아니라 <em>루트</em> 원칙에 대조해 코드를 검사해야 했다. 다른 두 언어는 같은 드리프트의 더 약한 버전을 갖고 있었다: 한 곳은 Query Service 하나는 고쳐졌지만 같은 코드베이스 안에서 구조적으로 동일한 두 번째 Query Service는 옛 패턴 그대로 남아 있었고, 다른 두 곳은 Command와 Query를 기능적으로는 이미 분리해 두었지만 Query 인터페이스 이름을 <code>XxxQueryRepository</code>라고 붙여, 이 패턴이 읽기 경로의 어휘에서 없애려던 바로 그 단어를 조용히 다시 끌어들이고 있었다.</p>
        <div className="article-note"><strong>이게 계속 빠져나갔던 이유</strong><p><code>application/query/</code> 안에 Repository 타입이 등장하는 것을 특정해서 잡아내는 Harness 규칙이 아직 없었다. 구조적 검사 — domain 폴더가 있는가, interface 계층이 infrastructure import를 피하는가 — 는 한 계층 아래에서 벌어지는 잘못된 의존성 선택을 잡아내지 못한다. 정확히 이 형태를 위한 규칙을 작성하자, 처음 돌린 그 순간 세 개 언어에서 독립적으로 동일한 위반 사례를 잡아냈다.</p></div>
        <h2>Interface 계층은 거의 바뀌지 않는다</h2>
        <p>HTTP Handler 쪽에서 보면 CQRS를 도입하는 건 대부분 라우팅 변경에 불과하다 — 올바른 Service 메서드 대신 올바른 Handler의 <code>Handle</code> 메서드를 호출할 뿐이다:</p>
        <pre><code>{`func (h *OrderHandler) CancelOrder(w http.ResponseWriter, r *http.Request) {
	orderID := r.PathValue("orderId")
	if _, err := h.cancelOrder.Handle(r.Context(), command.CancelOrderCommand{OrderID: orderID}); err != nil {
		writeOrderError(w, r, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h *OrderHandler) GetOrders(w http.ResponseWriter, r *http.Request) {
	page, take := parsePagination(r)
	result, err := h.getOrders.Handle(r.Context(), query.GetOrdersQuery{Page: page, Take: take})
	if err != nil {
		writeOrderError(w, r, err)
		return
	}
	writeJSON(w, r, result)
}`}</code></pre>
        <p>Domain Event는 여전히 크로스커팅 후속 작업을 위해 프로세스 내부 이벤트 버스를 쓰지 않는다 — 기반 아키텍처와 마찬가지로 Outbox → 메시지 큐 → EventConsumer 경로를 통해 전달된다. CQRS는 하나의 요청이 어떤 Handler로 라우팅되는지를 바꿀 뿐, 이미 일어난 사실이 이후에 어떻게 전파되는지는 바꾸지 않는다.</p>
        <h2>CQRS가 바꾸지 않는 것</h2>
        <p>기반 아키텍처와 Handler 기반 CQRS 모두 Domain 계층의 독립성, Aggregate의 캡슐화, Repository 패턴을 그대로 유지한다. CQRS는 그 토대 위에 얹히는 라우팅 및 읽기 모델에 관한 결정일 뿐, 그 토대를 대체하는 것이 아니다 — 그리고 바로 이 점이 Query Handler가 Repository를 가져다 쓰는 실수를 그렇게 쓰기 쉽고 그렇게 놓치기 쉽게 만드는 이유다: 그 아래의 모든 것은 여전히 컴파일되고, 여전히 유닛 테스트를 통과하며, 언뜻 보기에는 여전히 자신이 조용히 더 이상 따르지 않고 있는 바로 그 아키텍처처럼 보인다.</p>
        <div className="article-note"><strong>저장소 내 추가 자료</strong><p>
          <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/docs/architecture/cqrs-pattern.md" target="_blank" rel="noreferrer">docs/architecture/cqrs-pattern.md</a> — 전체 Command/Query/Handler 구조 · <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/docs/architecture/repository-pattern.md" target="_blank" rel="noreferrer">docs/architecture/repository-pattern.md</a> — Query 쪽이 의도적으로 피하는 Repository 패턴
        </p></div>
      </>
    ),
  },
};

export default function CqrsInPractice() {
  const { locale } = useLocale();
  const c = content[locale];

  return (
    <PostLayout slug="cqrs-in-practice" kicker={c.kicker} title={c.title} lede={c.lede}>
      {c.body}
    </PostLayout>
  );
}
