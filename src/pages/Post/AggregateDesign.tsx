import PostLayout from '../../components/PostLayout';
import { useLocale, localeFromPathname } from '../../lib/locale';
import type { MetaFunction } from 'react-router';
import { createPostMeta } from '../../lib/seo';

export const meta: MetaFunction = ({ location }) =>
  createPostMeta('aggregate-design', localeFromPathname(location.pathname));

const content = {
  en: {
    kicker: 'DDD · Tactical Design',
    title: (
      <>
        Designing Aggregates:<br /><em>Transaction Boundaries and Invariants</em>
      </>
    ),
    lede: "An Aggregate isn't a folder for related data. It's the boundary of a transaction and the owner of an invariant. Get the boundary wrong, and every save becomes a negotiation between models that shouldn't know about each other.",
    body: (
      <>
        <p>Once you've settled a Bounded Context's boundary, the next question is what happens inside it. This is where tactical design lives: Aggregate, Entity, Value Object, Domain Event. Of these, the Aggregate Root decision matters most, because it's the one thing that determines your transaction size, your lock contention, and how many other objects a single save has to know about.</p>
        <h2>The Aggregate Root's Job</h2>
        <p>An Aggregate Root encapsulates business rules and invariants. Nothing outside it changes its internal state directly. A change always goes through one of its own domain methods, and a violated invariant throws immediately, inside that method, not somewhere downstream.</p>
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
        <p>An Application Service never carries out business logic itself. It delegates to an Aggregate method and nothing more. If you find yourself writing an <code>if</code> statement about the domain inside a Command Service, that logic almost certainly belongs one layer down.</p>
        <h2>Reference Other Aggregates by ID, Never by Object</h2>
        <p>The transaction boundary is set at the Aggregate Root level: only one Aggregate changes per transaction. That's only possible if Aggregates don't hold direct object references to each other. <code>Order</code> holds a <code>userId: String</code>, never a <code>User</code> object. An object reference creates coupling that an ID reference avoids: loading one Aggregate never cascades into loading a graph of others just to satisfy a type.</p>
        <h2>Entities and Value Objects Live at the Same Layer, With Different Contracts</h2>
        <p>An Entity's equality is judged by a unique identifier. Two objects with the same ID are the same object even if every other field differs, and it has a lifecycle: created, modified, deleted. A child Entity inside an Aggregate, like an <code>OrderItem</code>, is only ever accessed and modified through the Aggregate Root that owns it.</p>
        <p>A Value Object has no identifier at all. Its equality is judged by the combination of its values, and it's immutable.</p>
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
        <p>Reach for a Value Object whenever an object's attributes alone convey its meaning and it doesn't need an identifier (an amount, an address, a coordinate pair), and whenever immutability needs to be guaranteed.</p>
        <h2>Deciding Where the Boundary Goes</h2>
        <p>Group objects into the same Aggregate when they're created and deleted together, and when they must always change together to keep an invariant intact. <code>Order</code> and <code>OrderItem</code> belong together, because an order with no items isn't a valid order. Split them into separate Aggregates when they're looked up and modified independently, and a change on one side doesn't touch the other's invariants. <code>Order</code> and <code>User</code> are separate, because cancelling an order doesn't affect the user's info at all.</p>
        <div className="article-note"><strong>Signs an Aggregate has grown too large</strong><p>A single save method changes dozens of rows. It directly contains another Aggregate as an object, not just an ID. Optimistic-lock conflicts start happening often. Any of these is a signal to look for a seam, not to add more indexes.</p></div>
        <p>When the boundary isn't clear, start small. Merging two Aggregates later, once you've watched how they change in production, is a far cheaper move than trying to split an overgrown one apart under load.</p>
        <h2>Generating the Aggregate's Own ID</h2>
        <p>The ID is generated in the Domain layer, inside the Aggregate's own <code>create()</code> factory, and the server always generates it, never a client-supplied value. The format is a UUID v4 with hyphens stripped, a 32-character hex string, not an auto-increment number. An incrementing ID exposes record count and creation order externally, can collide across services or shards, and isn't determined until the DB assigns it, so it can never be pre-generated where the Domain layer needs it.</p>
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
        <p>On new creation, <code>create()</code> generates the ID itself; on restoring from the DB, the Repository implementation calls <code>reconstitute()</code> with the existing ID passed straight through. Either way, the Repository never issues a fresh ID of its own. It uses whatever ID the Aggregate already carries.</p>
        <h2>A Checklist for the Boundary</h2>
        <ul>
          <li>Does a save through this Aggregate ever touch more than one table's worth of real invariant?</li>
          <li>Is a business rule split across two Aggregates that never load together?</li>
          <li>Does this Aggregate hold another Aggregate by object reference instead of by ID?</li>
          <li>Have optimistic-lock conflicts on this Aggregate become a recurring complaint?</li>
          <li>Would merging two Aggregates make more invariants provably true in one transaction?</li>
        </ul>
        <p>None of this is about finding the one correct diagram. It's about keeping the unit that guards a rule as large as the rule requires: no bigger, so it doesn't drag unrelated data into every lock, and no smaller, so the rule it's supposed to protect doesn't leak out into whichever Service happened to call it first.</p>
        <div className="article-note"><strong>Further reading</strong><p>
          <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/docs/architecture/tactical-ddd.md" target="_blank" rel="noreferrer">docs/architecture/tactical-ddd.md</a> (Aggregate, Entity, and Value Object design and boundary criteria in full, from my example project that implements the same backend design (DDD, CQRS, Outbox) in five languages side by side) · <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/docs/architecture/aggregate-id.md" target="_blank" rel="noreferrer">docs/architecture/aggregate-id.md</a> (the ID-generation rules and how the Repository handles them)
        </p></div>
      </>
    ),
  },
  ko: {
    kicker: 'DDD · Tactical Design',
    title: (
      <>
        Aggregate 설계,<br /><em>트랜잭션 경계와 불변식</em>
      </>
    ),
    lede: 'Aggregate는 관련 데이터를 모아 두는 폴더가 아니다. 트랜잭션의 경계이고, 불변식(invariant)을 책임지는 주인이다. 경계를 잘못 그으면 서로 몰라도 될 모델들이 저장할 때마다 서로 눈치를 보게 된다.',
    body: (
      <>
        <p>Bounded Context의 경계를 정하고 나면 그 안을 어떻게 채울지가 남는다. 전술적 설계(tactical design)가 다루는 부분이고, Aggregate, Entity, Value Object, Domain Event가 여기에 속한다. 그중에서 가장 중요한 건 Aggregate Root를 어떻게 정하느냐다. 트랜잭션 크기와 락 경합이 여기서 정해지고, 저장 한 번에 다른 객체를 몇 개나 알아야 하는지도 여기서 정해진다. 그런데 정할 때는 그런 영향이 잘 눈에 띄지 않는다.</p>
        <h2>Aggregate Root의 역할</h2>
        <p>Aggregate Root는 비즈니스 규칙과 불변식을 안에 감싼다. 바깥에서는 내부 상태를 직접 바꿀 수 없고, 바꾸려면 언제나 Root의 도메인 메서드를 거쳐야 한다. 불변식이 깨지면 그 메서드 안에서 바로 예외를 던진다. 한참 뒤 엉뚱한 곳에서 터지게 두지 않는다.</p>
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
        <p>Application Service는 비즈니스 로직을 직접 처리하지 않고 Aggregate 메서드에 넘기기만 한다. Command Service 안에 도메인 조건을 따지는 <code>if</code> 문을 쓰고 있다면, 그 로직은 거의 틀림없이 한 계층 아래에 있어야 할 코드다.</p>
        <h2>다른 Aggregate는 ID로만 참조한다</h2>
        <p>트랜잭션 경계는 Aggregate Root 단위로 잡는다. 트랜잭션 하나에서 바꾸는 Aggregate는 하나뿐이다. 그러려면 Aggregate끼리 객체 참조로 서로를 붙들고 있으면 안 된다. 그래서 <code>Order</code>는 <code>userId: String</code>만 갖고 <code>User</code> 객체는 갖지 않는다. 객체로 참조하면 ID로 참조할 때는 없던 결합이 생긴다. 타입 하나 맞추자고 Aggregate 하나를 읽을 때 다른 객체 그래프까지 줄줄이 읽어 오게 되는 것이다.</p>
        <h2>Entity와 Value Object는 같은 계층, 다른 약속</h2>
        <p>Entity는 고유 식별자로 같은지를 판단한다. ID가 같으면 다른 필드가 전부 달라도 같은 객체다. 생성되고, 수정되고, 삭제되는 생명주기도 있다. <code>OrderItem</code>처럼 Aggregate 안에 있는 자식 Entity는 자기를 가진 Aggregate Root를 거쳐서만 읽고 고칠 수 있다.</p>
        <p>Value Object에는 식별자가 아예 없다. 값의 조합이 같으면 같은 것으로 보고, 한 번 만들면 바뀌지 않는다(immutable).</p>
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
        <p>금액, 주소, 좌표 쌍처럼 속성만으로 뜻이 다 전해지고 식별자가 필요 없는 객체라면 Value Object로 만들면 된다. 불변성을 보장해야 할 때도 마찬가지다.</p>
        <h2>경계를 어디에 그을지 정하기</h2>
        <p>같이 만들어지고 같이 지워지는 객체, 불변식을 지키려면 꼭 같이 바뀌어야 하는 객체는 한 Aggregate로 묶는다. <code>Order</code>와 <code>OrderItem</code>이 그렇다. 아이템이 하나도 없는 주문은 올바른 주문이 아니다. 반대로 따로 조회하고 따로 고치며, 한쪽이 바뀌어도 다른 쪽 불변식에 영향이 없다면 Aggregate를 나눈다. <code>Order</code>와 <code>User</code>가 그렇다. 주문을 취소한다고 사용자 정보가 바뀌지는 않는다.</p>
        <div className="article-note"><strong>Aggregate가 너무 커졌다는 신호</strong><p>저장 메서드 하나가 수십 개의 행(row)을 바꾼다. 다른 Aggregate를 ID 대신 객체로 품고 있다. 낙관적 락(optimistic lock) 충돌이 잦아진다. 하나라도 해당하면 인덱스를 더 달 때가 아니다. 쪼갤 이음매(seam)를 찾아야 한다.</p></div>
        <p>경계가 정말 애매하면 작게 시작하는 게 낫다. 두 Aggregate가 프로덕션에서 어떻게 바뀌는지 지켜본 뒤에 합치는 쪽이 훨씬 싸다. 이미 커져 버린 Aggregate를 부하를 받는 중에 쪼개는 건 그보다 몇 배는 힘들다.</p>
        <h2>ID는 Aggregate가 직접 만든다</h2>
        <p>ID는 Domain 계층, 그러니까 Aggregate의 <code>create()</code> 팩토리 안에서 만든다. 언제나 서버가 만들고, 클라이언트가 보낸 값은 쓰지 않는다. 형식은 하이픈을 뺀 UUID v4, 곧 32자리 16진수 문자열이다. auto-increment 번호는 쓰지 않는다. 증가하는 ID는 레코드 수와 생성 순서를 밖에 드러내고, 서비스나 샤드 사이에서 겹칠 수 있다. 게다가 DB가 값을 매기기 전에는 정해지지 않아서, Domain 계층이 필요한 시점에 미리 만들어 둘 수가 없다.</p>
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
        <p>새로 만들 때는 <code>create()</code>가 ID를 만든다. DB에서 되살릴 때는 Repository 구현체가 <code>reconstitute()</code>를 부르면서 기존 ID를 그대로 넘긴다. 어느 쪽이든 Repository가 새 ID를 발급하는 일은 없다. Aggregate가 이미 가진 ID를 그대로 쓴다.</p>
        <h2>경계 점검표</h2>
        <ul>
          <li>이 Aggregate로 한 번 저장할 때, 지켜야 할 불변식과 상관없는 테이블까지 건드리고 있지 않은가?</li>
          <li>비즈니스 규칙 하나가, 함께 읽힐 일이 없는 두 Aggregate에 나뉘어 있지 않은가?</li>
          <li>이 Aggregate가 다른 Aggregate를 ID 대신 객체 참조로 갖고 있지 않은가?</li>
          <li>이 Aggregate의 낙관적 락 충돌이 단골 불만이 되지 않았는가?</li>
          <li>두 Aggregate를 합치면 트랜잭션 하나 안에서 확실히 지킬 수 있는 불변식이 더 늘어나지 않는가?</li>
        </ul>
        <p>정답 다이어그램이 하나 있어서 그걸 찾는 작업은 아니다. 규칙을 지키는 단위를 그 규칙에 딱 맞는 크기로 유지하면 된다. 너무 크면 상관없는 데이터까지 매번 락에 끌려 들어온다. 너무 작으면 지켜야 할 규칙이 밖으로 새서, 어쩌다 먼저 호출한 Service 안에 들어가 앉는다.</p>
        <div className="article-note"><strong>더 볼 자료</strong><p>
          <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/docs/architecture/tactical-ddd.md" target="_blank" rel="noreferrer">docs/architecture/tactical-ddd.md</a>(같은 백엔드 설계(DDD, CQRS, Outbox)를 5개 언어로 나란히 구현해 둔 내 예제 프로젝트의 Aggregate, Entity, Value Object 설계와 경계 기준 전체) · <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/docs/architecture/aggregate-id.md" target="_blank" rel="noreferrer">docs/architecture/aggregate-id.md</a>(ID 생성 규칙과 Repository에서 다루는 법)
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
