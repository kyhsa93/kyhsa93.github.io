import PostLayout from '../../components/PostLayout';
import { useLocale, localeFromPathname } from '../../lib/locale';
import type { MetaFunction } from 'react-router';
import { createPostMeta } from '../../lib/seo';

export const meta: MetaFunction = ({ location }) =>
  createPostMeta('a-rule-evans-never-wrote', localeFromPathname(location.pathname));

const content = {
  en: {
    kicker: 'DDD · Architecture',
    title: (
      <>
        A Rule<br /><em>Evans Never Wrote</em>
      </>
    ),
    lede: "Nearly every modern DDD codebase enforces the same rule: an Aggregate may reference another Aggregate only by ID, never by holding a direct object reference. The 2003 book that coined the term Aggregate says the opposite. The person who actually wrote the ID-only rule said so himself, in the same paper, without pretending otherwise.",
    body: (
      <>
        <p>The rule shows up as a near-universal convention in DDD codebases today, usually stated flatly, no caveat attached: another Aggregate is referenced by ID, an object reference is treated as a modeling mistake. It reads like something straight out of the source material. It isn't.</p>
        <h2>The Rule as It's Practiced</h2>
        <p>One codebase's version: "Another Aggregate is referenced only by ID (never by object reference)" — and, restated in its own summary table, "An object reference creates coupling — keep only the ID." Search any recent DDD tutorial, talk, or reference architecture and some phrasing of the same rule shows up almost immediately, usually presented as settled, foundational doctrine.</p>
        <h2>What the 2003 Book's Own Rule List Says</h2>
        <p>Eric Evans' <em>Domain-Driven Design</em> lays out its Aggregate rules as a numbered list, translating the concept into implementation constraints. One of the seven items reads, in full and without qualification:</p>
        <blockquote><p>"Objects within the AGGREGATE can hold references to other AGGREGATE roots." (p. 92)</p></blockquote>
        <p>Not a hedge, not an aside — a listed rule, sitting between "only Aggregate roots can be obtained directly with database queries" and "a delete operation must remove everything within the Aggregate boundary at once." The book that defined what an Aggregate is explicitly permits exactly what today's convention forbids.</p>
        <div className="article-note"><strong>Not a close reading</strong><p>This isn't a case of stretching an ambiguous sentence to make a point. The book states its Aggregate rules as an enumerated list specifically so implementers know what's actually required. Direct object references between Aggregate roots are on that list, as something permitted.</p></div>
        <h2>Where "By ID Only" Actually Comes From</h2>
        <p>The rule everyone follows today traces to Vaughn Vernon's 2011 paper <em>Effective Aggregate Design, Part II</em> — and Vernon doesn't claim it as an Evans rule. He opens the relevant section by citing Evans directly and accurately: <strong>"[DDD] states that one aggregate may hold references to the root of other aggregates."</strong> He then adds his own, separate rule on top of it:</p>
        <blockquote><p>"Rule: Reference Other Aggregates By Identity — Prefer references to external aggregates only by their globally unique identity, not by holding a direct object reference."</p></blockquote>
        <p>Vernon isn't correcting a misreading of the 2003 text. He's reading it correctly, agreeing that it permits object references, and then arguing that permission shouldn't be exercised — for reasons the original book never had occasion to consider.</p>
        <h2>Why the Stricter Rule Won</h2>
        <p>Vernon's own reasoning, from the same paper, comes down to two concrete costs a direct reference imposes that an ID doesn't:</p>
        <ul>
          <li><strong>Transaction-boundary safety.</strong> "Both the referencing aggregate and the referenced aggregate must not be modified in the same transaction. Only one or the other may be modified in a single transaction." A live object reference makes that mistake easy to make by accident — the other Aggregate is right there, one method call away. An ID forces an explicit Repository lookup to reach it, which is exactly the moment a developer notices they're about to touch a second Aggregate and reconsiders.</li>
          <li><strong>Cost of what gets loaded.</strong> "Aggregates with inferred object references are... automatically smaller because references are never eagerly loaded. The model can perform better because instances require less time to load and take less memory." An object reference invites a persistence framework to eagerly or lazily pull in a whole second Aggregate graph just to satisfy a field type; an ID is a string.</li>
        </ul>
        <h2>Two Rules, One Principle Neither Contradicts</h2>
        <p>The deeper constraint both rules are protecting was never in dispute — it's Evans' own, stated a few lines above the disputed one: "the invariants applied within an AGGREGATE will be enforced with the completion of each transaction," implying, though never quite legislating, that a transaction's job is to keep exactly one Aggregate consistent. Vernon's identity-only rule doesn't revise that principle; it closes a specific loophole — a direct reference — that made violating it too easy to do without noticing. What looks, on the surface, like a codebase disagreeing with the book it claims to follow is actually the book being followed at two different points in the same argument's history: the constraint is Evans', and the mechanism that makes the constraint hard to break by accident is Vernon's, built consciously on top of a permission Evans left open.</p>
        <div className="article-note"><strong>Further reading</strong><p>
          Eric Evans, <em>Domain-Driven Design: Tackling Complexity in the Heart of Software</em> (Addison-Wesley, 2003), Chapter 6 · <a href="https://www.dddcommunity.org/wp-content/uploads/files/pdf_articles/Vernon_2011_2.pdf" target="_blank" rel="noreferrer">Vaughn Vernon, "Effective Aggregate Design, Part II: Making Aggregates Work Together"</a> (2011) · <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/docs/architecture/tactical-ddd.md" target="_blank" rel="noreferrer">backend-service-playbook/docs/architecture/tactical-ddd.md</a>
        </p></div>
      </>
    ),
  },
  ko: {
    kicker: 'DDD · Architecture',
    title: (
      <>
        Evans가 쓴 적 없는<br /><em>규칙</em>
      </>
    ),
    lede: '요즘 거의 모든 DDD 코드베이스가 같은 규칙을 지킨다: 다른 Aggregate는 오직 ID로만 참조하고, 객체 참조를 직접 갖고 있으면 안 된다. Aggregate라는 용어를 만든 2003년 원저는 정반대로 말한다. 그리고 실제로 "ID로만 참조"라는 규칙을 쓴 사람은 같은 논문 안에서 그 사실을 숨기지 않고 스스로 밝힌다.',
    body: (
      <>
        <p>이 규칙은 오늘날 DDD 코드베이스에서 거의 보편적인 관습으로 등장한다. 보통 단서 없이 단정적으로: 다른 Aggregate는 ID로 참조하고, 객체 참조는 설계 실수로 취급한다. 원전에서 곧바로 나온 것처럼 들린다. 아니다.</p>
        <h2>실제로 지켜지는 규칙</h2>
        <p>한 코드베이스의 버전: "다른 Aggregate는 반드시 ID로만 참조한다(객체 참조는 절대 금지)" — 그리고 자기 자신의 요약 표에서 다시: "객체 참조는 결합도를 만든다 — ID만 유지할 것." 최근 아무 DDD 튜토리얼이나 발표, 레퍼런스 아키텍처를 검색해봐도 거의 곧바로 같은 규칙의 어떤 버전이 등장하고, 대개 확정된 근본 원칙처럼 제시된다.</p>
        <h2>2003년 원저 자신의 규칙 목록이 말하는 것</h2>
        <p>Eric Evans의 <em>Domain-Driven Design</em>은 Aggregate 개념을 구현 제약으로 번역하면서, 그 규칙들을 번호 매긴 목록으로 제시한다. 일곱 항목 중 하나는 이렇게, 전체가, 아무 단서 없이 적혀 있다:</p>
        <blockquote><p>"Objects within the AGGREGATE can hold references to other AGGREGATE roots." (Aggregate 안의 객체는 다른 Aggregate root에 대한 참조를 가질 수 있다) (p. 92)</p></blockquote>
        <p>얼버무림도, 곁다리 언급도 아니다 — "Aggregate root만 데이터베이스 쿼리로 직접 얻을 수 있다"와 "delete 연산은 Aggregate 경계 안의 모든 것을 한 번에 제거해야 한다" 사이에 나란히 놓인, 목록에 오른 규칙이다. Aggregate가 무엇인지 정의한 바로 그 책이, 오늘날의 관습이 금지하는 바로 그것을 명시적으로 허용하고 있다.</p>
        <div className="article-note"><strong>확대 해석이 아니다</strong><p>모호한 문장 하나를 억지로 늘려서 만든 주장이 아니다. 이 책은 구현자가 실제로 무엇이 요구되는지 알 수 있도록 정확히 그 목적으로 Aggregate 규칙을 열거된 목록으로 제시한다. Aggregate root 간 직접 객체 참조는 그 목록에, 허용되는 것으로 올라 있다.</p></div>
        <h2>"ID로만"은 실제로 어디서 왔는가</h2>
        <p>오늘날 모두가 따르는 규칙은 Vaughn Vernon의 2011년 논문 <em>Effective Aggregate Design, Part II</em>로 거슬러 올라간다 — 그리고 Vernon 스스로도 이걸 Evans의 규칙이라고 주장하지 않는다. 그는 해당 절을 Evans를 직접, 정확하게 인용하며 연다: <strong>"[DDD] states that one aggregate may hold references to the root of other aggregates."</strong>(DDD는 하나의 aggregate가 다른 aggregate의 root에 대한 참조를 가질 수 있다고 말한다) 그런 다음 그 위에 자기 자신의, 별개인 규칙을 얹는다:</p>
        <blockquote><p>"Rule: Reference Other Aggregates By Identity — Prefer references to external aggregates only by their globally unique identity, not by holding a direct object reference." (규칙: 다른 Aggregate는 식별자로 참조하라 — 외부 aggregate에 대한 참조는 직접적인 객체 참조가 아니라 전역 고유 식별자로만 하는 걸 선호하라)</p></blockquote>
        <p>Vernon은 2003년 원저에 대한 오독을 바로잡고 있는 게 아니다. 그는 그 텍스트를 정확히 읽고, 그것이 객체 참조를 허용한다는 데 동의한 뒤, 그럼에도 그 허용을 실제로 행사해서는 안 된다고 주장한다 — 원저가 고려할 계기가 없었던 이유들 때문에.</p>
        <h2>왜 더 엄격한 규칙이 이겼는가</h2>
        <p>같은 논문에 나오는 Vernon 자신의 근거는 직접 참조가 부과하는, ID는 부과하지 않는 구체적인 비용 두 가지로 요약된다:</p>
        <ul>
          <li><strong>트랜잭션 경계의 안전성.</strong> "참조하는 aggregate와 참조되는 aggregate 둘 다 같은 트랜잭션 안에서 수정되어서는 안 된다. 둘 중 하나만 하나의 트랜잭션 안에서 수정될 수 있다." 살아있는 객체 참조는 이 실수를 우연히 저지르기 쉽게 만든다 — 다른 Aggregate가 메서드 호출 한 번 거리에 바로 있으니까. ID는 그것에 닿기 위해 명시적인 Repository 조회를 강제하고, 바로 그 순간이 개발자가 자신이 두 번째 Aggregate를 건드리려 한다는 걸 알아채고 재고하게 되는 지점이다.</li>
          <li><strong>무엇이 로드되는지의 비용.</strong> "추론된 객체 참조를 가진 aggregate는... 참조가 결코 즉시 로드되지 않기 때문에 자동으로 더 작아진다. 인스턴스를 로드하는 데 시간이 덜 걸리고 메모리를 덜 쓰기 때문에 모델이 더 나은 성능을 낼 수 있다." 객체 참조는 필드 타입 하나를 만족시키려고 영속성 프레임워크가 두 번째 Aggregate 그래프 전체를 즉시 또는 지연 로딩하도록 유혹한다. ID는 그냥 문자열이다.</li>
        </ul>
        <h2>두 규칙, 어느 쪽도 반박하지 않는 하나의 원칙</h2>
        <p>두 규칙이 각자 보호하고 있는 더 깊은 제약은 애초에 논쟁거리가 아니었다 — 그건 Evans 자신의 것이고, 논쟁이 된 그 규칙 바로 몇 줄 위에 적혀 있다: "Aggregate 안에 적용되는 invariant는 각 트랜잭션의 완료와 함께 강제된다." 이는 트랜잭션의 역할이 정확히 하나의 Aggregate를 일관되게 유지하는 것이라는 걸 암시한다 — 명시적으로 법제화하지는 않지만. Vernon의 식별자 전용 규칙은 그 원칙을 수정하지 않는다. 그건 특정한 허점 하나 — 직접 참조 — 를 닫는 것이고, 그 허점이 알아채지 못한 채 그 원칙을 어기는 걸 너무 쉽게 만들었을 뿐이다. 겉보기에 자신이 따른다고 주장하는 책과 어긋나는 코드베이스처럼 보이는 것이, 실은 같은 논증의 역사에서 서로 다른 두 시점의 책을 각각 따르고 있는 것이다: 제약 자체는 Evans의 것이고, 그 제약이 우연히 깨지기 어렵게 만드는 메커니즘은 Vernon의 것이며, Evans가 열어둔 허용 위에 의식적으로 지어졌다.</p>
        <div className="article-note"><strong>더 읽을거리</strong><p>
          Eric Evans, <em>Domain-Driven Design: Tackling Complexity in the Heart of Software</em> (Addison-Wesley, 2003), 6장 · <a href="https://www.dddcommunity.org/wp-content/uploads/files/pdf_articles/Vernon_2011_2.pdf" target="_blank" rel="noreferrer">Vaughn Vernon, "Effective Aggregate Design, Part II: Making Aggregates Work Together"</a> (2011) · <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/docs/architecture/tactical-ddd.md" target="_blank" rel="noreferrer">backend-service-playbook/docs/architecture/tactical-ddd.md</a>
        </p></div>
      </>
    ),
  },
};

export default function ARuleEvansNeverWrote() {
  const { locale } = useLocale();
  const c = content[locale];

  return (
    <PostLayout
      slug="a-rule-evans-never-wrote"
      kicker={c.kicker}
      title={c.title}
      lede={c.lede}
    >
      {c.body}
    </PostLayout>
  );
}
