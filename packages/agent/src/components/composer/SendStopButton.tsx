'use client';

import * as React from 'react';
import { motion } from 'motion/react';
import { Tooltip, pressScale, useRhineMotion } from '@wzrhine/react';
import type { ActionReceipt, ActionStatus, DraftStatus, RunStatus } from '@wzrhine/agent-core';
import { useSwapTransition } from '../../motion/agent-motion.js';
import { AgentIcon } from '../../primitives/icons.js';
import { useAgentMessages } from '../../provider/AgentMessages.js';
import { cx } from '../../utils/cx.js';
import { resolveSendStop } from './composer-utils.js';
import type { SendStopState } from './composer-utils.js';

type MotionConflictingProps = 'onDrag' | 'onDragStart' | 'onDragEnd' | 'onAnimationStart' | 'onAnimationEnd' | 'onAnimationIteration';

export type SendStopButtonProps = Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  'children' | 'onClick' | 'disabled' | 'aria-label' | 'type' | MotionConflictingProps
> & {
  /** There is something to send (non-empty text, nothing uploading, within limits). */
  canSend: boolean;
  /** Force a mode. Default: `stop` while `canStopRun(runStatus)` or `cancelling`, else `send`. */
  mode?: 'send' | 'stop';
  runStatus?: RunStatus;
  /** Receipt of the last send (`submitting` → inert, `unknown` → 结果待确认). */
  sendReceipt?: ActionReceipt | ActionStatus;
  /** Receipt of the last stop request (`submitting` / `accepted` while the run still runs → 停止待确认). */
  stopReceipt?: ActionReceipt | ActionStatus;
  draftStatus?: DraftStatus;
  onSend?: () => void;
  onStop?: () => void;
  /**
   * Retry an `unknown` action with its original `actionId` (ADR-0011 §4). Without it, or when the
   * receipt says `retryable: false`, the unknown state is inert so no duplicate action is created.
   */
  onRetry?: (kind: 'send' | 'stop', actionId: string | undefined) => void;
  /** Draft save failed: the button becomes 重试保存. */
  onRetrySave?: () => void;
  retryBusy?: boolean;
  /** Why sending is not possible; shown in the tooltip and linked with aria-describedby. */
  disabledReason?: string;
  /** Override labels per state. */
  labels?: Partial<Record<SendStopState | 'send-retry' | 'stop-retry', string>>;
  className?: string;
};

function toReceipt(input: ActionReceipt | ActionStatus | undefined): ActionReceipt | undefined {
  if (input === undefined) return undefined;
  return typeof input === 'string' ? { status: input } : input;
}

/**
 * One persistent button for send ↔ stop (atlas 18). It is the same `<button>` element in every
 * state, so focus is never lost when it switches; inert states use `aria-disabled` (still
 * focusable, announced) instead of the native `disabled` attribute.
 *
 * States: 发送 (enabled when `canSend`), 正在发送 (inert, aria-busy), 停止生成, 停止待确认 (stop
 * sent ≠ stopped: inert until the run status changes), 结果待确认 (unknown receipt: inert, or
 * 重试同一发送 / 重试同一停止 with the original actionId), 重试保存.
 *
 * Motion: the send arrow and stop square are stacked and cross-fade with motion/react opacity
 * (`useSwapTransition`: in `base`, out `fast`); a fast toggle continues from the current
 * opacity. Reduced motion → instant swap. Press feedback matches IconButton.
 */
export const SendStopButton = React.forwardRef<HTMLButtonElement, SendStopButtonProps>(function SendStopButton(
  {
    canSend,
    mode,
    runStatus,
    sendReceipt,
    stopReceipt,
    draftStatus,
    onSend,
    onStop,
    onRetry,
    onRetrySave,
    retryBusy = false,
    disabledReason,
    labels,
    className,
    'aria-describedby': describedByProp,
    ...rest
  },
  ref,
) {
  const messages = useAgentMessages().composer;
  const { enter, exit } = useSwapTransition();
  const { reduced, get } = useRhineMotion();
  const reasonId = React.useId();
  const send = toReceipt(sendReceipt);
  const stop = toReceipt(stopReceipt);
  const unknown = stop?.status === 'unknown' ? stop : send;
  const resolved = resolveSendStop({
    canSend,
    mode,
    runStatus,
    sendStatus: send?.status,
    stopStatus: stop?.status,
    draftStatus,
    hasSend: onSend !== undefined,
    hasStop: onStop !== undefined,
    hasRetry: onRetry !== undefined,
    retryable: unknown?.retryable,
    hasRetrySave: onRetrySave !== undefined,
  });
  const { state, enabled: resolvedEnabled, action, icon } = resolved;
  const enabled = retryBusy && state === 'retry-save' ? false : resolvedEnabled;

  const label =
    state === 'send'
      ? (labels?.send ?? messages.send)
      : state === 'sending'
        ? (labels?.sending ?? messages.sending)
        : state === 'send-unknown'
          ? action
            ? (labels?.['send-retry'] ?? messages.retrySameSend)
            : (labels?.['send-unknown'] ?? messages.resultPending)
          : state === 'retry-save'
            ? (labels?.['retry-save'] ?? messages.retrySave)
            : state === 'stop'
              ? (labels?.stop ?? messages.stop)
              : state === 'stop-pending'
                ? (labels?.['stop-pending'] ?? messages.stopPending)
                : action
                  ? (labels?.['stop-retry'] ?? messages.retrySameStop)
                  : (labels?.['stop-unknown'] ?? messages.resultPending);

  const reason = state === 'send' && !enabled ? disabledReason : undefined;
  const shownIcon: 'send' | 'stop' | 'retry' = action === 'retry' || action === 'retry-save' ? 'retry' : icon;

  const handleClick = () => {
    if (!enabled) return;
    if (action === 'send') onSend?.();
    else if (action === 'stop') onStop?.();
    else if (action === 'retry') {
      const kind = state === 'stop-unknown' ? 'stop' : 'send';
      onRetry?.(kind, (kind === 'stop' ? stop : send)?.actionId);
    } else if (action === 'retry-save') onRetrySave?.();
  };

  const button = (
    <motion.button
      {...rest}
      ref={ref}
      type="button"
      className={cx('rl-agent-send', className)}
      data-state={state}
      data-icon={shownIcon}
      aria-label={label}
      aria-disabled={enabled ? undefined : true}
      aria-busy={state === 'sending' || state === 'stop-pending' || undefined}
      aria-describedby={cx(describedByProp, reason && reasonId) || undefined}
      onClick={handleClick}
      whileTap={enabled && !reduced ? { scale: pressScale } : undefined}
      transition={get('press')}
    >
      <span className="rl-agent-send__icons" aria-hidden="true">
        {(['send', 'stop', 'retry'] as const).map((name) => (
          <motion.span
            key={name}
            className="rl-agent-send__icon"
            data-visible={shownIcon === name || undefined}
            initial={false}
            animate={{ opacity: shownIcon === name ? 1 : 0 }}
            transition={shownIcon === name ? enter : exit}
          >
            <AgentIcon name={name} />
          </motion.span>
        ))}
      </span>
      {reason && (
        <span id={reasonId} className="rl-agent-sr">
          {reason}
        </span>
      )}
    </motion.button>
  );

  return <Tooltip content={reason ? `${label} · ${reason}` : label}>{button}</Tooltip>;
});
