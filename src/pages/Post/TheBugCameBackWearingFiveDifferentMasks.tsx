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
    lede: 'Event dispatch code that has only ever had one handler per event has not shown it can run two. When an event gets its second subscriber, the bug that surfaces can look completely different from one runtime to the next. Four production features made every event with a live handler need a second one, in five language implementations of the same design. All five broke, including two that a test built for exactly this had passed clean a week earlier, each in a different way, ranked here from loudest to quietest.',
    body: (
      <>
        <p>The code is my example project, which implements the same backend design (DDD, CQRS, Outbox) in five languages side by side. Four features shipped across all five languages that week: a spending forecast built from trailing months of history, a merchant-name transaction categorizer, a withdrawal anomaly alert that only ever notifies and never blocks, and a refund-reason classifier feeding an analytics endpoint. Every one of them, on the Account Bounded Context, needed to react to <code>MoneyWithdrawn</code>, an event that, until that week, had never had more than one handler anywhere in the code. Four features meant every one of the five languages had to support two or three simultaneous subscribers to the same event for the first time in shipped code.</p>
        <div className="article-note"><strong>This already happened once</strong><p>A <a href="/posts/the-bug-that-needed-two-subscribers-to-exist">deliberately designed task</a>, part of an experiment that gives AI coding agents the same task in every language, had found this failure a week earlier. Two Bounded Contexts subscribing to the same event exposed that Java and FastAPI's handler maps couldn't hold more than one, and Kotlin's fix at the time was flagged as a workaround, not a real one. Go and NestJS were declared clean. What follows is what happened when the same shape of requirement hit all five languages again, for real, and none of them turned out to be as clean as believed.</p></div>
        <h2>Ranked From Loudest to Quietest</h2>
        <p>Java's handler map was built with <code>Collectors.toMap(...)</code>. Registering a second handler for an already-used event type throws <code>IllegalStateException: Duplicate key</code>, and it throws at application startup, the instant the second handler bean registers. That's the worst-sounding failure mode and, in one sense, the safest: nothing ships broken without a sign, the app simply refuses to boot until it's fixed. A new <code>OutboxEventDispatcher</code> built on <code>Collectors.groupingBy</code> replaced it.</p>
        <p>Kotlin's routing table was a plain <code>mapOf(...)</code> literal. A duplicate key in a Kotlin map literal doesn't throw and doesn't warn; it keeps only the last entry written. No crash, no log line, no signal of any kind that a handler had been dropped. That makes it arguably the most dangerous of the five variants, precisely because nothing about it announces itself. This is the gap the earlier experiment had flagged and explicitly left unfixed. It's fixed now, restructured to <code>Map&lt;String, List&lt;...&gt;&gt;</code> via <code>groupBy</code>.</p>
        <p>FastAPI's <code>build_event_handlers()</code> had the identical shape and the identical failure: a plain dict literal, a quiet overwrite, no error anywhere. Fixed the same way, with <code>dict[str, list[EventHandlerFn]]</code>.</p>
        <p>Go had never supported more than one handler per event at the type level at all. <code>map[string]outbox.Handler</code> is strictly one-to-one. In that earlier experiment, this was worked around rather than fixed, with a second call added inline where a proper second registration should have gone. This time it got the real fix: <code>map[string][]outbox.Handler</code> and a <code>runHandlers</code> function.</p>
        <p>NestJS was the most interesting, because it was the one everyone had reason to trust. Its registry was already correctly shaped (<code>Map&lt;string, EventHandlerFn[]&gt;</code>), so holding multiple handlers was never in question. What broke was the dispatch loop itself. It iterated handlers for an event type and stopped at the first one that threw, so a failing first handler prevented every handler registered after it from ever running at all, and nothing reported it. The type system said this was fine. Nothing about the type system could have caught it, because the bug wasn't in what the structure could hold — it was in what the loop did once two handlers existed to iterate over:</p>
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
        <p>Every handler now runs regardless of an earlier one's failure, each failure gets its own log line, and the message only throws (leaving it unacknowledged for redelivery) after every handler has had its turn.</p>
        <h2>What Caught All Five</h2>
        <p>Every one of these was caught the same way: the end-to-end test written for the <em>new</em> feature also asserted that the <em>pre-existing</em> handler for the same event still ran. Not just "does my new handler fire," but "does the old one still fire too, now that it has company." That's the specific, repeatable discipline this generalizes into. Adding a second subscriber to any event that already has one means the test suite's job is no longer just verifying the new path works; it's verifying the new path didn't break the old one.</p>
        <h2>A Second, Smaller Version of the Same Root Cause</h2>
        <p>One more bug came from the identical situation, two handlers legitimately reacting to the same event for the first time. The SES notification idempotency ledger, in both Kotlin and FastAPI, deduplicated by the event's ID alone, an assumption that one Outbox delivery produces at most one email. It broke the moment two handlers on the same <code>MoneyWithdrawn</code> event each needed to send a different email (the anomaly alert and the withdrawal-completion notice), and the second one got deduped against the first without any error. Fixed by widening the dedup key from the event ID alone to the pair of event ID and event type.</p>
        <p>Five languages, five different failure shapes, one shared cause: a capability every implementation assumed it had, that had simply never been asked for before. "Already handles this correctly" turned out to be a claim about code nobody had ever run with two.</p>
        <div className="article-note"><strong>Further reading</strong><p>
          <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/implementations/nestjs/examples/src/outbox/event-handler-registry.ts" target="_blank" rel="noreferrer">event-handler-registry.ts</a> (the fixed dispatch loop, every handler run regardless of earlier failures, in backend-service-playbook, my example project that implements the same backend design in five languages side by side) · <a href="/posts/the-bug-that-needed-two-subscribers-to-exist">The Bug That Needed Two Subscribers to Exist</a> (the deliberately harder task that found this the first time, and why easy tasks could not)
        </p></div>
      </>
    ),
  },
  ko: {
    kicker: 'Backend · Reliability',
    title: (
      <>
        다섯 가지 가면을 쓰고<br /><em>돌아온 버그</em>
      </>
    ),
    lede: '이벤트마다 핸들러가 하나뿐이던 디스패치 코드는, 핸들러 둘을 돌릴 수 있다는 걸 보여 준 적이 없다. 이벤트에 두 번째 구독자가 붙는 순간 드러나는 버그는 런타임마다 전혀 다른 모양일 수 있다. 같은 설계를 5개 언어로 구현한 코드에서, 프로덕션 기능 4개 때문에 핸들러가 붙어 있는 이벤트마다 두 번째 핸들러가 필요해졌다. 그러자 5개 언어가 모두 깨졌다. 바로 이 상황을 노린 테스트가 일주일 전 문제없다고 통과시킨 둘도 마찬가지였고, 깨진 방식은 언어마다 달랐다. 가장 요란한 것부터 가장 조용한 것까지 차례로 적는다.',
    body: (
      <>
        <p>대상은 같은 백엔드 설계(DDD, CQRS, Outbox)를 5개 언어로 나란히 구현해 둔 내 예제 프로젝트다. 그 주에 기능 4개를 5개 언어 모두에 배포했다. 지난 몇 달 내역으로 만드는 지출 예측, 가맹점명으로 거래를 분류하는 자동 분류기, 막지는 않고 알리기만 하는 출금 이상 알림, 분석 엔드포인트에 데이터를 넘기는 환불 사유 분류기다. 넷 모두 Account Bounded Context에서 <code>MoneyWithdrawn</code>에 반응해야 했다. 그 주 전까지 코드 전체를 통틀어 핸들러가 하나뿐이던 이벤트다. 결국 5개 언어 모두 배포되는 코드에서 처음으로 한 이벤트에 구독자 두셋을 동시에 붙여야 했다.</p>
        <div className="article-note"><strong>이미 한 번 겪은 일</strong><p>일주일 전 <a href="/posts/the-bug-that-needed-two-subscribers-to-exist">일부러 설계한 과제</a>에서 이 실패를 찾은 적이 있다. AI 코딩 에이전트에게 모든 언어에서 같은 과제를 주는 실험의 한 단계였다. Bounded Context 두 개가 같은 이벤트를 구독하자 Java와 FastAPI의 핸들러 맵이 핸들러를 하나밖에 못 담는다는 게 드러났다. Kotlin의 수정은 제대로 된 수정이 아닌 임시방편으로 기록했고, Go와 NestJS는 문제없다고 판정했다. 아래는 같은 요구가 이번엔 진짜 기능으로 5개 언어를 다시 덮쳤을 때의 이야기다. 믿었던 만큼 멀쩡한 언어는 하나도 없었다.</p></div>
        <h2>요란한 것부터 조용한 것까지</h2>
        <p>Java는 핸들러 맵을 <code>Collectors.toMap(...)</code>으로 만들고 있었다. 이미 쓰는 이벤트 타입에 두 번째 핸들러를 등록하면 <code>IllegalStateException: Duplicate key</code>가 난다. 그것도 애플리케이션이 뜰 때, 두 번째 핸들러 빈이 등록되는 순간에 난다. 듣기엔 가장 험한 실패지만 어떻게 보면 가장 안전하다. 고장 난 채로 몰래 배포될 일이 없고, 고칠 때까지 앱이 아예 뜨지 않는다. <code>Collectors.groupingBy</code>로 만든 새 <code>OutboxEventDispatcher</code>로 바꿨다.</p>
        <p>Kotlin의 라우팅 테이블은 평범한 <code>mapOf(...)</code> 리터럴이었다. Kotlin map 리터럴은 키가 겹쳐도 예외도 경고도 없이 마지막에 쓴 항목만 남긴다. 크래시도 로그 한 줄도 없고, 핸들러가 빠졌다는 신호가 어디에도 없다. 스스로 티를 내는 구석이 하나도 없으니 다섯 가지 중 가장 위험하다고 본다. 앞의 실험에서 짚어 놓고 일부러 고치지 않고 남겨 둔 그 빈틈이다. 이번에 <code>groupBy</code>로 <code>Map&lt;String, List&lt;...&gt;&gt;</code> 구조로 바꿔 고쳤다.</p>
        <p>FastAPI의 <code>build_event_handlers()</code>도 모양과 실패가 똑같았다. 평범한 dict 리터럴이라 에러 하나 없이 덮어써졌다. 고친 방법도 같아서 <code>dict[str, list[EventHandlerFn]]</code>로 바꿨다.</p>
        <p>Go는 처음부터 타입 수준에서 이벤트당 핸들러를 하나만 받았다. <code>map[string]outbox.Handler</code>는 엄격하게 1:1이다. 그 실험 때는 고치지 않고 우회만 했다. 두 번째 핸들러를 따로 등록해야 할 자리에 호출을 하나 더 끼워 넣는 식이었다. 이번에는 제대로 고쳤다. <code>map[string][]outbox.Handler</code>로 바꾸고 <code>runHandlers</code> 함수를 두었다.</p>
        <p>NestJS가 가장 흥미로웠다. 모두가 믿을 만한 이유가 있던 쪽이었기 때문이다. 레지스트리는 이미 <code>Map&lt;string, EventHandlerFn[]&gt;</code>로 맞게 생겨 있었고, 핸들러 여러 개를 담는 건 문제가 될 리 없었다. 깨진 건 디스패치 루프였다. 이벤트 타입의 핸들러를 차례로 돌다가 예외를 던진 첫 핸들러에서 멈췄다. 앞의 핸들러 하나가 실패하면 뒤에 등록된 핸들러는 전부 한 번도 돌지 못했고, 그 사실을 알려 주는 것도 없었다.</p>
        <p>타입 시스템은 아무 문제 없다고 했다. 애초에 타입 시스템이 잡을 수 있는 버그가 아니었다. 구조가 무엇을 담을 수 있느냐는 문제없었다. 돌 핸들러가 둘 생겼을 때 루프가 어떻게 움직이느냐가 문제였다. 고친 코드는 다음과 같다.</p>
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
        <p>이제 앞 핸들러가 실패해도 모든 핸들러가 돌고, 실패마다 로그가 한 줄씩 남는다. 예외는 모든 핸들러가 한 번씩 돈 뒤에야 던진다. 그래야 메시지가 ack되지 않은 채 남아서 다시 전달된다.</p>
        <h2>다섯 개를 모두 잡은 방법</h2>
        <p>다섯 개 모두 같은 방법으로 잡혔다. 새 기능을 위해 쓴 e2e 테스트가, 같은 이벤트에 원래 붙어 있던 기존 핸들러도 여전히 도는지 함께 단언했다. "새 핸들러가 도는가"만 보지 않고 "옆에 하나가 더 붙은 지금도 옛 핸들러가 도는가"까지 봤다. 일반화하면 이렇다. 이미 구독자가 있는 이벤트에 구독자를 하나 더 붙일 때, 테스트가 확인할 건 새 경로가 동작하는지만이 아니다. 새 경로 때문에 옛 경로가 소리 없이 망가지지 않았는지도 확인해야 한다.</p>
        <h2>같은 원인에서 나온 작은 버그 하나</h2>
        <p>똑같은 상황에서 버그가 하나 더 나왔다. 핸들러 둘이 처음으로 같은 이벤트에 각자 정당하게 반응하는 상황이다. Kotlin과 FastAPI의 SES 알림 멱등성 원장은 이벤트 ID 하나로만 중복을 걸렀다. Outbox 전달 한 번에 이메일은 많아야 한 통이라는 가정이었다. 같은 <code>MoneyWithdrawn</code> 이벤트를 받은 두 핸들러가 서로 다른 이메일을 보내야 하자 이 가정이 깨졌다. 하나는 이상 알림이고 하나는 출금 완료 안내였는데, 두 번째 메일이 첫 번째와 같은 것으로 처리돼 에러 없이 걸러졌다. 중복 제거 키를 이벤트 ID 하나에서 (이벤트 ID, 이벤트 타입) 쌍으로 넓혀 고쳤다.</p>
        <p>5개 언어가 5가지 다른 모양으로 깨졌지만 원인은 하나였다. 모든 구현이 당연히 된다고 여긴 기능을 그때까지 아무도 실제로 써 본 적이 없었다. "이미 제대로 처리한다"는 말은 결국 구독자 둘로 한 번도 돌려 보지 않은 코드에 대한 말이었다.</p>
        <div className="article-note"><strong>더 볼 자료</strong><p>
          <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/implementations/nestjs/examples/src/outbox/event-handler-registry.ts" target="_blank" rel="noreferrer">event-handler-registry.ts</a>(같은 백엔드 설계를 5개 언어로 나란히 구현해 둔 내 예제 프로젝트 backend-service-playbook에서, 앞 핸들러가 실패해도 모든 핸들러를 돌리도록 고친 디스패치 루프) · <a href="/posts/the-bug-that-needed-two-subscribers-to-exist">구독자가 둘이어야만 존재하던 버그</a>(이 문제를 처음 찾은, 일부러 어렵게 만든 과제와 쉬운 과제로는 못 찾은 이유)
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
