import PostLayout from '../../components/PostLayout';

export default function TypedErrorsAndResponseSchemas() {
  return (
    <PostLayout
      kicker="API Design · Conventions"
      title={<>Typed Errors and a<br /><em>Consistent Response Schema</em></>}
      lede="throw new Error('Order not found.') looks completely fine until a second person writes the string slightly differently somewhere else, and now the same failure produces two different codes depending on which file threw it."
      date="2026.07.22"
      readMinutes={12}
    >
      <p>Error handling has a clean layer split: the Domain and Application layers throw a plain <code>Error</code>, never a framework-specific HTTP exception, and the Interface layer — the Controller — is the only place that catches an error and converts it into an HTTP status code. That separation keeps Domain and Application free of any HTTP dependency at all, and concentrates the one messy job, "translate this into a status code," in exactly one place.</p>
      <pre><code>{`// domain/order.ts — inside the Aggregate
if (this._status === 'cancelled') throw new Error(OrderErrorMessage['This order has already been cancelled.'])

// application/command/order-command-service.ts
if (!order) throw new Error(OrderErrorMessage['Order not found.'])`}</code></pre>
      <h2>Why the Message Is an Enum Key, Not a Free-Form String</h2>
      <pre><code>{`export enum OrderErrorMessage {
  'Order not found.' = 'Order not found.',
  'This order has already been cancelled.' = 'This order has already been cancelled.',
  'A paid order cannot be cancelled.' = 'A paid order cannot be cancelled.',
  'An order must have at least one item.' = 'An order must have at least one item.',
}`}</code></pre>
      <p>The Interface layer's conversion works by comparing <code>error.message</code> against these enum values at runtime:</p>
      <pre><code>{`// The Interface layer's mapping
[OrderErrorMessage['Order not found.'], 404, OrderErrorCode.ORDER_NOT_FOUND]
//  ↑ the enum key (checked at compile time)      ↑ this value is compared against error.message at runtime`}</code></pre>
      <p>If the key and the value diverged — if someone wrote the raw string directly instead of going through the enum — two things break silently. A typo in a hand-written <code>throw new Error('Order not fund.')</code> produces no compile error at all, because it's just a string literal. And separately, the Interface layer's comparison against <code>OrderErrorMessage['Order not found.']</code> now fails to match, so that error falls through to an unhandled 500 instead of the 404 it was supposed to become. Defining the key identical to the value forces every throw site to go <em>through</em> the enum key — <code>throw new Error(OrderErrorMessage['Order not found.'])</code> — which means the exact same typo now fails at compile time instead of surfacing as a wrong status code weeks later.</p>
      <h2>Codes Are a Second, Independent Axis</h2>
      <p>If the HTTP status code is the category, the error code is the precise cause — and it needs to be independent of the message text, because the client is expected to branch on <code>code</code>, not on parsing the message string, which can be translated or edited without warning.</p>
      <pre><code>{`export enum OrderErrorCode {
  ORDER_NOT_FOUND = 'ORDER_NOT_FOUND',
  ORDER_ALREADY_CANCELLED = 'ORDER_ALREADY_CANCELLED',
  ORDER_PAID_NOT_CANCELLABLE = 'ORDER_PAID_NOT_CANCELLABLE',
  ORDER_ITEMS_REQUIRED = 'ORDER_ITEMS_REQUIRED',
}`}</code></pre>
      <p>Codes are <code>SCREAMING_SNAKE_CASE</code>, unique across the whole project (add a domain prefix if two domains would otherwise collide), and every entry in a domain's error-message enum has exactly one code mapped to it — a 1:1 relationship, not a many-to-one shortcut.</p>
      <h2>Where the Conversion Actually Happens</h2>
      <pre><code>{`public async getOrder(param: GetOrderRequestParam): Promise<GetOrderResponseBody> {
  return this.orderQueryService.getOrder(param).catch((error) => {
    throw convertToHttpError(error.message, [
      [OrderErrorMessage['Order not found.'], 404, OrderErrorCode.ORDER_NOT_FOUND],
      [OrderErrorMessage['This order has already been cancelled.'], 400, OrderErrorCode.ORDER_ALREADY_CANCELLED]
    ])
  })
}`}</code></pre>
      <p>An error with no entry in this mapping table becomes a 500 Internal Server Error — which is the correct default, not a gap to patch over. An unmapped error means either a genuinely unexpected failure, or a domain error the Controller forgot to declare — either way, surfacing it as an opaque 500 rather than guessing at a status code is the honest behavior.</p>
      <h2>One Response Shape, Everywhere</h2>
      <pre><code>{`{
  "statusCode": 404,
  "code": "ORDER_NOT_FOUND",
  "message": "Order not found.",
  "error": "Not Found"
}`}</code></pre>
      <p>Four fields, every time: <code>statusCode</code> is the HTTP status; <code>code</code> is the stable value the client actually branches on; <code>message</code> is for display, sourced from the error-message enum; <code>error</code> is the HTTP status text. A validation failure gets a fixed code regardless of which field failed:</p>
      <pre><code>{`{
  "statusCode": 400,
  "code": "VALIDATION_FAILED",
  "message": ["orderId must be a string"],
  "error": "Bad Request"
}`}</code></pre>
      <h2>The Same Discipline on the Success Side</h2>
      <p>List responses use the plural of the domain object as the key — <code>orders</code>, <code>users</code>, <code>payments</code> — never a generic <code>result</code>, <code>data</code>, or <code>items</code>, alongside a <code>count</code> that reflects the total after filters, not just the current page's size:</p>
      <pre><code>{`{
  "orders": [
    { "orderId": "abc123", "status": "pending", "totalAmount": 30000 }
  ],
  "count": 42
}`}</code></pre>
      <p>A single-record response is returned as the domain object directly — never wrapped in a generic envelope like <code>{`{ success: true, data: { ... } }`}</code>. The HTTP status code already tells the client whether the request succeeded; an envelope duplicates that information and adds an unwrapping step to every client's code for no benefit.</p>
      <p>On the Repository side, this same "no generic key" discipline extends one layer further: a single-record lookup isn't a separate method at all. Callers pass <code>take: 1</code> to the same list-lookup method and pull the record out via <code>.then()</code>:</p>
      <pre><code>{`const order = await this.orderRepository
  .findOrders({ orderId, take: 1, page: 0 })
  .then((r) => r.orders.pop())

if (!order) throw new Error(OrderErrorMessage['Order not found.'])`}</code></pre>
      <p>Keeping a separate <code>findOne</code> would duplicate the dynamic filter-condition logic between two methods; unifying it into one path keeps there being exactly one place to add a new optional filter later.</p>
      <h2>Documenting the Contract This Implies</h2>
      <p>Every non-2xx status a handler can actually return should be declared in the API documentation, cross-checked against that handler's own error-mapping table — not just the success response. This is the single most common way API docs quietly rot: the docs UI renders, the endpoint appears "documented," but nothing tells a client what a 404 or 409 from that specific endpoint actually looks like, because only the happy path was ever written down.</p>
      <div className="article-note"><strong>Further reading in the repo</strong><p>
        <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/docs/architecture/error-handling.md" target="_blank" rel="noreferrer">docs/architecture/error-handling.md</a> — the full error-message/error-code enum pattern · <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/docs/architecture/api-response.md" target="_blank" rel="noreferrer">docs/architecture/api-response.md</a> — pagination, response shape, and the OpenAPI completeness bar
      </p></div>
    </PostLayout>
  );
}
