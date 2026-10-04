import PostLayout from '../../components/PostLayout';
import { useLocale, localeFromPathname } from '../../lib/locale';
import type { MetaFunction } from 'react-router';
import { createPostMeta } from '../../lib/seo';

export const meta: MetaFunction = ({ location }) =>
  createPostMeta('compliance-as-code', localeFromPathname(location.pathname));

const content = {
  en: {
    kicker: 'Tooling · Architecture',
    title: (
      <>
        Compliance as Code:<br /><em>What an Architecture Checker Catches, and What It Keeps Missing</em>
      </>
    ),
    lede: "Turning an architecture doc into automated checks reliably catches code that ends up in the wrong place. Three kinds of drift kept getting past it anyway: a wrong name inside a correctly placed file, code that is wrong together with its own doc, and a disagreement that only exists between two implementations.",
    body: (
      <>
        <p>Design docs rot the same way comments do: a little at a time, until the day someone reads the doc, reads the code, and notices they've been describing two different systems for months. The fix that held up for me wasn't writing better docs. It was building an architecture checker for my example project, which implements the same backend design in five languages side by side. The checker is a script that statically checks whether code follows the documented rules and scores the result, so catching drift no longer depends on a reviewer noticing it.</p>
        <p>Placement rules (which folder, which layer, which import direction) did their job from the start. The drift the checker missed came in three kinds, and each one had to be found by hand at least once before a rule could cover it.</p>
        <h2>What a Rule Is Allowed to Assume</h2>
        <p>The example business code (an Account domain, later joined by Card and Payment) is an illustrative sample, not a fixture the checker is allowed to depend on. A rule must never take "the Account domain behaves like this" as its premise; it has to check the architectural pattern in a way that would hold for any domain with that shape.</p>
        <p>The checker evaluates compliance with architectural rules (layer placement, dependency direction, naming, transaction boundaries, the Outbox pattern), never whether the business logic inside those structures happens to be correct. Order cancellation rules, payment approval conditions, inventory reservation policy: none of that is in scope. That kind of content can appear in a doc's example or in the runnable <code>examples/</code> code, but it can never become a required premise of a core rule. Blur that line, and a new rule couples itself to one specific business domain without anyone noticing, degrading the checker from a framework-agnostic architecture guide into an Account-service-only linter.</p>
        <h2>Many Small Assertions Over One Golden Implementation</h2>
        <p>The checker prefers partial scoring built from many small, independent assertions over pinning one single "this file must look exactly like this" reference implementation. Each rule checks individually whether a specific violation is present and the results sum into a score. The premise is that multiple valid implementations of the same principle can coexist, and a structurally sound choice shouldn't lose points just because it differs cosmetically from the example in <code>examples/</code>.</p>
        <h2>Blind Spot One: Names Inside the Right File</h2>
        <p>The first rules checked the things you'd expect: is there a domain folder, does the Interface layer avoid importing Infrastructure directly, does a Repository interface live where the docs say it should. That catches an entire class of drift, and it also has a precise blind spot. It says nothing about whether a method inside the right file is named correctly, or whether a class in the right folder depends on the right thing.</p>
        <p>An audit by hand surfaced this gap. A Repository method-naming convention (list lookups always named <code>find&lt;Noun&gt;s</code>, saves always <code>save&lt;Noun&gt;</code>) was violated in four of the five implementations, in different ways each time: a bare <code>save</code> with no noun in two of them, a "dedicated <code>findOne</code> plus separate <code>findAll</code>" pair reintroduced in an older domain in four of them. Every one of those files passed every structural rule that existed at the time, because none of those rules had ever looked at a method name.</p>
        <div className="article-note"><strong>The root cause, stated plainly</strong><p>Each time the same class of drift turned up, the diagnosis was the same: no tool checked for this specific thing. Structural checks verify placement. They say nothing about naming conventions, dependency direction inside an already-correct folder, or exact method-name patterns. Each of those needed its own dedicated rule, written only after a manual audit found the gap by hand at least once.</p></div>
        <h2>Blind Spot Two: Code and Doc Wrong Together</h2>
        <p>A "does the code match its own docs" audit can pass cleanly while both the code and the doc are wrong together. One implementation's own CQRS documentation had captured a Query Handler directly using a write-capable Repository as the correct example. The code matched the doc perfectly, and both were violating the root principle that a Query side should never see a write-capable interface at all. An audit that only checks doc-vs-code agreement is structurally incapable of catching this, because agreement is what it's checking for, and here the agreement itself was the bug.</p>
        <p>What surfaced it was comparing the local doc against the <em>root</em> principle instead. Once that comparison was made a standing rule instead of a one-time manual pass, it caught the same class of violation independently in other files the first time it ran.</p>
        <h2>Blind Spot Three: Disagreement Between Implementations</h2>
        <p>Audits that go one language at a time can never see a structural disagreement that only exists <em>between</em> languages. A notification-sending concern lived inside the domain module in two of the five implementations and in a separate shared top-level module in the other three. Neither choice was obviously wrong on its own, each passed its own language's checker cleanly, and the inconsistency was invisible to any single-language review by construction. It only became visible once the same concept was compared side by side across all five at once, which is a different kind of audit from "review this one codebase against its own docs."</p>
        <h2>Turning a Finding Into a Permanent Rule</h2>
        <p>The pattern that held up: find a violation by hand once, fix it, then write a rule that would have caught it, and run that new rule immediately, before assuming the code is now clean. The Repository-naming rule is the clearest example. Once it existed as a mechanical check rather than prose, running it against a domain nobody had thought to re-check (the authentication domain, in three of the five languages) immediately turned up three more violations that had never been in scope for any prior audit, because every earlier audit had only ever looked at the two business domains everyone kept thinking about. A dependency-direction rule, an ID-format rule, an error-response-schema rule, a soft-delete-filter rule: roughly thirty rules accumulated this way across five languages, each one born from an actual bug like this one, not a hypothetical one.</p>
        <p>The yield drops over time, and that's expected. Early on, each new rule category found three or four violations; later, most new rules found zero, because the low-hanging cross-language drift was already closed. A rule that costs an afternoon to write and catches nothing today is still standing guard against next month's regression.</p>
        <h2>What This Buys You That a Doc Alone Never Could</h2>
        <p>A CI pipeline that runs the checker on every change means a pull request that violates layer placement, naming convention, or dependency direction fails the build before a human ever has to notice it in review, the same way a linter catches a syntax issue before a reviewer has to point it out by hand. My self-review checklist is deliberately written to double as a spec for the checker: every new checklist item gets asked, "can this also be verified mechanically," before it's accepted as prose-only.</p>
        <div className="article-note"><strong>Further reading</strong><p>
          <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/docs/harness.md" target="_blank" rel="noreferrer">docs/harness.md</a> (the checker's design principles in full, in my example project that implements the same backend design in five languages) · <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/docs/checklist.md" target="_blank" rel="noreferrer">docs/checklist.md</a> (the self-review checklist most of these rules were built from) · <a href="/posts/the-doc-said-done-half-of-it-wasnt">The Doc Said "Done": When to Stop Adding Checks</a> (the naming finding followed rule by rule, and how a shrinking yield showed when to stop)
        </p></div>
      </>
    ),
  },
  ko: {
    kicker: 'Tooling · Architecture',
    title: (
      <>
        컴플라이언스를 코드로,<br /><em>아키텍처 검사기가 잡는 것과 계속 놓치는 것</em>
      </>
    ),
    lede: '아키텍처 문서를 자동 검사로 바꾸면, 코드가 엉뚱한 자리에 들어가는 건 잘 잡힌다. 그래도 세 가지는 계속 빠져나갔다. 맞는 파일 안의 틀린 이름, 자기 문서와 함께 틀린 코드, 두 구현 사이에만 있는 불일치다.',
    body: (
      <>
        <p>설계 문서는 주석과 같은 식으로 썩는다. 티 나지 않게 조금씩 낡다가, 어느 날 누군가 문서와 코드를 나란히 읽고서야 둘이 몇 달째 서로 다른 시스템을 설명하고 있었다는 걸 알게 된다. 내 경우 오래 효과가 간 해법은 문서를 더 잘 쓰는 게 아니었다. 아키텍처 검사기를 만드는 것이었다. 같은 백엔드 설계를 5개 언어로 나란히 구현해 둔 내 예제 프로젝트에 붙인 검사기로, 코드가 문서의 규칙을 따르는지 정적으로 검사해 점수를 매기는 스크립트다. 드리프트를 잡는 일이 더는 리뷰어의 눈에 기대지 않는다.</p>
        <p>배치 규칙(어느 폴더, 어느 계층, 어느 import 방향)은 처음부터 제 몫을 했다. 검사기가 놓친 드리프트는 세 종류였다. 셋 다 규칙으로 막기 전에 누군가 손으로 한 번은 찾아내야 했다.</p>
        <h2>규칙이 가정해도 되는 것</h2>
        <p>예제 비즈니스 코드는 처음엔 Account(계좌) 도메인이었고, 나중에 Card와 Payment가 더해졌다. 이건 설명용 샘플이다. 검사기가 기대도 되는 fixture가 아니다. 규칙은 "Account 도메인은 이렇게 동작한다"를 전제로 삼으면 안 된다. 같은 모양을 가진 도메인이라면 무엇이든 통하는 방식으로 아키텍처 패턴을 검사해야 한다.</p>
        <p>검사기가 평가하는 건 아키텍처 규칙을 지켰는지다. 계층 배치, 의존성 방향, 네이밍, 트랜잭션 경계, Outbox 패턴 같은 것들이다. 그 구조 안에 든 비즈니스 로직이 맞는지는 절대 평가하지 않는다. 주문 취소 규칙, 결제 승인 조건, 재고 예약 정책은 모두 범위 밖이다. 이런 내용은 문서 예시나 실행 가능한 <code>examples/</code> 코드에 나올 수는 있어도, 핵심 규칙의 필수 전제가 돼서는 안 된다.</p>
        <p>이 선이 흐려지면 새 규칙이 아무도 모르게 특정 비즈니스 도메인 하나에 묶인다. 그러면 검사기는 프레임워크와 상관없는 아키텍처 가이드에서 Account 서비스 전용 린터로 떨어진다.</p>
        <h2>정답 구현 하나보다 작은 assertion 여러 개</h2>
        <p>검사기는 "이 파일은 꼭 이렇게 생겨야 한다"는 레퍼런스 구현 하나를 박아 두지 않는다. 대신 작고 독립적인 assertion을 여러 개 두고 부분 점수를 매긴다. 규칙마다 특정 위반이 있는지를 따로 검사하고, 결과를 더해 점수를 낸다. 같은 원칙을 구현하는 올바른 방법이 여러 가지 있을 수 있다고 보기 때문이다. 구조가 건전하다면 <code>examples/</code>의 예제와 겉모습이 다르다는 이유로 점수를 깎으면 안 된다.</p>
        <h2>첫 번째 사각지대, 맞는 파일 안의 이름</h2>
        <p>처음 만든 규칙들은 누구나 예상할 만한 것들을 검사했다. domain 폴더가 있는지, Interface 계층이 Infrastructure를 직접 import하지 않는지, Repository 인터페이스가 문서에 적힌 위치에 있는지 같은 것이다. 이것만으로도 드리프트 한 부류를 통째로 잡는다. 대신 사각지대도 분명하다. 맞는 파일 안의 메서드 이름이 제대로 지어졌는지, 맞는 폴더 안의 클래스가 맞는 대상에 의존하는지는 전혀 알려 주지 않는다.</p>
        <p>손으로 한 감사에서 이 틈이 그대로 드러났다. Repository 메서드 네이밍 컨벤션이 있다. 목록 조회는 항상 <code>find&lt;Noun&gt;s</code>, 저장은 항상 <code>save&lt;Noun&gt;</code>로 짓는다. 그런데 5개 구현 중 4곳에서 이 규칙이 깨져 있었고, 깨진 모양도 매번 달랐다. 2곳은 명사 없이 <code>save</code>만 쓰고 있었고, 4곳은 오래된 도메인에 "전용 <code>findOne</code>과 별도 <code>findAll</code>" 짝이 되살아나 있었다. 이 파일들은 당시 있던 구조 규칙을 하나도 빠짐없이 통과했다. 그 규칙들 가운데 메서드 이름을 들여다본 게 하나도 없었기 때문이다.</p>
        <div className="article-note"><strong>근본 원인을 있는 그대로 적으면</strong><p>같은 부류의 드리프트를 거듭 발견하면서 내린 진단은 매번 같았다. 이걸 검사하는 도구가 없었다. 구조 검사는 배치를 확인한다. 네이밍 컨벤션이나, 이미 맞는 폴더 안의 의존성 방향, 메서드 이름 패턴에 대해서는 아무 말도 하지 않는다. 이런 것들은 하나하나 전용 규칙이 필요했다. 그리고 그 규칙은 수동 감사가 그 틈을 적어도 한 번 손으로 찾아낸 뒤에야 쓸 수 있었다.</p></div>
        <h2>두 번째 사각지대, 문서와 함께 틀린 코드</h2>
        <p>"코드가 자기 문서와 맞는가"를 보는 감사는, 코드와 문서가 함께 틀려 있으면 아무 문제 없이 통과한다. 한 구현체의 CQRS 문서에는 Query Handler가 쓰기 가능한 Repository를 직접 쓰는 코드가 올바른 예시로 실려 있었다. 코드는 문서와 완벽하게 맞았다. 그리고 둘 다 루트 원칙을 어기고 있었다. Query 쪽은 쓰기 가능한 인터페이스를 아예 보면 안 된다는 원칙이다.</p>
        <p>문서와 코드가 맞는지만 보는 감사로는 이걸 잡을 수 없다. 그 감사가 확인하는 게 일치 여부인데, 여기서는 일치 자체가 버그였다.</p>
        <p>문제를 드러낸 건 로컬 문서를 <em>루트</em> 원칙과 비교한 일이었다. 이 비교를 한 번 하고 끝내지 않고 상시 규칙으로 만들자, 처음 돌린 날 다른 파일에서도 같은 부류의 위반을 따로 잡아냈다.</p>
        <h2>세 번째 사각지대, 구현 사이의 불일치</h2>
        <p>언어를 하나씩 감사해서는 언어 <em>사이에만</em> 있는 구조적 불일치를 절대 볼 수 없다. 알림 발송이라는 관심사가 5개 구현 중 2곳에서는 domain 모듈 안에 있었고, 나머지 3곳에서는 따로 떼어 낸 공용 최상위 모듈에 있었다. 어느 쪽도 그것만 보면 딱히 틀리지 않았고, 각자 자기 언어의 검사기는 깨끗하게 통과했다.</p>
        <p>언어 하나만 리뷰해서는 애초에 보일 수가 없는 불일치였다. 같은 개념을 5개 언어에 걸쳐 나란히 놓고 비교하고 나서야 드러났다. "코드베이스 하나를 자기 문서와 대조해 리뷰한다"와는 전혀 다른 종류의 감사다.</p>
        <h2>발견을 영구 규칙으로 바꾸기</h2>
        <p>여러 번 해 보면서 자리 잡은 방식은 이렇다. 위반을 손으로 한 번 찾아서 고친다. 그 위반을 잡았을 규칙을 쓴다. 그리고 코드가 이제 깨끗하다고 믿기 전에 새 규칙을 바로 돌린다.</p>
        <p>Repository 네이밍 규칙이 가장 분명한 예다. 글로만 적혀 있던 규칙이 기계적인 검사가 되자마자, 아무도 다시 볼 생각을 안 했던 도메인에 돌려 봤다. 5개 언어 중 3곳의 인증(authentication) 도메인이었다. 그동안 어느 감사 범위에도 들어간 적 없던 위반 3건이 곧바로 나왔다. 이전 감사는 모두 다들 신경 쓰던 비즈니스 도메인 2개만 봤기 때문이다. 의존성 방향 규칙, ID 포맷 규칙, 에러 응답 스키마 규칙, soft-delete 필터 규칙까지, 이런 식으로 5개 언어에 걸쳐 약 30개 규칙이 쌓였다. 하나하나가 상상으로 만든 버그가 아니라 이 사례처럼 겪은 버그에서 나왔다.</p>
        <p>시간이 갈수록 찾아내는 건 줄어든다. 예상한 일이다. 초반에는 새 규칙 카테고리마다 위반을 3~4건씩 찾았다. 나중에는 새 규칙 대부분이 아무것도 찾지 못했다. 쉽게 잡히는 언어 간 드리프트는 이미 다 정리됐기 때문이다. 오후 한나절 들여 쓴 규칙이 오늘은 아무것도 못 잡아도, 다음 달에 생길 회귀는 막고 서 있다.</p>
        <h2>문서만으로는 얻을 수 없는 것</h2>
        <p>CI 파이프라인이 변경마다 검사기를 돌리면, 계층 배치나 네이밍 컨벤션, 의존성 방향을 어긴 pull request는 사람이 리뷰에서 알아채기 전에 빌드에서 떨어진다. 리뷰어가 손으로 짚기 전에 린터가 문법 오류를 잡는 것과 같다. 내 셀프 리뷰 체크리스트는 일부러 검사기 스펙을 겸하게 써 두었다. 새 항목을 넣을 때마다 "이것도 기계로 검증할 수 있나"를 먼저 묻고, 안 될 때만 글로만 남기는 항목으로 받는다.</p>
        <div className="article-note"><strong>더 볼 자료</strong><p>
          <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/docs/harness.md" target="_blank" rel="noreferrer">docs/harness.md</a>(같은 백엔드 설계를 5개 언어로 구현해 둔 내 예제 프로젝트의 검사기 설계 원칙 전문) · <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/docs/checklist.md" target="_blank" rel="noreferrer">docs/checklist.md</a>(대부분의 규칙이 여기서 나온 셀프 리뷰 체크리스트) · <a href="/posts/the-doc-said-done-half-of-it-wasnt">문서는 "끝났다"고 했다, 검사는 언제까지 늘려야 하나</a>(이름 규칙 발견을 규칙 하나하나 따라가며, 줄어드는 수확으로 언제 멈출지 정한 이야기)
        </p></div>
      </>
    ),
  },
};

export default function ComplianceAsCode() {
  const { locale } = useLocale();
  const c = content[locale];

  return (
    <PostLayout slug="compliance-as-code" kicker={c.kicker} title={c.title} lede={c.lede}>
      {c.body}
    </PostLayout>
  );
}
