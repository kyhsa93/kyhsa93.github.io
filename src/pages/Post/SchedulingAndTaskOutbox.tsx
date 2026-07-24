import PostLayout from '../../components/PostLayout';
import { useLocale } from '../../lib/locale';

const content = {
  en: {
    kicker: 'Scheduling · Backend',
    title: (
      <>
        Scheduling and the<br /><em>Task Outbox Pattern</em>
      </>
    ),
    lede: "A Cron job that runs business logic directly works fine right up until you have two instances of your service, both running it at the same moment. Scheduling done properly is really a story about who's allowed to do what, in what order.",
    body: (
      <>
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
      </>
    ),
  },
  ko: {
    kicker: 'Scheduling · Backend',
    title: (
      <>
        스케줄링과<br /><em>Task Outbox 패턴</em>
      </>
    ),
    lede: '비즈니스 로직을 직접 실행하는 Cron job은 서비스 인스턴스가 하나일 때는 잘 작동한다 — 문제는 인스턴스가 두 개가 되어 동시에 같은 작업을 실행하는 순간부터다. 제대로 된 스케줄링이란 결국 누가, 어떤 순서로, 무엇을 할 수 있는지에 관한 이야기다.',
    body: (
      <>
        <p>주기적 작업(periodic work)과 배치 처리에는 프로토타이핑 단계에서는 건너뛰기 쉽지만 나중에 갖추려면 비용이 커지는 세 가지 요구사항이 따른다: Scheduler는 비즈니스 로직이 있는 Application 계층이 아니라 Infrastructure 계층에 속해야 하고; Task handler는 멱등(idempotent)해야 한다 — 메시지 큐는 at-least-once 전달을 보장하므로 같은 Task가 두 번 실행될 수 있기 때문이다; 그리고 메시지 큐를 쓴다면 Dead Letter Queue는 나중에 덧붙이는 게 아니라 기본값이어야 한다 — 무한 재시도를 막고, poison message가 뒤에 있는 모든 것을 막기 전에 격리해준다.</p>
        <h2>Scheduler는 오직 Enqueue만 한다</h2>
        <p>Scheduler는 비즈니스 로직을 직접 실행하지 않는다. Scheduler가 하는 일은 오직 큐에 Task를 enqueue하는 것뿐이다; 실제 작업은 나중에, Task Consumer가 메시지를 수신하고 Command Service를 호출할 때 일어난다.</p>
        <pre><code>{`[Scheduler] --(enqueue)--> [task_outbox] --(Relay)--> [message queue] --(Consumer)--> [TaskController] --(calls)--> [CommandService]`}</code></pre>
        <p>이 간접화(indirection)로 한 번에 네 가지를 얻는다. 여러 인스턴스에서 안전하다 — 여러 인스턴스가 동시에 같은 Cron을 실행하더라도, FIFO 큐의 중복 제거(deduplication) 덕분에 실제로는 단 하나의 사본만 처리된다. 재시도는 공짜로 따라온다 — Consumer가 실패하면 visibility timeout이 지난 뒤 메시지가 자동으로 재전달되고, 최대 수신 횟수를 넘으면 DLQ로 격상된다. Backpressure를 제공한다 — 워크로드 급증은 그냥 큐에 쌓였다가 Consumer 자신의 처리 속도에 맞춰 소진될 뿐, 하류(downstream)의 무언가를 압도하지 않는다. 그리고 관측 가능(observable)하다 — 큐 지표(메시지 수, 처리 지연, DLQ 수)만으로도 비즈니스 로직 자체를 계측하지 않고 배치의 상태를 알 수 있다.</p>
        <p>이 저장소의 NestJS 구현에서 가져온 실제 Cron handler다 — 이자 지급(interest-payment) scheduler는 정확히 한 가지 일, 즉 enqueue만 하고 그 외에는 아무것도 하지 않는다:</p>
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
        <p>날짜를 찍은 <code>dedupId</code> 덕분에 이 방식은 여러 인스턴스에서 동시에 실행되더라도 안전하다. 세 개의 인스턴스가 같은 FIFO dedup window 안에서 모두 이 handler를 실행하더라도, 세 번의 시도 모두 동일한 <code>dedupId</code>를 갖는다 — 실제로 큐에 들어가는 건 그중 단 하나뿐이다. 그리고 enqueue 호출을 감싸는 명시적인 try-catch에는 주석에 적힌 그대로의 이유가 있다: 여기서 쓰는 스케줄링 라이브러리는 Cron handler 안에서 던져진 예외를 조용히 삼켜버리므로, 이 catch-and-log가 없다면 enqueue 실패는 아무 흔적도 없이 그냥 사라져버릴 것이다.</p>
        <h2>같은 Scheduler를, Cron 데코레이터가 있을 때와 없을 때</h2>
        <p>Spring Boot 버전도 동일한 cron 표현식 관용구를 쓰지만, NestJS의 데코레이터 대신 표준 라이브러리 애노테이션을 사용한다:</p>
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
        <p>Go에는 메서드를 데코레이트할 스케줄링 라이브러리 자체가 없으므로, 같은 아이디어가 자체 ticker 루프를 도는 평범한 goroutine으로 구현된다 — 프로세스 안의 다른 모든 백그라운드 루프가 지켜보는 것과 동일한 shutdown context를 지켜보면서:</p>
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
        <p>세 가지 구현, 프레임워크 지원의 정도도 제각각이다 — 데코레이터, 애노테이션, 손으로 짠 ticker — 하지만 세 곳 모두 내부적으로는 동일한 형태로 귀결된다: enqueue만 한다, 스택 어딘가에서 예외를 조용히 삼키는 경향이 있으므로 실패는 명시적으로 로그를 남긴다, 그리고 인스턴스들을 직접 조율하려 하기보다 날짜 기반 dedup ID가 다중 인스턴스 상황을 흡수하게 둔다.</p>
        <h2>Enqueue는 DB 변경과 원자적이어야 한다</h2>
        <p>Command Service 내부에서 메시지 큐에 <code>SendMessage</code>를 직접 호출하면, 신뢰성 있는 이벤트 기반 설계 전반에서 흔히 다루는 것과 동일한 dual-write 문제가 생긴다 — DB는 커밋됐는데 메시지 전송은 실패하거나, 메시지는 전송됐는데 DB는 롤백되는 식으로, 아무도 지켜보지 않는 불일치가 생긴다. 해법은 Domain Event에 쓰던 것과 같은 Outbox 패턴이다: DB 변경과 같은 트랜잭션 안에서 <code>task_outbox</code> 테이블에 기록하고, 별도의 Relay가 그 테이블을 폴링해 트랜잭션이 실제로 커밋된 이후에만 발행하게 한다.</p>
        <pre><code>{`// An Application Service — the DB change and enqueuing the Task happen in the same transaction
await transactionManager.run(async () => {
  await orderRepository.saveOrder(order)
  await taskQueue.enqueue(
    'order.archive',
    { orderId: order.orderId },
    { groupId: order.orderId, deduplicationId: \`order.archive-\${order.orderId}\` }
  )
})`}</code></pre>
        <p>트랜잭션 컨텍스트가 아예 없는 경우 — 예를 들어 Cron tick에서 실행되는 Scheduler 내부 — 에도 동일한 경로를 사용한다. 단일 row insert이므로 그 자체로 자연스럽게 원자적이고, 모든 enqueue 지점에 하나로 통일된 경로를 두면 멘탈 모델이 단순해진다: 무엇이 트리거했든 enqueue는 언제나 outbox 테이블에 쓰는 행위이며, 큐 클라이언트를 직접 호출하는 일은 결코 없다.</p>
        <h2>Task Controller는 Handler가 아니라 Interface 계층의 Adapter다</h2>
        <p>HTTP Controller가 HTTP 요청을 받아 Application Service에 위임하듯, Task Controller는 메시지 큐 메시지를 받아 Command Service를 호출한다 — 자체적인 조건 분기나 비즈니스 규칙은 전혀 없이. 그리고 HTTP Controller와 달리, 에러를 잡아서 변환하는 일도 절대 하지 않는다; 그대로 rethrow할 뿐인데, 그 예외가 재시도로 이어질지 DLQ행으로 이어질지는 Consumer가 결정하기 때문이다.</p>
        <pre><code>{`class OrderTaskController {
  constructor(private readonly orderCommandService: OrderCommandService) {}

  async archive(payload: ArchiveOrderCommand): Promise<void> {
    await this.orderCommandService.archiveOrder(payload)  // the exception propagates as-is
  }
}`}</code></pre>
        <h2>멱등성(Idempotency)의 세 단계</h2>
        <p>전달이 at-least-once이므로, Task handler는 몇 번을 실행되든 같은 결과를 내야 한다. Level 1은 본질적으로 멱등하다 — handler 자체 로직이 반복해도 자연히 안전한 경우로, 이미 만료된 주문을 archive하는 것처럼 이미 archive된 것을 다시 처리해도 아무 일도 일어나지 않는다(no-op). Level 2는 원장(ledger)을 사용한다 — 실제 side effect가 있는 handler가 특정 ID를 처리했음을 기록해두고, 중복을 발견하면 건너뛴다. Level 3는 강한 원자성이 필요하다 — handler 로직과 ledger 기록을 같은 트랜잭션으로 묶어서, 부분 실패로 인해 한쪽만 기록되는 일이 절대 없게 한다.</p>
        <h2>이 패턴이 실제로 드러낸 진짜 버그들</h2>
        <p>동일한 아키텍처를 다섯 개의 서로 다른 언어 구현으로 배포하는 과정에서, 설계 리뷰만으로는 절대 드러나지 않았을 구체적인 버그들이 나왔다 — 각 버그는 실제 인프라와 실제 동시 테스트 실행이 개입되어야만 나타났기 때문이다. 한 구현에서는 SQS task-queue 설정에 필수 config 필드가 새로 생겼는데, 여섯 개의 end-to-end 테스트 클래스 중 다섯 개가 그 값을 설정하지 않아 정확히 그 테스트들에서 앱의 부팅 시퀀스가 깨졌다. 다른 구현에서는 정말로 미묘한 SQS FIFO 충돌이 있었다: 같은 테스트 실행 안에서 같은 월간 scheduler를 호출하는 여러 테스트 메서드가 전부 동일한 날짜 기반 <code>dedupId</code>를 만들어냈는데, dedup window가 분 단위였기 때문이다 — 그래서 첫 번째 호출만 실제로 큐에 도달했고, 나머지는 조용히 중복 제거되어 사라졌으며, 의존하고 있던 시나리오가 실제로는 전혀 실행되지 않았는데도 다른 시나리오의 assertion이 우연히 통과해버리는 거짓 양성(false-positive) 테스트 통과가 나올 뻔했다.</p>
        <div className="article-note"><strong>두 버그 밑에 깔린 교훈</strong><p>인메모리 fake 큐를 쓰는 유닛 테스트는 실제 dedup window도, 실제 컬럼 길이 제약도, 실제 필수 config 검사도 결코 겪지 않는다 — fake는 그중 어느 것도 강제하지 않으므로 애초에 그럴 수가 없다. 스케줄링 기능은 실제 인프라를 대상으로, 실제 동시 호출로 최소 한 번은 실행해보기 전까지는 제대로 검증된 게 아니다.</p></div>
        <h2>Payload 규율</h2>
        <p>SQS는 메시지 하나를 256KB로 제한하는데, 이는 장애 상황에서 뒤늦게 발견하기보다 처음부터 설계에 반영해둘 가치가 있는 확실한 상한선이다. Payload에는 <code>{`{ orderId: 'o1' }`}</code> 같은 작은 메타데이터만 담고, 크기가 큰 것은 전부 S3로 내려서 메시지 자체에는 storage key만 실어 보낸다.</p>
        <div className="article-note"><strong>저장소 내 추가 자료</strong><p>
          <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/docs/architecture/scheduling.md" target="_blank" rel="noreferrer">docs/architecture/scheduling.md</a> — 전체 Task Outbox 패턴, MessageGroupId 전략, DLQ 모니터링 · <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/implementations/nestjs/examples/src/account/infrastructure/account-interest-scheduler.ts" target="_blank" rel="noreferrer">account-interest-scheduler.ts</a> — 위 실제 scheduler를 실제 코드 맥락에서
        </p></div>
      </>
    ),
  },
};

export default function SchedulingAndTaskOutbox() {
  const { locale } = useLocale();
  const c = content[locale];

  return (
    <PostLayout slug="scheduling-and-task-outbox" kicker={c.kicker} title={c.title} lede={c.lede}>
      {c.body}
    </PostLayout>
  );
}
