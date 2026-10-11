'use client';

import * as React from 'react';
import { Button, Collapsible } from '@wzrhine/react';
import type { AgentActionHandler, AgentTone, StatusGlyphName } from '@wzrhine/agent-core';
import { useAgentFormat } from '../../provider/AgentMessages.js';
import { AgentSpark } from '../../primitives/AgentSpark.js';
import { StatusGlyph } from '../../primitives/StatusGlyph.js';
import { cx } from '../../utils/cx.js';
import type { CompactionPhase, CompactionStatus } from '../../provider/messages/workspace.js';
import { useWorkspaceMessages } from './shared.js';
import type { WorkspaceMessagesProp } from './shared.js';

export type { CompactionPhase, CompactionStatus };

export type CompactionNoticeProps = Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> & {
  status: CompactionStatus;
  /** Sub-step of a running compaction, shown as a sub-label. */
  phase?: CompactionPhase;
  /** Hint after a failed / interrupted compaction; default 「可输入 /compact 重试」. `null` hides it. */
  retryHint?: React.ReactNode;
  tokensBefore?: number;
  tokensAfter?: number;
  /** Elapsed time of a running compaction (the host updates it; nothing polls here). */
  elapsedMs?: number;
  /** Text of the compaction summary (plain text, or markdown through `renderMarkdown`). */
  summary?: string;
  renderMarkdown?: (source: string) => React.ReactNode;
  /** Cancels a running compaction. */
  onCancel?: AgentActionHandler;
  /** Retries saving the result (`save-pending`). */
  onRetrySave?: AgentActionHandler;
  /** Summary disclosure (controlled). */
  summaryOpen?: boolean;
  onSummaryOpenChange?: (open: boolean) => void;
  /** Busy flag for the buttons while an action is being submitted. */
  busy?: boolean;
  messages?: WorkspaceMessagesProp;
};

const settledGlyph: Record<Exclude<CompactionStatus, 'running'>, { glyph: StatusGlyphName; tone: AgentTone }> = {
  completed: { glyph: 'compacting', tone: 'success' },
  cancelled: { glyph: 'stopped', tone: 'neutral' },
  failed: { glyph: 'failed', tone: 'danger' },
  interrupted: { glyph: 'unknown', tone: 'warning' },
  'save-pending': { glyph: 'saving', tone: 'warning' },
};

/**
 * CompactionNotice (Wpi context compaction bar): a strip in the message flow for one context
 * compaction. Running: AgentSpark (executing rhythm) + 「正在整理上下文」 + elapsed + cancel.
 * Completed: token delta 「32K → 12K token」 and an optional summary disclosure (Collapsible).
 * `phase` adds a sub-label while running (「准备中」 / 「正在生成摘要」 / 「正在保存结果」).
 * Failed and interrupted (the run stopped before the compaction settled; the old context is kept)
 * show `retryHint`, default 「可输入 /compact 重试」. Save pending: 「重试保存」. The title is a polite
 * status, so the transition to a settled state is announced once.
 */
export const CompactionNotice = React.forwardRef<HTMLDivElement, CompactionNoticeProps>(function CompactionNotice(
  {
    status,
    phase,
    retryHint,
    tokensBefore,
    tokensAfter,
    elapsedMs,
    summary,
    renderMarkdown,
    onCancel,
    onRetrySave,
    summaryOpen,
    onSummaryOpenChange,
    busy,
    messages: override,
    className,
    ...rest
  },
  ref,
) {
  const m = useWorkspaceMessages(override);
  const format = useAgentFormat();
  const running = status === 'running';
  const delta = tokensBefore !== undefined && tokensAfter !== undefined ? m.compactionDelta(format.compact(tokensBefore), format.compact(tokensAfter)) : undefined;
  const text = summary?.trim();
  const glyph = running ? undefined : settledGlyph[status];
  const hint = retryHint === undefined ? m.compactionRetryHint : retryHint;

  return (
    <div {...rest} ref={ref} className={cx('rl-agent-compaction', className)} data-status={status}>
      <div className="rl-agent-compaction__row">
        {running ? <AgentSpark phase="executing" /> : <StatusGlyph name={glyph!.glyph} tone={glyph!.tone} />}
        <p className="rl-agent-compaction__title" role="status">
          <span>{m.compactionStatus[status]}</span>
          {running && phase && <span className="rl-agent-compaction__phase">{m.compactionPhase[phase]}</span>}
          {!running && delta && <span className="rl-agent-compaction__delta">{delta}</span>}
        </p>
        {running && elapsedMs !== undefined && <span className="rl-agent-compaction__elapsed">{format.duration(elapsedMs)}</span>}
        {(status === 'failed' || status === 'interrupted') && hint != null && hint !== false && <span className="rl-agent-compaction__hint">{hint}</span>}
        {running && onCancel && (
          <Button size="sm" variant="ghost" loading={busy} onClick={() => void onCancel()}>
            {m.compactionCancel}
          </Button>
        )}
        {status === 'save-pending' && onRetrySave && (
          <Button size="sm" variant="secondary" loading={busy} onClick={() => void onRetrySave()}>
            {m.compactionRetrySave}
          </Button>
        )}
      </div>
      {!running && text && (
        <Collapsible
          className="rl-agent-compaction__summary"
          open={summaryOpen}
          defaultOpen={summaryOpen === undefined ? false : undefined}
          onOpenChange={onSummaryOpenChange}
          trigger={<span>{m.compactionSummary}</span>}
        >
          {renderMarkdown ? renderMarkdown(text) : <p className="rl-agent-compaction__text">{text}</p>}
        </Collapsible>
      )}
    </div>
  );
});
