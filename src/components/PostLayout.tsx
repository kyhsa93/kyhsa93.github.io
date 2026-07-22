import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface PostLayoutProps {
  kicker: string;
  title: ReactNode;
  lede: string;
  date: string;
  readMinutes: number;
  children: ReactNode;
}

export default function PostLayout({
  kicker,
  title,
  lede,
  date,
  readMinutes,
  children,
}: PostLayoutProps) {
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
