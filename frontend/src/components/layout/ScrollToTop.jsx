import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * ScrollToTop - Automatically scrolls viewport to top (0, 0) upon route changes.
 * Preserves anchor hash scrolling if a specific element fragment is requested.
 */
export const ScrollToTop = () => {
  const { pathname, search, hash } = useLocation();

  useEffect(() => {
    if (!hash) {
      window.scrollTo(0, 0);
    }
  }, [pathname, search, hash]);

  return null;
};

export default ScrollToTop;
