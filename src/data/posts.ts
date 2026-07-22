export interface PostMeta {
  slug: string;
  title: string;
  summary: string;
  date: string;
  tags: string[];
  readMinutes: number;
}

export const posts: PostMeta[] = [
  {
    slug: 'finding-domain-boundaries',
    title: 'How to Find Domain Boundaries',
    summary: 'A record of the thought process for organizing complex requirements into Aggregates and Bounded Contexts.',
    date: '2026.07.19',
    tags: ['DDD', 'Architecture'],
    readMinutes: 14,
  },
  {
    slug: 'reliable-event-driven-systems',
    title: 'Reliability in Event-Driven Systems',
    summary: 'Practical patterns for handling message delivery failures and duplicate processing.',
    date: '2026.07.19',
    tags: ['Event-driven', 'Backend'],
    readMinutes: 12,
  },
  {
    slug: 'containerized-development-experience',
    title: 'Developer Experience in Containerized Environments',
    summary: 'How teams can build a reproducible environment from local development through deployment.',
    date: '2026.07.19',
    tags: ['Docker', 'Developer experience'],
    readMinutes: 11,
  },
];
