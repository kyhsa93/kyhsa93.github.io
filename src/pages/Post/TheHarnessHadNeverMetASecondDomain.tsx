import PostLayout from '../../components/PostLayout';
import { useLocale } from '../../lib/locale';
import type { MetaFunction } from 'react-router';
import { createPostMeta } from '../../lib/seo';

export const meta: MetaFunction = () => createPostMeta('the-harness-had-never-met-a-second-domain');

const content = {
  en: {
    kicker: 'Tooling · Testing',
    title: (
      <>
        The Harness Had Never<br /><em>Met a Second Domain</em>
      </>
    ),
    lede: "Two rules in the compliance harness had checked out clean for months — but every domain that had ever fed them was Account or Card. Building a third, deliberately unrelated domain and running it through the same harness surfaced two false positives hiding in plain sight, then confirmed the rule that was supposed to catch a real mistake still did.",
    body: (
      <>
        <p>The question was where to take the repository next — a scaffolding template for new projects, the harness pulled out as a standalone tool, write-ups of what the process had turned up, an AI benchmark. All four were worth doing, and all four assumed the same thing underneath them: that the harness itself was actually checking what it claimed to check, on any domain, not just the two it had ever seen. That assumption had never been tested directly, so it went first.</p>
        <h2>Grep Said It Was Fine</h2>
        <p>The obvious first check was searching the harness's own rule implementations for hardcoded <code>account</code>/<code>card</code> strings — and it came back almost clean; the only hits were inside comments giving examples. By that measure, the harness was already domain-agnostic. But "doesn't mention the domain by name" and "works correctly on a domain it's never seen" are different claims, and only one of them can be tested by reading the rule code.</p>
        <h2>So Build a Domain the Rules Have Never Seen</h2>
        <p>The repository already documents its own answer to "how do you add a new domain" — <code>docs/reference.md</code>'s reference implementation template. Following it literally, in a scratch copy, produced a real Order domain: its own CQRS CommandHandler/QueryHandler pair, its own domain event, and — the detail that mattered — its own dedicated OutboxRelay, unrelated to Account or Card in every way except following the same rules. Then the harness ran against it exactly as it would against real code.</p>
        <p>The score moved from 98 to 100, which is a good number in the wrong way to be interesting on its own. What was interesting is that it moved because two rules turned out to be flagging code that was correct.</p>
        <h2>Two Rules, Two Kinds of Blindness</h2>
        <p><code>domain-event-outbox.evaluator.ts</code> collected every domain-event name across the whole application into one set and required each individual <code>*-outbox-relay.ts</code> file to cover the entire set. That's backwards from how the repository actually works — every domain owns a relay that handles only its own events. With one domain in the repository, "the app-wide event set" and "this domain's event set" are the same set, so the rule had never once been wrong. Add a second domain with its own relay, and it starts failing correct code by construction. The rule itself was only a few days old, added in an earlier round when the repository still had exactly one domain to write it against.</p>
        <p>The pagination rule had a plainer bug: it regex-scanned an entire repository file for <code>/data|items|result:/</code> and flagged any hit, anywhere. Order has a legitimate <code>items</code> field — an order's line items, nothing to do with pagination — and the regex couldn't tell the difference. Account and Card simply never happened to have a field with that name, so nothing had ever forced the distinction.</p>
        <div className="article-note"><strong>The same shape, underneath</strong><p>Neither bug is visible from reading either rule in isolation, and neither is a matter of the rule containing wrong logic in any local sense — both only exist once more than one domain is in the picture: a global set that should have been scoped per-domain, and a field name that happened not to collide until something new was built. Grep-auditing for hardcoded domain strings can't find either, because neither rule mentions a domain name anywhere.</p></div>
        <p>Both were filed and fixed the same day, one commit: the event set narrowed to each domain's own directory instead of the whole app, and the generic-key check narrowed to the literal return-type shape a paginated response actually has — <code>Promise&lt;&#123; items: T[]; count: number &#125;&gt;</code> — instead of scanning the whole file. Four regression fixtures went in alongside the fix — a good and a bad case for the multi-domain scoping, a good and a bad case for the field-name collision.</p>
        <h2>Checking That the Fix Didn't Also Remove the Detection</h2>
        <p>Narrowing a rule to stop a false positive is exactly the kind of change that can quietly also stop catching the real thing. The same session had an actual mistake sitting in the repository — three error codes missing from an enum, entirely unrelated to either fix — and the harness's <code>error-handling.error-code.enum-count-mismatch</code> rule caught it both before the narrowing and after. The false positives were gone; the detection wasn't.</p>
        <h2>What the Exercise Actually Tested</h2>
        <p>"How many rules only Account and Card have ever exercised" turned out to be the more useful question than "how many rules mention Account or Card by name" — low string-coupling and correct generic behavior are not the same claim, and only one of them survives contact with a second domain. Both bugs shared a precondition neither static reading nor the grep audit could produce on its own: they only exist once more than one domain coexists in the same codebase. The practice that followed from this is mechanical — a new or changed harness rule now gets run once against a domain deliberately unrelated to whatever prompted it, not just against the two the repository already has, before it's trusted to be generic rather than merely untested.</p>
        <div className="article-note"><strong>Further reading in the repo</strong><p>
          <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/implementations/nestjs/docs/reference.md" target="_blank" rel="noreferrer">implementations/nestjs/docs/reference.md</a> — the new-domain template the Order build followed exactly · <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/implementations/nestjs/harness/evaluators/rules/pagination.evaluator.ts" target="_blank" rel="noreferrer">pagination.evaluator.ts</a> — the fixed generic-key check, scoped to the response type literal
        </p></div>
      </>
    ),
  },
  ko: {
    kicker: 'Tooling · Testing',
    title: (
      <>
        하네스는 두 번째 도메인을<br /><em>만나본 적이 없었다</em>
      </>
    ),
    lede: '컴플라이언스 하네스의 규칙 두 개가 몇 달째 깨끗하게 통과하고 있었다 — 그런데 지금까지 그 규칙들에 입력된 도메인은 전부 Account 아니면 Card뿐이었다. 완전히 무관한 세 번째 도메인을 실제로 만들어 같은 하네스에 돌려보니, 눈앞에 숨어 있던 오탐 두 건이 드러났고, 진짜 실수를 잡아야 할 규칙은 여전히 그걸 잡는다는 것도 함께 확인됐다.',
    body: (
      <>
        <p>이 저장소를 다음에 어떻게 활용할지가 질문이었다 — 새 프로젝트용 스캐폴딩 템플릿, 독립 도구로 뽑아낸 하네스, 그 과정에서 나온 것들을 글로 정리하기, AI 벤치마크. 네 가지 전부 할 만한 가치가 있었고, 네 가지 모두 같은 전제를 깔고 있었다: 하네스 자체가 지금까지 본 두 도메인뿐 아니라 어떤 도메인에서도 자기가 주장하는 대로 실제로 검사하고 있다는 전제. 그 전제는 한 번도 직접 검증된 적이 없었으니, 그것부터 먼저였다.</p>
        <h2>grep으로는 문제없어 보였다</h2>
        <p>가장 당연한 첫 확인은 하네스 자신의 규칙 구현 안에서 <code>account</code>/<code>card</code> 하드코딩 문자열을 검색하는 것이었다 — 결과는 거의 깨끗했다. 걸리는 건 주석 속 예시뿐. 이 기준으로 보면 하네스는 이미 도메인 무관하게 설계돼 있었다. 하지만 "도메인 이름을 명시적으로 언급하지 않는다"와 "한 번도 본 적 없는 도메인에서도 올바르게 동작한다"는 서로 다른 주장이고, 규칙 코드를 읽는 것만으로 검증할 수 있는 건 그중 하나뿐이다.</p>
        <h2>그럼 규칙들이 한 번도 본 적 없는 도메인을 만들어보자</h2>
        <p>이 저장소는 "새 도메인을 어떻게 추가하는가"에 대한 자기 답을 이미 문서화해뒀다 — <code>docs/reference.md</code>의 레퍼런스 구현 템플릿. 그것을 스크래치 복사본에서 그대로 따라했더니 실제 Order 도메인이 나왔다: 자체 CQRS CommandHandler/QueryHandler 쌍, 자체 도메인 이벤트, 그리고 — 중요했던 디테일 — 자체 전용 OutboxRelay까지. Account나 Card와는 같은 규칙을 따른다는 것 말고는 무관했다. 그런 뒤 실제 코드를 대하듯 그대로 하네스를 돌렸다.</p>
        <p>점수는 98에서 100으로 올랐는데, 그 숫자 자체는 흥미로운 방향이 아니다. 흥미로운 건 그게 왜 올랐냐는 것이었다 — 규칙 두 개가 사실은 올바른 코드를 오탐하고 있었기 때문이다.</p>
        <h2>규칙 두 개, 두 가지 종류의 맹점</h2>
        <p><code>domain-event-outbox.evaluator.ts</code>는 애플리케이션 전체의 도메인 이벤트 이름을 하나의 집합으로 모아, 개별 <code>*-outbox-relay.ts</code> 파일 하나하나가 그 전체 집합을 커버해야 한다고 요구했다. 이 저장소가 실제로 동작하는 방식과는 반대다 — 모든 도메인은 자기 자신의 이벤트만 처리하는 relay를 갖는다. 도메인이 하나뿐일 때는 "앱 전체 이벤트 집합"과 "이 도메인의 이벤트 집합"이 같은 집합이라, 이 규칙은 한 번도 틀린 적이 없었다. 자기 relay를 가진 두 번째 도메인을 추가하는 순간, 이 규칙은 구조적으로 올바른 코드를 실패로 판정하기 시작한다. 이 규칙 자체도 만들어진 지 며칠 안 된 것이었다 — 저장소에 도메인이 정확히 하나뿐이던 시점에, 그 하나를 대상으로 작성된 이전 라운드의 산물.</p>
        <p>pagination 규칙의 버그는 더 단순했다: 저장소 파일 전체에 <code>/data|items|result:/</code> 정규식을 통째로 돌려서, 어디서든 걸리면 그대로 플래그했다. Order에는 정당한 <code>items</code> 필드가 있다 — 주문의 품목 목록일 뿐, pagination과는 아무 관계가 없다 — 정규식은 그 둘을 구분하지 못했다. Account와 Card에는 우연히 그런 이름의 필드가 없었을 뿐이라, 지금까지 이 구분이 강제된 적이 없었다.</p>
        <div className="article-note"><strong>바닥에 깔린 건 같은 모양</strong><p>두 버그 모두 각 규칙을 개별적으로 읽는 것만으로는 보이지 않고, 규칙 안에 국지적으로 틀린 로직이 있는 것도 아니다 — 둘 다 도메인이 둘 이상 존재해야만 비로소 존재하는 문제다: 도메인별로 스코프했어야 할 전역 집합, 그리고 새로운 게 만들어지기 전까진 우연히 충돌하지 않았던 필드 이름. 하드코딩된 도메인 문자열을 찾는 grep 감사로는 둘 다 잡을 수 없다 — 어느 규칙도 도메인 이름을 어디에도 언급하지 않기 때문이다.</p></div>
        <p>둘 다 같은 날 등록되고 같은 커밋으로 고쳐졌다: 이벤트 집합은 앱 전체가 아니라 각 도메인 자신의 디렉토리로 좁혔고, generic-key 검사는 파일 전체가 아니라 페이지네이션 응답이 실제로 갖는 반환 타입 리터럴 — <code>Promise&lt;&#123; items: T[]; count: number &#125;&gt;</code> — 내부로 좁혔다. 수정과 함께 회귀 방지 픽스처 4개가 추가됐다 — 멀티도메인 스코핑에 대한 good/bad 케이스, 필드명 충돌에 대한 good/bad 케이스.</p>
        <h2>수정이 탐지력까지 함께 없애지 않았는지 확인하기</h2>
        <p>오탐을 없애려고 규칙을 좁히는 건, 진짜 문제를 잡는 능력까지 조용히 함께 없애버릴 수 있는 종류의 변경이다. 마침 같은 세션에는 실제 실수가 하나 저장소에 남아 있었다 — enum에서 빠진 에러 코드 3개, 이번 두 수정과는 완전히 무관한 것 — 그리고 하네스의 <code>error-handling.error-code.enum-count-mismatch</code> 규칙은 좁히기 전에도, 좁힌 후에도 정확히 그걸 잡아냈다. 오탐은 사라졌고, 탐지력은 사라지지 않았다.</p>
        <h2>이번 검증이 실제로 검증한 것</h2>
        <p>"몇 개의 규칙이 지금까지 Account와 Card로만 실행돼봤는가"가, "몇 개의 규칙이 Account나 Card를 이름으로 언급하는가"보다 훨씬 유용한 질문이었다 — 낮은 문자열 결합도와 올바른 일반적 동작은 서로 다른 주장이고, 그중 하나만이 두 번째 도메인과의 접촉에서 살아남는다. 두 버그 모두 정적 코드 읽기로도, grep 감사로도 스스로 만들어낼 수 없는 전제 조건을 공유했다 — 같은 코드베이스에 도메인이 둘 이상 공존해야만 비로소 존재한다는 것. 여기서 나온 실천은 기계적이다: 새로 만들거나 수정한 하네스 규칙은, 이미 있는 두 도메인만이 아니라 그걸 촉발한 것과 의도적으로 무관한 도메인 하나에도 한 번은 돌려본 뒤에야 — 단순히 테스트되지 않은 게 아니라 진짜로 일반적이라고 신뢰한다.</p>
        <div className="article-note"><strong>저장소 내 추가 자료</strong><p>
          <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/implementations/nestjs/docs/reference.md" target="_blank" rel="noreferrer">implementations/nestjs/docs/reference.md</a> — Order 도메인이 그대로 따른 새 도메인 템플릿 · <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/implementations/nestjs/harness/evaluators/rules/pagination.evaluator.ts" target="_blank" rel="noreferrer">pagination.evaluator.ts</a> — 응답 타입 리터럴로 스코프를 좁힌 수정된 generic-key 검사
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
