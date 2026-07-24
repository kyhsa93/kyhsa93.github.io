import PostLayout from '../../components/PostLayout';
import { useLocale } from '../../lib/locale';

const content = {
  en: {
    kicker: 'Testing · Reliability',
    title: (
      <>
        The Bugs<br /><em>Unit Tests Can't See</em>
      </>
    ),
    lede: "A mocked repository never opens a real Postgres connection. A fake HTTP client never triggers a real JDK retry bug. Four real bugs, and every one of them needed real infrastructure to even exist.",
    body: (
      <>
        <p>Every one of these bugs passed every unit test that existed at the time. That's not a failure of the unit tests — they were testing the things they could reach. The problem is that some failure modes only exist at the boundary between your code and something real: a real database connection lifecycle, a real HTTP client's retry logic, a real message queue's deduplication window. A fake stands in for the interface, not the failure mode.</p>
        <h2>The Lob Stream That Closed Too Early</h2>
        <p>Migrating the Outbox from a synchronous same-process drain to an async SQS-based poller/consumer split introduced a real regression, caught only during verification against a real database: <code>OutboxPoller.poll()</code> was missing <code>@Transactional</code>. The payload column is a JPA <code>@Lob</code>, loaded lazily — and without the method itself being a transaction boundary, the session used for the query was already closed by the time the loop tried to stream the payload back out.</p>
        <pre><code>{`// Why @Transactional is needed: OutboxEvent.payload, loaded by
// findByProcessedFalseOrderByCreatedAtAsc(), is an @Lob column — if this method itself isn't a
// transaction boundary, the session/connection used for the query is already returned by the
// time the loop below tries to lazily stream event.getPayload(), causing an
// "Unable to access lob stream" exception and silently publishing nothing.
@Scheduled(fixedDelay = 1000)
@Transactional
public void poll() { /* ... */ }`}</code></pre>
        <p>A mocked repository returns a plain in-memory object; it has no session to close, no LOB to stream, and no way to reproduce this. It needed a real Hibernate session against a real Postgres connection, closing at a real transaction boundary, before this exception could exist at all.</p>
        <h2>The 401 Nobody Had Actually Tested Before</h2>
        <p>Fixing the authentication bypass covered in an earlier post meant writing, for the first time in either Spring Boot port, a test that actually asserts a real 401 response. That test immediately hit a different bug: Spring's default <code>TestRestTemplate</code> request factory sits on top of the JDK's own <code>HttpURLConnection</code>, which throws <code>IOException: cannot retry due to server authentication, in streaming mode</code> the moment a POST gets a 401 back — a known limitation of the JDK client itself, not of the code under test.</p>
        <pre><code>{`@BeforeEach
void useApacheHttpClientRequestFactory() {
    // The default JDK HttpURLConnection-based factory can't handle a 401 response to a POST.
    // Swap in the httpclient5-based factory, which doesn't have this limitation.
    restTemplate.getRestTemplate().setRequestFactory(new HttpComponentsClientHttpRequestFactory())
}`}</code></pre>
        <p>No mock or fake HTTP client runs the JDK's actual request/response state machine. This bug is <em>in</em> that state machine — it only exists when a real socket, a real running server, and a real 401 are all in the loop together.</p>
        <h2>Never Merged, Still a Real Lesson</h2>
        <p>Not every bug in this category shipped in production code. A benchmark run comparing all five language ports against a "recurring transfer" feature spec — deliberately never merged, since there was no real caller for the feature yet — surfaced two more, recorded as a first-person engineering log rather than a fix commit:</p>
        <p>In the Go port, a reference ID built from a 32-character hex ID plus a <code>-YYYY-MM</code> suffix (40 characters) was written into a <code>reference_id VARCHAR(36)</code> column. Postgres rejected it — but only starting on the second month's run, since the first insert of any given length pattern can coincidentally fit. An in-memory fake repository doesn't enforce column-length constraints at all, so nothing before real Postgres could have caught it.</p>
        <p>In the java-springboot port, three separate <code>@Test</code> methods each called the same monthly scheduler within the same test run. The scheduler's dedup ID was date-based at month granularity — identical for all three calls — and SQS FIFO's five-minute deduplication window silently dropped the second and third. Only the first test's Task actually reached the queue.</p>
        <div className="article-note"><strong>An unmerged bug that still changed real code</strong><p>The VARCHAR(36) lesson didn't stay theoretical. A real, merged account-transfer feature shipped the same day, and its Go implementation explicitly avoids the exact trap the benchmark surfaced — using the raw 32-character ID with no suffix at all, specifically because appending one could exceed the column limit. A benchmark run whose code was thrown away still produced a lesson that shaped production code the same afternoon.</p></div>
        <h2>What All Four Have in Common</h2>
        <p>None of these are exotic. A missing annotation, a client library's known limitation, a column-length constraint, a deduplication window — ordinary infrastructure behavior, not edge cases dreamed up to stress-test a system. What they share is that a mock or fake, by construction, doesn't implement the actual failure surface: no real session to close early, no real HTTP client state machine, no real column, no real dedup window. Confidence that a feature works has to include running it, at least once, against the real things it depends on — not because unit tests are wrong, but because they were never testing this part of the system.</p>
      </>
    ),
  },
  ko: {
    kicker: 'Testing · Reliability',
    title: (
      <>
        유닛 테스트가 보지 못하는<br /><em>버그들</em>
      </>
    ),
    lede: 'Mock Repository는 실제 Postgres 커넥션을 여는 법이 없다. Fake HTTP 클라이언트는 실제 JDK 재시도(retry) 버그를 일으키는 법이 없다. 네 개의 실제 버그, 그리고 그 어느 하나도 실제 인프라 없이는 애초에 존재할 수조차 없었다.',
    body: (
      <>
        <p>이 버그들은 하나같이 당시 존재하던 모든 유닛 테스트를 통과했다. 이건 유닛 테스트의 실패가 아니다 — 유닛 테스트는 자신이 닿을 수 있는 것들을 테스트하고 있었을 뿐이다. 문제는 일부 실패 모드가 코드와 실제 무언가 사이의 경계에서만 존재한다는 점이다: 실제 데이터베이스 커넥션의 생명주기, 실제 HTTP 클라이언트의 재시도(retry) 로직, 실제 메시지 큐의 중복 제거(dedup) 윈도우 같은 것들. Fake는 인터페이스를 대신할 뿐, 실패 모드를 대신하지는 못한다.</p>
        <h2>너무 일찍 닫힌 Lob 스트림</h2>
        <p>Outbox를 동기식 동일 프로세스 drain 방식에서 비동기 SQS 기반 poller/consumer 분리 구조로 마이그레이션하는 과정에서 실제 회귀(regression)가 발생했고, 이는 실제 데이터베이스를 대상으로 한 검증 중에만 발견됐다: <code>OutboxPoller.poll()</code>에 <code>@Transactional</code>이 빠져 있었던 것이다. payload 컬럼은 지연 로딩(lazy loading)되는 JPA <code>@Lob</code>인데 — 메서드 자체가 트랜잭션 경계가 아니다 보니, 루프가 payload를 스트림으로 꺼내려 할 때는 쿼리에 사용된 세션이 이미 닫혀 있었다.</p>
        <pre><code>{`// Why @Transactional is needed: OutboxEvent.payload, loaded by
// findByProcessedFalseOrderByCreatedAtAsc(), is an @Lob column — if this method itself isn't a
// transaction boundary, the session/connection used for the query is already returned by the
// time the loop below tries to lazily stream event.getPayload(), causing an
// "Unable to access lob stream" exception and silently publishing nothing.
@Scheduled(fixedDelay = 1000)
@Transactional
public void poll() { /* ... */ }`}</code></pre>
        <p>Mock Repository는 그냥 인메모리 객체를 반환할 뿐이다. 닫을 세션도 없고, 스트림할 LOB도 없으며, 이 문제를 재현할 방법 자체가 없다. 이 예외가 애초에 존재하려면 실제 Postgres 커넥션에 대한 실제 Hibernate 세션이 있어야 했고, 그 세션이 실제 트랜잭션 경계에서 닫혀야 했다.</p>
        <h2>아무도 실제로 테스트해본 적 없던 401</h2>
        <p>이전 글에서 다룬 인증 우회(authentication bypass) 버그를 고치는 작업은, 두 Spring Boot 포트를 통틀어 처음으로 실제 401 응답을 검증(assert)하는 테스트를 작성한다는 뜻이었다. 그 테스트는 곧바로 또 다른 버그에 부딪혔다: Spring의 기본 <code>TestRestTemplate</code> 요청 팩토리는 JDK 자체의 <code>HttpURLConnection</code> 위에서 동작하는데, 이는 POST 요청이 401 응답을 받는 순간 <code>IOException: cannot retry due to server authentication, in streaming mode</code>를 던진다 — 이는 테스트 대상 코드가 아니라 JDK 클라이언트 자체의 알려진 한계다.</p>
        <pre><code>{`@BeforeEach
void useApacheHttpClientRequestFactory() {
    // The default JDK HttpURLConnection-based factory can't handle a 401 response to a POST.
    // Swap in the httpclient5-based factory, which doesn't have this limitation.
    restTemplate.getRestTemplate().setRequestFactory(new HttpComponentsClientHttpRequestFactory())
}`}</code></pre>
        <p>Mock이나 Fake HTTP 클라이언트는 JDK의 실제 request/response 상태 기계(state machine)를 돌리지 않는다. 이 버그는 바로 그 상태 기계 <em>안에</em> 있다 — 실제 소켓, 실제로 돌아가는 서버, 실제 401 응답이 모두 함께 관여할 때만 존재한다.</p>
        <h2>머지되지 않았지만, 여전히 실질적인 교훈</h2>
        <p>이 범주의 버그가 전부 프로덕션 코드에 실제로 반영된 건 아니다. 다섯 개 언어 포트를 "정기 송금(recurring transfer)" 기능 스펙에 맞춰 비교한 벤치마크 실행 — 아직 이 기능을 실제로 호출할 곳이 없었기에 의도적으로 머지하지 않았다 — 에서 두 건이 더 드러났고, 이는 수정 커밋이 아니라 1인칭 엔지니어링 로그 형태로 기록됐다:</p>
        <p>Go 포트에서는 32자리 hex ID에 <code>-YYYY-MM</code> 접미사(총 40자)를 붙여 만든 참조 ID를 <code>reference_id VARCHAR(36)</code> 컬럼에 기록하고 있었다. Postgres는 이를 거부했다 — 다만 두 번째 달 실행부터였는데, 특정 길이 패턴의 첫 삽입은 우연히 들어맞을 수 있기 때문이다. 인메모리 Fake Repository는 컬럼 길이 제약을 아예 강제하지 않으므로, 실제 Postgres 이전 단계에서는 이 문제를 잡아낼 방법이 없었다.</p>
        <p>java-springboot 포트에서는 서로 다른 세 개의 <code>@Test</code> 메서드가 같은 테스트 실행 안에서 각각 동일한 월간(monthly) 스케줄러를 호출하고 있었다. 스케줄러의 dedup ID는 월 단위 날짜 기반이었기에 — 세 번의 호출 모두 값이 동일했고 — SQS FIFO의 5분짜리 중복 제거(dedup) 윈도우가 두 번째와 세 번째 호출을 조용히 걸러냈다. 실제로 큐에 도달한 Task는 첫 번째 테스트의 것뿐이었다.</p>
        <div className="article-note"><strong>머지되지 않은 버그가 그래도 실제 코드를 바꾼 사례</strong><p>VARCHAR(36) 교훈은 이론으로 끝나지 않았다. 같은 날 실제로 머지된 계좌 송금(account-transfer) 기능이 배포됐는데, 그 Go 구현은 벤치마크가 드러낸 바로 그 함정을 명시적으로 피하고 있다 — 접미사를 아예 붙이지 않고 32자리 원본 ID를 그대로 사용하는데, 접미사를 붙이면 컬럼 길이 제한을 넘을 수 있다는 바로 그 이유 때문이다. 코드가 버려진 벤치마크 실행 한 번이, 그날 오후 프로덕션 코드를 실제로 바꾼 교훈을 만들어낸 셈이다.</p></div>
        <h2>네 가지 버그의 공통점</h2>
        <p>이 중 어느 것도 특별하거나 희귀한 사례가 아니다. 누락된 애노테이션, 클라이언트 라이브러리의 알려진 한계, 컬럼 길이 제약, 중복 제거 윈도우 — 시스템을 스트레스 테스트하겠다고 억지로 만들어낸 엣지 케이스가 아니라 평범한 인프라 동작일 뿐이다. 이들의 공통점은 Mock이나 Fake가 구조상 실제 실패 표면(failure surface)을 구현하지 않는다는 점이다: 일찍 닫힐 실제 세션도 없고, 실제 HTTP 클라이언트 상태 기계도 없고, 실제 컬럼도, 실제 dedup 윈도우도 없다. 어떤 기능이 제대로 동작한다는 확신을 얻으려면, 그 기능이 의존하는 실제 대상을 상대로 적어도 한 번은 실행해봐야 한다 — 유닛 테스트가 틀려서가 아니라, 애초에 시스템의 이 부분을 테스트한 적이 없기 때문이다.</p>
      </>
    ),
  },
};

export default function BugsOnlyE2eTestsCatch() {
  const { locale } = useLocale();
  const c = content[locale];

  return (
    <PostLayout slug="bugs-only-e2e-tests-catch" kicker={c.kicker} title={c.title} lede={c.lede}>
      {c.body}
    </PostLayout>
  );
}
