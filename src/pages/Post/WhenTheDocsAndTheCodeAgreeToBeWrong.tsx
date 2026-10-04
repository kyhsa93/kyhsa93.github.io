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
    lede: "An audit that checks whether code matches its own docs cannot catch the case where both are wrong in the same direction, because agreement is exactly what it reports. A user pointed at three violations of a project's root design guide (a Query injected with a write Repository, a domain class carrying JPA annotations, a notification module sitting in the wrong layer) and asked why none of the many earlier audits had caught them. The honest answer was different for each one, and only one of them was a bug.",
    body: (
      <>
        <p>The three complaints arrived in one sentence. The project was my example project, which implements the same backend design in five languages side by side, and its Java, Go, Kotlin, and FastAPI implementations were violating the root guide in ways that felt too basic to still be sitting there. A Query Handler was reading through a Repository that could also write. A domain class was carrying ORM annotations. A notification module lived somewhere it apparently shouldn't. The follow-up question mattered more than the complaint itself: how many previous audits had walked past all three, and why?</p>
        <h2>The One That Was Real</h2>
        <p>FastAPI's <code>GetTransactionsHandler</code> depended on <code>AccountRepository</code>, the same interface <code>CreateAccountService</code> used to call <code>save_account()</code>. Nothing in the type signature stopped a query from mutating state, and nothing forced a reviewer to notice either, because FastAPI's own <code>cqrs-pattern.md</code> documented that shape as the correct example. The doc and the code weren't out of sync. They agreed, and they were both wrong.</p>
        <p>The fix split the interface: a read-only <code>AccountQuery</code> that every write-capable <code>AccountRepository</code> extends, so a Query Handler physically cannot reach <code>save_account()</code>.</p>
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
        <p>Java-springboot turned out to be a partial version of the same bug. <code>GetAccountService</code> had already been split correctly, but <code>GetTransactionsService</code> hadn't; it was a known gap, already written down in the project's own <code>CLAUDE.md</code>, just never finished. Kotlin and Go had already separated the two interfaces correctly. Their only issue was a name, <code>XxxQueryRepository</code> instead of the convention's <code>XxxQuery</code>: cosmetic, but the kind of drift that makes root and per-language docs gradually stop meaning the same thing.</p>
        <h2>The One That Wasn't a Miss</h2>
        <p>Kotlin's domain classes carried <code>@Entity</code>, <code>@Column</code>, and the rest of JPA directly. That looked like the same category of violation as the FastAPI bug, until it turned out Kotlin's own <code>directory-structure.md</code> documented it as a deliberate, sanctioned exception, and the domain-purity rule in its architecture checker (a script that statically checks code against the documented rules) had been written to skip JPA annotations specifically so it wouldn't fail on code the docs already approved of. The audit hadn't missed anything here. It had worked as designed.</p>
        <div className="article-note"><strong>The harder question</strong><p>Java-springboot faced the identical tradeoff and decided the opposite way: full separation, with an <code>AccountJpaEntity</code>/<code>AccountMapper</code> pair doing the translation. Two implementations of the same design, two opposite calls, both locally consistent with their own docs. Keeping Kotlin's exception meant every future language got to make this decision for itself again. The alternative was harder and less negotiable: no framework gets an exception in the domain, ever, no matter how idiomatic it feels in that ecosystem.</p></div>
        <p>The root <code>tactical-ddd.md</code> now says so directly:</p>
        <blockquote>Never use a framework decorator — ORM annotations (<code>@Entity</code>, <code>@Column</code>, etc.) are forbidden too, with no exception. No implementation gets an exception just because "it's the convention in this ecosystem."</blockquote>
        <p>Kotlin's migration split <code>Account.kt</code> into a pure domain class and an infrastructure-side <code>AccountJpaEntity</code> + <code>AccountMapper</code> + <code>MoneyEmbeddable</code>, mirroring the pattern Java-springboot already had. It also rewired <code>AccountRepositoryImpl</code> to commit pending domain events through the mapper inside the same transaction as the Outbox write. That was the highest-risk change of the whole effort, run under a model picked specifically for it.</p>
        <h2>The One Nobody Could Have Caught Alone</h2>
        <p>The third complaint was placement: FastAPI and Go kept their notification code inside the Account domain; NestJS, Java, and Kotlin had each split it out to a shared top-level module. Neither side was obviously wrong until a re-read of the root's own <code>domain-service.md</code>, whose Technical Service example uses "sending an email or SMS" as the textbook case for staying inside the domain that needs it:</p>
        <blockquote>Only consider promoting it to a top-level shared module once multiple domains actually end up sharing the same implementation (YAGNI) — don't split it out to the top level in advance just because "other domains might use it someday."</blockquote>
        <p>FastAPI and Go were the two that had followed the doc. NestJS, Java, and Kotlin had drifted from it, independently, in the same direction. No single-language audit was ever going to surface that. The violation only exists when five implementations of the same concept get lined up side by side, and every audit up to this one had gone language by language.</p>
        <h2>Why Earlier Audits Missed All Three</h2>
        <p>Three separate structural reasons, one per complaint. An audit that checks whether the code matches its own docs is blind exactly when the docs are wrong in the same direction as the code, which is what happened in FastAPI. A check that exists in one language's checker isn't a rule the other four are held to; the Repository-name check that would have caught the naming drift existed only in NestJS's. And a per-language audit, run one implementation at a time, structurally cannot see a disagreement that only shows up in the comparison, which is the only place the notification split was ever visible.</p>
        <h2>What Got Written Down</h2>
        <p>Fixing the code was the easy part. Fixing the process meant writing both decisions into the root docs in language explicit enough that the next implementation doesn't get to make its own local call: no ORM exception in the domain, ever; a Technical Service defaults to living inside the domain until more than one domain is actually sharing it. The fixes spanned fourteen issues across five languages, mostly handled by AI agents working in parallel copies of the code. Kotlin's rewrite ran under the highest-stakes model, NestJS's move was re-verified after it collided with a Card-domain change landing the same day, and one small pass of root-doc codification at the end was done by hand.</p>
        <p>The question behind all three complaints (why hadn't so many audits caught this) had three different honest answers, and the uncomfortable one is that two of the three violations were invisible by design: one because the doc that would have caught it was the doc that endorsed it, the other because no audit had ever looked at the five languages next to each other instead of one at a time.</p>
        <div className="article-note"><strong>Further reading</strong><p>
          <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/docs/architecture/tactical-ddd.md" target="_blank" rel="noreferrer">docs/architecture/tactical-ddd.md</a> (the no-exception ORM rule in full, in my example project that implements the same backend design in five languages) · <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/docs/architecture/domain-service.md" target="_blank" rel="noreferrer">docs/architecture/domain-service.md</a> (the Technical Service placement principle) · <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/implementations/kotlin-springboot/examples/src/main/kotlin/com/example/accountservice/account/infrastructure/persistence/AccountRepositoryImpl.kt" target="_blank" rel="noreferrer">AccountRepositoryImpl.kt</a> (the real domain/JPA split, Outbox transaction included)
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
    lede: '코드가 자기 문서와 맞는지만 보는 감사는 둘이 같은 쪽으로 틀렸을 때 그걸 잡을 수 없다. 그 감사가 보고하는 게 바로 둘이 맞는다는 사실이기 때문이다. 사용자가 한 프로젝트의 루트 설계 가이드를 어긴 곳 세 군데를 짚었다. 쓰기용 Repository를 주입받은 Query, JPA 애노테이션을 단 도메인 클래스, 엉뚱한 레이어에 놓인 notification 모듈이었다. 그리고 그 많은 감사가 왜 이 셋을 하나도 못 잡았느냐고 물었다. 솔직한 답은 셋 다 달랐고, 그중 버그는 하나뿐이었다.',
    body: (
      <>
        <p>지적 세 가지가 한 문장으로 들어왔다. 대상은 같은 백엔드 설계를 5개 언어로 나란히 구현해 둔 내 예제 프로젝트였다. java, go, kotlin, fastapi 구현체가 루트 가이드를 어기고 있는데, 아직 남아 있기엔 너무 기본적인 것들이라는 얘기였다. Query Handler가 쓰기도 할 수 있는 Repository로 데이터를 읽고 있었다. 도메인 클래스에는 ORM 애노테이션이 붙어 있었다. notification 모듈은 있으면 안 될 자리에 있는 것 같았다. 지적보다 뒤에 붙은 질문이 더 중요했다. 지금까지의 감사가 몇 번이나 이 셋을 그냥 지나쳤고, 왜 그랬을까.</p>
        <h2>진짜 버그였던 하나</h2>
        <p>fastapi의 <code>GetTransactionsHandler</code>는 <code>AccountRepository</code>에 의존하고 있었다. <code>CreateAccountService</code>가 <code>save_account()</code>를 부를 때 쓰는 바로 그 인터페이스다. 타입 시그니처에는 쿼리가 상태를 바꾸지 못하게 막는 장치가 없었다. 리뷰어가 눈치챌 계기도 없었다. fastapi의 <code>cqrs-pattern.md</code>가 이 모양을 올바른 예시로 적어 두었기 때문이다. 문서와 코드가 어긋난 게 아니었다. 둘이 똑같이 틀려 있었다.</p>
        <p>그래서 인터페이스를 나눴다. 읽기 전용 <code>AccountQuery</code>를 두고, 쓰기가 가능한 <code>AccountRepository</code>는 모두 이를 상속하게 했다. 이제 Query Handler는 <code>save_account()</code>에 닿을 방법이 없다.</p>
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
        <p>java-springboot에는 같은 버그가 절반만 있었다. <code>GetAccountService</code>는 이미 제대로 나뉘어 있었는데 <code>GetTransactionsService</code>는 그대로였다. 프로젝트의 <code>CLAUDE.md</code>에 알려진 갭으로 적어 놓고 끝내 마무리하지 않은 것이다. kotlin과 go는 두 인터페이스를 이미 제대로 나눠 두었고, 문제는 이름뿐이었다. 컨벤션은 <code>XxxQuery</code>인데 <code>XxxQueryRepository</code>라고 쓰고 있었다. 겉보기엔 사소하지만, 이런 차이가 쌓이면 루트 문서와 언어별 문서가 어느새 서로 다른 걸 가리키게 된다.</p>
        <h2>놓친 게 아니었던 하나</h2>
        <p>kotlin의 도메인 클래스에는 <code>@Entity</code>, <code>@Column</code> 같은 JPA 애노테이션이 그대로 붙어 있었다. fastapi 버그와 같은 종류의 위반처럼 보였다. 그런데 확인해 보니 kotlin의 <code>directory-structure.md</code>가 이걸 일부러 허용한 예외로 적어 두고 있었다. 아키텍처 검사기(코드가 문서의 규칙을 따르는지 정적으로 검사하는 스크립트)의 domain-purity 규칙도 문서가 허용한 코드에서 실패하지 않도록 JPA 애노테이션만 콕 집어 빼 놓았다. 감사가 놓친 건 없었다. 만든 대로 돌았을 뿐이다.</p>
        <div className="article-note"><strong>더 어려운 질문</strong><p>java-springboot는 똑같은 트레이드오프를 두고 반대로 결정했다. 도메인과 영속성을 완전히 나누고, <code>AccountJpaEntity</code>/<code>AccountMapper</code> 쌍이 둘 사이를 변환한다. 같은 설계의 두 구현이 정반대를 골랐고, 둘 다 자기 문서와는 맞았다. kotlin의 예외를 남겨 두면 앞으로 들어올 언어마다 이 결정을 또 각자 내려야 한다. 다른 길은 더 어렵고 타협의 여지도 적었다. 그 생태계에서 아무리 자연스러운 관례라도, 도메인에서 예외를 받는 프레임워크는 없다는 것이다.</p></div>
        <p>지금 루트 <code>tactical-ddd.md</code>에는 이렇게 적혀 있다.</p>
        <blockquote>프레임워크 데코레이터는 절대 쓰지 않는다. ORM 애노테이션(<code>@Entity</code>, <code>@Column</code> 등)도 예외 없이 금지한다. "이 생태계의 관례"라는 이유만으로 예외를 받는 구현체는 없다.</blockquote>
        <p>kotlin은 <code>Account.kt</code>를 순수 도메인 클래스와 인프라 쪽 <code>AccountJpaEntity</code> + <code>AccountMapper</code> + <code>MoneyEmbeddable</code>로 나눴다. java-springboot에 이미 있던 패턴을 그대로 옮긴 것이다. <code>AccountRepositoryImpl</code>도 손봐서, 아직 내보내지 않은 도메인 이벤트를 매퍼를 거쳐 Outbox 저장과 같은 트랜잭션 안에서 커밋하게 했다. 이번 작업에서 가장 위험한 변경이었고, 그래서 이 변경만을 위해 고른 모델로 처리했다.</p>
        <h2>혼자서는 누구도 못 잡았을 하나</h2>
        <p>세 번째 지적은 위치 문제였다. fastapi와 go는 notification 코드를 Account 도메인 안에 두었고, nestjs·java·kotlin은 저마다 최상위 공유 모듈로 빼 두었다. 어느 쪽이 틀렸다고 단정하기 어려웠는데, 루트의 <code>domain-service.md</code>를 다시 읽고 답이 나왔다. 이 문서의 Technical Service 예시는 "이메일이나 SMS 발송"을 필요한 도메인 안에 남겨 두는 대표 사례로 들고 있다.</p>
        <blockquote>여러 도메인이 실제로 같은 구현을 공유하게 됐을 때만 최상위 공유 모듈로 승격을 고려한다(YAGNI). "다른 도메인이 언젠가 쓸 수도 있다"는 이유만으로 미리 최상위로 빼지 않는다.</blockquote>
        <p>문서를 따르고 있던 건 fastapi와 go였다. nestjs·java·kotlin은 서로 상관없이, 그런데 같은 방향으로 문서에서 벗어나 있었다. 언어 하나만 들여다보는 감사로는 절대 드러나지 않는 문제다. 같은 개념의 구현 5개를 나란히 놓아야 비로소 보이는데, 그때까지의 감사는 모두 언어를 하나씩 따로 봤다.</p>
        <h2>그동안의 감사는 왜 셋 다 놓쳤나</h2>
        <p>지적마다 구조적인 원인이 따로 있었다. 코드가 자기 문서와 맞는지만 보는 감사는 문서가 코드와 같은 쪽으로 틀려 있으면 아무것도 못 본다. fastapi에서 일어난 일이 이것이다. 한 언어의 검사기에만 있는 규칙은 나머지 4개 언어에는 규칙이 아니다. 이름이 어긋난 걸 잡았을 Repository 이름 검사는 nestjs 검사기에만 있었다. 그리고 구현을 하나씩 보는 감사는 비교해야만 드러나는 불일치를 구조적으로 볼 수 없다. notification 위치 문제는 그 비교 속에서만 보였다.</p>
        <h2>문서에 못 박은 것</h2>
        <p>코드를 고치는 건 쉬웠다. 어려운 건 과정을 고치는 일이었다. 다음 구현체가 또 저 혼자 판단하지 못하도록, 두 결정을 루트 문서에 분명한 문장으로 적었다. 도메인에서 ORM 예외는 없다. Technical Service는 둘 이상의 도메인이 실제로 같이 쓰기 전까지 그 도메인 안에 둔다.</p>
        <p>고친 일은 5개 언어에 걸친 이슈 14개였고, 대부분은 코드 사본을 나눠 AI 에이전트를 병렬로 돌려 처리했다. kotlin 재작성에는 가장 신중한 모델을 썼다. nestjs의 모듈 이동은 같은 날 들어온 Card 도메인 변경과 부딪혀서 다시 검증했다. 마지막에 루트 문서를 정리하는 작은 작업은 손으로 했다.</p>
        <p>그 많은 감사가 왜 이걸 못 잡았느냐는 질문에는 솔직한 답이 세 가지 있었다. 그중 불편한 답은, 세 위반 중 둘이 구조상 보일 수가 없었다는 것이다. 하나는 잡아내야 할 문서가 오히려 그 코드를 승인하고 있었고, 다른 하나는 5개 언어를 나란히 놓고 본 감사가 그때까지 한 번도 없었다.</p>
        <div className="article-note"><strong>더 볼 자료</strong><p>
          <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/docs/architecture/tactical-ddd.md" target="_blank" rel="noreferrer">docs/architecture/tactical-ddd.md</a>(같은 백엔드 설계를 5개 언어로 구현해 둔 내 예제 프로젝트의 ORM 예외 없음 규칙 전문) · <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/docs/architecture/domain-service.md" target="_blank" rel="noreferrer">docs/architecture/domain-service.md</a>(Technical Service 배치 원칙) · <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/implementations/kotlin-springboot/examples/src/main/kotlin/com/example/accountservice/account/infrastructure/persistence/AccountRepositoryImpl.kt" target="_blank" rel="noreferrer">AccountRepositoryImpl.kt</a>(Outbox 트랜잭션까지 포함한 domain/JPA 분리 코드)
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
