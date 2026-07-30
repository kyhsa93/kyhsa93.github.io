import PostLayout from '../../components/PostLayout';
import { useLocale } from '../../lib/locale';
import type { MetaFunction } from 'react-router';
import { createPostMeta } from '../../lib/seo';

export const meta: MetaFunction = () => createPostMeta('not-every-report-needs-a-server');

const content = {
  en: {
    kicker: 'ETL · Architecture',
    title: (
      <>
        Not Every Report<br /><em>Needs a Server</em>
      </>
    ),
    lede: "The request was to add an ETL feature. Every proposal that followed died to the same one-line question — until one didn't, and the reason it survived is the actual rule.",
    body: (
      <>
        <p>"Add a data ETL feature" is an easy request to say yes to and a surprisingly hard one to fill in. The obvious moves — a monthly account statement as a CSV, a GDPR-style "download all my data" export — both sounded like real backend work. Both died to the same question, asked plainly: couldn't the client just call the existing read endpoints and build that file itself?</p>
        <h2>The Question That Kept Killing Ideas</h2>
        <p>For the monthly statement: the account's transaction history is already fully queryable through <code>GetTransactions</code>. A client fetching a month's worth of rows and rendering a CSV is client work, not backend work — the server doing it instead is a convenience, not a necessity. For the data export: same shape, larger scope. Aggregating Account+Card+Payment+Refund into one file is more tedious for a client to build, but "tedious" and "impossible" aren't the same claim, and only one of them justifies putting it on the server.</p>
        <p>Two proposals, two honest admissions that the server wasn't actually required. That's a good sign the wrong question was being asked — not "can the server do this," but "does the client have some real reason it can't."</p>
        <h2>The Line That Actually Matters</h2>
        <p>A server-side job earns its place for one of a few real reasons, not because it happens to be possible:</p>
        <ul>
          <li>The client can't reach the underlying data at all — it belongs to other users, or to nobody in particular (an internal ops report, a settlement file consumed by an external system with no human client in the loop).</li>
          <li>Delivery has to be push, not pull — something has to happen on a schedule whether or not anyone asks for it.</li>
          <li>The value is in <em>precomputing</em> an aggregate a client would otherwise have to re-derive from potentially many raw rows on every request — not in producing a file, but in not repeating expensive work.</li>
        </ul>
        <p>Neither statement nor export cleared any of these. A monthly spending-pattern analysis — total/average withdrawal, month-over-month %-change, a trend label — did, on the third reason: computing that from raw transactions is exactly the kind of aggregation nobody wants running live, on every request, for every account.</p>
        <h2>What Survived, and Why</h2>
        <p>The whole feature is: a Cron enqueues a Task on the 1st of the month; the Task paginates every active account, aggregates last month's (and the month before's) withdrawals, and writes one precomputed row per account per month. A new query endpoint serves that row directly — no live aggregation, ever, on the read path:</p>
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
        <p>That's the entire "T" in ETL — two numbers in, a percentage and a label out. Extract is the existing per-account transaction table; Load is one upsert-shaped row, idempotent via a (accountId, month) unique constraint, the same two-layer pattern the repo's card-statement job already used. Nothing here needed inventing — the win was recognizing that a CQRS read-model, expressed as a batch job, was the shape that survived the question the report ideas didn't.</p>
        <div className="article-note"><strong>Real numbers from the actual test</strong><p>The e2e test backdates two withdrawals — 30,000 and 20,000 — into "last month," runs the real scheduler, and reads back a row with <code>totalAmount: 50000</code>, <code>transactionCount: 2</code>, <code>averageAmount: 25000</code>, and — since there's no prior-prior-month history to compare against — <code>changeFromPreviousMonth: 100</code>, <code>trend: 'INCREASING'</code>. Re-running the same month's job a second time doesn't produce a second row.</p></div>
        <h2>The Rule, Stated Plainly</h2>
        <p>"Can the server do this" is nearly always yes. The question that actually filters ideas is narrower: does the client have a real reason — not a convenience one — that it can't do this itself? Most report-shaped requests fail that question quietly, because report-shaped is UI work wearing a backend costume. The one that survives is usually the one that isn't shaped like a report at all.</p>
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
    lede: '요청은 ETL 기능을 추가해 달라는 것이었다. 뒤이은 모든 제안이 똑같은 한 줄짜리 질문 앞에서 무너졌다 — 딱 하나만 무너지지 않았고, 그게 살아남은 이유가 곧 진짜 규칙이었다.',
    body: (
      <>
        <p>"데이터 ETL 기능을 추가해달라"는 승낙하기는 쉽지만 채우기는 뜻밖에 어려운 요청이다. 가장 먼저 떠오른 것들 — CSV 형태의 월별 계좌 명세서, GDPR식 "내 데이터 전체 다운로드" — 은 둘 다 진짜 백엔드 작업처럼 들렸다. 둘 다 담백하게 던진 같은 질문 앞에서 무너졌다: 클라이언트가 기존 조회 API를 불러서 그 파일을 직접 만들면 되지 않나?</p>
        <h2>계속해서 아이디어를 죽인 질문</h2>
        <p>월별 명세서의 경우: 계좌의 거래 내역은 이미 <code>GetTransactions</code>로 전부 조회 가능하다. 한 달치 행을 받아와 CSV로 렌더링하는 건 클라이언트의 일이지 백엔드의 일이 아니다 — 서버가 대신 해주는 건 편의일 뿐 필요가 아니다. 데이터 내보내기도 형태는 같고 범위만 크다. Account+Card+Payment+Refund를 한 파일로 합치는 건 클라이언트가 만들기엔 더 번거롭지만, "번거롭다"와 "불가능하다"는 서로 다른 주장이고, 서버에 올려야 할 근거가 되는 건 그중 하나뿐이다.</p>
        <p>제안 두 개, 서버가 실제로는 필요 없다는 솔직한 인정 두 번. 이건 질문 자체가 잘못됐다는 좋은 신호였다 — "서버가 이걸 할 수 있는가"가 아니라 "클라이언트에게 이걸 할 수 없는 진짜 이유가 있는가"를 물어야 했다.</p>
        <h2>실제로 중요한 경계선</h2>
        <p>서버 사이드 배치 작업이 제자리를 얻는 건 몇 가지 진짜 이유 중 하나일 때뿐이다 — 그저 가능하다는 이유만으로는 안 된다:</p>
        <ul>
          <li>클라이언트가 애초에 그 데이터에 닿을 수 없다 — 다른 사용자의 데이터이거나, 특정 사람의 것이 아니거나(내부 운영 리포트, 사람 클라이언트가 아예 없는 외부 시스템용 정산 파일).</li>
          <li>전달이 pull이 아니라 push여야 한다 — 누가 요청하든 안 하든 정해진 일정에 무언가 일어나야 한다.</li>
          <li>가치가 파일을 만드는 데 있는 게 아니라, 클라이언트가 매 요청마다 잠재적으로 많은 원본 행에서 다시 도출해야 할 집계값을 <em>미리 계산</em>해두는 데 있다 — 비싼 작업을 반복하지 않는 것 자체가 가치다.</li>
        </ul>
        <p>명세서도 데이터 내보내기도 이 중 어느 것도 통과하지 못했다. 월간 지출 패턴 분석 — 총/평균 출금액, 전월 대비 증감률, 추세 라벨 — 은 세 번째 이유로 통과했다. 원본 거래에서 이걸 계산하는 건 정확히, 매 요청마다 모든 계좌를 상대로 실시간으로 돌리고 싶지 않은 종류의 집계다.</p>
        <h2>살아남은 것, 그리고 그 이유</h2>
        <p>기능 전체는 이렇다: 매월 1일 Cron이 Task를 큐에 등록한다. Task는 모든 활성 계좌를 순회하며 지난달(그리고 비교를 위해 그 전달)의 출금을 집계하고, 계좌당 월당 미리 계산된 행 하나를 기록한다. 새 조회 API는 그 행을 그대로 서빙한다 — 조회 경로에서는 실시간 집계가 단 한 번도 일어나지 않는다:</p>
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
        <p>이게 ETL의 "T" 전부다 — 숫자 두 개가 들어가서 퍼센트 하나와 라벨 하나가 나온다. Extract는 이미 있는 계좌별 거래 테이블이고, Load는 upsert 형태의 행 하나, (accountId, month) 유니크 제약으로 멱등하다 — 이 저장소의 카드 명세서 작업이 이미 쓰던 것과 같은 이중 방어 패턴이다. 새로 발명할 건 아무것도 없었다 — 승리는, CQRS read model을 배치 작업 형태로 표현한 것이 리포트류 아이디어들이 통과하지 못한 질문을 통과한 형태였다는 걸 알아본 데 있었다.</p>
        <div className="article-note"><strong>실제 테스트에서 나온 진짜 숫자</strong><p>e2e 테스트는 30,000원과 20,000원, 두 번의 출금을 "지난달"로 날짜를 되돌려 넣고, 실제 스케줄러를 돌린 뒤, <code>totalAmount: 50000</code>, <code>transactionCount: 2</code>, <code>averageAmount: 25000</code>인 행을 읽어온다 — 그리고 비교할 그 전전달 이력이 없으므로 <code>changeFromPreviousMonth: 100</code>, <code>trend: 'INCREASING'</code>이 된다. 같은 달의 작업을 두 번째로 돌려도 두 번째 행은 생기지 않는다.</p></div>
        <h2>규칙을 담백하게 정리하면</h2>
        <p>"서버가 이걸 할 수 있는가"는 거의 항상 그렇다이다. 실제로 아이디어를 걸러내는 질문은 더 좁다: 클라이언트에게 이걸 직접 할 수 없는 진짜 이유가 있는가 — 편의상의 이유 말고. 리포트 모양을 한 요청 대부분은 이 질문을 조용히 통과하지 못한다. 리포트 모양이라는 것 자체가 백엔드 옷을 입은 UI 작업이기 때문이다. 살아남는 건 대개 애초에 리포트처럼 생기지 않은 쪽이다.</p>
        <div className="article-note"><strong>더 읽을거리</strong><p>
          <a href="/posts/scheduling-and-task-outbox">스케줄링과 Task Outbox 패턴</a> — 이 기능이 새로 만들 것 없이 그대로 재사용한 Cron→Task Queue 인프라 · <a href="/posts/cqrs-in-practice">실전 CQRS</a> — 이 기능의 read model이 지켜야 했던 Query 쪽 규율
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
