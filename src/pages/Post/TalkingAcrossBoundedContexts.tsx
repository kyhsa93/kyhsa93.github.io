import PostLayout from '../../components/PostLayout';

export default function TalkingAcrossBoundedContexts() {
  return (
    <PostLayout
      slug="talking-across-bounded-contexts"
      kicker="DDD · Integration"
      title={<>Talking Across<br /><em>Bounded Contexts</em></>}
      lede="Once a Bounded Context boundary is real, the next question is unavoidable: how does one BC ask another for something, or tell it that something happened? There are exactly two honest answers, and picking the wrong one for the situation is how a distributed system quietly becomes a distributed monolith."
    >
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
    </PostLayout>
  );
}
