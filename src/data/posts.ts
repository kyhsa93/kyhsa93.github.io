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
    title: '도메인 경계를 찾는 방법',
    summary: '복잡한 요구사항을 Aggregate와 Bounded Context로 정리하는 사고 과정을 기록합니다.',
    date: '2026.07.19',
    tags: ['DDD', 'Architecture'],
    readMinutes: 14,
  },
  {
    slug: 'reliable-event-driven-systems',
    title: '이벤트 기반 시스템의 신뢰성',
    summary: '메시지 전달 실패와 중복 처리에 대응하는 실용적인 패턴을 정리합니다.',
    date: '2026.07.19',
    tags: ['Event-driven', 'Backend'],
    readMinutes: 12,
  },
  {
    slug: 'containerized-development-experience',
    title: '컨테이너 환경의 개발 경험',
    summary: '로컬 개발부터 배포까지, 팀이 반복 가능한 환경을 만드는 방법을 다룹니다.',
    date: '2026.07.19',
    tags: ['Docker', 'Developer experience'],
    readMinutes: 11,
  },
];
