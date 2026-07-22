import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { posts, postsByDate as sortedPosts } from '../src/data/posts.ts';

const SITE_URL = 'https://kyhsa93.github.io';
const SITE_NAME = 'younghoon';
const SITE_TITLE = 'younghoon — backend engineer';
const SITE_DESCRIPTION =
  'Notes from a backend engineer who designs complex systems with clarity.';
const DEFAULT_IMAGE = `${SITE_URL}/og-image.png`;

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const DIST_DIR = resolve(SCRIPT_DIR, '../dist');

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
      <title>${xmlEscape(post.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${toRfc822(post.date)}</pubDate>
      <description>${xmlEscape(post.summary)}</description>
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
    <title>${xmlEscape(post.title)}</title>
    <link href="${url}" />
    <id>${url}</id>
    <updated>${iso}</updated>
    <published>${iso}</published>
    <summary>${xmlEscape(post.summary)}</summary>
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

// --- Static per-route <head> tags, so link-preview bots and crawlers that
// don't execute JS still see the real title/description/OG/JSON-LD instead
// of the generic homepage meta baked into index.html ---------------------

interface PageMeta {
  title: string;
  description: string;
  path: string;
  type: 'website' | 'article';
  publishedTime?: string;
  jsonLd?: Record<string, unknown>;
}

function injectMeta(template: string, meta: PageMeta): string {
  const url = `${SITE_URL}${meta.path}`;
  const fullTitle = meta.path === '/' ? meta.title : `${meta.title} · ${SITE_NAME}`;
  const title = xmlEscape(meta.title);
  const description = xmlEscape(meta.description);

  let html = template
    .replace(/<title>.*?<\/title>/, `<title>${xmlEscape(fullTitle)}</title>`)
    .replace(/<link rel="canonical" href="[^"]*"\s*\/>/, `<link rel="canonical" href="${url}" />`)
    .replace(
      /<meta name="description" content="[^"]*"\s*\/>/,
      `<meta name="description" content="${description}" />`
    )
    .replace(
      /<meta property="og:type" content="[^"]*"\s*\/>/,
      `<meta property="og:type" content="${meta.type}" />`
    )
    .replace(
      /<meta property="og:title" content="[^"]*"\s*\/>/,
      `<meta property="og:title" content="${title}" />`
    )
    .replace(
      /<meta property="og:description" content="[^"]*"\s*\/>/,
      `<meta property="og:description" content="${description}" />`
    )
    .replace(/<meta property="og:url" content="[^"]*"\s*\/>/, `<meta property="og:url" content="${url}" />`)
    .replace(
      /<meta name="twitter:title" content="[^"]*"\s*\/>/,
      `<meta name="twitter:title" content="${title}" />`
    )
    .replace(
      /<meta name="twitter:description" content="[^"]*"\s*\/>/,
      `<meta name="twitter:description" content="${description}" />`
    );

  const extraTags: string[] = [];
  if (meta.publishedTime) {
    extraTags.push(`  <meta property="article:published_time" content="${meta.publishedTime}" />`);
  }
  if (meta.jsonLd) {
    extraTags.push(`  <script type="application/ld+json">${JSON.stringify(meta.jsonLd)}</script>`);
  }

  html = extraTags.length
    ? html.replace('</head>', `${extraTags.join('\n')}\n</head>`)
    : html;

  return html;
}

function writeRoute(template: string, routePath: string, meta: PageMeta): void {
  const dir = routePath === '/' ? DIST_DIR : resolve(DIST_DIR, `.${routePath}`);
  mkdirSync(dir, { recursive: true });
  writeFileSync(resolve(dir, 'index.html'), injectMeta(template, meta));
}

function main(): void {
  const template = readFileSync(resolve(DIST_DIR, 'index.html'), 'utf-8');

  writeRoute(template, '/', {
    title: SITE_TITLE,
    description: `${SITE_DESCRIPTION} TypeScript, Go, and the Backend Service Playbook.`,
    path: '/',
    type: 'website',
  });

  writeRoute(template, '/posts', {
    title: 'All posts',
    description: `Every post, in one place — ${posts.length} write-ups on DDD, CQRS, and backend architecture.`,
    path: '/posts',
    type: 'website',
  });

  writeRoute(template, '/privacy-policy', {
    title: 'Privacy Policy',
    description: "How this site uses cookies and third-party advertising (Google AdSense).",
    path: '/privacy-policy',
    type: 'website',
  });

  for (const post of posts) {
    const path = `/posts/${post.slug}`;
    writeRoute(template, path, {
      title: post.title,
      description: post.summary,
      path,
      type: 'article',
      publishedTime: toIsoDate(post.date),
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: post.title,
        description: post.summary,
        datePublished: toIsoDate(post.date),
        author: { '@type': 'Person', name: SITE_NAME },
        image: DEFAULT_IMAGE,
        url: `${SITE_URL}${path}`,
      },
    });
  }

  writeFileSync(resolve(DIST_DIR, 'rss.xml'), generateRss());
  writeFileSync(resolve(DIST_DIR, 'atom.xml'), generateAtom());
  writeFileSync(resolve(DIST_DIR, 'sitemap.xml'), generateSitemap());

  console.log(
    `postbuild: wrote rss.xml, atom.xml, sitemap.xml, and static <head> tags for ${posts.length + 2} routes`
  );
}

main();
