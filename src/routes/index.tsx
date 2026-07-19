import {
  HashRouter,
  Routes,
  Route,
} from 'react-router-dom';

import Home from '../pages/Home';
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
