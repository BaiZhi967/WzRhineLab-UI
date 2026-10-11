'use client';

import * as React from 'react';
import { IconButton, Progress, Spinner } from '@wzrhine/react';
import type { AttachmentView, ReferenceView } from '@wzrhine/agent-core';
import { AgentIcon } from '../../primitives/icons.js';
import type { AgentIconName } from '../../primitives/icons.js';
import { useAgentFormat, useAgentMessages } from '../../provider/AgentMessages.js';
import { cx } from '../../utils/cx.js';
import { isSafeThumbnail } from './composer-utils.js';

const attachmentIcon: Record<AttachmentView['kind'], AgentIconName> = {
  image: 'image',
  file: 'file',
  pdf: 'file',
  text: 'file',
  code: 'code',
  unknown: 'file',
};

const referenceIcon: Record<ReferenceView['kind'], AgentIconName> = {
  file: 'file',
  folder: 'folder',
  skill: 'spark',
  command: 'slash',
  url: 'link',
  symbol: 'code',
  custom: 'at',
};

export interface AttachmentListProps {
  attachments?: readonly AttachmentView[];
  references?: readonly ReferenceView[];
  /** Removes the UI reference only; deleting remote files is the adapter's decision. No callback → no button. */
  onRemove?: (item: { type: 'attachment'; attachment: AttachmentView } | { type: 'reference'; reference: ReferenceView }) => void;
  /** Retry a failed upload. No callback → no retry button. */
  onRetry?: (attachment: AttachmentView) => void;
  /** Blocks remove / retry (e.g. while sending). */
  disabled?: boolean;
  /** Custom preview for an attachment (replaces icon / thumbnail). */
  renderPreview?: (attachment: AttachmentView) => React.ReactNode;
  'aria-label'?: string;
  className?: string;
}

function useOrigin(): string | undefined {
  return typeof window === 'undefined' ? undefined : window.location.origin;
}

/**
 * Attachment and reference chips (atlas 17), `role="list"`. Every card has a fixed size, so
 * progress and status changes never move neighbours. Names are ellipsised with the full name in
 * `title` and in the accessible text; size uses `useAgentFormat().bytes`. Thumbnails are drawn
 * only for `kind: 'image'` with a `data:image/`, `blob:` or same-origin URL (anything else falls
 * back to the icon). Statuses are text + glyph: 正在上传 (Progress when the fraction is known,
 * else Spinner), 上传失败 (+ retry), 引用已失效, 不可用.
 * Motion: none beyond the Progress / Spinner primitives (reduced-motion aware).
 */
export function AttachmentList({
  attachments = [],
  references = [],
  onRemove,
  onRetry,
  disabled = false,
  renderPreview,
  'aria-label': ariaLabel,
  className,
}: AttachmentListProps) {
  const messages = useAgentMessages().composer;
  const format = useAgentFormat();
  const origin = useOrigin();
  if (attachments.length === 0 && references.length === 0) return null;

  return (
    <ul className={cx('rl-agent-attachments', className)} aria-label={ariaLabel ?? messages.attachmentsLabel} data-slot="attachment-list">
      {references.map((reference) => {
        const status = reference.status ?? 'ready';
        const statusText =
          status === 'stale' ? messages.stale : status === 'failed' ? messages.referenceFailed : status === 'loading' ? messages.referenceLoading : undefined;
        const name = reference.label;
        return (
          <li key={`r-${reference.id}`} className="rl-agent-attachment" data-type="reference" data-kind={reference.kind} data-status={status}>
            <span className="rl-agent-attachment__media" aria-hidden="true">
              {status === 'loading' ? <Spinner size="sm" /> : <AgentIcon name={referenceIcon[reference.kind]} />}
            </span>
            <span className="rl-agent-attachment__body">
              <span className="rl-agent-attachment__name" title={reference.detail ?? name}>
                {name}
              </span>
              <span className="rl-agent-attachment__meta">
                {statusText ? (
                  <span className="rl-agent-attachment__status">
                    {status !== 'loading' && <AgentIcon name="warning" />}
                    {statusText}
                  </span>
                ) : (
                  <>
                    {messages.referenceKind[reference.kind]}
                    {reference.external && ` · ${messages.external}`}
                  </>
                )}
              </span>
              {reference.detail && <span className="rl-agent-sr">{reference.detail}</span>}
              {reference.reason && <span className="rl-agent-sr">{reference.reason}</span>}
            </span>
            {onRemove && (
              <IconButton
                size="sm"
                className="rl-agent-attachment__remove"
                label={messages.remove(name)}
                icon={<AgentIcon name="close" />}
                disabled={disabled}
                onClick={() => onRemove({ type: 'reference', reference })}
              />
            )}
          </li>
        );
      })}
      {attachments.map((attachment) => {
        const { status, name } = attachment;
        const thumb = attachment.kind === 'image' && isSafeThumbnail(attachment.thumbnail, origin) ? attachment.thumbnail : undefined;
        const meta = [messages.kind[attachment.kind], attachment.size !== undefined ? format.bytes(attachment.size) : undefined].filter(Boolean).join(' · ');
        const known = typeof attachment.progress === 'number' && Number.isFinite(attachment.progress);
        return (
          <li key={`a-${attachment.id}`} className="rl-agent-attachment" data-type="attachment" data-kind={attachment.kind} data-status={status}>
            <span className="rl-agent-attachment__media" data-thumb={thumb ? '' : undefined}>
              {renderPreview ? (
                renderPreview(attachment)
              ) : thumb ? (
                <img className="rl-agent-attachment__thumb" src={thumb} alt={attachment.alt ?? name} loading="lazy" decoding="async" />
              ) : (
                <AgentIcon name={attachmentIcon[attachment.kind]} />
              )}
            </span>
            <span className="rl-agent-attachment__body">
              <span className="rl-agent-attachment__name" title={name}>
                {name}
              </span>
              {status === 'uploading' ? (
                known ? (
                  <Progress
                    className="rl-agent-attachment__progress"
                    size="sm"
                    label={messages.uploadingName(name)}
                    hideLabel
                    valueText={false}
                    value={Math.round(Math.max(0, Math.min(1, attachment.progress!)) * 100)}
                  />
                ) : (
                  <span className="rl-agent-attachment__meta">
                    <Spinner size="sm" label={messages.uploadingName(name)} />
                    <span aria-hidden="true">{messages.uploading}</span>
                  </span>
                )
              ) : (
                <span className="rl-agent-attachment__meta">
                  {status === 'failed' || status === 'stale' || status === 'disabled' ? (
                    <span className="rl-agent-attachment__status">
                      <AgentIcon name="warning" />
                      {status === 'failed' ? messages.uploadFailed : status === 'stale' ? messages.stale : messages.unavailable}
                    </span>
                  ) : (
                    meta
                  )}
                </span>
              )}
              {attachment.reason && <span className="rl-agent-sr">{attachment.reason}</span>}
            </span>
            {status === 'failed' && onRetry && (
              <IconButton
                size="sm"
                className="rl-agent-attachment__retry"
                label={messages.retryUpload(name)}
                icon={<AgentIcon name="retry" />}
                disabled={disabled}
                onClick={() => onRetry(attachment)}
              />
            )}
            {onRemove && (
              <IconButton
                size="sm"
                className="rl-agent-attachment__remove"
                label={messages.remove(name)}
                icon={<AgentIcon name="close" />}
                disabled={disabled}
                onClick={() => onRemove({ type: 'attachment', attachment })}
              />
            )}
          </li>
        );
      })}
    </ul>
  );
}
