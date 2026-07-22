import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

import { posts } from '../data/posts';
import { useSeo } from '../hooks/useSeo';

interface PostLayoutProps {
  slug: string;
  kicker: string;
  title: ReactNode;
  lede: string;
  date: string;
  readMinutes: number;
  children: ReactNode;
}

function toIsoDate(date: string): string {
  return date.replace(/\./g, '-');
}

export default function PostLayout({
  slug,
  kicker,
  title,
  lede,
  date,
  readMinutes,
  children,
}: PostLayoutProps) {
  const meta = posts.find((post) => post.slug === slug);
  const path = `/posts/${slug}`;

  useSeo({
    title: meta?.title ?? slug,
    description: meta?.summary ?? lede,
    path,
    type: 'article',
    publishedTime: toIsoDate(date),
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: meta?.title ?? slug,
      description: meta?.summary ?? lede,
      datePublished: toIsoDate(date),
      author: { '@type': 'Person', name: 'younghoon' },
      url: `https://kyhsa93.github.io${path}`,
    },
  });

  return (
    <main className="post-page">
      <nav className="post-nav" aria-label="Post navigation">
        <Link to="/" className="brand"><span className="brand-mark">Y</span><span>younghoon</span></Link>
        <Link to="/" className="back-link">← Home</Link>
      </nav>
      <article className="post-content">
        <header className="post-header">
          <p className="section-kicker">{kicker}</p>
          <h1>{title}</h1>
          <p className="post-lede">{lede}</p>
          <time>{date} · {readMinutes} min read</time>
        </header>
        <div className="article-body">
          {children}
        </div>
        <footer className="post-footer">
          <Link to="/">← Back to home</Link>
          <a href="https://github.com/kyhsa93/backend-service-playbook" target="_blank" rel="noreferrer">Backend Service Playbook </a>
        </footer>
      </article>
    </main>
  );
}
