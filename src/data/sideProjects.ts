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
      en: 'Works out a Korean Saju (Four Pillars) chart from a solar birth date and time, alongside a 20-question MBTI test, a daily fortune, compatibility checks and tarot.',
      ko: '양력 생년월일과 태어난 시간으로 사주팔자를 계산하고, 20문항 MBTI 검사·오늘의 운세·궁합·타로를 함께 보여 주는 웹 앱입니다.',
    },
    url: 'https://kyhsa93.github.io/fove/',
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
      en: 'An offline-capable PWA for tracking developmental milestones (2–36 months) across four domains, plus a growth log with percentiles from birth, a symptom urgency check, a fever-reducer dose range and a finder for pharmacies and ERs open at night. Not a diagnostic tool.',
      ko: '2~36개월 영유아의 발달을 네 개 영역으로 관찰하고, 출생부터의 성장 백분위를 기록하는 오프라인 지원 PWA입니다. 증상 응급도 확인, 해열제 용량 범위, 밤·휴일에 여는 약국과 응급실 찾기도 들어 있습니다. 진단 도구는 아닙니다.',
    },
    url: 'https://kyhsa93.github.io/toddler-milestone-checklist/',
  },
  {
    title: '집계 (Jipgye)',
    description: {
      en: 'Seoul apartment transactions and Korean deposit and loan rates, collected daily and worked out for the person about to sign: whether jeonse or monthly rent costs less, and whether renewing beats signing anew. Districts with too few reported deals get no average.',
      ko: '서울 아파트 실거래와 예적금·대출 금리를 매일 모아, 계약을 앞둔 사람이 필요한 것을 계산해 보여줍니다. 전세와 월세 중 어느 쪽이 싼지, 지금 갱신이 새로 구하는 것보다 싼지. 표본이 모자란 자치구는 평균을 내지 않습니다.',
    },
    url: 'https://kyhsa93.github.io/jipgye/',
  },
  {
    title: 'Housing Subsidy Radar',
    description: {
      en: 'Korean housing subscription notices ordered by how soon they close, alongside housing-related government benefits you can narrow down by region, income and age.',
      ko: '전국 청약 공고를 접수 마감이 임박한 순서로 보여주고, 주거 관련 정부 지원금을 지역·소득·나이로 좁혀 찾아보는 사이트입니다.',
    },
    url: 'https://kyhsa93.github.io/housing-subsidy-radar/',
  },
  {
    title: 'ascii-doom',
    description: {
      en: 'A first-person shooter drawn entirely in characters. It plays the 68 Freedoom maps and two levels of its own in the browser, with a keyboard or touch.',
      ko: '글자로만 그리는 1인칭 슈팅 게임입니다. Freedoom의 맵 68개와 직접 만든 레벨 두 개를 브라우저에서 키보드나 터치로 플레이합니다.',
    },
    url: 'https://kyhsa93.github.io/ascii-doom/',
  },
  {
    title: '카르다 전선 (Karda)',
    description: {
      en: 'A 3D conquest game in the browser. Bots fill both armies; you take the capture points on foot or in an attack helicopter. One map and a quick conquest mode so far, with no server and no sign-up.',
      ko: '브라우저에서 하는 3D 점령전입니다. 양쪽 병력은 봇이 맡고, 플레이어는 보병이나 공격 헬기로 출격해 거점을 빼앗습니다. 지금은 맵 하나의 빠른 점령전을 할 수 있고, 서버도 가입도 없습니다.',
    },
    url: 'https://kyhsa93.github.io/karda/',
  },
];
