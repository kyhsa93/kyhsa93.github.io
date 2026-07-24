import PostLayout from '../../components/PostLayout';
import { useLocale } from '../../lib/locale';

const content = {
  en: {
    kicker: 'Machine Learning · Architecture',
    title: (
      <>
        A Second Fraud Signal:<br /><em>Scoring History, Not Reading It</em>
      </>
    ),
    lede: "RefundReasonClassifier reads what a customer says. RefundFraudRiskScorer looks at what they've done — refund count, rejection rate, amount ratio, time since payment — and, like the classifier, still doesn't get the final vote.",
    body: (
      <>
        <p>Two Technical Services now feed <code>RefundEligibilityService</code>, and they're deliberately different shapes of "machine learning." <code>RefundReasonClassifier</code> is an LLM reading free text. <code>RefundFraudRiskScorer</code> is a hand-rolled logistic regression reading structured numbers — no LLM, no external API by default, just four features and a sigmoid.</p>
        <h2>The Feature Vector</h2>
        <p>Everything the model sees comes from the requester's own history, assembled by the Application layer from the Payment and Refund Aggregates plus a repository summary query:</p>
        <pre><code>{`export interface RefundRiskFeatures {
  readonly refundCountLast30Days: number
  readonly rejectedRefundCountLast30Days: number
  readonly refundToPaymentAmountRatio: number
  readonly minutesSincePayment: number
}`}</code></pre>
        <pre><code>{`const mlFraudRiskScore = await this.refundFraudRiskScorer.score({
  refundCountLast30Days,
  rejectedRefundCountLast30Days,
  refundToPaymentAmountRatio: refund.amount / payment.amount,
  minutesSincePayment: Math.max(0, (Date.now() - payment.createdAt.getTime()) / 60000),
})`}</code></pre>
        <h2>Trained on a Placeholder, By Design</h2>
        <p>There's no real user base behind this example repo, so there's no real historical fraud-review outcome to train against. The native implementation trains itself at construction time, against a synthetic dataset generated from a fixed, seeded random source and a deliberately simple ground-truth rule (refund count, rejection count, amount ratio, and recency, each weighted and summed against a threshold). Plain batch gradient descent, four weights plus a bias, no ML library. It's explicitly a stand-in — the interface is what matters, not the model's actual predictive power.</p>
        <h2>Swappable by Config, Not by Rewrite</h2>
        <p>The same native/HTTP toggle already used for the LLM classifier shows up here too — an env var picks between an in-process computation and a call to a small external scoring service:</p>
        <pre><code>{`FRAUD_SCORER_MODE=native   # default — in-process logistic regression
FRAUD_SCORER_MODE=http      # calls services/fraud-risk-scorer/ over HTTP`}</code></pre>
        <p>The HTTP implementation fails open — any network error, non-200, or malformed response returns a score of <code>0</code> rather than blocking the refund. A scoring failure is an infrastructure concern; it must never be the thing that stops a legitimate refund from going through.</p>
        <h2>Two Thresholds, One Decision</h2>
        <p><code>RefundEligibilityService</code> now takes both signals as independent values, each with its own threshold:</p>
        <pre><code>{`const FRAUD_RISK_REJECTION_THRESHOLD = 0.7      // from RefundReasonClassifier (LLM)
const ML_FRAUD_RISK_REJECTION_THRESHOLD = 0.8   // from RefundFraudRiskScorer (history model)`}</code></pre>
        <p>Neither Technical Service knows the other exists. The Domain Service is the only place both numbers meet, and it's still the only place that decides what they mean.</p>
        <h2>The Bug a Shared Test Owner Caused</h2>
        <p>Adding a history-aware scorer to an E2E suite with shared test fixtures created a real, deterministic failure — not a flaky one. Multiple test methods reusing the same owner ID against a Testcontainers Postgres instance (no per-test reset) meant later tests inherited rejected-refund history from earlier ones, pushing the native score past the 0.8 threshold and causing a legitimately valid refund to be misclassified as high-risk.</p>
        <p>The two ports that hit this fixed it two different ways, worth being precise about rather than claiming one shared technique. Java forces the entire E2E suite into HTTP mode against an unreachable address, so scoring deterministically falls back to <code>0</code> for every test:</p>
        <pre><code>{`// OWNER_ID is shared across every test method in this class, and the Testcontainers Postgres
// instance persists refund history across them (no per-test reset) — so the native scorer
// would see accumulating refund history across unrelated test methods.
registry.add("fraud-scorer.mode", () -> "http")
registry.add("fraud-scorer.base-url", () -> "http://localhost:1")`}</code></pre>
        <p>NestJS instead left native scoring live for the rest of the suite and gave only the one affected test its own dedicated owner ID — a narrower fix, same underlying cause.</p>
        <div className="article-note"><strong>Deterministic, not flaky</strong><p>It's worth naming the difference: a flaky test fails unpredictably for reasons unrelated to the code under test. This failure happened every time, in the same order, for the same reason — accumulated state from earlier tests changing the input to a later one. That's a test-isolation bug wearing a "flaky test" costume, and it's worth looking twice before reaching for a retry-on-failure fix instead of an isolation fix.</p></div>
      </>
    ),
  },
  ko: {
    kicker: 'Machine Learning · Architecture',
    title: (
      <>
        두 번째 사기 신호:<br /><em>이력을 읽는 게 아니라, 점수화하다</em>
      </>
    ),
    lede: 'RefundReasonClassifier는 고객이 하는 말을 읽는다. RefundFraudRiskScorer는 고객이 실제로 해온 행동 — 환불 횟수, 거절율, 금액 비율, 결제 이후 경과 시간 — 을 본다. 그리고 classifier와 마찬가지로, 최종 결정권은 여전히 갖지 못한다.',
    body: (
      <>
        <p>이제 <code>RefundEligibilityService</code>에는 두 개의 Technical Service가 신호를 공급하는데, 둘은 의도적으로 서로 다른 형태의 "머신러닝"이다. <code>RefundReasonClassifier</code>는 자유 텍스트를 읽는 LLM이다. <code>RefundFraudRiskScorer</code>는 구조화된 숫자를 읽는, 직접 구현한 로지스틱 회귀다 — 기본적으로 LLM도, 외부 API도 없이 그저 네 개의 feature와 시그모이드 함수뿐이다.</p>
        <h2>Feature 벡터</h2>
        <p>모델이 보는 모든 값은 요청자 본인의 이력에서 나오며, Payment와 Refund Aggregate 그리고 repository의 요약 쿼리를 바탕으로 Application 계층이 조합한다:</p>
        <pre><code>{`export interface RefundRiskFeatures {
  readonly refundCountLast30Days: number
  readonly rejectedRefundCountLast30Days: number
  readonly refundToPaymentAmountRatio: number
  readonly minutesSincePayment: number
}`}</code></pre>
        <pre><code>{`const mlFraudRiskScore = await this.refundFraudRiskScorer.score({
  refundCountLast30Days,
  rejectedRefundCountLast30Days,
  refundToPaymentAmountRatio: refund.amount / payment.amount,
  minutesSincePayment: Math.max(0, (Date.now() - payment.createdAt.getTime()) / 60000),
})`}</code></pre>
        <h2>의도적으로 플레이스홀더 위에서 학습시키다</h2>
        <p>이 예제 저장소 뒤에는 실제 사용자 기반이 없으므로, 학습시킬 실제 과거 사기 심사 결과도 없다. Native 구현은 생성 시점에 스스로 학습하는데, 고정된 시드 난수 소스로 생성한 합성 데이터셋과, 의도적으로 단순한 정답 규칙(환불 횟수·거절 횟수·금액 비율·최근성에 각각 가중치를 주고 합산해 임계값과 비교하는 방식)을 대상으로 한다. 평범한 배치 경사 하강법, 네 개의 가중치와 편향(bias) 하나, ML 라이브러리는 없다. 이는 명시적으로 대역(stand-in)일 뿐이다 — 중요한 것은 모델의 실제 예측 성능이 아니라 인터페이스다.</p>
        <h2>재작성이 아니라 설정으로 교체 가능하게</h2>
        <p>LLM classifier에 이미 쓰인 것과 같은 native/HTTP 토글이 여기서도 등장한다 — 환경 변수 하나로 프로세스 내부 연산과 작은 외부 스코어링 서비스 호출 중 하나를 고른다:</p>
        <pre><code>{`FRAUD_SCORER_MODE=native   # default — in-process logistic regression
FRAUD_SCORER_MODE=http      # calls services/fraud-risk-scorer/ over HTTP`}</code></pre>
        <p>HTTP 구현은 fail open이다 — 네트워크 오류, non-200 응답, 형식이 잘못된 응답 중 무엇이 발생하든 환불을 막는 대신 점수 <code>0</code>을 반환한다. 스코어링 실패는 인프라의 문제이지, 정당한 환불을 가로막는 이유가 되어서는 절대 안 된다.</p>
        <h2>두 개의 임계값, 하나의 결정</h2>
        <p><code>RefundEligibilityService</code>는 이제 두 신호를 각각 독립된 값으로 받아, 각자 자신의 임계값을 갖는다:</p>
        <pre><code>{`const FRAUD_RISK_REJECTION_THRESHOLD = 0.7      // from RefundReasonClassifier (LLM)
const ML_FRAUD_RISK_REJECTION_THRESHOLD = 0.8   // from RefundFraudRiskScorer (history model)`}</code></pre>
        <p>두 Technical Service 중 어느 쪽도 상대방의 존재를 알지 못한다. 두 숫자가 만나는 유일한 곳은 Domain Service이고, 그 둘이 무엇을 의미하는지 판단하는 곳도 여전히 그곳뿐이다.</p>
        <h2>공유된 테스트 소유자가 만든 버그</h2>
        <p>이력을 인식하는 scorer를 공유 테스트 픽스처를 쓰는 E2E 스위트에 추가하자, 실제로 발생하는 결정론적(deterministic) 실패가 생겼다 — 불안정한(flaky) 실패가 아니었다. Testcontainers Postgres 인스턴스를 대상으로 여러 테스트 메서드가 같은 owner ID를 재사용했고(테스트별 초기화가 없었다), 그 결과 나중에 실행되는 테스트들이 앞선 테스트의 거절된 환불 이력을 그대로 물려받아 native 점수가 0.8 임계값을 넘어섰고, 정당하게 유효한 환불이 고위험으로 잘못 분류되는 결과로 이어졌다.</p>
        <p>이 문제를 마주친 두 포트는 서로 다른 방식으로 해결했고, 하나의 공통 기법으로 뭉뚱그리기보다는 정확히 짚어둘 가치가 있다. Java는 전체 E2E 스위트를 도달 불가능한 주소를 향한 HTTP 모드로 강제해, 모든 테스트에서 스코어링이 결정론적으로 <code>0</code>으로 fallback되게 만들었다:</p>
        <pre><code>{`// OWNER_ID is shared across every test method in this class, and the Testcontainers Postgres
// instance persists refund history across them (no per-test reset) — so the native scorer
// would see accumulating refund history across unrelated test methods.
registry.add("fraud-scorer.mode", () -> "http")
registry.add("fraud-scorer.base-url", () -> "http://localhost:1")`}</code></pre>
        <p>반면 NestJS는 스위트의 나머지 부분에서는 native 스코어링을 그대로 살려두고, 영향을 받은 그 테스트 하나에만 전용 owner ID를 부여했다 — 더 좁은 범위의 수정이지만, 근본 원인은 동일하다.</p>
        <div className="article-note"><strong>결정론적 실패이지, 불안정한 실패가 아니다</strong><p>이 둘의 차이는 짚어둘 가치가 있다: 불안정한(flaky) 테스트는 검사 대상 코드와 무관한 이유로 예측 불가능하게 실패한다. 이 실패는 매번, 같은 순서로, 같은 이유로 발생했다 — 앞선 테스트들에서 누적된 상태가 이후 테스트의 입력을 바꿔놓았기 때문이다. 이건 "flaky 테스트"라는 옷을 입은 테스트 격리(isolation) 버그이며, 재시도로 실패를 넘기는 수정 대신 격리 문제를 고치는 쪽을 택하기 전에 한 번 더 살펴볼 가치가 있다.</p></div>
      </>
    ),
  },
};

export default function RefundFraudRiskScorer() {
  const { locale } = useLocale();
  const c = content[locale];

  return (
    <PostLayout slug="refund-fraud-risk-scorer" kicker={c.kicker} title={c.title} lede={c.lede}>
      {c.body}
    </PostLayout>
  );
}
