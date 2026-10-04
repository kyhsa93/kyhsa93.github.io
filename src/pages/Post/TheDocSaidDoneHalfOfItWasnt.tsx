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
        The Doc Said "Done."<br /><em>When to Stop Adding Checks</em>
      </>
    ),
    lede: "Every time a manual audit finds drift, the obvious fix is to write the check that would have caught it. The harder question is when to stop writing them. For me the yield curve answered it: the early batches of new rules each found three or four violations, the next batch found two, and the last found none in code. It started with a doc that said a naming cleanup was done when only half of it was.",
    body: (
      <>
        <p>This happened in my example project, which implements the same backend design in five languages side by side. Its root guide is explicit about Repository method names: <code>find&lt;Noun&gt;s</code> for any lookup, single record or list, <code>save&lt;Noun&gt;</code> for writes, no update method. Checking whether the code followed it turned up violations in four of five languages. Go and FastAPI used a bare <code>Save</code>/<code>save</code> with no noun. The Card domain (the second Bounded Context, added later) had a "dedicated <code>findOne</code> plus a separate <code>findAll</code>" shape in Java, Kotlin, Go, and FastAPI that the convention doesn't allow. Only NestJS was clean everywhere.</p>
        <h2>The First Finding: "Done" on One Side Only</h2>
        <p>Kotlin's own <code>repository-pattern.md</code> claimed this cleanup was already finished. It was, for <code>AccountRepository</code>, the write-side interface. The parallel read-side interfaces (<code>AccountQuery</code>, <code>CardQuery</code>, <code>PaymentQuery</code>, <code>RefundQuery</code>) still had the old names. Nobody had lied; the fix had landed on one side of a symmetric pair and never made it to the other. The doc today says so plainly, because it now doubles as its own regression note:</p>
        <blockquote>Even if a doc says "done," if an interface's renaming was actually missed (as <code>CredentialQuery.findByUserId</code> once was), it surfaces as a harness FAIL.</blockquote>
        <h2>Before Writing a Rule, Ask Why It Recurred</h2>
        <p>The interfaces were fixed by hand across four language worktrees, verified with a full build and test run each, and pushed. Then came the more useful question: why had this specific, simple, well-documented convention drifted in four languages independently? Each language already had an architecture checker (a script that statically checks code against the documented rules), and those checked plenty: file placement, layer purity, import direction. None of them checked exact method-name conventions. A separate docs drift script (<code>check_docs_drift.py</code>) checked something adjacent but unrelated: whether a doc's claims match the file tree, not whether a method is spelled the way the doc says it should be. No tool existed that could have caught this, in any language, ever. That was the root cause, not carelessness in any one implementation.</p>
        <h2>The First Run Tests the Diagnosis</h2>
        <p>A <code>repository-naming</code> rule went into all five languages, including NestJS, which was already compliant, purely as a regression guard against the next drift. It works as a blocklist: flag <code>findBy*</code>, a bare <code>findAll</code>, <code>count*</code>, a bare <code>save</code>, a bare <code>delete</code>, on <code>*Repository</code>/<code>*Query</code> interfaces. It caught three more previously unnoticed violations immediately, all in the Auth/Credential domain, across Go, FastAPI, and Kotlin. If the tool-gap diagnosis had been wrong, the new rule would have found nothing new to find.</p>
        <h2>Widening the Search Without Forcing Rules</h2>
        <p>The next question was obvious once the first one paid off: what other conventions were documented but not enforced? More passes with the same question followed, adding fifteen structural rules in total, not all of which applied to every language. Domain-layer isolation, no cross-aggregate references within a Bounded Context, no direct env-var access outside config modules, aggregate-ID hex format, the exact four-field error-response shape, soft-delete filtering on every query, and more.</p>
        <p>Not every rule applied to every language, and forcing one where it didn't fit would have traded signal for noise. Each language investigated applicability first and skipped or narrowed a rule with a documented reason rather than shipping a false-positive machine. FastAPI skipped an interface/infrastructure-isolation rule because its own docs mandate direct infrastructure instantiation inside <code>Depends</code> factories; there's no DI container to isolate against. Go skipped a no-public-setters rule because Go structs are conventionally all-exported in this codebase, so the rule's premise about encapsulation didn't hold for the language. Go's own pass did find one more violation on its own: <code>interface/http</code> importing <code>infrastructure/auth</code> directly, a boundary the new domain-layer-isolation rule was built to catch.</p>
        <p>The next batch added five more rules and found two more bugs. FastAPI's <code>PaymentModel</code> and <code>RefundModel</code> were missing a <code>deleted_at</code> column entirely, unlike every other model in the same codebase. It also disproved something earlier notes had flagged as a known gap: Java's rate-limit filter, believed still unwired, turned out to have been fixed already, in an earlier, unrecorded commit. A "known gap" written down once is a snapshot, not a live fact, and needs re-checking against current code before it gets cited again.</p>
        <h2>Stop When the Yield Curve Goes Flat</h2>
        <p>The last batch added four more rules across all five languages and turned up zero code violations anywhere. What it did find were two leftover doc claims (one language's tactical-ddd.md still describing the codebase as single-domain, a line nobody had touched since before the second Bounded Context existed) and one honest non-applicability: Go's stack has no ORM at all, so an ORM-autosync rule doesn't apply, and got documented as explicitly not applicable rather than forced through.</p>
        <div className="article-note"><strong>The yield curve was the point</strong><p>The early batches found three to four violations each. The one after that found two. The last found zero code bugs and two stale doc lines. That drop isn't evidence the later work was wasted. It's the closest thing to proof that the earlier batches had closed most of the low-hanging cross-language drift this category of check can find. The goal was never to keep finding bugs forever; it was to find out when to stop, and a flat yield curve is the only honest way to learn that.</p></div>
        <p>"The doc said done" turned out to be less a lie than a claim nothing could verify: a self-report with no regression guard behind it, in a codebase with five parallel implementations any one of which could drift back unnoticed. What changed wasn't just the naming. It was that "done" stopped being something a doc could merely assert.</p>
        <div className="article-note"><strong>Further reading</strong><p>
          <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/docs/architecture/repository-pattern.md" target="_blank" rel="noreferrer">docs/architecture/repository-pattern.md</a> (the naming convention, and the note explaining why it is now checked automatically, in my example project that implements the same backend design in five languages) · <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/implementations/go/harness/repository_naming.go" target="_blank" rel="noreferrer">repository_naming.go</a> (one language's version of the regression guard) · <a href="/posts/compliance-as-code">Compliance as Code: What an Architecture Checker Catches, and What It Keeps Missing</a> (the three kinds of drift that placement checks keep missing)
        </p></div>
      </>
    ),
  },
  ko: {
    kicker: 'Tooling · Conventions',
    title: (
      <>
        문서는 "끝났다"고 했다.<br /><em>검사는 언제까지 늘려야 하나</em>
      </>
    ),
    lede: '수동 감사에서 어긋남을 찾으면, 그걸 잡았을 검사를 하나 쓰면 된다. 어려운 건 언제 그만 쓰느냐다. 내 경우엔 수확 곡선이 답을 줬다. 처음 몇 번은 새 규칙을 더할 때마다 위반이 3~4건씩 나왔고, 그다음은 2건, 마지막은 코드에서 0건이었다. 시작은 네이밍 정리가 끝났다고 적힌 문서였다. 끝난 건 절반뿐이었다.',
    body: (
      <>
        <p>같은 백엔드 설계를 5개 언어로 나란히 구현해 둔 내 예제 프로젝트에서 있었던 일이다. 루트 가이드는 Repository 메서드 이름을 분명하게 정해 둔다. 단건이든 목록이든 조회는 <code>find&lt;Noun&gt;s</code>, 쓰기는 <code>save&lt;Noun&gt;</code>이고 update 메서드는 따로 두지 않는다. 코드가 이걸 지키는지 확인해 보니 5개 언어 중 4곳에서 위반이 나왔다. go와 fastapi는 명사 없이 <code>Save</code>/<code>save</code>만 썼다. 나중에 두 번째 Bounded Context로 들어온 Card 도메인은 java·kotlin·go·fastapi에서 "전용 <code>findOne</code>에 별도 <code>findAll</code>" 모양이었는데, 컨벤션이 허용하지 않는 형태다. 모든 곳이 깨끗했던 건 nestjs뿐이었다.</p>
        <h2>첫 발견, 한쪽만 끝난 정리</h2>
        <p>kotlin의 <code>repository-pattern.md</code>에는 바로 이 정리가 이미 끝났다고 적혀 있었다. 틀린 말은 아니었다. 쓰기 쪽 인터페이스인 <code>AccountRepository</code>는 끝나 있었다. 그런데 짝이 되는 읽기 쪽 인터페이스인 <code>AccountQuery</code>, <code>CardQuery</code>, <code>PaymentQuery</code>, <code>RefundQuery</code>는 옛 이름 그대로였다. 누가 거짓말을 한 건 아니다. 대칭인 두 쪽 중 한쪽만 고쳐지고 다른 쪽까지는 가지 못했을 뿐이다. 지금 그 문서에는 이 일이 그대로 적혀 있고, 회귀를 막는 메모 역할도 한다.</p>
        <blockquote>문서가 "끝났다"고 말해도, 인터페이스 리네이밍이 실제로는 빠졌다면(한때 <code>CredentialQuery.findByUserId</code>가 그랬듯) 그건 하네스 FAIL로 드러난다.</blockquote>
        <h2>규칙을 쓰기 전에 왜 반복됐는지 묻는다</h2>
        <p>인터페이스는 4개 언어의 worktree에서 손으로 고쳤고, 언어마다 전체 빌드와 테스트를 돌려 확인한 뒤 푸시했다. 그다음 질문이 더 쓸모 있었다. 이렇게 단순하고 문서에도 잘 적힌 컨벤션이 왜 4개 언어에서 저마다 따로 어긋났을까.</p>
        <p>언어마다 이미 아키텍처 검사기가 있었다. 코드가 문서의 규칙을 따르는지 정적으로 검사하는 스크립트다. 파일 위치, 레이어 순수성, import 방향처럼 많은 걸 보고 있었지만, 메서드 이름 컨벤션을 검사하는 규칙은 하나도 없었다. 문서 드리프트를 보는 스크립트(<code>check_docs_drift.py</code>)는 비슷해 보여도 보는 대상이 달랐다. 문서 내용이 파일 트리와 맞는지를 볼 뿐, 메서드 이름이 문서대로 쓰였는지는 보지 않는다. 어느 언어에서든 이걸 잡을 도구가 처음부터 없었던 것이다. 어느 한 구현체가 부주의해서 생긴 일이 아니었다.</p>
        <h2>첫 실행이 진단을 시험한다</h2>
        <p><code>repository-naming</code> 규칙을 5개 언어 모두에 넣었다. 이미 잘 지키고 있던 nestjs에도 다음에 어긋날 때를 대비해 넣었다. 방식은 블록리스트다. <code>*Repository</code>/<code>*Query</code> 인터페이스에 <code>findBy*</code>, 명사 없는 <code>findAll</code>, <code>count*</code>, 명사 없는 <code>save</code>, 명사 없는 <code>delete</code>가 있으면 걸러 낸다.</p>
        <p>돌리자마자 그동안 아무도 몰랐던 위반 3건이 더 나왔다. 모두 go·fastapi·kotlin의 Auth/Credential 도메인이었다. 도구가 없어서라는 진단이 틀렸다면, 새 규칙은 새로 찾을 게 없었을 것이다.</p>
        <h2>범위를 넓히되 안 맞는 규칙은 뺀다</h2>
        <p>첫 규칙이 성과를 내니 다음 질문은 정해져 있었다. 문서에는 있는데 강제하지 않는 컨벤션이 또 뭐가 있을까. 같은 질문으로 몇 번 더 훑었고, 구조 규칙을 모두 15개 더했다. 모든 언어에 다 들어간 건 아니다. 도메인 레이어 격리, 같은 Bounded Context 안에서 다른 Aggregate 참조 금지, config 모듈 밖에서 환경 변수 직접 읽기 금지, Aggregate ID의 16진수 형식, 필드 4개짜리 에러 응답 형태, 모든 쿼리의 soft-delete 필터 같은 것들이다.</p>
        <p>맞지 않는 언어에 규칙을 억지로 넣으면 쓸모 있는 신호 대신 잡음만 늘어난다. 그래서 언어마다 먼저 적용할 수 있는지 따져 보고, 안 맞으면 이유를 문서에 남긴 채 규칙을 빼거나 범위를 좁혔다. 오탐만 쏟아내는 검사를 내보내지는 않았다. fastapi는 interface/infrastructure 격리 규칙을 뺐다. fastapi 문서는 <code>Depends</code> 팩토리 안에서 인프라를 직접 만들라고 정해 두었고, 격리할 대상인 DI 컨테이너가 아예 없다. go는 no-public-setters 규칙을 뺐다. 이 코드베이스의 Go struct는 관례상 전부 export되어 있어서, 캡슐화를 전제로 한 규칙이 성립하지 않는다. 대신 go는 자기 검사에서 위반을 하나 더 찾았다. <code>interface/http</code>가 <code>infrastructure/auth</code>를 직접 import하고 있었는데, 새 domain-layer-isolation 규칙이 잡으려던 경계가 바로 이것이었다.</p>
        <p>그다음에는 규칙 5개를 더해 버그 2건을 더 찾았다. fastapi의 <code>PaymentModel</code>과 <code>RefundModel</code>에만 <code>deleted_at</code> 컬럼이 아예 없었다. 같은 코드베이스의 다른 모델에는 모두 있는 컬럼이다. 이때 예전 기록에 "알려진 갭"으로 남아 있던 항목 하나가 틀렸다는 것도 알게 됐다. 아직 연결되지 않았다고 믿었던 java의 rate-limit filter가, 기록되지 않은 이전 커밋에서 이미 고쳐져 있었다. 한 번 적어 둔 "알려진 갭"은 그 시점의 스냅샷이다. 다시 인용하기 전에 지금 코드로 확인해야 한다.</p>
        <h2>수확 곡선이 평평해지면 멈춘다</h2>
        <p>마지막에는 5개 언어 모두에 규칙 4개를 더했는데, 코드 위반은 한 건도 나오지 않았다. 대신 문서에 남은 낡은 문장 2건이 나왔다. 그중 하나는 한 언어의 tactical-ddd.md가 코드베이스를 여전히 단일 도메인으로 설명하는 문장이었다. 두 번째 Bounded Context가 생기기 전부터 아무도 손대지 않은 문장이다. "해당 없음"도 하나 있었다. go 스택에는 ORM이 아예 없어서 ORM-autosync 규칙은 적용할 수가 없다. 억지로 끼워 넣지 않고 "해당 없음"이라고 문서에 명시했다.</p>
        <div className="article-note"><strong>수확 곡선이 곧 결론이었다</strong><p>처음 몇 번은 검사를 더할 때마다 위반이 3~4건씩 나왔다. 그다음은 2건, 마지막은 코드 버그 0건에 낡은 문서 2건이었다. 숫자가 줄었다고 뒤의 작업이 헛수고였던 건 아니다. 앞에서 이런 검사로 잡을 수 있는 언어 간 어긋남 중 쉬운 것을 대부분 이미 잡았다는 뜻에 가깝다. 버그를 끝없이 찾는 게 목표가 아니었다. 언제 멈출지 알고 싶었고, 그걸 솔직하게 알려 주는 건 평평해진 수확 곡선뿐이다.</p></div>
        <p>"문서는 끝났다고 했다"는 거짓말이었다기보다 아무도 확인할 수 없는 주장이었다. 회귀를 막아 줄 장치 없이 스스로 적은 보고였고, 구현체 5개 중 어느 하나가 언제든 소리 없이 다시 어긋날 수 있는 코드베이스였다. 이번에 바뀐 건 이름만이 아니다. 이제 "끝났다"는 문서에 적기만 하면 되는 말이 아니게 됐다.</p>
        <div className="article-note"><strong>더 볼 자료</strong><p>
          <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/docs/architecture/repository-pattern.md" target="_blank" rel="noreferrer">docs/architecture/repository-pattern.md</a>(같은 백엔드 설계를 5개 언어로 구현해 둔 내 예제 프로젝트의 네이밍 컨벤션, 그리고 이 규칙을 자동으로 검사하게 된 이유를 적은 메모) · <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/implementations/go/harness/repository_naming.go" target="_blank" rel="noreferrer">repository_naming.go</a>(한 언어의 회귀 방지 장치) · <a href="/posts/compliance-as-code">컴플라이언스를 코드로, 아키텍처 검사기가 잡는 것과 계속 놓치는 것</a>(배치 검사가 계속 놓치는 세 가지 드리프트)
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
