import { writeFileSync, mkdirSync, copyFileSync } from 'node:fs';
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

  const digestSubPages = [
    'rates.html',
    'deposit-rates.html',
    'saving-rates.html',
    'mortgage-rates.html',
    'rent-loan-rates.html',
    'news.html',
    'realestate-news.html',
    'stock-news.html',
    'rate-news.html',
  ].map((file) => `${SITE_URL}/econ-realestate-digest/${file}`);

  const projectSubPages = digestSubPages;

  const dailyUpdated = new Set(
    [
      `${SITE_URL}/econ-realestate-digest/`,
      ...digestSubPages,
      `${SITE_URL}/housing-subsidy-radar/`,
    ].map(canonicalizeUrl)
  );

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

  copyFileSync(resolve(DIST_DIR, '404', 'index.html'), resolve(DIST_DIR, '404.html'));

  console.log(
    `postbuild: wrote rss/atom feeds (en + ko), sitemap.xml, and ${posts.length * 2} OG images (en + ko; per-route <head> tags are now baked in by react-router prerendering)`
  );
}

main();
