import { Link } from 'react-router-dom';
import { useSeo } from '../../hooks/useSeo';

export default function NotFound() {
  useSeo({
    title: 'Page Not Found',
    description: "The page you're looking for doesn't exist or has moved.",
    path: '/404',
  });

  return (
    <main className="home-page">
      <nav className="site-nav" aria-label="Main navigation">
        <Link className="brand" to="/">
          <span className="brand-mark">Y</span>
          <span>younghoon</span>
        </Link>
        <div className="nav-links">
          <Link to="/">← Home</Link>
        </div>
      </nav>

      <section className="archive-section">
        <p className="section-kicker">404</p>
        <h1 className="archive-heading">This page doesn't exist.</h1>
        <p>
          The link might be broken, or the page may have moved. Try the
          homepage, or browse{' '}
          <Link to="/posts" className="text-link">
            all posts
          </Link>
          .
        </p>
        <div className="cta-row" style={{ marginTop: '32px' }}>
          <Link className="primary-link" to="/">
            Back to home <span aria-hidden="true">→</span>
          </Link>
        </div>
      </section>

      <footer>
        <p>Let’s build something resilient.</p>
        <div className="footer-links">
          <a href="/rss.xml">RSS</a>
          <Link to="/privacy-policy">Privacy</Link>
          <a href="https://github.com/kyhsa93" target="_blank" rel="noreferrer">
            github.com/kyhsa93 →
          </a>
        </div>
      </footer>
    </main>
  );
}
