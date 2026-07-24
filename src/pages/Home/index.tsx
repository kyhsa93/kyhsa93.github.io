import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { postsByDate } from '../../data/posts';
import { useSeo } from '../../hooks/useSeo';
import { useLocale } from '../../lib/locale';
import { uiCopy } from '../../lib/copy';
import { LanguageToggle } from '../../components/LanguageToggle';

const latestPosts = postsByDate.slice(0, 3);

const sideProjectLinks: (string | undefined)[] = [
  'https://kyhsa93.github.io/fove',
  undefined,
  undefined,
];

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

  useSeo({
    title: t.home.seoTitle,
    description: t.home.seoDescription,
    path: '/',
  });

  return (
    <main className="home-page">
      <nav className="site-nav" aria-label={t.nav.mainAriaLabel}>
        <a className="brand" href="#top" aria-label="Younghoon home">
          <span className="brand-mark">Y</span>
          <span>younghoon</span>
        </a>
        <div className="nav-links">
          <a href="#work">{t.nav.work}</a>
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
            <span aria-hidden="true">{theme === 'dark' ? '☀️' : '🌙'}</span>
            {theme === 'dark' ? t.nav.light : t.nav.dark}
          </button>
          <LanguageToggle />
          <a href="https://github.com/kyhsa93" target="_blank" rel="noreferrer">
            {t.nav.github} <span aria-hidden="true"></span>
          </a>
        </div>
      </nav>

      <section className="hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow">
            <span />
            {t.home.eyebrow}
          </p>
          <h1>
            {t.home.headlineLine1}
            <br />
            <em>{t.home.headlineEm}</em>
          </h1>
          <p className="intro">{t.home.intro}</p>
          <div className="cta-row">
            <a className="primary-link" href="#work">
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

        <div
          className="system-card"
          aria-label="System architecture illustration"
        >
          <div className="system-card-heading">
            <span>{t.home.systemOverview}</span>
            <span className="status">
              <i /> {t.home.online}
            </span>
          </div>
          <div className="architecture">
            <div className="node client">client</div>
            <div className="connector connector-one" />
            <div className="node api">API</div>
            <div className="connector connector-two" />
            <div className="node service">service</div>
            <div className="connector connector-three" />
            <div className="data-nodes">
              <div className="node database">database</div>
              <div className="node queue">events</div>
            </div>
          </div>
          <p className="system-note">{t.home.systemNote}</p>
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
          {t.home.expertiseList.map((item, index) => (
            <li key={item}>
              <span>0{index + 1}</span>
              {item}
            </li>
          ))}
        </ul>
      </section>

      <section className="work-section" id="work">
        <div className="section-heading">
          <div>
            <p className="section-kicker">{t.home.workKicker}</p>
            <h2>{t.home.workHeading}</h2>
          </div>
          <a
            className="all-link"
            href="https://github.com/kyhsa93/backend-service-playbook"
            target="_blank"
            rel="noreferrer"
          >
            {t.home.viewOnGithub} <span aria-hidden="true"></span>
          </a>
        </div>
        <article className="playbook-card">
          <div className="playbook-intro">
            <div className="playbook-icon" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
            <p className="project-label">{t.home.projectLabel}</p>
            <p className="playbook-description">{t.home.playbookDescription}</p>
            <a
              className="playbook-link"
              href="https://github.com/kyhsa93/backend-service-playbook"
              target="_blank"
              rel="noreferrer"
            >
              {t.home.openRepository} <span aria-hidden="true"></span>
            </a>
          </div>
          <div className="playbook-details">
            <div className="principle-list">
              <p>{t.home.includedPrinciples}</p>
              <ul>
                {t.home.principles.map((principle, index) => (
                  <li key={principle}>
                    <span>0{index + 1}</span>
                    {principle}
                  </li>
                ))}
              </ul>
            </div>
            <div className="implementation-list">
              <p>{t.home.implementationGuides}</p>
              <div>
                <span>
                  TypeScript <b>NestJS</b>
                </span>
                <span>
                  Go <b>Go</b>
                </span>
                <span>
                  Java <b>Spring Boot</b>
                </span>
                <span>
                  Kotlin <b>Spring Boot</b>
                </span>
                <span>
                  Python <b>FastAPI</b>
                </span>
              </div>
            </div>
          </div>
        </article>
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
                  <Link to={`/posts/${post.slug}`}>
                    {post.title[locale]}
                    <span aria-hidden="true">→</span>
                  </Link>
                </h3>
                <p>{post.summary[locale]}</p>
              </article>
            ))}
            <Link to="/posts" className="coming-link">
              {t.home.viewAllPosts}
            </Link>
          </div>
          <div className="side-project-column">
            <div className="content-label">
              <span>{t.home.labLabel}</span>
              <span>{t.home.sideProjectsLabel}</span>
            </div>
            {t.home.sideProjects.map((project, index) => {
              const href = sideProjectLinks[index];
              const status = href ? t.home.statusLive : t.home.statusInProgress;

              return (
                <article className="side-project" key={project.title}>
                  <div
                    className={`project-orb orb-${index + 1}`}
                    aria-hidden="true"
                  >
                    <span />
                  </div>
                  <div>
                    <p className="project-status">
                      <i />
                      {status}
                    </p>
                    <h3>
                      {href ? (
                        <a href={href} target="_blank" rel="noreferrer">
                          {project.title} <span aria-hidden="true"></span>
                        </a>
                      ) : (
                        project.title
                      )}
                    </h3>
                    <p>{project.description}</p>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <footer>
        <p>{t.footer.tagline}</p>
        <div className="footer-links">
          <a href="/rss.xml">{t.footer.rss}</a>
          <Link to="/privacy-policy">{t.footer.privacy}</Link>
          <a href="https://github.com/kyhsa93" target="_blank" rel="noreferrer">
            github.com/kyhsa93{' '}
          </a>
        </div>
      </footer>
    </main>
  );
}
