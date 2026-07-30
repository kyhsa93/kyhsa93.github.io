import type { MetaDescriptor } from 'react-router';

import { posts, type PostMeta } from '../data/posts';

export const SITE_URL = 'https://kyhsa93.github.io';
export const SITE_NAME = 'younghoon';
export const DEFAULT_IMAGE = `${SITE_URL}/og-image.png`;

interface SeoOptions {
  title: string;
  description: string;
  path: string;
  type?: 'website' | 'article';
  image?: string;
  publishedTime?: string;
  jsonLd?: Record<string, unknown>;
}

export function createMeta({
  title,
  description,
  path,
  type = 'website',
  image = DEFAULT_IMAGE,
  publishedTime,
  jsonLd,
}: SeoOptions): MetaDescriptor[] {
  const url = `${SITE_URL}${path}`;
  const fullTitle = path === '/' ? title : `${title} · ${SITE_NAME}`;

  const descriptors: MetaDescriptor[] = [
    { title: fullTitle },
    { name: 'description', content: description },
    { tagName: 'link', rel: 'canonical', href: url },

    { property: 'og:title', content: title },
    { property: 'og:description', content: description },
    { property: 'og:type', content: type },
    { property: 'og:url', content: url },
    { property: 'og:image', content: image },
    { property: 'og:site_name', content: SITE_NAME },

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

export function createPostMeta(slug: string): MetaDescriptor[] {
  const post = posts.find((p: PostMeta) => p.slug === slug);
  const path = `/posts/${slug}`;
  const title = post?.title.en ?? slug;
  const description = post?.summary.en ?? '';
  const publishedTime = post ? toIsoDate(post.date) : undefined;
  const image = `${SITE_URL}/og/${slug}.png`;

  return createMeta({
    title,
    description,
    path,
    type: 'article',
    image,
    publishedTime,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: title,
      description,
      datePublished: publishedTime,
      author: { '@type': 'Person', name: 'younghoon' },
      image,
      url: `${SITE_URL}${path}`,
    },
  });
}
