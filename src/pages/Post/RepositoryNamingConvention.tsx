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
        The Naming Rule<br /><em>That Caught Real Bugs</em>
      </>
    ),
    lede: "A method-naming convention feels like the most boring possible thing to standardize. Then you write a tool that checks it, run it once, and it finds three real violations nobody had noticed across three different codebases.",
    body: (
      <>
        <p>The Repository pattern itself is a settled idea: one Aggregate Root, one Repository interface in the Domain layer, one implementation in Infrastructure. What's less obvious is how much drift is possible in the method names on that interface, and how much that drift costs once several people (or several independently-written language ports) are writing against the same convention.</p>
        <h2>The Rule</h2>
        <p>Three method-name patterns cover every Repository operation. List lookup is always <code>find&lt;Noun&gt;s</code>, as in <code>findOrders</code> or <code>findUsers</code>. Save or upsert is <code>save&lt;Noun&gt;</code>. Delete is <code>delete&lt;Noun&gt;</code>. That's the whole vocabulary.</p>
        <p>The single-record case doesn't get its own method. A Service calls the list lookup with <code>take: 1</code> and pulls the record out with <code>.then(r =&gt; r.&lt;noun&gt;s.pop())</code>:</p>
        <pre><code>{`const order = await this.orderRepository
  .findOrders({ orderId, take: 1, page: 0 })
  .then((r) => r.orders.pop())

if (!order) throw new Error(OrderErrorMessage['Order not found.'])`}</code></pre>
        <p>Keeping <code>findOne</code> and <code>findMany</code> as separate methods duplicates the dynamic filter-condition logic between them for no benefit. Unifying the lookup into one path keeps the Repository implementation simpler, and there's exactly one place to add a new optional filter later. And a Repository never has an update method at all: look the Aggregate up, change it through its own domain method, and save it via <code>save&lt;Noun&gt;</code>. An <code>updateOrder(patch)</code> method would let a caller mutate fields directly, bypassing the invariant checks the Aggregate exists to enforce.</p>
        <h2>Where This Broke</h2>
        <p>A cross-language audit of this repo's five ports, specifically hunting for "design deviations not justified by real language differences," found the root doc's naming rule violated in four of the five languages, each in a different way. Two used a bare <code>Save</code>/<code>save</code> with no noun at all. That compiles fine and reads fine in isolation, but breaks the moment you're scanning a Repository interface for what it does across a codebase with more than one Aggregate. A second BC in four of the five languages (the older of two domains in this repo) had a "dedicated <code>findOne</code> plus a separate <code>findAll</code>" pair, the exact anti-pattern the unified lookup is meant to prevent, sitting right next to a newer domain in the same codebase that had already gotten it right. Only one language was compliant everywhere.</p>
        <p>The most instructive single case: one language's own naming-convention doc proudly declared the Repository-naming cleanup "done." It was, for the Command-side Repository. The parallel Query-side interfaces, four of them, still had the old pattern untouched. The doc wasn't lying so much as covering half the ground and calling it the whole thing.</p>
        <div className="article-note"><strong>Why "the doc says it's fixed" isn't proof</strong><p>A cleanup that touches one interface and forgets its Query-side twin is invisible in a diff review that only looks at the file you expect to have changed. Trust the naming pattern only once you've grepped every interface with a Repository-shaped role, not just the one the changelog entry mentions.</p></div>
        <h2>Why a Rule This Simple Kept Slipping Through</h2>
        <p>No automated check existed for this specific convention. Harnesses in this repo check structural placement (is the Repository interface in <code>domain/</code>, is the implementation in <code>infrastructure/</code>, does the Interface layer avoid touching Infrastructure directly), but none of that says anything about whether a method is spelled <code>save</code> or <code>saveOrder</code>. A naming convention that only lives in prose gets followed exactly as consistently as everyone remembers to reread the prose, which in practice means until the second person touches the file, or the fourth language port is written by someone who read a different paragraph first.</p>
        <h2>Turning the Rule Into a Regression Guard</h2>
        <p>The fix that stuck wasn't another manual pass. It was writing one harness rule per language that mechanically flags the violating shapes: a blocklist of <code>findBy*</code>, bare <code>findAll</code>, bare <code>save</code>, bare <code>delete</code>, and anything without the expected noun suffix. Every language already had its own harness (a TypeScript AST walk, a Go program, bash-plus-grep, a Python AST walk; the mechanism differs, the rule doesn't), so this was additive, not a new tool.</p>
        <p>Run against the newly-fixed code, it passed everywhere, as expected. Run against a different domain nobody had thought to re-check (the authentication domain, in three of the five languages), it immediately found three more real violations that had never been part of any prior audit's scope, because prior audits had all been scoped to the two business domains everyone kept thinking about. A rule this cheap to write turned out to be the fix; the manual audits before it were finding symptoms one at a time.</p>
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
        <p>Go returns a slice plus a count plus an error, Kotlin reaches for a <code>Pair</code>, Python leans on <code>ABC</code> and <code>async</code>. Every one of those differences is a language idiom, not an architecture decision. What a harness rule for this convention has to check is language-agnostic almost by definition: strip the syntax away, and it's asking whether the method is spelled <code>find&lt;Noun&gt;s</code>/<code>save&lt;Noun&gt;</code>/<code>delete&lt;Noun&gt;</code>, full stop. That's why the same blocklist logic (flag <code>findBy*</code>, bare <code>findAll</code>, bare <code>save</code>) ported cleanly into five completely different static-analysis mechanisms, a TypeScript AST walk, a Go program, bash-plus-grep, a Kotlin/Java AST walk, a Python AST walk, without any of them needing a fundamentally different rule.</p>
        <h2>What the Rule Deliberately Doesn't Check</h2>
        <p>It doesn't check whether the noun is spelled correctly for the domain, whether the return shape is right, or whether the query logic inside the method is correct. That's business logic, and a naming-convention harness rule staying out of business logic is the same discipline this repo's harness design keeps to everywhere. It checks one narrow, mechanically-verifiable thing: does the method name on a Repository-shaped interface match one of three patterns. That narrowness is what makes it cheap enough to run on every commit instead of every few months.</p>
        <div className="article-note"><strong>Further reading in the repo</strong><p>
          <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/docs/architecture/repository-pattern.md" target="_blank" rel="noreferrer">docs/architecture/repository-pattern.md</a> — the full naming rules, soft delete, and dynamic filter pattern · <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/docs/harness.md" target="_blank" rel="noreferrer">docs/harness.md</a> — what a harness rule may and may not assume
        </p></div>
      </>
    ),
  },
  ko: {
    kicker: 'Repository Pattern · Conventions',
    title: (
      <>
        실제 버그를 잡아낸<br /><em>네이밍 규칙</em>
      </>
    ),
    lede: '메서드 이름 규칙을 맞추는 일만큼 지루한 표준화도 없어 보인다. 그런데 그 규칙을 검사하는 도구를 만들어 한 번 돌렸더니, 서로 다른 코드베이스 3곳에서 아무도 몰랐던 위반 3건이 나왔다.',
    body: (
      <>
        <p>Repository 패턴 자체는 다들 아는 얘기다. Aggregate Root 하나에 Domain 계층의 Repository 인터페이스 하나, Infrastructure의 구현체 하나. 덜 알려진 건 그 인터페이스의 메서드 이름이 얼마나 쉽게 제각각이 되는지, 그리고 여러 사람이(또는 따로 작성한 여러 언어 구현이) 같은 컨벤션을 두고 코드를 쓰기 시작하면 그 차이가 얼마나 비싸지는지다.</p>
        <h2>규칙</h2>
        <p>Repository의 연산은 메서드 이름 패턴 세 가지로 다 덮는다. 목록 조회는 언제나 <code>find&lt;Noun&gt;s</code>다. <code>findOrders</code>, <code>findUsers</code> 같은 식이다. 저장(save/upsert)은 <code>save&lt;Noun&gt;</code>, 삭제는 <code>delete&lt;Noun&gt;</code>다. 쓰는 단어는 이게 전부다.</p>
        <p>단건 조회용 메서드도 따로 두지 않는다. Service가 <code>take: 1</code>로 목록 조회를 부르고 <code>.then(r =&gt; r.&lt;noun&gt;s.pop())</code>으로 하나를 꺼낸다.</p>
        <pre><code>{`const order = await this.orderRepository
  .findOrders({ orderId, take: 1, page: 0 })
  .then((r) => r.orders.pop())

if (!order) throw new Error(OrderErrorMessage['Order not found.'])`}</code></pre>
        <p><code>findOne</code>과 <code>findMany</code>를 따로 두면 동적 필터 조건 로직이 두 메서드에 중복될 뿐 얻는 게 없다. 조회 경로를 하나로 합치면 Repository 구현이 단순해지고, 나중에 선택 필터를 하나 더할 때도 고칠 곳이 한 군데뿐이다. update 메서드는 아예 없다. Aggregate를 조회하고, Aggregate의 도메인 메서드로 상태를 바꾼 뒤, <code>save&lt;Noun&gt;</code>로 저장한다. <code>updateOrder(patch)</code> 같은 메서드가 있으면 호출하는 쪽이 필드를 직접 바꿀 수 있고, Aggregate가 지켜야 할 불변식 검사를 건너뛰게 된다.</p>
        <h2>어디서 깨졌나</h2>
        <p>내 저장소의 5개 언어 구현을 놓고 "언어 차이로는 설명되지 않는 설계 이탈"을 찾는 교차 감사를 했다. 루트 문서의 네이밍 규칙이 5개 언어 중 4곳에서, 그것도 저마다 다른 방식으로 깨져 있었다. 두 언어는 명사 없이 <code>Save</code>/<code>save</code>만 썼다. 컴파일도 되고 그것만 놓고 보면 읽기도 괜찮다. 하지만 Aggregate가 둘 이상인 코드베이스에서 Repository 인터페이스를 훑으며 무슨 일을 하는지 파악하려 하면 바로 문제가 된다.</p>
        <p>또 4개 언어에서는 두 번째 BC, 정확히는 두 도메인 중 더 오래된 쪽에 "전용 <code>findOne</code>과 별도 <code>findAll</code>" 쌍이 남아 있었다. 통합 조회로 막으려던 안티패턴이 그대로 있었고, 같은 코드베이스 안에서 이미 제대로 고친 새 도메인이 바로 옆에 있었다. 모든 곳에서 규칙을 지킨 언어는 하나뿐이었다.</p>
        <p>가장 배울 게 많았던 건 이 경우다. 한 언어의 네이밍 컨벤션 문서는 Repository 이름 정리가 "완료"됐다고 자신 있게 적고 있었다. Command 쪽 Repository만 놓고 보면 맞는 말이었다. 짝이 되는 Query 쪽 인터페이스 4개는 예전 패턴 그대로였다. 문서가 거짓말을 했다기보다, 절반만 해 놓고 다 했다고 적은 셈이다.</p>
        <div className="article-note"><strong>"문서에 고쳤다고 적혀 있다"는 증거가 못 된다</strong><p>인터페이스 하나만 고치고 짝인 Query 쪽을 빠뜨린 정리는, 바뀌었으리라 생각한 파일만 보는 diff 리뷰에서는 드러나지 않는다. 체인지로그에 적힌 파일 하나가 아니라 Repository 역할을 하는 인터페이스를 전부 grep으로 확인한 다음에야 네이밍이 맞는다고 믿는 게 좋다.</p></div>
        <h2>이렇게 단순한 규칙이 왜 자꾸 새어 나갔나</h2>
        <p>이 컨벤션을 검사하는 자동화가 없었다. 내 저장소의 하네스는 구조적인 배치를 본다. Repository 인터페이스가 <code>domain/</code>에 있는지, 구현체가 <code>infrastructure/</code>에 있는지, Interface 계층이 Infrastructure를 직접 건드리지 않는지 같은 것들이다. 하지만 메서드 이름이 <code>save</code>인지 <code>saveOrder</code>인지는 어느 검사도 보지 않는다. 글로만 있는 네이밍 컨벤션은 다들 그 글을 다시 읽는 동안에만 지켜진다. 현실에서는 두 번째 사람이 그 파일을 만지기 전까지, 아니면 다른 문단부터 읽은 누군가가 네 번째 언어 구현을 쓰기 전까지다.</p>
        <h2>규칙을 회귀 방지 장치로</h2>
        <p>효과가 있었던 건 손으로 한 번 더 훑는 게 아니었다. 언어마다 위반 형태를 기계적으로 잡는 하네스 규칙을 하나씩 만든 것이다. <code>findBy*</code>, 명사 없는 <code>findAll</code>, 명사 없는 <code>save</code>, 명사 없는 <code>delete</code>, 그리고 붙어야 할 명사가 없는 모든 형태를 블록리스트로 잡는다. 언어마다 이미 하네스가 있었으니(TypeScript AST 순회, Go 프로그램, bash와 grep 조합, Python AST 순회처럼 방식은 달라도 규칙은 같다) 새 도구 없이 기존 하네스에 규칙만 더하면 됐다.</p>
        <p>방금 고친 코드에 돌리니 예상대로 모두 통과했다. 그런데 아무도 다시 볼 생각을 안 했던 다른 도메인, 5개 언어 중 3곳의 인증 도메인에 돌리자 위반 3건이 곧바로 나왔다. 그때까지 어떤 감사도 이 도메인을 범위에 넣은 적이 없었다. 감사는 늘 다들 신경 쓰던 비즈니스 도메인 2개만 봤다. 만들기도 쉬운 규칙 하나가 진짜 해결책이었고, 그 전의 수동 감사는 증상을 하나씩 찾아내고 있었을 뿐이다.</p>
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
        <p>Go는 슬라이스와 개수와 에러를 함께 돌려주고, Kotlin은 <code>Pair</code>를 쓰고, Python은 <code>ABC</code>와 <code>async</code>를 쓴다. 이런 차이는 모두 언어의 관용구일 뿐 아키텍처 결정이 아니다. 그래서 이 컨벤션을 검사하는 하네스 규칙은 거의 저절로 언어와 무관해진다. 문법을 걷어 내면 메서드 이름이 <code>find&lt;Noun&gt;s</code>/<code>save&lt;Noun&gt;</code>/<code>delete&lt;Noun&gt;</code> 꼴인지만 보면 된다. 같은 블록리스트 로직(<code>findBy*</code>, 명사 없는 <code>findAll</code>, 명사 없는 <code>save</code>를 잡는)이 전혀 다른 정적 분석 방식 5가지로 무리 없이 옮겨간 것도 그래서다. TypeScript AST 순회, Go 프로그램, bash와 grep 조합, Kotlin/Java AST 순회, Python AST 순회 중 어느 것도 근본적으로 다른 규칙이 필요하지 않았다.</p>
        <h2>이 규칙이 일부러 보지 않는 것</h2>
        <p>명사가 도메인에 맞게 쓰였는지, 반환 형태가 맞는지, 메서드 안의 쿼리 로직이 정확한지는 검사하지 않는다. 그건 비즈니스 로직이다. 네이밍 규칙이 비즈니스 로직에 끼어들지 않는 건 내 저장소의 하네스가 어디서나 지키는 원칙이기도 하다. 이 규칙은 기계적으로 확인할 수 있는 좁은 것 하나만 본다. Repository 모양 인터페이스의 메서드 이름이 세 패턴 중 하나에 맞느냐다. 범위가 좁은 덕분에 몇 달에 한 번이 아니라 커밋마다 돌려도 될 만큼 가볍다.</p>
        <div className="article-note"><strong>저장소에서 더 볼 자료</strong><p>
          <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/docs/architecture/repository-pattern.md" target="_blank" rel="noreferrer">docs/architecture/repository-pattern.md</a>(전체 네이밍 규칙, soft delete, 동적 필터 패턴) · <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/docs/harness.md" target="_blank" rel="noreferrer">docs/harness.md</a>(하네스 규칙이 가정해도 되는 것과 안 되는 것)
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
