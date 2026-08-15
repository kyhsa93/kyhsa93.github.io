import type { MetaDescriptor } from 'react-router';

import { posts, type PostMeta } from '../data/posts';
import { canonicalUrl, localizedPath, SITE_URL, type Locale } from './urls';

export { SITE_URL };
export const SITE_NAME = 'younghoon';
export const DEFAULT_IMAGE = `${SITE_URL}/og-image.png`;

interface SeoOptions {
  title: string;
  description: string;
  path: string;
  locale: Locale;
  type?: 'website' | 'article';
  image?: string;
  publishedTime?: string;
  jsonLd?: Record<string, unknown>;
}

export function createMeta({
  title,
  description,
  path,
  locale,
  type = 'website',
  image = DEFAULT_IMAGE,
  publishedTime,
  jsonLd,
}: SeoOptions): MetaDescriptor[] {
  const url = canonicalUrl(localizedPath(path, locale));
  const enUrl = canonicalUrl(path);
  const koUrl = canonicalUrl(localizedPath(path, 'ko'));
  const fullTitle = path === '/' ? title : `${title} · ${SITE_NAME}`;

  const descriptors: MetaDescriptor[] = [
    { title: fullTitle },
    { name: 'description', content: description },
    { tagName: 'link', rel: 'canonical', href: url },
    { tagName: 'link', rel: 'alternate', hrefLang: 'en', href: enUrl },
    { tagName: 'link', rel: 'alternate', hrefLang: 'ko', href: koUrl },
    { tagName: 'link', rel: 'alternate', hrefLang: 'x-default', href: enUrl },

    { property: 'og:title', content: title },
    { property: 'og:description', content: description },
    { property: 'og:type', content: type },
    { property: 'og:url', content: url },
    { property: 'og:image', content: image },
    { property: 'og:site_name', content: SITE_NAME },
    { property: 'og:locale', content: locale === 'ko' ? 'ko_KR' : 'en_US' },
    { property: 'og:locale:alternate', content: locale === 'ko' ? 'en_US' : 'ko_KR' },

    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: title },
    { name: 'twitter:description', content: description },
    { name: 'twitter:image', content: image },
  ];

  if (publishedTime) {
    descriptors.push({ property: 'article:published_time', content: publishedTime });
  }

  if (jsonLd) {
    descriptors.push({ 'script:ld+json': jsonLd });
  }

  return descriptors;
}

function toIsoDate(date: string): string {
  return date.replace(/\./g, '-');
}

export function createPostMeta(slug: string, locale: Locale): MetaDescriptor[] {
  const post = posts.find((p: PostMeta) => p.slug === slug);
  const path = `/posts/${slug}`;
  const title = post?.title[locale] ?? slug;
  const description = post?.summary[locale] ?? '';
  const publishedTime = post ? toIsoDate(post.date) : undefined;
  const image = locale === 'ko' ? `${SITE_URL}/og/ko/${slug}.png` : `${SITE_URL}/og/${slug}.png`;

  return createMeta({
    title,
    description,
    path,
    locale,
    type: 'article',
    image,
    publishedTime,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: title,
      description,
      datePublished: publishedTime,
      inLanguage: locale === 'ko' ? 'ko-KR' : 'en-US',
      author: { '@type': 'Person', name: 'younghoon' },
      image,
      url: canonicalUrl(localizedPath(path, locale)),
    },
  });
}
