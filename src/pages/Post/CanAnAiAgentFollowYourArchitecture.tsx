import PostLayout from '../../components/PostLayout';
import { useLocale, localeFromPathname } from '../../lib/locale';
import type { MetaFunction } from 'react-router';
import { createPostMeta } from '../../lib/seo';

export const meta: MetaFunction = ({ location }) =>
  createPostMeta('can-an-ai-agent-follow-your-architecture', localeFromPathname(location.pathname));

const content = {
  en: {
    kicker: 'AI Agents · Benchmark',
    title: (
      <>
        Can an AI Agent<br /><em>Follow Your Architecture?</em>
      </>
    ),
    lede: "Most coding benchmarks ask whether the tests pass. A more useful question for a team adopting AI agents is narrower and harder: can it find your documented conventions on its own, and apply them correctly to a requirement it's never seen before?",
    body: (
      <>
        <p>Measuring that takes three decisions, and each is easy to get wrong. The task has to be sparse, so that finding the conventions is part of what gets tested. The score has to come from the person running the test, not from the agent's own report. And the difficulty has to rise one decision at a time, because a task every agent passes tells you nothing. I tried this on my example project, which implements the same backend design in five languages side by side. It already had an objective scorer that had never been used this way: an architecture checker that mechanically scores whether code follows the documented rules, with no human review needed. Turning it into a test for AI agents needed no new infrastructure at all, just a different way of framing the task.</p>
        <h2>Keep the Task Sparse</h2>
        <p>The prompt given to the agent contains three things, and nothing about how to implement it. First, the business rules for a domain that doesn't exist in the code yet. Second, an instruction to follow the existing conventions, plus the minimal entry point of where to start reading (that language's <code>CLAUDE.md</code>, with no other doc path given). Third, the completion criterion, which is simply to run the checker itself and iterate until it passes. Whether the agent finds the relevant docs on its own, by following the doc index instead of being handed a reading list, is itself part of what's being measured.</p>
        <div className="article-note"><strong>The one rule that makes this trustworthy</strong><p>The scorer must be the person running the test, not the agent. Never just trust an agent's self-reported "confirmed 100/100"; independently rerun the checker against its worktree. This caught real problems more than once, described below.</p></div>
        <h2>Does It Find the Conventions Unprompted?</h2>
        <p>The first real test gave an agent a Subscription domain: owner and plan name, <code>PENDING</code> on creation, a simple <code>activate()</code> transition, and a <code>cancel(reason)</code> deliberately described only as "other parts may need to react to it," with no further hint about what that meant technically. Nothing pointed the agent at the reference template, or at the script that generates a skeleton domain from a name.</p>
        <p>The agent followed the <code>CLAUDE.md</code> index on its own, discovered that generator script unprompted, generated a skeleton with it, then interpreted "other parts may need to react" as precisely what it needed to mean in this codebase (a Domain Event plus the Outbox pattern), implementing <code>cancel()</code> to publish an event while leaving <code>activate()</code> as a plain, event-free transition. Independent re-verification matched the self-report: <strong>A (100/100, raw 630/630)</strong>. Reading the domain code confirmed the business logic matched the spec too, not just the checker's score.</p>
        <h2>Do Independent Agents Make the Same Call?</h2>
        <p>A Voucher domain (issue, redeem, expire, with the same "other parts may need to react" hint attached only to <code>expire()</code>) ran simultaneously across all five implementations, one agent per language, each given only its own <code>CLAUDE.md</code> as the entry point.</p>
        <table>
          <thead><tr><th>Language</th><th>Self-report</th><th>Independent re-verification</th></tr></thead>
          <tbody>
            <tr><td>NestJS</td><td>A (100/100, raw 815/815)</td><td>815/815, matches</td></tr>
            <tr><td>FastAPI</td><td>854 passed, 0 failed</td><td>854/854, matches</td></tr>
            <tr><td>Go</td><td>652 passed, 0 failed</td><td>652/652, matches</td></tr>
            <tr><td>Kotlin Spring Boot</td><td>1172 passed, 0 failed</td><td>1172/1172, matches</td></tr>
            <tr><td>Java Spring Boot</td><td>1404 passed, 0 failed</td><td>mismatched at 1433/1, then unified at 1404/0</td></tr>
          </tbody>
        </table>
        <p>Every language scored perfectly, and, more interesting than the perfect score itself, every one independently chose to attach a Domain Event only to <code>expire()</code>, never to <code>redeem()</code>, applying the same underlying pattern ("a transition nobody reacts to has no event; one something needs to react to does") that a single root doc had described once. One doc, five independent agents, one identical architectural judgment.</p>
        <p>The Java mismatch is the more important result of this test. The independent re-verification disagreed with the self-report, and the cause wasn't the code at all. A stale Gradle build cache directory was being scanned by the checker as if it were real source, producing a false "no layer directory" positive. Deleting the build artifact and re-running matched the self-report. This is the scenario the "never trust the self-report" rule exists for: the discrepancy pointed at a real bug, just not the one anyone expected.</p>
        <h2>Raising the Difficulty, One Notch at a Time</h2>
        <p>A task where every language scores perfectly on the first try has no discriminating power. It can't tell you anything about where an agent (or a doc) might fail. Each later task deliberately added one new decision point.</p>
        <p><strong>A rule spanning two Aggregates.</strong> The next task required a Domain Service coordinating two Aggregates within the same BC (a Booking and a Cancellation, where the cancellation is only valid if the original booking is confirmed and the requested count doesn't exceed the original), with no mention of the one existing precedent for this shape anywhere in the prompt. Every language independently found that precedent and separated the judgment into a stateless Domain Service. Every one even caught a subtle spec distinction on its own: because the task said the invalid request itself must never be created, all five changed the Domain Service to throw immediately rather than return a rejection object to save, a different behavior from the existing precedent, correctly detected as different. NestJS was the first submission in any of these tests that wasn't perfect from the start, scoring 96 before self-correcting a real defect (a raw string thrown instead of the typed enum).</p>
        <p><strong>A synchronous lookup across a boundary.</strong> The next one needed a synchronous cross-BC lookup with no vocabulary hint at all, just the plain sentence that another BC's status had to be checked before allowing creation. All five picked the synchronous Adapter/ACL pattern, found the existing precedent, and kept the ACL discipline of never exposing the other BC's status enum directly, translating it into a boolean first. Independent verification caught another checker bug here too: three more evaluator files, beyond the one fixed earlier, shared the same stale-build-artifact blind spot.</p>
        <p><strong>An asynchronous reaction.</strong> The task after that flipped the axis entirely: an asynchronous reaction to another BC's event, deliberately designed to contrast with the synchronous lookup before it. Every language correctly chose to subscribe to an Integration Event instead of adding another synchronous call, and every one proved it end-to-end by suspending an account through the real API and polling until the reaction happened. This task's most important result wasn't about the agents at all. It exposed that two of the five languages' Outbox consumers could only ever register one handler per event type, breaking without an error the moment a second BC tried to subscribe to the same event. That's a real architectural gap the task found by touching a code path nothing had exercised before, not a contrived edge case.</p>
        <h2>Combining Every Decision at Once</h2>
        <p>The most demanding task combined three previously-separate axes into one task: a recurring transfer that runs automatically on a monthly schedule (the same batch/Task Outbox pattern as interest payments), requires a Domain Service to judge eligibility (the same shape as the earlier Refund precedent), and must isolate one rule's failure from every other rule's processing.</p>
        <p>Only three of five languages passed cleanly on the first submission. The other two had a perfect checker score <em>and</em> perfect unit tests, and still shipped a real bug that only an end-to-end test against real infrastructure caught: one saved a generated reference ID into a database column sized for a shorter format, failing on every retry scenario a full month later; the other's end-to-end test suite hit a FIFO queue's deduplication window across separate test methods within the same run, dropping every enqueue after the first and nearly producing a false-positive pass.</p>
        <div className="article-note"><strong>The clearest single finding across every test</strong><p>A perfect structural score and a perfect unit-test run are not proof a feature works. Every meaningful defect these runs surfaced only showed up once real infrastructure and concurrent execution were involved — which is why "does it work," checked independently, has to sit alongside "does it follow the structure," checked automatically.</p></div>
        <h2>What This Is Measuring</h2>
        <p>Every step above tested a different thing about the <em>documentation</em>, disguised as a test of the agent: whether a rule described once in a root doc produces the same judgment across five independent implementations and, by extension, across new engineers who've never seen this codebase before. A score that's identical across languages says the docs communicate the pattern with real precision. A test run that finds a bug in the checker itself, or a structural gap the codebase never happened to exercise, is doing something a passing test suite alone can't: proving the specification is complete, not just self-consistent.</p>
        <div className="article-note"><strong>Further reading</strong><p>
          <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/docs/benchmark.md" target="_blank" rel="noreferrer">docs/benchmark.md</a> (every task description and results table, in my example project that implements the same backend design in five languages) · <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/docs/harness.md" target="_blank" rel="noreferrer">docs/harness.md</a> (how the architecture checker scores code)
        </p></div>
      </>
    ),
  },
  ko: {
    kicker: 'AI Agents · Benchmark',
    title: (
      <>
        AI 에이전트는<br /><em>정해 둔 아키텍처를 따를 수 있을까?</em>
      </>
    ),
    lede: '코딩 벤치마크는 대개 테스트가 통과하는지를 본다. 그런데 AI 에이전트를 실제로 도입하려는 팀이라면 더 좁고 어려운 질문이 궁금할 것이다. 팀이 문서로 정해 둔 컨벤션을 에이전트가 알아서 찾아내고, 처음 보는 요구사항에 제대로 적용할 수 있을까?',
    body: (
      <>
        <p>이걸 재려면 세 가지를 정해야 하고, 셋 다 틀리기 쉽다. 과제는 성기게 줘서 컨벤션을 찾는 일까지 시험에 넣는다. 점수는 에이전트의 보고를 믿지 않고 시험하는 사람이 다시 돌려서 낸다. 난이도는 판단 지점을 하나씩 더해 가며 올린다. 모든 에이전트가 통과하는 과제로는 알 수 있는 게 없다.</p>
        <p>나는 같은 백엔드 설계를 5개 언어로 나란히 구현해 둔 내 예제 프로젝트에서 이걸 해 봤다. 거기에는 이런 용도로 써 본 적 없는 객관적인 채점기가 이미 있었다. 코드가 문서에 적힌 아키텍처 규칙을 따르는지 사람 검토 없이 기계적으로 점수를 매기는 아키텍처 검사 스크립트다. 이걸 AI 에이전트 시험으로 돌려쓰는 데 새 인프라는 하나도 필요 없었다. 과제를 내는 방식만 바꾸면 됐다.</p>
        <h2>과제는 성기게 준다</h2>
        <p>에이전트에게 주는 프롬프트에는 딱 세 가지만 들어 있고, 어떻게 구현하라는 말은 없다. 첫째는 아직 코드에 없는 도메인의 비즈니스 규칙이다. 둘째는 기존 컨벤션을 따르라는 지시와, 어디서부터 읽을지 알려 주는 최소한의 진입점이다. 진입점은 그 언어의 <code>CLAUDE.md</code> 하나뿐이고 다른 문서 경로는 주지 않는다. 셋째는 완료 기준인데, 검사 스크립트를 직접 돌려서 통과할 때까지 고치라는 것뿐이다. 읽을 목록을 받지 않고 문서 인덱스를 따라가며 관련 문서를 스스로 찾아내는지도 측정 대상에 들어간다.</p>
        <div className="article-note"><strong>결과를 믿을 수 있게 해 주는 규칙 하나</strong><p>채점은 에이전트가 아니라 시험을 돌리는 사람이 한다. 에이전트가 "100/100 확인"이라고 보고해도 그대로 믿지 않는다. 에이전트가 작업한 worktree에 검사를 따로 다시 돌린다. 아래에 나오듯, 이 규칙 덕분에 실제 문제를 여러 번 잡았다.</p></div>
        <h2>시키지 않아도 컨벤션을 찾아내나</h2>
        <p>처음 제대로 돌린 시험에서는 에이전트에게 Subscription 도메인을 줬다. owner와 plan 이름이 있고, 만들면 <code>PENDING</code> 상태로 시작한다. 단순한 <code>activate()</code> 전이가 있고, <code>cancel(reason)</code>이 있다. <code>cancel(reason)</code>에는 일부러 "다른 부분이 여기에 반응해야 할 수도 있다"라고만 적고, 기술적으로 무슨 뜻인지는 더 알려 주지 않았다. 레퍼런스 템플릿이나, 도메인 이름 하나로 빈 뼈대 코드를 만들어 주는 스크립트를 가리키는 말도 어디에도 없었다.</p>
        <p>에이전트는 <code>CLAUDE.md</code> 인덱스를 스스로 따라갔고, 시키지 않았는데도 그 생성 스크립트를 찾아내 뼈대를 만들었다. "다른 부분이 반응해야 할 수도 있다"는 문구는 이 코드베이스에서 뜻해야 하는 그대로 해석했다. Domain Event와 Outbox 패턴이다. 그래서 <code>cancel()</code>은 이벤트를 발행하게 만들고, <code>activate()</code>는 이벤트 없이 상태만 바꾸게 뒀다. 따로 다시 채점한 결과도 자체 보고와 같은 <strong>A (100/100, raw 630/630)</strong>였다. 도메인 코드를 직접 읽어 보니 검사 점수만 맞은 게 아니고 비즈니스 로직도 명세대로였다.</p>
        <h2>따로 일한 에이전트가 같은 판단을 내리나</h2>
        <p>다음은 Voucher 도메인이었다. issue, redeem, expire 세 동작이 있고, "다른 부분이 반응해야 할 수도 있다"는 같은 힌트를 <code>expire()</code>에만 붙였다. 이 과제를 5개 구현에서 언어마다 에이전트 하나씩 동시에 돌렸고, 각각에게는 자기 언어의 <code>CLAUDE.md</code>만 진입점으로 줬다.</p>
        <table>
          <thead><tr><th>언어</th><th>자체 보고</th><th>독립 재검증</th></tr></thead>
          <tbody>
            <tr><td>NestJS</td><td>A (100/100, raw 815/815)</td><td>815/815, 일치</td></tr>
            <tr><td>FastAPI</td><td>854개 통과, 0개 실패</td><td>854/854, 일치</td></tr>
            <tr><td>Go</td><td>652개 통과, 0개 실패</td><td>652/652, 일치</td></tr>
            <tr><td>Kotlin Spring Boot</td><td>1172개 통과, 0개 실패</td><td>1172/1172, 일치</td></tr>
            <tr><td>Java Spring Boot</td><td>1404개 통과, 0개 실패</td><td>1433/1로 어긋났다가 1404/0으로 일치</td></tr>
          </tbody>
        </table>
        <p>모든 언어가 만점을 받았다. 그리고 다섯 구현체 모두 Domain Event를 <code>expire()</code>에만 붙이고 <code>redeem()</code>에는 붙이지 않았다. 서로의 결과를 보지 않고 각자 내린 판단이다. 루트 문서 하나가 딱 한 번 설명한 패턴을 그대로 적용한 결과였다. "아무도 반응하지 않는 전이에는 이벤트가 없고, 무언가 반응해야 하는 전이에는 이벤트가 있다"는 패턴이다. 문서는 하나였고, 따로 일한 에이전트 다섯이 똑같은 아키텍처 판단을 내렸다.</p>
        <p>이 시험에서 더 중요한 결과는 Java의 불일치였다. 따로 돌린 재검증이 자체 보고와 달랐는데, 원인은 코드에 없었다. 검사 스크립트가 오래된 Gradle 빌드 캐시 디렉터리를 소스처럼 스캔하면서 "레이어 디렉터리 없음"이라는 거짓 양성을 냈다. 빌드 산출물을 지우고 다시 돌리자 자체 보고와 똑같이 나왔다. "자체 보고를 그대로 믿지 않는다"는 규칙은 이런 경우 때문에 있다. 불일치는 분명히 버그를 가리키고 있었다. 다만 아무도 예상하지 못한 곳의 버그였다.</p>
        <h2>난이도를 한 단계씩 올리기</h2>
        <p>모든 언어가 첫 시도에 만점을 받는 과제로는 아무것도 가려낼 수 없다. 에이전트가, 혹은 문서가 어디서 무너질지 알려 주지 않는다. 그래서 이후 과제마다 새로운 판단 지점을 하나씩 일부러 더했다.</p>
        <p><strong>두 Aggregate에 걸친 규칙.</strong> 다음 과제는 같은 BC 안에서 Aggregate 2개를 조율하는 Domain Service가 필요한 과제였다. Booking과 Cancellation이 있고, 취소는 원래 예약이 confirmed 상태이고 요청 수량이 원래 수량을 넘지 않을 때만 유효하다. 코드에 이런 모양의 선례가 하나 있다는 말은 프롬프트 어디에도 넣지 않았다. 그런데도 모든 언어가 그 선례를 찾아냈고, 판단 로직을 상태 없는(stateless) Domain Service로 떼어 냈다.</p>
        <p>명세의 미묘한 차이도 모두 스스로 알아챘다. 과제에는 유효하지 않은 요청은 아예 만들어지면 안 된다고 적혀 있었다. 그래서 5개 언어 모두 거절 객체를 반환해 저장하는 대신, Domain Service가 바로 예외를 던지게 바꿨다. 기존 선례와 다른 동작인데, 다르다는 걸 제대로 짚어 낸 것이다. NestJS는 이 시험들을 통틀어 처음으로 첫 결과가 만점이 아니었다. 96점을 받은 뒤 결함 하나를 스스로 고쳤다. 타입이 있는 enum 대신 그냥 문자열을 던지고 있었다.</p>
        <p><strong>경계 너머 동기 조회.</strong> 그다음은 동기식 cross-BC 조회가 필요한 과제였는데, 용어 힌트는 전혀 주지 않았다. 생성 전에 다른 BC의 상태를 확인해야 한다는 평범한 문장 하나만 있었다. 5개 언어 모두 동기식 Adapter/ACL 패턴을 골랐고, 기존 선례를 찾아냈다. 다른 BC의 상태 enum을 그대로 노출하지 않고 boolean으로 바꿔서 넘기는 ACL 원칙도 지켰다. 여기서도 따로 돌린 검증이 검사 스크립트의 버그를 하나 더 잡았다. 앞서 고친 평가 파일 말고도 3개가 똑같은 사각지대를 갖고 있었다. 오래된 빌드 산출물을 소스로 읽는 문제였다.</p>
        <p><strong>비동기 반응.</strong> 그다음 과제는 축을 완전히 뒤집었다. 다른 BC의 이벤트에 비동기로 반응하는 과제로, 바로 앞의 동기식 조회와 대비되게 일부러 설계했다. 모든 언어가 동기 호출을 하나 더 붙이지 않고 Integration Event를 구독하는 쪽을 골랐다. 그리고 실제 API로 계정을 정지한 뒤 반응이 일어날 때까지 폴링해서 end-to-end로 증명했다.</p>
        <p>이 과제의 가장 중요한 결과는 에이전트 쪽에서 나오지 않았다. 5개 언어 중 2개의 Outbox consumer가 이벤트 타입마다 핸들러를 하나만 등록할 수 있었다. 두 번째 BC가 같은 이벤트를 구독하는 순간 에러 없이 깨지는 구조였다. 억지로 만든 엣지 케이스가 아니다. 그동안 아무도 지나간 적 없는 코드 경로를 시험 과제가 처음 건드리면서 드러난 실제 아키텍처 결함이다.</p>
        <h2>판단을 전부 한꺼번에</h2>
        <p>가장 어려운 과제는 그동안 따로 다루던 세 축을 하나에 합쳤다. 매달 자동으로 도는 정기 송금이고(이자 지급과 같은 batch/Task Outbox 패턴), 자격 여부는 Domain Service가 판단해야 하며(앞의 Refund 선례와 같은 모양), 규칙 하나가 실패해도 다른 규칙 처리에는 영향이 없어야 한다.</p>
        <p>첫 제출에서 깔끔하게 통과한 건 5개 언어 중 3개뿐이었다. 나머지 2개는 검사 만점<em>과</em> unit test 전부 통과를 받고도, 실제 인프라에 대고 돌린 end-to-end 테스트에서만 잡히는 버그를 안고 있었다. 한 언어는 생성한 참조 ID를 더 짧은 형식에 맞춰 크기를 잡은 데이터베이스 컬럼에 저장했다. 그래서 꼭 한 달 뒤, 재시도하는 시나리오마다 실패했다. 다른 언어는 end-to-end 테스트가 같은 실행 안의 서로 다른 테스트 메서드에 걸쳐 FIFO 큐의 중복 제거(deduplication) 윈도우에 걸렸다. 첫 번째 이후의 enqueue가 전부 에러 없이 버려졌고, 하마터면 거짓 통과가 나올 뻔했다.</p>
        <div className="article-note"><strong>모든 시험을 통틀어 가장 분명한 발견</strong><p>구조 점수 만점과 unit test 전부 통과는 기능이 동작한다는 증거가 못 된다. 이 시험들에서 나온 의미 있는 결함은 하나같이 실제 인프라와 실제 동시 실행이 끼었을 때만 모습을 드러냈다. 그래서 자동으로 검사하는 "구조를 따르는가" 옆에, 따로 확인하는 "정말 동작하는가"가 늘 같이 있어야 한다.</p></div>
        <h2>이 시험이 재는 것</h2>
        <p>위의 단계는 겉보기엔 에이전트를 시험했지만, 매번 시험대에 오른 건 <em>문서</em>의 서로 다른 면이었다. 루트 문서에 한 번 적어 둔 규칙이 따로 만든 구현체 다섯 곳에서 같은 판단을 끌어내는가. 나아가 이 코드베이스를 처음 보는 엔지니어들에게서도 같은 판단을 끌어내는가. 언어마다 점수가 같게 나온다면, 문서가 그 패턴을 그만큼 정밀하게 전달한다는 뜻이다. 검사 스크립트 자체의 버그나, 코드베이스가 그동안 한 번도 지나가지 않은 구조적 빈틈을 찾아내는 시험은 통과하는 테스트만으로는 할 수 없는 일을 한다. 명세가 앞뒤만 맞는 게 아니라 빠진 데 없이 완전하다는 걸 보여 준다.</p>
        <div className="article-note"><strong>더 볼 자료</strong><p>
          <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/docs/benchmark.md" target="_blank" rel="noreferrer">docs/benchmark.md</a>(같은 백엔드 설계를 5개 언어로 구현해 둔 내 예제 프로젝트의 과제 설명과 결과 표 전체) · <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/docs/harness.md" target="_blank" rel="noreferrer">docs/harness.md</a>(아키텍처 검사가 코드에 점수를 매기는 방식)
        </p></div>
      </>
    ),
  },
};

export default function CanAnAiAgentFollowYourArchitecture() {
  const { locale } = useLocale();
  const c = content[locale];

  return (
    <PostLayout slug="can-an-ai-agent-follow-your-architecture" kicker={c.kicker} title={c.title} lede={c.lede}>
      {c.body}
    </PostLayout>
  );
}
