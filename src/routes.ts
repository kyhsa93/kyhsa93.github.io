import {
  type RouteConfig,
  type RouteConfigEntry,
  index,
  route,
  prefix,
} from '@react-router/dev/routes';

function withKoIds(entries: RouteConfigEntry[]): RouteConfigEntry[] {
  return entries.map((entry) => ({
    ...entry,
    id: `ko-${entry.id ?? entry.file}`,
    children: entry.children ? withKoIds(entry.children) : entry.children,
  }));
}

const contentRoutes = [
  index('pages/Home/index.tsx'),
  route('posts', 'pages/Archive/index.tsx'),
  route('side-projects', 'pages/SideProjects/index.tsx'),
  route('privacy-policy', 'pages/PrivacyPolicy/index.tsx'),

  route('posts/aggregate-design', 'pages/Post/AggregateDesign.tsx'),
  route(
    'posts/domain-services-across-aggregates',
    'pages/Post/DomainServicesAcrossAggregates.tsx',
  ),
  route(
    'posts/talking-across-bounded-contexts',
    'pages/Post/TalkingAcrossBoundedContexts.tsx',
  ),
  route('posts/cqrs-in-practice', 'pages/Post/CqrsInPractice.tsx'),
  route(
    'posts/repository-naming-convention',
    'pages/Post/RepositoryNamingConvention.tsx',
  ),
  route(
    'posts/request-scoped-user-context',
    'pages/Post/RequestScopedUserContext.tsx',
  ),
  route('posts/observability-by-design', 'pages/Post/ObservabilityByDesign.tsx'),
  route('posts/graceful-shutdown', 'pages/Post/GracefulShutdown.tsx'),
  route(
    'posts/scheduling-and-task-outbox',
    'pages/Post/SchedulingAndTaskOutbox.tsx',
  ),
  route(
    'posts/typed-errors-and-response-schemas',
    'pages/Post/TypedErrorsAndResponseSchemas.tsx',
  ),
  route('posts/compliance-as-code', 'pages/Post/ComplianceAsCode.tsx'),
  route(
    'posts/can-an-ai-agent-follow-your-architecture',
    'pages/Post/CanAnAiAgentFollowYourArchitecture.tsx',
  ),
  route('posts/from-docs-to-runnable-code', 'pages/Post/FromDocsToRunnableCode.tsx'),
  route(
    'posts/same-architecture-five-languages',
    'pages/Post/SameArchitectureFiveLanguages.tsx',
  ),
  route('posts/finding-domain-boundaries', 'pages/Post/FindingDomainBoundaries.tsx'),
  route(
    'posts/reliable-event-driven-systems',
    'pages/Post/ReliableEventDrivenSystems.tsx',
  ),
  route(
    'posts/containerized-development-experience',
    'pages/Post/ContainerizedDevelopmentExperience.tsx',
  ),
  route('posts/auth-bypass-vulnerability', 'pages/Post/AuthBypassVulnerability.tsx'),
  route('posts/llm-technical-service', 'pages/Post/LlmTechnicalService.tsx'),
  route('posts/refund-fraud-risk-scorer', 'pages/Post/RefundFraudRiskScorer.tsx'),
  route('posts/bugs-only-e2e-tests-catch', 'pages/Post/BugsOnlyE2eTestsCatch.tsx'),
  route(
    'posts/prompt-injection-in-tool-output',
    'pages/Post/PromptInjectionInToolOutput.tsx',
  ),
  route(
    'posts/the-fraud-signal-that-trusted-the-fraudster',
    'pages/Post/TheFraudSignalThatTrustedTheFraudster.tsx',
  ),
  route('posts/narrow-what-never-who', 'pages/Post/NarrowWhatNeverWho.tsx'),
  route(
    'posts/not-every-report-needs-a-server',
    'pages/Post/NotEveryReportNeedsAServer.tsx',
  ),
  route(
    'posts/a-perfect-score-a-broken-feature',
    'pages/Post/APerfectScoreABrokenFeature.tsx',
  ),
  route(
    'posts/when-the-docs-and-the-code-agree-to-be-wrong',
    'pages/Post/WhenTheDocsAndTheCodeAgreeToBeWrong.tsx',
  ),
  route(
    'posts/the-harness-had-never-met-a-second-domain',
    'pages/Post/TheHarnessHadNeverMetASecondDomain.tsx',
  ),
  route(
    'posts/a-path-existence-checker-found-a-real-bug-on-day-one',
    'pages/Post/APathExistenceCheckerFoundARealBugOnDayOne.tsx',
  ),
  route(
    'posts/the-doc-said-done-half-of-it-wasnt',
    'pages/Post/TheDocSaidDoneHalfOfItWasnt.tsx',
  ),
  route(
    'posts/two-accounts-one-transaction-five-different-answers',
    'pages/Post/TwoAccountsOneTransactionFiveDifferentAnswers.tsx',
  ),
  route(
    'posts/the-bug-that-needed-two-subscribers-to-exist',
    'pages/Post/TheBugThatNeededTwoSubscribersToExist.tsx',
  ),
  route(
    'posts/five-bugs-nobody-was-looking-for',
    'pages/Post/FiveBugsNobodyWasLookingFor.tsx',
  ),
  route(
    'posts/the-bug-came-back-wearing-five-different-masks',
    'pages/Post/TheBugCameBackWearingFiveDifferentMasks.tsx',
  ),
  route(
    'posts/the-automation-that-was-waiting-on-itself',
    'pages/Post/TheAutomationThatWasWaitingOnItself.tsx',
  ),
  route(
    'posts/the-image-nothing-noticed-couldnt-build',
    'pages/Post/TheImageNothingNoticedCouldntBuild.tsx',
  ),
  route('posts/zero-findings-eighty-bugs', 'pages/Post/ZeroFindingsEightyBugs.tsx'),
  route('posts/an-end-to-end-test-that-wasnt', 'pages/Post/AnEndToEndTestThatWasnt.tsx'),
  route(
    'posts/the-same-instant-two-different-timestamps',
    'pages/Post/TheSameInstantTwoDifferentTimestamps.tsx',
  ),
  route(
    'posts/the-list-that-broke-five-harnesses',
    'pages/Post/TheListThatBrokeFiveHarnesses.tsx',
  ),
  route(
    'posts/two-tools-the-same-missing-root',
    'pages/Post/TwoToolsTheSameMissingRoot.tsx',
  ),
  route(
    'posts/a-benchmark-that-can-never-hit-100',
    'pages/Post/ABenchmarkThatCanNeverHit100.tsx',
  ),
  route(
    'posts/a-tied-score-two-different-kinds-of-wrong',
    'pages/Post/ATiedScoreTwoDifferentKindsOfWrong.tsx',
  ),
  route(
    'posts/the-defaults-nobody-declared',
    'pages/Post/TheDefaultsNobodyDeclared.tsx',
  ),
  route(
    'posts/the-factory-knows-where-to-put-it',
    'pages/Post/TheFactoryKnowsWhereToPutIt.tsx',
  ),
  route(
    'posts/a-rule-evans-never-wrote',
    'pages/Post/ARuleEvansNeverWrote.tsx',
  ),
];

export default [
  ...contentRoutes,
  ...prefix('ko', withKoIds(contentRoutes)),

  route('404', 'pages/NotFound/index.tsx'),
  route('*', 'pages/NotFound/index.tsx', { id: 'catch-all-not-found' }),
] satisfies RouteConfig;
