'use client';

import * as React from 'react';
import type { ToolCallView } from '@wzrhine/agent-core';
import { Collapsible } from '@wzrhine/react';
import { useAgentMessages } from '../../provider/AgentMessages.js';
import { cx } from '../../utils/cx.js';
import { ToolRecord } from './ToolRecord.js';
import type { ToolRowSharedProps } from './ToolActivity.js';
import { ActionButton, Notice } from './shared.js';

/**
 * Append-only order for paged history: rows already shown keep their position; new ids are
 * appended (sorted by `sequence` among themselves). Duplicates — the same id on two pages, or a
 * live row replayed into history — are dropped; the latest data for a known id replaces its
 * content but not its place.
 */
export function useStableOrder(items: readonly ToolCallView[]): ToolCallView[] {
  const order = React.useRef<string[]>([]);
  const latest = new Map<string, ToolCallView>();
  for (const item of items) if (!latest.has(item.id)) latest.set(item.id, item);
  const known = new Set(order.current);
  const added = [...latest.values()].filter((t) => !known.has(t.id));
  if (added.every((t) => typeof t.sequence === 'number')) added.sort((a, b) => a.sequence! - b.sequence!);
  const ids = [...order.current.filter((id) => latest.has(id)), ...added.map((t) => t.id)];
  React.useEffect(() => {
    order.current = ids;
  });
  return ids.map((id) => latest.get(id)!);
}

/**
 * ToolHistory (atlas 46): 「完整工具记录」 disclosure listing every loaded page. Rows are
 * deduped by id across pages and never reordered once read; a load error keeps the loaded rows
 * and offers 「加载更多」 again (no retry loop). The count says how many are loaded (and the total
 * when the adapter knows it). Rows mount without entrance motion (history is restored, not new).
 * `onOpenOperation` adds a 「在对话中定位」 button beside each row.
 */
export type ToolHistoryProps = Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> &
  ToolRowSharedProps & {
    /** All loaded rows (pages concatenated; duplicates allowed, they are dropped here). */
    items: readonly ToolCallView[];
    total?: number;
    hasMore?: boolean;
    loading?: boolean;
    error?: React.ReactNode;
    onLoadMore?: () => void;
    onOpenOperation?: (id: string) => void;
    expanded?: boolean;
    defaultExpanded?: boolean;
    onExpandedChange?: (expanded: boolean) => void;
    title?: React.ReactNode;
  };

export const ToolHistory = React.forwardRef<HTMLDivElement, ToolHistoryProps>(function ToolHistory(
  {
    items,
    total,
    hasMore,
    loading,
    error,
    onLoadMore,
    onOpenOperation,
    expanded,
    defaultExpanded = false,
    onExpandedChange,
    title,
    onLoadDetails,
    renderDetail,
    detailActions,
    detailsErrors,
    className,
    ...rest
  },
  ref,
) {
  const m = useAgentMessages().tools;
  const rows = useStableOrder(items);
  const countText = total != null ? m.historyTotal(rows.length, total) : m.historyLoaded(rows.length);
  return (
    <div {...rest} ref={ref} className={cx('rl-agent-history', className)}>
      <Collapsible
        open={expanded}
        defaultOpen={defaultExpanded}
        onOpenChange={onExpandedChange}
        trigger={
          <span className="rl-agent-history__header">
            <span className="rl-agent-history__title">{title ?? m.historyTitle}</span>
            <span className="rl-agent-history__count">{countText}</span>
          </span>
        }
        triggerProps={{ className: 'rl-agent-history__trigger' }}
      >
        <div className="rl-agent-history__body" aria-busy={loading || undefined}>
          {rows.length === 0 && !loading && !error && <p className="rl-agent-detail__aside">{m.historyEmpty}</p>}
          {rows.length > 0 && (
            <ul className="rl-agent-tool-list" aria-label={m.historyList}>
              {rows.map((tool) => (
                <li key={tool.id} className="rl-agent-tool-list__item">
                  <ToolRecord
                    tool={tool}
                    onLoadDetails={onLoadDetails}
                    detailsError={detailsErrors?.[tool.id]}
                    renderDetail={renderDetail}
                    detailActions={detailActions}
                    actions={
                      onOpenOperation && (
                        <button
                          type="button"
                          className="rl-agent-tool-button"
                          aria-label={`${m.openOperation} · ${tool.displayName ?? tool.name}${tool.subject ? ` ${tool.subject}` : ''}`}
                          onClick={() => onOpenOperation(tool.id)}
                        >
                          <span className="rl-agent-tool-button__text">{m.openOperation}</span>
                        </button>
                      )
                    }
                  />
                </li>
              ))}
            </ul>
          )}
          <p className="rl-agent-history__status" role="status">
            {loading ? m.historyLoading : ''}
          </p>
          {error != null && error !== false && <Notice tone="danger">{error === true ? m.historyError : error}</Notice>}
          {hasMore && onLoadMore && (
            <div className="rl-agent-detail__actions">
              <ActionButton icon="arrow-down" onClick={onLoadMore} busy={loading}>
                {m.historyLoadMore}
              </ActionButton>
            </div>
          )}
        </div>
      </Collapsible>
    </div>
  );
});
