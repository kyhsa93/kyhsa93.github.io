import { Link } from 'react-router-dom';
import type { MetaFunction } from 'react-router';
import { postsByDate } from '../../data/posts';
import { useLocale, localizedPath, localeFromPathname } from '../../lib/locale';
import { uiCopy } from '../../lib/copy';
import { createMeta } from '../../lib/seo';
import { LanguageToggle } from '../../components/LanguageToggle';

export const meta: MetaFunction = ({ location }) => {
  const locale = localeFromPathname(location.pathname);
  return createMeta({
    title: uiCopy[locale].archive.seoTitle,
    description: uiCopy[locale].archive.seoDescription(postsByDate.length),
    path: '/posts',
    locale,
  });
};

export default function Archive() {
  const { locale } = useLocale();
  const t = uiCopy[locale];

  return (
    <main className="home-page">
      <nav className="site-nav" aria-label={t.nav.mainAriaLabel}>
        <Link className="brand" to={localizedPath('/', locale)}>
          <span className="brand-mark">Y</span>
          <span>younghoon</span>
        </Link>
        <div className="nav-links">
          <Link to={localizedPath('/', locale)}>{t.nav.backHome}</Link>
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
              <Link to={localizedPath(`/posts/${post.slug}`, locale)}>
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
          <a href={locale === 'ko' ? '/rss-ko.xml' : '/rss.xml'}>{t.footer.rss}</a>
          <Link to={localizedPath('/privacy-policy', locale)}>{t.footer.privacy}</Link>
          <a href="https://github.com/kyhsa93" target="_blank" rel="noreferrer">
            github.com/kyhsa93 →
          </a>
        </div>
      </footer>
    </main>
  );
}
