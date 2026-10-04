import PostLayout from '../../components/PostLayout';
import { useLocale, localeFromPathname } from '../../lib/locale';
import type { MetaFunction } from 'react-router';
import { createPostMeta } from '../../lib/seo';

export const meta: MetaFunction = ({ location }) =>
  createPostMeta('the-bug-that-needed-two-subscribers-to-exist', localeFromPathname(location.pathname));

const content = {
  en: {
    kicker: 'AI Agents · Benchmark',
    title: (
      <>
        The Bug That Needed<br /><em>Two Subscribers to Exist</em>
      </>
    ),
    lede: 'A synthetic task where all five languages score 100% on the first try reads like good news. It is mostly a ceiling effect: a test with no room to fail teaches nothing about where the edges are. Four levels of deliberately harder tasks later, the last one found a bug none of the five had ever been in a position to have: two Bounded Contexts subscribing to the same event, for the first time in the repository\'s history.',
    body: (
      <>
        <p>The setup was simple. The same synthetic domain, Voucher (issue to <code>ACTIVE</code>, redeem as a plain transition with no event, expire as an event since other parts of the system react to it), was built independently across all five languages at once, each agent given nothing but its own <code>implementations/&lt;lang&gt;/CLAUDE.md</code> as an entry point. No doc paths, no scaffolding-tool hints. All five hit a perfect harness score, and all five independently converged on the identical judgment: publish the event on <code>expire()</code> only, matching the same "does anything react?" pattern the docs already establish elsewhere. Strong evidence the docs communicate consistently across languages. Along the way, the run also surfaced three tooling regressions nobody had noticed: two scaffolding generators still emitting a shape a naming rule built the same day now forbade, and two harnesses drifting out of parity on which directories their file walkers were supposed to skip.</p>
        <h2>A Perfect Score Everywhere Is Not Reassuring</h2>
        <p>Five languages, one easy task, five first-try wins. On its own that result explains nothing about where any implementation would fail. A test that always passes has no discriminative power, and Voucher was, deliberately, an easy first task. The question was what to build next, and running the same easy shape again wasn't going to answer it. What the task needed wasn't more repeats. It needed to get harder, on purpose, in directions specifically chosen to exercise code paths nothing before this had ever exercised.</p>
        <h2>A Ladder, Not a Repeat</h2>
        <p>Level 2, Booking/Cancellation (two Aggregates inside one Bounded Context plus a Domain Service, mirroring Payment/Refund's existing <code>RefundEligibilityService</code>), was the first sign the ladder discriminated. All five still reached 100%, and all five independently made the same subtle judgment call the spec allowed room to get wrong (a rejected booking is never persisted, unlike Refund's persisted <code>REJECTED</code> state). But NestJS scored 96/100 on its first pass, a genuine defect this time, a raw string thrown where the convention requires a typed enum, then corrected it on its own.</p>
        <p>Level 3, Membership, which needs a synchronous Adapter reading another BC's Account status, again converged on the right pattern in all five: the synchronous read, not the asynchronous Integration Event a level-4 task would have needed instead. Every language correctly translated Account's status enum into a plain boolean rather than leaking the enum itself across the boundary. Java's agent went a step further on its own, avoiding a Spring bean-name collision with Card's existing <code>AccountAdapterImpl</code> by noticing and reading an existing code comment that named the conflict before writing anything.</p>
        <h2>Level 4, Built to Contrast With Level 3</h2>
        <p>StandingOrder was designed specifically as level 3's mirror image. Create one against an Account, and it becomes <code>ACTIVE</code>; if that Account is later suspended, the StandingOrder must become <code>PAUSED</code> automatically, and <code>CANCELLED</code> if the Account is closed. The reaction has to happen the moment the Account's status changes, never through a direct call on StandingOrder itself. The correct pattern this time is the opposite of level 3's: subscribing to an asynchronous Integration Event, not a synchronous lookup. All five made that distinction, and this time verification was strengthened to match the stakes — each agent had to prove it with an end-to-end test that calls the suspend/close API and polls until the reaction completes, not a unit test asserting the handler function alone.</p>
        <p>All five passed, independent re-verification matching every self-report. The interesting part wasn't the score.</p>
        <div className="article-note"><strong>Nothing had ever called it with two</strong><p>Card was already subscribing to the same two Account events StandingOrder now needed. The moment a second subscriber existed for an eventType, it exposed that the root <code>domain-events.md</code>'s stated principle (one event, multiple handler subscribers, 1:N) had never been load-bearing code in two of the five languages. It had been true in the docs since before this benchmark existed, and false in the code the entire time, because nothing had ever tried it.</p></div>
        <p>Java-springboot's handler map was built with <code>Collectors.toMap(eventType, identity())</code>, a shape where registering a second handler bean for an eventType already in use throws <code>IllegalStateException: Duplicate key</code> at boot: not at runtime under load, but the instant the application tries to start. FastAPI's <code>build_event_handlers()</code> returned <code>dict[str, EventHandlerFn]</code>, one callable per key. No crash at all, just the second registration overwriting the first without a word, so only the newer subscriber would ever run. Go and NestJS had never had the problem: Go's <code>main.go</code> hand-assembles a plain map where adding a second call under the same key is unremarkable, and NestJS's registry was already list-shaped from the start. Each language's agent fixed its own case without coordinating with the others. Java moved to <code>Collectors.groupingBy</code>, producing a proper <code>Map&lt;String, List&lt;OutboxEventHandler&gt;&gt;</code>; FastAPI moved to <code>dict[str, list[EventHandlerFn]]</code> and updated its consumer, its scaffolding generator, and the doc all together.</p>
        <p>Kotlin's fix was the odd one out: not wrong, but a different shape of workaround. Rather than restructuring its registry to be list-valued, it added the second handler call directly inside the existing per-eventType lambda:</p>
        <pre><code>{`"AccountSuspendedEvent" to { eventId, payload ->
    accountSuspendedEventHandler.handle(objectMapper.readValue(payload, AccountSuspendedEvent::class.java), eventId)
    standingOrderPauseHandler.handle(objectMapper.readValue(payload, AccountSuspendedEvent::class.java), eventId)
}`}</code></pre>
        <p>Functionally correct for two subscribers, hardcoded rather than structural. A third subscriber to the same event will need a hand edit to this lambda rather than a new registration, unlike Java and FastAPI's now-generalized shape. Flagged, not fixed; the harness still passes, because nothing in it requires the more scalable form.</p>
        <h2>What the Task Tested</h2>
        <p>This mirrors, and extends, the lesson from <a href="/posts/the-harness-had-never-met-a-second-domain">building a second domain to validate the harness itself</a>: some bugs only exist once a specific combination of circumstances shows up in the code, and no amount of reading, no amount of repeating an easy task, and no static rule can produce that combination on its own. Only running the scenario can. Level 1's perfect scores measured whether five languages agree on an easy judgment call. Level 4 measured something a perfect score can hide entirely: whether a codebase survives the first time a real-world shape of usage (two things caring about the same event) happens to it. Three of five languages hadn't, without anyone knowing, until a task was deliberately built to make it happen.</p>
        <div className="article-note"><strong>Further reading in the repo</strong><p>
          <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/docs/benchmark.md" target="_blank" rel="noreferrer">docs/benchmark.md</a> (the full run, every level, every self-report vs. independent re-verification table) · <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/implementations/java-springboot/examples/src/main/java/com/example/accountservice/outbox/OutboxEventDispatcher.java" target="_blank" rel="noreferrer">OutboxEventDispatcher.java</a> (the fix, list-valued handler map) · <a href="/posts/can-an-ai-agent-follow-your-architecture">Can an AI Agent Follow Your Architecture?</a> (the methodology this run is built on)
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
    lede: '합성 과제에서 5개 언어가 모두 첫 시도에 100점을 받으면 좋은 소식처럼 보인다. 대부분은 천장 효과다. 실패할 틈이 없는 테스트로는 어디가 한계인지 알 수 없다. 그래서 일부러 더 어려운 과제를 네 단계로 쌓았고, 마지막 단계에서 버그가 하나 나왔다. Bounded Context 두 개가 같은 이벤트를 구독하는 상황에서만 생기는 버그였다. 저장소가 생긴 뒤로 그런 상황은 처음이었고, 그래서 5개 언어 중 어디에서도 드러날 기회가 없었다.',
    body: (
      <>
        <p>시작은 단순했다. Voucher라는 합성 도메인 하나를 5개 언어로 동시에, 서로 따로 만들게 했다. 발행하면 <code>ACTIVE</code>가 되고, 사용 처리(redeem)는 이벤트 없이 상태만 바뀌고, 만료(expire)는 시스템의 다른 곳이 반응하니 이벤트를 낸다. 에이전트마다 자기 언어의 <code>implementations/&lt;lang&gt;/CLAUDE.md</code> 하나만 주고 시작했다. 문서 경로도, 스캐폴딩 도구 힌트도 주지 않았다.</p>
        <p>다섯 모두 하네스 만점을 받았고, 서로 상의 없이 같은 판단을 내렸다. 이벤트는 <code>expire()</code>에서만 발행한다는 것이다. 문서가 다른 곳에서 이미 보여 준 "이걸 듣고 반응하는 쪽이 있는가" 기준 그대로였다. 문서가 언어에 상관없이 같은 뜻으로 읽힌다는 좋은 증거였다. 덤으로 아무도 몰랐던 도구 회귀 3건도 나왔다. 같은 날 만든 네이밍 규칙이 금지한 형태를 여전히 찍어 내는 스캐폴딩 생성기 2개, 그리고 파일 워커가 건너뛸 디렉터리 목록이 서로 어긋나 있던 하네스 2개였다.</p>
        <h2>모두 만점이면 오히려 불안하다</h2>
        <p>5개 언어 모두 쉬운 과제 하나를 첫 시도에 통과했다. 이 결과만으로는 어느 구현이 어디서 무너질지 알 수 없다. 늘 통과하는 테스트에는 변별력이 없고, Voucher는 일부러 쉽게 낸 첫 과제였다. 정말 궁금한 건 다음에 무엇을 만들게 할지였고, 같은 쉬운 과제를 또 돌려서는 답이 안 나온다. 반복을 늘릴 게 아니었다. 지금까지 어떤 과제도 건드리지 않은 코드 경로를 골라, 그쪽으로 일부러 어렵게 만들어야 했다.</p>
        <h2>반복 대신 사다리</h2>
        <p>레벨 2는 Booking/Cancellation이었다. Bounded Context 하나 안에 Aggregate 2개와 Domain Service를 두는 구조로, Payment/Refund의 <code>RefundEligibilityService</code>를 본뜬 것이다. 사다리가 변별력을 갖기 시작한 첫 단계였다. 다섯 모두 여전히 100점에 닿았고, 명세가 틀릴 여지를 남겨 둔 미묘한 판단에서도 같은 답을 냈다. Refund는 <code>REJECTED</code> 상태를 저장하지만, 거부된 예약은 아예 저장하지 않는다는 판단이다. 다만 NestJS가 첫 시도에서 96/100을 받았다. 이번엔 진짜 결함이었다. 컨벤션상 타입이 있는 enum을 던져야 할 자리에 그냥 문자열을 던졌고, 에이전트가 스스로 고쳤다.</p>
        <p>레벨 3 Membership은 다른 BC인 Account의 상태를 읽는 동기 Adapter가 필요한 과제였다. 이번에도 다섯 모두 맞는 패턴을 골랐다. 레벨 4라면 비동기 Integration Event가 필요했겠지만, 여기서는 동기로 읽는 게 맞다. 모든 언어가 Account의 상태 enum을 경계 밖으로 그대로 흘리지 않고 단순한 boolean으로 바꿔 넘겼다. Java 에이전트는 한 걸음 더 나갔다. Card에 이미 있는 <code>AccountAdapterImpl</code>과 Spring bean 이름이 겹친다는 걸, 코드를 쓰기 전에 그 충돌을 적어 둔 기존 주석을 찾아 읽고 미리 피했다.</p>
        <h2>레벨 3을 뒤집어 만든 레벨 4</h2>
        <p>StandingOrder는 처음부터 레벨 3의 거울상으로 설계했다. Account를 대상으로 만들면 <code>ACTIVE</code>가 된다. 그 Account가 나중에 정지되면 StandingOrder는 자동으로 <code>PAUSED</code>가 되고, Account가 해지되면 <code>CANCELLED</code>가 되어야 한다. 이 반응은 Account 상태가 바뀌는 순간 일어나야 하고, StandingOrder를 직접 호출해서 일으키면 안 된다. 그래서 정답 패턴도 레벨 3과 반대다. 동기 조회 대신 비동기 Integration Event를 구독해야 한다.</p>
        <p>다섯 모두 이 차이를 제대로 짚었다. 이번엔 걸린 게 큰 만큼 검증도 강화했다. 핸들러 함수만 단언하는 유닛 테스트로는 인정하지 않았다. 실제 suspend/close API를 호출하고 반응이 끝날 때까지 폴링하는 end-to-end 테스트로 증명하게 했다.</p>
        <p>다섯 모두 통과했고, 따로 다시 검증한 결과도 각자의 자체 보고와 하나도 다르지 않았다. 재미있는 건 점수 쪽이 아니었다.</p>
        <div className="article-note"><strong>구독자 둘로 불러 본 적이 없었다</strong><p>Card는 StandingOrder가 필요로 하는 Account 이벤트 2개를 이미 구독하고 있었다. 한 eventType에 두 번째 구독자가 붙는 순간, 숨어 있던 사실이 드러났다. 루트 <code>domain-events.md</code>는 이벤트 하나에 핸들러 여럿(1:N)을 원칙으로 적어 두었는데, 5개 언어 중 둘에서는 그 원칙이 코드로 한 번도 일을 해 본 적이 없었다. 이 벤치마크를 만들기 전부터 문서에서는 맞는 말이었고, 코드에서는 내내 틀린 말이었다. 아무도 시도해 보지 않았기 때문이다.</p></div>
        <p>java-springboot는 핸들러 맵을 <code>Collectors.toMap(eventType, identity())</code>로 만들고 있었다. 이미 쓰이는 eventType에 두 번째 핸들러 빈을 등록하면 <code>IllegalStateException: Duplicate key</code>가 난다. 부하가 걸린 런타임이 아니라 애플리케이션이 뜨려는 그 순간에 부팅이 실패한다. FastAPI의 <code>build_event_handlers()</code>는 키마다 콜러블 하나를 담은 <code>dict[str, EventHandlerFn]</code>를 돌려줬다. 여기서는 크래시도 나지 않는다. 두 번째로 등록한 핸들러가 첫 번째를 덮어써서, 나중에 등록한 구독자만 돌았을 것이다.</p>
        <p>Go와 NestJS는 처음부터 이 문제가 없었다. Go의 <code>main.go</code>는 평범한 맵을 손으로 조립하니 같은 키에 호출을 하나 더 넣는 게 별일이 아니고, NestJS의 레지스트리는 원래 리스트 형태였다. 각 언어의 에이전트는 서로 맞추지 않고 자기 문제를 고쳤다. Java는 <code>Collectors.groupingBy</code>로 바꿔 <code>Map&lt;String, List&lt;OutboxEventHandler&gt;&gt;</code>를 만들었다. FastAPI는 <code>dict[str, list[EventHandlerFn]]</code>로 바꾸면서 consumer와 스캐폴딩 생성기, 문서까지 한꺼번에 고쳤다.</p>
        <p>Kotlin만 결이 달랐다. 틀린 건 아니지만 우회하는 방식이 다르다. 레지스트리를 리스트 값 구조로 바꾸지 않고, 기존의 eventType별 람다 안에 두 번째 핸들러 호출을 그냥 끼워 넣었다.</p>
        <pre><code>{`"AccountSuspendedEvent" to { eventId, payload ->
    accountSuspendedEventHandler.handle(objectMapper.readValue(payload, AccountSuspendedEvent::class.java), eventId)
    standingOrderPauseHandler.handle(objectMapper.readValue(payload, AccountSuspendedEvent::class.java), eventId)
}`}</code></pre>
        <p>구독자가 둘일 때는 제대로 동작한다. 하지만 구조로 푼 게 아니고 하드코딩이다. 같은 이벤트에 세 번째 구독자가 생기면, 일반화된 Java·FastAPI와 달리 새로 등록하는 대신 이 람다를 손으로 고쳐야 한다. 문제로 적어만 두고 고치지는 않았다. 더 확장하기 좋은 형태를 요구하는 규칙이 하네스에 없으니 하네스는 여전히 통과한다.</p>
        <h2>이 과제가 검증한 것</h2>
        <p><a href="/posts/the-harness-had-never-met-a-second-domain">하네스를 검증하려고 두 번째 도메인을 만들었던 글</a>의 교훈과 같은 이야기이고, 거기서 한 걸음 더 나간다. 어떤 버그는 특정한 상황 조합이 코드에 나타나야만 생긴다. 아무리 읽어도, 쉬운 과제를 아무리 반복해도, 어떤 정적 규칙을 써도 그 조합을 만들어 낼 수는 없다. 시나리오를 직접 돌려 봐야 한다.</p>
        <p>레벨 1의 만점은 5개 언어가 쉬운 판단에서 의견이 같은지를 쟀다. 레벨 4는 만점 뒤에 얼마든지 숨을 수 있는 것을 쟀다. 같은 이벤트에 관심 있는 쪽이 둘 생기는, 현실에서 흔한 사용 방식이 처음 닥쳤을 때 코드베이스가 버티는가. 5개 언어 중 셋은 그 상황을 일부러 만든 과제를 받기 전까지, 아무도 모르는 채로 버티지 못하는 상태였다.</p>
        <div className="article-note"><strong>저장소에서 더 볼 것</strong><p>
          <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/docs/benchmark.md" target="_blank" rel="noreferrer">docs/benchmark.md</a>(전체 실행 기록. 모든 레벨의 자체 보고와 독립 재검증 비교표가 있다) · <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/implementations/java-springboot/examples/src/main/java/com/example/accountservice/outbox/OutboxEventDispatcher.java" target="_blank" rel="noreferrer">OutboxEventDispatcher.java</a>(리스트 값 핸들러 맵으로 고친 코드) · <a href="/posts/can-an-ai-agent-follow-your-architecture">AI 에이전트는 아키텍처를 따를 수 있을까?</a>(이 실행의 바탕이 된 방법론)
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
