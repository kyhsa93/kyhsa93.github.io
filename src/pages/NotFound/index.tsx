import { Link } from 'react-router-dom';
import type { MetaFunction } from 'react-router';
import { useLocale, localizedPath, localeFromPathname } from '../../lib/locale';
import { uiCopy } from '../../lib/copy';
import { createMeta } from '../../lib/seo';
import { LanguageToggle } from '../../components/LanguageToggle';

export const meta: MetaFunction = ({ location }) => {
  const locale = localeFromPathname(location.pathname);
  return createMeta({
    title: uiCopy[locale].notFound.seoTitle,
    description: uiCopy[locale].notFound.seoDescription,
    // /404 itself isn't mirrored under /ko (see react-router.config.ts) — it's
    // GitHub Pages' shared fallback for any unmatched path in either
    // language, so its own meta path stays unprefixed regardless of locale.
    path: '/404',
    locale,
  });
};

export default function NotFound() {
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
        <p className="section-kicker">{t.notFound.kicker}</p>
        <h1 className="archive-heading">{t.notFound.heading}</h1>
        <p>
          {t.notFound.body}{' '}
          <Link to={localizedPath('/posts', locale)} className="text-link">
            {t.notFound.allPostsLink}
          </Link>
          {t.notFound.bodySuffix}.
        </p>
        <div className="cta-row" style={{ marginTop: '32px' }}>
          <Link className="primary-link" to={localizedPath('/', locale)}>
            {t.notFound.backHome} <span aria-hidden="true">→</span>
          </Link>
        </div>
      </section>

      <footer>
        <p>{t.footer.tagline}</p>
        <div className="footer-links">
          <a href="/rss.xml">{t.footer.rss}</a>
          <Link to={localizedPath('/privacy-policy', locale)}>{t.footer.privacy}</Link>
          <a href="https://github.com/kyhsa93" target="_blank" rel="noreferrer">
            github.com/kyhsa93 →
          </a>
        </div>
      </footer>
    </main>
  );
}
