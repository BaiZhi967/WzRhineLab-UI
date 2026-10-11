'use client';

import * as React from 'react';
import { Button, Collapsible } from '@wzrhine/react';
import { lastLine } from '@wzrhine/agent-core';
import type { ThinkingView } from '@wzrhine/agent-core';
import { AgentSpark } from '../../primitives/AgentSpark.js';
import { StatusGlyph } from '../../primitives/StatusGlyph.js';
import { useAgentFormat, useAgentMessages } from '../../provider/AgentMessages.js';
import { cx } from '../../utils/cx.js';
import { MarkdownContent } from './Markdown.js';
import type { MessagePartRenderers } from './renderers.js';

/**
 * ThinkingBlock (atlas 08): the public thinking summary of one model call as a disclosure,
 * collapsed by default. It never assumes private reasoning exists: without a summary it says so.
 *
 * Trigger (a real `<button>` from Collapsible, `aria-expanded` / `aria-controls`): label, state
 * (streaming → AgentSpark + "进行中"; completed; interrupted), elapsed, and — only while collapsed
 * and streaming — a one-line preview of the newest line, pinned to its right edge so the latest
 * words stay visible. The preview is `aria-hidden`: the trigger's name must not change on every
 * token.
 *
 * Expanded: the summary through `renderers.markdown` (or the plain-text fallback) in a tinted
 * panel; `truncated` adds a notice and, with `onOpenFull`, a button for the full record.
 * Streaming updates re-render the content in place: they never collapse the block, remount the
 * panel or reset a text selection. `expanded` / `onExpandedChange` make it controlled.
 *
 * Motion: panel height via Collapsible (CSS, interruptible), AgentSpark loop while streaming.
 * Reduced motion: instant toggle, static spark frame.
 */
export type ThinkingBlockProps = Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> & {
  thinking: ThinkingView;
  /** Overrides `thinking.label` / the default label. */
  label?: React.ReactNode;
  expanded?: boolean;
  defaultExpanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
  renderers?: MessagePartRenderers;
  /** Shown as a button under the truncated notice. */
  onOpenFull?: (thinkingId: string) => void;
};

export const ThinkingBlock = React.forwardRef<HTMLDivElement, ThinkingBlockProps>(function ThinkingBlock(
  { thinking, label, expanded, defaultExpanded = false, onExpandedChange, renderers, onOpenFull, className, ...rest },
  ref,
) {
  const t = useAgentMessages().message;
  const fmt = useAgentFormat();
  const [inner, setInner] = React.useState(defaultExpanded);
  const open = expanded ?? inner;
  const setOpen = (next: boolean) => {
    if (expanded === undefined) setInner(next);
    onExpandedChange?.(next);
  };

  const streaming = thinking.status === 'streaming';
  const preview = streaming && !open ? thinking.latestLine?.trim() || lastLine(thinking.summary) : '';
  const previewRef = React.useRef<HTMLSpanElement>(null);
  React.useLayoutEffect(() => {
    const node = previewRef.current;
    if (node) node.scrollLeft = node.scrollWidth;
  }, [preview]);

  const statusLabel = t.thinkingStatus[thinking.status];
  const elapsed = thinking.elapsedMs !== undefined ? fmt.duration(thinking.elapsedMs) : undefined;
  const body = thinking.summary?.trim() ? thinking.summary : streaming ? thinking.latestLine : undefined;

  return (
    <div {...rest} ref={ref} className={cx('rl-agent-thinking', className)} data-status={thinking.status} data-expanded={open || undefined}>
      <Collapsible
        open={open}
        onOpenChange={setOpen}
        className="rl-agent-thinking__disclosure"
        panelClassName="rl-agent-thinking__panel"
        triggerProps={{ className: 'rl-agent-thinking__trigger' }}
        trigger={
          <>
            <span className="rl-agent-thinking__label">{label ?? thinking.label ?? t.thinking}</span>
            <span className="rl-agent-thinking__state" data-status={thinking.status}>
              {streaming ? (
                <AgentSpark phase="thinking" />
              ) : (
                <StatusGlyph
                  name={thinking.status === 'interrupted' ? 'failed' : 'done'}
                  tone={thinking.status === 'interrupted' ? 'warning' : 'neutral'}
                  className="rl-agent-thinking__glyph"
                />
              )}
              <span>{statusLabel}</span>
            </span>
            {elapsed && <span className="rl-agent-thinking__elapsed">{elapsed}</span>}
            {preview && (
              <span ref={previewRef} className="rl-agent-thinking__preview" aria-hidden="true">
                <span>{preview}</span>
              </span>
            )}
          </>
        }
      >
        <div className="rl-agent-thinking__body">
          {body ? (
            <MarkdownContent source={body} context={{ id: thinking.id, streaming }} renderers={renderers} />
          ) : (
            <p className="rl-agent-thinking__empty">{t.thinkingEmpty}</p>
          )}
          {thinking.truncated && (
            <p className="rl-agent-thinking__truncated">
              <span>{t.thinkingTruncated}</span>
              {onOpenFull && (
                <Button size="sm" variant="ghost" onClick={() => onOpenFull(thinking.id)}>
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
