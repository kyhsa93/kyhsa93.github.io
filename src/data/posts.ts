export interface LocalizedText {
  en: string;
  ko: string;
}

export interface ProjectLink {
  name: string;
  url: string;
}

/**
 * A post's finding, compressed to the two halves that disagreed.
 *
 * `looked` is what the situation reported about itself; `was` is what it turned
 * out to be. Only posts whose finding genuinely reduces to such a pair carry
 * this — the home page features the most recent one that does, so leaving it
 * off a post simply keeps the previous feature in place.
 */
export interface Discrepancy {
  looked: LocalizedText;
  was: LocalizedText;
}

export interface PostMeta {
  slug: string;
  title: LocalizedText;
  summary: LocalizedText;
  date: string;
  tags: string[];
  readMinutes: number;
  project?: ProjectLink;
  discrepancy?: Discrepancy;
}

export const posts: PostMeta[] = [
  {
    slug: 'half-the-site-was-a-copy-of-itself',
    title: {
      en: 'Half the Site Was a Copy of Itself',
      ko: '사이트의 절반은 사이트 자신의 복사본이었다',
    },
    summary: {
      en: 'Every page passed a word-count check and had a distinct title, URL, and numbers. Slightly under half of all text on the site still existed on more than one page. The fifteen-line measurement that found it, and three structurally different ways a page duplicates its neighbour without anyone deciding it should.',
      ko: '모든 페이지가 분량 검사를 통과했고 제목도 URL도 숫자도 달랐다. 그런데도 사이트 전체 텍스트의 절반에 조금 못 미치는 양이 두 장 이상의 페이지에 똑같이 들어 있었다. 이걸 찾아낸 15줄짜리 측정 방법과, 아무도 정한 적 없는데 페이지가 옆 페이지를 베끼게 되는 세 가지 경우를 정리했다.',
    },
    date: '2026.09.01',
    tags: ['Content', 'Auditing'],
    readMinutes: 8,
    discrepancy: {
      looked: {
        en: 'Eighty pages, each with its own title, URL and heading.',
        ko: '페이지 80장은 제목도 URL도 머리글도 저마다 달랐다.',
      },
      was: {
        en: 'Five distinct bodies, because every section keyed on the same five-value field.',
        ko: '본문은 5가지뿐이었다. 모든 절이 값이 5가지뿐인 같은 필드를 키로 쓰고 있었다.',
      },
    },
  },
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
      ko: '월별 명세서도 GDPR식 데이터 내보내기도 "클라이언트가 직접 만들면 되지 않나?"라는 같은 질문에 무너졌다. 그 질문을 통과한 지출 분석 ETL과, 거기서 드러난 규칙을 적었다.',
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
      ko: 'RefundReasonClassifier의 사기 위험 점수는 환불을 요청한 사람이 마음대로 적을 수 있는 글만 보고 계산했다. 이 신호와 짝을 이루던 ML 스코어러까지 함께 걷어 낸 과정과, 걷어 내고 남은 규칙 하나를 적었다.',
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
      ko: '계좌 주인이 자기 거래 내역을 말로 물어보는 구조화 데이터 RAG 기능을 만들었다. LLM이 끼어도 안전하도록 가드레일을 어디에 뒀는지, 그 불변식이 5개 언어의 서로 다른 관례 속에서 어떻게 그대로 남았는지 정리했다.',
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
      en: "What decides an Aggregate boundary, and how the Domain layer generates its own ID.",
      ko: '무엇이 Aggregate 경계를 정하는지, Domain 계층이 ID를 어떻게 스스로 만드는지 정리했다.',
    },
    date: '2026.07.22',
    tags: ['DDD', 'Tactical Design'],
    readMinutes: 13,
  },
  {
    slug: 'domain-services-across-aggregates',
    title: {
      en: "Domain Services: When a Rule Doesn't Belong to One Aggregate",
      ko: 'Domain Service: 규칙이 한 Aggregate에 속하지 않을 때',
    },
    summary: {
      en: 'A real RefundEligibilityService example for logic that has to read two Aggregates at once.',
      ko: 'Aggregate 두 개를 한꺼번에 읽어야 하는 로직을, 실제로 쓰는 RefundEligibilityService 코드로 풀었다.',
    },
    date: '2026.07.18',
    tags: ['DDD', 'Tactical Design'],
    readMinutes: 13,
  },
  {
    slug: 'talking-across-bounded-contexts',
    title: {
      en: 'Talking Across Bounded Contexts',
      ko: 'Bounded Context 사이의 소통',
    },
    summary: {
      en: 'Choosing between a synchronous Adapter and an asynchronous Integration Event, with a real compensating-transaction example.',
      ko: '동기 Adapter와 비동기 Integration Event 중 어느 쪽을 고를지, 실제 보상 트랜잭션(compensating transaction) 예제와 함께 따져 본다.',
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
      en: 'A real cross-language bug where a Query Handler used a write-capable Repository, and the docs agreed it was fine.',
      ko: 'Query Handler가 쓰기까지 되는 Repository를 쓰고 있었다. 여러 언어에서 같은 버그가 나왔는데, 문서마저 괜찮다고 적혀 있었다.',
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
      ko: '지루하기 짝이 없는 find/save/delete 네이밍 컨벤션을 검사로 자동화했더니, 코드베이스 4곳에서 아무도 몰랐던 위반이 곧바로 나왔다.',
    },
    date: '2026.07.21',
    tags: ['Repository Pattern', 'Conventions'],
    readMinutes: 12,
  },
  {
    slug: 'request-scoped-user-context',
    title: {
      en: 'Request-Scoped Context: Why req.user Is an Anti-Pattern',
      ko: '요청 스코프 컨텍스트, req.user가 안티패턴인 이유',
    },
    summary: {
      en: 'An AsyncLocalStorage-based UserContextStore, and the Guard/Interceptor split it took to get there.',
      ko: 'AsyncLocalStorage로 만든 UserContextStore, 그리고 거기까지 가려고 Guard와 Interceptor를 나눈 이야기.',
    },
    date: '2026.07.22',
    tags: ['Cross-cutting Concerns', 'Backend'],
    readMinutes: 13,
  },
  {
    slug: 'observability-by-design',
    title: {
      en: 'Observability Is a Design Decision, Not an Afterthought',
      ko: 'Observability는 나중에 덧붙이는 게 아니라 설계 결정이다',
    },
    summary: {
      en: 'Log-level policy, structured logging, and propagating a Correlation ID through AsyncLocalStorage.',
      ko: '로그 레벨 정책과 구조화된 로깅, AsyncLocalStorage로 Correlation ID를 전파하는 방법.',
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
      ko: 'SIGTERM을 받았을 때 readiness 전환, 처리 중인 요청, 리소스 정리를 어떤 순서로 해야 하는지 정리했다.',
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
      ko: 'Scheduler는 왜 enqueue만 해야 하는지, 인스턴스가 여럿일 때 Cron job에서 어떤 버그가 나왔는지 정리했다.',
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
      ko: '에러 메시지 enum의 key와 value를 같게 둬야 하는 이유와, 필드 4개로 된 에러 응답 모양을 정리했다.',
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
      ko: '문서에서 명령 한 번으로 돌아가는 코드까지',
    },
    summary: {
      en: 'Turning a written reference template into a scaffolding generator, and the bugs found by actually running it.',
      ko: '글로 된 참조 템플릿을 스캐폴딩 생성기로 바꿨다. 그리고 직접 돌려 보면서 버그를 찾았다.',
    },
    date: '2026.07.17',
    tags: ['Tooling', 'Developer Experience'],
    readMinutes: 12,
  },
  {
    slug: 'same-architecture-five-languages',
    title: {
      en: 'Same Architecture, Five Languages',
      ko: '같은 아키텍처를 5개 언어로',
    },
    summary: {
      en: 'Comparing the same Repository/Query split as implemented independently in TypeScript, Go, Python, Java, and Kotlin.',
      ko: '같은 Repository/Query 분리를 TypeScript, Go, Python, Java, Kotlin에서 따로 구현해 보고 나란히 비교했다.',
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
      ko: '복잡한 요구사항을 Aggregate와 Bounded Context로 나눠 가며 무엇을 생각했는지 적었다.',
    },
    date: '2026.07.19',
    tags: ['DDD', 'Architecture'],
    readMinutes: 14,
  },
  {
    slug: 'reliable-event-driven-systems',
    title: {
      en: 'Reliability in Event-Driven Systems',
      ko: '이벤트 기반 시스템의 신뢰성',
    },
    summary: {
      en: 'Practical patterns for handling message delivery failures and duplicate processing.',
      ko: '메시지 전달이 실패하거나 같은 메시지를 두 번 처리하게 될 때 쓰는 실용적인 패턴을 정리했다.',
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
      ko: '로컬 개발부터 배포까지, 팀이 언제든 똑같이 재현할 수 있는 환경을 만드는 방법.',
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
      ko: '보안 감사를 해 보니 /auth/sign-in은 userId 하나만 받고 아무것도 검증하지 않았다. 같은 버그가 5개 언어에서 각각 어떤 모양이었는지, 그리고 새로 쓴 401 테스트가 찾아낸 JDK 재시도 버그까지 적었다.',
    },
    date: '2026.07.16',
    tags: ['Security', 'Backend'],
    readMinutes: 12,
  },
  {
    slug: 'llm-technical-service',
    title: {
      en: 'Wiring an LLM Into a Domain Service',
      ko: 'Domain Service에 LLM을 붙이되 판단은 넘기지 않는다',
    },
    summary: {
      en: 'RefundReasonClassifier reads a refund reason and hands back a signal — the Domain Service that actually decides never calls it, and swapping the LLM backend from Claude to self-hosted Ollama touched almost no test.',
      ko: 'RefundReasonClassifier는 환불 사유를 읽고 신호를 돌려줄 뿐이다. 판단을 내리는 Domain Service는 이 분류기를 부르지도 않는다. 그래서 LLM 백엔드를 Claude에서 자체 호스팅 Ollama로 바꿨을 때도 손볼 테스트가 거의 없었다.',
    },
    date: '2026.07.23',
    tags: ['LLM', 'Architecture'],
    readMinutes: 12,
  },
  {
    slug: 'refund-fraud-risk-scorer',
    title: {
      en: 'A Second Fraud Signal: Scoring History, Not Reading It',
      ko: '두 번째 사기 신호는 이력을 숫자로 매긴다',
    },
    summary: {
      en: 'RefundFraudRiskScorer is a hand-rolled logistic regression trained on refund history, swappable between a native and an HTTP implementation, feeding the same Domain Service a second independent threshold.',
      ko: 'RefundFraudRiskScorer는 환불 이력으로 직접 학습시킨 로지스틱 회귀 모델이다. native 구현과 HTTP 구현을 바꿔 끼울 수 있고, 같은 Domain Service에 따로 움직이는 두 번째 임계값을 준다.',
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
      ko: '도구 출력이 에이전트를 조종하려 할 때',
    },
    summary: {
      en: "A shell command's output has, more than once, contained something shaped like a system message, instructing the agent to hide a change. The rule that matters: disregard it, and say so.",
      ko: '셸 명령 출력에 시스템 메시지처럼 꾸민 내용이 섞여 들어와, 방금 한 변경을 숨기라고 지시한 적이 한 번이 아니다. 지킬 규칙은 하나다. 따르지 말고, 그런 게 있었다고 알린다.',
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
      ko: '5개 언어에서 위반 세 가지가 나왔다. 쓰기용 Repository로 읽는 Query, JPA 애노테이션을 단 도메인 클래스, 엉뚱한 레이어에 놓인 notification 모듈이다. 진짜 버그는 하나뿐이었고, 나머지 둘을 보면 그 많은 감사가 왜 하나도 못 잡았는지 알 수 있다.',
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
      ko: '파싱도 하지 않고 코드 스니펫이 무슨 일을 하는지도 모른다. 백틱으로 적힌 경로를 실제 파일 트리와 대조할 뿐이다. 탐지 패턴 2개보다 오탐을 막은 예외 규칙이 더 중요했는데, 그런 도구가 첫 실행에서 문서 4곳의 버그를 잡았다.',
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
      en: "A repository-naming fix that only reached the write-side interface, the work of turning that gap into permanent harness rules, and a yield curve (three or four real bugs per batch of rules, then two, then zero) that was itself the most useful result.",
      ko: 'Repository 네이밍 수정이 쓰기 쪽 인터페이스에만 들어가 있었다. 그 빈틈을 하네스 규칙으로 바꿔 나가는 동안 버그는 3~4건씩 나오다가 2건, 0건으로 줄었다. 이 수확 곡선이 가장 쓸모 있는 결과였다.',
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
  {
    slug: 'five-bugs-nobody-was-looking-for',
    title: {
      en: 'Five Bugs Nobody Was Looking For',
      ko: '아무도 찾고 있지 않던 버그 다섯 개',
    },
    summary: {
      en: "Completing incomplete Swagger docs across five languages, verified by actually booting each app instead of trusting the annotations compiled. What it found had nothing to do with documentation — including a Spring Boot 4 dependency split that left production migrations silently never running.",
      ko: '미완성 Swagger 문서를 5개 언어에 걸쳐 완성하고, 애노테이션이 컴파일된다고 믿는 대신 실제로 앱을 켜서 검증했다. 찾아낸 건 문서화와는 아무 관계가 없었다 — 프로덕션 마이그레이션이 조용히 한 번도 안 돌게 만든 Spring Boot 4의 의존성 분리 사건도 포함해서.',
    },
    date: '2026.07.22',
    tags: ['API Design', 'Testing'],
    readMinutes: 12,
  },
  {
    slug: 'the-bug-came-back-wearing-five-different-masks',
    title: {
      en: 'The Bug Came Back, Wearing Five Different Masks',
      ko: '버그가 돌아왔다, 다섯 개의 다른 가면을 쓰고',
    },
    summary: {
      en: 'A week after a benchmark task exposed two languages that could not support a second event subscriber, four real features made every language need one. This time all five broke — from a loud boot-time crash to a silent single-handler drop nothing ever logged.',
      ko: '이벤트에 두 번째 구독자를 지원하지 못하는 언어 둘을 벤치마크 과제가 찾아낸 지 일주일 뒤, 실제 기능 4개가 모든 언어에 그걸 요구하게 만들었다. 이번엔 5개 언어 전부가 깨졌다 — 시끄러운 부팅 시점 크래시부터 아무 로그도 남기지 않는 조용한 핸들러 드롭까지.',
    },
    date: '2026.07.28',
    tags: ['Event-driven', 'Reliability'],
    readMinutes: 10,
  },
  {
    slug: 'the-automation-that-was-waiting-on-itself',
    title: {
      en: 'The Automation That Was Waiting on Itself',
      ko: '자기 자신을 기다리고 있던 자동화',
    },
    summary: {
      en: "Every PR a Dependabot auto-merge workflow had ever merged did so by winning a race against its own six-hour deadlock — one of its steps was waiting for a check run that could only finish after that step did. Fixing it surfaced a second bug waiting right behind the first, and a class of half-merge left behind by plain GitHub 502s.",
      ko: 'Dependabot auto-merge 워크플로가 그동안 머지한 PR은 모두 자기 자신이 만든 6시간짜리 데드락과의 경쟁에서 이겨서 머지된 것이었다. 스텝 하나가, 그 스텝이 끝나야만 끝날 수 있는 체크를 기다리고 있었다. 고치고 나니 바로 뒤에 숨어 있던 두 번째 버그와, 평범한 GitHub 502가 남긴 반쯤 머지된 PR들이 나왔다.',
    },
    date: '2026.08.04',
    tags: ['Tooling', 'Automation'],
    readMinutes: 9,
  },
  {
    slug: 'the-image-nothing-noticed-couldnt-build',
    title: {
      en: "The Image Nothing Noticed Couldn't Build",
      ko: '아무도 눈치채지 못한 빌드 안 되는 이미지',
    },
    summary: {
      en: 'A Spring Boot 4 migration that checked git history instead of a stale doc, found a workaround for a library a search index insisted did not exist, and ended a day later with the deployable image unable to build — because nothing in CI was watching the file whose meaning had just changed.',
      ko: 'Spring Boot 4 마이그레이션에서 낡은 문서 대신 git 히스토리를 확인했고, 검색 인덱스가 없다고 우기던 라이브러리는 우회책을 만들어 넘어갔다. 그런데 하루 뒤, 배포 이미지가 아예 빌드되지 않는 상태로 끝났다. 방금 의미가 바뀐 파일을 CI의 어떤 검사도 지켜보지 않았기 때문이다.',
    },
    date: '2026.08.04',
    tags: ['Architecture', 'Tooling'],
    readMinutes: 10,
  },
  {
    slug: 'zero-findings-eighty-bugs',
    title: {
      en: 'Zero Findings, Eighty Bugs',
      ko: '발견 0건, 버그 80건',
    },
    summary: {
      en: 'A path-existence checker reported zero findings before and after a three-language audit round that fixed roughly eighty real issues: stale code quotes, an evaluator that grades itself a perfect score for scanning nothing, and a generator still emitting a bug already fixed in the code it was modeled on.',
      ko: '경로 존재 여부만 확인하는 체커는 3개 언어 감사 전후로 두 번 다 0건을 보고했다. 그 사이에 고친 문제는 약 80건이었다. 낡은 코드 인용, 파일을 하나도 보지 않고 만점을 주는 평가기, 본뜬 코드에서는 이미 고친 버그를 아직도 찍어 내는 생성기가 그 안에 있었다.',
    },
    date: '2026.08.04',
    tags: ['Tooling', 'Architecture'],
    readMinutes: 11,
  },
  {
    slug: 'an-end-to-end-test-that-wasnt',
    title: {
      en: "An End-to-End Test That Wasn't",
      ko: 'End-to-End이 아니었던 End-to-End 테스트',
    },
    summary: {
      en: "NestJS's e2e suite assembled its own approximation of the app instead of booting the real one, and every language's LLM features had only ever run through their own fallback path. Fixing both surfaced a stranger bug: nock and testcontainers fighting over the same patched module.",
      ko: 'nestjs의 e2e 스위트는 실제 앱을 부팅하는 대신 자기만의 근사치를 조립하고 있었고, 모든 언어의 LLM 기능은 자기 자신의 폴백 경로로만 실행돼왔다. 둘 다 고치는 과정에서 더 이상한 버그가 드러났다: 같은 패치된 모듈을 두고 싸우는 nock과 testcontainers.',
    },
    date: '2026.08.04',
    tags: ['Testing', 'Reliability'],
    readMinutes: 11,
  },
  {
    slug: 'the-same-instant-two-different-timestamps',
    title: {
      en: 'The Same Instant, Two Different Timestamps',
      ko: '같은 순간, 서로 다른 두 타임스탬프',
    },
    summary: {
      en: 'The same moment, serialized by the same driver, produces a different string depending on the process\'s timezone. Four languages had this bug at the call site and one had it at the process boundary — and the fix belonged in a genuinely different place in each, verified by literally running the tests nine time zones apart.',
      ko: '같은 순간이 같은 드라이버로 직렬화돼도 프로세스의 시간대에 따라 다른 문자열이 나온다. 4개 언어는 호출 지점에, 1개 언어는 프로세스 경계에 이 버그가 있었다 — 그리고 수정은 언어마다 진짜 다른 자리에 있어야 했다, 시간대를 9시간 떨어뜨려 실제로 테스트를 돌려서 검증했다.',
    },
    date: '2026.08.05',
    tags: ['Backend', 'Reliability'],
    readMinutes: 11,
  },
  {
    slug: 'the-list-that-broke-five-harnesses',
    title: {
      en: 'The List That Broke Five Harnesses',
      ko: '다섯 개의 하네스를 동시에 무너뜨린 List',
    },
    summary: {
      en: "Every Kubernetes anti-pattern checker in a five-check harness assumed `---`-separated documents. Naming more than one resource in a single `kubectl get -o yaml` call wraps the result in `kind: List` instead — and every checker silently found zero resources to flag, which looked identical to a clean pass.",
      ko: '다섯 개짜리 Kubernetes 안티패턴 검사 하네스 전부가 `---`로 구분된 문서를 가정했다. 한 번의 `kubectl get -o yaml` 호출에 리소스를 두 개 이상 대면 결과가 `kind: List`로 감싸지고 — 모든 검사기가 조용히 플래그할 리소스를 0개 찾았는데, 이건 깨끗한 통과처럼 보였다.',
    },
    date: '2026.08.08',
    tags: ['Kubernetes', 'Tooling'],
    readMinutes: 9,
    discrepancy: {
      looked: { en: 'Zero resources flagged.', ko: '플래그된 리소스 0개.' },
      was: { en: 'Zero resources read.', ko: '읽어낸 리소스가 0개.' },
    },
    project: { name: 'k8s-playbook', url: 'https://github.com/kyhsa93/k8s-playbook' },
  },
  {
    slug: 'two-tools-the-same-missing-root',
    title: {
      en: 'Two Tools, the Same Missing Root',
      ko: '서로 다른 두 도구, 똑같이 빠뜨린 루트',
    },
    summary: {
      en: "Argo CD's App-of-Apps proof lives entirely on the parent; Flux's dependsOn proof is declared by the child and unverifiable alone. Audit either tree without including its root, and both fail the same way — for what turns out to be the same underlying reason.",
      ko: "Argo CD App-of-Apps는 증거가 전부 부모에 있고, Flux dependsOn은 자식이 선언하지만 그것만으로는 검증이 안 된다. 어느 트리든 루트를 빼고 감사하면 똑같이 실패하고, 따져 보면 이유도 같다.",
    },
    date: '2026.08.08',
    tags: ['Kubernetes', 'GitOps'],
    readMinutes: 10,
    project: { name: 'k8s-playbook', url: 'https://github.com/kyhsa93/k8s-playbook' },
  },
  {
    slug: 'a-benchmark-that-can-never-hit-100',
    title: {
      en: 'A Benchmark That Can Never Hit 100',
      ko: '영원히 100점을 받을 수 없는 벤치마크',
    },
    summary: {
      en: 'A scoring harness covers nineteen categories of Kubernetes deployment mistake. One of them — drift — can only exist after a manifest has already been applied, which an authoring benchmark structurally cannot produce or avoid. The honest fix was a permanent, documented ceiling, not a future version.',
      ko: '채점 하네스가 Kubernetes 배포 실수 19개 카테고리를 다룬다. 그중 하나 — drift — 는 매니페스트가 이미 적용된 뒤에야 존재할 수 있고, 작성 벤치마크는 구조적으로 이걸 일으키거나 막을 수 없다. 정직한 해결책은 미래 버전이 아니라 영구적이고 문서화된 상한선이었다.',
    },
    date: '2026.08.08',
    tags: ['Kubernetes', 'Benchmark'],
    readMinutes: 9,
    project: { name: 'k8s-playbook', url: 'https://github.com/kyhsa93/k8s-playbook' },
  },
  {
    slug: 'a-tied-score-two-different-kinds-of-wrong',
    title: {
      en: 'A Tied Score, Two Different Kinds of Wrong',
      ko: '동점인 점수, 서로 다른 두 종류의 잘못',
    },
    summary: {
      en: "Two models scored an identical 9/9 on a Kubernetes manifest-authoring task, independently reproduced. Reading what each one actually wrote found a self-defeating NetworkPolicy in one and a promotion pipeline referencing a resource that doesn't exist in the other — two unrelated defects invisible to a tied harness score.",
      ko: '두 모델이 Kubernetes 매니페스트 작성 과제에서 동일한 9/9를 받았고, 독립적으로 재확인됐다. 실제로 각자 쓴 걸 읽어보니 한쪽엔 스스로를 무력화하는 NetworkPolicy가, 다른 쪽엔 존재하지 않는 리소스를 참조하는 프로모션 파이프라인이 있었다 — 동점인 하네스 점수엔 보이지 않는, 서로 무관한 결함 두 개.',
    },
    date: '2026.08.08',
    tags: ['Kubernetes', 'AI Agents'],
    readMinutes: 10,
    discrepancy: {
      looked: { en: 'Both models scored 9 / 9.', ko: '두 모델 모두 9 / 9.' },
      was: { en: 'Both were broken, differently.', ko: '둘 다 서로 다른 데가 깨져 있었다.' },
    },
    project: { name: 'k8s-playbook', url: 'https://github.com/kyhsa93/k8s-playbook' },
  },
  {
    slug: 'the-defaults-nobody-declared',
    title: {
      en: 'The Defaults Nobody Declared',
      ko: '아무도 선언하지 않은 기본값들',
    },
    summary: {
      en: "A drift checker pointed at a cluster that had just been applied cleanly reported drift everywhere. The cluster wasn't lying — the API server's own admission defaulting had filled in fields Git never mentioned, and a naive full-object comparison had no way to tell the difference.",
      ko: '방금 깔끔하게 적용된 클러스터를 겨눈 drift 검사기가 온통 drift를 보고했다. 클러스터가 거짓말을 한 게 아니었다 — API 서버 자신의 admission 기본값 채우기가 Git이 언급조차 하지 않은 필드를 채워넣었고, 순진한 전체 객체 비교는 그 차이를 구분할 방법이 없었다.',
    },
    date: '2026.08.08',
    tags: ['Kubernetes', 'Reliability'],
    readMinutes: 9,
    discrepancy: {
      looked: { en: 'The cluster had drifted.', ko: '클러스터가 drift했다.' },
      was: { en: 'The API server had filled the blanks.', ko: 'API 서버가 빈칸을 채운 것이었다.' },
    },
    project: { name: 'k8s-playbook', url: 'https://github.com/kyhsa93/k8s-playbook' },
  },
  {
    slug: 'the-factory-knows-where-to-put-it',
    title: {
      en: 'The Factory Knows Where to Put It',
      ko: 'Factory는 어디에 넣을지 알고 있었다',
    },
    summary: {
      en: "Two codebases generate an Aggregate's ID in two different places — one in the constructor, one via a Factory asking Infrastructure for it. Eric Evans' own book has a specific, citable answer for which pattern it actually describes, and it isn't the one either codebase's convention assumes.",
      ko: '두 코드베이스가 Aggregate의 ID를 서로 다른 곳에서 만든다. 하나는 생성자에서, 다른 하나는 Factory가 Infrastructure에 요청해서 만든다. Eric Evans의 원저에는 어느 패턴을 설명하는지 인용할 수 있는 구체적인 답이 있고, 그 답은 두 코드베이스의 관례가 가정하는 것과 다르다.',
    },
    date: '2026.08.08',
    tags: ['DDD', 'Comparative'],
    readMinutes: 10,
    project: {
      name: 'nestjs-rest-cqrs-example',
      url: 'https://github.com/kyhsa93/nestjs-rest-cqrs-example',
    },
  },
  {
    slug: 'a-rule-evans-never-wrote',
    title: {
      en: 'A Rule Evans Never Wrote',
      ko: 'Evans가 쓴 적 없는 규칙',
    },
    summary: {
      en: "Nearly every DDD codebase forbids referencing another Aggregate by direct object reference (ID only). Eric Evans' 2003 book explicitly permits it. The person who wrote the ID-only rule, Vaughn Vernon, says so himself, in the same paper that argues for the stricter rule anyway.",
      ko: '거의 모든 DDD 코드베이스가 다른 Aggregate를 객체로 직접 참조하지 말고 ID로만 참조하게 한다. 그런데 Eric Evans의 2003년 원저는 직접 참조를 분명히 허용한다. ID로만 참조하라는 규칙을 쓴 Vaughn Vernon도 이 사실을 스스로 밝힌다. 그것도 더 엄격한 규칙을 주장하는 같은 논문 안에서다.',
    },
    date: '2026.08.08',
    tags: ['DDD', 'Comparative'],
    readMinutes: 10,
    project: {
      name: 'backend-service-playbook',
      url: 'https://github.com/kyhsa93/backend-service-playbook',
    },
  },
];

export const postsByDate: PostMeta[] = [...posts].sort((a, b) =>
  a.date === b.date ? 0 : a.date < b.date ? 1 : -1,
);
