import PostLayout from '../../components/PostLayout';
import { useLocale } from '../../lib/locale';

const content = {
  en: {
    kicker: 'Tooling · Architecture',
    title: (
      <>
        Compliance as Code:<br /><em>Building a Harness That Enforces Architecture</em>
      </>
    ),
    lede: "An architecture doc that nobody mechanically checks against is a suggestion with extra steps. The interesting engineering problem isn't writing the doc — it's building something that can tell you, automatically, the moment code stops following it.",
    body: (
      <>
        <p>Design docs rot the same way comments do — quietly, a little at a time, until the day someone reads the doc, reads the code, and notices they've been describing two different systems for months. The fix that actually held up here wasn't writing better docs. It was building a harness: an automated evaluator that statically checks whether real code follows the documented rules, with no human review required to catch drift.</p>
        <h2>What a Harness Rule Is Allowed to Assume</h2>
        <p>The business example in this repo's <code>examples/</code> directory — the Account domain, and later Card and Payment — is an illustrative sample, not a fixture the harness is allowed to depend on. A harness rule must never assume "the Account domain behaves like this" as its premise; it has to check the architectural pattern in a way that would hold for any domain with that shape.</p>
        <p>The harness evaluates compliance with architectural rules — layer placement, dependency direction, naming, transaction boundaries, the Outbox pattern — never whether the business logic inside those structures happens to be correct. Order cancellation rules, payment approval conditions, inventory reservation policy: none of that is in scope. That kind of content can appear in a doc's example or in the runnable <code>examples/</code> code, but it can never become a required premise of a core rule. Blur that line, and a new evaluator quietly couples itself to one specific business domain, degrading the harness from a framework-agnostic architecture guide into an Account-service-only linter.</p>
        <h2>Assertions Over One Golden Implementation</h2>
        <p>The harness prefers partial scoring built from many small, independent assertions over pinning one single "this file must look exactly like this" reference implementation. Each rule checks individually whether a specific violation is present and the results sum into a score — the premise being that multiple valid implementations of the same principle can coexist, and the harness shouldn't punish a structurally sound choice just because it differs cosmetically from the example in <code>examples/</code>.</p>
        <h2>Why a Structural Check Isn't Enough on Its Own</h2>
        <p>The first generation of harness rules checked exactly the things you'd expect: is there a domain folder, does the Interface layer avoid importing Infrastructure directly, does a Repository interface live where the docs say it should. That catches an entire class of drift — and it also has a precise blind spot. It says nothing about whether a method inside the right file is named correctly, or whether a class in the right folder depends on the right thing.</p>
        <p>A real audit surfaced exactly this gap: a Repository method-naming convention (list lookups always named <code>find&lt;Noun&gt;s</code>, saves always <code>save&lt;Noun&gt;</code>) was violated in four of five language implementations, in different ways each time — a bare <code>save</code> with no noun in two of them, a "dedicated <code>findOne</code> plus separate <code>findAll</code>" pair reintroduced in an older domain in four of them. Every one of those files passed every structural rule that existed at the time, because none of those rules had ever looked at a method name.</p>
        <div className="article-note"><strong>The actual root cause, stated plainly</strong><p>The recurring diagnosis, across several rounds of finding the same class of drift: no tool checked for this specific thing. Structural checks verify placement. They say nothing about naming conventions, dependency direction inside an already-correct folder, or exact method-name patterns — each of those needed its own dedicated rule, written only after a manual audit found the gap by hand at least once.</p></div>
        <h2>The Failure Mode Even a Careful Audit Misses</h2>
        <p>There's a harder version of the same problem: a "does the code match its own docs" audit can pass cleanly while both the code and the doc are wrong together. One implementation's own CQRS documentation had captured a Query Handler directly using a write-capable Repository as the correct example — the code matched the doc perfectly, and both were violating the root principle that a Query side should never see a write-capable interface at all. An audit that only checks doc-vs-code agreement is structurally incapable of catching this, because agreement is exactly what it's checking for, and here the agreement itself was the bug.</p>
        <p>What actually surfaced it was comparing the local doc against the <em>root</em> principle instead — and once that comparison was made a standing rule instead of a one-time manual pass, it caught the same class of violation independently in other files the first time it ran.</p>
        <h2>Structural Rules Also Miss Cross-Language Inconsistency</h2>
        <p>A subtler blind spot: audits that go one language at a time can never see a structural disagreement that only exists <em>between</em> languages. A notification-sending concern lived inside the domain module in two of five language implementations and in a separate shared top-level module in the other three — neither choice was obviously wrong on its own, each passed its own language's harness cleanly, and the inconsistency was invisible to any single-language review by construction. It only became visible once the same concept was compared side by side across all five at once, which is a fundamentally different kind of audit than "review this one codebase against its own docs."</p>
        <h2>Turning a Finding Into a Permanent Rule</h2>
        <p>The pattern that held up across many rounds: find a real violation by hand once, fix it, then write a harness rule that would have caught it — and run that new rule immediately, before assuming the codebase is now clean. Rules built this way have repeatedly found 2-3 more real, previously-unnoticed violations the very first time they ran, in files the original manual audit never happened to look at. A dependency-direction rule, an ID-format rule, an error-response-schema rule, a soft-delete-filter rule — roughly thirty rules accumulated this way across five languages, each one born from an actual bug, not a hypothetical one.</p>
        <p>The yield drops over time, and that's expected, not a sign the exercise stopped being worth it. Early rounds found three or four real violations per new rule category; by the fourth round of this exercise, most new rules found zero, because the low-hanging cross-language drift was already closed. Diminishing returns, but not zero returns — a rule that costs an afternoon to write and catches nothing today is still standing guard against next month's regression.</p>
        <h2>What This Buys You That a Doc Alone Never Could</h2>
        <p>A CI pipeline that runs the harness on every change means a pull request that violates layer placement, naming convention, or dependency direction fails the build before a human ever has to notice it in review — the same way a linter catches a syntax issue before a reviewer has to point it out by hand. The self-review checklist this repo keeps is deliberately written to double as an evaluator spec: every new checklist item gets asked, "can this also be verified mechanically," before it's accepted as prose-only.</p>
        <div className="article-note"><strong>Further reading in the repo</strong><p>
          <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/docs/harness.md" target="_blank" rel="noreferrer">docs/harness.md</a> — the harness's own design principles, in full · <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/docs/checklist.md" target="_blank" rel="noreferrer">docs/checklist.md</a> — the self-review checklist most of these rules were built from
        </p></div>
      </>
    ),
  },
  ko: {
    kicker: 'Tooling · Architecture',
    title: (
      <>
        코드로서의 컴플라이언스:<br /><em>아키텍처를 강제하는 Harness 만들기</em>
      </>
    ),
    lede: '아무도 기계적으로 검사하지 않는 아키텍처 문서는 그냥 절차만 복잡한 제안일 뿐이다. 진짜 흥미로운 엔지니어링 문제는 문서를 쓰는 게 아니라, 코드가 그 문서를 따르지 않는 순간을 자동으로 알려주는 무언가를 만드는 것이다.',
    body: (
      <>
        <p>설계 문서는 주석과 똑같은 방식으로 부패한다 — 조용히, 조금씩, 그러다 어느 날 누군가 문서를 읽고 코드를 읽고서 몇 달째 서로 다른 두 시스템을 설명하고 있었다는 걸 알아차릴 때까지. 여기서 실제로 효과가 있었던 해법은 더 나은 문서를 쓰는 게 아니었다. Harness를 만드는 것이었다 — 실제 코드가 문서화된 규칙을 따르는지 정적으로 검사하는 자동화된 평가기로, 드리프트를 잡아내는 데 사람의 리뷰가 전혀 필요 없다.</p>
        <h2>Harness 규칙이 가정해도 되는 것</h2>
        <p>이 저장소의 <code>examples/</code> 디렉터리에 있는 비즈니스 예제 — Account 도메인, 그리고 이후의 Card와 Payment — 는 예시용 샘플일 뿐, Harness가 의존해도 되는 fixture가 아니다. Harness 규칙은 "Account 도메인은 이렇게 동작한다"는 것을 전제로 삼아서는 절대 안 되며, 그 형태를 가진 어떤 도메인에도 적용될 수 있는 방식으로 아키텍처 패턴을 검사해야 한다.</p>
        <p>Harness는 아키텍처 규칙 준수 여부 — 계층 배치, 의존성 방향, 네이밍, 트랜잭션 경계, Outbox 패턴 — 만 평가하며, 그 구조 안의 비즈니스 로직이 우연히 맞는지는 절대 평가하지 않는다. 주문 취소 규칙, 결제 승인 조건, 재고 예약 정책 — 이런 것들은 전부 범위 밖이다. 이런 내용은 문서의 예시나 실행 가능한 <code>examples/</code> 코드에는 등장할 수 있지만, 핵심 규칙의 필수 전제가 되어서는 절대 안 된다. 그 선을 흐리면, 새 평가기가 특정 비즈니스 도메인 하나에 조용히 종속되어 버리고, Harness는 프레임워크에 구애받지 않는 아키텍처 가이드에서 Account 서비스 전용 린터로 전락한다.</p>
        <h2>하나의 정답 구현보다 여러 개의 Assertion</h2>
        <p>Harness는 "이 파일은 반드시 이렇게 생겨야 한다"는 하나의 레퍼런스 구현을 고정해두는 방식보다, 작고 독립적인 여러 assertion으로 이루어진 부분 점수 방식을 선호한다. 각 규칙은 특정 위반이 존재하는지를 개별적으로 검사하고 그 결과를 합산해 점수를 매긴다 — 같은 원칙을 구현하는 방법이 여러 가지 유효하게 공존할 수 있다는 전제이며, Harness는 <code>examples/</code>의 예제와 겉모습만 다를 뿐 구조적으로는 건전한 선택을 벌점 처리해서는 안 된다.</p>
        <h2>구조적 검사만으로는 충분하지 않은 이유</h2>
        <p>1세대 Harness 규칙들은 딱 예상 가능한 것들을 검사했다: domain 폴더가 있는가, Interface 계층이 Infrastructure를 직접 import하지 않는가, Repository 인터페이스가 문서가 말하는 위치에 있는가. 이것만으로도 한 부류의 드리프트 전체를 잡아낼 수 있다 — 그리고 정확히 그만큼의 사각지대도 존재한다. 올바른 파일 안의 메서드 이름이 맞게 붙었는지, 올바른 폴더 안의 클래스가 올바른 것에 의존하는지에 대해서는 아무것도 말해주지 않는다.</p>
        <p>실제 감사에서 정확히 이 틈이 드러났다: Repository 메서드 네이밍 컨벤션(목록 조회는 항상 <code>find&lt;Noun&gt;s</code>, 저장은 항상 <code>save&lt;Noun&gt;</code>)이 다섯 언어 구현 중 네 곳에서, 매번 다른 방식으로 위반되어 있었다 — 그중 두 곳은 명사 없이 맨몸의 <code>save</code>를, 네 곳은 더 오래된 도메인에 "전용 <code>findOne</code>과 별도의 <code>findAll</code>" 쌍이 되살아나 있었다. 그 파일들은 하나같이 당시 존재하던 모든 구조적 규칙을 통과했는데, 그 규칙들 중 어느 것도 메서드 이름을 들여다본 적이 없었기 때문이다.</p>
        <div className="article-note"><strong>있는 그대로 말하는 진짜 근본 원인</strong><p>같은 부류의 드리프트를 여러 라운드에 걸쳐 발견하면서 반복적으로 내려진 진단: 이 특정한 것을 검사하는 도구가 없었다. 구조적 검사는 배치를 검증한다. 네이밍 컨벤션, 이미 올바른 폴더 내부의 의존성 방향, 정확한 메서드 이름 패턴에 대해서는 아무것도 말해주지 않는다 — 이것들 각각은 전용 규칙이 필요했고, 그 규칙은 수동 감사가 그 틈을 최소 한 번 직접 찾아낸 뒤에야 작성될 수 있었다.</p></div>
        <h2>꼼꼼한 감사조차 놓치는 실패 유형</h2>
        <p>같은 문제의 더 까다로운 버전도 있다: "코드가 자신의 문서와 일치하는가"를 검사하는 감사는, 코드와 문서가 함께 틀려 있어도 깔끔하게 통과할 수 있다. 한 구현체 자신의 CQRS 문서는 Query Handler가 쓰기 가능한 Repository를 직접 사용하는 것을 올바른 예시로 담고 있었다 — 코드는 문서와 완벽하게 일치했고, 둘 다 Query 쪽은 쓰기 가능한 인터페이스를 절대 봐서는 안 된다는 루트 원칙을 위반하고 있었다. 문서와 코드의 일치 여부만 검사하는 감사는 구조적으로 이를 잡아낼 수 없는데, 일치 그 자체가 바로 그 감사가 검사하는 대상이고, 여기서는 그 일치 자체가 버그였기 때문이다.</p>
        <p>실제로 이를 드러낸 건 로컬 문서를 <em>루트</em> 원칙과 비교하는 것이었다 — 그리고 이 비교가 일회성 수동 점검이 아니라 상시 규칙이 되자, 처음 실행했을 때 다른 파일들에서도 같은 부류의 위반을 독립적으로 잡아냈다.</p>
        <h2>구조적 규칙 역시 놓치는 언어 간 불일치</h2>
        <p>더 미묘한 사각지대도 있다: 언어를 하나씩 순서대로 감사하는 방식으로는 언어 <em>사이에만</em> 존재하는 구조적 불일치를 절대 볼 수 없다. 알림 발송이라는 관심사가 다섯 언어 구현 중 두 곳에서는 domain 모듈 안에, 나머지 세 곳에서는 별도의 공유 최상위 모듈에 자리 잡고 있었다 — 어느 쪽 선택도 그 자체만 보면 명백히 틀린 건 아니었고, 각자 자기 언어의 Harness는 깔끔하게 통과했으며, 이 불일치는 애초에 단일 언어 리뷰로는 구조적으로 보이지 않는 것이었다. 이는 같은 개념을 다섯 언어 전체에 걸쳐 나란히 비교했을 때에야 비로소 드러났는데, 이는 "이 코드베이스 하나를 자신의 문서와 비교해 리뷰한다"는 것과는 근본적으로 다른 종류의 감사다.</p>
        <h2>발견 사항을 영구적인 규칙으로 바꾸기</h2>
        <p>여러 라운드에 걸쳐 유지된 패턴은 이랬다: 실제 위반 사례를 손으로 한 번 찾아내고, 고치고, 그것을 잡아냈을 Harness 규칙을 작성한 뒤 — 코드베이스가 이제 깨끗하다고 가정하기 전에 그 새 규칙을 즉시 실행하는 것. 이렇게 만들어진 규칙들은 처음 실행될 때마다, 원래의 수동 감사가 우연히 들여다본 적 없던 파일들에서 이전에 눈치채지 못했던 실제 위반 사례를 2~3건씩 반복적으로 더 찾아냈다. 의존성 방향 규칙, ID 포맷 규칙, 에러 응답 스키마 규칙, soft-delete 필터 규칙 — 다섯 언어에 걸쳐 이런 식으로 약 서른 개의 규칙이 쌓였고, 각각은 가상의 버그가 아니라 실제 버그에서 태어났다.</p>
        <p>이 수확은 시간이 지날수록 줄어드는데, 이는 예상된 일이지 이 작업이 더 이상 가치가 없어졌다는 신호가 아니다. 초기 라운드에서는 새 규칙 카테고리마다 실제 위반 사례를 서너 건씩 찾아냈지만, 이 작업의 네 번째 라운드에 이르러서는 새 규칙 대부분이 아무것도 찾아내지 못했다. 손쉽게 잡을 수 있는 언어 간 드리프트가 이미 정리되었기 때문이다. 수확 체감이지, 수확이 0이 되는 건 아니다 — 하루 오후를 들여 작성했지만 오늘은 아무것도 잡아내지 못하는 규칙도, 다음 달의 회귀를 여전히 지켜서고 있는 것이다.</p>
        <h2>문서 하나만으로는 절대 얻을 수 없는 것</h2>
        <p>모든 변경마다 Harness를 실행하는 CI 파이프라인이 있으면, 계층 배치나 네이밍 컨벤션이나 의존성 방향을 위반한 pull request는 사람이 리뷰에서 알아차리기도 전에 빌드가 실패한다 — 린터가 리뷰어가 손으로 지적하기 전에 문법 오류를 잡아내는 것과 같은 방식이다. 이 저장소가 유지하는 셀프 리뷰 체크리스트는 의도적으로 평가기 스펙을 겸하도록 작성돼 있다: 새로운 체크리스트 항목이 추가될 때마다 "이것도 기계적으로 검증할 수 있는가"를 먼저 묻고, 그렇지 않을 때만 프로즈 전용 항목으로 받아들인다.</p>
        <div className="article-note"><strong>저장소 내 추가 자료</strong><p>
          <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/docs/harness.md" target="_blank" rel="noreferrer">docs/harness.md</a> — Harness 자체의 설계 원칙 전문 · <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/docs/checklist.md" target="_blank" rel="noreferrer">docs/checklist.md</a> — 이 규칙들 대부분이 만들어진 원천인 셀프 리뷰 체크리스트
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
