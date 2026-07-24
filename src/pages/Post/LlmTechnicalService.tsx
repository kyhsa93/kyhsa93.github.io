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
        <p>The temptation with an LLM feature is to let it own the decision — classify the reason, and if it says "fraud," reject the refund right there. That collapses two different kinds of code into one: a Technical Service that talks to an external system, and a Domain Service that owns a business rule. This repo keeps them separate on purpose.</p>
        <h2>An LLM Is a Signal, Not a Judge</h2>
        <p><code>RefundReasonClassifier</code> is an abstract Technical Service — an Application-layer interface with an Infrastructure implementation, the same shape as every other outbound integration in this repo:</p>
        <pre><code>{`export abstract class RefundReasonClassifier {
  abstract classify(reason: string): Promise<RefundReasonClassification>
}`}</code></pre>
        <p>Its job ends at producing a classification. It has no opinion about what should happen next — that's not its layer's concern.</p>
        <h2>The Domain Service Still Decides</h2>
        <p><code>RefundEligibilityService</code> is a plain class with no framework dependencies, and it never imports or calls the classifier. It receives an already-computed <code>classification</code> as a value, alongside a second fraud signal covered below, and applies its own fixed threshold:</p>
        <pre><code>{`public evaluate(
  payment: Payment,
  refund: Refund,
  classification: RefundReasonClassification,
  mlFraudRiskScore: number
): RefundDecision {
  if (
    classification.category === 'fraud_suspected' &&
    classification.fraudRiskScore >= FRAUD_RISK_REJECTION_THRESHOLD
  ) {
    return {
      approved: false,
      reason: PaymentErrorMessage['This refund reason was flagged as high fraud risk and requires manual review.'],
    }
  }
  // ...
}`}</code></pre>
        <p>Everything upstream of that method call — the LLM API request, the prompt, the retry policy — is invisible to it. The Application layer is what wires the two together:</p>
        <pre><code>{`const classification = await this.refundReasonClassifier.classify(command.reason)
const decision = this.refundEligibilityService.evaluate(payment, refund, classification, mlFraudRiskScore)`}</code></pre>
        <p>That's the whole point of the split: the fraud-rejection threshold (<code>0.7</code>) is a business rule, testable with plain objects and no network calls. Swap the LLM provider, the prompt, even the whole classification approach, and this method doesn't change.</p>
        <h2>A Real Gap the First Wiring-Up Exposed</h2>
        <p>Building the classifier's Infrastructure implementation needed an API key from <code>SecretService</code> — and that's when a structural problem surfaced: <code>SecretService</code> had only ever been registered in <code>AppModule</code>'s own providers, unreachable from any domain module, since domain modules are imported <em>by</em> <code>AppModule</code>, not the other way around. The fix promoted it to a global module, the same pattern already used for the Outbox:</p>
        <pre><code>{`@Global()
@Module({
  providers: [{ provide: SecretService, useClass: SecretServiceImpl }],
  exports: [SecretService],
})
export class CommonModule {}`}</code></pre>
        <h2>Then the Backend Changed</h2>
        <p>The classifier originally called a real LLM API. Later, the backend moved to a self-hosted Ollama model — no vendor API key, no per-request cost, running on the same infrastructure as everything else. The config change is small:</p>
        <pre><code>{`const DEFAULT_REFUND_CLASSIFIER_MODEL = 'qwen2.5:1.5b'
const DEFAULT_OLLAMA_BASE_URL = 'http://localhost:11434'`}</code></pre>
        <div className="article-note"><strong>Why 1.5b and not the smaller 0.5b</strong><p>The smallest model in the family was tried first. Live-tested directly against Ollama, it misclassified a plain "charged twice, refund the duplicate" complaint as <code>fraud_suspected</code> with a fraud-risk score of <code>1.0</code> — which would have incorrectly rejected a completely legitimate refund at the <code>0.7</code> threshold. 1.5B parameters was the smallest size that got this case right.</p></div>
        <h2>What Had to Change (Almost Nothing)</h2>
        <p>In three of the five languages, the swap touched only the Infrastructure implementation and its config — the Domain Service, the Technical Service interface, and every test file were untouched. That's the architecture doing its job: nothing outside Infrastructure knew or cared that an LLM was involved at all, let alone which one.</p>
        <p>One honest caveat: Go isn't quite zero-diff. Its E2E test bootstrap wires the classifier's concrete constructor by hand — there's no DI container to do it implicitly — so the test setup needed a one-line update to the constructor arguments (model name and base URL). That's test <em>wiring</em>, not test <em>logic</em>; no assertion changed. Still, four-fifths of a "swap the vendor, touch nothing else" claim holding up in real, ported code across five independent implementations is a better result than most integrations get.</p>
      </>
    ),
  },
  ko: {
    kicker: 'LLM · Architecture',
    title: (
      <>
        LLM을 Domain Service에 연결하기<br /><em>— 판단은 넘기지 않고</em>
      </>
    ),
    lede: 'LLM은 사기 판별을 위한 좋은 신호원(signal)이지만, 최종 판단자로서는 좋지 않다. RefundReasonClassifier는 자유 형식의 환불 사유를 읽어 카테고리를 반환할 뿐이다 — 실제로 결정을 내리는 Domain Service는 이 클래스를 호출하지 않으며, 그 값을 LLM이 만들어냈다는 사실조차 알지 못한다.',
    body: (
      <>
        <p>LLM 기능을 붙일 때 흔히 빠지는 유혹은 판단 자체를 LLM에게 맡기는 것이다 — 사유를 분류하고, "fraud"라고 나오면 그 자리에서 바로 환불을 거절하는 식이다. 이렇게 하면 서로 다른 두 종류의 코드가 하나로 뭉개진다: 외부 시스템과 통신하는 Technical Service와, 비즈니스 규칙을 소유하는 Domain Service. 이 저장소는 둘을 의도적으로 분리해 둔다.</p>
        <h2>LLM은 신호일 뿐, 판단자가 아니다</h2>
        <p><code>RefundReasonClassifier</code>는 추상화된 Technical Service다 — Application 계층의 인터페이스에 Infrastructure 구현체가 붙는, 이 저장소의 다른 모든 아웃바운드 통합과 동일한 형태다:</p>
        <pre><code>{`export abstract class RefundReasonClassifier {
  abstract classify(reason: string): Promise<RefundReasonClassification>
}`}</code></pre>
        <p>이 클래스의 역할은 분류 결과를 만들어내는 데서 끝난다. 다음에 무슨 일이 일어나야 하는지에 대해서는 아무런 의견도 갖지 않는다 — 그건 이 계층이 신경 쓸 일이 아니다.</p>
        <h2>결정은 여전히 Domain Service가 내린다</h2>
        <p><code>RefundEligibilityService</code>는 프레임워크 의존성이 전혀 없는 평범한 클래스이며, classifier를 import하거나 호출하는 일이 없다. 이미 계산된 <code>classification</code>을 값으로 전달받고, 뒤에서 다룰 두 번째 사기 신호와 함께 자신만의 고정된 임계값을 적용한다:</p>
        <pre><code>{`public evaluate(
  payment: Payment,
  refund: Refund,
  classification: RefundReasonClassification,
  mlFraudRiskScore: number
): RefundDecision {
  if (
    classification.category === 'fraud_suspected' &&
    classification.fraudRiskScore >= FRAUD_RISK_REJECTION_THRESHOLD
  ) {
    return {
      approved: false,
      reason: PaymentErrorMessage['This refund reason was flagged as high fraud risk and requires manual review.'],
    }
  }
  // ...
}`}</code></pre>
        <p>그 메서드 호출보다 앞단에서 벌어지는 모든 일 — LLM API 요청, 프롬프트, 재시도 정책 — 은 이 클래스 입장에서는 보이지 않는다. 둘을 실제로 연결하는 것은 Application 계층이다:</p>
        <pre><code>{`const classification = await this.refundReasonClassifier.classify(command.reason)
const decision = this.refundEligibilityService.evaluate(payment, refund, classification, mlFraudRiskScore)`}</code></pre>
        <p>이 분리의 핵심은 바로 여기에 있다: 사기 거절 임계값(<code>0.7</code>)은 비즈니스 규칙이며, 네트워크 호출 없이 평범한 객체만으로 테스트할 수 있다. LLM 제공자를 바꾸든, 프롬프트를 바꾸든, 심지어 분류 방식 전체를 바꾸든, 이 메서드는 그대로다.</p>
        <h2>처음 연결하면서 드러난 실제 공백</h2>
        <p>classifier의 Infrastructure 구현체를 만들려면 <code>SecretService</code>에서 API 키를 가져와야 했는데 — 바로 그 순간 구조적인 문제가 드러났다: <code>SecretService</code>는 그동안 <code>AppModule</code> 자체의 provider로만 등록되어 있어서 어떤 domain 모듈에서도 접근할 수 없었다. domain 모듈은 <code>AppModule</code>에 의해 import되는 쪽이지, 그 반대가 아니기 때문이다. 해결책은 이미 Outbox에 쓰였던 것과 같은 패턴으로 — <code>SecretService</code>를 global 모듈로 승격시키는 것이었다:</p>
        <pre><code>{`@Global()
@Module({
  providers: [{ provide: SecretService, useClass: SecretServiceImpl }],
  exports: [SecretService],
})
export class CommonModule {}`}</code></pre>
        <h2>그리고 백엔드가 바뀌었다</h2>
        <p>classifier는 원래 실제 LLM API를 호출했다. 이후 백엔드는 자체 호스팅하는 Ollama 모델로 옮겨갔다 — 벤더 API 키도 필요 없고, 요청당 비용도 없으며, 나머지 모든 것과 같은 인프라 위에서 돌아간다. 설정 변경은 아주 작다:</p>
        <pre><code>{`const DEFAULT_REFUND_CLASSIFIER_MODEL = 'qwen2.5:1.5b'
const DEFAULT_OLLAMA_BASE_URL = 'http://localhost:11434'`}</code></pre>
        <div className="article-note"><strong>왜 더 작은 0.5b가 아니라 1.5b인가</strong><p>이 계열에서 가장 작은 모델을 먼저 시도했다. Ollama에 직접 라이브 테스트를 해보니, "이중 결제됐으니 중복분을 환불해달라"는 평범한 불만을 <code>fraud_suspected</code>로, 그것도 fraud-risk score <code>1.0</code>으로 잘못 분류했다 — <code>0.7</code> 임계값 기준으로는 완전히 정당한 환불이 잘못 거절당했을 상황이다. 이 케이스를 제대로 처리한 가장 작은 크기는 1.5B 파라미터였다.</p></div>
        <h2>무엇이 바뀌어야 했나 (거의 아무것도)</h2>
        <p>다섯 언어 중 세 곳에서는 이 교체가 Infrastructure 구현체와 그 설정만 건드렸다 — Domain Service, Technical Service 인터페이스, 그리고 모든 테스트 파일은 손대지 않았다. 아키텍처가 제 역할을 한 것이다: Infrastructure 바깥의 그 무엇도 LLM이 관여한다는 사실 자체를, 하물며 어떤 LLM인지는 더더욱 알지도 신경 쓰지도 않았다.</p>
        <p>솔직한 단서 하나: Go는 완전한 무변경(zero-diff)은 아니었다. Go의 E2E 테스트 부트스트랩은 classifier의 구체 생성자를 수동으로 연결한다 — 암묵적으로 처리해줄 DI 컨테이너가 없기 때문이다 — 그래서 테스트 셋업에서 생성자 인자(모델명과 base URL) 한 줄을 업데이트해야 했다. 이건 테스트 <em>로직</em>이 아니라 테스트 <em>배선(wiring)</em>의 변화이며, 어떤 assertion도 바뀌지 않았다. 그럼에도, "벤더만 바꾸고 나머지는 손대지 않는다"는 주장이 다섯 개의 독립적인 구현체에 걸쳐 실제로 포팅된 코드에서 5분의 4만큼 유지된 것은 대부분의 통합 작업이 얻는 결과보다 낫다.</p>
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
