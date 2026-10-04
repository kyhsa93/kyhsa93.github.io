import type { Locale } from './locale';

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
    findingKicker: string;
    findingLooked: string;
    findingWas: string;
    findingRead: string;
    expertiseKicker: string;
    expertiseHeadingLine1: string;
    expertiseHeadingLine2: string;
    expertiseSubheading: string;
    expertiseList: string[];
    latestKicker: string;
    latestHeading: string;
    latestSubheading: string;
    writingLabel: string;
    latestPostsLabel: string;
    viewAllPosts: string;
    labLabel: string;
    sideProjectsLabel: string;
    viewAllSideProjects: string;
    statusLive: string;
    statusInProgress: string;
  };
  footer: {
    tagline: string;
    rss: string;
    privacy: string;
  };
  consent: {
    ariaLabel: string;
    bodyBefore: string;
    privacyLink: string;
    bodyAfter: string;
    decline: string;
    accept: string;
  };
  archive: {
    seoTitle: string;
    seoDescription: (count: number) => string;
    kicker: string;
    heading: string;
    writingLabel: string;
    postsCount: (count: number) => string;
  };
  sideProjectsArchive: {
    seoTitle: string;
    seoDescription: (count: number) => string;
    kicker: string;
    heading: string;
    label: string;
    projectsCount: (count: number) => string;
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
      headlineLine1: 'What the doc said.',
      headlineEm: 'What the code did.',
      intro:
        'I write about the moments when two things that should have matched did not — a doc and the code under it, a green test run and a broken feature, one architecture and five languages that each read it differently. Backend work, mostly in TypeScript, Go, Java, Kotlin, and Python.',
      ctaViewProjects: 'Read the latest',
      ctaVisitGithub: 'Visit GitHub',
      findingKicker: 'A recent finding',
      findingLooked: 'looked like',
      findingWas: 'was',
      findingRead: 'Read it',
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
      latestKicker: 'Latest',
      latestHeading: 'Writing and experimenting.',
      latestSubheading:
        'A running record of lessons learned from design work and small experiments.',
      writingLabel: 'Writing',
      latestPostsLabel: 'Latest posts',
      viewAllPosts: 'View all posts →',
      labLabel: 'Lab',
      sideProjectsLabel: 'Side projects',
      viewAllSideProjects: 'View all side projects →',
      statusLive: 'Live',
      statusInProgress: 'In progress',
    },
    footer: {
      tagline: 'Let’s build something resilient.',
      rss: 'RSS',
      privacy: 'Privacy',
    },
    consent: {
      ariaLabel: 'Cookie and ad consent',
      bodyBefore: 'This blog uses cookies for visit measurement (Google Analytics) and ads (Google AdSense). Declining hides the ad slots only; the measurement and ad scripts still load. See the ',
      privacyLink: 'privacy policy',
      bodyAfter: '.',
      decline: 'Decline',
      accept: 'Accept',
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
    sideProjectsArchive: {
      seoTitle: 'All side projects',
      seoDescription: (count) =>
        `Every side project, in one place — ${count} experiments outside the day job.`,
      kicker: 'Lab',
      heading: 'All side projects',
      label: 'Side projects',
      projectsCount: (count) => `${count} projects`,
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
      seoDescription: 'How this site uses cookies, analytics (Google Analytics 4) and third-party advertising (Google AdSense).',
      kicker: 'Legal',
      heading: 'Privacy Policy',
      intro:
        "This is a personal blog. It doesn't require an account and doesn't collect personal information through any form. It does use Google Analytics 4 to measure visits and Google AdSense to show ads, as described below. In your browser's local storage it keeps only two small preferences: your light/dark theme choice and your response to the cookie-consent banner below.",
      advertisingHeading: 'Advertising (Google AdSense)',
      advertisingBody1:
        'This site shows ads served by Google AdSense. The AdSense script is loaded on the blog pages regardless of the banner, and Google and its partners may use cookies and similar technologies to serve ads based on your prior visits to this or other websites. You can opt out of personalized advertising by visiting',
      adSettingsLink: "Google's Ad Settings",
      advertisingBody2:
        '. On the blog pages you can also decline the cookie banner — declining stops ad units from being shown, but the AdSense script itself and Google Analytics still load. The banner applies to the blog pages only. Among the sub-projects on this domain, /jipgye/ and /fove/ load AdSense: /jipgye/ loads it without a banner, and /fove/ has its own consent banner and privacy policy (/fove/privacy-policy). /toddler-milestone-checklist/ and /housing-subsidy-radar/ load Google Analytics only, and /abyss/, /karda/ and /ascii-doom/ load neither.',
      cookiesHeading: 'Cookies and Local Storage',
      cookiesBody:
        "This site uses Google Analytics 4 on the blog pages and on the sub-projects /jipgye/, /fove/, /toddler-milestone-checklist/ and /housing-subsidy-radar/. It records which pages are viewed, how the visit arrived (referrer), the approximate region, device and browser type, and on some sub-project pages events such as searches or clicks. Google Analytics sets its own cookies (such as _ga) to tell repeat visits apart. Beyond Google Analytics and the AdSense scripts described above, this site itself sets no tracking cookies. Your consent choice, once made, is remembered in your browser's local storage so the banner doesn't reappear on every page — clearing your browser data resets it.",
      thirdPartiesHeading: 'Third Parties',
      thirdPartiesBody1: 'This site is hosted on GitHub Pages. Visit statistics are collected by Google Analytics 4. Ads are served by Google AdSense, subject to',
      googlePolicyLink: "Google's own advertising policy",
      thirdPartiesBody2: '. No third-party analytics or tracking services other than Google Analytics 4 and Google AdSense are used.',
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
      headlineLine1: '문서에 적힌 것.',
      headlineEm: '코드가 한 것.',
      intro:
        '일치해야 할 두 가지가 어긋난 순간을 기록합니다 — 문서와 그 아래의 코드, 통과한 테스트와 깨져 있던 기능, 하나의 아키텍처와 그걸 제각기 다르게 읽은 다섯 개 언어. 주로 TypeScript, Go, Java, Kotlin, Python으로 하는 백엔드 작업입니다.',
      ctaViewProjects: '최신 글 읽기',
      ctaVisitGithub: 'GitHub 방문',
      findingKicker: '최근 기록 하나',
      findingLooked: '이렇게 보였다',
      findingWas: '실제로는',
      findingRead: '읽기',
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
      latestKicker: '최신 글',
      latestHeading: '글쓰기와 실험.',
      latestSubheading: '설계 작업과 작은 실험들에서 배운 교훈을 기록합니다.',
      writingLabel: '글쓰기',
      latestPostsLabel: '최신 포스트',
      viewAllPosts: '모든 포스트 보기 →',
      labLabel: 'Lab',
      sideProjectsLabel: '사이드 프로젝트',
      viewAllSideProjects: '모든 사이드 프로젝트 보기 →',
      statusLive: 'Live',
      statusInProgress: '진행 중',
    },
    footer: {
      tagline: '견고한 무언가를 함께 만들어봐요.',
      rss: 'RSS',
      privacy: '개인정보처리방침',
    },
    consent: {
      ariaLabel: '쿠키 및 광고 동의',
      bodyBefore: '이 블로그는 방문 측정(Google Analytics)과 광고(Google AdSense)에 쿠키를 씁니다. 거부하면 광고 칸만 보이지 않고, 측정과 광고 스크립트는 계속 로드됩니다. 자세한 내용은 ',
      privacyLink: '개인정보처리방침',
      bodyAfter: '에 있습니다.',
      decline: '거부',
      accept: '동의',
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
    sideProjectsArchive: {
      seoTitle: '전체 사이드 프로젝트',
      seoDescription: (count) => `모든 사이드 프로젝트를 한곳에 — 본업 밖에서 진행한 실험 ${count}개.`,
      kicker: 'Lab',
      heading: '전체 사이드 프로젝트',
      label: '사이드 프로젝트',
      projectsCount: (count) => `${count}개의 프로젝트`,
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
      seoDescription: '이 사이트가 쿠키, 방문 분석(Google Analytics 4), 제3자 광고(Google AdSense)를 사용하는 방식에 대한 안내입니다.',
      kicker: 'Legal',
      heading: '개인정보처리방침',
      intro:
        '이 사이트는 개인 블로그입니다. 계정이 필요하지 않으며, 어떤 폼을 통해서도 개인정보를 수집하지 않습니다. 다만 아래에 적은 대로 방문 측정에 Google Analytics 4를, 광고 표시에 Google AdSense를 사용합니다. 브라우저의 로컬 스토리지에는 라이트/다크 테마 선택과 아래 쿠키 동의 배너에 대한 응답, 이 두 가지 작은 값만 저장됩니다.',
      advertisingHeading: '광고 (Google AdSense)',
      advertisingBody1:
        '이 사이트는 Google AdSense를 통해 광고를 표시합니다. AdSense 스크립트는 배너 응답과 관계없이 블로그 페이지에서 로드되며, Google과 파트너사는 이 사이트나 다른 사이트를 방문한 기록을 바탕으로 쿠키 및 유사 기술을 사용해 광고를 제공할 수 있습니다. 다음 페이지를 방문해 맞춤 광고를 거부할 수 있습니다:',
      adSettingsLink: 'Google 광고 설정',
      advertisingBody2:
        '. 블로그 페이지에서는 쿠키 배너에서 거부를 선택할 수도 있으며, 이 경우 광고 단위가 표시되지 않습니다. 다만 AdSense 스크립트 자체와 Google Analytics는 거부와 관계없이 로드됩니다. 이 배너는 블로그 페이지에만 적용됩니다. 이 도메인의 하위 프로젝트 중 AdSense를 로드하는 곳은 /jipgye/와 /fove/입니다. /jipgye/는 배너 없이 로드하고, /fove/는 자체 동의 배너와 개인정보처리방침(/fove/privacy-policy)을 따로 둡니다. /toddler-milestone-checklist/와 /housing-subsidy-radar/는 Google Analytics만 로드하고, /abyss/, /karda/, /ascii-doom/은 둘 다 로드하지 않습니다.',
      cookiesHeading: '쿠키 및 로컬 스토리지',
      cookiesBody:
        '이 사이트는 블로그 페이지와 하위 프로젝트 /jipgye/, /fove/, /toddler-milestone-checklist/, /housing-subsidy-radar/에서 Google Analytics 4를 사용합니다. 어떤 페이지를 봤는지, 어디서 들어왔는지(리퍼러), 대략적인 지역, 기기와 브라우저 종류, 일부 하위 프로젝트 페이지에서는 검색·클릭 같은 이벤트가 기록됩니다. Google Analytics는 재방문을 구분하기 위해 자체 쿠키(_ga 등)를 설정합니다. Google Analytics와 위에서 설명한 AdSense 스크립트 외에, 이 사이트 자체는 추적 쿠키를 설정하지 않습니다. 한 번 선택한 동의 여부는 브라우저의 로컬 스토리지에 저장되어 매 페이지마다 배너가 다시 표시되지 않으며, 브라우저 데이터를 삭제하면 초기화됩니다.',
      thirdPartiesHeading: '제3자',
      thirdPartiesBody1: '이 사이트는 GitHub Pages에서 호스팅됩니다. 방문 통계는 Google Analytics 4가 수집합니다. 광고는 Google AdSense가 제공하며, 다음 정책을 따릅니다:',
      googlePolicyLink: 'Google 광고 정책',
      thirdPartiesBody2: '. Google Analytics 4와 Google AdSense 외에 다른 제3자 분석이나 추적 서비스는 사용하지 않습니다.',
      contactHeading: '문의',
      contactBody: '이 방침에 대한 문의는 다음을 통해 남길 수 있습니다:',
    },
  },
};
