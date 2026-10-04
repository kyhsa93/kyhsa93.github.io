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
        <p>Duplication inside your own site is hard to see by reading. You open two pages, they look different (different headings, different numbers, different titles in the tab), and you move on. The eye compares the parts that change. It does not add up the parts that don't.</p>
        <p>So measure it instead. The question worth asking is not "are these two pages similar" but <strong>what fraction of this page's text exists only on this page</strong>. That number is cheap to compute and it ranks the whole site at once.</p>

        <h2>The Measurement</h2>
        <p>Break every page into overlapping 8-word windows (shingles) and count how many pages each window appears on. A window that appears on exactly one page is that page's own writing. Everything else is shared with a neighbour.</p>
        <pre><code>{SHINGLE_SNIPPET}</code></pre>
        <p>Eight words is long enough that ordinary phrases ("of the following") don't collide by accident, and short enough to catch a sentence that was copied and had two numbers changed. Sorting ascending puts the worst offenders first, which is where the interesting failures are.</p>
        <div className="article-note"><strong>Strip the scripts first</strong><p>If your pages carry inline JavaScript that builds markup from template literals, a naive tag-stripper will read those literals as page text. That inflates the shared count on every page that ships the same bundle and buries the signal. On the site I ran this against, skipping that step once produced a table-width measurement for a table that did not exist.</p></div>

        <h2>Shape One: The Template With One Variable</h2>
        <p>Eighty pages, one per birth year, each around 750 characters. Each had a distinct title, a distinct URL, and a distinct heading. Four body sections carried the prose.</p>
        <p>All four were keyed on the same single field, a five-value classification derived from the year, and read their text straight out of a five-entry dictionary. The pages for two consecutive years were <em>identical</em> below the heading, character for character, because both years mapped to the same class.</p>
        <p>Eighty pages. Five distinct bodies. Nothing in the code looked wrong; each function did what its name said. The defect only exists at the level of the whole set, and no test that looks at one page can see it.</p>
        <p>Put generally, <strong>a generated page is as distinct as its narrowest input, not its widest one.</strong> If the URL varies over 80 values and the prose varies over 5, you have 5 pages wearing 80 URLs. Count the distinct outputs, not the distinct inputs.</p>

        <h2>Shape Two: The Hub That Renders Its Own Child</h2>
        <p>A comparison page with four product tabs. The tab contents are prerendered into four separate landing pages, one per product, so each is indexable on its own terms. Sensible design.</p>
        <p>But the hub itself has to render <em>something</em> before you touch a tab, and it renders the first tab. Which is the first landing page. The two URLs came back with 131 lines of visible text each, differing in exactly one line: the title.</p>
        <p>This one is invisible in code review because the duplication is not in the source. It is in what the source produces. One file, two URLs, one page. It also survives every "does each page have unique metadata" check, because the metadata is unique. Only the rendered body gives it away.</p>

        <h2>Shape Three: The Component That Outgrew Its Page</h2>
        <p>A 25-row comparison table, written once, injected by a build step into every page that might want it. It ended up on 51 pages.</p>
        <p>On the page it was written for, it is the content. On the 18 budget-bracket pages that also received it, it was roughly half of all the text, and it did not answer those pages' question at all. Strip the shared shell and the table away, and what those 18 pages had of their own was three sentences.</p>
        <p>Word count never flagged them. Every one was 3,000–3,100 characters, comfortably above any thin-content heuristic you would write. The volume was real; it just wasn't theirs.</p>

        <h2>What the Fix Is</h2>
        <p>The obvious move, appending more text to the thin pages, is the wrong one, and it fails in a specific way: if every page gets the same five extra sentences, a four-sentence template becomes a nine-sentence template. The shingle count barely moves, because you added shared text to solve a shared-text problem.</p>
        <p>What works is the opposite: give each page permission to <em>say less</em>. Compute a set of candidate observations from that page's own underlying data, put a threshold on each one, and emit only the ones that cross. A page with nothing distinctive in its data then says nothing distinctive, which is honest, and the pages that do have something say different things from each other, which is the entire point.</p>
        <div className="article-note"><strong>Set the thresholds before you look at the results</strong><p>The temptation is to tune a threshold until a particular page qualifies. That is fitting the rule to the answer, and it produces observations that are technically true and practically meaningless. Pick thresholds that already mean something outside your dataset: a regulatory line, a standard size class, a bootstrap interval computed from resampling your own population — and then accept whatever they select. If a page crosses nothing, saying "nothing here stands out" is a real finding and reads as one.</p></div>

        <h2>The Number to Watch</h2>
        <p>Site-wide, that first run came back at 51.7% unique, which means slightly under half of all shingles appeared on more than one page. The per-page ranking mattered more than the total: three pages came in under 3% unique, and those three turned out to be shapes one and two, which nobody would have found by reading.</p>
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
    lede: '모든 페이지가 분량 검사를 통과했다. 제목도 URL도 다 달랐고, 다른 데 없는 숫자도 하나씩 갖고 있었다. 그런데 사이트 전체 텍스트의 절반에 조금 못 미치는 양이 두 장 이상의 페이지에 똑같이 들어 있었다. 이걸 찾아낸 15줄짜리 측정 방법과, 아무도 그러자고 정한 적이 없는데 페이지가 옆 페이지를 베끼게 되는 세 가지 경우를 정리했다. 세 경우는 구조가 서로 다르다.',
    body: (
      <>
        <p>자기 사이트 안의 중복은 읽어서는 잘 안 보인다. 두 페이지를 열어 보면 제목도 숫자도 탭 이름도 다르다. 그래서 다르다고 여기고 넘어간다. 눈은 바뀌는 부분끼리 비교할 뿐, 안 바뀌는 부분이 얼마나 되는지는 더해 보지 않는다.</p>
        <p>그러니 재 봐야 한다. "이 두 페이지가 비슷한가"를 묻는 것보다 <strong>이 페이지 텍스트 중 이 페이지에만 있는 게 몇 %인가</strong>를 묻는 게 낫다. 계산도 싸고, 사이트 전체를 한 번에 줄 세울 수 있다.</p>

        <h2>측정 방법</h2>
        <p>모든 페이지를 8단어씩 겹치는 창으로 쪼갠다. 이걸 shingle이라고 부른다. 그리고 창마다 몇 장의 페이지에 나오는지 센다. 딱 한 장에만 나오는 창은 그 페이지가 직접 쓴 글이다. 나머지는 전부 옆 페이지와 나눠 쓰는 글이다.</p>
        <pre><code>{SHINGLE_SNIPPET}</code></pre>
        <p>8단어면 흔한 관용구가 우연히 겹치지 않을 만큼 길고, 문장 하나를 복사해 숫자 두 개만 바꾼 것도 잡아낼 만큼 짧다. 오름차순으로 정렬하면 가장 심한 페이지가 맨 위에 온다. 눈여겨볼 실패는 대개 거기 있다.</p>
        <div className="article-note"><strong>스크립트부터 걷어낼 것</strong><p>템플릿 리터럴로 마크업을 만드는 인라인 자바스크립트가 페이지에 들어 있다면, 태그만 지우는 단순한 방식은 그 리터럴을 본문으로 읽는다. 같은 번들을 싣는 페이지마다 공유 비율이 부풀고, 봐야 할 신호가 묻힌다. 나도 이 단계를 한 번 빠뜨렸다가, 있지도 않은 표의 가로 폭을 재서 없는 문제를 하나 만든 적이 있다.</p></div>

        <h2>첫째, 변수가 하나뿐인 템플릿</h2>
        <p>출생 연도마다 한 장씩, 모두 80장이었다. 한 장에 750자 남짓이다. 제목, URL, 머리글은 페이지마다 달랐다. 본문은 4개 절로 나뉘어 있었다.</p>
        <p>그런데 네 절이 모두 같은 필드 하나를 키로 쓰고 있었다. 연도로 정하는 분류 값인데, 가짓수가 5개뿐이다. 문장은 항목이 5개인 사전에서 그대로 꺼내 왔다. 그래서 연이은 두 해의 페이지가 머리글 아래로는 <em>글자 하나까지 같았다.</em> 두 해가 같은 분류에 들어갔기 때문이다.</p>
        <p>페이지는 80장인데 본문은 5가지뿐이었다. 코드에는 틀린 데가 없었다. 함수마다 이름에 적힌 일을 그대로 했다. 결함은 페이지 전체를 모아서 볼 때만 보이고, 한 장씩 보는 테스트로는 어떻게 해도 잡을 수 없다.</p>
        <p>일반화하면 이렇다. <strong>생성된 페이지는 입력 중 가짓수가 가장 많은 것이 아니라 가장 적은 것만큼만 서로 다르다.</strong> URL은 80가지인데 문장이 5가지라면, 페이지 5장이 URL 80개를 나눠 달고 있는 셈이다. 입력의 가짓수보다 출력의 가짓수를 세야 한다.</p>

        <h2>둘째, 자기 자식을 그리는 허브</h2>
        <p>상품군 탭이 4개 달린 비교 페이지가 있었다. 탭 내용은 상품군마다 한 장씩, 랜딩 페이지 4장으로 미리 렌더링해 둔다. 각 페이지가 자기 이름으로 검색에 걸리게 하려는 것이다. 설계로서는 합리적이다.</p>
        <p>그런데 허브도 탭을 누르기 전에 <em>뭔가는</em> 보여 줘야 해서, 첫 번째 탭을 그린다. 그 첫 번째 탭이 곧 첫 번째 랜딩 페이지다. 두 URL을 받아 보니 눈에 보이는 본문이 둘 다 131줄이었고, 다른 줄은 제목 한 줄뿐이었다.</p>
        <p>이런 중복은 코드 리뷰로는 안 보인다. 소스에 중복이 있는 게 아니고, 소스가 만들어 내는 결과에 있기 때문이다. 파일은 하나인데 URL은 둘이고, 실제 페이지는 하나다. "페이지마다 메타데이터가 고유한가" 같은 검사도 다 통과한다. 메타데이터는 정말로 고유하기 때문이다. 렌더링된 본문을 봐야만 드러난다.</p>

        <h2>셋째, 페이지보다 커져 버린 공용 조각</h2>
        <p>25행짜리 비교표가 있었다. 한 번 써 두면 빌드 단계가 필요할 만한 페이지마다 끼워 넣는 식이었다. 그렇게 51장에 들어갔다.</p>
        <p>그 표를 위해 만든 페이지에서는 표가 곧 본문이다. 그런데 같은 표를 받은 예산 구간 페이지 18장에서는 표가 전체 텍스트의 절반쯤을 차지했고, 그 페이지가 다루는 질문에는 전혀 답하지 않았다. 공용 껍데기와 표를 걷어 내고 나니, 18장이 자기 것으로 가진 건 3문장이었다.</p>
        <p>분량 검사에는 한 번도 걸리지 않았다. 모두 3,000~3,100자여서, 얇은 콘텐츠를 거르는 휴리스틱을 어떻게 짜도 넉넉히 넘는다. 분량은 진짜였다. 그 페이지 것이 아니었을 뿐이다.</p>

        <h2>그래서 어떻게 고치나</h2>
        <p>얇은 페이지에 문장을 더 붙이는 게 먼저 떠오르지만, 틀린 방법이고 틀리는 이유도 분명하다. 모든 페이지에 같은 다섯 문장을 더하면 네 문장짜리 틀이 아홉 문장짜리 틀로 바뀔 뿐이다. 공유 텍스트 문제를 공유 텍스트를 늘려서 풀려 했으니, shingle 수치는 거의 움직이지 않는다.</p>
        <p>통하는 건 반대 방향이다. 페이지마다 <em>덜 말해도 되게</em> 한다. 그 페이지의 원본 데이터로 관찰 후보를 계산하고, 관찰마다 문턱을 정하고, 문턱을 넘은 것만 내보낸다. 데이터에 특별한 게 없는 페이지는 특별한 말을 하지 않는다. 그게 정직하다. 뭔가 있는 페이지들은 서로 다른 말을 하게 되는데, 처음부터 바란 게 그것이었다.</p>
        <div className="article-note"><strong>문턱은 결과를 보기 전에 정할 것</strong><p>특정 페이지가 걸리도록 문턱을 만지고 싶어진다. 그러면 답에 맞춰 규칙을 만드는 셈이고, 말로는 맞지만 아무 의미 없는 관찰이 나온다. 데이터 바깥에서 이미 의미가 정해진 값을 고르는 게 좋다. 규제선, 표준 규격 구간, 자기 모집단을 재표본추출해 구한 부트스트랩 구간 같은 것들이다. 그리고 그 값이 골라내는 결과를 그대로 받아들인다. 아무것도 넘지 못한 페이지라면 "여기엔 눈에 띄는 게 없다"고 적는 것도 엄연한 발견이고, 읽는 사람에게도 그렇게 읽힌다.</p></div>

        <h2>지켜볼 숫자</h2>
        <p>처음 돌렸을 때 사이트 전체의 고유 비율은 51.7%였다. 거꾸로 말하면 두 장 이상의 페이지에 나타난 shingle이 전체의 절반에 조금 못 미쳤다. 총계보다 페이지별 순위가 더 쓸모 있었다. 고유 비율이 3%가 안 되는 페이지가 3장 나왔는데, 그 셋이 첫 번째와 두 번째 모양이었다. 읽어서는 아무도 찾지 못했을 페이지들이다.</p>
        <p>답을 짐작하기 전에 자기 사이트에 한번 돌려 보면 좋겠다. 1분쯤이면 되고, 빌드된 HTML만 있으면 된다. 그리고 정렬된 목록 맨 위에 오는 페이지는 짐작했던 페이지인 경우가 거의 없다.</p>
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
