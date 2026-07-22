import {
  HashRouter,
  Routes,
  Route,
} from 'react-router-dom';

import Home from '../pages/Home';
import Archive from '../pages/Archive';
import AggregateDesign from '../pages/Post/AggregateDesign';
import DomainServicesAcrossAggregates from '../pages/Post/DomainServicesAcrossAggregates';
import TalkingAcrossBoundedContexts from '../pages/Post/TalkingAcrossBoundedContexts';
import CqrsInPractice from '../pages/Post/CqrsInPractice';
import RepositoryNamingConvention from '../pages/Post/RepositoryNamingConvention';
import RequestScopedUserContext from '../pages/Post/RequestScopedUserContext';
import ObservabilityByDesign from '../pages/Post/ObservabilityByDesign';
import GracefulShutdown from '../pages/Post/GracefulShutdown';
import SchedulingAndTaskOutbox from '../pages/Post/SchedulingAndTaskOutbox';
import TypedErrorsAndResponseSchemas from '../pages/Post/TypedErrorsAndResponseSchemas';
import ComplianceAsCode from '../pages/Post/ComplianceAsCode';
import CanAnAiAgentFollowYourArchitecture from '../pages/Post/CanAnAiAgentFollowYourArchitecture';
import FromDocsToRunnableCode from '../pages/Post/FromDocsToRunnableCode';
import SameArchitectureFiveLanguages from '../pages/Post/SameArchitectureFiveLanguages';
import FindingDomainBoundaries from '../pages/Post/FindingDomainBoundaries';
import ReliableEventDrivenSystems from '../pages/Post/ReliableEventDrivenSystems';
import ContainerizedDevelopmentExperience from '../pages/Post/ContainerizedDevelopmentExperience';

export default function Router() {
  return (
    <HashRouter>
      <Routes>
        <Route
          path="/"
          element={<Home />}
        />
        <Route
          path="/posts"
          element={<Archive />}
        />
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
    </HashRouter>
  );
}
