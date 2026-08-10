import { Link } from 'react-router-dom';
import type { MetaFunction } from 'react-router';
import { useLocale, localizedPath, localeFromPathname } from '../../lib/locale';
import { uiCopy } from '../../lib/copy';
import { createMeta } from '../../lib/seo';
import { LanguageToggle } from '../../components/LanguageToggle';

export const meta: MetaFunction = ({ location }) => {
  const locale = localeFromPathname(location.pathname);
  return createMeta({
    title: uiCopy[locale].privacyPolicy.seoTitle,
    description: uiCopy[locale].privacyPolicy.seoDescription,
    path: '/privacy-policy',
    locale,
  });
};

export default function PrivacyPolicy() {
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
        <p className="section-kicker">{t.privacyPolicy.kicker}</p>
        <h1 className="archive-heading">{t.privacyPolicy.heading}</h1>

        <div className="article-body">
          <p>{t.privacyPolicy.intro}</p>
          <h2>{t.privacyPolicy.advertisingHeading}</h2>
          <p>
            {t.privacyPolicy.advertisingBody1}{' '}
            <a
              href="https://adssettings.google.com/authenticated"
              target="_blank"
              rel="noreferrer"
            >
              {t.privacyPolicy.adSettingsLink}
            </a>
            {t.privacyPolicy.advertisingBody2}
          </p>
          <h2>{t.privacyPolicy.cookiesHeading}</h2>
          <p>{t.privacyPolicy.cookiesBody}</p>
          <h2>{t.privacyPolicy.thirdPartiesHeading}</h2>
          <p>
            {t.privacyPolicy.thirdPartiesBody1}{' '}
            <a
              href="https://policies.google.com/technologies/ads"
              target="_blank"
              rel="noreferrer"
            >
              {t.privacyPolicy.googlePolicyLink}
            </a>
            {t.privacyPolicy.thirdPartiesBody2}
          </p>
          <h2>{t.privacyPolicy.contactHeading}</h2>
          <p>
            {t.privacyPolicy.contactBody}{' '}
            <a
              href="https://github.com/kyhsa93"
              target="_blank"
              rel="noreferrer"
            >
              github.com/kyhsa93
            </a>
            .
          </p>
        </div>
      </section>

      <footer>
        <p>{t.footer.tagline}</p>
        <a href="https://github.com/kyhsa93" target="_blank" rel="noreferrer">
          github.com/kyhsa93 →
        </a>
      </footer>
    </main>
  );
}
