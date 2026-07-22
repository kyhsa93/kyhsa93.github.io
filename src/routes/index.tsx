import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import { AdConsentProvider } from '../lib/adConsent';
import { ConsentBanner } from '../components/ConsentBanner';
import { ScrollToTop } from '../components/ScrollToTop';
import { RouteLoading } from '../components/RouteLoading';
import Home from '../pages/Home';
import Archive from '../pages/Archive';

const PrivacyPolicy = lazy(() => import('../pages/PrivacyPolicy'));
const AggregateDesign = lazy(() => import('../pages/Post/AggregateDesign'));
const DomainServicesAcrossAggregates = lazy(
  () => import('../pages/Post/DomainServicesAcrossAggregates'),
);
const TalkingAcrossBoundedContexts = lazy(
  () => import('../pages/Post/TalkingAcrossBoundedContexts'),
);
const CqrsInPractice = lazy(() => import('../pages/Post/CqrsInPractice'));
const RepositoryNamingConvention = lazy(
  () => import('../pages/Post/RepositoryNamingConvention'),
);
const RequestScopedUserContext = lazy(
  () => import('../pages/Post/RequestScopedUserContext'),
);
const ObservabilityByDesign = lazy(
  () => import('../pages/Post/ObservabilityByDesign'),
);
const GracefulShutdown = lazy(() => import('../pages/Post/GracefulShutdown'));
const SchedulingAndTaskOutbox = lazy(
  () => import('../pages/Post/SchedulingAndTaskOutbox'),
);
const TypedErrorsAndResponseSchemas = lazy(
  () => import('../pages/Post/TypedErrorsAndResponseSchemas'),
);
const ComplianceAsCode = lazy(() => import('../pages/Post/ComplianceAsCode'));
const CanAnAiAgentFollowYourArchitecture = lazy(
  () => import('../pages/Post/CanAnAiAgentFollowYourArchitecture'),
);
const FromDocsToRunnableCode = lazy(
  () => import('../pages/Post/FromDocsToRunnableCode'),
);
const SameArchitectureFiveLanguages = lazy(
  () => import('../pages/Post/SameArchitectureFiveLanguages'),
);
const FindingDomainBoundaries = lazy(
  () => import('../pages/Post/FindingDomainBoundaries'),
);
const ReliableEventDrivenSystems = lazy(
  () => import('../pages/Post/ReliableEventDrivenSystems'),
);
const ContainerizedDevelopmentExperience = lazy(
  () => import('../pages/Post/ContainerizedDevelopmentExperience'),
);

export default function Router() {
  return (
    <BrowserRouter>
      <AdConsentProvider>
        <ScrollToTop />
        <Suspense fallback={<RouteLoading />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/posts" element={<Archive />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route
              path="/posts/aggregate-design"
              element={<AggregateDesign />}
            />
            <Route
              path="/posts/domain-services-across-aggregates"
              element={<DomainServicesAcrossAggregates />}
            />
            <Route
              path="/posts/talking-across-bounded-contexts"
              element={<TalkingAcrossBoundedContexts />}
            />
            <Route
              path="/posts/cqrs-in-practice"
              element={<CqrsInPractice />}
            />
            <Route
              path="/posts/repository-naming-convention"
              element={<RepositoryNamingConvention />}
            />
            <Route
              path="/posts/request-scoped-user-context"
              element={<RequestScopedUserContext />}
            />
            <Route
              path="/posts/observability-by-design"
              element={<ObservabilityByDesign />}
            />
            <Route
              path="/posts/graceful-shutdown"
              element={<GracefulShutdown />}
            />
            <Route
              path="/posts/scheduling-and-task-outbox"
              element={<SchedulingAndTaskOutbox />}
            />
            <Route
              path="/posts/typed-errors-and-response-schemas"
              element={<TypedErrorsAndResponseSchemas />}
            />
            <Route
              path="/posts/compliance-as-code"
              element={<ComplianceAsCode />}
            />
            <Route
              path="/posts/can-an-ai-agent-follow-your-architecture"
              element={<CanAnAiAgentFollowYourArchitecture />}
            />
            <Route
              path="/posts/from-docs-to-runnable-code"
              element={<FromDocsToRunnableCode />}
            />
            <Route
              path="/posts/same-architecture-five-languages"
              element={<SameArchitectureFiveLanguages />}
            />
            <Route
              path="/posts/finding-domain-boundaries"
              element={<FindingDomainBoundaries />}
            />
            <Route
              path="/posts/reliable-event-driven-systems"
              element={<ReliableEventDrivenSystems />}
            />
            <Route
              path="/posts/containerized-development-experience"
              element={<ContainerizedDevelopmentExperience />}
            />
          </Routes>
        </Suspense>
        <ConsentBanner />
      </AdConsentProvider>
    </BrowserRouter>
  );
}
