'use client';

import * as React from 'react';
import { usePatternsMessages } from '../provider/PatternMessages.js';
import { cx } from '../utils/cx.js';

/**
 * Embeddable master-detail layout (0.3.0-contracts §4.1 / §6.1).
 *
 * Not an app shell: no nav, no second main landmark, several instances per page are fine.
 * The list and detail regions each own their scrolling; overlay mode keeps the list mounted
 * (hidden and inert) so its scroll position survives an open/close round trip.
 * SSR renders the deterministic `split` structure; `auto` measures its own container after
 * mount — the global window width is never read.
 */
export type ListDetailMode = 'split' | 'overlay';

export interface ListDetailProps {
  /** Collection region content: a DataTable, ResourceGrid or any custom list. */
  list: React.ReactNode;
  /** Detail region content; rendered only while `detailId` is non-null. */
  detail: React.ReactNode;
  /** Controlled open record id; `null` = closed. */
  detailId?: string | null;
  defaultDetailId?: string | null;
  onDetailChange?: (id: string | null) => void;
  /** `'auto'` (default) resolves from the container width; explicit values never measure. */
  mode?: 'auto' | ListDetailMode;
  /** Container width threshold (px) for `auto`; at or above it the layout is `split`. */
  modeThreshold?: number;
  onModeResolve?: (mode: ListDetailMode) => void;
  /** Text of the back (overlay) / close (split) entry in the detail bar. */
  backLabel?: string;
  /** Accessible names of the list and detail regions. */
  listLabel?: string;
  detailLabel?: string;
  className?: string;
}

export const ListDetail = React.forwardRef<HTMLDivElement, ListDetailProps>(function ListDetail(
  {
    list,
    detail,
    detailId,
    defaultDetailId = null,
    onDetailChange,
    mode = 'auto',
    modeThreshold = 720,
    onModeResolve,
    backLabel,
    listLabel,
    detailLabel,
    className,
  },
  ref,
) {
  const messages = usePatternsMessages();
  const rootRef = React.useRef<HTMLDivElement | null>(null);
  const listRef = React.useRef<HTMLElement | null>(null);
  const backRef = React.useRef<HTMLButtonElement | null>(null);

  const [uncontrolledId, setUncontrolledId] = React.useState<string | null>(defaultDetailId);
  const isControlled = detailId !== undefined;
  const currentId = isControlled ? detailId : uncontrolledId;
  const open = currentId != null;

  // --- mode resolution ------------------------------------------------------
  // Initial render is always `split` (SSR contract); `auto` measures after mount and may flip.
  const [measuredMode, setMeasuredMode] = React.useState<ListDetailMode | null>(null);
  const resolvedMode: ListDetailMode = mode === 'auto' ? (measuredMode ?? 'split') : mode;

  React.useEffect(() => {
    if (mode !== 'auto') return;
    const node = rootRef.current;
    if (!node) return;
    const apply = (width: number) => {
      const next: ListDetailMode = width >= modeThreshold ? 'split' : 'overlay';
      setMeasuredMode((prev) => (prev === next ? prev : next));
    };
    apply(node.getBoundingClientRect().width || node.offsetWidth || 0);
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[entries.length - 1];
      if (entry) apply(entry.contentRect.width);
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [mode, modeThreshold]);

  React.useEffect(() => {
    onModeResolve?.(resolvedMode);
  }, [onModeResolve, resolvedMode]);

  // In overlay mode the detail replaces the list view; the list stays mounted (scroll position)
  // but is hidden and inert so it keeps no focusable controls (0.3.0-contracts §4.1).
  const hideList = resolvedMode === 'overlay' && open;

  // --- focus contract (§4.1–4.2) --------------------------------------------
  // While closed, remember the last focused element inside the list (focusin keeps the record
  // current regardless of render timing). Closing restores it, or falls back to the list region
  // when the trigger was filtered out or removed in the meantime.
  const lastListFocus = React.useRef<HTMLElement | null>(null);
  React.useEffect(() => {
    const listNode = listRef.current;
    if (!listNode || open) return;
    const onFocusIn = () => {
      const active = document.activeElement;
      if (active instanceof HTMLElement && listNode.contains(active)) lastListFocus.current = active;
    };
    listNode.addEventListener('focusin', onFocusIn);
    return () => listNode.removeEventListener('focusin', onFocusIn);
  }, [open]);

  // Opening focuses the explicit back entry; the switch itself is synchronous, so a rapid
  // record change (id changes while already open) neither queues nor replays a stale focus job.
  const wasOpenRef = React.useRef(open);
  React.useLayoutEffect(() => {
    const wasOpen = wasOpenRef.current;
    wasOpenRef.current = open;
    if (open === wasOpen) return;
    if (open) {
      backRef.current?.focus();
      return;
    }
    const restore = lastListFocus.current;
    if (restore && restore.isConnected && !restore.hasAttribute('disabled')) restore.focus();
    else listRef.current?.focus();
  }, [open]);

  const requestClose = () => {
    if (!isControlled) setUncontrolledId(null);
    onDetailChange?.(null);
  };

  const setRoot = (node: HTMLDivElement | null) => {
    rootRef.current = node;
    if (typeof ref === 'function') ref(node);
    else if (ref) ref.current = node;
  };

  return (
    <div
      ref={setRoot}
      className={cx('rl-list-detail', className)}
      data-slot="list-detail"
      data-mode={resolvedMode}
      data-open={open || undefined}
    >
      <section
        ref={listRef}
        className="rl-list-detail__list"
        aria-label={listLabel ?? messages.listDetail.list}
        tabIndex={-1}
        inert={hideList || undefined}
      >
        {list}
      </section>
      {open && (
        <section className="rl-list-detail__detail" aria-label={detailLabel ?? messages.listDetail.detail}>
          <div className="rl-list-detail__detail-bar">
            <button ref={backRef} type="button" className="rl-list-detail__back" onClick={requestClose}>
              <svg className="rl-list-detail__back-icon" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
                <path d="M10 3.5 5.5 8l4.5 4.5" />
              </svg>
              <span className="rl-list-detail__back-label">{backLabel ?? messages.listDetail.back}</span>
            </button>
          </div>
          <div className="rl-list-detail__detail-body">{detail}</div>
        </section>
      )}
    </div>
  );
});
