'use client';

import * as React from 'react';
import { Skeleton, Tab, TabList, Tabs } from '@wzrhine/react';
import { dedupeById } from '@wzrhine/agent-core';
import type { AgentTone, LedgerActor, LedgerEventView, StatusGlyphName } from '@wzrhine/agent-core';
import { useAgentFormat } from '../../provider/AgentMessages.js';
import { AgentEntrance } from '../../motion/agent-motion.js';
import { StatusGlyph } from '../../primitives/StatusGlyph.js';
import { AgentIcon } from '../../primitives/icons.js';
import type { AgentIconName } from '../../primitives/icons.js';
import { cx } from '../../utils/cx.js';
import type { LedgerFilterKey, LedgerOutcomeKey } from '../../provider/messages/workspace.js';
import { useIsNewId, useWorkspaceMessages } from './shared.js';
import type { WorkspaceMessagesProp } from './shared.js';

const FILTERS: LedgerFilterKey[] = ['all', 'agent', 'tool', 'system', 'user'];

const actorIcon: Record<LedgerActor, AgentIconName> = { agent: 'agent', tool: 'tool', system: 'info', user: 'at' };

const outcomeGlyph: Record<LedgerOutcomeKey, { glyph: StatusGlyphName; tone: AgentTone }> = {
  info: { glyph: 'idle', tone: 'info' },
  success: { glyph: 'done', tone: 'success' },
  warning: { glyph: 'unknown', tone: 'warning' },
  danger: { glyph: 'failed', tone: 'danger' },
  neutral: { glyph: 'idle', tone: 'neutral' },
};

/** Events in sequence order, duplicates dropped (first occurrence wins). */
export function orderLedger(events: readonly LedgerEventView[]): LedgerEventView[] {
  return dedupeById(events)
    .map((event, index) => ({ event, index }))
    .sort((a, b) => a.event.sequence - b.event.sequence || a.index - b.index)
    .map(({ event }) => event);
}

export type ActivityLedgerProps = Omit<React.HTMLAttributes<HTMLElement>, 'children'> & {
  events: LedgerEventView[];
  /** Actor filter (controlled). */
  filter?: LedgerFilterKey;
  defaultFilter?: LedgerFilterKey;
  onFilterChange?: (filter: LedgerFilterKey) => void;
  /** Opens one event; each row title becomes a button. */
  onOpenEvent?: (event: LedgerEventView) => void;
  /** First load in progress (Skeleton rows, `aria-busy`). */
  loading?: boolean;
  /** Show the filter tabs (default true). */
  showFilters?: boolean;
  messages?: WorkspaceMessagesProp;
};

/**
 * ActivityLedger (atlas 33): audit events of agent, tool, system and user in `sequence` order.
 * Filtering hides rows but never reorders them; duplicate ids are dropped. Each row has the
 * actor (icon + text), title, optional detail, a `<time dateTime>` and the outcome as glyph +
 * text. Filter tabs are `@wzrhine/react` Tabs (arrow keys, `aria-selected`).
 *
 * Motion: rows present on first render are static; rows that arrive later enter once with
 * AgentEntrance `row` (4px, fast; reduced → no movement). Nothing replays on filter changes.
 */
export const ActivityLedger = React.forwardRef<HTMLElement, ActivityLedgerProps>(function ActivityLedger(
  { events, filter, defaultFilter = 'all', onFilterChange, onOpenEvent, loading, showFilters = true, messages: override, className, ...rest },
  ref,
) {
  const m = useWorkspaceMessages(override);
  const format = useAgentFormat();
  const [innerFilter, setInnerFilter] = React.useState<LedgerFilterKey>(defaultFilter);
  const active = filter ?? innerFilter;
  const ordered = React.useMemo(() => orderLedger(events), [events]);
  const isNew = useIsNewId(ordered.map((e) => e.id));
  const visible = active === 'all' ? ordered : ordered.filter((e) => e.actor === active);
  const counts = React.useMemo(() => {
    const c: Record<LedgerFilterKey, number> = { all: ordered.length, agent: 0, tool: 0, system: 0, user: 0 };
    for (const e of ordered) c[e.actor] += 1;
    return c;
  }, [ordered]);
  const listId = React.useId();

  const change = (next: string) => {
    const key = next as LedgerFilterKey;
    if (filter === undefined) setInnerFilter(key);
    onFilterChange?.(key);
  };

  return (
    <section {...rest} ref={ref} className={cx('rl-agent-ledger', className)} aria-label={m.ledgerList} aria-busy={loading || undefined}>
      {showFilters && (
        <Tabs value={active} onValueChange={change} size="sm" variant="segmented" className="rl-agent-ledger__filters">
          <TabList aria-label={m.ledgerFilters}>
            {FILTERS.map((key) => (
              <Tab key={key} value={key} meta={counts[key]} aria-controls={listId}>
                {m.ledgerFilter[key]}
              </Tab>
            ))}
          </TabList>
        </Tabs>
      )}
      {loading && ordered.length === 0 ? (
        <div className="rl-agent-ledger__loading">
          <Skeleton lines={3} />
          <span className="rl-agent-sr">{m.ledgerLoading}</span>
        </div>
      ) : visible.length === 0 ? (
        <p className="rl-agent-ledger__empty" id={listId}>
          {ordered.length === 0 ? m.ledgerEmpty : m.ledgerEmptyFiltered}
        </p>
      ) : (
        <ol className="rl-agent-ledger__list" id={listId}>
          {visible.map((event) => {
            const outcome = event.outcome ? outcomeGlyph[event.outcome] : undefined;
            return (
              <AgentEntrance as="li" key={event.id} kind="row" animate={isNew(event.id)} className="rl-agent-ledger__row" data-actor={event.actor} data-outcome={event.outcome}>
                <span className="rl-agent-ledger__actor">
                  <AgentIcon name={actorIcon[event.actor]} />
                  <span>{m.ledgerActor[event.actor]}</span>
                </span>
                <span className="rl-agent-ledger__main">
                  {onOpenEvent ? (
                    <button type="button" className="rl-agent-ledger__title rl-agent-ledger__open" aria-label={m.ledgerOpen(event.title)} onClick={() => onOpenEvent(event)}>
                      {event.title}
                    </button>
                  ) : (
                    <span className="rl-agent-ledger__title">{event.title}</span>
                  )}
                  {event.detail && <span className="rl-agent-ledger__detail">{event.detail}</span>}
                </span>
                {outcome && (
                  <span className="rl-agent-ledger__outcome" data-tone={outcome.tone}>
                    <StatusGlyph name={outcome.glyph} tone={outcome.tone} />
                    <span>{m.ledgerOutcome[event.outcome!]}</span>
                  </span>
                )}
                <time className="rl-agent-ledger__time" dateTime={event.at}>
                  {format.time(event.at)}
                </time>
              </AgentEntrance>
            );
          })}
        </ol>
      )}
    </section>
  );
});
