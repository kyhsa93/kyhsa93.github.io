import PostLayout from '../../components/PostLayout';
import { useLocale, localeFromPathname } from '../../lib/locale';
import type { MetaFunction } from 'react-router';
import { createPostMeta } from '../../lib/seo';

export const meta: MetaFunction = ({ location }) =>
  createPostMeta('the-list-that-broke-five-harnesses', localeFromPathname(location.pathname));

const content = {
  en: {
    kicker: 'Kubernetes · Tooling',
    title: (
      <>
        The List<br /><em>That Broke Five Checkers</em>
      </>
    ),
    lede: "Every static check that reads a Kubernetes manifest assumes the same input shape: one or more YAML documents, separated by `---`. That assumption is correct for `kustomize build` and `helm template`. It's wrong for one of the most natural ways to dump live cluster state, and five separate tools had built the same blind spot into themselves without anyone noticing. Fed that shape, none of them failed. Each reported no resources found, which looks exactly like a clean pass.",
    body: (
      <>
        <p>My example project catalogs common Kubernetes deployment mistakes, each paired with a check that finds it in a manifest. Five of those checkers, each reading manifests independently to catch a different category of mistake, had all been validated the same way: pipe rendered YAML in, confirm the right verdict comes out. `kustomize build`, `helm template`, a raw manifest file. All of it arrives as one or more `---`-separated documents, and every checker's loader was written, reasonably, to split on that separator and parse each chunk.</p>
        <h2>A Different Way to Ask Kubernetes for the Same Thing</h2>
        <p>Validating a check against a running cluster means asking the cluster itself what's live, not just what was declared. The natural way to do that for more than one resource at once is <code>kubectl get deployment app-a app-b -o yaml</code>: name several resources, get their full manifests back in one call instead of one request per resource.</p>
        <p><code>kubectl</code> does return full manifests. It just doesn't return them the way `kustomize` or `helm` would. Naming two or more resources in one <code>get</code> call wraps the result in a single document: <code>kind: List</code>, with every requested resource nested under an <code>items:</code> array. No <code>---</code> separator anywhere, because there's only one top-level document to begin with.</p>
        <div className="article-note"><strong>What every loader saw</strong><p>A loader written to split on <code>---</code> and parse each chunk as one resource, handed a <code>kind: List</code> document instead, parses it as one resource — a resource of kind <code>List</code>, which no check was written to recognize. Every rule that pattern-matches on <code>kind: Deployment</code>, <code>kind: NetworkPolicy</code>, and so on simply finds nothing to match. Not an error. Not a crash. A clean "no resources found."</p></div>
        <h2>Five for Five, Not One</h2>
        <p>This wasn't one checker's parsing bug. Every checker in the set shared the same loader convention (split on <code>---</code>, parse each chunk), because it had always been sufficient before. The moment live-cluster validation started feeding real <code>kubectl get</code> output with multiple resources per call, all five inherited the identical blind spot at once, for the identical reason. A single fix (detect <code>kind: List</code> and unwrap its <code>items</code> into the same document stream the rest of the loader already expected) closed it everywhere at once, which was itself a small confirmation that the five checkers had been sharing more implementation than their separate anti-pattern responsibilities suggested.</p>
        <h2>Why "No Resources Found" Is the Dangerous Failure Mode</h2>
        <p>A checker that crashes on unexpected input is annoying but honest: it tells you immediately that something needs fixing. A checker that finds zero resources to check, without a word, looks from the outside identical to a checker confirming a clean pass. Nothing in the checker's own output distinguishes "I looked and found no violations" from "I looked at nothing." Anyone piping real <code>kubectl get</code> output with more than one resource per call through any of these checks would have gotten a green result — not because the resources were compliant, but because the checker never saw them.</p>
        <div className="article-note"><strong>The general shape of the bug</strong><p>Any tool that parses Kubernetes YAML by assuming a particular document boundary is only as correct as the set of tools it was tested against producing that boundary. <code>kustomize build</code>, <code>helm template</code>, and single-resource <code>kubectl get -o yaml</code> all agree on <code>---</code>-separated documents. Naming more than one resource in a single <code>kubectl get</code> call doesn't, and that specific shape is easy to never trigger in testing if every fixture was built from rendered files rather than a live cluster.</p></div>
        <h2>What Changed</h2>
        <p>The fix isn't clever: check whether the top-level parsed document has <code>kind: List</code>, and if so, treat its <code>items</code> array as the document stream instead of the document itself. Cheap, a few lines, and it means a loader now accepts every shape the tools it gets fed can produce, not just the shape that happened to be the one used to build the test fixtures.</p>
        <div className="article-note"><strong>Further reading</strong><p>
          <a href="https://github.com/kyhsa93/k8s-playbook" target="_blank" rel="noreferrer">kyhsa93/k8s-playbook</a> (my example project that catalogs common Kubernetes deployment mistakes, each with a checker that finds it in a manifest; this surfaced while validating those checkers against a real Argo CD-managed cluster instead of just rendered fixtures)
        </p></div>
      </>
    ),
  },
  ko: {
    kicker: 'Kubernetes · Tooling',
    title: (
      <>
        검사기 5개를<br /><em>한꺼번에 무너뜨린 List</em>
      </>
    ),
    lede: 'Kubernetes 매니페스트를 읽는 정적 검사기는 모두 같은 입력 모양을 가정한다. `---`로 구분한 YAML 문서가 하나 이상 들어온다는 가정이다. `kustomize build`나 `helm template` 출력이라면 맞다. 하지만 살아 있는 클러스터 상태를 덤프하는 가장 자연스러운 방법 하나에서는 틀린다. 서로 다른 도구 5개가 아무도 모르는 사이 같은 사각지대를 똑같이 품고 있었다. 그 모양을 받은 도구는 하나도 실패하지 않았다. 모두 "발견된 리소스 없음"이라고 답했고, 그건 깨끗한 통과와 똑같아 보인다.',
    body: (
      <>
        <p>내 예제 프로젝트는 Kubernetes 배포 실수를 유형별로 모으고, 실수마다 매니페스트에서 그것을 찾아내는 검사기를 붙여 둔다. 그중 검사기 5개는 각자 매니페스트를 따로 읽고, 서로 다른 종류의 실수를 잡는다. 이 검사기들은 모두 같은 방식으로 검증해 왔다. 렌더링한 YAML을 넣고 올바른 판정이 나오는지 확인하는 식이다. `kustomize build`, `helm template`, 손으로 쓴 매니페스트 파일은 모두 `---`로 구분한 문서 하나 이상으로 들어온다. 그래서 모든 검사기의 로더는 그 구분자로 잘라 조각마다 파싱하도록 짜여 있었다. 그렇게 짠 것 자체는 무리가 없었다.</p>
        <h2>같은 걸 Kubernetes에 다르게 묻기</h2>
        <p>실행 중인 클러스터에 대고 검사를 검증하려면, 선언해 둔 내용 말고 지금 떠 있는 것을 클러스터에 직접 물어봐야 한다. 리소스 여러 개를 한 번에 물어보는 자연스러운 방법은 <code>kubectl get deployment app-a app-b -o yaml</code>이다. 리소스 이름을 여러 개 대면, 리소스마다 따로 요청하지 않고 호출 한 번으로 전체 매니페스트를 받는다.</p>
        <p><code>kubectl</code>은 전체 매니페스트를 돌려주긴 한다. 다만 `kustomize`나 `helm`과는 돌려주는 모양이 다르다. <code>get</code> 호출 하나에 리소스를 2개 이상 대면 결과가 문서 하나로 감싸진다. 최상위가 <code>kind: List</code>이고, 요청한 리소스는 모두 <code>items:</code> 배열 안에 들어간다. <code>---</code> 구분자는 어디에도 없다. 최상위 문서가 처음부터 하나뿐이기 때문이다.</p>
        <div className="article-note"><strong>로더들이 본 것</strong><p><code>---</code>로 잘라 조각 하나를 리소스 하나로 파싱하는 로더에 <code>kind: List</code> 문서를 넣으면, 로더는 그걸 리소스 딱 하나로 파싱한다. <code>kind: List</code>인 리소스인데, 이걸 알아보도록 만든 검사는 하나도 없다. <code>kind: Deployment</code>나 <code>kind: NetworkPolicy</code> 같은 걸 패턴 매칭하는 규칙은 모두 맞는 게 없다고 판단한다. 에러도 안 나고 크래시도 없다. 깔끔하게 "발견된 리소스 없음"이 나올 뿐이다.</p></div>
        <h2>하나가 아니라 5개 전부</h2>
        <p>검사기 하나의 파싱 버그가 아니었다. 모든 검사기가 <code>---</code>로 자르고 조각마다 파싱하는 같은 로더 관례를 따르고 있었다. 그동안은 늘 그걸로 충분했기 때문이다. 라이브 클러스터 검증을 시작하면서, 호출 한 번에 리소스 여러 개가 담긴 진짜 <code>kubectl get</code> 출력이 들어오기 시작했다. 그 순간 5개 모두가 같은 이유로 같은 사각지대에 한꺼번에 빠졌다.</p>
        <p>고친 것도 하나였다. <code>kind: List</code>를 감지하면 그 <code>items</code>를 풀어서, 로더가 원래 기대하던 문서 스트림으로 넘겨준다. 이 수정 하나로 다섯 곳이 한 번에 닫혔다. 거꾸로 보면, 다섯 검사기가 맡은 안티패턴은 제각각이어도 구현은 생각보다 많이 공유하고 있었다는 작은 증거이기도 했다.</p>
        <h2>"발견된 리소스 없음"이 위험한 이유</h2>
        <p>예상하지 못한 입력에 크래시가 나는 검사기는 성가셔도 정직하다. 뭔가 고쳐야 한다는 걸 바로 알려 준다. 검사할 리소스를 아무 말 없이 0개 찾은 검사기는, 밖에서 보면 깨끗하게 통과한 검사기와 똑같다. 검사기 출력 어디에도 "봤는데 위반이 없었다"와 "아무것도 안 봤다"를 가를 단서가 없다.</p>
        <p>리소스를 여러 개 담은 <code>kubectl get</code> 출력을 이 검사기 중 어느 것에 넣었든 초록 결과가 나왔을 것이다. 리소스가 규칙을 지켜서가 아니다. 검사기가 그 리소스를 본 적이 없어서다.</p>
        <div className="article-note"><strong>이 버그를 일반화하면</strong><p>특정 문서 경계를 가정하고 Kubernetes YAML을 파싱하는 도구는, 그 경계를 만들어 내는 도구로 시험해 본 범위까지만 정확하다. <code>kustomize build</code>, <code>helm template</code>, 리소스 하나짜리 <code>kubectl get -o yaml</code>은 모두 <code>---</code>로 구분한 문서를 낸다. <code>kubectl get</code> 한 번에 리소스를 2개 이상 대면 그렇지 않다. 픽스처를 전부 라이브 클러스터가 아니라 렌더링한 파일로 만들었다면, 테스트에서 이 모양을 한 번도 만나지 않기 쉽다.</p></div>
        <h2>무엇을 바꿨나</h2>
        <p>수정은 대단할 게 없다. 파싱한 최상위 문서가 <code>kind: List</code>인지 보고, 맞으면 문서 자체 대신 그 <code>items</code> 배열을 문서 스트림으로 다룬다. 몇 줄이면 되고 비용도 거의 없다. 이제 로더는 테스트 픽스처를 만들 때 마침 쓴 모양만 받는 게 아니다. 실제로 들어올 도구들이 낼 수 있는 모양은 모두 받는다.</p>
        <div className="article-note"><strong>더 볼 자료</strong><p>
          <a href="https://github.com/kyhsa93/k8s-playbook" target="_blank" rel="noreferrer">kyhsa93/k8s-playbook</a>(Kubernetes 배포 실수를 유형별로 모으고 실수마다 검사기를 붙여 둔 내 예제 프로젝트. 렌더링한 픽스처 대신 Argo CD가 관리하는 실제 클러스터에 대고 그 검사기들을 검증하다가 이 문제가 드러났다)
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
