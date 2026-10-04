import PostLayout from '../../components/PostLayout';
import { useLocale, localeFromPathname } from '../../lib/locale';
import type { MetaFunction } from 'react-router';
import { createPostMeta } from '../../lib/seo';

export const meta: MetaFunction = ({ location }) =>
  createPostMeta('the-fraud-signal-that-trusted-the-fraudster', localeFromPathname(location.pathname));

const content = {
  en: {
    kicker: 'Security · LLM',
    title: (
      <>
        The Fraud Signal<br /><em>That Trusted the Fraudster</em>
      </>
    ),
    lede: "A fraud check can't be built from input the suspect writes. A refund classifier read the free-text reason and returned a fraud-risk score. It never accounted for the one fact that mattered: the person supplying that text was the very person the score was supposed to catch.",
    body: (
      <>
        <p>Before a signal goes into a security- or money-relevant judgment, ask who controls its input. In my example project that implements the same backend design in five languages side by side, a refund decision had two fraud signals feeding it: <code>RefundReasonClassifier</code>, an LLM reading the reason the requester typed, and <code>RefundFraudRiskScorer</code>, a model scoring the requester's history. Both were cleanly layered Technical Services, and both worked, right up until a design review turned up a channel problem that no amount of clean layering could paper over. Both are gone now. This is what was wrong, what got cut, and the one rule the removal was for.</p>
        <h2>What It Did</h2>
        <p><code>RefundReasonClassifier</code> was a Technical Service: an Application-layer interface, with the implementation (a self-hosted Ollama model, <code>qwen2.5:1.5b</code>) living in Infrastructure. It read a refund's free-text <code>reason</code> and returned a category plus a fraud-risk score from 0 to 1. That score fed <code>RefundEligibilityService</code>, a Domain Service, which rejected the refund outright once the score crossed a threshold:</p>
        <pre><code>{`// domain/refund-eligibility-service.ts — the branch that got removed
if (classification.category === 'fraud_suspected'
    && classification.fraudRiskScore >= 0.7) {
  return {
    approved: false,
    reason: 'This refund reason was flagged as high '
      + 'fraud risk and requires manual review.'
  }
}`}</code></pre>
        <p>On paper, this is a textbook Technical Service: an LLM call abstracted behind an interface, feeding a plain judgment into a Domain Service that never knew an LLM was involved, tested with a mocked classifier and no network call. Everything about the layering was accurate. The layering was never the problem.</p>
        <h2>The Channel Problem</h2>
        <p>The <code>reason</code> field is only what the person requesting the refund typed. If someone intends to defraud the system, they control the one input the fraud judgment depends on. Nothing stops them from writing "the item arrived damaged" instead of the truth. The classifier has no way to tell the difference, because there is no difference visible to it. It's the equivalent of verifying a sworn statement by re-reading the statement.</p>
        <p>A judgment meant to catch bad-faith actors was built entirely out of a channel bad-faith actors fully control. The one case it was designed to catch is the one case guaranteed to sail through it.</p>
        <div className="article-note"><strong>Why this passed review the first time</strong><p>Every individual piece was correct: the Technical Service boundary was clean, the fallback-on-failure logic was sound, the threshold was tuned against a live model (an earlier 0.5B-parameter model was rejected specifically because it misread a plain billing complaint as fraud). The flaw wasn't in any one file. It was in <em>what kind of input</em> a security-relevant judgment was allowed to depend on, and that question doesn't get answered by careful layering alone.</p></div>
        <h2>The Cut, and How Far It Went</h2>
        <p>The fix was to remove <code>RefundReasonClassifier</code> outright, across all five language implementations. A second signal sat right next to it, <code>RefundFraudRiskScorer</code>, an ML model scoring the requester's own refund/payment <em>history</em> (frequency, amount ratio, time since payment). That input isn't something a requester can rewrite on a whim, so it doesn't share the flaw above. It stayed, at first.</p>
        <p>Then the decision changed partway through: cut that one too, as a separate simplification call rather than because it shared the flaw. Five languages, two removals each, each one independently re-verified (build, lint, unit tests, e2e tests, the architecture checker, a docs-drift checker over the whole project) rather than assumed correct by analogy to the others. A fix that's obviously right in one codebase still has to prove itself again in every other implementation carrying the same logic.</p>
        <p>What's left of <code>RefundEligibilityService</code> is two structural checks and nothing else:</p>
        <pre><code>{`// domain/refund-eligibility-service.ts — everything that's left,
// no fraud judgment of any kind
public evaluate(payment: Payment, refund: Refund): RefundDecision {
  if (payment.status !== PaymentStatus.COMPLETED) {
    return { approved: false, reason: '...only be requested for a completed payment.' }
  }
  if (refund.amount > payment.amount) {
    return { approved: false, reason: '...cannot exceed the payment amount.' }
  }
  return { approved: true }
}`}</code></pre>
        <p>The shared Python microservice the ML scorer's HTTP variant called was deleted last, once nothing referenced it anymore. No orphaned service was left running for its own sake.</p>
        <h2>The Principle</h2>
        <p>Removing a feature is only useful if it leaves behind a rule that outlives it:</p>
        <blockquote><p>An LLM may narrow what an authorized user sees. It must never decide who is authorized — or approve/reject a security- or money-relevant action — when its input is free text the affected party can shape.</p></blockquote>
        <p>Narrow versus decide is the whole distinction. An LLM filtering a list, summarizing a document, or ranking search results produces a worse answer when it's wrong. An LLM approving a refund, granting access, or flagging fraud produces a wrong <em>outcome</em> when it's wrong. And if the party who benefits from that wrong outcome is also the one who supplied the input, "wrong" becomes "exploitable."</p>
        <div className="article-note"><strong>Further reading</strong><p>
          <a href="/posts/narrow-what-never-who">Narrow What, Never Who</a> (an LLM feature built on this principle, and how it ported across all five languages) · <a href="/posts/llm-technical-service">Wiring an LLM Into a Domain Service</a> (how the classifier was layered while it existed) · <a href="/posts/refund-fraud-risk-scorer">An ML Score With Nothing to Train On</a> (the history-based scorer that was removed alongside it) · <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/docs/architecture/domain-service.md" target="_blank" rel="noreferrer">docs/architecture/domain-service.md</a> (where this principle is written down in my example project that implements the same backend design in five languages)
        </p></div>
      </>
    ),
  },
  ko: {
    kicker: 'Security · LLM',
    title: (
      <>
        사기꾼을 그대로 믿은<br /><em>사기 탐지 신호</em>
      </>
    ),
    lede: '의심받는 사람이 직접 써 넣는 값으로는 사기를 잡을 수 없다. 환불 사유 분류기는 고객이 자유롭게 적은 사유를 읽고 사기 위험 점수를 매겼다. 그런데 가장 중요한 사실 하나를 놓쳤다. 그 사유를 적은 사람이 바로 이 점수로 잡아내려던 사람이라는 점이다.',
    body: (
      <>
        <p>보안이나 돈이 걸린 판단에 신호를 넣기 전에, 그 신호의 입력을 누가 쥐고 있는지부터 물어야 한다. 같은 백엔드 설계를 5개 언어로 나란히 구현해 둔 내 예제 프로젝트에서, 환불 판정에는 사기 신호가 둘 들어가 있었다. 요청자가 적은 사유를 LLM이 읽는 <code>RefundReasonClassifier</code>와, 요청자의 이력으로 점수를 매기는 모델 <code>RefundFraudRiskScorer</code>다. 둘 다 레이어를 깔끔하게 나눈 Technical Service였고 잘 돌았다. 그러다 설계 리뷰에서 채널 문제가 나왔고, 레이어를 아무리 깔끔하게 나눠도 덮을 수 없는 문제였다. 지금은 둘 다 없다. 이 글에서는 무엇이 잘못이었는지, 무엇을 걷어 냈는지, 그리고 걷어 내면서 남긴 규칙 하나를 적는다.</p>
        <h2>무엇을 했나</h2>
        <p><code>RefundReasonClassifier</code>는 Technical Service였다. 인터페이스는 Application 계층에 두고, 구현체는 Infrastructure에 두었다. 구현체는 직접 띄운 Ollama 모델(<code>qwen2.5:1.5b</code>)을 불렀다. 환불 요청의 자유 텍스트 <code>reason</code>을 읽어서 카테고리 하나와 0~1 사이의 사기 위험 점수를 돌려줬다. 이 점수는 Domain Service인 <code>RefundEligibilityService</code>로 넘어갔고, 임계값을 넘으면 환불을 바로 거절했다.</p>
        <pre><code>{`// domain/refund-eligibility-service.ts — 제거된 분기
if (classification.category === 'fraud_suspected'
    && classification.fraudRiskScore >= 0.7) {
  return {
    approved: false,
    reason: 'This refund reason was flagged as high '
      + 'fraud risk and requires manual review.'
  }
}`}</code></pre>
        <p>설계만 보면 교과서 같은 Technical Service다. LLM 호출은 인터페이스 뒤에 숨어 있고, Domain Service는 LLM이 끼어 있는 줄도 모르고 판단 결과만 받는다. 테스트는 classifier를 모킹해서 네트워크 없이 돈다. 레이어 구성은 모두 맞았다. 문제는 다른 데 있었다.</p>
        <h2>채널 문제</h2>
        <p><code>reason</code> 필드에 들어가는 건 환불을 요청한 사람이 직접 친 글자뿐이다. 그 사람이 시스템을 속일 생각이라면, 사기 판단이 기대는 유일한 입력을 자기가 쥐고 있는 셈이다. 사실대로 쓰는 대신 "상품이 파손된 채로 도착했어요"라고 적어도 막을 방법이 없다. classifier가 보기에는 두 글이 다를 게 없으니 가려낼 수도 없다. 진술서가 참인지 확인한다면서 그 진술서를 한 번 더 읽는 것과 같다.</p>
        <p>나쁜 마음을 먹은 사용자를 잡으려고 만든 판단인데, 입력은 그 사용자가 마음대로 쓸 수 있는 채널 하나뿐이었다. 잡아내려던 경우가 오히려 반드시 통과하는 경우가 됐다.</p>
        <div className="article-note"><strong>처음 리뷰는 왜 통과했나</strong><p>코드 조각 하나하나는 다 맞았다. Technical Service 경계는 깔끔했고, 실패했을 때의 폴백 로직도 탄탄했다. 임계값도 돌아가는 모델로 직접 맞췄다. 그보다 작은 0.5B 모델은 평범한 결제 불만을 사기로 잘못 읽어서 떨어뜨린 적도 있다. 결함은 특정 파일에 있지 않았다. 보안에 걸린 판단이 <em>어떤 종류의 입력</em>에 기대도 되느냐는 질문에 있었다. 레이어를 잘 나눈다고 이 질문에 답이 나오지는 않는다.</p></div>
        <h2>어디까지 걷어 냈나</h2>
        <p>해결은 <code>RefundReasonClassifier</code>를 통째로 지우는 것이었다. 5개 언어 구현 모두에서 지웠다. 바로 옆에는 두 번째 신호인 <code>RefundFraudRiskScorer</code>가 있었다. 요청자 본인의 환불·결제 <em>이력</em>(빈도, 금액 비율, 결제 뒤 지난 시간)으로 점수를 매기는 ML 모델이다. 이력은 요청자가 마음대로 고쳐 쓸 수 있는 값이 아니니 위의 결함과는 상관이 없다. 그래서 처음에는 남겨 두었다.</p>
        <p>그런데 작업 중에 결정이 바뀌었다. 그것도 지우기로 했다. 같은 결함이 있어서는 아니고, 단순하게 가자는 별개의 결정이었다. 5개 언어에서 2개씩 지웠고, 언어마다 따로 다시 검증했다. 다른 언어에서 됐으니 여기도 되겠지 하고 넘기지 않았다. 빌드, 린트, 유닛 테스트, e2e 테스트, 아키텍처 검사, 프로젝트 전체 docs-drift 검사를 매번 돌렸다. 한 코드베이스에서 뻔히 맞는 수정도, 같은 로직을 가진 다른 구현에서는 다시 맞다는 걸 보여야 한다.</p>
        <p><code>RefundEligibilityService</code>에는 구조 검사 두 가지만 남았다.</p>
        <pre><code>{`// domain/refund-eligibility-service.ts — 남은 전부,
// 사기 판단은 이제 없다
public evaluate(payment: Payment, refund: Refund): RefundDecision {
  if (payment.status !== PaymentStatus.COMPLETED) {
    return { approved: false, reason: '...only be requested for a completed payment.' }
  }
  if (refund.amount > payment.amount) {
    return { approved: false, reason: '...cannot exceed the payment amount.' }
  }
  return { approved: true }
}`}</code></pre>
        <p>ML scorer의 HTTP 구현체가 부르던 공용 파이썬 마이크로서비스는 맨 마지막에, 참조하는 곳이 하나도 없어진 뒤에 지웠다. 쓰는 데 없이 혼자 돌아가는 서비스는 남기지 않았다.</p>
        <h2>원칙</h2>
        <p>기능을 지운 일은 그 기능보다 오래 갈 규칙을 남겨야 쓸모가 있다. 남긴 규칙은 이렇다.</p>
        <blockquote><p>LLM은 권한 있는 사용자가 볼 범위를 좁힐 수는 있다. 하지만 입력이 당사자가 손댈 수 있는 자유 텍스트라면, LLM이 누구에게 권한이 있는지 정하거나 보안·돈이 걸린 행위를 승인·거절해서는 절대 안 된다.</p></blockquote>
        <p>좁히느냐 정하느냐, 이 구분이 전부다. 목록을 거르거나 문서를 요약하거나 검색 결과 순서를 매기다 LLM이 틀리면 답이 조금 나빠질 뿐이다. 환불을 승인하거나 접근 권한을 주거나 사기를 판정하다 틀리면 <em>결과</em>가 틀린다. 게다가 그 틀린 결과로 이득을 보는 사람이 입력을 넣은 사람이라면, 틀릴 수 있다는 건 곧 악용할 수 있다는 뜻이 된다.</p>
        <div className="article-note"><strong>더 볼 자료</strong><p>
          <a href="/posts/narrow-what-never-who">무엇은 좁히고, 누구는 정하지 않는다</a>(이 원칙 위에 만든 LLM 기능과, 그걸 5개 언어로 옮긴 과정) · <a href="/posts/llm-technical-service">Domain Service에 LLM을 붙이되 판단은 넘기지 않는다</a>(분류기가 있던 동안 레이어를 어떻게 나눴는지) · <a href="/posts/refund-fraud-risk-scorer">학습할 데이터가 없는 ML 점수는 끼워 넣되 결정은 맡기지 않는다</a>(함께 지운 이력 기반 점수) · <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/docs/architecture/domain-service.md" target="_blank" rel="noreferrer">docs/architecture/domain-service.md</a>(같은 백엔드 설계를 5개 언어로 구현해 둔 내 예제 프로젝트에서 이 원칙을 적어 둔 문서)
        </p></div>
      </>
    ),
  },
};

export default function TheFraudSignalThatTrustedTheFraudster() {
  const { locale } = useLocale();
  const c = content[locale];

  return (
    <PostLayout
      slug="the-fraud-signal-that-trusted-the-fraudster"
      kicker={c.kicker}
      title={c.title}
      lede={c.lede}
    >
      {c.body}
    </PostLayout>
  );
}
