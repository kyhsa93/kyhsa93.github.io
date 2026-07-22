import PostLayout from '../../components/PostLayout';

export default function ReliableEventDrivenSystems() {
  return (
    <PostLayout
      kicker="Event-driven · Backend"
      title={<>Reliability in<br /><em>Event-Driven Systems</em></>}
      lede="Having a message broker doesn't mean events are delivered safely. When you design assuming loss, duplication, and reordering as givens, a system can recover to a consistent state even after failures."
      date="2026.07.19"
      readMinutes={12}
    >
      <p>Event-driven architecture lowers coupling between services and enables independent scaling. But unlike a synchronous call where a request is immediately followed by a response, it's hard to see at a glance how far an event has traveled once it's published. The database write might succeed while the event publish fails, a consumer might receive the same message twice, or a consumer that paused for a while might process a stale event later.</p>
      <p>Reliability isn't achieved by a single promise of “exactly-once delivery.” It's a combination of mechanisms that anticipate failure at every stage — storage, delivery, consumption, observation — and make it safe to redo the same work. This post walks through, in order, the problems you run into most often in practice.</p>
      <h2>Align on This First: Delivery Guarantees and Processing Guarantees Are Different</h2>
      <p>A message broker's at-least-once delivery means it retries until the message reaches the consumer at least once. But if the consumer dies right after saving the processing result and before sending its acknowledgment, the broker resends the same message. In other words, guaranteed delivery does not guarantee that the business operation runs only once.</p>
      <p>In practice, it's more realistic to accept at-least-once delivery and make the consumer idempotent, aiming for effectively-once processing. Idempotency means that processing the same input multiple times produces the same observable result as processing it once. This boundary matters most for operations with external effects, like approving a payment, awarding points, or sending an email.</p>
      <h2>1. Handle the DB Write and the Event Publish Together</h2>
      <p>The simplest code — save the order, then publish the event — has two failure windows. If the process dies after the DB write, the event is lost; if the event is sent first and the DB write then fails, an event for a nonexistent order is delivered. You could tie the two systems together with a distributed transaction, but the operational complexity and availability cost are high.</p>
      <p>The Outbox pattern stores the domain data and the event to be published in the same local transaction. A separate worker reads not-yet-published Outbox records, sends them to the broker, and flips them to published once that succeeds. This approach may deliver events late, but it eliminates the window where they get lost.</p>
      <h3>Example: Transactional Outbox</h3>
      <pre><code>{`async function placeOrder(command: PlaceOrder) {
  await db.transaction(async (tx) => {
    const order = Order.place(command);
    await orderRepository.save(tx, order);

    await outboxRepository.append(tx, {
      id: crypto.randomUUID(),
      topic: 'orders.placed',
      key: order.id,
      payload: { orderId: order.id, customerId: order.customerId },
      occurredAt: new Date(),
    });
  });
}

async function publishOutbox() {
  for (const event of await outboxRepository.findUnpublished()) {
    await broker.publish(event.topic, event.key, event.payload);
    await outboxRepository.markPublished(event.id);
  }
}`}</code></pre>
      <p>If the worker dies after sending to the broker but before marking it complete, the same event can be published again. So the Outbox alone can't eliminate duplicates. Instead, the publishing side must provide a stable event ID and key, and the consuming side must handle duplicates safely.</p>
      <h2>2. Consumers Store an Idempotency Key</h2>
      <p>The simplest approach is to record the event ID as a processing history. Before doing the work, the consumer checks whether that ID has already been processed, then saves the result and the ID in the same transaction. Using a database unique constraint lets only one of several consumer instances succeed, even if they all receive the same message at once.</p>
      <h3>Example: A Consumer That Ignores Duplicate Events</h3>
      <pre><code>{`async function handlePaymentApproved(event: PaymentApproved) {
  await db.transaction(async (tx) => {
    const alreadyProcessed = await inboxRepository.exists(tx, event.id);
    if (alreadyProcessed) return;

    const order = await orderRepository.findById(tx, event.orderId);
    order.markPaid(event.approvedAt);
    await orderRepository.save(tx, order);

    // Put a unique index on event_id.
    await inboxRepository.record(tx, event.id, 'payment-service');
  });
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
    </PostLayout>
  );
}
