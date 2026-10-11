'use client';

import * as React from 'react';
import { Button, Collapsible } from '@wzrhine/react';
import { effectivePhase, runPhaseMeta, runStatusMeta, sparkPhase } from '@wzrhine/agent-core';
import type { ProcessBlockView, ProcessCallView, RunView, ToolCallView } from '@wzrhine/agent-core';
import { AgentSpark } from '../../primitives/AgentSpark.js';
import { AgentStatus, statusProps } from '../../primitives/AgentStatus.js';
import { StatusGlyph } from '../../primitives/StatusGlyph.js';
import { useAgentFormat, useAgentMessages } from '../../provider/AgentMessages.js';
import { cx } from '../../utils/cx.js';
import { MarkdownContent } from '../message/Markdown.js';
import { ToolFallback } from '../message/MessagePart.js';
import type { MessagePartRenderers, ToolRenderer } from '../message/renderers.js';
import { ThinkingBlock } from '../message/ThinkingBlock.js';

/**
 * AgentProcess (atlas 09): the record of one run, grouped by model call.
 *
 * - Header: a disclosure trigger. While the run is active it shows AgentSpark + phase label +
 *   elapsed; once settled "N 次模型调用 · M 个操作" (+ "已展示" when truncated).
 * - Each call is a `<section aria-label="模型调用 N">` with its status. Blocks in order:
 *   thinking → ThinkingBlock, text → muted stage text (with "已截取" when cut), tool →
 *   `renderTool` or a one-line fallback (nested children listed indented with a tree rule),
 *   pending-record → a "记录稍后到达" entry, with `onLoadRecord` as a button. Results are never
 *   invented for missing records.
 * - Only the current step (the last block of the last running call) gets the accent rule.
 * - Expanded by default while the run is active and collapsed once it settles, until the user
 *   toggles; after that the user's choice wins. `expanded` / `onExpandedChange` make it controlled.
 * - `run.truncated`: a notice and, with `onOpenFull`, a button for the full record.
 *
 * Motion: header disclosure height (Collapsible), AgentSpark while active. Reduced: static.
 */
export type AgentProcessProps = Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> & {
  run: RunView;
  renderTool?: ToolRenderer;
  renderers?: MessagePartRenderers;
  expanded?: boolean;
  defaultExpanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
  onLoadRecord?: (blockId: string) => void;
  onOpenFull?: (runId: string) => void;
  onOpenThinking?: (thinkingId: string) => void;
  /** Heading level of the call titles (default 3). */
  headingLevel?: 2 | 3 | 4 | 5 | 6;
};

const ACTIVE = new Set(['queued', 'running', 'waiting', 'cancelling']);

function countOperations(calls: ProcessCallView[]): number {
  const count = (tool: ToolCallView): number => 1 + (tool.children ?? []).reduce((n, c) => n + count(c), 0);
  return calls.reduce((n, call) => n + call.blocks.reduce((m, b) => m + (b.type === 'tool' ? count(b.tool) : 0), 0), 0);
}

