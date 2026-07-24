import PostLayout from '../../components/PostLayout';
import { useLocale } from '../../lib/locale';

const content = {
  en: {
    kicker: 'Tooling · Developer Experience',
    title: (
      <>
        From Docs to<br /><em>Runnable Code in One Command</em>
      </>
    ),
    lede: "A reference implementation in a doc proves a pattern reads well. It doesn't prove anyone can actually reproduce it under deadline. The real test is whether a brand-new domain, generated from nothing but a name, passes every automated check the very first time.",
    body: (
      <>
        <p>This repo's <code>docs/reference.md</code> defines a practical implementation template — a small worked example (historically, an Order domain) showing every layer, every file, every naming convention in one place. A written template is useful right up until someone has to actually type it all out correctly for the fifth new domain in a row. The next step was turning that template into a generator: a script that takes just a domain name and produces real, harness-passing code.</p>
        <h2>What Gets Generated, in One Pass</h2>
        <p>Running the Go generator against a brand-new domain name produces, in one shot, an Aggregate with a single state field cycling through <code>PENDING</code>/<code>ACTIVE</code>/<code>CANCELLED</code>, CQRS Command and Query Handlers, one Domain Event, a Repository (domain interface plus infrastructure implementation), an HTTP Handler and DTOs, and a migration:</p>
        <pre><code>{`# Default: generates under examples/internal/..., doesn't touch main.go/router.go,
# just prints to the console the content you should paste in
go run . Coupon

# With --wire, it also auto-inserts into cmd/server/main.go (repository assembly + registration
# in the shared outbox handler map) and internal/interface/http/router.go (Handler assembly +
# route registration)
go run . Coupon --wire

# To generate into a different project (e.g. one cloned from this repo as a template), specify --out
go run . Coupon --out /path/to/other-project --wire`}</code></pre>
        <p>What comes out is deliberately a skeleton, not a finished feature — an empty CRUD-style starting point. The actual business rules, error messages, and domain-specific fields still need to be filled in by hand. What the generator buys isn't "you never write domain logic again" — it's "you never have to remember, by hand, all thirty-some small conventions (file naming, layer placement, Repository method names, the Outbox registration call) that a from-scratch domain needs to pass the harness on day one."</p>
        <h2>The Verification That Actually Matters</h2>
        <p>A generator that produces plausible-looking code isn't the same as a generator that produces code passing every rule the harness checks. Confirming that gap is closed means generating a domain nobody's ever used before — one entirely unrelated to the existing example domains — and running the harness against it for real:</p>
        <pre><code>{`go run . Coupon --wire
bash harness.sh <projectRoot>
# → A (100/100)`}</code></pre>
        <p>This was tested against multiple-word and irregular-plural domain names specifically because that's where a naive code generator tends to break first — a pluralization rule based on simple suffix rules (+s, +es, y→ies) handles <code>Coupon</code> → <code>coupons</code> fine but needs manual touch-up for something like a domain whose plural doesn't follow that pattern. Confirming the generator scores 100/100 against domains it was never specifically tuned for is what actually validates that the docs and the tool agree — not a single successful run against the one example the generator's author had in mind while writing it.</p>
        <h2>The Recurring Bug Class: The Generator Falls Behind the Rules It's Supposed to Satisfy</h2>
        <p>The single most common failure mode across every language's generator, discovered repeatedly across unrelated feature rounds: a new harness rule gets added — a naming convention, a request-context pattern, an Outbox structural change — the manual example code gets updated to comply, and the generator quietly keeps emitting the old pattern, because nobody re-ran it after the rule changed.</p>
        <p>This happened concretely more than once. When a Repository method-naming rule was introduced (unifying scattered patterns into <code>find&lt;Noun&gt;s</code>/<code>save&lt;Noun&gt;</code>/<code>delete&lt;Noun&gt;</code>), two separate language generators were found — during an unrelated benchmark run, not a dedicated audit — to still be producing the violating shape. When the request-scoped user-context pattern replaced direct request-object access, the generator needed its own follow-up fix, separate from the example code's fix, because the two aren't the same artifact and updating one doesn't touch the other. The same thing happened again when the Outbox pattern moved from a single-pass drain to a multi-pass one across all five languages: every generator needed the identical structural fix as the hand-written example, as a second, distinct commit.</p>
        <div className="article-note"><strong>The pattern behind all of these</strong><p>A generator is itself a second implementation of every convention it emits, maintained separately from the code it's copying the shape of. Any process that updates a rule and the example without also asking "does the generator still produce this?" will drift, reliably, every single time — not occasionally.</p></div>
        <h2>A Bug the Generator Itself Introduced</h2>
        <p>Generators aren't just at risk of falling behind rules — they can also carry their own independent defects that the manual example never had, because the templating logic is a separate piece of code with its own bugs. One generator's scaffolded "cancel" handler was found to be missing a mapping for an already-cancelled state — a real gap that would have silently produced a generic 500 error instead of the correct 400, for every single domain generated with that tool until it was found and fixed. That's not a documentation drift issue at all; it's a bug in the code that writes code, and it only surfaces by actually generating something and exercising the unhappy path, not by reading the generator's source.</p>
        <h2>Why This Is Worth the Maintenance Cost</h2>
        <p>Every language in this repo ended up with its own version of this tool, each idiomatic to that ecosystem — a Node script for NestJS, a standalone Go module using <code>go run .</code> since Go has no natural place to hang scaffolding scripts off an existing module, a Python script for the two Spring Boot ports (deliberately Python rather than requiring the Java/Gradle toolchain to boot just to scaffold a file), and one for FastAPI. All five follow the identical contract: take a domain name, optionally a <code>--wire</code> flag to auto-register the new domain instead of just printing the snippet to paste in, and an <code>--out</code> flag to target a different project entirely — useful for treating this repo as a template to bootstrap a brand-new service from, not just as a reference to copy by hand.</p>
        <p>The generator earns its keep twice over: once as a genuine productivity tool for scaffolding a real new domain, and once as a running regression test for the docs themselves — every time it's re-run against a name nobody's used before and re-verified against the harness, it's really asking "do the documented conventions and the tool that's supposed to embody them still agree with each other." That question turned out to need re-asking more often than expected.</p>
        <div className="article-note"><strong>Further reading in the repo</strong><p>
          <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/docs/reference.md" target="_blank" rel="noreferrer">docs/reference.md</a> — the reference implementation template every generator is built from · <a href="https://github.com/kyhsa93/backend-service-playbook/tree/main/implementations/go/scripts/create-domain" target="_blank" rel="noreferrer">implementations/go/scripts/create-domain</a> — the Go generator's real source
        </p></div>
      </>
    ),
  },
  ko: {
    kicker: 'Tooling · Developer Experience',
    title: (
      <>
        문서에서<br /><em>한 번의 명령으로 실행 가능한 코드로</em>
      </>
    ),
    lede: '문서에 있는 참조 구현은 그 패턴이 읽기 좋다는 것만 증명한다. 마감 기한 안에 누군가가 실제로 그것을 재현할 수 있다는 것까지는 증명하지 못한다. 진짜 테스트는 이름 하나만 가지고 생성한 완전히 새로운 도메인이 첫 실행부터 모든 자동화된 검사를 통과하는가다.',
    body: (
      <>
        <p>이 저장소의 <code>docs/reference.md</code>는 실용적인 구현 템플릿을 정의한다 — 모든 계층, 모든 파일, 모든 네이밍 컨벤션을 한곳에서 보여주는 작은 예시(과거에는 Order 도메인이었다)다. 문서로 작성된 템플릿은 누군가 다섯 번째 신규 도메인을 연달아 직접 정확하게 타이핑해야 하는 순간까지는 유용하다. 다음 단계는 그 템플릿을 생성기(generator)로 바꾸는 것이었다: 도메인 이름 하나만 받아서 실제로 Harness를 통과하는 코드를 만들어내는 스크립트다.</p>
        <h2>한 번에 생성되는 것들</h2>
        <p>완전히 새로운 도메인 이름을 대상으로 생성기를 실행하면, 한 번에 <code>PENDING</code>/<code>ACTIVE</code>/<code>CANCELLED</code>를 순환하는 단일 상태 필드를 가진 Aggregate, Command Bus와 Query Bus에 연결된 CQRS Command/Query Handler, Domain Event 하나, Repository(인터페이스와 구현체), Controller와 DTO, 그리고 이 모든 것을 엮는 Module까지 만들어진다:</p>
        <pre><code>{`# Default: generates under ../examples/src/<domain>/, leaves app-module.ts untouched and
# only prints the import/registration snippet to paste in
node scripts/create-domain.js Coupon

# Passing --wire also auto-inserts the import/registration into app-module.ts
node scripts/create-domain.js Coupon --wire

# To generate into a different project (e.g. one cloned from this repo as a template), specify --out
node scripts/create-domain.js Coupon --out /path/to/other-project/src --wire`}</code></pre>
        <p>생성 결과물은 의도적으로 완성된 기능이 아니라 뼈대(skeleton)다 — 비어 있는 CRUD 형태의 출발점일 뿐이다. 실제 비즈니스 규칙, 에러 메시지, 도메인 고유 필드는 여전히 손으로 채워 넣어야 한다. 생성기가 가져다주는 것은 "다시는 도메인 로직을 작성하지 않아도 된다"가 아니라, "처음부터 만드는 도메인이 첫날부터 Harness를 통과하기 위해 필요한 서른 개 남짓한 자잘한 컨벤션(파일 네이밍, 계층 배치, Repository 메서드 이름, Outbox 등록 호출)을 손으로 일일이 기억하지 않아도 된다"는 것이다.</p>
        <h2>실제로 중요한 검증</h2>
        <p>그럴듯해 보이는 코드를 만드는 생성기와, Harness가 검사하는 모든 규칙을 통과하는 코드를 만드는 생성기는 같지 않다. 그 간극이 실제로 메워졌는지 확인하려면 지금까지 아무도 써본 적 없는 도메인 — 기존 예시 도메인들과 전혀 무관한 도메인 — 을 생성해서 Harness를 실제로 돌려봐야 한다:</p>
        <pre><code>{`go run . Coupon --wire
bash harness.sh <projectRoot>
# → A (100/100)`}</code></pre>
        <p>여러 단어로 이루어진 도메인 이름과 불규칙 복수형 도메인 이름을 대상으로 특별히 테스트한 이유는, 순진하게 짠 코드 생성기가 가장 먼저 깨지는 지점이 바로 거기이기 때문이다 — 단순 접미사 규칙(+s, +es, y→ies)에 기반한 복수화 규칙은 <code>Coupon</code> → <code>coupons</code>는 잘 처리하지만, 그 패턴을 따르지 않는 복수형을 가진 도메인은 수동으로 손봐야 한다. 생성기의 저자가 작성 당시 염두에 두었던 그 하나의 예시에 대해 한 번 성공하는 것이 아니라, 특별히 튜닝된 적 없는 도메인들을 대상으로 100/100을 받는지 확인하는 것이야말로 문서와 도구가 실제로 서로 일치하는지를 검증하는 방법이다.</p>
        <h2>반복되는 버그 유형: 생성기가 자신이 지켜야 할 규칙보다 뒤처지는 것</h2>
        <p>서로 무관한 여러 기능 개발 라운드에서 반복적으로 발견된, 모든 언어의 생성기에 걸쳐 가장 흔한 단일 실패 패턴은 이렇다: 새로운 Harness 규칙이 추가된다 — 네이밍 컨벤션이든, request-context 패턴이든, Outbox 구조 변경이든 — 수동으로 작성된 예시 코드는 그에 맞춰 업데이트되지만, 생성기는 조용히 예전 패턴을 계속 만들어낸다. 규칙이 바뀐 뒤 아무도 생성기를 다시 실행해보지 않았기 때문이다.</p>
        <p>이런 일은 실제로 한 번이 아니라 여러 번 벌어졌다. Repository 메서드 네이밍 규칙이 도입되었을 때(흩어져 있던 패턴들을 <code>find&lt;Noun&gt;s</code>/<code>save&lt;Noun&gt;</code>/<code>delete&lt;Noun&gt;</code>로 통일) — 전용 감사가 아니라 무관한 벤치마크 실행 도중 — 서로 다른 두 언어의 생성기가 여전히 규칙을 위반하는 형태를 만들어내고 있음이 발견됐다. request-scope 기반 user-context 패턴이 요청 객체에 직접 접근하는 방식을 대체했을 때도, 생성기는 예시 코드 수정과는 별개의 후속 수정이 필요했다. 둘은 같은 산출물이 아니어서 하나를 고친다고 다른 하나가 따라 고쳐지지 않기 때문이다. Outbox 패턴이 다섯 언어 전체에서 단일 패스 드레인에서 다중 패스 드레인으로 바뀌었을 때도 똑같은 일이 반복됐다: 모든 생성기가 손으로 작성한 예시와 동일한 구조적 수정을, 별도의 두 번째 커밋으로 필요로 했다.</p>
        <div className="article-note"><strong>이 모든 사례의 공통 패턴</strong><p>생성기는 그 자체로 자신이 만들어내는 모든 컨벤션의 또 하나의 구현체이며, 형태를 베끼는 원본 코드와는 별도로 유지보수된다. 규칙과 예시를 업데이트하면서 "생성기도 여전히 이걸 만들어내는가?"를 함께 묻지 않는 모든 프로세스는, 가끔이 아니라 매번 어김없이 드리프트를 겪게 된다.</p></div>
        <h2>생성기 자체가 만들어낸 버그</h2>
        <p>생성기가 안고 있는 위험은 규칙보다 뒤처지는 것만이 아니다 — 템플릿 로직 자체가 자신만의 버그를 가진 별도의 코드이기 때문에, 손으로 작성한 예시에는 없던 독자적인 결함을 갖고 있을 수도 있다. 한 생성기가 스캐폴딩한 "cancel" 핸들러는 이미 취소된 상태에 대한 매핑이 빠져 있는 것으로 드러났다 — 이는 그 도구로 생성된 모든 도메인에서, 발견되어 고쳐지기 전까지 올바른 400 대신 조용히 일반적인 500 에러를 냈을 실제 결함이다. 이건 문서 드리프트 문제가 전혀 아니다; 코드를 작성하는 코드에 들어 있는 버그이며, 생성기의 소스를 읽어서가 아니라 실제로 뭔가를 생성해서 실패 경로(unhappy path)를 직접 돌려봐야만 드러난다.</p>
        <h2>이 유지보수 비용을 치를 가치가 있는 이유</h2>
        <p>이 저장소의 모든 언어는 결국 각자의 생태계에 맞는 관용적인 방식으로 이 도구의 자체 버전을 갖게 됐다 — NestJS는 Node 스크립트, Go는 <code>go run .</code>을 쓰는 독립된 Go 모듈(Go에는 기존 모듈에 스캐폴딩 스크립트를 자연스럽게 붙일 자리가 없기 때문이다), 두 개의 Spring Boot 포트는 Python 스크립트(파일 하나 스캐폴딩하자고 Java/Gradle 툴체인을 부팅시키게 하는 대신 의도적으로 Python을 선택했다), 그리고 FastAPI용도 하나. 다섯 개 모두 동일한 계약을 따른다: 도메인 이름을 받고, 붙여넣을 스니펫만 출력하는 대신 새 도메인을 자동으로 등록하는 선택적 <code>--wire</code> 플래그, 그리고 완전히 다른 프로젝트를 대상으로 하는 <code>--out</code> 플래그를 지원한다 — 이는 이 저장소를 손으로 베껴 쓸 참조 자료로서만이 아니라, 완전히 새로운 서비스를 부트스트랩하는 템플릿으로 다루는 데도 쓸모가 있다.</p>
        <p>생성기는 자기 몫을 두 번 해낸다: 한 번은 실제 신규 도메인을 스캐폴딩하는 진짜 생산성 도구로서, 또 한 번은 문서 자체에 대한 상시 회귀 테스트로서다 — 아무도 써본 적 없는 이름을 대상으로 다시 실행하고 Harness로 재검증할 때마다, 그것은 실제로 "문서화된 컨벤션과 그것을 구현해야 할 도구가 여전히 서로 일치하는가"를 묻는 것이다. 그 질문은 예상보다 훨씬 더 자주 다시 물어야 하는 것으로 드러났다.</p>
        <div className="article-note"><strong>저장소 내 추가 자료</strong><p>
          <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/docs/reference.md" target="_blank" rel="noreferrer">docs/reference.md</a> — 모든 생성기가 기반으로 삼는 참조 구현 템플릿 · <a href="https://github.com/kyhsa93/backend-service-playbook/tree/main/implementations/go/scripts/create-domain" target="_blank" rel="noreferrer">implementations/go/scripts/create-domain</a> — Go 생성기의 실제 소스
        </p></div>
      </>
    ),
  },
};

export default function FromDocsToRunnableCode() {
  const { locale } = useLocale();
  const c = content[locale];

  return (
    <PostLayout slug="from-docs-to-runnable-code" kicker={c.kicker} title={c.title} lede={c.lede}>
      {c.body}
    </PostLayout>
  );
}
