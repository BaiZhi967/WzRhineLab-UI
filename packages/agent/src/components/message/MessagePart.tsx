'use client';

import * as React from 'react';
import { Button } from '@wzrhine/react';
import { toolStatusMeta } from '@wzrhine/agent-core';
import type { ArtifactView, AttachmentKind, AttachmentView, CitationView, MessagePartView, RecoveryKind, RecoveryView, ReferenceKind, ReferenceView, ToolCallView } from '@wzrhine/agent-core';
import { AgentStatus, statusProps } from '../../primitives/AgentStatus.js';
import { AgentIcon } from '../../primitives/icons.js';
import type { AgentIconName } from '../../primitives/icons.js';
import { StatusGlyph } from '../../primitives/StatusGlyph.js';
import { useAgentFormat, useAgentMessages } from '../../provider/AgentMessages.js';
import { cx } from '../../utils/cx.js';
import { RunStatus } from '../process/RunStatus.js';
import { CitationChip } from './CitationChip.js';
import { CodeBlock } from './CodeBlock.js';
import { MarkdownContent } from './Markdown.js';
import type { ArtifactRenderer, MessagePartRenderers, ToolRenderer } from './renderers.js';
import type { CopyHandler } from './use-copy.js';
import { ThinkingBlock } from './ThinkingBlock.js';

/**
 * MessagePart (atlas 06): renders one `MessagePartView` by `type`. Stable by `part.id` (the
 * caller keys it). Every branch keeps real text in the DOM; nothing is ever rendered blank:
 * a `custom` part without a registered renderer, or a part type this version does not know,
 * shows a fallback box with the type / renderer name, the summary and "无法显示此内容".
 *
 * Tool calls and artifacts belong to other families: pass `renderTool` / `renderArtifact` to
 * plug the real components in; the built-in fallback is one line (name + status / title + status).
 */
export interface MessagePartProps {
  part: MessagePartView;
  renderers?: MessagePartRenderers;
  renderTool?: ToolRenderer;
  renderArtifact?: ArtifactRenderer;
  onOpenCitation?: (citation: CitationView) => void;
  /** Error part actions: `(errorId, actionId)`. Without it the action buttons are not rendered. */
  onRecoveryAction?: (errorId: string, actionId: string) => void;
  onOpenThinking?: (thinkingId: string) => void;
  onCopy?: CopyHandler;
}

/** Icon per built-in kind; kinds outside the list fall back (ADR-0013 §2). */
const attachmentIcon: Record<AttachmentKind, AgentIconName> = {
  image: 'image',
  file: 'file',
  pdf: 'file',
  text: 'file',
  code: 'code',
  unknown: 'file',
};

const referenceIcon: Record<ReferenceKind, AgentIconName> = {
  file: 'file',
  folder: 'folder',
  skill: 'spark',
  command: 'slash',
  url: 'link',
  symbol: 'code',
  custom: 'link',
};

const attachmentIconFor = (kind: AttachmentView['kind']): AgentIconName => attachmentIcon[kind as AttachmentKind] ?? 'file';
const referenceIconFor = (kind: ReferenceView['kind']): AgentIconName => referenceIcon[kind as ReferenceKind] ?? referenceIcon.custom;

const artifactTone: Record<ArtifactView['status'], { glyph: 'pending' | 'unknown' | 'done' | 'failed'; tone: 'info' | 'warning' | 'success' | 'danger' | 'neutral'; active?: boolean }> = {
  generating: { glyph: 'pending', tone: 'info', active: true },
  partial: { glyph: 'unknown', tone: 'warning' },
  saved: { glyph: 'done', tone: 'success' },
  failed: { glyph: 'failed', tone: 'danger' },
  unavailable: { glyph: 'unknown', tone: 'neutral' },
  stale: { glyph: 'unknown', tone: 'warning' },
};

export function ToolFallback({ tool }: { tool: ToolCallView }) {
  const s = useAgentMessages().status;
  return (
    <div className="rl-agent-part-line" data-kind="tool" data-status={tool.status}>
      <AgentIcon name="tool" className="rl-agent-part-line__icon" />
      <span className="rl-agent-part-line__name">{tool.displayName ?? tool.name}</span>
      {tool.subject && <span className="rl-agent-part-line__detail">{tool.subject}</span>}
      <AgentStatus {...statusProps(toolStatusMeta[tool.status], s.tool[tool.status])} className="rl-agent-part-line__status" />
    </div>
  );
}

