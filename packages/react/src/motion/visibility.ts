'use client';

import * as React from 'react';

/*
 * Single visibility source for every loop in WzRhineLab UI (ADR-0007): component loops and the
 * optional effects package both read these hooks, so "page hidden" means the same thing everywhere.
 */

function subscribeVisibility(onChange: () => void) {
  document.addEventListener('visibilitychange', onChange);
  return () => document.removeEventListener('visibilitychange', onChange);
}

const readVisible = () => !document.hidden;
// Server render and the hydration pass treat the page as visible.
const serverVisible = () => true;

/** True while the document is visible. Loops must pause when it turns false (MOTION.md lifecycle rule 4). */
export function usePageVisible(): boolean {
  return React.useSyncExternalStore(subscribeVisibility, readVisible, serverVisible);
}

/** True while the element intersects the viewport. Treated as visible where IntersectionObserver is unavailable. */
export function useInViewport<T extends Element>(ref: React.RefObject<T | null>): boolean {
  const [inView, setInView] = React.useState(true);
  React.useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry?.isIntersecting ?? true), { threshold: 0 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref]);
  return inView;
}
