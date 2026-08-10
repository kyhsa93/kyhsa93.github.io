import PostLayout from '../../components/PostLayout';
import { useLocale, localeFromPathname } from '../../lib/locale';
import type { MetaFunction } from 'react-router';
import { createPostMeta } from '../../lib/seo';

export const meta: MetaFunction = ({ location }) =>
  createPostMeta('the-doc-said-done-half-of-it-wasnt', localeFromPathname(location.pathname));

const content = {
  en: {
    kicker: 'Tooling · Conventions',
    title: (
      <>
        The Doc Said "Done."<br /><em>Half of It Wasn't.</em>
      </>
    ),
    lede: "Kotlin's own repository-pattern.md said the naming cleanup was finished. It covered the write-side Repository and missed every parallel read-side Query interface — the kind of half-finished fix that survives because nothing automated was checking. Building the check that should have existed immediately found three more real violations elsewhere, and four rounds later, doing the same thing to fifteen more conventions had also proven when to stop.",
    body: (
      <>
        <p>The root guide is explicit about Repository method names — <code>find&lt;Noun&gt;s</code> for any lookup, single record or list, <code>save&lt;Noun&gt;</code> for writes, no update method. Checking whether the real code actually followed it turned up violations in four of five languages: Go and FastAPI used a bare <code>Save</code>/<code>save</code> with no noun; the Card domain — the second Bounded Context, added later — had a "dedicated <code>findOne</code> plus a separate <code>findAll</code>" shape in Java, Kotlin, Go, and FastAPI that the convention doesn't allow. Only NestJS was clean everywhere.</p>
        <h2>"Done," According to the Doc</h2>
        <p>Kotlin's own <code>repository-pattern.md</code> claimed this exact cleanup was already finished. It was — for <code>AccountRepository</code>, the write-side interface. The parallel read-side interfaces — <code>AccountQuery</code>, <code>CardQuery</code>, <code>PaymentQuery</code>, <code>RefundQuery</code> — still had the old names. Nobody had lied; the fix had genuinely landed on one side of a symmetric pair and just never made it to the other. The doc today says so plainly, because it now doubles as its own regression note:</p>
        <blockquote>Even if a doc says "done," if an interface's renaming was actually missed (as <code>CredentialQuery.findByUserId</code> once was), it surfaces as a harness FAIL.</blockquote>
        <h2>Asking Why It Kept Recurring</h2>
        <p>The interfaces were fixed by hand across four language worktrees, verified with a full build and test run each, and pushed. Then came the more useful question: why had this specific, simple, well-documented convention drifted in four languages independently? The harnesses already checked plenty — file placement, layer purity, import direction — but none of them checked exact method-name conventions. <code>check_docs_drift.py</code> checked something adjacent but unrelated: whether a doc's claims match the file tree, not whether a method is spelled the way the doc says it should be. No tool existed that could have caught this, in any language, ever. That was the actual root cause, not carelessness in any one implementation.</p>
        <h2>The New Rule Proved the Diagnosis on Its First Run</h2>
        <p>A <code>repository-naming</code> harness rule went into all five languages — including NestJS, which was already compliant, purely as a regression guard against the next drift. A blocklist approach: flag <code>findBy*</code>, a bare <code>findAll</code>, <code>count*</code>, a bare <code>save</code>, a bare <code>delete</code>, on <code>*Repository</code>/<code>*Query</code> interfaces. It caught three more real, previously unnoticed violations immediately — all in the Auth/Credential domain, across Go, FastAPI, and Kotlin. If the tool-gap diagnosis had been wrong, the new rule would have found nothing new to find.</p>
        <h2>Then: How Many More Rules Like This Exist?</h2>
        <p>The next question was obvious once the first one paid off — what other conventions were documented but not enforced? Three more rounds followed, adding fifteen structural rules in total — not all of which applied to every language: domain-layer isolation, no cross-aggregate references within a Bounded Context, no direct env-var access outside config modules, aggregate-ID hex format, the exact four-field error-response shape, soft-delete filtering on every query, and more.</p>
        <p>Not every rule applied to every language, and forcing one where it didn't fit would have just traded real signal for noise — each language investigated applicability first and skipped or narrowed a rule with a documented reason rather than shipping a false-positive machine. FastAPI skipped an interface/infrastructure-isolation rule because its own docs mandate direct infrastructure instantiation inside <code>Depends</code> factories — there's no DI container to isolate against. Go skipped a no-public-setters rule because Go structs are conventionally all-exported in this codebase; the rule's premise about encapsulation simply didn't hold for the language. Go's own pass through this round did find one more real violation on its own — <code>interface/http</code> importing <code>infrastructure/auth</code> directly, a boundary the new domain-layer-isolation rule was built to catch.</p>
        <p>Round three added five more rules and found two more real bugs — FastAPI's <code>PaymentModel</code> and <code>RefundModel</code> were missing a <code>deleted_at</code> column entirely, unlike every other model in the same codebase. It also disproved something a previous round's notes had flagged as a known gap: Java's rate-limit filter, believed still unwired, turned out to have already been fixed for real, in an earlier, unrecorded commit — a reminder that a "known gap" written down once is a snapshot, not a live fact, and needs re-checking against current code before it gets cited again.</p>
        <h2>Round Four Found Almost Nothing, and That Was the Finding</h2>
        <p>The fourth round added four more rules across all five languages and turned up zero real code violations anywhere. What it did find were two leftover doc claims — one language's tactical-ddd.md still describing the repository as single-domain, a line nobody had touched since before the second Bounded Context existed — and one honest non-applicability: Go's stack has no ORM at all, so an ORM-autosync rule simply doesn't apply, and got documented as explicitly not applicable rather than forced through.</p>
        <div className="article-note"><strong>The yield curve was the point</strong><p>Round one and two: three to four real violations found per round. Round three: two. Round four: zero code bugs, two stale doc lines. That drop isn't evidence the later rounds were wasted — it's the closest thing to proof that the earlier rounds had actually closed most of the low-hanging cross-language drift this category of check can find. The goal was never to keep finding bugs forever; it was to find out when to stop, and a flat yield curve is the only honest way to learn that.</p></div>
        <p>"The doc said done" turned out to be less a lie than a claim nothing could verify — a self-report with no regression guard behind it, in a codebase with five parallel implementations any one of which could quietly drift back. What changed wasn't just the naming. It was that "done" stopped being something a doc could merely assert.</p>
        <div className="article-note"><strong>Further reading in the repo</strong><p>
          <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/docs/architecture/repository-pattern.md" target="_blank" rel="noreferrer">docs/architecture/repository-pattern.md</a> — the naming convention, and the note explaining why the harness now enforces it · <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/implementations/go/harness/repository_naming.go" target="_blank" rel="noreferrer">repository_naming.go</a> — one language's version of the regression guard
        </p></div>
      </>
    ),
  },
  ko: {
    kicker: 'Tooling · Conventions',
    title: (
      <>
        문서는 "끝났다"고 했다.<br /><em>절반만 끝나 있었다.</em>
      </>
    ),
    lede: 'kotlin 자신의 repository-pattern.md는 네이밍 정리가 끝났다고 말했다. 실제로는 쓰기 쪽 Repository만 끝났고, 짝을 이루는 읽기 쪽 Query 인터페이스는 전부 그대로였다 — 자동화된 검사가 없어서 살아남는 종류의 반쯤 끝난 수정이었다. 있어야 했던 검사를 만들자마자 다른 곳에서 진짜 위반 세 건이 더 나왔고, 네 라운드 뒤 열다섯 개 더 많은 컨벤션에 같은 걸 반복했을 땐 언제 멈춰야 하는지까지 증명돼 있었다.',
    body: (
      <>
        <p>루트 가이드는 Repository 메서드 이름에 대해 명확하다 — 단건이든 목록이든 조회는 <code>find&lt;Noun&gt;s</code>, 쓰기는 <code>save&lt;Noun&gt;</code>, 별도 update 메서드는 없음. 실제 코드가 이걸 정말 따르는지 확인했더니 다섯 언어 중 네 곳에서 위반이 나왔다: go와 fastapi는 명사 없는 그냥 <code>Save</code>/<code>save</code>를 썼고, Card 도메인 — 나중에 추가된 두 번째 Bounded Context — 은 java·kotlin·go·fastapi에서 "전용 <code>findOne</code> + 별도 <code>findAll</code>" 형태였는데 이건 컨벤션이 허용하지 않는 모양이었다. 어디서나 깨끗했던 건 nestjs뿐이었다.</p>
        <h2>문서상으로는 "끝난" 상태</h2>
        <p>kotlin 자신의 <code>repository-pattern.md</code>는 정확히 이 정리가 이미 끝났다고 주장했다. 실제로 끝나 있긴 했다 — 쓰기 쪽 인터페이스인 <code>AccountRepository</code>에 한해서. 짝을 이루는 읽기 쪽 인터페이스들 — <code>AccountQuery</code>, <code>CardQuery</code>, <code>PaymentQuery</code>, <code>RefundQuery</code> — 은 여전히 옛날 이름 그대로였다. 누구도 거짓말을 한 게 아니었다. 수정은 정말로 대칭 쌍의 한쪽에는 반영됐고, 다른 쪽에는 끝내 닿지 못했을 뿐이다. 이 문서는 오늘 그걸 그대로 적어두고 있다 — 이제 그 자체가 자신의 회귀 방지 기록을 겸하고 있기 때문이다:</p>
        <blockquote>문서가 "끝났다"고 말해도, 인터페이스 리네이밍이 실제로는 빠졌다면(한때 <code>CredentialQuery.findByUserId</code>가 그랬듯) 그건 하네스 FAIL로 드러난다.</blockquote>
        <h2>왜 계속 반복됐는지 묻기</h2>
        <p>인터페이스들은 4개 언어 worktree에서 손으로 고쳐지고, 각각 전체 빌드+테스트로 검증된 뒤 push됐다. 그다음이 더 쓸모 있는 질문이었다: 이렇게 단순하고 잘 문서화된 컨벤션이 왜 네 언어에서 각자 독립적으로 어긋났을까? 하네스는 이미 많은 걸 검사하고 있었다 — 파일 위치, 레이어 순수성, 임포트 방향 — 그런데 정확한 메서드 이름 컨벤션을 검사하는 건 하나도 없었다. <code>check_docs_drift.py</code>는 비슷해 보이지만 무관한 걸 검사했다: 문서의 주장이 파일 트리와 일치하는지였지, 메서드 이름이 문서가 말한 그대로 철자돼 있는지가 아니었다. 이걸 잡을 수 있었던 도구가 어느 언어에도, 한 번도 존재한 적이 없었다. 그게 진짜 원인이었지, 어느 한 구현체의 부주의가 아니었다.</p>
        <h2>새 규칙은 첫 실행에서 진단을 증명했다</h2>
        <p><code>repository-naming</code> 하네스 규칙이 5개 언어 전부에 들어갔다 — 이미 준수하고 있던 nestjs에도, 순전히 다음 드리프트에 대한 회귀 방지 장치로. 블록리스트 방식: <code>*Repository</code>/<code>*Query</code> 인터페이스에서 <code>findBy*</code>, 명사 없는 <code>findAll</code>, <code>count*</code>, 명사 없는 <code>save</code>, 명사 없는 <code>delete</code>를 플래그. 즉시 이전엔 아무도 몰랐던 진짜 위반 세 건을 더 잡아냈다 — 전부 go·fastapi·kotlin의 Auth/Credential 도메인에서. 도구 부재라는 진단이 틀렸다면, 새 규칙은 새로 찾을 게 아무것도 없었을 것이다.</p>
        <h2>그다음: 이런 규칙이 대체 몇 개나 더 있을까</h2>
        <p>첫 번째가 성과를 내자 다음 질문은 자연스러웠다 — 문서화는 됐지만 강제되지 않는 컨벤션이 또 뭐가 있을까? 세 라운드가 더 이어졌고, 총 15개의 구조 규칙이 추가됐다 — 언어마다 전부 적용된 건 아니었다: 도메인 레이어 격리, 같은 Bounded Context 내 크로스 애그리게이트 참조 금지, config 모듈 밖에서 env 변수 직접 접근 금지, 애그리게이트 ID의 16진수 포맷, 정확히 4필드인 에러 응답 형태, 모든 쿼리의 soft-delete 필터링 등.</p>
        <p>모든 규칙이 모든 언어에 적용된 건 아니었고, 맞지 않는 곳에 억지로 넣었다면 실질 신호를 노이즈로 바꿔치기했을 뿐이었을 것이다 — 각 언어는 먼저 적용 가능성을 조사한 뒤, 근거를 문서화하고 규칙을 건너뛰거나 좁혔지, 오탐 기계를 배포하지 않았다. fastapi는 interface/infrastructure 격리 규칙을 건너뛰었다 — 자신의 문서가 <code>Depends</code> 팩토리 안에서 인프라를 직접 인스턴스화하도록 명령하고 있기 때문이다. 격리시킬 DI 컨테이너 자체가 없다. go는 no-public-setters 규칙을 건너뛰었다 — 이 코드베이스에서 Go struct는 관례적으로 전부 export되어 있어서, 캡슐화를 전제로 한 규칙의 가정 자체가 성립하지 않았다. go 자신은 이번 라운드에서 진짜 위반을 하나 더 찾아냈다 — <code>interface/http</code>가 <code>infrastructure/auth</code>를 직접 임포트하고 있던 것, 새로 만든 domain-layer-isolation 규칙이 정확히 잡도록 설계된 경계였다.</p>
        <p>세 번째 라운드는 규칙 5개를 더하며 진짜 버그 2개를 더 찾았다 — fastapi의 <code>PaymentModel</code>과 <code>RefundModel</code>은 같은 코드베이스의 다른 모든 모델과 달리 <code>deleted_at</code> 컬럼 자체가 없었다. 이 라운드는 이전 라운드 기록이 "알려진 갭"이라고 남겨둔 것 하나도 반증했다: 아직 제대로 배선되지 않았다고 믿었던 java의 rate-limit filter가, 알고 보니 기록되지 않은 더 이전 커밋에서 이미 실제로 고쳐져 있었다 — 한 번 적힌 "알려진 갭"은 실시간 사실이 아니라 한 시점의 스냅샷일 뿐이니, 다시 인용하기 전에 현재 코드로 재확인해야 한다는 상기.</p>
        <h2>네 번째 라운드는 거의 아무것도 못 찾았고, 그게 발견이었다</h2>
        <p>네 번째 라운드는 5개 언어 전부에 규칙 4개를 더했고 실제 코드 위반은 어디서도 찾지 못했다. 대신 남아 있던 문서 주장 두 건을 찾았다 — 한 언어의 tactical-ddd.md가 여전히 이 저장소를 단일 도메인이라 서술하고 있었다, 두 번째 Bounded Context가 생기기 전부터 아무도 건드리지 않은 문장. 그리고 정직한 "해당 없음" 하나도 있었다: go 스택엔 ORM 자체가 없어서 ORM-autosync 규칙은 아예 적용되지 않았고, 억지로 끼워 맞추는 대신 명시적으로 "해당 없음"이라고 문서화했다.</p>
        <div className="article-note"><strong>수확 곡선 자체가 결론이었다</strong><p>1·2라운드: 라운드당 진짜 위반 3~4건. 3라운드: 2건. 4라운드: 코드 버그 0건, 문서 잔재 2건. 이 하락은 나중 라운드들이 낭비였다는 증거가 아니다 — 오히려 이전 라운드들이 이 종류의 검사가 찾을 수 있는 크로스랭귀지 드리프트 중 손쉬운 것들을 대부분 이미 닫아뒀다는 가장 가까운 증거다. 목표는 애초에 영원히 버그를 계속 찾는 게 아니라 언제 멈춰야 하는지를 아는 것이었고, 평평해진 수확 곡선이야말로 그걸 정직하게 알아낼 수 있는 유일한 방법이다.</p></div>
        <p>"문서는 끝났다고 했다"는 결국 거짓말이라기보다 아무도 검증할 수 없었던 주장이었다 — 그 뒤에 회귀 방지 장치가 하나도 없는 자체 보고, 그것도 다섯 개의 병렬 구현체 중 어느 하나든 조용히 다시 어긋날 수 있는 코드베이스에서. 바뀐 건 이름만이 아니었다. "끝났다"가 더 이상 문서가 그냥 주장만 하면 되는 것이 아니게 됐다는 점이다.</p>
        <div className="article-note"><strong>저장소 내 추가 자료</strong><p>
          <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/docs/architecture/repository-pattern.md" target="_blank" rel="noreferrer">docs/architecture/repository-pattern.md</a> — 네이밍 컨벤션과, 하네스가 이제 이를 강제하는 이유를 적은 노트 · <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/implementations/go/harness/repository_naming.go" target="_blank" rel="noreferrer">repository_naming.go</a> — 한 언어의 회귀 방지 장치 실물
        </p></div>
      </>
    ),
  },
};

export default function TheDocSaidDoneHalfOfItWasnt() {
  const { locale } = useLocale();
  const c = content[locale];

  return (
    <PostLayout
      slug="the-doc-said-done-half-of-it-wasnt"
      kicker={c.kicker}
      title={c.title}
      lede={c.lede}
    >
      {c.body}
    </PostLayout>
  );
}
