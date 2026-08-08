import PostLayout from '../../components/PostLayout';
import { useLocale } from '../../lib/locale';
import type { MetaFunction } from 'react-router';
import { createPostMeta } from '../../lib/seo';

export const meta: MetaFunction = () => createPostMeta('a-tied-score-two-different-kinds-of-wrong');

const content = {
  en: {
    kicker: 'Kubernetes · AI Agents',
    title: (
      <>
        A Tied Score,<br /><em>Two Different Kinds of Wrong</em>
      </>
    ),
    lede: "Two models, the same Kubernetes manifest-authoring task, run independently. Both scored 9/9 on the harness — an exact tie, independently reproduced. Reading what each one actually wrote found two real defects the harness has no way to see, and they didn't cancel out. Each model was wrong in a way the other wasn't.",
    body: (
      <>
        <p>The task: add an internal-only service tracking parcel shipments, with bursty nightly-batch traffic, a database credential, and a required dev→staging→prod promotion pipeline with a verification gate at each stage. Two models, identical prompt, run in separate worktrees so neither could see the other's work. Both were told to run the scoring harness themselves and iterate until every applicable check passed.</p>
        <h2>The Score Told Nothing Apart</h2>
        <p>Both self-reported <code>9/9 applicable checks passed (1 N/A excluded)</code>. Independently rerunning the harness against each model's actual committed files, from the canonical checkout rather than trusting the self-report, reproduced both numbers exactly. On the structural axis the harness measures — resource limits, probes, TLS, RBAC scope, autoscaling sanity, promotion-gate presence — there was no daylight between them at all. Not a near-tie. An identical result, verified twice.</p>
        <div className="article-note"><strong>Worth noting on its own</strong><p>A harness that produces a genuine tie is doing its job — it isn't obligated to find a difference where none exists on the axis it checks. The interesting part starts exactly where a tied score would normally end the comparison.</p></div>
        <h2>A NetworkPolicy That Defeats Itself</h2>
        <p>Reading one model's <code>NetworkPolicy</code> directly turned up a rule that passes the check and shouldn't. Alongside a correctly-scoped ingress rule naming the expected webhook-gateway namespace, it added a second rule with <code>namespaceSelector: {'{'}{'}'}</code> — an empty selector, which Kubernetes matches against every namespace in the cluster, not "other internal services," as the rule's own comment claimed. That makes the first, carefully-scoped rule pointless: the policy as a whole accepts traffic from any pod in any namespace on the service's port. A real least-privilege violation, invisible to the check, because <code>check_networking.py</code>'s netpol rule only confirms <em>a</em> <code>NetworkPolicy</code> exists in the namespace — not that what it actually allows matches what it's supposed to allow. The other model's ingress rules named exactly two real namespaces, with no catch-all anywhere.</p>
        <h2>A Promotion Pipeline That References Nothing</h2>
        <p>The gap ran the other direction on a different file. This repo's own minimal fixture for the promotion check contains only <code>Stage</code> resources — deliberately minimal, since its only job is to be scored. A real Kargo pipeline also needs a <code>Warehouse</code>, the object a <code>Stage</code>'s <code>requestedFreight[].origin</code> actually points at as its freight source, and typically a <code>Project</code> to contain both. One model's pipeline mirrored the minimal fixture closely enough to pass the check — and referenced a <code>Warehouse</code> that was never defined anywhere in its submission. Passed the check. Would never discover freight on a real cluster; the reference points at nothing. The other model's pipeline included the matching <code>Project</code> and <code>Warehouse</code>, meaning it had read further into the actual documentation than the minimum needed to satisfy the scorer, and produced something that would work if applied for real.</p>
        <div className="article-note"><strong>Neither model won cleanly</strong><p>The model with the self-defeating NetworkPolicy had the more complete, actually-deployable promotion pipeline. The model with the correctly-scoped NetworkPolicy had the promotion pipeline that references a resource that doesn't exist. A tied structural score sat on top of two independent, unrelated quality gaps, one per model, in opposite files.</p></div>
        <h2>One More Difference the Score Never Asked About</h2>
        <p>Neither <code>runAsNonRoot</code> difference was scored, but one model's container <code>securityContext</code> went further than the other's: <code>readOnlyRootFilesystem: true</code>, <code>allowPrivilegeEscalation: false</code>, and <code>capabilities.drop: [ALL]</code>, stacked on top of the baseline <code>runAsNonRoot</code> the check actually looks for. The check's own least-privilege item only verifies the one field it was written to verify — a fuller answer to the same principle simply doesn't register as a higher score.</p>
        <h2>What a Tie Actually Means</h2>
        <p>A tied structural score does not mean tied output quality — not in either model's favor, and not by a small margin either time; a self-defeating catch-all firewall rule and a pipeline that would silently fail to discover freight are both the kind of defect that matters in production. What it means is narrower and more useful: the harness measures what it was built to measure, correctly, and anything outside that — whether a rule's logic actually does what its comment claims, whether a referenced resource actually exists elsewhere in the same submission — has to be checked by reading the output directly, every time, independent of which model produced it or how the two scores happen to compare.</p>
        <div className="article-note"><strong>Further reading</strong><p>
          <a href="https://github.com/kyhsa93/k8s-playbook/blob/main/docs/benchmark.md" target="_blank" rel="noreferrer">docs/benchmark.md</a> — the full run, including both submissions' complete quality-gap analysis
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
    lede: '두 모델이 같은 Kubernetes 매니페스트 작성 과제를 각자 독립적으로 수행했다. 둘 다 하네스에서 9/9를 받았다 — 정확히 동점, 독립적으로 재확인됨. 각자 실제로 무엇을 썼는지 읽어보니 하네스가 볼 수 없는 진짜 결함이 하나씩 있었고, 둘은 서로 상쇄되지 않았다. 각 모델은 서로 다른 방식으로 틀려 있었다.',
    body: (
      <>
        <p>과제: 야간 배치 트래픽이 몰리는, 외부에 노출되지 않는 내부 전용 소포 추적 서비스를 추가하되, 데이터베이스 자격증명과 각 단계마다 검증 게이트가 있는 dev→staging→prod 프로모션 파이프라인이 필요하다. 두 모델, 동일한 프롬프트, 서로의 작업을 볼 수 없도록 별도 worktree에서 실행. 둘 다 채점 하네스를 직접 돌려보고 적용 가능한 모든 검사가 통과할 때까지 반복하라는 지시를 받았다.</p>
        <h2>점수는 아무것도 구분해내지 못했다</h2>
        <p>둘 다 <code>9/9 applicable checks passed (1 N/A excluded)</code>를 자체 보고했다. 자체 보고를 믿지 않고 정본 체크아웃에서 각 모델이 실제로 커밋한 파일을 상대로 하네스를 독립적으로 재실행하자 두 숫자 모두 정확히 재현됐다. 하네스가 측정하는 구조적 축 — 리소스 제한, 프로브, TLS, RBAC 범위, 오토스케일링 합리성, 프로모션 게이트 존재 여부 — 에서는 둘 사이에 아무 차이도 없었다. 근소한 차이가 아니다. 두 번 검증된 완전히 동일한 결과였다.</p>
        <div className="article-note"><strong>그 자체로 눈여겨볼 만한 점</strong><p>진짜 동점을 만들어내는 하네스는 제 몫을 하고 있는 것이다 — 자신이 검사하는 축에 존재하지 않는 차이를 억지로 찾아낼 의무는 없다. 흥미로운 부분은 정확히 동점인 점수가 보통이라면 비교를 끝냈을 지점에서 시작된다.</p></div>
        <h2>스스로를 무력화하는 NetworkPolicy</h2>
        <p>한 모델의 <code>NetworkPolicy</code>를 직접 읽어보니 검사는 통과하지만 그래서는 안 되는 규칙이 하나 있었다. 예상되는 webhook-gateway 네임스페이스를 정확히 지정한 규칙 옆에, <code>namespaceSelector: {'{'}{'}'}</code>를 가진 두 번째 규칙이 추가돼 있었다 — 빈 셀렉터는 Kubernetes에서 클러스터의 모든 네임스페이스와 매칭된다. 그 규칙 자신의 주석이 주장하는 "다른 내부 서비스들"이 아니라. 그러면 첫 번째의 정교하게 범위를 좁힌 규칙은 무의미해진다: 정책 전체가 결국 어떤 네임스페이스의 어떤 파드에서 온 트래픽이든 그 서비스 포트로 받아들이게 된다. 진짜 최소 권한 원칙 위반이지만 검사에는 보이지 않는다. <code>check_networking.py</code>의 netpol 규칙은 그 네임스페이스에 <em>어떤</em> <code>NetworkPolicy</code>가 존재하는지만 확인할 뿐, 그게 실제로 허용하는 것이 원래 허용해야 할 것과 일치하는지는 확인하지 않기 때문이다. 다른 모델의 ingress 규칙들은 정확히 실제 네임스페이스 두 개만 지정했고, 어디에도 캐치올이 없었다.</p>
        <h2>아무것도 가리키지 않는 프로모션 파이프라인</h2>
        <p>간극은 다른 파일에서 반대 방향으로 나타났다. 이 저장소 자신의 프로모션 검사용 최소 픽스처는 <code>Stage</code> 리소스만 담고 있다 — 채점되는 것만이 유일한 임무이기 때문에 의도적으로 최소한이다. 실제 Kargo 파이프라인은 <code>Warehouse</code>도 필요하다. <code>Stage</code>의 <code>requestedFreight[].origin</code>이 실제로 가리키는, freight의 출처가 되는 객체다. 그리고 보통 둘 다 담을 <code>Project</code>도 필요하다. 한 모델의 파이프라인은 검사를 통과할 만큼 충분히 최소 픽스처를 그대로 따라갔고 — 자기 제출물 어디에도 정의되지 않은 <code>Warehouse</code>를 참조했다. 검사는 통과했다. 실제 클러스터에서는 절대 freight를 발견하지 못할 것이다. 참조가 아무것도 가리키지 않기 때문이다. 다른 모델의 파이프라인은 짝이 맞는 <code>Project</code>와 <code>Warehouse</code>를 포함하고 있었다. 즉 채점기를 만족시키는 데 필요한 최소한보다 실제 문서를 더 깊이 읽었고, 실제로 적용하면 동작할 무언가를 만들어냈다는 뜻이다.</p>
        <div className="article-note"><strong>어느 쪽도 깔끔하게 이기지 못했다</strong><p>스스로를 무력화하는 NetworkPolicy를 가진 모델이 더 완전하고 실제로 배포 가능한 프로모션 파이프라인을 갖고 있었다. 올바르게 범위를 좁힌 NetworkPolicy를 가진 모델은 존재하지 않는 리소스를 참조하는 프로모션 파이프라인을 갖고 있었다. 동점인 구조적 점수 위에, 서로 무관하고 독립적인 품질 결함 두 개가 각 모델마다 하나씩, 서로 다른 파일에 얹혀 있었다.</p></div>
        <h2>점수가 애초에 묻지 않았던 차이 하나 더</h2>
        <p><code>runAsNonRoot</code> 관련 차이는 둘 다 채점 대상이 아니었지만, 한 모델의 컨테이너 <code>securityContext</code>는 다른 모델보다 더 나아갔다: 검사가 실제로 확인하는 기본값 <code>runAsNonRoot</code> 위에 <code>readOnlyRootFilesystem: true</code>, <code>allowPrivilegeEscalation: false</code>, <code>capabilities.drop: [ALL]</code>까지 쌓았다. 검사 자신의 최소 권한 항목은 자신이 확인하도록 작성된 딱 그 필드 하나만 검증한다 — 같은 원칙에 대한 더 완전한 답이라고 해서 더 높은 점수로 이어지지는 않는다.</p>
        <h2>동점이 실제로 뜻하는 것</h2>
        <p>동점인 구조적 점수는 동등한 산출물 품질을 뜻하지 않는다 — 어느 모델 쪽으로도 아니고, 사소한 차이도 아니다. 스스로를 무력화하는 캐치올 방화벽 규칙과 조용히 freight를 발견하지 못하는 파이프라인은 둘 다 프로덕션에서 중요한 종류의 결함이다. 이게 실제로 뜻하는 건 더 좁고 더 쓸모 있다: 하네스는 자신이 검사하도록 만들어진 것을 정확히 측정한다. 그리고 그 바깥에 있는 것 — 규칙의 로직이 자기 주석의 주장대로 실제로 동작하는지, 참조된 리소스가 같은 제출물 다른 곳에 실제로 존재하는지 — 는 어떤 모델이 만들었든, 두 점수가 어떻게 비교되든 상관없이 매번 직접 산출물을 읽어서 확인해야 한다.</p>
        <div className="article-note"><strong>더 읽을거리</strong><p>
          <a href="https://github.com/kyhsa93/k8s-playbook/blob/main/docs/benchmark.md" target="_blank" rel="noreferrer">docs/benchmark.md</a> — 전체 실행 내역과 두 제출물의 완전한 품질 결함 분석
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
