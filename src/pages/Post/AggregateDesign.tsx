import PostLayout from '../../components/PostLayout';

export default function AggregateDesign() {
  return (
    <PostLayout
      kicker="DDD · Tactical Design"
      title={<>Designing Aggregates:<br /><em>Transaction Boundaries and Invariants</em></>}
      lede="An Aggregate isn't a folder for related data — it's the boundary of a transaction and the owner of an invariant. Get the boundary wrong, and every save becomes a negotiation between models that shouldn't know about each other."
      date="2026.07.22"
      readMinutes={13}
    >
      <p>Once you've settled a Bounded Context's boundary, the next question is what happens inside it. This is where tactical design lives: Aggregate, Entity, Value Object, Domain Event. Of these, the Aggregate Root decision matters most, because it's the one thing that quietly determines your transaction size, your lock contention, and how many other objects a single save has to know about.</p>
      <h2>The Aggregate Root's Job</h2>
      <p>An Aggregate Root encapsulates business rules and invariants. Nothing outside it changes its internal state directly — a change always goes through one of its own domain methods, and a violated invariant throws immediately, inside that method, not somewhere downstream.</p>
      <pre><code>{`export class Order {
  public readonly orderId: string
  public readonly userId: string
  public readonly items: OrderItem[]
  private _status: 'pending' | 'paid' | 'cancelled'
  private readonly _events: OrderDomainEvent[] = []

  constructor(params: { orderId: string; userId: string; items: OrderItem[]; status: 'pending' | 'paid' | 'cancelled' }) {
    if (params.items.length === 0) throw new Error('An order must have at least one item.')
    this.orderId = params.orderId
    this.userId = params.userId
    this.items = params.items
    this._status = params.status
  }

  get status() { return this._status }
  get domainEvents() { return [...this._events] }

  public cancel(reason: string): void {
    if (this._status === 'cancelled') throw new Error('This order has already been cancelled.')
    if (this._status === 'paid') throw new Error('A paid order cannot be cancelled.')
    this._status = 'cancelled'
    this._events.push(new OrderCancelled({ orderId: this.orderId, reason, cancelledAt: new Date() }))
  }
}`}</code></pre>
      <p>An Application Service never carries out business logic itself — it delegates to an Aggregate method and nothing more. If you find yourself writing an <code>if</code> statement about the domain inside a Command Service, that logic almost certainly belongs one layer down.</p>
      <h2>Reference Other Aggregates by ID, Never by Object</h2>
      <p>The transaction boundary is set at the Aggregate Root level — only one Aggregate changes per transaction. That's only possible if Aggregates don't hold direct object references to each other. <code>Order</code> holds a <code>userId: string</code>, never a <code>User</code> object. An object reference creates coupling that an ID reference avoids: loading one Aggregate never cascades into loading a graph of others just to satisfy a type.</p>
      <h2>Entities and Value Objects Live at the Same Layer, With Different Contracts</h2>
      <p>An Entity's equality is judged by a unique identifier — two objects with the same ID are the same object even if every other field differs, and it has a lifecycle: created, modified, deleted. A child Entity inside an Aggregate, like an <code>OrderItem</code>, is only ever accessed and modified through the Aggregate Root that owns it.</p>
      <p>A Value Object has no identifier at all — its equality is judged by the combination of its values, and it's immutable.</p>
      <pre><code>{`export class Money {
  public readonly amount: number
  public readonly currency: 'KRW' | 'USD'

  constructor(amount: number, currency: 'KRW' | 'USD') {
    if (amount < 0) throw new Error('The amount must be 0 or greater.')
    this.amount = amount
    this.currency = currency
  }

  equals(other: Money): boolean {
    return this.amount === other.amount && this.currency === other.currency
  }

  add(other: Money): Money {
    if (this.currency !== other.currency) throw new Error('The currencies are different.')
    return new Money(this.amount + other.amount, this.currency)
  }
}`}</code></pre>
      <p>Reach for a Value Object whenever an object's attributes alone convey its meaning and it doesn't need an identifier — an amount, an address, a coordinate pair — and whenever immutability needs to be guaranteed.</p>
      <h2>Deciding Where the Boundary Goes</h2>
      <p>Group objects into the same Aggregate when they're created and deleted together, and when they must always change together to keep an invariant intact — <code>Order</code> and <code>OrderItem</code>, because an order with no items isn't a valid order. Split them into separate Aggregates when they're looked up and modified independently, and a change on one side doesn't touch the other's invariants — <code>Order</code> and <code>User</code>, because cancelling an order doesn't affect the user's info at all.</p>
      <div className="article-note"><strong>Signs an Aggregate has grown too large</strong><p>A single save method changes dozens of rows. It directly contains another Aggregate as an object, not just an ID. Optimistic-lock conflicts start happening often. Any of these is a signal to look for a seam, not to add more indexes.</p></div>
      <p>When the boundary genuinely isn't clear, start small. Merging two Aggregates later, once you've watched how they actually change in production, is a far cheaper move than trying to split an overgrown one apart under load.</p>
      <h2>Generating the Aggregate's Own ID</h2>
      <p>The ID is generated in the Domain layer — inside the Aggregate's constructor — and the server always generates it, never a client-supplied value. The format is a UUID v4 with hyphens stripped, a 32-character hex string, not an auto-increment number: an incrementing ID exposes record count and creation order externally, can collide across services or shards, and isn't determined until the DB assigns it, so it can never be pre-generated where the Domain layer needs it.</p>
      <pre><code>{`// common/generate-id.ts
import { randomUUID } from 'crypto'

export function generateId(): string {
  return randomUUID().replace(/-/g, '')
}

// domain/order.ts
export class Order {
  public readonly orderId: string

  constructor(params: {
    orderId?: string   // omit on new creation, passed in on DB restoration
    userId: string
  }) {
    this.orderId = params.orderId ?? generateId()
  }
}`}</code></pre>
      <p>On new creation, omitting <code>orderId</code> lets the constructor assign it automatically; on restoring from the DB, the Repository implementation passes the existing ID straight through. Either way, the Repository never issues a fresh ID of its own — it uses whatever ID the Aggregate already carries.</p>
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
    </PostLayout>
  );
}
