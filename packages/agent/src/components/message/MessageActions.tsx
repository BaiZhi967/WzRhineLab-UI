'use client';

import * as React from 'react';
import { IconButton, Tooltip } from '@wzrhine/react';
import { capability } from '@wzrhine/agent-core';
import type { Capability, CapabilityInput } from '@wzrhine/agent-core';
import { AgentIcon } from '../../primitives/icons.js';
import { useAgentMessages } from '../../provider/AgentMessages.js';
import { cx } from '../../utils/cx.js';
import { MessageIcon } from './icons.js';
import { useClipboardAvailable, useCopy } from './use-copy.js';
import type { CopyHandler } from './use-copy.js';

export type MessageFeedback = 'up' | 'down';

/** Actions that can be gated by a capability. */
export type MessageActionKey = 'copy' | 'regenerate' | 'edit' | 'fork' | 'restore' | 'feedback';

/** Per-action availability: `Capability` (`{ enabled, reason }`) or a boolean. Absent = enabled. */
export type MessageActionCapabilities = Partial<Record<MessageActionKey, CapabilityInput>>;

/**
 * MessageActions: a `role="toolbar"` of icon buttons for one message. A capability without a
 * callback renders no button (ADR-0011 §4); copy appears when `copyText` is given and either
 * `onCopy` or the Clipboard API exists. One tab stop: arrow keys / Home / End move between the
 * buttons (roving tabindex), Tab leaves the toolbar.
 *
 * Capabilities: an action whose capability is `enabled: false` still renders (the reader learns
 * it exists and why it is off) but is `aria-disabled` — it stays focusable and in the roving
 * order — and its callback is never called. The reason shows in a Tooltip ("name · reason") on
 * hover / focus and is the button's `aria-describedby` text, so it is not hover-only.
 *
 * `onRestoreInput` ("重新编辑本轮输入") puts this turn's input back into the composer; it is a
 * different action from `onEdit` ("编辑消息"), which edits the sent message.
 *
 * Copy feedback: the button's name and icon switch to "已复制" / "复制失败" for 1.2s and a polite
 * status announces it once. Feedback buttons are toggles (`aria-pressed`); pressing the active
 * one again sends `null`. No motion beyond the IconButton press; the Tooltip uses its own fade.
 */
export type MessageActionsProps = Omit<React.HTMLAttributes<HTMLDivElement>, 'children' | 'onCopy'> & {
  /** Text copied by the copy action; omit to hide copy. */
  copyText?: string;
  onCopy?: CopyHandler;
  onRegenerate?: () => void;
  onEdit?: () => void;
  onFork?: () => void;
  /** Restore this turn's input into the composer (not the same as `onEdit`). */
  onRestoreInput?: () => void;
  feedback?: MessageFeedback | null;
  onFeedback?: (value: MessageFeedback | null) => void;
  /** Availability per action; a disabled one is shown `aria-disabled` with its reason. */
  capabilities?: MessageActionCapabilities;
  /** Toolbar name; defaults to the copy table. */
  label?: string;
  /** Extra trailing buttons (rendered inside the toolbar, part of the roving order). */
  children?: React.ReactNode;
  /** Preferred action order; omitted uses the library order. */
  order?: MessageActionKey[];
};

type ActionButtonProps = {
  action: string;
  label: string;
  icon: React.ReactNode;
  cap: Capability | undefined;
  onPress: () => void;
  pressed?: boolean;
  state?: string;
};

/**
 * One toolbar button. The Tooltip wrapper is always present (enabled only while the action is
 * off), so a capability flip never remounts the button or drops focus.
 */
function ActionButton({ action, label, icon, cap, onPress, pressed, state }: ActionButtonProps) {
  const t = useAgentMessages().message;
  const reasonId = React.useId();
  const off = cap !== undefined && !cap.enabled;
  const reason = off && cap.reason ? cap.reason : undefined;
  return (
    <>
      <Tooltip content={reason ? t.actionUnavailable(label, reason) : label} disabled={!off}>
        <IconButton
          size="sm"
          variant="ghost"
          label={label}
          data-action={action}
          data-state={state}
          pressed={pressed}
          icon={icon}
          aria-disabled={off || undefined}
          aria-describedby={reason ? reasonId : undefined}
          // While off the Tooltip shows name + reason; a native title would duplicate it.
          title={off ? '' : undefined}
          onClick={(event) => {
            if (off) {
              event.preventDefault();
              return;
            }
            onPress();
          }}
        />
      </Tooltip>
      {reason && (
        <span id={reasonId} className="rl-agent-sr">
          {reason}
        </span>
      )}
    </>
  );
}

