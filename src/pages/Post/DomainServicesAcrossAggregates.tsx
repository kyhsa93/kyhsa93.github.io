import PostLayout from '../../components/PostLayout';
import { useLocale, localeFromPathname } from '../../lib/locale';
import type { MetaFunction } from 'react-router';
import { createPostMeta } from '../../lib/seo';

export const meta: MetaFunction = ({ location }) =>
  createPostMeta('domain-services-across-aggregates', localeFromPathname(location.pathname));

const content = {
  en: {
    kicker: 'DDD · Tactical Design',
    title: (
      <>Domain Services:<br /><em>When a Rule Doesn't Belong to One Aggregate</em></>
    ),
    lede: "Some business rules need two Aggregates in the room at once. Forcing the rule into either one breaks encapsulation; a Domain Service that holds no state and only judges is the seam that keeps both sides intact.",
    body: (
      <>
        <div className="article-note"><strong>Update, 2026.07.26</strong><p>Both <code>classification</code> and <code>ml_fraud_risk_score</code> shown below have since been removed from <code>RefundEligibilityService</code>'s signature; the method now takes only <code>(payment, refund)</code>. Both upstream Technical Services were removed (see <a href="/posts/the-fraud-signal-that-trusted-the-fraudster">The Fraud Signal That Trusted the Fraudster</a>), leaving this Domain Service with no fraud-risk judgment at all, just the two structural checks below. The point this post makes (a Domain Service coordinating two Aggregates neither can absorb) still holds; the fraud-signal parameters are what's out of date.</p></div>
        <p>Most domain logic fits cleanly inside a single Aggregate Root. But every so often a rule needs to read two independent Aggregates to make a judgment, or it's unclear which one should own it, or it requires calling an external service an Aggregate has no business doing I/O for. That's the gap a Domain Service fills. It's worth being precise about, because it's also the pattern most often reached for when it isn't needed.</p>
        <h2>What a Domain Service Is Not</h2>
        <p>It holds no state. It only holds logic. If a "Domain Service" starts needing state, that's a sign it isn't one, so reconsider the design. It also never looks anything up itself:</p>
        <pre><code>{`# wrong — a Domain Service using the Repository directly
class OrderValidationService:
    def __init__(self, order_repository: OrderRepository) -> None:
        self.order_repository = order_repository  # forbidden

    async def validate_order(self, order_id: str) -> bool:
        orders, _ = await self.order_repository.find_orders(order_id=order_id)  # forbidden
        # ...`}</code></pre>
        <p>A Domain Service takes already-loaded domain objects and only judges them. The lookup itself is the Application Service's job, not the Domain Service's.</p>
        <h2>A Real Example: RefundEligibilityService</h2>
        <p>The domain rule: a refund requires the original payment to be in the <code>COMPLETED</code> state, and the refund amount can't exceed the payment amount. The <code>Payment</code> Aggregate doesn't know about any refund attempt against it; a refund only ever exists as a separate Aggregate. The <code>Refund</code> Aggregate doesn't know the original payment's amount or status either; it only references it via <code>paymentId</code>.</p>
        <p>Putting this judgment inside either Aggregate's own method would mean that Aggregate has to take the entire other Aggregate as a parameter, which breaks the boundary both of them are supposed to protect. So the judgment lives in a Domain Service, and the Application layer delegates to it after loading both Aggregates independently:</p>
        <pre><code>{`# domain/refund_eligibility_service.py — a Domain Service (no framework dependency)
@dataclass(frozen=True)
class RefundDecision:
    approved: bool
    reason: str | None = None


class RefundEligibilityService:
    def evaluate(
        self,
        payment: Payment,
        refund: Refund,
        classification: RefundReasonClassification,
        ml_fraud_risk_score: float,
    ) -> RefundDecision:
        if payment.status != PaymentStatus.COMPLETED:
            return RefundDecision(approved=False, reason="A refund can only be requested for a completed payment.")
        if refund.amount > payment.amount:
            return RefundDecision(approved=False, reason="The refund amount cannot exceed the payment amount.")
        if (
            classification.category == RefundReasonCategory.FRAUD_SUSPECTED
            and classification.fraud_risk_score >= FRAUD_RISK_REJECTION_THRESHOLD
        ):
            return RefundDecision(approved=False, reason="This refund reason was flagged as high fraud risk and requires manual review.")
        if ml_fraud_risk_score >= ML_FRAUD_RISK_REJECTION_THRESHOLD:
            return RefundDecision(approved=False, reason="This refund pattern was flagged as high risk by the fraud-risk model and requires manual review.")
        return RefundDecision(approved=True)`}</code></pre>
        <pre><code>{`# application/command/request_refund_handler.py — loads both Repositories, classifies the reason,
# scores the history pattern, and delegates all four inputs to the Domain Service
class RequestRefundHandler:
    def __init__(
        self,
        payment_repo: PaymentRepository,
        refund_repo: RefundRepository,
        refund_reason_classifier: RefundReasonClassifier,
        refund_fraud_risk_scorer: RefundFraudRiskScorer,
    ) -> None:
        self._payment_repo = payment_repo
        self._refund_repo = refund_repo
        self._refund_reason_classifier = refund_reason_classifier
        self._refund_fraud_risk_scorer = refund_fraud_risk_scorer
        # RefundEligibilityService is a pure Domain Service with no framework dependency —
        # instantiated directly rather than registered with FastAPI's Depends().
        self._refund_eligibility_service = RefundEligibilityService()

    async def execute(self, cmd: RequestRefundCommand) -> Refund:
        payments, _ = await self._payment_repo.find_payments(
            page=0, take=1, payment_id=cmd.payment_id, owner_id=cmd.requester_id
        )
        payment = payments[0] if payments else None
        if payment is None:
            raise PaymentNotFoundError(cmd.payment_id)

        refund = Refund.create(payment_id=payment.payment_id, amount=cmd.amount, reason=cmd.reason)
        classification = await self._refund_reason_classifier.classify(cmd.reason)
        ml_fraud_risk_score = await self._refund_fraud_risk_scorer.score(/* refund history features */)

        decision = self._refund_eligibility_service.evaluate(payment, refund, classification, ml_fraud_risk_score)
        if decision.approved:
            refund.approve(account_id=payment.account_id, owner_id=payment.owner_id)
        else:
            refund.reject(decision.reason or "The refund request was rejected.")

        await self._refund_repo.save_refund(refund)
        return refund`}</code></pre>
        <p><code>RefundEligibilityService</code> is instantiated directly. It's never wired through FastAPI's <code>Depends()</code>, staying true to "holds no state, no framework dependency." Its unit test doesn't go through the Application layer at all; it instantiates the class directly and verifies only the decision logic. <code>classification</code> and <code>ml_fraud_risk_score</code> are two independent signals produced by Technical Services upstream (an LLM-backed classifier and a history-scoring model, each covered in its own post). This Domain Service never calls either one, only weighs the already-computed values against its own fixed thresholds. The full code lives at <code>implementations/fastapi/examples/src/payment/domain/refund_eligibility_service.py</code> alongside <code>payment.py</code>, <code>refund.py</code>, and the command handler above.</p>
        <p>This example also earned itself a permanent regression guard: a rule in my automated architecture check (a script that statically verifies the code follows the documented design rules) checks, within <code>payment/domain/</code>, that <code>payment.py</code> never directly imports the <code>Refund</code> class and vice versa, proving the two Aggregates only ever reference each other by ID, never by holding one another as a field. The legitimate pattern of a Domain Service taking both as function parameters, like <code>evaluate(payment: Payment, refund: Refund)</code>, is explicitly not a target of that rule.</p>
        <h2>Domain Service vs. Application Service vs. Technical Service</h2>
        <p>Three easily-confused concepts, told apart by what they depend on. The <strong>Application Service</strong> coordinates the use case by calling the Repository and running the transaction. The <strong>Domain Service</strong> handles the domain judgment inside it, depending only on other domain objects. The <strong>Technical Service</strong> handles the piece where a technical implementation is the point (encryption, file storage, an external API client), abstracted behind an interface the Application layer depends on, with the real SDK usage confined to the Infrastructure-layer implementation.</p>
        <p>The difference from a Technical Service is worth spelling out, since both get injected into an Application Service and both look like "just another dependency" from the call site. A Technical Service's interface is shaped around a technical concern unrelated to any domain rule; <code>CryptoService.encrypt()</code> doesn't know what an order or a payment is. A Domain Service's interface is shaped around a domain judgment; <code>RefundEligibilityService.evaluate()</code> is meaningless outside the Payment/Refund domain.</p>
        <div className="article-note"><strong>Placement default: inside the domain, not a shared top-level module</strong><p>Put a Technical Service inside the domain that needs it first. Only promote it to a shared module once multiple domains end up sharing the same implementation, not in advance just because another domain might someday. This is YAGNI applied to module boundaries, not just to features.</p></div>
        <h2>When the Rule Really Doesn't Need a Domain Service</h2>
        <p>Not every calculation involving a value object is evidence of cross-Aggregate coordination. A discount calculation that only touches one <code>Order</code> and a plain <code>coupon</code> value object is just Aggregate logic that happens to live in a helper class; it doesn't need two independently-loaded Aggregates to make its decision. The tell for a Domain Service is that the Application layer has to load two separate Repositories and hand both results to something, because neither Aggregate alone has enough information to decide.</p>
        <p>Getting this distinction wrong in either direction costs you something concrete: forcing the rule into one Aggregate means that Aggregate now imports and understands a class it has no business depending on; splitting out a Domain Service for logic that only ever touches one Aggregate just adds an indirection with nothing to show for it.</p>
        <div className="article-note"><strong>Further reading</strong><p>
          <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/docs/architecture/domain-service.md" target="_blank" rel="noreferrer">docs/architecture/domain-service.md</a> (the full Domain Service / Technical Service pattern with the misuse example above, in my example project that implements the same backend design (DDD, CQRS, Outbox) in five languages side by side) · <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/implementations/fastapi/examples/src/payment/domain/refund_eligibility_service.py" target="_blank" rel="noreferrer">payment/domain/refund_eligibility_service.py</a> (the current code, now simplified to just the two structural checks; see the update note above)
        </p></div>
      </>
    ),
  },
  ko: {
    kicker: 'DDD · Tactical Design',
    title: (
      <>Domain Service:<br /><em>규칙이 하나의 Aggregate에 속하지 않을 때</em></>
    ),
    lede: '어떤 비즈니스 규칙은 Aggregate 두 개를 한꺼번에 놓고 봐야 판단할 수 있다. 이런 규칙을 억지로 한쪽에 밀어 넣으면 캡슐화가 깨진다. 상태 없이 판단만 하는 Domain Service를 사이에 두면 양쪽을 모두 온전하게 지킬 수 있다.',
    body: (
      <>
        <div className="article-note"><strong>2026.07.26 정정</strong><p>아래 코드의 <code>classification</code>과 <code>ml_fraud_risk_score</code>는 그 뒤 <code>RefundEligibilityService</code>의 시그니처에서 둘 다 빠졌다. 지금 이 메서드는 <code>(payment, refund)</code>만 받는다. 앞단의 Technical Service 두 개를 모두 걷어 냈기 때문이다(<a href="/posts/the-fraud-signal-that-trusted-the-fraudster">사기꾼을 그대로 믿은 사기 탐지 신호</a> 참고). 그래서 이 Domain Service에는 사기 위험 판단이 하나도 남지 않았고, 아래의 구조 검사 두 가지만 남았다. 어느 한쪽도 품을 수 없는 두 Aggregate를 Domain Service가 조율한다는 이 글의 요지는 그대로다. 낡은 건 사기 신호 파라미터뿐이다.</p></div>
        <p>도메인 로직은 대부분 Aggregate Root 하나 안에 깔끔하게 들어간다. 그런데 가끔 그렇지 않은 규칙이 있다. 서로 독립된 Aggregate 두 개를 같이 읽어야 판단할 수 있거나, 어느 쪽이 맡아야 할지 애매하거나, Aggregate가 해서는 안 되는 외부 서비스 I/O를 불러야 하는 경우다. 이 빈자리를 채우는 게 Domain Service다. 다만 필요 없는 자리에도 가장 자주 꺼내 드는 패턴이라, 어디까지가 Domain Service인지 분명히 해 둘 필요가 있다.</p>
        <h2>Domain Service가 아닌 것</h2>
        <p>Domain Service는 상태를 갖지 않고 로직만 갖는다. 상태가 필요해지기 시작했다면 이미 Domain Service가 아니라는 신호이니 설계를 다시 보는 게 낫다. 조회도 스스로 하지 않는다. 아래처럼 쓰면 안 된다.</p>
        <pre><code>{`# wrong — a Domain Service using the Repository directly
class OrderValidationService:
    def __init__(self, order_repository: OrderRepository) -> None:
        self.order_repository = order_repository  # forbidden

    async def validate_order(self, order_id: str) -> bool:
        orders, _ = await self.order_repository.find_orders(order_id=order_id)  # forbidden
        # ...`}</code></pre>
        <p>Domain Service는 이미 로드된 도메인 객체를 받아서 판단만 한다. 조회는 Application Service가 할 일이다.</p>
        <h2>예시로 보는 RefundEligibilityService</h2>
        <p>도메인 규칙은 이렇다. 환불하려면 원래 결제가 <code>COMPLETED</code> 상태여야 하고, 환불 금액은 결제 금액을 넘을 수 없다. 그런데 <code>Payment</code> Aggregate는 자기에게 들어온 환불 시도를 전혀 모른다. 환불은 늘 별도의 Aggregate로만 존재하기 때문이다. <code>Refund</code> Aggregate도 원래 결제의 금액이나 상태를 모른다. <code>paymentId</code>로 가리키기만 할 뿐이다.</p>
        <p>이 판단을 어느 한쪽 Aggregate의 메서드에 넣으면, 그 Aggregate가 다른 Aggregate를 통째로 파라미터로 받아야 한다. 두 Aggregate가 함께 지켜야 할 경계가 거기서 깨진다. 그래서 판단은 Domain Service에 둔다. Application 계층이 두 Aggregate를 각각 로드한 뒤 Domain Service에 넘기는 구조다.</p>
        <pre><code>{`# domain/refund_eligibility_service.py — a Domain Service (no framework dependency)
@dataclass(frozen=True)
class RefundDecision:
    approved: bool
    reason: str | None = None


class RefundEligibilityService:
    def evaluate(
        self,
        payment: Payment,
        refund: Refund,
        classification: RefundReasonClassification,
        ml_fraud_risk_score: float,
    ) -> RefundDecision:
        if payment.status != PaymentStatus.COMPLETED:
            return RefundDecision(approved=False, reason="A refund can only be requested for a completed payment.")
        if refund.amount > payment.amount:
            return RefundDecision(approved=False, reason="The refund amount cannot exceed the payment amount.")
        if (
            classification.category == RefundReasonCategory.FRAUD_SUSPECTED
            and classification.fraud_risk_score >= FRAUD_RISK_REJECTION_THRESHOLD
        ):
            return RefundDecision(approved=False, reason="This refund reason was flagged as high fraud risk and requires manual review.")
        if ml_fraud_risk_score >= ML_FRAUD_RISK_REJECTION_THRESHOLD:
            return RefundDecision(approved=False, reason="This refund pattern was flagged as high risk by the fraud-risk model and requires manual review.")
        return RefundDecision(approved=True)`}</code></pre>
        <pre><code>{`# application/command/request_refund_handler.py — loads both Repositories, classifies the reason,
# scores the history pattern, and delegates all four inputs to the Domain Service
class RequestRefundHandler:
    def __init__(
        self,
        payment_repo: PaymentRepository,
        refund_repo: RefundRepository,
        refund_reason_classifier: RefundReasonClassifier,
        refund_fraud_risk_scorer: RefundFraudRiskScorer,
    ) -> None:
        self._payment_repo = payment_repo
        self._refund_repo = refund_repo
        self._refund_reason_classifier = refund_reason_classifier
        self._refund_fraud_risk_scorer = refund_fraud_risk_scorer
        # RefundEligibilityService is a pure Domain Service with no framework dependency —
        # instantiated directly rather than registered with FastAPI's Depends().
        self._refund_eligibility_service = RefundEligibilityService()

    async def execute(self, cmd: RequestRefundCommand) -> Refund:
        payments, _ = await self._payment_repo.find_payments(
            page=0, take=1, payment_id=cmd.payment_id, owner_id=cmd.requester_id
        )
        payment = payments[0] if payments else None
        if payment is None:
            raise PaymentNotFoundError(cmd.payment_id)

        refund = Refund.create(payment_id=payment.payment_id, amount=cmd.amount, reason=cmd.reason)
        classification = await self._refund_reason_classifier.classify(cmd.reason)
        ml_fraud_risk_score = await self._refund_fraud_risk_scorer.score(/* refund history features */)

        decision = self._refund_eligibility_service.evaluate(payment, refund, classification, ml_fraud_risk_score)
        if decision.approved:
            refund.approve(account_id=payment.account_id, owner_id=payment.owner_id)
        else:
            refund.reject(decision.reason or "The refund request was rejected.")

        await self._refund_repo.save_refund(refund)
        return refund`}</code></pre>
        <p><code>RefundEligibilityService</code>는 FastAPI의 <code>Depends()</code>로 등록하지 않고 직접 인스턴스를 만든다. 상태도 없고 프레임워크 의존성도 없다는 원칙을 그대로 지키는 셈이다. 단위 테스트도 Application 계층을 거치지 않는다. 클래스를 바로 만들어서 판단 로직만 검증한다. <code>classification</code>과 <code>ml_fraud_risk_score</code>는 앞단의 Technical Service 두 개가 따로 만들어 내는 신호다. 하나는 LLM 기반 분류기, 다른 하나는 이력 기반 스코어링 모델이고 각각 별도의 글에서 다뤘다. 이 Domain Service는 둘 중 어느 것도 직접 부르지 않는다. 이미 계산된 값을 자기가 가진 고정 임계값과 비교할 뿐이다. 전체 코드는 <code>implementations/fastapi/examples/src/payment/domain/refund_eligibility_service.py</code>에 있고, 같은 곳에 <code>payment.py</code>, <code>refund.py</code>와 위의 command handler가 있다.</p>
        <p>이 예시 덕분에 회귀를 막는 장치도 하나 생겼다. <code>payment/domain/</code> 안에서 <code>payment.py</code>가 <code>Refund</code> 클래스를 직접 import하지 않는지, 반대 방향도 마찬가지인지 보는 아키텍처 검사 규칙이다(코드가 문서의 설계 규칙을 따르는지 정적으로 검사하는 스크립트에 들어 있다). 두 Aggregate가 서로를 필드로 들고 있지 않고 ID로만 참조한다는 걸 이 규칙이 계속 확인해 준다. <code>evaluate(payment: Payment, refund: Refund)</code>처럼 Domain Service가 둘을 함수 파라미터로 받는 건 정상적인 패턴이라 일부러 검사 대상에서 뺐다.</p>
        <h2>Domain Service, Application Service, Technical Service 구분하기</h2>
        <p>헷갈리기 쉬운 세 개념은 무엇에 의존하는지를 보면 갈린다. <strong>Application Service</strong>는 유스케이스를 조율한다. Repository를 부르고 트랜잭션을 돌리는 쪽이다. <strong>Domain Service</strong>는 그 안에서 도메인 판단을 맡고, 다른 도메인 객체에만 의존한다. <strong>Technical Service</strong>는 암호화, 파일 저장, 외부 API 클라이언트처럼 기술 구현 자체가 목적인 부분을 맡는다. Application 계층은 그 인터페이스에만 의존하고, SDK를 직접 쓰는 코드는 Infrastructure 계층의 구현체 안에만 둔다.</p>
        <p>Technical Service와 어떻게 다른지는 한 번 더 짚어 둘 만하다. 둘 다 Application Service에 주입되니, 호출하는 쪽에서 보면 둘 다 그냥 의존성 하나로 보인다. Technical Service의 인터페이스는 도메인 규칙과 상관없는 기술 관심사를 중심으로 짠다. <code>CryptoService.encrypt()</code>는 주문이 뭔지, 결제가 뭔지 모른다. Domain Service의 인터페이스는 도메인 판단을 중심으로 짠다. <code>RefundEligibilityService.evaluate()</code>는 Payment/Refund 도메인 밖에서는 아무 의미가 없다.</p>
        <div className="article-note"><strong>기본 배치는 공유 최상위 모듈 말고 도메인 안</strong><p>Technical Service는 일단 그걸 쓰는 도메인 안에 둔다. 여러 도메인이 같은 구현을 함께 쓰게 됐을 때 비로소 공유 모듈로 올린다. 언젠가 다른 도메인도 쓸지 모른다는 이유로 미리 올리지는 않는다. 기능에 적용하던 YAGNI를 모듈 경계에도 똑같이 적용하는 것이다.</p></div>
        <h2>Domain Service까지 필요 없는 규칙</h2>
        <p>value object가 끼어 있는 계산이라고 다 Aggregate 사이의 조율은 아니다. <code>Order</code> 하나와 평범한 <code>coupon</code> value object만 다루는 할인 계산은 헬퍼 클래스에 들어가 있을 뿐 Aggregate 로직이다. 판단하는 데 따로 로드한 Aggregate 두 개가 필요하지 않다. Domain Service가 필요한지는 Application 계층을 보면 안다. Repository 두 개에서 각각 로드한 결과를 어딘가에 함께 넘겨야 한다면, 즉 어느 Aggregate 하나만으로는 판단할 정보가 모자란다면 그때가 Domain Service를 쓸 자리다.</p>
        <p>어느 쪽으로 잘못 판단해도 치르는 대가가 분명하다. 규칙을 Aggregate 하나에 억지로 넣으면, 그 Aggregate는 의존할 이유가 없는 클래스를 import하고 알아야 한다. 반대로 Aggregate 하나만 다루는 로직을 굳이 Domain Service로 빼면 얻는 것 없이 간접 계층만 하나 늘어난다.</p>
        <div className="article-note"><strong>더 볼 자료</strong><p>
          <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/docs/architecture/domain-service.md" target="_blank" rel="noreferrer">docs/architecture/domain-service.md</a>(같은 백엔드 설계(DDD, CQRS, Outbox)를 5개 언어로 나란히 구현해 둔 내 예제 프로젝트의 Domain Service / Technical Service 패턴 전체와 위의 오용 사례) · <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/implementations/fastapi/examples/src/payment/domain/refund_eligibility_service.py" target="_blank" rel="noreferrer">payment/domain/refund_eligibility_service.py</a>(지금 코드. 위 정정대로 구조 검사 두 가지로 단순해졌다)
        </p></div>
      </>
    ),
  },
};

export default function DomainServicesAcrossAggregates() {
  const { locale } = useLocale();
  const c = content[locale];

  return (
    <PostLayout slug="domain-services-across-aggregates" kicker={c.kicker} title={c.title} lede={c.lede}>
      {c.body}
    </PostLayout>
  );
}
