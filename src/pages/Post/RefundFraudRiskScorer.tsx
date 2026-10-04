import PostLayout from '../../components/PostLayout';
import { useLocale, localeFromPathname } from '../../lib/locale';
import type { MetaFunction } from 'react-router';
import { createPostMeta } from '../../lib/seo';

export const meta: MetaFunction = ({ location }) =>
  createPostMeta('refund-fraud-risk-scorer', localeFromPathname(location.pathname));

const content = {
  en: {
    kicker: 'Machine Learning · Architecture',
    title: (
      <>
        A Second Fraud Signal:<br /><em>Scoring History, Not Reading It</em>
      </>
    ),
    lede: "RefundReasonClassifier reads what a customer says. RefundFraudRiskScorer looks at what they've done (refund count, rejection rate, amount ratio, time since payment) and, like the classifier, still doesn't get the final vote.",
    body: (
      <>
        <div className="article-note"><strong>Update — 2026.07.26</strong><p><code>RefundFraudRiskScorer</code> described below has since been removed too. It didn't share the flaw covered in <a href="/posts/the-fraud-signal-that-trusted-the-fraudster">The Fraud Signal That Trusted the Fraudster</a> (the requester's own history isn't something they can rewrite on request); it went as a separate simplification decision made at the same time. <code>RefundEligibilityService</code> now carries no fraud-risk judgment of any kind. The source link at the bottom of this post now points to the last commit where the file still existed.</p></div>
        <p>Two Technical Services now feed <code>RefundEligibilityService</code>, and they're deliberately different shapes of "machine learning." <code>RefundReasonClassifier</code> is an LLM reading free text. <code>RefundFraudRiskScorer</code> is a hand-rolled logistic regression reading structured numbers. By default there's no LLM and no external API, just four features and a sigmoid.</p>
        <h2>The Interface, and Two Implementations Behind It</h2>
        <pre><code>{`interface RefundFraudRiskScorer {
    fun score(features: RefundRiskFeatures): Double
}`}</code></pre>
        <p>Two classes implement it, selected by config rather than by the caller. <code>RequestRefundService</code> depends only on the interface and never knows which one is live.</p>
        <h2>The Feature Vector</h2>
        <p>Everything the model sees comes from the requester's own history, assembled by the Application layer from the Payment and Refund Aggregates plus a repository summary query:</p>
        <pre><code>{`val mlFraudRiskScore =
    refundFraudRiskScorer.score(
        RefundRiskFeatures(
            refundCountLast30Days = refundSummary.count.toInt(),
            rejectedRefundCountLast30Days = rejectedRefundSummary.count.toInt(),
            refundToPaymentAmountRatio = refund.amount.toDouble() / payment.amount.toDouble(),
            minutesSincePayment =
                Duration.between(payment.createdAt, LocalDateTime.now())
                    .toMinutes()
                    .coerceAtLeast(0)
                    .toDouble(),
        ),
    )`}</code></pre>
        <h2>Trained on a Placeholder, By Design</h2>
        <p>There's no real user base behind this example repo, so there's no real historical fraud-review outcome to train against. The native implementation trains itself once, at construction, against a synthetic seeded dataset and a deliberately simple ground-truth rule:</p>
        <pre><code>{`private fun generateTrainingData(): List<TrainingExample> {
    val random = Random(TRAINING_SEED)
    return (0 until TRAINING_EXAMPLE_COUNT).map {
        val refundCountLast30Days = random.nextInt(8)
        val rejectedRefundCountLast30Days = random.nextInt(4)
        val refundToPaymentAmountRatio = random.nextDouble()
        val minutesSincePayment = random.nextDouble() * 43200
        val riskScore =
            refundCountLast30Days * 0.15 +
                rejectedRefundCountLast30Days * 0.3 +
                refundToPaymentAmountRatio * 0.4 +
                maxOf(0.0, 1 - minutesSincePayment / 1440) * 0.3
        val label = if (riskScore > 1.1) 1.0 else 0.0
        TrainingExample(/* ... */ label = label)
    }
}`}</code></pre>
        <p>Plain batch gradient descent, four weights plus a bias, no ML library:</p>
        <pre><code>{`private fun trainLogisticRegression(examples: List<TrainingExample>): LogisticModel {
    val weights = DoubleArray(FEATURE_COUNT)
    var bias = 0.0
    repeat(EPOCHS) {
        val weightGradients = DoubleArray(FEATURE_COUNT)
        var biasGradient = 0.0
        for (example in examples) {
            val vector = toVector(example.features)
            var z = bias
            for (i in vector.indices) z += vector[i] * weights[i]
            val error = sigmoid(z) - example.label
            for (i in vector.indices) weightGradients[i] += error * vector[i]
            biasGradient += error
        }
        for (i in weights.indices) weights[i] -= (LEARNING_RATE * weightGradients[i]) / examples.size
        bias -= (LEARNING_RATE * biasGradient) / examples.size
    }
    return LogisticModel(weights, bias)
}`}</code></pre>
        <p>The fixed random seed matters here: the generated dataset, and therefore the trained weights, is identical on every run. It's explicitly a stand-in; the interface is what matters, not the model's predictive power.</p>
        <h2>Swappable by Config, Not by Rewrite</h2>
        <p>The same native/HTTP toggle already used for the LLM classifier shows up here too. A config property picks between an in-process computation and a call to the shared <code>services/fraud-risk-scorer</code> microservice:</p>
        <pre><code>{`@ConfigurationProperties(prefix = "fraud-scorer")
data class FraudScorerProperties(
    val mode: String = "native",
    val baseUrl: String = "http://localhost:8000",
) {
    val isHttpMode: Boolean get() = mode == "http"
}`}</code></pre>
        <p>The HTTP implementation fails open. Any network error, non-2xx, or malformed response returns a score of <code>0.0</code> rather than blocking the refund:</p>
        <pre><code>{`override fun score(features: RefundRiskFeatures): Double =
    try {
        val response = httpClient.send(buildRequest(features), HttpResponse.BodyHandlers.ofString())
        if (response.statusCode() !in 200..299) FALLBACK_SCORE else parseScore(response.body()) ?: FALLBACK_SCORE
    } catch (e: Exception) {
        // A scoring failure is a technical-infrastructure concern, not a domain error — it must
        // never block a refund request. Swallow it here at the boundary and fall back.
        FALLBACK_SCORE
    }`}</code></pre>
        <h2>Two Thresholds, One Decision</h2>
        <p><code>RefundEligibilityService</code> takes both signals as independent values, each with its own threshold, and neither Technical Service knows the other exists:</p>
        <pre><code>{`companion object {
    private const val FRAUD_RISK_REJECTION_THRESHOLD = 0.7      // from RefundReasonClassifier (LLM)
    private const val ML_FRAUD_RISK_REJECTION_THRESHOLD = 0.8   // from RefundFraudRiskScorer (history model)
}

fun evaluate(payment: Payment, refund: Refund, classification: RefundReasonClassification, mlFraudRiskScore: Double): RefundDecision {
    // ...
    if (mlFraudRiskScore >= ML_FRAUD_RISK_REJECTION_THRESHOLD) {
        return RefundDecision(approved = false, reason = "This refund pattern was flagged as high risk by the fraud-risk model and requires manual review.")
    }
    return RefundDecision(approved = true)
}`}</code></pre>
        <p>The Domain Service is the only place both numbers meet, and it's still the only place that decides what they mean.</p>
        <h2>The Bug a Shared Test Owner Caused</h2>
        <p>Adding a history-aware scorer to an E2E suite with shared test fixtures created a deterministic failure elsewhere in this repo, not a flaky one. Multiple test methods reusing the same owner ID against a Testcontainers Postgres instance (no per-test reset) meant later tests inherited rejected-refund history from earlier ones, pushing the native score past the 0.8 threshold and misclassifying a legitimately valid refund as high-risk.</p>
        <p>The two ports that hit this fixed it two different ways, and it's worth naming both rather than claiming one shared technique. The java-springboot port forces its entire E2E suite into HTTP mode against an unreachable address, so scoring deterministically falls back to <code>0</code> for every test. The nestjs port instead left native scoring live for the rest of the suite and gave only the one affected test its own dedicated owner ID. That's a narrower fix for the same underlying cause.</p>
        <div className="article-note"><strong>Deterministic, not flaky</strong><p>It's worth naming the difference: a flaky test fails unpredictably for reasons unrelated to the code under test. This failure happened every time, in the same order, for the same reason: accumulated state from earlier tests changing the input to a later one. That's a test-isolation bug wearing a "flaky test" costume, and it's worth looking twice before reaching for a retry-on-failure fix instead of an isolation fix.</p></div>
        <div className="article-note"><strong>Further reading in the repo</strong><p>
          <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/docs/architecture/domain-service.md" target="_blank" rel="noreferrer">docs/architecture/domain-service.md</a> — the Technical Service pattern (this example has since been replaced, see the update note above) · <a href="https://github.com/kyhsa93/backend-service-playbook/blob/0473a4140ecb3fc3446fbbc847ab9a136e984f43/implementations/kotlin-springboot/examples/src/main/kotlin/com/example/accountservice/payment/infrastructure/RefundFraudRiskScorerNativeImpl.kt" target="_blank" rel="noreferrer">RefundFraudRiskScorerNativeImpl.kt</a> — the training/scoring code as it existed, pinned to the last commit before removal
        </p></div>
      </>
    ),
  },
  ko: {
    kicker: 'Machine Learning · Architecture',
    title: (
      <>
        두 번째 사기 신호는<br /><em>이력을 숫자로 매긴다</em>
      </>
    ),
    lede: 'RefundReasonClassifier는 고객이 한 말을 읽는다. RefundFraudRiskScorer는 고객이 해 온 일을 본다. 환불 횟수, 거절 비율, 금액 비율, 결제 뒤 지난 시간이다. 그래도 classifier와 마찬가지로 최종 결정은 이 모델이 내리지 않는다.',
    body: (
      <>
        <div className="article-note"><strong>정정(2026.07.26)</strong><p>이 글의 <code>RefundFraudRiskScorer</code>도 나중에 지웠다. <a href="/posts/the-fraud-signal-that-trusted-the-fraudster">사기꾼을 그대로 믿은 사기 탐지 신호</a>에서 다룬 결함 때문은 아니다. 요청자 본인의 이력은 요청할 때 마음대로 고쳐 쓸 수 있는 값이 아니다. 같은 때에 따로 내린 단순화 결정으로 함께 빠졌다. 이제 <code>RefundEligibilityService</code>에는 사기 여부를 따지는 판단이 하나도 없다. 글 아래쪽 소스 링크는 이 파일이 마지막으로 남아 있던 커밋을 가리킨다.</p></div>
        <p><code>RefundEligibilityService</code>에 신호를 넣는 Technical Service가 이제 둘이다. 둘 다 "머신러닝"이지만 일부러 모양을 다르게 했다. <code>RefundReasonClassifier</code>는 자유 텍스트를 읽는 LLM이다. <code>RefundFraudRiskScorer</code>는 정형 숫자를 읽는 로지스틱 회귀이고, 직접 짰다. 기본 설정에서는 LLM도 외부 API도 쓰지 않는다. feature 4개와 시그모이드가 전부다.</p>
        <h2>인터페이스 하나, 구현체 둘</h2>
        <pre><code>{`interface RefundFraudRiskScorer {
    fun score(features: RefundRiskFeatures): Double
}`}</code></pre>
        <p>이 인터페이스를 구현한 클래스가 2개 있고, 어느 쪽을 쓸지는 호출하는 쪽이 아니라 설정이 정한다. <code>RequestRefundService</code>는 인터페이스만 알고, 지금 어느 구현체가 돌고 있는지는 모른다.</p>
        <h2>Feature 벡터</h2>
        <p>모델이 보는 값은 모두 요청자 본인의 이력에서 나온다. Application 계층이 Payment와 Refund Aggregate, repository 요약 쿼리에서 값을 모아 다음처럼 조립한다.</p>
        <pre><code>{`val mlFraudRiskScore =
    refundFraudRiskScorer.score(
        RefundRiskFeatures(
            refundCountLast30Days = refundSummary.count.toInt(),
            rejectedRefundCountLast30Days = rejectedRefundSummary.count.toInt(),
            refundToPaymentAmountRatio = refund.amount.toDouble() / payment.amount.toDouble(),
            minutesSincePayment =
                Duration.between(payment.createdAt, LocalDateTime.now())
                    .toMinutes()
                    .coerceAtLeast(0)
                    .toDouble(),
        ),
    )`}</code></pre>
        <h2>학습 데이터는 일부러 가짜로</h2>
        <p>예제 저장소라 사용자가 없고, 그러니 학습에 쓸 사기 심사 이력도 없다. 그래서 native 구현체는 생성될 때 한 번 스스로 학습한다. 시드를 고정한 합성 데이터셋에, 일부러 단순하게 만든 정답 규칙을 붙였다.</p>
        <pre><code>{`private fun generateTrainingData(): List<TrainingExample> {
    val random = Random(TRAINING_SEED)
    return (0 until TRAINING_EXAMPLE_COUNT).map {
        val refundCountLast30Days = random.nextInt(8)
        val rejectedRefundCountLast30Days = random.nextInt(4)
        val refundToPaymentAmountRatio = random.nextDouble()
        val minutesSincePayment = random.nextDouble() * 43200
        val riskScore =
            refundCountLast30Days * 0.15 +
                rejectedRefundCountLast30Days * 0.3 +
                refundToPaymentAmountRatio * 0.4 +
                maxOf(0.0, 1 - minutesSincePayment / 1440) * 0.3
        val label = if (riskScore > 1.1) 1.0 else 0.0
        TrainingExample(/* ... */ label = label)
    }
}`}</code></pre>
        <p>학습은 평범한 배치 경사하강법이다. 가중치 4개에 bias 하나이고, ML 라이브러리는 쓰지 않았다.</p>
        <pre><code>{`private fun trainLogisticRegression(examples: List<TrainingExample>): LogisticModel {
    val weights = DoubleArray(FEATURE_COUNT)
    var bias = 0.0
    repeat(EPOCHS) {
        val weightGradients = DoubleArray(FEATURE_COUNT)
        var biasGradient = 0.0
        for (example in examples) {
            val vector = toVector(example.features)
            var z = bias
            for (i in vector.indices) z += vector[i] * weights[i]
            val error = sigmoid(z) - example.label
            for (i in vector.indices) weightGradients[i] += error * vector[i]
            biasGradient += error
        }
        for (i in weights.indices) weights[i] -= (LEARNING_RATE * weightGradients[i]) / examples.size
        bias -= (LEARNING_RATE * biasGradient) / examples.size
    }
    return LogisticModel(weights, bias)
}`}</code></pre>
        <p>랜덤 시드를 고정해 둔 게 중요하다. 그래야 생성되는 데이터셋도, 거기서 나오는 가중치도 매번 같다. 이 모델은 대역이라고 분명히 해 두었다. 보여 주려는 건 예측 성능보다 인터페이스다.</p>
        <h2>코드를 고치지 않고 설정으로 바꾼다</h2>
        <p>LLM classifier에 쓴 native/HTTP 토글을 여기서도 그대로 쓴다. 설정 프로퍼티 하나로 프로세스 안에서 계산할지, 공용 <code>services/fraud-risk-scorer</code> 마이크로서비스를 부를지 고른다.</p>
        <pre><code>{`@ConfigurationProperties(prefix = "fraud-scorer")
data class FraudScorerProperties(
    val mode: String = "native",
    val baseUrl: String = "http://localhost:8000",
) {
    val isHttpMode: Boolean get() = mode == "http"
}`}</code></pre>
        <p>HTTP 구현체는 fail open으로 동작한다. 네트워크 오류가 나거나, 응답이 2xx가 아니거나, 응답 형식이 깨져 있으면 환불을 막지 않고 점수 <code>0.0</code>을 돌려준다.</p>
        <pre><code>{`override fun score(features: RefundRiskFeatures): Double =
    try {
        val response = httpClient.send(buildRequest(features), HttpResponse.BodyHandlers.ofString())
        if (response.statusCode() !in 200..299) FALLBACK_SCORE else parseScore(response.body()) ?: FALLBACK_SCORE
    } catch (e: Exception) {
        // A scoring failure is a technical-infrastructure concern, not a domain error — it must
        // never block a refund request. Swallow it here at the boundary and fall back.
        FALLBACK_SCORE
    }`}</code></pre>
        <h2>임계값은 둘, 결정은 한 곳에서</h2>
        <p><code>RefundEligibilityService</code>는 두 신호를 따로따로 받고, 신호마다 임계값도 따로 둔다. 두 Technical Service는 서로가 있는지도 모른다.</p>
        <pre><code>{`companion object {
    private const val FRAUD_RISK_REJECTION_THRESHOLD = 0.7      // from RefundReasonClassifier (LLM)
    private const val ML_FRAUD_RISK_REJECTION_THRESHOLD = 0.8   // from RefundFraudRiskScorer (history model)
}

fun evaluate(payment: Payment, refund: Refund, classification: RefundReasonClassification, mlFraudRiskScore: Double): RefundDecision {
    // ...
    if (mlFraudRiskScore >= ML_FRAUD_RISK_REJECTION_THRESHOLD) {
        return RefundDecision(approved = false, reason = "This refund pattern was flagged as high risk by the fraud-risk model and requires manual review.")
    }
    return RefundDecision(approved = true)
}`}</code></pre>
        <p>두 숫자가 만나는 곳은 Domain Service 하나뿐이다. 그 숫자가 무슨 뜻인지 정하는 곳도 여기뿐이다.</p>
        <h2>테스트끼리 owner를 나눠 써서 생긴 버그</h2>
        <p>fixture를 공유하는 E2E 스위트에 이력 기반 scorer를 넣자, 저장소의 엉뚱한 곳에서 테스트가 깨졌다. 가끔 깨지는 flaky 테스트가 아니었고, 매번 똑같이 깨졌다. 여러 테스트 메서드가 Testcontainers Postgres 하나에 같은 owner ID를 썼는데, 테스트마다 데이터를 비우지 않았다. 그래서 뒤에 도는 테스트가 앞 테스트에서 거절된 환불 이력을 물려받았다. native 점수가 0.8 임계값을 넘었고, 멀쩡한 환불이 고위험으로 분류됐다.</p>
        <p>이 문제를 만난 언어별 구현은 2개였고, 고친 방법은 서로 달랐다. 같은 기법으로 고쳤다고 뭉뚱그리면 틀리니 따로 적는다. java-springboot는 E2E 스위트 전체를 HTTP 모드로 돌리고 주소를 닿지 않는 곳으로 박았다. 그러면 모든 테스트에서 점수가 늘 <code>0</code>으로 폴백된다. nestjs는 스위트의 나머지에서는 native 점수 계산을 그대로 두고, 문제가 난 테스트 하나에만 전용 owner ID를 줬다. 고친 범위는 더 좁지만 원인은 같다.</p>
        <div className="article-note"><strong>flaky처럼 보여도 매번 깨진다</strong><p>둘은 구분해야 한다. flaky 테스트는 테스트하는 코드와 상관없는 이유로, 언제 깨질지 모르게 깨진다. 이번 실패는 매번 같은 순서로, 같은 이유로 났다. 앞 테스트들이 쌓아 둔 상태가 뒤 테스트의 입력을 바꾼 것이다. 겉모습만 flaky인 테스트 격리 버그다. 실패하면 다시 돌리는 설정으로 덮기 전에, 격리부터 의심해 보는 게 낫다.</p></div>
        <div className="article-note"><strong>저장소에서 더 볼 것</strong><p>
          <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/docs/architecture/domain-service.md" target="_blank" rel="noreferrer">docs/architecture/domain-service.md</a>(Technical Service 패턴. 이 예시는 나중에 바뀌었다. 위 정정 참고) · <a href="https://github.com/kyhsa93/backend-service-playbook/blob/0473a4140ecb3fc3446fbbc847ab9a136e984f43/implementations/kotlin-springboot/examples/src/main/kotlin/com/example/accountservice/payment/infrastructure/RefundFraudRiskScorerNativeImpl.kt" target="_blank" rel="noreferrer">RefundFraudRiskScorerNativeImpl.kt</a>(지우기 직전 커밋에 고정한 학습·점수 계산 코드)
        </p></div>
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
