// 확장자를 붙여 두는 이유: scripts/postbuild.ts가 사이트맵을 만들 때 이 파일을
// 그대로 import하는데, 그쪽은 module: nodenext라 확장자 없는 경로를 못 찾는다.
import type { LocalizedText } from './posts.ts';

export interface SideProject {
  title: string;
  description: LocalizedText;
  url?: string;
}

// Ordered oldest-first by actual project start date (verified against each
// GitHub repo's createdAt), not by when it was added to this list — Fove predates
// the rest by about a year. The homepage takes the last 3 (see Home/index.tsx),
// so keeping this in true chronological order keeps that slice meaningful.
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
    title: 'Econ Realestate Digest',
    description: {
      en: 'A daily digest of Korean economic and real estate news and market indicators, rebuilt every morning by a GitHub Actions pipeline with an open-source local LLM summarizing the day.',
      ko: '한국 경제/부동산 뉴스와 시장 지표를 매일 아침 GitHub Actions 파이프라인으로 자동 갱신하고, 오픈소스 로컬 LLM이 하루 소식을 요약해주는 데일리 다이제스트입니다.',
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
