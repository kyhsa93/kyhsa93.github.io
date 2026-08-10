import PostLayout from '../../components/PostLayout';
import { useLocale, localeFromPathname } from '../../lib/locale';
import type { MetaFunction } from 'react-router';
import { createPostMeta } from '../../lib/seo';

export const meta: MetaFunction = ({ location }) =>
  createPostMeta('the-bug-came-back-wearing-five-different-masks', localeFromPathname(location.pathname));

const content = {
  en: {
    kicker: 'Backend · Reliability',
    title: (
      <>
        The Bug Came Back,<br /><em>Wearing Five Different Masks</em>
      </>
    ),
    lede: 'A week after a benchmark task found that two of five languages crashed or silently dropped a handler the first time an event needed two subscribers, four real production features made every event with a live handler need a second one. This time all five languages broke — including the two that had passed clean before — each in a genuinely different way, ranked here from loudest to quietest.',
    body: (
      <>
        <p>Four features shipped across all five languages that week: a spending forecast built from trailing months of history, a merchant-name transaction categorizer, a withdrawal anomaly alert that only ever notifies and never blocks, and a refund-reason classifier feeding an analytics endpoint. Every one of them, on the Account Bounded Context, needed to react to <code>MoneyWithdrawn</code> — an event that, until that week, had never had more than one handler in the entire repository. Four features meant every one of the five languages had to actually support two or three simultaneous subscribers to the same event for the first time in real, shipped code.</p>
        <div className="article-note"><strong>This already happened once</strong><p>A <a href="/posts/the-bug-that-needed-two-subscribers-to-exist">deliberately designed benchmark task</a> had found exactly this failure a week earlier — two Bounded Contexts subscribing to the same event exposed that Java and FastAPI's handler maps couldn't hold more than one, and Kotlin's fix at the time was flagged as a workaround, not a real one. Go and NestJS were declared clean. This round is what happened when the same shape of requirement hit all five languages again, for real, and none of them turned out to be as clean as believed.</p></div>
        <h2>Ranked From Loudest to Quietest</h2>
        <p>Java's handler map was built with <code>Collectors.toMap(...)</code> — registering a second handler for an already-used event type throws <code>IllegalStateException: Duplicate key</code>, and it throws at application startup, the instant the second handler bean registers. That's the worst-sounding failure mode and, in one sense, the safest — nothing ships silently broken, the app simply refuses to boot until it's fixed. A new <code>OutboxEventDispatcher</code> built on <code>Collectors.groupingBy</code> replaced it.</p>
        <p>Kotlin's routing table was a plain <code>mapOf(...)</code> literal. A duplicate key in a Kotlin map literal doesn't throw and doesn't warn — it silently keeps only the last entry written. No crash, no log line, no signal of any kind that a handler had been dropped; arguably the most dangerous of the five variants precisely because nothing about it announces itself. This is the exact gap the earlier benchmark round had flagged and explicitly left unfixed. It's fixed now, restructured to <code>Map&lt;String, List&lt;...&gt;&gt;</code> via <code>groupBy</code>.</p>
        <p>FastAPI's <code>build_event_handlers()</code> had the identical shape and the identical failure — a plain dict literal, silent overwrite, no error anywhere. Fixed the same way: <code>dict[str, list[EventHandlerFn]]</code>.</p>
        <p>Go had never supported more than one handler per event at the type level at all — <code>map[string]outbox.Handler</code>, strictly one-to-one. In the benchmark round, this was worked around rather than fixed: a second call added inline where a real second registration should have gone. This time it got the real fix — <code>map[string][]outbox.Handler</code> and a <code>runHandlers</code> function.</p>
        <p>NestJS was the most interesting, because it was the one everyone had reason to trust. Its registry was already correctly shaped — <code>Map&lt;string, EventHandlerFn[]&gt;</code> — holding multiple handlers was never in question. What broke was the dispatch loop itself: it iterated handlers for an event type and stopped at the first one that threw, so a failing first handler silently prevented every handler registered after it from ever running at all. The type system said this was fine. Nothing about the type system could have caught it, because the bug wasn't in what the structure could hold — it was in what the loop actually did once two real handlers existed to iterate over:</p>
        <pre><code>{`public async handle(eventType: string, payload: object): Promise<void> {
  const errors: unknown[] = []
  for (const handler of this.handlers.get(eventType) ?? []) {
    try {
      await handler(payload)
    } catch (error) {
      this.logger.error({ message: 'A handler failed for eventType', event_type: eventType, error })
      errors.push(error)
    }
  }
  if (errors.length > 0) throw errors[0]
}`}</code></pre>
        <p>Every handler now runs regardless of an earlier one's failure, each failure gets its own log line, and the message only throws — leaving it unacknowledged for redelivery — after every handler has had its turn.</p>
        <h2>What Actually Caught All Five</h2>
        <p>Every one of these was caught the same way: the end-to-end test written for the <em>new</em> feature also asserted that the <em>pre-existing</em> handler for the same event still ran. Not just "does my new handler fire" — "does the old one still fire too, now that it has company." That's the specific, repeatable discipline this generalizes into: adding a second subscriber to any event that already has one means the test suite's job is no longer just verifying the new path works, it's verifying the new path didn't silently break the old one.</p>
        <h2>A Second, Smaller Version of the Same Root Cause</h2>
        <p>One more bug came from the identical situation — two handlers legitimately reacting to the same event for the first time. The SES notification idempotency ledger, in both Kotlin and FastAPI, deduplicated by the event's ID alone, an assumption that one Outbox delivery produces at most one email. It broke the moment two handlers on the same <code>MoneyWithdrawn</code> event each needed to send a genuinely different email — the anomaly alert and the withdrawal-completion notice — and the second one got silently deduped against the first. Fixed by widening the dedup key from the event ID alone to the pair of event ID and event type.</p>
        <p>Five languages, five different failure shapes, one shared cause: a capability every implementation assumed it had, that had simply never been asked for before. "Already handles this correctly" turned out to be a claim about code nobody had actually run with two.</p>
        <div className="article-note"><strong>Further reading in the repo</strong><p>
          <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/implementations/nestjs/examples/src/outbox/event-handler-registry.ts" target="_blank" rel="noreferrer">event-handler-registry.ts</a> — the fixed dispatch loop, every handler run regardless of earlier failures · <a href="/posts/the-bug-that-needed-two-subscribers-to-exist">The Bug That Needed Two Subscribers to Exist</a> — the benchmark round that found this the first time
        </p></div>
      </>
    ),
  },
  ko: {
    kicker: 'Backend · Reliability',
    title: (
      <>
        버그가 돌아왔다,<br /><em>다섯 개의 다른 가면을 쓰고</em>
      </>
    ),
    lede: '벤치마크 과제가 이벤트에 구독자가 둘 필요해진 첫 순간 5개 언어 중 2개가 크래시하거나 조용히 핸들러를 떨어뜨린다는 걸 찾아낸 지 일주일 뒤, 실제 프로덕션 기능 4개가 살아있는 핸들러를 가진 모든 이벤트에 두 번째 핸들러를 필요하게 만들었다. 이번엔 5개 언어 전부가 깨졌다 — 이전에 깨끗하다고 통과했던 둘까지 포함해서 — 각자 진짜로 다른 방식으로. 가장 시끄러운 것부터 가장 조용한 것까지 순서대로 정리한다.',
    body: (
      <>
        <p>그 주에 5개 언어 전부에 걸쳐 기능 4개가 배포됐다: 지난 몇 달의 히스토리로 만드는 지출 예측, 가맹점명 기반 거래 자동 분류, 알림만 보낼 뿐 절대 막지 않는 출금 이상 알림, 분석 엔드포인트에 데이터를 공급하는 환불 사유 분류. 전부 Account Bounded Context에서 <code>MoneyWithdrawn</code>에 반응해야 했다 — 그 주 전까지 이 저장소 전체에서 핸들러가 하나를 넘어본 적이 한 번도 없던 이벤트였다. 기능 4개는 곧 5개 언어 전부가 실제로 배포되는 코드에서 처음으로 같은 이벤트에 동시 구독자 둘 셋을 실제로 지원해야 한다는 뜻이었다.</p>
        <div className="article-note"><strong>이건 이미 한 번 일어났었다</strong><p><a href="/posts/the-bug-that-needed-two-subscribers-to-exist">의도적으로 설계된 벤치마크 과제</a>가 일주일 전에 정확히 이 실패를 찾아낸 적이 있다 — 두 개의 Bounded Context가 같은 이벤트를 구독하자 java와 fastapi의 핸들러 맵이 하나 이상을 담지 못한다는 게 드러났고, 그때 kotlin의 수정은 진짜 수정이 아니라 임시방편으로 기록됐다. go와 nestjs는 깨끗하다고 선언됐다. 이번 라운드는 같은 형태의 요구가 실제로 5개 언어 전부를 다시 덮쳤을 때 무슨 일이 일어났는지에 관한 것이고, 그중 어느 것도 믿었던 것만큼 깨끗하지 않았다.</p></div>
        <h2>가장 시끄러운 것부터 가장 조용한 것까지</h2>
        <p>java의 핸들러 맵은 <code>Collectors.toMap(...)</code>으로 만들어져 있었다 — 이미 사용 중인 이벤트 타입에 두 번째 핸들러를 등록하면 <code>IllegalStateException: Duplicate key</code>를 던진다, 그것도 애플리케이션 부팅 시점에, 두 번째 핸들러 빈이 등록되는 바로 그 순간. 겉보기엔 가장 시끄러운 실패지만 어떤 의미에선 가장 안전하기도 하다 — 조용히 고장난 채로 배포되는 게 아니라, 고쳐질 때까지 앱이 그냥 부팅을 거부한다. <code>Collectors.groupingBy</code>로 만든 새 <code>OutboxEventDispatcher</code>가 이를 대체했다.</p>
        <p>kotlin의 라우팅 테이블은 평범한 <code>mapOf(...)</code> 리터럴이었다. kotlin map 리터럴의 중복 키는 던지지도, 경고하지도 않는다 — 조용히 마지막에 쓰인 항목만 남긴다. 크래시도, 로그 한 줄도, 핸들러가 떨어졌다는 어떤 신호도 없다. 다섯 변종 중 아마도 가장 위험한데, 정확히 아무것도 스스로를 알리지 않기 때문이다. 이건 이전 벤치마크 라운드가 정확히 지적했지만 명시적으로 고치지 않은 채로 남겨뒀던 바로 그 갭이다. 이제 <code>groupBy</code>를 통해 <code>Map&lt;String, List&lt;...&gt;&gt;</code>로 재구성되어 고쳐졌다.</p>
        <p>fastapi의 <code>build_event_handlers()</code>는 똑같은 형태에 똑같은 실패였다 — 평범한 dict 리터럴, 조용한 덮어쓰기, 어디에도 에러 없음. 같은 방식으로 고쳐졌다: <code>dict[str, list[EventHandlerFn]]</code>.</p>
        <p>go는 애초에 타입 레벨에서 이벤트당 핸들러 하나 이상을 지원한 적이 없었다 — <code>map[string]outbox.Handler</code>, 엄격하게 1:1. 벤치마크 라운드에서는 이게 진짜로 고쳐진 게 아니라 우회됐다: 진짜 두 번째 등록이 있어야 할 자리에 인라인으로 두 번째 호출을 추가하는 식으로. 이번엔 진짜 수정을 받았다 — <code>map[string][]outbox.Handler</code>와 <code>runHandlers</code> 함수.</p>
        <p>nestjs가 가장 흥미로웠다. 다들 믿을 이유가 있던 쪽이었기 때문이다. 레지스트리는 이미 올바른 형태였다 — <code>Map&lt;string, EventHandlerFn[]&gt;</code> — 핸들러 여러 개를 담을 수 있는지는 애초에 의문의 여지가 없었다. 깨진 건 디스패치 루프 자체였다: 이벤트 타입에 대한 핸들러들을 순회하다가 던진 첫 번째 핸들러에서 멈춰버려서, 실패하는 첫 핸들러가 그 뒤에 등록된 모든 핸들러가 아예 한 번도 실행되지 못하게 조용히 막고 있었다. 타입 시스템은 이게 괜찮다고 말했다. 타입 시스템의 그 무엇도 이걸 잡을 수 없었다 — 버그는 구조가 뭘 담을 수 있느냐에 있지 않았다, 실제로 순회할 진짜 핸들러 둘이 존재했을 때 루프가 실제로 뭘 했느냐에 있었다:</p>
        <pre><code>{`public async handle(eventType: string, payload: object): Promise<void> {
  const errors: unknown[] = []
  for (const handler of this.handlers.get(eventType) ?? []) {
    try {
      await handler(payload)
    } catch (error) {
      this.logger.error({ message: 'A handler failed for eventType', event_type: eventType, error })
      errors.push(error)
    }
  }
  if (errors.length > 0) throw errors[0]
}`}</code></pre>
        <p>이제 모든 핸들러는 이전 핸들러의 실패와 무관하게 실행되고, 각 실패는 자기만의 로그 줄을 갖고, 메시지는 모든 핸들러가 자기 차례를 마친 뒤에만 — ack되지 않은 채 남아 재전달되도록 — 던져진다.</p>
        <h2>다섯 개를 전부 잡아낸 실제 방법</h2>
        <p>다섯 개 모두 같은 방식으로 잡혔다: 새 기능을 위해 작성된 e2e 테스트가 기존 핸들러도 여전히 실행되는지까지 함께 단언했다. "내 새 핸들러가 실행되는가"뿐 아니라 — "옛 핸들러도, 이제 동료가 생겼는데도, 여전히 실행되는가." 이게 일반화되는 구체적이고 반복 가능한 원칙이다: 이미 하나를 갖고 있는 이벤트에 두 번째 구독자를 추가한다는 건, 테스트 스위트의 임무가 더 이상 새 경로가 동작하는지 확인하는 것만이 아니라, 새 경로가 옛 경로를 조용히 망가뜨리지 않았는지까지 확인하는 것이라는 뜻이다.</p>
        <h2>같은 근본 원인의 더 작은 두 번째 버전</h2>
        <p>버그 하나가 더 같은 상황에서 나왔다 — 두 핸들러가 처음으로 같은 이벤트에 정당하게 반응하는 상황. SES 알림 멱등성 원장은, kotlin과 fastapi 둘 다에서, 이벤트 ID만으로 중복을 제거하고 있었다 — Outbox 전달 한 번이 이메일 최대 한 통을 만든다는 가정이었다. 이건 같은 <code>MoneyWithdrawn</code> 이벤트에 대한 두 핸들러가 각각 진짜로 다른 이메일을 보내야 하는 순간 — 이상 알림과 출금 완료 안내 — 깨졌다. 두 번째 이메일이 첫 번째와 조용히 같은 걸로 취급돼 중복 제거됐다. 중복 제거 키를 이벤트 ID 하나에서 (이벤트 ID, 이벤트 타입) 쌍으로 넓혀서 고쳤다.</p>
        <p>5개 언어, 5개의 서로 다른 실패 모양, 원인은 하나 공유 — 모든 구현체가 이미 갖고 있다고 가정했던 능력이, 사실은 한 번도 요구받은 적이 없었을 뿐이었다. "이미 이걸 올바르게 처리한다"는 결국 아무도 둘로 실제로 돌려본 적 없는 코드에 대한 주장이었을 뿐이다.</p>
        <div className="article-note"><strong>저장소 내 추가 자료</strong><p>
          <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/implementations/nestjs/examples/src/outbox/event-handler-registry.ts" target="_blank" rel="noreferrer">event-handler-registry.ts</a> — 이전 실패와 무관하게 모든 핸들러를 실행하도록 고쳐진 디스패치 루프 · <a href="/posts/the-bug-that-needed-two-subscribers-to-exist">구독자가 둘이어야만 존재하던 버그</a> — 이걸 처음 찾아낸 벤치마크 라운드
        </p></div>
      </>
    ),
  },
};

export default function TheBugCameBackWearingFiveDifferentMasks() {
  const { locale } = useLocale();
  const c = content[locale];

  return (
    <PostLayout
      slug="the-bug-came-back-wearing-five-different-masks"
      kicker={c.kicker}
      title={c.title}
      lede={c.lede}
    >
      {c.body}
    </PostLayout>
  );
}
