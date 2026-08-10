import PostLayout from '../../components/PostLayout';
import { useLocale, localeFromPathname } from '../../lib/locale';
import type { MetaFunction } from 'react-router';
import { createPostMeta } from '../../lib/seo';

export const meta: MetaFunction = ({ location }) =>
  createPostMeta('a-benchmark-that-can-never-hit-100', localeFromPathname(location.pathname));

const content = {
  en: {
    kicker: 'Kubernetes · Benchmark',
    title: (
      <>
        A Benchmark<br /><em>That Can Never Hit 100</em>
      </>
    ),
    lede: "A scoring harness covers nineteen categories of Kubernetes deployment mistake. Eighteen of them can be checked against a manifest an AI agent writes. The nineteenth can't — not yet, not ever, no matter how the benchmark grows — and the honest response was to say so permanently, not to leave it as a TODO.",
    body: (
      <>
        <p>Reusing an anti-pattern checker as a benchmark for how well an AI agent authors Kubernetes manifests is a natural idea: the checker already exists, already scores objectively, already covers a documented catalog of real mistakes. Point the checker at whatever an agent produces, and the pass count becomes a number worth tracking across models, prompts, or catalog revisions. Nine of the catalog's categories scored cleanly this way from the start. Getting to eighteen took three more rounds of extending what the benchmark's submission format could accept — a promotion pipeline file, an app-registration file, a whole config directory instead of a single manifest. One category never joined the other eighteen, and it isn't going to.</p>
        <h2>What the Nineteenth Category Actually Measures</h2>
        <p>Most of the catalog checks something present in what an agent writes: does the Deployment have resource limits, does the Ingress have TLS, does the HorizontalPodAutoscaler have a sane range. The one holdout — drift, the gap between what Git declares and what's actually running on a cluster — measures something categorically different: a divergence that can only exist after a manifest has already been authored, already applied, and something (a person running <code>kubectl edit</code>, an operator reconciling a different intent, anyone changing the live state out-of-band) has since changed the cluster without updating Git to match.</p>
        <p>An authoring benchmark scores what an agent writes. It has no mechanism to introduce drift, because drift isn't a property of a YAML file — it's a property of the relationship between a YAML file and a cluster's state hours, days, or months later, shaped by events the authoring step has no way to cause or prevent. Asking an agent's manifest to demonstrate "no drift" is asking it to prove a fact about a future it doesn't control.</p>
        <div className="article-note"><strong>Why this isn't a version-4 problem</strong><p>Every other gap in the benchmark's coverage was closed by extending the submission shape — accept a second file, accept a third file, accept a directory instead of a file. Drift can't be closed that way because no submission shape changes what the category actually measures. It would need the benchmark to stop being an authoring benchmark and become something that watches a cluster over time — a genuinely different kind of tool, not a bigger version of this one.</p></div>
        <h2>Two Different Kinds of Missing</h2>
        <p>A checklist with an item nobody's gotten to yet and a checklist with an item that structurally cannot apply look identical if you only read the score: <code>18/19</code> either way. They call for opposite responses. The first is a backlog entry — schedule the work, and the number climbs to 19 eventually. The second is a fact about the tool's shape, and treating it as a backlog entry invites exactly the wrong instinct: someone eventually tries to make the number hit 19 anyway, which usually means fabricating a proxy signal for something the artifact under test genuinely cannot demonstrate.</p>
        <p>The honest fix wasn't a fix at all — it was a documented, permanent exclusion. The scoreable ceiling for this benchmark is stated as 18 out of 19, not 19 out of 19, in the same doc that defines the scoring itself. Not a caveat buried in a footnote; the number the benchmark reports is defined, from the start, to never include the category that can't apply.</p>
        <h2>The General Principle</h2>
        <p>Any scorer, checklist, or benchmark that aggregates multiple checks into one number needs to distinguish two different reasons a check might be missing: <em>not implemented yet</em>, which is a plan, and <em>cannot be measured by this kind of artifact</em>, which is a permanent property of what's being scored. Conflating them either wastes effort chasing a ceiling that was never reachable, or — worse — creates pressure to fake the missing signal well enough to claim the full score. A benchmark that states its own ceiling honestly, in the same place it reports results, removes that pressure before it starts.</p>
        <div className="article-note"><strong>Further reading</strong><p>
          <a href="https://github.com/kyhsa93/k8s-playbook/blob/main/docs/benchmark.md" target="_blank" rel="noreferrer">docs/benchmark.md</a> — the full scoring definition, including the drift-exclusion rationale stated alongside the score itself
        </p></div>
      </>
    ),
  },
  ko: {
    kicker: 'Kubernetes · Benchmark',
    title: (
      <>
        영원히 100점을<br /><em>받을 수 없는 벤치마크</em>
      </>
    ),
    lede: '한 채점 하네스가 Kubernetes 배포 실수 19개 카테고리를 다룬다. 그중 18개는 AI 에이전트가 작성한 매니페스트로 확인할 수 있다. 19번째는 안 된다 — 아직도 아니고, 벤치마크가 아무리 커져도 앞으로도 아니다. 그리고 정직한 대응은 그걸 TODO로 남기는 게 아니라 영구히 그렇다고 명시하는 것이었다.',
    body: (
      <>
        <p>안티패턴 검사기를 AI 에이전트가 Kubernetes 매니페스트를 얼마나 잘 작성하는지 재는 벤치마크로 재사용하는 건 자연스러운 발상이다: 검사기는 이미 존재하고, 이미 객관적으로 채점하고, 이미 문서화된 실제 실수 카탈로그를 다룬다. 에이전트가 만든 걸 검사기에 겨누기만 하면, 통과 개수는 모델·프롬프트·카탈로그 개정에 걸쳐 추적할 가치가 있는 숫자가 된다. 카탈로그 중 9개 카테고리는 처음부터 이 방식으로 깔끔하게 채점됐다. 18개까지 가는 데는 벤치마크의 제출 형식이 받아들일 수 있는 것을 세 라운드 더 확장해야 했다 — 프로모션 파이프라인 파일, 앱 등록 파일, 매니페스트 하나 대신 설정 디렉토리 전체. 한 카테고리는 나머지 18개와 합류한 적이 없고, 앞으로도 안 될 것이다.</p>
        <h2>19번째 카테고리가 실제로 재는 것</h2>
        <p>카탈로그 대부분은 에이전트가 쓴 것 안에 있는 무언가를 확인한다: Deployment에 리소스 제한이 있는지, Ingress에 TLS가 있는지, HorizontalPodAutoscaler의 범위가 합리적인지. 유일하게 남은 하나 — drift, Git이 선언한 것과 클러스터에서 실제로 돌아가는 것 사이의 간극 — 는 범주적으로 다른 걸 잰다: 매니페스트가 이미 작성되고, 이미 적용되고, 그 이후 뭔가(사람이 <code>kubectl edit</code>을 실행했거나, 다른 의도로 리컨사일하는 오퍼레이터거나, 누구든 대역 밖에서 라이브 상태를 바꾼 것)가 Git을 맞춰 갱신하지 않은 채 클러스터를 바꿔놓은 뒤에야 존재할 수 있는 발산이다.</p>
        <p>작성 벤치마크는 에이전트가 쓰는 것을 채점한다. drift를 일으킬 메커니즘 자체가 없다. drift는 YAML 파일의 속성이 아니라, YAML 파일과 몇 시간, 며칠, 몇 달 뒤 클러스터 상태 사이의 관계의 속성이고, 작성 단계가 일으키거나 막을 방법이 전혀 없는 사건들에 의해 결정되기 때문이다. 에이전트의 매니페스트에게 "drift 없음"을 증명하라는 건, 그 에이전트가 통제하지 못하는 미래에 대한 사실을 증명하라는 것과 같다.</p>
        <div className="article-note"><strong>왜 이건 v4의 문제가 아닌가</strong><p>벤치마크 커버리지의 다른 모든 공백은 제출 형식을 확장해서 닫혔다 — 두 번째 파일 받기, 세 번째 파일 받기, 파일 대신 디렉토리 받기. drift는 그 방식으로 닫을 수 없다. 어떤 제출 형식을 바꿔도 이 카테고리가 실제로 재는 것 자체는 바뀌지 않기 때문이다. 이걸 닫으려면 벤치마크가 작성 벤치마크이기를 멈추고 시간에 걸쳐 클러스터를 지켜보는 무언가가 되어야 한다 — 이 도구의 더 큰 버전이 아니라 진짜로 다른 종류의 도구다.</p></div>
        <h2>두 가지 서로 다른 "없음"</h2>
        <p>아직 아무도 손대지 않은 항목이 있는 체크리스트와, 구조적으로 적용될 수 없는 항목이 있는 체크리스트는 점수만 읽으면 똑같아 보인다: 어느 쪽이든 <code>18/19</code>. 그런데 둘은 정반대의 대응을 요구한다. 첫 번째는 백로그 항목이다 — 작업을 일정에 넣으면 언젠가 숫자가 19로 올라간다. 두 번째는 도구의 형태에 대한 사실이고, 이걸 백로그 항목으로 취급하면 정확히 잘못된 본능을 부른다: 결국 누군가는 그래도 숫자를 19로 만들려 시도하게 되고, 그건 대개 검사 대상 산출물이 진짜로 증명할 수 없는 것에 대한 가짜 대리 신호를 만들어낸다는 뜻이다.</p>
        <p>정직한 해결책은 사실 해결책이 아니었다 — 문서화된, 영구적인 제외였다. 이 벤치마크의 채점 가능한 상한선은 19분의 19가 아니라 19분의 18로, 채점 자체를 정의하는 바로 그 문서에 명시돼 있다. 각주에 파묻힌 캐비어트가 아니라, 벤치마크가 보고하는 숫자 자체가 처음부터 적용될 수 없는 카테고리를 절대 포함하지 않도록 정의돼 있다.</p>
        <h2>일반 원칙</h2>
        <p>여러 검사를 하나의 숫자로 집계하는 어떤 채점기·체크리스트·벤치마크든, 검사 하나가 빠진 이유가 두 가지 중 무엇인지 구분해야 한다: <em>아직 구현 안 됨</em>은 계획이고, <em>이 종류의 산출물로는 측정할 수 없음</em>은 채점 대상의 영구적인 속성이다. 이 둘을 뒤섞으면 애초에 도달할 수 없었던 상한선을 좇느라 노력을 낭비하거나 — 더 나쁘게는 — 빠진 신호를 그럴듯하게 조작해서라도 만점을 주장하고 싶은 압력을 만들어낸다. 결과를 보고하는 바로 그 자리에서 자기 자신의 상한선을 정직하게 명시하는 벤치마크는, 그 압력이 시작되기도 전에 없애버린다.</p>
        <div className="article-note"><strong>더 읽을거리</strong><p>
          <a href="https://github.com/kyhsa93/k8s-playbook/blob/main/docs/benchmark.md" target="_blank" rel="noreferrer">docs/benchmark.md</a> — 전체 채점 정의, drift 제외 근거가 점수 자체와 나란히 명시된 곳
        </p></div>
      </>
    ),
  },
};

export default function ABenchmarkThatCanNeverHit100() {
  const { locale } = useLocale();
  const c = content[locale];

  return (
    <PostLayout
      slug="a-benchmark-that-can-never-hit-100"
      kicker={c.kicker}
      title={c.title}
      lede={c.lede}
    >
      {c.body}
    </PostLayout>
  );
}
