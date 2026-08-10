import PostLayout from '../../components/PostLayout';
import { useLocale, localeFromPathname } from '../../lib/locale';
import type { MetaFunction } from 'react-router';
import { createPostMeta } from '../../lib/seo';

export const meta: MetaFunction = ({ location }) =>
  createPostMeta('when-the-docs-and-the-code-agree-to-be-wrong', localeFromPathname(location.pathname));

const content = {
  en: {
    kicker: 'DDD · Architecture',
    title: (
      <>
        When the Docs and the Code<br /><em>Agree to Be Wrong</em>
      </>
    ),
    lede: "A user pointed at three places where the implementations violated the repository's own guide — a Query injected with a write Repository, a domain class carrying JPA annotations, a notification module sitting in the wrong layer — and asked why none of the dozens of audit rounds before this one had caught them. The honest answer was different for each one, and only one of them was actually a bug.",
    body: (
      <>
        <p>The three complaints arrived in one sentence, right after a round of Card-domain and healthcheck work had just wrapped up: the Java, Go, Kotlin, and FastAPI implementations were violating the repository's own guide in ways that felt too basic to still be sitting there. A Query Handler was reading through a Repository that could also write. A domain class was carrying ORM annotations. A notification module lived somewhere it apparently shouldn't. The follow-up question mattered more than the complaint itself: how many previous audit rounds had walked past all three, and why?</p>
        <h2>The One That Was Real</h2>
        <p>FastAPI's <code>GetTransactionsHandler</code> depended on <code>AccountRepository</code> — the same interface <code>CreateAccountService</code> used to call <code>save_account()</code>. Nothing in the type signature stopped a query from mutating state, and nothing forced a reviewer to notice either, because FastAPI's own <code>cqrs-pattern.md</code> documented that exact shape as the correct example. The doc and the code weren't out of sync. They agreed, and they were both wrong.</p>
        <p>The fix split the interface — a read-only <code>AccountQuery</code> that every write-capable <code>AccountRepository</code> extends, so a Query Handler physically cannot reach <code>save_account()</code>:</p>
        <pre><code>{`class AccountQuery(ABC):
    """A read-only interface — for the Query Handler only. Never exposes a write method
    such as save() (see cqrs-pattern.md). Shares its method signatures with
    AccountRepository (the write model) but is a separate contract — a Query Handler
    must always depend only on this type.
    """

    @abstractmethod
    async def find_accounts(self, page: int, take: int, ...) -> tuple[list[Account], int]: ...


class AccountRepository(AccountQuery, ABC):
    @abstractmethod
    async def save_account(self, account: Account) -> None: ...`}</code></pre>
        <p>Java-springboot turned out to be a partial version of the same bug: <code>GetAccountService</code> had already been split correctly, but <code>GetTransactionsService</code> hadn't — a known gap, already written down in the project's own <code>CLAUDE.md</code>, just never finished. Kotlin and Go had already separated the two interfaces correctly; their only issue was a name — <code>XxxQueryRepository</code> instead of the convention's <code>XxxQuery</code> — cosmetic, but the kind of drift that makes root and per-language docs quietly stop meaning the same thing.</p>
        <h2>The One That Wasn't a Miss</h2>
        <p>Kotlin's domain classes carried <code>@Entity</code>, <code>@Column</code>, and the rest of JPA directly. That looked like the same category of violation as the FastAPI bug — until it turned out Kotlin's own <code>directory-structure.md</code> documented it as a deliberate, sanctioned exception, and the harness's domain-purity rule had been written to skip JPA annotations specifically so it wouldn't fail on code the docs already approved of. The audit hadn't missed anything here. It had worked exactly as designed.</p>
        <div className="article-note"><strong>The harder question</strong><p>Java-springboot faced the identical tradeoff and decided the opposite way — full separation, an <code>AccountJpaEntity</code>/<code>AccountMapper</code> pair doing the translation. Two implementations of the same repository, two opposite calls, both locally consistent with their own docs. Keeping Kotlin's exception meant every future language got to make this decision for itself again. The alternative was harder and less negotiable: no framework gets an exception in the domain, ever, no matter how idiomatic it feels in that ecosystem.</p></div>
        <p>The root <code>tactical-ddd.md</code> now says exactly that:</p>
        <blockquote>Never use a framework decorator — ORM annotations (<code>@Entity</code>, <code>@Column</code>, etc.) are forbidden too, with no exception. No implementation gets an exception just because "it's the convention in this ecosystem."</blockquote>
        <p>Kotlin's migration split <code>Account.kt</code> into a pure domain class and an infrastructure-side <code>AccountJpaEntity</code> + <code>AccountMapper</code> + <code>MoneyEmbeddable</code>, mirroring the pattern Java-springboot already had, and rewired <code>AccountRepositoryImpl</code> to commit pending domain events through the mapper inside the same transaction as the Outbox write — the highest-risk change of the round, run under a model picked specifically for it.</p>
        <h2>The One Nobody Could Have Caught Alone</h2>
        <p>The third complaint was placement: FastAPI and Go kept their notification code inside the Account domain; NestJS, Java, and Kotlin had each split it out to a shared top-level module. Neither side was obviously wrong — until re-reading the root's own <code>domain-service.md</code>, whose Technical Service example uses "sending an email or SMS" as the textbook case for staying inside the domain that needs it:</p>
        <blockquote>Only consider promoting it to a top-level shared module once multiple domains actually end up sharing the same implementation (YAGNI) — don't split it out to the top level in advance just because "other domains might use it someday."</blockquote>
        <p>FastAPI and Go were the two that had actually followed the doc. NestJS, Java, and Kotlin had drifted from it, independently, in the same direction. No single-language audit was ever going to surface that — the violation only exists when five implementations of the same concept get lined up side by side, and every audit round up to this one had gone language by language.</p>
        <h2>Why the Previous Rounds Missed All Three</h2>
        <p>Three separate structural reasons, one per complaint. An audit that checks whether the code matches its own docs is blind exactly when the docs are wrong in the same direction as the code — which is what happened in FastAPI. A harness rule that exists in one language's implementation isn't a rule the other four are held to — the Repository-name check that would have caught the naming drift existed only in NestJS's harness. And a per-language audit, run one implementation at a time, structurally cannot see a disagreement that only shows up in the comparison — which is the only place the notification split was ever visible.</p>
        <h2>What Got Written Down</h2>
        <p>Fixing the code was the easy part. Fixing the process meant writing both decisions into the root docs in language explicit enough that the next implementation doesn't get to make its own local call: no ORM exception in the domain, ever; a Technical Service defaults to living inside the domain until more than one domain is actually sharing it. Fourteen issues, five languages, mostly parallel worktree agents — Kotlin's rewrite run under the highest-stakes model, NestJS's move re-verified after it collided with a Card-domain change landing the same day, and one small pass of root-doc codification at the end, done by hand.</p>
        <p>The question behind all three complaints — why hadn't dozens of rounds caught this — had three different honest answers, and the uncomfortable one is that two of the three violations were invisible by design: one because the doc that would have caught it was the doc that endorsed it, the other because no audit had ever looked at the five languages next to each other instead of one at a time.</p>
        <div className="article-note"><strong>Further reading in the repo</strong><p>
          <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/docs/architecture/tactical-ddd.md" target="_blank" rel="noreferrer">docs/architecture/tactical-ddd.md</a> — the no-exception ORM rule in full · <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/docs/architecture/domain-service.md" target="_blank" rel="noreferrer">docs/architecture/domain-service.md</a> — the Technical Service placement principle · <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/implementations/kotlin-springboot/examples/src/main/kotlin/com/example/accountservice/account/infrastructure/persistence/AccountRepositoryImpl.kt" target="_blank" rel="noreferrer">AccountRepositoryImpl.kt</a> — the real domain/JPA split, Outbox transaction included
        </p></div>
      </>
    ),
  },
  ko: {
    kicker: 'DDD · Architecture',
    title: (
      <>
        문서와 코드가<br /><em>사이좋게 함께 틀렸을 때</em>
      </>
    ),
    lede: '사용자가 리포지토리 자체 가이드를 위반한 지점 세 곳을 짚었다 — 쓰기용 Repository를 그대로 주입받은 Query, JPA 애노테이션을 그대로 붙인 도메인 클래스, 있어서는 안 될 레이어에 놓인 notification 모듈. 그리고 그동안의 수많은 감사 라운드가 왜 이 셋을 하나도 못 잡았는지 물었다. 세 가지 모두 정직한 답은 서로 달랐고, 그중 진짜 버그는 하나뿐이었다.',
    body: (
      <>
        <p>Card 도메인과 헬스체크 라운드가 막 끝난 직후, 세 가지 지적이 한 문장으로 날아왔다: java, go, kotlin, fastapi 구현체가 이 리포지토리 자체 가이드를 그대로 위반하고 있는데, 그것도 아직까지 남아 있기엔 너무 기본적인 방식으로. Query Handler가 쓰기도 가능한 Repository를 그대로 읽고 있었다. 도메인 클래스가 ORM 애노테이션을 그대로 달고 있었다. notification 모듈이 있어서는 안 될 자리에 있었다. 지적 자체보다 뒤따르는 질문이 더 중요했다: 그동안의 감사 라운드 중 몇 개가 이 세 가지를 그냥 지나쳤고, 왜였을까?</p>
        <h2>진짜였던 하나</h2>
        <p>fastapi의 <code>GetTransactionsHandler</code>는 <code>AccountRepository</code>에 의존하고 있었다 — <code>CreateAccountService</code>가 <code>save_account()</code>를 호출할 때 쓰는 그 인터페이스와 동일한 것. 타입 시그니처 어디에도 쿼리가 상태를 변경하지 못하게 막는 장치가 없었고, 리뷰어가 알아채도록 강제하는 것도 없었다 — 왜냐하면 fastapi 자신의 <code>cqrs-pattern.md</code>가 바로 그 형태를 정상 예시로 문서화해놨기 때문이다. 문서와 코드가 어긋난 게 아니었다. 둘은 합의했고, 둘 다 틀렸다.</p>
        <p>수정은 인터페이스를 분리하는 것이었다 — 쓰기 가능한 모든 <code>AccountRepository</code>가 상속하는 읽기 전용 <code>AccountQuery</code>를 두어, Query Handler가 물리적으로 <code>save_account()</code>에 닿을 수 없게 만들었다:</p>
        <pre><code>{`class AccountQuery(ABC):
    """A read-only interface — for the Query Handler only. Never exposes a write method
    such as save() (see cqrs-pattern.md). Shares its method signatures with
    AccountRepository (the write model) but is a separate contract — a Query Handler
    must always depend only on this type.
    """

    @abstractmethod
    async def find_accounts(self, page: int, take: int, ...) -> tuple[list[Account], int]: ...


class AccountRepository(AccountQuery, ABC):
    @abstractmethod
    async def save_account(self, account: Account) -> None: ...`}</code></pre>
        <p>java-springboot는 같은 버그의 부분 버전이었다: <code>GetAccountService</code>는 이미 올바르게 분리돼 있었지만 <code>GetTransactionsService</code>는 아니었다 — 프로젝트 자신의 <code>CLAUDE.md</code>에 이미 알려진 갭으로 적혀 있었을 뿐, 끝까지 처리되지 않았던 것. kotlin과 go는 이미 두 인터페이스를 올바르게 분리해둔 상태였고, 문제는 이름뿐이었다 — 컨벤션이 정한 <code>XxxQuery</code> 대신 <code>XxxQueryRepository</code>. 겉보기엔 사소하지만, 루트 문서와 언어별 문서가 조용히 서로 다른 걸 가리키게 만드는 종류의 드리프트다.</p>
        <h2>놓친 게 아니었던 하나</h2>
        <p>kotlin의 도메인 클래스는 <code>@Entity</code>, <code>@Column</code>을 비롯한 JPA를 그대로 달고 있었다. fastapi의 버그와 같은 종류의 위반처럼 보였다 — kotlin 자신의 <code>directory-structure.md</code>가 이걸 의도적으로 승인된 예외라고 문서화해뒀고, 하네스의 domain-purity 규칙도 JPA 애노테이션을 일부러 검사 대상에서 뺐다는 사실이 드러나기 전까지는. 여기서 감사는 아무것도 놓치지 않았다. 설계된 그대로 정확히 작동한 것이었다.</p>
        <div className="article-note"><strong>더 어려운 질문</strong><p>java-springboot는 똑같은 트레이드오프 앞에서 정반대로 결정했다 — <code>AccountJpaEntity</code>/<code>AccountMapper</code> 쌍이 변환을 맡는 완전 분리. 같은 Repository의 두 구현이 정반대 선택을 했고, 둘 다 각자의 문서와는 국지적으로 일관됐다. kotlin의 예외를 그대로 두면, 이후 등장할 모든 언어가 이 결정을 또다시 각자 내리게 된다. 대안은 더 어렵고 덜 협상 가능했다: 그 생태계에서 아무리 관용적으로 느껴져도, 도메인에서 예외를 받는 프레임워크는 없다.</p></div>
        <p>루트 <code>tactical-ddd.md</code>는 이제 정확히 이렇게 말한다:</p>
        <blockquote>프레임워크 데코레이터를 절대 쓰지 않는다 — ORM 애노테이션(<code>@Entity</code>, <code>@Column</code> 등)도 예외 없이 금지된다. "이 생태계의 관례"라는 이유만으로 예외를 받는 구현체는 없다.</blockquote>
        <p>kotlin의 마이그레이션은 <code>Account.kt</code>를 순수 도메인 클래스와 인프라 쪽 <code>AccountJpaEntity</code> + <code>AccountMapper</code> + <code>MoneyEmbeddable</code>로 분리했다 — java-springboot가 이미 갖고 있던 패턴을 그대로 이식한 것 — 그리고 <code>AccountRepositoryImpl</code>이 Outbox 저장과 같은 트랜잭션 안에서 매퍼를 통해 미처리 도메인 이벤트를 커밋하도록 재배선했다. 이번 라운드에서 가장 위험도가 높은 변경이었고, 그것만을 위해 고른 모델로 처리됐다.</p>
        <h2>혼자서는 아무도 잡을 수 없었던 하나</h2>
        <p>세 번째 지적은 배치였다: fastapi와 go는 notification 코드를 Account 도메인 내부에 뒀고, nestjs·java·kotlin은 각자 최상위 공유 모듈로 분리했다. 어느 쪽도 명백히 틀린 게 아니었다 — 루트 자신의 <code>domain-service.md</code>를 다시 읽기 전까지는. 그 문서의 Technical Service 예시는 "이메일이나 SMS 발송"을 도메인 내부에 남겨야 하는 교과서적 사례로 직접 들고 있었다:</p>
        <blockquote>여러 도메인이 실제로 같은 구현을 공유하게 됐을 때만 최상위 공유 모듈로 승격을 고려한다(YAGNI) — "다른 도메인이 언젠가 쓸 수도 있다"는 이유만으로 미리 최상위로 빼지 않는다.</blockquote>
        <p>실제로 문서를 따르고 있던 쪽은 fastapi와 go였다. nestjs·java·kotlin은 각자 독립적으로, 같은 방향으로 문서에서 벗어나 있었다. 언어별 개별 감사로는 이걸 절대 드러낼 수 없었다 — 이 위반은 같은 개념의 다섯 구현체를 나란히 놓고 봐야만 존재하는 것이었고, 이번 이전의 모든 감사 라운드는 언어 하나씩 진행됐었다.</p>
        <h2>왜 그 많은 라운드가 셋 다 놓쳤나</h2>
        <p>지적마다 서로 다른 구조적 원인이 하나씩 있었다. 코드가 자기 문서와 일치하는지만 확인하는 감사는, 문서가 코드와 같은 방향으로 틀려 있을 때 정확히 눈이 먼다 — fastapi에서 일어난 일이 그것이다. 한 언어의 구현에만 존재하는 하네스 규칙은 나머지 네 언어를 구속하는 규칙이 아니다 — 이름 드리프트를 잡아냈을 Repository 이름 검사는 nestjs 하네스에만 있었다. 그리고 언어 하나씩 실행하는 감사는, 비교에서만 드러나는 불일치를 구조적으로 볼 수 없다 — notification 분리 문제가 눈에 보였던 유일한 곳이 바로 그 비교였다.</p>
        <h2>문서에 새겨진 것</h2>
        <p>코드를 고치는 건 쉬운 부분이었다. 프로세스를 고치는 건 두 결정을 루트 문서에 다음 구현체가 또다시 자기만의 국지적 판단을 내리지 못할 만큼 명시적인 문장으로 새기는 일이었다: 도메인에서 ORM 예외는 절대 없다; Technical Service는 둘 이상의 도메인이 실제로 공유하기 전까지 도메인 내부가 기본값이다. 이슈 14개, 언어 5개, 대부분 병렬 worktree 에이전트 — kotlin의 재작성은 가장 리스크가 큰 모델로 실행됐고, nestjs의 이동은 같은 날 들어온 Card 도메인 변경과 충돌한 뒤 재검증했으며, 마지막 루트 문서 명문화 한 번은 손으로 직접 처리할 만큼 작았다.</p>
        <p>세 지적 모두에 깔려 있던 질문 — 왜 그 많은 라운드가 이걸 못 잡았나 — 에는 서로 다른 세 가지 정직한 답이 있었고, 그중 불편한 쪽은 이거다: 세 위반 중 둘은 설계상 보이지 않았다. 하나는 그걸 잡아냈어야 할 문서가 오히려 그걸 승인한 문서였기 때문에, 다른 하나는 다섯 언어를 나란히 놓고 본 감사가 그때까지 한 번도 없었기 때문에.</p>
        <div className="article-note"><strong>저장소 내 추가 자료</strong><p>
          <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/docs/architecture/tactical-ddd.md" target="_blank" rel="noreferrer">docs/architecture/tactical-ddd.md</a> — ORM 예외 없음 규칙 전문 · <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/docs/architecture/domain-service.md" target="_blank" rel="noreferrer">docs/architecture/domain-service.md</a> — Technical Service 배치 원칙 · <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/implementations/kotlin-springboot/examples/src/main/kotlin/com/example/accountservice/account/infrastructure/persistence/AccountRepositoryImpl.kt" target="_blank" rel="noreferrer">AccountRepositoryImpl.kt</a> — Outbox 트랜잭션까지 포함한 실제 domain/JPA 분리 코드
        </p></div>
      </>
    ),
  },
};

export default function WhenTheDocsAndTheCodeAgreeToBeWrong() {
  const { locale } = useLocale();
  const c = content[locale];

  return (
    <PostLayout
      slug="when-the-docs-and-the-code-agree-to-be-wrong"
      kicker={c.kicker}
      title={c.title}
      lede={c.lede}
    >
      {c.body}
    </PostLayout>
  );
}
