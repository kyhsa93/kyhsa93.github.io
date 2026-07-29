import PostLayout from '../../components/PostLayout';
import { useLocale } from '../../lib/locale';

const content = {
  en: {
    kicker: 'AI Agents · Benchmark',
    title: (
      <>
        A Perfect Score,<br /><em>A Broken Feature</em>
      </>
    ),
    lede: "Same doc, same task, two models, run at the same time in separate worktrees. Both self-reported a perfect harness score. Only one of them, independently reproduced against real Postgres and LocalStack, actually worked.",
    body: (
      <>
        <p>Every benchmark run described in an earlier post held the model constant and varied the language or the task's difficulty. This run inverted that: same language, same task, same prompt, and the only thing allowed to vary was which model received it — the first time this repo actually ran the "comparing across models" idea it had only speculated about before.</p>
        <h2>The Task</h2>
        <p>A level-4-style domain, <strong>SavingsPocket</strong> — <code>ownerId</code>, <code>accountId</code>, <code>label</code>, <code>ACTIVE</code> on creation. If the linked Account is later suspended, the SavingsPocket must automatically become <code>FROZEN</code>; if closed, <code>CLOSED</code>. The reaction has to happen automatically when the Account's status changes — never through a direct API call on SavingsPocket itself. Both models got exactly the same rule and exactly the same entry point, <code>implementations/nestjs/CLAUDE.md</code>, run simultaneously in separate git worktrees so neither could see the other's work.</p>
        <table>
          <thead><tr><th>Model</th><th>Harness self-report</th><th>Independent re-verification</th><th>E2E self-report</th><th>Independent E2E rerun</th></tr></thead>
          <tbody>
            <tr><td>Sonnet</td><td>A (100/100, raw 895/895)</td><td>895/895 — matches</td><td>"6/6 passed, repeated 3x; full e2e suite 89/89, no regression"</td><td><strong>6/6 passed</strong> — reproduced exactly against real Postgres+LocalStack</td></tr>
            <tr><td>Haiku</td><td>A (100/100, raw 875/875)</td><td>875/875 — matches</td><td>"event registrations are correct and handlers are properly wired"</td><td><strong>3/3 FAILED</strong> — status stayed <code>ACTIVE</code></td></tr>
          </tbody>
        </table>
        <p>Both models produced a perfect harness score. Only one of them actually worked.</p>
        <h2>The Same Pattern, Wired Two Different Ways</h2>
        <p>Sonnet's implementation was independently reproduced end-to-end: suspending or closing a real Account through its real HTTP API actually flips the linked SavingsPocket to <code>FROZEN</code> or <code>CLOSED</code>, through the real Outbox → SQS → OutboxConsumer path. Haiku's implementation wired the identical architectural pattern — Integration Event subscription via <code>EventHandlerRegistry</code>, correctly even supporting the existing 1:N handler contract — and it was completely plausible on inspection. Nothing about the code itself looked wrong.</p>
        <p>Notice also what Haiku's own self-report actually said: <em>"event registrations are correct and handlers are properly wired."</em> That's a true statement about the code's structure, and it is not a claim that the test run passed — Haiku never said that, because the tests never passed. The gap wasn't a model lying about its results; it was a model correctly describing structure while a reader could easily mistake that description for a claim about behavior.</p>
        <div className="article-note"><strong>Why the harness couldn't have caught this</strong><p>The harness checks structure, placement, and wiring — not runtime behavior. Both submissions wired the correct pattern, so both scored close to perfect. Whether the wiring actually does anything when a real event fires is a different question, and it's a question only an independent E2E run against real infrastructure can answer.</p></div>
        <h2>Root Cause</h2>
        <p>Rerunning the E2E test Haiku itself had written showed all three assertions failing — the handler's own log line never even printed, meaning it was never invoked. Haiku's e2e test file didn't override <code>NotificationService</code> with a no-op stub the way every existing e2e test in this repo does (<code>card.e2e-spec.ts</code>, for instance). Instead it tried to make real SES delivery work through a LocalStack email-identity verification call — and that path never completed cleanly enough for the reaction to actually run.</p>
        <p>Whether that specific choice was the exact failure mechanism or a symptom of a broader setup problem in Haiku's test wasn't chased any further, because the decisive finding — the reaction the task asked for measurably doesn't happen — was already independently confirmed. There was nothing more to prove.</p>
        <h2>Not a Docs Bug This Time</h2>
        <p>Several earlier runs in this benchmark series turned up real defects in this repo's own harness or docs — a stale build-artifact blind spot, evaluator files sharing the same false positive. This one is different: it's a mistake inside code Haiku itself wrote, not a gap in the shared harness, docs, or scaffolding. There was nothing to fix in the repo. Neither worktree was merged.</p>
        <div className="article-note"><strong>The point this makes</strong><p>A 100/100 structural score and a broken feature can coexist, and a smaller/faster model is exactly where that gap is most likely to show up — not because it can't follow the architecture (it did), but because getting the pattern structurally right and getting the runtime behavior right are two different achievements, and only one of them is checked by a self-report you didn't independently rerun.</p></div>
        <div className="article-note"><strong>Further reading in the repo</strong><p>
          <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/docs/benchmark.md" target="_blank" rel="noreferrer">docs/benchmark.md</a> — the full run, plus every other benchmark run this series has produced · <a href="/posts/can-an-ai-agent-follow-your-architecture">Can an AI Agent Follow Your Architecture?</a> — the methodology this run reuses
        </p></div>
      </>
    ),
  },
  ko: {
    kicker: 'AI Agents · Benchmark',
    title: (
      <>
        완벽한 점수,<br /><em>작동하지 않는 기능</em>
      </>
    ),
    lede: '같은 문서, 같은 과제, 두 개의 모델을 별도 worktree에서 동시에 돌렸다. 둘 다 완벽한 harness 점수를 자체 보고했다. 실제 Postgres와 LocalStack을 대상으로 독립 재현했을 때, 동작한 쪽은 하나뿐이었다.',
    body: (
      <>
        <p>앞선 글에서 다룬 벤치마크 실행들은 모두 모델을 고정하고 언어나 과제 난이도만 바꿔가며 진행했다. 이번 실행은 그것을 뒤집었다 — 언어도, 과제도, 프롬프트도 동일하게 고정하고 오직 어떤 모델이 그것을 받는지만 바꿨다. 이전까지는 아이디어로만 언급됐던 "모델 간 비교"를 이 저장소가 실제로 처음 실행해본 것이다.</p>
        <h2>과제</h2>
        <p>Level-4 수준의 도메인 <strong>SavingsPocket</strong> — <code>ownerId</code>, <code>accountId</code>, <code>label</code>, 생성 시 <code>ACTIVE</code> 상태. 연결된 Account가 나중에 정지되면 SavingsPocket은 자동으로 <code>FROZEN</code>이 되어야 하고, 해지되면 <code>CLOSED</code>가 되어야 한다. 이 반응은 Account의 상태가 바뀔 때 자동으로 일어나야 하며, SavingsPocket 자체에 대한 직접적인 API 호출을 통해서는 안 된다. 두 모델 모두 정확히 같은 규칙과 정확히 같은 진입점(<code>implementations/nestjs/CLAUDE.md</code>)을 받았고, 서로의 작업을 볼 수 없도록 별도의 git worktree에서 동시에 실행됐다.</p>
        <table>
          <thead><tr><th>모델</th><th>Harness 자체 보고</th><th>독립 재검증</th><th>E2E 자체 보고</th><th>독립 E2E 재실행</th></tr></thead>
          <tbody>
            <tr><td>Sonnet</td><td>A (100/100, raw 895/895)</td><td>895/895 — 일치</td><td>"6/6 통과, 3회 반복; 전체 e2e suite 89/89, 회귀 없음"</td><td><strong>6/6 통과</strong> — 실제 Postgres+LocalStack 대상으로 정확히 재현</td></tr>
            <tr><td>Haiku</td><td>A (100/100, raw 875/875)</td><td>875/875 — 일치</td><td>"이벤트 등록이 올바르고 핸들러가 제대로 연결되어 있다"</td><td><strong>3/3 실패</strong> — 상태가 계속 <code>ACTIVE</code>로 남음</td></tr>
          </tbody>
        </table>
        <p>두 모델 모두 완벽한 harness 점수를 냈다. 실제로 동작한 것은 하나뿐이었다.</p>
        <h2>같은 패턴을, 서로 다르게 연결하다</h2>
        <p>Sonnet의 구현은 end-to-end로 독립 재현됐다: 실제 HTTP API를 통해 실제 Account를 정지하거나 해지하면, 실제 Outbox → SQS → OutboxConsumer 경로를 거쳐 연결된 SavingsPocket이 실제로 <code>FROZEN</code> 또는 <code>CLOSED</code>로 바뀐다. Haiku의 구현도 동일한 아키텍처 패턴 — <code>EventHandlerRegistry</code>를 통한 Integration Event 구독, 심지어 기존의 1:N 핸들러 계약까지 올바르게 지원 — 을 그대로 연결했고, 코드만 보면 완전히 그럴듯했다. 코드 자체에는 눈에 띄게 잘못된 부분이 없었다.</p>
        <p>Haiku의 자체 보고가 실제로 뭐라고 했는지도 눈여겨볼 만하다: <em>"이벤트 등록이 올바르고 핸들러가 제대로 연결되어 있다."</em> 이는 코드의 구조에 대해서는 사실인 진술이며, 테스트가 통과했다는 주장이 아니다 — Haiku는 그렇게 말한 적이 없다. 실제로 테스트는 통과한 적이 없었기 때문이다. 여기서 벌어진 간극은 모델이 결과에 대해 거짓말을 한 것이 아니라, 모델이 구조를 정확히 설명했는데 그 설명을 읽는 사람이 동작에 대한 주장으로 쉽게 오해할 수 있었다는 것이다.</p>
        <div className="article-note"><strong>Harness가 이걸 잡아낼 수 없었던 이유</strong><p>Harness는 구조, 배치, 연결 여부를 검사하지 런타임 동작을 검사하지 않는다. 두 제출물 모두 올바른 패턴을 연결했기 때문에 둘 다 거의 만점을 받았다. 그 연결이 실제 이벤트가 발생했을 때 실제로 무언가를 하는지는 별개의 질문이며, 이는 실제 인프라를 대상으로 한 독립적인 E2E 실행만이 답할 수 있는 질문이다.</p></div>
        <h2>근본 원인</h2>
        <p>Haiku 자신이 작성한 E2E 테스트를 재실행하자 세 개의 assertion이 모두 실패했다 — 핸들러 자신의 로그 라인조차 출력되지 않았고, 이는 핸들러가 아예 호출되지 않았다는 뜻이었다. Haiku의 e2e 테스트 파일은 이 저장소의 기존 모든 e2e 테스트(예를 들어 <code>card.e2e-spec.ts</code>)가 하는 것처럼 <code>NotificationService</code>를 no-op 스텁으로 오버라이드하지 않았다. 대신 LocalStack의 이메일 아이덴티티 검증 호출을 통해 실제 SES 전송이 동작하도록 만들려 했고, 그 경로는 반응이 실제로 일어날 만큼 깔끔하게 끝난 적이 없었다.</p>
        <p>그 구체적인 선택이 정확한 실패 메커니즘이었는지, 아니면 Haiku의 테스트 설정 전반에 걸친 더 넓은 문제의 증상이었는지는 더 깊이 추적하지 않았다. 결정적인 발견 — 과제가 요구한 반응이 측정 가능하게 일어나지 않는다는 것 — 은 이미 독립적으로 확인됐기 때문에, 더 증명할 것이 없었다.</p>
        <h2>이번엔 문서의 버그가 아니다</h2>
        <p>이 벤치마크 시리즈의 앞선 여러 실행에서는 이 저장소 자체의 harness나 문서에 있던 실제 결함이 드러난 적이 있다 — 오래된 빌드 산출물로 인한 사각지대, 동일한 거짓 양성을 공유하는 평가 파일들. 이번 건은 다르다: 이건 Haiku 자신이 작성한 코드 안의 실수이지, 공유된 harness나 문서, scaffolding의 공백이 아니다. 저장소 안에서 고칠 것은 없었다. 두 worktree 모두 병합되지 않았다.</p>
        <div className="article-note"><strong>이 사례가 말하는 것</strong><p>100/100의 구조적 점수와 실제로 작동하지 않는 기능은 얼마든지 공존할 수 있고, 더 작고 빠른 모델일수록 바로 그 간극이 드러나기 쉽다 — 아키텍처를 따르지 못해서가 아니라(실제로 따랐다), 패턴을 구조적으로 올바르게 연결하는 것과 런타임 동작을 올바르게 만드는 것은 서로 다른 성취이고, 독립적으로 재실행해보지 않은 자체 보고는 그중 하나만 확인해주기 때문이다.</p></div>
        <div className="article-note"><strong>저장소 내 추가 자료</strong><p>
          <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/docs/benchmark.md" target="_blank" rel="noreferrer">docs/benchmark.md</a> — 이번 실행 전체와 이 시리즈의 다른 모든 벤치마크 실행 · <a href="/posts/can-an-ai-agent-follow-your-architecture">AI 에이전트는 당신의 아키텍처를 따를 수 있을까?</a> — 이번 실행이 재사용한 방법론
        </p></div>
      </>
    ),
  },
};

export default function APerfectScoreABrokenFeature() {
  const { locale } = useLocale();
  const c = content[locale];

  return (
    <PostLayout slug="a-perfect-score-a-broken-feature" kicker={c.kicker} title={c.title} lede={c.lede}>
      {c.body}
    </PostLayout>
  );
}
