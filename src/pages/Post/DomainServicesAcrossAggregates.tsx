import PostLayout from '../../components/PostLayout';
import { useLocale } from '../../lib/locale';

const content = {
  en: {
    kicker: 'DDD · Tactical Design',
    title: (
      <>Domain Services:<br /><em>When a Rule Doesn't Belong to One Aggregate</em></>
    ),
    lede: "Some business rules genuinely need two Aggregates in the room at once. Forcing the rule into either one breaks encapsulation; a Domain Service that holds no state and only judges is the seam that keeps both sides intact.",
    body: (
      <>
        <p>Most domain logic fits cleanly inside a single Aggregate Root. But every so often a rule needs to read two independent Aggregates to make a judgment, or it's genuinely unclear which one should own it, or it requires calling an external service an Aggregate has no business doing I/O for. That's the gap a Domain Service fills — and it's worth being precise about, because it's also the pattern most often reached for when it isn't actually needed.</p>
        <h2>What a Domain Service Is Not</h2>
        <p>It holds no state. It only holds logic. If a "Domain Service" starts needing state, that's a sign it isn't one — reconsider the design. It also never looks anything up itself:</p>
        <pre><code>{`# wrong — a Domain Service using the Repository directly
class OrderValidationService:
    def __init__(self, order_repository: OrderRepository) -> None:
        self.order_repository = order_repository  # forbidden

    async def validate_order(self, order_id: str) -> bool:
        orders, _ = await self.order_repository.find_orders(order_id=order_id)  # forbidden
        # ...`}</code></pre>
        <p>A Domain Service takes already-loaded domain objects and only judges them. The lookup itself is the Application Service's job, not the Domain Service's.</p>
        <h2>A Real Example: RefundEligibilityService</h2>
        <p>The domain rule: a refund requires the original payment to be in the <code>COMPLETED</code> state, and the refund amount can't exceed the payment amount. The <code>Payment</code> Aggregate doesn't know about any refund attempt against it — a refund only ever exists as a separate Aggregate. The <code>Refund</code> Aggregate doesn't know the original payment's amount or status either — it only references it via <code>paymentId</code>.</p>
        <p>Putting this judgment inside either Aggregate's own method would mean that Aggregate has to take the entire other Aggregate as a parameter, which breaks the boundary both of them are supposed to protect. So the judgment lives in a Domain Service that the Application layer — having loaded both Aggregates independently — delegates to:</p>
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
        <p><code>RefundEligibilityService</code> is instantiated directly — it's never wired through FastAPI's <code>Depends()</code>, staying true to "holds no state, no framework dependency." Its unit test doesn't go through the Application layer at all; it instantiates the class directly and verifies only the decision logic. <code>classification</code> and <code>ml_fraud_risk_score</code> are two independent signals produced by Technical Services upstream (an LLM-backed classifier and a history-scoring model, each covered in its own post) — this Domain Service never calls either one, only weighs the already-computed values against its own fixed thresholds. The full code lives at <code>implementations/fastapi/examples/src/payment/domain/refund_eligibility_service.py</code> alongside <code>payment.py</code>, <code>refund.py</code>, and the command handler above.</p>
        <p>This example also earned itself a permanent regression guard: a harness rule checks, within <code>payment/domain/</code>, that <code>payment.py</code> never directly imports the <code>Refund</code> class and vice versa — proving the two Aggregates only ever reference each other by ID, never by holding one another as a field. The legitimate pattern of a Domain Service taking both as function parameters, like <code>evaluate(payment: Payment, refund: Refund)</code>, is explicitly not a target of that rule.</p>
        <h2>Domain Service vs. Application Service vs. Technical Service</h2>
        <p>Three easily-confused concepts, told apart by what they depend on. The <strong>Application Service</strong> coordinates the use case — calling the Repository, running the transaction. The <strong>Domain Service</strong> handles the domain judgment inside it, depending only on other domain objects. The <strong>Technical Service</strong> handles the piece where a technical implementation is the actual point — encryption, file storage, an external API client — abstracted behind an interface the Application layer depends on, with the real SDK usage confined to the Infrastructure-layer implementation.</p>
        <p>The difference from a Technical Service is worth spelling out, since both get injected into an Application Service and both look like "just another dependency" from the call site. A Technical Service's interface is shaped around a technical concern unrelated to any domain rule — <code>CryptoService.encrypt()</code> doesn't know what an order or a payment is. A Domain Service's interface is shaped around a domain judgment — <code>RefundEligibilityService.evaluate()</code> is meaningless outside the Payment/Refund domain.</p>
        <div className="article-note"><strong>Placement default: inside the domain, not a shared top-level module</strong><p>Put a Technical Service inside the domain that needs it first. Only promote it to a shared module once multiple domains actually end up sharing the same implementation — not in advance, just because another domain might someday. This is YAGNI applied to module boundaries, not just to features.</p></div>
        <h2>When the Rule Really Doesn't Need a Domain Service</h2>
        <p>Not every calculation involving a value object is evidence of cross-Aggregate coordination. A discount calculation that only touches one <code>Order</code> and a plain <code>coupon</code> value object is really just Aggregate logic that happens to live in a helper class — it doesn't need two independently-loaded Aggregates to make its decision. The tell for a genuine Domain Service is that the Application layer has to load two separate Repositories and hand both results to something, because neither Aggregate alone has enough information to decide.</p>
        <p>Getting this distinction wrong in either direction costs you something concrete: forcing the rule into one Aggregate means that Aggregate now imports and understands a class it has no business depending on; splitting out a Domain Service for logic that only ever touches one Aggregate just adds an indirection with nothing to show for it.</p>
        <div className="article-note"><strong>Further reading in the repo</strong><p>
          <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/docs/architecture/domain-service.md" target="_blank" rel="noreferrer">docs/architecture/domain-service.md</a> — the full Domain Service / Technical Service pattern, with the misuse example above · <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/implementations/fastapi/examples/src/payment/domain/refund_eligibility_service.py" target="_blank" rel="noreferrer">payment/domain/refund_eligibility_service.py</a> — the real, running code
        </p></div>
      </>
    ),
  },
  ko: {
    kicker: 'DDD · Tactical Design',
    title: (
      <>Domain Service:<br /><em>규칙이 하나의 Aggregate에 속하지 않을 때</em></>
    ),
    lede: '어떤 비즈니스 규칙은 정말로 두 개의 Aggregate를 동시에 놓고 판단해야 한다. 그 규칙을 억지로 어느 한쪽에 밀어 넣으면 캡슐화가 깨진다 — 상태를 갖지 않고 오직 판단만 하는 Domain Service가 양쪽 모두를 온전하게 지키는 이음매다.',
    body: (
      <>
        <p>대부분의 도메인 로직은 하나의 Aggregate Root 안에 깔끔하게 들어맞는다. 하지만 가끔은 판단을 내리기 위해 독립된 두 개의 Aggregate를 함께 읽어야 하거나, 어느 쪽이 그 로직을 소유해야 하는지 정말로 애매하거나, Aggregate가 관여해서는 안 되는 외부 서비스 I/O를 호출해야 하는 경우가 있다. 이 틈을 메우는 것이 Domain Service다 — 그리고 이걸 정확히 짚고 넘어갈 필요가 있는데, 실제로는 필요하지 않은데도 가장 자주 손이 가는 패턴이기도 하기 때문이다.</p>
        <h2>Domain Service가 아닌 것</h2>
        <p>Domain Service는 상태를 갖지 않는다. 오직 로직만 갖는다. "Domain Service"가 상태를 필요로 하기 시작한다면, 그건 그것이 Domain Service가 아니라는 신호다 — 설계를 다시 생각해봐야 한다. 그리고 Domain Service는 스스로 뭔가를 조회하지도 않는다:</p>
        <pre><code>{`# wrong — a Domain Service using the Repository directly
class OrderValidationService:
    def __init__(self, order_repository: OrderRepository) -> None:
        self.order_repository = order_repository  # forbidden

    async def validate_order(self, order_id: str) -> bool:
        orders, _ = await self.order_repository.find_orders(order_id=order_id)  # forbidden
        # ...`}</code></pre>
        <p>Domain Service는 이미 로드된 도메인 객체를 받아서 그것들을 판단만 한다. 조회 자체는 Domain Service가 아니라 Application Service의 몫이다.</p>
        <h2>실제 예시: RefundEligibilityService</h2>
        <p>도메인 규칙은 이렇다: 환불은 원래 결제가 <code>COMPLETED</code> 상태여야 하고, 환불 금액이 결제 금액을 초과할 수 없다. <code>Payment</code> Aggregate는 자신에 대한 환불 시도가 있는지 전혀 모른다 — 환불은 항상 별도의 Aggregate로만 존재한다. <code>Refund</code> Aggregate 역시 원래 결제의 금액이나 상태를 모른다 — <code>paymentId</code>를 통해서만 그것을 참조할 뿐이다.</p>
        <p>이 판단을 둘 중 어느 Aggregate의 메서드 안에 넣는다면, 그 Aggregate는 다른 Aggregate 전체를 파라미터로 받아야 하게 되고, 이는 두 Aggregate 모두가 지켜야 할 경계를 깨뜨린다. 그래서 이 판단은 Domain Service 안에 있고, Application 계층이 — 두 Aggregate를 각각 독립적으로 로드한 뒤 — 그 Domain Service에 위임한다:</p>
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
        <p><code>RefundEligibilityService</code>는 직접 인스턴스화된다 — FastAPI의 <code>Depends()</code>로 등록되는 일이 없으며, "상태를 갖지 않고 프레임워크 의존성도 없다"는 원칙을 그대로 지킨다. 이 클래스의 단위 테스트는 Application 계층을 아예 거치지 않는다. 클래스를 직접 인스턴스화해서 판단 로직만 검증한다. <code>classification</code>과 <code>ml_fraud_risk_score</code>는 각각 상위(upstream)의 Technical Service — LLM 기반 분류기와 이력 기반 스코어링 모델(각각 별도의 글에서 다룬다) — 가 만들어낸 독립적인 두 신호다. 이 Domain Service는 둘 중 어느 것도 직접 호출하지 않고, 이미 계산된 값을 자신의 고정된 임계값과 비교할 뿐이다. 전체 코드는 <code>implementations/fastapi/examples/src/payment/domain/refund_eligibility_service.py</code>에 있으며, 같은 위치에 <code>payment.py</code>, <code>refund.py</code>, 그리고 위의 command handler가 함께 있다.</p>
        <p>이 예시는 영구적인 회귀 방지 장치도 하나 얻었다: <code>payment/domain/</code> 내에서 <code>payment.py</code>가 <code>Refund</code> 클래스를 직접 import하지 않는지, 그리고 그 반대도 마찬가지인지를 검사하는 Harness 규칙이다 — 이는 두 Aggregate가 서로를 필드로 갖지 않고 오직 ID로만 참조한다는 것을 증명한다. <code>evaluate(payment: Payment, refund: Refund)</code>처럼 Domain Service가 둘을 함수 파라미터로 받는 정당한 패턴은 이 규칙의 검사 대상이 명시적으로 아니다.</p>
        <h2>Domain Service vs. Application Service vs. Technical Service</h2>
        <p>서로 헷갈리기 쉬운 세 개념은 무엇에 의존하는지로 구분된다. <strong>Application Service</strong>는 유스케이스를 조율한다 — Repository를 호출하고 트랜잭션을 실행한다. <strong>Domain Service</strong>는 그 안에서 도메인 판단을 처리하며, 오직 다른 도메인 객체에만 의존한다. <strong>Technical Service</strong>는 기술적 구현 자체가 핵심인 부분을 처리한다 — 암호화, 파일 저장, 외부 API 클라이언트 등 — 이는 Application 계층이 의존하는 인터페이스 뒤로 추상화되고, 실제 SDK 사용은 Infrastructure 계층의 구현체 안에만 갇혀 있다.</p>
        <p>Technical Service와의 차이는 짚고 넘어갈 가치가 있다. 둘 다 Application Service에 주입되고, 호출부 입장에서는 둘 다 "그냥 또 하나의 의존성"처럼 보이기 때문이다. Technical Service의 인터페이스는 어떤 도메인 규칙과도 무관한 기술적 관심사를 중심으로 만들어진다 — <code>CryptoService.encrypt()</code>는 order가 뭔지 payment가 뭔지 전혀 모른다. Domain Service의 인터페이스는 도메인 판단을 중심으로 만들어진다 — <code>RefundEligibilityService.evaluate()</code>는 Payment/Refund 도메인 바깥에서는 아무 의미가 없다.</p>
        <div className="article-note"><strong>기본 배치 원칙: 공유 최상위 모듈이 아니라 도메인 내부</strong><p>Technical Service는 먼저 그것을 필요로 하는 도메인 안에 둔다. 여러 도메인이 실제로 같은 구현을 공유하게 된 뒤에야 공유 모듈로 승격한다 — 언젠가 다른 도메인이 필요로 할지도 모른다는 이유로 미리 그렇게 하지 않는다. 이것은 기능뿐 아니라 모듈 경계에도 적용되는 YAGNI다.</p></div>
        <h2>규칙이 정말로 Domain Service를 필요로 하지 않을 때</h2>
        <p>value object가 관여하는 모든 계산이 Aggregate 간 조율의 증거는 아니다. 하나의 <code>Order</code>와 평범한 <code>coupon</code> value object만 다루는 할인 계산은 사실 헬퍼 클래스 안에 놓여 있을 뿐인 Aggregate 로직에 불과하다 — 판단을 내리는 데 독립적으로 로드된 두 개의 Aggregate가 필요하지 않다. 진짜 Domain Service임을 알아보는 단서는, Application 계층이 두 개의 별도 Repository를 로드해서 그 두 결과를 무언가에 함께 넘겨야 한다는 점이다. 어느 한쪽 Aggregate만으로는 판단에 충분한 정보가 없기 때문이다.</p>
        <p>이 구분을 어느 방향으로든 잘못 판단하면 구체적인 대가를 치른다: 규칙을 하나의 Aggregate에 억지로 밀어 넣으면 그 Aggregate는 자신이 의존할 이유가 없는 클래스를 이제 import하고 이해해야 한다. 반대로 하나의 Aggregate만 다루는 로직을 위해 Domain Service를 굳이 분리해내면, 얻는 것 없이 간접 계층 하나만 늘어난다.</p>
        <div className="article-note"><strong>저장소 내 추가 자료</strong><p>
          <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/docs/architecture/domain-service.md" target="_blank" rel="noreferrer">docs/architecture/domain-service.md</a> — Domain Service / Technical Service 패턴 전체와 위의 오용 사례 · <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/implementations/fastapi/examples/src/payment/domain/refund_eligibility_service.py" target="_blank" rel="noreferrer">payment/domain/refund_eligibility_service.py</a> — 실제 동작하는 코드
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
