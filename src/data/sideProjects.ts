import type { LocalizedText } from './posts';

export interface SideProject {
  title: string;
  description: LocalizedText;
  url?: string;
}

export const sideProjects: SideProject[] = [
  {
    title: 'Backend Service Playbook',
    description: {
      en: 'Design and implementation principles for DDD-based backend services, implemented the same way across five languages.',
      ko: 'DDD 기반 백엔드 서비스의 설계 및 구현 원칙을, 다섯 개 언어에서 동일하게 구현했습니다.',
    },
    url: 'https://github.com/kyhsa93/backend-service-playbook',
  },
  {
    title: 'k8s-playbook',
    description: {
      en: 'A catalog of recurring Kubernetes deployment anti-patterns, each paired with an automated detection harness.',
      ko: '반복되는 Kubernetes 배포 안티패턴 카탈로그와, 이를 자동으로 탐지하는 하네스입니다.',
    },
    url: 'https://github.com/kyhsa93/k8s-playbook',
  },
  {
    title: 'Fove',
    description: {
      en: 'A fortune-telling web app based on Korean Saju and MBTI.',
      ko: '한국식 사주와 MBTI를 기반으로 한 운세 웹 앱입니다.',
    },
    url: 'https://kyhsa93.github.io/fove',
  },
];
