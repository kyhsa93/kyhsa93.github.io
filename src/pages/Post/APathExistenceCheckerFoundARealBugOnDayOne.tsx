import PostLayout from '../../components/PostLayout';
import { useLocale, localeFromPathname } from '../../lib/locale';
import type { MetaFunction } from 'react-router';
import { createPostMeta } from '../../lib/seo';

export const meta: MetaFunction = ({ location }) =>
  createPostMeta('a-path-existence-checker-found-a-real-bug-on-day-one', localeFromPathname(location.pathname));

const content = {
  en: {
    kicker: 'Tooling · Documentation',
    title: (
      <>
        A Path-Existence Checker<br /><em>Found a Real Bug on Day One</em>
      </>
    ),
    lede: "A heuristic script that does nothing but compare backtick-quoted paths in the docs against the real file tree (no parsing, no understanding of what the code inside a snippet does) caught a real bug in four Kotlin docs on its first run. The design decisions that kept it from crying wolf ended up mattering more than the check itself.",
    body: (
      <>
        <p>A round of closing doc/code gap issues had just wrapped up, and the next question was where to spend the next block of time: build an automatic doc-drift detector, run a benchmark, build a third domain, or expand the write-ups. The drift detector won, for a specific reason. Every one of those gap issues had been found the same way, by a human or an agent reading a doc and separately reading the code it described and noticing they'd stopped agreeing. That's a repeatable pattern, and repeatable patterns are worth automating even in a cheap, dumb form.</p>
        <h2>Cheap and Dumb, on Purpose</h2>
        <p><code>scripts/check_docs_drift.py</code> checks two things, both pure string matching against the file tree, with zero understanding of what any code does:</p>
        <ul>
          <li><strong>STALE-ABSENCE</strong> — the doc says something doesn't exist yet, and it actually does.</li>
          <li><strong>PHANTOM-PRESENCE</strong> — the doc labels a snippet "actual code" and names a real-looking path, and no such file exists.</li>
        </ul>
        <p>That's the entire detection surface. It doesn't parse the snippet, doesn't diff it against the named file, and has no opinion on whether the code shown is what the file contains. It only checks whether the path named next to it exists. The honest way to describe it is a path-existence checker wearing a code-review costume.</p>
        <h2>The Interesting Part Was All in the Exceptions</h2>
        <p>A checker this literal is mostly a false-positive generator until it's taught what not to flag, and each exclusion came from testing against the docs and finding a specific way the naive version was wrong:</p>
        <ul>
          <li>A code-block header that says "to add," "proposed," or "target shape" is never read as STALE-ABSENCE. In this repository that phrasing overwhelmingly means "add this to a file that already exists," and testing against files that are always present (<code>build.gradle</code>, <code>main.go</code>, <code>application.yml</code>) showed reading it as "doesn't exist" was wrong every single time.</li>
          <li>A qualified reference like <code>pkg.path.TypeName</code> is recognized by capitalization. If the segment after the last dot starts uppercase, it's a type reference, not a file path, and gets skipped.</li>
          <li>Any path or header containing <code>...</code> is skipped outright, since it's an elision, not a path.</li>
          <li><code>.md</code> cross-references between docs are excluded from the existence check entirely, since a doc-to-doc link is essentially always present and checking it proves nothing.</li>
        </ul>
        <p>None of these are clever. All of them came from a false positive first, then got written down as a rule.</p>
        <h2>What It Found on Day One</h2>
        <p>Wired into CI to run on every push touching <code>**/*.md</code> or <code>implementations/*/examples/**</code>, the first run caught something worth catching. Four Kotlin docs (<code>config.md</code>, <code>module-pattern.md</code>, <code>observability.md</code>, <code>secret-manager.md</code>) each cited a code block's header as <code>notification/infrastructure/X.kt</code>. The real path was <code>account/infrastructure/notification/X.kt</code>: the domain prefix was missing and the two segments were in the wrong order. Four docs, the same wrong path, fixed in the same commit that shipped the checker.</p>
        <div className="article-note"><strong>What it deliberately doesn't check</strong><p>Prose that describes a gap without a backtick-quoted path ("the app service isn't in compose" written as a sentence, no path) is invisible to it. So is everything inside a snippet: whether the code shown still matches what the named file contains is a question this tool has no way to ask. It knows one thing, whether the path exists, and answers only that.</p></div>
        <h2>Why the Cheap Version Still Earns Its Keep</h2>
        <p>Most doc drift in a project like this isn't "the logic subtly changed and the doc's explanation is now wrong." It's "the file moved, or was renamed, and the one line naming it in a doc never got updated." That's a mechanical mistake, and a mechanical check catches it without needing to understand a single line of the code it's checking. The engineering effort here went almost entirely into the four exclusion rules, not the two detection rules. Teaching a literal-minded script what to ignore turned out to be the part that decided whether anyone would trust its output.</p>
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
    lede: '문서에 백틱으로 적힌 경로를 실제 파일 트리와 대조하는 일만 하는 휴리스틱 스크립트가 있다. 파싱도 하지 않고, 스니펫 안 코드가 무슨 일을 하는지도 모른다. 그런데 첫 실행에서 kotlin 문서 4곳의 버그를 잡았다. 돌아보면 검사 로직보다 오탐을 막으려고 내린 설계 결정이 더 중요했다.',
    body: (
      <>
        <p>문서와 코드가 어긋난 이슈를 한꺼번에 닫고 난 참이었다. 다음에 무엇에 시간을 쓸지 고민했다. 문서 드리프트를 자동으로 잡는 도구를 만들지, 벤치마크를 제대로 돌려 볼지, 세 번째 도메인을 만들지, 글을 더 쓸지. 고른 건 드리프트 감지 도구였고, 이유가 분명했다. 닫은 이슈들이 모두 같은 식으로 발견됐기 때문이다. 사람이든 에이전트든 문서를 읽고, 그 문서가 설명하는 코드를 따로 읽다가, 둘이 더는 맞지 않는다는 걸 알아챘다. 매번 같은 방식이라면 싸고 단순하게라도 자동화할 만하다.</p>
        <h2>일부러 싸고 단순하게</h2>
        <p><code>scripts/check_docs_drift.py</code>가 확인하는 건 두 가지뿐이다. 둘 다 실제 파일 트리를 상대로 문자열만 맞춰 보고, 코드가 무슨 일을 하는지는 전혀 모른다.</p>
        <ul>
          <li><strong>STALE-ABSENCE</strong>는 문서에는 "아직 없다"고 적혀 있는데 파일이 이미 있는 경우다.</li>
          <li><strong>PHANTOM-PRESENCE</strong>는 문서가 스니펫에 "실제 코드"라고 붙이고 그럴듯한 경로까지 적었는데, 그런 파일이 없는 경우다.</li>
        </ul>
        <p>잡아내는 범위는 이게 전부다. 스니펫을 파싱하지도 않고, 적힌 파일과 diff를 떠 보지도 않는다. 보여 준 코드가 그 파일 내용과 같은지도 따지지 않는다. 옆에 적힌 경로가 있는지 없는지만 본다. 솔직히 말하면 코드 리뷰 흉내를 내는 경로 존재 검사기다.</p>
        <h2>재미있는 부분은 예외 규칙에 다 있었다</h2>
        <p>이렇게 글자 그대로 읽는 검사기는 무엇을 걸러 내지 말아야 하는지 가르치기 전까지는 거의 오탐 생성기다. 예외 규칙은 하나같이 실제 문서에 돌려 보다가 단순한 버전이 틀린 지점에서 나왔다.</p>
        <ul>
          <li>코드 블록 헤더에 "추가 필요", "제안", "목표 형태" 같은 말이 있으면 STALE-ABSENCE로 읽지 않는다. 이 저장소에서 그런 표현은 거의 언제나 "이미 있는 파일에 이걸 추가한다"는 뜻이다. 늘 있는 파일(<code>build.gradle</code>, <code>main.go</code>, <code>application.yml</code>)로 시험해 보니 "아직 없음"으로 읽으면 매번 틀렸다.</li>
          <li><code>pkg.path.TypeName</code> 같은 전체 이름 참조는 대소문자로 가려낸다. 마지막 점 뒤가 대문자로 시작하면 파일 경로가 아닌 타입 참조로 보고 건너뛴다.</li>
          <li><code>...</code>가 들어간 경로나 헤더는 무조건 건너뛴다. 생략 표시일 뿐 경로가 아니다.</li>
          <li>문서끼리 걸어 둔 <code>.md</code> 참조는 존재 검사에서 아예 뺀다. 문서 간 링크는 거의 언제나 살아 있어서 확인해 봐야 증명되는 게 없다.</li>
        </ul>
        <p>영리한 규칙은 하나도 없다. 전부 실제로 오탐이 난 뒤에야 규칙으로 적었다.</p>
        <h2>첫날 잡은 것</h2>
        <p><code>**/*.md</code>나 <code>implementations/*/examples/**</code>를 건드리는 푸시마다 돌도록 CI에 붙였다. 처음 제대로 돌린 날 잡을 만한 걸 잡았다. kotlin 문서 4개(<code>config.md</code>, <code>module-pattern.md</code>, <code>observability.md</code>, <code>secret-manager.md</code>)가 모두 코드 블록 헤더에 <code>notification/infrastructure/X.kt</code>라고 적고 있었다. 실제 경로는 <code>account/infrastructure/notification/X.kt</code>였다. 도메인 접두어가 빠졌고 두 세그먼트의 순서도 뒤집혀 있었다. 문서 4개에 같은 잘못된 경로가 있었고, 검사기를 넣은 커밋에서 함께 고쳤다.</p>
        <div className="article-note"><strong>일부러 확인하지 않는 것</strong><p>백틱 경로 없이 문장으로만 적은 어긋남은 이 도구 눈에 보이지 않는다. "app 서비스가 compose에 없다"를 경로 없이 문장으로 쓴 경우가 그렇다. 스니펫 안쪽도 마찬가지다. 보여 준 코드가 적힌 파일 내용과 아직 같은지는 이 도구로는 물어볼 방법이 없다. 이 도구가 아는 건 경로가 있느냐 하나뿐이고, 거기에만 답한다.</p></div>
        <h2>싼 버전이 그래도 밥값을 하는 이유</h2>
        <p>이런 프로젝트에서 문서가 어긋나는 건 대개 로직이 미묘하게 바뀌어 설명이 틀어져서가 아니다. 파일을 옮기거나 이름을 바꿨는데, 문서에서 그 파일을 가리키던 한 줄을 고치지 않아서다. 기계적인 실수이고, 기계적인 검사라면 대상 코드를 한 줄도 이해하지 않고 잡아낼 수 있다. 공은 탐지 규칙 2개보다 예외 규칙 4개에 거의 다 들어갔다. 글자 그대로 읽는 스크립트에게 무엇을 무시할지 가르치는 일이, 결과를 믿고 쓸 수 있느냐를 갈랐다.</p>
        <div className="article-note"><strong>저장소에서 더 볼 자료</strong><p>
          <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/scripts/check_docs_drift.py" target="_blank" rel="noreferrer">scripts/check_docs_drift.py</a>(250줄이 안 되는 검사기 전체) · <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/docs/docs-drift-check.md" target="_blank" rel="noreferrer">docs/docs-drift-check.md</a>(이 도구가 확인하는 것과 일부러 확인하지 않는 것)
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
