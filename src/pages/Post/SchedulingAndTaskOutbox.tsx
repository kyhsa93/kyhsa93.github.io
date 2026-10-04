import PostLayout from '../../components/PostLayout';
import { useLocale, localeFromPathname } from '../../lib/locale';
import type { MetaFunction } from 'react-router';
import { createPostMeta } from '../../lib/seo';

export const meta: MetaFunction = ({ location }) =>
  createPostMeta('scheduling-and-task-outbox', localeFromPathname(location.pathname));

const content = {
  en: {
    kicker: 'Scheduling · Backend',
    title: (
      <>
        Scheduling and the<br /><em>Task Outbox Pattern</em>
      </>
    ),
    lede: "A Cron job that runs business logic directly works fine right up until you have two instances of your service, both running it at the same moment. Scheduling done properly is a story about who's allowed to do what, in what order.",
    body: (
      <>
        <p>Periodic work and batch processing come with three requirements that are easy to skip when you're prototyping and expensive to retrofit later: the Scheduler belongs in the Infrastructure layer, never the Application layer where business logic lives; a Task handler is idempotent, since a message queue is at-least-once delivery and the same Task can run twice; and if you use a message queue at all, a Dead Letter Queue is the default, not an afterthought, since it stops infinite retries and isolates a poison message before it blocks everything behind it.</p>
        <h2>The Scheduler Only Enqueues</h2>
        <p>A Scheduler never runs business logic directly. All it does is enqueue a Task onto a queue; the actual work happens later, when a Task Consumer receives the message and calls a Command Service.</p>
        <pre><code>{`[Scheduler] --(enqueue)--> [task_outbox] --(Relay)--> [message queue] --(Consumer)--> [TaskController] --(calls)--> [CommandService]`}</code></pre>
        <p>This indirection buys four things at once. It's safe with multiple instances: even if several instances fire the same Cron at the same moment, a FIFO queue's deduplication means only one copy gets processed. Retries come for free: a Consumer failure means the message is automatically redelivered once the visibility timeout passes, escalating to the DLQ once a maximum receive count is exceeded. It gives you backpressure: a workload spike just piles up in the queue and drains at the Consumer's own processing rate, instead of overwhelming whatever's downstream. And it's observable: queue metrics (message count, processing lag, DLQ count) tell you the batch's health without instrumenting the business logic itself.</p>
        <p>The interest-payment scheduler in this repo's NestJS implementation does one thing, enqueue, and nothing else:</p>
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
        <p>The date-stamped <code>dedupId</code> is what makes this safe across multiple running instances. If three instances all fire this handler within the same FIFO dedup window, all three attempts carry the identical <code>dedupId</code>, so only one enters the queue. And the explicit try-catch around the enqueue call is there for a reason called out directly in the comment: the scheduling library used here swallows exceptions thrown inside a Cron handler, so without that catch-and-log, a failed enqueue would simply vanish with no trace at all.</p>
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
        <p>Three implementations, three different amounts of framework support (a decorator, an annotation, a hand-rolled ticker), and all three land on the identical shape underneath: enqueue only, log the failure explicitly because something in the stack tends to swallow it, and let a date-based dedup ID absorb the multi-instance case rather than trying to coordinate instances directly.</p>
        <h2>Enqueuing Must Be Atomic With the DB Change</h2>
        <p>Calling <code>SendMessage</code> directly on a message queue from inside a Command Service creates the same dual-write problem covered in reliable event-driven design generally. The DB commits but the message send fails, or the message sends but the DB rolls back, and now there's an inconsistency nobody's watching for. The fix is the same Outbox pattern used for Domain Events: write to a <code>task_outbox</code> table inside the same transaction as the DB change, and let a separate Relay poll that table and publish once the transaction has committed.</p>
        <pre><code>{`// An Application Service — the DB change and enqueuing the Task happen in the same transaction
await transactionManager.run(async () => {
  await orderRepository.saveOrder(order)
  await taskQueue.enqueue(
    'order.archive',
    { orderId: order.orderId },
    { groupId: order.orderId, deduplicationId: \`order.archive-\${order.orderId}\` }
  )
})`}</code></pre>
        <p>Use this same path even when there's no transaction context at all, like inside a Scheduler firing on a Cron tick. It's a single row insert, so it's naturally atomic on its own, and having one unified path for every enqueue site keeps the mental model simple: enqueuing always means writing to the outbox table, never calling the queue client directly, regardless of what triggered it.</p>
        <h2>The Task Controller Is an Interface-Layer Adapter, Not a Handler</h2>
        <p>Just as an HTTP Controller receives an HTTP request and delegates to an Application Service, a Task Controller receives a message-queue message and calls a Command Service, with no conditional branching or business rules of its own. And unlike an HTTP Controller, it never catches and converts the error; it rethrows as-is, because the Consumer is what decides whether that exception means retry or DLQ.</p>
        <pre><code>{`class OrderTaskController {
  constructor(private readonly orderCommandService: OrderCommandService) {}

  async archive(payload: ArchiveOrderCommand): Promise<void> {
    await this.orderCommandService.archiveOrder(payload)  // the exception propagates as-is
  }
}`}</code></pre>
        <h2>Three Levels of Idempotency</h2>
        <p>Since delivery is at-least-once, a Task handler must produce the same result no matter how many times it runs. Level 1 is inherently idempotent: the handler's own logic is naturally safe to repeat, like archiving already-expired orders, where re-processing an already-archived one is a no-op. Level 2 uses a ledger: a handler with side effects records that it processed a given ID, and skips on seeing a duplicate. Level 3 needs strong atomicity: wrap both the handler logic and the ledger write in the same transaction, so a partial failure can never leave one written without the other.</p>
        <h2>Real Bugs This Pattern Surfaced</h2>
        <p>Shipping this feature across five separate language implementations of the same architecture turned up concrete bugs that a design review alone wouldn't have, because each one only showed up once real infrastructure and real concurrent test runs were involved. One implementation had a config field become required for SQS task-queue configuration, but five of six end-to-end test classes never set it, breaking the app's boot sequence in those tests. Another had a subtle SQS FIFO collision: several test methods calling the same monthly scheduler within the same test run all produced the identical date-based <code>dedupId</code>, since the dedup window is measured in minutes. So only the first call reached the queue, and the rest were deduplicated away without an error, nearly producing a false-positive test pass where the assertion for one scenario happened to hold even though the scenario it depended on had never run.</p>
        <div className="article-note"><strong>The lesson underneath both bugs</strong><p>Unit tests using an in-memory fake queue never exercise a real dedup window or a real required-config check. They can't, because the fake doesn't enforce either. A scheduling feature isn't verified until it's been run against real infrastructure, with real concurrent invocations, at least once.</p></div>
        <h2>The Payload Discipline</h2>
        <p>SQS caps a single message at 256KB, which is a hard ceiling worth designing around from the start rather than discovering during an incident. Put only small metadata in the payload (something like <code>{`{ orderId: 'o1' }`}</code>) and offload anything large to S3, carrying only the storage key in the message itself.</p>
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
    lede: '비즈니스 로직을 직접 돌리는 Cron job은 서비스 인스턴스가 하나일 때는 잘 돈다. 문제는 인스턴스가 둘이 되어 같은 작업을 동시에 실행하는 순간부터다. 스케줄링을 제대로 하려면 결국 누가 무엇을 어떤 순서로 해도 되는지를 정해야 한다.',
    body: (
      <>
        <p>주기 작업과 배치 처리에는 요구사항이 세 가지 따라붙는다. 프로토타입 단계에서는 건너뛰기 쉽지만, 나중에 붙이려면 비싸다. 첫째, Scheduler는 비즈니스 로직이 있는 Application 계층에 두지 않고 Infrastructure 계층에 둔다. 둘째, Task handler는 멱등(idempotent)해야 한다. 메시지 큐는 at-least-once 전달이라 같은 Task가 두 번 돌 수 있다. 셋째, 메시지 큐를 쓴다면 Dead Letter Queue는 나중에 덧붙일 것이 아니고 처음부터 기본으로 둔다. DLQ가 무한 재시도를 끊고, poison message가 뒤의 메시지를 전부 막기 전에 따로 빼 둔다.</p>
        <h2>Scheduler는 enqueue만 한다</h2>
        <p>Scheduler는 비즈니스 로직을 직접 실행하지 않는다. 하는 일은 큐에 Task를 넣는 것뿐이다. 실제 작업은 나중에 Task Consumer가 메시지를 받아 Command Service를 호출할 때 일어난다.</p>
        <pre><code>{`[Scheduler] --(enqueue)--> [task_outbox] --(Relay)--> [message queue] --(Consumer)--> [TaskController] --(calls)--> [CommandService]`}</code></pre>
        <p>이렇게 한 단계를 거치면 네 가지를 한꺼번에 얻는다. 먼저 인스턴스가 여러 개여도 안전하다. 여러 인스턴스가 같은 Cron을 동시에 실행해도 FIFO 큐의 중복 제거(deduplication) 덕분에 하나만 처리된다. 재시도도 덤으로 따라온다. Consumer가 실패하면 visibility timeout이 지난 뒤 메시지가 자동으로 다시 전달되고, 최대 수신 횟수를 넘기면 DLQ로 넘어간다.</p>
        <p>Backpressure도 생긴다. 작업이 몰리면 큐에 쌓였다가 Consumer의 처리 속도대로 빠져나가니, 하류(downstream) 시스템이 감당 못 할 만큼 밀려들지 않는다. 마지막으로 관측하기 쉽다. 비즈니스 로직에 계측 코드를 넣지 않아도 큐 지표(메시지 수, 처리 지연, DLQ 수)만으로 배치 상태를 알 수 있다.</p>
        <p>내 저장소의 NestJS 구현에 있는 이자 지급 scheduler를 보면, enqueue 하나만 하고 다른 일은 하지 않는다.</p>
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
        <p>여러 인스턴스에서 돌아도 안전한 건 날짜를 박은 <code>dedupId</code> 덕분이다. 인스턴스 3개가 같은 FIFO dedup window 안에서 이 handler를 실행해도, 세 시도가 모두 같은 <code>dedupId</code>를 들고 가므로 큐에는 하나만 들어간다.</p>
        <p>enqueue 호출을 try-catch로 감싼 이유는 주석에 적힌 그대로다. 여기서 쓰는 스케줄링 라이브러리는 Cron handler 안에서 던진 예외를 아무 말 없이 삼킨다. catch해서 로그를 남기지 않으면 enqueue가 실패해도 흔적 하나 남지 않는다.</p>
        <h2>Cron 데코레이터가 있을 때와 없을 때</h2>
        <p>Spring Boot도 같은 cron 표현식을 쓴다. NestJS 데코레이터 대신 표준 라이브러리 애노테이션을 붙인다는 점만 다르다.</p>
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
        <p>Go에는 메서드에 붙일 스케줄링 라이브러리가 아예 없다. 그래서 평범한 goroutine 하나가 ticker 루프를 직접 돌린다. 이 루프도 프로세스 안의 다른 루프들과 같은 shutdown context를 지켜본다.</p>
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
        <p>세 구현이 프레임워크에서 받는 도움은 데코레이터, 애노테이션, 손으로 짠 ticker로 제각각이다. 그런데 속을 보면 셋 다 같은 모양이다. enqueue만 하고, 스택 어딘가가 예외를 삼키기 쉬우니 실패는 직접 로그로 남긴다. 인스턴스끼리 조율하려 들지 않고, 날짜 기반 dedup ID가 다중 인스턴스 상황을 흡수하게 둔다.</p>
        <h2>Enqueue는 DB 변경과 원자적이어야 한다</h2>
        <p>Command Service 안에서 메시지 큐의 <code>SendMessage</code>를 바로 호출하면, 신뢰성 있는 이벤트 기반 설계에서 늘 나오는 dual-write 문제가 그대로 생긴다. DB는 커밋됐는데 메시지 전송이 실패하거나, 메시지는 나갔는데 DB가 롤백된다. 그러면 아무도 지켜보지 않는 불일치가 남는다.</p>
        <p>해법도 Domain Event 때와 같은 Outbox 패턴이다. DB 변경과 같은 트랜잭션 안에서 <code>task_outbox</code> 테이블에 쓰고, 별도의 Relay가 그 테이블을 폴링해 트랜잭션이 커밋된 뒤에만 발행한다.</p>
        <pre><code>{`// An Application Service — the DB change and enqueuing the Task happen in the same transaction
await transactionManager.run(async () => {
  await orderRepository.saveOrder(order)
  await taskQueue.enqueue(
    'order.archive',
    { orderId: order.orderId },
    { groupId: order.orderId, deduplicationId: \`order.archive-\${order.orderId}\` }
  )
})`}</code></pre>
        <p>Cron tick에서 실행되는 Scheduler처럼 트랜잭션 컨텍스트가 아예 없는 곳에서도 같은 경로를 쓴다. row 하나를 insert하는 일이니 그 자체로 원자적이다. enqueue하는 곳마다 경로를 하나로 맞춰 두면 머릿속 모델도 단순해진다. 무엇이 계기였든 enqueue는 언제나 outbox 테이블에 쓰는 일이고, 큐 클라이언트를 직접 부르는 일은 없다.</p>
        <h2>Task Controller는 Handler가 아니라 Interface 계층의 Adapter다</h2>
        <p>HTTP Controller가 HTTP 요청을 받아 Application Service에 넘기듯, Task Controller는 메시지 큐의 메시지를 받아 Command Service를 호출한다. 자기만의 조건 분기나 비즈니스 규칙은 없다. HTTP Controller와 다른 점은 에러를 잡아서 변환하지 않는다는 것이다. 예외를 그대로 다시 던진다. 그 예외를 재시도로 돌릴지 DLQ로 보낼지는 Consumer가 정하기 때문이다.</p>
        <pre><code>{`class OrderTaskController {
  constructor(private readonly orderCommandService: OrderCommandService) {}

  async archive(payload: ArchiveOrderCommand): Promise<void> {
    await this.orderCommandService.archiveOrder(payload)  // the exception propagates as-is
  }
}`}</code></pre>
        <h2>멱등성(Idempotency)의 세 단계</h2>
        <p>전달이 at-least-once이니 Task handler는 몇 번을 돌든 같은 결과를 내야 한다. Level 1은 로직 자체가 멱등한 경우다. 이미 만료된 주문을 archive하는 작업이 그렇다. 이미 archive된 주문을 다시 처리해도 아무 일도 일어나지 않는다(no-op). Level 2는 원장(ledger)을 쓴다. side effect가 있는 handler가 어떤 ID를 처리했는지 기록해 두고, 중복이 오면 건너뛴다. Level 3는 강한 원자성이 필요한 경우다. handler 로직과 ledger 기록을 한 트랜잭션으로 묶어서, 중간에 실패해도 한쪽만 기록되는 일이 없게 한다.</p>
        <h2>실제 인프라에서 나온 버그들</h2>
        <p>같은 아키텍처의 5개 언어 구현에 이 기능을 넣으면서, 설계 리뷰만으로는 안 나왔을 버그를 몇 개 만났다. 모두 실제 인프라에서 테스트를 동시에 돌려 봐야 드러나는 것들이었다. 한 구현에서는 SQS task-queue 설정에 필수 config 필드가 새로 생겼다. 그런데 end-to-end 테스트 클래스 6개 중 5개가 이 값을 넣지 않아서, 그 테스트들에서만 앱 부팅이 깨졌다.</p>
        <p>다른 구현의 SQS FIFO 충돌은 훨씬 알아채기 어려웠다. 한 번의 테스트 실행 안에서 여러 테스트 메서드가 같은 월간 scheduler를 불렀는데, 모두 같은 날짜 기반 <code>dedupId</code>를 만들었다. dedup window는 분 단위라서 첫 호출만 큐에 닿았고, 나머지는 중복으로 걸러져 에러 없이 사라졌다. 그 바람에 거짓 양성(false-positive)으로 테스트가 통과할 뻔했다. 한 시나리오의 assertion이 우연히 맞아떨어졌는데, 그 assertion이 기대던 시나리오는 한 번도 돌지 않았다.</p>
        <div className="article-note"><strong>두 버그의 공통점</strong><p>인메모리 fake 큐로 돌리는 유닛 테스트는 실제 dedup window도, 실제 필수 config 검사도 겪지 않는다. fake가 둘 다 강제하지 않으니 겪을 수가 없다. 스케줄링 기능은 실제 인프라에서 동시 호출로 적어도 한 번은 돌려 봐야 검증했다고 할 수 있다.</p></div>
        <h2>Payload는 작게</h2>
        <p>SQS는 메시지 하나를 256KB로 제한한다. 넘을 수 없는 상한이니, 장애가 나서야 알게 되기보다 처음부터 설계에 넣어 두는 게 낫다. Payload에는 <code>{`{ orderId: 'o1' }`}</code> 같은 작은 메타데이터만 담는다. 큰 데이터는 S3에 올리고 메시지에는 storage key만 싣는다.</p>
        <div className="article-note"><strong>저장소에서 더 볼 것</strong><p>
          <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/docs/architecture/scheduling.md" target="_blank" rel="noreferrer">docs/architecture/scheduling.md</a>(Task Outbox 패턴 전체, MessageGroupId 전략, DLQ 모니터링) · <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/implementations/nestjs/examples/src/account/infrastructure/account-interest-scheduler.ts" target="_blank" rel="noreferrer">account-interest-scheduler.ts</a>(위에서 본 scheduler를 코드 맥락 그대로)
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
