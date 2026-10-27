import PostLayout from '../../components/PostLayout';
import { useLocale, localeFromPathname } from '../../lib/locale';
import type { MetaFunction } from 'react-router';
import { createPostMeta } from '../../lib/seo';

export const meta: MetaFunction = ({ location }) =>
  createPostMeta('register-the-forecast-before-the-answer', localeFromPathname(location.pathname));

const content = {
  en: {
    kicker: 'Data · Methodology',
    title: (
      <>
        Register the Forecast<br /><em>Before You See the Answer</em>
      </>
    ),
    lede: 'Write the three-month forecast down, then put it next to the actual value when it arrives. Misses stay on the page. Cells with too small a sample show a blank instead of a number. These are the pre-registration and scoring rules used on a small site that aggregates Seoul apartment transactions.',
    body: (
      <>
        <p>Before asking whether a forecast is right, ask whether a miss would be visible. If not, only the hits survive and the forecast becomes advertising. The three rules below exist for that one question.</p>
        <h2>Once registered, never edited</h2>
        <p>Each month a three-month change is registered for Seoul and its sub-regions as a median with an interval. The record keeps the origin month, the target month, the interval, and any later adjustment with the date it was added. When the target month arrives, the official index goes next to it and the only thing written is whether it fell inside. Misses stay. Editing a registration after seeing the answer deletes the comparison itself.</p>
        <h2>Scoring rules are committed before the first score</h2>
        <p>The ledger that scores whether a complex's price range contained the deals that followed starts with a rules document, effective only from its commit date. Snapshots on the first of each month. A cell is the same complex and floor area with at least three deals in the previous 183 days. Follow-up windows of 30, 60 and 90 days are all published; no window is chosen afterwards. Only deals past the reporting deadline count. A hit is inclusive at both bounds. The nominal rate and the refutation threshold are written in advance and not changed after results. Changes add a new version and keep the old values. The first number needs three snapshots, so it arrives in January 2027 at the earliest; until then the table says "collecting (n deals)".</p>
        <h2>Short cells stay blank</h2>
        <p>Only three public units exist: district totals, price bands, and sample-size bands. Any row with fewer than 100 scored deals shows no number. Cells with fewer than three deals enter no aggregate at all. A blank is not a failure mark; it is the answer "this sample cannot say". Rows that do show a number carry n and a binomial confidence interval, with a note that deals in the same complex or region are correlated, so the independent sample is smaller than n.</p>
        <h2>Why</h2>
        <p>A forecast is worth what its visible misses are worth. Write before the answer, rules before results, blank when short. Keep those three and a bad result can be published, and because it can be published it is worth reading.</p>
        <div className="article-note"><strong>Further reading</strong><p>
          <a href="https://github.com/kyhsa93/jipgye/releases/tag/monthly-report-2026-10" target="_blank" rel="noreferrer">monthly-report-2026-10</a> (the first monthly aggregate of Seoul apartment transactions for October 2026 produced under these rules, free) · Questions go to <a href="https://github.com/kyhsa93/jipgye/discussions" target="_blank" rel="noreferrer">Discussions</a>; it is a public board, so the post and your GitHub handle are visible to everyone.
        </p></div>
      </>
    ),
  },
  ko: {
    kicker: '데이터 · 방법',
    title: (
      <>
        답을 보기 전에<br /><em>전망을 등록한다</em>
      </>
    ),
    lede: '석 달 뒤 값을 미리 적어 두고, 석 달 뒤 실제 값과 나란히 놓는다. 빗나간 전망도 지우지 않는다. 표본이 모자란 칸은 숫자 대신 빈칸으로 둔다. 서울 아파트 실거래를 집계하는 작은 사이트에서 쓰는 사전 등록과 채점 절차를 적는다.',
    body: (
      <>
        <p>어떤 전망이 맞는지보다 먼저 물을 것이 있다. 틀렸을 때 그것이 보이는가. 보이지 않는 구조라면 적중 사례만 남고, 그 전망은 성적표가 아니라 광고가 된다. 아래 세 규칙은 전부 그 하나를 위한 것이다.</p>
        <h2>등록한 뒤에는 고치지 않는다</h2>
        <p>매달 서울과 권역별로 "3개월 뒤 변화"를 중앙값과 구간으로 등록한다. 등록 기록에는 기준 달, 대상 달, 구간, 그리고 나중에 더해진 보정값과 그것을 더한 날짜가 그대로 남는다. 대상 달이 오면 공식 지수를 옆에 놓고 구간 안에 들었는지만 적는다. 빗나간 달도 그 자리에 남는다. 결과를 보고 등록을 고치면 비교 자체가 없어진다.</p>
        <h2>채점 규칙은 첫 숫자보다 먼저 쓴다</h2>
        <p>단지별 가격 범위가 뒤에 실제로 체결된 값을 품었는지 채점하는 원장은, 규칙 문서를 먼저 커밋하고 그 커밋 날짜부터만 효력을 가진다. 스냅샷은 매월 1일. 칸은 직전 183일 동안 같은 단지·면적에서 거래가 3건 이상인 것. 후속 거래 창은 30·60·90일 셋을 모두 싣고 나중에 유리한 창을 고르지 않는다. 신고 기한이 닫힌 거래만 센다. 적중은 하한과 상한 양끝을 포함한다. 공칭값과 반증 기준도 미리 적어 두고 결과를 보고 바꾸지 않는다. 바꿀 일이 생기면 새 버전을 더하고 이전 값은 지우지 않는다. 첫 숫자는 스냅샷이 세 번 쌓인 뒤라 빨라도 2027년 1월이고, 그때까지 표에는 숫자 대신 "집계 중(n건)"이 들어간다.</p>
        <h2>모자란 칸은 비운다</h2>
        <p>공개 단위는 자치구 합산, 가격대, 표본 크기 구간 셋뿐이고, 어느 줄이든 채점 건수가 100 미만이면 숫자를 싣지 않는다. 거래 3건 미만인 칸은 어떤 집계에도 들어가지 않는다. 빈칸은 실패 표시가 아니라 "이 표본으로는 말할 수 없다"는 답이다. 숫자를 싣는 줄에는 n과 이항 신뢰구간을 붙이고, 같은 단지·같은 권역의 거래는 서로 상관돼 있어 독립 표본은 n보다 적다는 말을 함께 적는다.</p>
        <h2>왜 이렇게 하나</h2>
        <p>전망의 값어치는 맞혔다는 주장이 아니라 틀린 자리가 보이는 구조에 있다. 답을 보기 전에 적는다, 규칙은 결과보다 먼저 쓴다, 모자라면 비운다. 이 셋을 지키면 결과가 나빠도 공개할 수 있고, 공개할 수 있으니 읽을 가치가 생긴다.</p>
        <div className="article-note"><strong>더 볼 자료</strong><p>
          <a href="https://github.com/kyhsa93/jipgye/releases/tag/monthly-report-2026-10" target="_blank" rel="noreferrer">monthly-report-2026-10</a>(이 절차로 만든 2026년 10월 서울 아파트 실거래 월간 집계 1부, 무료) · 질문은 <a href="https://github.com/kyhsa93/jipgye/discussions" target="_blank" rel="noreferrer">Discussions</a>에 남겨 주세요. 공개 게시판이라 글과 GitHub 아이디가 모두에게 보입니다.
        </p></div>
      </>
    ),
  },
};

export default function RegisterTheForecastBeforeTheAnswer() {
  const { locale } = useLocale();
  const c = content[locale];

  return (
    <PostLayout slug="register-the-forecast-before-the-answer" kicker={c.kicker} title={c.title} lede={c.lede}>
      {c.body}
    </PostLayout>
  );
}
