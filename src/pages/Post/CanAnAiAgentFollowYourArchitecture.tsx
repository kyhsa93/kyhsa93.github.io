import PostLayout from '../../components/PostLayout';
import { useLocale } from '../../lib/locale';

const content = {
  en: {
    kicker: 'AI Agents · Benchmark',
    title: (
      <>
        Can an AI Agent<br /><em>Follow Your Architecture?</em>
      </>
    ),
    lede: "Most coding benchmarks ask whether the tests pass. A more useful question for a team actually adopting AI agents is narrower and harder: can it find your documented conventions on its own, and apply them correctly to a requirement it's never seen before?",
    body: (
      <>
        <p>This repo already had an objective scorer sitting around unused for this purpose — the harness, which mechanically scores whether code follows documented architectural rules, with no human review needed. Repurposing it as an AI-agent benchmark turned out to need no new infrastructure at all, just a different way of framing the task.</p>
        <h2>The Task Format Is Deliberately Sparse</h2>
        <p>The prompt given to the agent contains exactly three things, and nothing about how to implement it: the business rules for a domain that doesn't exist in the repo yet; an instruction to follow the repo's existing conventions, plus the minimal entry point of where to start reading — that language's <code>CLAUDE.md</code>, with no other doc path given; and the completion criterion, which is simply to run the harness itself and iterate until it passes. Whether the agent finds the relevant docs on its own, by following the doc index instead of being handed a reading list, is itself part of what's being measured.</p>
        <div className="article-note"><strong>The one rule that makes this trustworthy</strong><p>The scorer must be the person running the benchmark, not the agent. Never just trust an agent's self-reported "confirmed harness 100/100" — independently rerun the harness against its actual worktree. This caught real problems more than once, described below.</p></div>
        <h2>Run One: A Domain Nobody Had Ever Mentioned</h2>
        <p>The first real run gave an agent a Subscription domain — owner and plan name, <code>PENDING</code> on creation, a simple <code>activate()</code> transition, and a <code>cancel(reason)</code> deliberately described only as "other parts may need to react to it," with no further hint about what that meant technically. Nothing pointed the agent at the scaffolding generator or the reference template.</p>
        <p>The agent followed the <code>CLAUDE.md</code> index on its own, discovered the scaffolding generator unprompted, generated a skeleton with it, then interpreted "other parts may need to react" as precisely what it needed to mean in this codebase — a Domain Event plus the Outbox pattern — implementing <code>cancel()</code> to publish an event while leaving <code>activate()</code> as a plain, event-free transition. Independent re-verification matched the self-report exactly: <strong>A (100/100, raw 630/630)</strong>. Reading the actual domain code confirmed the business logic matched the spec too, not just the harness score.</p>
        <h2>Run Two: The Same Task, All Five Languages at Once</h2>
        <p>A Voucher domain — issue, redeem, expire, with the same "other parts may need to react" hint attached only to <code>expire()</code> — ran simultaneously across all five language implementations, each given only its own <code>CLAUDE.md</code> as the entry point.</p>
        <table>
          <thead><tr><th>Language</th><th>Self-report</th><th>Independent re-verification</th></tr></thead>
          <tbody>
            <tr><td>NestJS</td><td>A (100/100, raw 815/815)</td><td>815/815 — matches</td></tr>
            <tr><td>FastAPI</td><td>854 passed, 0 failed</td><td>854/854 — matches</td></tr>
            <tr><td>Go</td><td>652 passed, 0 failed</td><td>652/652 — matches</td></tr>
            <tr><td>Kotlin Spring Boot</td><td>1172 passed, 0 failed</td><td>1172/1172 — matches</td></tr>
            <tr><td>Java Spring Boot</td><td>1404 passed, 0 failed</td><td>mismatched at 1433/1, then unified at 1404/0</td></tr>
          </tbody>
        </table>
        <p>Every language scored perfectly, and — more interesting than the perfect score itself — every one independently chose to attach a Domain Event only to <code>expire()</code>, never to <code>redeem()</code>, applying the same underlying pattern ("a transition nobody reacts to has no event; one something needs to react to does") that a single root doc had described once. One doc, five independent agents, one identical architectural judgment.</p>
        <p>The Java mismatch is the more important result of this run. The independent re-verification disagreed with the self-report, and the cause wasn't the code at all — a stale Gradle build cache directory was being scanned by the harness as if it were real source, producing a false "no layer directory" positive. Deleting the build artifact and re-running matched the self-report exactly. This is precisely the scenario the "never trust the self-report" rule exists for: the discrepancy pointed at a real bug, just not the one anyone expected.</p>
        <h2>Raising the Difficulty, One Notch at a Time</h2>
        <p>A task where every language scores perfectly on the first try has no discriminating power — it can't tell you anything about where an agent (or a doc) might fail. Later runs deliberately added one new decision point each time.</p>
        <p><strong>Level 2</strong> required a Domain Service coordinating two Aggregates within the same BC (a Booking and a Cancellation, where the cancellation is only valid if the original booking is confirmed and the requested count doesn't exceed the original) — with no mention of the one existing precedent for this shape anywhere in the prompt. Every language independently found that precedent and separated the judgment into a stateless Domain Service. Every one even caught a subtle spec distinction on its own: because the task said the invalid request itself must never be created, all five changed the Domain Service to throw immediately rather than return a rejection object to save — a different behavior from the existing precedent, correctly detected as different. NestJS was the first case across any run to not be perfect from the start, scoring 96 before self-correcting a real defect (a raw string thrown instead of the typed enum).</p>
        <p><strong>Level 3</strong> needed a synchronous cross-BC lookup with no vocabulary hint at all — just the plain sentence that another BC's status had to be checked before allowing creation. All five picked the synchronous Adapter/ACL pattern, found the existing precedent, and kept the ACL discipline of never exposing the other BC's status enum directly, translating it into a boolean first. Independent verification caught another harness bug here too: three more evaluator files, beyond the one fixed in the earlier round, shared the exact same stale-build-artifact blind spot.</p>
        <p><strong>Level 4</strong> flipped the axis entirely — an asynchronous reaction to another BC's event, deliberately designed to contrast with level 3's synchronous lookup. Every language correctly chose to subscribe to an Integration Event instead of adding another synchronous call, and every one proved it end-to-end by actually suspending an account through the real API and polling until the reaction happened. This run's most important result wasn't about the agents at all — it exposed that two of the five languages' Outbox consumers could only ever register one handler per event type, silently breaking the moment a second BC tried to subscribe to the same event. That's a real architectural gap the benchmark task found by touching a code path nothing had exercised before, not a contrived edge case.</p>
        <h2>Level 5: Combining Everything at Once</h2>
        <p>The most demanding run combined three previously-separate axes into one task — a recurring transfer that runs automatically on a monthly schedule (the same batch/Task Outbox pattern as interest payments), requires a Domain Service to judge eligibility (the same shape as the earlier Refund precedent), and must isolate one rule's failure from every other rule's processing.</p>
        <p>Only three of five languages passed cleanly on the first submission. The other two had a perfect harness score <em>and</em> perfect unit tests, and still shipped a real bug that only an end-to-end test against real infrastructure caught: one saved a generated reference ID into a database column sized for a shorter format, failing on every retry scenario a full month later; the other's end-to-end test suite hit a FIFO queue's deduplication window across separate test methods within the same run, silently dropping every enqueue after the first and nearly producing a false-positive pass.</p>
        <div className="article-note"><strong>The clearest single finding across every run</strong><p>A perfect structural score and a perfect unit-test run are not proof a feature works. Every meaningful defect these benchmark runs actually surfaced only showed up once real infrastructure and genuinely concurrent execution were involved — which is exactly why "does it actually work," checked independently, has to sit alongside "does it follow the structure," checked automatically.</p></div>
        <h2>What This Is Actually Measuring</h2>
        <p>Every level above tested a different thing about the <em>documentation</em>, disguised as a test of the agent: whether a rule described once in a root doc produces the same judgment across five independent implementations and, by extension, across new engineers who've never seen this codebase before. A benchmark score that's identical across languages says the docs communicate the pattern with real precision. A benchmark run that finds a bug in the harness itself, or a structural gap the codebase never happened to exercise, is doing something a passing test suite alone can't — proving the specification is actually complete, not just self-consistent.</p>
        <div className="article-note"><strong>Further reading in the repo</strong><p>
          <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/docs/benchmark.md" target="_blank" rel="noreferrer">docs/benchmark.md</a> — every run's full task description and results table · <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/docs/harness.md" target="_blank" rel="noreferrer">docs/harness.md</a> — the scorer this benchmark reuses
        </p></div>
      </>
    ),
  },
  ko: {
    kicker: 'AI Agents · Benchmark',
    title: (
      <>
        AI 에이전트는<br /><em>당신의 아키텍처를 따를 수 있을까?</em>
      </>
    ),
    lede: '대부분의 코딩 벤치마크는 테스트가 통과하는지를 묻는다. AI 에이전트를 실제로 도입하려는 팀에게 더 유용한 질문은 더 좁고 더 어렵다: 에이전트가 스스로 문서화된 컨벤션을 찾아내고, 한 번도 본 적 없는 요구사항에 그것을 올바르게 적용할 수 있는가?',
    body: (
      <>
        <p>이 저장소에는 이 용도로 쓰이지 않은 채 방치돼 있던 객관적인 채점기가 이미 있었다 — 바로 Harness다. Harness는 사람의 검토 없이도 코드가 문서화된 아키텍처 규칙을 따르는지 기계적으로 채점한다. 이를 AI 에이전트 벤치마크로 재활용하는 데는 새로운 인프라가 전혀 필요하지 않았고, 그저 과제를 프레이밍하는 방식만 다르게 하면 됐다.</p>
        <h2>과제 형식은 의도적으로 최소화되어 있다</h2>
        <p>에이전트에게 주어지는 프롬프트에는 구현 방법에 대한 언급 없이 딱 세 가지만 담겨 있다. 첫째, 아직 저장소에 존재하지 않는 도메인의 비즈니스 규칙이다. 둘째, 저장소의 기존 컨벤션을 따르라는 지시와 함께, 어디서부터 읽어야 하는지에 대한 최소한의 진입점 — 다른 문서 경로는 전혀 주지 않고 해당 언어의 <code>CLAUDE.md</code>만 제공한다. 셋째, 완료 기준으로, 그저 Harness 자체를 실행해 통과할 때까지 반복하라는 것뿐이다. 읽을 목록을 건네받는 대신 문서 인덱스를 따라가면서 에이전트가 스스로 관련 문서를 찾아내는지 여부 자체가 측정 대상의 일부다.</p>
        <div className="article-note"><strong>이걸 신뢰할 수 있게 만드는 단 하나의 규칙</strong><p>채점자는 반드시 벤치마크를 실행하는 사람이어야지, 에이전트 자신이어서는 안 된다. 에이전트가 스스로 보고한 "Harness 100/100 확인"이라는 말을 그대로 믿어서는 안 된다 — 실제 worktree를 대상으로 Harness를 독립적으로 다시 실행해야 한다. 아래에서 설명하듯, 이 원칙 덕분에 실제 문제를 한 번이 아니라 여러 번 잡아낼 수 있었다.</p></div>
        <h2>1차 실행: 아무도 언급한 적 없는 도메인</h2>
        <p>첫 실전 실행에서는 에이전트에게 Subscription 도메인을 줬다 — owner와 plan 이름, 생성 시 <code>PENDING</code> 상태, 단순한 <code>activate()</code> 전이, 그리고 <code>cancel(reason)</code>. 다만 <code>cancel(reason)</code>에 대해서는 "다른 부분이 여기에 반응해야 할 수도 있다"고만 의도적으로 설명해 놓았을 뿐, 기술적으로 정확히 무슨 뜻인지는 더 이상 아무 힌트도 주지 않았다. scaffolding generator나 reference template을 가리키는 언급은 어디에도 없었다.</p>
        <p>에이전트는 스스로 <code>CLAUDE.md</code> 인덱스를 따라갔고, 별다른 지시 없이 scaffolding generator를 찾아냈으며, 이를 이용해 스켈레톤을 생성한 뒤 "다른 부분이 반응해야 할 수도 있다"는 문구를 이 코드베이스에서 정확히 필요한 의미 — Domain Event와 Outbox 패턴의 조합 — 으로 해석해, <code>cancel()</code>은 이벤트를 발행하도록 구현하고 <code>activate()</code>는 이벤트 없는 단순한 전이로 남겨두었다. 독립 재검증 결과는 자체 보고와 정확히 일치했다: <strong>A (100/100, raw 630/630)</strong>. 실제 도메인 코드를 읽어본 결과 Harness 점수뿐 아니라 비즈니스 로직도 명세와 일치함을 확인했다.</p>
        <h2>2차 실행: 같은 과제를, 다섯 언어에서 동시에</h2>
        <p>issue, redeem, expire로 구성되고 "다른 부분이 반응해야 할 수도 있다"는 동일한 힌트가 <code>expire()</code>에만 붙어 있는 Voucher 도메인을, 각 구현체에게 오직 자신의 <code>CLAUDE.md</code>만 진입점으로 제공한 채 다섯 언어 구현체 모두에서 동시에 실행했다.</p>
        <table>
          <thead><tr><th>언어</th><th>자체 보고</th><th>독립 재검증</th></tr></thead>
          <tbody>
            <tr><td>NestJS</td><td>A (100/100, raw 815/815)</td><td>815/815 — 일치</td></tr>
            <tr><td>FastAPI</td><td>854개 통과, 0개 실패</td><td>854/854 — 일치</td></tr>
            <tr><td>Go</td><td>652개 통과, 0개 실패</td><td>652/652 — 일치</td></tr>
            <tr><td>Kotlin Spring Boot</td><td>1172개 통과, 0개 실패</td><td>1172/1172 — 일치</td></tr>
            <tr><td>Java Spring Boot</td><td>1404개 통과, 0개 실패</td><td>1433/1로 불일치했다가, 1404/0으로 일치</td></tr>
          </tbody>
        </table>
        <p>모든 언어가 완벽한 점수를 받았다. 점수 자체보다 더 흥미로운 것은, 모든 구현체가 독립적으로 Domain Event를 오직 <code>expire()</code>에만 붙이고 <code>redeem()</code>에는 붙이지 않기로 선택했다는 점이다. 이는 루트 문서 하나가 단 한 번 설명해 놓은 것과 동일한 근본 패턴("아무도 반응하지 않는 전이에는 이벤트가 없고, 무언가가 반응해야 하는 전이에는 이벤트가 있다")을 그대로 적용한 것이다. 문서 하나, 독립된 에이전트 다섯, 동일한 아키텍처 판단 하나.</p>
        <p>이번 실행에서 더 중요한 결과는 Java의 불일치다. 독립 재검증이 자체 보고와 어긋났는데, 원인은 코드가 아니었다 — Harness가 오래된 Gradle 빌드 캐시 디렉터리를 마치 실제 소스인 것처럼 스캔하면서 거짓 "레이어 디렉터리 없음" positive를 만들어냈다. 빌드 산출물을 삭제하고 다시 실행하자 자체 보고와 정확히 일치했다. 이는 "자체 보고를 절대 그대로 믿지 말라"는 규칙이 존재하는 정확한 이유를 보여주는 사례다: 불일치는 실제 버그를 가리키고 있었지만, 아무도 예상하지 못한 버그였을 뿐이다.</p>
        <h2>난이도를 한 단계씩 끌어올리기</h2>
        <p>모든 언어가 첫 시도에서 완벽한 점수를 받는 과제는 변별력이 없다 — 에이전트(혹은 문서)가 어디서 실패할 수 있는지에 대해 아무것도 말해주지 않는다. 이후의 실행들은 매번 의도적으로 새로운 판단 지점을 하나씩 추가했다.</p>
        <p><strong>Level 2</strong>는 같은 BC 안에서 두 개의 Aggregate를 조율하는 Domain Service를 요구했다(Booking과 Cancellation, 취소는 원래 예약이 confirmed 상태이고 요청 수량이 원래 수량을 넘지 않을 때만 유효하다) — 이런 형태의 기존 선례가 하나 있다는 언급은 프롬프트 어디에도 없었다. 모든 언어가 독립적으로 그 선례를 찾아냈고, 판단 로직을 상태 없는(stateless) Domain Service로 분리했다. 심지어 모두가 스스로 미묘한 명세 차이까지 포착해냈다: 과제에서 유효하지 않은 요청 자체가 아예 생성되어서는 안 된다고 했기 때문에, 다섯 언어 모두 저장할 거부 객체를 반환하는 대신 Domain Service가 즉시 예외를 던지도록 바꿨다 — 기존 선례와는 다른 동작이었고, 다르다는 것을 정확히 감지해낸 것이다. NestJS는 이번 벤치마크 전체를 통틀어 처음부터 완벽하지 않았던 첫 사례로, 96점을 받은 뒤 실제 결함(타입이 지정된 enum 대신 raw 문자열을 던진 것)을 스스로 고쳤다.</p>
        <p><strong>Level 3</strong>은 용어에 대한 힌트가 전혀 없는 동기식 cross-BC 조회를 요구했다 — 생성 전에 다른 BC의 상태를 확인해야 한다는 평범한 문장 하나뿐이었다. 다섯 언어 모두 동기식 Adapter/ACL 패턴을 선택했고, 기존 선례를 찾아냈으며, 다른 BC의 상태 enum을 절대 직접 노출하지 않고 먼저 boolean으로 변환하는 ACL의 원칙을 그대로 지켰다. 독립 검증은 여기서도 또 다른 Harness 버그를 잡아냈다: 앞선 라운드에서 고친 것 외에 세 개의 평가 파일이 정확히 똑같은 stale-build-artifact 사각지대를 공유하고 있었다.</p>
        <p><strong>Level 4</strong>는 축을 완전히 뒤집었다 — 다른 BC의 이벤트에 대한 비동기 반응으로, Level 3의 동기식 조회와 의도적으로 대비되도록 설계했다. 모든 언어가 또 다른 동기식 호출을 추가하는 대신 정확히 Integration Event를 구독하기로 선택했고, 실제 API를 통해 계정을 정지시킨 뒤 반응이 일어날 때까지 폴링하는 방식으로 end-to-end로 이를 증명해냈다. 이번 실행에서 가장 중요한 결과는 에이전트에 관한 것이 아니었다 — 다섯 언어 중 두 언어의 Outbox consumer가 이벤트 타입당 핸들러를 단 하나만 등록할 수 있었고, 두 번째 BC가 같은 이벤트를 구독하려는 순간 조용히 깨진다는 사실이 드러났다. 이는 벤치마크 과제가 그동안 아무도 건드린 적 없던 코드 경로를 실제로 건드림으로써 찾아낸 진짜 아키텍처 결함이지, 억지로 만든 엣지 케이스가 아니다.</p>
        <h2>Level 5: 모든 것을 한꺼번에 결합하기</h2>
        <p>가장 까다로운 실행은 그동안 별개였던 세 축을 하나의 과제로 결합했다 — 매달 자동으로 실행되는 정기 송금(이자 지급과 동일한 batch/Task Outbox 패턴), 자격 여부를 판단하는 Domain Service가 필요하다는 요구(앞서의 Refund 선례와 같은 형태), 그리고 한 규칙의 실패를 다른 모든 규칙의 처리로부터 격리해야 한다는 요구.</p>
        <p>다섯 언어 중 세 곳만 첫 제출에서 깔끔하게 통과했다. 나머지 두 곳은 완벽한 Harness 점수<em>와</em> 완벽한 unit test를 모두 갖추고도, 실제 인프라를 대상으로 한 end-to-end 테스트에서만 잡을 수 있는 진짜 버그를 그대로 내보냈다: 한 언어는 생성된 참조 ID를 더 짧은 형식용으로 크기가 잡힌 데이터베이스 컬럼에 저장해, 정확히 한 달 뒤의 모든 재시도 시나리오에서 실패했다; 다른 언어는 end-to-end 테스트 스위트가 같은 실행 안의 서로 다른 테스트 메서드들에 걸쳐 FIFO 큐의 중복 제거(deduplication) 윈도우에 걸려, 첫 번째 이후의 모든 enqueue를 조용히 누락시키면서 거짓 양성(false positive) 통과를 만들어낼 뻔했다.</p>
        <div className="article-note"><strong>모든 실행을 통틀어 가장 명확한 하나의 발견</strong><p>완벽한 구조적 점수와 완벽한 unit test 실행은 기능이 실제로 동작한다는 증거가 아니다. 이번 벤치마크 실행들이 실제로 드러낸 의미 있는 결함은 하나같이 진짜 인프라와 진짜 동시성 실행이 관여했을 때만 모습을 드러냈다 — 자동으로 검사하는 "구조를 따르는가"와 나란히, 독립적으로 검사하는 "실제로 동작하는가"가 반드시 함께 있어야 하는 이유가 바로 여기에 있다.</p></div>
        <h2>이것이 실제로 측정하는 것</h2>
        <p>위의 각 레벨은 겉으로는 에이전트를 테스트하는 것처럼 보이지만, 실제로는 매번 <em>문서</em>의 서로 다른 측면을 시험하고 있었다: 루트 문서에 단 한 번 서술된 규칙이 다섯 개의 독립된 구현체 전반에서, 나아가 이 코드베이스를 한 번도 본 적 없는 새로운 엔지니어들 전반에서 동일한 판단을 만들어내는가. 언어 전반에서 동일한 벤치마크 점수가 나온다는 것은 문서가 그 패턴을 정말로 정밀하게 전달하고 있다는 뜻이다. Harness 자체의 버그나, 코드베이스가 그동안 우연히 한 번도 건드리지 않았던 구조적 공백을 찾아내는 벤치마크 실행은, 통과하는 test suite 하나만으로는 할 수 없는 일을 해내는 것이다 — 명세가 그저 자기 일관적일 뿐 아니라 실제로 완전하다는 것을 증명하는 일 말이다.</p>
        <div className="article-note"><strong>저장소 내 추가 자료</strong><p>
          <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/docs/benchmark.md" target="_blank" rel="noreferrer">docs/benchmark.md</a> — 모든 실행의 전체 과제 설명과 결과 표 · <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/docs/harness.md" target="_blank" rel="noreferrer">docs/harness.md</a> — 이 벤치마크가 재사용하는 채점기
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
