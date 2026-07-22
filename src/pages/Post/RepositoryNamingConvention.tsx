import PostLayout from '../../components/PostLayout';

export default function RepositoryNamingConvention() {
  return (
    <PostLayout
      slug="repository-naming-convention"
      kicker="Repository Pattern · Conventions"
      title={<>The Naming Rule<br /><em>That Caught Real Bugs</em></>}
      lede="A method-naming convention feels like the most boring possible thing to standardize. Then you write a tool that actually checks it, run it once, and it finds three real violations nobody had noticed across four different codebases."
    >
      <p>The Repository pattern itself is a settled idea — one Aggregate Root, one Repository interface in the Domain layer, one implementation in Infrastructure. What's less obvious is how much drift is possible in the method names on that interface, and how much that drift actually costs once several people (or several independently-written language ports) are writing against the same convention.</p>
      <h2>The Rule</h2>
      <p>Three method-name patterns cover every Repository operation. List lookup is always <code>find&lt;Noun&gt;s</code> — <code>findOrders</code>, <code>findUsers</code>. Save or upsert is <code>save&lt;Noun&gt;</code>. Delete is <code>delete&lt;Noun&gt;</code>. That's the whole vocabulary.</p>
      <p>The single-record case doesn't get its own method. A Service calls the list lookup with <code>take: 1</code> and pulls the record out with <code>.then(r =&gt; r.&lt;noun&gt;s.pop())</code>:</p>
      <pre><code>{`const order = await this.orderRepository
  .findOrders({ orderId, take: 1, page: 0 })
  .then((r) => r.orders.pop())

if (!order) throw new Error(OrderErrorMessage['Order not found.'])`}</code></pre>
      <p>Keeping <code>findOne</code> and <code>findMany</code> as separate methods duplicates the dynamic filter-condition logic between them for no real benefit — unifying the lookup into one path keeps the Repository implementation simpler, and there's exactly one place to add a new optional filter later. And a Repository never has an update method at all: look the Aggregate up, change it through its own domain method, and save it via <code>save&lt;Noun&gt;</code> — an <code>updateOrder(patch)</code> method would let a caller mutate fields directly, bypassing the invariant checks the Aggregate exists to enforce.</p>
      <h2>Where This Actually Broke</h2>
      <p>A cross-language audit of this repo's five ports, specifically hunting for "design deviations not justified by real language differences," found the root doc's naming rule violated in four of the five languages, each in a different way. Two used a bare <code>Save</code>/<code>save</code> with no noun at all — compiles fine, reads fine in isolation, but breaks the moment you're scanning a Repository interface for what it actually does across a codebase with more than one Aggregate. A second BC in four of the five languages — the older of two domains in this repo — had a "dedicated <code>findOne</code> plus a separate <code>findAll</code>" pair, the exact anti-pattern the unified lookup is meant to prevent, sitting right next to a newer domain in the same codebase that had already gotten it right. Only one language was compliant everywhere.</p>
      <p>The most instructive single case: one language's own naming-convention doc proudly declared the Repository-naming cleanup "done." It was — for the Command-side Repository. The parallel Query-side interfaces, four of them, still had the old pattern untouched. The doc wasn't lying so much as covering half the ground and calling it the whole thing.</p>
      <div className="article-note"><strong>Why "the doc says it's fixed" isn't proof</strong><p>A cleanup that touches one interface and forgets its Query-side twin is invisible in a diff review that only looks at the file you expect to have changed. Trust the naming pattern only once you've grepped every interface with a Repository-shaped role, not just the one the changelog entry mentions.</p></div>
      <h2>Why a Rule This Simple Kept Slipping Through</h2>
      <p>No automated check existed for this specific convention. Harnesses in this repo check structural placement — is the Repository interface in <code>domain/</code>, is the implementation in <code>infrastructure/</code>, does the Interface layer avoid touching Infrastructure directly — but none of that says anything about whether a method is spelled <code>save</code> or <code>saveOrder</code>. A naming convention that only lives in prose gets followed exactly as consistently as everyone remembers to reread the prose, which in practice means: well, until the second person touches the file, or the fourth language port is written by someone who read a different paragraph first.</p>
      <h2>Turning the Rule Into a Regression Guard</h2>
      <p>The fix that actually stuck wasn't a fifth manual pass — it was writing one harness rule per language that mechanically flags the violating shapes: a blocklist of <code>findBy*</code>, bare <code>findAll</code>, bare <code>save</code>, bare <code>delete</code>, and anything without the expected noun suffix. Every language already had its own harness (a TypeScript AST walk, a Go program, bash-plus-grep, a Python AST walk — the mechanism differs, the rule doesn't), so this was additive, not a new tool.</p>
      <p>Run against the newly-fixed code, it passed everywhere, as expected. Run against a different domain nobody had thought to re-check — the authentication domain, in three of the five languages — it immediately found three more real violations that had never been part of any prior audit's scope, because prior audits had all been scoped to the two business domains everyone kept thinking about. A rule this cheap to write turned out to be the actual fix; the manual audits before it were finding symptoms one at a time.</p>
      <h2>The Same Three Names, in Five Different Type Systems</h2>
      <p>Once fixed, the interface reads almost identically across every language — only the surrounding syntax changes, never the three method-name patterns themselves:</p>
      <pre><code>{`// Go
type Repository interface {
	FindAccounts(ctx context.Context, q FindQuery) ([]*Account, int, error)
	SaveAccount(ctx context.Context, account *Account) error
}

// Java
public interface AccountRepository {
    AccountsWithCount findAccounts(AccountFindQuery query);
    void saveAccount(Account account);
    void deleteAccount(String accountId);
}

// Kotlin
interface AccountRepository {
    fun findAccounts(query: AccountFindQuery): Pair<List<Account>, Long>
    fun saveAccount(account: Account)
    fun deleteAccount(accountId: String)
}

// Python (FastAPI)
class AccountRepository(AccountQuery, ABC):
    @abstractmethod
    async def save_account(self, account: Account) -> None: ...`}</code></pre>
      <p>Go returns a slice plus a count plus an error, Kotlin reaches for a <code>Pair</code>, Python leans on <code>ABC</code> and <code>async</code> — every one of those differences is a language idiom, not an architecture decision. What a harness rule for this convention actually has to check is language-agnostic almost by definition: strip the syntax away, and it's asking whether the method is spelled <code>find&lt;Noun&gt;s</code>/<code>save&lt;Noun&gt;</code>/<code>delete&lt;Noun&gt;</code>, full stop. That's exactly why the same blocklist logic (flag <code>findBy*</code>, bare <code>findAll</code>, bare <code>save</code>) ported cleanly into five completely different static-analysis mechanisms — a TypeScript AST walk, a Go program, bash-plus-grep, a Kotlin/Java AST walk, a Python AST walk — without any of them needing a fundamentally different rule.</p>
      <h2>What the Rule Deliberately Doesn't Check</h2>
      <p>It doesn't check whether the noun is spelled correctly for the domain, whether the return shape is right, or whether the query logic inside the method is correct — that's business logic, and a naming-convention harness rule staying out of business logic is exactly the discipline this repo's harness design keeps to everywhere. It checks one narrow, mechanically-verifiable thing: does the method name on a Repository-shaped interface match one of three patterns. That narrowness is what makes it cheap enough to actually run on every commit instead of every few months.</p>
      <div className="article-note"><strong>Further reading in the repo</strong><p>
        <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/docs/architecture/repository-pattern.md" target="_blank" rel="noreferrer">docs/architecture/repository-pattern.md</a> — the full naming rules, soft delete, and dynamic filter pattern · <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/docs/harness.md" target="_blank" rel="noreferrer">docs/harness.md</a> — what a harness rule may and may not assume
      </p></div>
    </PostLayout>
  );
}
