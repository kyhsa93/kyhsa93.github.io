import PostLayout from '../../components/PostLayout';
import { useLocale, localeFromPathname } from '../../lib/locale';
import type { MetaFunction } from 'react-router';
import { createPostMeta } from '../../lib/seo';

export const meta: MetaFunction = ({ location }) =>
  createPostMeta('half-the-site-was-a-copy-of-itself', localeFromPathname(location.pathname));

const SHINGLE_SNIPPET = `import re, html, glob
from collections import Counter

K = 8  # shingle length, in words

def text(path):
    s = open(path, encoding="utf-8").read()
    s = re.sub(r"<script.*?</script>", "", s, flags=re.S | re.I)
    s = re.sub(r"<style.*?</style>", "", s, flags=re.S | re.I)
    s = html.unescape(re.sub(r"<[^>]+>", " ", s))
    return re.sub(r"\\s+", " ", s).strip()

def shingles(t):
    w = t.split()
    return {" ".join(w[i:i + K]) for i in range(max(0, len(w) - K + 1))}

pages = {f: shingles(text(f)) for f in glob.glob("*.html")}

df = Counter()
for s in pages.values():
    for x in s:
        df[x] += 1

for f, s in sorted(pages.items(), key=lambda kv: len(kv[1]) and
                   sum(df[x] == 1 for x in kv[1]) / len(kv[1])):
    if not s:
        continue
    unique = sum(1 for x in s if df[x] == 1)
    print(f"{unique / len(s):6.1%}  {unique:5d}/{len(s):<5d}  {f}")`;

