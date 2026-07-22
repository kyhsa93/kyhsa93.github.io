import { useEffect } from 'react';

const SITE_URL = 'https://kyhsa93.github.io';
const SITE_NAME = 'younghoon';
const DEFAULT_IMAGE = `${SITE_URL}/og-image.png`;

interface SeoOptions {
  title: string;
  description: string;
  path: string;
  type?: 'website' | 'article';
  publishedTime?: string;
  jsonLd?: Record<string, unknown>;
}

function setMeta(attr: 'name' | 'property', key: string, content: string): void {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setLink(rel: string, href: string): void {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

const JSON_LD_SCRIPT_ID = 'seo-json-ld';

export function useSeo({ title, description, path, type = 'website', publishedTime, jsonLd }: SeoOptions): void {
  const jsonLdString = jsonLd ? JSON.stringify(jsonLd) : undefined;

  useEffect(() => {
    const url = `${SITE_URL}${path}`;
    const fullTitle = path === '/' ? title : `${title} · ${SITE_NAME}`;

    document.title = fullTitle;
    setMeta('name', 'description', description);
    setLink('canonical', url);

    setMeta('property', 'og:title', title);
    setMeta('property', 'og:description', description);
    setMeta('property', 'og:type', type);
    setMeta('property', 'og:url', url);
    setMeta('property', 'og:image', DEFAULT_IMAGE);
    setMeta('property', 'og:site_name', SITE_NAME);

    setMeta('name', 'twitter:card', 'summary_large_image');
    setMeta('name', 'twitter:title', title);
    setMeta('name', 'twitter:description', description);
    setMeta('name', 'twitter:image', DEFAULT_IMAGE);

    if (publishedTime) setMeta('property', 'article:published_time', publishedTime);

    document.getElementById(JSON_LD_SCRIPT_ID)?.remove();
    if (jsonLdString) {
      const script = document.createElement('script');
      script.id = JSON_LD_SCRIPT_ID;
      script.type = 'application/ld+json';
      script.textContent = jsonLdString;
      document.head.appendChild(script);
    }
  }, [title, description, path, type, publishedTime, jsonLdString]);
}
