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
    slug: 'a-perfect-score-a-broken-feature',
    title: {
      en: 'A Perfect Score, A Broken Feature',
      ko: '완벽한 점수, 작동하지 않는 기능',
    },
    summary: {
      en: 'Same doc, same task, two models, run at the same time in separate worktrees. Both self-reported a perfect harness score. Only one of them, independently reproduced against real Postgres and LocalStack, actually worked.',
      ko: '같은 문서, 같은 과제, 두 개의 모델을 별도 worktree에서 동시에 돌렸다. 둘 다 완벽한 harness 점수를 자체 보고했다. 실제 Postgres와 LocalStack을 대상으로 독립 재현했을 때, 동작한 쪽은 하나뿐이었다.',
    },
    date: '2026.07.28',
    tags: ['AI Agents', 'Benchmark'],
    readMinutes: 9,
  },
  {
    slug: 'not-every-report-needs-a-server',
    title: {
      en: 'Not Every Report Needs a Server',
      ko: '모든 리포트에 서버가 필요한 건 아니다',
    },
    summary: {
      en: 'A monthly statement and a GDPR-style data export both died to the same question: couldn\'t the client just build this itself? The spending-analysis ETL that survived it, and the rule it revealed.',
      ko: '월별 명세서도, GDPR식 데이터 내보내기도 같은 질문 앞에서 무너졌다: 클라이언트가 직접 만들면 되지 않나? 그 질문을 통과한 지출 분석 ETL과, 거기서 드러난 규칙.',
    },
    date: '2026.07.27',
    tags: ['ETL', 'Architecture'],
    readMinutes: 12,
  },
  {
    slug: 'the-fraud-signal-that-trusted-the-fraudster',
    title: {
      en: 'The Fraud Signal That Trusted the Fraudster',
      ko: '사기꾼을 그대로 믿은 사기 탐지 신호',
    },
    summary: {
      en: "RefundReasonClassifier's fraud-risk score was computed entirely from text the refund requester controlled. Removing it, the sibling ML scorer that went with it, and the one rule the removal left behind.",
      ko: 'RefundReasonClassifier의 사기 위험 점수는 환불 요청자가 직접 통제하는 텍스트만으로 계산되었다. 그것과 함께 있던 자매 ML 스코어러를 제거하고, 이번 제거가 남긴 단 하나의 규칙까지.',
    },
    date: '2026.07.26',
    tags: ['Security', 'LLM'],
    readMinutes: 12,
  },
  {
    slug: 'narrow-what-never-who',
    title: {
      en: 'Narrow What, Never Who',
      ko: '무엇은 좁히고, 누구는 정하지 않는다',
    },
    summary: {
      en: 'A structured-data RAG feature over an account\'s own transaction history, the guardrail that lets an LLM touch it safely, and how the same invariant survived five different languages\' own conventions.',
      ko: '계좌 본인의 거래 내역을 다루는 구조화 데이터 RAG 기능과, LLM이 안전하게 관여하도록 만드는 가드레일, 그리고 그 불변식이 다섯 개 언어 각자의 관례 속에서도 살아남은 과정.',
    },
    date: '2026.07.26',
    tags: ['LLM', 'Comparative'],
    readMinutes: 14,
  },
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
  {
    slug: 'when-the-docs-and-the-code-agree-to-be-wrong',
    title: {
      en: 'When the Docs and the Code Agree to Be Wrong',
      ko: '문서와 코드가 사이좋게 함께 틀렸을 때',
    },
    summary: {
      en: 'Three violations across five languages — a Query reading a write Repository, a domain class carrying JPA, a notification module in the wrong layer. Only one was actually a bug, and the other two reveal why dozens of prior audits never caught any of it.',
      ko: '다섯 언어에 걸친 위반 세 가지 — 쓰기용 Repository를 읽는 Query, JPA를 그대로 단 도메인 클래스, 잘못된 레이어의 notification 모듈. 진짜 버그는 하나뿐이었고, 나머지 둘은 그 많은 이전 감사가 왜 이걸 하나도 못 잡았는지를 드러낸다.',
    },
    date: '2026.07.12',
    tags: ['DDD', 'Architecture'],
    readMinutes: 11,
  },
  {
    slug: 'the-harness-had-never-met-a-second-domain',
    title: {
      en: 'The Harness Had Never Met a Second Domain',
      ko: '하네스는 두 번째 도메인을 만나본 적이 없었다',
    },
    summary: {
      en: 'Two harness rules had checked out clean for months — because every domain that ever fed them was Account or Card. Building a genuinely unrelated third domain surfaced two false positives, and confirmed the rule meant to catch a real mistake still did.',
      ko: '하네스 규칙 두 개가 몇 달째 깨끗했던 이유는 지금까지 입력된 도메인이 전부 Account와 Card뿐이었기 때문이다. 완전히 무관한 세 번째 도메인을 만들어보니 오탐 두 건이 드러났고, 진짜 실수를 잡을 규칙은 여전히 그걸 잡는다는 것도 확인됐다.',
    },
    date: '2026.07.17',
    tags: ['Tooling', 'Testing'],
    readMinutes: 9,
  },
  {
    slug: 'a-path-existence-checker-found-a-real-bug-on-day-one',
    title: {
      en: 'A Path-Existence Checker Found a Real Bug on Day One',
      ko: '경로 존재 여부만 확인하는 스크립트가 첫날 실제 버그를 잡았다',
    },
    summary: {
      en: "No parsing, no understanding of what a code snippet does — just comparing backtick-quoted paths against the real file tree. The exclusion rules that kept it from crying wolf mattered more than the two-pattern check itself, and it still caught a real bug in four docs on its first run.",
      ko: '파싱도, 코드 스니펫이 뭘 하는지에 대한 이해도 없다 — 백틱 경로를 실제 파일 트리와 비교할 뿐이다. 오탐을 막아준 예외 규칙들이 두 가지 탐지 패턴 자체보다 중요했고, 그럼에도 첫 실행에서 문서 4곳의 진짜 버그를 잡았다.',
    },
    date: '2026.07.18',
    tags: ['Tooling', 'Documentation'],
    readMinutes: 8,
  },
  {
    slug: 'the-doc-said-done-half-of-it-wasnt',
    title: {
      en: 'The Doc Said "Done." Half of It Wasn\'t.',
      ko: '문서는 "끝났다"고 했다. 절반만 끝나 있었다.',
    },
    summary: {
      en: "A repository-naming fix that only reached the write-side interface, four rounds of turning that gap into permanent harness rules, and a yield curve — three or four real bugs per round, then two, then zero — that was itself the most useful result.",
      ko: '쓰기 쪽 인터페이스에만 반영된 Repository 네이밍 수정, 그 갭을 영구적인 하네스 규칙으로 바꾼 네 라운드, 그리고 라운드당 3~4건이던 진짜 버그가 2건, 결국 0건으로 떨어진 수확 곡선 — 그 하락 자체가 가장 쓸모 있는 결과였다.',
    },
    date: '2026.07.20',
    tags: ['Conventions', 'Tooling'],
    readMinutes: 12,
  },
  {
    slug: 'two-accounts-one-transaction-five-different-answers',
    title: {
      en: 'Two Accounts, One Transaction, Five Different Answers',
      ko: '두 계좌, 하나의 트랜잭션, 다섯 개의 서로 다른 답',
    },
    summary: {
      en: "A transfer feature needs one thing every implementation already claimed to support: writing two Aggregates atomically. Building it for real found a working mechanism in one language, a regression waiting one edit inside the obvious fix in another, and a doc that had been quietly wrong about its own code in a third.",
      ko: '송금 기능에 필요한 건 딱 하나, 모든 구현체가 이미 지원한다고 주장했던 것 — 두 Aggregate의 원자적 쓰기. 실제로 만들어보니 한 언어는 메커니즘이 진짜 동작했고, 한 언어는 당연해 보이는 수정 한 걸음 안쪽에 회귀가 도사리고 있었고, 한 언어는 문서가 자기 코드에 대해 조용히 틀려 있었다.',
    },
    date: '2026.07.21',
    tags: ['Backend', 'Reliability'],
    readMinutes: 12,
  },
  {
    slug: 'the-bug-that-needed-two-subscribers-to-exist',
    title: {
      en: 'The Bug That Needed Two Subscribers to Exist',
      ko: '구독자가 둘이어야만 존재하던 버그',
    },
    summary: {
      en: 'Five languages scoring 100% on an easy synthetic task taught nothing about where they would fail. A four-level difficulty ladder built specifically to exercise unexercised code paths found the ceiling — and its last rung exposed a fan-out bug that had been invisible since nothing had ever subscribed two things to the same event before.',
      ko: '쉬운 합성 과제에서 5개 언어가 전부 100점을 받는다고 해서 어디서 실패할지가 드러나는 건 아니다. 아직 건드려본 적 없는 코드 경로를 정확히 겨냥해 만든 4단계 난이도 사다리가 그 천장을 찾아냈고, 마지막 단에서 같은 이벤트에 둘이 구독해본 적이 한 번도 없어서 보이지 않던 팬아웃 버그가 드러났다.',
    },
    date: '2026.07.21',
    tags: ['AI Agents', 'Benchmark'],
    readMinutes: 13,
  },
];

export const postsByDate: PostMeta[] = [...posts].sort((a, b) =>
  a.date === b.date ? 0 : a.date < b.date ? 1 : -1,
);