const content = {
  en: {
    kicker: 'Content · Auditing',
    title: (
      <>
        Half the Site<br /><em>Was a Copy of Itself</em>
      </>
    ),
    lede: "Every page passed a word-count check. Every page had a distinct title, a distinct URL, and numbers nobody else had. And slightly under half of all the text on the site existed on more than one page. Here is the fifteen-line measurement that found it, and the three structurally different ways a page ends up duplicating its neighbour without anyone deciding it should.",
    body: (
      <>
        <p>Duplication inside your own site is hard to see by reading. You open two pages, they look different — different headings, different numbers, different titles in the tab — and you move on. The eye compares the parts that change. It does not add up the parts that don't.</p>
        <p>So measure it instead. The question worth asking is not "are these two pages similar" but <strong>what fraction of this page's text exists only on this page</strong>. That number is cheap to compute and it ranks the whole site at once.</p>

        <h2>The Measurement</h2>
        <p>Break every page into overlapping 8-word windows — shingles — and count how many pages each window appears on. A window that appears on exactly one page is that page's own writing. Everything else is shared with a neighbour.</p>
        <pre><code>{SHINGLE_SNIPPET}</code></pre>
        <p>Eight words is long enough that ordinary phrases ("of the following") don't collide by accident, and short enough to catch a sentence that was copied and had two numbers changed. Sorting ascending puts the worst offenders first, which is where the interesting failures are.</p>
        <div className="article-note"><strong>Strip the scripts first</strong><p>If your pages carry inline JavaScript that builds markup from template literals, a naive tag-stripper will read those literals as page text. That inflates the shared count on every page that ships the same bundle and buries the real signal. On the site I ran this against, skipping that step once produced a table-width measurement for a table that did not exist.</p></div>

        <h2>Shape One: The Template With One Variable</h2>
        <p>Eighty pages, one per birth year, each around 750 characters. Each had a distinct title, a distinct URL, and a distinct heading. Four body sections carried the actual prose.</p>
        <p>All four were keyed on the same single field — a five-value classification derived from the year — and read their text straight out of a five-entry dictionary. The pages for two consecutive years were <em>identical</em> below the heading, character for character, because both years mapped to the same class.</p>
        <p>Eighty pages. Five distinct bodies. Nothing in the code looked wrong; each function did exactly what its name said. The defect only exists at the level of the whole set, and no test that looks at one page can see it.</p>
        <p>The general form: <strong>a generated page is as distinct as its narrowest input, not its widest one.</strong> If the URL varies over 80 values and the prose varies over 5, you have 5 pages wearing 80 URLs. Count the distinct outputs, not the distinct inputs.</p>

        <h2>Shape Two: The Hub That Renders Its Own Child</h2>
        <p>A comparison page with four product tabs. The tab contents are prerendered into four separate landing pages, one per product, so each is indexable on its own terms. Sensible design.</p>
        <p>But the hub itself has to render <em>something</em> before you touch a tab, and it renders the first tab. Which is the first landing page. The two URLs came back with 131 lines of visible text each, differing in exactly one line: the title.</p>
        <p>This one is invisible in code review because the duplication is not in the source — it is in what the source produces. One file, two URLs, one page. It also survives every "does each page have unique metadata" check, because the metadata genuinely is unique. Only the rendered body gives it away.</p>

        <h2>Shape Three: The Component That Outgrew Its Page</h2>
        <p>A 25-row comparison table, written once, injected by a build step into every page that might want it. It ended up on 51 pages.</p>
        <p>On the page it was written for, it is the content. On the 18 budget-bracket pages that also received it, it was roughly half of all the text — and it did not answer those pages' question at all. Strip the shared shell and the table away, and what those 18 pages had of their own was three sentences.</p>
        <p>Word count never flagged them. Every one was 3,000–3,100 characters, comfortably above any thin-content heuristic you would write. The volume was real; it just wasn't theirs.</p>

        <h2>What the Fix Actually Is</h2>
        <p>The obvious move — append more text to the thin pages — is the wrong one, and it fails in a specific way: if every page gets the same five extra sentences, a four-sentence template becomes a nine-sentence template. The shingle count barely moves, because you added shared text to solve a shared-text problem.</p>
        <p>What works is the opposite: give each page permission to <em>say less</em>. Compute a set of candidate observations from that page's own underlying data, put a threshold on each one, and emit only the ones that cross. A page with nothing distinctive in its data then says nothing distinctive, which is honest, and the pages that do have something say different things from each other, which is the entire point.</p>
        <div className="article-note"><strong>Set the thresholds before you look at the results</strong><p>The temptation is to tune a threshold until a particular page qualifies. That is fitting the rule to the answer, and it produces observations that are technically true and practically meaningless. Pick thresholds that already mean something outside your dataset — a regulatory line, a standard size class, a bootstrap interval computed from resampling your own population — and then accept whatever they select. If a page crosses nothing, saying "nothing here stands out" is a real finding and reads as one.</p></div>

        <h2>The Number to Watch</h2>
        <p>Site-wide, that first run came back at 51.7% — slightly under half of all shingles appeared on more than one page. The per-page ranking mattered more than the total: three pages came in under 3% unique, and those three turned out to be shapes one and two, which nobody would have found by reading.</p>
        <p>Run it on your own site before you assume the answer. It takes about a minute, it needs nothing but the built HTML, and the pages at the top of that sorted list are almost never the ones you would have guessed.</p>
      </>
    ),
  },
  ko: {
    kicker: 'Content · Auditing',
    title: (
      <>
        사이트의 절반은<br /><em>사이트 자신의 복사본이었다</em>
      </>
    ),
    lede: '모든 페이지가 분량 검사를 통과했다. 제목도 URL도 다 달랐고, 다른 데 없는 숫자도 갖고 있었다. 그런데 사이트 전체 텍스트의 절반 가까이가 한 장 이상에 존재했다. 그걸 찾아낸 열다섯 줄짜리 측정과, 아무도 그러기로 정한 적 없는데 페이지가 옆 페이지를 베끼게 되는 구조적으로 다른 세 가지 방식.',
    body: (
      <>
        <p>내 사이트 안의 중복은 읽어서는 잘 안 보인다. 두 페이지를 열면 달라 보인다 — 제목이 다르고, 숫자가 다르고, 탭에 뜨는 이름이 다르다. 그러고 넘어간다. 눈은 바뀌는 부분을 비교하지, 안 바뀌는 부분을 합산하지 않는다.</p>
        <p>그러니 재야 한다. 물어야 할 것은 "이 두 페이지가 비슷한가"가 아니라 <strong>이 페이지의 텍스트 중 이 페이지에만 있는 것이 몇 %인가</strong>이다. 이 값은 계산이 싸고, 사이트 전체를 한 번에 줄 세운다.</p>

        <h2>측정</h2>
        <p>모든 페이지를 겹치는 8단어 창(shingle)으로 쪼개고, 각 창이 몇 장에 나타나는지 센다. 정확히 한 장에만 나타나는 창이 그 페이지가 직접 쓴 것이다. 나머지는 전부 옆 페이지와 공유하는 것이다.</p>
        <pre><code>{SHINGLE_SNIPPET}</code></pre>
        <p>8단어는 흔한 관용구가 우연히 겹치지 않을 만큼 길고, 문장 하나를 복사해 숫자 두 개만 바꾼 것을 잡아낼 만큼 짧다. 오름차순으로 정렬하면 가장 나쁜 것이 맨 위에 오는데, 재미있는 실패는 거기 있다.</p>
        <div className="article-note"><strong>스크립트를 먼저 걷어낼 것</strong><p>인라인 자바스크립트가 템플릿 리터럴로 마크업을 만드는 페이지라면, 태그만 지우는 단순한 방식은 그 리터럴을 본문으로 읽는다. 같은 번들을 싣는 모든 페이지에서 공유 비율이 부풀고 진짜 신호가 묻힌다. 이 측정을 돌린 사이트에서는 이 단계를 빠뜨렸다가, 존재하지도 않는 표의 가로 폭을 재서 없는 문제를 하나 만들어 낸 적이 있다.</p></div>

        <h2>첫 번째 모양: 변수가 하나뿐인 템플릿</h2>
        <p>출생 연도별로 한 장씩, 여든 장. 각 750자 남짓. 제목도 URL도 머리글도 다 달랐다. 본문은 네 개 절이 나눠 갖고 있었다.</p>
        <p>그런데 네 절이 전부 같은 필드 하나 — 연도에서 유도한 다섯 가지 분류 — 를 키로 써서, 항목이 다섯 개뿐인 사전에서 문장을 그대로 꺼내 쓰고 있었다. 연속한 두 해의 페이지는 머리글 아래로 <em>글자까지 같았다.</em> 두 해가 같은 분류로 떨어졌기 때문이다.</p>
        <p>여든 장, 본문 다섯 종. 코드에는 잘못된 곳이 없다. 함수마다 이름대로 정확히 동작한다. 결함은 집합 전체 수준에서만 존재하고, 한 장을 보는 어떤 테스트도 이걸 볼 수 없다.</p>
        <p>일반형: <strong>생성된 페이지는 가장 넓은 입력이 아니라 가장 좁은 입력만큼만 다르다.</strong> URL이 80가지로 갈리고 문장이 5가지로 갈리면, URL 여든 개를 쓴 페이지 다섯 장이다. 입력의 가짓수가 아니라 출력의 가짓수를 세야 한다.</p>

        <h2>두 번째 모양: 자기 자식을 그리는 허브</h2>
        <p>상품군 탭 넷이 달린 비교 페이지. 탭 내용은 상품군마다 한 장씩 네 장의 착지 페이지로 미리 그려 둔다. 각각이 자기 이름으로 검색에 걸리도록. 합리적인 설계다.</p>
        <p>그런데 허브 자신도 탭을 누르기 전에 <em>무언가는</em> 그려야 하고, 첫 번째 탭을 그린다. 그 첫 번째 탭이 곧 첫 번째 착지 페이지다. 두 URL을 받아 보니 눈에 보이는 본문이 각각 131줄이었고, 다른 줄은 정확히 하나 — 제목이었다.</p>
        <p>이건 코드 리뷰로는 안 보인다. 중복이 소스에 있는 게 아니라 소스가 만들어 내는 것에 있기 때문이다. 파일 하나, URL 둘, 페이지 하나. "페이지마다 메타데이터가 고유한가" 류의 검사도 전부 통과한다 — 메타데이터는 실제로 고유하니까. 렌더된 본문만이 이걸 드러낸다.</p>

        <h2>세 번째 모양: 페이지보다 커져 버린 공용 조각</h2>
        <p>25행짜리 비교표. 한 번 쓰고, 빌드 단계가 필요할 법한 모든 페이지에 심었다. 결과적으로 51장에 들어갔다.</p>
        <p>그 표를 위해 만들어진 페이지에서는 그게 본문이다. 그런데 같이 받은 예산 구간 페이지 열여덟 장에서는 전체 텍스트의 절반쯤이었고, 그 페이지들의 질문에는 답하지도 않았다. 공용 껍데기와 그 표를 걷어내면, 열여덟 장이 자기 것으로 갖고 있던 것은 세 문장이었다.</p>
        <p>분량 검사에는 한 번도 안 걸렸다. 전부 3,000~3,100자로, 어떤 얇은-콘텐츠 휴리스틱을 짜도 넉넉히 넘는다. 분량은 진짜였다. 그 페이지 것이 아니었을 뿐이다.</p>

        <h2>고치는 방법</h2>
        <p>떠오르는 수 — 얇은 페이지에 문장을 더 붙인다 — 는 틀렸고, 틀리는 방식이 구체적이다. 모든 페이지에 같은 다섯 문장을 더하면 네 문장짜리 틀이 아홉 문장짜리 틀이 될 뿐이다. 공유 텍스트 문제를 공유 텍스트를 늘려서 풀었으니 shingle 수치는 거의 안 움직인다.</p>
        <p>먹히는 것은 반대다. 각 페이지에 <em>덜 말할</em> 권한을 준다. 그 페이지가 딛고 선 원본 데이터에서 관찰 후보를 계산하고, 관찰마다 문턱을 걸고, 문턱을 넘은 것만 내보낸다. 데이터에 특별한 게 없는 페이지는 특별한 말을 하지 않게 되고 — 그게 정직하다 — 뭔가 있는 페이지들은 서로 다른 말을 하게 된다. 그게 애초에 목적이었다.</p>
        <div className="article-note"><strong>문턱은 결과를 보기 전에 정할 것</strong><p>특정 페이지가 걸리도록 문턱을 조정하고 싶어진다. 그건 답에 맞춰 규칙을 만드는 것이고, 기술적으로는 참이지만 실질적으로는 아무 뜻도 없는 관찰이 나온다. 데이터셋 바깥에서 이미 뜻을 갖는 값을 고를 것 — 규제선, 표준 규격 구간, 자기 모집단을 재추출해 얻은 부트스트랩 구간 같은 것. 그리고 그것이 골라내는 대로 받아들일 것. 아무것도 못 넘은 페이지라면 "여기엔 튀는 데가 없다"고 적는 것이 진짜 발견이고, 읽는 사람에게도 그렇게 읽힌다.</p></div>

        <h2>지켜볼 숫자</h2>
        <p>사이트 전체로는 첫 측정이 51.7%였다. shingle의 절반 가까이가 한 장 이상에 나타났다. 총계보다 중요한 것은 페이지별 순위였다 — 고유 비율 3% 미만인 페이지가 셋 나왔고, 그 셋이 첫 번째와 두 번째 모양이었다. 읽어서는 아무도 못 찾았을 것들이다.</p>
        <p>답을 짐작하기 전에 자기 사이트에 한번 돌려 보기를 권한다. 1분이면 되고, 빌드된 HTML 말고는 아무것도 필요 없고, 정렬된 목록 맨 위에 오는 페이지는 짐작했던 그것인 경우가 거의 없다.</p>
      </>
    ),
  },
};

export default function HalfTheSiteWasACopyOfItself() {
  const { locale } = useLocale();
  const c = content[locale];

  return (
    <PostLayout
      slug="half-the-site-was-a-copy-of-itself"
      kicker={c.kicker}
      title={c.title}
      lede={c.lede}
    >
      {c.body}
    </PostLayout>
  );
}
