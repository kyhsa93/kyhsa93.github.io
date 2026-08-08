import type { Locale } from './locale';

interface SideProjectCopy {
  title: string;
  description: string;
}

interface WorkProjectCopy {
  name: string;
  repoUrl: string;
  label: string;
  description: string;
  principlesLabel: string;
  principles: string[];
  detailsLabel: string;
  detailItems: { label: string; value: string }[];
}

interface UiCopy {
  nav: {
    mainAriaLabel: string;
    postAriaLabel: string;
    work: string;
    about: string;
    github: string;
    switchTheme: string;
    light: string;
    dark: string;
    backHome: string;
    postFooterBackHome: string;
  };
  home: {
    seoTitle: string;
    seoDescription: string;
    eyebrow: string;
    headlineLine1: string;
    headlineEm: string;
    intro: string;
    ctaViewProjects: string;
    ctaVisitGithub: string;
    systemOverview: string;
    online: string;
    systemNote: string;
    expertiseKicker: string;
    expertiseHeadingLine1: string;
    expertiseHeadingLine2: string;
    expertiseSubheading: string;
    expertiseList: string[];
    workKicker: string;
    workHeading: string;
    viewOnGithub: string;
    openRepository: string;
    projects: WorkProjectCopy[];
    latestKicker: string;
    latestHeading: string;
    latestSubheading: string;
    writingLabel: string;
    latestPostsLabel: string;
    viewAllPosts: string;
    labLabel: string;
    sideProjectsLabel: string;
    sideProjects: SideProjectCopy[];
    statusLive: string;
    statusInProgress: string;
  };
  footer: {
    tagline: string;
    rss: string;
    privacy: string;
  };
  archive: {
    seoTitle: string;
    seoDescription: (count: number) => string;
    kicker: string;
    heading: string;
    writingLabel: string;
    postsCount: (count: number) => string;
  };
  notFound: {
    seoTitle: string;
    seoDescription: string;
    kicker: string;
    heading: string;
    body: string;
    allPostsLink: string;
    bodySuffix: string;
    backHome: string;
  };
  privacyPolicy: {
    seoTitle: string;
    seoDescription: string;
    kicker: string;
    heading: string;
    intro: string;
    advertisingHeading: string;
    advertisingBody1: string;
    adSettingsLink: string;
    advertisingBody2: string;
    cookiesHeading: string;
    cookiesBody: string;
    thirdPartiesHeading: string;
    thirdPartiesBody1: string;
    googlePolicyLink: string;
    thirdPartiesBody2: string;
    contactHeading: string;
    contactBody: string;
  };
}

