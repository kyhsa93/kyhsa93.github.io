import PostLayout from '../../components/PostLayout';

export default function FindingDomainBoundaries() {
  return (
    <PostLayout
      slug="finding-domain-boundaries"
      kicker="DDD · Architecture"
      title={<>Finding<br /><em>Domain Boundaries</em></>}
      lede="Dividing a domain well isn't about classifying nouns — it's about finding the boundary between change and responsibility. Before anything else, observe which things need to change together as features grow."
    >
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
      <pre><code>{`type OrderLine = {
  productId: string;
  quantity: number;
  unitPrice: number;
};

class Order {
  private events: unknown[] = [];
  private constructor(
    private readonly id: string,
    private readonly customerId: string,
    private readonly lines: OrderLine[],
  ) {}

  static place(id: string, customerId: string, lines: OrderLine[]) {
    if (lines.length === 0) throw new Error('At least one order line is required.');
    if (lines.some((line) => line.quantity <= 0)) {
      throw new Error('Quantity must be at least 1.');
    }
    const order = new Order(id, customerId, lines);
    order.events.push({ type: 'OrderPlaced', orderId: id });
    return order;
  }

  get totalAmount() {
    return this.lines.reduce(
      (total, line) => total + line.quantity * line.unitPrice, 0,
    );
  }
}`}</code></pre>
      <p>The key point of this code is that <code>Order</code> only knows its own invariants. Injecting an <code>InventoryRepository</code> or a payment SDK might look convenient, but then the order model would have to know about every external policy and failure. The moment that happens, the boundary blurs and testing becomes harder.</p>
      <h2>3. Note Where the Language Changes</h2>
      <p>When the same word starts meaning different things to different teams, that can be a signal of a Bounded Context. To customer support, an “order” might be the subject of a refund or inquiry; to logistics, it's a unit of packing and shipment. Trying to express both meanings with a single model just piles up fields and blurs the rules.</p>
      <p>Writing down the verbs people use during event storming or requirements workshops makes this difference clearer. In the order context, “create,” “cancel,” and “discount” matter; in the shipping context, “dispatch,” “ship,” and “track” take center stage. Rather than sharing a single <code>Order</code> class, letting each context express only the information it needs, in its own language, keeps the model simpler.</p>
      <p>The cost of translation between boundaries is not something to avoid — it's a mechanism that preserves intent. If the shipping service receives a <code>ShippingRequested</code> event instead of joining the orders table, it's less affected when the order's internal structure changes. An event should carry only the stable information the other model needs, and should avoid serializing internal objects as-is.</p>
      <h3>Example: Connecting Boundaries with Events</h3>
      <pre><code>{`type OrderPlaced = {
  type: 'OrderPlaced';
  orderId: string;
  customerId: string;
  items: Array<{ productId: string; quantity: number }>;
};

// The inventory context consumes the order event.
async function reserveStock(event: OrderPlaced) {
  const result = await inventory.reserve(event.items);

  if (!result.success) {
    await eventBus.publish({
      type: 'StockReservationFailed',
      orderId: event.orderId,
      reason: result.reason,
    });
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
    </PostLayout>
  );
}
