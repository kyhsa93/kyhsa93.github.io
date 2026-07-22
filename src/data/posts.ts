export interface PostMeta {
  slug: string;
  title: string;
  summary: string;
  date: string;
  tags: string[];
  readMinutes: number;
}

// Not necessarily in date order — see `postsByDate` for that.
export const posts: PostMeta[] = [
  {
    slug: 'aggregate-design',
    title: 'Designing Aggregates: Transaction Boundaries and Invariants',
    summary: 'What actually decides an Aggregate boundary, and how the Domain layer generates its own ID.',
    date: '2026.07.22',
    tags: ['DDD', 'Tactical Design'],
    readMinutes: 13,
  },
  {
    slug: 'domain-services-across-aggregates',
    title: "Domain Services: When a Rule Doesn't Belong to One Aggregate",
    summary: 'A real RefundEligibilityService example for logic that has to read two Aggregates at once.',
    date: '2026.07.18',
    tags: ['DDD', 'Tactical Design'],
    readMinutes: 13,
  },
  {
    slug: 'talking-across-bounded-contexts',
    title: 'Talking Across Bounded Contexts',
    summary: 'Choosing between a synchronous Adapter and an asynchronous Integration Event, with a real compensating-transaction example.',
    date: '2026.07.11',
    tags: ['DDD', 'Integration'],
    readMinutes: 12,
  },
  {
    slug: 'cqrs-in-practice',
    title: "CQRS in Practice: Why a Query Can't Use a Repository",
    summary: 'A real cross-language bug where a Query Handler used a write-capable Repository — and the docs agreed it was fine.',
    date: '2026.07.12',
    tags: ['CQRS', 'Architecture'],
    readMinutes: 13,
  },
  {
    slug: 'repository-naming-convention',
    title: 'The Naming Rule That Caught Real Bugs',
    summary: 'How a boring find/save/delete naming convention, once automated, immediately found violations nobody had noticed.',
    date: '2026.07.21',
    tags: ['Repository Pattern', 'Conventions'],
    readMinutes: 12,
  },
  {
    slug: 'request-scoped-user-context',
    title: 'Request-Scoped Context: Why req.user Is an Anti-Pattern',
    summary: 'An AsyncLocalStorage-based UserContextStore, and the Guard/Interceptor split it took to get there.',
    date: '2026.07.22',
    tags: ['Cross-cutting Concerns', 'Backend'],
    readMinutes: 13,
  },
  {
    slug: 'observability-by-design',
    title: 'Observability Is a Design Decision, Not an Afterthought',
    summary: 'Log-level policy, structured logging, and propagating a Correlation ID through AsyncLocalStorage.',
    date: '2026.07.22',
    tags: ['Observability', 'Operations'],
    readMinutes: 12,
  },
  {
    slug: 'graceful-shutdown',
    title: 'Graceful Shutdown: The Reliability Feature Nobody Tests',
    summary: 'Getting the order right between readiness, in-flight requests, and resource cleanup during SIGTERM.',
    date: '2026.07.11',
    tags: ['Reliability', 'Operations'],
    readMinutes: 11,
  },
  {
    slug: 'scheduling-and-task-outbox',
    title: 'Scheduling and the Task Outbox Pattern',
    summary: 'Why a Scheduler should only enqueue, and the real bugs multi-instance Cron jobs surfaced.',
    date: '2026.07.21',
    tags: ['Scheduling', 'Backend'],
    readMinutes: 13,
  },
  {
    slug: 'typed-errors-and-response-schemas',
    title: 'Typed Errors and a Consistent Response Schema',
    summary: 'Why an error-message enum key has to equal its value, and the four-field error response shape.',
    date: '2026.07.11',
    tags: ['API Design', 'Conventions'],
    readMinutes: 12,
  },
  {
    slug: 'compliance-as-code',
    title: 'Compliance as Code: Building a Harness That Enforces Architecture',
    summary: 'What a harness rule is and is not allowed to assume, and the failure modes even careful audits miss.',
    date: '2026.07.22',
    tags: ['Tooling', 'Architecture'],
    readMinutes: 14,
  },
  {
    slug: 'can-an-ai-agent-follow-your-architecture',
    title: 'Can an AI Agent Follow Your Architecture?',
    summary: 'Reusing an architecture-compliance harness as an AI benchmark, across five difficulty levels and five languages.',
    date: '2026.07.21',
    tags: ['AI Agents', 'Benchmark'],
    readMinutes: 15,
  },
  {
    slug: 'from-docs-to-runnable-code',
    title: 'From Docs to Runnable Code in One Command',
    summary: 'Turning a written reference template into a scaffolding generator, and the bugs found by actually running it.',
    date: '2026.07.17',
    tags: ['Tooling', 'Developer Experience'],
    readMinutes: 12,
  },
  {
    slug: 'same-architecture-five-languages',
    title: 'Same Architecture, Five Languages',
    summary: 'Comparing the same Repository/Query split as implemented independently in TypeScript, Go, Python, Java, and Kotlin.',
    date: '2026.07.21',
    tags: ['Comparative', 'Architecture'],
    readMinutes: 14,
  },
  {
    slug: 'finding-domain-boundaries',
    title: 'How to Find Domain Boundaries',
    summary: 'A record of the thought process for organizing complex requirements into Aggregates and Bounded Contexts.',
    date: '2026.07.19',
    tags: ['DDD', 'Architecture'],
    readMinutes: 14,
  },
  {
    slug: 'reliable-event-driven-systems',
    title: 'Reliability in Event-Driven Systems',
    summary: 'Practical patterns for handling message delivery failures and duplicate processing.',
    date: '2026.07.19',
    tags: ['Event-driven', 'Backend'],
    readMinutes: 12,
  },
  {
    slug: 'containerized-development-experience',
    title: 'Developer Experience in Containerized Environments',
    summary: 'How teams can build a reproducible environment from local development through deployment.',
    date: '2026.07.19',
    tags: ['Docker', 'Developer experience'],
    readMinutes: 11,
  },
];

export const postsByDate: PostMeta[] = [...posts].sort((a, b) =>
  a.date === b.date ? 0 : a.date < b.date ? 1 : -1,
);
