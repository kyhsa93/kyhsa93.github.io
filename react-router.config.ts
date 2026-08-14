import type { Config } from '@react-router/dev/config';

import { posts, type PostMeta } from './src/data/posts.ts';

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
