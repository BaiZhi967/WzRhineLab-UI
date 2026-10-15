'use client';

import * as React from 'react';
import { usePatternsMessages } from '../provider/PatternMessages.js';
import { cx } from '../utils/cx.js';

/**
 * Section index (0.3.0-contracts §4.3 / §6.8): named anchors for record detail sections with a
 * passive current-section highlight. Anchors keep working without JS; with JS, navigation scrolls
 * inside the explicit scroll root (nearest scrolling ancestor by default) honoring a fixed header
 * offset, and smooth scrolling is opt-in and disabled under reduced motion. Observation never
 * steals focus — active navigation is `aria-current`, user intent is a separate event. The
 * observer disconnects on unmount and re-targets when the sections change; ids are caller-owned
 * and stable (never generated here).
 */
export interface SectionIndexSection {
  /** Anchor id; must match the content heading's id. Stable, not generated. */
  id: string;
  label: React.ReactNode;
}

export interface SectionIndexProps {
  sections: readonly SectionIndexSection[];
  /** Current section; kept internally (observed) when not provided. */
  activeId?: string;
  onActiveChange?: (id: string) => void;
  /** Active navigation by the user (distinct from passive observation). */
  onNavigate?: (id: string) => void;
  /** Explicit scroll root; defaults to the nearest scrolling ancestor. */
  scrollRoot?: React.RefObject<HTMLElement | null>;
  /** Fixed header offset (px) applied after scrolling a section into view. */
  offsetTop?: number;
  /** Opt-in smooth scrolling; always off under reduced motion. */
  smoothScroll?: boolean;
  /** Accessible name of the nav. */
  label?: string;
  className?: string;
}

function findScrollAncestor(node: HTMLElement | null): HTMLElement | null {
  let current = node?.parentElement ?? null;
  while (current) {
    const { overflowY } = window.getComputedStyle(current);
    if (/(auto|scroll|overlay)/.test(overflowY)) return current;
    current = current.parentElement;
  }
  return null;
}

export const SectionIndex = React.forwardRef<HTMLElement, SectionIndexProps>(function SectionIndex(
  { sections, activeId, onActiveChange, onNavigate, scrollRoot, offsetTop = 0, smoothScroll = false, label, className },
  ref,
) {
  const messages = usePatternsMessages();
  const navRef = React.useRef<HTMLElement | null>(null);
  const [observedActive, setObservedActive] = React.useState<string | null>(null);
  const current = activeId ?? observedActive;

  // Read on every navigation rather than once per mount: the preference can change while the
  // page is open, and a stale value would smooth-scroll a user who just asked for reduced motion.
  const prefersReducedMotion = () => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  };

  React.useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;
    const root = scrollRoot?.current ?? findScrollAncestor(navRef.current);
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const id = entry.target.id;
          setObservedActive((prev) => (prev === id ? prev : id));
          onActiveChange?.(id);
        }
      },
      root ? { root, rootMargin: '0px 0px -70% 0px' } : undefined,
    );

    // Section nodes can appear, move or be replaced after this effect ran (an async detail body
    // mounts its headings later). Re-target on content changes so the highlight keeps up
    // (0.3.0-contracts §4.3) — observing an already-observed element is a no-op.
    const observed = new Set<Element>();
    const retarget = () => {
      for (const section of sections) {
        const target = document.getElementById(section.id);
        if (!target || observed.has(target)) continue;
        observer.observe(target);
        observed.add(target);
      }
    };
    retarget();

    const contentRoot = root ?? document.body;
    const mutations =
      typeof MutationObserver === 'undefined'
        ? null
        : new MutationObserver(() => {
            retarget();
          });
    mutations?.observe(contentRoot, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      mutations?.disconnect();
    };
  }, [sections, scrollRoot, onActiveChange]);

  const navigate = (event: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    onNavigate?.(id);
    const target = document.getElementById(id);
    if (!target) return; // no JS-native anchor needed: let the browser jump
    event.preventDefault();
    target.scrollIntoView({ block: 'start', behavior: smoothScroll && !prefersReducedMotion() ? 'smooth' : 'auto' });
    const root = scrollRoot?.current ?? findScrollAncestor(navRef.current);
    if (root && offsetTop) root.scrollBy(0, -offsetTop);
  };

  return (
    <nav
      ref={(node) => {
        navRef.current = node;
        if (typeof ref === 'function') ref(node);
        else if (ref) ref.current = node;
      }}
      aria-label={label ?? messages.sectionIndex.region}
      className={cx('rl-section-index', className)}
      data-slot="section-index"
    >
      <ul className="rl-section-index__list">
        {sections.map((section) => (
          <li key={section.id} className="rl-section-index__item">
            <a
              href={`#${section.id}`}
              className="rl-section-index__link"
              aria-current={section.id === current ? 'true' : undefined}
              onClick={(event) => navigate(event, section.id)}
            >
              {section.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
});
