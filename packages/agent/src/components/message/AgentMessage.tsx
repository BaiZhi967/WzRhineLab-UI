'use client';

import * as React from 'react';
import { Button, Collapsible } from '@wzrhine/react';
import { effectivePhase } from '@wzrhine/agent-core';
import type { CitationView, MessagePartView, MessageStatus, MessageView, RunDetailsView, StatusGlyphName, AgentTone, TokenUsageView } from '@wzrhine/agent-core';
import { AgentIcon } from '../../primitives/icons.js';
import { StatusGlyph } from '../../primitives/StatusGlyph.js';
import { useAgentFormat, useAgentMessages } from '../../provider/AgentMessages.js';
import { cx } from '../../utils/cx.js';
import { MessageActions } from './MessageActions.js';
import type { MessageActionCapabilities, MessageFeedback } from './MessageActions.js';
import { INLINE_PART_TYPES, MessagePart } from './MessagePart.js';
import { RunDetails, hasRunDetails } from './RunDetails.js';
import { SkillUseList } from './SkillUseList.js';
import type { ArtifactRenderer, MessagePartRenderers, ToolRenderer } from './renderers.js';
import type { CopyHandler } from './use-copy.js';
import { useThrottledText } from './use-copy.js';

/**
 * AgentMessage (atlas 05): one `<article>` per message, named by its header (author + time).
 *
 * - `user`: right-aligned bubble with a reading max-width; `assistant`: full reading column;
 *   `system`: centred notice; `tool`: compact assistant-like block.
 * - Body: parts in order through MessagePart; consecutive inline parts (citations, attachments,
 *   references) flow together in one line box.
 * - Metadata: edited / inherited markers and the usage footer; any number that is not `exact`
 *   carries its completeness label ("估计" / "部分统计"), never a bare figure.
 * - Status: failed / interrupted / cancelled / partial render as glyph + text (static, no live
 *   region); `onRetry` adds a retry button for failed and interrupted messages.
 * - Skills: `message.skillUses` renders a SkillUseList meta row ("已加载技能：…") automatically.
 * - Run details: `details` (or `message.details`) renders RunDetails inside a "运行详情"
 *   Collapsible after the meta row; closed by default, controlled with `detailsOpen` /
 *   `onDetailsOpenChange`. Nothing renders when every field is missing.
 * - Actions (MessageActions) render only for callbacks that are given and are hidden while the
 *   message is pending / streaming (copy stays available once text exists). `actionCapabilities`
 *   can switch single actions off with a reason (aria-disabled, never called). `onRestoreInput`
 *   ("重新编辑本轮输入") is offered on user and assistant messages that are not inherited, including
 *   failed ones — it is the recovery path for a turn whose answer did not arrive.
 * - Streaming: a visually hidden `role="status"` announces the current phase once per change
 *   (throttled) and "回答已完成" when it settles — never the tokens themselves.
 *
 * Identity is the message id (the list keys by it); re-renders never replay an entrance — the
 * entrance belongs to MessageList.
 */
export interface AgentMessagePartHandlers {
  renderers?: MessagePartRenderers;
  renderTool?: ToolRenderer;
  renderArtifact?: ArtifactRenderer;
  onOpenCitation?: (citation: CitationView) => void;
  onRecoveryAction?: (errorId: string, actionId: string) => void;
  onOpenThinking?: (thinkingId: string) => void;
}

export type AgentMessageProps = Omit<React.HTMLAttributes<HTMLElement>, 'children' | 'onCopy'> &
  AgentMessagePartHandlers & {
    message: MessageView;
    /** Model label shown after the assistant author. */
    model?: string;
    /** Replaces the rendering of single parts; receives the default rendering. */
    renderPart?: (part: MessagePartView, rendered: React.ReactNode) => React.ReactNode;
    onRetry?: (messageId: string) => void;
    onCopy?: CopyHandler;
    onRegenerate?: (messageId: string) => void;
    onEdit?: (messageId: string) => void;
    onFork?: (messageId: string) => void;
    /** Put this turn's input back into the composer (distinct from `onEdit`). */
    onRestoreInput?: (messageId: string) => void;
    /** Per-message availability of the actions (e.g. fork off while a run is active). */
    actionCapabilities?: (message: MessageView) => MessageActionCapabilities | undefined;
    feedback?: MessageFeedback | null;
    onFeedback?: (messageId: string, value: MessageFeedback | null) => void;
    /** Run details shown in the "运行详情" disclosure; defaults to `message.details`. */
    details?: RunDetailsView;
    /** Controlled open state of the run-details disclosure. */
    detailsOpen?: boolean;
    defaultDetailsOpen?: boolean;
    onDetailsOpenChange?: (open: boolean) => void;
    /** Extra content after the body (e.g. a RunSummary from another family). */
    footer?: React.ReactNode;
    /** Minimum gap between streaming announcements (ms). */
    announceInterval?: number;
  };

