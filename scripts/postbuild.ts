import { writeFileSync, mkdirSync, copyFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { posts, postsByDate as sortedPosts } from '../src/data/posts.ts';
import { renderOgImage } from './og-image.ts';

const SITE_URL = 'https://kyhsa93.github.io';
const SITE_NAME = 'younghoon';
const SITE_TITLE = 'younghoon — backend engineer';
const SITE_DESCRIPTION =
  'Notes from a backend engineer who designs complex systems with clarity.';

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

function generateRss(): string {
  const items = sortedPosts
    .map((post) => {
      const url = `${SITE_URL}/posts/${post.slug}`;
      const categories = post.tags
        .map((tag: string) => `      <category>${xmlEscape(tag)}</category>`)
        .join('\n');
      return `    <item>
      <title>${xmlEscape(post.title.en)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${toRfc822(post.date)}</pubDate>
      <description>${xmlEscape(post.summary.en)}</description>
${categories}
    </item>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${xmlEscape(SITE_TITLE)}</title>
    <link>${SITE_URL}/</link>
    <atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml" />
    <description>${xmlEscape(SITE_DESCRIPTION)}</description>
    <language>en</language>
    <lastBuildDate>${toRfc822(sortedPosts[0].date)}</lastBuildDate>
${items}
  </channel>
</rss>
`;
}

// --- Atom 1.0 ------------------------------------------------------------

function generateAtom(): string {
  const entries = sortedPosts
    .map((post) => {
      const url = `${SITE_URL}/posts/${post.slug}`;
      const iso = `${toIsoDate(post.date)}T00:00:00Z`;
      const categories = post.tags
        .map((tag: string) => `    <category term="${xmlEscape(tag)}" />`)
        .join('\n');
      return `  <entry>
    <title>${xmlEscape(post.title.en)}</title>
    <link href="${url}" />
    <id>${url}</id>
    <updated>${iso}</updated>
    <published>${iso}</published>
    <summary>${xmlEscape(post.summary.en)}</summary>
${categories}
  </entry>`;
    })
    .join('\n');

  const latestIso = `${toIsoDate(sortedPosts[0].date)}T00:00:00Z`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>${xmlEscape(SITE_TITLE)}</title>
  <subtitle>${xmlEscape(SITE_DESCRIPTION)}</subtitle>
  <link href="${SITE_URL}/atom.xml" rel="self" />
  <link href="${SITE_URL}/" />
  <id>${SITE_URL}/</id>
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

  const staticEntries = [
    { loc: `${SITE_URL}/`, lastmod: latestDate, changefreq: 'weekly', priority: '1.0' },
    { loc: `${SITE_URL}/posts`, lastmod: latestDate, changefreq: 'weekly', priority: '0.8' },
    { loc: `${SITE_URL}/privacy-policy`, lastmod: latestDate, priority: '0.3' },
  ]
    .map(
      (u) => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${u.lastmod}</lastmod>
${u.changefreq ? `    <changefreq>${u.changefreq}</changefreq>\n` : ''}    <priority>${u.priority}</priority>
  </url>`
    )
    .join('\n');

  const postEntries = sortedPosts
    .map(
      (post) => `  <url>
    <loc>${SITE_URL}/posts/${post.slug}</loc>
    <lastmod>${toIsoDate(post.date)}</lastmod>
    <priority>0.6</priority>
  </url>`
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticEntries}
${postEntries}
</urlset>
`;
}

async function main(): Promise<void> {
  const ogDir = resolve(DIST_DIR, 'og');
  mkdirSync(ogDir, { recursive: true });
  for (const post of posts) {
    const png = await renderOgImage(post);
    writeFileSync(resolve(ogDir, `${post.slug}.png`), png);
  }

  writeFileSync(resolve(DIST_DIR, 'rss.xml'), generateRss());
  writeFileSync(resolve(DIST_DIR, 'atom.xml'), generateAtom());
  writeFileSync(resolve(DIST_DIR, 'sitemap.xml'), generateSitemap());

  // GitHub Pages looks for a flat /404.html at the site root; react-router prerenders the
  // "/404" route to 404/index.html like any other route, so copy it into place here.
  copyFileSync(resolve(DIST_DIR, '404', 'index.html'), resolve(DIST_DIR, '404.html'));

  console.log(
    `postbuild: wrote rss.xml, atom.xml, sitemap.xml, and ${posts.length} OG images (per-route <head> tags are now baked in by react-router prerendering)`
  );
}

main();
