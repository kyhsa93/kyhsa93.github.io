import PostLayout from '../../components/PostLayout';
import { useLocale, localeFromPathname } from '../../lib/locale';
import type { MetaFunction } from 'react-router';
import { createPostMeta } from '../../lib/seo';

export const meta: MetaFunction = ({ location }) =>
  createPostMeta('a-perfect-score-a-broken-feature', localeFromPathname(location.pathname));

const content = {
  en: {
    kicker: 'AI Agents · Benchmark',
    title: (
      <>
        A Perfect Score,<br /><em>A Broken Feature</em>
      </>
    ),
    lede: "Same doc, same task, two models, run at the same time in separate worktrees. Both self-reported a perfect score from the automated architecture checker. Only one of them, independently reproduced against real Postgres and LocalStack, worked.",
    body: (
      <>
        <p>When an AI agent reports that its work passes every check, what has actually been verified? I gave two models the same task, the same instructions, and the same automated architecture checker, in separate copies of the code so neither could see the other's work. Both reported a perfect score. Only one of them produced a feature that worked. The language, the task, and the prompt were all held fixed; the only thing allowed to vary was which model received it. It was the first time I compared models this way instead of only speculating about it.</p>
        <h2>The Same Task, Only the Model Changed</h2>
        <p>The task was a domain that has to react asynchronously to another domain's event: <strong>SavingsPocket</strong>, with <code>ownerId</code>, <code>accountId</code>, <code>label</code>, and <code>ACTIVE</code> on creation. If the linked Account is later suspended, the SavingsPocket must automatically become <code>FROZEN</code>; if closed, <code>CLOSED</code>. The reaction has to happen automatically when the Account's status changes, never through a direct API call on SavingsPocket itself. The code was the NestJS implementation of my example project, which implements the same backend design in five languages. Both models got the same rule and the same entry point, <code>implementations/nestjs/CLAUDE.md</code>, run simultaneously in separate git worktrees so neither could see the other's work.</p>
        <table>
          <thead><tr><th>Model</th><th>Checker self-report</th><th>Independent re-verification</th><th>E2E self-report</th><th>Independent E2E rerun</th></tr></thead>
          <tbody>
            <tr><td>Sonnet</td><td>A (100/100, raw 895/895)</td><td>895/895, matches</td><td>"6/6 passed, repeated 3x; full e2e suite 89/89, no regression"</td><td><strong>6/6 passed</strong>, reproduced against real Postgres+LocalStack</td></tr>
            <tr><td>Haiku</td><td>A (100/100, raw 875/875)</td><td>875/875, matches</td><td>"event registrations are correct and handlers are properly wired"</td><td><strong>3/3 FAILED</strong>, status stayed <code>ACTIVE</code></td></tr>
          </tbody>
        </table>
        <p>Both models produced a perfect checker score. Only one of them worked.</p>
        <h2>A True Report About the Wrong Thing</h2>
        <p>Sonnet's implementation was independently reproduced end-to-end: suspending or closing a real Account through its real HTTP API flips the linked SavingsPocket to <code>FROZEN</code> or <code>CLOSED</code>, through the real Outbox → SQS → OutboxConsumer path. Haiku's implementation wired the identical architectural pattern (Integration Event subscription via <code>EventHandlerRegistry</code>, correctly even supporting the existing 1:N handler contract), and it was completely plausible on inspection. Nothing about the code itself looked wrong.</p>
        <p>Notice also what Haiku's own self-report said: <em>"event registrations are correct and handlers are properly wired."</em> That's a true statement about the code's structure, and it is not a claim that the test run passed. Haiku never said that, because the tests never passed. The gap wasn't a model lying about its results; it was a model correctly describing structure while a reader could easily mistake that description for a claim about behavior.</p>
        <div className="article-note"><strong>Why the checker couldn't have caught this</strong><p>The checker reads structure, placement, and wiring, not runtime behavior. Both submissions wired the correct pattern, so both scored close to perfect. Whether the wiring does anything when a real event fires is a different question, and it's a question only an independent E2E run against real infrastructure can answer.</p></div>
        <h2>Why the Reaction Never Ran</h2>
        <p>Rerunning the E2E test Haiku itself had written showed all three assertions failing. The handler's own log line never even printed, meaning it was never invoked. Haiku's e2e test file didn't override <code>NotificationService</code> with a no-op stub the way every existing e2e test in the project does (<code>card.e2e-spec.ts</code>, for instance). Instead it tried to make real SES delivery work through a LocalStack email-identity verification call, and that path never completed cleanly enough for the reaction to run.</p>
        <p>Whether that specific choice was the exact failure mechanism or a symptom of a broader setup problem in Haiku's test wasn't chased any further, because the decisive finding — the reaction the task asked for measurably doesn't happen — was already independently confirmed. There was nothing more to prove.</p>
        <h2>Not a Gap in the Checker or the Docs</h2>
        <p>Earlier tests of this kind, which held the model fixed and varied the language or the difficulty, had turned up real defects in the checker or the docs themselves, such as a stale build-artifact blind spot, or evaluator files sharing the same false positive. This one is different: it's a mistake inside code Haiku itself wrote, not a gap in the shared checker, docs, or scaffolding. There was nothing to fix in the shared code. Neither worktree was merged.</p>
        <div className="article-note"><strong>The point this makes</strong><p>A 100/100 structural score and a broken feature can coexist, and a smaller/faster model is where that gap is most likely to show up. Not because it can't follow the architecture (it did), but because getting the pattern structurally right and getting the runtime behavior right are two different achievements, and only one of them is checked by a self-report you didn't independently rerun.</p></div>
        <div className="article-note"><strong>Further reading</strong><p>
          <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/docs/benchmark.md" target="_blank" rel="noreferrer">docs/benchmark.md</a> (this test in full, with the other tasks given to agents in the same example project) · <a href="/posts/can-an-ai-agent-follow-your-architecture">Can an AI Agent Follow Your Architecture?</a> (how the task format and the independent rerun were designed)
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
    lede: '같은 문서와 같은 과제를 두 모델에게 주고, worktree를 따로 만들어 동시에 돌렸다. 둘 다 자동 아키텍처 검사에서 만점을 받았다고 스스로 보고했다. 실제 Postgres와 LocalStack 위에서 따로 재현해 보니, 제대로 동작한 쪽은 하나뿐이었다.',
    body: (
      <>
        <p>AI 에이전트가 "검사를 모두 통과했다"고 보고하면, 실제로 확인된 건 무엇일까. 두 모델에게 같은 과제와 같은 지시, 같은 자동 아키텍처 검사를 주고, 서로의 작업을 볼 수 없게 코드 사본을 따로 만들어 돌렸다. 둘 다 만점이라고 보고했다. 제대로 동작하는 기능을 만든 건 하나뿐이었다.</p>
        <p>언어와 과제, 프롬프트는 모두 고정하고 받는 모델만 바꿨다. 그동안 말로만 하던 모델끼리 비교를 처음으로 직접 돌려 본 셈이다.</p>
        <h2>같은 과제, 모델만 다르게</h2>
        <p>과제는 다른 도메인의 이벤트에 비동기로 반응해야 하는 도메인 <strong>SavingsPocket</strong>이다. 필드는 <code>ownerId</code>, <code>accountId</code>, <code>label</code>이고, 만들면 <code>ACTIVE</code> 상태로 시작한다. 연결된 Account가 나중에 정지되면 SavingsPocket은 <code>FROZEN</code>이 되고, 해지되면 <code>CLOSED</code>가 돼야 한다. 이 변화는 Account 상태가 바뀔 때 저절로 일어나야 한다. SavingsPocket의 API를 직접 불러서 바꾸면 안 된다.</p>
        <p>코드는 같은 백엔드 설계를 5개 언어로 구현해 둔 내 예제 프로젝트의 NestJS 구현이었다. 두 모델은 똑같은 규칙과 똑같은 진입점 <code>implementations/nestjs/CLAUDE.md</code>를 받았다. 서로의 작업을 볼 수 없게 git worktree를 따로 만들어 동시에 돌렸다.</p>
        <table>
          <thead><tr><th>모델</th><th>검사 자체 보고</th><th>독립 재검증</th><th>E2E 자체 보고</th><th>독립 E2E 재실행</th></tr></thead>
          <tbody>
            <tr><td>Sonnet</td><td>A (100/100, raw 895/895)</td><td>895/895, 일치</td><td>"6/6 통과, 3회 반복; 전체 e2e suite 89/89, 회귀 없음"</td><td><strong>6/6 통과</strong>(실제 Postgres+LocalStack에서 그대로 재현)</td></tr>
            <tr><td>Haiku</td><td>A (100/100, raw 875/875)</td><td>875/875, 일치</td><td>"이벤트 등록이 올바르고 핸들러가 제대로 연결돼 있다"</td><td><strong>3/3 실패</strong>(상태가 <code>ACTIVE</code>에서 바뀌지 않음)</td></tr>
          </tbody>
        </table>
        <p>두 모델 모두 검사 점수는 만점이었다. 제대로 동작한 건 하나뿐이었다.</p>
        <h2>맞는 보고, 다른 대상</h2>
        <p>Sonnet의 구현은 end-to-end로 따로 재현해 봤다. 실제 Account를 HTTP API로 정지하거나 해지하면 Outbox → SQS → OutboxConsumer 경로를 거쳐, 연결된 SavingsPocket이 <code>FROZEN</code>이나 <code>CLOSED</code>로 바뀌었다.</p>
        <p>Haiku도 같은 아키텍처 패턴을 연결했다. <code>EventHandlerRegistry</code>로 Integration Event를 구독했고, 기존 1:N 핸들러 계약까지 제대로 지원했다. 코드를 읽어 봐서는 충분히 그럴듯했다. 잘못된 곳이 눈에 띄지 않았다.</p>
        <p>Haiku가 스스로 보고한 문장도 다시 읽어 볼 만하다. <em>"이벤트 등록이 올바르고 핸들러가 제대로 연결돼 있다."</em> 코드 구조에 대해서는 맞는 말이다. 하지만 테스트가 통과했다는 말은 아니다. Haiku는 그런 말을 한 적이 없다. 테스트가 한 번도 통과하지 않았으니까. 모델이 결과를 속인 게 아니었다. 구조를 맞게 설명했을 뿐인데, 읽는 사람이 그 설명을 동작에 대한 말로 오해하기 쉬웠다.</p>
        <div className="article-note"><strong>검사가 이걸 잡을 수 없었던 이유</strong><p>아키텍처 검사는 구조와 배치, 연결 여부를 본다. 런타임 동작은 보지 않는다. 두 제출물 모두 맞는 패턴을 연결했으니 둘 다 만점 가까이 받았다. 실제 이벤트가 발생했을 때 그 연결이 무슨 일을 하는지는 다른 문제다. 그건 실제 인프라에 대고 따로 돌린 E2E만 답할 수 있다.</p></div>
        <h2>반응이 일어나지 않은 이유</h2>
        <p>Haiku가 직접 쓴 E2E 테스트를 다시 돌리자 assertion 3개가 모두 실패했다. 핸들러가 찍어야 할 로그 한 줄도 나오지 않았다. 핸들러가 아예 불리지 않았다는 뜻이다.</p>
        <p>그 프로젝트의 기존 e2e 테스트는 모두 <code>NotificationService</code>를 no-op 스텁으로 갈아 끼운다(<code>card.e2e-spec.ts</code>가 그 예다). Haiku의 테스트는 그러지 않았다. 대신 LocalStack에 이메일 아이덴티티 검증을 요청해서 SES 발송이 진짜로 되게 하려 했다. 그 경로가 끝내 깔끔하게 끝나지 않았고, 상태를 바꾸는 반응까지 가지 못했다.</p>
        <p>이 선택이 실패의 직접 원인이었는지, Haiku의 테스트 설정 전체에 걸친 더 큰 문제의 한 증상이었는지는 더 파지 않았다. 과제가 요구한 반응이 일어나지 않는다는 결정적인 사실을 이미 따로 확인했기 때문이다. 더 증명할 게 없었다.</p>
        <h2>검사나 문서의 빈틈은 아니었다</h2>
        <p>모델을 고정하고 언어나 난이도를 바꿔 가며 돌린 그 전의 같은 종류 시험에서는 검사 스크립트나 문서 자체에서 결함이 나온 적이 있다. 오래된 빌드 산출물 때문에 생긴 사각지대도 있었고, 같은 거짓 양성을 공유하는 평가 파일들도 있었다. 이번 건은 다르다. Haiku가 직접 쓴 코드 안의 실수였고, 함께 쓰는 검사나 문서, 스캐폴딩에는 빈틈이 없었다. 공용 코드에서 고칠 건 없었고, 두 worktree 모두 머지하지 않았다.</p>
        <div className="article-note"><strong>이 사례가 말하는 것</strong><p>구조 점수 100/100과 동작하지 않는 기능은 얼마든지 함께 있을 수 있다. 그 간극은 더 작고 빠른 모델에서 드러나기 쉽다. 아키텍처를 못 따라서 생기는 일은 아니다(따르기는 했다). 패턴을 구조대로 맞게 연결하는 것과 런타임 동작을 맞게 만드는 건 서로 다른 일이다. 그리고 따로 다시 돌려 보지 않은 자체 보고로는 그중 앞의 것만 확인할 수 있다.</p></div>
        <div className="article-note"><strong>더 볼 자료</strong><p>
          <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/docs/benchmark.md" target="_blank" rel="noreferrer">docs/benchmark.md</a>(같은 예제 프로젝트에서 에이전트에게 준 이 과제와 다른 과제들의 전체 기록) · <a href="/posts/can-an-ai-agent-follow-your-architecture">AI 에이전트는 정해 둔 아키텍처를 따를 수 있을까?</a>(과제 형식과 따로 다시 돌리는 채점을 어떻게 설계했는지)
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
