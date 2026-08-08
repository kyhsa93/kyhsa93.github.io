import PostLayout from '../../components/PostLayout';
import { useLocale } from '../../lib/locale';
import type { MetaFunction } from 'react-router';
import { createPostMeta } from '../../lib/seo';

export const meta: MetaFunction = () => createPostMeta('the-list-that-broke-five-harnesses');

const content = {
  en: {
    kicker: 'Kubernetes · Tooling',
    title: (
      <>
        The List<br /><em>That Broke Five Harnesses</em>
      </>
    ),
    lede: "Every static check that reads a Kubernetes manifest assumes the same input shape: one or more YAML documents, separated by `---`. That assumption is correct for `kustomize build` and `helm template`. It's wrong for one of the most natural ways to dump live cluster state, and five separate tools had built the same blind spot into themselves without anyone noticing.",
    body: (
      <>
        <p>A set of Kubernetes anti-pattern checkers — five of them, each reading manifests independently to catch a different category of mistake — had all been validated the same way: pipe rendered YAML in, confirm the right verdict comes out. `kustomize build`, `helm template`, a raw manifest file. All of it arrives as one or more `---`-separated documents, and every checker's loader was written, reasonably, to split on that separator and parse each chunk.</p>
        <h2>A Different Way to Ask Kubernetes for the Same Thing</h2>
        <p>Validating a check against a genuinely running cluster means asking the cluster itself what's live, not just what was declared. The natural way to do that for more than one resource at once is <code>kubectl get deployment app-a app-b -o yaml</code> — name several resources, get their full manifests back in one call instead of one request per resource.</p>
        <p><code>kubectl</code> does return full manifests. It just doesn't return them the way `kustomize` or `helm` would. Naming two or more resources in one <code>get</code> call wraps the result in a single document: <code>kind: List</code>, with every requested resource nested under an <code>items:</code> array. No <code>---</code> separator anywhere, because there's only one top-level document to begin with.</p>
        <div className="article-note"><strong>What every loader actually saw</strong><p>A loader written to split on <code>---</code> and parse each chunk as one resource, handed a <code>kind: List</code> document instead, parses it as exactly one resource — a resource of kind <code>List</code>, which no check was written to recognize. Every rule that pattern-matches on <code>kind: Deployment</code>, <code>kind: NetworkPolicy</code>, and so on simply finds nothing to match. Not an error. Not a crash. A clean, silent "no resources found."</p></div>
        <h2>Five for Five, Not One</h2>
        <p>This wasn't one checker's parsing bug. Every checker in the set shared the same loader convention — split on <code>---</code>, parse each chunk — because it had always been sufficient before. The moment a live-cluster validation round started feeding real <code>kubectl get</code> output with multiple resources per call, all five inherited the identical blind spot at once, for the identical reason. A single fix — detect <code>kind: List</code> and unwrap its <code>items</code> into the same document stream the rest of the loader already expected — closed it everywhere at once, which was itself a small confirmation that the five checkers had been sharing more implementation than their separate anti-pattern responsibilities suggested.</p>
        <h2>Why "No Resources Found" Is the Dangerous Failure Mode</h2>
        <p>A checker that crashes on unexpected input is annoying but honest — it tells you immediately that something needs fixing. A checker that silently finds zero resources to check looks, from the outside, identical to a checker confirming a clean pass. Nothing in the checker's own output distinguishes "I looked and found no violations" from "I looked at nothing." Anyone piping real <code>kubectl get</code> output with more than one resource per call through any of these checks would have gotten a green result — not because the resources were compliant, but because the checker never actually saw them.</p>
        <div className="article-note"><strong>The general shape of the bug</strong><p>Any tool that parses Kubernetes YAML by assuming a particular document boundary is only as correct as the set of tools it was tested against producing that boundary. <code>kustomize build</code>, <code>helm template</code>, and single-resource <code>kubectl get -o yaml</code> all agree on <code>---</code>-separated documents. Naming more than one resource in a single <code>kubectl get</code> call doesn't — and that specific shape is easy to never trigger in testing if every fixture was built from rendered files rather than a live cluster.</p></div>
        <h2>What Changed</h2>
        <p>The fix isn't clever: check whether the top-level parsed document has <code>kind: List</code>, and if so, treat its <code>items</code> array as the document stream instead of the document itself. Cheap, a few lines, and it means a loader now accepts every shape the tools it actually gets fed can produce — not just the shape that happened to be the one used to build the test fixtures.</p>
        <div className="article-note"><strong>Further reading</strong><p>
          <a href="https://github.com/kyhsa93/k8s-playbook" target="_blank" rel="noreferrer">kyhsa93/k8s-playbook</a> — where this surfaced, validating a Kubernetes anti-pattern harness against a real Argo CD-managed cluster instead of just rendered fixtures
        </p></div>
      </>
    ),
  },
  ko: {
    kicker: 'Kubernetes · Tooling',
    title: (
      <>
        다섯 개의 하네스를<br /><em>동시에 무너뜨린 List</em>
      </>
    ),
    lede: 'Kubernetes 매니페스트를 읽는 정적 검사기는 전부 같은 입력 형태를 가정한다: `---`로 구분된 하나 이상의 YAML 문서. 그 가정은 `kustomize build`와 `helm template`에는 맞다. 살아있는 클러스터 상태를 덤프하는 가장 자연스러운 방법 하나에는 틀렸고, 다섯 개의 서로 다른 도구가 그 사각지대를 아무도 모르는 사이 똑같이 갖고 있었다.',
    body: (
      <>
        <p>Kubernetes 안티패턴 검사기 다섯 개 — 각각 독립적으로 매니페스트를 읽어 서로 다른 종류의 실수를 잡아내는 — 는 전부 같은 방식으로 검증돼왔다: 렌더링된 YAML을 흘려넣고, 올바른 판정이 나오는지 확인하는 방식으로. `kustomize build`, `helm template`, 원본 매니페스트 파일. 이 모든 것은 `---`로 구분된 하나 이상의 문서로 도착하고, 모든 검사기의 로더는 합리적으로 그 구분자로 잘라 각 조각을 파싱하도록 작성돼 있었다.</p>
        <h2>같은 것을 Kubernetes에게 다르게 묻는 방법</h2>
        <p>진짜로 실행 중인 클러스터를 상대로 검사를 검증한다는 건, 선언된 것이 아니라 클러스터 자신에게 지금 무엇이 떠 있는지 물어보는 것을 뜻한다. 여러 리소스를 한 번에 물어보는 자연스러운 방법은 <code>kubectl get deployment app-a app-b -o yaml</code>이다 — 여러 리소스 이름을 대고, 리소스마다 따로 요청하는 대신 한 번의 호출로 전체 매니페스트를 돌려받는다.</p>
        <p><code>kubectl</code>은 실제로 전체 매니페스트를 돌려준다. 다만 `kustomize`나 `helm`이 돌려주는 방식과는 다르다. 하나의 <code>get</code> 호출에 리소스를 두 개 이상 대면, 결과는 단일 문서 하나로 감싸진다: <code>kind: List</code>, 그리고 요청한 모든 리소스가 <code>items:</code> 배열 안에 중첩된다. <code>---</code> 구분자는 어디에도 없다. 애초에 최상위 문서가 하나뿐이기 때문이다.</p>
        <div className="article-note"><strong>모든 로더가 실제로 본 것</strong><p><code>---</code>로 잘라 각 조각을 하나의 리소스로 파싱하도록 작성된 로더가, 대신 <code>kind: List</code> 문서 하나를 건네받으면, 그걸 정확히 리소스 하나로 파싱한다 — 어떤 검사도 알아보도록 작성되지 않은 <code>kind: List</code>라는 리소스로. <code>kind: Deployment</code>, <code>kind: NetworkPolicy</code> 등을 패턴 매칭하는 모든 규칙은 그냥 매칭할 게 아무것도 없다는 걸 발견한다. 에러가 아니다. 크래시도 아니다. 깔끔하고 조용한 "발견된 리소스 없음"이다.</p></div>
        <h2>하나가 아니라 다섯 전부</h2>
        <p>이건 검사기 하나의 파싱 버그가 아니었다. 집합 안의 모든 검사기가 같은 로더 관례를 공유하고 있었다 — <code>---</code>로 자르고 각 조각을 파싱하는 — 왜냐하면 지금까지는 항상 그걸로 충분했기 때문이다. 라이브 클러스터 검증 라운드가 한 번의 호출에 여러 리소스가 담긴 진짜 <code>kubectl get</code> 출력을 흘려넣기 시작한 순간, 다섯 개 전부가 동시에, 똑같은 이유로 똑같은 사각지대를 물려받았다. 수정 하나 — <code>kind: List</code>를 감지해 그 <code>items</code>를 로더가 이미 기대하고 있던 같은 문서 스트림으로 펼치는 것 — 로 전부 한 번에 닫혔고, 이 자체가 다섯 검사기가 각자 맡은 안티패턴 책임이 시사하는 것보다 더 많은 구현을 공유하고 있었다는 작은 확인이기도 했다.</p>
        <h2>왜 "발견된 리소스 없음"이 위험한 실패 방식인가</h2>
        <p>예상 밖의 입력에 크래시하는 검사기는 성가시지만 정직하다 — 뭔가 고쳐야 한다는 걸 즉시 알려준다. 조용히 검사할 리소스를 0개 찾은 검사기는, 밖에서 보면 깨끗한 통과를 확인한 검사기와 똑같아 보인다. 검사기 자신의 출력 그 어디에도 "봤는데 위반이 없었다"와 "아무것도 보지 못했다"를 구분할 방법이 없다. 한 번의 호출에 여러 리소스를 담은 진짜 <code>kubectl get</code> 출력을 이 검사기들 중 무엇에라도 흘려넣은 사람은 초록 결과를 받았을 것이다 — 리소스가 규정을 준수해서가 아니라, 검사기가 애초에 그것들을 본 적이 없어서.</p>
        <div className="article-note"><strong>이 버그의 일반적인 형태</strong><p>특정 문서 경계를 가정하고 Kubernetes YAML을 파싱하는 도구는, 그 경계를 만들어내도록 테스트해본 도구들의 집합만큼만 정확하다. <code>kustomize build</code>, <code>helm template</code>, 그리고 리소스 하나짜리 <code>kubectl get -o yaml</code>은 전부 <code>---</code>로 구분된 문서에 동의한다. 하나의 <code>kubectl get</code> 호출에 리소스를 두 개 이상 대는 건 그렇지 않다 — 그리고 모든 픽스처가 라이브 클러스터가 아니라 렌더링된 파일로만 만들어졌다면, 테스트에서 이 특정 형태는 아예 한 번도 촉발되지 않기 쉽다.</p></div>
        <h2>무엇이 바뀌었나</h2>
        <p>수정은 영리하지 않다: 최상위 파싱된 문서가 <code>kind: List</code>인지 확인하고, 맞다면 그 <code>items</code> 배열을 문서 자체가 아니라 문서 스트림으로 취급한다. 저렴하고, 몇 줄이면 되고, 이제 로더가 테스트 픽스처를 만드는 데 마침 쓰였던 형태뿐 아니라 실제로 받게 될 도구들이 만들어낼 수 있는 모든 형태를 받아들인다는 뜻이다.</p>
        <div className="article-note"><strong>더 읽을거리</strong><p>
          <a href="https://github.com/kyhsa93/k8s-playbook" target="_blank" rel="noreferrer">kyhsa93/k8s-playbook</a> — 렌더링된 픽스처가 아니라 실제 Argo CD가 관리하는 클러스터를 상대로 Kubernetes 안티패턴 하네스를 검증하다가 드러난 곳
        </p></div>
      </>
    ),
  },
};

export default function TheListThatBrokeFiveHarnesses() {
  const { locale } = useLocale();
  const c = content[locale];

  return (
    <PostLayout
      slug="the-list-that-broke-five-harnesses"
      kicker={c.kicker}
      title={c.title}
      lede={c.lede}
    >
      {c.body}
    </PostLayout>
  );
}
