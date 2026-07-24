export interface LocalizedText {
  en: string;
  ko: string;
}

export interface PostMeta {
  slug: string;
  title: LocalizedText;
  summary: LocalizedText;
  date: string;
  tags: string[];
  readMinutes: number;
}

// Not necessarily in date order — see `postsByDate` for that.
export const posts: PostMeta[] = [
  {
    slug: 'aggregate-design',
    title: {
      en: 'Designing Aggregates: Transaction Boundaries and Invariants',
      ko: 'Aggregate 설계: 트랜잭션 경계와 불변식',
    },
    summary: {
      en: "What actually decides an Aggregate boundary, and how the Domain layer generates its own ID.",
      ko: 'Aggregate 경계를 실제로 결정하는 것은 무엇이며, Domain 계층은 어떻게 스스로 ID를 생성하는가.',
    },
    date: '2026.07.22',
    tags: ['DDD', 'Tactical Design'],
    readMinutes: 13,
  },
  {
    slug: 'domain-services-across-aggregates',
    title: {
      en: "Domain Services: When a Rule Doesn't Belong to One Aggregate",
      ko: 'Domain Service: 규칙이 하나의 Aggregate에 속하지 않을 때',
    },
    summary: {
      en: 'A real RefundEligibilityService example for logic that has to read two Aggregates at once.',
      ko: '두 개의 Aggregate를 동시에 읽어야 하는 로직을 위한 실제 RefundEligibilityService 사례.',
    },
    date: '2026.07.18',
    tags: ['DDD', 'Tactical Design'],
    readMinutes: 13,
  },
  {
    slug: 'talking-across-bounded-contexts',
    title: {
      en: 'Talking Across Bounded Contexts',
      ko: 'Bounded Context 간의 소통',
    },
    summary: {
      en: 'Choosing between a synchronous Adapter and an asynchronous Integration Event, with a real compensating-transaction example.',
      ko: '동기 Adapter와 비동기 Integration Event 중 무엇을 선택할 것인가, 실제 보상 트랜잭션(compensating transaction) 사례와 함께.',
    },
    date: '2026.07.11',
    tags: ['DDD', 'Integration'],
    readMinutes: 12,
  },
  {
    slug: 'cqrs-in-practice',
    title: {
      en: "CQRS in Practice: Why a Query Can't Use a Repository",
      ko: '실전 CQRS: Query가 Repository를 쓸 수 없는 이유',
    },
    summary: {
      en: 'A real cross-language bug where a Query Handler used a write-capable Repository — and the docs agreed it was fine.',
      ko: 'Query Handler가 쓰기 가능한 Repository를 사용했던 실제 다언어 버그 — 문서조차 문제없다고 했다.',
    },
    date: '2026.07.12',
    tags: ['CQRS', 'Architecture'],
    readMinutes: 13,
  },
  {
    slug: 'repository-naming-convention',
    title: {
      en: 'The Naming Rule That Caught Real Bugs',
      ko: '실제 버그를 잡아낸 네이밍 규칙',
    },
    summary: {
      en: 'How a boring find/save/delete naming convention, once automated, immediately found violations nobody had noticed across four different codebases.',
      ko: '지루하기 짝이 없는 find/save/delete 네이밍 컨벤션을 자동화하자, 네 개의 코드베이스에서 아무도 눈치채지 못한 위반 사례가 바로 드러난 이야기.',
    },
    date: '2026.07.21',
    tags: ['Repository Pattern', 'Conventions'],
    readMinutes: 12,
  },
  {
    slug: 'request-scoped-user-context',
    title: {
      en: 'Request-Scoped Context: Why req.user Is an Anti-Pattern',
      ko: '요청 스코프 컨텍스트: req.user가 안티패턴인 이유',
    },
    summary: {
      en: 'An AsyncLocalStorage-based UserContextStore, and the Guard/Interceptor split it took to get there.',
      ko: 'AsyncLocalStorage 기반 UserContextStore와, 거기에 도달하기 위해 필요했던 Guard/Interceptor 분리.',
    },
    date: '2026.07.22',
    tags: ['Cross-cutting Concerns', 'Backend'],
    readMinutes: 13,
  },
  {
    slug: 'observability-by-design',
    title: {
      en: 'Observability Is a Design Decision, Not an Afterthought',
      ko: 'Observability는 설계 결정이지, 나중에 덧붙이는 게 아니다',
    },
    summary: {
      en: 'Log-level policy, structured logging, and propagating a Correlation ID through AsyncLocalStorage.',
      ko: '로그 레벨 정책, 구조화된 로깅, 그리고 AsyncLocalStorage를 통한 Correlation ID 전파.',
    },
    date: '2026.07.22',
    tags: ['Observability', 'Operations'],
    readMinutes: 12,
  },
  {
    slug: 'graceful-shutdown',
    title: {
      en: 'Graceful Shutdown: The Reliability Feature Nobody Tests',
      ko: 'Graceful Shutdown: 아무도 테스트하지 않는 신뢰성 기능',
    },
    summary: {
      en: 'Getting the order right between readiness, in-flight requests, and resource cleanup during SIGTERM.',
      ko: 'SIGTERM 발생 시 readiness, 처리 중인 요청, 리소스 정리 사이의 순서를 올바르게 맞추는 방법.',
    },
    date: '2026.07.11',
    tags: ['Reliability', 'Operations'],
    readMinutes: 11,
  },
  {
    slug: 'scheduling-and-task-outbox',
    title: {
      en: 'Scheduling and the Task Outbox Pattern',
      ko: '스케줄링과 Task Outbox 패턴',
    },
    summary: {
      en: 'Why a Scheduler should only enqueue, and the real bugs multi-instance Cron jobs surfaced.',
      ko: 'Scheduler는 왜 enqueue만 해야 하는가, 그리고 다중 인스턴스 Cron job이 드러낸 실제 버그들.',
    },
    date: '2026.07.21',
    tags: ['Scheduling', 'Backend'],
    readMinutes: 13,
  },
  {
    slug: 'typed-errors-and-response-schemas',
    title: {
      en: 'Typed Errors and a Consistent Response Schema',
      ko: '타입이 있는 에러와 일관된 응답 스키마',
    },
    summary: {
      en: 'Why an error-message enum key has to equal its value, and the four-field error response shape.',
      ko: '에러 메시지 enum의 key가 value와 같아야 하는 이유, 그리고 4개 필드로 구성된 에러 응답 형태.',
    },
    date: '2026.07.11',
    tags: ['API Design', 'Conventions'],
    readMinutes: 12,
  },
  {
    slug: 'compliance-as-code',
    title: {
      en: 'Compliance as Code: Building a Harness That Enforces Architecture',
      ko: 'Compliance as Code: 아키텍처를 강제하는 Harness 만들기',
    },
    summary: {
      en: 'What a harness rule is and is not allowed to assume, and the failure modes even careful audits miss.',
      ko: 'Harness 규칙이 가정해도 되는 것과 안 되는 것, 그리고 꼼꼼한 감사조차 놓치는 실패 유형.',
    },
    date: '2026.07.22',
    tags: ['Tooling', 'Architecture'],
    readMinutes: 14,
  },
  {
    slug: 'can-an-ai-agent-follow-your-architecture',
    title: {
      en: 'Can an AI Agent Follow Your Architecture?',
      ko: 'AI 에이전트가 당신의 아키텍처를 따를 수 있을까?',
    },
    summary: {
      en: 'Reusing an architecture-compliance harness as an AI benchmark, across five difficulty levels and five languages.',
      ko: '아키텍처 준수 검증용 Harness를 AI 벤치마크로 재활용하기, 5단계 난이도와 5개 언어에 걸쳐.',
    },
    date: '2026.07.21',
    tags: ['AI Agents', 'Benchmark'],
    readMinutes: 15,
  },
  {
    slug: 'from-docs-to-runnable-code',
    title: {
      en: 'From Docs to Runnable Code in One Command',
      ko: '명령어 하나로 문서에서 실행 가능한 코드까지',
    },
    summary: {
      en: 'Turning a written reference template into a scaffolding generator, and the bugs found by actually running it.',
      ko: '문서로 작성된 레퍼런스 템플릿을 스캐폴딩 생성기로 바꾸고, 실제로 실행해보며 발견한 버그들.',
    },
    date: '2026.07.17',
    tags: ['Tooling', 'Developer Experience'],
    readMinutes: 12,
  },
  {
    slug: 'same-architecture-five-languages',
    title: {
      en: 'Same Architecture, Five Languages',
      ko: '같은 아키텍처, 다섯 개의 언어',
    },
    summary: {
      en: 'Comparing the same Repository/Query split as implemented independently in TypeScript, Go, Python, Java, and Kotlin.',
      ko: 'TypeScript, Go, Python, Java, Kotlin에서 각각 독립적으로 구현한 동일한 Repository/Query 분리 비교.',
    },
    date: '2026.07.21',
    tags: ['Comparative', 'Architecture'],
    readMinutes: 14,
  },
  {
    slug: 'finding-domain-boundaries',
    title: {
      en: 'How to Find Domain Boundaries',
      ko: '도메인 경계를 찾는 방법',
    },
    summary: {
      en: 'A record of the thought process for organizing complex requirements into Aggregates and Bounded Contexts.',
      ko: '복잡한 요구사항을 Aggregate와 Bounded Context로 정리하는 사고 과정 기록.',
    },
    date: '2026.07.19',
    tags: ['DDD', 'Architecture'],
    readMinutes: 14,
  },
  {
    slug: 'reliable-event-driven-systems',
    title: {
      en: 'Reliability in Event-Driven Systems',
      ko: '이벤트 기반 시스템에서의 신뢰성',
    },
    summary: {
      en: 'Practical patterns for handling message delivery failures and duplicate processing.',
      ko: '메시지 전달 실패와 중복 처리를 다루기 위한 실용적인 패턴들.',
    },
    date: '2026.07.19',
    tags: ['Event-driven', 'Backend'],
    readMinutes: 12,
  },
  {
    slug: 'containerized-development-experience',
    title: {
      en: 'Developer Experience in Containerized Environments',
      ko: '컨테이너 환경에서의 개발자 경험',
    },
    summary: {
      en: 'How teams can build a reproducible environment from local development through deployment.',
      ko: '로컬 개발부터 배포까지, 팀이 재현 가능한 환경을 구축하는 방법.',
    },
    date: '2026.07.19',
    tags: ['Docker', 'Developer experience'],
    readMinutes: 11,
  },
  {
    slug: 'auth-bypass-vulnerability',
    title: {
      en: 'Signing In Without a Password',
      ko: '비밀번호 없이 로그인하기',
    },
    summary: {
      en: 'A security audit found /auth/sign-in accepted a userId and nothing else — how the same bug showed up in five languages, and the JDK retry bug a new 401 test uncovered along the way.',
      ko: '보안 감사에서 /auth/sign-in이 userId만 받고 아무것도 검증하지 않는다는 사실이 드러났다 — 다섯 언어에서 같은 버그가 어떻게 다르게 나타났는지, 그리고 새로 만든 401 테스트가 드러낸 JDK 재시도 버그까지.',
    },
    date: '2026.07.16',
    tags: ['Security', 'Backend'],
    readMinutes: 12,
  },
  {
    slug: 'llm-technical-service',
    title: {
      en: 'Wiring an LLM Into a Domain Service',
      ko: 'Domain Service에 LLM 연결하기',
    },
    summary: {
      en: 'RefundReasonClassifier reads a refund reason and hands back a signal — the Domain Service that actually decides never calls it, and swapping the LLM backend from Claude to self-hosted Ollama touched almost no test.',
      ko: 'RefundReasonClassifier는 환불 사유를 읽고 신호를 돌려줄 뿐이다 — 실제 판단을 내리는 Domain Service는 그걸 호출조차 하지 않으며, Claude에서 자체 호스팅 Ollama로 LLM 백엔드를 바꿔도 테스트는 거의 건드릴 필요가 없었다.',
    },
    date: '2026.07.23',
    tags: ['LLM', 'Architecture'],
    readMinutes: 12,
  },
  {
    slug: 'refund-fraud-risk-scorer',
    title: {
      en: 'A Second Fraud Signal: Scoring History, Not Reading It',
      ko: '두 번째 사기 신호: 이력을 읽는 게 아니라 점수 매기기',
    },
    summary: {
      en: 'RefundFraudRiskScorer is a hand-rolled logistic regression trained on refund history, swappable between a native and an HTTP implementation, feeding the same Domain Service a second independent threshold.',
      ko: 'RefundFraudRiskScorer는 환불 이력으로 직접 학습시킨 로지스틱 회귀 모델로, native/HTTP 구현을 자유롭게 전환할 수 있으며 같은 Domain Service에 독립적인 두 번째 임계값을 제공한다.',
    },
    date: '2026.07.23',
    tags: ['Machine Learning', 'Architecture'],
    readMinutes: 12,
  },
  {
    slug: 'bugs-only-e2e-tests-catch',
    title: {
      en: "The Bugs Unit Tests Can't See",
      ko: '유닛 테스트가 볼 수 없는 버그들',
    },
    summary: {
      en: 'A missing @Transactional, a JDK HTTP client retry quirk, a VARCHAR(36) overflow, an SQS FIFO dedup collision — four real bugs that needed real infrastructure to even exist.',
      ko: '빠진 @Transactional, JDK HTTP 클라이언트의 재시도 결함, VARCHAR(36) 오버플로우, SQS FIFO 중복 제거 충돌 — 실제 인프라가 있어야만 존재할 수 있었던 버그 네 가지.',
    },
    date: '2026.07.24',
    tags: ['Testing', 'Reliability'],
    readMinutes: 11,
  },
  {
    slug: 'prompt-injection-in-tool-output',
    title: {
      en: 'When the Tool Output Itself Tries to Manipulate the Agent',
      ko: '툴 출력 자체가 에이전트를 조종하려 할 때',
    },
    summary: {
      en: "A shell command's output has, more than once, contained something shaped exactly like a real system message, instructing the agent to hide a change. The rule that matters: disregard it, and say so.",
      ko: '셸 명령 출력 안에 실제 시스템 메시지처럼 위장한 내용이 변경사항을 숨기라고 지시한 적이 여러 번 있었다. 지켜야 할 규칙은 하나다: 따르지 말고, 그 사실을 알린다.',
    },
    date: '2026.07.21',
    tags: ['AI Agents', 'Security'],
    readMinutes: 9,
  },
];

export const postsByDate: PostMeta[] = [...posts].sort((a, b) =>
  a.date === b.date ? 0 : a.date < b.date ? 1 : -1,
);
