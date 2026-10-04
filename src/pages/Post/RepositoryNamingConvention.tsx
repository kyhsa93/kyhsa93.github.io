import PostLayout from '../../components/PostLayout';
import { useLocale, localeFromPathname } from '../../lib/locale';
import type { MetaFunction } from 'react-router';
import { createPostMeta } from '../../lib/seo';

export const meta: MetaFunction = ({ location }) =>
  createPostMeta('repository-naming-convention', localeFromPathname(location.pathname));

const content = {
  en: {
    kicker: 'Repository Pattern · Conventions',
    title: (
      <>
        Three Names for Every Repository,<br /><em>and Why the Rule Still Drifted</em>
      </>
    ),
    lede: "Every Repository operation fits three method names: find<Noun>s, save<Noun>, delete<Noun>. No separate single-record lookup, no update method. A rule this small seems impossible to break, yet with nothing but prose holding it in place it drifted in four of five implementations of the same design. Once a check enforced it, the first run found three more violations nobody had noticed.",
    body: (
      <>
        <p>The Repository pattern itself is a settled idea: one Aggregate Root, one Repository interface in the Domain layer, one implementation in Infrastructure. What's less obvious is how much drift is possible in the method names on that interface, and how much that drift costs once several people (or several independently written implementations) are writing against the same convention.</p>
        <p>I watched that drift happen in my example project, which implements the same backend design in five languages side by side. The naming rule below was written down from the start. It was still broken in four of the five implementations, each in a different way.</p>
        <h2>The Rule</h2>
        <p>Three method-name patterns cover every Repository operation. List lookup is always <code>find&lt;Noun&gt;s</code>, as in <code>findOrders</code> or <code>findUsers</code>. Save or upsert is <code>save&lt;Noun&gt;</code>. Delete is <code>delete&lt;Noun&gt;</code>. That's the whole vocabulary.</p>
        <p>The single-record case doesn't get its own method. A Service calls the list lookup with <code>take: 1</code> and pulls the record out with <code>.then(r =&gt; r.&lt;noun&gt;s.pop())</code>:</p>
        <pre><code>{`const order = await this.orderRepository
  .findOrders({ orderId, take: 1, page: 0 })
  .then((r) => r.orders.pop())

if (!order) throw new Error(OrderErrorMessage['Order not found.'])`}</code></pre>
        <p>Keeping <code>findOne</code> and <code>findMany</code> as separate methods duplicates the dynamic filter-condition logic between them for no benefit. Unifying the lookup into one path keeps the Repository implementation simpler, and there's exactly one place to add a new optional filter later. And a Repository never has an update method at all: look the Aggregate up, change it through its own domain method, and save it via <code>save&lt;Noun&gt;</code>. An <code>updateOrder(patch)</code> method would let a caller mutate fields directly, bypassing the invariant checks the Aggregate exists to enforce.</p>
        <h2>What the Drift Looked Like</h2>
        <p>A cross-language audit of the five implementations, specifically hunting for "design deviations not justified by real language differences," found the root doc's naming rule violated in four of the five languages, each in a different way. Two used a bare <code>Save</code>/<code>save</code> with no noun at all. That compiles fine and reads fine in isolation, but breaks the moment you're scanning a Repository interface for what it does across a codebase with more than one Aggregate. A second BC in four of the five languages (the older of the two domains) had a "dedicated <code>findOne</code> plus a separate <code>findAll</code>" pair, the exact anti-pattern the unified lookup is meant to prevent, sitting right next to a newer domain in the same codebase that had already gotten it right. Only one language was compliant everywhere.</p>
        <p>One language's naming-convention doc even declared the cleanup "done." It was, for the Command-side Repository. The four parallel Query-side interfaces still had the old pattern. The doc covered half the ground and called it the whole thing.</p>
        <div className="article-note"><strong>Why "the doc says it's fixed" isn't proof</strong><p>A cleanup that touches one interface and forgets its Query-side twin is invisible in a diff review that only looks at the file you expect to have changed. Trust the naming pattern only once you've grepped every interface with a Repository-shaped role, not just the one the changelog entry mentions.</p></div>
        <h2>Why a Rule This Simple Kept Slipping Through</h2>
        <p>No automated check existed for this specific convention. The architecture checks that did exist (scripts that statically verify code against the documented rules) looked at structural placement (is the Repository interface in <code>domain/</code>, is the implementation in <code>infrastructure/</code>, does the Interface layer avoid touching Infrastructure directly), but none of that says anything about whether a method is spelled <code>save</code> or <code>saveOrder</code>. A naming convention that only lives in prose gets followed exactly as consistently as everyone remembers to reread the prose, which in practice means until the second person touches the file, or the fourth language port is written by someone who read a different paragraph first.</p>
        <h2>Turning the Rule Into a Regression Guard</h2>
        <p>The fix that stuck wasn't another manual pass. It was writing one check per language that mechanically flags the violating shapes: a blocklist of <code>findBy*</code>, bare <code>findAll</code>, bare <code>save</code>, bare <code>delete</code>, and anything without the expected noun suffix. Every language already had its own architecture checker (a TypeScript AST walk, a Go program, bash-plus-grep, a Python AST walk; the mechanism differs, the rule doesn't), so this was additive, not a new tool.</p>
        <p>Run against the newly fixed code, it passed everywhere, as expected. Run against the authentication domain in three of the five languages, which no earlier audit had covered because all of them were scoped to the two business domains, it found three more violations. The manual audits had been finding symptoms one at a time. A rule this cheap to write was the fix.</p>
        <h2>The Same Three Names, in Five Different Type Systems</h2>
        <p>Once fixed, the interface reads almost identically across every language. Only the surrounding syntax changes, never the three method-name patterns themselves:</p>
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
        <p>Go returns a slice plus a count plus an error, Kotlin reaches for a <code>Pair</code>, Python leans on <code>ABC</code> and <code>async</code>. Every one of those differences is a language idiom, not an architecture decision. What a check for this convention has to ask is language-agnostic almost by definition: strip the syntax away, and it's asking whether the method is spelled <code>find&lt;Noun&gt;s</code>/<code>save&lt;Noun&gt;</code>/<code>delete&lt;Noun&gt;</code>, full stop. That's why the same blocklist logic (flag <code>findBy*</code>, bare <code>findAll</code>, bare <code>save</code>) ported cleanly into five completely different static-analysis mechanisms, a TypeScript AST walk, a Go program, bash-plus-grep, a Kotlin/Java AST walk, a Python AST walk, without any of them needing a fundamentally different rule.</p>
        <h2>What the Rule Deliberately Doesn't Check</h2>
        <p>It doesn't check whether the noun is spelled correctly for the domain, whether the return shape is right, or whether the query logic inside the method is correct. That's business logic, and keeping a naming check out of business logic is the same discipline the rest of my architecture checks keep to. It checks one narrow, mechanically-verifiable thing: does the method name on a Repository-shaped interface match one of three patterns. That narrowness is what makes it cheap enough to run on every commit instead of every few months.</p>
        <div className="article-note"><strong>Further reading</strong><p>
          <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/docs/architecture/repository-pattern.md" target="_blank" rel="noreferrer">docs/architecture/repository-pattern.md</a> (the full naming rules, soft delete, and dynamic filter pattern, in my example project that implements the same backend design in five languages) · <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/docs/harness.md" target="_blank" rel="noreferrer">docs/harness.md</a> (what an architecture check may and may not assume)
        </p></div>
      </>
    ),
  },
  ko: {
    kicker: 'Repository Pattern · Conventions',
    title: (
      <>
        Repository 메서드 이름은 셋이면 된다<br /><em>그런데도 규칙이 어긋난 이유</em>
      </>
    ),
    lede: 'Repository의 연산은 메서드 이름 세 가지로 다 덮인다. find<Noun>s, save<Noun>, delete<Noun>이다. 단건 조회 메서드도, update 메서드도 따로 두지 않는다. 이렇게 작은 규칙은 깨질 리 없어 보이지만, 글로만 적어 둔 사이에 같은 설계를 구현한 5개 중 4곳에서 어긋났다. 검사로 강제하자 첫 실행에서 아무도 몰랐던 위반 3건이 더 나왔다.',
    body: (
      <>
        <p>Repository 패턴 자체는 다들 아는 얘기다. Aggregate Root 하나에 Domain 계층의 Repository 인터페이스 하나, Infrastructure의 구현체 하나. 덜 알려진 건 그 인터페이스의 메서드 이름이 얼마나 쉽게 제각각이 되는지, 그리고 여러 사람이(또는 따로 작성한 여러 구현이) 같은 컨벤션을 두고 코드를 쓰기 시작하면 그 차이가 얼마나 비싸지는지다.</p>
        <p>같은 백엔드 설계를 5개 언어로 나란히 구현해 둔 내 예제 프로젝트에서 이 일을 겪었다. 아래 네이밍 규칙은 처음부터 문서에 있었다. 그런데도 5개 구현 중 4곳에서 저마다 다른 방식으로 깨져 있었다.</p>
        <h2>규칙</h2>
        <p>Repository의 연산은 메서드 이름 패턴 세 가지로 다 덮는다. 목록 조회는 언제나 <code>find&lt;Noun&gt;s</code>다. <code>findOrders</code>, <code>findUsers</code> 같은 식이다. 저장(save/upsert)은 <code>save&lt;Noun&gt;</code>, 삭제는 <code>delete&lt;Noun&gt;</code>다. 쓰는 단어는 이게 전부다.</p>
        <p>단건 조회용 메서드도 따로 두지 않는다. Service가 <code>take: 1</code>로 목록 조회를 부르고 <code>.then(r =&gt; r.&lt;noun&gt;s.pop())</code>으로 하나를 꺼낸다.</p>
        <pre><code>{`const order = await this.orderRepository
  .findOrders({ orderId, take: 1, page: 0 })
  .then((r) => r.orders.pop())

if (!order) throw new Error(OrderErrorMessage['Order not found.'])`}</code></pre>
        <p><code>findOne</code>과 <code>findMany</code>를 따로 두면 동적 필터 조건 로직이 두 메서드에 중복될 뿐 얻는 게 없다. 조회 경로를 하나로 합치면 Repository 구현이 단순해지고, 나중에 선택 필터를 하나 더할 때도 고칠 곳이 한 군데뿐이다. update 메서드는 아예 없다. Aggregate를 조회하고, Aggregate의 도메인 메서드로 상태를 바꾼 뒤, <code>save&lt;Noun&gt;</code>로 저장한다. <code>updateOrder(patch)</code> 같은 메서드가 있으면 호출하는 쪽이 필드를 직접 바꿀 수 있고, Aggregate가 지켜야 할 불변식 검사를 건너뛰게 된다.</p>
        <h2>어떻게 어긋나 있었나</h2>
        <p>5개 언어 구현을 놓고 "언어 차이로는 설명되지 않는 설계 이탈"을 찾는 교차 감사를 했다. 루트 문서의 네이밍 규칙이 5개 언어 중 4곳에서, 그것도 저마다 다른 방식으로 깨져 있었다. 두 언어는 명사 없이 <code>Save</code>/<code>save</code>만 썼다. 컴파일도 되고 그것만 놓고 보면 읽기도 괜찮다. 하지만 Aggregate가 둘 이상인 코드베이스에서 Repository 인터페이스를 훑으며 무슨 일을 하는지 파악하려 하면 바로 문제가 된다.</p>
        <p>또 4개 언어에서는 두 번째 BC, 정확히는 두 도메인 중 더 오래된 쪽에 "전용 <code>findOne</code>과 별도 <code>findAll</code>" 쌍이 남아 있었다. 통합 조회로 막으려던 안티패턴이 그대로 있었고, 같은 코드베이스 안에서 이미 제대로 고친 새 도메인이 바로 옆에 있었다. 모든 곳에서 규칙을 지킨 언어는 하나뿐이었다.</p>
        <p>한 언어의 네이밍 컨벤션 문서는 이 정리가 "완료"됐다고까지 적고 있었다. Command 쪽 Repository만 보면 맞는 말이었다. 짝이 되는 Query 쪽 인터페이스 4개는 예전 패턴 그대로였다. 절반만 해 놓고 다 했다고 적은 셈이다.</p>
        <div className="article-note"><strong>"문서에 고쳤다고 적혀 있다"는 증거가 못 된다</strong><p>인터페이스 하나만 고치고 짝인 Query 쪽을 빠뜨린 정리는, 바뀌었으리라 생각한 파일만 보는 diff 리뷰에서는 드러나지 않는다. 체인지로그에 적힌 파일 하나가 아니라 Repository 역할을 하는 인터페이스를 전부 grep으로 확인한 다음에야 네이밍이 맞는다고 믿는 게 좋다.</p></div>
        <h2>이렇게 단순한 규칙이 왜 자꾸 새어 나갔나</h2>
        <p>이 컨벤션을 검사하는 자동화가 없었다. 이미 있던 아키텍처 검사(코드가 문서의 규칙을 따르는지 정적으로 확인하는 스크립트)는 구조적인 배치를 봤다. Repository 인터페이스가 <code>domain/</code>에 있는지, 구현체가 <code>infrastructure/</code>에 있는지, Interface 계층이 Infrastructure를 직접 건드리지 않는지 같은 것들이다. 하지만 메서드 이름이 <code>save</code>인지 <code>saveOrder</code>인지는 어느 검사도 보지 않는다. 글로만 있는 네이밍 컨벤션은 다들 그 글을 다시 읽는 동안에만 지켜진다. 현실에서는 두 번째 사람이 그 파일을 만지기 전까지, 아니면 다른 문단부터 읽은 누군가가 네 번째 언어 구현을 쓰기 전까지다.</p>
        <h2>규칙을 회귀 방지 장치로</h2>
        <p>효과가 있었던 건 손으로 한 번 더 훑는 게 아니었다. 언어마다 위반 형태를 기계적으로 잡는 검사를 하나씩 만든 것이다. <code>findBy*</code>, 명사 없는 <code>findAll</code>, 명사 없는 <code>save</code>, 명사 없는 <code>delete</code>, 그리고 붙어야 할 명사가 없는 모든 형태를 블록리스트로 잡는다. 언어마다 이미 아키텍처 검사기가 있었으니(TypeScript AST 순회, Go 프로그램, bash와 grep 조합, Python AST 순회처럼 방식은 달라도 규칙은 같다) 새 도구 없이 규칙만 더하면 됐다.</p>
        <p>방금 고친 코드에 돌리니 예상대로 모두 통과했다. 5개 언어 중 3곳의 인증 도메인에 돌리자 위반 3건이 더 나왔다. 그전 감사는 모두 비즈니스 도메인 2개만 범위로 잡아서 인증 도메인은 본 적이 없었다. 수동 감사는 증상을 하나씩 찾고 있었고, 해결책은 만들기 쉬운 규칙 하나였다.</p>
        <h2>타입 시스템 5개, 이름 3개</h2>
        <p>고치고 나면 인터페이스는 어느 언어에서나 거의 똑같이 읽힌다. 주변 문법만 다르고, 메서드 이름 패턴 세 가지는 그대로다.</p>
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
        <p>Go는 슬라이스와 개수와 에러를 함께 돌려주고, Kotlin은 <code>Pair</code>를 쓰고, Python은 <code>ABC</code>와 <code>async</code>를 쓴다. 이런 차이는 모두 언어의 관용구일 뿐 아키텍처 결정이 아니다. 그래서 이 컨벤션을 검사하는 규칙은 거의 저절로 언어와 무관해진다. 문법을 걷어 내면 메서드 이름이 <code>find&lt;Noun&gt;s</code>/<code>save&lt;Noun&gt;</code>/<code>delete&lt;Noun&gt;</code> 꼴인지만 보면 된다. 같은 블록리스트 로직(<code>findBy*</code>, 명사 없는 <code>findAll</code>, 명사 없는 <code>save</code>를 잡는)이 전혀 다른 정적 분석 방식 5가지로 무리 없이 옮겨간 것도 그래서다. TypeScript AST 순회, Go 프로그램, bash와 grep 조합, Kotlin/Java AST 순회, Python AST 순회 중 어느 것도 근본적으로 다른 규칙이 필요하지 않았다.</p>
        <h2>이 규칙이 일부러 보지 않는 것</h2>
        <p>명사가 도메인에 맞게 쓰였는지, 반환 형태가 맞는지, 메서드 안의 쿼리 로직이 정확한지는 검사하지 않는다. 그건 비즈니스 로직이다. 네이밍 검사가 비즈니스 로직에 끼어들지 않는 건 내 다른 아키텍처 검사들도 똑같이 지키는 원칙이다. 이 규칙은 기계적으로 확인할 수 있는 좁은 것 하나만 본다. Repository 모양 인터페이스의 메서드 이름이 세 패턴 중 하나에 맞느냐다. 범위가 좁은 덕분에 몇 달에 한 번이 아니라 커밋마다 돌려도 될 만큼 가볍다.</p>
        <div className="article-note"><strong>더 볼 자료</strong><p>
          <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/docs/architecture/repository-pattern.md" target="_blank" rel="noreferrer">docs/architecture/repository-pattern.md</a>(같은 백엔드 설계를 5개 언어로 구현해 둔 내 예제 프로젝트의 전체 네이밍 규칙, soft delete, 동적 필터 패턴) · <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/docs/harness.md" target="_blank" rel="noreferrer">docs/harness.md</a>(아키텍처 검사가 가정해도 되는 것과 안 되는 것)
        </p></div>
      </>
    ),
  },
};

export default function RepositoryNamingConvention() {
  const { locale } = useLocale();
  const c = content[locale];

  return (
    <PostLayout slug="repository-naming-convention" kicker={c.kicker} title={c.title} lede={c.lede}>
      {c.body}
    </PostLayout>
  );
}