const statusGlyph: Partial<Record<MessageStatus, { glyph: StatusGlyphName; tone: AgentTone }>> = {
  failed: { glyph: 'failed', tone: 'danger' },
  interrupted: { glyph: 'failed', tone: 'warning' },
  cancelled: { glyph: 'stopped', tone: 'neutral' },
  partial: { glyph: 'unknown', tone: 'warning' },
};

/** Plain text of the copyable parts (text, markdown source, code). */
export function messagePlainText(message: MessageView): string {
  return message.parts
    .map((part) => (part.type === 'text' ? part.text : part.type === 'markdown' ? part.source : part.type === 'code' ? part.code : ''))
    .filter((text) => text.trim() !== '')
    .join('\n\n');
}

function Usage({ usage }: { usage: TokenUsageView }) {
  const t = useAgentMessages().message;
  const fmt = useAgentFormat();
  const items: Array<[string, number | undefined]> = [
    [t.usageInput, usage.input],
    [t.usageOutput, usage.output],
    [t.usageCacheRead, usage.cacheRead],
    [t.usageCacheWrite, usage.cacheWrite],
    [t.usageTotal, usage.total],
  ];
  const shown = items.filter((item): item is [string, number] => item[1] !== undefined);
  const completeness = t.usageCompleteness[usage.completeness];
  if (shown.length === 0 && !completeness && !usage.note) return null;
  return (
    <p className="rl-agent-usage" data-completeness={usage.completeness}>
      <span className="rl-agent-usage__label">{t.usageLabel}</span>
      {shown.map(([label, value]) => (
        <span key={label} className="rl-agent-usage__item">
          {label} <span className="rl-agent-usage__value">{fmt.compact(value)}</span>
        </span>
      ))}
      {completeness && <span className="rl-agent-usage__completeness">{completeness}</span>}
      {usage.note && <span className="rl-agent-usage__note">{usage.note}</span>}
    </p>
  );
}

/** Groups consecutive inline parts so chips share a line box. */
function groupParts(parts: MessagePartView[]): Array<{ inline: boolean; parts: MessagePartView[] }> {
  const groups: Array<{ inline: boolean; parts: MessagePartView[] }> = [];
  for (const part of parts) {
    const inline = INLINE_PART_TYPES.has((part as { type: string }).type);
    const last = groups[groups.length - 1];
    if (last && last.inline && inline) last.parts.push(part);
    else groups.push({ inline, parts: [part] });
  }
  return groups;
}

