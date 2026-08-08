import PostLayout from '../../components/PostLayout';
import { useLocale } from '../../lib/locale';
import type { MetaFunction } from 'react-router';
import { createPostMeta } from '../../lib/seo';

export const meta: MetaFunction = () => createPostMeta('the-fraud-signal-that-trusted-the-fraudster');

const content = {
  en: {
    kicker: 'Security · LLM',
    title: (
      <>
        The Fraud Signal<br /><em>That Trusted the Fraudster</em>
      </>
    ),
    lede: "RefundReasonClassifier read a refund's free-text reason and returned a fraud-risk score. It never accounted for the one fact that mattered: the person supplying that text was exactly the person the score was supposed to catch.",
    body: (
      <>
        <p>Two earlier posts on this blog — <a href="/posts/llm-technical-service">Wiring an LLM Into a Domain Service</a> and <a href="/posts/refund-fraud-risk-scorer">A Second Fraud Signal</a> — described <code>RefundReasonClassifier</code> and <code>RefundFraudRiskScorer</code> as real, working Technical Services. They were, right up until a design review turned up a channel problem that no amount of clean layering could paper over. Both are gone now. This is what was wrong, what got cut, and the one rule the removal was for.</p>
        <h2>What It Did</h2>
        <p><code>RefundReasonClassifier</code> was a Technical Service — an Application-layer interface, with the real implementation (a self-hosted Ollama model, <code>qwen2.5:1.5b</code>) living in Infrastructure. It read a refund's free-text <code>reason</code> and returned a category plus a fraud-risk score from 0 to 1. That score fed <code>RefundEligibilityService</code>, a Domain Service, which rejected the refund outright once the score crossed a threshold:</p>
        <pre><code>{`// domain/refund-eligibility-service.ts — the branch that got removed
if (classification.category === 'fraud_suspected'
    && classification.fraudRiskScore >= 0.7) {
  return {
    approved: false,
    reason: 'This refund reason was flagged as high '
      + 'fraud risk and requires manual review.'
  }
}`}</code></pre>
        <p>On paper, this is a textbook Technical Service: an LLM call abstracted behind an interface, feeding a plain judgment into a Domain Service that never knew an LLM was involved, tested with a mocked classifier and no network call. Everything the earlier posts described about the layering was accurate. The layering was never the problem.</p>
        <h2>The Channel Problem</h2>
        <p>The <code>reason</code> field is exactly, and only, what the person requesting the refund typed. If someone intends to defraud the system, they control the one input the fraud judgment depends on. Nothing stops them from writing "the item arrived damaged" instead of the truth — the classifier has no way to tell the difference, because there is no difference visible to it. It's the equivalent of verifying a sworn statement by re-reading the statement.</p>
        <p>A judgment meant to catch bad-faith actors was built entirely out of a channel bad-faith actors fully control. The one case it was designed to catch is the one case guaranteed to sail through it.</p>
        <div className="article-note"><strong>Why this passed review the first time</strong><p>Every individual piece was correct: the Technical Service boundary was clean, the fallback-on-failure logic was sound, the threshold was tuned against a real, live model — an earlier 0.5B-parameter model was rejected specifically because it misread a plain billing complaint as fraud. The flaw wasn't in any one file. It was in <em>what kind of input</em> a security-relevant judgment was allowed to depend on, and that question doesn't get answered by careful layering alone.</p></div>
        <h2>The Cut, and How Far It Went</h2>
        <p>The fix was to remove <code>RefundReasonClassifier</code> outright, across all five language implementations this repo maintains in parallel. A second signal sat right next to it, <code>RefundFraudRiskScorer</code> — an ML model scoring the requester's own refund/payment <em>history</em> (frequency, amount ratio, time since payment). That input isn't something a requester can rewrite on a whim, so it doesn't share the flaw above. It stayed, at first.</p>
        <p>Then the decision changed, mid-round: cut that one too — not because it shared the flaw, but as a separate simplification call. Five languages, two removals each, each one independently re-verified — build, lint, unit tests, e2e tests, the architecture harness, a repo-wide docs-drift checker — rather than assumed correct by analogy to the others. A fix that's obviously right in one codebase still has to prove itself again in every other implementation carrying the same logic.</p>
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
        <p>The shared Python microservice the ML scorer's HTTP variant called was deleted last, once nothing referenced it anymore — no orphaned service left running for its own sake.</p>
        <h2>The Principle</h2>
        <p>Removing a feature is only useful if it leaves behind a rule that outlives it:</p>
        <blockquote><p>An LLM may narrow what an authorized user sees. It must never decide who is authorized — or approve/reject a security- or money-relevant action — when its input is free text the affected party can shape.</p></blockquote>
        <p>Narrow versus decide is the whole distinction. An LLM filtering a list, summarizing a document, or ranking search results produces a worse answer when it's wrong. An LLM approving a refund, granting access, or flagging fraud produces a wrong <em>outcome</em> when it's wrong — and if the party who benefits from that wrong outcome is also the one who supplied the input, "wrong" quietly becomes "exploitable."</p>
        <div className="article-note"><strong>Further reading</strong><p>
          <a href="/posts/narrow-what-never-who">Narrow What, Never Who</a> — the LLM feature built on this principle, and how it ported across all five languages · <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/docs/architecture/domain-service.md" target="_blank" rel="noreferrer">docs/architecture/domain-service.md</a> — where this principle now lives in the repo's own docs
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
    lede: 'RefundReasonClassifier는 환불의 자유 텍스트 사유를 읽고 사기 위험 점수를 반환했다. 정작 중요한 사실 하나는 고려하지 못했다: 그 텍스트를 준 사람이 정확히 그 점수가 잡아내야 할 바로 그 사람이라는 것.',
    body: (
      <>
        <p>이 블로그의 이전 두 글 — <a href="/posts/llm-technical-service">Domain Service에 LLM 연결하기</a>와 <a href="/posts/refund-fraud-risk-scorer">두 번째 사기 신호</a> — 는 <code>RefundReasonClassifier</code>와 <code>RefundFraudRiskScorer</code>를 실제로 동작하는 Technical Service로 소개했다. 실제로 그랬다 — 설계 리뷰에서 아무리 깔끔한 레이어 분리로도 덮을 수 없는 채널 문제가 드러나기 전까지는. 둘 다 이제 없다. 무엇이 잘못됐고, 무엇이 잘려나갔고, 이번 제거가 남긴 단 하나의 규칙이 무엇인지를 정리한다.</p>
        <h2>무엇을 했나</h2>
        <p><code>RefundReasonClassifier</code>는 Technical Service였다 — Application 계층의 인터페이스이고, 실제 구현체(자체 호스팅 Ollama 모델, <code>qwen2.5:1.5b</code>)는 Infrastructure에 있었다. 환불의 자유 텍스트 <code>reason</code>을 읽어 카테고리와 0~1 사이의 사기 위험 점수를 반환했다. 그 점수는 Domain Service인 <code>RefundEligibilityService</code>로 들어갔고, 점수가 임계값을 넘으면 환불을 그 자리에서 거절했다:</p>
        <pre><code>{`// domain/refund-eligibility-service.ts — 제거된 분기
if (classification.category === 'fraud_suspected'
    && classification.fraudRiskScore >= 0.7) {
  return {
    approved: false,
    reason: 'This refund reason was flagged as high '
      + 'fraud risk and requires manual review.'
  }
}`}</code></pre>
        <p>겉보기엔 교과서적인 Technical Service다: 인터페이스 뒤에 숨겨진 LLM 호출, LLM이 관여했다는 사실조차 모르는 채 순수 판단만 받는 Domain Service, 네트워크 호출 없이 mock된 classifier로 검증되는 테스트. 이전 글들이 설명한 레이어 분리 내용은 전부 정확했다. 문제는 레이어 분리가 아니었다.</p>
        <h2>채널 문제</h2>
        <p><code>reason</code> 필드는 정확히, 그리고 오직, 환불을 요청하는 그 사람이 직접 입력한 텍스트다. 만약 그 사람이 시스템을 속이려 한다면, 사기 판단이 의존하는 바로 그 입력을 자기 손으로 통제하고 있는 셈이다. 진짜 사유 대신 "상품이 파손된 채로 도착했어요"라고 적는 걸 막을 방법은 없다 — classifier 입장에서는 둘을 구분할 근거 자체가 없다. 진술서를 검증한다면서 그 진술서를 다시 읽어보는 것과 다를 게 없다.</p>
        <p>악의적인 사용자를 잡아내려고 만든 판단이, 정작 그 악의적인 사용자가 완전히 통제하는 채널 하나로만 구성돼 있었다. 원래 잡아내야 할 바로 그 케이스가, 오히려 무조건 통과하는 케이스가 되어버린 것이다.</p>
        <div className="article-note"><strong>왜 처음엔 리뷰를 통과했나</strong><p>개별 코드는 다 정확했다: Technical Service 경계는 깔끔했고, 실패 시 폴백 로직도 견고했고, 임계값도 실제 모델로 튜닝돼 있었다 — 더 작은 0.5B 모델은 평범한 청구 불만을 사기로 오판해서 애초에 탈락시킨 이력도 있었다. 결함은 어느 한 파일에 있지 않았다. 보안과 직결된 판단이 <em>어떤 종류의 입력</em>에 의존해도 되는지에 대한 질문에 있었고, 이건 아무리 레이어를 잘 나눠도 저절로 답해지지 않는다.</p></div>
        <h2>잘라내기, 그리고 그 범위</h2>
        <p>해결책은 <code>RefundReasonClassifier</code>를 이 저장소가 병렬로 유지하는 다섯 개 언어 구현 전체에서 완전히 제거하는 것이었다. 바로 옆에는 두 번째 신호 <code>RefundFraudRiskScorer</code>가 있었다 — 요청자 본인의 환불/결제 <em>이력</em>(빈도, 금액 비율, 결제 후 경과 시간)을 점수 매기는 ML 모델. 이 입력은 요청자가 마음대로 다시 쓸 수 있는 값이 아니므로 위의 결함을 공유하지 않는다. 그래서 처음엔 남겨두었다.</p>
        <p>그런데 작업 도중 결정이 바뀌었다: 그것도 잘라내자 — 같은 결함이 있어서가 아니라, 별개의 단순화 결정으로. 다섯 개 언어, 각각 두 번의 제거, 다른 언어를 유추해서 넘어가지 않고 매번 독립적으로 재검증했다 — 빌드, 린트, 유닛 테스트, e2e 테스트, 아키텍처 하네스, 저장소 전체 docs-drift 검사. 한 코드베이스에서 명백히 옳은 수정이라도, 같은 로직을 담고 있는 다른 모든 구현에서 다시 한번 스스로를 증명해야 한다.</p>
        <p><code>RefundEligibilityService</code>에 남은 건 구조적 검사 두 가지뿐이다:</p>
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
        <p>ML scorer의 HTTP 구현체가 호출하던 공용 파이썬 마이크로서비스는, 더 이상 아무도 참조하지 않게 된 마지막 순간에 삭제했다 — 자기 존재만을 위해 계속 돌아가는 서비스를 남기지 않았다.</p>
        <h2>원칙</h2>
        <p>기능을 제거하는 건, 그 기능보다 오래 남을 규칙을 남길 때만 의미가 있다:</p>
        <blockquote><p>LLM은 인가된 사용자가 무엇을 보게 될지 좁힐 수는 있다. 하지만 그 입력이 당사자가 직접 조작할 수 있는 자유 텍스트일 때는, 누구에게 권한이 있는지를 결정하거나 보안·금전과 직결된 행위를 승인/거절해서는 절대 안 된다.</p></blockquote>
        <p>'좁히기'와 '결정하기'가 이 원칙의 전부다. 목록을 필터링하거나 문서를 요약하거나 검색 결과 순위를 매기는 일에서 LLM이 틀리면 답이 좀 나빠질 뿐이다. 환불을 승인하거나 접근 권한을 부여하거나 사기를 판정하는 일에서 LLM이 틀리면 <em>결과 자체</em>가 틀려지고, 그 잘못된 결과로 이득을 보는 쪽이 애초에 그 입력을 준 사람과 같다면, '틀림'은 조용히 '악용 가능함'으로 바뀐다.</p>
        <div className="article-note"><strong>더 읽을거리</strong><p>
          <a href="/posts/narrow-what-never-who">무엇은 좁히고, 누구는 정하지 않는다</a> — 이 원칙 위에 지은 LLM 기능, 그리고 다섯 개 언어에 걸쳐 이식된 과정 · <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/docs/architecture/domain-service.md" target="_blank" rel="noreferrer">docs/architecture/domain-service.md</a> — 이 원칙이 지금 저장소 문서에 남아있는 곳
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
