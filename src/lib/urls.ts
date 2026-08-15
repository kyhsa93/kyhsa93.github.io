export type Locale = 'en' | 'ko';

export const SITE_URL = 'https://kyhsa93.github.io';

export function localizedPath(path: string, locale: Locale): string {
  if (locale === 'en') return path;
  return path === '/' ? '/ko' : `/ko${path}`;
}

const FILE_PATH = /\.(html|xml|txt|json|png|jpe?g|svg|webp|ico)$/i;

export function canonicalUrl(path: string): string {
  if (path.endsWith('/') || FILE_PATH.test(path)) return `${SITE_URL}${path}`;
  return `${SITE_URL}${path}/`;
}

export function canonicalizeUrl(url: string): string {
  return url.startsWith(SITE_URL) ? canonicalUrl(url.slice(SITE_URL.length)) : url;
}
