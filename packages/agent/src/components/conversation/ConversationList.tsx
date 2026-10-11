'use client';

import * as React from 'react';
import { motion } from 'motion/react';
import { Alert, Button, EmptyState, Input, Skeleton } from '@wzrhine/react';
import type { ConversationSection, ConversationView } from '@wzrhine/agent-core';
import { useAgentFormat, useAgentMessages } from '../../provider/AgentMessages.js';
import { AgentIcon } from '../../primitives/icons.js';
import { cx } from '../../utils/cx.js';
import { ConversationRow, ConversationRowContext } from './ConversationRow.js';
import type { ConversationRowListContext, ConversationRowProps } from './ConversationRow.js';

/**
 * ConversationList (atlas 03): grouped conversation index with search, selection and row actions.
 *
 * - Data in, actions out: `sections` are rendered as given (the host filters for `search`, sorts
 *   and dedupes); empty sections are skipped. Selection is `selectedId` + `onSelect`, nothing
 *   else: a background refresh (new `sections`) never changes the selection or moves focus.
 *   If the focused row disappears and focus fell back to `<body>`, focus moves to the nearest
 *   remaining row so keyboard users are not dropped at the top of the page.
 * - Structure: each group is a heading (`headingLevel`, default h2) and a `<ul>` labelled by it;
 *   rows are `<li>` with real buttons. The viewport scrolls on its own.
 * - Keyboard: one row is the Tab stop (the focused, else selected, else first row); ↑ / ↓ move
 *   focus between rows across groups, Home / End jump to the first / last row. Enter / Space
 *   select (native button). Tab from a row reaches its "more" button, then leaves the list.
 * - Search: rendered only with `onSearchChange` (labelled `type="search"` input). The result
 *   count is announced through a polite status that is mounted before the query changes.
 * - States: `loading` without items shows skeleton rows (`aria-busy`, sr text); with items it
 *   keeps them and marks the list busy. `error` shows an Alert with 「重试」 when `onRetry` is
 *   given. No items shows an EmptyState (search-empty when `search` is non-empty).
 * - Motion: one shared selection ghost glides between rows via motion/react `layoutId`, scoped
 *   per instance with `useId` (two lists never trade ghosts), on `resolve('transform', 'base')`;
 *   under reduced motion it jumps. Rows themselves never animate layout, so 300 rows stay cheap.
 */
export type ConversationListProps = Omit<React.HTMLAttributes<HTMLDivElement>, 'onSelect' | 'children'> & {
  sections: ConversationSection[];
  selectedId?: string;
  onSelect?: (id: string) => void;
  /** Controlled search query; the host filters `sections`. */
  search?: string;
  /** Renders the search input. */
  onSearchChange?: (query: string) => void;
  loading?: boolean;
  /** Error message; `true` uses the default copy. */
  error?: React.ReactNode;
  onRetry?: () => void;
  /** Extra controls per row (rendered before the "more" menu). */
  renderActions?: (item: ConversationView) => React.ReactNode;
  onPin?: ConversationRowProps['onPin'];
  onArchive?: ConversationRowProps['onArchive'];
  onUnarchive?: ConversationRowProps['onUnarchive'];
  onDelete?: ConversationRowProps['onDelete'];
  /** Rows that cannot be selected or acted on (e.g. while a switch is pending). */
  isDisabled?: (item: ConversationView) => boolean;
  /** Level of the group headings (and the empty-state title). */
  headingLevel?: 2 | 3 | 4 | 5 | 6;
  /** Accessible name of the list region. */
  label?: string;
  /** Empty state shown when there are no conversations and no search. */
  empty?: React.ReactNode;
  /** Reference time for row timestamps (default: now). */
  now?: Date;
  /** Number of skeleton rows while loading. */
  skeletonRows?: number;
};

const ROW_SELECTOR = '.rl-agent-row__main';

