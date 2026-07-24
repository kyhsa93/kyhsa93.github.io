import PostLayout from '../../components/PostLayout';
import { useLocale } from '../../lib/locale';

const content = {
  en: {
    kicker: 'Event-driven · Backend',
    title: (
      <>
        Reliability in<br /><em>Event-Driven Systems</em>
      </>
    ),
    lede: "Having a message broker doesn't mean events are delivered safely. When you design assuming loss, duplication, and reordering as givens, a system can recover to a consistent state even after failures.",
    body: (
      <>
        <p>Event-driven architecture lowers coupling between services and enables independent scaling. But unlike a synchronous call where a request is immediately followed by a response, it's hard to see at a glance how far an event has traveled once it's published. The database write might succeed while the event publish fails, a consumer might receive the same message twice, or a consumer that paused for a while might process a stale event later.</p>
        <p>Reliability isn't achieved by a single promise of “exactly-once delivery.” It's a combination of mechanisms that anticipate failure at every stage — storage, delivery, consumption, observation — and make it safe to redo the same work. This post walks through, in order, the problems you run into most often in practice.</p>
        <h2>Align on This First: Delivery Guarantees and Processing Guarantees Are Different</h2>
        <p>A message broker's at-least-once delivery means it retries until the message reaches the consumer at least once. But if the consumer dies right after saving the processing result and before sending its acknowledgment, the broker resends the same message. In other words, guaranteed delivery does not guarantee that the business operation runs only once.</p>
        <p>In practice, it's more realistic to accept at-least-once delivery and make the consumer idempotent, aiming for effectively-once processing. Idempotency means that processing the same input multiple times produces the same observable result as processing it once. This boundary matters most for operations with external effects, like approving a payment, awarding points, or sending an email.</p>
        <h2>1. Handle the DB Write and the Event Publish Together</h2>
        <p>The simplest code — save the order, then publish the event — has two failure windows. If the process dies after the DB write, the event is lost; if the event is sent first and the DB write then fails, an event for a nonexistent order is delivered. You could tie the two systems together with a distributed transaction, but the operational complexity and availability cost are high.</p>
        <p>The Outbox pattern stores the domain data and the event to be published in the same local transaction. A separate worker reads not-yet-published Outbox records, sends them to the broker, and flips them to published once that succeeds. This approach may deliver events late, but it eliminates the window where they get lost.</p>
        <h3>Example: Transactional Outbox</h3>
        <pre><code>{`@Service
class PlaceOrderService(
    private val orderRepository: OrderRepository,
    private val outboxRepository: OutboxRepository,
) {
    @Transactional
    fun placeOrder(command: PlaceOrderCommand): Order {
        val order = Order.place(command)
        orderRepository.saveOrder(order)

        outboxRepository.append(
            OutboxEvent(
                id = UUID.randomUUID().toString(),
                topic = "orders.placed",
                key = order.id,
                payload = OrderPlacedPayload(orderId = order.id, customerId = order.customerId),
                occurredAt = LocalDateTime.now(),
            ),
        )
        return order
    }
}

@Component
class OutboxPoller(
    private val outboxRepository: OutboxRepository,
    private val broker: EventBroker,
) {
    @Scheduled(fixedDelay = 1000)
    @Transactional
    fun publishOutbox() {
        outboxRepository.findUnpublished().forEach { event ->
            broker.publish(event.topic, event.key, event.payload)
            outboxRepository.markPublished(event.id)
        }
    }
}`}</code></pre>
        <p>If the worker dies after sending to the broker but before marking it complete, the same event can be published again. So the Outbox alone can't eliminate duplicates. Instead, the publishing side must provide a stable event ID and key, and the consuming side must handle duplicates safely.</p>
        <h2>2. Consumers Store an Idempotency Key</h2>
        <p>The simplest approach is to record the event ID as a processing history. Before doing the work, the consumer checks whether that ID has already been processed, then saves the result and the ID in the same transaction. Using a database unique constraint lets only one of several consumer instances succeed, even if they all receive the same message at once.</p>
        <h3>Example: A Consumer That Ignores Duplicate Events</h3>
        <pre><code>{`@Component
class PaymentApprovedEventHandler(
    private val inboxRepository: InboxRepository,
    private val orderRepository: OrderRepository,
) {
    @Transactional
    fun handle(event: PaymentApprovedEvent) {
        if (inboxRepository.exists(event.id)) return

        val order = orderRepository.findOrder(event.orderId)
        order.markPaid(event.approvedAt)
        orderRepository.saveOrder(order)

        // Put a unique index on event_id.
        inboxRepository.record(event.id, "payment-service")
    }
}`}</code></pre>
        <p>Here, the Inbox record and the order state change must be in the same transaction. If only one succeeds, the next retry creates an inconsistency. For work that can't be placed in the same transaction — like an external API call — you should pass an idempotency key the provider supports, or record the intent to call as an Outbox entry, turning it into a retryable operation.</p>
        <h2>3. Retries Are a Policy, Not Infinite Repetition</h2>
        <p>Network errors or a temporary database overload can be recovered with retries. But permanent failures also exist — an event with a mismatched schema, or one referencing a deleted product. If you retry every failure immediately, the consumer gets stuck on the same message and can't process the healthy messages behind it either.</p>
        <p>You need a policy that applies exponential backoff and jitter to transient errors, and moves a message to a Dead Letter Queue after a set number of attempts. A DLQ isn't a trash bin for hiding failures — it's a queue an operator uses to identify the cause, fix it, and reprocess. You need to keep the original event, the failure count, the exception message, and the first-received timestamp together to diagnose it.</p>
        <div className="article-note"><strong>Retry Design Tip</strong><p>Don't just decide on a retry count — also define which errors are retryable, the maximum delay, and who's responsible for reprocessing the DLQ. A DLQ with no alerting is, in the end, the same as a lost event.</p></div>
        <h2>4. If Order Matters, Limit Its Scope</h2>
        <p>Guaranteeing global ordering of every event in a distributed environment is often expensive and unnecessary. What's usually needed is closer to “events for the same order are processed in order.” Using the order ID as the partition key sends events for the same order to the same partition, letting the consumer preserve ordering within that scope.</p>
        <p>Even so, delayed events can still arrive. You can defend against this by validating state transitions and including a version. For example, if an already-cancelled order receives a late-arriving payment-completed event, you should compare the current state against the event's version instead of unconditionally applying the change. “Ignore stale messages” should also be an explicit business decision, not an implicit one.</p>
        <h2>5. Observability Shortens Recovery Time</h2>
        <p>Failures in event systems often start quietly. Publish latency builds up, one consumer's retries increase, and the DLQ eventually grows. Leaving the event ID and correlation ID in logs, traces, and metrics alike lets you trace which events a request produced and where things stalled.</p>
        <p>At minimum, you should watch these on a dashboard: the number of pending Outbox entries, publish latency, consumer lag, retry counts, and DLQ depth. These operational metrics are performance metrics, but they're also consistency metrics — they show when a business fact actually gets reflected.</p>
        <h2>Reliability Checklist</h2>
        <ul>
          <li>Are domain changes and event records saved in a single local transaction?</li>
          <li>Does every event have a unique ID, an occurrence timestamp, and a traceable correlation ID?</li>
          <li>Does the consumer safely ignore duplicates or reproduce the same result?</li>
          <li>Do you distinguish transient from permanent failures, and monitor the DLQ?</li>
          <li>Is the scope where ordering matters, and the policy for handling delayed events, clearly defined?</li>
        </ul>
        <p>A reliable event system isn't one that never fails — it's one that anticipates failure and can safely retry. Designing delivery guarantees, idempotency, retry policy, and observability together lets you keep data flowing even as services multiply.</p>
        <div className="article-note"><strong>Further reading in the repo</strong><p>
          <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/docs/architecture/domain-events.md" target="_blank" rel="noreferrer">docs/architecture/domain-events.md</a> — the full Outbox pattern, Integration Events, and idempotency conventions
        </p></div>
      </>
    ),
  },
  ko: {
    kicker: 'Event-driven · Backend',
    title: (
      <>
        이벤트 기반 시스템의<br /><em>신뢰성</em>
      </>
    ),
    lede: '메시지 브로커가 있다고 해서 이벤트가 안전하게 전달되는 건 아니다. 유실, 중복, 순서 뒤바뀜을 당연히 일어나는 일로 전제하고 설계하면, 장애가 나더라도 시스템은 일관된 상태로 돌아올 수 있다.',
    body: (
      <>
        <p>이벤트 기반 아키텍처는 서비스 간 결합도를 낮추고 독립적인 확장을 가능하게 한다. 하지만 요청 직후 응답이 오는 동기 호출과 달리, 이벤트는 한 번 발행되고 나면 그게 어디까지 흘러갔는지 한눈에 파악하기 어렵다. DB 저장은 성공했는데 이벤트 발행은 실패할 수도 있고, Consumer가 같은 메시지를 두 번 받을 수도 있고, 한동안 멈춰 있던 Consumer가 뒤늦게 오래된 이벤트를 처리할 수도 있다.</p>
        <p>신뢰성은 "정확히 한 번 전달(exactly-once delivery)"이라는 하나의 약속으로 달성되는 게 아니다. 저장, 전달, 소비, 관측이라는 각 단계마다 장애를 미리 전제하고, 같은 작업을 다시 해도 안전하도록 만드는 여러 메커니즘의 조합이다. 이 글에서는 실무에서 가장 자주 마주치는 문제들을 순서대로 짚어본다.</p>
        <h2>먼저 맞춰야 할 것: 전달 보장과 처리 보장은 다르다</h2>
        <p>메시지 브로커의 at-least-once 전달이란, 메시지가 Consumer에게 최소 한 번은 도달할 때까지 재시도한다는 뜻이다. 하지만 Consumer가 처리 결과를 저장한 직후, ack를 보내기 전에 죽어버리면 브로커는 같은 메시지를 다시 보낸다. 즉 전달이 보장된다고 해서 비즈니스 연산이 정확히 한 번만 실행되는 것은 아니다.</p>
        <p>실무에서는 at-least-once 전달을 그대로 받아들이고 Consumer를 멱등(idempotent)하게 만들어 effectively-once 처리를 목표로 삼는 편이 낫다. 멱등성이란 같은 입력을 여러 번 처리해도 한 번 처리했을 때와 동일한 결과가 나온다는 뜻이다. 결제 승인, 포인트 적립, 이메일 발송처럼 외부에 영향을 미치는 연산일수록 이 경계가 중요하다.</p>
        <h2>1. DB 저장과 이벤트 발행을 함께 처리한다</h2>
        <p>가장 단순한 코드, 즉 주문을 저장한 뒤 이벤트를 발행하는 방식에는 두 개의 실패 구간이 있다. DB 저장 후 프로세스가 죽으면 이벤트가 유실되고, 이벤트를 먼저 보낸 뒤 DB 저장이 실패하면 존재하지 않는 주문에 대한 이벤트가 전달된다. 두 시스템을 분산 트랜잭션으로 묶을 수도 있지만, 운영 복잡도와 가용성 비용이 크다.</p>
        <p>Outbox 패턴은 도메인 데이터와 발행할 이벤트를 같은 로컬 트랜잭션 안에 저장한다. 별도의 워커가 아직 발행되지 않은 Outbox 레코드를 읽어 브로커로 보내고, 성공하면 발행 완료로 표시한다. 이 방식은 이벤트가 늦게 전달될 수는 있지만, 유실되는 구간 자체를 없앤다.</p>
        <h3>예시: Transactional Outbox</h3>
        <pre><code>{`@Service
class PlaceOrderService(
    private val orderRepository: OrderRepository,
    private val outboxRepository: OutboxRepository,
) {
    @Transactional
    fun placeOrder(command: PlaceOrderCommand): Order {
        val order = Order.place(command)
        orderRepository.saveOrder(order)

        outboxRepository.append(
            OutboxEvent(
                id = UUID.randomUUID().toString(),
                topic = "orders.placed",
                key = order.id,
                payload = OrderPlacedPayload(orderId = order.id, customerId = order.customerId),
                occurredAt = LocalDateTime.now(),
            ),
        )
        return order
    }
}

@Component
class OutboxPoller(
    private val outboxRepository: OutboxRepository,
    private val broker: EventBroker,
) {
    @Scheduled(fixedDelay = 1000)
    @Transactional
    fun publishOutbox() {
        outboxRepository.findUnpublished().forEach { event ->
            broker.publish(event.topic, event.key, event.payload)
            outboxRepository.markPublished(event.id)
        }
    }
}`}</code></pre>
        <p>워커가 브로커에 전송한 뒤 완료 표시를 하기 전에 죽으면, 같은 이벤트가 다시 발행될 수 있다. 즉 Outbox만으로는 중복을 없앨 수 없다. 발행 쪽은 안정적인 이벤트 ID와 key를 제공해야 하고, 소비 쪽은 중복을 안전하게 처리해야 한다.</p>
        <h2>2. Consumer는 멱등성 키를 저장한다</h2>
        <p>가장 단순한 방법은 이벤트 ID를 처리 이력으로 기록하는 것이다. Consumer는 작업을 수행하기 전에 해당 ID가 이미 처리됐는지 확인하고, 처리 결과와 ID를 같은 트랜잭션 안에 저장한다. 데이터베이스의 unique 제약을 활용하면, 여러 Consumer 인스턴스가 동시에 같은 메시지를 받더라도 그중 하나만 성공하게 만들 수 있다.</p>
        <h3>예시: 중복 이벤트를 무시하는 Consumer</h3>
        <pre><code>{`@Component
class PaymentApprovedEventHandler(
    private val inboxRepository: InboxRepository,
    private val orderRepository: OrderRepository,
) {
    @Transactional
    fun handle(event: PaymentApprovedEvent) {
        if (inboxRepository.exists(event.id)) return

        val order = orderRepository.findOrder(event.orderId)
        order.markPaid(event.approvedAt)
        orderRepository.saveOrder(order)

        // Put a unique index on event_id.
        inboxRepository.record(event.id, "payment-service")
    }
}`}</code></pre>
        <p>여기서 Inbox 레코드와 주문 상태 변경은 반드시 같은 트랜잭션 안에 있어야 한다. 둘 중 하나만 성공하면 다음 재시도에서 불일치가 생긴다. 외부 API 호출처럼 같은 트랜잭션에 묶을 수 없는 작업이라면, 제공자가 지원하는 멱등성 키를 전달하거나 호출 의도 자체를 Outbox 항목으로 기록해 재시도 가능한 연산으로 바꿔야 한다.</p>
        <h2>3. 재시도는 정책이지, 무한 반복이 아니다</h2>
        <p>네트워크 오류나 일시적인 데이터베이스 과부하는 재시도로 복구할 수 있다. 하지만 영구적인 실패도 있다 — 스키마가 맞지 않는 이벤트, 이미 삭제된 상품을 참조하는 이벤트 같은 것들이다. 모든 실패를 즉시 재시도하면 Consumer는 같은 메시지에 발이 묶여 뒤에 대기 중인 정상 메시지조차 처리하지 못하게 된다.</p>
        <p>일시적 오류에는 exponential backoff와 jitter를 적용하고, 정해진 횟수를 넘기면 메시지를 Dead Letter Queue로 옮기는 정책이 필요하다. DLQ는 실패를 숨기기 위한 쓰레기통이 아니라, 운영자가 원인을 파악하고 고친 뒤 재처리하기 위해 쓰는 큐다. 진단을 위해서는 원본 이벤트, 실패 횟수, 예외 메시지, 최초 수신 시각을 함께 보관해야 한다.</p>
        <div className="article-note"><strong>재시도 설계 팁</strong><p>재시도 횟수만 정하지 말고, 어떤 오류가 재시도 대상인지, 최대 지연 시간은 얼마인지, DLQ 재처리는 누구 책임인지도 함께 정의하라. 알림이 없는 DLQ는 결국 유실된 이벤트와 다를 게 없다.</p></div>
        <h2>4. 순서가 중요하다면 그 범위를 제한하라</h2>
        <p>분산 환경에서 모든 이벤트의 전역 순서를 보장하는 건 대개 비용이 크고 불필요하다. 보통 필요한 건 "같은 주문에 대한 이벤트는 순서대로 처리된다"에 가까운 수준이다. 주문 ID를 파티션 키로 사용하면 같은 주문의 이벤트가 같은 파티션으로 전달되어, Consumer는 그 범위 안에서 순서를 보존할 수 있다.</p>
        <p>그럼에도 지연된 이벤트는 여전히 도착할 수 있다. 상태 전이를 검증하고 버전을 포함시키는 방식으로 이를 방어할 수 있다. 예를 들어 이미 취소된 주문에 뒤늦게 결제완료 이벤트가 도착하면, 변경을 무조건 적용하는 대신 현재 상태와 이벤트의 버전을 비교해야 한다. "오래된 메시지는 무시한다"는 것도 암묵적인 처리가 아니라 명시적인 비즈니스 결정이어야 한다.</p>
        <h2>5. 관측 가능성이 복구 시간을 줄인다</h2>
        <p>이벤트 시스템의 장애는 대개 조용히 시작된다. 발행 지연이 쌓이고, 어느 한 Consumer의 재시도가 늘어나고, DLQ가 서서히 커진다. 로그, 트레이스, 메트릭 모두에 이벤트 ID와 correlation ID를 남겨두면, 하나의 요청이 만들어낸 이벤트들이 어디서 멈췄는지 추적할 수 있다.</p>
        <p>최소한 대시보드에서는 다음을 지켜봐야 한다: 미발행 Outbox 항목 수, 발행 지연 시간, Consumer lag, 재시도 횟수, DLQ 적재량. 이 운영 지표들은 성능 지표이기도 하지만, 동시에 일관성 지표이기도 하다 — 비즈니스 사실이 실제로 언제 반영되는지를 보여주기 때문이다.</p>
        <h2>신뢰성 체크리스트</h2>
        <ul>
          <li>도메인 변경과 이벤트 기록이 하나의 로컬 트랜잭션 안에 저장되는가?</li>
          <li>모든 이벤트가 고유 ID, 발생 시각, 추적 가능한 correlation ID를 갖는가?</li>
          <li>Consumer가 중복을 안전하게 무시하거나 동일한 결과를 재현하는가?</li>
          <li>일시적 실패와 영구적 실패를 구분하고, DLQ를 모니터링하는가?</li>
          <li>순서가 중요한 범위와, 지연된 이벤트를 처리하는 정책이 명확히 정의되어 있는가?</li>
        </ul>
        <p>신뢰할 수 있는 이벤트 시스템이란 절대 실패하지 않는 시스템이 아니라, 실패를 미리 전제하고 안전하게 재시도할 수 있는 시스템이다. 전달 보장, 멱등성, 재시도 정책, 관측 가능성을 함께 설계하면 서비스가 늘어나도 데이터 흐름을 계속 유지할 수 있다.</p>
        <div className="article-note"><strong>저장소 내 추가 자료</strong><p>
          <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/docs/architecture/domain-events.md" target="_blank" rel="noreferrer">docs/architecture/domain-events.md</a> — 전체 Outbox 패턴, Integration Event, 멱등성 컨벤션
        </p></div>
      </>
    ),
  },
};

export default function ReliableEventDrivenSystems() {
  const { locale } = useLocale();
  const c = content[locale];

  return (
    <PostLayout slug="reliable-event-driven-systems" kicker={c.kicker} title={c.title} lede={c.lede}>
      {c.body}
    </PostLayout>
  );
}
