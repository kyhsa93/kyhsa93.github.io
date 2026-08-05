import PostLayout from '../../components/PostLayout';
import { useLocale } from '../../lib/locale';
import type { MetaFunction } from 'react-router';
import { createPostMeta } from '../../lib/seo';

export const meta: MetaFunction = () => createPostMeta('the-same-instant-two-different-timestamps');

const content = {
  en: {
    kicker: 'Backend · Reliability',
    title: (
      <>
        The Same Instant,<br /><em>Two Different Timestamps</em>
      </>
    ),
    lede: 'The exact same moment in time, serialized by the exact same database driver, produces a different string depending on which timezone the process happens to be running in. Four of five language implementations had been writing that string straight into a column with no timezone attached — UTC on a CI runner, something else entirely on a developer\'s laptop — and the fix turned out to belong in a different place in each language, for a reason worth understanding rather than memorizing.',
    body: (
      <>
        <p>One line of Node, run twice, makes the whole bug visible without reading a single line of application code:</p>
        <pre><code>{`> prepareValue(new Date('2026-08-05T00:00:00Z'))
'2026-08-05T09:00:00.000+09:00'   // process running in Asia/Seoul
'2026-08-05T00:00:00.000+00:00'   // same process, TZ=UTC`}</code></pre>
        <p>Same instant. Same driver. Two different strings, because the driver serializes a timestamp using the process's own local offset before handing it to Postgres — and a <code>TIMESTAMP</code> column with no time zone attached keeps whatever wall-clock digits it's handed and throws the offset away. Nothing about that column can tell the difference between an honest UTC write and a write from a process that happened to think it was nine hours later. Four of five languages in the repository had exactly this defect, each wearing a different costume.</p>
        <h2>Three Costumes for the Same Defect</h2>
        <p>Go's <code>time.Now()</code> returns a value carrying the host's local location, and the driver formats it accordingly — UTC on a CI runner, something else on a laptop, silently. Kotlin and Java's <code>LocalDateTime.now()</code> resolves against the JVM's default zone the same way. Java had the sharpest version of it: <code>YearMonth.now()</code>, used to name a monthly statement period and the SQS deduplication ID built from it — not just a timestamp quietly wrong, but the literal name of a period key decided by the wrong clock. Kotlin added its own variant on top: a <code>@Scheduled(cron = ...)</code> job with no <code>zone</code> attribute at all, so even after the period key itself was computed correctly in UTC, the trigger firing it could still fire on the wrong calendar day relative to that key — the fix and the thing that needed fixing living in two different places in the same file.</p>
        <h2>The Fix Belongs Somewhere Different in Each Language</h2>
        <p>Go, Java, and Kotlin all share the same underlying mechanism: reading "now" is what reads the host's zone, at the exact moment the call happens. A shared helper — wrapping the same call, forcing UTC — fixes every call site that routes through it, because the wrong value was never constructed in the first place.</p>
        <p>NestJS doesn't have that call site to fix, because a JavaScript <code>Date</code> is already an absolute instant the moment it's constructed — there's no local-zone reading anywhere in <code>new Date()</code> to correct. The divergence only appears later, at the boundary where the driver serializes that already-correct instant using the process's zone. The only place a fix can possibly live is the process itself: <code>process.env.TZ = 'UTC'</code>, set as the literal first import of <code>main.ts</code>, ahead of even the tracing setup — Node only applies a runtime <code>TZ</code> change to date operations that happen afterward, so anything imported above the pin would still see the old zone. It lives in its own file under <code>src/config/</code> rather than as a bare statement in <code>main.ts</code>, because an existing harness rule already restricts touching <code>process.env</code> to files in that one directory — the pin got moved to satisfy the rule that already existed, rather than the rule getting an exception carved into it.</p>
        <h2>A Test Runner That Quietly Refuses to Cooperate</h2>
        <p>Pinning the timezone for the running app was the easy half; making the test suite see the same pin was not. Jest's <code>setupFiles</code> looked like the obvious mechanism and simply doesn't work for this — it runs inside the sandboxed test environment, where the assignment to <code>process.env.TZ</code> never reaches the actual operating-system <code>tzset</code> call. Checked directly rather than assumed: the environment variable really did read back as <code>'UTC'</code> after the assignment, and <code>getTimezoneOffset()</code> still reported the host's real offset regardless. <code>globalSetup</code> runs before that sandbox exists at all, on the real process, which is the one place the pin actually takes hold before any worker starts.</p>
        <h2>The Only Verification That Actually Means Anything</h2>
        <p>A test suite running inside a UTC container passes trivially whether or not the underlying code is fixed — a UTC host can't distinguish a real fix from a bug that simply never had the chance to misbehave. The only verification that proves anything is running the exact same suite a second time with the process timezone deliberately set to <code>Asia/Seoul</code>. Kotlin and Java both failed by exactly nine hours before their fixes landed, and passed cleanly under both zones afterward — a clean, mechanical, unambiguous proof that the defect was real and that the fix actually addressed it, not a coincidence of wherever the test happened to run.</p>
        <p>Java's version of that verification needed one more layer, because a single self-consistent JVM has nothing external to disagree with itself — every timestamp inside one process agrees with every other timestamp in that same process, wrong or not, so a bare zone change alone doesn't automatically fail anything. Its regression test anchors specifically against <code>Instant.now()</code> — the one reading in the whole system that is already an absolute point on the timeline, impossible to get wrong by zone — and checks the persisted timestamp against it. That's what turns a defect invisible from inside a single process into one visible from outside it.</p>
        <p>Five languages now compute one thing the same way for the first time in the repository's history — not because they share a clock library, or because "just use UTC" was ever in doubt as the right rule. Because each one finally has the specific shape of fix its own runtime actually needed: a corrected reading at the call site in three of them, and a corrected process in the fourth, for a reason that was worth learning once rather than papering over with the same fix copied five times.</p>
        <div className="article-note"><strong>Further reading in the repo</strong><p>
          <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/docs/conventions.md" target="_blank" rel="noreferrer">docs/conventions.md</a> — the repo-wide timezone rule, and the table of where the fix belongs per language · <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/implementations/nestjs/examples/src/config/timezone.config.ts" target="_blank" rel="noreferrer">timezone.config.ts</a> — the process pin, and why it has to run first
        </p></div>
      </>
    ),
  },
  ko: {
    kicker: 'Backend · Reliability',
    title: (
      <>
        같은 순간,<br /><em>서로 다른 두 타임스탬프</em>
      </>
    ),
    lede: '정확히 같은 시각이, 정확히 같은 데이터베이스 드라이버에 의해 직렬화되는데도, 프로세스가 어느 시간대에서 돌고 있느냐에 따라 다른 문자열이 나온다. 5개 언어 구현체 중 4개가 바로 그 문자열을 시간대 정보 없는 컬럼에 그대로 써넣고 있었다 — CI 러너에서는 UTC, 개발자 노트북에서는 완전히 다른 무언가. 그리고 수정은 결국 언어마다 다른 자리에 있어야 했다 — 외워야 할 게 아니라 이해할 가치가 있는 이유로.',
    body: (
      <>
        <p>Node 한 줄을 두 번 실행하는 것만으로, 애플리케이션 코드를 단 한 줄도 읽지 않고 이 버그 전체를 눈으로 볼 수 있다:</p>
        <pre><code>{`> prepareValue(new Date('2026-08-05T00:00:00Z'))
'2026-08-05T09:00:00.000+09:00'   // process running in Asia/Seoul
'2026-08-05T00:00:00.000+00:00'   // same process, TZ=UTC`}</code></pre>
        <p>같은 순간. 같은 드라이버. 그런데 문자열이 둘로 갈린다 — 드라이버가 Postgres에 넘기기 전에 프로세스 자신의 로컬 오프셋을 써서 타임스탬프를 직렬화하고, 시간대 정보가 없는 <code>TIMESTAMP</code> 컬럼은 건네받은 wall-clock 숫자만 그대로 갖고 오프셋은 버리기 때문이다. 그 컬럼의 그 무엇도 정직한 UTC 쓰기와, 우연히 아홉 시간 뒤라고 착각한 프로세스의 쓰기를 구분할 수 없다. 이 저장소의 5개 언어 중 4개가 정확히 이 결함을 갖고 있었다, 각각 다른 옷을 입은 채로.</p>
        <h2>같은 결함, 세 가지 옷</h2>
        <p>go의 <code>time.Now()</code>는 호스트의 로컬 location을 담은 값을 반환하고, 드라이버는 그에 맞춰 포맷한다 — CI 러너에서는 UTC, 노트북에서는 다른 무언가, 조용히. kotlin과 java의 <code>LocalDateTime.now()</code>는 같은 방식으로 JVM의 기본 시간대를 상대로 해석된다. java는 가장 날카로운 버전을 갖고 있었다: <code>YearMonth.now()</code>가 월별 명세서 기간과 그로부터 만들어지는 SQS 중복 제거 ID의 이름을 짓는 데 쓰이고 있었다 — 조용히 틀린 타임스탬프 정도가 아니라, 기간 키의 이름 자체가 잘못된 시계에 의해 결정된 것이었다. kotlin은 자기만의 변주를 하나 더 얹었다: <code>zone</code> 속성이 전혀 없는 <code>@Scheduled(cron = ...)</code> 작업 — 그래서 기간 키 자체가 UTC로 올바르게 계산된 뒤에도, 그걸 발화시키는 트리거는 그 키를 기준으로 여전히 잘못된 달력 날짜에 발화될 수 있었다. 고쳐야 할 것과 고침이 같은 파일 안 서로 다른 두 자리에 있었던 셈이다.</p>
        <h2>수정은 언어마다 다른 자리에 있어야 했다</h2>
        <p>go, java, kotlin은 모두 같은 근본 메커니즘을 공유한다: "지금"을 읽는 행위 자체가, 호출이 일어나는 바로 그 순간 호스트의 시간대를 읽는다. 공유 헬퍼 — 같은 호출을 감싸고 UTC를 강제하는 — 는 그걸 거치는 모든 호출 지점을 고친다, 애초에 잘못된 값이 만들어지지 않게 되니까.</p>
        <p>nestjs에는 고쳐야 할 그런 호출 지점이 없다 — 자바스크립트 <code>Date</code>는 만들어지는 그 순간 이미 절대적인 시각이기 때문이다. <code>new Date()</code> 안 어디에도 바로잡을 로컬 시간대 읽기 자체가 없다. 어긋남은 나중에, 이미 올바른 그 시각을 드라이버가 프로세스의 시간대로 직렬화하는 경계에서만 나타난다. 수정이 있을 수 있는 유일한 자리는 프로세스 자신이다: <code>process.env.TZ = 'UTC'</code>를 <code>main.ts</code>의 말 그대로 첫 번째 임포트로, tracing 설정보다도 앞에 둔다 — Node는 런타임 <code>TZ</code> 변경을 그 뒤에 일어나는 날짜 연산에만 적용하므로, 이 핀보다 위에서 임포트된 건 뭐든 여전히 옛 시간대를 보게 된다. 이건 <code>main.ts</code> 안의 맨 구문이 아니라 <code>src/config/</code> 아래 자기만의 파일에 산다 — 이미 존재하던 하네스 규칙이 <code>process.env</code>를 건드리는 걸 그 디렉터리 안 파일로만 제한하고 있었기 때문이다. 이미 있던 규칙에 예외를 파는 대신, 그 규칙을 만족시키려고 핀을 그 자리로 옮겼다.</p>
        <h2>조용히 협조를 거부하는 테스트 러너</h2>
        <p>돌아가는 앱의 시간대를 고정하는 건 쉬운 절반이었다 — 테스트 스위트가 같은 고정을 보게 만드는 건 아니었다. Jest의 <code>setupFiles</code>는 당연한 메커니즘처럼 보였지만 이 목적으로는 그냥 동작하지 않는다 — 샌드박스된 테스트 환경 안에서 실행되는데, 그 안에서의 <code>process.env.TZ</code> 대입은 실제 운영체제의 <code>tzset</code> 호출에 결코 닿지 못한다. 추측 대신 직접 확인했다: 대입 이후 환경 변수는 정말로 <code>'UTC'</code>로 읽혔지만, <code>getTimezoneOffset()</code>은 여전히 호스트의 진짜 오프셋을 보고했다. <code>globalSetup</code>은 그 샌드박스가 아예 존재하기도 전에, 진짜 프로세스 위에서 실행된다 — 워커가 하나라도 시작되기 전에 핀이 실제로 자리잡는 유일한 곳이다.</p>
        <h2>실제로 의미 있는 유일한 검증</h2>
        <p>UTC 컨테이너 안에서 도는 테스트 스위트는 밑에 있는 코드가 고쳐졌든 아니든 사소하게 통과한다 — UTC 호스트는 진짜 수정과, 애초에 잘못될 기회조차 없었던 버그를 구분할 수 없다. 뭔가를 증명하는 유일한 검증은 같은 스위트를 프로세스 시간대를 의도적으로 <code>Asia/Seoul</code>로 맞춘 채 한 번 더 돌리는 것이다. kotlin과 java 모두 수정이 반영되기 전엔 정확히 9시간 차이로 실패했고, 그 뒤엔 두 시간대 모두에서 깔끔하게 통과했다 — 결함이 진짜였고 수정이 실제로 그걸 해결했다는, 테스트가 우연히 어디서 돌았는지와 무관한 깔끔하고 기계적이며 모호함 없는 증거다.</p>
        <p>java의 검증 버전은 한 겹이 더 필요했다 — 자기 자신과 모순될 외부 기준이 없는 하나의 자기 일관적인 JVM 안에서는, 그 프로세스 안의 모든 타임스탬프가 맞든 틀리든 서로 일치하기 때문에, 단순한 시간대 변경만으로는 자동으로 아무것도 실패하지 않는다. 그 회귀 테스트는 구체적으로 <code>Instant.now()</code>에 앵커를 걸었다 — 전체 시스템에서 시간대로는 틀릴 수 없는, 이미 시간축 위의 절대적인 지점인 유일한 읽기값 — 그리고 영속화된 타임스탬프를 그것과 대조한다. 이게 바로 하나의 프로세스 안에서는 보이지 않던 결함을 밖에서는 보이게 만드는 지점이다.</p>
        <p>5개 언어는 이제 이 저장소 역사상 처음으로 같은 걸 같은 방식으로 계산한다 — 같은 시계 라이브러리를 공유해서가 아니고, "그냥 UTC 쓰면 되잖아"가 애초에 옳은 규칙인지 의심스러웠던 적도 없다. 각자가 마침내 자기 런타임이 실제로 필요로 했던 정확한 모양의 수정을 갖게 됐기 때문이다: 셋에서는 호출 지점에서의 교정된 읽기, 네 번째에서는 교정된 프로세스 — 같은 수정을 다섯 번 복사해 덮는 대신, 한 번은 제대로 이해할 가치가 있는 이유로.</p>
        <div className="article-note"><strong>저장소 내 추가 자료</strong><p>
          <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/docs/conventions.md" target="_blank" rel="noreferrer">docs/conventions.md</a> — 저장소 전체의 시간대 규칙, 그리고 언어마다 수정이 있어야 할 자리를 정리한 표 · <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/implementations/nestjs/examples/src/config/timezone.config.ts" target="_blank" rel="noreferrer">timezone.config.ts</a> — 프로세스 핀, 그리고 그게 왜 가장 먼저 실행돼야 하는지
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
