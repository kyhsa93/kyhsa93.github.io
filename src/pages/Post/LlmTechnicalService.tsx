import PostLayout from '../../components/PostLayout';
import { useLocale } from '../../lib/locale';

const content = {
  en: {
    kicker: 'LLM · Architecture',
    title: (
      <>
        Wiring an LLM Into a Domain Service<br /><em>— Without Letting It Make the Call</em>
      </>
    ),
    lede: 'An LLM is a good fraud-classification signal and a bad final judge. RefundReasonClassifier reads a free-text refund reason and hands back a category — the Domain Service that actually decides never calls it, and never even knows an LLM produced the value.',
    body: (
      <>
        <p>The temptation with an LLM feature is to let it own the decision — classify the reason, and if it says "fraud," reject the refund right there. That collapses two different kinds of code into one: a Technical Service that talks to an external system, and a Domain Service that owns a business rule. This repo's Go implementation keeps them separate on purpose, the same as every other language port.</p>
        <h2>An LLM Is a Signal, Not a Judge</h2>
        <p><code>RefundReasonClassifier</code> is a Technical Service port — an Application-layer interface, defined in the minimal shape its one consumer needs, with the real implementation living in Infrastructure:</p>
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
        <p>Its job ends at producing a classification. It has no opinion about what should happen next — that's not its layer's concern.</p>
        <h2>The Domain Service Still Decides</h2>
        <p><code>EvaluateRefundEligibility</code> is a plain package function — no framework dependency, no DI container involved, since Go has none — and it never imports or calls the classifier. It receives an already-computed <code>classification</code> as a value, alongside a second fraud signal covered in an earlier post, and applies its own fixed threshold:</p>
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
        <p>Everything upstream of that function call — the LLM API request, the prompt, the retry policy — is invisible to it. The Application layer is what wires the two together:</p>
        <pre><code>{`classification := h.classifier.Classify(ctx, cmd.Reason)
// ...
decision := payment.EvaluateRefundEligibility(p, r, classification, mlFraudRiskScore)`}</code></pre>
        <p>That's the whole point of the split: the fraud-rejection threshold (<code>0.7</code>) is a business rule, testable with plain structs and no network calls. Swap the LLM provider, the prompt, even the whole classification approach, and this function doesn't change.</p>
        <h2>Keeping Config Out of Business Code</h2>
        <p>Building the classifier's Infrastructure implementation needed a model name and an API endpoint — resolved through the same convention every other env-dependent value in this codebase follows: nothing outside the <code>config</code> package touches <code>os.Getenv</code> directly.</p>
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
        <p>The classifier originally called the real Claude API via <code>github.com/anthropics/anthropic-sdk-go</code>. Later, the backend moved to a self-hosted Ollama model — no vendor API key, no per-request cost, running on the same infrastructure as everything else. The Infrastructure implementation swapped SDK calls for a plain <code>net/http</code> request to Ollama's native <code>/api/chat</code> endpoint, and the config changed to:</p>
        <pre><code>{`const defaultRefundClassifierModel = "qwen2.5:1.5b"
const defaultOllamaBaseURL = "http://localhost:11434"`}</code></pre>
        <div className="article-note"><strong>Why 1.5b and not the smaller 0.5b</strong><p>The smallest model in the family was tried first. Live-tested directly against Ollama, it misclassified a plain "charged twice, refund the duplicate" complaint as <code>fraud_suspected</code> with a fraud-risk score of <code>1.0</code> — which would have incorrectly rejected a completely legitimate refund at the <code>0.7</code> threshold. 1.5B parameters was the smallest size that got this case right.</p></div>
        <h2>What Had to Change (Almost Nothing)</h2>
        <p>The Domain Service, the Technical Service interface, and the unit tests for both were untouched by the swap — only the Infrastructure implementation and the two config functions changed. That's the architecture doing its job: nothing outside Infrastructure knew or cared that an LLM was involved at all, let alone which one.</p>
        <p>One honest caveat, specific to Go: this codebase has no DI container, so the E2E test bootstrap wires the classifier's concrete constructor by hand. The swap needed a one-line update to that constructor call — model name and base URL — in the test setup. That's test <em>wiring</em>, not test <em>logic</em>; no assertion changed. In the languages with a DI container to do that wiring implicitly, the swap really did touch zero test files at all; Go's version of "almost nothing changed" comes with one small, honest asterisk.</p>
      </>
    ),
  },
  ko: {
    kicker: 'LLM · Architecture',
    title: (
      <>
        Domain Service에 LLM 연결하기<br /><em>— 판단은 넘기지 않는다</em>
      </>
    ),
    lede: 'LLM은 부정 사용 분류 신호로는 훌륭하지만 최종 판단자로는 부적합하다. RefundReasonClassifier는 자유 텍스트 형태의 환불 사유를 읽고 카테고리를 반환한다 — 실제로 결정을 내리는 Domain Service는 이를 절대 호출하지 않으며, 그 값이 LLM에서 나왔다는 사실조차 알지 못한다.',
    body: (
      <>
        <p>LLM 기능을 만들 때 흔히 빠지는 유혹은 결정 자체를 LLM에게 맡기는 것이다 — 사유를 분류하고, "fraud"라고 나오면 그 자리에서 바로 환불을 거절하는 식이다. 이렇게 하면 서로 다른 두 종류의 코드가 하나로 뭉개진다: 외부 시스템과 통신하는 Technical Service와, 비즈니스 규칙을 소유하는 Domain Service. 이 저장소의 Go 구현은 다른 모든 언어 포트와 마찬가지로 이 둘을 의도적으로 분리해 둔다.</p>
        <h2>LLM은 신호일 뿐, 판단자가 아니다</h2>
        <p><code>RefundReasonClassifier</code>는 Technical Service의 포트다 — Application 계층의 인터페이스로, 유일한 소비자가 필요로 하는 최소한의 형태로 정의되며, 실제 구현체는 Infrastructure에 위치한다:</p>
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
        <p>이 컴포넌트의 역할은 분류 결과를 만들어내는 데서 끝난다. 그 다음에 무슨 일이 일어나야 하는지에 대해서는 아무런 의견도 갖지 않는다 — 그건 이 계층이 신경 쓸 일이 아니다.</p>
        <h2>결정은 여전히 Domain Service가 내린다</h2>
        <p><code>EvaluateRefundEligibility</code>는 평범한 패키지 함수다 — 프레임워크 의존성도 없고, Go에는 애초에 DI container가 없으니 그것도 관여하지 않는다 — 그리고 classifier를 import하거나 호출하는 일이 절대 없다. 이미 계산된 <code>classification</code> 값을, 이전 글에서 다룬 두 번째 부정 사용 신호와 함께 값으로 전달받아, 자신만의 고정된 임계값을 적용한다:</p>
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
        <p>이 함수 호출보다 상류에 있는 모든 것 — LLM API 요청, 프롬프트, 재시도 정책 — 은 이 함수에게 보이지 않는다. 이 둘을 실제로 연결하는 건 Application 계층이다:</p>
        <pre><code>{`classification := h.classifier.Classify(ctx, cmd.Reason)
// ...
decision := payment.EvaluateRefundEligibility(p, r, classification, mlFraudRiskScore)`}</code></pre>
        <p>이것이 바로 이 분리의 핵심이다: 부정 사용 거절 임계값(<code>0.7</code>)은 비즈니스 규칙이며, 평범한 구조체만으로 네트워크 호출 없이 테스트할 수 있다. LLM 제공자를 바꾸든, 프롬프트를 바꾸든, 심지어 분류 방식 전체를 바꾸든, 이 함수는 변하지 않는다.</p>
        <h2>설정 값을 비즈니스 코드 밖에 두기</h2>
        <p>classifier의 Infrastructure 구현체를 만들려면 모델 이름과 API 엔드포인트가 필요했다 — 이 코드베이스에서 환경 변수에 의존하는 다른 모든 값과 동일한 컨벤션을 따라 해결했다: <code>config</code> 패키지 밖의 어떤 코드도 <code>os.Getenv</code>를 직접 건드리지 않는다.</p>
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
        <h2>그리고 백엔드가 바뀌었다</h2>
        <p>classifier는 원래 <code>github.com/anthropics/anthropic-sdk-go</code>를 통해 실제 Claude API를 호출했다. 이후 백엔드는 자체 호스팅하는 Ollama 모델로 옮겨갔다 — 벤더 API 키도 없고, 요청당 비용도 없으며, 나머지 모든 것과 같은 인프라 위에서 돌아간다. Infrastructure 구현체는 SDK 호출을 Ollama의 네이티브 <code>/api/chat</code> 엔드포인트로 보내는 평범한 <code>net/http</code> 요청으로 교체했고, config는 다음과 같이 바뀌었다:</p>
        <pre><code>{`const defaultRefundClassifierModel = "qwen2.5:1.5b"
const defaultOllamaBaseURL = "http://localhost:11434"`}</code></pre>
        <div className="article-note"><strong>더 작은 0.5b가 아니라 1.5b를 쓰는 이유</strong><p>처음에는 이 모델 계열에서 가장 작은 모델을 먼저 시도했다. Ollama를 상대로 직접 실전 테스트해 보니, "두 번 결제됐으니 중복분을 환불해 달라"는 평범한 불만을 <code>fraud_suspected</code>로, 그것도 부정 사용 위험 점수 <code>1.0</code>으로 잘못 분류했다 — 이대로였다면 완전히 정당한 환불 요청이 <code>0.7</code> 임계값에서 잘못 거절됐을 것이다. 이 케이스를 제대로 처리한 가장 작은 크기가 1.5B 파라미터였다.</p></div>
        <h2>무엇이 바뀌어야 했나 (거의 아무것도 아니다)</h2>
        <p>이 교체 작업으로 Domain Service, Technical Service 인터페이스, 그리고 둘에 대한 단위 테스트는 전혀 손대지 않았다 — 바뀐 건 오직 Infrastructure 구현체와 두 개의 config 함수뿐이었다. 이것이 바로 아키텍처가 제 역할을 하는 모습이다: Infrastructure 바깥의 그 무엇도 LLM이 관여한다는 사실 자체를 알지도, 신경 쓰지도 않았고, 어떤 LLM인지는 더더욱 그랬다.</p>
        <p>Go에 한정된 솔직한 단서 하나: 이 코드베이스에는 DI container가 없기 때문에, E2E 테스트 부트스트랩이 classifier의 구체 생성자를 손으로 직접 연결한다. 이번 교체는 테스트 셋업에서 그 생성자 호출 — 모델 이름과 base URL — 을 한 줄 고쳐야 했다. 이는 테스트 <em>로직</em>이 아니라 테스트 <em>배선(wiring)</em>이다; 어떤 assertion도 바뀌지 않았다. DI container가 그 배선을 암묵적으로 처리해 주는 언어들에서는 이번 교체가 정말로 테스트 파일을 단 하나도 건드리지 않았다; Go 버전의 "거의 아무것도 바뀌지 않았다"에는 이렇게 작지만 솔직한 각주 하나가 붙는다.</p>
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
