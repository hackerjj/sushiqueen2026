import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPageView, trackViewContent } from '../services/analytics';

/**
 * Hook that tracks page views on every route change.
 * Also fires ViewContent on the /menu route.
 */
export function usePageTracking(): void {
  const location = useLocation();

  useEffect(() => {
    trackPageView(location.pathname);

    // Track ViewContent when visiting menu page
    if (location.pathname === '/menu') {
      trackViewContent('Menu', 'menu');
    }
  }, [location.pathname]);
}
