import { useEffect, useState } from 'react';

/**
 * UI-only media query hook. Safe in tests/SSR (returns false if matchMedia missing).
 */
export function useMediaQuery(query: string): boolean {
  const get = () => {
    if (typeof window === 'undefined') return false;
    if (typeof window.matchMedia !== 'function') return false;
    return window.matchMedia(query).matches;
  };

  const [matches, setMatches] = useState(get);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (typeof window.matchMedia !== 'function') return;

    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);

    // Initialize
    setMatches(mql.matches);

    // Modern browsers
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [query]);

  return matches;
}