export const MessageActions = React.forwardRef<HTMLDivElement, MessageActionsProps>(function MessageActions(
  { copyText, onCopy, onRegenerate, onEdit, onFork, onRestoreInput, feedback = null, onFeedback, capabilities, label, children, order, className, onKeyDown, ...rest },
  ref,
) {
  const t = useAgentMessages().message;
  const clipboard = useClipboardAvailable();
  const { state, failed, copy } = useCopy(onCopy);
  const [active, setActive] = React.useState(0);
  const root = React.useRef<HTMLDivElement | null>(null);
  React.useImperativeHandle(ref, () => root.current as HTMLDivElement);

  const cap = (key: MessageActionKey) => capability(capabilities?.[key]);
  const canCopy = copyText !== undefined && (onCopy !== undefined || clipboard);
  const copyName = state === 'copied' ? t.copied : state === 'failed' ? t.copyFailed : t.copy;

  // aria-disabled buttons stay in the roving order: they keep focus and explain why they are off.
  const buttons = () => Array.from(root.current?.querySelectorAll<HTMLButtonElement>('button:not([disabled])') ?? []);

  // Keep exactly one button in the tab order; re-applied after every render (buttons may change).
  React.useLayoutEffect(() => {
    const list = buttons();
    const index = Math.min(active, list.length - 1);
    list.forEach((button, i) => {
      button.tabIndex = i === index ? 0 : -1;
    });
  });

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(event);
    if (event.defaultPrevented) return;
    const list = buttons();
    const current = list.indexOf(document.activeElement as HTMLButtonElement);
    if (current === -1) return;
    let next = current;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (current + 1) % list.length;
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = (current - 1 + list.length) % list.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = list.length - 1;
    else return;
    event.preventDefault();
    setActive(next);
    list[next]?.focus();
  };

  const handleFocus = (event: React.FocusEvent<HTMLDivElement>) => {
    const index = buttons().indexOf(event.target as unknown as HTMLButtonElement);
    if (index !== -1) setActive(index);
  };

  const hasAny = canCopy || onRegenerate || onEdit || onFork || onRestoreInput || onFeedback || children;
  if (!hasAny) return null;

  return (
    <div
      {...rest}
      ref={root}
      role="toolbar"
      aria-label={label ?? t.actionsLabel}
      aria-orientation="horizontal"
      className={cx('rl-agent-actions', className)}
      data-order={order?.join(' ') || undefined}
      onKeyDown={handleKeyDown}
      onFocus={handleFocus}
    >
      {canCopy && (
        <ActionButton
          action="copy"
          label={copyName}
          state={state}
          cap={cap('copy')}
          icon={<AgentIcon name={state === 'copied' ? 'check' : 'copy'} />}
          onPress={() => void copy(copyText)}
        />
      )}
      {onRegenerate && <ActionButton action="regenerate" label={t.regenerate} cap={cap('regenerate')} icon={<AgentIcon name="retry" />} onPress={onRegenerate} />}
      {onEdit && <ActionButton action="edit" label={t.edit} cap={cap('edit')} icon={<AgentIcon name="edit" />} onPress={onEdit} />}
      {onRestoreInput && (
        <ActionButton action="restore" label={t.restoreInput} cap={cap('restore')} icon={<MessageIcon name="restore-input" />} onPress={onRestoreInput} />
      )}
      {onFork && <ActionButton action="fork" label={t.fork} cap={cap('fork')} icon={<AgentIcon name="fork" />} onPress={onFork} />}
      {onFeedback && (
        <>
          <ActionButton
            action="feedback-up"
            label={t.feedbackUp}
            cap={cap('feedback')}
            pressed={feedback === 'up'}
            icon={<MessageIcon name="thumb-up" />}
            onPress={() => onFeedback(feedback === 'up' ? null : 'up')}
          />
          <ActionButton
            action="feedback-down"
            label={t.feedbackDown}
            cap={cap('feedback')}
            pressed={feedback === 'down'}
            icon={<MessageIcon name="thumb-down" />}
            onPress={() => onFeedback(feedback === 'down' ? null : 'down')}
          />
        </>
      )}
      {children}
      {failed && <p className="rl-agent-actions__error" role="alert">{t.copyFailed}</p>}
      {canCopy && (
        <span className="rl-agent-sr" role="status">
          {state === 'copied' ? t.copied : state === 'failed' ? t.copyFailed : ''}
        </span>
      )}
    </div>
  );
});
