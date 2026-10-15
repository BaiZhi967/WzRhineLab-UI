'use client';

import * as React from 'react';
import { Button, Input } from '@wzrhine/react';
import { usePatternsMessages } from '../provider/PatternMessages.js';
import { cx } from '../utils/cx.js';

/**
 * Query toolbar (0.3.0-contracts §4.4 / §6.3): layout, control grouping, result summary and reset
 * for a collection view. No filter DSL of its own — filter controls go into `children`.
 *
 * The search input keeps the value being typed (`pending`) separate from the committed `query`;
 * submission is an explicit act (Enter / button / empty commit), never search-as-you-type.
 * During Chinese IME composition Enter does not submit: Chrome reports the committing keydown
 * with isComposing, Safari fires compositionend first — the very next Enter is swallowed and the
 * guard clears on keyup, so only a genuinely later press submits.
 */
export interface QueryToolbarProps {
  /** Committed query (controlled); the caller decides when to accept a submission. */
  query?: string;
  defaultQuery?: string;
  onQueryChange?: (query: string) => void;
  /** Value being typed; kept internally when not provided. Synced when the caller changes `query`. */
  pendingQuery?: string;
  onPendingQueryChange?: (value: string) => void;
  searchLabel?: string;
  searchPlaceholder?: string;
  /** Accessible name of the search region; defaults to the built-in copy. */
  toolbarLabel?: string;
  submitLabel?: string;
  /** Result summary, announced politely (role="status"), e.g. "共 128 条结果". */
  resultSummary?: React.ReactNode;
  /** Reset clears query and filters and resets paging — executed by the caller. */
  onReset?: () => void;
  resetLabel?: string;
  resetDisabled?: boolean;
  /** A commit is in flight: submit/reset disabled, the typed value stays. */
  busy?: boolean;
  /** Filter control slots (Combobox, Select, custom). */
  children?: React.ReactNode;
  className?: string;
}

export const QueryToolbar = React.forwardRef<HTMLDivElement, QueryToolbarProps>(function QueryToolbar(
  {
    query,
    defaultQuery = '',
    onQueryChange,
    pendingQuery,
    onPendingQueryChange,
    searchLabel,
    searchPlaceholder,
    toolbarLabel,
    submitLabel,
    resultSummary,
    onReset,
    resetLabel,
    resetDisabled = false,
    busy = false,
    children,
    className,
  },
  ref,
) {
  const messages = usePatternsMessages();
  const [internalPending, setInternalPending] = React.useState(query ?? defaultQuery);
  const pending = pendingQuery ?? internalPending;

  // The caller accepted a new committed query (or reset it): follow it so a reset also clears
  // the typed value. Typing alone never re-runs this — `query` did not change.
  const lastQueryRef = React.useRef(query);
  React.useEffect(() => {
    if (query !== lastQueryRef.current) {
      lastQueryRef.current = query;
      setInternalPending(query ?? '');
    }
  }, [query]);

  const composingRef = React.useRef(false);
  const justEndedRef = React.useRef(false);
  const justEndedTimer = React.useRef<number | undefined>(undefined);
  React.useEffect(() => () => window.clearTimeout(justEndedTimer.current), []);

  // `busy` is announced with aria-disabled, not the native attribute, so the control keeps focus
  // while a query is in flight (0.3.0-contracts §4.2; same contract as Pagination). Every entry
  // point therefore has to drop the action itself.
  const commit = () => {
    if (busy) return;
    onQueryChange?.(pending);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter') return;
    if (event.nativeEvent.isComposing || composingRef.current) return;
    if (justEndedRef.current) {
      // Enter that committed the composition (Safari fires compositionend first): swallow it,
      // then clear on keyup or the next macrotask so a genuinely later press submits.
      justEndedRef.current = false;
      return;
    }
    commit();
  };

  const handleCompositionEnd = () => {
    composingRef.current = false;
    justEndedRef.current = true;
    window.clearTimeout(justEndedTimer.current);
    justEndedTimer.current = window.setTimeout(() => {
      justEndedRef.current = false;
    }, 0);
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInternalPending(event.target.value);
    onPendingQueryChange?.(event.target.value);
  };

  return (
    <div
      ref={ref}
      role="search"
      aria-label={toolbarLabel ?? messages.queryToolbar.region}
      className={cx('rl-query-toolbar', className)}
      data-slot="query-toolbar"
      data-busy={busy || undefined}
    >
      <div className="rl-query-toolbar__search">
        <Input
          type="search"
          value={pending}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onKeyUp={() => {
            justEndedRef.current = false;
          }}
          onCompositionStart={() => {
            composingRef.current = true;
          }}
          onCompositionEnd={handleCompositionEnd}
          aria-label={searchLabel ?? messages.queryToolbar.search}
          placeholder={searchPlaceholder ?? messages.queryToolbar.placeholder}
          className="rl-query-toolbar__input"
        />
        <Button
          type="button"
          variant="secondary"
          // `loading` is the react package's in-flight entry: it keeps the control focusable via
          // aria-disabled instead of the native attribute (0.3.0-contracts §4.2).
          loading={busy}
          onClick={commit}
        >
          {submitLabel ?? messages.queryToolbar.submit}
        </Button>
      </div>
      {children != null && <div className="rl-query-toolbar__filters">{children}</div>}
      {onReset && (
        <Button
          type="button"
          variant="ghost"
          // `resetDisabled` means there is nothing to reset: native disabled is correct. `busy`
          // is transient, so it stays focusable and only drops the action.
          disabled={resetDisabled}
          loading={busy}
          onClick={onReset}
        >
          {resetLabel ?? messages.queryToolbar.reset}
        </Button>
      )}
      {resultSummary != null && (
        <p className="rl-query-toolbar__summary" role="status">
          {resultSummary}
        </p>
      )}
    </div>
  );
});
