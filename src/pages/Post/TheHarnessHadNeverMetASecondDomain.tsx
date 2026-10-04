import PostLayout from '../../components/PostLayout';
import { useLocale, localeFromPathname } from '../../lib/locale';
import type { MetaFunction } from 'react-router';
import { createPostMeta } from '../../lib/seo';

export const meta: MetaFunction = ({ location }) =>
  createPostMeta('the-harness-had-never-met-a-second-domain', localeFromPathname(location.pathname));

const content = {
  en: {
    kicker: 'Tooling · Testing',
    title: (
      <>
        A Rule That Has Only<br /><em>Seen Two Inputs</em>
      </>
    ),
    lede: "A lint rule that has only ever passed on the inputs it was written against hasn't been shown to be generic. It has only been shown to work on those inputs. The way to find out is to build an input it has never seen, on purpose, and run the rule against it.",
    body: (
      <>
        <p>My example project implements the same backend design in five languages side by side, and it comes with an architecture checker, a script that statically checks the code against the documented architecture rules and scores it. Two of its rules had checked out clean for months, and every domain they had ever seen was one of the same two example domains, Account (bank accounts) or Card (payment cards). Whether they would hold on any other domain had never been tested directly. Building a third, deliberately unrelated domain and running the rules against it surfaced two false positives hiding in plain sight. A separate check then confirmed that the rule meant to catch a real mistake still did.</p>
        <h2>Grep Said It Was Fine</h2>
        <p>The obvious first check was searching the checker's own rule implementations for hardcoded <code>account</code>/<code>card</code> strings, and it came back almost clean; the only hits were inside comments giving examples. By that measure, the checker was already domain-agnostic. But "doesn't mention the domain by name" and "works correctly on a domain it's never seen" are different claims, and only one of them can be tested by reading the rule code.</p>
        <h2>So Build a Domain the Rules Have Never Seen</h2>
        <p>The project already documents its own answer to "how do you add a new domain": <code>docs/reference.md</code>'s reference implementation template. Following it literally, in a scratch copy, produced an Order domain with its own CQRS CommandHandler/QueryHandler pair, its own domain event, and (the detail that mattered) its own dedicated OutboxRelay, unrelated to Account or Card in every way except following the same rules. Then the checker ran against it as it would against any other code.</p>
        <p>The score moved from 98 to 100, which is a good number in the wrong way to be interesting on its own. What was interesting is that it moved because two rules turned out to be flagging code that was correct.</p>
        <h2>Two Rules, Two Kinds of Blindness</h2>
        <p>The rule that checks domain events against the Outbox (<code>domain-event-outbox.evaluator.ts</code>) collected every domain-event name across the whole application into one set and required each individual <code>*-outbox-relay.ts</code> file to cover the entire set. That's backwards from how the code is designed: every domain owns a relay that handles only its own events. With one domain in the codebase, "the app-wide event set" and "this domain's event set" are the same set, so the rule had never once been wrong. Add a second domain with its own relay, and it starts failing correct code by construction. The rule itself was only a few days old, written when the codebase still had one domain to write it against.</p>
        <p>The pagination rule had a plainer bug: it regex-scanned an entire Repository file for <code>/data|items|result:/</code> and flagged any hit, anywhere. Order has a legitimate <code>items</code> field (an order's line items, nothing to do with pagination), and the regex couldn't tell the difference. Account and Card simply never happened to have a field with that name, so nothing had ever forced the distinction.</p>
        <div className="article-note"><strong>The same shape, underneath</strong><p>Neither bug is visible from reading either rule in isolation, and neither is a matter of the rule containing wrong logic in any local sense. Both only exist once more than one domain is in the picture: a global set that should have been scoped per-domain, and a field name that happened not to collide until something new was built. Grep-auditing for hardcoded domain strings can't find either, because neither rule mentions a domain name anywhere.</p></div>
        <p>Both were filed and fixed the same day, one commit: the event set narrowed to each domain's own directory instead of the whole app, and the generic-key check narrowed to the literal return-type shape a paginated response has (<code>Promise&lt;&#123; items: T[]; count: number &#125;&gt;</code>) instead of scanning the whole file. Four regression fixtures went in alongside the fix — a good and a bad case for the multi-domain scoping, a good and a bad case for the field-name collision.</p>
        <h2>Checking That the Fix Didn't Also Remove the Detection</h2>
        <p>Narrowing a rule to stop a false positive is the kind of change that can also stop catching the real thing without anyone noticing. The codebase happened to have a real mistake sitting in it at the time (three error codes missing from an enum, entirely unrelated to either fix), and the error-code rule (<code>error-handling.error-code.enum-count-mismatch</code>) caught it both before the narrowing and after. The false positives were gone; the detection wasn't.</p>
        <h2>Untested Is Not the Same as Generic</h2>
        <p>"How many rules only Account and Card have ever exercised" turned out to be the more useful question than "how many rules mention Account or Card by name." Low string-coupling and correct generic behavior are not the same claim, and only one of them survives contact with a second domain. Both bugs shared a precondition neither static reading nor the grep audit could produce on its own: they only exist once more than one domain coexists in the same codebase. The practice that followed from this is mechanical — a new or changed rule now gets run once against a domain deliberately unrelated to whatever prompted it, not just against the two it was written against, before it's trusted to be generic rather than merely untested.</p>
        <div className="article-note"><strong>Further reading</strong><p>
          <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/implementations/nestjs/docs/reference.md" target="_blank" rel="noreferrer">implementations/nestjs/docs/reference.md</a> (the new-domain template the Order build followed exactly, in my example project that implements the same backend design in five languages) · <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/implementations/nestjs/harness/evaluators/rules/pagination.evaluator.ts" target="_blank" rel="noreferrer">pagination.evaluator.ts</a> (the fixed generic-key check, scoped to the response type literal)
        </p></div>
      </>
    ),
  },
  ko: {
    kicker: 'Tooling · Testing',
    title: (
      <>
        두 입력만 본 검사 규칙은<br /><em>범용인지 알 수 없었다</em>
      </>
    ),
    lede: '검사 규칙이 지금까지 받아 본 입력에서 문제를 못 찾았다고 해서 범용이라는 뜻은 아니다. 그 입력에서만 돌아간다는 게 증명됐을 뿐이다. 확인하려면 규칙이 본 적 없는 입력을 일부러 만들어 돌려 보면 된다.',
    body: (
      <>
        <p>내 예제 프로젝트는 같은 백엔드 설계를 5개 언어로 나란히 구현해 둔 것이고, 아키텍처 검사가 붙어 있다. 코드가 문서의 아키텍처 규칙을 따르는지 정적으로 검사해 점수를 매기는 스크립트다. 그중 규칙 2개가 몇 달째 깨끗했는데, 그동안 받아 본 도메인은 늘 예제 도메인 Account(계좌) 아니면 Card(카드)였다. 다른 도메인에서도 버티는지는 한 번도 직접 확인한 적이 없었다. 둘과 상관없는 세 번째 도메인을 일부러 만들어 돌려 보자, 눈앞에 버젓이 있던 오탐 2건이 드러났다. 진짜 실수를 잡아야 하는 규칙이 여전히 그걸 잡는다는 것도 따로 확인했다.</p>
        <h2>grep으로는 문제없어 보였다</h2>
        <p>가장 먼저 떠오르는 확인은 검사 규칙 구현에서 <code>account</code>/<code>card</code> 같은 하드코딩 문자열을 검색하는 것이다. 결과는 거의 깨끗했다. 걸린 건 주석 속 예시뿐이었다. 이 기준으로만 보면 검사는 이미 도메인과 무관했다. 하지만 "도메인 이름을 쓰지 않는다"와 "처음 보는 도메인에서도 제대로 동작한다"는 서로 다른 얘기다. 규칙 코드를 읽어서 확인할 수 있는 건 앞의 것뿐이다.</p>
        <h2>그럼 규칙이 본 적 없는 도메인을 만들자</h2>
        <p>새 도메인을 추가하는 법은 프로젝트에 이미 문서로 있다. <code>docs/reference.md</code>의 레퍼런스 구현 템플릿이다. 스크래치 복사본에서 이 템플릿을 글자 그대로 따라 했더니 제대로 된 Order 도메인이 나왔다. CQRS CommandHandler/QueryHandler 쌍과 도메인 이벤트가 따로 있었고, 전용 OutboxRelay까지 따로 있었다. 나중에 보니 이 OutboxRelay가 중요했다. 같은 규칙을 따른다는 점 말고는 Account나 Card와 아무 관계가 없는 도메인이었다. 그다음 다른 코드에 하듯이 검사를 그대로 돌렸다.</p>
        <p>점수는 98에서 100으로 올랐다. 좋은 숫자이긴 한데, 숫자만 놓고 보면 별 얘깃거리가 없다. 볼 만한 건 오른 이유였다. 규칙 2개가 멀쩡한 코드를 문제로 잡고 있었다.</p>
        <h2>규칙 두 개, 맹점 두 가지</h2>
        <p>도메인 이벤트와 Outbox를 맞춰 보는 규칙(<code>domain-event-outbox.evaluator.ts</code>)은 애플리케이션 전체의 도메인 이벤트 이름을 집합 하나로 모은 다음, <code>*-outbox-relay.ts</code> 파일마다 그 집합 전체를 다 처리하라고 요구했다. 코드가 설계된 방식과 정반대다. 도메인마다 relay를 하나씩 갖고, 각 relay는 자기 도메인 이벤트만 처리한다. 도메인이 하나뿐이면 "앱 전체 이벤트 집합"과 "이 도메인의 이벤트 집합"이 같다. 그래서 이 규칙은 한 번도 틀린 적이 없었다.</p>
        <p>자기 relay를 가진 도메인을 하나 더 넣으면, 이 규칙은 구조상 올바른 코드를 실패로 판정할 수밖에 없다. 이 규칙도 만든 지 며칠 안 된 것이었다. 코드베이스에 도메인이 딱 하나뿐일 때 그 하나를 보고 쓴 규칙이었다.</p>
        <p>pagination 규칙의 버그는 더 단순했다. Repository 파일 전체에 <code>/data|items|result:/</code> 정규식을 돌려서, 어디든 걸리면 그대로 플래그했다. Order에는 <code>items</code> 필드가 있는데, 주문의 품목 목록이라 pagination과는 아무 관계가 없다. 정규식은 이 둘을 구분하지 못했다. Account와 Card에는 마침 그런 이름의 필드가 없었고, 그래서 지금까지 구분할 일이 없었다.</p>
        <div className="article-note"><strong>밑바닥은 같은 모양이다</strong><p>두 버그 모두 규칙 하나만 따로 읽어서는 보이지 않는다. 규칙 안의 로직이 그 자리에서 틀린 것도 아니다. 둘 다 도메인이 둘 이상 있어야 생기는 문제다. 하나는 도메인별로 나눴어야 할 전역 집합이고, 다른 하나는 새 도메인을 만들기 전까지 우연히 겹치지 않았던 필드 이름이다. 하드코딩된 도메인 문자열을 찾는 grep 감사로는 둘 다 못 잡는다. 두 규칙 어디에도 도메인 이름이 나오지 않기 때문이다.</p></div>
        <p>두 건 모두 같은 날 올리고 커밋 하나로 고쳤다. 이벤트 집합은 앱 전체 대신 각 도메인 디렉터리 안으로 좁혔다. generic-key 검사는 파일 전체를 훑는 대신, 페이지네이션 응답이 실제로 갖는 반환 타입 리터럴 <code>Promise&lt;&#123; items: T[]; count: number &#125;&gt;</code> 안만 보게 좁혔다. 회귀를 막는 픽스처 4개도 함께 넣었다. 여러 도메인 스코핑용 good/bad 케이스와 필드 이름 충돌용 good/bad 케이스다.</p>
        <h2>고치면서 탐지력까지 없애지 않았는지</h2>
        <p>오탐을 없애려고 규칙을 좁히다 보면, 진짜 문제를 잡는 능력까지 모르는 사이에 없애기 쉽다. 마침 코드베이스에 실수가 하나 남아 있었다. enum에서 에러 코드 3개가 빠져 있었는데, 이번 두 수정과는 전혀 관계없는 문제였다. 에러 코드 규칙(<code>error-handling.error-code.enum-count-mismatch</code>)은 좁히기 전에도 좁힌 뒤에도 이걸 잡았다. 오탐은 사라졌고 탐지력은 그대로였다.</p>
        <h2>시험받지 않은 것과 범용인 것</h2>
        <p>"Account나 Card를 이름으로 언급하는 규칙이 몇 개인가"보다 "Account와 Card로만 돌려 본 규칙이 몇 개인가"가 훨씬 쓸모 있는 질문이었다. 문자열 결합도가 낮은 것과 범용으로 제대로 동작하는 건 서로 다른 얘기다. 두 번째 도메인을 만나고도 살아남는 건 그중 하나뿐이다. 두 버그는 같은 전제 조건이 있어야 생겼다. 같은 코드베이스에 도메인이 둘 이상 함께 있어야 한다. 이 조건은 코드를 정적으로 읽어서도, grep 감사로도 만들어 낼 수 없다.</p>
        <p>그 뒤로 생긴 습관은 기계적이다. 검사 규칙을 새로 만들거나 고치면, 규칙을 짤 때 본 두 도메인뿐 아니라 그 규칙을 만든 계기와 일부러 상관없는 도메인 하나에도 한 번 돌려 본다. 그래야 그 규칙이 아직 시험받지 않았을 뿐인지, 정말 범용인지 믿을 수 있다.</p>
        <div className="article-note"><strong>더 볼 자료</strong><p>
          <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/implementations/nestjs/docs/reference.md" target="_blank" rel="noreferrer">implementations/nestjs/docs/reference.md</a>(같은 백엔드 설계를 5개 언어로 구현해 둔 내 예제 프로젝트에서, Order 도메인을 만들 때 그대로 따른 새 도메인 템플릿) · <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/implementations/nestjs/harness/evaluators/rules/pagination.evaluator.ts" target="_blank" rel="noreferrer">pagination.evaluator.ts</a>(응답 타입 리터럴 안만 보도록 좁힌 generic-key 검사)
        </p></div>
      </>
    ),
  },
};

export default function TheHarnessHadNeverMetASecondDomain() {
  const { locale } = useLocale();
  const c = content[locale];

  return (
    <PostLayout
      slug="the-harness-had-never-met-a-second-domain"
      kicker={c.kicker}
      title={c.title}
      lede={c.lede}
    >
      {c.body}
    </PostLayout>
  );
}
