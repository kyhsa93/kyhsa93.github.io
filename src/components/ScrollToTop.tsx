import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// BrowserRouter's client-side navigation doesn't reset scroll position the way a full page
// load does, so without this, clicking a Link can land mid-scroll on whatever position the
// previous page was left at.
export function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
