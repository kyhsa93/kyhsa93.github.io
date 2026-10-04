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
        An ML Score With Nothing to Train On:<br /><em>Plug It In, Don't Let It Decide</em>
      </>
    ),
    lede: "A machine-learning risk score can sit next to a rule-based refund decision even when there are no real outcomes to train it on. Put it behind an interface, pick the implementation by config, fail open when it breaks, and leave the decision to the domain rule. The scorer below was wired that way, and has since been removed.",
    body: (
      <>
        <div className="article-note"><strong>Update — 2026.07.26</strong><p><code>RefundFraudRiskScorer</code> described below has since been removed too. It didn't share the flaw covered in <a href="/posts/the-fraud-signal-that-trusted-the-fraudster">The Fraud Signal That Trusted the Fraudster</a> (the requester's own history isn't something they can rewrite on request); it went as a separate simplification decision made at the same time. <code>RefundEligibilityService</code> now carries no fraud-risk judgment of any kind. The source link at the bottom of this post now points to the last commit where the file still existed.</p></div>
        <p>The problem was adding a fraud-risk score to a refund decision with no history of real fraud reviews to learn from. In my example project that implements the same backend design in five languages side by side, refund approval was decided by a rule-based Domain Service, <code>RefundEligibilityService</code>. The scorer I put next to it, <code>RefundFraudRiskScorer</code>, was a hand-rolled logistic regression reading structured numbers from the requester's history: refund count, rejection rate, amount ratio, and time since payment. By default there was no LLM and no external API, just four features and a sigmoid.</p>
        <p>It was the second of two Technical Services feeding that Domain Service, and the two were deliberately different shapes of "machine learning." The other, <code>RefundReasonClassifier</code>, was an LLM reading what the customer wrote as a reason. Neither one got the final vote.</p>
        <h2>Put the Score Behind an Interface</h2>
        <pre><code>{`interface RefundFraudRiskScorer {
    fun score(features: RefundRiskFeatures): Double
}`}</code></pre>
        <p>Two classes implemented it, selected by config rather than by the caller. <code>RequestRefundService</code> depended only on the interface and never knew which one was live.</p>
        <h2>Features From the Requester's Own History</h2>
        <p>Everything the model saw came from the requester's own history, assembled by the Application layer from the Payment and Refund Aggregates plus a repository summary query:</p>
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
        <h2>With No Data, Train on a Placeholder</h2>
        <p>An example project has no real users, so there was no real historical fraud-review outcome to train against. The native implementation trained itself once, at construction, against a synthetic seeded dataset and a deliberately simple ground-truth rule:</p>
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
        <p>The fixed random seed mattered here: the generated dataset, and therefore the trained weights, came out identical on every run. The model was explicitly a stand-in; the interface was what mattered, not its predictive power.</p>
        <h2>Swap It by Config, Fail Open When It Breaks</h2>
        <p>The same native/HTTP toggle already used for the LLM classifier showed up here too. A config property picked between an in-process computation and a call to the shared <code>services/fraud-risk-scorer</code> microservice:</p>
        <pre><code>{`@ConfigurationProperties(prefix = "fraud-scorer")
data class FraudScorerProperties(
    val mode: String = "native",
    val baseUrl: String = "http://localhost:8000",
) {
    val isHttpMode: Boolean get() = mode == "http"
}`}</code></pre>
        <p>The HTTP implementation failed open. Any network error, non-2xx, or malformed response returned a score of <code>0.0</code> rather than blocking the refund:</p>
        <pre><code>{`override fun score(features: RefundRiskFeatures): Double =
    try {
        val response = httpClient.send(buildRequest(features), HttpResponse.BodyHandlers.ofString())
        if (response.statusCode() !in 200..299) FALLBACK_SCORE else parseScore(response.body()) ?: FALLBACK_SCORE
    } catch (e: Exception) {
        // A scoring failure is a technical-infrastructure concern, not a domain error — it must
        // never block a refund request. Swallow it here at the boundary and fall back.
        FALLBACK_SCORE
    }`}</code></pre>
        <h2>Let the Domain Rule Decide</h2>
        <p><code>RefundEligibilityService</code> took both signals as independent values, each with its own threshold, and neither Technical Service knew the other existed:</p>
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
        <p>The Domain Service was the only place both numbers met, and the only place that decided what they meant.</p>
        <h2>A History-Based Score Makes Tests Share State</h2>
        <p>Adding a history-aware scorer to an E2E suite with shared test fixtures created a deterministic failure in unrelated tests, not a flaky one. Multiple test methods reusing the same owner ID against a Testcontainers Postgres instance (no per-test reset) meant later tests inherited rejected-refund history from earlier ones, pushing the native score past the 0.8 threshold and misclassifying a legitimately valid refund as high-risk.</p>
        <p>The two language implementations that hit this fixed it two different ways, and it's worth naming both rather than claiming one shared technique. The java-springboot implementation forced its entire E2E suite into HTTP mode against an unreachable address, so scoring deterministically fell back to <code>0</code> for every test. The nestjs implementation instead left native scoring live for the rest of the suite and gave only the one affected test its own dedicated owner ID. That's a narrower fix for the same underlying cause.</p>
        <div className="article-note"><strong>Deterministic, not flaky</strong><p>It's worth naming the difference: a flaky test fails unpredictably for reasons unrelated to the code under test. This failure happened every time, in the same order, for the same reason: accumulated state from earlier tests changing the input to a later one. That's a test-isolation bug wearing a "flaky test" costume, and it's worth looking twice before reaching for a retry-on-failure fix instead of an isolation fix.</p></div>
        <div className="article-note"><strong>Further reading</strong><p>
          <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/docs/architecture/domain-service.md" target="_blank" rel="noreferrer">docs/architecture/domain-service.md</a> (the Technical Service pattern in my example project that implements the same backend design in five languages; the example in this post has since been replaced there, see the update note above) · <a href="https://github.com/kyhsa93/backend-service-playbook/blob/0473a4140ecb3fc3446fbbc847ab9a136e984f43/implementations/kotlin-springboot/examples/src/main/kotlin/com/example/accountservice/payment/infrastructure/RefundFraudRiskScorerNativeImpl.kt" target="_blank" rel="noreferrer">RefundFraudRiskScorerNativeImpl.kt</a> (the training and scoring code as it existed, pinned to the last commit before removal)
        </p></div>
      </>
    ),
  },
  ko: {
    kicker: 'Machine Learning · Architecture',
    title: (
      <>
        학습할 데이터가 없는 ML 점수는<br /><em>끼워 넣되 결정은 맡기지 않는다</em>
      </>
    ),
    lede: '학습에 쓸 실제 결과 데이터가 없어도 ML 위험 점수를 규칙 기반 환불 판정 옆에 붙일 수는 있다. 인터페이스 뒤에 두고, 구현은 설정으로 고르고, 실패하면 막지 않고 통과시키고, 결정은 도메인 규칙에 남기면 된다. 아래 scorer가 그렇게 붙어 있었고, 지금은 지웠다.',
    body: (
      <>
        <div className="article-note"><strong>정정(2026.07.26)</strong><p>이 글의 <code>RefundFraudRiskScorer</code>도 나중에 지웠다. <a href="/posts/the-fraud-signal-that-trusted-the-fraudster">사기꾼을 그대로 믿은 사기 탐지 신호</a>에서 다룬 결함 때문은 아니다. 요청자 본인의 이력은 요청할 때 마음대로 고쳐 쓸 수 있는 값이 아니다. 같은 때에 따로 내린 단순화 결정으로 함께 빠졌다. 이제 <code>RefundEligibilityService</code>에는 사기 여부를 따지는 판단이 하나도 없다. 글 아래쪽 소스 링크는 이 파일이 마지막으로 남아 있던 커밋을 가리킨다.</p></div>
        <p>풀어야 했던 문제는 이랬다. 학습에 쓸 실제 사기 심사 이력이 없는데, 환불 판정에 사기 위험 점수를 붙이고 싶었다. 같은 백엔드 설계를 5개 언어로 나란히 구현해 둔 내 예제 프로젝트에서, 환불 승인은 규칙 기반 Domain Service인 <code>RefundEligibilityService</code>가 정했다. 그 옆에 붙인 <code>RefundFraudRiskScorer</code>는 직접 짠 로지스틱 회귀였다. 요청자의 이력에서 나온 정형 숫자를 읽었다. 환불 횟수, 거절 비율, 금액 비율, 결제 뒤 지난 시간이다. 기본 설정에서는 LLM도 외부 API도 쓰지 않았다. feature 4개와 시그모이드가 전부였다.</p>
        <p>그 Domain Service에 신호를 넣는 Technical Service 중 두 번째였고, 둘 다 "머신러닝"이지만 일부러 모양을 다르게 했다. 다른 하나인 <code>RefundReasonClassifier</code>는 고객이 적은 환불 사유를 읽는 LLM이었다. 둘 다 최종 결정은 내리지 않았다.</p>
        <h2>점수는 인터페이스 뒤에 둔다</h2>
        <pre><code>{`interface RefundFraudRiskScorer {
    fun score(features: RefundRiskFeatures): Double
}`}</code></pre>
        <p>이 인터페이스를 구현한 클래스가 2개 있었고, 어느 쪽을 쓸지는 호출하는 쪽이 아니라 설정이 정했다. <code>RequestRefundService</code>는 인터페이스만 알았고, 지금 어느 구현체가 돌고 있는지는 몰랐다.</p>
        <h2>feature는 요청자 본인의 이력에서</h2>
        <p>모델이 보는 값은 모두 요청자 본인의 이력에서 나왔다. Application 계층이 Payment와 Refund Aggregate, repository 요약 쿼리에서 값을 모아 다음처럼 조립했다.</p>
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
        <h2>데이터가 없으면 대역으로 학습한다</h2>
        <p>예제 프로젝트에는 실제 사용자가 없고, 그러니 학습에 쓸 사기 심사 결과도 없었다. 그래서 native 구현체는 생성될 때 한 번 스스로 학습했다. 시드를 고정한 합성 데이터셋에, 일부러 단순하게 만든 정답 규칙을 붙였다.</p>
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
        <p>학습은 평범한 배치 경사하강법이었다. 가중치 4개에 bias 하나이고, ML 라이브러리는 쓰지 않았다.</p>
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
        <p>랜덤 시드를 고정해 둔 게 중요했다. 그래야 생성되는 데이터셋도, 거기서 나오는 가중치도 매번 같다. 이 모델은 대역이라고 분명히 해 두었다. 보여 주려던 건 예측 성능보다 인터페이스였다.</p>
        <h2>설정으로 바꾸고, 고장 나면 통과시킨다</h2>
        <p>LLM classifier에 쓴 native/HTTP 토글을 여기서도 그대로 썼다. 설정 프로퍼티 하나로 프로세스 안에서 계산할지, 공용 <code>services/fraud-risk-scorer</code> 마이크로서비스를 부를지 골랐다.</p>
        <pre><code>{`@ConfigurationProperties(prefix = "fraud-scorer")
data class FraudScorerProperties(
    val mode: String = "native",
    val baseUrl: String = "http://localhost:8000",
) {
    val isHttpMode: Boolean get() = mode == "http"
}`}</code></pre>
        <p>HTTP 구현체는 fail open으로 동작했다. 네트워크 오류가 나거나, 응답이 2xx가 아니거나, 응답 형식이 깨져 있으면 환불을 막지 않고 점수 <code>0.0</code>을 돌려줬다.</p>
        <pre><code>{`override fun score(features: RefundRiskFeatures): Double =
    try {
        val response = httpClient.send(buildRequest(features), HttpResponse.BodyHandlers.ofString())
        if (response.statusCode() !in 200..299) FALLBACK_SCORE else parseScore(response.body()) ?: FALLBACK_SCORE
    } catch (e: Exception) {
        // A scoring failure is a technical-infrastructure concern, not a domain error — it must
        // never block a refund request. Swallow it here at the boundary and fall back.
        FALLBACK_SCORE
    }`}</code></pre>
        <h2>결정은 도메인 규칙이 한다</h2>
        <p><code>RefundEligibilityService</code>는 두 신호를 따로따로 받았고, 신호마다 임계값도 따로 뒀다. 두 Technical Service는 서로가 있는지도 몰랐다.</p>
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
        <p>두 숫자가 만나는 곳은 Domain Service 하나뿐이었다. 그 숫자가 무슨 뜻인지 정하는 곳도 여기뿐이었다.</p>
        <h2>이력 기반 점수는 테스트끼리 상태를 나눠 쓰게 만든다</h2>
        <p>fixture를 공유하는 E2E 스위트에 이력 기반 scorer를 넣자, 상관없는 테스트가 깨졌다. 가끔 깨지는 flaky 테스트가 아니었고, 매번 똑같이 깨졌다. 여러 테스트 메서드가 Testcontainers Postgres 하나에 같은 owner ID를 썼는데, 테스트마다 데이터를 비우지 않았다. 그래서 뒤에 도는 테스트가 앞 테스트에서 거절된 환불 이력을 물려받았다. native 점수가 0.8 임계값을 넘었고, 멀쩡한 환불이 고위험으로 분류됐다.</p>
        <p>이 문제를 만난 언어별 구현은 2개였고, 고친 방법은 서로 달랐다. 같은 기법으로 고쳤다고 뭉뚱그리면 틀리니 따로 적는다. java-springboot는 E2E 스위트 전체를 HTTP 모드로 돌리고 주소를 닿지 않는 곳으로 박았다. 그러면 모든 테스트에서 점수가 늘 <code>0</code>으로 폴백됐다. nestjs는 스위트의 나머지에서는 native 점수 계산을 그대로 두고, 문제가 난 테스트 하나에만 전용 owner ID를 줬다. 고친 범위는 더 좁지만 원인은 같다.</p>
        <div className="article-note"><strong>flaky처럼 보여도 매번 깨진다</strong><p>둘은 구분해야 한다. flaky 테스트는 테스트하는 코드와 상관없는 이유로, 언제 깨질지 모르게 깨진다. 이번 실패는 매번 같은 순서로, 같은 이유로 났다. 앞 테스트들이 쌓아 둔 상태가 뒤 테스트의 입력을 바꾼 것이다. 겉모습만 flaky인 테스트 격리 버그다. 실패하면 다시 돌리는 설정으로 덮기 전에, 격리부터 의심해 보는 게 낫다.</p></div>
        <div className="article-note"><strong>더 볼 자료</strong><p>
          <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/docs/architecture/domain-service.md" target="_blank" rel="noreferrer">docs/architecture/domain-service.md</a>(같은 백엔드 설계를 5개 언어로 구현해 둔 내 예제 프로젝트의 Technical Service 패턴 문서. 이 글의 예시는 그 뒤 다른 것으로 바뀌었다. 위 정정 참고) · <a href="https://github.com/kyhsa93/backend-service-playbook/blob/0473a4140ecb3fc3446fbbc847ab9a136e984f43/implementations/kotlin-springboot/examples/src/main/kotlin/com/example/accountservice/payment/infrastructure/RefundFraudRiskScorerNativeImpl.kt" target="_blank" rel="noreferrer">RefundFraudRiskScorerNativeImpl.kt</a>(지우기 직전 커밋에 고정한 학습·점수 계산 코드)
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
