import type { Config } from '@react-router/dev/config';

import { posts, type PostMeta } from './src/data/posts.ts';

export default {
  appDirectory: 'src',
  ssr: false,
  prerender: [
    '/',
    '/posts',
    '/privacy-policy',
    '/404',
    ...posts.map((post: PostMeta) => `/posts/${post.slug}`),
  ],
} satisfies Config;
