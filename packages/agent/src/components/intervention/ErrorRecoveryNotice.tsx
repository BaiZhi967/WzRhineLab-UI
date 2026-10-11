'use client';

import * as React from 'react';
import { Button, IconButton } from '@wzrhine/react';
import type { AgentTone, RecoveryView, StatusGlyphName } from '@wzrhine/agent-core';
import { AgentStatus } from '../../primitives/AgentStatus.js';
import { AgentIcon } from '../../primitives/icons.js';
import { useAgentMessages } from '../../provider/AgentMessages.js';
import { cx } from '../../utils/cx.js';

/**
 * Error and recovery notice (atlas 34). Tells the user what was kept, what is still unconfirmed
 * and which recovery actions are safe.
 *
 * - Severity follows `kind`: `retryable` / `offline` info, `save-pending` / `cancel-unconfirmed` /
 *   `timeout` / `unknown` warning, `tool-side-effects` danger, `resolved` success. Each kind also
 *   gets a fixed consequence sentence from the copy table ("停止尚未确认，工具可能仍在运行",
 *   "工具可能已产生外部影响，不会自动重放", "重试保存不会再次调用模型") so the states stay distinct.
 * - Actions come from the view (`actions[]`, labels must name what they act on) and call
 *   `onAction(id)`. Without `onAction` no button is rendered.
 * - `role="alert"` only for danger kinds and only when `announce` (default true): it sits on the
 *   message, not on the buttons. Everything else is static. Nothing blinks or loops.
 * - `onDismiss` adds a close button for `resolved` notices only; the caller moves focus.
 */
export interface ErrorRecoveryNoticeProps extends Omit<React.HTMLAttributes<HTMLElement>, 'title' | 'children'> {
  recovery: RecoveryView;
  onAction?: (actionId: string) => void;
  /** Resolved notices only. */
  onDismiss?: () => void;
  /** Announce danger notices with `role="alert"`. Pass `false` for notices restored from history. */
  announce?: boolean;
  /** Ids of actions currently running (button shows busy). */
  busyActionIds?: readonly string[];
}

const kindMeta: Record<RecoveryView['kind'], { tone: AgentTone; glyph: StatusGlyphName }> = {
  retryable: { tone: 'info', glyph: 'reconnecting' },
  'save-pending': { tone: 'warning', glyph: 'saving' },
  'cancel-unconfirmed': { tone: 'warning', glyph: 'stopping' },
  'tool-side-effects': { tone: 'danger', glyph: 'failed' },
  timeout: { tone: 'warning', glyph: 'failed' },
  offline: { tone: 'info', glyph: 'offline' },
  unknown: { tone: 'warning', glyph: 'unknown' },
  resolved: { tone: 'success', glyph: 'done' },
};

const variantOf = { primary: 'primary', secondary: 'secondary', danger: 'secondary' } as const;

export const ErrorRecoveryNotice = React.forwardRef<HTMLElement, ErrorRecoveryNoticeProps>(function ErrorRecoveryNotice(
  { recovery, onAction, onDismiss, announce = true, busyActionIds, className, ...rest },
  ref,
) {
  const m = useAgentMessages().intervention;
  const id = React.useId();
  const titleId = `${id}-title`;
  const { kind } = recovery;
  const meta = kindMeta[kind];
  const alert = meta.tone === 'danger' && announce;
  const note = m.recoveryNote[kind];

  return (
    <section {...rest} ref={ref} className={cx('rl-agent-recovery', className)} aria-labelledby={titleId} data-kind={kind} data-tone={meta.tone}>
      <div className="rl-agent-recovery__message" role={alert ? 'alert' : undefined}>
        <div className="rl-agent-recovery__head">
          <AgentStatus glyph={meta.glyph} tone={meta.tone} label={m.recoveryKind[kind]} className="rl-agent-recovery__kind" />
          {recovery.code && (
            <span className="rl-agent-recovery__code">
              <span className="rl-agent-sr">{m.recoveryCode} </span>
              <code>{recovery.code}</code>
            </span>
          )}
        </div>
        <p id={titleId} className="rl-agent-recovery__title">
          {recovery.title}
        </p>
        {recovery.message && <p className="rl-agent-recovery__text">{recovery.message}</p>}
        {note && <p className="rl-agent-recovery__note">{note}</p>}
        {recovery.preserved && recovery.preserved.length > 0 && (
          <div className="rl-agent-recovery__preserved">
            <span className="rl-agent-recovery__preserved-label">{m.recoveryPreserved}</span>
            <ul className="rl-agent-recovery__preserved-list">
              {recovery.preserved.map((item) => (
                <li key={item}>
                  <AgentIcon name="check" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      {onAction && recovery.actions && recovery.actions.length > 0 && (
        <div className="rl-agent-recovery__actions">
          {recovery.actions.map((action) => (
            <Button
              key={action.id}
              size="sm"
              variant={variantOf[action.tone ?? 'secondary']}
              data-tone={action.tone}
              className="rl-agent-recovery__action"
              loading={busyActionIds?.includes(action.id)}
              onClick={() => onAction(action.id)}
            >
              {action.label}
            </Button>
          ))}
        </div>
      )}
      {onDismiss && kind === 'resolved' && (
        <IconButton className="rl-agent-recovery__dismiss" size="sm" variant="ghost" icon={<AgentIcon name="close" />} label={m.recoveryDismiss} onClick={onDismiss} />
      )}
    </section>
  );
});
