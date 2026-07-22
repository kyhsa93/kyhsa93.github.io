import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { posts } from '../../data/posts';
import { useSeo } from '../../hooks/useSeo';

const expertise = [
  'TypeScript · Node.js',
  'Go',
  'Docker · Kubernetes',
  'AWS · GCP',
  'CQRS · DDD',
  'Event-driven architecture',
];

const latestPosts = posts.slice(0, 3);

const sideProjects = [
  {
    title: 'Fove',
    description: 'A fortune-telling web app based on Korean Saju and MBTI.',
    status: 'Live',
    href: 'https://kyhsa93.github.io/fove',
  },
  {
    title: 'Event Flow Visualizer',
    description: 'A visualization experiment for understanding event-driven system flows more easily.',
    status: 'In progress',
    href: undefined,
  },
  {
    title: 'Service Architecture Notes',
    description: 'A personal knowledge base collecting patterns and decisions learned while designing services.',
    status: 'In progress',
    href: undefined,
  },
];

const getInitialTheme = () => {
  if (typeof window === 'undefined') {
    return 'light';
  }

  const savedTheme = window.localStorage.getItem('theme');

  if (savedTheme === 'dark' || savedTheme === 'light') {
    return savedTheme;
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

export default function Home() {
  const [theme, setTheme] = useState<'light' | 'dark'>(getInitialTheme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    window.localStorage.setItem('theme', theme);
  }, [theme]);

  useSeo({
    title: 'younghoon — backend engineer',
    description: 'Notes from a backend engineer who designs complex systems with clarity. TypeScript, Go, and the Backend Service Playbook.',
    path: '/',
  });

  return (
    <main className="home-page">
      <nav className="site-nav" aria-label="Main navigation">
        <a className="brand" href="#top" aria-label="Younghoon home">
          <span className="brand-mark">Y</span>
          <span>younghoon</span>
        </a>
        <div className="nav-links">
          <a href="#work">Work</a>
          <a href="#about">About</a>
          <button
            className="theme-toggle"
            type="button"
            aria-label="Switch theme"
            aria-pressed={theme === 'dark'}
            onClick={() => setTheme((currentTheme) => (currentTheme === 'dark' ? 'light' : 'dark'))}
          >
            <span aria-hidden="true">{theme === 'dark' ? '☀️' : '🌙'}</span>
            {theme === 'dark' ? 'Light' : 'Dark'}
          </button>
          <a href="https://github.com/kyhsa93" target="_blank" rel="noreferrer">
            GitHub <span aria-hidden="true"></span>
          </a>
        </div>
      </nav>

      <section className="hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow"><span />Backend engineer</p>
          <h1>
            Designing complex systems
            <br />
            <em>with clarity</em>.
          </h1>
          <p className="intro">
            I build backend systems that run reliably in containerized
            environments, mainly with TypeScript and Go. I'm especially
            interested in domain-driven design and event-driven architecture.
          </p>
          <div className="cta-row">
            <a className="primary-link" href="#work">View projects <span aria-hidden="true">↓</span></a>
            <a className="text-link" href="https://github.com/kyhsa93" target="_blank" rel="noreferrer">
              Visit GitHub <span aria-hidden="true"></span>
            </a>
          </div>
        </div>

        <div className="system-card" aria-label="System architecture illustration">
          <div className="system-card-heading">
            <span>system / overview</span>
            <span className="status"><i /> online</span>
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
          <p className="system-note">from request to reliable delivery</p>
        </div>
      </section>

      <section className="expertise-section" id="about">
        <p className="section-kicker">What I work with</p>
        <div className="expertise-heading">
          <h2>Practical building blocks<br />for distributed systems.</h2>
          <p>I see technology as a tool for solving problems, and I choose it with operations and scale in mind.</p>
        </div>
        <ul className="expertise-list">
          {expertise.map((item, index) => (
            <li key={item}><span>0{index + 1}</span>{item}</li>
          ))}
        </ul>
      </section>

      <section className="work-section" id="work">
        <div className="section-heading">
          <div>
            <p className="section-kicker">Open-source project</p>
            <h2>Backend Service Playbook</h2>
          </div>
          <a className="all-link" href="https://github.com/kyhsa93/backend-service-playbook" target="_blank" rel="noreferrer">
            View on GitHub <span aria-hidden="true"></span>
          </a>
        </div>
        <article className="playbook-card">
          <div className="playbook-intro">
            <div className="playbook-icon" aria-hidden="true">
              <span /><span /><span />
            </div>
            <p className="project-label">A practical guide for backend services</p>
            <p className="playbook-description">
              A single place for the design and implementation principles of
              DDD-based backend services. It helps teams build services with
              a consistent structure, without being locked into any one framework.
            </p>
            <a className="playbook-link" href="https://github.com/kyhsa93/backend-service-playbook" target="_blank" rel="noreferrer">
              Open repository <span aria-hidden="true"></span>
            </a>
          </div>
          <div className="playbook-details">
            <div className="principle-list">
              <p>Included principles</p>
              <ul>
                <li><span>01</span>Domain-driven design</li>
                <li><span>02</span>Layered architecture</li>
                <li><span>03</span>CQRS &amp; Repository</li>
                <li><span>04</span>Conventions &amp; checklist</li>
              </ul>
            </div>
            <div className="implementation-list">
              <p>Implementation guides</p>
              <div>
                <span>TypeScript <b>NestJS</b></span>
                <span>Go <b>Go</b></span>
                <span>Java <b>Spring Boot</b></span>
                <span>Kotlin <b>Spring Boot</b></span>
                <span>Python <b>FastAPI</b></span>
              </div>
            </div>
          </div>
        </article>
      </section>

      <section className="latest-section" id="latest">
        <div className="latest-heading">
          <div>
            <p className="section-kicker">Latest</p>
            <h2>Writing and experimenting.</h2>
          </div>
          <p>A running record of lessons learned from design work and small experiments.</p>
        </div>

        <div className="latest-grid">
          <div className="post-column">
            <div className="content-label"><span>Writing</span><span>Latest posts</span></div>
            {latestPosts.map((post) => (
              <article className="post-item published" key={post.slug}>
                <div className="post-meta"><time>{post.date}</time><span>{post.tags.join(' · ')}</span></div>
                <h3><Link to={`/posts/${post.slug}`}>{post.title}<span aria-hidden="true">→</span></Link></h3>
                <p>{post.summary}</p>
              </article>
            ))}
            <Link to="/posts" className="coming-link">View all posts →</Link>
          </div>
          <div className="side-project-column">
            <div className="content-label"><span>Lab</span><span>Side projects</span></div>
            {sideProjects.map((project, index) => (
              <article className="side-project" key={project.title}>
                <div className={`project-orb orb-${index + 1}`} aria-hidden="true"><span /></div>
                <div>
                  <p className="project-status"><i />{project.status}</p>
                  <h3>{project.href ? <a href={project.href} target="_blank" rel="noreferrer">{project.title} <span aria-hidden="true"></span></a> : project.title}</h3>
                  <p>{project.description}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <footer>
        <p>Let’s build something resilient.</p>
        <a href="https://github.com/kyhsa93" target="_blank" rel="noreferrer">github.com/kyhsa93 </a>
      </footer>
    </main>
  );
}
