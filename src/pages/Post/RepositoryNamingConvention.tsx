import PostLayout from '../../components/PostLayout';
import { useLocale } from '../../lib/locale';

const content = {
  en: {
    kicker: 'Repository Pattern · Conventions',
    title: (
      <>
        The Naming Rule<br /><em>That Caught Real Bugs</em>
      </>
    ),
    lede: "A method-naming convention feels like the most boring possible thing to standardize. Then you write a tool that actually checks it, run it once, and it finds three real violations nobody had noticed across four different codebases.",
    body: (
      <>
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
    lede: '메서드 네이밍 컨벤션을 표준화하는 건 세상에서 가장 지루한 일처럼 느껴진다. 그런데 그걸 실제로 검사하는 도구를 만들어 딱 한 번 돌려보면, 네 개의 서로 다른 코드베이스에서 아무도 눈치채지 못했던 위반 사례 세 건이 드러난다.',
    body: (
      <>
        <p>Repository 패턴 자체는 이미 정착된 개념이다 — 하나의 Aggregate Root에 Domain 계층의 Repository 인터페이스 하나, Infrastructure의 구현체 하나. 덜 명확한 부분은 그 인터페이스의 메서드 이름에서 얼마나 많은 드리프트(drift)가 생길 수 있는가, 그리고 여러 사람이(혹은 독립적으로 작성된 여러 언어 포트가) 같은 컨벤션을 두고 코드를 작성하게 되면 그 드리프트가 실제로 얼마나 큰 비용이 되는가다.</p>
        <h2>규칙</h2>
        <p>세 가지 메서드 이름 패턴이 Repository의 모든 연산을 커버한다. 목록 조회는 항상 <code>find&lt;Noun&gt;s</code> — <code>findOrders</code>, <code>findUsers</code>. 저장(save/upsert)은 <code>save&lt;Noun&gt;</code>. 삭제는 <code>delete&lt;Noun&gt;</code>. 어휘는 이게 전부다.</p>
        <p>단일 레코드를 조회하는 경우도 별도 메서드를 두지 않는다. Service가 <code>take: 1</code>로 목록 조회를 호출하고 <code>.then(r =&gt; r.&lt;noun&gt;s.pop())</code>으로 레코드를 꺼낸다:</p>
        <pre><code>{`const order = await this.orderRepository
  .findOrders({ orderId, take: 1, page: 0 })
  .then((r) => r.orders.pop())

if (!order) throw new Error(OrderErrorMessage['Order not found.'])`}</code></pre>
        <p><code>findOne</code>과 <code>findMany</code>를 별도 메서드로 유지하면 둘 사이에 동적 필터 조건 로직이 중복될 뿐 실질적인 이득이 없다 — 조회를 하나의 경로로 통합하면 Repository 구현이 더 단순해지고, 나중에 선택적 필터를 추가할 자리도 정확히 한 곳뿐이다. 그리고 Repository에는 update 메서드가 아예 존재하지 않는다: Aggregate를 조회하고, 그 자신의 도메인 메서드를 통해 변경한 뒤, <code>save&lt;Noun&gt;</code>로 저장한다 — <code>updateOrder(patch)</code> 같은 메서드가 있다면 호출자가 필드를 직접 변경할 수 있게 되어, Aggregate가 강제해야 할 불변식 검사를 우회하게 된다.</p>
        <h2>실제로 깨진 지점</h2>
        <p>이 저장소의 다섯 개 언어 포트를 대상으로 "실제 언어 차이로 정당화되지 않는 설계 이탈"을 찾는 크로스 랭귀지 감사를 진행한 결과, 루트 문서의 네이밍 규칙이 다섯 언어 중 네 곳에서, 각기 다른 방식으로 위반되고 있음을 발견했다. 두 언어는 명사(noun) 없이 그냥 <code>Save</code>/<code>save</code>만 썼다 — 컴파일도 되고 그 자체로는 읽기도 괜찮지만, Aggregate가 두 개 이상인 코드베이스에서 Repository 인터페이스가 실제로 뭘 하는지 훑어보려는 순간 문제가 된다. 다섯 언어 중 네 곳의 두 번째 BC — 이 저장소의 두 도메인 중 더 오래된 쪽 — 는 "전용 <code>findOne</code>과 별도의 <code>findAll</code>" 쌍을 갖고 있었는데, 이는 통합 조회가 막으려던 바로 그 안티패턴이며, 같은 코드베이스 안에서 이미 제대로 고쳐진 더 새로운 도메인 바로 옆에 놓여 있었다. 모든 곳에서 규칙을 지킨 언어는 단 하나뿐이었다.</p>
        <p>가장 시사하는 바가 큰 사례 하나: 한 언어의 네이밍 컨벤션 문서는 Repository 네이밍 정리가 "완료"되었다고 당당히 선언하고 있었다. 실제로 그랬다 — Command 쪽 Repository에 한해서는. 짝을 이루는 Query 쪽 인터페이스 네 개는 예전 패턴 그대로 손대지 않은 채 남아 있었다. 그 문서는 거짓말을 한 게 아니라, 절반만 다루고 그것을 전체라고 부른 것에 가까웠다.</p>
        <div className="article-note"><strong>"문서에 고쳐졌다고 적혀 있다"가 증거가 되지 않는 이유</strong><p>하나의 인터페이스만 건드리고 그 짝인 Query 쪽을 빠뜨린 정리 작업은, 변경될 거라 예상한 파일만 들여다보는 diff 리뷰에서는 보이지 않는다. 체인지로그 항목이 언급한 파일 하나만이 아니라, Repository 역할을 하는 모든 인터페이스를 grep으로 확인한 뒤에야 네이밍 패턴을 신뢰하라.</p></div>
        <h2>이렇게 단순한 규칙이 계속 빠져나간 이유</h2>
        <p>이 특정 컨벤션을 위한 자동화된 검사는 존재하지 않았다. 이 저장소의 Harness들은 구조적 배치를 검사한다 — Repository 인터페이스가 <code>domain/</code>에 있는지, 구현체가 <code>infrastructure/</code>에 있는지, Interface 계층이 Infrastructure를 직접 건드리지 않는지 — 하지만 메서드 이름이 <code>save</code>인지 <code>saveOrder</code>인지는 그 어느 것도 말해주지 않는다. 프로즈로만 존재하는 네이밍 컨벤션은 사람들이 그 프로즈를 다시 읽을 것을 기억하는 만큼만 지켜지는데, 현실적으로는: 그러니까, 두 번째 사람이 그 파일을 건드리기 전까지, 혹은 다른 문단을 먼저 읽은 누군가가 네 번째 언어 포트를 작성하기 전까지만 그렇다.</p>
        <h2>규칙을 회귀 방지 장치로 바꾸기</h2>
        <p>실제로 정착된 해법은 다섯 번째 수동 점검이 아니라, 언어마다 위반 형태를 기계적으로 잡아내는 Harness 규칙을 하나씩 작성하는 것이었다: <code>findBy*</code>, 맨몸의 <code>findAll</code>, 맨몸의 <code>save</code>, 맨몸의 <code>delete</code>, 그리고 기대되는 명사 접미사가 없는 모든 형태를 블록리스트로 잡는다. 모든 언어는 이미 자기만의 Harness를 갖고 있었으므로(TypeScript AST 순회, Go 프로그램, bash와 grep 조합, Python AST 순회 — 메커니즘은 다르지만 규칙은 같다) 이건 새 도구가 아니라 기존 것에 추가하는 작업이었다.</p>
        <p>새로 고친 코드에 돌려보니 예상대로 모든 곳에서 통과했다. 아무도 다시 확인할 생각을 못 했던 다른 도메인 — 다섯 언어 중 세 곳의 인증(authentication) 도메인 — 에 돌려보자, 이전의 어떤 감사 범위에도 포함된 적 없던 실제 위반 사례 세 건이 곧바로 드러났다. 이전 감사들은 모두 사람들이 계속 신경 쓰던 두 비즈니스 도메인으로만 범위가 한정돼 있었기 때문이다. 이렇게 작성 비용이 저렴한 규칙 하나가 실제 해법이었던 셈이고, 그 이전의 수동 감사들은 매번 증상 하나씩만 찾아내고 있었던 것이다.</p>
        <h2>다섯 개의 서로 다른 타입 시스템에서, 같은 세 가지 이름</h2>
        <p>한 번 고치고 나면 인터페이스는 모든 언어에서 거의 동일하게 읽힌다 — 주변 문법만 달라질 뿐, 세 가지 메서드 이름 패턴 자체는 절대 변하지 않는다:</p>
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
        <p>Go는 슬라이스와 카운트와 에러를 함께 반환하고, Kotlin은 <code>Pair</code>를 쓰고, Python은 <code>ABC</code>와 <code>async</code>에 기댄다 — 이 차이들은 전부 언어의 관용구일 뿐, 아키텍처 결정이 아니다. 이 컨벤션을 위한 Harness 규칙이 실제로 검사해야 하는 것은 정의상 거의 언어 독립적이다: 문법을 걷어내고 나면, 결국 메서드가 <code>find&lt;Noun&gt;s</code>/<code>save&lt;Noun&gt;</code>/<code>delete&lt;Noun&gt;</code>로 쓰여 있는지, 그게 전부다. 바로 그렇기 때문에 같은 블록리스트 로직(<code>findBy*</code>, 맨몸의 <code>findAll</code>, 맨몸의 <code>save</code>를 잡아내는)이 완전히 다른 다섯 개의 정적 분석 메커니즘 — TypeScript AST 순회, Go 프로그램, bash와 grep 조합, Kotlin/Java AST 순회, Python AST 순회 — 로 그대로 옮겨갈 수 있었고, 그중 어느 것도 근본적으로 다른 규칙을 필요로 하지 않았다.</p>
        <h2>이 규칙이 의도적으로 검사하지 않는 것</h2>
        <p>이 규칙은 도메인에 맞게 명사 철자가 맞는지, 반환 형태가 올바른지, 메서드 내부의 쿼리 로직이 정확한지는 검사하지 않는다 — 그건 비즈니스 로직의 영역이고, 네이밍 컨벤션 Harness 규칙이 비즈니스 로직에는 관여하지 않는 것이야말로 이 저장소의 Harness 설계가 어디서나 지키는 원칙이다. 이 규칙은 좁고 기계적으로 검증 가능한 것 하나만 검사한다: Repository 형태의 인터페이스에 있는 메서드 이름이 세 가지 패턴 중 하나와 일치하는가. 이 좁음이야말로 몇 달에 한 번이 아니라 커밋마다 실제로 돌릴 수 있을 만큼 저렴하게 만드는 요인이다.</p>
        <div className="article-note"><strong>저장소 내 추가 자료</strong><p>
          <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/docs/architecture/repository-pattern.md" target="_blank" rel="noreferrer">docs/architecture/repository-pattern.md</a> — 전체 네이밍 규칙, soft delete, 동적 필터 패턴 · <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/docs/harness.md" target="_blank" rel="noreferrer">docs/harness.md</a> — Harness 규칙이 가정해도 되는 것과 안 되는 것
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
