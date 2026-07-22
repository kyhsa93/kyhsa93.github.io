import { Link } from 'react-router-dom';
import { useSeo } from '../../hooks/useSeo';

export default function PrivacyPolicy() {
  useSeo({
    title: 'Privacy Policy',
    description:
      'How this site uses cookies and third-party advertising (Google AdSense).',
    path: '/privacy-policy',
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
        <p className="section-kicker">Legal</p>
        <h1 className="archive-heading">Privacy Policy</h1>

        <div className="article-body">
          <p>
            This is a personal blog. It doesn't require an account, doesn't
            collect personal information through any form, and stores only two
            small preferences in your browser's local storage: your light/dark
            theme choice and your response to the cookie-consent banner below.
          </p>
          <h2>Advertising (Google AdSense)</h2>
          <p>
            This site shows ads served by Google AdSense. Google and its
            partners may use cookies and similar technologies to serve ads based
            on your prior visits to this or other websites. You can opt out of
            personalized advertising by visiting{' '}
            <a
              href="https://adssettings.google.com/authenticated"
              target="_blank"
              rel="noreferrer"
            >
              Google's Ad Settings
            </a>
            , or by declining the cookie banner shown on this site — declining
            prevents ad scripts from loading at all for the rest of your visit.
          </p>
          <h2>Cookies and Local Storage</h2>
          <p>
            Beyond the AdSense scripts described above, this site itself sets no
            tracking cookies. Your consent choice, once made, is remembered in
            your browser's local storage so the banner doesn't reappear on every
            page — clearing your browser data resets it.
          </p>
          <h2>Third Parties</h2>
          <p>
            This site is hosted on GitHub Pages. Ads are served by Google
            AdSense, subject to{' '}
            <a
              href="https://policies.google.com/technologies/ads"
              target="_blank"
              rel="noreferrer"
            >
              Google's own advertising policy
            </a>
            . No other third-party analytics or tracking services are used.
          </p>
          <h2>Contact</h2>
          <p>
            Questions about this policy can be raised via{' '}
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
        <p>Let’s build something resilient.</p>
        <a href="https://github.com/kyhsa93" target="_blank" rel="noreferrer">
          github.com/kyhsa93 →
        </a>
      </footer>
    </main>
  );
}
