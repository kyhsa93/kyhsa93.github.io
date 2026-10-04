import PostLayout from '../../components/PostLayout';
import { useLocale, localeFromPathname } from '../../lib/locale';
import type { MetaFunction } from 'react-router';
import { createPostMeta } from '../../lib/seo';

export const meta: MetaFunction = ({ location }) =>
  createPostMeta('talking-across-bounded-contexts', localeFromPathname(location.pathname));

const content = {
  en: {
    kicker: 'DDD · Integration',
    title: (
      <>
        Talking Across<br /><em>Bounded Contexts</em>
      </>
    ),
    lede: "Once a Bounded Context boundary is real, the next question is unavoidable: how does one BC ask another for something, or tell it that something happened? There are two honest answers, and picking the wrong one for the situation is how a distributed system becomes a distributed monolith.",
    body: (
      <>
        <p>When one Bounded Context needs another, within the same process, there are two approaches: synchronous, through an Adapter, or asynchronous, through an Integration Event. Everything else (message brokers, sagas, choreography versus orchestration) is a variation on that choice. Getting it right per use case is what keeps BCs independently deployable instead of secretly coupled through a shared transaction.</p>
        <h2>The Decision, as Four Questions</h2>
        <p>Does the current request's response need data from the external BC right now? If yes, you need a synchronous call. Does the called BC change state, or just get read? A state change through a synchronous call means you're one step away from wrapping two BCs in a single transaction, usually a sign to reconsider. Must the current transaction roll back if the external call fails? If not, and eventual consistency is acceptable, that's a strong signal toward async. And is the call direction fundamentally one-way, like "notify whoever's listening"? That's an event, not a request.</p>
        <blockquote>If a state change (not a read) is needed in an external BC, don't wrap the two BCs in one transaction via a synchronous call. Let each BC process it independently, through an Integration Event.</blockquote>
        <h2>Synchronous: The Adapter Pattern</h2>
        <p>Used when you need to look something up immediately, within the current request, from an external BC's service. An order-detail response that needs to include the user's name, or a balance check before processing a payment; both need an answer before the current request can finish.</p>
        <pre><code>{`[Order BC Application] → UserAdapter (interface) → UserAdapterImpl → [User BC Service]
                         (my application/adapter/)  (my infrastructure/)`}</code></pre>
        <p>The Adapter acts as an Anticorruption Layer. Even if the external BC's model or interface changes shape, the internal domain model on this side is unaffected; the Adapter is where that translation happens, once, instead of scattered across every call site. Two things to watch for. Never inject an external BC's Repository or Service directly into the Application layer (always go through the Adapter interface), and never call an external BC's write methods through an Adapter. If a write is needed, that's the signal to switch to an Integration Event instead.</p>
        <p>This is precise enough to check mechanically: every language's harness has a <code>no-cross-bc-repository-in-application</code> rule that flags any Application-layer file that directly imports another BC's Repository. Importing a Repository within the <em>same</em> domain, the normal pattern, isn't a target.</p>
        <h2>Asynchronous: Integration Events</h2>
        <p>Used when, after this BC's own domain work completes, an external BC needs to react and change its own state. After an order is cancelled, the Payment BC needs to process a refund; after an order completes, the Notification BC needs to send an email. Neither of those needs to block the original request.</p>
        <pre><code>{`[Order BC] → Domain Event → Application EventHandler → Integration Event → Outbox → message queue
                                                                                      ↓
                                                              [Payment BC] ← IntegrationEventController`}</code></pre>
        <p>An Integration Event never exposes an internal Domain Event to the outside as-is. The Application EventHandler is the conversion point, the same anticorruption idea as the Adapter but running in the opposite direction. And because the receiving side must assume at-least-once delivery, it implements handling idempotently, the same discipline covered in reliable event-driven design generally.</p>
        <h2>A Compensating Action</h2>
        <p>The Payment BC checks the account's active status and balance via a synchronous Adapter, then marks the payment complete (publishing <code>payment.completed.v1</code>). The Account BC subscribes to that event and performs the deduction. There's a brief eventual-consistency window between the synchronous check and the asynchronous deduction, and that gap is an accepted, explicit design decision, not an oversight.</p>
        <p>If the payment is later cancelled (<code>payment.cancelled.v1</code>), the Account BC subscribes the same way and runs a compensating credit that reverses the amount already deducted. It's not a transaction rollback but a classic cross-BC compensating transaction: a new asynchronous event that offsets an earlier state change instead of undoing it in place. Refund approval (<code>refund.approved.v1</code>) reuses the same reaction. The implementation lives at <code>implementations/go/examples/internal/application/event/payment_cancelled_event_handler.go</code>, reacting to the <code>PaymentCancelledV1</code> Integration Event defined in <code>internal/application/integration-event/</code>.</p>
        <h2>Mixing Both in One Use Case</h2>
        <p>A single command handler routinely uses both patterns for different parts of its work. A synchronous lookup covers whatever the response needs right now, and an asynchronous follow-up covers whatever downstream reaction doesn't:</p>
        <pre><code>{`func (h *CancelOrderHandler) Handle(ctx context.Context, cmd CancelOrderCommand) error {
	// 1. A synchronous cross-BC lookup via an Adapter (needed for the response)
	user, err := h.userAdapter.FindUser(ctx, cmd.UserID)
	if err != nil {
		return fmt.Errorf("cancel order: %w", err)
	}
	if user == nil {
		return order.ErrUserNotFound
	}

	o, err := order.FindOne(ctx, h.orderRepository, cmd.OrderID, cmd.UserID)
	if err != nil {
		return fmt.Errorf("cancel order: %w", err)
	}

	if err := o.Cancel(cmd.Reason); err != nil {
		return err
	}

	// 2. save → Domain Event → Integration Event (requesting a refund from the Payment BC is asynchronous)
	return h.orderRepository.SaveOrder(ctx, o)
}`}</code></pre>
        <h2>Mapping to Classic Context Map Patterns</h2>
        <p>If you already know Context Mapping vocabulary, both patterns above are specific implementations of it. An Anticorruption Layer is the Adapter, preventing contamination from an external model. Open Host Service with a Published Language is publishing an Integration Event with an explicit version, like <code>order.cancelled.v1</code>. Conformist is using an external BC's model directly with no Adapter at all. It's not recommended, and usually a sign the boundary was drawn in a hurry. Customer-Supplier tends to show up as a combination of both patterns together, which is what the compensating-action example above is.</p>
        <p>None of this requires a message broker to start. Even inside a single deployable, keeping the same discipline (an Adapter interface for lookups, an event contract for reactions) is what makes splitting a BC out into its own service later a refactor instead of a rewrite.</p>
        <div className="article-note"><strong>Further reading in the repo</strong><p>
          <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/docs/architecture/cross-domain-communication.md" target="_blank" rel="noreferrer">docs/architecture/cross-domain-communication.md</a> — the full decision table and Context Map mapping · <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/implementations/go/examples/internal/application/event/payment_cancelled_event_handler.go" target="_blank" rel="noreferrer">payment_cancelled_event_handler.go</a> — the compensating-credit reaction
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
    lede: 'Bounded Context 경계를 제대로 그었다면 곧바로 다음 질문이 나온다. 한 BC가 다른 BC에 뭔가를 요청하거나 무슨 일이 있었다고 알리려면 어떻게 해야 할까? 솔직한 답은 둘뿐이다. 상황에 안 맞는 쪽을 고르면 분산 시스템은 티 나지 않게 분산 모놀리스가 된다.',
    body: (
      <>
        <p>같은 프로세스 안에서 한 Bounded Context가 다른 BC를 써야 할 때 방법은 두 가지다. Adapter로 동기 호출을 하거나, Integration Event로 비동기 처리를 한다. 메시지 브로커, Saga, 코레오그래피와 오케스트레이션 같은 나머지 이야기는 모두 이 선택을 변형한 것이다. 유스케이스마다 이 선택을 제대로 해야 BC들이 공유 트랜잭션으로 몰래 엮이지 않고, 저마다 따로 배포할 수 있는 상태로 남는다.</p>
        <h2>질문 네 개로 고르기</h2>
        <p>먼저, 지금 요청의 응답에 외부 BC의 데이터가 당장 필요한가? 그렇다면 동기 호출을 써야 한다. 다음으로, 호출받는 BC가 상태를 바꾸는가, 읽히기만 하는가? 동기 호출로 상태를 바꾼다면 두 BC를 한 트랜잭션으로 묶기 한 걸음 앞까지 온 셈이다. 대개는 설계를 다시 보라는 신호다. 외부 호출이 실패했을 때 지금 트랜잭션을 롤백해야 하는가? 그럴 필요가 없다면, 즉 최종적 일관성(eventual consistency)으로 충분하다면 비동기 쪽으로 기우는 게 맞다. 마지막으로, 호출이 "듣는 쪽이 누구든 알린다"처럼 원래 한 방향인가? 그렇다면 그건 요청이 아니고 이벤트다.</p>
        <blockquote>외부 BC에 필요한 게 읽기가 아니라 상태 변경이라면, 동기 호출로 두 BC를 한 트랜잭션에 묶지 않는다. Integration Event를 보내서 각 BC가 따로 처리하게 한다.</blockquote>
        <h2>동기 호출은 Adapter로</h2>
        <p>지금 요청을 처리하는 도중에 외부 BC의 서비스에서 바로 뭔가를 조회해야 할 때 쓴다. 주문 상세 응답에 사용자 이름을 넣어야 하거나, 결제 전에 잔액을 확인해야 하는 경우다. 둘 다 답을 받아야 지금 요청을 끝낼 수 있다.</p>
        <pre><code>{`[Order BC Application] → UserAdapter (interface) → UserAdapterImpl → [User BC Service]
                         (my application/adapter/)  (my infrastructure/)`}</code></pre>
        <p>Adapter는 Anticorruption Layer 역할을 한다. 외부 BC의 모델이나 인터페이스 모양이 바뀌어도 이쪽 내부 도메인 모델은 영향을 받지 않는다. 변환은 Adapter 한 곳에서만 일어나고, 호출하는 곳마다 흩어지지 않는다. 조심할 게 두 가지 있다. 외부 BC의 Repository나 Service를 Application 계층에 직접 주입하지 않고 늘 Adapter 인터페이스를 거친다. 그리고 Adapter로 외부 BC의 쓰기 메서드를 부르지 않는다. 쓰기가 꼭 필요하다면 Integration Event로 바꿀 때가 된 것이다.</p>
        <p>이 정도로 분명한 규칙이면 기계로 검사할 수 있다. 모든 언어의 harness에 <code>no-cross-bc-repository-in-application</code> 규칙이 있어서, Application 계층 파일이 다른 BC의 Repository를 직접 import하면 잡아낸다. <em>같은</em> 도메인 안의 Repository를 import하는 건 정상적인 패턴이라 대상에서 빠진다.</p>
        <h2>비동기 처리는 Integration Event로</h2>
        <p>이 BC의 도메인 작업이 끝난 뒤 외부 BC가 반응해서 자기 상태를 바꿔야 할 때 쓴다. 주문이 취소되면 Payment BC가 환불을 처리하고, 주문이 완료되면 Notification BC가 이메일을 보내는 식이다. 둘 다 원래 요청을 붙잡고 있을 이유가 없다.</p>
        <pre><code>{`[Order BC] → Domain Event → Application EventHandler → Integration Event → Outbox → message queue
                                                                                      ↓
                                                              [Payment BC] ← IntegrationEventController`}</code></pre>
        <p>Integration Event는 내부 Domain Event를 그대로 밖에 내보내지 않는다. 변환은 Application EventHandler에서 한다. Adapter와 같은 anticorruption 개념을 반대 방향으로 쓰는 셈이다. 받는 쪽은 at-least-once 전달을 전제해야 하므로 처리를 멱등(idempotent)하게 구현한다. 신뢰할 수 있는 이벤트 기반 설계에서 늘 요구하는 규칙과 같다.</p>
        <h2>보상 트랜잭션 사례</h2>
        <p>Payment BC는 동기 Adapter로 계정이 활성 상태인지, 잔액이 충분한지 확인한 다음 결제를 완료 처리한다(<code>payment.completed.v1</code> 발행). 실제 차감은 그 이벤트를 구독한 Account BC가 한다. 그래서 동기 확인과 비동기 차감 사이에는 최종적 일관성이 맞춰지기까지 짧은 틈이 생긴다. 이 틈은 놓친 게 아니고, 알고 받아들인 설계 결정이다.</p>
        <p>나중에 결제가 취소되면(<code>payment.cancelled.v1</code>) Account BC가 같은 방식으로 구독해서, 이미 빠져나간 금액을 되돌려 주는 보상 입금(compensating credit)을 실행한다. 트랜잭션을 롤백하는 게 아니다. 앞선 상태 변경을 그 자리에서 무르는 대신, 그 변경을 상쇄하는 비동기 이벤트를 새로 만든다. 전형적인 크로스 BC 보상 트랜잭션이다. 환불 승인(<code>refund.approved.v1</code>)도 똑같은 반응 로직을 그대로 쓴다. 구현은 <code>implementations/go/examples/internal/application/event/payment_cancelled_event_handler.go</code>에 있고, <code>internal/application/integration-event/</code>에 정의한 <code>PaymentCancelledV1</code> Integration Event에 반응한다.</p>
        <h2>한 유스케이스에서 두 방식 함께 쓰기</h2>
        <p>Command Handler 하나가 작업 부분마다 두 패턴을 섞어 쓰는 일은 흔하다. 응답에 당장 필요한 건 동기로 조회하고, 그렇지 않은 후속 반응은 비동기로 넘긴다. 다음 코드가 그런 예다.</p>
        <pre><code>{`func (h *CancelOrderHandler) Handle(ctx context.Context, cmd CancelOrderCommand) error {
	// 1. A synchronous cross-BC lookup via an Adapter (needed for the response)
	user, err := h.userAdapter.FindUser(ctx, cmd.UserID)
	if err != nil {
		return fmt.Errorf("cancel order: %w", err)
	}
	if user == nil {
		return order.ErrUserNotFound
	}

	o, err := order.FindOne(ctx, h.orderRepository, cmd.OrderID, cmd.UserID)
	if err != nil {
		return fmt.Errorf("cancel order: %w", err)
	}

	if err := o.Cancel(cmd.Reason); err != nil {
		return err
	}

	// 2. save → Domain Event → Integration Event (requesting a refund from the Payment BC is asynchronous)
	return h.orderRepository.SaveOrder(ctx, o)
}`}</code></pre>
        <h2>Context Map 패턴으로 옮겨 보면</h2>
        <p>Context Mapping 용어를 안다면, 위의 두 패턴이 그 용어를 구체적으로 구현한 것임을 알 수 있다. Anticorruption Layer는 Adapter다. 외부 모델이 안으로 번지는 걸 막는다. Published Language를 갖춘 Open Host Service는 <code>order.cancelled.v1</code>처럼 버전을 명시해 Integration Event를 발행하는 것이다. Conformist는 Adapter 없이 외부 BC의 모델을 그대로 쓰는 것이다. 권하지 않는 방식이고, 대개 경계를 서둘러 그었다는 신호다. Customer-Supplier는 흔히 두 패턴을 함께 쓰는 모양으로 나타나는데, 위의 보상 트랜잭션 예시가 딱 그렇다.</p>
        <p>처음부터 메시지 브로커가 있어야 하는 것도 아니다. 배포 단위가 하나뿐이어도 같은 규칙을 지키면 된다. 조회에는 제대로 된 Adapter 인터페이스를 두고, 반응에는 제대로 된 이벤트 계약을 둔다. 그래야 나중에 BC를 별도 서비스로 떼어 낼 때 다시 짜지 않고 리팩터링으로 끝낼 수 있다.</p>
        <div className="article-note"><strong>저장소에서 더 볼 것</strong><p>
          <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/docs/architecture/cross-domain-communication.md" target="_blank" rel="noreferrer">docs/architecture/cross-domain-communication.md</a>(판단 기준표 전체와 Context Map 대응 관계) · <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/implementations/go/examples/internal/application/event/payment_cancelled_event_handler.go" target="_blank" rel="noreferrer">payment_cancelled_event_handler.go</a>(보상 입금 반응 로직)
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