export const ConversationList = React.forwardRef<HTMLDivElement, ConversationListProps>(function ConversationList(
  {
    sections,
    selectedId,
    onSelect,
    search,
    onSearchChange,
    loading = false,
    error,
    onRetry,
    renderActions,
    onPin,
    onArchive,
    onUnarchive,
    onDelete,
    isDisabled,
    headingLevel = 2,
    label,
    empty,
    now,
    skeletonRows = 5,
    className,
    ...rest
  },
  ref,
) {
  const shell = useAgentMessages().shell;
  const format = useAgentFormat();
  const uid = React.useId();
  const searchId = `${uid}-search`;
  const viewportRef = React.useRef<HTMLDivElement | null>(null);
  const [focusedId, setFocusedId] = React.useState<string | null>(null);
  const lastFocused = React.useRef<{ id: string; index: number } | null>(null);

  const visible = React.useMemo(() => sections.filter((section) => section.items.length > 0), [sections]);
  const ids = React.useMemo(() => visible.flatMap((section) => section.items.map((item) => item.id)), [visible]);
  const total = ids.length;
  const query = search?.trim() ?? '';

  const tabStopId = focusedId && ids.includes(focusedId) ? focusedId : selectedId && ids.includes(selectedId) ? selectedId : (ids[0] ?? null);

  const rowContext = React.useMemo<ConversationRowListContext>(
    () => ({
      tabStopId,
      ghostId: `${uid}-ghost`,
      selectedId,
      onFocusRow: (id) => {
        setFocusedId(id);
        lastFocused.current = { id, index: ids.indexOf(id) };
      },
    }),
    [tabStopId, uid, selectedId, ids],
  );

  // A refresh that removed the focused row leaves focus on <body>: move it to the nearest row.
  React.useEffect(() => {
    const last = lastFocused.current;
    if (!last || ids.includes(last.id)) return;
    lastFocused.current = null;
    if (typeof document === 'undefined' || (document.activeElement && document.activeElement !== document.body)) return;
    const buttons = viewportRef.current?.querySelectorAll<HTMLButtonElement>(`${ROW_SELECTOR}:not(:disabled)`);
    if (!buttons || buttons.length === 0) return;
    buttons[Math.min(last.index, buttons.length - 1)]?.focus();
  }, [ids]);

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const viewport = viewportRef.current;
    const target = event.target as HTMLElement;
    // Events from portalled menus bubble through React; only handle keys from rows in this list.
    if (!viewport || !viewport.contains(target) || !target.closest('.rl-agent-row')) return;
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key) || event.altKey || event.ctrlKey || event.metaKey) return;
    const buttons = Array.from(viewport.querySelectorAll<HTMLButtonElement>(`${ROW_SELECTOR}:not(:disabled)`));
    if (buttons.length === 0) return;
    const row = target.closest('.rl-agent-row');
    const current = buttons.findIndex((button) => row?.contains(button));
    let next = current;
    if (event.key === 'ArrowDown') next = current < 0 ? 0 : Math.min(current + 1, buttons.length - 1);
    else if (event.key === 'ArrowUp') next = current < 0 ? 0 : Math.max(current - 1, 0);
    else if (event.key === 'Home') next = 0;
    else next = buttons.length - 1;
    event.preventDefault();
    const button = buttons[next];
    button?.focus();
    button?.scrollIntoView?.({ block: 'nearest' });
  };

  const Heading = `h${headingLevel}` as 'h2';
  const showSkeleton = loading && total === 0 && !error;
  const errorText = error === true ? shell.error : error;

  return (
    <div {...rest} ref={ref} className={cx('rl-agent-list', className)} data-loading={loading || undefined}>
      {onSearchChange && (
        <div className="rl-agent-list__search">
          <label htmlFor={searchId} className="rl-agent-sr">
            {shell.searchLabel}
          </label>
          <Input
            id={searchId}
            type="search"
            size="sm"
            value={search ?? ''}
            placeholder={shell.searchPlaceholder}
            prefix={<AgentIcon name="search" />}
            autoComplete="off"
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => onSearchChange(event.currentTarget.value)}
          />
          <span className="rl-agent-sr" role="status">
            {query && !loading ? shell.searchResults(format.number(total)) : ''}
          </span>
        </div>
      )}
      <motion.div
        ref={viewportRef}
        layoutScroll
        className="rl-agent-list__viewport"
        role="region"
        aria-label={label ?? shell.listLabel}
        aria-busy={loading || undefined}
        tabIndex={-1}
        onKeyDown={onKeyDown}
      >
        {errorText != null && errorText !== false && (
          <Alert
            tone="danger"
            className="rl-agent-list__error"
            title={errorText}
            action={
              onRetry ? (
                <Button size="sm" variant="secondary" onClick={onRetry}>
                  {shell.retry}
                </Button>
              ) : undefined
            }
          />
        )}
        {showSkeleton && (
          <div className="rl-agent-list__skeleton">
            <span className="rl-agent-sr">{shell.loading}</span>
            {Array.from({ length: skeletonRows }, (_, i) => (
              <div key={i} className="rl-agent-list__skeleton-row" aria-hidden="true">
                <Skeleton shape="circle" width="var(--rl-icon-size-sm)" />
                <Skeleton width={i % 2 ? '70%' : '85%'} />
              </div>
            ))}
          </div>
        )}
        {!showSkeleton && total === 0 && !errorText && (
          <div className="rl-agent-list__empty">
            {query ? (
              <EmptyState
                kind="no-results"
                size="sm"
                headingLevel={headingLevel}
                title={shell.searchEmptyTitle(query)}
                description={shell.searchEmptyDescription}
              />
            ) : (
              (empty ?? <EmptyState kind="first-use" size="sm" headingLevel={headingLevel} title={shell.emptyTitle} description={shell.emptyDescription} />)
            )}
          </div>
        )}
        <ConversationRowContext.Provider value={rowContext}>
          {visible.map((section) => {
            const headingId = `${uid}-${section.id}`;
            return (
              <div key={section.id} className="rl-agent-list__section">
                <Heading id={headingId} className="rl-agent-list__heading">
                  {section.label}
                </Heading>
                <ul className="rl-agent-list__rows" aria-labelledby={headingId}>
                  {section.items.map((item) => (
                    <ConversationRow
                      key={item.id}
                      item={item}
                      selected={item.id === selectedId}
                      disabled={isDisabled?.(item)}
                      onSelect={onSelect}
                      onPin={onPin}
                      onArchive={onArchive}
                      onUnarchive={onUnarchive}
                      onDelete={onDelete}
                      actions={renderActions?.(item)}
                      now={now}
                    />
                  ))}
                </ul>
              </div>
            );
          })}
        </ConversationRowContext.Provider>
      </motion.div>
    </div>
  );
});
