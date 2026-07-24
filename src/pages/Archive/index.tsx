import { Link } from 'react-router-dom';
import { postsByDate } from '../../data/posts';
import { useSeo } from '../../hooks/useSeo';
import { useLocale } from '../../lib/locale';
import { uiCopy } from '../../lib/copy';
import { LanguageToggle } from '../../components/LanguageToggle';

export default function Archive() {
  const { locale } = useLocale();
  const t = uiCopy[locale];

  useSeo({
    title: t.archive.seoTitle,
    description: t.archive.seoDescription(postsByDate.length),
    path: '/posts',
  });

  return (
    <main className="home-page">
      <nav className="site-nav" aria-label={t.nav.mainAriaLabel}>
        <Link className="brand" to="/">
          <span className="brand-mark">Y</span>
          <span>younghoon</span>
        </Link>
        <div className="nav-links">
          <Link to="/">{t.nav.backHome}</Link>
          <LanguageToggle />
        </div>
      </nav>

      <section className="archive-section">
        <p className="section-kicker">{t.archive.kicker}</p>
        <h1 className="archive-heading">{t.archive.heading}</h1>
        <div className="content-label">
          <span>{t.archive.writingLabel}</span>
          <span>{t.archive.postsCount(postsByDate.length)}</span>
        </div>
        {postsByDate.map((post) => (
          <article className="post-item published" key={post.slug}>
            <div className="post-meta">
              <time>{post.date}</time>
              <span>{post.tags.join(' · ')}</span>
            </div>
            <h3>
              <Link to={`/posts/${post.slug}`}>
                {post.title[locale]}
                <span aria-hidden="true">→</span>
              </Link>
            </h3>
            <p>{post.summary[locale]}</p>
          </article>
        ))}
      </section>

      <footer>
        <p>{t.footer.tagline}</p>
        <div className="footer-links">
          <a href="/rss.xml">{t.footer.rss}</a>
          <Link to="/privacy-policy">{t.footer.privacy}</Link>
          <a href="https://github.com/kyhsa93" target="_blank" rel="noreferrer">
            github.com/kyhsa93 →
          </a>
        </div>
      </footer>
    </main>
  );
}
