import PostLayout from '../../components/PostLayout';
import { useLocale } from '../../lib/locale';

const content = {
  en: {
    kicker: 'Observability · Operations',
    title: (
      <>
        Observability Is a<br /><em>Design Decision, Not an Afterthought</em>
      </>
    ),
    lede: "Adding a logging library is easy. Deciding what belongs at which level, in which layer, and how to trace one request across a dozen log lines is the part that actually determines whether an incident takes five minutes or five hours to diagnose.",
    body: (
      <>
        <p>Observability tends to get treated as infrastructure you bolt on — pick a logging library, wire up a dashboard, done. The parts that actually matter are decisions, not tools: what gets logged at what level, which layer is responsible for logging what, and how a single request's story stays traceable once it's scattered across dozens of log lines from multiple processes.</p>
        <h2>Five Levels, Strictly Enforced</h2>
        <p><code>error</code> is for request-handling failures and external system outages — a DB connection failure, an external API returning 5xx, an unhandled exception. <code>warn</code> is for normal operation that still needs attention — a call to a deprecated endpoint, a retry occurring, approaching a threshold. <code>log</code> covers key business events and state changes — an order created, a payment completed, the app starting or stopping. <code>debug</code> is detailed info for development — query parameters, intermediate computed results. <code>verbose</code> is maximum detail, like a full request/response payload.</p>
        <p>Production emits only <code>error</code>, <code>warn</code>, and <code>log</code>. Development and staging emit everything. Unnecessary logging in production doesn't just cost money — it buries the important lines in noise exactly when you need to find them fastest.</p>
        <h2>Who Logs What</h2>
        <p>The Interface layer (a Controller) logs request errors, caught in a catch block. The Application layer logs business events and the results of external system calls. Infrastructure logs external-integration failures and retries, and abnormal query performance. The Domain layer never logs, full stop — it stays framework-independent, and the result of domain logic gets logged one layer up, in the Application layer that called it.</p>
        <pre><code>{`// forbidden — using a logger/framework in the Domain layer
import org.slf4j.Logger;          // forbidden
import org.slf4j.LoggerFactory;   // forbidden

public class Order {
    private static final Logger log = LoggerFactory.getLogger(Order.class);  // forbidden

    public void cancel(String reason) {
        log.info("Order cancelled");  // forbidden
        ...
    }
}`}</code></pre>
        <p>This isn't a purity rule for its own sake. A Domain layer that logs has taken a framework dependency it's supposed to have none of, and now every domain unit test has to either mock a logger or tolerate log noise it never asked for.</p>
        <h2>Structured Logs, and Why the Field Names Matter</h2>
        <p>When integrating with an external monitoring system — Datadog, CloudWatch, Grafana Loki — logs should be structured JSON, with field names in <code>snake_case</code>:</p>
        <pre><code>{`// a business-event log
log.info("Order created", kv("order_id", orderId), kv("user_id", userId), kv("amount", amount));

// an error log
log.error("SQS send failed", kv("event_id", event.getEventId()), e);`}</code></pre>
        <p>The reason for <code>snake_case</code> specifically, not camelCase, is unglamorous but concrete: most monitoring platforms parse snake_case fields by default. A field-name mismatch doesn't just look inconsistent — it silently breaks indexing, so a query that should find every log for a given <code>order_id</code> quietly returns nothing.</p>
        <h2>Correlation ID: Making One Request Traceable Across Everything</h2>
        <p>To trace a single request across multiple services in logs, every log entry includes a Correlation ID. If the client sends an <code>x-correlation-id</code> header, it's used as-is; otherwise the server generates one. The header is forwarded on every downstream call, and returned in the response too.</p>
        <p>The ID is generated or extracted at the request entry point — the Interface layer, as a Servlet <code>Filter</code> — and propagated via SLF4J's <code>MDC</code> (Mapped Diagnostic Context), a <code>ThreadLocal</code>-backed map that the Logback JSON encoder reads automatically, so every later layer can read the current request's Correlation ID with no argument threaded through method signatures:</p>
        <pre><code>{`// at request entry — a Filter in the Interface layer
String correlationId = Optional.ofNullable(request.getHeader("X-Correlation-Id"))
        .orElseGet(() -> UUID.randomUUID().toString().replace("-", ""));
MDC.put("correlation_id", correlationId);
try {
    chain.doFilter(request, response);
} finally {
    MDC.remove("correlation_id");
}

// when logging, anywhere downstream — no argument needed, MDC is read automatically
log.info("Order created");`}</code></pre>
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
      </>
    ),
  },
  ko: {
    kicker: 'Observability · Operations',
    title: (
      <>
        Observability는<br /><em>나중에 덧붙이는 게 아니라 설계 결정이다</em>
      </>
    ),
    lede: '로깅 라이브러리를 붙이는 건 쉽다. 정말 중요한 건 어떤 레벨에, 어떤 계층에 무엇을 남길지, 그리고 하나의 요청을 수십 줄의 로그에 걸쳐 어떻게 추적 가능하게 만들지를 결정하는 일이다 — 장애가 났을 때 5분 만에 원인을 찾느냐, 5시간이 걸리느냐를 실제로 가르는 것도 바로 이 부분이다.',
    body: (
      <>
        <p>Observability는 흔히 나중에 덧붙이는 인프라 취급을 받는다 — 로깅 라이브러리 하나 고르고, 대시보드 연결하면 끝. 하지만 실제로 중요한 건 도구가 아니라 결정이다: 무엇을 어떤 레벨로 남길지, 어떤 계층이 무엇을 로깅할 책임을 지는지, 그리고 하나의 요청이 여러 프로세스에서 나온 수십 줄의 로그로 흩어진 뒤에도 그 요청의 이야기를 계속 추적 가능하게 유지하는 방법.</p>
        <h2>다섯 개 레벨, 엄격하게 강제한다</h2>
        <p><code>error</code>는 요청 처리 실패와 외부 시스템 장애용이다 — DB 연결 실패, 외부 API의 5xx 응답, 처리되지 않은 예외. <code>warn</code>은 정상 동작이지만 여전히 주의가 필요한 경우다 — deprecated된 엔드포인트 호출, 재시도 발생, 임계치에 근접하는 상황. <code>log</code>는 핵심 비즈니스 이벤트와 상태 변화를 다룬다 — 주문 생성, 결제 완료, 앱 시작·종료. <code>debug</code>는 개발용 상세 정보다 — 쿼리 파라미터, 중간 계산 결과. <code>verbose</code>는 요청/응답 페이로드 전체 같은 최대 상세 정보다.</p>
        <p>운영 환경(production)은 <code>error</code>, <code>warn</code>, <code>log</code>만 남긴다. 개발과 스테이징 환경은 전부 남긴다. 운영 환경에서의 불필요한 로깅은 비용만 잡아먹는 게 아니라, 정작 가장 빠르게 찾아야 할 순간에 중요한 로그 줄을 노이즈 속에 파묻어 버린다.</p>
        <h2>누가 무엇을 로깅하는가</h2>
        <p>Interface 계층(Controller)은 catch 블록에서 잡힌 요청 에러를 로깅한다. Application 계층은 비즈니스 이벤트와 외부 시스템 호출 결과를 로깅한다. Infrastructure는 외부 연동 실패·재시도와 비정상적인 쿼리 성능을 로깅한다. Domain 계층은 절대 로깅하지 않는다, 예외 없이 — 프레임워크 독립성을 유지해야 하고, 도메인 로직의 결과는 그걸 호출한 상위 계층인 Application 계층에서 로깅된다.</p>
        <pre><code>{`// forbidden — using a logger/framework in the Domain layer
import org.slf4j.Logger;          // forbidden
import org.slf4j.LoggerFactory;   // forbidden

public class Order {
    private static final Logger log = LoggerFactory.getLogger(Order.class);  // forbidden

    public void cancel(String reason) {
        log.info("Order cancelled");  // forbidden
        ...
    }
}`}</code></pre>
        <p>이건 순수성을 위한 순수성 규칙이 아니다. 로깅을 하는 Domain 계층은 원래 가져서는 안 될 프레임워크 의존성을 갖게 된 것이고, 그러면 모든 도메인 단위 테스트가 로거를 mocking하거나, 요청하지도 않은 로그 노이즈를 감내해야 한다.</p>
        <h2>구조화된 로그, 그리고 필드 이름이 중요한 이유</h2>
        <p>Datadog, CloudWatch, Grafana Loki 같은 외부 모니터링 시스템과 연동할 때, 로그는 <code>snake_case</code> 필드 이름을 쓰는 구조화된 JSON이어야 한다:</p>
        <pre><code>{`// a business-event log
log.info("Order created", kv("order_id", orderId), kv("user_id", userId), kv("amount", amount));

// an error log
log.error("SQS send failed", kv("event_id", event.getEventId()), e);`}</code></pre>
        <p>camelCase가 아니라 굳이 <code>snake_case</code>를 쓰는 이유는 화려하진 않지만 구체적이다: 대부분의 모니터링 플랫폼이 기본적으로 snake_case 필드를 파싱하기 때문이다. 필드 이름이 안 맞으면 단순히 일관성이 없어 보이는 데서 끝나지 않는다 — 인덱싱이 조용히 깨져서, 특정 <code>order_id</code>에 대한 모든 로그를 찾아야 할 쿼리가 아무 결과도 없이 조용히 실패한다.</p>
        <h2>Correlation ID: 하나의 요청을 전체 구간에서 추적 가능하게 만들기</h2>
        <p>로그 상에서 하나의 요청을 여러 서비스에 걸쳐 추적하기 위해, 모든 로그 항목에는 Correlation ID가 포함된다. 클라이언트가 <code>x-correlation-id</code> 헤더를 보내면 그걸 그대로 쓰고, 그렇지 않으면 서버가 하나 생성한다. 이 헤더는 하위 호출마다 전달되고, 응답에도 함께 반환된다.</p>
        <p>ID는 요청의 진입점 — Interface 계층의 Servlet <code>Filter</code> — 에서 생성되거나 추출되고, SLF4J의 <code>MDC</code>(Mapped Diagnostic Context, <code>ThreadLocal</code> 기반의 맵으로 Logback JSON 인코더가 자동으로 읽어들인다)를 통해 전파된다. 그래서 이후의 모든 계층은 메서드 시그니처에 아무 인자도 추가하지 않고도 현재 요청의 Correlation ID를 읽을 수 있다:</p>
        <pre><code>{`// at request entry — a Filter in the Interface layer
String correlationId = Optional.ofNullable(request.getHeader("X-Correlation-Id"))
        .orElseGet(() -> UUID.randomUUID().toString().replace("-", ""));
MDC.put("correlation_id", correlationId);
try {
    chain.doFilter(request, response);
} finally {
    MDC.remove("correlation_id");
}

// when logging, anywhere downstream — no argument needed, MDC is read automatically
log.info("Order created");`}</code></pre>
        <p>이건 인증에 쓰이는 request-scoped 사용자 컨텍스트 패턴과 정확히 같은 모양이다 — 값 하나가 요청의 진입점에서 딱 한 번 생성되고, 그 외 모든 곳에서는 request 객체를 넘겨받지 않고도 storage에서 읽어온다. 두 문제(현재 사용자가 누구인지, 이 로그 줄을 만든 요청이 무엇인지)는 서로 다르지만, 그걸 푸는 메커니즘이 동일한 건 의도된 것이다.</p>
        <h2>메트릭과 트레이싱: 강제 사항이 아니라 방향성</h2>
        <p>이건 특정 스택 하나에 묶인 이야기는 아니지만, 어떤 스택을 고르든 알림을 걸어둘 만한 것들이 몇 가지 있다: HTTP 5xx 비율, p99 응답 시간, DB 커넥션 풀 포화도, 메시지 큐의 DLQ 적재량이 0보다 커지는 것, 그리고 큐의 <code>ApproximateAgeOfOldestMessage</code> — 이 지표는 요청이 실제로 실패하고 있다는 걸 누군가 눈치채기 훨씬 전에 멈춰버린 consumer를 잡아낸다.</p>
        <p>트레이싱은 OpenTelemetry auto-instrumentation을 쓰면 수동 설정을 최소화하면서 HTTP, DB, 메시지 큐 span을 수집할 수 있다. Task Queue나 Integration Event 같은 비동기 경계에서는, Outbox 페이로드에 <code>traceparent</code>를 포함시키면 그 간극을 넘어 trace context가 전파되어, HTTP 요청 하나가 몇 초 혹은 몇 분 뒤에 일어난 이벤트 처리까지 서로 단절된 두 개의 trace가 아니라 하나의 trace로 이어진다. 로그 레코드에 <code>trace_id</code>를 포함시키면 trace에서 곧바로 그 로그로 이동할 수 있는데, 이건 보통 "뭔가 느려졌다는 게 보인다"와 "정확히 어떤 쿼리가 느려졌는지 보인다"의 차이를 만든다.</p>
        <h2>이 모든 걸 하나로 묶는 원칙</h2>
        <p>다시 던지기(rethrow) 전에는 항상 catch 블록에서 에러를 로깅한다 — 어차피 위로 전파될 거라는 이유로 예외를 조용히 삼키지 말라. 조용히 삼켜진 예외와 올바르게 rethrow된 예외는 호출자 입장에서 똑같아 보인다; 무언가 잘못됐다는 사실 자체를 나중에 알려주는 건 오직 로그뿐이다.</p>
        <div className="article-note"><strong>요약</strong><p>Domain 계층에서는 절대 로깅하지 않는다. 문자열 보간이 아니라 snake_case 필드를 쓰는 구조화된 JSON을 쓴다. rethrow하기 전에는 항상 에러를 로깅한다. 모든 요청을 Correlation ID로 추적한다. debug/verbose는 운영 환경에서 배제한다.</p></div>
        <div className="article-note"><strong>저장소 내 추가 자료</strong><p>
          <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/docs/architecture/observability.md" target="_blank" rel="noreferrer">docs/architecture/observability.md</a> — 전체 로그 레벨 정책과 메트릭/트레이싱 노트 · <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/docs/architecture/cross-cutting-concerns.md" target="_blank" rel="noreferrer">docs/architecture/cross-cutting-concerns.md</a> — 요청 파이프라인에서 Correlation ID 주입이 일어나는 위치
        </p></div>
      </>
    ),
  },
};

export default function ObservabilityByDesign() {
  const { locale } = useLocale();
  const c = content[locale];

  return (
    <PostLayout slug="observability-by-design" kicker={c.kicker} title={c.title} lede={c.lede}>
      {c.body}
    </PostLayout>
  );
}
