import PostLayout from '../../components/PostLayout';
import { useLocale, localeFromPathname } from '../../lib/locale';
import type { MetaFunction } from 'react-router';
import { createPostMeta } from '../../lib/seo';

export const meta: MetaFunction = ({ location }) =>
  createPostMeta('graceful-shutdown', localeFromPathname(location.pathname));

const content = {
  en: {
    kicker: 'Reliability · Operations',
    title: (
      <>
        Graceful Shutdown:<br /><em>The Reliability Feature Nobody Tests</em>
      </>
    ),
    lede: "Nobody writes an integration test for what happens when Kubernetes sends SIGTERM mid-request. It's also one of the most reliable sources of dropped requests and 502s during every single deploy, if you get the ordering wrong.",
    body: (
      <>
        <p>In a container orchestration environment (Kubernetes, ECS, anything that starts and stops containers on your behalf), every deploy, every autoscale-down event, every node drain sends the same signal: SIGTERM, with a countdown before SIGKILL follows. What your process does in that window is the difference between a deploy nobody notices and a spike of failed requests on a dashboard somewhere.</p>
        <h2>The Sequence, and Why the Order Is the Whole Point</h2>
        <p>Six steps, and they have to happen in this order: the orchestrator sends SIGTERM; the readiness probe flips to failing immediately, so the load balancer stops sending new traffic; in-flight requests are given time to finish; the HTTP server shuts down; resources such as DB connections and message-queue connections are cleaned up; the process exits cleanly with code 0.</p>
        <p>The readiness flip has to happen before the HTTP server shuts down. Get that backward, and there's a window where the load balancer still thinks the instance is healthy and keeps routing traffic to a server that's actively closing. That is the shape of a "random 502s during deploys" incident that looks intermittent and unrelated to any code change.</p>
        <h2>Liveness and Readiness Are Not the Same Probe</h2>
        <p>Liveness answers "is the process alive"; on failure, the container gets restarted. Readiness answers "is it ready to receive traffic"; on failure, it's removed from the load balancer, nothing more drastic. During shutdown, liveness should keep returning 200 (it's still alive, just finishing up), while readiness should return 503 (stop sending it anything new).</p>
        <pre><code>{`isShuttingDown = false

// on receiving SIGTERM
isShuttingDown = true

// GET /health/ready
if (isShuttingDown) return 503
return 200

// GET /health/live
return 200  // always`}</code></pre>
        <div className="article-note"><strong>The common mistake</strong><p>If liveness also returns 503 while shutting down, the orchestrator reads that as "the process is unhealthy" and restarts the container mid-shutdown, before it finished draining in-flight requests cleanly. Liveness must always return 200 regardless of shutdown state; only readiness is allowed to change.</p></div>
        <h2>terminationGracePeriodSeconds</h2>
        <p>This is how long the orchestrator waits after SIGTERM before escalating to SIGKILL, which force-kills the process with no further cleanup at all. Give it comfortable headroom over the service's p99 request-processing time. 30 seconds is usually enough for a typical HTTP service. If there are batch or scheduled jobs that might be mid-run at shutdown time, factor in their maximum processing time too, not just the HTTP p99.</p>
        <pre><code>{`# Kubernetes example
spec:
  terminationGracePeriodSeconds: 30
  containers:
    - livenessProbe:
        httpGet:
          path: /health/live
    - readinessProbe:
        httpGet:
          path: /health/ready`}</code></pre>
        <h2>Run the Process Directly — Not Behind a Wrapper</h2>
        <pre><code>{`# correct — runs the process directly as PID 1
CMD ["node", "dist/main.js"]

# wrong — npm sits in between and delays SIGTERM delivery
CMD ["npm", "run", "start:prod"]`}</code></pre>
        <p>If npm or yarn sits in between as a wrapper, SIGTERM is delivered to that wrapper process, not directly to the application. Delivery to the app itself may be delayed, or in some setups may never happen at all before SIGKILL arrives. Running the application directly gives it PID 1 inside the container, so it receives SIGTERM the moment the orchestrator sends it, with nothing standing between the signal and the code that's supposed to react to it.</p>
        <h2>A Framework Flag vs. Writing the Sequence by Hand</h2>
        <p>How much of the sequence above you have to write yourself depends entirely on whether the framework already has an opinion about it. Spring Boot turns almost the whole thing into a single config line:</p>
        <pre><code>{`server:
  shutdown: graceful

spring:
  lifecycle:
    timeout-per-shutdown-phase: 30s`}</code></pre>
        <p><code>server.shutdown: graceful</code> makes Spring itself stop accepting new requests and wait for in-flight ones to finish before closing, and Actuator's liveness/readiness probes already exist as separate endpoints out of the box, so the six-step sequence is mostly the framework's problem, not the application code's.</p>
        <p>Go has no framework playing that role, so every step in the sequence is explicit, in the exact order the doc prescribes:</p>
        <pre><code>{`ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGTERM, syscall.SIGINT)
defer stop()

go func() {
	if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
		slog.Error("server error", "error", err)
		os.Exit(1)
	}
}()

<-ctx.Done() // blocks until SIGTERM/SIGINT is received

// Must be called before srv.Shutdown(ctx) — the orchestrator only cuts off new traffic
// after readiness flips to 503, so readiness must fail first, before the HTTP server
// actually stops, for a seamless cutover.
healthHandler.StartShutdown()

shutdownCtx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
defer cancel()

// Waits for in-flight requests to finish while rejecting new connections.
if err := srv.Shutdown(shutdownCtx); err != nil {
	slog.Error("graceful shutdown failed", "error", err)
}
// DB connections are cleaned up only after the HTTP server is fully closed`}</code></pre>
        <p>Nothing here is Go-specific wisdom. It's the same six steps from the top of this post, just with no framework hiding the ordering from you. <code>ctx</code> being cancelled on SIGTERM is also what stops every other background loop in the process (the Outbox poller, the Task Queue consumer, the schedulers), all watching the same context, so one signal cleanly unwinds everything without a separate shutdown hook per component.</p>
        <h2>Cleanup Order, and What Not to Do During It</h2>
        <p>Resource cleanup (releasing DB connections, closing message-queue clients) runs <em>after</em> the HTTP server has closed, never before. In-flight requests still need to reach the database while they're finishing up; releasing the connection pool first pulls the floor out from under the very requests you were trying to let finish gracefully in the first place.</p>
        <pre><code>{`✓ Shut down the HTTP server → release the DB connection   (correct order)
✗ Release the DB connection → shut down the HTTP server   (in-flight requests can't use the DB)`}</code></pre>
        <p>And cleanup itself shouldn't throw. If one cleanup step raises an exception, wrap it in a try-catch and just log it. An uncaught exception mid-cleanup means every resource-release step after it in the sequence gets skipped, turning "the DB connection didn't close as cleanly as it could have" into "the message-queue connection leaked too, because the code never got there."</p>
        <h2>A Checklist</h2>
        <ul>
          <li>Does readiness flip to failing the instant SIGTERM arrives, before anything else happens?</li>
          <li>Does liveness stay 200 throughout shutdown, no matter what?</li>
          <li>Does the process run as PID 1, with no npm/yarn wrapper in between?</li>
          <li>Is <code>terminationGracePeriodSeconds</code> set with real headroom over p99, including any batch jobs?</li>
          <li>Does resource cleanup run strictly after the HTTP server has stopped accepting new work?</li>
          <li>Is every cleanup step wrapped so one failure doesn't skip the rest?</li>
        </ul>
        <div className="article-note"><strong>Further reading</strong><p>
          <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/docs/architecture/graceful-shutdown.md" target="_blank" rel="noreferrer">docs/architecture/graceful-shutdown.md</a> (the full shutdown sequence and probe configuration, in my example project that implements the same backend design (DDD, CQRS, Outbox) in five languages side by side) · <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/docs/architecture/container.md" target="_blank" rel="noreferrer">docs/architecture/container.md</a> (the Dockerfile CMD convention this depends on)
        </p></div>
      </>
    ),
  },
  ko: {
    kicker: 'Reliability · Operations',
    title: (
      <>
        Graceful Shutdown:<br /><em>아무도 테스트하지 않는 신뢰성 기능</em>
      </>
    ),
    lede: '요청을 처리하는 도중에 Kubernetes가 SIGTERM을 보내면 어떻게 되는지, 통합 테스트로 확인하는 사람은 없다. 그런데 순서를 잘못 잡으면 배포할 때마다 요청이 유실되고 502가 터지는 원인 중에 이만큼 확실한 것도 드물다.',
    body: (
      <>
        <p>Kubernetes든 ECS든, 컨테이너를 대신 띄우고 내려 주는 오케스트레이션 환경이라면 사정이 같다. 배포할 때도, 오토스케일로 줄어들 때도, 노드를 드레인할 때도 오는 신호는 하나다. 먼저 SIGTERM이 오고, 정해진 시간이 지나면 SIGKILL이 온다. 그 사이에 프로세스가 무엇을 하느냐에 따라 아무도 모르게 지나가는 배포가 되기도 하고, 어느 대시보드에 실패한 요청이 치솟는 배포가 되기도 한다.</p>
        <h2>왜 순서가 중요한가</h2>
        <p>단계는 여섯 개이고, 반드시 이 순서를 지켜야 한다. 오케스트레이터가 SIGTERM을 보낸다. readiness probe가 곧바로 실패로 바뀌고, 로드밸런서는 새 트래픽을 보내지 않는다. 처리 중인(in-flight) 요청이 끝날 때까지 기다린다. HTTP 서버를 내린다. DB 커넥션, 메시지 큐 커넥션 같은 리소스를 정리한다. 마지막으로 프로세스가 코드 0으로 깔끔하게 종료한다.</p>
        <p>readiness는 HTTP 서버를 내리기 전에 바꿔야 한다. 순서가 뒤집히면, 로드밸런서는 인스턴스가 아직 멀쩡하다고 보고 이미 닫히고 있는 서버로 트래픽을 계속 보내는 틈이 생긴다. "배포할 때 가끔 502가 난다"는 장애가 대개 이렇게 생긴다. 간헐적이고 코드 변경과도 상관없어 보여서 원인을 찾기 어렵다.</p>
        <h2>Liveness와 Readiness는 다른 probe다</h2>
        <p>Liveness는 "프로세스가 살아 있는가"를 묻는다. 실패하면 컨테이너를 재시작한다. Readiness는 "트래픽을 받을 준비가 됐는가"를 묻는다. 실패하면 로드밸런서에서 빠질 뿐, 그 이상은 없다. 종료하는 동안 liveness는 계속 200을 돌려줘야 한다. 아직 살아서 마무리하는 중이기 때문이다. 반면 readiness는 503을 돌려줘서 새 요청을 그만 보내라고 알린다.</p>
        <pre><code>{`isShuttingDown = false

// on receiving SIGTERM
isShuttingDown = true

// GET /health/ready
if (isShuttingDown) return 503
return 200

// GET /health/live
return 200  // always`}</code></pre>
        <div className="article-note"><strong>흔한 실수</strong><p>종료 중에 liveness까지 503을 돌려주면, 오케스트레이터는 프로세스가 비정상이라고 보고 컨테이너를 재시작해 버린다. 처리 중인 요청을 다 끝내지도 못한 채 종료 도중에 말이다. Liveness는 종료 상태와 상관없이 항상 200이어야 하고, 값이 바뀌어도 되는 건 readiness뿐이다.</p></div>
        <h2>terminationGracePeriodSeconds</h2>
        <p>오케스트레이터가 SIGTERM을 보내고 SIGKILL을 보내기까지 기다려 주는 시간이다. SIGKILL이 오면 정리할 틈 없이 프로세스가 죽는다. 서비스의 p99 응답 시간보다 넉넉하게 잡으면 된다. 평범한 HTTP 서비스라면 보통 30초면 충분하다. 종료 시점에 배치나 스케줄 작업이 돌고 있을 수 있다면, HTTP p99만 보지 말고 그 작업들의 최대 처리 시간도 함께 따져야 한다.</p>
        <pre><code>{`# Kubernetes example
spec:
  terminationGracePeriodSeconds: 30
  containers:
    - livenessProbe:
        httpGet:
          path: /health/live
    - readinessProbe:
        httpGet:
          path: /health/ready`}</code></pre>
        <h2>프로세스는 래퍼 없이 직접 띄운다</h2>
        <pre><code>{`# correct — runs the process directly as PID 1
CMD ["node", "dist/main.js"]

# wrong — npm sits in between and delays SIGTERM delivery
CMD ["npm", "run", "start:prod"]`}</code></pre>
        <p>npm이나 yarn이 래퍼로 끼어 있으면 SIGTERM은 애플리케이션이 아니라 래퍼 프로세스가 받는다. 그래서 앱까지 신호가 늦게 가거나, 환경에 따라서는 SIGKILL이 올 때까지 아예 가지 않을 수도 있다. 애플리케이션을 직접 실행하면 컨테이너 안에서 PID 1이 된다. 오케스트레이터가 SIGTERM을 보내는 순간 바로 받고, 신호와 그걸 처리할 코드 사이에 아무것도 끼지 않는다.</p>
        <h2>설정 한 줄로 끝나는 경우와 직접 짜야 하는 경우</h2>
        <p>위 순서를 얼마나 직접 짜야 하는지는 프레임워크가 이 문제를 이미 챙기고 있느냐에 달렸다. Spring Boot에서는 설정 한 줄이면 거의 다 된다.</p>
        <pre><code>{`server:
  shutdown: graceful

spring:
  lifecycle:
    timeout-per-shutdown-phase: 30s`}</code></pre>
        <p><code>server.shutdown: graceful</code>을 켜면 Spring이 새 요청을 그만 받고, 처리 중인 요청이 끝날 때까지 기다렸다가 종료한다. Actuator에는 liveness와 readiness probe가 처음부터 별도 엔드포인트로 들어 있다. 여섯 단계 대부분을 애플리케이션 코드 대신 프레임워크가 맡는 셈이다.</p>
        <p>Go에는 그 역할을 해 줄 프레임워크가 없다. 그래서 문서에 적힌 순서대로 모든 단계를 코드로 직접 쓴다.</p>
        <pre><code>{`ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGTERM, syscall.SIGINT)
defer stop()

go func() {
	if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
		slog.Error("server error", "error", err)
		os.Exit(1)
	}
}()

<-ctx.Done() // blocks until SIGTERM/SIGINT is received

// Must be called before srv.Shutdown(ctx) — the orchestrator only cuts off new traffic
// after readiness flips to 503, so readiness must fail first, before the HTTP server
// actually stops, for a seamless cutover.
healthHandler.StartShutdown()

shutdownCtx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
defer cancel()

// Waits for in-flight requests to finish while rejecting new connections.
if err := srv.Shutdown(shutdownCtx); err != nil {
	slog.Error("graceful shutdown failed", "error", err)
}
// DB connections are cleaned up only after the HTTP server is fully closed`}</code></pre>
        <p>여기에 Go만의 비법 같은 건 없다. 글 첫머리의 여섯 단계 그대로이고, 순서를 대신 챙겨 주는 프레임워크가 없을 뿐이다. SIGTERM이 오면 <code>ctx</code>가 취소되는데, 이게 프로세스 안의 다른 백그라운드 루프도 함께 멈춘다. Outbox poller, Task Queue consumer, 스케줄러가 모두 같은 context를 보고 있다. 그래서 컴포넌트마다 shutdown hook을 따로 달지 않아도 신호 하나로 전부 깔끔하게 정리된다.</p>
        <h2>정리 순서와 정리 중에 하면 안 되는 것</h2>
        <p>DB 커넥션 해제나 메시지 큐 클라이언트 종료 같은 리소스 정리는 HTTP 서버가 닫힌 <em>뒤에</em> 해야 한다. 그 전에 하면 안 된다. 마무리 중인 요청도 데이터베이스는 계속 써야 한다. 커넥션 풀부터 놓아 버리면, 곱게 끝내 주려던 그 요청들의 발밑을 걷어차는 꼴이 된다.</p>
        <pre><code>{`✓ Shut down the HTTP server → release the DB connection   (correct order)
✗ Release the DB connection → shut down the HTTP server   (in-flight requests can't use the DB)`}</code></pre>
        <p>정리 작업 자체도 예외를 던지면 안 된다. 정리 단계에서 예외가 날 수 있으면 try-catch로 감싸고 로그만 남기면 된다. 정리 도중에 잡히지 않은 예외가 나면 그 뒤에 남은 리소스 해제 단계가 전부 건너뛰어진다. "DB 커넥션이 좀 지저분하게 닫혔다"로 끝날 일이 "코드가 거기까지 가지 못해서 메시지 큐 커넥션까지 샜다"로 커진다.</p>
        <h2>체크리스트</h2>
        <ul>
          <li>SIGTERM이 오자마자, 다른 무엇보다 먼저 readiness가 실패로 바뀌는가?</li>
          <li>종료하는 내내 liveness는 무슨 일이 있어도 200을 유지하는가?</li>
          <li>프로세스가 npm/yarn 래퍼 없이 PID 1로 도는가?</li>
          <li><code>terminationGracePeriodSeconds</code>를 배치 작업까지 감안해 p99보다 넉넉하게 잡았는가?</li>
          <li>리소스 정리는 HTTP 서버가 새 요청을 그만 받은 뒤에만 도는가?</li>
          <li>정리 단계 하나가 실패해도 나머지를 건너뛰지 않도록 단계마다 감싸 두었는가?</li>
        </ul>
        <div className="article-note"><strong>더 볼 자료</strong><p>
          <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/docs/architecture/graceful-shutdown.md" target="_blank" rel="noreferrer">docs/architecture/graceful-shutdown.md</a>(같은 백엔드 설계(DDD, CQRS, Outbox)를 5개 언어로 나란히 구현해 둔 내 예제 프로젝트의 종료 순서 전체와 probe 설정) · <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/docs/architecture/container.md" target="_blank" rel="noreferrer">docs/architecture/container.md</a>(이 글이 전제하는 Dockerfile CMD 컨벤션)
        </p></div>
      </>
    ),
  },
};

export default function GracefulShutdown() {
  const { locale } = useLocale();
  const c = content[locale];

  return (
    <PostLayout slug="graceful-shutdown" kicker={c.kicker} title={c.title} lede={c.lede}>
      {c.body}
    </PostLayout>
  );
}
