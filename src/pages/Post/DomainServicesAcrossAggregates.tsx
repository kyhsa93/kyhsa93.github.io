import PostLayout from '../../components/PostLayout';

export default function DomainServicesAcrossAggregates() {
  return (
    <PostLayout
      kicker="DDD · Tactical Design"
      title={<>Domain Services:<br /><em>When a Rule Doesn't Belong to One Aggregate</em></>}
      lede="Some business rules genuinely need two Aggregates in the room at once. Forcing the rule into either one breaks encapsulation; a Domain Service that holds no state and only judges is the seam that keeps both sides intact."
      date="2026.07.22"
      readMinutes={13}
    >
      <p>Most domain logic fits cleanly inside a single Aggregate Root. But every so often a rule needs to read two independent Aggregates to make a judgment, or it's genuinely unclear which one should own it, or it requires calling an external service an Aggregate has no business doing I/O for. That's the gap a Domain Service fills — and it's worth being precise about, because it's also the pattern most often reached for when it isn't actually needed.</p>
      <h2>What a Domain Service Is Not</h2>
      <p>It holds no state. It only holds logic. If a "Domain Service" starts needing state, that's a sign it isn't one — reconsider the design. It also never looks anything up itself:</p>
      <pre><code>{`// wrong — a Domain Service using the Repository directly
export class OrderValidationService {
  constructor(private readonly orderRepository: OrderRepository) {} // forbidden

  public async validateOrder(orderId: string): Promise<boolean> {
    const { orders } = await this.orderRepository.findOrders(/* ... */)  // forbidden
    // ...
  }
}`}</code></pre>
      <p>A Domain Service takes already-loaded domain objects and only judges them. The lookup itself is the Application Service's job, not the Domain Service's.</p>
      <h2>A Real Example: RefundEligibilityService</h2>
      <p>The domain rule: a refund requires the original payment to be in the <code>COMPLETED</code> state, and the refund amount can't exceed the payment amount. The <code>Payment</code> Aggregate doesn't know about any refund attempt against it — a refund only ever exists as a separate Aggregate. The <code>Refund</code> Aggregate doesn't know the original payment's amount or status either — it only references it via <code>paymentId</code>.</p>
      <p>Putting this judgment inside either Aggregate's own method would mean that Aggregate has to take the entire other Aggregate as a parameter, which breaks the boundary both of them are supposed to protect. So the judgment lives in a Domain Service that the Application layer — having loaded both Aggregates independently — delegates to:</p>
      <pre><code>{`// domain/refund-eligibility-service.ts — a Domain Service (no framework decorator)
export interface RefundDecision {
  readonly approved: boolean
  readonly reason?: string
}

export class RefundEligibilityService {
  public evaluate(payment: Payment, refund: Refund): RefundDecision {
    if (payment.status !== PaymentStatus.COMPLETED) {
      return { approved: false, reason: PaymentErrorMessage['A refund can only be requested for a completed payment.'] }
    }
    if (refund.amount > payment.amount) {
      return { approved: false, reason: PaymentErrorMessage['The refund amount cannot exceed the payment amount.'] }
    }
    return { approved: true }
  }
}`}</code></pre>
      <pre><code>{`// application/command/request-refund-command-handler.ts — loads both Repositories and delegates
export class RequestRefundCommandHandler {
  private readonly refundEligibilityService = new RefundEligibilityService()

  public async execute(command: RequestRefundCommand): Promise<Refund> {
    const payment = await this.paymentRepository
      .findPayments({ paymentId: command.paymentId, ownerId: command.requesterId, take: 1, page: 0 })
      .then((r) => r.payments.pop())
    if (!payment) throw new Error(PaymentErrorMessage['Payment not found.'])

    const refund = Refund.create({ paymentId: payment.paymentId, amount: command.amount, reason: command.reason })

    const decision = this.refundEligibilityService.evaluate(payment, refund)
    if (decision.approved) refund.approve({ accountId: payment.accountId, ownerId: payment.ownerId })
    else refund.reject(decision.reason ?? 'The refund request was rejected.')

    await this.refundRepository.saveRefund(refund)
    return refund
  }
}`}</code></pre>
      <p><code>RefundEligibilityService</code> is instantiated directly with <code>new</code> — it's never registered in a DI container, staying true to "holds no state, no framework dependency." Its unit test doesn't go through the Application layer at all; it <code>new</code>s the class directly and verifies only the decision logic. The full code lives at <code>implementations/nestjs/examples/src/payment/domain/refund-eligibility-service.ts</code> alongside <code>payment.ts</code>, <code>refund.ts</code>, and the command handler above.</p>
      <p>This example also earned itself a permanent regression guard: a harness rule checks, within <code>payment/domain/</code>, that <code>payment.ts</code> never directly imports <code>Refund</code> as a type and vice versa — proving the two Aggregates only ever reference each other by ID, never by holding one another as a field. The legitimate pattern of a Domain Service taking both as function parameters, like <code>evaluate(payment: Payment, refund: Refund)</code>, is explicitly not a target of that rule.</p>
      <h2>Domain Service vs. Application Service vs. Technical Service</h2>
      <p>Three easily-confused concepts, told apart by what they depend on. The <strong>Application Service</strong> coordinates the use case — calling the Repository, running the transaction. The <strong>Domain Service</strong> handles the domain judgment inside it, depending only on other domain objects. The <strong>Technical Service</strong> handles the piece where a technical implementation is the actual point — encryption, file storage, an external API client — abstracted behind an interface the Application layer depends on, with the real SDK usage confined to the Infrastructure-layer implementation.</p>
      <p>The difference from a Technical Service is worth spelling out, since both get injected into an Application Service and both look like "just another dependency" from the call site. A Technical Service's interface is shaped around a technical concern unrelated to any domain rule — <code>CryptoService.encrypt()</code> doesn't know what an order or a payment is. A Domain Service's interface is shaped around a domain judgment — <code>RefundEligibilityService.evaluate()</code> is meaningless outside the Payment/Refund domain.</p>
      <div className="article-note"><strong>Placement default: inside the domain, not a shared top-level module</strong><p>Put a Technical Service inside the domain that needs it first. Only promote it to a shared module once multiple domains actually end up sharing the same implementation — not in advance, just because another domain might someday. This is YAGNI applied to module boundaries, not just to features.</p></div>
      <h2>When the Rule Really Doesn't Need a Domain Service</h2>
      <p>Not every calculation involving a value object is evidence of cross-Aggregate coordination. A discount calculation that only touches one <code>Order</code> and a plain <code>coupon</code> value object is really just Aggregate logic that happens to live in a helper class — it doesn't need two independently-loaded Aggregates to make its decision. The tell for a genuine Domain Service is that the Application layer has to load two separate Repositories and hand both results to something, because neither Aggregate alone has enough information to decide.</p>
      <p>Getting this distinction wrong in either direction costs you something concrete: forcing the rule into one Aggregate means that Aggregate now imports and understands a class it has no business depending on; splitting out a Domain Service for logic that only ever touches one Aggregate just adds an indirection with nothing to show for it.</p>
      <div className="article-note"><strong>Further reading in the repo</strong><p>
        <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/docs/architecture/domain-service.md" target="_blank" rel="noreferrer">docs/architecture/domain-service.md</a> — the full Domain Service / Technical Service pattern, with the misuse example above · <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/implementations/nestjs/examples/src/payment/domain/refund-eligibility-service.ts" target="_blank" rel="noreferrer">payment/domain/refund-eligibility-service.ts</a> — the real, running code
      </p></div>
    </PostLayout>
  );
}
