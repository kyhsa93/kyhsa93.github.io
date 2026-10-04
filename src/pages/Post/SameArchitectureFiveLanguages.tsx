import PostLayout from '../../components/PostLayout';
import { useLocale, localeFromPathname } from '../../lib/locale';
import type { MetaFunction } from 'react-router';
import { createPostMeta } from '../../lib/seo';

export const meta: MetaFunction = ({ location }) =>
  createPostMeta('same-architecture-five-languages', localeFromPathname(location.pathname));

const content = {
  en: {
    kicker: 'Comparative · Architecture',
    title: (
      <>
        Same Architecture,<br /><em>Five Languages</em>
      </>
    ),
    lede: "The same Repository/Query separation, implemented independently in NestJS, Go, Java, Kotlin, and FastAPI, produces five different-looking pieces of code. What's worth noticing is how much of the underlying decision stays identical anyway.",
    body: (
      <>
        <p>One way to test whether an architectural principle is language-agnostic, rather than accidentally TypeScript-shaped, is to implement it independently in enough languages that the accidental parts fall away and only the decision itself is left. My example project does that, building the same example domain, Account, in five backends: NestJS (TypeScript), Go, Spring Boot in both Java and Kotlin, and FastAPI (Python). The Repository/Query split is the clearest single place to see what's essential and what's just syntax.</p>
        <h2>TypeScript: An Abstract Class as the Interface</h2>
        <p>NestJS has no native "interface" concept for dependency injection, because a plain TypeScript <code>interface</code> disappears at compile time and can't be used as a DI token. So the Query contract is an abstract class instead, which does survive to runtime:</p>
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
        <p>A QueryHandler is typed against <code>OrderQuery</code>, never <code>OrderRepository</code>. The DI container binds the interface to its implementation, and the Query side simply has no compile-time path to a write method at all.</p>
        <h2>Go: The Same Guarantee, With No Interface Declared Twice</h2>
        <p>Go's structural typing makes the same guarantee without a parallel implementation class. Because any type satisfying a larger interface automatically satisfies a smaller one embedded inside it, <code>Query</code> and <code>Repository</code> can share one implementation with zero duplication:</p>
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
        <p>A Query Handler declares a dependency on <code>Query</code>; a Command Handler declares one on <code>Repository</code>. Both get satisfied by the same struct at the wiring site in <code>main.go</code>, so the compiler enforces the segregation without the codebase paying for a second implementation type. Go also has no <code>findOne</code> equivalent method at all; the repeated single-record lookup pattern is pulled out as a free function instead, since there's no method chaining idiom like the other languages' <code>.then(r =&gt; r.orders.pop())</code>:</p>
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
        <p>FastAPI's version reads almost like a translation of Go's idea into a different type system: the write-capable interface extends the read-only one, rather than the read-only one being carved out of an already-existing write interface.</p>
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
        <p>FastAPI has no DI container in the framework sense (<code>Depends()</code> factories are the composition root), but the ABC boundary does the identical job as TypeScript's abstract class and Go's interface embedding. A Query Handler that only ever receives an <code>AccountQuery</code>-typed dependency has no method available to call that would write anything, regardless of which concrete class gets injected.</p>
        <h2>Kotlin and Java: One Interface, and a Deliberately Different Choice</h2>
        <p>Kotlin's version keeps read and write methods on a single interface, leaning on the language's own idioms for the return shape instead (a <code>Pair&lt;List&lt;Account&gt;, Long&gt;</code> where TypeScript would return <code>{`{ accounts, count }`}</code>):</p>
        <pre><code>{`interface AccountRepository {
    fun findAccounts(query: AccountFindQuery): Pair<List<Account>, Long>
    fun saveAccount(account: Account)
    fun deleteAccount(accountId: String)
    fun hasTransactionWithReference(referenceId: String, type: TransactionType): Boolean
}`}</code></pre>
        <p>This isn't a Query/Repository split at all, and that's a deliberate decision, not an oversight. The root <code>cqrs-pattern.md</code> spectrum explicitly allows this: splitting an Application Service into Command/Query methods is already a lightweight application of CQRS, and it's sufficient when a domain has few enough use cases that the Service class stays simple. Java's Account example documents this choice for its Query Service, using the write-capable Repository directly rather than introducing a parallel read-only interface for a domain that doesn't yet need one. That's a live illustration of the "when to adopt" table in the CQRS doc, not a violation of it. The violation version of this same shape is a Query Handler using a Repository <em>silently</em>, with no interface boundary reasoned about at all, which is a different failure covered in the CQRS-in-practice post.</p>
        <h2>What Stayed Identical Across All Five</h2>
        <p>Despite the type-system differences, every implementation agrees on the same handful of underlying rules. The list-lookup method is always the plural <code>find&lt;Noun&gt;s</code> shape, never a separate single-record method; Go and TypeScript both extract the single-record case as a helper around the same list method, just via a free function versus a class method. The idempotency check for a Payment BC reaction (<code>hasTransactionWithReference</code> / <code>HasTransactionWithReference</code> / <code>has_transaction_with_reference</code>) exists in every single language, with an almost word-for-word identical doc comment explaining why the transaction type has to be checked alongside the reference ID, not just the reference ID alone. And in every language, the Repository interface lives in the domain layer while the concrete implementation (the SQL, the ORM) lives in infrastructure, with the Application layer depending only on the interface.</p>
        <div className="article-note"><strong>Further reading</strong><p>
          <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/docs/architecture/repository-pattern.md" target="_blank" rel="noreferrer">docs/architecture/repository-pattern.md</a> (the Repository conventions, in my example project that implements the same backend design in five languages side by side) · <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/docs/architecture/cqrs-pattern.md" target="_blank" rel="noreferrer">docs/architecture/cqrs-pattern.md</a> (the "when to adopt" spectrum Java's Account example sits on) · <a href="https://github.com/kyhsa93/backend-service-playbook/tree/main/implementations" target="_blank" rel="noreferrer">implementations/</a> (all five language implementations, side by side)
        </p></div>
      </>
    ),
  },
  ko: {
    kicker: 'Comparative · Architecture',
    title: (
      <>
        같은 아키텍처를<br /><em>5개 언어로</em>
      </>
    ),
    lede: '같은 Repository/Query 분리를 NestJS, Go, Java, Kotlin, FastAPI에서 따로따로 구현했더니, 생김새가 전혀 다른 코드 5개가 나왔다. 이 글에서 보려는 건, 그런데도 밑에 깔린 결정이 얼마나 그대로 남느냐다.',
    body: (
      <>
        <p>어떤 아키텍처 원칙이 정말 언어와 상관없는 원칙인지, 아니면 어쩌다 TypeScript 모양을 하고 있을 뿐인지 확인하는 방법이 있다. 여러 언어에서 따로 구현해 보면 된다. 언어마다 우연히 붙은 부분은 떨어져 나가고 결정만 남는다. 내 예제 프로젝트에서 그렇게 해 봤다. 같은 예제 도메인 Account(계좌)를 5개 백엔드로 만들었다. NestJS(TypeScript), Go, Spring Boot(Java와 Kotlin 각각), FastAPI(Python)다. 그중 무엇이 본질이고 무엇이 문법일 뿐인지 가장 잘 보이는 곳이 Repository/Query 분리다.</p>
        <h2>TypeScript는 abstract class로 인터페이스를 대신한다</h2>
        <p>NestJS의 의존성 주입에는 "interface"를 쓸 수 없다. TypeScript의 <code>interface</code>는 컴파일하면 사라지니 DI 토큰이 될 수 없기 때문이다. 그래서 Query 계약은 런타임까지 남는 abstract class로 만든다.</p>
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
        <p>QueryHandler의 의존성 타입은 늘 <code>OrderQuery</code>이고, <code>OrderRepository</code>를 받는 일은 없다. 인터페이스와 구현체는 DI 컨테이너가 이어 준다. 그러니 Query 쪽 코드에서는 컴파일 단계부터 write 메서드를 부를 길이 없다.</p>
        <h2>Go는 인터페이스를 두 번 만들지 않는다</h2>
        <p>Go는 구조적 타이핑 덕분에 구현 클래스를 따로 두지 않고도 같은 보장을 얻는다. 큰 인터페이스를 만족하는 타입은 그 안에 임베딩한 작은 인터페이스도 저절로 만족한다. 그래서 <code>Query</code>와 <code>Repository</code>가 구현체 하나를 중복 없이 같이 쓴다.</p>
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
        <p>Query Handler는 <code>Query</code>를, Command Handler는 <code>Repository</code>를 의존성으로 받는다. <code>main.go</code>에서 조립할 때는 둘 다 같은 struct 하나를 넘긴다. 분리는 컴파일러가 지켜 주고, 구현 타입을 하나 더 만드는 비용은 들지 않는다. Go에는 <code>findOne</code> 같은 메서드도 없다. 다른 언어처럼 <code>.then(r =&gt; r.orders.pop())</code>으로 이어 붙이는 습관이 없어서, 자주 쓰는 단건 조회는 일반 함수로 빼 둔다.</p>
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
        <h2>Python은 읽기 인터페이스를 쓰기 인터페이스가 상속한다</h2>
        <p>FastAPI 쪽은 Go의 아이디어를 다른 타입 시스템으로 옮겨 놓은 것처럼 보인다. 이미 있는 write 인터페이스에서 read-only 인터페이스를 떼어 내는 방식이 아니다. write까지 되는 인터페이스가 read-only 인터페이스를 확장한다.</p>
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
        <p>FastAPI에는 프레임워크가 제공하는 DI 컨테이너가 없고, <code>Depends()</code> 팩토리가 컴포지션 루트 노릇을 한다. 그래도 ABC 경계가 하는 일은 TypeScript의 abstract class, Go의 인터페이스 임베딩과 똑같다. <code>AccountQuery</code> 타입만 받는 Query Handler는 어떤 구체 클래스가 들어오든 데이터를 쓰는 메서드를 부를 수 없다.</p>
        <h2>Kotlin과 Java는 일부러 인터페이스 하나로 간다</h2>
        <p>Kotlin은 read와 write 메서드를 인터페이스 하나에 같이 둔다. 대신 반환 모양에서 Kotlin다운 방식을 쓴다. TypeScript라면 <code>{`{ accounts, count }`}</code>를 돌려줄 자리에 <code>Pair&lt;List&lt;Account&gt;, Long&gt;</code>를 돌려준다.</p>
        <pre><code>{`interface AccountRepository {
    fun findAccounts(query: AccountFindQuery): Pair<List<Account>, Long>
    fun saveAccount(account: Account)
    fun deleteAccount(accountId: String)
    fun hasTransactionWithReference(referenceId: String, type: TransactionType): Boolean
}`}</code></pre>
        <p>보다시피 Query/Repository 분리가 아니다. 그렇다고 빠뜨린 것도 아니고, 일부러 다르게 고른 것이다. 루트의 <code>cqrs-pattern.md</code>가 제시하는 스펙트럼이 이 선택을 명시적으로 허용한다. Application Service를 Command 메서드와 Query 메서드로 나누기만 해도 이미 가벼운 CQRS이고, 유스케이스가 적어 Service 클래스가 단순하다면 그걸로 충분하다는 것이다.</p>
        <p>Java의 Account 예제는 Query Service에 이 선택을 그대로 적어 두었다. 아직 필요 없는 도메인에 read-only 인터페이스를 하나 더 만들지 않고, write까지 되는 Repository를 바로 쓴다. CQRS 문서의 "언제 도입할 것인가" 표를 코드로 보여 주는 사례이지 위반이 아니다. 같은 모양이 위반이 되는 경우는 따로 있다. Query Handler가 인터페이스 경계를 전혀 고민하지 않고 Repository를 <em>슬그머니</em> 쓰는 경우다. 이건 CQRS-in-practice 글에서 다룬 다른 종류의 실패다.</p>
        <h2>5개 언어에서 똑같이 남은 것</h2>
        <p>타입 시스템은 달라도 모든 구현이 몇 가지 규칙에는 똑같이 따른다. 목록 조회 메서드는 늘 복수형 <code>find&lt;Noun&gt;s</code> 모양이고, 단건 조회 메서드를 따로 두지 않는다. Go와 TypeScript는 둘 다 단건 조회를 같은 목록 메서드를 감싼 헬퍼로 뺀다. 한쪽은 일반 함수로, 다른 쪽은 클래스 메서드로 뺄 뿐이다.</p>
        <p>Payment BC 이벤트에 반응할 때 쓰는 멱등성 체크(<code>hasTransactionWithReference</code> / <code>HasTransactionWithReference</code> / <code>has_transaction_with_reference</code>)도 모든 언어에 있다. reference ID만 보지 않고 transaction type까지 같이 확인해야 하는 이유를 적은 문서 주석도 거의 토씨 하나 다르지 않다. 그리고 모든 언어에서 Repository 인터페이스는 domain 계층에, SQL과 ORM이 들어간 구현은 infrastructure에 있다. Application 계층은 인터페이스에만 의존한다.</p>
        <div className="article-note"><strong>더 볼 자료</strong><p>
          <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/docs/architecture/repository-pattern.md" target="_blank" rel="noreferrer">docs/architecture/repository-pattern.md</a>(같은 백엔드 설계를 5개 언어로 나란히 구현해 둔 내 예제 프로젝트의 Repository 규칙) · <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/docs/architecture/cqrs-pattern.md" target="_blank" rel="noreferrer">docs/architecture/cqrs-pattern.md</a>(Java의 Account 예제가 놓인 "언제 도입할 것인가" 스펙트럼) · <a href="https://github.com/kyhsa93/backend-service-playbook/tree/main/implementations" target="_blank" rel="noreferrer">implementations/</a>(5개 언어 구현을 나란히 볼 수 있다)
        </p></div>
      </>
    ),
  },
};

export default function SameArchitectureFiveLanguages() {
  const { locale } = useLocale();
  const c = content[locale];

  return (
    <PostLayout slug="same-architecture-five-languages" kicker={c.kicker} title={c.title} lede={c.lede}>
      {c.body}
    </PostLayout>
  );
}
