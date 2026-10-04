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
    slug: 'one-container-per-agent',
    title: {
      en: 'One Container per AI Agent',
      ko: 'AI 에이전트마다 컨테이너 하나씩',
    },
    summary: {
      en: 'Design notes for running several coding agents on one machine without stepping on each other: a container per agent so the unit of isolation is also the unit of cleanup, agent-to-agent messages over the network, nested containers only when needed, credentials that are shared without being baked in, and a cgroup-only alternative tested with systemd.',
      ko: '머신 하나에서 코딩 에이전트 여러 개가 서로 밟지 않게 돌리는 설계를 정리했다. 에이전트마다 컨테이너를 줘서 격리 단위와 회수 단위를 맞추고, 에이전트끼리는 네트워크로 주고받고, 중첩 컨테이너는 필요할 때만 쓰고, 인증 정보는 이미지에 굽지 않고 나눠 준다. systemd로 시험해 본 cgroup만 쓰는 가벼운 방법도 같이 적었다.',
    },
    date: '2026.10.04',
    tags: ['AI Agents', 'Docker'],
    readMinutes: 12,
  },
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
      en: 'Same doc, same task, two models, run at the same time in separate worktrees. Both self-reported a perfect score from the automated architecture checker. Only one of them, independently reproduced against real Postgres and LocalStack, worked.',
      ko: '같은 문서와 같은 과제를 두 모델에게 주고, worktree를 따로 만들어 동시에 돌렸다. 둘 다 자동 아키텍처 검사에서 만점을 받았다고 스스로 보고했다. 실제 Postgres와 LocalStack 위에서 따로 재현해 보니, 제대로 동작한 쪽은 하나뿐이었다.',
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
      en: "A fraud signal computed from text the suspect writes can't catch that suspect. Why an LLM refund-reason classifier built on exactly that had to go, the history-based ML scorer removed alongside it, and the one rule the removal left behind.",
      ko: '의심받는 사람이 직접 적는 글로 계산한 사기 신호로는 그 사람을 잡을 수 없다. 환불 사유를 읽던 LLM 분류기가 바로 그런 신호였다. 이 분류기와 함께 이력 기반 ML 스코어러까지 걷어 낸 과정과, 걷어 내고 남은 규칙 하나를 적었다.',
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
      en: 'How to let an LLM turn a free-text question into a database filter without ever letting it decide whose data comes back: a filter type with no owner field, a structured-data RAG pipeline over an account\'s own transactions, and the same invariant held across five languages\' own conventions.',
      ko: 'LLM이 자유로운 질문을 DB 필터로 바꾸게 하되, 누구의 데이터가 돌아올지는 절대 정하지 못하게 하는 법이다. 소유자 필드가 아예 없는 필터 타입, 자기 거래 내역을 대상으로 한 구조화 데이터 RAG 파이프라인, 그리고 그 불변식이 5개 언어의 서로 다른 관례 속에서도 그대로 남은 과정을 정리했다.',
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
      ko: 'Domain Service: 규칙이 하나의 Aggregate에 속하지 않을 때',
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
      ko: 'Bounded Context 사이의 대화법',
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
      ko: 'CQRS 실전 적용기, Query가 Repository를 쓰면 안 되는 이유',
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
      en: 'Three Names for Every Repository, and Why the Rule Still Drifted',
      ko: 'Repository 메서드 이름은 셋이면 된다, 그런데도 규칙이 어긋난 이유',
    },
    summary: {
      en: 'Every Repository operation fits find, save, and delete with a noun, and nothing else. Written only in prose, the rule drifted in four of five implementations of the same design. Once a check enforced it, the first run found three more violations nobody had noticed.',
      ko: 'Repository의 연산은 명사를 붙인 find, save, delete 셋으로 충분하다. 글로만 적힌 이 규칙은 같은 설계를 구현한 5개 중 4곳에서 어긋나 있었다. 검사로 강제하자 첫 실행에서 아무도 몰랐던 위반 3건이 더 나왔다.',
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
      en: 'Log-level policy, structured logging, and propagating a Correlation ID through the SLF4J MDC.',
      ko: '로그 레벨 정책과 구조화된 로깅, SLF4J MDC로 Correlation ID를 전파하는 방법.',
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
      en: 'Compliance as Code: What an Architecture Checker Catches, and What It Keeps Missing',
      ko: '컴플라이언스를 코드로, 아키텍처 검사기가 잡는 것과 계속 놓치는 것',
    },
    summary: {
      en: 'Automated architecture checks reliably catch code in the wrong place. Three kinds of drift still get past them: a wrong name inside the right file, code that is wrong together with its own doc, and disagreement that only exists between implementations.',
      ko: '아키텍처를 자동으로 검사하면 엉뚱한 자리에 들어간 코드는 잘 잡힌다. 그래도 맞는 파일 안의 틀린 이름, 문서와 함께 틀린 코드, 구현 사이에만 있는 불일치는 계속 빠져나갔다.',
    },
    date: '2026.07.22',
    tags: ['Tooling', 'Architecture'],
    readMinutes: 14,
  },
  {
    slug: 'can-an-ai-agent-follow-your-architecture',
    title: {
      en: 'Can an AI Agent Follow Your Architecture?',
      ko: 'AI 에이전트는 정해 둔 아키텍처를 따를 수 있을까?',
    },
    summary: {
      en: 'How to measure whether an AI agent finds and follows documented design rules on its own: a sparse task, a score you rerun yourself, and difficulty raised one decision at a time.',
      ko: 'AI 에이전트가 문서로 정해 둔 설계 규칙을 스스로 찾아 따르는지 재는 법을 정리했다. 과제는 성기게 주고, 채점은 직접 다시 돌리고, 난이도는 판단 하나씩 올린다.',
    },
    date: '2026.07.21',
    tags: ['AI Agents', 'Benchmark'],
    readMinutes: 15,
  },
  {
    slug: 'from-docs-to-runnable-code',
    title: {
      en: 'A Code Generator Is a Second Copy of Every Rule',
      ko: '코드 생성기는 모든 규칙의 두 번째 구현이었다',
    },
    summary: {
      en: "A scaffolding generator is a second implementation of every convention it emits. When a rule changes and only the hand-written example is updated, the generator keeps emitting the old pattern. Generating a brand-new domain from just a name and running every automated check against it is what catches the drift, and the generator's own bugs.",
      ko: '스캐폴딩 생성기는 자기가 찍어 내는 모든 컨벤션의 두 번째 구현이다. 규칙이 바뀌었는데 손으로 쓴 예시만 고치면 생성기는 옛 패턴을 계속 만든다. 이름 하나로 새 도메인을 만들어 자동 검사를 전부 돌려 봐야 그 어긋남과 생성기 자체의 버그가 드러난다.',
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
      ko: '도메인 경계를 찾는 법',
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
      ko: '컨테이너화된 환경의 개발자 경험',
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
      en: 'Port one design to several languages and its first security hole gets ported too. A security audit found /auth/sign-in accepted a userId and nothing else in all five implementations: how the bug looked in each language, what closes it, and the JDK retry bug a new 401 test uncovered along the way.',
      ko: '설계 하나를 여러 언어로 옮기면 처음 구현의 보안 구멍도 같이 옮겨 간다. 보안 감사를 해 보니 /auth/sign-in은 5개 구현 모두에서 userId 하나만 받고 아무것도 검증하지 않았다. 같은 버그가 언어마다 어떤 모양이었고 무엇으로 막았는지, 새로 쓴 401 테스트가 찾아낸 JDK 재시도 버그까지 적었다.',
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
      en: 'An LLM makes a good signal and a bad final judge. Let it read a refund reason and hand back a value, keep the threshold in a Domain Service that never calls it, and swapping the backend from Claude to self-hosted Ollama touches almost no test.',
      ko: 'LLM은 신호로는 쓸 만하지만 최종 판단을 맡기기엔 믿을 수 없다. 환불 사유를 읽고 값만 돌려주게 하고, 임계값은 분류기를 부르지도 않는 Domain Service에 두면 된다. 그러면 LLM 백엔드를 Claude에서 자체 호스팅 Ollama로 바꿔도 손볼 테스트가 거의 없다.',
    },
    date: '2026.07.23',
    tags: ['LLM', 'Architecture'],
    readMinutes: 12,
  },
  {
    slug: 'refund-fraud-risk-scorer',
    title: {
      en: "An ML Score With Nothing to Train On: Plug It In, Don't Let It Decide",
      ko: '학습할 데이터가 없는 ML 점수는 끼워 넣되 결정은 맡기지 않는다',
    },
    summary: {
      en: 'How to put a machine-learning risk score next to a rule-based refund decision with no real data to train on: an interface, a config switch, fail-open on errors, and a Domain Service that keeps the decision. Walked through with a hand-rolled logistic regression on refund history that has since been removed.',
      ko: '학습할 실제 데이터 없이 ML 위험 점수를 규칙 기반 환불 판정 옆에 붙이는 법이다. 인터페이스 뒤에 두고, 설정으로 바꾸고, 오류가 나면 통과시키고, 결정은 Domain Service에 남긴다. 환불 이력으로 직접 학습시킨 로지스틱 회귀 예시로 설명한다. 이 코드는 지금은 지웠다.',
    },
    date: '2026.07.23',
    tags: ['Machine Learning', 'Architecture'],
    readMinutes: 12,
  },
  {
    slug: 'bugs-only-e2e-tests-catch',
    title: {
      en: "The Bugs Unit Tests Can't See",
      ko: '유닛 테스트가 보지 못하는 버그들',
    },
    summary: {
      en: 'A missing @Transactional, a JDK HTTP client retry quirk, a VARCHAR(36) overflow, an SQS FIFO dedup collision — four real bugs that needed real infrastructure to even exist.',
      ko: '빠진 @Transactional, JDK HTTP 클라이언트의 재시도 결함, VARCHAR(36) 오버플로, SQS FIFO 중복 제거 충돌. 실제 인프라가 있어야만 생길 수 있었던 버그 4개다.',
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
      en: 'An audit that checks code against its own docs cannot catch code and doc that are wrong together. Three violations (a Query reading a write Repository, a domain class carrying JPA, a notification module in the wrong layer) had passed dozens of prior audits. Only one was a bug, and the other two show why none of those audits could have caught them.',
      ko: '코드가 자기 문서와 맞는지만 보는 감사는 둘이 함께 틀린 경우를 잡지 못한다. 쓰기용 Repository로 읽는 Query, JPA 애노테이션을 단 도메인 클래스, 엉뚱한 레이어에 놓인 notification 모듈이 그 많은 감사를 통과해 있었다. 진짜 버그는 하나뿐이었고, 나머지 둘을 보면 왜 어떤 감사도 이들을 잡을 수 없었는지 알 수 있다.',
    },
    date: '2026.07.12',
    tags: ['DDD', 'Architecture'],
    readMinutes: 11,
  },
  {
    slug: 'the-harness-had-never-met-a-second-domain',
    title: {
      en: 'A Rule That Has Only Seen Two Inputs',
      ko: '두 입력만 본 검사 규칙은 범용인지 알 수 없었다',
    },
    summary: {
      en: 'A lint rule that only ever passed on the inputs it was written against has not been shown to be generic. Two architecture rules had checked out clean for months on the same two domains. A deliberately unrelated third domain surfaced two false positives, and confirmed the rule meant to catch a real mistake still did.',
      ko: '검사 규칙이 받아 본 입력에서만 깨끗했다면 범용이라고 말할 수 없다. 아키텍처 규칙 2개가 몇 달째 깨끗했는데, 그동안 받아 본 도메인은 늘 같은 두 개였다. 전혀 상관없는 세 번째 도메인을 만들어 보니 오탐 2건이 드러났다. 진짜 실수를 잡아야 하는 규칙은 여전히 그걸 잡는다는 것도 확인했다.',
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
      en: 'The Doc Said "Done": When to Stop Adding Checks',
      ko: '문서는 "끝났다"고 했다, 검사는 언제까지 늘려야 하나',
    },
    summary: {
      en: "Turning each audit finding into an automated rule raises a question: how many rules are enough? Starting from a naming fix that reached only the write-side interface, each batch of new rules found three or four real bugs, then two, then zero. That flat yield curve was the answer.",
      ko: '감사에서 찾은 것을 자동 검사 규칙으로 바꿔 나가면, 규칙을 몇 개까지 만들어야 하나. 쓰기 쪽 인터페이스에만 들어간 네이밍 수정에서 시작해 규칙을 더할 때마다 버그가 3~4건씩 나오다가 2건, 0건으로 줄었다. 평평해진 수확 곡선이 답이었다.',
    },
    date: '2026.07.20',
    tags: ['Conventions', 'Tooling'],
    readMinutes: 12,
  },
  {
    slug: 'two-accounts-one-transaction-five-different-answers',
    title: {
      en: 'Two Accounts, One Transaction, Five Different Answers',
      ko: '계좌 둘, 트랜잭션 하나, 답은 다섯 가지',
    },
    summary: {
      en: "A transfer feature needs one thing every implementation already claimed to support: writing two Aggregates atomically. Building it for real found a working mechanism in one language, a regression waiting one edit inside the obvious fix in another, and a doc that had been quietly wrong about its own code in a third.",
      ko: '송금 기능에 필요한 건 Aggregate 2개를 원자적으로 쓰는 것 하나다. 모든 구현이 이미 된다고 했던 기능이다. 막상 만들어 보니 한 언어는 제대로 동작했고, 한 언어는 뻔한 수정 바로 안쪽에 회귀가 숨어 있었고, 한 언어는 문서가 자기 코드를 틀리게 설명하고 있었다.',
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
      en: 'When every candidate scores 100% on an easy task, the test has said nothing about where any of them would fail. Raising the difficulty of an AI coding task one design decision at a time, across five language implementations of the same design, found the ceiling. The last rung exposed a fan-out bug that had been invisible because nothing had ever subscribed two things to the same event before.',
      ko: '쉬운 과제에서 모두가 100점을 받으면, 그 테스트는 누가 어디서 무너질지 알려 주지 않는다. 같은 설계를 구현한 5개 언어에서 AI 코딩 과제의 난이도를 설계 판단 하나씩 올리자 천장이 보였다. 마지막 단에서는 팬아웃 버그가 나왔다. 같은 이벤트를 둘이 구독한 적이 없어서 그동안 안 보이던 버그였다.',
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
      en: "An annotation that compiles isn't an annotation that's true. Completing incomplete Swagger docs across five implementations of the same design, verified by actually booting each app instead of trusting the annotations compiled. What it found had nothing to do with documentation — including a Spring Boot 4 dependency split that left production migrations silently never running.",
      ko: '컴파일되는 애노테이션이 곧 맞는 애노테이션은 아니다. 같은 설계를 구현한 5개 언어의 덜 된 Swagger 문서를 채우고, 애노테이션이 컴파일되니 됐다고 믿지 않고 앱을 직접 띄워 확인했다. 그렇게 찾은 버그는 문서와 상관없는 것들이었다. Spring Boot 4의 의존성 분리 때문에 프로덕션 마이그레이션이 아무 표시 없이 한 번도 돌지 않던 문제도 그중 하나다.',
    },
    date: '2026.07.22',
    tags: ['API Design', 'Testing'],
    readMinutes: 12,
  },
  {
    slug: 'the-bug-came-back-wearing-five-different-masks',
    title: {
      en: 'The Bug Came Back, Wearing Five Different Masks',
      ko: '다섯 가지 가면을 쓰고 돌아온 버그',
    },
    summary: {
      en: 'Event dispatch that has only ever run one handler per event has not shown it can run two. When four real features gave an event its second subscriber in five language implementations of the same design, all five broke, each differently, from a loud boot-time crash to a silent single-handler drop nothing ever logged.',
      ko: '이벤트마다 핸들러를 하나만 돌려 본 디스패치 코드는 둘을 돌릴 수 있다는 걸 보여 준 적이 없다. 같은 설계를 구현한 5개 언어에서 실제 기능 4개가 한 이벤트에 두 번째 구독자를 붙이자, 5개 모두 저마다 다르게 깨졌다. 부팅 때 요란하게 죽는 경우부터, 로그 한 줄 없이 핸들러 하나가 빠지는 경우까지 있었다.',
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
      en: "A merge workflow that waits on every check while being one of them can only succeed by accident. Every PR a Dependabot auto-merge workflow had ever merged did so by winning a race against its own six-hour deadlock — one of its steps was waiting for a check run that could only finish after that step did. Fixing it surfaced a second bug waiting right behind the first, and a class of half-merge left behind by plain GitHub 502s.",
      ko: '모든 체크를 기다리는 머지 워크플로가 그 체크 중 하나라면 성공은 우연일 뿐이다. Dependabot auto-merge 워크플로가 그동안 머지한 PR은 모두 자기 자신이 만든 6시간짜리 데드락과의 경쟁에서 이겨서 머지된 것이었다. 스텝 하나가, 그 스텝이 끝나야만 끝날 수 있는 체크를 기다리고 있었다. 고치고 나니 바로 뒤에 숨어 있던 두 번째 버그와, 평범한 GitHub 502가 남긴 반쯤 머지된 PR들이 나왔다.',
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
      en: 'A CI check only protects what its trigger watches. A Spring Boot 4 migration that checked git history instead of a stale doc, found a workaround for a library a search index insisted did not exist, and ended a day later with the deployable image unable to build — because nothing in CI was watching the file whose meaning had just changed.',
      ko: 'CI 검사는 트리거가 지켜보는 것만 지킨다. Spring Boot 4 마이그레이션에서 낡은 문서 대신 git 히스토리를 확인했고, 검색 인덱스가 없다고 우기던 라이브러리는 우회책을 만들어 넘어갔다. 그런데 하루 뒤, 배포 이미지가 아예 빌드되지 않는 상태로 끝났다. 방금 의미가 바뀐 파일을 CI의 어떤 검사도 지켜보지 않았기 때문이다.',
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
      en: 'Zero findings tells you what a check looked at, not what is there. A path-existence checker reported zero before and after a three-language audit that fixed roughly eighty real issues: stale code quotes, an evaluator that grades itself a perfect score for scanning nothing, and a generator still emitting a bug already fixed in the code it was modeled on.',
      ko: '검사 결과 0건은 검사가 무엇을 봤는지만 알려 준다. 경로 존재 여부만 확인하는 체커는 3개 언어 감사 전후로 두 번 다 0건을 보고했다. 그 사이에 고친 문제는 약 80건이었다. 낡은 코드 인용, 파일을 하나도 보지 않고 만점을 주는 평가기, 본뜬 코드에서는 이미 고친 버그를 아직도 찍어 내는 생성기가 그 안에 있었다.',
    },
    date: '2026.08.04',
    tags: ['Tooling', 'Architecture'],
    readMinutes: 11,
  },
  {
    slug: 'an-end-to-end-test-that-wasnt',
    title: {
      en: "An End-to-End Test That Wasn't",
      ko: 'End-to-End가 아니었던 End-to-End 테스트',
    },
    summary: {
      en: "An end-to-end suite that assembles its own approximation of the app is testing the approximation. NestJS's e2e suite never booted the real app, and every language's LLM features had only ever run through their own fallback path. Fixing both surfaced a stranger bug: nock and testcontainers fighting over the same patched module.",
      ko: '흉내 낸 앱을 따로 조립하는 e2e 스위트는 그 흉내를 시험할 뿐이다. NestJS의 e2e 스위트는 실제 앱을 한 번도 띄우지 않았다. 모든 언어의 LLM 기능도 폴백 경로로만 돌아 봤다. 둘을 고치다가 더 이상한 버그를 만났다. nock과 testcontainers가 같은 패치된 모듈을 두고 다투고 있었다.',
    },
    date: '2026.08.04',
    tags: ['Testing', 'Reliability'],
    readMinutes: 11,
  },
  {
    slug: 'the-same-instant-two-different-timestamps',
    title: {
      en: 'The Same Instant, Two Different Timestamps',
      ko: '같은 순간인데 타임스탬프는 둘',
    },
    summary: {
      en: 'The same moment, serialized by the same driver, produces a different string depending on the process\'s timezone. Four languages had this bug at the call site and one had it at the process boundary — and the fix belonged in a genuinely different place in each, verified by literally running the tests nine time zones apart.',
      ko: '같은 시각을 같은 드라이버로 직렬화해도 프로세스 시간대에 따라 문자열이 달라진다. 4개 언어는 호출 지점에, 1개 언어는 프로세스 경계에 이 버그가 있었다. 고칠 자리도 언어마다 달랐고, 9시간 차이 나는 시간대에서 테스트를 직접 돌려 검증했다.',
    },
    date: '2026.08.05',
    tags: ['Backend', 'Reliability'],
    readMinutes: 11,
  },
  {
    slug: 'the-list-that-broke-five-harnesses',
    title: {
      en: 'The List That Broke Five Checkers',
      ko: '검사기 5개를 한꺼번에 무너뜨린 List',
    },
    summary: {
      en: "Five Kubernetes anti-pattern checkers all assumed `---`-separated documents. Naming more than one resource in a single `kubectl get -o yaml` call wraps the result in `kind: List` instead, and every checker found zero resources to flag without a word, which looked identical to a clean pass.",
      ko: 'Kubernetes 안티패턴 검사기 5개가 모두 `---`로 구분한 문서를 가정하고 있었다. `kubectl get -o yaml` 한 번에 리소스를 2개 이상 대면 결과가 `kind: List`로 감싸진다. 그러자 모든 검사기가 아무 말 없이 리소스를 0개 찾았고, 겉보기에는 깨끗한 통과와 똑같았다.',
    },
    date: '2026.08.08',
    tags: ['Kubernetes', 'Tooling'],
    readMinutes: 9,
    discrepancy: {
      looked: { en: 'Zero resources flagged.', ko: '걸린 리소스가 0개였다.' },
      was: { en: 'Zero resources read.', ko: '읽은 리소스가 0개였다.' },
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
      en: 'A score that adds up many checks can be missing one because nobody built it yet, or because the thing being scored can never show it. A checker covering nineteen categories of Kubernetes deployment mistake hit the second kind: drift can only exist after a manifest has already been applied, which an authoring benchmark structurally cannot produce or avoid. The honest fix was a permanent, documented ceiling, not a future version.',
      ko: '여러 검사를 더한 점수에서 검사 하나가 빠졌다면, 아직 안 만들었거나 채점 대상이 영영 보여 줄 수 없는 경우다. Kubernetes 배포 실수 19개 카테고리를 채점하는 검사기에서 drift가 그 뒤쪽 경우였다. drift는 매니페스트를 적용한 뒤에야 생길 수 있어서, 작성 벤치마크로는 구조상 일으킬 수도 막을 수도 없다. 그래서 다음 버전을 기약하지 않고, 받을 수 있는 최고점을 영구히 문서에 적었다.',
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
      en: "Two models scored an identical 9/9 on a Kubernetes manifest-authoring task, independently reproduced. Reading what each one wrote found a self-defeating NetworkPolicy in one and a promotion pipeline referencing a resource that doesn't exist in the other, two unrelated defects that checks for a resource's presence couldn't see.",
      ko: '두 모델이 Kubernetes 매니페스트 작성 과제에서 똑같이 9/9를 받았고, 따로 다시 돌려 봐도 같았다. 그런데 각자 쓴 파일을 읽어 보니 한쪽은 NetworkPolicy가 스스로를 무력화하고 있었고, 다른 쪽은 프로모션 파이프라인이 있지도 않은 리소스를 참조하고 있었다. 리소스가 있는지만 보는 검사로는 보이지 않는, 서로 관계없는 결함 2개였다.',
    },
    date: '2026.08.08',
    tags: ['Kubernetes', 'AI Agents'],
    readMinutes: 10,
    discrepancy: {
      looked: { en: 'Both models scored 9 / 9.', ko: '두 모델 모두 9 / 9를 받았다.' },
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
      ko: '방금 깔끔하게 적용한 클러스터에 drift 검사기를 돌렸더니 온통 drift라고 나왔다. 클러스터가 거짓말을 한 건 아니다. API 서버의 admission 기본값 처리가 Git에 적지도 않은 필드를 채웠고, 객체 전체를 그대로 비교하는 검사기는 그걸 구별하지 못했다.',
    },
    date: '2026.08.08',
    tags: ['Kubernetes', 'Reliability'],
    readMinutes: 9,
    discrepancy: {
      looked: { en: 'The cluster had drifted.', ko: '클러스터에 drift가 생겼다.' },
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
