import { writeFileSync, readFileSync, existsSync, mkdirSync, copyFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { posts, postsByDate as sortedPosts } from '../src/data/posts.ts';
import { sideProjects } from '../src/data/sideProjects.ts';
import {
  canonicalUrl,
  canonicalizeUrl,
  localizedPath,
  SITE_URL,
  type Locale,
} from '../src/lib/urls.ts';
import { renderOgImage } from './og-image.ts';

const SITE_NAME = 'younghoon';

const SITE_META: Record<Locale, { title: string; description: string }> = {
  en: {
    title: 'younghoon — backend engineer',
    description:
      'Notes from a backend engineer who designs complex systems with clarity. TypeScript, Go, and the Backend Service Playbook.',
  },
  ko: {
    title: 'younghoon — 백엔드 엔지니어',
    description:
      '명확하게 복잡한 시스템을 설계하는 백엔드 엔지니어의 기록. TypeScript, Go, 그리고 Backend Service Playbook.',
  },
};

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const DIST_DIR = resolve(SCRIPT_DIR, '../build/client');

function toIsoDate(date: string): string {
  return date.replace(/\./g, '-');
}

// 매일 갱신되는 프로젝트 페이지의 lastmod로 쓴다. 사이트가 한국 시간대 기준으로
// 돌아가므로 날짜도 KST로 끊는다(UTC로 끊으면 오전 9시 전 배포가 하루 전으로 적힌다).
function buildDateKst(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' });
}

function toRfc822(date: string): string {
  return new Date(`${toIsoDate(date)}T00:00:00Z`).toUTCString();
}

function xmlEscape(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}


function generateRss(locale: Locale): string {
  const items = sortedPosts
    .map((post) => {
      const url = canonicalUrl(localizedPath(`/posts/${post.slug}`, locale));
      const categories = post.tags
        .map((tag: string) => `      <category>${xmlEscape(tag)}</category>`)
        .join('\n');
      return `    <item>
      <title>${xmlEscape(post.title[locale])}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${toRfc822(post.date)}</pubDate>
      <description>${xmlEscape(post.summary[locale])}</description>
${categories}
    </item>`;
    })
    .join('\n');

  const feedFile = locale === 'ko' ? 'rss-ko.xml' : 'rss.xml';
  const siteUrl = canonicalUrl(localizedPath('/', locale));

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${xmlEscape(SITE_META[locale].title)}</title>
    <link>${siteUrl}</link>
    <atom:link href="${SITE_URL}/${feedFile}" rel="self" type="application/rss+xml" />
    <description>${xmlEscape(SITE_META[locale].description)}</description>
    <language>${locale}</language>
    <lastBuildDate>${toRfc822(sortedPosts[0].date)}</lastBuildDate>
${items}
  </channel>
</rss>
`;
}


function generateAtom(locale: Locale): string {
  const entries = sortedPosts
    .map((post) => {
      const url = canonicalUrl(localizedPath(`/posts/${post.slug}`, locale));
      const iso = `${toIsoDate(post.date)}T00:00:00Z`;
      const categories = post.tags
        .map((tag: string) => `    <category term="${xmlEscape(tag)}" />`)
        .join('\n');
      return `  <entry>
    <title>${xmlEscape(post.title[locale])}</title>
    <link href="${url}" />
    <id>${url}</id>
    <updated>${iso}</updated>
    <published>${iso}</published>
    <summary>${xmlEscape(post.summary[locale])}</summary>
${categories}
  </entry>`;
    })
    .join('\n');

  const latestIso = `${toIsoDate(sortedPosts[0].date)}T00:00:00Z`;
  const feedFile = locale === 'ko' ? 'atom-ko.xml' : 'atom.xml';
  const siteUrl = canonicalUrl(localizedPath('/', locale));

  return `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>${xmlEscape(SITE_META[locale].title)}</title>
  <subtitle>${xmlEscape(SITE_META[locale].description)}</subtitle>
  <link href="${SITE_URL}/${feedFile}" rel="self" />
  <link href="${siteUrl}" />
  <id>${siteUrl}</id>
  <updated>${latestIso}</updated>
  <author>
    <name>${SITE_NAME}</name>
  </author>
${entries}
</feed>
`;
}


/**
 * 라우터가 남기는 껍데기 파일에서 광고를 걷어낸다.
 *
 * `__spa-fallback.html`은 본문이 한 글자도 없는데 200으로 살아 있고, head는 다른
 * 페이지와 똑같이 만들어져서 애드센스 스크립트까지 그대로 들고 있다. 콘텐츠가 없는
 * 페이지에 광고를 두는 것은 애드센스 정책이 직접 금지하는 것이다.
 *
 * React 쪽에서 못 막는 이유는 이 파일이 라우트 하나를 그려서 나오는 것이 아니라
 * 프레임워크가 클라이언트 라우팅용으로 따로 찍는 산출물이라서다. 그래서 찍힌 다음에
 * 손본다. robots.txt가 크롤링을 막고 있지만 그건 발견을 막을 뿐이고, 주소를 직접
 * 아는 사람에게는 여전히 광고가 실린 빈 페이지가 뜬다.
 */
function stripAdsFromEmptyShell() {
  const shell = resolve(DIST_DIR, '__spa-fallback.html');
  if (!existsSync(shell)) return;

  const before = readFileSync(shell, 'utf-8');
  const after = before
    .replace(
      /<script[^>]*pagead2\.googlesyndication\.com[^>]*><\/script>/g,
      ''
    )
    .replace('content="index, follow"', 'content="noindex, follow"');

  if (after !== before) writeFileSync(shell, after);
}

/**
 * 본문 없는 페이지에 광고가 다시 붙으면 빌드를 세운다.
 *
 * 이 저장소에는 테스트 러너가 없으므로 빌드가 그 자리를 대신한다. 여기서 막는 것은
 * 실수 한 줄이 아니라 애드센스 정책 위반이고, 하필 지금은 재심사가 도는 중이라
 * 조용히 배포되면 안 된다.
 *
 * 뒤집힌 실수도 같이 본다 — 진짜 페이지에서 광고가 통째로 사라지는 것.
 */
function assertNoAdsOnEmptyPages() {
  const AD = 'pagead2.googlesyndication.com';

  // `404/index.html`도 같이 본다. 복사본만 보면 원본이 더러운 채로 남는다.
  for (const file of ['404.html', '404/index.html', '__spa-fallback.html']) {
    const path = resolve(DIST_DIR, file);
    if (!existsSync(path)) continue;
    const html = readFileSync(path, 'utf-8');
    if (html.includes(AD)) {
      throw new Error(
        `${file}에 애드센스 스크립트가 남아 있습니다. 본문이 없는 페이지에 광고를 두면 안 됩니다.`
      );
    }
    if (!html.includes('content="noindex')) {
      throw new Error(`${file}에 noindex가 없습니다.`);
    }
  }

  const home = readFileSync(resolve(DIST_DIR, 'index.html'), 'utf-8');
  if (!home.includes(AD)) {
    throw new Error('첫 화면에서 애드센스 스크립트가 사라졌습니다. 빼는 범위가 너무 넓습니다.');
  }
}

// 집계(옛 econ-realestate-digest)에서 색인 대상으로 삼은 화면들. 사이트맵과
// 옛 주소 리다이렉트가 같은 목록을 봐야 한 쪽만 고치는 일이 안 생긴다.
const JIPGYE_PAGES = [
  // 읽을거리 두 장. 데이터 페이지와 달리 매일 바뀌지 않지만, 애드센스 심사에서
  // 사이트가 무엇으로 만들어졌는지를 말하는 것은 이쪽이다 — 집계 기준과 만든 사람.
  'method.html',
  'about.html',
  'realestate.html',
  'apartment-sale.html',
  'apartment-jeonse.html',
  'apartment-rent.html',
  // 자치구별 시세 페이지. "강남구 아파트 시세"처럼 지역 단위로 검색하는 사람의 착지점이라
  // 사이트맵에 없으면 발견 경로가 다이제스트 안쪽 링크뿐이다.
  'district-jongno.html',
  'district-jung.html',
  'district-yongsan.html',
  'district-seongdong.html',
  'district-gwangjin.html',
  'district-dongdaemun.html',
  'district-jungnang.html',
  'district-seongbuk.html',
  'district-gangbuk.html',
  'district-dobong.html',
  'district-nowon.html',
  'district-eunpyeong.html',
  'district-seodaemun.html',
  'district-mapo.html',
  'district-yangcheon.html',
  'district-gangseo.html',
  'district-guro.html',
  'district-geumcheon.html',
  'district-yeongdeungpo.html',
  'district-dongjak.html',
  'district-gwanak.html',
  'district-seocho.html',
  'district-gangnam.html',
  'district-songpa.html',
  'district-gangdong.html',
  // 전세와 월세 중 어느 쪽이 싼지를 자치구·면적대별로 내는 화면. 실거래와 금리를
  // 한곳에서 받는 사이트라야 만들 수 있는 형태라 검색에 같은 것이 잘 없다.
  'jeonse-vs-wolse.html',
  // 해제된 거래와 등기가 끝나지 않은 거래. 원본을 여섯 달치 들고 있어야 셀 수 있는
  // 숫자라 언론이 프레임으로만 다루고 표로는 잘 내놓지 않는다.
  'cancelled-deals.html',
  // 예산대별 페이지. 자치구 페이지와 같은 이유로 여기 있어야 하는데 빠져 있었다 —
  // 열여덟 장이 통째로 사이트맵 밖이었고, 다이제스트 안에서도 실거래 검색 한 곳에서만
  // 링크가 걸려 사실상 어디서도 닿지 않았다.
  //
  // 그리고 이쪽이 자치구 페이지보다 오히려 값이 나간다. "10억대로 살 수 있는 서울
  // 아파트"는 네이버부동산도 호갱노노도 페이지로 만들지 않는 형태다 — 그런 곳은
  // 필터를 주지 페이지를 주지 않는다. 검색에는 페이지가 없으면 순위도 없다.
  'budget-3eok.html',
  'budget-4eok.html',
  'budget-5eok.html',
  'budget-6eok.html',
  'budget-7eok.html',
  'budget-8eok.html',
  'budget-9eok.html',
  'budget-10eok.html',
  'budget-11eok.html',
  'budget-12eok.html',
  'budget-13eok.html',
  'budget-14eok.html',
  'budget-15eok.html',
  'budget-16eok.html',
  'budget-17eok.html',
  'budget-18eok.html',
  'budget-19eok.html',
  'budget-20eok.html',
  'rates.html',
  'deposit-rates.html',
  'saving-rates.html',
  'mortgage-rates.html',
  'rent-loan-rates.html',
  // 뉴스 네 장은 여기 없다. 색인에서 뺐기 때문이다 — 남의 기사 제목과 그 AI 요약은
  // 우리가 만든 것이 아니고, 애드센스가 "가치가 별로 없는 콘텐츠"로 반려한 사이트에서
  // 가장 변호하기 어려운 자산이 그것이다. 페이지 자체에 noindex가 붙어 있으니
  // 사이트맵에 남겨 두는 것은 크롤러에게 서로 다른 말을 두 번 하는 셈이 된다.
  // 승인 뒤에 되돌린다면 이 목록과 그쪽 meta를 같이 되돌려야 한다.
];

function generateSitemap(): string {
  const latestDate = toIsoDate(sortedPosts[0].date);

  const urlEntry = (u: { loc: string; lastmod: string; changefreq?: string; priority: string }) =>
    `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${u.lastmod}</lastmod>
${u.changefreq ? `    <changefreq>${u.changefreq}</changefreq>\n` : ''}    <priority>${u.priority}</priority>
  </url>`;

  const blogPages = [
    { path: '/', changefreq: 'weekly', priority: '1.0' },
    { path: '/posts', changefreq: 'weekly', priority: '0.8' },
    { path: '/side-projects', changefreq: 'monthly', priority: '0.5' },
    { path: '/privacy-policy', changefreq: undefined, priority: '0.3' },
  ];

  const blogEntries = blogPages
    .flatMap(({ path, changefreq, priority }) => [
      { loc: canonicalUrl(path), lastmod: latestDate, changefreq, priority },
      {
        loc: canonicalUrl(localizedPath(path, 'ko')),
        lastmod: latestDate,
        changefreq,
        priority,
      },
    ])
    .map(urlEntry)
    .join('\n');

  const ownProjectUrls = sideProjects
    .map((project) => project.url)
    .filter((url): url is string => Boolean(url?.startsWith(SITE_URL)))
    .map(canonicalizeUrl);

  const digestSubPages = JIPGYE_PAGES.map((file) => `${SITE_URL}/jipgye/${file}`);

  const projectSubPages = digestSubPages;

  const dailyUpdated = new Set(
    [
      `${SITE_URL}/jipgye/`,
      ...digestSubPages,
      `${SITE_URL}/housing-subsidy-radar/`,
    ].map(canonicalizeUrl)
  );

  // 매일 갱신되는 프로젝트는 lastmod에 블로그 최신 글 날짜를 쓰면 안 된다. 다이제스트는
  // 하루 네 번 내용이 바뀌는데 글을 안 쓰면 이 날짜가 몇 주씩 고정되고, 그러면 sitemap이
  // "changefreq=daily인데 lastmod는 8일 전"이라는 앞뒤 안 맞는 신호를 보낸다. 크롤러가
  // 다시 올 이유를 못 찾는 건 당연하다. 실제로 GSC에서 이 페이지들이 색인되지 않은
  // 상태로 확인됐다. 여기는 배포 날짜를 적는다 - 배포될 때마다 그 페이지들은 실제로
  // 새 내용을 담고 있다.
  const externalProjectEntries = [...ownProjectUrls, ...projectSubPages]
    .map((loc) => {
      const daily = dailyUpdated.has(loc);
      return {
        loc,
        lastmod: daily ? buildDateKst() : latestDate,
        changefreq: daily ? 'daily' : 'monthly',
        priority: daily ? '0.5' : '0.4',
      };
    })
    .map(urlEntry)
    .join('\n');

  const postEntries = sortedPosts
    .flatMap((post) => [
      {
        loc: canonicalUrl(`/posts/${post.slug}`),
        lastmod: toIsoDate(post.date),
        priority: '0.6',
      },
      {
        loc: canonicalUrl(`/ko/posts/${post.slug}`),
        lastmod: toIsoDate(post.date),
        priority: '0.6',
      },
    ])
    .map(urlEntry)
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${blogEntries}
${externalProjectEntries}
${postEntries}
</urlset>
`;
}

// 저장소 이름을 econ-realestate-digest에서 jipgye로 바꾸면서 옛 주소가 통째로 404가 됐다.
// GitHub Pages는 저장소를 renaming해도 프로젝트 사이트 경로를 리다이렉트해 주지 않는다
// (배포 뒤 실제로 404를 확인했다). 그 경로는 이제 임자가 없어 이 루트 사이트로 떨어지므로
// 여기서 옛 주소마다 새 주소로 보내는 한 장을 깔아 둔다.
//
// 정적 호스팅이라 301은 못 쓴다. meta refresh + canonical이 쓸 수 있는 최선이고, 크롤러는
// 이 조합을 리다이렉트로 읽는다. noindex는 넣지 않는다 - 넣으면 넘겨줄 신호까지 같이 막는다.
// 색인 밖이던 뉴스 네 장과 실거래 검색도 넣는다. 공유된 링크는 색인과 상관없이 살아 있다.
const LEGACY_DIR = 'econ-realestate-digest';
const LEGACY_EXTRA_PAGES = [
  'news.html',
  'realestate-news.html',
  'stock-news.html',
  'rate-news.html',
  'deal-search.html',
];

function writeLegacyRedirects(): void {
  const dir = resolve(DIST_DIR, LEGACY_DIR);
  mkdirSync(dir, { recursive: true });

  for (const file of ['', ...JIPGYE_PAGES, ...LEGACY_EXTRA_PAGES]) {
    const target = `${SITE_URL}/jipgye/${file}`;
    const html = `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta http-equiv="refresh" content="0; url=${target}">
<link rel="canonical" href="${target}">
<title>집계로 옮겼습니다</title>
</head>
<body>
<p>이 주소는 <a href="${target}">${target}</a>로 옮겼습니다.</p>
</body>
</html>
`;
    writeFileSync(resolve(dir, file || 'index.html'), html);
  }
}

async function main(): Promise<void> {
  const ogDir = resolve(DIST_DIR, 'og');
  const ogKoDir = resolve(ogDir, 'ko');
  mkdirSync(ogDir, { recursive: true });
  mkdirSync(ogKoDir, { recursive: true });
  for (const post of posts) {
    const enPng = await renderOgImage(post, 'en');
    writeFileSync(resolve(ogDir, `${post.slug}.png`), enPng);
    const koPng = await renderOgImage(post, 'ko');
    writeFileSync(resolve(ogKoDir, `${post.slug}.png`), koPng);
  }

  writeFileSync(resolve(DIST_DIR, 'rss.xml'), generateRss('en'));
  writeFileSync(resolve(DIST_DIR, 'rss-ko.xml'), generateRss('ko'));
  writeFileSync(resolve(DIST_DIR, 'atom.xml'), generateAtom('en'));
  writeFileSync(resolve(DIST_DIR, 'atom-ko.xml'), generateAtom('ko'));
  writeFileSync(resolve(DIST_DIR, 'sitemap.xml'), generateSitemap());
  writeLegacyRedirects();
  // 404.html은 여기서 만들어진다. 검사는 그 뒤라야 한다 — 앞에 두었더니 지난 빌드가
  // 남긴 파일을 읽고 통과했고, 광고를 일부러 되돌려 놓은 빌드조차 그대로 성공했다.
  copyFileSync(resolve(DIST_DIR, '404', 'index.html'), resolve(DIST_DIR, '404.html'));

  stripAdsFromEmptyShell();
  assertNoAdsOnEmptyPages();

  console.log(
    `postbuild: wrote rss/atom feeds (en + ko), sitemap.xml, and ${posts.length * 2} OG images (en + ko; per-route <head> tags are now baked in by react-router prerendering)`
  );
}

main();
