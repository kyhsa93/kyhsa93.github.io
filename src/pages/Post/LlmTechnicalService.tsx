import PostLayout from '../../components/PostLayout';
import { useLocale, localeFromPathname } from '../../lib/locale';
import type { MetaFunction } from 'react-router';
import { createPostMeta } from '../../lib/seo';

export const meta: MetaFunction = ({ location }) =>
  createPostMeta('llm-technical-service', localeFromPathname(location.pathname));

const content = {
  en: {
    kicker: 'LLM · Architecture',
    title: (
      <>
        Wiring an LLM Into a Domain Service<br /><em>— Without Letting It Make the Call</em>
      </>
    ),
    lede: 'An LLM is a good fraud-classification signal and a bad final judge. Let it read a free-text refund reason and hand back a category, and keep the decision in a Domain Service that never calls it and never knows an LLM produced the value. Then the model behind it can change without touching the rule.',
    body: (
      <>
        <div className="article-note"><strong>Update — 2026.07.26</strong><p><code>RefundReasonClassifier</code> described below has since been removed. The free-text <code>reason</code> it classified was fully controlled by the same person requesting the refund: a fraud signal that trusted the fraudster. The full story, and the principle it left behind, is in <a href="/posts/the-fraud-signal-that-trusted-the-fraudster">The Fraud Signal That Trusted the Fraudster</a>. The source link at the bottom of this post now points to the last commit where the file still existed.</p></div>
        <p>When an LLM goes into a business decision, where should its output stop? The temptation is to let it own the decision: classify the reason, and if it says "fraud," reject the refund right there. That collapses two different kinds of code into one: a Technical Service that talks to an external system, and a Domain Service that owns a business rule. Kept apart, the model only produces a value and the threshold stays in plain domain code. When the model behind it later moved from the Claude API to a self-hosted one, nothing outside Infrastructure changed.</p>
        <p>The code below is from a refund flow in my example project that implements the same backend design in five languages side by side. It's the Go version; the other four keep the same split.</p>
        <h2>An LLM Is a Signal, Not a Judge</h2>
        <p><code>RefundReasonClassifier</code> is a Technical Service port, an Application-layer interface defined in the minimal shape its one consumer needs. The real implementation lives in Infrastructure:</p>
        <pre><code>{`// RefundReasonClassifier is a Technical Service port (domain-service.md)
// abstracting an LLM call that classifies a refund's free-text reason.
//
// Classify has no error return by contract: on any failure (API error,
// malformed output, network error) the real implementation must log a
// warning and return a neutral fallback classification rather than
// propagating an error — a classification outage must never block a
// refund request.
type RefundReasonClassifier interface {
	Classify(ctx context.Context, reason string) payment.RefundReasonClassification
}`}</code></pre>
        <p>Its job ends at producing a classification. It has no opinion about what should happen next; that's not its layer's concern.</p>
        <h2>The Domain Service Still Decides</h2>
        <p><code>EvaluateRefundEligibility</code> is a plain package function (no framework dependency, no DI container involved, since Go has none), and it never imports or calls the classifier. It receives an already-computed <code>classification</code> as a value, alongside a second, history-based fraud score, and applies its own fixed threshold:</p>
        <pre><code>{`const fraudRiskRejectionThreshold = 0.7

func EvaluateRefundEligibility(p *Payment, r *Refund, classification RefundReasonClassification, mlFraudRiskScore float64) RefundDecision {
	if p.Status != StatusCompleted {
		return RefundDecision{Approved: false, Reason: ErrRefundRequiresCompletedPayment.Error()}
	}
	if r.Amount > p.Amount {
		return RefundDecision{Approved: false, Reason: ErrRefundAmountExceedsPayment.Error()}
	}
	if classification.Category == RefundReasonFraudSuspected && classification.FraudRiskScore >= fraudRiskRejectionThreshold {
		return RefundDecision{Approved: false, Reason: ErrRefundFlaggedHighFraudRisk.Error()}
	}
	// ...
}`}</code></pre>
        <p>Everything upstream of that function call (the LLM API request, the prompt, the retry policy) is invisible to it. The Application layer is what wires the two together:</p>
        <pre><code>{`classification := h.classifier.Classify(ctx, cmd.Reason)
// ...
decision := payment.EvaluateRefundEligibility(p, r, classification, mlFraudRiskScore)`}</code></pre>
        <p>That's the whole point of the split: the fraud-rejection threshold (<code>0.7</code>) is a business rule, testable with plain structs and no network calls. Swap the LLM provider, the prompt, even the whole classification approach, and this function doesn't change.</p>
        <h2>Keeping Config Out of Business Code</h2>
        <p>Building the classifier's Infrastructure implementation needed a model name and an API endpoint, resolved through the same convention as every other env-dependent value in the service. Nothing outside the <code>config</code> package touches <code>os.Getenv</code> directly.</p>
        <pre><code>{`const defaultRefundClassifierModel = "qwen2.5:1.5b"
const defaultOllamaBaseURL = "http://localhost:11434"

// RefundClassifierModel returns the model id RefundReasonClassifierImpl uses,
// overridable via REFUND_CLASSIFIER_MODEL. All raw env var access for this
// feature is encapsulated here (never read directly inside
// domain/application/infrastructure code — config.md).
func RefundClassifierModel() string {
	if v := os.Getenv("REFUND_CLASSIFIER_MODEL"); v != "" {
		return v
	}
	return defaultRefundClassifierModel
}`}</code></pre>
        <h2>Then the Backend Changed</h2>
        <p>The classifier originally called the real Claude API via <code>github.com/anthropics/anthropic-sdk-go</code>. Later, the backend moved to a self-hosted Ollama model: no vendor API key, no per-request cost, running on the same infrastructure as everything else. The Infrastructure implementation swapped SDK calls for a plain <code>net/http</code> request to Ollama's native <code>/api/chat</code> endpoint, and the config changed to:</p>
        <pre><code>{`const defaultRefundClassifierModel = "qwen2.5:1.5b"
const defaultOllamaBaseURL = "http://localhost:11434"`}</code></pre>
        <div className="article-note"><strong>Why 1.5b and not the smaller 0.5b</strong><p>The smallest model in the family was tried first. Live-tested directly against Ollama, it misclassified a plain "charged twice, refund the duplicate" complaint as <code>fraud_suspected</code> with a fraud-risk score of <code>1.0</code>, which would have incorrectly rejected a legitimate refund at the <code>0.7</code> threshold. 1.5B parameters was the smallest size that got this case right.</p></div>
        <h2>What Had to Change (Almost Nothing)</h2>
        <p>The Domain Service, the Technical Service interface, and the unit tests for both were untouched by the swap. Only the Infrastructure implementation and the two config functions changed. That's the architecture doing its job: nothing outside Infrastructure knew or cared that an LLM was involved at all, let alone which one.</p>
        <p>One honest caveat, specific to Go: the Go implementation has no DI container, so the E2E test bootstrap wires the classifier's concrete constructor by hand. The swap needed a one-line update to that constructor call (model name and base URL) in the test setup. That's test <em>wiring</em>, not test <em>logic</em>; no assertion changed. In the languages with a DI container to do that wiring implicitly, the swap touched zero test files; Go's version of "almost nothing changed" comes with one small, honest asterisk.</p>
        <div className="article-note"><strong>Further reading</strong><p>
          <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/docs/architecture/domain-service.md" target="_blank" rel="noreferrer">docs/architecture/domain-service.md</a> (the Technical Service / Domain Service split in my example project that implements the same backend design in five languages; it now uses a different worked example, see the update note above) · <a href="https://github.com/kyhsa93/backend-service-playbook/blob/22107f887cacc7735d6709e21d1967d024ee790d/implementations/go/examples/internal/infrastructure/llm/refund_reason_classifier.go" target="_blank" rel="noreferrer">refund_reason_classifier.go</a> (the Ollama-backed implementation as it existed, pinned to the last commit before removal) · <a href="/posts/refund-fraud-risk-scorer">An ML Score With Nothing to Train On</a> (the history-based score that sat next to this classifier, and how to plug in a model with no data to train it)
        </p></div>
      </>
    ),
  },
  ko: {
    kicker: 'LLM · Architecture',
    title: (
      <>
        Domain Service에 LLM을 붙이되<br /><em>판단은 넘기지 않는다</em>
      </>
    ),
    lede: 'LLM은 부정 사용을 가려내는 신호로는 쓸 만하지만, 최종 판단을 맡기기엔 믿을 수 없다. 사용자가 적은 환불 사유를 LLM이 읽고 카테고리만 돌려주게 하고, 결정은 Domain Service에 둔다. Domain Service는 분류기를 부르지 않고, 받은 값이 LLM에서 나왔다는 것도 모른다. 그러면 뒤의 모델을 바꿔도 규칙은 그대로다.',
    body: (
      <>
        <div className="article-note"><strong>정정(2026.07.26)</strong><p>이 글에서 다루는 <code>RefundReasonClassifier</code>는 그 뒤에 지웠다. 분류 대상인 <code>reason</code>은 환불을 요청하는 사람이 마음대로 적는 글이었다. 사기꾼이 쓴 글을 믿고 사기를 가려내려 한 셈이다. 자세한 경위와 거기서 얻은 원칙은 <a href="/posts/the-fraud-signal-that-trusted-the-fraudster">사기꾼을 그대로 믿은 사기 탐지 신호</a>에 따로 적었다. 글 아래쪽 소스 링크는 이 파일이 마지막으로 남아 있던 커밋을 가리키도록 바꿨다.</p></div>
        <p>비즈니스 판단에 LLM을 넣을 때, LLM의 출력은 어디까지 가야 할까. 붙이다 보면 결정까지 LLM에 맡기고 싶어진다. 사유를 분류해서 "fraud"가 나오면 그 자리에서 환불을 거절하는 식이다. 그러면 성격이 다른 두 코드가 한 덩어리가 된다. 하나는 외부 시스템과 통신하는 Technical Service이고, 다른 하나는 비즈니스 규칙을 가진 Domain Service다. 둘을 떼어 두면 모델은 값만 만들고, 임계값은 평범한 도메인 코드에 남는다. 나중에 뒤의 모델을 Claude API에서 직접 띄운 모델로 옮겼을 때도 Infrastructure 밖은 바뀐 게 없었다.</p>
        <p>아래 코드는 같은 백엔드 설계를 5개 언어로 나란히 구현해 둔 내 예제 프로젝트의 환불 흐름에서 가져왔다. Go 구현이고, 나머지 4개도 같은 방식으로 나눠 두었다.</p>
        <h2>LLM은 신호만 준다</h2>
        <p><code>RefundReasonClassifier</code>는 Technical Service 포트다. Application 계층에 있는 인터페이스이고, 이걸 쓰는 곳이 하나뿐이라 그쪽에 필요한 만큼만 정의했다. 구현체는 Infrastructure에 둔다.</p>
        <pre><code>{`// RefundReasonClassifier is a Technical Service port (domain-service.md)
// abstracting an LLM call that classifies a refund's free-text reason.
//
// Classify has no error return by contract: on any failure (API error,
// malformed output, network error) the real implementation must log a
// warning and return a neutral fallback classification rather than
// propagating an error — a classification outage must never block a
// refund request.
type RefundReasonClassifier interface {
	Classify(ctx context.Context, reason string) payment.RefundReasonClassification
}`}</code></pre>
        <p>분류기가 하는 일은 분류 결과를 만드는 데서 끝난다. 그 결과로 무엇을 할지는 이 계층이 신경 쓸 일이 아니다.</p>
        <h2>결정은 Domain Service가 한다</h2>
        <p><code>EvaluateRefundEligibility</code>는 평범한 패키지 함수다. 프레임워크 의존성이 없고, Go에는 DI container도 없다. 분류기를 import하지도, 호출하지도 않는다. 이미 계산된 <code>classification</code>을 값으로 받고, 요청자 이력으로 매긴 두 번째 사기 위험 점수도 함께 받아서, 자기가 정한 고정 임계값을 적용한다.</p>
        <pre><code>{`const fraudRiskRejectionThreshold = 0.7

func EvaluateRefundEligibility(p *Payment, r *Refund, classification RefundReasonClassification, mlFraudRiskScore float64) RefundDecision {
	if p.Status != StatusCompleted {
		return RefundDecision{Approved: false, Reason: ErrRefundRequiresCompletedPayment.Error()}
	}
	if r.Amount > p.Amount {
		return RefundDecision{Approved: false, Reason: ErrRefundAmountExceedsPayment.Error()}
	}
	if classification.Category == RefundReasonFraudSuspected && classification.FraudRiskScore >= fraudRiskRejectionThreshold {
		return RefundDecision{Approved: false, Reason: ErrRefundFlaggedHighFraudRisk.Error()}
	}
	// ...
}`}</code></pre>
        <p>LLM API 요청이나 프롬프트, 재시도 정책처럼 이 함수를 부르기 전에 일어나는 일은 함수 쪽에서 하나도 보이지 않는다. 둘을 이어 주는 건 Application 계층이다.</p>
        <pre><code>{`classification := h.classifier.Classify(ctx, cmd.Reason)
// ...
decision := payment.EvaluateRefundEligibility(p, r, classification, mlFraudRiskScore)`}</code></pre>
        <p>이렇게 나누는 이유가 여기 있다. 부정 사용으로 거절하는 임계값 <code>0.7</code>은 비즈니스 규칙이고, 네트워크 호출 없이 구조체만 만들어서 테스트할 수 있다. LLM 제공자를 바꾸든 프롬프트를 바꾸든, 분류 방식을 통째로 갈아엎든 이 함수는 그대로다.</p>
        <h2>설정 값은 비즈니스 코드 밖에</h2>
        <p>분류기의 Infrastructure 구현체에는 모델 이름과 API 엔드포인트가 필요했다. 서비스 안에서 환경 변수에 기대는 다른 값과 같은 컨벤션으로 처리했다. <code>config</code> 패키지 밖에서는 아무 코드도 <code>os.Getenv</code>를 직접 부르지 않는다.</p>
        <pre><code>{`const defaultRefundClassifierModel = "qwen2.5:1.5b"
const defaultOllamaBaseURL = "http://localhost:11434"

// RefundClassifierModel returns the model id RefundReasonClassifierImpl uses,
// overridable via REFUND_CLASSIFIER_MODEL. All raw env var access for this
// feature is encapsulated here (never read directly inside
// domain/application/infrastructure code — config.md).
func RefundClassifierModel() string {
	if v := os.Getenv("REFUND_CLASSIFIER_MODEL"); v != "" {
		return v
	}
	return defaultRefundClassifierModel
}`}</code></pre>
        <h2>그러다 백엔드가 바뀌었다</h2>
        <p>처음에 분류기는 <code>github.com/anthropics/anthropic-sdk-go</code>로 Claude API를 불렀다. 나중에 백엔드를 직접 띄운 Ollama 모델로 옮겼다. 벤더 API 키가 필요 없고 요청당 비용도 없으며, 다른 서비스와 같은 인프라에서 돈다. Infrastructure 구현체는 SDK 호출을 걷어 내고 Ollama의 <code>/api/chat</code> 엔드포인트에 <code>net/http</code>로 요청을 보내게 바꿨다. config는 다음과 같이 바뀌었다.</p>
        <pre><code>{`const defaultRefundClassifierModel = "qwen2.5:1.5b"
const defaultOllamaBaseURL = "http://localhost:11434"`}</code></pre>
        <div className="article-note"><strong>더 작은 0.5b 대신 1.5b를 쓰는 이유</strong><p>처음엔 이 계열에서 가장 작은 모델을 써 봤다. Ollama에 직접 물어보니, "두 번 결제됐으니 중복분을 환불해 달라"는 평범한 요청을 <code>fraud_suspected</code>로 분류했다. 부정 사용 위험 점수는 <code>1.0</code>이었다. 그대로 뒀다면 <code>0.7</code> 임계값에 걸려 멀쩡한 환불이 거절됐을 것이다. 이 요청을 제대로 분류한 가장 작은 크기가 1.5B 파라미터였다.</p></div>
        <h2>바뀐 건 거의 없었다</h2>
        <p>백엔드를 바꾸는 동안 Domain Service와 Technical Service 인터페이스, 둘의 단위 테스트는 한 줄도 바뀌지 않았다. 고친 건 Infrastructure 구현체와 config 함수 2개뿐이다. Infrastructure 밖에서는 LLM이 끼어 있다는 것도, 그게 어떤 LLM인지도 몰랐다. 아키텍처가 할 일을 한 것이다.</p>
        <p>다만 Go에는 짚고 넘어갈 게 하나 있다. Go 구현에는 DI container가 없어서 E2E 테스트 부트스트랩이 분류기의 생성자를 손으로 연결한다. 그래서 테스트 셋업에서 생성자 호출 한 줄, 모델 이름과 base URL을 고쳐야 했다. 고친 건 테스트 <em>배선(wiring)</em>이고 테스트 <em>로직</em>은 그대로다. assertion은 하나도 바뀌지 않았다. DI container가 배선을 알아서 해 주는 언어에서는 테스트 파일을 하나도 건드리지 않았다. Go에서 말하는 "거의 바뀐 게 없다"에는 이 작은 각주가 붙는다.</p>
        <div className="article-note"><strong>더 볼 자료</strong><p>
          <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/docs/architecture/domain-service.md" target="_blank" rel="noreferrer">docs/architecture/domain-service.md</a>(같은 백엔드 설계를 5개 언어로 구현해 둔 내 예제 프로젝트에서 Technical Service와 Domain Service를 나누는 기준. 지금은 위 정정에 적은 대로 다른 예제를 쓴다) · <a href="https://github.com/kyhsa93/backend-service-playbook/blob/22107f887cacc7735d6709e21d1967d024ee790d/implementations/go/examples/internal/infrastructure/llm/refund_reason_classifier.go" target="_blank" rel="noreferrer">refund_reason_classifier.go</a>(지우기 직전 커밋에 고정한 Ollama 기반 구현) · <a href="/posts/refund-fraud-risk-scorer">학습할 데이터가 없는 ML 점수는 끼워 넣되 결정은 맡기지 않는다</a>(이 분류기 옆에 있던 이력 기반 점수와, 학습 데이터 없이 모델을 붙이는 법)
        </p></div>
      </>
    ),
  },
};

export default function LlmTechnicalService() {
  const { locale } = useLocale();
  const c = content[locale];

  return (
    <PostLayout slug="llm-technical-service" kicker={c.kicker} title={c.title} lede={c.lede}>
      {c.body}
    </PostLayout>
  );
}
