'use client';

import * as React from 'react';
import type { ToolCallView } from '@wzrhine/agent-core';
import { dedupeById, toolStatusMeta } from '@wzrhine/agent-core';
import { Collapsible } from '@wzrhine/react';
import { useAgentFormat, useAgentMessages } from '../../provider/AgentMessages.js';
import { AgentSpark } from '../../primitives/AgentSpark.js';
import { AgentEntrance } from '../../motion/agent-motion.js';
import { AgentIcon } from '../../primitives/icons.js';
import { cx } from '../../utils/cx.js';
import { ToolRecord } from './ToolRecord.js';
import type { ToolRecordProps } from './ToolRecord.js';
import type { ToolDetailActions } from './ToolDetails.js';
import { ACTIVE_TOOL_STATUSES, ToolStatusPill, countStatuses, useFreshIndex } from './shared.js';

/** Dedupe by id (first occurrence wins) and order by `sequence` when every row has one. */
export function orderTools(tools: readonly ToolCallView[]): ToolCallView[] {
  const unique = dedupeById(tools);
  if (unique.every((t) => typeof t.sequence === 'number')) return unique.slice().sort((a, b) => a.sequence! - b.sequence!);
  return unique;
}

/** Props forwarded to every row. */
export type ToolRowSharedProps = Pick<ToolRecordProps, 'onLoadDetails' | 'renderDetail' | 'detailActions'> & {
  /** Load errors by tool id (`detailsError` of each row). */
  detailsErrors?: Readonly<Record<string, React.ReactNode>>;
};

/**
 * ToolActivity (atlas 11): one round of tool calls. The header is a disclosure button with the
 * operation count, the running count, elapsed time and aggregated status counts (glyph + text).
 * While any row is active an AgentSpark (executing) runs next to the count; it is decorative —
 * the running count is the text. Rows are deduped by id and ordered by `sequence`.
 *
 * Open by default while the round is active, unless the user toggled it (or `expanded` controls
 * it). Rows present at mount appear without animation; rows that arrive later get one
 * AgentEntrance (`row`, staggered, capped); a batch of more than 20 rows arrives without motion.
 * No layout animation across the list.
 */
export type ToolActivityProps = Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> &
  ToolRowSharedProps & {
    tools: readonly ToolCallView[];
    /** The round is still running. Defaults to "any row is active". */
    active?: boolean;
    /** Elapsed time of the round. */
    elapsedMs?: number;
    expanded?: boolean;
    defaultExpanded?: boolean;
    onExpandedChange?: (expanded: boolean) => void;
    /** Shows the 「完整工具记录」 link. */
    onOpenHistory?: () => void;
    /** Replace a row. Return `undefined` to use the default ToolRecord. */
    renderTool?: (tool: ToolCallView) => React.ReactNode | undefined;
    /** Controlled expanded rows by id. */
    expandedIds?: readonly string[];
    onToolExpandedChange?: (id: string, expanded: boolean) => void;
    /** Header title override (default 「N 个操作」). */
    title?: React.ReactNode;
  };

export const ToolActivity = React.forwardRef<HTMLDivElement, ToolActivityProps>(function ToolActivity(
  {
    tools,
    active: activeProp,
    elapsedMs,
    expanded,
    defaultExpanded,
    onExpandedChange,
    onOpenHistory,
    renderTool,
    expandedIds,
    onToolExpandedChange,
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
  const messages = useAgentMessages();
  const m = messages.tools;
  const fmt = useAgentFormat();
  const rows = React.useMemo(() => orderTools(tools), [tools]);
  const freshIndex = useFreshIndex(rows.map((r) => r.id));
  // "Running" = activity in progress (queued / running / waiting for children); a round waiting
  // for approval or an answer is still unsettled (open by default) but shows no spark.
  const running = rows.filter((r) => toolStatusMeta[r.status]?.active).length;
  const active = activeProp ?? rows.some((r) => ACTIVE_TOOL_STATUSES.includes(r.status));
  const [userOpen, setUserOpen] = React.useState<boolean | undefined>(defaultExpanded);
  const open = expanded ?? userOpen ?? active;
  const counts = countStatuses(rows.map((r) => r.status));

  const setOpen = (next: boolean) => {
    if (expanded === undefined) setUserOpen(next);
    onExpandedChange?.(next);
  };

  const header = (
    <span className="rl-agent-activity__header">
      {running > 0 && <AgentSpark phase="executing" className="rl-agent-activity__spark" />}
      <span className="rl-agent-activity__title">{title ?? m.operationCount(rows.length)}</span>
      {running > 0 && <span className="rl-agent-activity__running">{m.runningCount(running)}</span>}
      {elapsedMs != null && <span className="rl-agent-activity__elapsed">{messages.status.elapsed(fmt.duration(elapsedMs))}</span>}
      {counts.length > 0 && (
        <span className="rl-agent-activity__counts">
          {counts.map(([status, n]) => (
            <ToolStatusPill key={status} status={status} meta={n} />
          ))}
        </span>
      )}
    </span>
  );

  return (
    <div {...rest} ref={ref} className={cx('rl-agent-activity', className)} data-active={active || undefined}>
      <Collapsible
        open={open}
        onOpenChange={setOpen}
        trigger={header}
        triggerProps={{ className: 'rl-agent-activity__trigger' }}
        panelClassName="rl-agent-activity__panel"
      >
        <ul className="rl-agent-tool-list" aria-label={m.activityList}>
          {rows.map((tool) => {
            const index = freshIndex(tool.id);
            const custom = renderTool?.(tool);
            return (
              <AgentEntrance
                key={tool.id}
                as="li"
                kind="row"
                animate={index >= 0}
                index={Math.max(0, index)}
                className="rl-agent-tool-list__item"
              >
                {custom !== undefined ? (
                  custom
                ) : (
                  <ToolRecord
                    tool={tool}
                    expanded={expandedIds ? expandedIds.includes(tool.id) : undefined}
                    onExpandedChange={onToolExpandedChange ? (next) => onToolExpandedChange(tool.id, next) : undefined}
                    onLoadDetails={onLoadDetails}
                    detailsError={detailsErrors?.[tool.id]}
                    renderDetail={renderDetail}
                    detailActions={detailActions as ToolDetailActions | undefined}
                  />
                )}
              </AgentEntrance>
            );
          })}
        </ul>
        {onOpenHistory && (
          <div className="rl-agent-activity__footer">
            <button type="button" className="rl-agent-tool-button" onClick={onOpenHistory}>
              <AgentIcon name="history" />
              <span className="rl-agent-tool-button__text">{m.openHistory}</span>
            </button>
          </div>
        )}
      </Collapsible>
    </div>
  );
});
