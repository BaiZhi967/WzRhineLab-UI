'use client';

import * as React from 'react';
import { Button } from '@wzrhine/react';
import { AgentIcon } from '../../primitives/icons.js';
import type { AgentIconName } from '../../primitives/icons.js';
import { useAgentMessages } from '../../provider/AgentMessages.js';
import { cx } from '../../utils/cx.js';

/**
 * A notice that stands in for the input frame when this thread cannot take a message: a sub-agent
 * conversation (「这是子代理的对话，回到主对话发送消息」), an archived thread (「恢复归档」), an
 * inherited / read-only thread. Pass it to `Composer replacement`; the intervention dock above
 * stays, so approvals and questions still reach the user.
 *
 * - Tone is carried by an icon **and** a visually hidden prefix (「注意：」), never by colour alone.
 * - `actions` render buttons only when `onAction` exists (a capability without a callback renders
 *   nothing); `onAction(id)` emits intent and the host decides what happens. Action labels must
 *   name what they do (「恢复归档」, not 「确定」).
 * - Static by default (`role="note"`). `live="polite"` makes the message a status region for
 *   notices that appear while the user is in the thread.
 *
 * Motion: none of its own; it appears in place of the frame instantly.
 */
export type ComposerNoticeTone = 'neutral' | 'info' | 'warning' | 'danger';

export interface ComposerNoticeAction {
  id: string;
  label: string;
  tone?: 'primary' | 'secondary' | 'danger';
}

export interface ComposerNoticeProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children' | 'role'> {
  message: React.ReactNode;
  actions?: readonly ComposerNoticeAction[];
  onAction?: (id: string) => void;
  /** Default `info`. */
  tone?: ComposerNoticeTone;
  /** Replace the tone icon; `null` hides it. */
  icon?: AgentIconName | null;
  /** `polite` announces the message when it appears. Default `off`. */
  live?: 'off' | 'polite';
  /** Ids of actions currently running (button shows busy). */
  busyActionIds?: readonly string[];
}

const toneIcon: Record<ComposerNoticeTone, AgentIconName> = { neutral: 'info', info: 'info', warning: 'warning', danger: 'warning' };
const variantOf = { primary: 'primary', secondary: 'secondary', danger: 'secondary' } as const;

export const ComposerNotice = React.forwardRef<HTMLDivElement, ComposerNoticeProps>(function ComposerNotice(
  { message, actions, onAction, tone = 'info', icon, live = 'off', busyActionIds, className, ...rest },
  ref,
) {
  const m = useAgentMessages().composer;
  const glyph = icon === undefined ? toneIcon[tone] : icon;
  const showActions = onAction !== undefined && actions !== undefined && actions.length > 0;
  return (
    <div {...rest} ref={ref} className={cx('rl-agent-composer-notice', className)} data-slot="composer-notice" data-tone={tone} role={live === 'off' ? 'note' : undefined}>
      <p className="rl-agent-composer-notice__message" role={live === 'polite' ? 'status' : undefined}>
        {glyph !== null && <AgentIcon name={glyph} className="rl-agent-composer-notice__icon" />}
        <span className="rl-agent-composer-notice__text">
          <span className="rl-agent-sr">{m.noticeTone[tone]}</span>
          {message}
        </span>
      </p>
      {showActions && (
        <div className="rl-agent-composer-notice__actions">
          {actions.map((action) => (
            <Button
              key={action.id}
              size="sm"
              variant={variantOf[action.tone ?? 'secondary']}
              data-tone={action.tone}
              className="rl-agent-composer-notice__action"
              loading={busyActionIds?.includes(action.id)}
              onClick={() => onAction(action.id)}
            >
              {action.label}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
});
