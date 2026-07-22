import PostLayout from '../../components/PostLayout';

export default function SameArchitectureFiveLanguages() {
  return (
    <PostLayout
      kicker="Comparative · Architecture"
      title={<>Same Architecture,<br /><em>Five Languages</em></>}
      lede="The same Repository/Query separation, implemented independently in NestJS, Go, Java, Kotlin, and FastAPI, produces five genuinely different-looking pieces of code. What's worth noticing is exactly how much of the underlying decision stays identical anyway."
      date="2026.07.22"
      readMinutes={14}
    >
      <p>One way to test whether an architectural principle is actually language-agnostic, rather than accidentally TypeScript-shaped, is to implement it independently in enough languages that the accidental parts fall away and only the real decision is left. This repo does that for the same Account domain across five backends: NestJS (TypeScript), Go, Spring Boot in both Java and Kotlin, and FastAPI (Python). The Repository/Query split is the clearest single place to see what's essential and what's just syntax.</p>
      <h2>TypeScript: An Abstract Class as the Interface</h2>
      <p>NestJS has no native "interface" concept for dependency injection — a plain TypeScript <code>interface</code> disappears at compile time and can't be used as a DI token. So the Query contract is an abstract class instead, which does survive to runtime:</p>
      <pre><code>{`export abstract class OrderQuery {
  abstract getOrders(query: GetOrdersQuery): Promise<GetOrdersResult>
  abstract getOrder(query: GetOrderQuery): Promise<GetOrderResult>
}

// infrastructure/order-query-impl.ts
export class OrderQueryImpl extends OrderQuery {
  public async getOrders(query: GetOrdersQuery): Promise<GetOrdersResult> {
    // a query optimized for reading, with no Aggregate reconstitution
  }
}`}</code></pre>
      <p>A QueryHandler is typed against <code>OrderQuery</code>, never <code>OrderRepository</code> — the DI container binds the interface to its implementation, and the Query side simply has no compile-time path to a write method at all.</p>
      <h2>Go: The Same Guarantee, With No Interface Declared Twice</h2>
      <p>Go's structural typing makes the same guarantee without a parallel implementation class. Because any type satisfying a larger interface automatically satisfies a smaller one embedded inside it, <code>Query</code> and <code>Repository</code> can share one real implementation with zero duplication:</p>
      <pre><code>{`// Query is a Query-only interface that exposes only read-only lookup methods. Query
// Handlers must depend only on this interface so they have no access to write methods.
// Because Go interfaces use structural typing, any implementation that satisfies
// Repository automatically satisfies Query too — there's no need for two implementations.
type Query interface {
	FindAccounts(ctx context.Context, q FindQuery) ([]*Account, int, error)
	FindTransactions(ctx context.Context, accountID string, page, take int) ([]Transaction, int, error)
	HasTransactionWithReference(ctx context.Context, referenceID string, txType TransactionType) (bool, error)
}

// Repository is a Command-only interface that adds a write method on top of Query's read methods.
type Repository interface {
	Query
	SaveAccount(ctx context.Context, account *Account) error
}`}</code></pre>
      <p>A Query Handler declares a dependency on <code>Query</code>; a Command Handler declares one on <code>Repository</code>. Both get satisfied by the exact same struct at the wiring site in <code>main.go</code> — the compiler enforces the segregation without the codebase paying for a second implementation type. Go also has no <code>findOne</code> equivalent method at all; the repeated single-record lookup pattern is pulled out as a free function instead, since there's no method chaining idiom like the other languages' <code>.then(r =&gt; r.orders.pop())</code>:</p>
      <pre><code>{`func FindOne(ctx context.Context, q Query, accountID, ownerID string) (*Account, error) {
	accounts, _, err := q.FindAccounts(ctx, FindQuery{AccountID: accountID, OwnerID: ownerID, Take: 1})
	if err != nil {
		return nil, err
	}
	if len(accounts) == 0 {
		return nil, ErrNotFound
	}
	return accounts[0], nil
}`}</code></pre>
      <h2>Python: An ABC That Inherits the Write Side From the Read Side</h2>
      <p>FastAPI's version reads almost like a translation of Go's idea into a different type system — the write-capable interface extends the read-only one, rather than the read-only one being carved out of an already-existing write interface:</p>
      <pre><code>{`class AccountQuery(ABC):
    """A read-only interface — for the Query Handler only. Never exposes a write method
    such as save() (see cqrs-pattern.md). Shares its method signatures with
    AccountRepository (the write model) but is a separate contract — a Query Handler must
    always depend only on this type."""

    @abstractmethod
    async def find_accounts(
        self, page: int, take: int,
        account_id: str | None = None, owner_id: str | None = None,
        status: list[str] | None = None,
    ) -> tuple[list[Account], int]: ...


class AccountRepository(AccountQuery, ABC):
    @abstractmethod
    async def save_account(self, account: Account) -> None: ...`}</code></pre>
      <p>FastAPI has no DI container in the framework sense — <code>Depends()</code> factories are the composition root — but the ABC boundary does the identical job as TypeScript's abstract class and Go's interface embedding: a Query Handler that only ever receives an <code>AccountQuery</code>-typed dependency has no method available to call that would write anything, regardless of which concrete class actually gets injected.</p>
      <h2>Kotlin and Java: One Interface, and a Deliberately Different Choice</h2>
      <p>Kotlin's version keeps read and write methods on a single interface, leaning on the language's own idioms for the return shape instead — a <code>Pair&lt;List&lt;Account&gt;, Long&gt;</code> where TypeScript would return <code>{`{ accounts, count }`}</code>:</p>
      <pre><code>{`interface AccountRepository {
    fun findAccounts(query: AccountFindQuery): Pair<List<Account>, Long>
    fun saveAccount(account: Account)
    fun deleteAccount(accountId: String)
    fun hasTransactionWithReference(referenceId: String, type: TransactionType): Boolean
}`}</code></pre>
      <p>This isn't a Query/Repository split at all — and that's a genuinely different, deliberate decision, not an oversight. The root <code>cqrs-pattern.md</code> spectrum explicitly allows this: splitting an Application Service into Command/Query methods is already a lightweight application of CQRS, and it's sufficient when a domain has few enough use cases that the Service class stays simple. Java's Account example documents exactly this choice for its Query Service, using the write-capable Repository directly rather than introducing a parallel read-only interface for a domain that doesn't yet need one. That's a live illustration of the "when to adopt" table in the CQRS doc, not a violation of it — the violation version of this same shape is a Query Handler using a Repository <em>silently</em>, with no interface boundary reasoned about at all, which is a different failure covered in the CQRS-in-practice post.</p>
      <h2>What Stayed Identical Across All Five</h2>
      <p>Despite the type-system differences, every implementation agrees on the same handful of underlying rules. The list-lookup method is always the plural <code>find&lt;Noun&gt;s</code> shape, never a separate single-record method — Go and TypeScript both extract the single-record case as a helper around the same list method, just via a free function versus a class method. The idempotency check for a Payment BC reaction — <code>hasTransactionWithReference</code> / <code>HasTransactionWithReference</code> / <code>has_transaction_with_reference</code> — exists in every single language, with an almost word-for-word identical doc comment explaining why the transaction type has to be checked alongside the reference ID, not just the reference ID alone. And in every language, the Repository interface lives in the domain layer while the concrete implementation — the actual SQL, the actual ORM — lives in infrastructure, with the Application layer depending only on the interface.</p>
      <div className="article-note"><strong>The actual takeaway</strong><p>"Framework-agnostic architecture" doesn't mean the code looks the same everywhere — it clearly doesn't. It means the same decision gets made independently in each ecosystem's own idiom: which method can write, which can only read, and where that boundary is enforced by the type system rather than by convention alone. The five implementations above are five different answers to "how do I say this in my language," to the exact same question.</p></div>
      <div className="article-note"><strong>Further reading in the repo</strong><p>
        <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/docs/architecture/repository-pattern.md" target="_blank" rel="noreferrer">docs/architecture/repository-pattern.md</a> · <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/docs/architecture/cqrs-pattern.md" target="_blank" rel="noreferrer">docs/architecture/cqrs-pattern.md</a> — the "when to adopt" spectrum Java's Account example sits on · <a href="https://github.com/kyhsa93/backend-service-playbook/tree/main/implementations" target="_blank" rel="noreferrer">implementations/</a> — all five language ports, side by side
      </p></div>
    </PostLayout>
  );
}
