import PostLayout from '../../components/PostLayout';
import { useLocale } from '../../lib/locale';

const content = {
  en: {
    kicker: 'DDD · Tactical Design',
    title: (
      <>
        Designing Aggregates:<br /><em>Transaction Boundaries and Invariants</em>
      </>
    ),
    lede: "An Aggregate isn't a folder for related data — it's the boundary of a transaction and the owner of an invariant. Get the boundary wrong, and every save becomes a negotiation between models that shouldn't know about each other.",
    body: (
      <>
        <p>Once you've settled a Bounded Context's boundary, the next question is what happens inside it. This is where tactical design lives: Aggregate, Entity, Value Object, Domain Event. Of these, the Aggregate Root decision matters most, because it's the one thing that quietly determines your transaction size, your lock contention, and how many other objects a single save has to know about.</p>
        <h2>The Aggregate Root's Job</h2>
        <p>An Aggregate Root encapsulates business rules and invariants. Nothing outside it changes its internal state directly — a change always goes through one of its own domain methods, and a violated invariant throws immediately, inside that method, not somewhere downstream.</p>
        <pre><code>{`// domain/OrderException.kt
sealed class OrderException(message: String) : RuntimeException(message)
class OrderMustHaveItemsException : OrderException("An order must have at least one item.")
class OrderAlreadyCancelledException : OrderException("This order has already been cancelled.")
class PaidOrderCannotBeCancelledException : OrderException("A paid order cannot be cancelled.")

// domain/Order.kt — private constructor() + companion object factory, no framework import.
enum class OrderStatus { PENDING, PAID, CANCELLED }

class Order private constructor() {
    var orderId: String = ""
        private set

    var userId: String = ""
        private set

    var items: List<OrderItem> = emptyList()
        private set

    var status: OrderStatus = OrderStatus.PENDING
        private set

    private val domainEvents: MutableList<Any> = mutableListOf()

    companion object {
        fun create(orderId: String, userId: String, items: List<OrderItem>, status: OrderStatus): Order {
            if (items.isEmpty()) throw OrderMustHaveItemsException()
            return Order().apply {
                this.orderId = orderId
                this.userId = userId
                this.items = items
                this.status = status
            }
        }
    }

    fun pullDomainEvents(): List<Any> = domainEvents.toList().also { domainEvents.clear() }

    fun cancel(reason: String) {
        if (status == OrderStatus.CANCELLED) throw OrderAlreadyCancelledException()
        if (status == OrderStatus.PAID) throw PaidOrderCannotBeCancelledException()
        status = OrderStatus.CANCELLED
        domainEvents += OrderCancelledEvent(orderId, reason, LocalDateTime.now())
    }
}`}</code></pre>
        <p>An Application Service never carries out business logic itself — it delegates to an Aggregate method and nothing more. If you find yourself writing an <code>if</code> statement about the domain inside a Command Service, that logic almost certainly belongs one layer down.</p>
        <h2>Reference Other Aggregates by ID, Never by Object</h2>
        <p>The transaction boundary is set at the Aggregate Root level — only one Aggregate changes per transaction. That's only possible if Aggregates don't hold direct object references to each other. <code>Order</code> holds a <code>userId: String</code>, never a <code>User</code> object. An object reference creates coupling that an ID reference avoids: loading one Aggregate never cascades into loading a graph of others just to satisfy a type.</p>
        <h2>Entities and Value Objects Live at the Same Layer, With Different Contracts</h2>
        <p>An Entity's equality is judged by a unique identifier — two objects with the same ID are the same object even if every other field differs, and it has a lifecycle: created, modified, deleted. A child Entity inside an Aggregate, like an <code>OrderItem</code>, is only ever accessed and modified through the Aggregate Root that owns it.</p>
        <p>A Value Object has no identifier at all — its equality is judged by the combination of its values, and it's immutable.</p>
        <pre><code>{`// domain/MoneyException.kt
sealed class MoneyException(message: String) : RuntimeException(message)
class InvalidMoneyAmountException : MoneyException("The amount must be 0 or greater.")
class CurrencyMismatchException : MoneyException("The currencies are different.")

// domain/Money.kt — a data class gets equals()/hashCode()/copy() for free, no manual equals() needed.
enum class Currency { KRW, USD }

data class Money(val amount: Long, val currency: Currency) {

    init {
        if (amount < 0) throw InvalidMoneyAmountException()
    }

    fun add(other: Money): Money {
        if (currency != other.currency) throw CurrencyMismatchException()
        return Money(amount + other.amount, currency)
    }
}`}</code></pre>
        <p>Reach for a Value Object whenever an object's attributes alone convey its meaning and it doesn't need an identifier — an amount, an address, a coordinate pair — and whenever immutability needs to be guaranteed.</p>
        <h2>Deciding Where the Boundary Goes</h2>
        <p>Group objects into the same Aggregate when they're created and deleted together, and when they must always change together to keep an invariant intact — <code>Order</code> and <code>OrderItem</code>, because an order with no items isn't a valid order. Split them into separate Aggregates when they're looked up and modified independently, and a change on one side doesn't touch the other's invariants — <code>Order</code> and <code>User</code>, because cancelling an order doesn't affect the user's info at all.</p>
        <div className="article-note"><strong>Signs an Aggregate has grown too large</strong><p>A single save method changes dozens of rows. It directly contains another Aggregate as an object, not just an ID. Optimistic-lock conflicts start happening often. Any of these is a signal to look for a seam, not to add more indexes.</p></div>
        <p>When the boundary genuinely isn't clear, start small. Merging two Aggregates later, once you've watched how they actually change in production, is a far cheaper move than trying to split an overgrown one apart under load.</p>
        <h2>Generating the Aggregate's Own ID</h2>
        <p>The ID is generated in the Domain layer — inside the Aggregate's own <code>create()</code> factory — and the server always generates it, never a client-supplied value. The format is a UUID v4 with hyphens stripped, a 32-character hex string, not an auto-increment number: an incrementing ID exposes record count and creation order externally, can collide across services or shards, and isn't determined until the DB assigns it, so it can never be pre-generated where the Domain layer needs it.</p>
        <pre><code>{`// common/GenerateId.kt
import java.util.UUID

fun generateId(): String = UUID.randomUUID().toString().replace("-", "")

// domain/Order.kt
class Order private constructor() {
    var orderId: String = ""
        private set

    var userId: String = ""
        private set

    companion object {
        // Called for a brand-new Order — the ID is generated here.
        fun create(userId: String): Order =
            Order().apply {
                this.orderId = generateId()
                this.userId = userId
            }

        // Called by the Repository implementation when restoring from the DB — the existing ID is passed straight through.
        fun reconstitute(orderId: String, userId: String): Order =
            Order().apply {
                this.orderId = orderId
                this.userId = userId
            }
    }
}`}</code></pre>
        <p>On new creation, <code>create()</code> generates the ID itself; on restoring from the DB, the Repository implementation calls <code>reconstitute()</code> with the existing ID passed straight through. Either way, the Repository never issues a fresh ID of its own — it uses whatever ID the Aggregate already carries.</p>
        <h2>A Checklist for the Boundary</h2>
        <ul>
          <li>Does a save through this Aggregate ever touch more than one table's worth of real invariant?</li>
          <li>Is a business rule split across two Aggregates that never load together?</li>
          <li>Does this Aggregate hold another Aggregate by object reference instead of by ID?</li>
          <li>Have optimistic-lock conflicts on this Aggregate become a recurring complaint?</li>
          <li>Would merging two Aggregates make more invariants provably true in one transaction?</li>
        </ul>
        <p>None of this is about finding the one correct diagram. It's about keeping the unit that guards a rule exactly as large as the rule requires — no bigger, so it doesn't drag unrelated data into every lock, and no smaller, so the rule it's supposed to protect doesn't leak out into whichever Service happened to call it first.</p>
        <div className="article-note"><strong>Further reading in the repo</strong><p>
          <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/docs/architecture/tactical-ddd.md" target="_blank" rel="noreferrer">docs/architecture/tactical-ddd.md</a> — Aggregate/Entity/Value Object design and boundary criteria in full · <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/docs/architecture/aggregate-id.md" target="_blank" rel="noreferrer">docs/architecture/aggregate-id.md</a> — the ID-generation rules and Repository handling
        </p></div>
      </>
    ),
  },
  ko: {
    kicker: 'DDD · Tactical Design',
    title: (
      <>
        Aggregate 설계하기:<br /><em>트랜잭션 경계와 불변식</em>
      </>
    ),
    lede: 'Aggregate는 관련 데이터를 모아둔 폴더가 아니다 — 그것은 트랜잭션의 경계이자 불변식(invariant)의 소유자다. 경계를 잘못 그으면, 서로를 몰라도 될 모델들이 저장할 때마다 협상을 벌이게 된다.',
    body: (
      <>
        <p>Bounded Context의 경계를 정했다면, 다음 질문은 그 안에서 무슨 일이 벌어지는가다. 여기가 바로 전술적 설계(tactical design)의 영역이다: Aggregate, Entity, Value Object, Domain Event. 이 중에서도 Aggregate Root를 어떻게 정할지가 가장 중요한데, 트랜잭션 크기, 락 경합, 그리고 저장 한 번에 알아야 하는 다른 객체가 몇 개인지를 조용히 결정짓는 요소이기 때문이다.</p>
        <h2>Aggregate Root의 역할</h2>
        <p>Aggregate Root는 비즈니스 규칙과 불변식을 캡슐화한다. 외부의 그 무엇도 그 내부 상태를 직접 바꾸지 못한다 — 변경은 항상 자신의 도메인 메서드를 거쳐야 하고, 불변식이 깨지면 그 메서드 안에서, 그 즉시 예외가 발생해야 한다. 나중에 어딘가 다른 곳에서가 아니라.</p>
        <pre><code>{`// domain/OrderException.kt
sealed class OrderException(message: String) : RuntimeException(message)
class OrderMustHaveItemsException : OrderException("An order must have at least one item.")
class OrderAlreadyCancelledException : OrderException("This order has already been cancelled.")
class PaidOrderCannotBeCancelledException : OrderException("A paid order cannot be cancelled.")

// domain/Order.kt — private constructor() + companion object factory, no framework import.
enum class OrderStatus { PENDING, PAID, CANCELLED }

class Order private constructor() {
    var orderId: String = ""
        private set

    var userId: String = ""
        private set

    var items: List<OrderItem> = emptyList()
        private set

    var status: OrderStatus = OrderStatus.PENDING
        private set

    private val domainEvents: MutableList<Any> = mutableListOf()

    companion object {
        fun create(orderId: String, userId: String, items: List<OrderItem>, status: OrderStatus): Order {
            if (items.isEmpty()) throw OrderMustHaveItemsException()
            return Order().apply {
                this.orderId = orderId
                this.userId = userId
                this.items = items
                this.status = status
            }
        }
    }

    fun pullDomainEvents(): List<Any> = domainEvents.toList().also { domainEvents.clear() }

    fun cancel(reason: String) {
        if (status == OrderStatus.CANCELLED) throw OrderAlreadyCancelledException()
        if (status == OrderStatus.PAID) throw PaidOrderCannotBeCancelledException()
        status = OrderStatus.CANCELLED
        domainEvents += OrderCancelledEvent(orderId, reason, LocalDateTime.now())
    }
}`}</code></pre>
        <p>Application Service는 비즈니스 로직을 스스로 수행하지 않는다 — Aggregate의 메서드에 위임할 뿐, 그 이상은 아니다. Command Service 안에서 도메인에 관한 <code>if</code> 문을 쓰고 있는 자신을 발견했다면, 그 로직은 거의 확실히 한 계층 아래로 내려가야 한다.</p>
        <h2>다른 Aggregate는 객체가 아니라 반드시 ID로 참조하라</h2>
        <p>트랜잭션 경계는 Aggregate Root 단위로 설정된다 — 트랜잭션 하나당 오직 하나의 Aggregate만 변경된다. 이는 Aggregate들이 서로를 직접 객체 참조로 붙들고 있지 않을 때만 가능하다. <code>Order</code>는 <code>userId: String</code>을 가질 뿐, <code>User</code> 객체를 갖지 않는다. 객체 참조는 ID 참조로는 생기지 않을 결합을 만든다: Aggregate 하나를 로드할 때 단지 타입을 맞추기 위해 다른 객체들의 그래프까지 줄줄이 로드되는 일이 없어야 한다.</p>
        <h2>Entity와 Value Object는 같은 계층에 살지만, 계약이 다르다</h2>
        <p>Entity의 동일성은 고유 식별자로 판단한다 — ID가 같으면 다른 모든 필드가 다르더라도 같은 객체이며, 생성·수정·삭제라는 생명주기를 갖는다. <code>OrderItem</code>처럼 Aggregate 내부의 자식 Entity는 그것을 소유한 Aggregate Root를 통해서만 접근하고 수정할 수 있다.</p>
        <p>Value Object는 식별자를 아예 갖지 않는다 — 동일성은 값들의 조합으로 판단하며, 불변(immutable)이다.</p>
        <pre><code>{`// domain/MoneyException.kt
sealed class MoneyException(message: String) : RuntimeException(message)
class InvalidMoneyAmountException : MoneyException("The amount must be 0 or greater.")
class CurrencyMismatchException : MoneyException("The currencies are different.")

// domain/Money.kt — a data class gets equals()/hashCode()/copy() for free, no manual equals() needed.
enum class Currency { KRW, USD }

data class Money(val amount: Long, val currency: Currency) {

    init {
        if (amount < 0) throw InvalidMoneyAmountException()
    }

    fun add(other: Money): Money {
        if (currency != other.currency) throw CurrencyMismatchException()
        return Money(amount + other.amount, currency)
    }
}`}</code></pre>
        <p>객체의 속성만으로 그 의미가 온전히 전달되고 식별자가 필요 없을 때 — 금액, 주소, 좌표 쌍처럼 — 그리고 불변성이 보장돼야 할 때는 Value Object를 선택하라.</p>
        <h2>경계를 어디에 그을지 정하기</h2>
        <p>함께 생성되고 함께 삭제되는 객체들, 그리고 불변식을 유지하기 위해 반드시 함께 변경돼야 하는 객체들은 같은 Aggregate로 묶는다 — <code>Order</code>와 <code>OrderItem</code>이 그렇다. 아이템이 하나도 없는 주문은 유효한 주문이 아니기 때문이다. 독립적으로 조회되고 수정되며, 한쪽의 변경이 다른 쪽의 불변식에 전혀 영향을 주지 않는다면 별도의 Aggregate로 분리한다 — <code>Order</code>와 <code>User</code>가 그렇다. 주문을 취소해도 사용자 정보에는 아무 영향이 없기 때문이다.</p>
        <div className="article-note"><strong>Aggregate가 너무 커졌다는 신호</strong><p>저장 메서드 하나가 수십 개의 행(row)을 변경한다. 다른 Aggregate를 ID가 아니라 객체로 직접 품고 있다. 낙관적 락(optimistic-lock) 충돌이 자주 발생하기 시작한다. 이 중 하나라도 해당한다면 인덱스를 더 추가할 게 아니라 이음매(seam)를 찾아야 한다는 신호다.</p></div>
        <p>경계가 정말로 애매하다면 작게 시작하라. 두 Aggregate가 프로덕션에서 실제로 어떻게 변화하는지 지켜본 뒤에 나중에 합치는 편이, 과하게 커진 것을 부하가 걸린 상태에서 쪼개려 애쓰는 것보다 훨씬 저렴하다.</p>
        <h2>Aggregate 스스로 자신의 ID를 생성하기</h2>
        <p>ID는 Domain 계층에서 — Aggregate 자신의 <code>create()</code> 팩토리 안에서 — 생성되며, 항상 서버가 생성할 뿐 클라이언트가 넘겨준 값을 쓰지 않는다. 형식은 하이픈을 제거한 UUID v4, 즉 32자리 16진수 문자열이며 auto-increment 번호가 아니다: 증가하는 ID는 레코드 개수와 생성 순서를 외부에 노출하고, 서비스나 샤드 사이에서 충돌할 수 있으며, DB가 부여하기 전까지는 값이 정해지지 않으므로 Domain 계층이 필요로 하는 시점에 미리 생성해 둘 수가 없다.</p>
        <pre><code>{`// common/GenerateId.kt
import java.util.UUID

fun generateId(): String = UUID.randomUUID().toString().replace("-", "")

// domain/Order.kt
class Order private constructor() {
    var orderId: String = ""
        private set

    var userId: String = ""
        private set

    companion object {
        // Called for a brand-new Order — the ID is generated here.
        fun create(userId: String): Order =
            Order().apply {
                this.orderId = generateId()
                this.userId = userId
            }

        // Called by the Repository implementation when restoring from the DB — the existing ID is passed straight through.
        fun reconstitute(orderId: String, userId: String): Order =
            Order().apply {
                this.orderId = orderId
                this.userId = userId
            }
    }
}`}</code></pre>
        <p>새로 생성할 때는 <code>create()</code>가 스스로 ID를 생성한다. DB에서 복원할 때는 Repository 구현체가 <code>reconstitute()</code>를 호출하며 기존 ID를 그대로 전달한다. 어느 경우든 Repository가 새 ID를 스스로 발급하는 일은 없다 — Aggregate가 이미 갖고 있는 ID를 그대로 사용할 뿐이다.</p>
        <h2>경계를 점검하는 체크리스트</h2>
        <ul>
          <li>이 Aggregate를 통한 저장 한 번이 실제 불변식과 무관한 여러 테이블까지 건드리고 있지 않은가?</li>
          <li>비즈니스 규칙 하나가, 함께 로드되는 일이 없는 두 Aggregate에 걸쳐 나뉘어 있지 않은가?</li>
          <li>이 Aggregate가 다른 Aggregate를 ID가 아니라 객체 참조로 갖고 있지 않은가?</li>
          <li>이 Aggregate에서 낙관적 락 충돌이 반복적으로 불평거리가 되고 있지 않은가?</li>
          <li>두 Aggregate를 합치면 더 많은 불변식을 하나의 트랜잭션 안에서 증명 가능하게 만들 수 있지 않은가?</li>
        </ul>
        <p>이 모든 것은 유일하게 올바른 다이어그램 하나를 찾는 일이 아니다. 규칙을 지키는 단위를 그 규칙이 요구하는 만큼만 정확히 유지하는 일이다 — 관련 없는 데이터를 매번 락에 끌어들이지 않도록 너무 크지 않게, 그리고 그 규칙이 지켜야 할 대상이 처음 호출한 아무 Service로나 새어나가지 않도록 너무 작지도 않게.</p>
        <div className="article-note"><strong>저장소 내 추가 자료</strong><p>
          <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/docs/architecture/tactical-ddd.md" target="_blank" rel="noreferrer">docs/architecture/tactical-ddd.md</a> — Aggregate/Entity/Value Object 설계와 경계 기준 전체 · <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/docs/architecture/aggregate-id.md" target="_blank" rel="noreferrer">docs/architecture/aggregate-id.md</a> — ID 생성 규칙과 Repository 처리
        </p></div>
      </>
    ),
  },
};

export default function AggregateDesign() {
  const { locale } = useLocale();
  const c = content[locale];

  return (
    <PostLayout slug="aggregate-design" kicker={c.kicker} title={c.title} lede={c.lede}>
      {c.body}
    </PostLayout>
  );
}
