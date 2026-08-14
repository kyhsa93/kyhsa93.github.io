import { writeFileSync, mkdirSync, copyFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { posts, postsByDate as sortedPosts } from '../src/data/posts.ts';
import { sideProjects } from '../src/data/sideProjects.ts';
import { renderOgImage } from './og-image.ts';

const SITE_URL = 'https://kyhsa93.github.io';
const SITE_NAME = 'younghoon';

// scripts/ is type-checked under tsconfig.node.json (no jsx, strict Node ESM
// resolution) — can't import src/lib/locale.tsx or src/lib/copy.ts (which
// itself has extensionless internal imports only valid under the app's
// bundler resolution) from here, so both are duplicated in miniature below
// rather than shared. Keep in sync with src/lib/locale.tsx's localizedPath
// and src/lib/copy.ts's uiCopy.{en,ko}.home.seoTitle/seoDescription.
type Locale = 'en' | 'ko';

function localizedPath(path: string, locale: Locale): string {
  if (locale === 'en') return path;
  return path === '/' ? '/ko' : `/ko${path}`;
}

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

// --- RSS 2.0 -----------------------------------------------------------

function generateRss(locale: Locale): string {
  const items = sortedPosts
    .map((post) => {
      const url = `${SITE_URL}${localizedPath(`/posts/${post.slug}`, locale)}`;
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
  const siteUrl = `${SITE_URL}${localizedPath('/', locale)}`;

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

// --- Atom 1.0 ------------------------------------------------------------

function generateAtom(locale: Locale): string {
  const entries = sortedPosts
    .map((post) => {
      const url = `${SITE_URL}${localizedPath(`/posts/${post.slug}`, locale)}`;
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
  const siteUrl = `${SITE_URL}${localizedPath('/', locale)}`;

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

// --- sitemap.xml, generated from the same post registry so it can never
// drift from what's actually published -----------------------------------

function generateSitemap(): string {
  const latestDate = toIsoDate(sortedPosts[0].date);

  const urlEntry = (u: { loc: string; lastmod: string; changefreq?: string; priority: string }) =>
    `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${u.lastmod}</lastmod>
${u.changefreq ? `    <changefreq>${u.changefreq}</changefreq>\n` : ''}    <priority>${u.priority}</priority>
  </url>`;

  // 이 블로그 SPA 자체의 정적 페이지. src/routes.ts에서 prefix('ko', ...)로
  // 전부 /ko/* 버전도 prerender되므로 두 언어 버전을 같이 올린다.
  const blogPages = [
    { path: '/', changefreq: 'weekly', priority: '1.0' },
    { path: '/posts', changefreq: 'weekly', priority: '0.8' },
    { path: '/side-projects', changefreq: 'monthly', priority: '0.5' },
    { path: '/privacy-policy', changefreq: undefined, priority: '0.3' },
  ];

  const blogEntries = blogPages
    .flatMap(({ path, changefreq, priority }) => [
      { loc: `${SITE_URL}${path}`, lastmod: latestDate, changefreq, priority },
      {
        loc: `${SITE_URL}${path === '/' ? '/ko' : `/ko${path}`}`,
        lastmod: latestDate,
        changefreq,
        priority,
      },
    ])
    .map(urlEntry)
    .join('\n');

  // 이 블로그 SPA의 라우트가 아니라 같은 kyhsa93.github.io 도메인 아래
  // 별도 저장소에서 배포되는 프로젝트 페이지들 — react-router.config.ts의
  // prerender 대상이 아니고 /ko 버전도 없어서 원래 URL 하나씩만 넣는다.
  //
  // sideProjects.ts에서 바로 뽑아 쓴다. 예전에는 여기에 URL을 따로 적어뒀는데,
  // 프로젝트를 등록해도 사이트맵에는 반영되지 않는 어긋남이 실제로 생겼다
  // (housing-subsidy-radar가 등록 후에도 사이트맵에서 빠져 있었다).
  // GitHub 저장소로 연결되는 항목은 이 도메인이 아니라 저절로 걸러진다.
  const ownProjectUrls = sideProjects
    .map((project) => project.url)
    .filter((url): url is string => Boolean(url?.startsWith(SITE_URL)));

  // 프로젝트 안의 개별 페이지는 sideProjects.ts에 없다(그쪽은 프로젝트 단위라
  // 대표 URL만 갖는다). 검색으로 바로 들어올 만한 페이지는 여기 적어준다.
  const projectSubPages = [`${SITE_URL}/econ-realestate-digest/rates.html`];

  // 매일 데이터가 바뀌는 쪽은 그렇게 알린다. 나머지는 내용이 잘 안 바뀐다.
  const dailyUpdated = new Set([
    `${SITE_URL}/econ-realestate-digest/`,
    `${SITE_URL}/econ-realestate-digest/rates.html`,
    `${SITE_URL}/housing-subsidy-radar/`,
  ]);

  const externalProjectEntries = [...ownProjectUrls, ...projectSubPages]
    .map((loc) => ({
      loc,
      lastmod: latestDate,
      changefreq: dailyUpdated.has(loc) ? 'daily' : 'monthly',
      priority: dailyUpdated.has(loc) ? '0.5' : '0.4',
    }))
    .map(urlEntry)
    .join('\n');

  const postEntries = sortedPosts
    .flatMap((post) => [
      { loc: `${SITE_URL}/posts/${post.slug}`, lastmod: toIsoDate(post.date), priority: '0.6' },
      { loc: `${SITE_URL}/ko/posts/${post.slug}`, lastmod: toIsoDate(post.date), priority: '0.6' },
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

  // GitHub Pages looks for a flat /404.html at the site root; react-router prerenders the
  // "/404" route to 404/index.html like any other route, so copy it into place here.
  copyFileSync(resolve(DIST_DIR, '404', 'index.html'), resolve(DIST_DIR, '404.html'));

  console.log(
    `postbuild: wrote rss/atom feeds (en + ko), sitemap.xml, and ${posts.length * 2} OG images (en + ko; per-route <head> tags are now baked in by react-router prerendering)`
  );
}

main();
