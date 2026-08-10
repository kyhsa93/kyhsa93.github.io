import type { Config } from '@react-router/dev/config';

import { posts, type PostMeta } from './src/data/posts.ts';

// Every path here except /404 exists in both languages (see src/routes.ts's
// prefix('ko', contentRoutes)) — each one needs both its unprefixed and
// /ko-prefixed form listed, or the /ko/* URL never gets a static file and
// 404s for anyone (including crawlers) who requests it directly.
const contentPaths = [
  '/',
  '/posts',
  '/side-projects',
  '/privacy-policy',
  ...posts.map((post: PostMeta) => `/posts/${post.slug}`),
];

export default {
  appDirectory: 'src',
  ssr: false,
  prerender: [
    ...contentPaths,
    ...contentPaths.map((path) => (path === '/' ? '/ko' : `/ko${path}`)),
    '/404',
  ],
} satisfies Config;
