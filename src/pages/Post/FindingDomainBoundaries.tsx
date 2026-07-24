import PostLayout from '../../components/PostLayout';
import { useLocale } from '../../lib/locale';

const content = {
  en: {
    kicker: 'DDD · Architecture',
    title: (
      <>
        Finding<br /><em>Domain Boundaries</em>
      </>
    ),
    lede: "Dividing a domain well isn't about classifying nouns — it's about finding the boundary between change and responsibility. Before anything else, observe which things need to change together as features grow.",
    body: (
      <>
        <p>It's natural for a service to start with a single model. But once features that change for different reasons — like orders, payments, and shipping — start mixing into that one model, even a small change can ripple further than expected. What's needed at that point isn't more abstraction, but a fresh look at the boundaries.</p>
        <p>The boundary here isn't just a criterion for splitting tables or microservices. It determines which rules must hold together at once, which changes a single team is responsible for, and at what point asynchronous collaboration becomes acceptable. A poorly drawn boundary forces every request to lock multiple models; a well-drawn one keeps changes contained even as features grow.</p>
        <h2>Before You Start: A Domain Is Not the Same as a Boundary</h2>
        <p>The phrase “order domain” is too broad. To a customer it means a completed purchase; to a seller it's the start of intake and settlement; to a logistics team it's a work item to ship. Even sharing the same order number, each party cares about different states and rules. The point where a model's language and rules diverge like this is a candidate for a Bounded Context.</p>
        <p>Conversely, there's no need to physically split a service from the start. You can draw a clear boundary even within a single module, and that's often better for fast feedback. What matters is that neither side reads or modifies the other's internal state directly — they should communicate only through clear command, query, and event contracts.</p>
        <h2>1. Find What Changes Together</h2>
        <p>Boundaries reveal themselves through reasons for change more than through data types. If a change in discount policy also requires modifying the order's state transitions, the two may still belong in the same model. Conversely, if a shipping carrier's policy change has nothing to do with order-creation rules, shipping is likely an independent responsibility.</p>
        <blockquote>Ask repeatedly: “Is this changed at the same time, for the same reason, by the same person?”</blockquote>
        <p>This question is especially useful when sorting requirements that come out of a meeting. “Only one coupon may apply per order” and “the order total must equal the sum of its line items” both need to be validated together at order-creation time. On the other hand, a rule like “validate the address before shipment” is more likely to change during logistics processing than order creation. The former belongs closer to the order model, the latter to the shipping model.</p>
        <p>Looking at change history also helps. If a particular file or table always changes together and gets reviewed by the same person, it may still be a single responsibility. Conversely, if different release schedules and owners have emerged, that's a signal to consider splitting. That said, drawing boundaries from team structure alone risks making the model a slave to the org chart, so this judgment must always be paired with business rules.</p>
        <h2>2. Decide Who Owns Each Invariant</h2>
        <p>An Aggregate isn't a box that collects all the data. It's a unit that protects a rule which must hold within a single transaction. For instance, the order Aggregate can be responsible for keeping line-item counts and the total consistent, but trying to also guarantee inventory deduction inside the order can make the boundary too large.</p>
        <div className="article-note"><strong>A Practical Rule of Thumb</strong><p>Keep only the rules that need strong consistency inside the Aggregate. Connect the rest through domain events and downstream processing, so each model can focus on its own rules.</p></div>
        <p>At the moment a cart is confirmed into an order, the quantity, unit price, coupon, and total must not contradict each other. This rule can be validated immediately within a single order Aggregate. But rules like “the order is confirmed only once payment succeeds” and “inventory must be reserved” involve an external payment method and an inventory system. Bundling all of this into one transaction increases failure propagation and lock time.</p>
        <p>So instead of changing payment status directly, the order Aggregate publishes a fact like <code>OrderPlaced</code>. Payment and inventory each receive that fact and carry out their own rules. Making failure a visible possibility in the model, and handling compensation or retries as a separate flow, is a more realistic consistency model.</p>
        <h3>Example: The Rules an Order Should Guarantee</h3>
        <p>The code below is an example containing only the minimal rules the order itself must protect. Inventory quantity or payment-approval results are never changed here. Only the fact that the order was created is left as an event, for the next model to handle.</p>
        <pre><code>{`public record OrderLine(String productId, int quantity, long unitPrice) {
}

public record OrderPlaced(String orderId) {
}

public class Order {
    private final List<Object> events = new ArrayList<>();
    private final String id;
    private final String customerId;
    private final List<OrderLine> lines;

    private Order(String id, String customerId, List<OrderLine> lines) {
        this.id = id;
        this.customerId = customerId;
        this.lines = lines;
    }

    public static Order place(String id, String customerId, List<OrderLine> lines) {
        if (lines.isEmpty()) {
            throw new IllegalArgumentException("At least one order line is required.");
        }
        if (lines.stream().anyMatch(line -> line.quantity() <= 0)) {
            throw new IllegalArgumentException("Quantity must be at least 1.");
        }
        Order order = new Order(id, customerId, lines);
        order.events.add(new OrderPlaced(id));
        return order;
    }

    public long totalAmount() {
        return lines.stream()
                .mapToLong(line -> (long) line.quantity() * line.unitPrice())
                .sum();
    }
}`}</code></pre>
        <p>The key point of this code is that <code>Order</code> only knows its own invariants. Injecting an <code>InventoryRepository</code> or a payment SDK might look convenient, but then the order model would have to know about every external policy and failure. The moment that happens, the boundary blurs and testing becomes harder.</p>
        <h2>3. Note Where the Language Changes</h2>
        <p>When the same word starts meaning different things to different teams, that can be a signal of a Bounded Context. To customer support, an “order” might be the subject of a refund or inquiry; to logistics, it's a unit of packing and shipment. Trying to express both meanings with a single model just piles up fields and blurs the rules.</p>
        <p>Writing down the verbs people use during event storming or requirements workshops makes this difference clearer. In the order context, “create,” “cancel,” and “discount” matter; in the shipping context, “dispatch,” “ship,” and “track” take center stage. Rather than sharing a single <code>Order</code> class, letting each context express only the information it needs, in its own language, keeps the model simpler.</p>
        <p>The cost of translation between boundaries is not something to avoid — it's a mechanism that preserves intent. If the shipping service receives a <code>ShippingRequested</code> event instead of joining the orders table, it's less affected when the order's internal structure changes. An event should carry only the stable information the other model needs, and should avoid serializing internal objects as-is.</p>
        <h3>Example: Connecting Boundaries with Events</h3>
        <pre><code>{`public record OrderPlaced(
        String orderId,
        String customerId,
        List<OrderItem> items) {
}

public record OrderItem(String productId, int quantity) {
}

public record StockReservationFailed(String orderId, String reason) {
}

// The inventory context consumes the order event.
public class ReserveStockHandler {
    private final InventoryClient inventory;
    private final EventPublisher eventBus;

    public ReserveStockHandler(InventoryClient inventory, EventPublisher eventBus) {
        this.inventory = inventory;
        this.eventBus = eventBus;
    }

    public void handle(OrderPlaced event) {
        ReservationResult result = inventory.reserve(event.items());

        if (!result.success()) {
            eventBus.publish(new StockReservationFailed(event.orderId(), result.reason()));
        }
    }
}`}</code></pre>
        <p>In this flow, the order doesn't wait for stock to be reserved. Instead, it receives a “stock reservation failed” state and carries out follow-up policies such as cancelling the order, notifying the customer, or retrying. This requires handling a few more states than a model that assumes immediate success, but it preserves each system's availability and responsibility. The consumer must always be implemented idempotently, so the outcome doesn't change even if the same event arrives twice.</p>
        <h2>4. Read Models Can Cross Boundaries</h2>
        <p>Strictly separating command-model boundaries doesn't mean the screen has to be assembled the same way. A “My Orders” screen needs to show order status, payment status, and shipment tracking all at once. To satisfy that kind of query requirement, it's better to build a screen-specific read model from events than to bundle multiple Aggregates into a single transaction.</p>
        <p>At this point, you need to specify the delay the user can tolerate. Whether it's fine for shipping status to be empty for a few seconds right after payment, or whether an operator's screen must reflect changes immediately, determines the choice between synchronous queries and asynchronous projections. Designing boundaries isn't a technical problem — it's a decision made jointly about the product's consistency expectations.</p>
        <h2>5. Boundaries Start as a Hypothesis</h2>
        <p>You don't need to find the perfect boundary from the start. It's enough to form a small hypothesis based on current change patterns, team responsibilities, and data-consistency requirements, and then validate it. What matters is putting a clear API or event contract between boundaries, to lower the cost of splitting or merging them later.</p>
        <p>At first, splitting into modules within a single application is enough. Between modules, use only public interfaces, and never reference another module's Repository or entity directly. Later, when release cadence, performance needs, or team ownership diverge, that module can be pulled out into an independent service. Physical separation is the last decision, not the first step in creating a boundary.</p>
        <h2>Questions for Checking a Boundary</h2>
        <ul>
          <li>Must this rule hold within a single transaction?</li>
          <li>Do these two features change for the same reason and on the same cadence?</li>
          <li>Does the same word carry different meanings across teams or screens?</li>
          <li>Can this feature only be implemented by directly knowing another model's internal data?</li>
          <li>On failure, is a synchronous rollback required, or can a compensating flow resolve it?</li>
        </ul>
        <p>A good boundary isn't about looking beautiful in a diagram — it localizes change and makes conversations between teams clearer. The starting point is the habit of asking “what changes together, and why” before splitting a model.</p>
      </>
    ),
  },
  ko: {
    kicker: 'DDD · Architecture',
    title: (
      <>
        도메인 경계를<br /><em>찾는 법</em>
      </>
    ),
    lede: '도메인을 잘 나눈다는 건 명사를 분류하는 일이 아니라, 변경과 책임 사이의 경계를 찾는 일이다. 무엇보다 먼저, 기능이 늘어날 때 어떤 것들이 함께 바뀌어야 하는지를 관찰하는 데서 시작한다.',
    body: (
      <>
        <p>서비스가 하나의 모델로 시작하는 건 자연스러운 일이다. 하지만 주문, 결제, 배송처럼 서로 다른 이유로 변경되는 기능들이 그 하나의 모델 안에 뒤섞이기 시작하면, 작은 변경 하나가 예상보다 훨씬 멀리까지 번지게 된다. 그 시점에 필요한 건 더 많은 추상화가 아니라 경계를 다시 들여다보는 일이다.</p>
        <p>여기서 말하는 경계는 테이블이나 마이크로서비스를 나누는 기준에 그치지 않는다. 어떤 규칙들이 한 번에 함께 지켜져야 하는지, 어떤 변경을 한 팀이 책임지는지, 어느 지점부터 비동기 협업이 허용되는지를 결정한다. 잘못 그어진 경계는 모든 요청이 여러 모델을 동시에 잠그게 만들고, 잘 그어진 경계는 기능이 늘어나도 변경을 한 곳에 묶어 둔다.</p>
        <h2>시작하기 전에: 도메인과 경계는 같지 않다</h2>
        <p>“주문 도메인”이라는 말은 너무 뭉뚱그려져 있다. 고객에게는 구매가 완료된 상태를, 판매자에게는 입고와 정산이 시작되는 시점을, 물류팀에게는 배송해야 할 작업 항목을 의미한다. 같은 주문 번호를 공유하더라도 각자가 신경 쓰는 상태와 규칙은 다르다. 이렇게 모델의 언어와 규칙이 갈라지는 지점이 바로 Bounded Context의 후보가 된다.</p>
        <p>반대로, 처음부터 서비스를 물리적으로 분리할 필요는 없다. 하나의 모듈 안에서도 명확한 경계를 그을 수 있고, 오히려 그쪽이 빠른 피드백을 얻기에 유리한 경우가 많다. 중요한 건 어느 한쪽도 다른 쪽의 내부 상태를 직접 읽거나 수정하지 않는 것이다 — 둘은 오직 명확한 command, query, event 계약을 통해서만 소통해야 한다.</p>
        <h2>1. 함께 변하는 것을 찾는다</h2>
        <p>경계는 데이터 타입보다 변경 이유를 통해 스스로를 드러낸다. 할인 정책이 바뀔 때 주문의 상태 전이도 함께 수정해야 한다면, 그 둘은 여전히 같은 모델에 속할 가능성이 크다. 반대로 배송사의 정책 변경이 주문 생성 규칙과 아무 관련이 없다면, 배송은 독립된 책임일 가능성이 높다.</p>
        <blockquote>반복해서 물어라: “이건 같은 시점에, 같은 이유로, 같은 사람에 의해 바뀌는가?”</blockquote>
        <p>이 질문은 회의에서 나온 요구사항을 정리할 때 특히 유용하다. “주문당 쿠폰은 하나만 적용될 수 있다”와 “주문 총액은 라인 아이템의 합과 같아야 한다”는 둘 다 주문 생성 시점에 함께 검증되어야 한다. 반면 “배송 전에 주소를 검증한다”는 규칙은 주문 생성보다는 물류 처리 과정에서 바뀔 가능성이 더 크다. 전자는 주문 모델에 더 가깝고, 후자는 배송 모델에 더 가깝다.</p>
        <p>변경 이력을 살펴보는 것도 도움이 된다. 특정 파일이나 테이블이 늘 함께 바뀌고 같은 사람이 리뷰한다면, 여전히 하나의 책임일 수 있다. 반대로 릴리스 일정과 오너십이 서로 다르게 갈라져 왔다면, 분리를 고려할 신호다. 다만 팀 구조만으로 경계를 그으면 모델이 조직도의 종속물이 될 위험이 있으므로, 이 판단은 항상 비즈니스 규칙과 함께 이뤄져야 한다.</p>
        <h2>2. 각 불변식(invariant)의 소유자를 정한다</h2>
        <p>Aggregate는 모든 데이터를 모아 담는 상자가 아니다. 하나의 트랜잭션 안에서 반드시 지켜져야 하는 규칙을 보호하는 단위다. 예를 들어 주문 Aggregate는 라인 아이템 개수와 총액의 일관성을 책임질 수 있지만, 재고 차감까지 주문 안에서 보장하려 하면 경계가 지나치게 커진다.</p>
        <div className="article-note"><strong>실전에서 쓸 수 있는 경험칙</strong><p>강한 일관성이 필요한 규칙만 Aggregate 안에 남겨라. 나머지는 Domain Event와 후속 처리를 통해 연결해서, 각 모델이 자기 규칙에만 집중할 수 있게 하라.</p></div>
        <p>장바구니가 주문으로 확정되는 순간, 수량·단가·쿠폰·총액은 서로 모순되지 않아야 한다. 이 규칙은 하나의 주문 Aggregate 안에서 즉시 검증할 수 있다. 하지만 “결제가 성공해야만 주문이 확정된다”나 “재고가 예약되어야 한다” 같은 규칙은 외부 결제 수단과 재고 시스템을 필요로 한다. 이 모두를 하나의 트랜잭션에 묶으면 장애 전파 범위와 락 시간이 늘어난다.</p>
        <p>그래서 주문 Aggregate는 결제 상태를 직접 바꾸는 대신 <code>OrderPlaced</code> 같은 사실(fact)을 발행한다. 결제와 재고는 각자 그 사실을 받아서 자신의 규칙을 수행한다. 실패를 모델 안에서 눈에 보이는 가능성으로 만들고, 보상(compensation)이나 재시도를 별도 흐름으로 처리하는 편이 더 현실적인 일관성 모델이다.</p>
        <h3>예시: 주문이 보장해야 할 규칙</h3>
        <p>아래 코드는 주문 스스로가 지켜야 할 최소한의 규칙만을 담은 예시다. 재고 수량이나 결제 승인 결과는 여기서 절대 변경되지 않는다. 주문이 생성됐다는 사실만 이벤트로 남겨, 다음 모델이 처리하도록 넘긴다.</p>
        <pre><code>{`public record OrderLine(String productId, int quantity, long unitPrice) {
}

public record OrderPlaced(String orderId) {
}

public class Order {
    private final List<Object> events = new ArrayList<>();
    private final String id;
    private final String customerId;
    private final List<OrderLine> lines;

    private Order(String id, String customerId, List<OrderLine> lines) {
        this.id = id;
        this.customerId = customerId;
        this.lines = lines;
    }

    public static Order place(String id, String customerId, List<OrderLine> lines) {
        if (lines.isEmpty()) {
            throw new IllegalArgumentException("At least one order line is required.");
        }
        if (lines.stream().anyMatch(line -> line.quantity() <= 0)) {
            throw new IllegalArgumentException("Quantity must be at least 1.");
        }
        Order order = new Order(id, customerId, lines);
        order.events.add(new OrderPlaced(id));
        return order;
    }

    public long totalAmount() {
        return lines.stream()
                .mapToLong(line -> (long) line.quantity() * line.unitPrice())
                .sum();
    }
}`}</code></pre>
        <p>이 코드의 핵심은 <code>Order</code>가 오직 자기 자신의 불변식만 안다는 점이다. <code>InventoryRepository</code>나 결제 SDK를 주입하면 편리해 보일 수 있지만, 그 순간 주문 모델은 모든 외부 정책과 실패 상황을 알아야만 하게 된다. 그렇게 되는 순간 경계는 흐려지고 테스트는 더 어려워진다.</p>
        <h2>3. 언어가 바뀌는 지점을 주목한다</h2>
        <p>같은 단어가 팀마다 다른 의미를 갖기 시작하면, 그것은 Bounded Context의 신호일 수 있다. 고객지원팀에게 “주문”은 환불이나 문의의 대상일 수 있지만, 물류팀에게는 포장과 배송의 단위다. 두 의미를 하나의 모델로 표현하려 하면 필드만 쌓이고 규칙은 흐려진다.</p>
        <p>이벤트 스토밍이나 요구사항 워크숍에서 사람들이 쓰는 동사를 적어보면 이 차이가 더 뚜렷해진다. 주문 컨텍스트에서는 “생성”, “취소”, “할인”이 중요하고, 배송 컨텍스트에서는 “출고”, “발송”, “추적”이 중심이 된다. 하나의 <code>Order</code> 클래스를 공유하기보다, 각 컨텍스트가 자신에게 필요한 정보만을 자기 언어로 표현하게 하는 편이 모델을 더 단순하게 유지한다.</p>
        <p>경계 사이의 변환(translation) 비용은 피해야 할 대상이 아니라 의도를 보존하는 장치다. 배송 서비스가 주문 테이블을 직접 join하는 대신 <code>ShippingRequested</code> 이벤트를 받는다면, 주문의 내부 구조가 바뀌어도 영향을 덜 받는다. 이벤트는 상대 모델이 필요로 하는 안정적인 정보만을 담아야 하며, 내부 객체를 그대로 직렬화하는 일은 피해야 한다.</p>
        <h3>예시: 이벤트로 경계 연결하기</h3>
        <pre><code>{`public record OrderPlaced(
        String orderId,
        String customerId,
        List<OrderItem> items) {
}

public record OrderItem(String productId, int quantity) {
}

public record StockReservationFailed(String orderId, String reason) {
}

// The inventory context consumes the order event.
public class ReserveStockHandler {
    private final InventoryClient inventory;
    private final EventPublisher eventBus;

    public ReserveStockHandler(InventoryClient inventory, EventPublisher eventBus) {
        this.inventory = inventory;
        this.eventBus = eventBus;
    }

    public void handle(OrderPlaced event) {
        ReservationResult result = inventory.reserve(event.items());

        if (!result.success()) {
            eventBus.publish(new StockReservationFailed(event.orderId(), result.reason()));
        }
    }
}`}</code></pre>
        <p>이 흐름에서 주문은 재고 예약을 기다리지 않는다. 대신 “재고 예약 실패”라는 상태를 전달받아, 주문 취소·고객 알림·재시도 같은 후속 정책을 수행한다. 즉시 성공을 가정하는 모델보다 다뤄야 할 상태가 조금 더 늘어나지만, 그 대신 각 시스템의 가용성과 책임을 지킬 수 있다. Consumer는 반드시 멱등(idempotent)하게 구현되어야 하며, 그래야 같은 이벤트가 두 번 도착해도 결과가 달라지지 않는다.</p>
        <h2>4. Read Model은 경계를 가로지를 수 있다</h2>
        <p>Command 모델의 경계를 엄격히 나눈다고 해서 화면까지 그렇게 조립해야 한다는 뜻은 아니다. “내 주문” 화면은 주문 상태, 결제 상태, 배송 추적 정보를 한 번에 보여줘야 한다. 이런 조회 요구를 만족시키려면 여러 Aggregate를 하나의 트랜잭션에 묶기보다, 이벤트로부터 화면 전용 Read Model을 구축하는 편이 낫다.</p>
        <p>이때는 사용자가 감내할 수 있는 지연을 명확히 정해야 한다. 결제 직후 몇 초간 배송 상태가 비어 있어도 괜찮은지, 아니면 운영자 화면은 즉시 변경 사항을 반영해야 하는지가 동기 조회와 비동기 프로젝션 사이의 선택을 결정짓는다. 경계를 설계하는 일은 기술적인 문제가 아니라, 제품의 일관성 기대치를 함께 정하는 의사결정이다.</p>
        <h2>5. 경계는 가설로 시작한다</h2>
        <p>처음부터 완벽한 경계를 찾을 필요는 없다. 현재의 변경 패턴, 팀의 책임, 데이터 일관성 요구사항을 바탕으로 작은 가설을 세우고 검증하는 것으로 충분하다. 중요한 건 경계 사이에 명확한 API나 이벤트 계약을 두어, 나중에 분리하거나 합치는 비용을 낮춰 두는 것이다.</p>
        <p>처음에는 하나의 애플리케이션 안에서 모듈로 나누는 것만으로 충분하다. 모듈 사이에는 공개 인터페이스만 사용하고, 다른 모듈의 Repository나 엔티티를 절대 직접 참조하지 않는다. 이후 릴리스 주기, 성능 요구, 팀 오너십이 갈라지기 시작하면 그 모듈을 독립된 서비스로 떼어낼 수 있다. 물리적 분리는 경계를 만드는 첫걸음이 아니라 마지막 결정이다.</p>
        <h2>경계를 점검하기 위한 질문들</h2>
        <ul>
          <li>이 규칙은 하나의 트랜잭션 안에서 반드시 지켜져야 하는가?</li>
          <li>이 두 기능은 같은 이유로, 같은 주기로 변경되는가?</li>
          <li>같은 단어가 팀이나 화면에 따라 다른 의미를 갖는가?</li>
          <li>이 기능은 다른 모델의 내부 데이터를 직접 알아야만 구현할 수 있는가?</li>
          <li>실패했을 때 동기적 롤백이 필요한가, 아니면 보상 흐름으로 해결할 수 있는가?</li>
        </ul>
        <p>좋은 경계는 다이어그램에서 아름다워 보이는 것이 목적이 아니다 — 변경을 국소화하고 팀 간 대화를 더 명확하게 만든다. 그 출발점은 모델을 나누기 전에 “무엇이 함께 바뀌는가, 그리고 왜인가”를 묻는 습관이다.</p>
      </>
    ),
  },
};

export default function FindingDomainBoundaries() {
  const { locale } = useLocale();
  const c = content[locale];

  return (
    <PostLayout slug="finding-domain-boundaries" kicker={c.kicker} title={c.title} lede={c.lede}>
      {c.body}
    </PostLayout>
  );
}