export const uiCopy: Record<Locale, UiCopy> = {
  en: {
    nav: {
      mainAriaLabel: 'Main navigation',
      postAriaLabel: 'Post navigation',
      work: 'Work',
      about: 'About',
      github: 'GitHub',
      switchTheme: 'Switch theme',
      light: 'Light',
      dark: 'Dark',
      backHome: '← Home',
      postFooterBackHome: '← Back to home',
    },
    home: {
      seoTitle: 'younghoon — backend engineer',
      seoDescription:
        'Notes from a backend engineer who designs complex systems with clarity. TypeScript, Go, and the Backend Service Playbook.',
      eyebrow: 'Backend engineer',
      headlineLine1: 'Designing complex systems',
      headlineEm: 'with clarity.',
      intro:
        "I build backend systems that run reliably in containerized environments, mainly with TypeScript and Go. I'm especially interested in domain-driven design and event-driven architecture.",
      ctaViewProjects: 'View projects',
      ctaVisitGithub: 'Visit GitHub',
      systemOverview: 'system / overview',
      online: 'online',
      systemNote: 'from request to reliable delivery',
      expertiseKicker: 'What I work with',
      expertiseHeadingLine1: 'Practical building blocks',
      expertiseHeadingLine2: 'for distributed systems.',
      expertiseSubheading:
        'I see technology as a tool for solving problems, and I choose it with operations and scale in mind.',
      expertiseList: [
        'TypeScript · Node.js',
        'Go',
        'Docker · Kubernetes',
        'AWS · GCP',
        'CQRS · DDD',
        'Event-driven architecture',
      ],
      workKicker: 'Open-source work',
      workHeading: 'Projects I maintain in the open.',
      viewOnGithub: 'View on GitHub',
      openRepository: 'Open repository',
      projects: [
        {
          name: 'Backend Service Playbook',
          repoUrl: 'https://github.com/kyhsa93/backend-service-playbook',
          label: 'A practical guide for backend services',
          description:
            'A single place for the design and implementation principles of DDD-based backend services. It helps teams build services with a consistent structure, without being locked into any one framework.',
          principlesLabel: 'Included principles',
          principles: [
            'Domain-driven design',
            'Layered architecture',
            'CQRS & Repository',
            'Conventions & checklist',
          ],
          detailsLabel: 'Implementation guides',
          detailItems: [
            { label: 'TypeScript', value: 'NestJS' },
            { label: 'Go', value: 'Go' },
            { label: 'Java', value: 'Spring Boot' },
            { label: 'Kotlin', value: 'Spring Boot' },
            { label: 'Python', value: 'FastAPI' },
          ],
        },
        {
          name: 'k8s-playbook',
          repoUrl: 'https://github.com/kyhsa93/k8s-playbook',
          label: 'An anti-pattern catalog for Kubernetes deployments',
          description:
            'Recurring Kubernetes deployment anti-patterns, each paired with an automated detection harness — validated against real Kustomize/Helm renders and real Argo CD/Flux/Kargo controllers, and reused as a benchmark for how well an AI agent authors manifests that follow the catalog on its own.',
          principlesLabel: 'Included principles',
          principles: [
            'Anti-pattern catalog',
            'Automated detection harness',
            'Live-controller validation',
            'AI-authoring benchmark',
          ],
          detailsLabel: 'Harness coverage',
          detailItems: [
            { label: 'Workload', value: 'items 1–6' },
            { label: 'GitOps state', value: 'items 11–13' },
            { label: 'Config & secrets', value: 'items 7–10' },
            { label: 'Tenancy', value: 'items 14–15' },
            { label: 'Networking', value: 'items 16–19' },
          ],
        },
      ],
      latestKicker: 'Latest',
      latestHeading: 'Writing and experimenting.',
      latestSubheading:
        'A running record of lessons learned from design work and small experiments.',
      writingLabel: 'Writing',
      latestPostsLabel: 'Latest posts',
      viewAllPosts: 'View all posts →',
      labLabel: 'Lab',
      sideProjectsLabel: 'Side projects',
      sideProjects: [
        {
          title: 'Fove',
          description: 'A fortune-telling web app based on Korean Saju and MBTI.',
        },
        {
          title: 'Event Flow Visualizer',
          description:
            'A visualization experiment for understanding event-driven system flows more easily.',
        },
        {
          title: 'Service Architecture Notes',
          description:
            'A personal knowledge base collecting patterns and decisions learned while designing services.',
        },
      ],
      statusLive: 'Live',
      statusInProgress: 'In progress',
    },
    footer: {
      tagline: 'Let’s build something resilient.',
      rss: 'RSS',
      privacy: 'Privacy',
    },
    archive: {
      seoTitle: 'All posts',
      seoDescription: (count) =>
        `Every post, in one place — ${count} write-ups on DDD, CQRS, and backend architecture.`,
      kicker: 'Writing',
      heading: 'All posts',
      writingLabel: 'Writing',
      postsCount: (count) => `${count} posts`,
    },
    notFound: {
      seoTitle: 'Page Not Found',
      seoDescription: "The page you're looking for doesn't exist or has moved.",
      kicker: '404',
      heading: "This page doesn't exist.",
      body: 'The link might be broken, or the page may have moved. Try the homepage, or browse',
      allPostsLink: 'all posts',
      bodySuffix: '',
      backHome: 'Back to home',
    },
    privacyPolicy: {
      seoTitle: 'Privacy Policy',
      seoDescription: 'How this site uses cookies and third-party advertising (Google AdSense).',
      kicker: 'Legal',
      heading: 'Privacy Policy',
      intro:
        "This is a personal blog. It doesn't require an account, doesn't collect personal information through any form, and stores only two small preferences in your browser's local storage: your light/dark theme choice and your response to the cookie-consent banner below.",
      advertisingHeading: 'Advertising (Google AdSense)',
      advertisingBody1:
        'This site shows ads served by Google AdSense. Google and its partners may use cookies and similar technologies to serve ads based on your prior visits to this or other websites. You can opt out of personalized advertising by visiting',
      adSettingsLink: "Google's Ad Settings",
      advertisingBody2:
        ', or by declining the cookie banner shown on this site — declining prevents ad scripts from loading at all for the rest of your visit.',
      cookiesHeading: 'Cookies and Local Storage',
      cookiesBody:
        "Beyond the AdSense scripts described above, this site itself sets no tracking cookies. Your consent choice, once made, is remembered in your browser's local storage so the banner doesn't reappear on every page — clearing your browser data resets it.",
      thirdPartiesHeading: 'Third Parties',
      thirdPartiesBody1: 'This site is hosted on GitHub Pages. Ads are served by Google AdSense, subject to',
      googlePolicyLink: "Google's own advertising policy",
      thirdPartiesBody2: '. No other third-party analytics or tracking services are used.',
      contactHeading: 'Contact',
      contactBody: 'Questions about this policy can be raised via',
    },
  },
  ko: {
    nav: {
      mainAriaLabel: '메인 내비게이션',
      postAriaLabel: '포스트 내비게이션',
      work: '프로젝트',
      about: '소개',
      github: 'GitHub',
      switchTheme: '테마 전환',
      light: '라이트',
      dark: '다크',
      backHome: '← 홈으로',
      postFooterBackHome: '← 홈으로 돌아가기',
    },
    home: {
      seoTitle: 'younghoon — 백엔드 엔지니어',
      seoDescription:
        '명확하게 복잡한 시스템을 설계하는 백엔드 엔지니어의 기록. TypeScript, Go, 그리고 Backend Service Playbook.',
      eyebrow: '백엔드 엔지니어',
      headlineLine1: '복잡한 시스템을',
      headlineEm: '명확하게 설계합니다.',
      intro:
        '주로 TypeScript와 Go로, 컨테이너 환경에서 안정적으로 동작하는 백엔드 시스템을 만듭니다. 도메인 주도 설계와 이벤트 기반 아키텍처에 특히 관심이 많습니다.',
      ctaViewProjects: '프로젝트 보기',
      ctaVisitGithub: 'GitHub 방문',
      systemOverview: 'system / overview',
      online: '온라인',
      systemNote: '요청부터 신뢰할 수 있는 전달까지',
      expertiseKicker: '다루는 기술',
      expertiseHeadingLine1: '분산 시스템을 위한',
      expertiseHeadingLine2: '실용적인 빌딩 블록.',
      expertiseSubheading:
        '기술을 문제 해결을 위한 도구로 보고, 운영과 확장성을 고려해 선택합니다.',
      expertiseList: [
        'TypeScript · Node.js',
        'Go',
        'Docker · Kubernetes',
        'AWS · GCP',
        'CQRS · DDD',
        '이벤트 기반 아키텍처',
      ],
      workKicker: '오픈소스 프로젝트',
      workHeading: '직접 관리하는 오픈소스 프로젝트들.',
      viewOnGithub: 'GitHub에서 보기',
      openRepository: '저장소 열기',
      projects: [
        {
          name: 'Backend Service Playbook',
          repoUrl: 'https://github.com/kyhsa93/backend-service-playbook',
          label: '백엔드 서비스를 위한 실전 가이드',
          description:
            'DDD 기반 백엔드 서비스의 설계 및 구현 원칙을 한곳에 정리했습니다. 특정 프레임워크에 종속되지 않고 일관된 구조로 서비스를 만들 수 있도록 돕습니다.',
          principlesLabel: '포함된 원칙',
          principles: [
            '도메인 주도 설계',
            '계층형 아키텍처',
            'CQRS & Repository',
            '컨벤션 & 체크리스트',
          ],
          detailsLabel: '구현 가이드',
          detailItems: [
            { label: 'TypeScript', value: 'NestJS' },
            { label: 'Go', value: 'Go' },
            { label: 'Java', value: 'Spring Boot' },
            { label: 'Kotlin', value: 'Spring Boot' },
            { label: 'Python', value: 'FastAPI' },
          ],
        },
        {
          name: 'k8s-playbook',
          repoUrl: 'https://github.com/kyhsa93/k8s-playbook',
          label: 'Kubernetes 배포를 위한 안티패턴 카탈로그',
          description:
            '반복되는 Kubernetes 배포 안티패턴을 정리하고, 각각을 자동 탐지 하네스와 짝지었습니다 — 실제 Kustomize/Helm 렌더 결과와 실제 Argo CD/Flux/Kargo 컨트롤러를 상대로 검증했고, AI 에이전트가 이 카탈로그의 컨벤션을 스스로 따라 매니페스트를 작성할 수 있는지 측정하는 벤치마크로도 재사용됩니다.',
          principlesLabel: '포함된 원칙',
          principles: [
            '안티패턴 카탈로그',
            '자동 탐지 하네스',
            '라이브 컨트롤러 검증',
            'AI 작성 벤치마크',
          ],
          detailsLabel: '하네스 커버리지',
          detailItems: [
            { label: 'Workload', value: 'items 1–6' },
            { label: 'GitOps state', value: 'items 11–13' },
            { label: 'Config & secrets', value: 'items 7–10' },
            { label: 'Tenancy', value: 'items 14–15' },
            { label: 'Networking', value: 'items 16–19' },
          ],
        },
      ],
      latestKicker: '최신 글',
      latestHeading: '글쓰기와 실험.',
      latestSubheading: '설계 작업과 작은 실험들에서 배운 교훈을 기록합니다.',
      writingLabel: '글쓰기',
      latestPostsLabel: '최신 포스트',
      viewAllPosts: '모든 포스트 보기 →',
      labLabel: 'Lab',
      sideProjectsLabel: '사이드 프로젝트',
      sideProjects: [
        {
          title: 'Fove',
          description: '한국식 사주와 MBTI를 기반으로 한 운세 웹 앱입니다.',
        },
        {
          title: 'Event Flow Visualizer',
          description: '이벤트 기반 시스템의 흐름을 더 쉽게 이해하기 위한 시각화 실험입니다.',
        },
        {
          title: 'Service Architecture Notes',
          description: '서비스를 설계하며 배운 패턴과 결정들을 모아둔 개인 지식 베이스입니다.',
        },
      ],
      statusLive: 'Live',
      statusInProgress: '진행 중',
    },
    footer: {
      tagline: '견고한 무언가를 함께 만들어봐요.',
      rss: 'RSS',
      privacy: '개인정보처리방침',
    },
    archive: {
      seoTitle: '전체 포스트',
      seoDescription: (count) =>
        `모든 글을 한곳에 — DDD, CQRS, 백엔드 아키텍처에 관한 글 ${count}편.`,
      kicker: '글쓰기',
      heading: '전체 포스트',
      writingLabel: '글쓰기',
      postsCount: (count) => `${count}개의 포스트`,
    },
    notFound: {
      seoTitle: '페이지를 찾을 수 없습니다',
      seoDescription: '찾으시는 페이지가 존재하지 않거나 이동되었습니다.',
      kicker: '404',
      heading: '존재하지 않는 페이지입니다.',
      body: '링크가 잘못되었거나 페이지가 이동되었을 수 있습니다. 홈으로 가시거나',
      allPostsLink: '전체 포스트',
      bodySuffix: '를 확인해보세요',
      backHome: '홈으로 돌아가기',
    },
    privacyPolicy: {
      seoTitle: '개인정보처리방침',
      seoDescription: '이 사이트가 쿠키와 제3자 광고(Google AdSense)를 사용하는 방식에 대한 안내입니다.',
      kicker: 'Legal',
      heading: '개인정보처리방침',
      intro:
        '이 사이트는 개인 블로그입니다. 계정이 필요하지 않으며, 어떤 폼을 통해서도 개인정보를 수집하지 않습니다. 브라우저의 로컬 스토리지에는 라이트/다크 테마 선택과 아래 쿠키 동의 배너에 대한 응답, 이 두 가지 작은 값만 저장됩니다.',
      advertisingHeading: '광고 (Google AdSense)',
      advertisingBody1:
        '이 사이트는 Google AdSense를 통해 광고를 표시합니다. Google과 파트너사는 이 사이트나 다른 사이트를 방문한 기록을 바탕으로 쿠키 및 유사 기술을 사용해 광고를 제공할 수 있습니다. 다음 페이지를 방문해 맞춤 광고를 거부할 수 있습니다:',
      adSettingsLink: 'Google 광고 설정',
      advertisingBody2:
      '. 또는 이 사이트의 쿠키 배너에서 거부를 선택할 수 있으며, 이 경우 남은 방문 시간 동안 광고 스크립트 자체가 로드되지 않습니다.',
      cookiesHeading: '쿠키 및 로컬 스토리지',
      cookiesBody:
        '위에서 설명한 AdSense 스크립트 외에, 이 사이트 자체는 추적 쿠키를 설정하지 않습니다. 한 번 선택한 동의 여부는 브라우저의 로컬 스토리지에 저장되어 매 페이지마다 배너가 다시 표시되지 않으며, 브라우저 데이터를 삭제하면 초기화됩니다.',
      thirdPartiesHeading: '제3자',
      thirdPartiesBody1: '이 사이트는 GitHub Pages에서 호스팅됩니다. 광고는 Google AdSense가 제공하며, 다음 정책을 따릅니다:',
      googlePolicyLink: 'Google 광고 정책',
      thirdPartiesBody2: '. 그 외 다른 제3자 분석이나 추적 서비스는 사용하지 않습니다.',
      contactHeading: '문의',
      contactBody: '이 방침에 대한 문의는 다음을 통해 남길 수 있습니다:',
    },
  },
};
