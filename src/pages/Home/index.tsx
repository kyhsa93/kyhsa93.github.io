import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { MetaFunction } from 'react-router';
import { postsByDate } from '../../data/posts';
import { sideProjects } from '../../data/sideProjects';
import { useLocale, localizedPath, localeFromPathname } from '../../lib/locale';
import { uiCopy } from '../../lib/copy';
import { createMeta, SITE_URL, SITE_NAME } from '../../lib/seo';
import { canonicalUrl } from '../../lib/urls';
import { LanguageToggle } from '../../components/LanguageToggle';

export const meta: MetaFunction = ({ location }) => {
  const locale = localeFromPathname(location.pathname);
  const homeUrl = canonicalUrl(localizedPath('/', locale));

  return createMeta({
    title: uiCopy[locale].home.seoTitle,
    description: uiCopy[locale].home.seoDescription,
    path: '/',
    locale,
    jsonLd: {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebSite',
          '@id': `${homeUrl}#website`,
          url: homeUrl,
          name: uiCopy[locale].home.seoTitle,
          description: uiCopy[locale].home.seoDescription,
          inLanguage: locale === 'ko' ? 'ko-KR' : 'en-US',
          author: { '@id': `${SITE_URL}/#person` },
        },
        {
          '@type': 'Person',
          '@id': `${SITE_URL}/#person`,
          name: SITE_NAME,
          url: `${SITE_URL}/`,
          jobTitle: 'Backend Engineer',
          sameAs: ['https://github.com/kyhsa93'],
        },
      ],
    },
  });
};

const latestPosts = postsByDate.slice(0, 3);
const latestSideProjects = sideProjects.slice(-3);

// 히어로에 세우는 한 건. 가장 최근에 discrepancy를 단 글을 고르므로, 새 글이
// 그 필드 없이 올라와도 히어로가 비지 않는다.
const featuredFinding = postsByDate.find((post) => post.discrepancy);

const getInitialTheme = () => {
  if (typeof window === 'undefined') {
    return 'light';
  }

  const savedTheme = window.localStorage.getItem('theme');

  if (savedTheme === 'dark' || savedTheme === 'light') {
    return savedTheme;
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
};

export default function Home() {
  const [theme, setTheme] = useState<'light' | 'dark'>(getInitialTheme);
  const { locale } = useLocale();
  const t = uiCopy[locale];

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    window.localStorage.setItem('theme', theme);
  }, [theme]);

  return (
    <main className="home-page">
      <nav className="site-nav" aria-label={t.nav.mainAriaLabel}>
        <a className="brand" href="#top" aria-label="Younghoon home">
          <span className="brand-mark">Y</span>
          <span>younghoon</span>
        </a>
        <div className="nav-links">
          <a href="#latest">{t.nav.work}</a>
          <a href="#about">{t.nav.about}</a>
          <button
            className="theme-toggle"
            type="button"
            aria-label={t.nav.switchTheme}
            aria-pressed={theme === 'dark'}
            onClick={() =>
              setTheme((currentTheme) =>
                currentTheme === 'dark' ? 'light' : 'dark',
              )
            }
          >
            {theme === 'dark' ? t.nav.light : t.nav.dark}
          </button>
          <LanguageToggle />
          <a href="https://github.com/kyhsa93" target="_blank" rel="noreferrer">
            {t.nav.github} <span aria-hidden="true"></span>
          </a>
        </div>
      </nav>

      <section className="hero" id="top">
        <p className="eyebrow">
          <span />
          {t.home.eyebrow}
        </p>
        <h1>
          {t.home.headlineLine1}
          <em>{t.home.headlineEm}</em>
        </h1>
        <div className="hero-body">
          <div className="hero-copy">
            <p className="intro">{t.home.intro}</p>
            <div className="cta-row">
              <a className="primary-link" href="#latest">
                {t.home.ctaViewProjects} <span aria-hidden="true">↓</span>
              </a>
              <a
                className="text-link"
                href="https://github.com/kyhsa93"
                target="_blank"
                rel="noreferrer"
              >
                {t.home.ctaVisitGithub} <span aria-hidden="true"></span>
              </a>
            </div>
          </div>

        {featuredFinding?.discrepancy ? (
          <Link
            className="finding"
            to={localizedPath(`/posts/${featuredFinding.slug}`, locale)}
          >
            <p className="finding-kicker">
              {t.home.findingKicker}
              <time>{featuredFinding.date}</time>
            </p>
            <div className="finding-pair">
              <div className="finding-half">
                <span className="finding-half-label">{t.home.findingLooked}</span>
                <span className="finding-half-text">
                  {featuredFinding.discrepancy.looked[locale]}
                </span>
              </div>
              <div className="finding-half finding-half-actual">
                <span className="finding-half-label">{t.home.findingWas}</span>
                <span className="finding-half-text">
                  {featuredFinding.discrepancy.was[locale]}
                </span>
              </div>
            </div>
            <p className="finding-source">
              {featuredFinding.title[locale]}
              <span className="finding-read">
                {t.home.findingRead} <span aria-hidden="true">→</span>
              </span>
            </p>
          </Link>
          ) : null}
        </div>
      </section>

      <section className="expertise-section" id="about">
        <p className="section-kicker">{t.home.expertiseKicker}</p>
        <div className="expertise-heading">
          <h2>
            {t.home.expertiseHeadingLine1}
            <br />
            {t.home.expertiseHeadingLine2}
          </h2>
          <p>{t.home.expertiseSubheading}</p>
        </div>
        <ul className="expertise-list">
          {t.home.expertiseList.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="latest-section" id="latest">
        <div className="latest-heading">
          <div>
            <p className="section-kicker">{t.home.latestKicker}</p>
            <h2>{t.home.latestHeading}</h2>
          </div>
          <p>{t.home.latestSubheading}</p>
        </div>

        <div className="latest-grid">
          <div className="post-column">
            <div className="content-label">
              <span>{t.home.writingLabel}</span>
              <span>{t.home.latestPostsLabel}</span>
            </div>
            {latestPosts.map((post) => (
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
            <Link to={localizedPath('/posts', locale)} className="coming-link">
              {t.home.viewAllPosts}
            </Link>
          </div>
          <div className="side-project-column">
            <div className="content-label">
              <span>{t.home.labLabel}</span>
              <span>{t.home.sideProjectsLabel}</span>
            </div>
            {latestSideProjects.map((project) => {
              const status = project.url ? t.home.statusLive : t.home.statusInProgress;

              return (
                <article className="side-project" key={project.title}>
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
            <Link to={localizedPath('/side-projects', locale)} className="coming-link">
              {t.home.viewAllSideProjects}
            </Link>
          </div>
        </div>
      </section>

      <footer>
        <p>{t.footer.tagline}</p>
        <div className="footer-links">
          <a href={locale === 'ko' ? '/rss-ko.xml' : '/rss.xml'}>{t.footer.rss}</a>
          <Link to={localizedPath('/privacy-policy', locale)}>{t.footer.privacy}</Link>
          <a href="https://github.com/kyhsa93" target="_blank" rel="noreferrer">
            github.com/kyhsa93{' '}
          </a>
        </div>
      </footer>
    </main>
  );
}