function ToolTree({ tool, renderTool, depth = 0 }: { tool: ToolCallView; renderTool?: ToolRenderer; depth?: number }) {
  const t = useAgentMessages().message;
  const children = tool.children ?? [];
  return (
    <div className="rl-agent-process__tool" data-depth={depth} data-tool-id={tool.id}>
      {renderTool ? renderTool(tool) : <ToolFallback tool={tool} />}
      {!renderTool && children.length > 0 && (
        <ul className="rl-agent-process__children" aria-label={t.toolChildren(children.length)}>
          {children.map((child) => (
            <li key={child.id} className="rl-agent-process__child">
              <ToolTree tool={child} depth={depth + 1} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Block({
  block,
  current,
  props,
}: {
  block: ProcessBlockView;
  current: boolean;
  props: Pick<AgentProcessProps, 'renderTool' | 'renderers' | 'onLoadRecord' | 'onOpenThinking'>;
}) {
  const t = useAgentMessages().message;
  let content: React.ReactNode;
  switch (block.type) {
    case 'thinking':
      content = <ThinkingBlock thinking={block.thinking} renderers={props.renderers} onOpenFull={props.onOpenThinking} />;
      break;
    case 'text':
      content = (
        <div className="rl-agent-process__stage">
          <MarkdownContent source={block.text} context={{ id: block.id, streaming: false }} renderers={props.renderers} />
          {block.truncated && <span className="rl-agent-process__cut">{t.stageTruncated}</span>}
        </div>
      );
      break;
    case 'tool':
      content = <ToolTree tool={block.tool} renderTool={props.renderTool} />;
      break;
    case 'pending-record':
      content = (
        <div className="rl-agent-process__pending">
          <StatusGlyph name="pending" tone="neutral" className="rl-agent-process__pending-glyph" />
          <span className="rl-agent-process__pending-label">{block.label}</span>
          <span className="rl-agent-process__pending-note">{t.pendingRecord}</span>
          {props.onLoadRecord && (
            <Button size="sm" variant="ghost" onClick={() => props.onLoadRecord?.(block.id)}>
              {t.loadRecord}
            </Button>
          )}
        </div>
      );
      break;
    default:
      content = null;
  }
  return (
    <li className="rl-agent-process__block" data-block-type={(block as { type: string }).type} data-current={current || undefined} aria-current={current ? 'step' : undefined}>
      {content}
    </li>
  );
}

const callTone = { running: 'accent', completed: 'success', interrupted: 'warning', failed: 'danger' } as const;
const callGlyph = { running: 'active', completed: 'done', interrupted: 'failed', failed: 'failed' } as const;

export const AgentProcess = React.forwardRef<HTMLDivElement, AgentProcessProps>(function AgentProcess(
  { run, renderTool, renderers, expanded, defaultExpanded, onExpandedChange, onLoadRecord, onOpenFull, onOpenThinking, headingLevel = 3, className, ...rest },
  ref,
) {
  const all = useAgentMessages();
  const t = all.message;
  const fmt = useAgentFormat();
  const active = ACTIVE.has(run.status);
  const [manual, setManual] = React.useState<boolean | undefined>(defaultExpanded);
  const open = expanded ?? manual ?? active;
  const setOpen = (next: boolean) => {
    if (expanded === undefined) setManual(next);
    onExpandedChange?.(next);
  };

  const calls = run.calls ?? [];
  const operations = run.toolCount ?? countOperations(calls);
  const phase = active ? effectivePhase(run.status, run.phase) : undefined;
  const meta = phase ? runPhaseMeta[phase] : runStatusMeta[run.status];
  const headline = active
    ? (run.label ?? (phase ? all.status.phase[phase] : all.status.run[run.status]))
    : run.truncated
      ? t.processTruncatedSummary(calls.length, operations)
      : t.processSummary(calls.length, operations);
  const elapsed = run.elapsedMs !== undefined ? fmt.duration(run.elapsedMs) : undefined;

  // Current step: last block of the last running call while the run is active.
  let currentId: string | undefined;
  if (active) {
    const running = [...calls].reverse().find((c) => c.status === 'running');
    currentId = running?.blocks[running.blocks.length - 1]?.id;
  }
  const Heading = `h${headingLevel}` as 'h3';

  return (
    <div {...rest} ref={ref} className={cx('rl-agent-process', className)} data-status={run.status} data-active={active || undefined}>
      <Collapsible
        open={open}
        onOpenChange={setOpen}
        className="rl-agent-process__disclosure"
        panelClassName="rl-agent-process__panel"
        triggerProps={{ className: 'rl-agent-process__trigger' }}
        trigger={
          <>
            <span className="rl-agent-sr">{t.processLabel}</span>
            {active ? (
              <AgentSpark phase={sparkPhase(run.status, run.phase)} />
            ) : (
              <StatusGlyph name={meta.glyph} tone={meta.tone} className="rl-agent-process__glyph" />
            )}
            <span className="rl-agent-process__headline">{headline}</span>
            {!active && <span className="rl-agent-process__run-status">{all.status.run[run.status]}</span>}
            {elapsed && <span className="rl-agent-process__elapsed">{elapsed}</span>}
          </>
        }
      >
        <div className="rl-agent-process__calls">
          {calls.map((call) => (
            <section key={call.id} className="rl-agent-process__call" aria-label={t.processCall(call.ordinal)} data-status={call.status}>
              <Heading className="rl-agent-process__call-title">
                <span>{t.processCall(call.ordinal)}</span>
                <AgentStatus
                  {...statusProps({ glyph: callGlyph[call.status], tone: callTone[call.status], active: call.status === 'running', settled: call.status !== 'running' }, t.callStatus[call.status])}
                  appearance="inline"
                  meta={call.elapsedMs !== undefined ? fmt.duration(call.elapsedMs) : undefined}
                />
              </Heading>
              <ol className="rl-agent-process__blocks">
                {call.blocks.map((block) => (
                  <Block key={block.id} block={block} current={block.id === currentId} props={{ renderTool, renderers, onLoadRecord, onOpenThinking }} />
                ))}
              </ol>
            </section>
          ))}
          {run.truncated && (
            <p className="rl-agent-process__truncated">
              <span>{t.processTruncated}</span>
              {onOpenFull && (
                <Button size="sm" variant="ghost" onClick={() => onOpenFull(run.id)}>
                  {t.openFull}
                </Button>
              )}
            </p>
          )}
        </div>
      </Collapsible>
    </div>
  );
});
