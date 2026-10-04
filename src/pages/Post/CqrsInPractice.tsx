import PostLayout from '../../components/PostLayout';
import { useLocale, localeFromPathname } from '../../lib/locale';
import type { MetaFunction } from 'react-router';
import { createPostMeta } from '../../lib/seo';

export const meta: MetaFunction = ({ location }) =>
  createPostMeta('cqrs-in-practice', localeFromPathname(location.pathname));

const content = {
  en: {
    kicker: 'CQRS · Architecture',
    title: (
      <>
        CQRS in Practice:<br /><em>Why a Query Can't Use a Repository</em>
      </>
    ),
    lede: "CQRS sounds like an architecture decision you make once, up front. In practice it's a boundary you have to keep re-enforcing, because the easiest possible way to satisfy a new read requirement is always to reach for the write-side Repository that's already sitting right there.",
    body: (
      <>
        <p>CQRS (Command Query Responsibility Segregation) separates the responsibilities of writing and reading. It keeps the same underlying principles as the base architecture: the Domain layer stays independent, an Aggregate encapsulates business rules, and the Repository pattern holds. What changes is that use cases get split into an independent Command side and Query side, each with its own model.</p>
        <h2>Two Levels of CQRS</h2>
        <p>Splitting an Application Service into a Command Service and a Query Service is already a lightweight form of CQRS, and it's enough for most domains. Handler-based CQRS (splitting each use case into its own Handler struct, each holding its dependencies directly and exposing a single <code>Handle</code> method) is worth adopting once the Service is getting bloated with too many use cases, or once the write and read models need to be separate stores. With few use cases and a Service class that's staying simple, the lighter form is enough; don't reach for Handlers just because the pattern has a name.</p>
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
        <p>A QueryHandler depends on a read-only interface: <code>order.Query</code>, not <code>order.Repository</code>. It queries the DB directly, with no Aggregate reconstitution.</p>
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
        <p>This looks like a naming nuance (<code>order.Query</code> instead of <code>order.Repository</code>), and that's what makes it easy to violate without anyone noticing. <code>Repository</code> embeds <code>Query</code>, so it satisfies the narrower interface too: the same concrete <code>*OrderRepository</code> that's already wired into the Command Handler, already tested, already has a <code>FindOrders</code> method that returns what a list screen needs, will type-check just fine as the field on a Query Handler. Declaring that field as <code>order.Repository</code> instead of <code>order.Query</code> compiles, passes review, and reopens a door CQRS exists to close: the read path now has write capability (<code>SaveOrder</code>) sitting right next to it, and the two models are no longer separate.</p>
        <h2>A Real Case Where This Went Wrong — and the Doc Agreed</h2>
        <p>A cross-implementation audit of this repo's five language ports once turned up this bug, and in a way worth being specific about, because it's more instructive than the abstract warning above. In the FastAPI implementation, a Query Handler was directly injected with the write-capable Repository; there was no separate read interface at all. That alone would be a straightforward fix. What made it a structural problem rather than a one-off slip was that FastAPI's own <code>cqrs-pattern.md</code> had documented this same code as the correct example. The doc and the code agreed with each other and were both wrong.</p>
        <p>That's a failure mode no "does the code match its own docs" audit can ever catch, by construction. The audit only checks agreement, and here the doc and the code were in perfect agreement about the wrong thing. It took checking the code against the <em>root</em> principle, not the local doc, to surface it. Three other languages had softer versions of the same drift: one Query Service had been fixed while a second, structurally identical Query Service in the same codebase was left on the old pattern; two more had already separated Command and Query functionally but named the Query interface <code>XxxQueryRepository</code>, which reintroduces the word this pattern exists to keep out of the read path's vocabulary.</p>
        <div className="article-note"><strong>Why this kept slipping through</strong><p>No harness rule existed yet that specifically flagged a Repository type showing up inside <code>application/query/</code>. Structural checks (is there a domain folder, does the interface layer avoid infrastructure imports) don't catch a wrong dependency choice one layer down. Once a rule was written for this shape, it caught the same violation independently in three more languages the first time it ran.</p></div>
        <h2>The Interface Layer Barely Changes</h2>
        <p>From the HTTP Handler's side, adopting CQRS is mostly a routing change. Call the right Handler's <code>Handle</code> method instead of the right service method:</p>
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
        <p>A Domain Event still doesn't use an in-process event bus for cross-cutting follow-up work. It's delivered through the Outbox → message queue → EventConsumer path, the same as in the base architecture. CQRS changes how a single request is routed to its handler; it doesn't change how a fact that already happened gets communicated afterward.</p>
        <h2>What CQRS Doesn't Change</h2>
        <p>Both the base architecture and Handler-based CQRS keep Domain-layer independence, Aggregate encapsulation, and the Repository pattern exactly the same. CQRS is a routing and read-model decision sitting on top of that foundation, not a replacement for it. That's why a Query Handler reaching for a Repository is so easy to write and so easy to miss: everything underneath it still compiles, still passes the unit tests, and still looks, at a glance, like the same architecture it's no longer following.</p>
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
        CQRS 실전 적용기<br /><em>Query가 Repository를 쓰면 안 되는 이유</em>
      </>
    ),
    lede: 'CQRS는 처음에 한 번 정하면 끝나는 아키텍처 결정처럼 들린다. 막상 해 보면 계속 다시 지켜야 하는 경계에 가깝다. 새 읽기 요구사항이 생기면 가장 손쉬운 방법은 언제나 옆에 이미 있는 Command 쪽 Repository를 가져다 쓰는 것이기 때문이다.',
    body: (
      <>
        <p>CQRS(Command Query Responsibility Segregation)는 쓰기와 읽기의 책임을 나눈다. 원칙은 기본 아키텍처와 같다. Domain 계층은 독립적이고, Aggregate가 비즈니스 규칙을 감싸고, Repository 패턴도 그대로다. 달라지는 건 유스케이스가 Command 쪽과 Query 쪽으로 갈리고, 양쪽이 각자 모델을 갖는다는 점이다.</p>
        <h2>두 단계의 CQRS</h2>
        <p>Application Service를 Command Service와 Query Service로 나누기만 해도 이미 가벼운 CQRS다. 대부분의 도메인은 이걸로 충분하다.</p>
        <p>Handler 기반 CQRS는 한 걸음 더 간다. 유스케이스마다 Handler struct를 따로 두고, 각 Handler가 자기 의존성을 직접 들고 <code>Handle</code> 메서드 하나만 노출한다. Service에 유스케이스가 너무 많이 몰려 비대해졌을 때, 또는 쓰기 모델과 읽기 모델을 정말 다른 저장소에 둬야 할 때 들일 만하다. 유스케이스가 적고 Service 클래스가 단순하게 유지된다면 가벼운 쪽으로 충분하다. 패턴에 이름이 붙어 있다고 굳이 Handler까지 갈 필요는 없다.</p>
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
        <p>QueryHandler는 <code>order.Repository</code> 대신 읽기 전용 인터페이스인 <code>order.Query</code>에 의존한다. DB를 직접 조회하고, Aggregate를 재구성하지 않는다.</p>
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
        <p><code>order.Query</code>냐 <code>order.Repository</code>냐는 이름만 살짝 다른 것처럼 보인다. 그래서 아무도 모르게 어기기 쉽다. <code>Repository</code>는 <code>Query</code>를 임베드하므로 더 좁은 인터페이스도 만족한다. <code>*OrderRepository</code>는 이미 Command Handler에 연결돼 있고 테스트도 끝났다. 목록 화면에 필요한 값을 그대로 돌려주는 <code>FindOrders</code> 메서드도 있다. 이 구현체를 Query Handler의 필드에 넣어도 타입 체크는 문제없이 통과한다.</p>
        <p>필드를 <code>order.Query</code> 대신 <code>order.Repository</code>로 선언해도 컴파일되고 리뷰도 통과한다. 그런데 그 순간 CQRS가 닫아 두려던 문이 아무 경고 없이 다시 열린다. 읽기 경로 옆에 쓰기 기능(<code>SaveOrder</code>)이 놓이고, 두 모델은 더 이상 분리돼 있지 않다.</p>
        <h2>문서까지 틀린 코드를 정답이라고 했던 사례</h2>
        <p>내 저장소의 5개 언어 구현을 서로 대조해 감사하다가 이 버그를 실제로 만난 적이 있다. 위의 일반론보다 배울 게 많아서 구체적으로 적어 둔다. FastAPI 구현에서는 Query Handler에 쓰기 기능이 있는 Repository가 그대로 주입돼 있었다. 읽기 인터페이스는 따로 없었다. 이것만이면 고치고 끝날 일이다. 한 번의 실수로 끝나지 않고 구조의 문제가 된 건 FastAPI의 <code>cqrs-pattern.md</code> 때문이었다. 이 문서가 바로 그 코드를 올바른 예시로 싣고 있었다. 문서와 코드가 서로 맞았고, 둘 다 틀렸다.</p>
        <p>"코드가 자기 문서와 맞는가"를 보는 감사로는 이런 실패를 처음부터 잡을 수 없다. 그런 감사는 일치 여부만 보는데, 여기서는 문서와 코드가 틀린 내용으로 완벽하게 일치했다. 이걸 드러내려면 그 언어의 문서 대신 <em>루트</em> 원칙에 코드를 대 봐야 했다.</p>
        <p>다른 세 언어에도 같은 드리프트가 조금 약하게 있었다. 한 곳은 Query Service 하나만 고치고, 같은 코드베이스에 구조가 똑같은 두 번째 Query Service는 옛 패턴으로 남겨 두었다. 다른 두 곳은 Command와 Query를 기능상으로는 이미 나눴는데, Query 인터페이스 이름을 <code>XxxQueryRepository</code>로 붙였다. 읽기 경로의 어휘에서 빼려던 단어를 이름에 도로 들여온 셈이다.</p>
        <div className="article-note"><strong>왜 계속 놓쳤나</strong><p><code>application/query/</code> 안에 Repository 타입이 나오는 것을 콕 집어 잡는 Harness 규칙이 그때는 없었다. domain 폴더가 있는지, interface 계층이 infrastructure를 import하지 않는지 같은 구조 검사로는 한 계층 아래의 잘못된 의존성 선택을 못 잡는다. 이 모양만 보는 규칙을 새로 쓰고 처음 돌렸더니, 다른 세 언어에서도 같은 위반이 따로따로 나왔다.</p></div>
        <h2>Interface 계층은 거의 바뀌지 않는다</h2>
        <p>HTTP Handler 입장에서 CQRS 도입은 대부분 라우팅만 바꾸는 일이다. Service 메서드를 부르던 자리에서 해당 Handler의 <code>Handle</code> 메서드를 부르면 된다. 코드는 다음과 같다.</p>
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
        <p>Domain Event도 그대로다. 여러 곳에 걸친(cross-cutting) 후속 작업을 프로세스 안 이벤트 버스로 처리하지 않고, 기본 아키텍처와 똑같이 Outbox → 메시지 큐 → EventConsumer 경로로 전달한다. CQRS가 바꾸는 건 요청 하나가 어느 Handler로 가느냐다. 이미 일어난 사실을 나중에 어떻게 알리는지는 바뀌지 않는다.</p>
        <h2>CQRS가 바꾸지 않는 것</h2>
        <p>기본 아키텍처든 Handler 기반 CQRS든 Domain 계층의 독립성, Aggregate의 캡슐화, Repository 패턴은 똑같이 유지된다. CQRS는 그 토대 위에 얹는 라우팅과 읽기 모델의 결정이고, 토대를 갈아엎지 않는다. 그래서 Query Handler가 Repository를 끌어다 쓰는 실수는 저지르기도 쉽고 놓치기도 쉽다. 그 아래는 전부 그대로 컴파일되고 유닛 테스트도 통과한다. 겉보기엔 같은 아키텍처를 따르는 것 같은데, 사실은 이미 벗어나 있다.</p>
        <div className="article-note"><strong>저장소에서 더 볼 것</strong><p>
          <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/docs/architecture/cqrs-pattern.md" target="_blank" rel="noreferrer">docs/architecture/cqrs-pattern.md</a>(Command/Query/Handler 구조 전체) · <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/docs/architecture/repository-pattern.md" target="_blank" rel="noreferrer">docs/architecture/repository-pattern.md</a>(Query 쪽이 일부러 피하는 Repository 패턴)
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
