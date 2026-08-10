import { createContext, useContext, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';

export type Locale = 'en' | 'ko';

interface LocaleContextValue {
  locale: Locale;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

// Locale is derived entirely from the URL (/ko/* vs unprefixed) so that
// prerendered HTML and Googlebot's rendered DOM show the right language for
// the requested path, not whatever a client only toggle/localStorage state
// happened to default to.
export function localeFromPathname(pathname: string): Locale {
  return pathname === '/ko' || pathname.startsWith('/ko/') ? 'ko' : 'en';
}

// Canonical (unprefixed/English) path in, locale-appropriate path out — for
// building <Link to> targets that stay within the current language.
export function localizedPath(path: string, locale: Locale): string {
  if (locale === 'en') return path;
  return path === '/' ? '/ko' : `/ko${path}`;
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const location = useLocation();
  const locale = localeFromPathname(location.pathname);

  return <LocaleContext.Provider value={{ locale }}>{children}</LocaleContext.Provider>;
}

export function useLocale(): LocaleContextValue {
  const context = useContext(LocaleContext);

  if (!context) {
    throw new Error('useLocale must be used within a LocaleProvider');
  }

  return context;
}
