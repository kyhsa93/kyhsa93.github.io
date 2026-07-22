import PostLayout from '../../components/PostLayout';

export default function SchedulingAndTaskOutbox() {
  return (
    <PostLayout
      kicker="Scheduling · Backend"
      title={<>Scheduling and the<br /><em>Task Outbox Pattern</em></>}
      lede="A Cron job that runs business logic directly works fine right up until you have two instances of your service, both running it at the same moment. Scheduling done properly is really a story about who's allowed to do what, in what order."
      date="2026.07.22"
      readMinutes={13}
    >
      <p>Periodic work and batch processing come with three requirements that are easy to skip when you're prototyping and expensive to retrofit later: the Scheduler belongs in the Infrastructure layer, never the Application layer where business logic lives; a Task handler is idempotent, since a message queue is at-least-once delivery and the same Task can run twice; and if you use a message queue at all, a Dead Letter Queue is the default, not an afterthought — it stops infinite retries and isolates a poison message before it blocks everything behind it.</p>
      <h2>The Scheduler Only Enqueues</h2>
      <p>A Scheduler never runs business logic directly. All it does is enqueue a Task onto a queue; the actual work happens later, when a Task Consumer receives the message and calls a Command Service.</p>
      <pre><code>{`[Scheduler] --(enqueue)--> [task_outbox] --(Relay)--> [message queue] --(Consumer)--> [TaskController] --(calls)--> [CommandService]`}</code></pre>
      <p>This indirection buys four things at once. It's safe with multiple instances — even if several instances fire the same Cron at the same moment, a FIFO queue's deduplication means only one copy gets processed. Retries come for free — a Consumer failure means the message is automatically redelivered once the visibility timeout passes, escalating to the DLQ once a maximum receive count is exceeded. It gives you backpressure — a workload spike just piles up in the queue and drains at the Consumer's own processing rate, instead of overwhelming whatever's downstream. And it's observable — queue metrics (message count, processing lag, DLQ count) tell you the batch's health without instrumenting the business logic itself.</p>
      <p>Here's a real Cron handler from this repo's NestJS implementation — an interest-payment scheduler that does exactly one thing, enqueue, and nothing else:</p>
      <pre><code>{`@Injectable()
export class AccountInterestScheduler {
  private readonly logger = new Logger(AccountInterestScheduler.name)

  constructor(private readonly taskQueue: TaskQueue) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  public async enqueueDailyInterest(): Promise<void> {
    const now = new Date()
    const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
    const dateStamp = today.toISOString().slice(0, 10)
    const dedupId = \`account.apply-daily-interest-\${dateStamp}\`

    try {
      await this.taskQueue.enqueue(
        'account.apply-daily-interest',
        { today: today.toISOString() },
        { groupId: 'account.interest', deduplicationId: dedupId }
      )
      this.logger.log({ message: 'Daily interest Task enqueued', dedup_id: dedupId })
    } catch (error) {
      // @nestjs/schedule silently swallows exceptions from Cron handlers, so log explicitly.
      this.logger.error({ message: 'Failed to enqueue daily interest Task', dedup_id: dedupId, error })
    }
  }
}`}</code></pre>
      <p>The date-stamped <code>dedupId</code> is what makes this safe across multiple running instances. If three instances all fire this handler within the same FIFO dedup window, all three attempts carry the identical <code>dedupId</code> — only one actually enters the queue. And the explicit try-catch around the enqueue call is there for a reason called out directly in the comment: the scheduling library used here silently swallows exceptions thrown inside a Cron handler, so without that catch-and-log, a failed enqueue would simply vanish with no trace at all.</p>
      <h2>The Same Scheduler, With and Without a Cron Decorator</h2>
      <p>Spring Boot's version reaches for the identical cron-expression idiom, just with a standard library annotation instead of a NestJS one:</p>
      <pre><code>{`@Component
@RequiredArgsConstructor
public class InterestPaymentScheduler {
    private static final String TASK_TYPE = "account.pay-interest";
    private static final String GROUP_ID = "account.interest";
    private final TaskOutboxWriter taskOutboxWriter;

    @Scheduled(cron = "0 0 3 * * *") // Every day at 3 AM
    public void enqueueDailyInterestPayment() {
        try {
            LocalDate today = LocalDate.now();
            String dedupId = TASK_TYPE + "-" + today;
            taskOutboxWriter.enqueue(TASK_TYPE, new Payload(today), GROUP_ID, dedupId);
        } catch (Exception e) {
            log.error("Failed to enqueue the interest-payment Task", e);
        }
    }
}`}</code></pre>
      <p>Go has no scheduling library at all to decorate a method with, so the same idea is a plain goroutine running its own ticker loop, watching the same shutdown context every other background loop in the process watches:</p>
      <pre><code>{`func (s *InterestScheduler) Run(ctx context.Context) {
	ticker := time.NewTicker(24 * time.Hour)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			if err := s.EnqueueDailyInterest(ctx, time.Now().UTC()); err != nil {
				// Many scheduling libraries silently swallow Cron exceptions — this one
				// always logs it explicitly. Retried on the next tick 24 hours later,
				// so it is not re-thrown here.
				slog.ErrorContext(ctx, "interest payment task enqueue failed", "error", err)
			}
		}
	}
}

func (s *InterestScheduler) EnqueueDailyInterest(ctx context.Context, today time.Time) error {
	date := today.Format("2006-01-02")
	dedupID := "account.apply-interest-" + date
	payload := []byte(\`{"date":"\` + date + \`"}\`)
	return s.taskQueue.Enqueue(ctx, "account.apply-interest", payload, dedupID)
}`}</code></pre>
      <p>Three implementations, three different amounts of framework support — a decorator, an annotation, a hand-rolled ticker — and all three land on the identical shape underneath: enqueue only, log the failure explicitly because something in the stack tends to swallow it silently, and let a date-based dedup ID absorb the multi-instance case rather than trying to coordinate instances directly.</p>
      <h2>Enqueuing Must Be Atomic With the DB Change</h2>
      <p>Calling <code>SendMessage</code> directly on a message queue from inside a Command Service creates the same dual-write problem covered in reliable event-driven design generally — the DB commits but the message send fails, or the message sends but the DB rolls back, and now there's an inconsistency nobody's watching for. The fix is the same Outbox pattern used for Domain Events: write to a <code>task_outbox</code> table inside the same transaction as the DB change, and let a separate Relay poll that table and publish once the transaction has actually committed.</p>
      <pre><code>{`// An Application Service — the DB change and enqueuing the Task happen in the same transaction
await transactionManager.run(async () => {
  await orderRepository.saveOrder(order)
  await taskQueue.enqueue(
    'order.archive',
    { orderId: order.orderId },
    { groupId: order.orderId, deduplicationId: \`order.archive-\${order.orderId}\` }
  )
})`}</code></pre>
      <p>Use this same path even when there's no transaction context at all — like inside a Scheduler firing on a Cron tick. It's a single row insert, so it's naturally atomic on its own, and having one unified path for every enqueue site keeps the mental model simple: enqueuing always means writing to the outbox table, never calling the queue client directly, regardless of what triggered it.</p>
      <h2>The Task Controller Is an Interface-Layer Adapter, Not a Handler</h2>
      <p>Just as an HTTP Controller receives an HTTP request and delegates to an Application Service, a Task Controller receives a message-queue message and calls a Command Service — with no conditional branching or business rules of its own. And unlike an HTTP Controller, it never catches and converts the error; it rethrows as-is, because the Consumer is what decides whether that exception means retry or DLQ.</p>
      <pre><code>{`class OrderTaskController {
  constructor(private readonly orderCommandService: OrderCommandService) {}

  async archive(payload: ArchiveOrderCommand): Promise<void> {
    await this.orderCommandService.archiveOrder(payload)  // the exception propagates as-is
  }
}`}</code></pre>
      <h2>Three Levels of Idempotency</h2>
      <p>Since delivery is at-least-once, a Task handler must produce the same result no matter how many times it runs. Level 1 is inherently idempotent — the handler's own logic is naturally safe to repeat, like archiving already-expired orders, where re-processing an already-archived one is a no-op. Level 2 uses a ledger — a handler with real side effects records that it processed a given ID, and skips on seeing a duplicate. Level 3 needs strong atomicity — wrap both the handler logic and the ledger write in the same transaction, so a partial failure can never leave one written without the other.</p>
      <h2>Real Bugs This Pattern Actually Surfaced</h2>
      <p>Shipping this feature across five separate language implementations of the same architecture turned up concrete bugs that a design review alone wouldn't have — because each one only showed up once real infrastructure and real concurrent test runs were involved. One implementation had a config field become required for SQS task-queue configuration, but five of six end-to-end test classes never set it, breaking the app's boot sequence in exactly those tests. Another had a genuinely subtle SQS FIFO collision: several test methods calling the same monthly scheduler within the same test run all produced the identical date-based <code>dedupId</code>, since the dedup window is measured in minutes — so only the first call actually reached the queue, and the rest were silently deduplicated away, nearly producing a false-positive test pass where the assertion for one scenario happened to hold even though the scenario it depended on had never actually run.</p>
      <div className="article-note"><strong>The lesson underneath both bugs</strong><p>Unit tests using an in-memory fake queue never exercise a real dedup window, a real column-length constraint, or a real required-config check — they can't, because the fake doesn't enforce any of those. A scheduling feature isn't actually verified until it's been run against real infrastructure, with real concurrent invocations, at least once.</p></div>
      <h2>The Payload Discipline</h2>
      <p>SQS caps a single message at 256KB, which is a hard ceiling worth designing around from the start rather than discovering during an incident. Put only small metadata in the payload — something like <code>{`{ orderId: 'o1' }`}</code> — and offload anything large to S3, carrying only the storage key in the message itself.</p>
      <div className="article-note"><strong>Further reading in the repo</strong><p>
        <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/docs/architecture/scheduling.md" target="_blank" rel="noreferrer">docs/architecture/scheduling.md</a> — the full Task Outbox pattern, MessageGroupId strategy, and DLQ monitoring · <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/implementations/nestjs/examples/src/account/infrastructure/account-interest-scheduler.ts" target="_blank" rel="noreferrer">account-interest-scheduler.ts</a> — the real scheduler above, in context
      </p></div>
    </PostLayout>
  );
}
