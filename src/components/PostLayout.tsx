import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

import { posts } from '../data/posts';
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

export default function PostLayout({ slug, kicker, title, lede, children }: PostLayoutProps) {
  const { locale } = useLocale();
  const t = uiCopy[locale];
  const meta = posts.find((post) => post.slug === slug);
  const date = meta?.date ?? '';
  const readMinutes = meta?.readMinutes ?? 0;
  const project = meta?.project ?? {
    name: 'Backend Service Playbook',
    url: 'https://github.com/kyhsa93/backend-service-playbook',
  };

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
          <a href={project.url} target="_blank" rel="noreferrer">
            {project.name}{' '}
          </a>
        </footer>
      </article>
    </main>
  );
}