export const AgentMessage = React.forwardRef<HTMLElement, AgentMessageProps>(function AgentMessage(
  {
    message,
    model,
    renderPart,
    renderers,
    renderTool,
    renderArtifact,
    onOpenCitation,
    onRecoveryAction,
    onOpenThinking,
    onRetry,
    onCopy,
    onRegenerate,
    onEdit,
    onFork,
    onRestoreInput,
    actionCapabilities,
    feedback,
    onFeedback,
    details: detailsProp,
    detailsOpen,
    defaultDetailsOpen,
    onDetailsOpenChange,
    footer,
    announceInterval = 1500,
    className,
    ...rest
  },
  ref,
) {
  const all = useAgentMessages();
  const t = all.message;
  const fmt = useAgentFormat();
  const headerId = React.useId();
  const { role, status } = message;
  const busy = status === 'pending' || status === 'streaming';

  // Announcement: phase while streaming, one line once it settles; history never announces.
  const wasStreaming = React.useRef(status === 'streaming');
  if (status === 'streaming') wasStreaming.current = true;
  const statusPart = [...message.parts].reverse().find((p): p is Extract<MessagePartView, { type: 'status' }> => p.type === 'status');
  let announcement = '';
  if (status === 'streaming') {
    const phase = statusPart ? effectivePhase(statusPart.status, statusPart.phase) : undefined;
    announcement = statusPart?.text ?? (phase ? all.status.phase[phase] : t.messageStatus.streaming);
  } else if (wasStreaming.current) {
    announcement = status === 'complete' ? t.completedAnnouncement : t.messageStatus[status];
  }
  const announced = useThrottledText(announcement, announceInterval);

  const statusText = role === 'user' && status === 'failed' ? t.sendFailed : t.messageStatus[status];
  const glyph = statusGlyph[status];
  const copyText = React.useMemo(() => messagePlainText(message), [message]);
  const id = message.id;

  const renderOne = (part: MessagePartView) => {
    const rendered = (
      <MessagePart
        key={part.id}
        part={part}
        renderers={renderers}
        renderTool={renderTool}
        renderArtifact={renderArtifact}
        onOpenCitation={onOpenCitation}
        onRecoveryAction={onRecoveryAction}
        onOpenThinking={onOpenThinking}
        onCopy={onCopy}
      />
    );
    return renderPart ? <React.Fragment key={part.id}>{renderPart(part, rendered)}</React.Fragment> : rendered;
  };

  const author = message.author ?? t.author[role];
  const showActions = !busy && role !== 'system';
  const details = detailsProp ?? message.details;
  const showDetails = hasRunDetails(details);
  const skills = message.skillUses ?? [];
  const capabilities = showActions ? actionCapabilities?.(message) : undefined;

  return (
    <article
      {...rest}
      ref={ref}
      className={cx('rl-agent-message', className)}
      data-role={role}
      data-status={status}
      data-message-id={id}
      data-inherited={message.inherited || undefined}
      aria-labelledby={headerId}
      aria-busy={busy || undefined}
    >
      <header className="rl-agent-message__header" id={headerId}>
        {role === 'assistant' && <AgentIcon name="agent" className="rl-agent-message__avatar" />}
        <span className="rl-agent-message__author">{author}</span>
        {model && <span className="rl-agent-message__model">{model}</span>}
        {message.createdAt && (
          <time className="rl-agent-message__time" dateTime={message.createdAt}>
            {fmt.time(message.createdAt)}
          </time>
        )}
        {status === 'pending' && <span className="rl-agent-message__pending">{statusText}</span>}
      </header>
      <div className="rl-agent-message__body">
        {groupParts(message.parts).map((group) =>
          group.inline ? (
            <p key={group.parts[0]!.id} className="rl-agent-message__inline">
              {group.parts.map(renderOne)}
            </p>
          ) : (
            group.parts.map(renderOne)
          ),
        )}
      </div>
      {glyph && statusText && (
        <div className="rl-agent-message__status" data-tone={glyph.tone}>
          <StatusGlyph name={glyph.glyph} tone={glyph.tone} className="rl-agent-message__status-glyph" />
          <span>{statusText}</span>
          {onRetry && (status === 'failed' || status === 'interrupted') && (
            <Button size="sm" variant="secondary" iconStart={<AgentIcon name="retry" />} onClick={() => onRetry(id)}>
              {t.retry}
            </Button>
          )}
        </div>
      )}
      {(message.edited || message.inherited || message.usage) && (
        <div className="rl-agent-message__meta">
          {message.edited && <span className="rl-agent-message__marker">{t.edited}</span>}
          {message.inherited && <span className="rl-agent-message__marker">{t.inherited}</span>}
          {message.usage && <Usage usage={message.usage} />}
        </div>
      )}
      {skills.length > 0 && <SkillUseList className="rl-agent-message__skills" skills={skills} />}
      {showDetails && (
        <Collapsible
          className="rl-agent-message__details"
          panelClassName="rl-agent-message__details-panel"
          triggerProps={{ className: 'rl-agent-message__details-trigger' }}
          open={detailsOpen}
          defaultOpen={defaultDetailsOpen}
          onOpenChange={onDetailsOpenChange}
          trigger={<span>{t.runDetails}</span>}
        >
          <RunDetails details={details} aria-label={t.runDetails} />
        </Collapsible>
      )}
      {footer}
      {showActions && (
        <MessageActions
          className="rl-agent-message__actions"
          copyText={copyText || undefined}
          onCopy={onCopy}
          onRegenerate={onRegenerate && role === 'assistant' ? () => onRegenerate(id) : undefined}
          onEdit={onEdit && role === 'user' && !message.inherited ? () => onEdit(id) : undefined}
          onFork={onFork ? () => onFork(id) : undefined}
          onRestoreInput={onRestoreInput && (role === 'user' || role === 'assistant') && !message.inherited ? () => onRestoreInput(id) : undefined}
          capabilities={capabilities}
          feedback={feedback}
          onFeedback={onFeedback && role === 'assistant' ? (value) => onFeedback(id, value) : undefined}
        />
      )}
      {role !== 'user' && wasStreaming.current && (
        <span className="rl-agent-sr" role="status">
          {announced}
        </span>
      )}
    </article>
  );
});
