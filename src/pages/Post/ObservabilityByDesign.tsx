import PostLayout from '../../components/PostLayout';
import { useLocale, localeFromPathname } from '../../lib/locale';
import type { MetaFunction } from 'react-router';
import { createPostMeta } from '../../lib/seo';

export const meta: MetaFunction = ({ location }) =>
  createPostMeta('observability-by-design', localeFromPathname(location.pathname));

const content = {
  en: {
    kicker: 'Observability · Operations',
    title: (
      <>
        Observability Is a<br /><em>Design Decision, Not an Afterthought</em>
      </>
    ),
    lede: "Adding a logging library is easy. Deciding what belongs at which level, in which layer, and how to trace one request across a dozen log lines is the part that determines whether an incident takes five minutes or five hours to diagnose.",
    body: (
      <>
        <p>Observability tends to get treated as infrastructure you bolt on: pick a logging library, wire up a dashboard, done. The parts that matter are decisions, not tools: what gets logged at what level, which layer is responsible for logging what, and how a single request's story stays traceable once it's scattered across dozens of log lines from multiple processes.</p>
        <h2>Five Levels, Strictly Enforced</h2>
        <p><code>error</code> is for request-handling failures and external system outages, such as a DB connection failure, an external API returning 5xx, an unhandled exception. <code>warn</code> is for normal operation that still needs attention, such as a call to a deprecated endpoint, a retry occurring, approaching a threshold. <code>log</code> covers key business events and state changes: an order created, a payment completed, the app starting or stopping. <code>debug</code> is detailed info for development, like query parameters, intermediate computed results. <code>verbose</code> is maximum detail, like a full request/response payload.</p>
        <p>Production emits only <code>error</code>, <code>warn</code>, and <code>log</code>. Development and staging emit everything. Unnecessary logging in production doesn't just cost money. It buries the important lines in noise right when you need to find them fastest.</p>
        <h2>Who Logs What</h2>
        <p>The Interface layer (a Controller) logs request errors, caught in a catch block. The Application layer logs business events and the results of external system calls. Infrastructure logs external-integration failures and retries, and abnormal query performance. The Domain layer never logs, full stop. It stays framework-independent, and the result of domain logic gets logged one layer up, in the Application layer that called it.</p>
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
        <p>When integrating with an external monitoring system (Datadog, CloudWatch, Grafana Loki), logs should be structured JSON, with field names in <code>snake_case</code>:</p>
        <pre><code>{`// a business-event log
log.info("Order created", kv("order_id", orderId), kv("user_id", userId), kv("amount", amount));

// an error log
log.error("SQS send failed", kv("event_id", event.getEventId()), e);`}</code></pre>
        <p>The reason for <code>snake_case</code> specifically, not camelCase, is unglamorous but concrete: most monitoring platforms parse snake_case fields by default. A field-name mismatch doesn't just look inconsistent. It breaks indexing without any error, so a query that should find every log for a given <code>order_id</code> returns nothing.</p>
        <h2>Correlation ID: Making One Request Traceable Across Everything</h2>
        <p>To trace a single request across multiple services in logs, every log entry includes a Correlation ID. If the client sends an <code>x-correlation-id</code> header, it's used as-is; otherwise the server generates one. The header is forwarded on every downstream call, and returned in the response too.</p>
        <p>The ID is generated or extracted at the request entry point (the Interface layer, as a Servlet <code>Filter</code>) and propagated via SLF4J's <code>MDC</code> (Mapped Diagnostic Context), a <code>ThreadLocal</code>-backed map that the Logback JSON encoder reads automatically, so every later layer can read the current request's Correlation ID with no argument threaded through method signatures:</p>
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
        <p>This is the same shape as the request-scoped user-context pattern used for authentication: a value generated once at the edge, read from storage everywhere else, with no request object passed around to get at it. The two problems (who is the current user, what request produced this log line) are different, but the mechanism that solves them is identical on purpose.</p>
        <h2>Metrics and Tracing: Directional, Not Mandated</h2>
        <p>This isn't tied to one specific stack, but a few things are worth alerting on regardless of which one you pick: the HTTP 5xx rate, p99 response time, DB connection pool saturation, message-queue DLQ depth greater than zero, and the queue's <code>ApproximateAgeOfOldestMessage</code>, a metric that catches a stalled consumer long before anyone notices requests are failing.</p>
        <p>For tracing, OpenTelemetry auto-instrumentation collects HTTP, DB, and message-queue spans with minimal manual wiring. At an asynchronous boundary (a Task Queue, an Integration Event), including <code>traceparent</code> in the Outbox payload propagates the trace context across the gap, linking an HTTP request straight through to the event processing that happened seconds or minutes later, as a single trace instead of two disconnected ones. Including <code>trace_id</code> in log records lets you jump from a trace directly to its logs, which is usually the difference between "I can see something slowed down" and "I can see exactly which query slowed it down."</p>
        <h2>The Principle That Ties It Together</h2>
        <p>Always log the error in a catch block before rethrowing. Never swallow an exception without a log line just because it's going to propagate anyway. A swallowed exception and a correctly-rethrown one look identical to the caller; only the log tells you afterward that something went wrong at all.</p>
        <div className="article-note"><strong>Further reading</strong><p>
          <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/docs/architecture/observability.md" target="_blank" rel="noreferrer">docs/architecture/observability.md</a> (the full log-level policy and metrics/tracing notes, in my example project that implements the same backend design (DDD, CQRS, Outbox) in five languages side by side) · <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/docs/architecture/cross-cutting-concerns.md" target="_blank" rel="noreferrer">docs/architecture/cross-cutting-concerns.md</a> (where the Correlation ID is injected in the request pipeline)
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
    lede: '로깅 라이브러리를 붙이는 건 쉽다. 어려운 건 무엇을 어느 레벨로, 어느 계층에서 남길지, 요청 하나를 십여 줄의 로그 사이에서 어떻게 따라갈지 정하는 일이다. 장애 원인을 5분 만에 찾느냐 5시간 걸려 찾느냐는 여기서 갈린다.',
    body: (
      <>
        <p>Observability는 흔히 나중에 붙이는 인프라로 여겨진다. 로깅 라이브러리 하나 고르고 대시보드를 연결하면 끝이라는 식이다. 그런데 정말 중요한 건 도구보다 결정이다. 무엇을 어느 레벨로 남길지, 어느 계층이 무엇을 로깅할지 정해야 한다. 요청 하나가 여러 프로세스의 로그 수십 줄로 흩어진 뒤에도 그 요청이 어떻게 흘러갔는지 따라갈 수 있어야 한다.</p>
        <h2>레벨은 다섯 개, 엄격하게 지킨다</h2>
        <p><code>error</code>는 요청 처리 실패와 외부 시스템 장애에 쓴다. DB 연결 실패, 외부 API의 5xx 응답, 처리되지 않은 예외가 여기에 든다. <code>warn</code>은 정상 동작이지만 눈여겨봐야 하는 경우다. deprecated 엔드포인트 호출, 재시도, 임계치에 가까워지는 상황 같은 것이다. <code>log</code>는 주요 비즈니스 이벤트와 상태 변화를 남긴다. 주문 생성, 결제 완료, 앱 시작과 종료가 그렇다. <code>debug</code>는 쿼리 파라미터나 중간 계산 결과처럼 개발할 때 보는 상세 정보다. <code>verbose</code>는 요청과 응답 페이로드 전체처럼 가장 자세한 정보다.</p>
        <p>운영 환경에서는 <code>error</code>, <code>warn</code>, <code>log</code>만 남기고, 개발과 스테이징에서는 전부 남긴다. 운영에서 쓸데없는 로그를 남기면 돈만 드는 게 아니다. 가장 빨리 찾아야 할 순간에 중요한 로그가 노이즈에 묻힌다.</p>
        <h2>누가 무엇을 로깅하나</h2>
        <p>Interface 계층(Controller)은 catch 블록에서 잡은 요청 에러를 로깅한다. Application 계층은 비즈니스 이벤트와 외부 시스템 호출 결과를 로깅한다. Infrastructure 계층은 외부 연동 실패와 재시도, 비정상적인 쿼리 성능을 로깅한다. Domain 계층은 어떤 경우에도 로깅하지 않는다. 프레임워크에 기대지 않아야 하기 때문이다. 도메인 로직의 결과는 그걸 호출한 한 단계 위, Application 계층이 로깅한다.</p>
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
        <p>순수성을 위한 순수성이 아니다. Domain 계층이 로깅을 하면 가지면 안 되는 프레임워크 의존성이 생긴다. 그러면 도메인 단위 테스트마다 로거를 모킹하거나, 원하지도 않은 로그 노이즈를 견뎌야 한다.</p>
        <h2>구조화된 로그와 필드 이름</h2>
        <p>Datadog, CloudWatch, Grafana Loki 같은 외부 모니터링 시스템과 연동한다면 로그는 구조화된 JSON이어야 하고, 필드 이름은 <code>snake_case</code>로 쓴다.</p>
        <pre><code>{`// a business-event log
log.info("Order created", kv("order_id", orderId), kv("user_id", userId), kv("amount", amount));

// an error log
log.error("SQS send failed", kv("event_id", event.getEventId()), e);`}</code></pre>
        <p>camelCase 대신 굳이 <code>snake_case</code>를 쓰는 이유는 멋은 없지만 분명하다. 대부분의 모니터링 플랫폼이 기본으로 snake_case 필드를 파싱한다. 필드 이름이 안 맞으면 보기에 들쭉날쭉한 것으로 끝나지 않는다. 인덱싱이 에러 없이 깨지고, 특정 <code>order_id</code>의 로그를 전부 찾아야 할 쿼리가 아무것도 돌려주지 않는다.</p>
        <h2>Correlation ID로 요청 하나를 끝까지 따라가기</h2>
        <p>요청 하나를 여러 서비스의 로그에 걸쳐 따라가려면 모든 로그 항목에 Correlation ID가 들어가야 한다. 클라이언트가 <code>x-correlation-id</code> 헤더를 보내면 그 값을 그대로 쓰고, 없으면 서버가 만든다. 이 헤더는 하위 호출마다 넘겨주고, 응답에도 실어 보낸다.</p>
        <p>ID는 요청이 들어오는 지점, 즉 Interface 계층의 Servlet <code>Filter</code>에서 만들거나 꺼낸다. 그리고 SLF4J의 <code>MDC</code>(Mapped Diagnostic Context)에 넣어 전파한다. MDC는 <code>ThreadLocal</code> 기반의 맵이고, Logback JSON 인코더가 알아서 읽어 간다. 그래서 뒤쪽 계층 어디서든 메서드 시그니처에 인자를 하나도 늘리지 않고 현재 요청의 Correlation ID를 쓸 수 있다.</p>
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
        <p>인증에서 쓰는 request-scoped 사용자 컨텍스트 패턴과 똑같은 모양이다. 값은 요청 입구에서 딱 한 번 만들고, 나머지 모든 곳에서는 request 객체를 넘겨받지 않고 스토리지에서 읽는다. 현재 사용자가 누구인지와 이 로그를 만든 요청이 무엇인지는 서로 다른 문제다. 그래도 둘을 같은 방식으로 푼 건 의도한 것이다.</p>
        <h2>메트릭과 트레이싱은 방향만 정한다</h2>
        <p>특정 스택 하나에 묶을 얘기는 아니지만, 어떤 스택을 쓰든 알림을 걸어 둘 만한 지표가 몇 가지 있다. HTTP 5xx 비율, p99 응답 시간, DB 커넥션 풀 포화도, 0보다 커진 메시지 큐 DLQ 적재량, 그리고 큐의 <code>ApproximateAgeOfOldestMessage</code>다. 마지막 지표는 요청이 실패하고 있다는 걸 누가 알아채기 훨씬 전에 멈춘 consumer를 잡아낸다.</p>
        <p>트레이싱은 OpenTelemetry auto-instrumentation을 쓰면 손을 거의 대지 않고 HTTP, DB, 메시지 큐 span을 모을 수 있다. Task Queue나 Integration Event 같은 비동기 경계에서는 Outbox 페이로드에 <code>traceparent</code>를 넣으면 trace context가 그 틈을 건너간다. 그러면 HTTP 요청과 몇 초, 몇 분 뒤에 일어난 이벤트 처리가 따로 노는 두 trace로 갈라지지 않고 하나의 trace로 이어진다. 로그 레코드에 <code>trace_id</code>를 넣어 두면 trace에서 그 로그로 바로 건너갈 수 있다. "뭔가 느려졌다"에서 멈추느냐, "어느 쿼리가 느려졌는지"까지 보이느냐가 대개 여기서 갈린다.</p>
        <h2>모든 걸 묶는 원칙 하나</h2>
        <p>예외를 다시 던지기(rethrow) 전에 catch 블록에서 반드시 로깅한다. 어차피 위로 올라갈 예외라고 해서 로그 없이 삼키면 안 된다. 호출하는 쪽에서 보면, 말없이 삼킨 예외와 제대로 다시 던진 예외는 똑같아 보인다. 나중에 뭔가 잘못됐었다는 걸 알려 주는 건 로그뿐이다.</p>
        <div className="article-note"><strong>더 볼 자료</strong><p>
          <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/docs/architecture/observability.md" target="_blank" rel="noreferrer">docs/architecture/observability.md</a>(같은 백엔드 설계(DDD, CQRS, Outbox)를 5개 언어로 나란히 구현해 둔 내 예제 프로젝트의 로그 레벨 정책 전체와 메트릭·트레이싱 메모) · <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/docs/architecture/cross-cutting-concerns.md" target="_blank" rel="noreferrer">docs/architecture/cross-cutting-concerns.md</a>(요청 파이프라인 어디에서 Correlation ID를 넣는지)
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
