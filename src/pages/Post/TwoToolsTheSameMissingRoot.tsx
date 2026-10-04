import PostLayout from '../../components/PostLayout';
import { useLocale, localeFromPathname } from '../../lib/locale';
import type { MetaFunction } from 'react-router';
import { createPostMeta } from '../../lib/seo';

export const meta: MetaFunction = ({ location }) =>
  createPostMeta('two-tools-the-same-missing-root', localeFromPathname(location.pathname));

const content = {
  en: {
    kicker: 'Kubernetes · GitOps',
    title: (
      <>
        Two Tools,<br /><em>the Same Missing Root</em>
      </>
    ),
    lede: "Argo CD and Flux express an application dependency tree in almost opposite ways: one signal lives entirely on the parent, the other is declared by each child. Audit either one without including the object that carries the proof, and the same false failure shows up in both, for what turns out to be the same underlying reason.",
    body: (
      <>
        <p>A check meant to confirm a set of applications forms a legitimate dependency tree (not a pile of unrelated ones that happen to share a naming pattern) has to answer a specific question: is this child managed as part of a larger structure, or is it standing alone? Two different GitOps tools answer that question with two structurally different signals, and both of them turned out to have the same failure mode when audited incompletely.</p>
        <h2>Argo CD: the Signal Lives on the Parent</h2>
        <p>Classic Argo CD App-of-Apps has a root <code>Application</code> with <code>source.directory.recurse: true</code>, pointed at a directory of child <code>Application</code> manifests. Confirmed against a real, reconciling Argo CD v3.4.5 controller, not just documentation: the children carry no distinguishing content at all. No <code>ownerReferences</code>, nothing in their own spec that says "I belong to a tree." The entire proof that they're managed, rather than standalone, lives on the root's <code>recurse</code> flag, an object the children themselves say nothing about.</p>
        <p>Which means a check fed only the children (say, an audit scoped to "the apps my team owns," deliberately excluding a shared root someone else manages) has no way to tell two legitimately-managed children apart from two unrelated one-off Applications that happen to look similar. It reports FAIL either way, correctly reflecting that it can't confirm what it wasn't given the evidence to confirm.</p>
        <h2>Flux: the Signal Is Declared by the Child</h2>
        <p>Flux does the opposite. A child Kustomization declares its own membership explicitly: <code>spec.dependsOn: [{'{'}name: infra{'}'}]</code>, naming the parent it depends on. On paper this looks like it should be self-sufficient. The child is already saying who its parent is, no external root object required to interpret it.</p>
        <p>It isn't, for a specific reason: a name in <code>dependsOn</code> is just a string. Confirmed against a real <code>flux install</code>, not just the CRD schema, the kustomize-controller never stamps an <code>ownerReferences</code> back onto the child pointing at the parent. So nothing in the child's own live state proves that <code>infra</code> refers to something real and legitimately managed rather than a typo or a stale reference to a Kustomization that was deleted months ago. A check handed only the children, <code>payment-api</code> and <code>order-api</code>, each declaring <code>dependsOn: [{'{'}name: infra{'}'}]</code>, sees the same string both times and has no way to confirm it resolves to anything. It reports FAIL, on purpose, because a name a child claims and a name that's backed by a present resource are two different facts, and only one of them was in evidence.</p>
        <div className="article-note"><strong>Same failure, opposite mechanism</strong><p>Argo CD's proof lives on the parent and says nothing on the child. Flux's proof lives on the child and says nothing back from the parent. They fail for structurally different reasons (one because the child is silent, the other because the child's claim is unverifiable alone), but the practical consequence is identical: leave the root out of what you feed the checker, and legitimate structure looks indistinguishable from a coincidence.</p></div>
        <h2>The Same Caveat, Confirmed Twice Independently</h2>
        <p>The Argo CD finding came first, against a real cluster running a self-contained App-of-Apps example. The natural next question was whether the same root-exclusion problem applies to Flux's <code>dependsOn</code> tree, and it got answered the same way: a real <code>flux install</code>, a root <code>infra</code> Kustomization, two dependents declaring <code>dependsOn</code> on it, and a fixture built specifically to feed the checker only the children. It failed as predicted, for the reason predicted. Two different tools, two structurally different ways of expressing a tree, and the same root-exclusion caveat held in both. The mechanisms weren't similar; the caveat held because "prove this object belongs to a tree" always needs at least one object outside the one being questioned.</p>
        <h2>The General Rule</h2>
        <p>Any check that verifies membership in a hierarchy has to include the structure's root in its input, not just the leaf under review. That goes beyond GitOps app trees to ownership graphs, dependency graphs, org-chart-shaped permission audits, anything where "is this legitimately part of a structure" is the question. A query scoped to "only what I own" or "only the thing I'm checking" can look complete and still be structurally unable to answer the question it was asked, because the proof it needs was never in scope to begin with.</p>
        <div className="article-note"><strong>Further reading</strong><p>
          <a href="https://github.com/kyhsa93/k8s-playbook/blob/main/README.md" target="_blank" rel="noreferrer">kyhsa93/k8s-playbook</a> — both live-controller validations, Argo CD and Flux, and the fixtures that reproduce each failure on purpose
        </p></div>
      </>
    ),
  },
  ko: {
    kicker: 'Kubernetes · GitOps',
    title: (
      <>
        서로 다른 두 도구,<br /><em>똑같이 빠뜨린 루트</em>
      </>
    ),
    lede: 'Argo CD와 Flux는 애플리케이션 의존성 트리를 거의 반대 방식으로 표현한다. 한쪽은 신호가 전부 부모에 있고, 다른 쪽은 자식이 직접 선언한다. 그런데 어느 쪽이든 증거를 쥔 객체를 빼고 감사하면 똑같은 거짓 실패가 나온다. 따져 보면 이유도 같다.',
    body: (
      <>
        <p>애플리케이션 묶음이 제대로 된 의존성 트리인지 확인하는 검사가 있다고 하자. 이름 패턴만 비슷한 무관한 앱 더미와 가려내야 하니, 결국 이 질문에 답해야 한다. 이 자식은 더 큰 구조의 일부로 관리되고 있는가, 아니면 혼자 떨어져 있는가. 두 GitOps 도구는 구조가 전혀 다른 신호로 이 질문에 답한다. 그런데 감사 범위를 덜 잡으면 둘 다 똑같은 방식으로 실패했다.</p>
        <h2>Argo CD는 신호가 부모에 있다</h2>
        <p>전형적인 Argo CD App-of-Apps에서는 <code>source.directory.recurse: true</code>를 단 루트 <code>Application</code>이 자식 <code>Application</code> 매니페스트가 모인 디렉터리를 가리킨다. 문서만 보지 않고 실제로 리컨실하는 Argo CD v3.4.5 컨트롤러에서 확인했다. 자식에는 구분할 만한 내용이 아무것도 없다. <code>ownerReferences</code>도 없고, 스펙 어디에도 "나는 트리에 속해 있다"는 표시가 없다. 단독 앱이 아니라 관리받는 앱이라는 증거는 루트의 <code>recurse</code> 플래그 하나뿐이고, 자식 쪽에서는 그 루트에 대해 아무 말도 하지 않는다.</p>
        <p>그러니 자식만 받은 검사는 둘을 구분할 수 없다. 예를 들어 "우리 팀 앱"으로 범위를 좁히면서 다른 팀이 관리하는 공유 루트를 일부러 뺀 감사가 그렇다. 제대로 관리되는 자식 둘과, 우연히 비슷하게 생긴 무관한 단독 Application 둘이 똑같아 보인다. 어느 경우든 FAIL을 낸다. 확인할 근거를 받지 못했으니 확인할 수 없다고 답하는 것이고, 그 답은 맞다.</p>
        <h2>Flux는 자식이 신호를 선언한다</h2>
        <p>Flux는 반대다. 자식 Kustomization이 <code>spec.dependsOn: [{'{'}name: infra{'}'}]</code>처럼 자기가 의존하는 부모 이름을 직접 적어 소속을 밝힌다. 언뜻 보면 이것만으로 충분할 것 같다. 자식이 이미 부모가 누군지 말하고 있으니 바깥의 루트 객체를 볼 필요가 없어 보인다.</p>
        <p>그렇지 않다. <code>dependsOn</code>에 적힌 이름은 그냥 문자열이기 때문이다. CRD 스키마만 보지 않고 실제 <code>flux install</code>에서 확인해 보니, kustomize-controller는 자식에게 부모를 가리키는 <code>ownerReferences</code>를 찍어 주지 않는다. 그래서 자식의 라이브 상태만 봐서는 <code>infra</code>가 실제로 있고 제대로 관리되는 대상인지 알 수 없다. 오타일 수도 있고, 몇 달 전에 지운 Kustomization을 가리키는 낡은 참조일 수도 있다. <code>payment-api</code>와 <code>order-api</code>가 둘 다 <code>dependsOn: [{'{'}name: infra{'}'}]</code>를 선언하고 있고 검사가 이 둘만 받았다면, 같은 문자열을 두 번 볼 뿐 그 이름이 무언가로 이어지는지는 확인하지 못한다. 그래서 일부러 FAIL을 낸다. 자식이 주장하는 이름과 실제 리소스가 뒷받침하는 이름은 별개의 사실이고, 손에 쥔 증거는 그중 하나뿐이었다.</p>
        <div className="article-note"><strong>실패는 같고, 원리는 반대다</strong><p>Argo CD는 증거가 부모에 있고 자식에는 아무 흔적도 없다. Flux는 증거가 자식에 있고 부모 쪽에서 되짚어 주는 확인이 없다. 실패하는 이유는 구조적으로 다르다. 하나는 자식이 아무 말도 안 해서고, 다른 하나는 자식의 주장만으로는 검증이 안 돼서다. 그래도 결과는 같다. 검사기에 넘기는 입력에서 루트를 빼면 제대로 된 구조와 우연의 일치를 구분할 수 없다.</p></div>
        <h2>같은 단서가 두 번 따로 확인됐다</h2>
        <p>먼저 확인한 건 Argo CD였다. 독립적으로 도는 App-of-Apps 예제를 실제 클러스터에 올려서 봤다. 그러자 같은 루트 누락 문제가 Flux의 <code>dependsOn</code> 트리에도 있는지 궁금해졌고, 같은 방식으로 답을 얻었다. 실제 <code>flux install</code>에 루트 <code>infra</code> Kustomization을 두고, 거기에 <code>dependsOn</code>을 거는 의존 앱 둘을 만든 다음, 검사기에 자식만 넘기는 픽스처를 따로 짰다. 예상한 대로, 예상한 이유로 실패했다.</p>
        <p>도구도 다르고 트리를 표현하는 구조도 다른데, 루트를 빼면 안 된다는 단서는 양쪽에서 똑같이 성립했다. 원리가 비슷해서 그런 게 아니다. "이 객체가 트리에 속한다는 걸 증명하라"는 질문에 답하려면, 질문받는 객체 말고 적어도 하나의 객체가 바깥에서 더 필요하기 때문이다.</p>
        <h2>일반 규칙</h2>
        <p>계층 안의 소속을 확인하는 검사라면 검토할 리프만이 아니라 구조의 루트까지 입력에 넣어야 한다. GitOps 앱 트리만의 얘기가 아니다. 소유권 그래프, 의존성 그래프, 조직도 모양의 권한 감사처럼 "이게 정말 구조의 일부인가"를 묻는 곳이면 어디든 마찬가지다. "내가 소유한 것만"이나 "지금 검사하는 것만"으로 좁힌 쿼리는 빠짐없어 보여도, 필요한 증거가 처음부터 범위 밖에 있어서 구조상 질문에 답하지 못할 수 있다.</p>
        <div className="article-note"><strong>더 읽을거리</strong><p>
          <a href="https://github.com/kyhsa93/k8s-playbook/blob/main/README.md" target="_blank" rel="noreferrer">kyhsa93/k8s-playbook</a>(Argo CD와 Flux 라이브 컨트롤러 검증 기록, 그리고 각 실패를 일부러 재현하는 픽스처)
        </p></div>
      </>
    ),
  },
};

export default function TwoToolsTheSameMissingRoot() {
  const { locale } = useLocale();
  const c = content[locale];

  return (
    <PostLayout
      slug="two-tools-the-same-missing-root"
      kicker={c.kicker}
      title={c.title}
      lede={c.lede}
    >
      {c.body}
    </PostLayout>
  );
}
