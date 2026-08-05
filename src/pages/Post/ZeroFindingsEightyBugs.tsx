import PostLayout from '../../components/PostLayout';
import { useLocale } from '../../lib/locale';
import type { MetaFunction } from 'react-router';
import { createPostMeta } from '../../lib/seo';

export const meta: MetaFunction = () => createPostMeta('zero-findings-eighty-bugs');

const content = {
  en: {
    kicker: 'Tooling · Architecture',
    title: (
      <>
        Zero Findings,<br /><em>Eighty Bugs</em>
      </>
    ),
    lede: "The docs-drift checker that catches renamed and moved files reported zero findings — the same zero it always reports. A parallel audit across three languages the same week found roughly eighty real ones: stale code quotes, a check that gives itself full marks for scanning nothing, and a domain generator still emitting the exact bug a different round had already fixed in production weeks earlier. None of it was invisible by accident. Each one was invisible for its own specific, honest reason.",
    body: (
      <>
        <p>The docs-drift script is, by design, a path-existence checker wearing a code-review costume — it compares backtick-quoted paths against the real file tree and has no opinion on whether a quoted snippet still matches what the named file contains. It ran across NestJS, Go, and FastAPI both before and after a full audit round on those three languages, and reported the same thing both times: zero findings. In between those two runs, roughly eighty real issues got fixed. The gap between those two numbers isn't a bug in the checker. It's the checker doing exactly what it was built to do, at a scale nobody had tested it against before.</p>
        <h2>Code Quotes Rot Faster Than Version Numbers</h2>
        <p>Every concrete version string in every doc across all three languages — framework versions, base image tags, dependency pins — checked out clean. What had drifted, consistently, in all three, were doc blocks labeled with a real file path and presented as the actual code living there: bootstrap sequences, entity shapes, method signatures, module exports, each lagging the real file by a round or two of feature work. A reader checking "does this doc name a file that exists" — the only question the automated checker can ask — gets no signal at all. A reader who actually diffs the quoted snippet against what the named file contains today finds this constantly. The two questions sound similar. Only one of them was being asked.</p>
        <h2>A Check That Grades Its Own Homework</h2>
        <p>NestJS's <code>dto-validation</code> evaluator matched files named <code>*.dto.ts</code> — a naming pattern that doesn't exist anywhere in this repository's own convention, which spells out request-body and request-querystring DTOs differently. Every run scanned exactly zero files and reported a perfect 25 out of 25, unconditionally, for as long as the rule had existed. Separately, four other evaluators had quietly fallen out of the score-category breakdown entirely — 85 points present in the raw total but absent from any bucket a reader would actually look at. Neither of these shows up by reading the harness's own output; a perfect score doesn't announce which fraction of itself never actually ran.</p>
        <h2>The Generator With the Bug Its Own Codebase Had Already Fixed</h2>
        <p>An earlier round had fixed a real production bug: an event with two subscribers silently dropping one of them, in a specific shape unique to how FastAPI's own consumer dispatched handlers. The domain-scaffolding generator — the tool meant to produce new code in the repository's own house style — had never been told the shape changed. It still emitted the old, pre-fix wiring: a bare handler where the fixed code now expects a list. A domain generated from that template would silently swallow a second subscriber's failures behind a <code>TypeError</code> nobody would see unless they happened to generate a domain with two subscribers and actually run it. The static harness checks structure, not runtime behavior, so it had no way to tell the fixed shape from the broken one — they look identical on the page.</p>
        <h2>All Green, and the App Doesn't Boot</h2>
        <p>NestJS's real entity-registration list was missing one entity the running application actually needed to start. Every end-to-end spec, though, assembled its own hand-picked entity list rather than importing the real one — a shortcut that had been in place long enough that nobody remembered it meant the test suite never once booted the actual composition root. Full build green, full test suite green, harness green. The real application: does not start.</p>
        <div className="article-note"><strong>What all four share</strong><p>None of these were invisible by accident — each had a specific, locatable reason a check that existed didn't see it: a tool built to check one layer (paths) while the bug lived in another (content); an evaluator that can self-report success without ever running against real input; a generator nobody re-runs after fixing the thing it generates; a composition root nothing in the test suite actually assembles. "The checks are green" is a claim about what got checked. It was never a claim about what's true.</p></div>
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
    lede: '이동하거나 이름 바뀐 파일을 잡아내는 문서 드리프트 체커는 0건을 보고했다 — 늘 보고하던 그 0건. 같은 주에 진행된 3개 언어 병렬 감사는 실제 문제 약 80건을 찾아냈다: 낡아버린 코드 인용, 아무것도 스캔하지 않고 스스로에게 만점을 주는 검사, 그리고 다른 라운드가 프로덕션에서 몇 주 전에 이미 고친 바로 그 버그를 여전히 그대로 뱉어내는 도메인 생성기. 그중 무엇도 우연히 안 보였던 게 아니다. 각각은 각자 구체적이고 정직한 이유로 안 보였다.',
    body: (
      <>
        <p>문서 드리프트 스크립트는 설계상 코드 리뷰의 옷을 입은 경로 존재 여부 검사기다 — 백틱 경로를 실제 파일 트리와 비교할 뿐, 인용된 스니펫이 여전히 명시된 파일의 내용과 일치하는지에 대해서는 아무 의견이 없다. 이 스크립트는 nestjs·go·fastapi 세 언어에 대한 전체 감사 라운드 전후로 각각 돌았고, 두 번 다 같은 걸 보고했다: 발견 0건. 그 두 번 사이에 실제 문제 약 80건이 고쳐졌다. 이 두 숫자 사이의 간극은 체커의 버그가 아니다. 체커가 지금껏 아무도 시험해본 적 없는 규모에서, 만들어진 그대로 정확히 동작한 것이다.</p>
        <h2>코드 인용은 버전 번호보다 빨리 썩는다</h2>
        <p>세 언어 모든 문서의 모든 구체적 버전 문자열 — 프레임워크 버전, 베이스 이미지 태그, 의존성 고정 — 은 전부 깨끗했다. 세 언어 모두에서 일관되게 낡아 있던 건, 실제 파일 경로를 명시하고 "실제 코드"라 라벨링된 문서 블록이었다: 부트스트랩 시퀀스, 엔티티 형태, 메서드 시그니처, 모듈 export — 각각 실제 파일보다 기능 개발 한두 라운드씩 뒤처져 있었다. "이 문서가 존재하는 파일을 언급하는가" — 자동화된 체커가 물을 수 있는 유일한 질문 — 를 확인하는 독자는 아무 신호도 얻지 못한다. 인용된 스니펫을 명시된 파일이 지금 담고 있는 내용과 실제로 diff해보는 독자는 이걸 끊임없이 발견한다. 두 질문은 비슷하게 들린다. 실제로 물어지고 있던 건 그중 하나뿐이었다.</p>
        <h2>자기 숙제를 스스로 채점하는 검사</h2>
        <p>nestjs의 <code>dto-validation</code> 평가기는 <code>*.dto.ts</code>라는 파일명 패턴을 매칭했다 — 이 저장소 자신의 컨벤션 어디에도 없는 이름 규칙이었다. 이 저장소는 request-body와 request-querystring DTO를 다른 방식으로 명명한다. 모든 실행이 정확히 파일 0개를 스캔했고, 이 규칙이 존재해온 내내 무조건 25점 만점을 보고했다. 별개로, 다른 평가기 4개가 조용히 점수 카테고리 집계에서 통째로 빠져 있었다 — 원시 총점에는 존재하지만 독자가 실제로 볼 어떤 버킷에도 없는 85점. 둘 중 어느 것도 하네스 자신의 출력을 읽어서는 드러나지 않는다 — 만점은 자기 자신 중 어느 부분이 한 번도 실행된 적 없는지 알려주지 않는다.</p>
        <h2>자기 코드베이스가 이미 고친 버그를 그대로 갖고 있던 생성기</h2>
        <p>이전 라운드가 실제 프로덕션 버그 하나를 고친 적이 있었다: 구독자 둘인 이벤트가 조용히 하나를 떨어뜨리는 문제, fastapi 자신의 consumer가 핸들러를 디스패치하는 방식에만 있던 특정한 형태였다. 도메인 스캐폴딩 생성기 — 저장소 자신의 방식대로 새 코드를 만들어내야 할 도구 — 는 그 형태가 바뀌었다는 걸 한 번도 전달받지 못했다. 여전히 옛날, 수정 전의 배선을 그대로 뱉어내고 있었다: 수정된 코드가 이제 리스트를 기대하는 자리에 맨 핸들러 하나만. 이 템플릿으로 생성된 도메인은, 구독자 둘 있는 도메인을 생성해서 실제로 돌려보지 않는 한 아무도 못 볼 <code>TypeError</code> 뒤에서 두 번째 구독자의 실패를 조용히 삼켰을 것이다. 정적 하네스는 구조를 검사하지 런타임 동작을 검사하지 않으니, 고쳐진 형태와 깨진 형태를 구분할 방법이 없었다 — 페이지 위에서는 똑같아 보인다.</p>
        <h2>전부 초록인데, 앱은 부팅되지 않는다</h2>
        <p>nestjs의 실제 엔티티 등록 목록에는 실행 중인 애플리케이션이 실제로 시작하는 데 필요한 엔티티 하나가 빠져 있었다. 그런데 모든 end-to-end 스펙은 실제 목록을 임포트하는 대신 각자 손으로 고른 엔티티 목록을 조립하고 있었다 — 아무도 이게 테스트 스위트가 실제 조립 루트를 단 한 번도 부팅한 적이 없다는 뜻이라는 걸 기억하지 못할 만큼 오래 그 자리에 있던 지름길이었다. 전체 빌드 초록, 전체 테스트 스위트 초록, 하네스 초록. 실제 애플리케이션은: 시작되지 않는다.</p>
        <div className="article-note"><strong>넷 모두가 공유하는 것</strong><p>이 중 무엇도 우연히 안 보였던 게 아니다 — 각각에는 존재하던 검사가 그걸 못 본 구체적이고 위치를 짚을 수 있는 이유가 있었다: 버그는 다른 레이어(내용)에 있는데 한 레이어(경로)만 검사하도록 만들어진 도구, 실제 입력을 한 번도 상대해보지 않고도 성공을 자체 보고할 수 있는 평가기, 자기가 생성하는 것을 고친 뒤에는 아무도 다시 돌려보지 않는 생성기, 테스트 스위트의 그 무엇도 실제로 조립해보지 않는 조립 루트. "체크가 초록이다"는 무엇이 검사됐는지에 대한 주장이다. 무엇이 참인지에 대한 주장이었던 적은 한 번도 없다.</p></div>
        <div className="article-note"><strong>저장소 내 추가 자료</strong><p>
          <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/scripts/check_docs_drift.py" target="_blank" rel="noreferrer">scripts/check_docs_drift.py</a> — 그 체커, 그리고 정확히 무엇을 묻고 무엇을 묻지 않는지 · <a href="/posts/a-path-existence-checker-found-a-real-bug-on-day-one">경로 존재 여부만 확인하는 스크립트가 첫날 실제 버그를 잡았다</a> — 이 도구의 한계가 처음 적힌 곳
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