export function ArtifactFallback({ artifact }: { artifact: ArtifactView }) {
  const t = useAgentMessages().message;
  const tone = artifactTone[artifact.status];
  return (
    <div className="rl-agent-part-line" data-kind="artifact" data-status={artifact.status}>
      <AgentIcon name="layers" className="rl-agent-part-line__icon" />
      <span className="rl-agent-part-line__name">{artifact.title}</span>
      {artifact.reason && <span className="rl-agent-part-line__detail">{artifact.reason}</span>}
      <AgentStatus glyph={tone.glyph} tone={tone.tone} active={tone.active} label={t.artifactStatus[artifact.status]} className="rl-agent-part-line__status" />
    </div>
  );
}

function Attachment({ attachment }: { attachment: AttachmentView }) {
  const t = useAgentMessages().message;
  const fmt = useAgentFormat();
  const status =
    attachment.status === 'uploading' && attachment.progress !== undefined
      ? t.attachmentUploading(Math.round(attachment.progress * 100))
      : t.attachmentStatus[attachment.status];
  return (
    <span className="rl-agent-chip" data-kind="attachment" data-status={attachment.status}>
      {attachment.kind === 'image' && attachment.thumbnail ? (
        <img className="rl-agent-chip__thumb" src={attachment.thumbnail} alt={attachment.alt ?? ''} width={20} height={20} loading="lazy" />
      ) : (
        <AgentIcon name={attachmentIconFor(attachment.kind)} className="rl-agent-chip__icon" />
      )}
      <span className="rl-agent-chip__label">{attachment.name}</span>
      {attachment.size !== undefined && <span className="rl-agent-chip__meta">{fmt.bytes(attachment.size)}</span>}
      {status && <span className="rl-agent-chip__status">{status}</span>}
      {attachment.reason && attachment.status !== 'ready' && <span className="rl-agent-chip__meta">{attachment.reason}</span>}
    </span>
  );
}

function Reference({ reference }: { reference: ReferenceView }) {
  const t = useAgentMessages().message;
  const status = reference.status ? t.referenceStatus[reference.status] : '';
  return (
    <span className="rl-agent-chip" data-kind="reference" data-status={reference.status} title={reference.detail}>
      <AgentIcon name={referenceIconFor(reference.kind)} className="rl-agent-chip__icon" />
      <span className="rl-agent-sr">{t.referenceKind[reference.kind] ?? reference.kind}</span>
      <span className="rl-agent-chip__label">{reference.label}</span>
      {reference.detail && reference.detail !== reference.label && <span className="rl-agent-sr">{reference.detail}</span>}
      {reference.external && <span className="rl-agent-chip__status">{t.external}</span>}
      {status && <span className="rl-agent-chip__status">{status}</span>}
      {reference.reason && reference.status !== 'ready' && <span className="rl-agent-chip__meta">{reference.reason}</span>}
    </span>
  );
}

/** Tone per built-in recovery kind; custom kinds fall back to `warning` (ADR-0013 §2). */
const recoveryTone: Record<RecoveryKind, 'warning' | 'danger' | 'info' | 'success'> = {
  retryable: 'danger',
  'save-pending': 'warning',
  'cancel-unconfirmed': 'warning',
  'tool-side-effects': 'warning',
  timeout: 'warning',
  offline: 'danger',
  unknown: 'warning',
  resolved: 'success',
};

