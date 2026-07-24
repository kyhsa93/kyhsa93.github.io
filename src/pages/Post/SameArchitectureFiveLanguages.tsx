import PostLayout from '../../components/PostLayout';
import { useLocale } from '../../lib/locale';

const content = {
  en: {
    kicker: 'Comparative · Architecture',
    title: (
      <>
        Same Architecture,<br /><em>Five Languages</em>
      </>
    ),
    lede: "The same Repository/Query separation, implemented independently in NestJS, Go, Java, Kotlin, and FastAPI, produces five genuinely different-looking pieces of code. What's worth noticing is exactly how much of the underlying decision stays identical anyway.",
    body: (
      <>
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
        <div className="article-note"><strong>Further reading in the repo</strong><p>
          <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/docs/architecture/repository-pattern.md" target="_blank" rel="noreferrer">docs/architecture/repository-pattern.md</a> · <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/docs/architecture/cqrs-pattern.md" target="_blank" rel="noreferrer">docs/architecture/cqrs-pattern.md</a> — the "when to adopt" spectrum Java's Account example sits on · <a href="https://github.com/kyhsa93/backend-service-playbook/tree/main/implementations" target="_blank" rel="noreferrer">implementations/</a> — all five language ports, side by side
        </p></div>
      </>
    ),
  },
  ko: {
    kicker: 'Comparative · Architecture',
    title: (
      <>
        같은 아키텍처,<br /><em>다섯 개의 언어</em>
      </>
    ),
    lede: '같은 Repository/Query 분리를 NestJS, Go, Java, Kotlin, FastAPI에서 각각 독립적으로 구현하면 정말로 다르게 생긴 코드 다섯 개가 나온다. 눈여겨볼 부분은 그럼에도 그 밑바탕의 결정이 얼마나 그대로 유지되는가다.',
    body: (
      <>
        <p>어떤 아키텍처 원칙이 우연히 TypeScript 모양을 하고 있는 게 아니라 실제로 언어에 독립적인지 시험해보는 한 가지 방법은, 충분히 많은 언어에서 독립적으로 구현해서 우연히 붙은 부분들은 떨어져 나가고 진짜 결정만 남게 만드는 것이다. 이 저장소는 같은 Account 도메인을 대상으로 다섯 개의 백엔드에서 그렇게 했다: NestJS(TypeScript), Go, Java와 Kotlin 각각의 Spring Boot, 그리고 FastAPI(Python). Repository/Query 분리는 무엇이 본질이고 무엇이 그냥 문법일 뿐인지 가장 선명하게 볼 수 있는 지점이다.</p>
        <h2>TypeScript: 인터페이스 역할을 하는 Abstract Class</h2>
        <p>NestJS에는 의존성 주입을 위한 네이티브 "interface" 개념이 없다 — 순수 TypeScript <code>interface</code>는 컴파일 시점에 사라지기 때문에 DI 토큰으로 쓸 수 없다. 그래서 Query 계약은 대신 abstract class로 정의되는데, 이건 런타임까지 살아남는다:</p>
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
        <p>QueryHandler는 <code>OrderRepository</code>가 아니라 항상 <code>OrderQuery</code>에 대해 타입이 지정된다 — DI 컨테이너가 인터페이스를 구현체에 바인딩하며, Query 쪽에는 컴파일 시점에 write 메서드로 갈 수 있는 경로 자체가 아예 존재하지 않는다.</p>
        <h2>Go: 인터페이스를 두 번 선언하지 않고 얻는 같은 보장</h2>
        <p>Go의 구조적 타이핑(structural typing)은 병렬 구현 클래스 없이도 같은 보장을 준다. 더 큰 인터페이스를 만족하는 타입은 그 안에 임베딩된 더 작은 인터페이스도 자동으로 만족하기 때문에, <code>Query</code>와 <code>Repository</code>는 중복 없이 실제 구현체 하나를 공유할 수 있다:</p>
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
        <p>Query Handler는 <code>Query</code>에 대한 의존성을 선언하고, Command Handler는 <code>Repository</code>에 대한 의존성을 선언한다. 둘 다 <code>main.go</code>의 와이어링 지점에서 정확히 같은 struct에 의해 충족된다 — 컴파일러가 이 분리를 강제하면서도 코드베이스가 두 번째 구현 타입의 비용을 치르지 않는다. Go에는 <code>findOne</code>에 해당하는 메서드도 아예 없다; 다른 언어들의 <code>.then(r =&gt; r.orders.pop())</code> 같은 메서드 체이닝 관용구가 없기 때문에, 반복되는 단일 레코드 조회 패턴은 대신 자유 함수(free function)로 빼낸다:</p>
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
        <h2>Python: Read 쪽에서 Write 쪽을 상속하는 ABC</h2>
        <p>FastAPI 버전은 Go의 아이디어를 다른 타입 시스템으로 그대로 옮긴 것처럼 읽힌다 — 다만 여기서는 이미 존재하는 write 인터페이스에서 read-only 인터페이스를 떼어내는 게 아니라, write가 가능한 인터페이스가 read-only 인터페이스를 확장하는 방향이다:</p>
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
        <p>FastAPI에는 프레임워크 차원의 DI 컨테이너가 없다 — <code>Depends()</code> 팩토리가 그 자리를 대신하는 컴포지션 루트다 — 하지만 ABC 경계는 TypeScript의 abstract class나 Go의 인터페이스 임베딩과 완전히 동일한 역할을 한다: <code>AccountQuery</code> 타입의 의존성만 받는 Query Handler는, 실제로 어떤 구체 클래스가 주입되든 상관없이 무언가를 쓸(write) 수 있는 메서드를 호출할 방법이 없다.</p>
        <h2>Kotlin과 Java: 하나의 인터페이스, 그리고 의도적으로 다른 선택</h2>
        <p>Kotlin 버전은 read와 write 메서드를 하나의 인터페이스에 함께 두는 대신, 반환 형태에서는 언어 고유의 관용구에 기댄다 — TypeScript라면 <code>{`{ accounts, count }`}</code>를 반환할 자리에 <code>Pair&lt;List&lt;Account&gt;, Long&gt;</code>를 쓴다:</p>
        <pre><code>{`interface AccountRepository {
    fun findAccounts(query: AccountFindQuery): Pair<List<Account>, Long>
    fun saveAccount(account: Account)
    fun deleteAccount(accountId: String)
    fun hasTransactionWithReference(referenceId: String, type: TransactionType): Boolean
}`}</code></pre>
        <p>이건 애초에 Query/Repository 분리가 아니다 — 그리고 이것은 실수가 아니라 진짜로 다른, 의도적인 결정이다. 루트 <code>cqrs-pattern.md</code>의 스펙트럼은 이런 선택을 명시적으로 허용한다: Application Service를 Command/Query 메서드로 나누는 것 자체가 이미 경량화된 형태의 CQRS 적용이며, 도메인의 유스케이스 수가 적어서 Service 클래스가 단순하게 유지될 수 있는 경우라면 그걸로 충분하다. Java의 Account 예제는 Query Service에서 바로 이 선택을 문서화하고 있다 — 아직 필요하지 않은 도메인에 병렬 read-only 인터페이스를 새로 도입하는 대신, write가 가능한 Repository를 직접 사용하는 것이다. 이는 CQRS 문서의 "언제 도입할 것인가" 표를 살아있는 사례로 보여주는 것이지, 그것을 위반하는 게 아니다 — 같은 모양이 위반이 되는 버전은 Query Handler가 인터페이스 경계에 대한 아무런 고려 없이 Repository를 <em>암묵적으로</em> 사용하는 경우이며, 이는 CQRS-in-practice 글에서 다루는 별개의 실패 유형이다.</p>
        <h2>다섯 곳 모두에서 그대로 유지된 것</h2>
        <p>타입 시스템의 차이에도 불구하고, 모든 구현은 몇 가지 근본적인 규칙에서 의견이 일치한다. 목록 조회 메서드는 언제나 복수형 <code>find&lt;Noun&gt;s</code> 형태이며, 별도의 단일 레코드 메서드는 존재하지 않는다 — Go와 TypeScript 모두 단일 레코드 케이스를 같은 목록 조회 메서드를 감싸는 헬퍼로 뽑아내며, 다만 하나는 자유 함수로, 하나는 클래스 메서드로 뽑아낸다는 차이만 있을 뿐이다. Payment BC 리액션을 위한 멱등성(idempotency) 체크 — <code>hasTransactionWithReference</code> / <code>HasTransactionWithReference</code> / <code>has_transaction_with_reference</code> — 는 모든 언어에 존재하며, 왜 reference ID만이 아니라 transaction type도 함께 확인해야 하는지를 설명하는 거의 토씨 하나 다르지 않은 문서 주석까지 동일하다. 그리고 모든 언어에서 Repository 인터페이스는 domain 계층에 있고, 실제 구현 — 실제 SQL, 실제 ORM — 은 infrastructure에 있으며, Application 계층은 오직 인터페이스에만 의존한다.</p>
        <div className="article-note"><strong>저장소 내 추가 자료</strong><p>
          <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/docs/architecture/repository-pattern.md" target="_blank" rel="noreferrer">docs/architecture/repository-pattern.md</a> · <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/docs/architecture/cqrs-pattern.md" target="_blank" rel="noreferrer">docs/architecture/cqrs-pattern.md</a> — Java의 Account 예제가 위치한 "언제 도입할 것인가" 스펙트럼 · <a href="https://github.com/kyhsa93/backend-service-playbook/tree/main/implementations" target="_blank" rel="noreferrer">implementations/</a> — 다섯 언어 포트를 나란히
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
