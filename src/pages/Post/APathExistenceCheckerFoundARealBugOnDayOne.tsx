import PostLayout from '../../components/PostLayout';
import { useLocale } from '../../lib/locale';
import type { MetaFunction } from 'react-router';
import { createPostMeta } from '../../lib/seo';

export const meta: MetaFunction = () => createPostMeta('a-path-existence-checker-found-a-real-bug-on-day-one');

const content = {
  en: {
    kicker: 'Tooling · Documentation',
    title: (
      <>
        A Path-Existence Checker<br /><em>Found a Real Bug on Day One</em>
      </>
    ),
    lede: "A heuristic script that does nothing but compare backtick-quoted paths in the docs against the real file tree — no parsing, no understanding of what the code inside a snippet actually does — caught a real bug in four Kotlin docs on its first run. The design decisions that kept it from crying wolf ended up mattering more than the check itself.",
    body: (
      <>
        <p>A round of closing doc/code gap issues had just wrapped up, and the next question was where to spend the next block of time: build an automatic doc-drift detector, run a real benchmark, build a third domain, or expand the write-ups. The drift detector won, for a specific reason — every one of those gap issues had been found the same way, by a human or an agent reading a doc and separately reading the code it described and noticing they'd stopped agreeing. That's a repeatable pattern, and repeatable patterns are worth automating even in a cheap, dumb form.</p>
        <h2>Cheap and Dumb, on Purpose</h2>
        <p><code>scripts/check_docs_drift.py</code> checks exactly two things, both pure string matching against the real file tree, with zero understanding of what any code actually does:</p>
        <ul>
          <li><strong>STALE-ABSENCE</strong> — the doc says something doesn't exist yet, and it actually does.</li>
          <li><strong>PHANTOM-PRESENCE</strong> — the doc labels a snippet "actual code" and names a real-looking path, and no such file exists.</li>
        </ul>
        <p>That's the entire detection surface. It doesn't parse the snippet, doesn't diff it against the named file, and has no opinion on whether the code shown is what the file actually contains — only on whether the path named next to it exists. The honest way to describe it is a path-existence checker wearing a code-review costume.</p>
        <h2>The Interesting Part Was All in the Exceptions</h2>
        <p>A checker this literal is mostly a false-positive generator until it's taught what not to flag, and each exclusion came from testing against the docs and finding a specific way the naive version was wrong:</p>
        <ul>
          <li>A code-block header that says "to add," "proposed," or "target shape" is never read as STALE-ABSENCE — in this repository that phrasing overwhelmingly means "add this to a file that already exists," and testing against files that are always present (<code>build.gradle</code>, <code>main.go</code>, <code>application.yml</code>) showed reading it as "doesn't exist" was wrong every single time.</li>
          <li>A qualified reference like <code>pkg.path.TypeName</code> is recognized by capitalization — if the segment after the last dot starts uppercase, it's a type reference, not a file path, and gets skipped.</li>
          <li>Any path or header containing <code>...</code> is skipped outright — an elision, not a real path.</li>
          <li><code>.md</code> cross-references between docs are excluded from the existence check entirely, since a doc-to-doc link is essentially always present and checking it proves nothing.</li>
        </ul>
        <p>None of these are clever. All of them came from a real false positive first, then got written down as a rule.</p>
        <h2>What It Found on Day One</h2>
        <p>Wired into CI to run on every push touching <code>**/*.md</code> or <code>implementations/*/examples/**</code>, the first real run caught something worth catching: four Kotlin docs — <code>config.md</code>, <code>module-pattern.md</code>, <code>observability.md</code>, <code>secret-manager.md</code> — each cited a code block's header as <code>notification/infrastructure/X.kt</code>. The real path was <code>account/infrastructure/notification/X.kt</code> — the domain prefix was missing and the two segments were in the wrong order. Four docs, the same wrong path, fixed in the same commit that shipped the checker.</p>
        <div className="article-note"><strong>What it deliberately doesn't check</strong><p>Prose that describes a gap without a backtick-quoted path — "the app service isn't in compose" written as a sentence, no path — is invisible to it. So is everything inside a snippet: whether the code shown still matches what the named file actually contains is a question this tool has no way to ask. It knows one thing — does the path exist — and answers only that.</p></div>
        <h2>Why the Cheap Version Still Earns Its Keep</h2>
        <p>Most doc drift in a project like this isn't "the logic subtly changed and the doc's explanation is now wrong" — it's "the file moved, or was renamed, and the one line naming it in a doc never got updated." That's a mechanical mistake, and a mechanical check catches it without needing to understand a single line of the code it's checking. The engineering effort here went almost entirely into the four exclusion rules, not the two detection rules — teaching a literal-minded script what to ignore turned out to be the part that decided whether anyone would trust its output.</p>
        <div className="article-note"><strong>Further reading in the repo</strong><p>
          <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/scripts/check_docs_drift.py" target="_blank" rel="noreferrer">scripts/check_docs_drift.py</a> — the full checker, under 250 lines · <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/docs/docs-drift-check.md" target="_blank" rel="noreferrer">docs/docs-drift-check.md</a> — what it checks and what it deliberately doesn't
        </p></div>
      </>
    ),
  },
  ko: {
    kicker: 'Tooling · Documentation',
    title: (
      <>
        경로 존재 여부만 확인하는 스크립트가<br /><em>첫날 실제 버그를 잡았다</em>
      </>
    ),
    lede: '문서의 백틱 인용 경로를 실제 파일 트리와 비교하는 것 말고는 아무것도 하지 않는 휴리스틱 스크립트 — 파싱도, 스니펫 안 코드가 실제로 뭘 하는지에 대한 이해도 전혀 없는 — 가 첫 실행에서 kotlin 문서 4곳의 진짜 버그를 잡았다. 오탐을 막기 위한 설계 결정들이 결국 검사 로직 자체보다 더 중요했다.',
    body: (
      <>
        <p>문서-코드 갭 이슈를 닫는 라운드가 막 끝난 직후, 다음 시간을 어디에 쓸지가 질문이었다: 문서 드리프트 자동 감지 도구를 만들 것인가, 실제 벤치마크를 돌릴 것인가, 세 번째 도메인을 만들 것인가, 글을 더 쓸 것인가. 드리프트 감지 도구가 선택됐다. 이유는 구체적이었다 — 그 갭 이슈들은 전부 같은 방식으로 발견됐다. 사람이든 에이전트든 문서를 읽고, 그것이 설명하는 코드를 따로 읽고, 둘이 더 이상 일치하지 않는다는 걸 알아채는 방식으로. 반복되는 패턴이고, 반복되는 패턴은 값싸고 단순한 형태로라도 자동화할 가치가 있다.</p>
        <h2>의도적으로 값싸고 단순하게</h2>
        <p><code>scripts/check_docs_drift.py</code>는 정확히 두 가지만 확인한다. 둘 다 실제 파일 트리를 상대로 한 순수 문자열 매칭이고, 코드가 실제로 뭘 하는지에 대한 이해는 전혀 없다:</p>
        <ul>
          <li><strong>STALE-ABSENCE</strong> — 문서는 "아직 없다"고 하는데, 실제로는 존재하는 경우.</li>
          <li><strong>PHANTOM-PRESENCE</strong> — 문서가 스니펫을 "실제 코드"라 라벨링하며 그럴듯한 경로를 명시했는데, 그런 파일이 실제로는 없는 경우.</li>
        </ul>
        <p>탐지 범위는 이게 전부다. 스니펫을 파싱하지도, 명시된 파일과 diff를 뜨지도 않고, 보여주는 코드가 그 파일이 실제로 담고 있는 내용과 같은지에 대해서는 아무 의견이 없다 — 오직 옆에 명시된 경로가 존재하는지 아닌지만 본다. 정직하게 표현하면, 코드 리뷰 옷을 입은 경로 존재 여부 검사기다.</p>
        <h2>흥미로운 부분은 전부 예외 규칙 안에 있었다</h2>
        <p>이 정도로 문자 그대로 읽는 검사기는, 무엇을 플래그하지 말아야 하는지 가르치기 전까지는 대부분 오탐 생성기다. 각 예외 규칙은 실제 문서를 상대로 테스트해보다가 소박한 버전이 구체적으로 틀렸던 지점에서 나왔다:</p>
        <ul>
          <li>코드 블록 헤더에 "추가 필요", "제안", "목표 형태" 같은 문구가 있으면 절대 STALE-ABSENCE로 읽지 않는다 — 이 저장소에서 그 표현은 거의 대부분 "이미 존재하는 파일에 이걸 추가하라"는 뜻이고, 항상 존재하는 파일(<code>build.gradle</code>, <code>main.go</code>, <code>application.yml</code>)을 상대로 테스트해보니 "아직 없음"으로 읽는 건 매번 틀렸다.</li>
          <li><code>pkg.path.TypeName</code> 같은 완전한 참조는 대소문자로 구분한다 — 마지막 점 뒤 세그먼트가 대문자로 시작하면 파일 경로가 아니라 타입 참조로 간주해 건너뛴다.</li>
          <li><code>...</code>가 포함된 경로나 헤더는 무조건 건너뛴다 — 생략 표기이지 실제 경로가 아니다.</li>
          <li>문서 간 <code>.md</code> 상호참조는 존재 여부 검사에서 아예 제외한다 — 문서 간 링크는 사실상 항상 존재하므로, 확인해봤자 아무것도 증명하지 못한다.</li>
        </ul>
        <p>그 어느 것도 영리한 아이디어는 아니다. 전부 실제 오탐이 먼저 있었고, 그다음에 규칙으로 적힌 것들이다.</p>
        <h2>첫날 잡아낸 것</h2>
        <p><code>**/*.md</code>나 <code>implementations/*/examples/**</code>를 건드리는 모든 push마다 돌도록 CI에 연결된 뒤, 첫 실제 실행에서 잡을 가치가 있는 걸 잡았다: kotlin 문서 4곳 — <code>config.md</code>, <code>module-pattern.md</code>, <code>observability.md</code>, <code>secret-manager.md</code> — 이 전부 코드 블록 헤더를 <code>notification/infrastructure/X.kt</code>로 인용하고 있었다. 실제 경로는 <code>account/infrastructure/notification/X.kt</code>였다 — 도메인 프리픽스가 빠졌고 두 세그먼트의 순서가 뒤바뀌어 있었다. 문서 4개, 같은 잘못된 경로, 그리고 검사기를 배포한 것과 같은 커밋에서 수정됐다.</p>
        <div className="article-note"><strong>의도적으로 확인하지 않는 것</strong><p>백틱 경로 없이 산문으로만 서술된 갭 — "app 서비스가 compose에 없다"를 경로 없이 문장으로만 적은 경우 — 은 이 도구에 보이지 않는다. 스니펫 내부도 마찬가지다. 보여주는 코드가 명시된 파일이 실제로 담고 있는 내용과 여전히 일치하는지는 이 도구가 물을 방법이 없는 질문이다. 이 도구가 아는 건 딱 하나 — 그 경로가 존재하는가 — 뿐이고, 딱 그것에만 답한다.</p></div>
        <h2>왜 이 값싼 버전이 그래도 제 몫을 하는가</h2>
        <p>이런 프로젝트에서 대부분의 문서 드리프트는 "로직이 미묘하게 바뀌어서 문서의 설명이 이제 틀렸다"가 아니라 "파일이 이동했거나 이름이 바뀌었는데, 그걸 가리키는 문서 속 한 줄이 갱신되지 않았다"는 것이다. 이건 기계적인 실수이고, 기계적인 검사는 검사 대상 코드를 단 한 줄도 이해할 필요 없이 그걸 잡아낸다. 여기서 실제 엔지니어링 노력은 탐지 규칙 두 개가 아니라 예외 규칙 네 개에 거의 전부 들어갔다 — 문자 그대로 읽는 스크립트에게 무엇을 무시해야 하는지 가르치는 것이, 결국 그 결과를 누구든 신뢰할 수 있을지를 결정하는 부분이었다.</p>
        <div className="article-note"><strong>저장소 내 추가 자료</strong><p>
          <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/scripts/check_docs_drift.py" target="_blank" rel="noreferrer">scripts/check_docs_drift.py</a> — 250줄이 채 안 되는 전체 검사기 · <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/docs/docs-drift-check.md" target="_blank" rel="noreferrer">docs/docs-drift-check.md</a> — 이 도구가 확인하는 것과 의도적으로 확인하지 않는 것
        </p></div>
      </>
    ),
  },
};

export default function APathExistenceCheckerFoundARealBugOnDayOne() {
  const { locale } = useLocale();
  const c = content[locale];

  return (
    <PostLayout
      slug="a-path-existence-checker-found-a-real-bug-on-day-one"
      kicker={c.kicker}
      title={c.title}
      lede={c.lede}
    >
      {c.body}
    </PostLayout>
  );
}
