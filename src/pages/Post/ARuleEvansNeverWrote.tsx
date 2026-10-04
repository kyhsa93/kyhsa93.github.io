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
    lede: "Nearly every modern DDD codebase enforces the same rule: an Aggregate may reference another Aggregate only by ID, never by holding a direct object reference. The 2003 book that coined the term Aggregate says the opposite. The person who wrote the ID-only rule said so himself, in the same paper, without pretending otherwise.",
    body: (
      <>
        <p>The rule shows up as a near-universal convention in DDD codebases today, usually stated flatly, no caveat attached: another Aggregate is referenced by ID, an object reference is treated as a modeling mistake. It reads like something straight out of the source material. It isn't.</p>
        <h2>The Rule as It's Practiced</h2>
        <p>One codebase's version: "Another Aggregate is referenced only by ID (never by object reference)," and, restated in its own summary table, "An object reference creates coupling. Keep only the ID." Search any recent DDD tutorial, talk, or reference architecture and some phrasing of the same rule shows up almost immediately, usually presented as settled, foundational doctrine.</p>
        <h2>What the 2003 Book's Own Rule List Says</h2>
        <p>Eric Evans' <em>Domain-Driven Design</em> lays out its Aggregate rules as a numbered list, translating the concept into implementation constraints. One of the seven items reads, in full and without qualification:</p>
        <blockquote><p>"Objects within the AGGREGATE can hold references to other AGGREGATE roots." (p. 92)</p></blockquote>
        <p>It's a listed rule, not a hedge or an aside, sitting between "only Aggregate roots can be obtained directly with database queries" and "a delete operation must remove everything within the Aggregate boundary at once." The book that defined what an Aggregate is explicitly permits what today's convention forbids.</p>
        <div className="article-note"><strong>Not a close reading</strong><p>This isn't a case of stretching an ambiguous sentence to make a point. The book states its Aggregate rules as an enumerated list specifically so implementers know what's required. Direct object references between Aggregate roots are on that list, as something permitted.</p></div>
        <h2>Where "By ID Only" Comes From</h2>
        <p>The rule everyone follows today traces to Vaughn Vernon's 2011 paper <em>Effective Aggregate Design, Part II</em>, and Vernon doesn't claim it as an Evans rule. He opens the relevant section by citing Evans directly and accurately: <strong>"[DDD] states that one aggregate may hold references to the root of other aggregates."</strong> He then adds his own, separate rule on top of it:</p>
        <blockquote><p>"Rule: Reference Other Aggregates By Identity — Prefer references to external aggregates only by their globally unique identity, not by holding a direct object reference."</p></blockquote>
        <p>Vernon isn't correcting a misreading of the 2003 text. He's reading it correctly, agreeing that it permits object references, and then arguing that permission shouldn't be exercised, for reasons the original book never had occasion to consider.</p>
        <h2>Why the Stricter Rule Won</h2>
        <p>Vernon's own reasoning, from the same paper, comes down to two concrete costs a direct reference imposes that an ID doesn't:</p>
        <ul>
          <li><strong>Transaction-boundary safety.</strong> "Both the referencing aggregate and the referenced aggregate must not be modified in the same transaction. Only one or the other may be modified in a single transaction." A live object reference makes that mistake easy to make by accident: the other Aggregate is right there, one method call away. An ID forces an explicit Repository lookup to reach it, which is the moment a developer notices they're about to touch a second Aggregate and reconsiders.</li>
          <li><strong>Cost of what gets loaded.</strong> "Aggregates with inferred object references are... automatically smaller because references are never eagerly loaded. The model can perform better because instances require less time to load and take less memory." An object reference invites a persistence framework to eagerly or lazily pull in a whole second Aggregate graph just to satisfy a field type; an ID is a string.</li>
        </ul>
        <h2>Two Rules, One Principle Neither Contradicts</h2>
        <p>The deeper constraint both rules are protecting was never in dispute. It's Evans' own, stated a few lines above the disputed one: "the invariants applied within an AGGREGATE will be enforced with the completion of each transaction," implying, though never quite legislating, that a transaction's job is to keep exactly one Aggregate consistent. Vernon's identity-only rule doesn't revise that principle; it closes a specific loophole (a direct reference) that made violating it too easy to do without noticing. What looks, on the surface, like a codebase disagreeing with the book it claims to follow is the book being followed at two different points in the same argument's history: the constraint is Evans', and the mechanism that makes the constraint hard to break by accident is Vernon's, built consciously on top of a permission Evans left open.</p>
        <div className="article-note"><strong>Further reading</strong><p>
          Eric Evans, <em>Domain-Driven Design: Tackling Complexity in the Heart of Software</em> (Addison-Wesley, 2003), Chapter 6 (the enumerated Aggregate rules quoted above) · <a href="https://www.dddcommunity.org/wp-content/uploads/files/pdf_articles/Vernon_2011_2.pdf" target="_blank" rel="noreferrer">Vaughn Vernon, "Effective Aggregate Design, Part II: Making Aggregates Work Together"</a> (2011, where the reference-by-ID rule was written down) · <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/docs/architecture/tactical-ddd.md" target="_blank" rel="noreferrer">backend-service-playbook/docs/architecture/tactical-ddd.md</a> (the Aggregate rules as written in my example project that implements the same backend design (DDD, CQRS, Outbox) in five languages side by side)
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
    lede: '요즘 DDD 코드베이스는 거의 다 같은 규칙을 따른다. 다른 Aggregate는 ID로만 참조하고, 객체 참조를 직접 들고 있으면 안 된다는 규칙이다. 그런데 Aggregate라는 말을 처음 만든 2003년 원저는 반대로 말한다. "ID로만 참조"라는 규칙을 쓴 사람도 같은 논문에서 그 점을 숨기지 않고 밝혀 두었다.',
    body: (
      <>
        <p>이 규칙은 지금 DDD 코드베이스라면 어디서나 보이는 관습이다. 대개 아무 단서 없이 못 박아 둔다. 다른 Aggregate는 ID로 참조하고, 객체 참조는 모델링 실수로 본다. 원전에서 그대로 옮겨 온 규칙처럼 들리지만 그렇지 않다.</p>
        <h2>지금 통용되는 규칙</h2>
        <p>어느 코드베이스에는 "다른 Aggregate는 반드시 ID로만 참조한다(객체 참조는 절대 금지)"라고 적혀 있다. 같은 문서의 요약 표에서도 한 번 더 강조한다. "객체 참조는 결합도를 만든다. ID만 유지할 것." 요즘 나온 DDD 튜토리얼이나 발표, 레퍼런스 아키텍처를 아무거나 찾아봐도 이 규칙은 금방 나온다. 표현만 조금씩 다르고, 대개 이미 정해진 기본 원칙처럼 소개한다.</p>
        <h2>2003년 원저의 규칙 목록</h2>
        <p>Eric Evans의 <em>Domain-Driven Design</em>은 Aggregate 개념을 구현 제약으로 옮기면서 규칙을 번호 붙은 목록으로 정리해 두었다. 7개 항목 중 하나는 아무 단서도 없이 다음과 같이 적혀 있다.</p>
        <blockquote><p>"Objects within the AGGREGATE can hold references to other AGGREGATE roots." (Aggregate 안의 객체는 다른 Aggregate root를 참조할 수 있다) (p. 92)</p></blockquote>
        <p>얼버무린 말도, 지나가듯 한 말도 아니다. 목록에 정식으로 오른 규칙이다. 바로 앞에는 "Aggregate root만 데이터베이스 쿼리로 직접 얻을 수 있다"가 있고, 바로 뒤에는 "delete 연산은 Aggregate 경계 안의 모든 것을 한 번에 지워야 한다"가 있다. Aggregate가 무엇인지 정의한 책이, 지금의 관습이 금지하는 일을 대놓고 허용하는 셈이다.</p>
        <div className="article-note"><strong>억지로 읽은 게 아니다</strong><p>애매한 문장 하나를 늘려 읽어서 만든 주장이 아니다. 책은 구현하는 사람이 무엇을 지켜야 하는지 알라고 일부러 Aggregate 규칙을 목록으로 나열했다. Aggregate root끼리의 직접 객체 참조는 그 목록에 허용 항목으로 올라 있다.</p></div>
        <h2>"ID로만"은 어디서 왔나</h2>
        <p>지금 다들 따르는 규칙은 Vaughn Vernon의 2011년 논문 <em>Effective Aggregate Design, Part II</em>에서 나왔다. Vernon도 이걸 Evans의 규칙이라고 하지 않는다. 해당 절을 시작하면서 Evans를 그대로, 틀림없이 인용한다. <strong>"[DDD] states that one aggregate may hold references to the root of other aggregates."</strong>(DDD는 한 aggregate가 다른 aggregate의 root를 참조할 수 있다고 말한다) 그러고 나서 그 위에 자기 규칙을 따로 하나 얹는다.</p>
        <blockquote><p>"Rule: Reference Other Aggregates By Identity — Prefer references to external aggregates only by their globally unique identity, not by holding a direct object reference." (규칙. 다른 Aggregate는 식별자로 참조하라. 외부 aggregate는 객체 참조를 직접 들고 있지 말고 전역 고유 식별자로만 참조하는 쪽을 택하라)</p></blockquote>
        <p>Vernon은 2003년 원저를 잘못 읽은 사람들을 바로잡으려는 게 아니다. 원저를 제대로 읽었고, 객체 참조가 허용된다는 데도 동의한다. 그래도 그 허용을 쓰지 말자고 주장한다. 원저가 쓰일 때는 따져 볼 일이 없었던 이유들 때문이다.</p>
        <h2>왜 더 엄격한 규칙이 남았나</h2>
        <p>같은 논문에서 Vernon이 내세우는 근거는 두 가지로 줄일 수 있다. 직접 참조에는 들고 ID에는 들지 않는 비용이다.</p>
        <ul>
          <li><strong>트랜잭션 경계를 지키기 쉽다.</strong> "참조하는 aggregate와 참조되는 aggregate를 같은 트랜잭션에서 함께 수정해서는 안 된다. 한 트랜잭션에서는 둘 중 하나만 수정할 수 있다." 객체 참조가 살아 있으면 이 실수를 모르고 저지르기 쉽다. 다른 Aggregate가 메서드 호출 한 번 거리에 있기 때문이다. ID만 있으면 그 Aggregate에 닿으려고 Repository를 직접 조회해야 한다. 개발자는 그때 두 번째 Aggregate를 건드리려 한다는 걸 알아채고 한 번 더 생각하게 된다.</li>
          <li><strong>읽어 오는 양이 줄어든다.</strong> "추론된 객체 참조를 가진 aggregate는... 참조를 즉시 로드하는 일이 없으므로 자연히 더 작다. 인스턴스를 로드하는 시간도 메모리도 덜 들어서 모델의 성능이 더 좋아질 수 있다." 객체 참조가 있으면 필드 타입 하나 맞추자고 영속성 프레임워크가 두 번째 Aggregate 그래프 전체를 즉시든 지연이든 끌어오기 쉽다. ID는 그냥 문자열이다.</li>
        </ul>
        <h2>두 규칙이 함께 지키는 원칙</h2>
        <p>두 규칙이 지키려는 더 근본적인 제약을 두고는 다툼이 없었다. 그 제약은 Evans가 쓴 것이고, 문제의 규칙 몇 줄 위에 있다. "Aggregate 안에 적용되는 invariant는 트랜잭션이 끝날 때마다 지켜진다." 트랜잭션 하나가 맡는 일은 Aggregate 하나의 일관성이라는 뜻이 담겨 있다. 다만 규칙으로 못 박지는 않았다.</p>
        <p>Vernon의 식별자 참조 규칙은 이 원칙을 고치지 않는다. 직접 참조라는 허점 하나를 막을 뿐이다. 그 허점 때문에 모르는 사이에 원칙을 어기기가 너무 쉬웠다. 그러니 책을 따른다면서 책과 어긋나는 코드베이스처럼 보여도, 들여다보면 같은 논의의 서로 다른 두 시점을 따르고 있는 것이다. 제약은 Evans의 것이다. 그 제약을 실수로 깨기 어렵게 만든 장치는 Vernon의 것이고, Evans가 열어 둔 허용 위에 알고서 쌓은 것이다.</p>
        <div className="article-note"><strong>더 볼 자료</strong><p>
          Eric Evans, <em>Domain-Driven Design: Tackling Complexity in the Heart of Software</em> (Addison-Wesley, 2003), 6장(위에서 인용한 Aggregate 규칙 목록) · <a href="https://www.dddcommunity.org/wp-content/uploads/files/pdf_articles/Vernon_2011_2.pdf" target="_blank" rel="noreferrer">Vaughn Vernon, "Effective Aggregate Design, Part II: Making Aggregates Work Together"</a>(2011, ID 참조 규칙을 글로 적은 곳) · <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/docs/architecture/tactical-ddd.md" target="_blank" rel="noreferrer">backend-service-playbook/docs/architecture/tactical-ddd.md</a>(같은 백엔드 설계(DDD, CQRS, Outbox)를 5개 언어로 나란히 구현해 둔 내 예제 프로젝트에 적어 둔 Aggregate 규칙)
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
