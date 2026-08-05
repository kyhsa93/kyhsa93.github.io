import PostLayout from '../../components/PostLayout';
import { useLocale } from '../../lib/locale';
import type { MetaFunction } from 'react-router';
import { createPostMeta } from '../../lib/seo';

export const meta: MetaFunction = () => createPostMeta('the-bug-that-needed-two-subscribers-to-exist');

const content = {
  en: {
    kicker: 'AI Agents · Benchmark',
    title: (
      <>
        The Bug That Needed<br /><em>Two Subscribers to Exist</em>
      </>
    ),
    lede: 'A synthetic task where all five languages score 100% on the first try reads like good news. It is mostly a ceiling effect — a test with no room to fail teaches nothing about where the edges are. Four levels of deliberately harder tasks later, the last one found a bug none of the five had ever been in a position to have: two Bounded Contexts subscribing to the same event, for the first time in the repository\'s history.',
    body: (
      <>
        <p>The setup was simple: the same synthetic domain, Voucher — issue to <code>ACTIVE</code>, redeem as a plain transition with no event, expire as an event since other parts of the system react to it — built independently across all five languages at once, each agent given nothing but its own <code>implementations/&lt;lang&gt;/CLAUDE.md</code> as an entry point. No doc paths, no scaffolding-tool hints. All five hit a perfect harness score, and all five independently converged on the identical judgment: publish the event on <code>expire()</code> only, matching the same "does anything actually react?" pattern the docs already establish elsewhere. Strong evidence the docs communicate consistently across languages — and, along the way, the run surfaced three real tooling regressions nobody had noticed: two scaffolding generators still emitting a shape a naming rule built the same day now forbade, and two harnesses drifting out of parity on which directories their file walkers were supposed to skip.</p>
        <h2>A Perfect Score Everywhere Is Not Reassuring</h2>
        <p>Five languages, one easy task, five first-try wins. On its own that result explains nothing about where any implementation would actually fail — a test that always passes has no discriminative power, and Voucher was, deliberately, an easy first task. The real question was what to build next, and running the same easy shape again wasn't going to answer it. What the task needed wasn't more repeats. It needed to get harder, on purpose, in directions specifically chosen to exercise code paths nothing before this had ever exercised.</p>
        <h2>A Ladder, Not a Repeat</h2>
        <p>Level 2 — Booking/Cancellation, two Aggregates inside one Bounded Context plus a Domain Service, mirroring Payment/Refund's existing <code>RefundEligibilityService</code> — was the first sign the ladder actually discriminated. All five still reached 100%, and all five independently made the same subtle judgment call the spec allowed room to get wrong (a rejected booking is never persisted, unlike Refund's persisted <code>REJECTED</code> state) — but NestJS scored 96/100 on its first pass, a real defect this time, a raw string thrown where the convention requires a typed enum, then corrected it on its own.</p>
        <p>Level 3 — Membership, which needs a synchronous Adapter reading another BC's Account status — again converged on the right pattern in all five: the synchronous read, not the asynchronous Integration Event a level-4 task would have needed instead, and every language correctly translated Account's status enum into a plain boolean rather than leaking the enum itself across the boundary. Java's agent went a step further on its own, avoiding a Spring bean-name collision with Card's existing <code>AccountAdapterImpl</code> by noticing and reading an existing code comment that named the conflict before writing anything.</p>
        <h2>Level 4, Built to Contrast With Level 3</h2>
        <p>StandingOrder was designed specifically as level 3's mirror image: create one against an Account, and it becomes <code>ACTIVE</code>; if that Account is later suspended, the StandingOrder must become <code>PAUSED</code> automatically, and <code>CANCELLED</code> if the Account is closed — the reaction has to happen the moment the Account's status changes, never through a direct call on StandingOrder itself. The correct pattern this time is the opposite of level 3's: subscribing to an asynchronous Integration Event, not a synchronous lookup. All five made exactly that distinction, and this time verification was strengthened to match the stakes — each agent had to prove it with a real end-to-end test that actually calls the suspend/close API and polls until the reaction completes, not a unit test asserting the handler function alone.</p>
        <p>All five passed, independent re-verification matching every self-report exactly. The interesting part wasn't the score.</p>
        <div className="article-note"><strong>Nothing had ever called it with two</strong><p>Card was already subscribing to the same two Account events StandingOrder now needed. The moment a second subscriber existed for an eventType, it exposed that the root <code>domain-events.md</code>'s stated principle — one event, multiple handler subscribers, 1:N — had never actually been load-bearing code in two of the five languages. It had been true in the docs since before this benchmark existed, and false in the code the entire time, because nothing had ever tried it.</p></div>
        <p>Java-springboot's handler map was built with <code>Collectors.toMap(eventType, identity())</code> — a shape where registering a second handler bean for an eventType already in use throws <code>IllegalStateException: Duplicate key</code> at boot, not at runtime under load, but the instant the application tries to start. FastAPI's <code>build_event_handlers()</code> returned <code>dict[str, EventHandlerFn]</code>, one callable per key — no crash at all, just the second registration silently overwriting the first, so only the newer subscriber would ever actually run. Go and NestJS had never had the problem: Go's <code>main.go</code> hand-assembles a plain map where adding a second call under the same key is unremarkable, and NestJS's registry was already list-shaped from the start. Each language's agent fixed its own case without coordinating with the others — Java moved to <code>Collectors.groupingBy</code>, producing a real <code>Map&lt;String, List&lt;OutboxEventHandler&gt;&gt;</code>; FastAPI moved to <code>dict[str, list[EventHandlerFn]]</code> and updated its consumer, its scaffolding generator, and the doc all together.</p>
        <p>Kotlin's fix was the odd one out — not wrong, but a different shape of workaround. Rather than restructuring its registry to be list-valued, it added the second handler call directly inside the existing per-eventType lambda:</p>
        <pre><code>{`"AccountSuspendedEvent" to { eventId, payload ->
    accountSuspendedEventHandler.handle(objectMapper.readValue(payload, AccountSuspendedEvent::class.java), eventId)
    standingOrderPauseHandler.handle(objectMapper.readValue(payload, AccountSuspendedEvent::class.java), eventId)
}`}</code></pre>
        <p>Functionally correct for exactly two subscribers, hardcoded rather than structural — a third subscriber to the same event will need a hand edit to this lambda rather than a new registration, unlike Java and FastAPI's now-generalized shape. Flagged, not fixed; the harness still passes, because nothing in it requires the more scalable form.</p>
        <h2>What the Task Actually Tested</h2>
        <p>This mirrors, and extends, the lesson from <a href="/posts/the-harness-had-never-met-a-second-domain">building a second domain to validate the harness itself</a>: some bugs only exist once a specific combination of circumstances shows up in the code, and no amount of reading, no amount of repeating an easy task, and no static rule can produce that combination on its own — only running the actual scenario can. Level 1's perfect scores measured whether five languages agree on an easy judgment call. Level 4 measured something a perfect score can hide entirely: whether a codebase survives the first time a real-world shape of usage — two things caring about the same event — actually happens to it. Three of five languages hadn't, silently, until a task was deliberately built to make it happen.</p>
        <div className="article-note"><strong>Further reading in the repo</strong><p>
          <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/docs/benchmark.md" target="_blank" rel="noreferrer">docs/benchmark.md</a> — the full run, every level, every self-report vs. independent re-verification table · <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/implementations/java-springboot/examples/src/main/java/com/example/accountservice/outbox/OutboxEventDispatcher.java" target="_blank" rel="noreferrer">OutboxEventDispatcher.java</a> — the real fix, list-valued handler map · <a href="/posts/can-an-ai-agent-follow-your-architecture">Can an AI Agent Follow Your Architecture?</a> — the methodology this run is built on
        </p></div>
      </>
    ),
  },
  ko: {
    kicker: 'AI Agents · Benchmark',
    title: (
      <>
        구독자가 둘이어야만<br /><em>존재하던 버그</em>
      </>
    ),
    lede: '5개 언어 전부가 첫 시도에서 100점을 받은 합성 과제는 언뜻 좋은 소식처럼 읽힌다. 그건 대부분 천장 효과다 — 실패할 여지가 없는 테스트는 어디가 한계선인지 아무것도 가르쳐주지 않는다. 의도적으로 더 어려운 과제 네 단계 뒤, 마지막 단계는 다섯 언어 중 어느 것도 지금껏 놓여본 적 없던 상황에서만 존재하는 버그를 찾아냈다: 두 개의 Bounded Context가 같은 이벤트를 구독하는 것 — 이 저장소 역사상 처음이었다.',
    body: (
      <>
        <p>설정은 단순했다: 같은 합성 도메인 Voucher — 발행하면 <code>ACTIVE</code>, redeem은 이벤트 없는 단순 전이, expire는 시스템의 다른 부분이 반응하니까 이벤트 발행 — 을 5개 언어 전부에서 동시에 독립적으로 만들었다. 각 에이전트에게는 자기 언어의 <code>implementations/&lt;lang&gt;/CLAUDE.md</code> 하나만 진입점으로 주어졌다. 문서 경로도, 스캐폴딩 도구 힌트도 없었다. 다섯 모두 하네스 만점을 받았고, 다섯 모두 독립적으로 같은 판단에 수렴했다: <code>expire()</code>에서만 이벤트를 발행한다 — 다른 곳에서 이미 확립된 "실제로 무언가가 반응하는가?" 패턴 그대로. 문서가 언어 간에 일관되게 전달되고 있다는 강한 증거였다 — 그리고 그 과정에서, 이 실행은 아무도 눈치채지 못했던 실제 툴링 회귀 3건도 함께 드러냈다: 같은 날 만들어진 네이밍 규칙이 이미 금지한 형태를 여전히 뱉어내던 스캐폴딩 생성기 두 개, 그리고 파일 워커가 건너뛰어야 할 디렉터리 목록에서 조용히 서로 어긋나 있던 하네스 두 개.</p>
        <h2>어디서나 만점이라는 건 안심할 일이 아니다</h2>
        <p>5개 언어, 쉬운 과제 하나, 다섯 번의 첫 시도 승리. 그 자체로는 어느 구현체가 실제로 어디서 실패할지에 대해 아무것도 설명하지 않는다 — 항상 통과하는 테스트는 변별력이 없고, Voucher는 의도적으로 쉬운 첫 과제였다. 진짜 질문은 다음에 뭘 만들어야 하냐는 것이었고, 같은 쉬운 형태를 반복하는 건 답이 될 수 없었다. 이 과제에 필요했던 건 더 많은 반복이 아니었다. 의도적으로, 지금까지 아무것도 건드려본 적 없는 코드 경로를 정확히 겨냥한 방향으로 어려워지는 것이었다.</p>
        <h2>반복이 아니라 사다리</h2>
        <p>레벨 2 — Booking/Cancellation, 하나의 Bounded Context 안에 두 Aggregate와 Domain Service, Payment/Refund의 기존 <code>RefundEligibilityService</code>를 그대로 반영하는 구조 — 는 사다리가 실제로 변별력을 갖는다는 첫 신호였다. 다섯 모두 여전히 100점에 도달했고, 다섯 모두 명세가 틀릴 여지를 남겨뒀던 미묘한 판단(거부된 예약은 Refund의 영속화된 <code>REJECTED</code> 상태와 달리 아예 저장되지 않는다)에 독립적으로 같은 결론을 냈다 — 하지만 nestjs는 첫 시도에서 96/100을 받았다. 이번엔 진짜 결함이었다, 컨벤션이 타입화된 enum을 요구하는 자리에 raw string을 던진 것 — 그리고 스스로 고쳤다.</p>
        <p>레벨 3 — Membership, 다른 BC인 Account의 상태를 읽는 동기 Adapter가 필요한 과제 — 는 다시 다섯 모두 올바른 패턴에 수렴했다: 레벨 4 과제였다면 필요했을 비동기 Integration Event가 아니라 동기 읽기. 그리고 모든 언어가 Account의 상태 enum을 그대로 경계 너머로 흘리지 않고 정확히 단순한 boolean으로 번역했다. java의 에이전트는 한 걸음 더 나아가, Card의 기존 <code>AccountAdapterImpl</code>과의 Spring bean 이름 충돌을 아무것도 작성하기 전에 그 충돌을 언급한 기존 코드 주석을 발견해 읽음으로써 스스로 피했다.</p>
        <h2>레벨 3의 거울상으로 설계된 레벨 4</h2>
        <p>StandingOrder는 정확히 레벨 3의 반대 이미지로 설계됐다: Account를 대상으로 만들면 <code>ACTIVE</code>가 되고, 그 Account가 나중에 정지되면 StandingOrder는 자동으로 <code>PAUSED</code>가 되어야 하며, Account가 해지되면 <code>CANCELLED</code>가 되어야 한다 — 이 반응은 Account의 상태가 바뀌는 바로 그 순간 일어나야 하며, StandingOrder 자체에 대한 직접 호출을 통해서는 절대 일어나선 안 된다. 이번엔 정답이 레벨 3과 정반대다: 동기 조회가 아니라 비동기 Integration Event 구독. 다섯 모두 정확히 그 구분을 해냈고, 이번엔 검증도 그 무게에 맞게 강화됐다 — 각 에이전트는 핸들러 함수 하나만 단언하는 유닛 테스트가 아니라, 실제 suspend/close API를 호출하고 반응이 완료될 때까지 폴링하는 진짜 end-to-end 테스트로 증명해야 했다.</p>
        <p>다섯 모두 통과했고, 독립 재검증은 모든 자체 보고와 정확히 일치했다. 흥미로운 건 점수가 아니었다.</p>
        <div className="article-note"><strong>아무것도 그걸 둘로 호출해본 적이 없었다</strong><p>Card는 이미 StandingOrder가 이제 필요로 하는 같은 두 개의 Account 이벤트를 구독하고 있었다. 어떤 eventType에 두 번째 구독자가 생기는 순간, 루트 <code>domain-events.md</code>가 명시한 원칙 — 하나의 이벤트, 여러 핸들러 구독자, 1:N — 이 다섯 언어 중 둘에서는 한 번도 실제로 작동하는 코드였던 적이 없다는 게 드러났다. 이 벤치마크가 존재하기 전부터 문서에서는 참이었고, 코드에서는 내내 거짓이었다 — 아무도 시도해본 적이 없었기 때문이다.</p></div>
        <p>java-springboot의 핸들러 맵은 <code>Collectors.toMap(eventType, identity())</code>로 만들어져 있었다 — 이미 사용 중인 eventType에 두 번째 핸들러 빈을 등록하면 런타임 부하 상황이 아니라 애플리케이션이 뜨려는 바로 그 순간 <code>IllegalStateException: Duplicate key</code>로 부팅 자체가 실패하는 구조였다. fastapi의 <code>build_event_handlers()</code>는 <code>dict[str, EventHandlerFn]</code>를 반환했다, 키당 콜러블 하나 — 아예 크래시도 없이, 두 번째 등록이 조용히 첫 번째를 덮어써서 더 나중에 등록된 구독자만 실제로 실행됐을 것이다. go와 nestjs는 애초에 이 문제가 없었다: go의 <code>main.go</code>는 평범한 맵을 손으로 조립하는데 같은 키 아래 두 번째 호출을 추가하는 건 별일이 아니고, nestjs의 레지스트리는 처음부터 리스트 형태였다. 각 언어의 에이전트는 서로 조율 없이 각자 자기 케이스를 고쳤다 — java는 <code>Collectors.groupingBy</code>로 옮겨 진짜 <code>Map&lt;String, List&lt;OutboxEventHandler&gt;&gt;</code>를 만들었고, fastapi는 <code>dict[str, list[EventHandlerFn]]</code>로 옮기며 consumer, 스캐폴딩 생성기, 문서까지 함께 갱신했다.</p>
        <p>kotlin의 수정은 다른 종류였다 — 틀린 건 아니지만 다른 모양의 임시방편이었다. 레지스트리를 리스트 값 구조로 재설계하는 대신, 기존 eventType별 람다 안에 두 번째 핸들러 호출을 그냥 추가했다:</p>
        <pre><code>{`"AccountSuspendedEvent" to { eventId, payload ->
    accountSuspendedEventHandler.handle(objectMapper.readValue(payload, AccountSuspendedEvent::class.java), eventId)
    standingOrderPauseHandler.handle(objectMapper.readValue(payload, AccountSuspendedEvent::class.java), eventId)
}`}</code></pre>
        <p>정확히 구독자 둘일 때는 기능적으로 올바르지만, 구조적이 아니라 하드코딩된 형태다 — 같은 이벤트에 세 번째 구독자가 생기면 java/fastapi의 이제 일반화된 구조와 달리 이 람다를 다시 손으로 고쳐야 한다. 문제로 기록만 됐을 뿐 고쳐지지는 않았다 — 하네스는 여전히 통과한다, 그 안의 어떤 것도 더 확장 가능한 형태를 요구하지 않기 때문이다.</p>
        <h2>이 과제가 실제로 검증한 것</h2>
        <p>이건 <a href="/posts/the-harness-had-never-met-a-second-domain">하네스 자체를 검증하려고 두 번째 도메인을 만들었던 이야기</a>의 교훈을 그대로 반영하면서 확장한다: 어떤 버그는 코드 안에 특정 조합의 상황이 실제로 등장해야만 존재하고, 아무리 많이 읽어봐도, 쉬운 과제를 아무리 반복해도, 어떤 정적 규칙으로도 그 조합을 스스로 만들어낼 수 없다 — 실제 시나리오를 돌려보는 것만이 할 수 있다. 레벨 1의 만점들은 다섯 언어가 쉬운 판단에 동의하는지를 측정했다. 레벨 4는 만점이 완전히 숨길 수 있는 것을 측정했다: 실제 사용의 한 형태 — 같은 이벤트에 두 개가 관심을 갖는 것 — 이 실제로 코드베이스에 닥쳤을 때 살아남는가. 다섯 중 셋은, 조용히, 그때까지 살아남은 적이 없었다 — 그 상황이 실제로 일어나도록 의도적으로 과제를 설계하기 전까지는.</p>
        <div className="article-note"><strong>저장소 내 추가 자료</strong><p>
          <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/docs/benchmark.md" target="_blank" rel="noreferrer">docs/benchmark.md</a> — 전체 실행 기록, 모든 레벨, 자체 보고 대 독립 재검증 표 전부 · <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/implementations/java-springboot/examples/src/main/java/com/example/accountservice/outbox/OutboxEventDispatcher.java" target="_blank" rel="noreferrer">OutboxEventDispatcher.java</a> — 실제 수정된, 리스트 값을 갖는 핸들러 맵 · <a href="/posts/can-an-ai-agent-follow-your-architecture">AI 에이전트는 당신의 아키텍처를 따를 수 있을까?</a> — 이 실행이 기반한 방법론
        </p></div>
      </>
    ),
  },
};

export default function TheBugThatNeededTwoSubscribersToExist() {
  const { locale } = useLocale();
  const c = content[locale];

  return (
    <PostLayout
      slug="the-bug-that-needed-two-subscribers-to-exist"
      kicker={c.kicker}
      title={c.title}
      lede={c.lede}
    >
      {c.body}
    </PostLayout>
  );
}
