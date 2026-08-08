import PostLayout from '../../components/PostLayout';
import { useLocale } from '../../lib/locale';
import type { MetaFunction } from 'react-router';
import { createPostMeta } from '../../lib/seo';

export const meta: MetaFunction = () => createPostMeta('the-defaults-nobody-declared');

const content = {
  en: {
    kicker: 'Kubernetes · Reliability',
    title: (
      <>
        The Defaults<br /><em>Nobody Declared</em>
      </>
    ),
    lede: "A drift checker compares what Git declares against what a cluster is actually running. Pointed at a cluster that had just been applied cleanly — nobody had touched a thing — it reported drift everywhere. The cluster wasn't lying. It was filling in fields Git never mentioned, and the checker had no way to tell the difference.",
    body: (
      <>
        <p>Detecting drift sounds like a simple diff: take what's declared in Git, take what's actually running, compare the two, flag what doesn't match. Validating that against a real cluster instead of hand-written fixtures meant applying a known-good manifest to a disposable <code>kind</code> cluster, dumping the live state with a genuine <code>kubectl get -o yaml</code>, and comparing that real capture against the Git source it came from — the same source, seconds after a clean apply, before anything had a chance to change.</p>
        <h2>A Diff That Should Have Been Empty</h2>
        <p>It wasn't. The comparison flagged drift across nearly every resource, on fields nobody had touched: <code>spec.strategy</code>, <code>imagePullPolicy</code>, <code>resources</code>, <code>dnsPolicy</code>, <code>securityContext</code>, and more, all present in the live capture and absent from the Git manifest. Not because someone had changed the cluster out-of-band — this was the very first read, immediately after apply. The API server and its admission defaulting had filled in every one of those fields on their own, the moment the resource was created, exactly as Kubernetes is designed to do. A <code>Deployment</code> with no <code>strategy</code> specified doesn't run without one; the API server picks <code>RollingUpdate</code> and writes it back into the object's own spec. A container with no <code>imagePullPolicy</code> gets one assigned based on the image tag. None of this is drift. All of it looked exactly like drift to a checker doing a naive full-object comparison.</p>
        <div className="article-note"><strong>The trap in "compare live to declared"</strong><p>Any tool built on that premise inherits an assumption: that what's declared and what's live should match field-for-field when nothing has changed. That assumption is false the moment a platform's own admission layer is allowed to write anything back — and Kubernetes's is, extensively, by design. A checker that doesn't account for this reports maximum drift on a cluster that's in a perfectly correct, freshly-applied state — the exact opposite of what a drift signal is supposed to mean.</p></div>
        <h2>The Fix Wasn't Smarter Diffing — It Was a Smaller Diff</h2>
        <p>The fix is an explicit allowlist: a fixed set of keys — <code>SERVER_DEFAULTED_KEYS</code> — known to be commonly filled in by the API server or its admission controllers, excluded from the comparison before drift is evaluated. Not inferred at runtime, not guessed from context — a maintained list of the specific fields a cluster is expected to add on its own, checked once against a real cluster's actual behavior rather than assumed from documentation. A field on that list showing up in the live capture but not in Git no longer counts against the resource; a field <em>not</em> on that list doing the same thing still does, correctly.</p>
        <p>A second, smaller issue rode along with the first: containers are a list, and a naive list comparison fails the whole list the moment any one container in it has a defaulted field the others don't — even if every container is otherwise identical to what Git declared. The fix there was to diff containers by name rather than by list position, so one container's legitimate defaulting doesn't drag every sibling container in the same <code>Deployment</code> into a false positive alongside it.</p>
        <h2>Why This Is Worth Getting Right</h2>
        <p>A drift check that cries wolf on every fresh apply doesn't get ignored gently — it gets disabled, or worse, everyone learns to skim past its output because it's never actually clean. The entire value of a drift signal depends on silence meaning something: no output means nothing has actually diverged. A checker that can't tell "the platform did this automatically, as designed" from "someone changed this by hand, out-of-band, in a way Git doesn't know about" can't produce that silence, no matter how correct its comparison logic is otherwise.</p>
        <div className="article-note"><strong>The general shape of the problem</strong><p>Any tool that compares a declared source of truth against a live, running system — infra drift detectors, config-as-code plan/apply diffing, database schema comparisons against a migrations history — has to account for the runtime's own defaulting behavior, or every correct, unmodified deployment will register as diverged. That allowlist isn't a one-time task either: which fields get auto-populated is a function of the platform's admission controllers and their versions, which means the list is something to re-verify against real behavior periodically, not something to write once and trust forever.</p></div>
        <div className="article-note"><strong>Further reading</strong><p>
          <a href="https://github.com/kyhsa93/k8s-playbook" target="_blank" rel="noreferrer">kyhsa93/k8s-playbook</a> — where the drift check lives, validated against a real disposable cluster rather than hand-written before/after fixtures
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
    lede: 'drift 검사기는 Git이 선언한 것과 클러스터가 실제로 돌리고 있는 것을 비교한다. 방금 깔끔하게 적용되어 아무도 손댄 적 없는 클러스터를 겨눴는데, 온통 drift를 보고했다. 클러스터가 거짓말을 한 게 아니었다. Git이 언급조차 하지 않은 필드들을 스스로 채워넣고 있었고, 검사기는 그 차이를 구분할 방법이 없었다.',
    body: (
      <>
        <p>drift를 탐지하는 건 단순한 diff처럼 들린다: Git에 선언된 걸 가져오고, 실제로 돌아가는 걸 가져와서, 둘을 비교하고, 안 맞는 걸 표시한다. 손으로 쓴 픽스처 대신 실제 클러스터를 상대로 이걸 검증한다는 건, 알려진 정상 매니페스트를 일회용 <code>kind</code> 클러스터에 적용하고, 진짜 <code>kubectl get -o yaml</code>로 라이브 상태를 덤프하고, 그 실제 캡처를 그것이 나온 Git 소스와 비교하는 걸 뜻했다 — 같은 소스를, 깔끔한 적용 직후, 뭔가 바뀔 기회가 있기도 전에.</p>
        <h2>비어있어야 했던 diff</h2>
        <p>비어있지 않았다. 비교는 거의 모든 리소스에서, 아무도 손대지 않은 필드들에서 drift를 표시했다: <code>spec.strategy</code>, <code>imagePullPolicy</code>, <code>resources</code>, <code>dnsPolicy</code>, <code>securityContext</code> 등, 전부 라이브 캡처에는 있고 Git 매니페스트에는 없었다. 누가 대역 밖에서 클러스터를 바꿔서가 아니었다 — 이건 적용 직후 첫 번째 읽기였다. API 서버와 그 admission 기본값 채우기가 리소스가 생성되는 순간 스스로 그 필드들을 전부 채워넣었다. Kubernetes가 설계상 그렇게 하도록 되어 있는 그대로. <code>strategy</code>를 지정하지 않은 <code>Deployment</code>는 그거 없이 돌아가지 않는다. API 서버가 <code>RollingUpdate</code>를 고르고 그걸 객체 자신의 스펙에 되써넣는다. <code>imagePullPolicy</code>가 없는 컨테이너는 이미지 태그에 따라 하나를 배정받는다. 이 중 어느 것도 drift가 아니다. 이 전부가, 순진하게 전체 객체를 비교하는 검사기에게는 정확히 drift처럼 보였다.</p>
        <div className="article-note"><strong>"라이브를 선언된 것과 비교"에 숨은 함정</strong><p>그 전제 위에 만들어진 어떤 도구든 하나의 가정을 물려받는다: 아무것도 바뀌지 않았다면 선언된 것과 라이브가 필드 단위로 일치해야 한다는 가정. 그 가정은 플랫폼 자신의 admission 계층이 뭔가를 되써넣는 게 허용되는 순간 거짓이 된다 — 그리고 Kubernetes는 설계상 광범위하게 그렇게 한다. 이걸 감안하지 않는 검사기는 완벽하게 정상이고 방금 적용된 클러스터에서 최대치의 drift를 보고한다 — drift 신호가 뜻해야 할 것의 정반대다.</p></div>
        <h2>수정은 더 똑똑한 diff가 아니라 더 작은 diff였다</h2>
        <p>수정은 명시적인 허용 목록이다: API 서버나 그 admission 컨트롤러가 흔히 채워넣는다고 알려진 고정된 키 집합 — <code>SERVER_DEFAULTED_KEYS</code> — 를 drift를 평가하기 전에 비교에서 제외한다. 런타임에 추론하지도, 맥락으로 추측하지도 않는다 — 문서에서 가정한 게 아니라 실제 클러스터의 실제 동작을 상대로 한 번 확인해서 유지하는, 클러스터가 스스로 추가할 것으로 예상되는 구체적인 필드 목록이다. 그 목록에 있는 필드가 라이브 캡처에는 있고 Git에는 없는 건 이제 그 리소스에 불리하게 작용하지 않는다. 목록에 <em>없는</em> 필드가 똑같이 그러면 여전히, 올바르게 작용한다.</p>
        <p>첫 번째 문제와 함께 딸려온 더 작은 두 번째 문제도 있었다: 컨테이너는 리스트이고, 순진한 리스트 비교는 그 안의 컨테이너 하나라도 다른 것들엔 없는 기본값 필드를 갖고 있으면 리스트 전체를 실패시킨다 — 다른 모든 컨테이너가 Git이 선언한 것과 완전히 동일하더라도. 그쪽 수정은 컨테이너를 리스트 위치가 아니라 이름으로 diff하는 것이었다. 컨테이너 하나의 정당한 기본값 채우기가 같은 <code>Deployment</code> 안의 다른 모든 형제 컨테이너까지 거짓 양성으로 끌고 들어가지 않도록.</p>
        <h2>왜 이걸 제대로 하는 게 중요한가</h2>
        <p>매번 깔끔하게 적용될 때마다 늑대가 나타났다고 외치는 drift 검사는 조용히 무시되지 않는다 — 꺼지거나, 더 나쁘게는 모두가 그 출력을 대충 넘겨보는 법을 배운다. 어차피 한 번도 진짜로 깨끗한 적이 없었기 때문이다. drift 신호의 존재 가치 전체는 침묵이 뭔가를 뜻한다는 데 달려 있다: 출력이 없다는 건 실제로 아무것도 발산하지 않았다는 뜻이어야 한다. "플랫폼이 설계대로 자동으로 이렇게 했다"와 "누군가 손으로, 대역 밖에서, Git이 모르는 방식으로 이걸 바꿨다"를 구분하지 못하는 검사기는, 비교 로직이 다른 면에서 아무리 정확해도 그 침묵을 만들어낼 수 없다.</p>
        <div className="article-note"><strong>이 문제의 일반적인 형태</strong><p>선언된 진실의 원천을 살아있는 실행 중인 시스템과 비교하는 어떤 도구든 — 인프라 drift 감지기, config-as-code plan/apply diff, 마이그레이션 이력을 상대로 한 데이터베이스 스키마 비교 — 런타임 자신의 기본값 채우기 동작을 감안해야 한다. 그러지 않으면 올바르고 수정되지 않은 배포마다 발산한 것으로 등록된다. 그 허용 목록도 한 번 만들고 끝나는 작업이 아니다. 어떤 필드가 자동으로 채워지는지는 플랫폼의 admission 컨트롤러와 그 버전에 달려 있고, 그 말은 이 목록이 한 번 써놓고 영원히 믿을 게 아니라 실제 동작을 상대로 주기적으로 재확인해야 할 무언가라는 뜻이다.</p></div>
        <div className="article-note"><strong>더 읽을거리</strong><p>
          <a href="https://github.com/kyhsa93/k8s-playbook" target="_blank" rel="noreferrer">kyhsa93/k8s-playbook</a> — 손으로 쓴 전/후 픽스처가 아니라 실제 일회용 클러스터를 상대로 검증된 drift 검사가 있는 곳
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
