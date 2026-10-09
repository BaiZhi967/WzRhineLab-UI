import * as React from 'react';

/** Tracks document visibility so loops stop on hidden tabs (MOTION.md lifecycle rule 4). */
export function usePageVisible(): boolean {
  const [visible, setVisible] = React.useState(() => typeof document === 'undefined' || !document.hidden);
  React.useEffect(() => {
    const update = () => setVisible(!document.hidden);
    document.addEventListener('visibilitychange', update);
    return () => document.removeEventListener('visibilitychange', update);
  }, []);
  return visible;
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
