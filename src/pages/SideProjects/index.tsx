import { Link } from 'react-router-dom';
import type { MetaFunction } from 'react-router';
import { sideProjects } from '../../data/sideProjects';
import { useLocale, localizedPath, localeFromPathname } from '../../lib/locale';
import { uiCopy } from '../../lib/copy';
import { createMeta } from '../../lib/seo';
import { LanguageToggle } from '../../components/LanguageToggle';

export const meta: MetaFunction = ({ location }) => {
  const locale = localeFromPathname(location.pathname);
  return createMeta({
    title: uiCopy[locale].sideProjectsArchive.seoTitle,
    description: uiCopy[locale].sideProjectsArchive.seoDescription(sideProjects.length),
    path: '/side-projects',
    locale,
  });
};

export default function SideProjects() {
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
        <p className="section-kicker">{t.sideProjectsArchive.kicker}</p>
        <h1 className="archive-heading">{t.sideProjectsArchive.heading}</h1>
        <div className="content-label">
          <span>{t.sideProjectsArchive.label}</span>
          <span>{t.sideProjectsArchive.projectsCount(sideProjects.length)}</span>
        </div>
        <div className="side-project-column">
          {sideProjects.map((project, index) => {
            const status = project.url ? t.home.statusLive : t.home.statusInProgress;

            return (
              <article className="side-project" key={project.title}>
                <div className={`project-orb orb-${index + 1}`} aria-hidden="true">
                  <span />
                </div>
                <div>
                  <p className="project-status">
                    <i />
                    {status}
                  </p>
                  <h3>
                    {project.url ? (
                      <a href={project.url} target="_blank" rel="noreferrer">
                        {project.title} <span aria-hidden="true"></span>
                      </a>
                    ) : (
                      project.title
                    )}
                  </h3>
                  <p>{project.description[locale]}</p>
                </div>
              </article>
            );
          })}
        </div>
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
