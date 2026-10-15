'use client';

import * as React from 'react';
import { usePatternsMessages } from '../provider/PatternMessages.js';
import { cx } from '../utils/cx.js';

/**
 * Section index (0.3.0-contracts §4.3 / §6.8): named anchors for record detail sections with a
 * passive current-section highlight. Anchors keep working without JS; with JS, a plain click is
 * enhanced into a scroll inside the explicit scroll root (nearest scrolling ancestor by default,
 * the viewport when there is none) honoring a fixed header offset, and smooth scrolling is opt-in
 * and disabled under reduced motion. Modified clicks (Ctrl/Meta/Shift/Alt, middle button) are left
 * to the browser, so "open in new tab" still works. Observation never steals focus — the active
 * section is `aria-current`, user intent is a separate event.
 *
 * The current section is the first visible one in `sections` order, so leaving a section hands the
 * highlight back to whatever is still on screen. Targets are re-resolved when the content changes
 * and replaced nodes are unobserved, so the observed set stays bounded across repeated swaps.
 *
 * Caller-owned ids must be stable and must match the heading ids (never generated here). Under a
 * hash router, note that these anchors use `href="#<id>"`: when the target is missing the native
 * jump is allowed through, which changes `location.hash` and can trigger a route change. Keep
 * section ids rendered alongside the index, or own navigation via `onNavigate`.
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
    const order = sections.map((section) => section.id);

    // The current section is the first *visible* one in declaration order, not the most recent
    // enter event: an exit has to hand the highlight back to whatever is still on screen
    // (0.3.0-contracts §4.3). Keeping a candidate set means leaving a section returns to the
    // previous one without waiting for the browser to re-emit an enter event for it.
    const visible = new Set<string>();
    // Section nodes can appear, move or be replaced after this effect ran (an async detail body
    // mounts its headings later), so targets are re-resolved on content changes. This map is the
    // single source of truth for "the node currently observed for this id": a replaced heading
    // keeps its id but is a new node, and the retired one must neither stay observed nor keep
    // reporting visibility (0.3.0-contracts §4.3).
    const observed = new Map<string, Element>();

    const pickActive = () => {
      if (visible.size === 0) return; // nothing on screen: keep the last known section
      const next = order.find((id) => visible.has(id));
      if (!next) return;
      setObservedActive((prev) => {
        if (prev === next) return prev;
        onActiveChange?.(next);
        return next;
      });
    };

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = entry.target.id;
          // Drop late entries from a node that has already been replaced or disconnected.
          if (observed.get(id) !== entry.target) continue;
          if (entry.isIntersecting) visible.add(id);
          else visible.delete(id);
        }
        pickActive();
      },
      root ? { root, rootMargin: '0px 0px -70% 0px' } : undefined,
    );

    const retarget = () => {
      let changed = false;
      const drop = (id: string, node: Element) => {
        observer.unobserve(node);
        observed.delete(id);
        if (visible.delete(id)) changed = true;
      };
      for (const id of order) {
        const target = document.getElementById(id);
        const previous = observed.get(id);
        if (previous === target) continue;
        if (previous) drop(id, previous);
        if (target) {
          observer.observe(target);
          observed.set(id, target);
        }
      }
      // A node can also disconnect without being replaced by one with the same id.
      for (const [id, node] of [...observed]) {
        if (!node.isConnected) drop(id, node);
      }
      if (changed) pickActive();
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
    // Only plain primary-button clicks are enhanced. Ctrl/Meta (new tab), Shift (new window),
    // Alt (download) and middle/right clicks keep the anchor's native behaviour — cancelling
    // them would silently break "open in new tab" on a real link (WAI-ARIA link pattern).
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }
    onNavigate?.(id);
    const target = document.getElementById(id);
    if (!target) return; // no JS-native anchor needed: let the browser jump
    event.preventDefault();
    target.scrollIntoView({ block: 'start', behavior: smoothScroll && !prefersReducedMotion() ? 'smooth' : 'auto' });
    if (!offsetTop) return;
    // A fixed header overlaps the target by `offsetTop`, so scroll back by that much. Which
    // thing actually scrolled depends on the mode: an explicit/ancestor scroll root in the
    // container case, the viewport when the whole page scrolls.
    const root = scrollRoot?.current ?? findScrollAncestor(navRef.current);
    if (root) root.scrollBy(0, -offsetTop);
    else if (typeof window !== 'undefined' && typeof window.scrollBy === 'function') window.scrollBy(0, -offsetTop);
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
