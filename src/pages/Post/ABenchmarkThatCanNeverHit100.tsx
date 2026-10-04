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
    lede: "When a score adds up many checks, one can be missing for two different reasons: nobody has built it yet, or the thing being scored can never show it. I ran into the second kind with a checker covering nineteen categories of Kubernetes deployment mistake. Eighteen of them can be checked against a manifest an AI agent writes. The nineteenth can't. Not yet, not ever, no matter how the benchmark grows, and the honest response was to say so permanently, not to leave it as a TODO.",
    body: (
      <>
        <p>Reusing an anti-pattern checker as a benchmark for how well an AI agent authors Kubernetes manifests is a natural idea: the checker already exists, already scores objectively, already covers a documented catalog of real mistakes. Mine came from my example project that catalogs common Kubernetes deployment mistakes, each paired with a check that finds it in a manifest. Point the checker at whatever an agent produces, and the pass count becomes a number worth tracking across models, prompts, or catalog revisions. Nine of the catalog's categories scored cleanly this way from the start. Getting to eighteen meant extending what the benchmark's submission format could accept: a promotion pipeline file, an app-registration file, a whole config directory instead of a single manifest. One category never joined the other eighteen, and it isn't going to.</p>
        <h2>What the Nineteenth Category Measures</h2>
        <p>Most of the catalog checks something present in what an agent writes: does the Deployment have resource limits, does the Ingress have TLS, does the HorizontalPodAutoscaler have a sane range. The one holdout (drift, the gap between what Git declares and what's running on a cluster) measures something categorically different: a divergence that can only exist after a manifest has already been authored, already applied, and something (a person running <code>kubectl edit</code>, an operator reconciling a different intent, anyone changing the live state out-of-band) has since changed the cluster without updating Git to match.</p>
        <p>An authoring benchmark scores what an agent writes. It has no mechanism to introduce drift, because drift isn't a property of a YAML file — it's a property of the relationship between a YAML file and a cluster's state hours, days, or months later, shaped by events the authoring step has no way to cause or prevent. Asking an agent's manifest to demonstrate "no drift" is asking it to prove a fact about a future it doesn't control.</p>
        <div className="article-note"><strong>Why a bigger version won't fix it</strong><p>Every other gap in the benchmark's coverage was closed by extending the submission shape: accept a second file, accept a third file, accept a directory instead of a file. Drift can't be closed that way because no submission shape changes what the category measures. It would need the benchmark to stop being an authoring benchmark and become something that watches a cluster over time, a different kind of tool, not a bigger version of this one.</p></div>
        <h2>Two Different Kinds of Missing</h2>
        <p>A checklist with an item nobody's gotten to yet and a checklist with an item that structurally cannot apply look identical if you only read the score (<code>18/19</code> either way). They call for opposite responses. The first is a backlog entry — schedule the work, and the number climbs to 19 eventually. The second is a fact about the tool's shape, and treating it as a backlog entry invites the wrong instinct: someone eventually tries to make the number hit 19 anyway, which usually means fabricating a proxy signal for something the artifact under test cannot demonstrate.</p>
        <p>The honest fix wasn't a fix at all — it was a documented, permanent exclusion. The scoreable ceiling for this benchmark is stated as 18 out of 19, not 19 out of 19, in the same doc that defines the scoring itself. Not a caveat buried in a footnote; the number the benchmark reports is defined, from the start, to never include the category that can't apply.</p>
        <h2>The General Principle</h2>
        <p>Any scorer, checklist, or benchmark that aggregates multiple checks into one number needs to distinguish two different reasons a check might be missing: <em>not implemented yet</em>, which is a plan, and <em>cannot be measured by this kind of artifact</em>, which is a permanent property of what's being scored. Conflating them either wastes effort chasing a ceiling that was never reachable, or, worse, creates pressure to fake the missing signal well enough to claim the full score. A benchmark that states its own ceiling honestly, in the same place it reports results, removes that pressure before it starts.</p>
        <div className="article-note"><strong>Further reading</strong><p>
          <a href="https://github.com/kyhsa93/k8s-playbook/blob/main/docs/benchmark.md" target="_blank" rel="noreferrer">docs/benchmark.md</a> (the full scoring definition, with the reason for excluding drift stated next to the score itself, in my example project that catalogs common Kubernetes deployment mistakes with a checker for each)
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
    lede: '여러 검사를 더해 내는 점수에서 검사 하나가 빠졌다면, 이유는 둘 중 하나다. 아직 아무도 만들지 않았거나, 채점 대상이 그것을 영영 보여 줄 수 없는 경우다. 내가 부딪힌 건 뒤쪽이었다. Kubernetes 배포 실수 19개 카테고리를 채점하는 검사기에서 18개는 AI 에이전트가 쓴 매니페스트만 보고 확인할 수 있다. 남은 하나는 안 된다. 지금도 안 되고, 벤치마크를 아무리 키워도 앞으로도 안 된다. 그래서 TODO로 남겨 두지 않고, 이 항목은 영영 채점하지 않는다고 문서에 못 박았다.',
    body: (
      <>
        <p>안티패턴 검사기를 가져다 AI 에이전트가 Kubernetes 매니페스트를 얼마나 잘 쓰는지 재는 벤치마크로 쓰는 건 자연스러운 생각이다. 검사기는 이미 있고, 객관적으로 채점하고, 문서로 정리해 둔 실제 실수 카탈로그를 다룬다. 내가 쓴 검사기는 Kubernetes 배포 실수를 유형별로 모으고 실수마다 매니페스트에서 찾아내는 검사를 붙여 둔 내 예제 프로젝트에 있던 것이다. 에이전트가 만든 결과물을 검사기에 넣기만 하면 통과 개수가 나온다. 모델이나 프롬프트를 바꿀 때, 카탈로그를 고칠 때마다 비교해 볼 만한 숫자다.</p>
        <p>처음부터 이렇게 깔끔하게 채점된 카테고리는 9개였다. 18개까지 늘리려면 제출 형식이 받을 수 있는 범위를 넓혀야 했다. 프로모션 파이프라인 파일을 받게 했고, 앱 등록 파일을 받게 했고, 매니페스트 한 장 대신 설정 디렉터리 전체를 받게 했다. 그래도 한 카테고리는 끝내 나머지 18개에 끼지 못했다. 앞으로도 끼지 못한다.</p>
        <h2>19번째 카테고리가 재는 것</h2>
        <p>카탈로그 대부분은 에이전트가 쓴 파일 안에 무엇이 있는지를 본다. Deployment에 리소스 제한이 있는지, Ingress에 TLS가 있는지, HorizontalPodAutoscaler의 범위가 말이 되는지 같은 것들이다. 끝까지 남은 하나는 drift다. Git에 선언한 상태와 클러스터에서 지금 돌고 있는 상태가 어긋나는 걸 말한다.</p>
        <p>drift는 재는 대상부터 다르다. 매니페스트를 쓰고 적용한 다음, 누군가 Git은 그대로 둔 채 클러스터를 바꿔야 비로소 생긴다. 사람이 <code>kubectl edit</code>을 돌렸을 수도 있고, 다른 의도로 리컨사일하는 오퍼레이터일 수도 있다. 정해진 경로 밖에서 누가 라이브 상태를 건드려도 마찬가지다.</p>
        <p>작성 벤치마크는 에이전트가 쓴 것을 채점한다. 여기에는 drift를 일으킬 수단이 애초에 없다. drift는 YAML 파일 하나의 성질이 아니다. 그 파일과 몇 시간, 며칠, 몇 달 뒤의 클러스터 상태 사이에서 생기고, 그 사이에 벌어지는 일은 작성 단계에서 일으킬 수도 막을 수도 없다. 에이전트의 매니페스트에게 "drift 없음"을 보이라는 건, 자기가 손댈 수 없는 미래를 증명하라는 말과 같다.</p>
        <div className="article-note"><strong>버전을 올려서 풀 문제가 아닌 이유</strong><p>벤치마크가 못 다루던 다른 항목은 모두 제출 형식을 넓혀서 해결했다. 파일을 하나 더 받고, 또 하나 더 받고, 파일 대신 디렉터리를 받는 식이었다. drift는 그렇게 풀리지 않는다. 제출 형식을 어떻게 바꿔도 이 카테고리가 재는 대상은 그대로다. 풀려면 벤치마크가 작성 벤치마크이기를 그만두고, 시간을 두고 클러스터를 지켜보는 도구가 돼야 한다. 지금 도구를 키운 버전이 아니라 아예 다른 종류의 도구다.</p></div>
        <h2>두 가지 "없음"</h2>
        <p>아직 아무도 손대지 않은 항목과 구조상 적용할 수 없는 항목은 점수만 보면 똑같다. 둘 다 <code>18/19</code>로 나온다. 그런데 대응은 정반대다. 앞의 것은 백로그다. 일정에 넣고 작업하면 언젠가 19가 된다. 뒤의 것은 도구가 생긴 모양에 대한 사실이다.</p>
        <p>이걸 백로그로 다루면 엉뚱한 욕심이 생긴다. 결국 누군가 숫자를 19로 맞추려 들고, 그러다 보면 검사 대상이 보여 줄 수 없는 것을 대신할 가짜 신호를 만들어 내게 된다.</p>
        <p>그래서 고치지 않고 영구 제외로 문서에 적었다. 이 벤치마크에서 받을 수 있는 최고점은 19분의 19가 아니고 19분의 18이다. 이 내용은 채점 방식을 정의한 문서에 함께 적혀 있다. 각주 구석에 숨긴 단서도 아니다. 벤치마크가 내놓는 숫자는 처음부터 적용할 수 없는 카테고리를 빼고 세도록 정의돼 있다.</p>
        <h2>일반 원칙</h2>
        <p>여러 검사를 숫자 하나로 모으는 채점기나 체크리스트, 벤치마크라면 검사가 빠진 이유를 둘로 나눠야 한다. <em>아직 구현하지 않음</em>은 계획이다. <em>이런 산출물로는 잴 수 없음</em>은 채점 대상이 원래 가진 성질이고, 영영 바뀌지 않는다. 둘을 섞으면 처음부터 닿을 수 없던 상한을 쫓느라 힘을 버린다. 더 나쁘면 빠진 신호를 그럴듯하게 꾸며서라도 만점을 받고 싶어진다. 결과를 보고하는 자리에 자기 상한을 솔직하게 적어 둔 벤치마크에는 그런 압박이 생길 틈이 없다.</p>
        <div className="article-note"><strong>더 볼 자료</strong><p>
          <a href="https://github.com/kyhsa93/k8s-playbook/blob/main/docs/benchmark.md" target="_blank" rel="noreferrer">docs/benchmark.md</a>(Kubernetes 배포 실수를 유형별로 모으고 실수마다 검사기를 붙여 둔 내 예제 프로젝트의 전체 채점 정의. drift를 뺀 이유가 점수 정의 바로 옆에 적혀 있다)
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
