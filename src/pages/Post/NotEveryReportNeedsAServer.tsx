import PostLayout from '../../components/PostLayout';
import { useLocale, localeFromPathname } from '../../lib/locale';
import type { MetaFunction } from 'react-router';
import { createPostMeta } from '../../lib/seo';

export const meta: MetaFunction = ({ location }) =>
  createPostMeta('not-every-report-needs-a-server', localeFromPathname(location.pathname));

const content = {
  en: {
    kicker: 'ETL · Architecture',
    title: (
      <>
        Not Every Report<br /><em>Needs a Server</em>
      </>
    ),
    lede: "The request was to add an ETL feature. Every proposal that followed died to the same one-line question until one didn't, and the reason it survived is the rule.",
    body: (
      <>
        <p>"Add a data ETL feature" is an easy request to say yes to and a surprisingly hard one to fill in. The obvious moves, a monthly account statement as a CSV and a GDPR-style "download all my data" export, both sounded like real backend work. Both died to the same question, asked plainly: couldn't the client just call the existing read endpoints and build that file itself?</p>
        <h2>The Question That Kept Killing Ideas</h2>
        <p>For the monthly statement: the account's transaction history is already fully queryable through <code>GetTransactions</code>. A client fetching a month's worth of rows and rendering a CSV is client work, not backend work. The server doing it instead is a convenience. For the data export: same shape, larger scope. Aggregating Account+Card+Payment+Refund into one file is more tedious for a client to build, but "tedious" and "impossible" aren't the same claim, and only one of them justifies putting it on the server.</p>
        <p>Two proposals, two honest admissions that the server wasn't required. That's a good sign the wrong question was being asked: not "can the server do this," but "does the client have some real reason it can't."</p>
        <h2>The Line That Matters</h2>
        <p>A server-side job earns its place for one of a few real reasons, not because it happens to be possible:</p>
        <ul>
          <li>The client can't reach the underlying data at all. It belongs to other users, or to nobody in particular (an internal ops report, a settlement file consumed by an external system with no human client in the loop).</li>
          <li>Delivery has to be push, not pull. Something has to happen on a schedule whether or not anyone asks for it.</li>
          <li>The value is in <em>precomputing</em> an aggregate a client would otherwise have to re-derive from potentially many raw rows on every request. The point is not repeating expensive work.</li>
        </ul>
        <p>Neither statement nor export cleared any of these. A monthly spending-pattern analysis (total/average withdrawal, month-over-month %-change, a trend label) did, on the third reason: computing that from raw transactions is the kind of aggregation nobody wants running live, on every request, for every account.</p>
        <h2>What Survived, and Why</h2>
        <p>The whole feature is: a Cron enqueues a Task on the 1st of the month; the Task paginates every active account, aggregates last month's (and the month before's) withdrawals, and writes one precomputed row per account per month. A new query endpoint serves that row directly, with no live aggregation, ever, on the read path:</p>
        <pre><code>{`// domain/spending-analysis.ts — the one real "transform" step
public static create(params: {
  accountId: string
  analysisMonth: string
  totalAmount: number
  transactionCount: number
  previousTotalAmount: number
}): SpendingAnalysis {
  const averageAmount = params.transactionCount > 0
    ? Math.round(params.totalAmount / params.transactionCount) : 0

  const changeFromPreviousMonth = params.previousTotalAmount === 0
    ? (params.totalAmount === 0 ? 0 : 100)
    : Math.round(((params.totalAmount - params.previousTotalAmount) / params.previousTotalAmount) * 100)

  let trend: SpendingTrend = 'STABLE'
  if (changeFromPreviousMonth > 10) trend = 'INCREASING'
  else if (changeFromPreviousMonth < -10) trend = 'DECREASING'

  return new SpendingAnalysis({ accountId: params.accountId, analysisMonth: params.analysisMonth,
    totalAmount: params.totalAmount, transactionCount: params.transactionCount,
    averageAmount, changeFromPreviousMonth, trend })
}`}</code></pre>
        <p>That's the entire "T" in ETL: two numbers in, a percentage and a label out. Extract is the existing per-account transaction table; Load is one upsert-shaped row, idempotent via a (accountId, month) unique constraint, the same two-layer pattern the repo's card-statement job already used. Nothing here needed inventing. The win was recognizing that a CQRS read-model, expressed as a batch job, was the shape that survived the question the report ideas didn't.</p>
        <div className="article-note"><strong>Numbers from the test</strong><p>The e2e test backdates two withdrawals (30,000 and 20,000) into "last month," runs the scheduler, and reads back a row with <code>totalAmount: 50000</code>, <code>transactionCount: 2</code>, <code>averageAmount: 25000</code>, and, since there's no prior-prior-month history to compare against, <code>changeFromPreviousMonth: 100</code>, <code>trend: 'INCREASING'</code>. Re-running the same month's job a second time doesn't produce a second row.</p></div>
        <h2>The Rule, Stated Plainly</h2>
        <p>"Can the server do this" is nearly always yes. The question that filters ideas is narrower: does the client have a real reason (not a convenience one) that it can't do this itself? Most report-shaped requests fail that question without anyone noticing, because report-shaped is UI work wearing a backend costume. The one that survives is usually the one that isn't shaped like a report at all.</p>
        <div className="article-note"><strong>Further reading</strong><p>
          <a href="/posts/scheduling-and-task-outbox">Scheduling and the Task Outbox Pattern</a> — the Cron→Task Queue infrastructure this feature reuses without needing anything new · <a href="/posts/cqrs-in-practice">CQRS in Practice</a> — the Query-side discipline this feature's read model has to answer to
        </p></div>
      </>
    ),
  },
  ko: {
    kicker: 'ETL · Architecture',
    title: (
      <>
        모든 리포트에<br /><em>서버가 필요한 건 아니다</em>
      </>
    ),
    lede: 'ETL 기능을 추가해 달라는 요청을 받았다. 이어서 나온 제안은 모두 같은 한 줄짜리 질문에 걸려 무너졌다. 딱 하나만 살아남았는데, 그게 살아남은 이유가 곧 규칙이었다.',
    body: (
      <>
        <p>"데이터 ETL 기능을 추가해 달라"는 요청은 받아들이기는 쉬운데 막상 내용을 채우려면 뜻밖에 어렵다. 먼저 떠오른 건 둘이었다. CSV로 뽑는 월별 계좌 명세서, 그리고 GDPR식 "내 데이터 전체 다운로드"다. 둘 다 그럴듯한 백엔드 작업처럼 들렸다. 그런데 둘 다 같은 질문 하나에 무너졌다. 클라이언트가 기존 조회 API를 불러서 그 파일을 직접 만들면 되지 않나?</p>
        <h2>아이디어를 계속 죽인 질문</h2>
        <p>월별 명세서부터 보자. 계좌의 거래 내역은 이미 <code>GetTransactions</code>로 전부 조회할 수 있다. 한 달 치 행을 받아 CSV로 만드는 건 클라이언트가 할 일이다. 서버가 대신 해 주면 편하긴 하지만 꼭 그래야 하는 건 아니다. 데이터 내보내기도 모양은 같고 범위만 넓다. Account, Card, Payment, Refund를 한 파일로 합치는 건 클라이언트 입장에서 더 번거롭다. 하지만 번거로운 것과 불가능한 것은 다르고, 서버에 올릴 근거가 되는 건 불가능한 쪽뿐이다.</p>
        <p>제안 두 개에서 두 번 다 서버가 꼭 필요하지는 않다고 인정해야 했다. 질문을 잘못 던지고 있었다는 신호였다. "서버가 이걸 할 수 있나"가 아니라 "클라이언트가 이걸 못 할 이유가 있나"를 물었어야 했다.</p>
        <h2>정말 중요한 기준</h2>
        <p>서버 쪽 배치 작업은 할 수 있다는 것만으로는 자리를 얻지 못한다. 다음 이유 중 하나는 있어야 한다.</p>
        <ul>
          <li>클라이언트가 그 데이터에 아예 닿을 수 없다. 다른 사용자의 데이터이거나, 특정 누구의 것도 아닌 경우다(내부 운영 리포트, 사람 클라이언트 없이 외부 시스템이 받아 가는 정산 파일).</li>
          <li>당겨 가는 방식(pull)으로는 안 되고 밀어 주는 방식(push)이어야 한다. 누가 요청하든 말든 정해진 때에 무언가 일어나야 한다.</li>
          <li>집계값을 <em>미리 계산</em>해 두는 데 가치가 있다. 그러지 않으면 클라이언트가 요청할 때마다 많을 수도 있는 원본 행에서 매번 다시 계산해야 한다. 파일을 만드는 게 목적인 게 아니고, 비싼 작업을 반복하지 않는 게 목적이다.</li>
        </ul>
        <p>명세서도 데이터 내보내기도 셋 중 어느 것에도 해당하지 않았다. 월간 지출 패턴 분석은 세 번째 이유로 통과했다. 출금 총액과 평균, 전월 대비 증감률, 추세 라벨을 내는 기능이다. 이걸 원본 거래에서 계산하는 건, 요청마다 모든 계좌를 상대로 실시간으로 돌리고 싶지 않은 전형적인 집계다.</p>
        <h2>살아남은 것과 그 이유</h2>
        <p>기능 전체는 이렇다. 매월 1일에 Cron이 Task를 큐에 넣는다. Task는 활성 계좌를 페이지 단위로 전부 돌면서 지난달 출금과 비교용으로 그 전달 출금을 집계하고, 계좌마다 한 달에 한 행씩 미리 계산한 결과를 저장한다. 새 조회 API는 그 행을 그대로 내준다. 조회 경로에서 실시간 집계는 한 번도 일어나지 않는다.</p>
        <pre><code>{`// domain/spending-analysis.ts — 유일하게 진짜인 "변환(Transform)" 단계
public static create(params: {
  accountId: string
  analysisMonth: string
  totalAmount: number
  transactionCount: number
  previousTotalAmount: number
}): SpendingAnalysis {
  const averageAmount = params.transactionCount > 0
    ? Math.round(params.totalAmount / params.transactionCount) : 0

  const changeFromPreviousMonth = params.previousTotalAmount === 0
    ? (params.totalAmount === 0 ? 0 : 100)
    : Math.round(((params.totalAmount - params.previousTotalAmount) / params.previousTotalAmount) * 100)

  let trend: SpendingTrend = 'STABLE'
  if (changeFromPreviousMonth > 10) trend = 'INCREASING'
  else if (changeFromPreviousMonth < -10) trend = 'DECREASING'

  return new SpendingAnalysis({ accountId: params.accountId, analysisMonth: params.analysisMonth,
    totalAmount: params.totalAmount, transactionCount: params.transactionCount,
    averageAmount, changeFromPreviousMonth, trend })
}`}</code></pre>
        <p>ETL의 "T"는 이게 전부다. 숫자 두 개가 들어가고 퍼센트 하나와 라벨 하나가 나온다. Extract는 원래 있던 계좌별 거래 테이블이다. Load는 upsert 모양의 행 하나이고, (accountId, month) 유니크 제약으로 멱등하게 만들었다. 내 저장소의 카드 명세서 작업이 이미 쓰던 이중 방어 패턴 그대로다. 새로 만든 건 없다. 리포트류 아이디어들이 넘지 못한 질문을, 배치 작업으로 만든 CQRS read model은 넘을 수 있다는 걸 알아본 게 수확이었다.</p>
        <div className="article-note"><strong>테스트에서 나온 숫자</strong><p>e2e 테스트는 30,000원과 20,000원짜리 출금 두 건을 날짜를 "지난달"로 되돌려 넣고, 스케줄러를 그대로 돌린 뒤 결과 행을 읽는다. <code>totalAmount: 50000</code>, <code>transactionCount: 2</code>, <code>averageAmount: 25000</code>이 나온다. 비교할 전전달 이력이 없으므로 <code>changeFromPreviousMonth: 100</code>, <code>trend: 'INCREASING'</code>이 된다. 같은 달 작업을 한 번 더 돌려도 행이 하나 더 생기지는 않는다.</p></div>
        <h2>규칙을 한 문장으로</h2>
        <p>"서버가 이걸 할 수 있나"에 대한 답은 거의 언제나 "그렇다"다. 아이디어를 제대로 걸러 내는 질문은 그보다 좁다. 편의 말고, 클라이언트가 이걸 직접 못 할 이유가 있는가. 리포트처럼 생긴 요청은 대부분 이 질문에서 별 소리 없이 떨어진다. 리포트 모양이라는 것 자체가 백엔드 옷을 입은 UI 작업이기 때문이다. 살아남는 건 대개 처음부터 리포트처럼 생기지 않은 쪽이다.</p>
        <div className="article-note"><strong>더 읽을거리</strong><p>
          <a href="/posts/scheduling-and-task-outbox">스케줄링과 Task Outbox 패턴</a>(이 기능이 새로 만든 것 없이 그대로 가져다 쓴 Cron→Task Queue 인프라) · <a href="/posts/cqrs-in-practice">실전 CQRS</a>(이 기능의 read model이 지켜야 했던 Query 쪽 규율)
        </p></div>
      </>
    ),
  },
};

export default function NotEveryReportNeedsAServer() {
  const { locale } = useLocale();
  const c = content[locale];

  return (
    <PostLayout slug="not-every-report-needs-a-server" kicker={c.kicker} title={c.title} lede={c.lede}>
      {c.body}
    </PostLayout>
  );
}
