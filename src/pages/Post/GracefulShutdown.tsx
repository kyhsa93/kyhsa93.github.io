import PostLayout from '../../components/PostLayout';
import { useLocale } from '../../lib/locale';

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
        <p>In a container orchestration environment — Kubernetes, ECS, anything that starts and stops containers on your behalf — every deploy, every autoscale-down event, every node drain sends the same signal: SIGTERM, with a countdown before SIGKILL follows. What your process does in that window is the difference between a deploy nobody notices and a spike of failed requests on a dashboard somewhere.</p>
        <h2>The Sequence, and Why the Order Is the Whole Point</h2>
        <p>Six steps, and they have to happen in this order: the orchestrator sends SIGTERM; the readiness probe flips to failing immediately, so the load balancer stops sending new traffic; in-flight requests are given time to finish; the HTTP server shuts down; resources — DB connections, message-queue connections — are cleaned up; the process exits cleanly with code 0.</p>
        <p>The readiness flip has to happen before the HTTP server shuts down. Get that backward, and there's a window where the load balancer still thinks the instance is healthy and keeps routing traffic to a server that's actively closing — which is exactly the shape of a "random 502s during deploys" incident that looks intermittent and unrelated to any code change.</p>
        <h2>Liveness and Readiness Are Not the Same Probe</h2>
        <p>Liveness answers "is the process alive" — on failure, the container gets restarted. Readiness answers "is it ready to receive traffic" — on failure, it's removed from the load balancer, nothing more drastic. During shutdown, liveness should keep returning 200 (it's still alive, just finishing up), while readiness should return 503 (stop sending it anything new).</p>
        <pre><code>{`isShuttingDown = false

// on receiving SIGTERM
isShuttingDown = true

// GET /health/ready
if (isShuttingDown) return 503
return 200

// GET /health/live
return 200  // always`}</code></pre>
        <div className="article-note"><strong>The common mistake</strong><p>If liveness also returns 503 while shutting down, the orchestrator reads that as "the process is unhealthy" and restarts the container — mid-shutdown, before it finished draining in-flight requests cleanly. Liveness must always return 200 regardless of shutdown state; only readiness is allowed to change.</p></div>
        <h2>terminationGracePeriodSeconds</h2>
        <p>This is how long the orchestrator waits after SIGTERM before escalating to SIGKILL, which force-kills the process with no further cleanup at all. Give it comfortable headroom over the service's p99 request-processing time — 30 seconds is usually enough for a typical HTTP service. If there are batch or scheduled jobs that might be mid-run at shutdown time, factor in their maximum processing time too, not just the HTTP p99.</p>
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
        <p>If npm or yarn sits in between as a wrapper, SIGTERM is delivered to that wrapper process, not directly to the application — delivery to the actual app may be delayed, or in some setups may never happen at all before SIGKILL arrives. Running the application directly gives it PID 1 inside the container, so it receives SIGTERM the moment the orchestrator sends it, with nothing standing between the signal and the code that's supposed to react to it.</p>
        <h2>A Framework Flag vs. Writing the Sequence by Hand</h2>
        <p>How much of the sequence above you have to write yourself depends entirely on whether the framework already has an opinion about it. Spring Boot turns almost the whole thing into a single config line:</p>
        <pre><code>{`server:
  shutdown: graceful

spring:
  lifecycle:
    timeout-per-shutdown-phase: 30s`}</code></pre>
        <p><code>server.shutdown: graceful</code> makes Spring itself stop accepting new requests and wait for in-flight ones to finish before closing, and Actuator's liveness/readiness probes already exist as separate endpoints out of the box — the six-step sequence is mostly the framework's problem, not the application code's.</p>
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
        <p>Nothing here is Go-specific wisdom — it's the same six steps from the top of this post, just with no framework hiding the ordering from you. <code>ctx</code> being cancelled on SIGTERM is also what stops every other background loop in the process — the Outbox poller, the Task Queue consumer, the schedulers — all watching the same context, so one signal cleanly unwinds everything without a separate shutdown hook per component.</p>
        <h2>Cleanup Order, and What Not to Do During It</h2>
        <p>Resource cleanup — releasing DB connections, closing message-queue clients — runs <em>after</em> the HTTP server has closed, never before. In-flight requests still need to reach the database while they're finishing up; releasing the connection pool first pulls the floor out from under exactly the requests you were trying to let finish gracefully in the first place.</p>
        <pre><code>{`✓ Shut down the HTTP server → release the DB connection   (correct order)
✗ Release the DB connection → shut down the HTTP server   (in-flight requests can't use the DB)`}</code></pre>
        <p>And cleanup itself shouldn't throw. If one cleanup step raises an exception, wrap it in a try-catch and just log it — an uncaught exception mid-cleanup means every resource-release step after it in the sequence gets skipped, turning "the DB connection didn't close as cleanly as it could have" into "the message-queue connection leaked too, because the code never got there."</p>
        <h2>A Checklist</h2>
        <ul>
          <li>Does readiness flip to failing the instant SIGTERM arrives, before anything else happens?</li>
          <li>Does liveness stay 200 throughout shutdown, no matter what?</li>
          <li>Does the process run as PID 1, with no npm/yarn wrapper in between?</li>
          <li>Is <code>terminationGracePeriodSeconds</code> set with real headroom over p99, including any batch jobs?</li>
          <li>Does resource cleanup run strictly after the HTTP server has stopped accepting new work?</li>
          <li>Is every cleanup step wrapped so one failure doesn't skip the rest?</li>
        </ul>
        <div className="article-note"><strong>Further reading in the repo</strong><p>
          <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/docs/architecture/graceful-shutdown.md" target="_blank" rel="noreferrer">docs/architecture/graceful-shutdown.md</a> — the full shutdown sequence and probe-configuration reference · <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/docs/architecture/container.md" target="_blank" rel="noreferrer">docs/architecture/container.md</a> — the Dockerfile CMD convention this depends on
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
    lede: 'Kubernetes가 요청 처리 도중 SIGTERM을 보냈을 때 무슨 일이 벌어지는지에 대한 통합 테스트를 작성하는 사람은 없다. 그런데 순서를 잘못 잡으면, 이건 배포할 때마다 요청이 유실되고 502가 발생하는 가장 확실한 원인 중 하나이기도 하다.',
    body: (
      <>
        <p>컨테이너 오케스트레이션 환경 — Kubernetes, ECS, 대신 컨테이너를 시작하고 종료해 주는 무엇이든 — 에서는 모든 배포, 모든 오토스케일 다운, 모든 노드 드레인이 동일한 신호를 보낸다: SIGTERM, 그리고 그 뒤에 SIGKILL이 뒤따르기까지의 카운트다운. 그 시간 동안 프로세스가 무엇을 하느냐에 따라, 아무도 눈치채지 못하고 지나가는 배포가 될 수도 있고, 어딘가의 대시보드에 실패한 요청이 급증하는 배포가 될 수도 있다.</p>
        <h2>순서, 그리고 왜 순서 자체가 핵심인가</h2>
        <p>여섯 단계가 있고, 반드시 이 순서대로 일어나야 한다: 오케스트레이터가 SIGTERM을 보낸다; readiness probe가 즉시 실패로 전환되어 로드밸런서가 새 트래픽 전송을 멈춘다; 진행 중인(in-flight) 요청들에 마무리할 시간이 주어진다; HTTP 서버가 종료된다; DB 커넥션, 메시지 큐 커넥션 같은 리소스가 정리된다; 프로세스가 코드 0으로 깔끔하게 종료된다.</p>
        <p>readiness 전환은 HTTP 서버가 종료되기 전에 일어나야 한다. 순서를 뒤바꾸면, 로드밸런서가 여전히 해당 인스턴스를 정상으로 여기고 이미 활발히 종료 중인 서버로 트래픽을 계속 라우팅하는 구간이 생긴다 — 바로 이것이 "배포 중 랜덤 502" 장애의 전형적인 모양새다. 배포 중에만 간헐적으로 나타나고, 코드 변경과는 딱히 관련 없어 보이는 그 장애 말이다.</p>
        <h2>Liveness와 Readiness는 같은 probe가 아니다</h2>
        <p>Liveness는 "프로세스가 살아 있는가"에 답한다 — 실패하면 컨테이너가 재시작된다. Readiness는 "트래픽을 받을 준비가 되었는가"에 답한다 — 실패하면 로드밸런서에서 제외될 뿐, 그 이상의 극단적인 조치는 없다. 종료(shutdown) 중에는 liveness가 계속 200을 반환해야 하고(아직 살아 있고 마무리 중일 뿐이므로), readiness는 503을 반환해야 한다(더 이상 아무것도 새로 보내지 말라는 뜻으로).</p>
        <pre><code>{`isShuttingDown = false

// on receiving SIGTERM
isShuttingDown = true

// GET /health/ready
if (isShuttingDown) return 503
return 200

// GET /health/live
return 200  // always`}</code></pre>
        <div className="article-note"><strong>흔한 실수</strong><p>종료 중에 liveness도 503을 반환하면, 오케스트레이터는 이를 "프로세스가 비정상"이라고 읽고 컨테이너를 재시작한다 — 진행 중인 요청을 깔끔하게 다 처리하기도 전에, 종료 도중에 말이다. Liveness는 종료 상태와 무관하게 항상 200을 반환해야 하며, 오직 readiness만 값이 바뀌어도 된다.</p></div>
        <h2>terminationGracePeriodSeconds</h2>
        <p>이는 오케스트레이터가 SIGTERM을 보낸 뒤 SIGKILL로 격상하기까지 기다리는 시간이며, SIGKILL은 그 이상의 정리 작업 없이 프로세스를 강제 종료한다. 서비스의 p99 요청 처리 시간보다 여유 있게 잡아라 — 일반적인 HTTP 서비스라면 보통 30초면 충분하다. 종료 시점에 배치나 스케줄 작업이 진행 중일 수 있다면, HTTP p99뿐 아니라 그 작업들의 최대 처리 시간도 함께 감안해야 한다.</p>
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
        <h2>프로세스를 래퍼 없이 직접 실행하기</h2>
        <pre><code>{`# correct — runs the process directly as PID 1
CMD ["node", "dist/main.js"]

# wrong — npm sits in between and delays SIGTERM delivery
CMD ["npm", "run", "start:prod"]`}</code></pre>
        <p>npm이나 yarn이 래퍼로 그 사이에 끼어 있으면, SIGTERM은 애플리케이션에 직접 전달되는 게 아니라 그 래퍼 프로세스로 전달된다 — 실제 앱으로의 전달이 지연되거나, 일부 환경에서는 SIGKILL이 오기 전까지 아예 전달되지 않을 수도 있다. 애플리케이션을 직접 실행하면 컨테이너 안에서 PID 1이 되므로, 오케스트레이터가 SIGTERM을 보내는 순간 그대로 받게 되고, 신호와 그에 반응해야 할 코드 사이에 아무것도 끼어들지 않는다.</p>
        <h2>프레임워크 설정 한 줄 vs. 시퀀스를 직접 작성하기</h2>
        <p>위 시퀀스 중 얼마나 많은 부분을 직접 작성해야 하는지는 전적으로 프레임워크가 이미 이에 대한 입장을 갖고 있는지에 달려 있다. Spring Boot는 거의 전체를 설정 한 줄로 바꿔 준다:</p>
        <pre><code>{`server:
  shutdown: graceful

spring:
  lifecycle:
    timeout-per-shutdown-phase: 30s`}</code></pre>
        <p><code>server.shutdown: graceful</code>는 Spring 자체가 새 요청 수신을 멈추고 진행 중인 요청이 끝날 때까지 기다린 뒤 종료하도록 만들며, Actuator의 liveness/readiness probe는 이미 별도의 엔드포인트로 기본 제공된다 — 여섯 단계 시퀀스의 대부분은 애플리케이션 코드가 아니라 프레임워크의 몫이 된다.</p>
        <p>Go에는 그 역할을 대신해 줄 프레임워크가 없으므로, 시퀀스의 모든 단계를 문서가 규정한 순서 그대로 명시적으로 작성해야 한다:</p>
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
        <p>여기 있는 것 중 Go만의 특별한 노하우는 없다 — 이 글 맨 위에서 소개한 여섯 단계와 똑같고, 다만 순서를 감춰 주는 프레임워크가 없을 뿐이다. SIGTERM이 오면 <code>ctx</code>가 취소되는데, 이는 프로세스 안의 다른 모든 백그라운드 루프 — Outbox poller, Task Queue consumer, 스케줄러 — 를 함께 멈추는 신호이기도 하다. 모두가 같은 context를 지켜보고 있기 때문에, 신호 하나로 컴포넌트마다 별도의 shutdown hook 없이도 모든 것이 깔끔하게 정리된다.</p>
        <h2>정리 순서, 그리고 그 도중에 하지 말아야 할 것</h2>
        <p>리소스 정리 — DB 커넥션 해제, 메시지 큐 클라이언트 종료 — 는 HTTP 서버가 닫힌 <em>이후</em>에 실행되어야 하며, 그 전에 실행되어서는 안 된다. 진행 중인 요청들은 마무리되는 동안에도 여전히 데이터베이스에 접근해야 한다; 커넥션 풀을 먼저 해제해 버리면, 애초에 정상적으로 끝마치게 해 주려던 바로 그 요청들의 발밑을 걷어차는 셈이 된다.</p>
        <pre><code>{`✓ Shut down the HTTP server → release the DB connection   (correct order)
✗ Release the DB connection → shut down the HTTP server   (in-flight requests can't use the DB)`}</code></pre>
        <p>그리고 정리 작업 자체는 예외를 던지면 안 된다. 정리 단계 하나가 예외를 발생시킨다면, try-catch로 감싸고 그냥 로그만 남겨라 — 정리 도중 잡히지 않은 예외가 발생하면 그 이후에 시퀀스에 남아 있던 모든 리소스 해제 단계가 건너뛰어져, "DB 커넥션이 최대한 깔끔하게 닫히지는 못했다" 정도의 문제가 "코드가 거기까지 도달하지 못해서 메시지 큐 커넥션까지 함께 leak됐다"로 번지게 된다.</p>
        <h2>체크리스트</h2>
        <ul>
          <li>SIGTERM이 도착하는 즉시, 다른 무엇보다 먼저 readiness가 실패로 전환되는가?</li>
          <li>종료 과정 내내 liveness는 무슨 일이 있어도 200을 유지하는가?</li>
          <li>프로세스가 npm/yarn 래퍼 없이 PID 1로 실행되는가?</li>
          <li><code>terminationGracePeriodSeconds</code>가 배치 작업까지 포함해 p99 대비 실질적인 여유를 두고 설정되어 있는가?</li>
          <li>리소스 정리가 HTTP 서버가 새 작업 수신을 멈춘 이후에만 엄격하게 실행되는가?</li>
          <li>정리 단계 하나가 실패해도 나머지가 건너뛰어지지 않도록 각 단계가 감싸져 있는가?</li>
        </ul>
        <div className="article-note"><strong>저장소 내 추가 자료</strong><p>
          <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/docs/architecture/graceful-shutdown.md" target="_blank" rel="noreferrer">docs/architecture/graceful-shutdown.md</a> — 전체 종료 시퀀스와 probe 설정 레퍼런스 · <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/docs/architecture/container.md" target="_blank" rel="noreferrer">docs/architecture/container.md</a> — 이 글이 전제하는 Dockerfile CMD 컨벤션
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
