import PostLayout from '../../components/PostLayout';

export default function GracefulShutdown() {
  return (
    <PostLayout
      slug="graceful-shutdown"
      kicker="Reliability · Operations"
      title={<>Graceful Shutdown:<br /><em>The Reliability Feature Nobody Tests</em></>}
      lede="Nobody writes an integration test for what happens when Kubernetes sends SIGTERM mid-request. It's also one of the most reliable sources of dropped requests and 502s during every single deploy, if you get the ordering wrong."
      date="2026.07.22"
      readMinutes={11}
    >
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
      <p>None of this shows up in a demo, and none of it shows up in a typical test suite either — it only shows up in production, during a deploy, as either nothing happening or a burst of errors that someone has to explain afterward. That asymmetry is exactly why it's worth getting right before it's needed, not after the first incident that traces back to it.</p>
      <div className="article-note"><strong>Further reading in the repo</strong><p>
        <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/docs/architecture/graceful-shutdown.md" target="_blank" rel="noreferrer">docs/architecture/graceful-shutdown.md</a> — the full shutdown sequence and probe-configuration reference · <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/docs/architecture/container.md" target="_blank" rel="noreferrer">docs/architecture/container.md</a> — the Dockerfile CMD convention this depends on
      </p></div>
    </PostLayout>
  );
}
