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
    lede: "Argo CD and Flux express an application dependency tree in almost opposite ways — one signal lives entirely on the parent, the other is declared by each child. Audit either one without including the object that actually carries the proof, and the same false failure shows up in both, for what turns out to be the same underlying reason.",
    body: (
      <>
        <p>A check meant to confirm a set of applications forms a legitimate dependency tree — not a pile of unrelated ones that happen to share a naming pattern — has to answer a specific question: is this child genuinely managed as part of a larger structure, or is it standing alone? Two different GitOps tools answer that question with two structurally different signals, and both of them turned out to have the same failure mode when audited incompletely.</p>
        <h2>Argo CD: the Signal Lives on the Parent</h2>
        <p>Classic Argo CD App-of-Apps has a root <code>Application</code> with <code>source.directory.recurse: true</code>, pointed at a directory of child <code>Application</code> manifests. Confirmed against a real, reconciling Argo CD v3.4.5 controller, not just documentation: the children carry no distinguishing content at all. No <code>ownerReferences</code>, nothing in their own spec that says "I belong to a tree." The entire proof that they're managed, rather than standalone, lives on the root's <code>recurse</code> flag — an object the children themselves say nothing about.</p>
        <p>Which means a check fed only the children — say, an audit scoped to "the apps my team owns," deliberately excluding a shared root someone else manages — has no way to tell two legitimately-managed children apart from two unrelated one-off Applications that happen to look similar. It reports FAIL either way, correctly reflecting that it can't confirm what it wasn't given the evidence to confirm.</p>
        <h2>Flux: the Signal Is Declared by the Child</h2>
        <p>Flux does the opposite. A child Kustomization declares its own membership explicitly: <code>spec.dependsOn: [{'{'}name: infra{'}'}]</code>, naming the parent it depends on. On paper this looks like it should be self-sufficient — the child is already saying who its parent is, no external root object required to interpret it.</p>
        <p>It isn't, for a specific reason: a name in <code>dependsOn</code> is just a string. Confirmed against a real <code>flux install</code>, not just the CRD schema: the kustomize-controller never stamps an <code>ownerReferences</code> back onto the child pointing at the parent, so nothing in the child's own live state proves that <code>infra</code> refers to something real and legitimately managed rather than a typo or a stale reference to a Kustomization that was deleted months ago. A check handed only the children — <code>payment-api</code> and <code>order-api</code>, each declaring <code>dependsOn: [{'{'}name: infra{'}'}]</code> — sees the same string both times and has no way to confirm it resolves to anything. It reports FAIL, on purpose, because a name a child claims and a name that's actually backed by a real, present resource are two different facts, and only one of them was in evidence.</p>
        <div className="article-note"><strong>Same failure, opposite mechanism</strong><p>Argo CD's proof lives on the parent and says nothing on the child. Flux's proof lives on the child and says nothing back from the parent. They fail for structurally different reasons — one because the child is silent, the other because the child's claim is unverifiable alone — but the practical consequence is identical: leave the root out of what you feed the checker, and legitimate structure looks indistinguishable from a coincidence.</p></div>
        <h2>The Same Caveat, Confirmed Twice Independently</h2>
        <p>The Argo CD finding came first, against a real cluster running a self-contained App-of-Apps example. The natural next question — does the same root-exclusion problem apply to Flux's <code>dependsOn</code> tree — got answered the same way: a real <code>flux install</code>, a root <code>infra</code> Kustomization, two dependents declaring <code>dependsOn</code> on it, and a fixture built specifically to feed the checker only the children. It failed exactly as predicted, for the reason predicted. Two different tools, two structurally different ways of expressing a tree, and the same root-exclusion caveat held in both — not because the mechanisms were similar, but because "prove this object belongs to a tree" always needs at least one object outside the one being questioned.</p>
        <h2>The General Rule</h2>
        <p>Any check that verifies membership in a hierarchy — not just GitOps app trees, but ownership graphs, dependency graphs, org-chart-shaped permission audits, anything where "is this legitimately part of a structure" is the question — has to include the structure's root in its input, not just the leaf under review. A query scoped to "only what I own" or "only the thing I'm checking" can look complete and still be structurally unable to answer the question it was asked, because the proof it needs was never in scope to begin with.</p>
        <div className="article-note"><strong>Further reading</strong><p>
          <a href="https://github.com/kyhsa93/k8s-playbook/blob/main/README.md" target="_blank" rel="noreferrer">kyhsa93/k8s-playbook</a> — both live-controller validation rounds, Argo CD and Flux, and the fixtures that reproduce each failure on purpose
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
    lede: 'Argo CD와 Flux는 애플리케이션 의존성 트리를 거의 정반대 방식으로 표현한다 — 하나는 신호가 전적으로 부모에게 있고, 다른 하나는 자식이 직접 선언한다. 둘 중 어느 쪽이든 실제 증거를 쥔 객체를 빼고 감사하면, 겉보기엔 다른 이유로 똑같은 거짓 실패가 나타난다.',
    body: (
      <>
        <p>애플리케이션 집합이 정당한 의존성 트리를 이루는지 — 우연히 이름 패턴이 비슷할 뿐인 무관한 것들의 더미가 아니라 — 확인하려는 검사는 구체적인 질문에 답해야 한다: 이 자식은 정말로 더 큰 구조의 일부로 관리되고 있는가, 아니면 혼자 서 있는가? 서로 다른 두 GitOps 도구는 이 질문에 구조적으로 다른 두 가지 신호로 답하는데, 불완전하게 감사하면 둘 다 같은 실패 방식을 보인다는 게 드러났다.</p>
        <h2>Argo CD: 신호는 부모에게 있다</h2>
        <p>전형적인 Argo CD App-of-Apps는 <code>source.directory.recurse: true</code>를 가진 루트 <code>Application</code>이 자식 <code>Application</code> 매니페스트들이 있는 디렉토리를 가리키는 구조다. 문서가 아니라 실제로 리컨사일하는 Argo CD v3.4.5 컨트롤러를 상대로 확인해보니: 자식들은 구분되는 내용을 전혀 갖고 있지 않다. <code>ownerReferences</code>도 없고, "나는 트리에 속해 있다"라고 말하는 자기 자신의 스펙도 없다. 관리되고 있다는 증명 전체가 루트의 <code>recurse</code> 플래그 하나에 있고, 자식들 자신은 그것에 대해 아무 말도 하지 않는다.</p>
        <p>그 말은, 자식들만 받은 검사 — 예를 들어 "우리 팀이 소유한 앱들"로 범위를 좁혀서 다른 팀이 관리하는 공유 루트를 의도적으로 제외한 감사 — 는 정당하게 관리되는 자식 둘을 우연히 비슷해 보이는 무관한 단독 Application 둘과 구분할 방법이 전혀 없다는 뜻이다. 어느 쪽이든 FAIL을 보고하고, 이는 확인할 근거를 받지 못했다는 걸 정확히 반영한 것이다.</p>
        <h2>Flux: 신호는 자식이 선언한다</h2>
        <p>Flux는 정반대다. 자식 Kustomization이 자신의 소속을 직접 선언한다: <code>spec.dependsOn: [{'{'}name: infra{'}'}]</code>, 자신이 의존하는 부모의 이름을 명시하는 식으로. 서류상으로는 이게 자기 완결적이어야 할 것 같다 — 자식이 이미 자기 부모가 누군지 말하고 있으니, 해석하는 데 외부 루트 객체가 필요 없어 보인다.</p>
        <p>하지만 그렇지 않다. 구체적인 이유가 있다: <code>dependsOn</code> 안의 이름은 그냥 문자열일 뿐이다. CRD 스키마가 아니라 실제 <code>flux install</code>을 상대로 확인해보니: kustomize-controller는 자식에게 부모를 가리키는 <code>ownerReferences</code>를 절대 되돌려 찍지 않는다. 그래서 자식 자신의 라이브 상태 안에는 <code>infra</code>가 오타나, 몇 달 전에 삭제된 Kustomization을 가리키는 낡은 참조가 아니라 실제로 존재하고 정당하게 관리되는 무언가를 가리킨다는 증거가 전혀 없다. 자식들만 — 각각 <code>dependsOn: [{'{'}name: infra{'}'}]</code>를 선언하는 <code>payment-api</code>와 <code>order-api</code> — 받은 검사는 두 번 다 같은 문자열을 보지만 그게 뭔가로 해석되는지 확인할 방법이 없다. 의도적으로 FAIL을 보고한다. 자식이 주장하는 이름과 실제로 존재하는 진짜 리소스가 뒷받침하는 이름은 서로 다른 사실이고, 증거로 있던 건 그중 하나뿐이었기 때문이다.</p>
        <div className="article-note"><strong>같은 실패, 반대되는 메커니즘</strong><p>Argo CD의 증명은 부모에 있고 자식에는 아무것도 남기지 않는다. Flux의 증명은 자식에 있고 부모 쪽에서 되돌아오는 확인이 없다. 구조적으로 다른 이유로 실패한다 — 하나는 자식이 침묵해서, 다른 하나는 자식의 주장 혼자서는 검증이 안 돼서 — 하지만 실질적인 결과는 똑같다: 검사기에 넘기는 것에서 루트를 빼면, 정당한 구조가 우연의 일치와 구분이 안 된다.</p></div>
        <h2>같은 캐비어트, 두 번 독립적으로 확인됨</h2>
        <p>Argo CD 쪽 발견이 먼저였다. 자기 완결적인 App-of-Apps 예제를 돌리는 실제 클러스터를 상대로. 자연스러운 다음 질문 — 같은 루트-제외 문제가 Flux의 <code>dependsOn</code> 트리에도 적용되는가 — 는 같은 방식으로 답이 나왔다: 실제 <code>flux install</code>, 루트 <code>infra</code> Kustomization, 그것에 <code>dependsOn</code>을 선언하는 의존자 둘, 그리고 검사기에 자식들만 넘기도록 특별히 만든 픽스처. 예측한 그대로, 예측한 이유로 실패했다. 서로 다른 두 도구, 트리를 표현하는 구조적으로 다른 두 방식, 그리고 두 곳 모두에서 성립하는 같은 루트-제외 캐비어트 — 메커니즘이 비슷해서가 아니라, "이 객체가 트리에 속하는지 증명하라"는 질문은 항상 그 질문의 대상이 되는 객체 바깥의 무언가를 필요로 하기 때문이다.</p>
        <h2>일반 규칙</h2>
        <p>계층 구조 소속을 검증하는 어떤 검사든 — GitOps 앱 트리뿐 아니라 소유권 그래프, 의존성 그래프, 조직도 모양의 권한 감사, "이게 정당하게 구조의 일부인가"가 질문인 모든 곳 — 는 검토 대상인 리프뿐 아니라 그 구조의 루트를 입력에 포함해야 한다. "내가 소유한 것만" 또는 "지금 검사하는 것만"으로 범위를 좁힌 쿼리는 완전해 보이면서도, 필요한 증거가 애초에 범위 안에 없었기 때문에 구조적으로 질문에 답할 수 없는 상태일 수 있다.</p>
        <div className="article-note"><strong>더 읽을거리</strong><p>
          <a href="https://github.com/kyhsa93/k8s-playbook/blob/main/README.md" target="_blank" rel="noreferrer">kyhsa93/k8s-playbook</a> — Argo CD와 Flux 두 라이브 컨트롤러 검증 라운드와, 각 실패를 의도적으로 재현하는 픽스처
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
