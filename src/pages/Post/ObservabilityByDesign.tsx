import PostLayout from '../../components/PostLayout';

export default function ObservabilityByDesign() {
  return (
    <PostLayout
      slug="observability-by-design"
      kicker="Observability · Operations"
      title={<>Observability Is a<br /><em>Design Decision, Not an Afterthought</em></>}
      lede="Adding a logging library is easy. Deciding what belongs at which level, in which layer, and how to trace one request across a dozen log lines is the part that actually determines whether an incident takes five minutes or five hours to diagnose."
    >
      <p>Observability tends to get treated as infrastructure you bolt on — pick a logging library, wire up a dashboard, done. The parts that actually matter are decisions, not tools: what gets logged at what level, which layer is responsible for logging what, and how a single request's story stays traceable once it's scattered across dozens of log lines from multiple processes.</p>
      <h2>Five Levels, Strictly Enforced</h2>
      <p><code>error</code> is for request-handling failures and external system outages — a DB connection failure, an external API returning 5xx, an unhandled exception. <code>warn</code> is for normal operation that still needs attention — a call to a deprecated endpoint, a retry occurring, approaching a threshold. <code>log</code> covers key business events and state changes — an order created, a payment completed, the app starting or stopping. <code>debug</code> is detailed info for development — query parameters, intermediate computed results. <code>verbose</code> is maximum detail, like a full request/response payload.</p>
      <p>Production emits only <code>error</code>, <code>warn</code>, and <code>log</code>. Development and staging emit everything. Unnecessary logging in production doesn't just cost money — it buries the important lines in noise exactly when you need to find them fastest.</p>
      <h2>Who Logs What</h2>
      <p>The Interface layer (a Controller) logs request errors, caught in a catch block. The Application layer logs business events and the results of external system calls. Infrastructure logs external-integration failures and retries, and abnormal query performance. The Domain layer never logs, full stop — it stays framework-independent, and the result of domain logic gets logged one layer up, in the Application layer that called it.</p>
      <pre><code>{`// forbidden — using a logger/framework in the Domain layer
import { Logger } from '@nestjs/common'  // forbidden

export class Order {
  private readonly logger = new Logger(Order.name)  // forbidden
  public cancel(reason: string): void {
    this.logger.log('Order cancelled')  // forbidden
    ...
  }
}`}</code></pre>
      <p>This isn't a purity rule for its own sake. A Domain layer that logs has taken a framework dependency it's supposed to have none of, and now every domain unit test has to either mock a logger or tolerate log noise it never asked for.</p>
      <h2>Structured Logs, and Why the Field Names Matter</h2>
      <p>When integrating with an external monitoring system — Datadog, CloudWatch, Grafana Loki — logs should be structured JSON, with field names in <code>snake_case</code>:</p>
      <pre><code>{`// a business-event log
logger.log({ message: 'Order created', order_id: orderId, user_id: userId, amount })

// an error log
logger.error({ message: 'SQS send failed', event_id: event.eventId, error })`}</code></pre>
      <p>The reason for <code>snake_case</code> specifically, not camelCase, is unglamorous but concrete: most monitoring platforms parse snake_case fields by default. A field-name mismatch doesn't just look inconsistent — it silently breaks indexing, so a query that should find every log for a given <code>order_id</code> quietly returns nothing.</p>
      <h2>Correlation ID: Making One Request Traceable Across Everything</h2>
      <p>To trace a single request across multiple services in logs, every log entry includes a Correlation ID. If the client sends an <code>x-correlation-id</code> header, it's used as-is; otherwise the server generates one. The header is forwarded on every downstream call, and returned in the response too.</p>
      <p>The ID is generated or extracted at the request entry point — the Interface layer — and propagated via <code>AsyncLocalStorage</code>, so every later layer can read the current request's Correlation ID with no argument threaded through function signatures:</p>
      <pre><code>{`const correlationStorage = new AsyncLocalStorage<string>()

// at request entry
const correlationId = request.headers['x-correlation-id'] ?? generateId()
correlationStorage.run(correlationId, () => handleRequest())

// when logging, anywhere downstream
const correlationId = correlationStorage.getStore()
logger.log({ message: '...', correlation_id: correlationId })`}</code></pre>
      <p>This is the exact same shape as the request-scoped user-context pattern used for authentication — a value generated once at the edge, read from storage everywhere else, with no request object passed around to get at it. The two problems (who is the current user, what request produced this log line) are different, but the mechanism that solves them is identical on purpose.</p>
      <h2>Metrics and Tracing: Directional, Not Mandated</h2>
      <p>This isn't tied to one specific stack, but a few things are worth alerting on regardless of which one you pick: the HTTP 5xx rate, p99 response time, DB connection pool saturation, message-queue DLQ depth greater than zero, and the queue's <code>ApproximateAgeOfOldestMessage</code> — a metric that catches a stalled consumer long before anyone notices requests are actually failing.</p>
      <p>For tracing, OpenTelemetry auto-instrumentation collects HTTP, DB, and message-queue spans with minimal manual wiring. At an asynchronous boundary — a Task Queue, an Integration Event — including <code>traceparent</code> in the Outbox payload propagates the trace context across the gap, linking an HTTP request straight through to the event processing that happened seconds or minutes later, as a single trace instead of two disconnected ones. Including <code>trace_id</code> in log records lets you jump from a trace directly to its logs, which is usually the difference between "I can see something slowed down" and "I can see exactly which query slowed it down."</p>
      <h2>The Principle That Ties It Together</h2>
      <p>Always log the error in a catch block before rethrowing — never swallow an exception silently just because it's going to propagate anyway. A silently-swallowed exception and a correctly-rethrown one look identical to the caller; only the log tells you afterward that something went wrong at all.</p>
      <div className="article-note"><strong>Summary</strong><p>Never log in the Domain layer. Use structured JSON with snake_case fields, never string interpolation. Always log an error before rethrowing it. Trace every request with a Correlation ID. Keep debug/verbose out of production.</p></div>
      <div className="article-note"><strong>Further reading in the repo</strong><p>
        <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/docs/architecture/observability.md" target="_blank" rel="noreferrer">docs/architecture/observability.md</a> — the full log-level policy and metrics/tracing notes · <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/docs/architecture/cross-cutting-concerns.md" target="_blank" rel="noreferrer">docs/architecture/cross-cutting-concerns.md</a> — where Correlation ID injection happens in the request pipeline
      </p></div>
    </PostLayout>
  );
}
