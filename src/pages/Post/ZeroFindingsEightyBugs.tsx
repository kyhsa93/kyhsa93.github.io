import PostLayout from '../../components/PostLayout';
import { useLocale, localeFromPathname } from '../../lib/locale';
import type { MetaFunction } from 'react-router';
import { createPostMeta } from '../../lib/seo';

export const meta: MetaFunction = ({ location }) =>
  createPostMeta('zero-findings-eighty-bugs', localeFromPathname(location.pathname));

const content = {
  en: {
    kicker: 'Tooling · Architecture',
    title: (
      <>
        Zero Findings,<br /><em>Eighty Bugs</em>
      </>
    ),
    lede: "The docs-drift checker that catches renamed and moved files reported zero findings, the same zero it always reports. A parallel audit across three languages the same week found roughly eighty real ones: stale code quotes, a check that gives itself full marks for scanning nothing, and a domain generator still emitting the bug a different round had already fixed in production weeks earlier. None of it was invisible by accident. Each one was invisible for its own specific, honest reason.",
    body: (
      <>
        <p>The docs-drift script is, by design, a path-existence checker wearing a code-review costume. It compares backtick-quoted paths against the real file tree and has no opinion on whether a quoted snippet still matches what the named file contains. It ran across NestJS, Go, and FastAPI both before and after a full audit round on those three languages, and reported the same thing both times: zero findings. In between those two runs, roughly eighty real issues got fixed. The gap between those two numbers isn't a bug in the checker. It's the checker doing what it was built to do, at a scale nobody had tested it against before.</p>
        <h2>Code Quotes Rot Faster Than Version Numbers</h2>
        <p>Every concrete version string in every doc across all three languages (framework versions, base image tags, dependency pins) checked out clean. What had drifted, consistently, in all three, were doc blocks labeled with a real file path and presented as the actual code living there: bootstrap sequences, entity shapes, method signatures, module exports, each lagging the real file by a round or two of feature work. A reader checking only "does this doc name a file that exists," the one question the automated checker can ask, gets no signal at all. A reader who diffs the quoted snippet against what the named file contains today finds this constantly. The two questions sound similar. Only one of them was being asked.</p>
        <h2>A Check That Grades Its Own Homework</h2>
        <p>NestJS's <code>dto-validation</code> evaluator matched files named <code>*.dto.ts</code>, a naming pattern that doesn't exist anywhere in this repository's own convention, which spells out request-body and request-querystring DTOs differently. Every run scanned zero files and reported a perfect 25 out of 25, unconditionally, for as long as the rule had existed. Separately, four other evaluators had fallen out of the score-category breakdown entirely: 85 points present in the raw total but absent from any bucket a reader would look at. Neither of these shows up by reading the harness's own output; a perfect score doesn't announce which fraction of itself never ran.</p>
        <h2>The Generator With the Bug Its Own Codebase Had Already Fixed</h2>
        <p>An earlier round had fixed a real production bug: an event with two subscribers silently dropping one of them, in a specific shape unique to how FastAPI's own consumer dispatched handlers. The domain-scaffolding generator, the tool meant to produce new code in the repository's own house style, had never been told the shape changed. It still emitted the old, pre-fix wiring: a bare handler where the fixed code now expects a list. A domain generated from that template would swallow a second subscriber's failures behind a <code>TypeError</code> nobody would see unless they happened to generate a domain with two subscribers and run it. The static harness checks structure, not runtime behavior, so it had no way to tell the fixed shape from the broken one; they look identical on the page.</p>
        <h2>All Green, and the App Doesn't Boot</h2>
        <p>NestJS's real entity-registration list was missing one entity the running application needed to start. Every end-to-end spec, though, assembled its own hand-picked entity list rather than importing the real one. It was a shortcut that had been in place long enough that nobody remembered it meant the test suite never once booted the actual composition root. Full build green, full test suite green, harness green. The real application: does not start.</p>
        <div className="article-note"><strong>What all four share</strong><p>None of these were invisible by accident. Each had a specific, locatable reason a check that existed didn't see it: a tool built to check one layer (paths) while the bug lived in another (content); an evaluator that can self-report success without ever running against real input; a generator nobody re-runs after fixing the thing it generates; a composition root nothing in the test suite assembles. "The checks are green" is a claim about what got checked. It was never a claim about what's true.</p></div>
        <div className="article-note"><strong>Further reading in the repo</strong><p>
          <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/scripts/check_docs_drift.py" target="_blank" rel="noreferrer">scripts/check_docs_drift.py</a> — the checker, and exactly what it does and doesn't ask · <a href="/posts/a-path-existence-checker-found-a-real-bug-on-day-one">A Path-Existence Checker Found a Real Bug on Day One</a> — where this tool's stated limits were first written down
        </p></div>
      </>
    ),
  },
  ko: {
    kicker: 'Tooling · Architecture',
    title: (
      <>
        발견 0건,<br /><em>버그 80건</em>
      </>
    ),
    lede: '이름이 바뀌거나 옮겨진 파일을 잡는 문서 드리프트 체커는 이번에도 0건을 보고했다. 늘 보던 그 0건이다. 그런데 같은 주에 3개 언어를 나눠 감사해 보니 실제 문제가 약 80건 나왔다. 낡은 코드 인용이 있었고, 파일을 하나도 보지 않고 만점을 주는 검사가 있었고, 몇 주 전 프로덕션에서 이미 고친 버그를 아직도 찍어 내는 도메인 생성기가 있었다. 어느 것도 운 나쁘게 놓친 게 아니었다. 저마다 안 보일 만한 이유가 분명히 있었다.',
    body: (
      <>
        <p>문서 드리프트 스크립트는 처음부터 경로가 있는지만 보는 검사기로 만들었다. 겉으로는 코드 리뷰처럼 보여도, 하는 일은 백틱으로 감싼 경로를 파일 트리와 맞춰 보는 것뿐이다. 문서에 인용한 코드가 그 파일의 지금 내용과 같은지는 따지지 않는다. 이 스크립트를 NestJS, Go, FastAPI 세 언어 감사 전과 후에 한 번씩 돌렸는데, 결과는 두 번 다 0건이었다.</p>
        <p>그 사이에 고친 문제가 약 80건이다. 체커가 고장 난 건 아니었다. 만든 대로 동작했고, 이 규모로 돌려 본 사람이 없었을 뿐이다.</p>
        <h2>코드 인용은 버전 번호보다 먼저 낡는다</h2>
        <p>세 언어 문서에 적힌 버전 문자열은 하나도 틀리지 않았다. 프레임워크 버전, 베이스 이미지 태그, 의존성 고정 버전까지 전부 맞았다. 낡은 건 다른 쪽이었다. 파일 경로를 달고 "이 파일에 있는 코드"라며 보여 주는 문서 블록이 세 언어 모두에서 똑같이 뒤처져 있었다. 부트스트랩 순서, 엔티티 모양, 메서드 시그니처, 모듈 export가 모두 그랬다. 실제 파일이 기능 작업을 한두 번 더 거치는 동안 문서는 그대로였다.</p>
        <p>자동 체커가 던질 수 있는 질문은 "문서가 말하는 파일이 존재하는가" 하나다. 이 질문으로는 아무것도 걸리지 않는다. 반면 인용한 코드를 그 파일의 지금 내용과 직접 diff해 보면 끝없이 나온다. 두 질문은 비슷하게 들리지만, 그동안 묻고 있던 건 앞의 것뿐이었다.</p>
        <h2>자기 숙제를 스스로 채점하는 검사</h2>
        <p>NestJS의 <code>dto-validation</code> 평가기는 <code>*.dto.ts</code>라는 파일 이름을 찾았다. 그런데 내 저장소 컨벤션에는 그런 이름이 없다. request-body DTO와 request-querystring DTO에는 다른 규칙으로 이름을 붙인다. 그래서 이 규칙은 생긴 뒤로 매번 파일을 0개 검사했고, 매번 25점 만점을 받았다.</p>
        <p>이와 별개로 다른 평가기 4개가 점수 카테고리 집계에서 통째로 빠져 있었다. 총점에는 85점이 들어가 있는데, 독자가 들여다볼 카테고리 어디에도 그 85점이 없었다. 둘 다 하네스 출력만 읽어서는 알 수 없다. 만점이 떠도 그중 얼마가 한 번도 돌지 않았는지는 나오지 않는다.</p>
        <h2>코드에서는 이미 고친 버그를 아직 찍어 내던 생성기</h2>
        <p>그 전에 프로덕션 버그를 하나 고친 적이 있다. 구독자가 둘인 이벤트에서 하나가 에러 없이 빠지는 문제였다. FastAPI의 consumer가 핸들러를 디스패치하는 방식 때문에 FastAPI에서만 생기는 모양이었다. 그런데 도메인 스캐폴딩 생성기에는 이 변화가 반영되지 않았다. 저장소 방식대로 새 코드를 만들어 주라고 둔 도구가 여전히 고치기 전의 배선을 내보내고 있었다. 고친 코드는 리스트를 기대하는데, 생성기는 그 자리에 핸들러 하나만 넣었다.</p>
        <p>이 템플릿으로 만든 도메인에 구독자가 둘이면, 두 번째 구독자의 실패는 <code>TypeError</code> 뒤에 묻힌다. 구독자 둘짜리 도메인을 만들어 직접 돌려 보기 전에는 아무도 모른다. 정적 하네스는 구조만 보고 런타임 동작은 보지 않는다. 고친 모양과 깨진 모양이 코드로는 똑같아 보이니 가려낼 방법이 없었다.</p>
        <h2>전부 초록불인데 앱이 안 뜬다</h2>
        <p>NestJS의 엔티티 등록 목록에는 애플리케이션이 시작하는 데 꼭 필요한 엔티티 하나가 빠져 있었다. 그런데 end-to-end 스펙들은 이 목록을 임포트하지 않고, 저마다 손으로 고른 엔티티 목록을 조립해 썼다. 오래된 지름길이었다. 너무 오래돼서, 그 때문에 테스트가 실제 조립 루트를 한 번도 띄운 적이 없다는 걸 아무도 기억하지 못했다.</p>
        <p>빌드도 초록, 테스트도 초록, 하네스도 초록이었다. 정작 애플리케이션은 뜨지 않았다.</p>
        <div className="article-note"><strong>네 가지의 공통점</strong><p>넷 중 어느 것도 우연히 가려진 게 아니다. 검사가 있었는데도 못 본 이유를 하나하나 짚을 수 있다. 버그는 내용에 있는데 경로만 보도록 만든 도구가 있었고, 진짜 입력을 한 번도 만나지 않고 성공을 보고하는 평가기가 있었다. 생성 대상을 고친 뒤 아무도 다시 돌려 보지 않은 생성기, 테스트 어디에서도 조립하지 않는 조립 루트도 있었다. 초록불은 "이걸 검사했다"는 뜻이지 "이게 맞다"는 뜻이 아니다.</p></div>
        <div className="article-note"><strong>저장소에서 더 볼 것</strong><p>
          <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/scripts/check_docs_drift.py" target="_blank" rel="noreferrer">scripts/check_docs_drift.py</a>(체커 코드. 무엇을 묻고 무엇을 묻지 않는지 그대로 보인다) · <a href="/posts/a-path-existence-checker-found-a-real-bug-on-day-one">경로 존재 여부만 확인하는 스크립트가 첫날 실제 버그를 잡았다</a>(이 도구의 한계를 처음 적어 둔 글)
        </p></div>
      </>
    ),
  },
};

export default function ZeroFindingsEightyBugs() {
  const { locale } = useLocale();
  const c = content[locale];

  return (
    <PostLayout
      slug="zero-findings-eighty-bugs"
      kicker={c.kicker}
      title={c.title}
      lede={c.lede}
    >
      {c.body}
    </PostLayout>
  );
}