/** Error part: a static callout-style notice (not a live region; the message status announces). */
export function MessageErrorNotice({ error, onAction }: { error: RecoveryView; onAction?: (errorId: string, actionId: string) => void }) {
  const t = useAgentMessages().message;
  const tone = recoveryTone[error.kind as RecoveryKind] ?? 'warning';
  const titleId = React.useId();
  return (
    <div className="rl-agent-recovery" role="group" aria-labelledby={titleId} data-tone={tone} data-kind={error.kind}>
      <StatusGlyph name={tone === 'success' ? 'done' : error.kind === 'unknown' ? 'unknown' : 'failed'} tone={tone} className="rl-agent-recovery__glyph" />
      <div className="rl-agent-recovery__text">
        <p id={titleId} className="rl-agent-recovery__title">
          {error.title}
          <span className="rl-agent-recovery__kind">{t.recoveryKind[error.kind] ?? error.kind}</span>
        </p>
        {error.message && <p className="rl-agent-recovery__message">{error.message}</p>}
        {error.preserved && error.preserved.length > 0 && (
          <p className="rl-agent-recovery__meta">
            {t.recoveryPreserved(error.preserved.join(' · '))}
          </p>
        )}
        {error.code && <p className="rl-agent-recovery__meta">{t.recoveryCode(error.code)}</p>}
        {onAction && error.actions && error.actions.length > 0 && (
          <div className="rl-agent-recovery__actions">
            {error.actions.map((action) => (
              <Button
                key={action.id}
                size="sm"
                variant={action.tone === 'primary' ? 'primary' : 'secondary'}
                data-tone={action.tone}
                onClick={() => onAction(error.id, action.id)}
              >
                {action.label}
              </Button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/** Fallback for unregistered custom renderers and unknown part types. Never blank. */
export function UnsupportedPart({ type, summary }: { type: string; summary?: string }) {
  const t = useAgentMessages().message;
  return (
    <div className="rl-agent-unsupported" data-type={type}>
      <AgentIcon name="info" className="rl-agent-unsupported__icon" />
      <div className="rl-agent-unsupported__text">
        <p className="rl-agent-unsupported__title">{t.unsupportedTitle}</p>
        <p className="rl-agent-unsupported__meta">{t.unsupportedType(type)}</p>
        {summary && <p className="rl-agent-unsupported__summary">{summary}</p>}
      </div>
    </div>
  );
}

/** Text paragraphs separated by blank lines; single line breaks are kept (`pre-wrap`). */
function TextContent({ text }: { text: string }) {
  const paragraphs = text.split(/\n[ \t]*\n/).filter((p) => p.trim() !== '');
  return (
    <div className="rl-agent-md">
      {paragraphs.map((p, i) => (
        <p key={i} className="rl-agent-md__p">
          {p}
        </p>
      ))}
    </div>
  );
}

/** Parts that flow inline with text (chips) rather than taking their own block. */
export const INLINE_PART_TYPES: ReadonlySet<string> = new Set(['citation', 'attachment', 'reference']);

export function MessagePart({ part, renderers, renderTool, renderArtifact, onOpenCitation, onRecoveryAction, onOpenThinking, onCopy }: MessagePartProps) {
  const type = (part as { type: string }).type;
  let content: React.ReactNode;
  switch (part.type) {
    case 'text':
      content = <TextContent text={part.text} />;
      break;
    case 'markdown':
      content = <MarkdownContent source={part.source} context={{ id: part.id, streaming: part.streaming === true }} renderers={renderers} onCopy={onCopy} />;
      break;
    case 'code':
      content = renderers?.code ? renderers.code(part) : <CodeBlock code={part.code} language={part.language} filename={part.filename} onCopy={onCopy} />;
      break;
    case 'image':
      content = (
        <figure className="rl-agent-image">
          <img className="rl-agent-image__img" src={part.src} alt={part.alt} width={part.width} height={part.height} loading="lazy" decoding="async" />
          {part.caption && <figcaption className="rl-agent-image__caption">{part.caption}</figcaption>}
        </figure>
      );
      break;
    case 'thinking':
      content = <ThinkingBlock thinking={part.thinking} renderers={renderers} onOpenFull={onOpenThinking} />;
      break;
    case 'tool-call':
      content = renderTool ? renderTool(part.tool) : <ToolFallback tool={part.tool} />;
      break;
    case 'attachment':
      content = <Attachment attachment={part.attachment} />;
      break;
    case 'reference':
      content = <Reference reference={part.reference} />;
      break;
    case 'citation':
      content = <CitationChip citation={part.citation} onOpen={onOpenCitation} />;
      break;
    case 'artifact':
      content = renderArtifact ? renderArtifact(part.artifact) : <ArtifactFallback artifact={part.artifact} />;
      break;
    case 'status':
      content = <RunStatus status={part.status} phase={part.phase} labelOverride={part.text} appearance="line" />;
      break;
    case 'error':
      content = <MessageErrorNotice error={part.error} onAction={onRecoveryAction} />;
      break;
    case 'custom': {
      const render = renderers?.custom?.[part.renderer];
      content = render ? render(part) : <UnsupportedPart type={part.renderer} summary={part.summary} />;
      break;
    }
    default: {
      const unknown = part as { type?: unknown; summary?: unknown };
      content = <UnsupportedPart type={String(unknown.type ?? 'unknown')} summary={typeof unknown.summary === 'string' ? unknown.summary : undefined} />;
    }
  }
  const inline = INLINE_PART_TYPES.has(type);
  const Tag = inline ? 'span' : 'div';
  return (
    <Tag className={cx('rl-agent-part', inline && 'rl-agent-part--inline')} data-part-type={type} data-part-id={part.id}>
      {content}
    </Tag>
  );
}
