import PostLayout from '../../components/PostLayout';

export default function CqrsInPractice() {
  return (
    <PostLayout
      kicker="CQRS · Architecture"
      title={<>CQRS in Practice:<br /><em>Why a Query Can't Use a Repository</em></>}
      lede="CQRS sounds like an architecture decision you make once, up front. In practice it's a boundary you have to keep re-enforcing — because the easiest possible way to satisfy a new read requirement is always to reach for the write-side Repository that's already sitting right there."
      date="2026.07.22"
      readMinutes={13}
    >
      <p>CQRS — Command Query Responsibility Segregation — separates the responsibilities of writing and reading. It keeps the same underlying principles as the base architecture: the Domain layer stays independent, an Aggregate encapsulates business rules, and the Repository pattern holds. What changes is that use cases get split into an independent Command side and Query side, each with its own model.</p>
      <h2>Two Levels of CQRS</h2>
      <p>Splitting an Application Service into a Command Service and a Query Service is already a lightweight form of CQRS, and it's enough for most domains. Handler-based CQRS — introducing a Command Bus / Query Bus and splitting each use case into its own Handler class — is worth adopting once the Service class is getting bloated with too many use cases, or once the write and read models genuinely need to be separate stores. With few use cases and a Service class that's staying simple, the lighter form is enough; don't reach for Handlers just because the pattern has a name.</p>
      <pre><code>{`src/
  <domain>/
    domain/                              # unchanged
    application/
      command/
        cancel-order-command.ts          # a Command object (the input)
        cancel-order-command-handler.ts  # a CommandHandler (the write logic)
      query/
        order-query.ts                   # the Query interface (abstract class)
        get-orders-query.ts              # a Query object (the input)
        get-orders-query-handler.ts      # a QueryHandler (the read logic)
    interface/
      order-controller.ts                # calls the CommandBus / QueryBus`}</code></pre>
      <h2>The Rule That's Easy to State and Easy to Violate</h2>
      <p>A QueryHandler uses a read-only interface — an <code>OrderQuery</code>, not an <code>OrderRepository</code>. It queries the DB directly, with no Aggregate reconstitution.</p>
      <pre><code>{`// application/query/order-query.ts — the Query interface (abstract class)
export abstract class OrderQuery {
  abstract getOrders(query: GetOrdersQuery): Promise<GetOrdersResult>
  abstract getOrder(query: GetOrderQuery): Promise<GetOrderResult>
}

// infrastructure/order-query-impl.ts — the implementation (direct DB access)
export class OrderQueryImpl extends OrderQuery {
  public async getOrders(query: GetOrdersQuery): Promise<GetOrdersResult> {
    // a query optimized for reading, with no Aggregate reconstitution
  }
}`}</code></pre>
      <pre><code>{`// application/query/get-orders-query-handler.ts
export class GetOrdersQueryHandler {
  constructor(private readonly orderQuery: OrderQuery) {}

  public async execute(query: GetOrdersQuery): Promise<GetOrdersResult> {
    return this.orderQuery.getOrders(query)
  }
}`}</code></pre>
      <p>This looks like a naming nuance — <code>OrderQuery</code> instead of <code>OrderRepository</code> — and that's exactly what makes it easy to violate without anyone noticing. The Repository is already injected into the Command side, already tested, already has a <code>findOrders</code> method that returns exactly what a list screen needs. Reaching for it in a Query Handler compiles fine, passes review, and quietly reopens a door CQRS exists to close: the read path now has write capability sitting right next to it, and the two models are no longer actually separate.</p>
      <h2>A Real Case Where This Went Wrong — and the Doc Agreed</h2>
      <p>A cross-implementation audit of this repo's five language ports once turned up this exact bug for real, and in a way worth being specific about, because it's more instructive than the abstract warning above. In the FastAPI implementation, a Query Handler was directly injected with the write-capable Repository — there was no separate read interface at all. That alone would be a straightforward fix. What made it a structural problem rather than a one-off slip was that FastAPI's own <code>cqrs-pattern.md</code> had documented this exact code as the correct example. The doc and the code agreed with each other and were both wrong.</p>
      <p>That's a failure mode no "does the code match its own docs" audit can ever catch, by construction — the audit only checks agreement, and here the doc and the code were in perfect agreement about the wrong thing. It took checking the code against the <em>root</em> principle, not the local doc, to surface it. Two other languages had softer versions of the same drift: one Query Service had been fixed while a second, structurally identical Query Service in the same codebase was left on the old pattern; two more had already separated Command and Query functionally but named the Query interface <code>XxxQueryRepository</code>, which quietly reintroduces the word this pattern exists to keep out of the read path's vocabulary.</p>
      <div className="article-note"><strong>Why this kept slipping through</strong><p>No harness rule existed yet that specifically flagged a Repository type showing up inside <code>application/query/</code>. Structural checks — is there a domain folder, does the interface layer avoid infrastructure imports — don't catch a wrong dependency choice one layer down. Once a rule was written for exactly this shape, it caught the same violation independently in three more languages the very first time it ran.</p></div>
      <h2>The Interface Layer Barely Changes</h2>
      <p>From the Controller's side, adopting CQRS is mostly a routing change — call the right bus instead of the right service method:</p>
      <pre><code>{`public async cancelOrder(param: CancelOrderRequestParam): Promise<void> {
  return commandBus.execute(new CancelOrderCommand(param))
    .catch((error) => { throw convertToHttpError(error) })
}

public async getOrders(query: GetOrdersRequestQuerystring): Promise<GetOrdersResponseBody> {
  return queryBus.execute(new GetOrdersQuery(query))
    .catch((error) => { throw convertToHttpError(error) })
}`}</code></pre>
      <p>A Domain Event still doesn't use an in-process event bus for cross-cutting follow-up work — it's delivered through the Outbox → message queue → EventConsumer path, the same as in the base architecture. CQRS changes how a single request is routed to its handler; it doesn't change how a fact that already happened gets communicated afterward.</p>
      <h2>What CQRS Doesn't Change</h2>
      <p>Both the base architecture and Handler-based CQRS keep Domain-layer independence, Aggregate encapsulation, and the Repository pattern exactly the same. CQRS is a routing and read-model decision sitting on top of that foundation, not a replacement for it — which is precisely why a Query Handler reaching for a Repository is so easy to write and so easy to miss: everything underneath it still compiles, still passes the unit tests, and still looks, at a glance, like the same architecture it's quietly no longer following.</p>
      <div className="article-note"><strong>Further reading in the repo</strong><p>
        <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/docs/architecture/cqrs-pattern.md" target="_blank" rel="noreferrer">docs/architecture/cqrs-pattern.md</a> — the full Command/Query/Handler structure · <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/docs/architecture/repository-pattern.md" target="_blank" rel="noreferrer">docs/architecture/repository-pattern.md</a> — the Repository pattern the Query side deliberately avoids
      </p></div>
    </PostLayout>
  );
}
