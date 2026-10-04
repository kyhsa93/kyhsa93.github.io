import PostLayout from '../../components/PostLayout';
import { useLocale, localeFromPathname } from '../../lib/locale';
import type { MetaFunction } from 'react-router';
import { createPostMeta } from '../../lib/seo';

export const meta: MetaFunction = ({ location }) =>
  createPostMeta('the-same-instant-two-different-timestamps', localeFromPathname(location.pathname));

const content = {
  en: {
    kicker: 'Backend · Reliability',
    title: (
      <>
        The Same Instant,<br /><em>Two Different Timestamps</em>
      </>
    ),
    lede: 'The same moment in time, serialized by the same database driver, produces a different string depending on which timezone the process happens to be running in. Four of five language implementations had been writing that string straight into a column with no timezone attached (UTC on a CI runner, something else entirely on a developer\'s laptop), and the fix turned out to belong in a different place in each language, for a reason worth understanding rather than memorizing.',
    body: (
      <>
        <p>One line of Node, run twice, makes the whole bug visible without reading a single line of application code:</p>
        <pre><code>{`> prepareValue(new Date('2026-08-05T00:00:00Z'))
'2026-08-05T09:00:00.000+09:00'   // process running in Asia/Seoul
'2026-08-05T00:00:00.000+00:00'   // same process, TZ=UTC`}</code></pre>
        <p>Same instant. Same driver. Two different strings, because the driver serializes a timestamp using the process's own local offset before handing it to Postgres, and a <code>TIMESTAMP</code> column with no time zone attached keeps whatever wall-clock digits it's handed and throws the offset away. Nothing about that column can tell the difference between an honest UTC write and a write from a process that happened to think it was nine hours later. Four of five languages in the repository had this defect, each wearing a different costume.</p>
        <h2>Three Costumes for the Same Defect</h2>
        <p>Go's <code>time.Now()</code> returns a value carrying the host's local location, and the driver formats it accordingly: UTC on a CI runner, something else on a laptop, with no warning either way. Kotlin and Java's <code>LocalDateTime.now()</code> resolves against the JVM's default zone the same way. Java had the sharpest version of it. <code>YearMonth.now()</code> was used to name a monthly statement period and the SQS deduplication ID built from it, so this wasn't just a timestamp that was off but the literal name of a period key decided by the wrong clock. Kotlin added its own variant on top: a <code>@Scheduled(cron = ...)</code> job with no <code>zone</code> attribute at all, so even after the period key itself was computed correctly in UTC, the trigger firing it could still fire on the wrong calendar day relative to that key — the fix and the thing that needed fixing living in two different places in the same file.</p>
        <h2>The Fix Belongs Somewhere Different in Each Language</h2>
        <p>Go, Java, and Kotlin all share the same underlying mechanism: reading "now" is what reads the host's zone, at the moment the call happens. A shared helper that wraps the same call and forces UTC fixes every call site that routes through it, because the wrong value is never constructed in the first place.</p>
        <p>NestJS doesn't have that call site to fix, because a JavaScript <code>Date</code> is already an absolute instant the moment it's constructed; there's no local-zone reading anywhere in <code>new Date()</code> to correct. The divergence only appears later, at the boundary where the driver serializes that already-correct instant using the process's zone. The only place a fix can possibly live is the process itself: <code>process.env.TZ = 'UTC'</code>, set as the literal first import of <code>main.ts</code>, ahead of even the tracing setup. Node only applies a runtime <code>TZ</code> change to date operations that happen afterward, so anything imported above the pin would still see the old zone. It lives in its own file under <code>src/config/</code> rather than as a bare statement in <code>main.ts</code>, because an existing harness rule already restricts touching <code>process.env</code> to files in that one directory. The pin got moved to satisfy the rule that already existed, rather than the rule getting an exception carved into it.</p>
        <h2>A Test Runner That Quietly Refuses to Cooperate</h2>
        <p>Pinning the timezone for the running app was the easy half; making the test suite see the same pin was not. Jest's <code>setupFiles</code> looked like the obvious mechanism and simply doesn't work for this. It runs inside the sandboxed test environment, where the assignment to <code>process.env.TZ</code> never reaches the operating-system <code>tzset</code> call. Checked directly rather than assumed: the environment variable did read back as <code>'UTC'</code> after the assignment, and <code>getTimezoneOffset()</code> still reported the host's own offset regardless. <code>globalSetup</code> runs before that sandbox exists at all, on the real process, which is the one place the pin takes hold before any worker starts.</p>
        <h2>The Only Verification That Means Anything</h2>
        <p>A test suite running inside a UTC container passes trivially whether or not the underlying code is fixed. A UTC host can't distinguish a real fix from a bug that simply never had the chance to misbehave. The only verification that proves anything is running the same suite a second time with the process timezone deliberately set to <code>Asia/Seoul</code>. Kotlin and Java both failed by nine hours before their fixes landed, and passed cleanly under both zones afterward: a clean, mechanical, unambiguous proof that the defect was real and that the fix addressed it, not a coincidence of wherever the test happened to run.</p>
        <p>Java's version of that verification needed one more layer, because a single self-consistent JVM has nothing external to disagree with itself. Every timestamp inside one process agrees with every other timestamp in that same process, wrong or not, so a bare zone change alone doesn't automatically fail anything. Its regression test anchors specifically against <code>Instant.now()</code> (the one reading in the whole system that is already an absolute point on the timeline, impossible to get wrong by zone) and checks the persisted timestamp against it. That's what turns a defect invisible from inside a single process into one visible from outside it.</p>
        <p>Five languages now compute one thing the same way for the first time in the repository's history — not because they share a clock library, or because "just use UTC" was ever in doubt as the right rule. Because each one finally has the specific shape of fix its own runtime needed: a corrected reading at the call site in three of them, and a corrected process in the fourth, for a reason that was worth learning once rather than papering over with the same fix copied five times.</p>
        <div className="article-note"><strong>Further reading in the repo</strong><p>
          <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/docs/conventions.md" target="_blank" rel="noreferrer">docs/conventions.md</a> (the repo-wide timezone rule, and the table of where the fix belongs per language) · <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/implementations/nestjs/examples/src/config/timezone.config.ts" target="_blank" rel="noreferrer">timezone.config.ts</a> (the process pin, and why it has to run first)
        </p></div>
      </>
    ),
  },
  ko: {
    kicker: 'Backend · Reliability',
    title: (
      <>
        같은 순간인데<br /><em>타임스탬프는 둘</em>
      </>
    ),
    lede: '같은 시각을 같은 데이터베이스 드라이버로 직렬화해도, 프로세스가 어느 시간대에서 도느냐에 따라 문자열이 달라진다. 5개 언어 구현 중 4개가 그 문자열을 시간대 정보 없는 컬럼에 그대로 넣고 있었다. CI 러너에서는 UTC로, 개발자 노트북에서는 전혀 다른 시각으로 들어갔다. 고칠 자리도 언어마다 달랐다. 외워 둘 일은 아니고, 왜 그런지 한 번 이해해 둘 만한 이유가 있다.',
    body: (
      <>
        <p>Node에서 한 줄을 두 번 돌려 보면, 애플리케이션 코드를 한 줄도 읽지 않고 이 버그를 통째로 볼 수 있다.</p>
        <pre><code>{`> prepareValue(new Date('2026-08-05T00:00:00Z'))
'2026-08-05T09:00:00.000+09:00'   // process running in Asia/Seoul
'2026-08-05T00:00:00.000+00:00'   // same process, TZ=UTC`}</code></pre>
        <p>시각도 같고 드라이버도 같은데 문자열은 둘이다. 드라이버는 타임스탬프를 Postgres에 넘기기 전에 프로세스의 로컬 오프셋으로 직렬화한다. 그런데 시간대 정보가 없는 <code>TIMESTAMP</code> 컬럼은 받은 벽시계 숫자만 남기고 오프셋은 버린다. 그러니 컬럼만 봐서는 제대로 된 UTC 값인지, 자기가 9시간 뒤에 있다고 여긴 프로세스가 쓴 값인지 가릴 수 없다. 내 저장소의 5개 언어 중 4개에 이 결함이 있었고, 언어마다 생김새가 달랐다.</p>
        <h2>결함 하나, 생김새는 셋</h2>
        <p>Go의 <code>time.Now()</code>는 호스트의 로컬 location을 담은 값을 돌려주고, 드라이버는 그대로 포맷한다. CI 러너에서는 UTC, 노트북에서는 다른 값이 되는데 아무 경고도 없다. Kotlin과 Java의 <code>LocalDateTime.now()</code>도 같은 식으로 JVM 기본 시간대를 따른다.</p>
        <p>Java 쪽이 가장 심했다. 월별 명세서 기간의 이름을 <code>YearMonth.now()</code>로 정하고, 그 이름으로 SQS 중복 제거 ID까지 만들고 있었다. 타임스탬프 하나가 틀리는 정도에서 그치지 않고, 기간 키 이름 자체를 엉뚱한 시계가 정한 셈이다. Kotlin에는 하나가 더 있었다. <code>@Scheduled(cron = ...)</code> 작업에 <code>zone</code> 속성이 아예 없었다. 그래서 기간 키를 UTC로 제대로 계산하게 고친 뒤에도, 작업을 깨우는 트리거는 그 키 기준으로 엉뚱한 날짜에 돌 수 있었다. 고친 곳과 고쳐야 할 곳이 같은 파일 안 두 자리에 따로 있었다.</p>
        <h2>고칠 자리는 언어마다 다르다</h2>
        <p>Go, Java, Kotlin은 원리가 같다. "지금"을 읽는 호출이, 호출하는 그 순간 호스트의 시간대도 함께 읽는다. 그래서 같은 호출을 감싸 UTC를 강제하는 공용 헬퍼 하나면, 그 헬퍼를 거치는 호출 지점이 전부 고쳐진다. 잘못된 값이 처음부터 만들어지지 않기 때문이다.</p>
        <p>NestJS에는 이렇게 고칠 호출 지점이 없다. 자바스크립트 <code>Date</code>는 만드는 순간 이미 절대 시각이라, <code>new Date()</code> 안에는 바로잡을 로컬 시간대 읽기가 없다. 어긋남은 나중에, 이미 맞는 시각을 드라이버가 프로세스 시간대로 직렬화하는 경계에서 생긴다. 그러니 고칠 수 있는 곳은 프로세스 자체뿐이다. <code>process.env.TZ = 'UTC'</code>를 <code>main.ts</code>의 가장 첫 임포트로, tracing 설정보다도 앞에 둔다. Node는 실행 중에 바꾼 <code>TZ</code>를 그 뒤의 날짜 연산에만 적용하므로, 이 설정보다 먼저 임포트된 코드는 옛 시간대를 본다.</p>
        <p>이 설정은 <code>main.ts</code>에 한 줄로 넣지 않고 <code>src/config/</code> 아래 별도 파일로 뺐다. <code>process.env</code>는 그 디렉터리 안 파일에서만 건드릴 수 있다는 하네스 규칙이 이미 있었기 때문이다. 규칙에 예외를 뚫는 대신, 규칙에 맞게 설정 위치를 옮겼다.</p>
        <h2>말없이 협조하지 않는 테스트 러너</h2>
        <p>돌아가는 앱의 시간대를 고정하는 건 쉬운 쪽이었다. 테스트에도 같은 고정이 먹히게 하는 게 어려웠다. Jest의 <code>setupFiles</code>가 딱 맞는 자리처럼 보였지만, 이 용도로는 동작하지 않는다. 이 파일은 샌드박스로 격리된 테스트 환경 안에서 돌고, 거기서 <code>process.env.TZ</code>에 값을 넣어도 운영체제의 <code>tzset</code> 호출까지 닿지 않는다.</p>
        <p>짐작으로 넘기지 않고 직접 확인했다. 값을 넣은 뒤 환경 변수를 읽으면 분명히 <code>'UTC'</code>가 나오는데, <code>getTimezoneOffset()</code>은 여전히 호스트의 원래 오프셋을 돌려줬다. <code>globalSetup</code>은 샌드박스가 생기기도 전에 진짜 프로세스에서 돈다. 워커가 하나라도 뜨기 전에 시간대 고정이 먹히는 곳은 여기뿐이다.</p>
        <h2>의미 있는 검증은 하나뿐이다</h2>
        <p>UTC 컨테이너 안에서 도는 테스트는 코드를 고쳤든 안 고쳤든 그냥 통과한다. UTC 호스트에서는 제대로 고친 코드와, 틀릴 기회가 없었을 뿐인 버그를 구별할 수 없다. 뭔가를 증명하는 방법은 하나다. 같은 테스트를 프로세스 시간대를 일부러 <code>Asia/Seoul</code>로 맞춰 한 번 더 돌리는 것이다. Kotlin과 Java 모두 고치기 전에는 딱 9시간 차이로 실패했고, 고친 뒤에는 두 시간대 모두에서 통과했다. 테스트가 어디서 돌았느냐는 우연과 상관없이, 결함이 진짜였고 수정이 그걸 해결했다는 깔끔한 증거다.</p>
        <p>Java는 한 단계가 더 필요했다. JVM 하나 안에서는 모든 타임스탬프가 맞든 틀리든 서로 일관되게 어긋난다. 비교할 바깥 기준이 없으니, 시간대만 바꿔서는 실패하는 테스트가 저절로 생기지 않는다. 그래서 회귀 테스트는 <code>Instant.now()</code>를 기준점으로 삼았다. 시스템 전체에서 이미 시간축 위의 절대 지점이라 시간대 때문에 틀릴 수 없는 유일한 값이다. 저장된 타임스탬프를 이 값과 대조하면, 프로세스 안에서는 안 보이던 결함이 밖에서 보이게 된다.</p>
        <p>5개 언어가 내 저장소에서 처음으로 이 값을 같은 방식으로 계산한다. 같은 시계 라이브러리를 써서 그런 게 아니고, "UTC를 쓰면 된다"는 규칙을 의심한 적도 없다. 언어마다 자기 런타임에 맞는 모양의 수정을 비로소 갖췄기 때문이다. 셋은 호출 지점에서 읽는 값을 고쳤고, 나머지 하나는 프로세스를 고쳤다. 같은 수정을 다섯 번 복사해 덮는 것보다, 이유를 한 번 제대로 알아 두는 편이 나았다.</p>
        <div className="article-note"><strong>저장소에서 더 볼 것</strong><p>
          <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/docs/conventions.md" target="_blank" rel="noreferrer">docs/conventions.md</a>(저장소 전체의 시간대 규칙과, 언어별로 고칠 자리를 정리한 표) · <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/implementations/nestjs/examples/src/config/timezone.config.ts" target="_blank" rel="noreferrer">timezone.config.ts</a>(프로세스 시간대 고정 코드와, 왜 가장 먼저 돌아야 하는지)
        </p></div>
      </>
    ),
  },
};

export default function TheSameInstantTwoDifferentTimestamps() {
  const { locale } = useLocale();
  const c = content[locale];

  return (
    <PostLayout
      slug="the-same-instant-two-different-timestamps"
      kicker={c.kicker}
      title={c.title}
      lede={c.lede}
    >
      {c.body}
    </PostLayout>
  );
}
