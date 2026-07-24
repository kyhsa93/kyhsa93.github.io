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
        <h2>The Interface, and Two Implementations Behind It</h2>
        <pre><code>{`interface RefundFraudRiskScorer {
    fun score(features: RefundRiskFeatures): Double
}`}</code></pre>
        <p>Two classes implement it, selected by config rather than by the caller — <code>RequestRefundService</code> depends only on the interface and never knows which one is live.</p>
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
        <p>The fixed random seed matters here: the generated dataset — and therefore the trained weights — is identical on every run. It's explicitly a stand-in; the interface is what matters, not the model's actual predictive power.</p>
        <h2>Swappable by Config, Not by Rewrite</h2>
        <p>The same native/HTTP toggle already used for the LLM classifier shows up here too — a config property picks between an in-process computation and a call to the shared <code>services/fraud-risk-scorer</code> microservice:</p>
        <pre><code>{`@ConfigurationProperties(prefix = "fraud-scorer")
data class FraudScorerProperties(
    val mode: String = "native",
    val baseUrl: String = "http://localhost:8000",
) {
    val isHttpMode: Boolean get() = mode == "http"
}`}</code></pre>
        <p>The HTTP implementation fails open — any network error, non-2xx, or malformed response returns a score of <code>0.0</code> rather than blocking the refund:</p>
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
        <p>Adding a history-aware scorer to an E2E suite with shared test fixtures created a real, deterministic failure elsewhere in this repo — not a flaky one. Multiple test methods reusing the same owner ID against a Testcontainers Postgres instance (no per-test reset) meant later tests inherited rejected-refund history from earlier ones, pushing the native score past the 0.8 threshold and misclassifying a legitimately valid refund as high-risk.</p>
        <p>The two ports that hit this fixed it two different ways, worth naming precisely rather than claiming one shared technique. The java-springboot port forces its entire E2E suite into HTTP mode against an unreachable address, so scoring deterministically falls back to <code>0</code> for every test. The nestjs port instead left native scoring live for the rest of the suite and gave only the one affected test its own dedicated owner ID — a narrower fix, same underlying cause.</p>
        <div className="article-note"><strong>Deterministic, not flaky</strong><p>It's worth naming the difference: a flaky test fails unpredictably for reasons unrelated to the code under test. This failure happened every time, in the same order, for the same reason — accumulated state from earlier tests changing the input to a later one. That's a test-isolation bug wearing a "flaky test" costume, and it's worth looking twice before reaching for a retry-on-failure fix instead of an isolation fix.</p></div>
        <div className="article-note"><strong>Further reading in the repo</strong><p>
          <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/docs/architecture/domain-service.md" target="_blank" rel="noreferrer">docs/architecture/domain-service.md</a> — RefundFraudRiskScorer as the second Technical Service example, right after the LLM classifier · <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/implementations/kotlin-springboot/examples/src/main/kotlin/com/example/accountservice/payment/infrastructure/RefundFraudRiskScorerNativeImpl.kt" target="_blank" rel="noreferrer">RefundFraudRiskScorerNativeImpl.kt</a> — the real training/scoring code
        </p></div>
      </>
    ),
  },
  ko: {
    kicker: 'Machine Learning · Architecture',
    title: (
      <>
        두 번째 사기 신호:<br /><em>이력을 읽는 게 아니라 점수로 매긴다</em>
      </>
    ),
    lede: 'RefundReasonClassifier는 고객이 뭐라고 말했는지를 읽는다. RefundFraudRiskScorer는 고객이 실제로 뭘 했는지 — 환불 횟수, 거절 비율, 금액 비율, 결제 후 경과 시간 — 를 본다. 그리고 classifier와 마찬가지로, 여전히 최종 결정권은 없다.',
    body: (
      <>
        <p>이제 두 개의 Technical Service가 <code>RefundEligibilityService</code>에 신호를 공급하는데, 둘은 의도적으로 서로 다른 형태의 "머신러닝"이다. <code>RefundReasonClassifier</code>는 자유 텍스트를 읽는 LLM이다. <code>RefundFraudRiskScorer</code>는 구조화된 숫자를 읽는, 직접 만든 로지스틱 회귀다 — 기본값으로는 LLM도, 외부 API도 없이 네 개의 feature와 시그모이드만 있다.</p>
        <h2>인터페이스, 그리고 그 뒤의 두 구현체</h2>
        <pre><code>{`interface RefundFraudRiskScorer {
    fun score(features: RefundRiskFeatures): Double
}`}</code></pre>
        <p>두 개의 클래스가 이 인터페이스를 구현하며, 선택은 호출자가 아니라 설정(config)이 한다 — <code>RequestRefundService</code>는 오직 인터페이스에만 의존하고, 어느 쪽이 실제로 동작하고 있는지 전혀 알지 못한다.</p>
        <h2>Feature 벡터</h2>
        <p>모델이 보는 모든 값은 요청자 본인의 이력에서 나오며, Application 계층이 Payment와 Refund Aggregate, 그리고 repository 요약 쿼리로부터 조립한다:</p>
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
        <h2>의도적으로 placeholder 위에서 학습시킨다</h2>
        <p>이 예제 저장소 뒤에는 실제 사용자 기반이 없으므로, 학습시킬 실제 사기 심사 이력 데이터도 없다. native 구현체는 생성 시점에 한 번, 시드가 고정된 합성 데이터셋과 의도적으로 단순한 ground-truth 규칙으로 스스로 학습한다:</p>
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
        <p>평범한 배치 경사하강법, 가중치 네 개와 bias 하나, ML 라이브러리는 없다:</p>
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
        <p>여기서 고정된 랜덤 시드가 중요하다: 생성되는 데이터셋과 거기서 학습되는 가중치는 실행할 때마다 동일하다. 이건 명시적으로 대역(stand-in)일 뿐이며, 중요한 건 모델의 실제 예측 성능이 아니라 인터페이스 그 자체다.</p>
        <h2>다시 쓰지 않고, 설정으로 교체 가능하게</h2>
        <p>LLM classifier에 이미 쓰인 것과 같은 native/HTTP 토글이 여기서도 등장한다 — 설정 프로퍼티 하나가 프로세스 내부 계산과 공유 <code>services/fraud-risk-scorer</code> 마이크로서비스 호출 중 하나를 고른다:</p>
        <pre><code>{`@ConfigurationProperties(prefix = "fraud-scorer")
data class FraudScorerProperties(
    val mode: String = "native",
    val baseUrl: String = "http://localhost:8000",
) {
    val isHttpMode: Boolean get() = mode == "http"
}`}</code></pre>
        <p>HTTP 구현체는 fail open이다 — 네트워크 오류, 2xx가 아닌 응답, 형식이 잘못된 응답이 오면 환불을 막는 대신 점수 <code>0.0</code>을 반환한다:</p>
        <pre><code>{`override fun score(features: RefundRiskFeatures): Double =
    try {
        val response = httpClient.send(buildRequest(features), HttpResponse.BodyHandlers.ofString())
        if (response.statusCode() !in 200..299) FALLBACK_SCORE else parseScore(response.body()) ?: FALLBACK_SCORE
    } catch (e: Exception) {
        // A scoring failure is a technical-infrastructure concern, not a domain error — it must
        // never block a refund request. Swallow it here at the boundary and fall back.
        FALLBACK_SCORE
    }`}</code></pre>
        <h2>두 개의 임계값, 하나의 결정</h2>
        <p><code>RefundEligibilityService</code>는 두 신호를 서로 독립적인 값으로 받아들이며, 각각 자기만의 임계값을 가지고, 어느 Technical Service도 다른 하나의 존재를 알지 못한다:</p>
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
        <p>이 두 숫자가 만나는 유일한 곳이 Domain Service이며, 그 둘이 무엇을 의미하는지 결정하는 곳도 여전히 여기뿐이다.</p>
        <h2>테스트 소유자를 공유해서 생긴 버그</h2>
        <p>공유 테스트 fixture를 쓰는 E2E 스위트에 이력 기반 scorer를 추가하자, 이 저장소의 다른 곳에서 실제로 결정론적인 실패가 발생했다 — 우연히 가끔 실패하는 flaky 테스트가 아니었다. Testcontainers Postgres 인스턴스에 대해 여러 테스트 메서드가 같은 owner ID를 재사용했고(테스트별 리셋이 없었다), 그 결과 나중 테스트들이 앞선 테스트들의 거절된 환불 이력을 그대로 물려받아 native 점수가 0.8 임계값을 넘겨버렸고, 정상적으로 유효한 환불을 고위험으로 잘못 분류했다.</p>
        <p>이 문제에 부딪힌 두 포트는 서로 다른 두 가지 방식으로 고쳤는데, 하나의 공통 기법이었다고 뭉뚱그리기보다 정확히 이름을 붙일 가치가 있다. java-springboot 포트는 전체 E2E 스위트를 도달 불가능한 주소를 향한 HTTP 모드로 강제해서, 모든 테스트에서 점수가 결정론적으로 <code>0</code>으로 폴백되게 만들었다. nestjs 포트는 대신 스위트의 나머지 부분에는 native scoring을 그대로 살려두고, 영향을 받은 그 하나의 테스트에만 전용 owner ID를 부여했다 — 더 좁은 범위의 수정이지만, 근본 원인은 동일하다.</p>
        <div className="article-note"><strong>Flaky가 아니라 결정론적</strong><p>이 차이는 짚고 넘어갈 가치가 있다: flaky 테스트는 테스트 대상 코드와 무관한 이유로 예측 불가능하게 실패한다. 이 실패는 매번, 같은 순서로, 같은 이유로 일어났다 — 앞선 테스트들에서 누적된 상태가 뒤따르는 테스트의 입력을 바꿔버린 것이다. 이건 "flaky 테스트"라는 옷을 입은 테스트 격리(test-isolation) 버그이며, retry-on-failure로 땜질하기 전에 격리 문제부터 다시 한번 살펴볼 가치가 있다.</p></div>
        <div className="article-note"><strong>저장소 내 추가 자료</strong><p>
          <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/docs/architecture/domain-service.md" target="_blank" rel="noreferrer">docs/architecture/domain-service.md</a> — LLM classifier 바로 다음에 나오는 두 번째 Technical Service 예시로서의 RefundFraudRiskScorer · <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/implementations/kotlin-springboot/examples/src/main/kotlin/com/example/accountservice/payment/infrastructure/RefundFraudRiskScorerNativeImpl.kt" target="_blank" rel="noreferrer">RefundFraudRiskScorerNativeImpl.kt</a> — 실제 학습/스코어링 코드
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
