import PostLayout from '../../components/PostLayout';
import { useLocale, localeFromPathname } from '../../lib/locale';
import type { MetaFunction } from 'react-router';
import { createPostMeta } from '../../lib/seo';

export const meta: MetaFunction = ({ location }) =>
  createPostMeta('the-defaults-nobody-declared', localeFromPathname(location.pathname));

const content = {
  en: {
    kicker: 'Kubernetes · Reliability',
    title: (
      <>
        The Defaults<br /><em>Nobody Declared</em>
      </>
    ),
    lede: "A drift checker compares what Git declares against what a cluster is running. Pointed at a cluster that had just been applied cleanly, where nobody had touched a thing, it reported drift everywhere. The cluster wasn't lying. It was filling in fields Git never mentioned, and the checker had no way to tell the difference.",
    body: (
      <>
        <p>Detecting drift sounds like a simple diff: take what's declared in Git, take what's running, compare the two, flag what doesn't match. Validating that against a real cluster instead of hand-written fixtures meant applying a known-good manifest to a disposable <code>kind</code> cluster, dumping the live state with an honest <code>kubectl get -o yaml</code>, and comparing that capture against the Git source it came from: the same source, seconds after a clean apply, before anything had a chance to change.</p>
        <h2>A Diff That Should Have Been Empty</h2>
        <p>It wasn't. The comparison flagged drift across nearly every resource, on fields nobody had touched: <code>spec.strategy</code>, <code>imagePullPolicy</code>, <code>resources</code>, <code>dnsPolicy</code>, <code>securityContext</code>, and more, all present in the live capture and absent from the Git manifest. Not because someone had changed the cluster out-of-band; this was the very first read, immediately after apply. The API server and its admission defaulting had filled in every one of those fields on their own, the moment the resource was created, as Kubernetes is designed to do. A <code>Deployment</code> with no <code>strategy</code> specified doesn't run without one; the API server picks <code>RollingUpdate</code> and writes it back into the object's own spec. A container with no <code>imagePullPolicy</code> gets one assigned based on the image tag. None of this is drift. All of it looked like drift to a checker doing a naive full-object comparison.</p>
        <div className="article-note"><strong>The trap in "compare live to declared"</strong><p>Any tool built on that premise inherits an assumption: that what's declared and what's live should match field-for-field when nothing has changed. That assumption is false the moment a platform's own admission layer is allowed to write anything back, and Kubernetes's is, extensively, by design. A checker that doesn't account for this reports maximum drift on a cluster that's in a perfectly correct, freshly-applied state — the opposite of what a drift signal is supposed to mean.</p></div>
        <h2>The Fix Wasn't Smarter Diffing — It Was a Smaller Diff</h2>
        <p>The fix is an explicit allowlist: a fixed set of keys, <code>SERVER_DEFAULTED_KEYS</code>, known to be commonly filled in by the API server or its admission controllers, excluded from the comparison before drift is evaluated. Not inferred at runtime, not guessed from context: a maintained list of the specific fields a cluster is expected to add on its own, checked once against a real cluster's behavior rather than assumed from documentation. A field on that list showing up in the live capture but not in Git no longer counts against the resource; a field <em>not</em> on that list doing the same thing still does, correctly.</p>
        <p>A second, smaller issue rode along with the first. Containers are a list, and a naive list comparison fails the whole list the moment any one container in it has a defaulted field the others don't, even if every container is otherwise identical to what Git declared. The fix there was to diff containers by name rather than by list position, so one container's legitimate defaulting doesn't drag every sibling container in the same <code>Deployment</code> into a false positive alongside it.</p>
        <h2>Why This Is Worth Getting Right</h2>
        <p>A drift check that cries wolf on every fresh apply doesn't get ignored gently. It gets disabled, or worse, everyone learns to skim past its output because it's never clean. The entire value of a drift signal depends on silence meaning something: no output means nothing has diverged. A checker that can't tell "the platform did this automatically, as designed" from "someone changed this by hand, out-of-band, in a way Git doesn't know about" can't produce that silence, no matter how correct its comparison logic is otherwise.</p>
        <div className="article-note"><strong>The general shape of the problem</strong><p>Any tool that compares a declared source of truth against a live, running system (infra drift detectors, config-as-code plan/apply diffing, database schema comparisons against a migrations history) has to account for the runtime's own defaulting behavior, or every correct, unmodified deployment will register as diverged. That allowlist isn't a one-time task either. Which fields get auto-populated is a function of the platform's admission controllers and their versions, which means the list is something to re-verify against real behavior periodically, not something to write once and trust forever.</p></div>
        <div className="article-note"><strong>Further reading</strong><p>
          <a href="https://github.com/kyhsa93/k8s-playbook" target="_blank" rel="noreferrer">kyhsa93/k8s-playbook</a> (my example project that catalogs common Kubernetes deployment mistakes, each with a checker that finds it in a manifest; the drift check lives here, validated against a real disposable cluster rather than hand-written before/after fixtures)
        </p></div>
      </>
    ),
  },
  ko: {
    kicker: 'Kubernetes · Reliability',
    title: (
      <>
        아무도 선언하지 않은<br /><em>기본값들</em>
      </>
    ),
    lede: 'drift 검사기는 Git에 선언한 내용과 클러스터에서 실제로 돌고 있는 상태를 비교한다. 방금 깔끔하게 적용해서 아무도 손대지 않은 클러스터에 돌렸는데, 온통 drift라고 나왔다. 클러스터가 거짓말을 한 건 아니다. Git에 적지도 않은 필드를 클러스터가 알아서 채워 넣었고, 검사기는 그걸 구별할 방법이 없었다.',
    body: (
      <>
        <p>drift 탐지는 단순한 diff처럼 들린다. Git에 선언한 것과 돌고 있는 것을 가져와 비교하고, 다른 곳을 표시하면 된다. 이걸 손으로 쓴 픽스처가 아닌 실제 클러스터로 검증하려고 이렇게 했다. 정상인 걸 아는 매니페스트를 쓰고 버릴 <code>kind</code> 클러스터에 적용하고, <code>kubectl get -o yaml</code>로 라이브 상태를 그대로 덤프했다. 그리고 그 캡처를 원본 Git 소스와 비교했다. 깔끔하게 적용하고 몇 초 뒤, 뭔가 바뀔 틈도 없을 때였다.</p>
        <h2>비어 있어야 했던 diff</h2>
        <p>diff는 비어 있지 않았다. 거의 모든 리소스에서, 아무도 건드리지 않은 필드에 drift가 찍혔다. <code>spec.strategy</code>, <code>imagePullPolicy</code>, <code>resources</code>, <code>dnsPolicy</code>, <code>securityContext</code> 등이 모두 라이브 캡처에는 있고 Git 매니페스트에는 없었다. 누가 몰래 클러스터를 바꾼 것도 아니다. 적용 직후에 처음 읽은 상태였다. 리소스가 만들어지는 순간 API 서버와 admission 기본값 처리가 이 필드들을 알아서 채운 것이다. Kubernetes는 원래 그렇게 동작하도록 설계돼 있다.</p>
        <p><code>strategy</code>를 지정하지 않은 <code>Deployment</code>라고 전략 없이 도는 게 아니다. API 서버가 <code>RollingUpdate</code>를 골라 객체 스펙에 다시 써 넣는다. <code>imagePullPolicy</code>가 없는 컨테이너는 이미지 태그를 보고 값을 하나 받는다. 이 중 drift는 하나도 없다. 하지만 객체 전체를 그대로 비교하는 검사기 눈에는 전부 drift로 보였다.</p>
        <div className="article-note"><strong>"라이브와 선언 비교"에 숨은 함정</strong><p>이 전제로 만든 도구는 모두 같은 가정을 깔고 간다. 아무것도 바뀌지 않았다면 선언과 라이브 상태가 필드 하나하나까지 같아야 한다는 가정이다. 플랫폼의 admission 계층이 무언가를 다시 써 넣을 수 있다면 이 가정은 바로 깨진다. 그리고 Kubernetes는 설계상 꽤 많은 걸 써 넣는다. 이걸 고려하지 않은 검사기는 방금 적용해서 완벽하게 정상인 클러스터에 drift를 최대로 보고한다. drift 신호가 전해야 할 뜻과 정반대다.</p></div>
        <h2>똑똑한 diff 대신 작은 diff</h2>
        <p>해결책은 명시적인 허용 목록이다. API 서버나 admission 컨트롤러가 흔히 채워 넣는 것으로 알려진 키를 <code>SERVER_DEFAULTED_KEYS</code>라는 고정 집합으로 두고, drift를 판정하기 전에 비교에서 뺀다. 런타임에 추론하거나 맥락으로 짐작하지 않는다. 클러스터가 알아서 추가할 필드를 구체적으로 적어 두고 관리하는 목록이고, 문서만 믿지 않고 실제 클러스터 동작으로 한 번 확인했다. 이제 목록에 있는 필드가 라이브 캡처에만 있고 Git에 없으면 drift로 치지 않는다. 목록에 <em>없는</em> 필드가 그러면 지금처럼 drift로 잡힌다.</p>
        <p>첫 번째 문제에 작은 문제가 하나 더 딸려 있었다. 컨테이너는 리스트인데, 리스트를 통째로 비교하면 컨테이너 하나에만 기본값 필드가 붙어도 리스트 전체가 실패한다. 나머지 컨테이너가 Git 선언과 똑같아도 마찬가지다. 그래서 컨테이너를 리스트 순서로 맞추지 않고 이름으로 맞춰 비교하게 했다. 컨테이너 하나에 정당하게 붙은 기본값 때문에 같은 <code>Deployment</code> 안의 다른 컨테이너까지 오탐에 휘말리지 않게 하려는 것이다.</p>
        <h2>왜 제대로 해야 하나</h2>
        <p>깔끔하게 적용할 때마다 양치기 소년처럼 drift를 외치는 검사는 슬그머니 무시되는 정도로 끝나지 않는다. 결국 꺼진다. 더 나쁘면 한 번도 깨끗했던 적이 없으니 다들 출력을 대충 넘기는 버릇이 든다. drift 신호의 가치는 조용함에 뜻이 있다는 데서 나온다. 출력이 없으면 정말로 아무것도 어긋나지 않았다는 뜻이어야 한다. "플랫폼이 설계대로 알아서 한 것"과 "누군가 Git 모르게 손으로 바꾼 것"을 구별하지 못하면, 비교 로직이 다른 면에서 아무리 정확해도 그런 조용함을 만들 수 없다.</p>
        <div className="article-note"><strong>같은 문제는 어디에나 있다</strong><p>선언해 둔 기준을 실제로 돌고 있는 시스템과 비교하는 도구라면 다 마찬가지다. 인프라 drift 감지기, config-as-code의 plan/apply diff, 마이그레이션 이력과 데이터베이스 스키마를 비교하는 도구가 모두 그렇다. 런타임이 알아서 채우는 기본값을 고려하지 않으면, 손대지 않은 정상 배포가 매번 어긋났다고 나온다. 허용 목록도 한 번 만들고 끝낼 일이 아니다. 어떤 필드가 자동으로 채워지는지는 플랫폼의 admission 컨트롤러와 그 버전에 따라 달라진다. 한 번 써 두고 계속 믿기보다는, 실제 동작에 비춰 주기적으로 다시 확인하는 게 낫다.</p></div>
        <div className="article-note"><strong>더 볼 자료</strong><p>
          <a href="https://github.com/kyhsa93/k8s-playbook" target="_blank" rel="noreferrer">kyhsa93/k8s-playbook</a>(Kubernetes 배포 실수를 유형별로 모으고, 매니페스트에서 그 실수를 찾아내는 검사기를 붙여 둔 내 예제 프로젝트. 손으로 쓴 전후 픽스처 대신 쓰고 버리는 실제 클러스터로 검증한 drift 검사 코드가 있다)
        </p></div>
      </>
    ),
  },
};

export default function TheDefaultsNobodyDeclared() {
  const { locale } = useLocale();
  const c = content[locale];

  return (
    <PostLayout
      slug="the-defaults-nobody-declared"
      kicker={c.kicker}
      title={c.title}
      lede={c.lede}
    >
      {c.body}
    </PostLayout>
  );
}
