import PostLayout from '../../components/PostLayout';
import { useLocale, localeFromPathname } from '../../lib/locale';
import type { MetaFunction } from 'react-router';
import { createPostMeta } from '../../lib/seo';

export const meta: MetaFunction = ({ location }) =>
  createPostMeta('a-tied-score-two-different-kinds-of-wrong', localeFromPathname(location.pathname));

const content = {
  en: {
    kicker: 'Kubernetes · AI Agents',
    title: (
      <>
        A Tied Score,<br /><em>Two Different Kinds of Wrong</em>
      </>
    ),
    lede: "A check that confirms a NetworkPolicy exists can't tell you what the policy lets in, and a check that confirms a promotion pipeline exists can't tell you whether it points at anything real. Two models given the same Kubernetes manifest-authoring task both scored 9/9 on the same automated checker, an exact tie, independently reproduced. Reading what each one wrote found two real defects the checker had no way to see, and they didn't cancel out. Each model was wrong in a way the other wasn't.",
    body: (
      <>
        <p>The scorer comes from my example project that catalogs common Kubernetes deployment mistakes, each paired with a check that finds it in a manifest. The task: add an internal-only service tracking parcel shipments, with bursty nightly-batch traffic, a database credential, and a required dev→staging→prod promotion pipeline with a verification gate at each stage. Two models, identical prompt, run in separate worktrees so neither could see the other's work. Both were told to run the scoring script themselves and iterate until every applicable check passed.</p>
        <h2>The Score Told Nothing Apart</h2>
        <p>Both self-reported <code>9/9 applicable checks passed (1 N/A excluded)</code>. Independently rerunning the checker against each model's committed files, from the canonical checkout rather than trusting the self-report, reproduced both numbers. On the structural axis the checker measures (resource limits, probes, TLS, RBAC scope, autoscaling sanity, promotion-gate presence), there was no daylight between them at all. Not a near-tie. An identical result, verified twice.</p>
        <div className="article-note"><strong>Worth noting on its own</strong><p>A checker that produces a tie is doing its job; it isn't obligated to find a difference where none exists on the axis it checks. The interesting part starts where a tied score would normally end the comparison.</p></div>
        <h2>A NetworkPolicy That Exists but Lets Everything In</h2>
        <p>Reading one model's <code>NetworkPolicy</code> directly turned up a rule that passes the check and shouldn't. Alongside a correctly-scoped ingress rule naming the expected webhook-gateway namespace, it added a second rule with <code>namespaceSelector: {'{'}{'}'}</code> — an empty selector, which Kubernetes matches against every namespace in the cluster, not "other internal services," as the rule's own comment claimed. That makes the first, carefully-scoped rule pointless: the policy as a whole accepts traffic from any pod in any namespace on the service's port. A real least-privilege violation, invisible to the check, because <code>check_networking.py</code>'s netpol rule only confirms <em>a</em> <code>NetworkPolicy</code> exists in the namespace, not that what it allows matches what it's supposed to allow. The other model's ingress rules named two real namespaces, with no catch-all anywhere.</p>
        <h2>A Pipeline That Exists but Points at Nothing</h2>
        <p>The gap ran the other direction on a different file. The checker's own minimal fixture for the promotion check contains only <code>Stage</code> resources, deliberately minimal, since its only job is to be scored. A real Kargo pipeline also needs a <code>Warehouse</code>, the object a <code>Stage</code>'s <code>requestedFreight[].origin</code> points at as its freight source, and typically a <code>Project</code> to contain both. One model's pipeline mirrored the minimal fixture closely enough to pass the check — and referenced a <code>Warehouse</code> that was never defined anywhere in its submission. Passed the check. Would never discover freight on a real cluster; the reference points at nothing. The other model's pipeline included the matching <code>Project</code> and <code>Warehouse</code>, meaning it had read further into the documentation than the minimum needed to satisfy the scorer, and produced something that would work if applied for real.</p>
        <div className="article-note"><strong>Neither model won cleanly</strong><p>The model with the self-defeating NetworkPolicy had the more complete, deployable promotion pipeline. The model with the correctly-scoped NetworkPolicy had the promotion pipeline that references a resource that doesn't exist. A tied structural score sat on top of two independent, unrelated quality gaps, one per model, in opposite files.</p></div>
        <h2>One More Difference the Score Never Asked About</h2>
        <p>Neither <code>runAsNonRoot</code> difference was scored, but one model's container <code>securityContext</code> went further than the other's: <code>readOnlyRootFilesystem: true</code>, <code>allowPrivilegeEscalation: false</code>, and <code>capabilities.drop: [ALL]</code>, stacked on top of the baseline <code>runAsNonRoot</code> the check looks for. The check's own least-privilege item only verifies the one field it was written to verify, so a fuller answer to the same principle simply doesn't register as a higher score.</p>
        <h2>What a Tie Means</h2>
        <p>A tied structural score does not mean tied output quality, not in either model's favor, and not by a small margin either time; a self-defeating catch-all firewall rule and a pipeline that would fail without an error to discover freight are both the kind of defect that matters in production. What it means is narrower and more useful. The checker measures what it was built to measure, correctly, and anything outside that (whether a rule's logic does what its comment claims, whether a referenced resource exists elsewhere in the same submission) has to be checked by reading the output directly, every time, independent of which model produced it or how the two scores happen to compare.</p>
        <div className="article-note"><strong>Further reading</strong><p>
          <a href="https://github.com/kyhsa93/k8s-playbook/blob/main/docs/benchmark.md" target="_blank" rel="noreferrer">docs/benchmark.md</a> (the full task, both submissions, and the complete quality-gap analysis, in my example project that catalogs common Kubernetes deployment mistakes with a checker for each)
        </p></div>
      </>
    ),
  },
  ko: {
    kicker: 'Kubernetes · AI Agents',
    title: (
      <>
        동점인 점수,<br /><em>서로 다른 두 종류의 잘못</em>
      </>
    ),
    lede: 'NetworkPolicy가 있는지 보는 검사는 그 정책이 무엇을 들여보내는지 모른다. 프로모션 파이프라인이 있는지 보는 검사는 그 파이프라인이 가리키는 대상이 있기나 한지 모른다. 두 모델에게 같은 Kubernetes 매니페스트 작성 과제를 따로 맡겼더니, 같은 자동 검사기에서 둘 다 9/9를 받았다. 완전한 동점이고, 따로 다시 돌려 봐도 같았다. 그런데 각자 쓴 파일을 읽어 보니 검사기로는 볼 수 없는 결함이 하나씩 있었다. 두 모델은 서로 다른 곳에서 틀렸다.',
    body: (
      <>
        <p>채점에 쓴 검사기는 내 예제 프로젝트에 있는 것이다. Kubernetes 배포 실수를 유형별로 모으고, 실수마다 매니페스트에서 그것을 찾아내는 검사를 붙여 둔 프로젝트다. 과제는 내부에서만 쓰는 소포 배송 추적 서비스를 추가하는 것이었다. 트래픽은 야간 배치 때 몰리고, 데이터베이스 자격 증명이 필요하다. dev→staging→prod 프로모션 파이프라인도 있어야 하고, 단계마다 검증 게이트를 둬야 한다. 두 모델에게 같은 프롬프트를 주고, 서로의 작업을 볼 수 없게 worktree를 따로 만들어 돌렸다. 둘 다 채점 스크립트를 직접 돌려 보면서, 적용되는 검사가 모두 통과할 때까지 고치라는 지시를 받았다.</p>
        <h2>점수로는 둘을 가를 수 없었다</h2>
        <p>둘 다 <code>9/9 applicable checks passed (1 N/A excluded)</code>라고 보고했다. 자체 보고를 그대로 믿지 않고, 정본 체크아웃에서 각 모델이 커밋한 파일에 검사기를 다시 돌렸다. 두 숫자 모두 그대로 나왔다.</p>
        <p>검사기가 재는 구조 축에서는 둘 사이에 아무 차이가 없었다. 리소스 제한, 프로브, TLS, RBAC 범위, 오토스케일링 설정이 말이 되는지, 프로모션 게이트가 있는지까지 전부 같았다. 근소한 차이도 아니었다. 두 번 확인한 완전히 같은 결과였다.</p>
        <div className="article-note"><strong>이것만 따로 봐도 의미가 있다</strong><p>정말로 동점이 나왔다면 검사기는 제 할 일을 한 것이다. 자기가 검사하는 축에 없는 차이까지 억지로 찾아낼 이유는 없다. 볼 만한 건 그다음이다. 보통은 점수가 같으면 비교가 거기서 끝나는데, 이번에는 거기서부터 시작했다.</p></div>
        <h2>있기는 한데 모두 들여보내는 NetworkPolicy</h2>
        <p>한 모델의 <code>NetworkPolicy</code>를 직접 읽어 보니, 검사는 통과하지만 통과하면 안 되는 규칙이 있었다. 트래픽을 받을 webhook-gateway 네임스페이스를 제대로 지정한 ingress 규칙 옆에, <code>namespaceSelector: {'{'}{'}'}</code>를 쓴 두 번째 규칙이 붙어 있었다. 빈 셀렉터는 Kubernetes에서 클러스터의 모든 네임스페이스와 매칭된다. 주석에는 "다른 내부 서비스들"이라고 적혀 있었지만 실제 범위는 클러스터 전체였다.</p>
        <p>이러면 공들여 범위를 좁힌 첫 번째 규칙이 아무 의미가 없어진다. 정책 전체로 보면 어느 네임스페이스의 어느 파드에서 오든 그 서비스 포트로 들어올 수 있다. 명백한 최소 권한 위반인데 검사에는 걸리지 않는다. <code>check_networking.py</code>의 netpol 규칙은 그 네임스페이스에 <em>어떤</em> <code>NetworkPolicy</code>든 하나 있는지만 확인한다. 그 정책이 허용하는 범위가 원래 허용해야 할 범위와 맞는지는 보지 않는다. 다른 모델의 ingress 규칙은 실제 네임스페이스 두 개만 지정했고, 전체를 여는 규칙은 어디에도 없었다.</p>
        <h2>있기는 한데 아무것도 가리키지 않는 파이프라인</h2>
        <p>다른 파일에서는 반대 방향으로 차이가 났다. 검사기에 딸린 프로모션 검사용 픽스처에는 <code>Stage</code> 리소스만 들어 있다. 채점받는 게 유일한 용도라 일부러 최소한으로 만들었다. 실제 Kargo 파이프라인에는 <code>Warehouse</code>도 있어야 한다. <code>Stage</code>의 <code>requestedFreight[].origin</code>이 freight 출처로 가리키는 객체다. 보통은 둘을 담을 <code>Project</code>도 있어야 한다.</p>
        <p>한 모델의 파이프라인은 그 최소 픽스처를 거의 그대로 따라 해서 검사를 통과했다. 그런데 제출물 어디에도 정의하지 않은 <code>Warehouse</code>를 참조하고 있었다. 검사는 통과했지만, 실제 클러스터에서는 freight를 하나도 찾지 못한다. 참조하는 대상이 없기 때문이다. 다른 모델의 파이프라인에는 짝이 맞는 <code>Project</code>와 <code>Warehouse</code>가 들어 있었다. 채점기를 만족시키는 데 필요한 것보다 문서를 더 읽었고, 실제로 적용하면 돌아갈 결과물을 만들었다는 뜻이다.</p>
        <div className="article-note"><strong>어느 쪽도 깔끔하게 이기지 못했다</strong><p>NetworkPolicy가 스스로를 무력화한 모델은 프로모션 파이프라인을 더 완전하게, 배포할 수 있는 상태로 만들었다. NetworkPolicy 범위를 제대로 좁힌 모델은 있지도 않은 리소스를 참조하는 파이프라인을 냈다. 같은 구조 점수 밑에 서로 관계없는 품질 결함이 모델마다 하나씩, 그것도 서로 다른 파일에 숨어 있었다.</p></div>
        <h2>점수가 묻지 않은 차이 하나 더</h2>
        <p><code>runAsNonRoot</code> 쪽 차이는 둘 다 채점 대상이 아니었다. 그래도 한 모델의 컨테이너 <code>securityContext</code>는 다른 모델보다 한발 더 나갔다. 검사가 확인하는 기본 <code>runAsNonRoot</code> 위에 <code>readOnlyRootFilesystem: true</code>, <code>allowPrivilegeEscalation: false</code>, <code>capabilities.drop: [ALL]</code>까지 얹었다. 검사의 최소 권한 항목은 확인하도록 만든 필드 하나만 본다. 같은 원칙을 더 철저히 지켜도 점수는 올라가지 않는다.</p>
        <h2>동점이 뜻하는 것</h2>
        <p>구조 점수가 같다고 산출물 품질이 같은 건 아니다. 어느 한쪽이 나았다는 말도 아니고, 차이가 작았다는 말도 아니다. 클러스터 전체에 문을 여는 방화벽 규칙도, 에러 없이 freight를 못 찾는 파이프라인도 프로덕션에서는 둘 다 문제가 되는 결함이다.</p>
        <p>동점이 말해 주는 건 그보다 좁고, 그래서 더 쓸모 있다. 검사기는 재도록 만든 것을 제대로 잰다. 그 바깥은 산출물을 직접 읽어서 확인하는 수밖에 없다. 규칙의 로직이 주석에 적힌 대로 동작하는지, 참조한 리소스가 같은 제출물 안에 정말 있는지 같은 것들이다. 어느 모델이 만들었든, 두 점수가 어떻게 나왔든 매번 그렇게 읽어야 한다.</p>
        <div className="article-note"><strong>더 볼 자료</strong><p>
          <a href="https://github.com/kyhsa93/k8s-playbook/blob/main/docs/benchmark.md" target="_blank" rel="noreferrer">docs/benchmark.md</a>(Kubernetes 배포 실수를 유형별로 모으고 실수마다 검사기를 붙여 둔 내 예제 프로젝트의 과제 전체와 두 제출물, 품질 결함 분석)
        </p></div>
      </>
    ),
  },
};

export default function ATiedScoreTwoDifferentKindsOfWrong() {
  const { locale } = useLocale();
  const c = content[locale];

  return (
    <PostLayout
      slug="a-tied-score-two-different-kinds-of-wrong"
      kicker={c.kicker}
      title={c.title}
      lede={c.lede}
    >
      {c.body}
    </PostLayout>
  );
}
