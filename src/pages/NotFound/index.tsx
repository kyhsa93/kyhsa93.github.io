import { Link } from 'react-router-dom';
import { useSeo } from '../../hooks/useSeo';
import { useLocale } from '../../lib/locale';
import { uiCopy } from '../../lib/copy';
import { LanguageToggle } from '../../components/LanguageToggle';

export default function NotFound() {
  const { locale } = useLocale();
  const t = uiCopy[locale];

  useSeo({
    title: t.notFound.seoTitle,
    description: t.notFound.seoDescription,
    path: '/404',
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
        <p className="section-kicker">{t.notFound.kicker}</p>
        <h1 className="archive-heading">{t.notFound.heading}</h1>
        <p>
          {t.notFound.body}{' '}
          <Link to="/posts" className="text-link">
            {t.notFound.allPostsLink}
          </Link>
          {t.notFound.bodySuffix}.
        </p>
        <div className="cta-row" style={{ marginTop: '32px' }}>
          <Link className="primary-link" to="/">
            {t.notFound.backHome} <span aria-hidden="true">→</span>
          </Link>
        </div>
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
