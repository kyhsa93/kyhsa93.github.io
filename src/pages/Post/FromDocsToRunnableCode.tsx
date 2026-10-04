import PostLayout from '../../components/PostLayout';
import { useLocale, localeFromPathname } from '../../lib/locale';
import type { MetaFunction } from 'react-router';
import { createPostMeta } from '../../lib/seo';

export const meta: MetaFunction = ({ location }) =>
  createPostMeta('from-docs-to-runnable-code', localeFromPathname(location.pathname));

const content = {
  en: {
    kicker: 'Tooling · Developer Experience',
    title: (
      <>
        From Docs to<br /><em>Runnable Code in One Command</em>
      </>
    ),
    lede: "A reference implementation in a doc proves a pattern reads well. It doesn't prove anyone can reproduce it under deadline. The real test is whether a brand-new domain, generated from nothing but a name, passes every automated check the first time.",
    body: (
      <>
        <p>This repo's <code>docs/reference.md</code> defines a practical implementation template: a small worked example (historically, an Order domain) showing every layer, every file, every naming convention in one place. A written template is useful right up until someone has to type it all out correctly for the fifth new domain in a row. The next step was turning that template into a generator, a script that takes just a domain name and produces harness-passing code.</p>
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
        <p>What comes out is deliberately a skeleton, not a finished feature: an empty CRUD-style starting point. The business rules, error messages, and domain-specific fields still need to be filled in by hand. What the generator buys isn't "you never write domain logic again." It's "you never have to remember, by hand, all thirty-some small conventions (file naming, layer placement, Repository method names, the Outbox registration call) that a from-scratch domain needs to pass the harness on day one."</p>
        <h2>The Verification That Matters</h2>
        <p>A generator that produces plausible-looking code isn't the same as a generator that produces code passing every rule the harness checks. Confirming that gap is closed means generating a domain nobody's ever used before, one entirely unrelated to the existing example domains, and running the harness against it for real:</p>
        <pre><code>{`go run . Coupon --wire
bash harness.sh <projectRoot>
# → A (100/100)`}</code></pre>
        <p>This was tested against multiple-word and irregular-plural domain names specifically because that's where a naive code generator tends to break first. A pluralization rule based on simple suffix rules (+s, +es, y→ies) handles <code>Coupon</code> → <code>coupons</code> fine but needs manual touch-up for something like a domain whose plural doesn't follow that pattern. Confirming the generator scores 100/100 against domains it was never specifically tuned for is what validates that the docs and the tool agree, not a single successful run against the one example the generator's author had in mind while writing it.</p>
        <h2>The Recurring Bug Class: The Generator Falls Behind the Rules It's Supposed to Satisfy</h2>
        <p>The single most common failure mode across every language's generator, discovered repeatedly across unrelated feature work: a new harness rule gets added (a naming convention, a request-context pattern, an Outbox structural change), the manual example code gets updated to comply, and the generator keeps emitting the old pattern, because nobody re-ran it after the rule changed.</p>
        <p>This happened concretely more than once. When a Repository method-naming rule was introduced (unifying scattered patterns into <code>find&lt;Noun&gt;s</code>/<code>save&lt;Noun&gt;</code>/<code>delete&lt;Noun&gt;</code>), the Go and kotlin-springboot generators were both found, during an unrelated 5-language benchmark run rather than a dedicated audit, to still be emitting the old find-by/bare-save shape, because neither had been touched since that rule shipped. Both were rewritten to the same <code>Find&lt;Domain&gt;/FindOne</code> + <code>Save&lt;Domain&gt;</code> convention the real domains already used. When NestJS's request-scoped user-context store (<code>@Authenticated()</code> + <code>UserContextStore.getRequesterId()</code>) replaced direct <code>req.user</code> access, the NestJS generator's Controller template kept emitting the old <code>req.user</code> pattern and failed the harness the moment a fresh domain was scaffolded. That needed a separate fix from the one applied to the hand-written example, because the two aren't the same artifact. The same thing happened again when the Outbox pattern moved from a single-pass drain to a multi-pass one across all five languages: every generator needed the identical structural fix as the hand-written example, as a second, distinct commit.</p>
        <div className="article-note"><strong>The pattern behind all of these</strong><p>A generator is itself a second implementation of every convention it emits, maintained separately from the code it's copying the shape of. Any process that updates a rule and the example without also asking "does the generator still produce this?" will drift, reliably, every single time, not occasionally.</p></div>
        <h2>A Bug the Generator Itself Introduced</h2>
        <p>Generators aren't just at risk of falling behind rules. They can also carry their own independent defects that the manual example never had, because the templating logic is a separate piece of code with its own bugs. One generator's scaffolded "cancel" handler was found to be missing a mapping for an already-cancelled state, a real gap that would have produced a generic 500 error instead of the correct 400 for every single domain generated with that tool until it was found and fixed. That's not a documentation drift issue at all; it's a bug in the code that writes code, and it only surfaces by generating something and exercising the unhappy path, not by reading the generator's source.</p>
        <h2>Why This Is Worth the Maintenance Cost</h2>
        <p>Every language in this repo ended up with its own version of this tool, each idiomatic to that ecosystem: a Node script for NestJS, a standalone Go module using <code>go run .</code> since Go has no natural place to hang scaffolding scripts off an existing module, a Python script for the two Spring Boot ports (deliberately Python rather than requiring the Java/Gradle toolchain to boot just to scaffold a file), and one for FastAPI. All five follow the identical contract. They take a domain name, optionally a <code>--wire</code> flag to auto-register the new domain instead of just printing the snippet to paste in, and an <code>--out</code> flag to target a different project entirely, which is useful for treating this repo as a template to bootstrap a brand-new service from, not just as a reference to copy by hand.</p>
        <p>The generator earns its keep twice over: once as a productivity tool for scaffolding a new domain, and once as a running regression test for the docs themselves. Every time it's re-run against a name nobody's used before and re-verified against the harness, it's asking "do the documented conventions and the tool that's supposed to embody them still agree with each other." That question turned out to need re-asking more often than expected.</p>
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
        문서에서<br /><em>명령 한 번으로 돌아가는 코드까지</em>
      </>
    ),
    lede: '문서에 실린 참조 구현은 패턴이 읽기 좋다는 것까지만 보여 준다. 마감에 쫓기는 누군가가 그대로 따라 만들 수 있는지는 알려 주지 않는다. 진짜 시험은 이름 하나만 넣어 만든 새 도메인이 첫 실행에서 자동 검사를 전부 통과하느냐다.',
    body: (
      <>
        <p>내 저장소의 <code>docs/reference.md</code>에는 구현 템플릿이 있다. 모든 계층과 파일, 네이밍 컨벤션을 한곳에 모아 보여 주는 작은 예시다(예전에는 Order 도메인이었다). 글로 된 템플릿은 쓸모가 있다. 그런데 새 도메인을 연달아 다섯 번째 만들면서도 그 내용을 손으로 하나하나 틀리지 않게 쳐야 한다면 얘기가 달라진다. 그래서 템플릿을 생성기로 바꿨다. 도메인 이름 하나만 받아서 하네스를 통과하는 코드를 만들어 내는 스크립트다.</p>
        <h2>한 번에 만들어지는 것</h2>
        <p>Go 생성기에 처음 보는 도메인 이름을 넣고 돌리면 한 번에 다음이 만들어진다. <code>PENDING</code>/<code>ACTIVE</code>/<code>CANCELLED</code>를 오가는 상태 필드 하나를 가진 Aggregate, CQRS Command/Query Handler, Domain Event 하나, Repository(domain 인터페이스와 infrastructure 구현체), HTTP Handler와 DTO, migration이다.</p>
        <pre><code>{`# Default: generates under examples/internal/..., doesn't touch main.go/router.go,
# just prints to the console the content you should paste in
go run . Coupon

# With --wire, it also auto-inserts into cmd/server/main.go (repository assembly + registration
# in the shared outbox handler map) and internal/interface/http/router.go (Handler assembly +
# route registration)
go run . Coupon --wire

# To generate into a different project (e.g. one cloned from this repo as a template), specify --out
go run . Coupon --out /path/to/other-project --wire`}</code></pre>
        <p>나오는 건 일부러 완성된 기능이 아닌 뼈대로 만들었다. 비어 있는 CRUD 모양의 출발점이다. 비즈니스 규칙, 에러 메시지, 도메인 고유 필드는 여전히 손으로 채워야 한다. 생성기 덕분에 도메인 로직을 안 짜도 되는 건 아니다. 대신 새 도메인이 첫날부터 하네스를 통과하는 데 필요한 자잘한 컨벤션 30개 남짓(파일 이름, 계층 배치, Repository 메서드 이름, Outbox 등록 호출)을 머릿속에 일일이 담아 둘 필요가 없어진다.</p>
        <h2>정말 중요한 검증</h2>
        <p>그럴듯해 보이는 코드를 내놓는 생성기와 하네스 규칙을 전부 통과하는 코드를 내놓는 생성기는 다르다. 그 차이가 없어졌는지 보려면 한 번도 써 본 적 없는 도메인, 기존 예시 도메인과 전혀 상관없는 도메인을 만들어서 하네스를 직접 돌려 봐야 한다.</p>
        <pre><code>{`go run . Coupon --wire
bash harness.sh <projectRoot>
# → A (100/100)`}</code></pre>
        <p>여러 단어로 된 이름과 불규칙 복수형 이름을 일부러 넣어 본 건, 단순하게 짠 코드 생성기가 가장 먼저 깨지는 곳이 거기라서다. 접미사 규칙(+s, +es, y→ies)만으로 복수형을 만들면 <code>Coupon</code> → <code>coupons</code>는 문제없지만, 이 규칙을 따르지 않는 복수형은 손으로 고쳐 줘야 한다. 생성기를 짠 사람이 염두에 둔 예시 하나로 한 번 성공해 봐야 의미가 없다. 따로 맞춰 준 적 없는 도메인에서도 100/100이 나와야 문서와 도구가 서로 맞는다고 말할 수 있다.</p>
        <h2>되풀이되는 버그, 규칙을 못 따라가는 생성기</h2>
        <p>언어를 가리지 않고 생성기에서 가장 흔했던 실패는 이렇다. 서로 상관없는 기능을 만들 때마다 같은 일이 되풀이됐다. 하네스에 새 규칙이 들어온다. 네이밍 컨벤션일 수도, request-context 패턴일 수도, Outbox 구조 변경일 수도 있다. 손으로 쓴 예시 코드는 규칙에 맞게 고친다. 그런데 생성기는 옛 패턴을 계속 찍어 낸다. 규칙이 바뀐 뒤 아무도 생성기를 다시 돌려 보지 않았기 때문이다.</p>
        <p>이런 일이 한 번으로 끝나지 않았다. Repository 메서드 네이밍 규칙을 도입했을 때다. 흩어져 있던 패턴을 <code>find&lt;Noun&gt;s</code>/<code>save&lt;Noun&gt;</code>/<code>delete&lt;Noun&gt;</code>로 통일했는데, Go와 kotlin-springboot 생성기가 아직도 예전 find-by 형태와 명사 없는 save를 만들고 있다는 걸 알았다. 따로 감사를 한 것도 아니고, 상관없는 5개 언어 벤치마크를 돌리다 발견했다. 규칙이 들어간 뒤로 두 생성기 모두 아무도 손대지 않았던 것이다. 둘 다 실제 도메인이 이미 쓰고 있던 <code>Find&lt;Domain&gt;/FindOne</code> + <code>Save&lt;Domain&gt;</code> 컨벤션으로 다시 짰다.</p>
        <p>NestJS에서 request-scope 기반 user-context 저장소(<code>@Authenticated()</code> + <code>UserContextStore.getRequesterId()</code>)로 <code>req.user</code> 직접 접근을 바꿨을 때도 그랬다. 생성기의 Controller 템플릿은 옛 <code>req.user</code> 패턴을 계속 만들었고, 새 도메인을 스캐폴딩하자마자 하네스에서 떨어졌다. 손으로 쓴 예시를 고친 것과는 따로 고쳐야 했다. 둘은 서로 다른 산출물이기 때문이다. Outbox 드레인을 5개 언어 모두에서 한 번 훑기에서 여러 번 훑기로 바꿨을 때도 똑같았다. 생성기마다 손으로 쓴 예시와 똑같은 구조 수정이 필요했고, 커밋도 따로 하나씩 더 나왔다.</p>
        <div className="article-note"><strong>이 모든 사례에 깔린 패턴</strong><p>생성기는 자기가 찍어 내는 모든 컨벤션의 두 번째 구현체다. 게다가 모양을 베껴 오는 원본 코드와는 따로 관리된다. 규칙과 예시를 고치면서 "생성기도 아직 이걸 만들어 내나?"를 같이 묻지 않으면, 가끔이 아니라 매번 어긋난다.</p></div>
        <h2>생성기가 스스로 만든 버그</h2>
        <p>생성기의 위험은 규칙을 못 따라가는 것만이 아니다. 템플릿 로직은 그 자체로 별도의 코드이고 자기만의 버그가 있을 수 있다. 손으로 쓴 예시에는 없던 결함이 생성기에만 있을 수 있다는 뜻이다. 한 생성기가 만든 "cancel" 핸들러에는 이미 취소된 상태에 대한 매핑이 빠져 있었다. 고치기 전까지 그 도구로 만든 모든 도메인이 400을 내야 할 자리에서 아무 경고 없이 일반 500 에러를 냈을 것이다. 문서가 어긋난 문제가 전혀 아니다. 코드를 짜는 코드에 든 버그이고, 생성기 소스를 읽어서는 안 보인다. 뭔가를 직접 생성해서 실패 경로까지 돌려 봐야 드러난다.</p>
        <h2>관리 비용을 치를 만한 이유</h2>
        <p>결국 저장소의 모든 언어가 저마다 생태계에 맞는 방식으로 이 도구를 하나씩 갖게 됐다. NestJS는 Node 스크립트다. Go는 <code>go run .</code>으로 도는 독립 Go 모듈인데, 기존 모듈에 스캐폴딩 스크립트를 붙일 마땅한 자리가 없어서다. Spring Boot 구현 2개는 Python 스크립트를 쓴다. 파일 하나 만들자고 Java/Gradle 툴체인을 띄우게 하고 싶지 않아서 일부러 Python으로 했다. FastAPI에도 하나 있다.</p>
        <p>5개 모두 쓰는 법이 같다. 도메인 이름을 받고, 선택적으로 <code>--wire</code> 플래그를 주면 붙여 넣을 스니펫을 출력하는 대신 새 도메인을 직접 등록한다. <code>--out</code> 플래그로는 아예 다른 프로젝트에 만들 수 있다. 덕분에 이 저장소는 손으로 베껴 쓰는 참고 자료로도, 새 서비스를 시작하는 템플릿으로도 쓸 수 있다.</p>
        <p>생성기는 두 가지 몫을 한다. 하나는 새 도메인을 스캐폴딩하는 생산성 도구이고, 다른 하나는 문서 자체를 지키는 상시 회귀 테스트다. 써 본 적 없는 이름으로 다시 돌리고 하네스로 다시 검증할 때마다 "문서에 적힌 컨벤션과 그걸 구현해야 할 도구가 아직 서로 맞는가"를 묻게 된다. 생각보다 훨씬 자주 다시 물어야 하는 질문이었다.</p>
        <div className="article-note"><strong>저장소에서 더 볼 자료</strong><p>
          <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/docs/reference.md" target="_blank" rel="noreferrer">docs/reference.md</a>(모든 생성기의 바탕이 되는 참조 구현 템플릿) · <a href="https://github.com/kyhsa93/backend-service-playbook/tree/main/implementations/go/scripts/create-domain" target="_blank" rel="noreferrer">implementations/go/scripts/create-domain</a>(Go 생성기 소스)
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
