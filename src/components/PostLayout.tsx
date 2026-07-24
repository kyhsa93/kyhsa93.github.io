import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

import { posts } from '../data/posts';
import { useSeo } from '../hooks/useSeo';
import { useLocale } from '../lib/locale';
import { uiCopy } from '../lib/copy';
import { AdUnit } from './AdUnit';
import { LanguageToggle } from './LanguageToggle';

interface PostLayoutProps {
  slug: string;
  kicker: string;
  title: ReactNode;
  lede: string;
  children: ReactNode;
}

function toIsoDate(date: string): string {
  return date.replace(/\./g, '-');
}

export default function PostLayout({ slug, kicker, title, lede, children }: PostLayoutProps) {
  const { locale } = useLocale();
  const t = uiCopy[locale];
  const meta = posts.find((post) => post.slug === slug);
  const path = `/posts/${slug}`;
  const date = meta?.date ?? '';
  const readMinutes = meta?.readMinutes ?? 0;
  const seoTitle = meta?.title[locale] ?? slug;
  const seoDescription = meta?.summary[locale] ?? lede;

  const image = `https://kyhsa93.github.io/og/${slug}.png`;

  useSeo({
    title: seoTitle,
    description: seoDescription,
    path,
    type: 'article',
    image,
    publishedTime: toIsoDate(date),
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: seoTitle,
      description: seoDescription,
      datePublished: toIsoDate(date),
      author: { '@type': 'Person', name: 'younghoon' },
      image,
      url: `https://kyhsa93.github.io${path}`,
    },
  });

  return (
    <main className="post-page">
      <nav className="post-nav" aria-label={t.nav.postAriaLabel}>
        <Link to="/" className="brand">
          <span className="brand-mark">Y</span>
          <span>younghoon</span>
        </Link>
        <div className="nav-links">
          <Link to="/" className="back-link">
            {t.nav.backHome}
          </Link>
          <LanguageToggle />
        </div>
      </nav>
      <article className="post-content">
        <header className="post-header">
          <p className="section-kicker">{kicker}</p>
          <h1>{title}</h1>
          <p className="post-lede">{lede}</p>
          <time>
            {date} · {readMinutes} min read
          </time>
        </header>
        <div className="article-body">{children}</div>
        <AdUnit
          slot={`POST_${slug.toUpperCase().replace(/-/g, '_')}_BANNER`}
          format="horizontal"
        />
        <footer className="post-footer">
          <Link to="/">{t.nav.postFooterBackHome}</Link>
          <a
            href="https://github.com/kyhsa93/backend-service-playbook"
            target="_blank"
            rel="noreferrer"
          >
            Backend Service Playbook{' '}
          </a>
        </footer>
      </article>
    </main>
  );
}
