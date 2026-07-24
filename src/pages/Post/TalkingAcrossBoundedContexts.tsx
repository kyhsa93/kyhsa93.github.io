import PostLayout from '../../components/PostLayout';
import { useLocale } from '../../lib/locale';

const content = {
  en: {
    kicker: 'DDD · Integration',
    title: (
      <>
        Talking Across<br /><em>Bounded Contexts</em>
      </>
    ),
    lede: "Once a Bounded Context boundary is real, the next question is unavoidable: how does one BC ask another for something, or tell it that something happened? There are exactly two honest answers, and picking the wrong one for the situation is how a distributed system quietly becomes a distributed monolith.",
    body: (
      <>
        <p>When one Bounded Context needs another, within the same process, there are two approaches: synchronous, through an Adapter, or asynchronous, through an Integration Event. Everything else — message brokers, sagas, choreography versus orchestration — is a variation on that choice. Getting it right per use case is what keeps BCs independently deployable instead of secretly coupled through a shared transaction.</p>
        <h2>The Decision, as Four Questions</h2>
        <p>Does the current request's response need data from the external BC right now? If yes, you need a synchronous call. Does the called BC actually change state, or just get read? A state change through a synchronous call means you're one step away from wrapping two BCs in a single transaction — usually a sign to reconsider. Must the current transaction roll back if the external call fails? If not — if eventual consistency is acceptable — that's a strong signal toward async. And is the call direction fundamentally one-way, like "notify whoever's listening"? That's an event, not a request.</p>
        <blockquote>If a state change — not a read — is needed in an external BC, don't wrap the two BCs in one transaction via a synchronous call. Let each BC process it independently, through an Integration Event.</blockquote>
        <h2>Synchronous: The Adapter Pattern</h2>
        <p>Used when you need to look something up immediately, within the current request, from an external BC's service. An order-detail response that needs to include the user's name, or a balance check before processing a payment — both need an answer before the current request can finish.</p>
        <pre><code>{`[Order BC Application] → UserAdapter (interface) → UserAdapterImpl → [User BC Service]
                         (my application/adapter/)  (my infrastructure/)`}</code></pre>
        <p>The Adapter acts as an Anticorruption Layer. Even if the external BC's model or interface changes shape, the internal domain model on this side is unaffected — the Adapter is where that translation happens, once, instead of scattered across every call site. Two things to watch for: never inject an external BC's Repository or Service directly into the Application layer — always go through the Adapter interface — and never call an external BC's write methods through an Adapter. If a write is genuinely needed, that's the signal to switch to an Integration Event instead.</p>
        <p>This is exactly precise enough to check mechanically: the nestjs harness's <code>no-cross-bc-repository-in-application</code> rule flags any <code>application/**/*.ts</code> file that directly imports another BC's <code>domain/*-repository.ts</code> — importing a Repository within the <em>same</em> domain, the normal pattern, isn't a target.</p>
        <h2>Asynchronous: Integration Events</h2>
        <p>Used when, after this BC's own domain work completes, an external BC needs to react and change its own state — after an order is cancelled, the Payment BC needs to process a refund; after an order completes, the Notification BC needs to send an email. Neither of those needs to block the original request.</p>
        <pre><code>{`[Order BC] → Domain Event → Application EventHandler → Integration Event → Outbox → message queue
                                                                                      ↓
                                                              [Payment BC] ← IntegrationEventController`}</code></pre>
        <p>An Integration Event never exposes an internal Domain Event to the outside as-is — the Application EventHandler is the conversion point, the same anticorruption idea as the Adapter but running in the opposite direction. And because the receiving side must assume at-least-once delivery, it implements handling idempotently, exactly the same discipline covered in reliable event-driven design generally.</p>
        <h2>A Real Compensating Action</h2>
        <p>The Payment BC checks the account's active status and balance via a synchronous Adapter, then marks the payment complete (publishing <code>payment.completed.v1</code>). The Account BC subscribes to that event and performs the actual deduction — there's a brief eventual-consistency window between the synchronous check and the asynchronous deduction, and that gap is an accepted, explicit design decision, not an oversight.</p>
        <p>If the payment is later cancelled (<code>payment.cancelled.v1</code>), the Account BC subscribes the same way and runs a compensating credit that reverses the amount already deducted — not a transaction rollback, but a classic cross-BC compensating transaction: a new asynchronous event that offsets an earlier state change instead of undoing it in place. Refund approval (<code>refund.approved.v1</code>) reuses the exact same reaction. The real implementation lives at <code>implementations/nestjs/examples/src/account/interface/integration-event/account-integration-event-controller.ts</code> and <code>implementations/nestjs/examples/src/payment/application/event/</code>.</p>
        <h2>Mixing Both in One Use Case</h2>
        <p>A single command handler routinely uses both patterns for different parts of its work — a synchronous lookup for whatever the response needs right now, and an asynchronous follow-up for whatever downstream reaction doesn't:</p>
        <pre><code>{`public async cancelOrder(command: CancelOrderCommand): Promise<void> {
  // 1. A synchronous lookup via an Adapter (needed for the response)
  const user = await this.userAdapter.findUsers({ userId: command.userId, take: 1, page: 0 })
                  .then((r) => r.users.pop())
  if (!user) throw new Error('User not found.')

  const order = await this.orderRepository.findOrders({ orderId: command.orderId, take: 1, page: 0 })
                  .then((r) => r.orders.pop())
  if (!order) throw new Error('Order not found.')

  order.cancel(command.reason)

  // 2. save → Domain Event → Integration Event (requesting a refund from the Payment BC is asynchronous)
  await this.transactionManager.run(async () => {
    await this.orderRepository.saveOrder(order)
  })
}`}</code></pre>
        <h2>Mapping to Classic Context Map Patterns</h2>
        <p>If you already know Context Mapping vocabulary, both patterns above are specific implementations of it. An Anticorruption Layer is the Adapter, preventing contamination from an external model. Open Host Service with a Published Language is publishing an Integration Event with an explicit version, like <code>order.cancelled.v1</code>. Conformist is using an external BC's model directly with no Adapter at all — not recommended, and usually a sign the boundary was drawn in a hurry. Customer-Supplier tends to show up as a combination of both patterns together, which is exactly what the compensating-action example above is.</p>
        <p>None of this requires a message broker to start. Even inside a single deployable, keeping the same discipline — a real Adapter interface for lookups, a real event contract for reactions — is what makes splitting a BC out into its own service later a refactor instead of a rewrite.</p>
        <div className="article-note"><strong>Further reading in the repo</strong><p>
          <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/docs/architecture/cross-domain-communication.md" target="_blank" rel="noreferrer">docs/architecture/cross-domain-communication.md</a> — the full decision table and Context Map mapping · <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/implementations/nestjs/examples/src/account/interface/integration-event/account-integration-event-controller.ts" target="_blank" rel="noreferrer">account-integration-event-controller.ts</a> — the real compensating-credit reaction
        </p></div>
      </>
    ),
  },
  ko: {
    kicker: 'DDD · Integration',
    title: (
      <>
        Bounded Context 사이의<br /><em>대화법</em>
      </>
    ),
    lede: 'Bounded Context 경계가 실제로 자리 잡고 나면, 다음 질문은 피할 수 없다. 한 BC가 다른 BC에게 뭔가를 요청하거나, 무슨 일이 일어났다고 알려주려면 어떻게 해야 할까? 정직한 답은 정확히 둘뿐이고, 상황에 맞지 않는 쪽을 고르는 순간 분산 시스템은 조용히 분산 모놀리스로 변한다.',
    body: (
      <>
        <p>같은 프로세스 안에서 한 Bounded Context가 다른 BC를 필요로 할 때, 방법은 두 가지다: Adapter를 통한 동기 호출, 아니면 Integration Event를 통한 비동기 처리. 메시지 브로커, Saga, 코레오그래피 대 오케스트레이션 같은 나머지 모든 이야기는 결국 이 선택의 변주일 뿐이다. 유스케이스마다 이 선택을 제대로 하는 것이야말로 BC들을 하나의 공유 트랜잭션으로 몰래 결합시키지 않고 독립적으로 배포 가능한 상태로 유지하는 방법이다.</p>
        <h2>네 가지 질문으로 정리하는 판단 기준</h2>
        <p>지금 이 요청의 응답이 외부 BC의 데이터를 당장 필요로 하는가? 그렇다면 동기 호출이 필요하다. 호출당하는 BC가 실제로 상태를 변경하는가, 아니면 단순히 읽히기만 하는가? 동기 호출을 통한 상태 변경이라면, 두 BC를 하나의 트랜잭션으로 묶는 것에서 한 걸음밖에 떨어져 있지 않은 셈이다 — 대개는 다시 생각해봐야 한다는 신호다. 외부 호출이 실패하면 현재 트랜잭션이 롤백되어야 하는가? 그렇지 않다면 — 즉 최종적 일관성(eventual consistency)으로 충분하다면 — 그것은 비동기 쪽으로 강하게 기우는 신호다. 그리고 호출 방향이 본질적으로 "듣고 있는 누구에게든 알린다" 같은 일방향인가? 그것은 요청이 아니라 이벤트다.</p>
        <blockquote>외부 BC에서 필요한 것이 읽기가 아니라 상태 변경이라면, 동기 호출로 두 BC를 하나의 트랜잭션에 묶지 마라. 각 BC가 Integration Event를 통해 독립적으로 처리하게 하라.</blockquote>
        <h2>동기 방식: Adapter 패턴</h2>
        <p>현재 요청 안에서, 외부 BC의 서비스로부터 즉시 뭔가를 조회해야 할 때 사용한다. 사용자 이름을 포함해야 하는 주문 상세 응답이나, 결제를 처리하기 전의 잔액 확인 — 둘 다 현재 요청이 끝나기 전에 답을 필요로 한다.</p>
        <pre><code>{`[Order BC Application] → UserAdapter (interface) → UserAdapterImpl → [User BC Service]
                         (my application/adapter/)  (my infrastructure/)`}</code></pre>
        <p>Adapter는 Anticorruption Layer 역할을 한다. 외부 BC의 모델이나 인터페이스가 형태를 바꾸더라도, 이쪽의 내부 도메인 모델은 영향을 받지 않는다 — 그 변환이 일어나는 곳이 바로 Adapter이며, 모든 호출 지점에 흩어지는 대신 한 곳에서 딱 한 번 처리된다. 주의해야 할 두 가지가 있다: 외부 BC의 Repository나 Service를 Application 계층에 직접 주입하지 말 것 — 항상 Adapter 인터페이스를 거칠 것 — 그리고 Adapter를 통해 외부 BC의 쓰기(write) 메서드를 호출하지 말 것. 정말로 쓰기가 필요하다면, 그것이 바로 Integration Event로 전환해야 한다는 신호다.</p>
        <p>이건 기계적으로 검사할 수 있을 만큼 정확히 정의된 규칙이다: nestjs harness의 <code>no-cross-bc-repository-in-application</code> 규칙은 <code>application/**/*.ts</code> 파일이 다른 BC의 <code>domain/*-repository.ts</code>를 직접 import하면 이를 잡아낸다 — <em>같은</em> 도메인 안에서 Repository를 import하는 정상적인 패턴은 대상이 아니다.</p>
        <h2>비동기 방식: Integration Event</h2>
        <p>이 BC 자신의 도메인 작업이 끝난 뒤, 외부 BC가 반응해서 자기 자신의 상태를 바꿔야 할 때 사용한다 — 주문이 취소된 뒤 Payment BC가 환불을 처리해야 하는 경우, 주문이 완료된 뒤 Notification BC가 이메일을 보내야 하는 경우가 그렇다. 둘 다 원래 요청을 막아설 필요가 없다.</p>
        <pre><code>{`[Order BC] → Domain Event → Application EventHandler → Integration Event → Outbox → message queue
                                                                                      ↓
                                                              [Payment BC] ← IntegrationEventController`}</code></pre>
        <p>Integration Event는 내부 Domain Event를 있는 그대로 외부에 노출하지 않는다 — Application EventHandler가 바로 그 변환 지점이며, Adapter와 같은 anticorruption 개념을 반대 방향으로 적용한 것이다. 그리고 수신 측은 at-least-once 전달을 전제해야 하므로, 처리를 멱등(idempotent)하게 구현한다. 신뢰할 수 있는 이벤트 기반 설계 전반에서 다뤄지는 것과 정확히 같은 원칙이다.</p>
        <h2>실제 보상 트랜잭션 사례</h2>
        <p>Payment BC는 동기 Adapter를 통해 계정의 활성 상태와 잔액을 확인한 다음, 결제를 완료 처리한다(<code>payment.completed.v1</code> 발행). Account BC는 그 이벤트를 구독해 실제 차감을 수행한다 — 동기 확인과 비동기 차감 사이에 짧은 최종적 일관성 구간이 존재하는데, 이 간극은 실수가 아니라 명시적으로 받아들인 설계 결정이다.</p>
        <p>결제가 나중에 취소되면(<code>payment.cancelled.v1</code>) Account BC는 같은 방식으로 구독해, 이미 차감된 금액을 되돌리는 보상 입금(compensating credit)을 실행한다 — 트랜잭션 롤백이 아니라, 이전 상태 변경을 제자리에서 되돌리는 대신 그것을 상쇄하는 새로운 비동기 이벤트라는 점에서 전형적인 크로스 BC 보상 트랜잭션이다. 환불 승인(<code>refund.approved.v1</code>) 역시 정확히 같은 반응 로직을 재사용한다. 실제 구현은 <code>implementations/nestjs/examples/src/account/interface/integration-event/account-integration-event-controller.ts</code>와 <code>implementations/nestjs/examples/src/payment/application/event/</code>에 있다.</p>
        <h2>하나의 유스케이스에서 두 방식을 함께 쓰기</h2>
        <p>하나의 Command Handler가 작업의 서로 다른 부분에 두 패턴을 함께 쓰는 일은 흔하다 — 응답이 지금 당장 필요로 하는 것에는 동기 조회를, 그렇지 않은 후속 반응에는 비동기 후속 처리를:</p>
        <pre><code>{`public async cancelOrder(command: CancelOrderCommand): Promise<void> {
  // 1. A synchronous lookup via an Adapter (needed for the response)
  const user = await this.userAdapter.findUsers({ userId: command.userId, take: 1, page: 0 })
                  .then((r) => r.users.pop())
  if (!user) throw new Error('User not found.')

  const order = await this.orderRepository.findOrders({ orderId: command.orderId, take: 1, page: 0 })
                  .then((r) => r.orders.pop())
  if (!order) throw new Error('Order not found.')

  order.cancel(command.reason)

  // 2. save → Domain Event → Integration Event (requesting a refund from the Payment BC is asynchronous)
  await this.transactionManager.run(async () => {
    await this.orderRepository.saveOrder(order)
  })
}`}</code></pre>
        <h2>고전적인 Context Map 패턴과의 대응 관계</h2>
        <p>Context Mapping 용어를 이미 알고 있다면, 위의 두 패턴은 그 구체적인 구현체다. Anticorruption Layer는 곧 Adapter로, 외부 모델로부터의 오염을 막는다. Published Language를 갖춘 Open Host Service는 <code>order.cancelled.v1</code>처럼 명시적인 버전과 함께 Integration Event를 발행하는 것에 해당한다. Conformist는 Adapter 없이 외부 BC의 모델을 그대로 사용하는 것으로 — 권장되지 않으며, 대개 경계가 서둘러 그어졌다는 신호다. Customer-Supplier는 흔히 두 패턴이 함께 조합된 형태로 나타나는데, 위의 보상 트랜잭션 예시가 정확히 그런 경우다.</p>
        <p>이 중 어느 것도 시작 단계부터 메시지 브로커를 필요로 하지 않는다. 단일 배포 단위 안에서도 같은 원칙을 지키는 것 — 조회를 위한 진짜 Adapter 인터페이스, 반응을 위한 진짜 이벤트 계약 — 이 나중에 BC를 별도 서비스로 분리할 때 그 작업을 재작성이 아니라 리팩터링으로 만들어준다.</p>
        <div className="article-note"><strong>저장소 내 추가 자료</strong><p>
          <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/docs/architecture/cross-domain-communication.md" target="_blank" rel="noreferrer">docs/architecture/cross-domain-communication.md</a> — 전체 판단 기준표와 Context Map 대응 관계 · <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/implementations/nestjs/examples/src/account/interface/integration-event/account-integration-event-controller.ts" target="_blank" rel="noreferrer">account-integration-event-controller.ts</a> — 실제 보상 입금(compensating credit) 반응 로직
        </p></div>
      </>
    ),
  },
};

export default function TalkingAcrossBoundedContexts() {
  const { locale } = useLocale();
  const c = content[locale];

  return (
    <PostLayout slug="talking-across-bounded-contexts" kicker={c.kicker} title={c.title} lede={c.lede}>
      {c.body}
    </PostLayout>
  );
}
