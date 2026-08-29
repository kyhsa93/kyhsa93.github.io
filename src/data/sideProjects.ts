import type { LocalizedText } from './posts.ts';

export interface SideProject {
  title: string;
  description: LocalizedText;
  url?: string;
}

export const sideProjects: SideProject[] = [
  {
    title: 'Fove',
    description: {
      en: 'A fortune-telling web app based on Korean Saju and MBTI.',
      ko: '한국식 사주와 MBTI를 기반으로 한 운세 웹 앱입니다.',
    },
    url: 'https://kyhsa93.github.io/fove',
  },
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
    title: 'Toddler Milestone Checklist',
    description: {
      en: 'An offline-capable PWA for tracking developmental milestones (2–36 months) across four domains, plus a growth log with percentiles from birth. Not a diagnostic tool.',
      ko: '2~36개월 영유아의 발달을 네 개 영역으로 관찰하고, 출생부터의 성장 백분위를 기록하는 오프라인 지원 PWA입니다. 진단 도구는 아닙니다.',
    },
    url: 'https://kyhsa93.github.io/toddler-milestone-checklist/',
  },
  {
    title: '집계 (Jipgye)',
    description: {
      en: 'Seoul apartment transactions and Korean deposit and loan rates, collected daily and worked out for the person about to sign: whether jeonse or monthly rent costs less, and whether renewing beats signing anew. Districts with too few reported deals get no average.',
      ko: '서울 아파트 실거래와 예적금·대출 금리를 매일 모아, 계약을 앞둔 사람이 필요한 것을 계산해 보여줍니다. 전세와 월세 중 어느 쪽이 싼지, 지금 갱신이 새로 구하는 것보다 싼지. 표본이 모자란 자치구는 평균을 내지 않습니다.',
    },
    url: 'https://kyhsa93.github.io/econ-realestate-digest/',
  },
  {
    title: 'Housing Subsidy Radar',
    description: {
      en: 'Korean housing subscription notices ordered by how soon they close, alongside housing-related government benefits you can narrow down by region, income and age.',
      ko: '전국 청약 공고를 접수 마감이 임박한 순서로 보여주고, 주거 관련 정부 지원금을 지역·소득·나이로 좁혀 찾아보는 사이트입니다.',
    },
    url: 'https://kyhsa93.github.io/housing-subsidy-radar/',
  },
];
