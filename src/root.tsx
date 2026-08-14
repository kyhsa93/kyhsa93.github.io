import type { ReactNode } from 'react';
import { Links, Meta, Outlet, Scripts, ScrollRestoration, useLocation } from 'react-router';

import { LocaleProvider, localeFromPathname } from './lib/locale';
import { AdConsentProvider } from './lib/adConsent';
import { ConsentBanner } from './components/ConsentBanner';
import { ScrollToTop } from './components/ScrollToTop';

import './index.css';
import './App.css';

const THEME_INIT_SCRIPT = `
(function () {
  try {
    var saved = window.localStorage.getItem('theme');
    var theme = saved === 'dark' || saved === 'light'
      ? saved
      : (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', theme);
  } catch (e) {}
})();
`;

const GA_INIT_SCRIPT = `
window.dataLayer = window.dataLayer || [];
function gtag() { dataLayer.push(arguments); }
gtag('js', new Date());
gtag('config', 'G-Z1LH7S1ZE5');
`;

export function Layout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const locale = localeFromPathname(location.pathname);

  return (
    <html lang={locale}>
      <head>
        <meta charSet="UTF-8" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="apple-touch-icon" href="/pwa-192x192.png" />
        <link rel="manifest" href="/manifest.webmanifest" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="theme-color" content="#182118" />
        <meta name="robots" content="index, follow" />

        <link
          rel="alternate"
          type="application/rss+xml"
          title="younghoon — backend engineer"
          href="https://kyhsa93.github.io/rss.xml"
        />
        <link
          rel="alternate"
          type="application/atom+xml"
          title="younghoon — backend engineer"
          href="https://kyhsa93.github.io/atom.xml"
        />
        <link
          rel="alternate"
          type="application/rss+xml"
          title="younghoon — 백엔드 엔지니어"
          href="https://kyhsa93.github.io/rss-ko.xml"
        />
        <link
          rel="alternate"
          type="application/atom+xml"
          title="younghoon — 백엔드 엔지니어"
          href="https://kyhsa93.github.io/atom-ko.xml"
        />

        <meta name="naver-site-verification" content="5380f459e39023c44e13549272dda1be8c9714e3" />
        <meta name="google-adsense-account" content="ca-pub-1195159445218373" />
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1195159445218373"
          crossOrigin="anonymous"
        />

        <script async src="https://www.googletagmanager.com/gtag/js?id=G-Z1LH7S1ZE5" />
        <script dangerouslySetInnerHTML={{ __html: GA_INIT_SCRIPT }} />

        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />

        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return (
    <LocaleProvider>
      <AdConsentProvider>
        <ScrollToTop />
        <Outlet />
        <ConsentBanner />
      </AdConsentProvider>
    </LocaleProvider>
  );
}
