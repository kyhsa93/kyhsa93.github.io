import PostLayout from '../../components/PostLayout';
import { useLocale, localeFromPathname } from '../../lib/locale';
import type { MetaFunction } from 'react-router';
import { createPostMeta } from '../../lib/seo';

export const meta: MetaFunction = ({ location }) =>
  createPostMeta('bugs-only-e2e-tests-catch', localeFromPathname(location.pathname));

const content = {
  en: {
    kicker: 'Testing · Reliability',
    title: (
      <>
        The Bugs<br /><em>Unit Tests Can't See</em>
      </>
    ),
    lede: "A mocked repository never opens a real Postgres connection. A fake HTTP client never triggers a real JDK retry bug. Four bugs, and every one of them needed real infrastructure to even exist.",
    body: (
      <>
        <p>Every one of these bugs passed every unit test that existed at the time. That's not a failure of the unit tests; they were testing the things they could reach. The problem is that some failure modes only exist at the boundary between your code and something real: a database connection lifecycle, an HTTP client's retry logic, a message queue's deduplication window. A fake stands in for the interface, not the failure mode.</p>
        <h2>The Lob Stream That Closed Too Early</h2>
        <p>Migrating the Outbox from a synchronous same-process drain to an async SQS-based poller/consumer split introduced a regression, caught only during verification against a real database: <code>OutboxPoller.poll()</code> was missing <code>@Transactional</code>. The payload column is a JPA <code>@Lob</code>, loaded lazily, and without the method itself being a transaction boundary, the session used for the query was already closed by the time the loop tried to stream the payload back out.</p>
        <pre><code>{`// Why @Transactional is needed: OutboxEvent.payload, loaded by
// findByProcessedFalseOrderByCreatedAtAsc(), is an @Lob column — if this method itself isn't a
// transaction boundary, the session/connection used for the query is already returned by the
// time the loop below tries to lazily stream event.getPayload(), causing an
// "Unable to access lob stream" exception and silently publishing nothing.
@Scheduled(fixedDelay = 1000)
@Transactional
public void poll() { /* ... */ }`}</code></pre>
        <p>A mocked repository returns a plain in-memory object; it has no session to close, no LOB to stream, and no way to reproduce this. It needed a Hibernate session against a real Postgres connection, closing at a transaction boundary, before this exception could exist at all.</p>
        <h2>The 401 Nobody Had Tested Before</h2>
        <p>Fixing the authentication bypass covered in an earlier post meant writing, for the first time in either Spring Boot port, a test that asserts a real 401 response. That test immediately hit a different bug. Spring's default <code>TestRestTemplate</code> request factory sits on top of the JDK's own <code>HttpURLConnection</code>, which throws <code>IOException: cannot retry due to server authentication, in streaming mode</code> the moment a POST gets a 401 back. That's a known limitation of the JDK client itself, not of the code under test.</p>
        <pre><code>{`@BeforeEach
void useApacheHttpClientRequestFactory() {
    // The default JDK HttpURLConnection-based factory can't handle a 401 response to a POST.
    // Swap in the httpclient5-based factory, which doesn't have this limitation.
    restTemplate.getRestTemplate().setRequestFactory(new HttpComponentsClientHttpRequestFactory())
}`}</code></pre>
        <p>No mock or fake HTTP client runs the JDK's request/response state machine. This bug is <em>in</em> that state machine; it only exists when a real socket, a running server, and a real 401 are all in the loop together.</p>
        <h2>Never Merged, Still a Real Lesson</h2>
        <p>Not every bug in this category shipped in production code. A benchmark run comparing all five language ports against a "recurring transfer" feature spec (deliberately never merged, since there was no caller for the feature yet) surfaced two more, recorded as a first-person engineering log rather than a fix commit:</p>
        <p>In the Go port, a reference ID built from a 32-character hex ID plus a <code>-YYYY-MM</code> suffix (40 characters) was written into a <code>reference_id VARCHAR(36)</code> column. Postgres rejected it, but only starting on the second month's run, since the first insert of any given length pattern can coincidentally fit. An in-memory fake repository doesn't enforce column-length constraints at all, so nothing before real Postgres could have caught it.</p>
        <p>In the java-springboot port, three separate <code>@Test</code> methods each called the same monthly scheduler within the same test run. The scheduler's dedup ID was date-based at month granularity, identical for all three calls, and SQS FIFO's five-minute deduplication window dropped the second and third without an error. Only the first test's Task reached the queue.</p>
        <div className="article-note"><strong>An unmerged bug that still changed real code</strong><p>The VARCHAR(36) lesson didn't stay theoretical. A merged account-transfer feature shipped the same day, and its Go implementation explicitly avoids the trap the benchmark surfaced — using the raw 32-character ID with no suffix at all, specifically because appending one could exceed the column limit. A benchmark run whose code was thrown away still produced a lesson that shaped production code the same afternoon.</p></div>
        <h2>What All Four Have in Common</h2>
        <p>None of these are exotic. A missing annotation, a client library's known limitation, a column-length constraint, a deduplication window: ordinary infrastructure behavior, not edge cases dreamed up to stress-test a system. What they share is that a mock or fake, by construction, doesn't implement the failure surface. There's no session to close early, no HTTP client state machine, no column, no dedup window. Confidence that a feature works has to include running it, at least once, against the real things it depends on, not because unit tests are wrong, but because they were never testing this part of the system.</p>
        <div className="article-note"><strong>Further reading in the repo</strong><p>
          <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/docs/architecture/testing.md" target="_blank" rel="noreferrer">docs/architecture/testing.md</a> (the Domain/Application/E2E testing strategy these bugs fell outside of) · <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/implementations/java-springboot/examples/src/main/java/com/example/accountservice/outbox/OutboxPoller.java" target="_blank" rel="noreferrer">OutboxPoller.java</a> (the fix for the Lob-stream bug) · <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/docs/benchmark.md" target="_blank" rel="noreferrer">docs/benchmark.md</a> (the first-person log of the two unmerged benchmark bugs)
        </p></div>
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
    lede: 'Mock Repository는 Postgres 커넥션을 열지 않는다. Fake HTTP 클라이언트로는 JDK의 재시도 버그가 일어나지 않는다. 여기 모은 버그 4개는 모두 실제 인프라가 있어야만 생길 수 있었다.',
    body: (
      <>
        <p>네 버그 모두 그 시점에 있던 유닛 테스트를 전부 통과했다. 유닛 테스트가 잘못한 건 없다. 자기가 닿을 수 있는 곳을 테스트하고 있었을 뿐이다. 어떤 실패는 코드와 실제 시스템이 만나는 경계에서만 생긴다. 데이터베이스 커넥션의 생명주기, HTTP 클라이언트의 재시도 로직, 메시지 큐의 중복 제거(dedup) 윈도우 같은 것들이다. Fake는 인터페이스를 대신해 줄 뿐, 그 실패까지 대신해 주지는 않는다.</p>
        <h2>너무 일찍 닫힌 Lob 스트림</h2>
        <p>Outbox를 같은 프로세스 안에서 동기로 비우던 방식에서, SQS를 사이에 둔 비동기 poller/consumer 구조로 옮기다가 회귀가 하나 생겼다. 실제 데이터베이스로 검증할 때만 드러난 버그였다. <code>OutboxPoller.poll()</code>에 <code>@Transactional</code>이 빠져 있었다. payload 컬럼은 지연 로딩되는 JPA <code>@Lob</code>이다. 그런데 메서드가 트랜잭션 경계가 아니니, 루프가 payload를 스트림으로 읽으려 할 때는 쿼리에 쓴 세션이 이미 닫혀 있었다.</p>
        <pre><code>{`// Why @Transactional is needed: OutboxEvent.payload, loaded by
// findByProcessedFalseOrderByCreatedAtAsc(), is an @Lob column — if this method itself isn't a
// transaction boundary, the session/connection used for the query is already returned by the
// time the loop below tries to lazily stream event.getPayload(), causing an
// "Unable to access lob stream" exception and silently publishing nothing.
@Scheduled(fixedDelay = 1000)
@Transactional
public void poll() { /* ... */ }`}</code></pre>
        <p>Mock Repository는 인메모리 객체를 돌려줄 뿐이다. 닫힐 세션도, 스트림으로 읽을 LOB도 없으니 이 문제를 재현할 길이 없다. 이 예외는 Postgres 커넥션 위에서 Hibernate 세션이 트랜잭션 경계에 닫힐 때만 생긴다.</p>
        <h2>아무도 테스트해 본 적 없던 401</h2>
        <p>앞선 글에서 다룬 인증 우회 버그를 고치려면 401 응답을 단언하는 테스트가 필요했다. 두 Spring Boot 포트 어디에도 그런 테스트는 처음이었다. 그 테스트가 곧바로 다른 버그에 걸렸다. Spring의 기본 <code>TestRestTemplate</code> 요청 팩토리는 JDK의 <code>HttpURLConnection</code> 위에서 돈다. 이 클라이언트는 POST가 401을 받는 순간 <code>IOException: cannot retry due to server authentication, in streaming mode</code>를 던진다. 테스트 대상 코드의 문제가 아니라 JDK 클라이언트에 원래 있는 한계다.</p>
        <pre><code>{`@BeforeEach
void useApacheHttpClientRequestFactory() {
    // The default JDK HttpURLConnection-based factory can't handle a 401 response to a POST.
    // Swap in the httpclient5-based factory, which doesn't have this limitation.
    restTemplate.getRestTemplate().setRequestFactory(new HttpComponentsClientHttpRequestFactory())
}`}</code></pre>
        <p>Mock이나 Fake HTTP 클라이언트는 JDK의 request/response 상태 기계를 돌리지 않는다. 이 버그는 그 상태 기계 <em>안에</em> 있다. 소켓과 떠 있는 서버, 진짜 401 응답이 한꺼번에 맞물릴 때만 나타난다.</p>
        <h2>머지하지 않았어도 남은 교훈</h2>
        <p>이런 버그가 전부 프로덕션 코드에 들어간 건 아니다. "정기 송금(recurring transfer)" 기능 스펙을 두고 5개 언어 포트를 비교하는 벤치마크를 돌린 적이 있다. 이 기능을 호출할 곳이 아직 없어서 일부러 머지하지 않았다. 그 벤치마크에서 두 건이 더 나왔고, 수정 커밋 대신 1인칭 엔지니어링 로그로 남겼다.</p>
        <p>Go 포트는 32자 hex ID에 <code>-YYYY-MM</code> 접미사를 붙인 40자짜리 참조 ID를 <code>reference_id VARCHAR(36)</code> 컬럼에 넣고 있었다. Postgres는 이 값을 거부했는데, 두 번째 달 실행부터였다. 특정 길이 패턴의 첫 삽입은 우연히 들어맞을 수 있어서다. 인메모리 Fake Repository는 컬럼 길이 제약을 아예 검사하지 않으니, Postgres에 닿기 전에는 잡을 방법이 없었다.</p>
        <p>java-springboot 포트에서는 <code>@Test</code> 메서드 3개가 한 테스트 실행 안에서 같은 월간 스케줄러를 각각 호출했다. 스케줄러의 dedup ID를 월 단위 날짜로 만들어서 세 호출 모두 값이 같았다. SQS FIFO의 5분짜리 중복 제거 윈도우가 두 번째와 세 번째 메시지를 에러 없이 버렸다. 큐에 들어간 Task는 첫 번째 테스트 것 하나뿐이었다.</p>
        <div className="article-note"><strong>머지하지 않은 버그가 바꾼 실제 코드</strong><p>VARCHAR(36)에서 얻은 교훈은 이론으로 끝나지 않았다. 같은 날 계좌 송금(account-transfer) 기능을 머지해 배포했는데, 그 Go 구현은 벤치마크에서 본 함정을 일부러 피해 간다. 접미사를 붙이면 컬럼 길이를 넘을 수 있어서, 32자 원본 ID를 접미사 없이 그대로 쓴다. 코드는 버린 벤치마크였지만, 거기서 얻은 교훈이 그날 오후 프로덕션 코드를 바꿨다.</p></div>
        <h2>네 버그의 공통점</h2>
        <p>넷 다 특이한 사례는 아니다. 빠진 애노테이션, 클라이언트 라이브러리의 알려진 한계, 컬럼 길이 제약, 중복 제거 윈도우는 모두 평범한 인프라 동작이다. 시스템을 시험하려고 지어낸 엣지 케이스와는 거리가 멀다. 넷의 공통점은 Mock이나 Fake가 만들어진 방식상 이런 실패 지점을 구현하지 않는다는 것이다. 일찍 닫힐 세션도, HTTP 클라이언트 상태 기계도, 컬럼도, dedup 윈도우도 없다.</p>
        <p>기능이 동작한다고 믿으려면 그 기능이 기대는 실제 대상 위에서 적어도 한 번은 돌려 봐야 한다. 유닛 테스트가 틀려서 하는 말은 아니다. 유닛 테스트는 처음부터 이 부분을 보고 있지 않았다.</p>
        <div className="article-note"><strong>저장소에서 더 볼 것</strong><p>
          <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/docs/architecture/testing.md" target="_blank" rel="noreferrer">docs/architecture/testing.md</a>(이 버그들이 빠져나간 Domain/Application/E2E 테스트 전략) · <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/implementations/java-springboot/examples/src/main/java/com/example/accountservice/outbox/OutboxPoller.java" target="_blank" rel="noreferrer">OutboxPoller.java</a>(Lob 스트림 버그를 고친 코드) · <a href="https://github.com/kyhsa93/backend-service-playbook/blob/main/docs/benchmark.md" target="_blank" rel="noreferrer">docs/benchmark.md</a>(머지하지 않은 벤치마크 버그 두 건을 1인칭으로 적은 기록)
        </p></div>
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
