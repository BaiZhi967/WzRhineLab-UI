'use client';

import * as React from 'react';
import { IconButton } from '@wzrhine/react';
import { AgentIcon } from '../../primitives/icons.js';
import { useAgentMessages } from '../../provider/AgentMessages.js';
import { cx } from '../../utils/cx.js';
import { MessageIcon } from './icons.js';
import { useClipboardAvailable, useCopy } from './use-copy.js';
import type { CopyHandler } from './use-copy.js';

export type MessageFeedback = 'up' | 'down';

/**
 * MessageActions: a `role="toolbar"` of icon buttons for one message. A capability without a
 * callback renders no button (ADR-0011 §4); copy appears when `copyText` is given and either
 * `onCopy` or the Clipboard API exists. One tab stop: arrow keys / Home / End move between the
 * buttons (roving tabindex), Tab leaves the toolbar.
 *
 * Copy feedback: the button's name and icon switch to "已复制" / "复制失败" for 1.2s and a polite
 * status announces it once. Feedback buttons are toggles (`aria-pressed`); pressing the active
 * one again sends `null`. No motion beyond the IconButton press.
 */
export type MessageActionsProps = Omit<React.HTMLAttributes<HTMLDivElement>, 'children' | 'onCopy'> & {
  /** Text copied by the copy action; omit to hide copy. */
  copyText?: string;
  onCopy?: CopyHandler;
  onRegenerate?: () => void;
  onEdit?: () => void;
  onFork?: () => void;
  feedback?: MessageFeedback | null;
  onFeedback?: (value: MessageFeedback | null) => void;
  /** Toolbar name; defaults to the copy table. */
  label?: string;
  /** Extra trailing buttons (rendered inside the toolbar, part of the roving order). */
  children?: React.ReactNode;
};

export const MessageActions = React.forwardRef<HTMLDivElement, MessageActionsProps>(function MessageActions(
  { copyText, onCopy, onRegenerate, onEdit, onFork, feedback = null, onFeedback, label, children, className, onKeyDown, ...rest },
  ref,
) {
  const t = useAgentMessages().message;
  const clipboard = useClipboardAvailable();
  const { state, copy } = useCopy(onCopy);
  const [active, setActive] = React.useState(0);
  const root = React.useRef<HTMLDivElement | null>(null);
  React.useImperativeHandle(ref, () => root.current as HTMLDivElement);

  const canCopy = copyText !== undefined && (onCopy !== undefined || clipboard);
  const copyName = state === 'copied' ? t.copied : state === 'failed' ? t.copyFailed : t.copy;

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

  const hasAny = canCopy || onRegenerate || onEdit || onFork || onFeedback || children;
  if (!hasAny) return null;

  return (
    <div
      {...rest}
      ref={root}
      role="toolbar"
      aria-label={label ?? t.actionsLabel}
      aria-orientation="horizontal"
      className={cx('rl-agent-actions', className)}
      onKeyDown={handleKeyDown}
      onFocus={handleFocus}
    >
      {canCopy && (
        <IconButton
          size="sm"
          variant="ghost"
          label={copyName}
          data-action="copy"
          data-state={state}
          icon={<AgentIcon name={state === 'copied' ? 'check' : 'copy'} />}
          onClick={() => void copy(copyText)}
        />
      )}
      {onRegenerate && <IconButton size="sm" variant="ghost" label={t.regenerate} data-action="regenerate" icon={<AgentIcon name="retry" />} onClick={onRegenerate} />}
      {onEdit && <IconButton size="sm" variant="ghost" label={t.edit} data-action="edit" icon={<AgentIcon name="edit" />} onClick={onEdit} />}
      {onFork && <IconButton size="sm" variant="ghost" label={t.fork} data-action="fork" icon={<AgentIcon name="fork" />} onClick={onFork} />}
      {onFeedback && (
        <>
          <IconButton
            size="sm"
            variant="ghost"
            label={t.feedbackUp}
            data-action="feedback-up"
            pressed={feedback === 'up'}
            icon={<MessageIcon name="thumb-up" />}
            onClick={() => onFeedback(feedback === 'up' ? null : 'up')}
          />
          <IconButton
            size="sm"
            variant="ghost"
            label={t.feedbackDown}
            data-action="feedback-down"
            pressed={feedback === 'down'}
            icon={<MessageIcon name="thumb-down" />}
            onClick={() => onFeedback(feedback === 'down' ? null : 'down')}
          />
        </>
      )}
      {children}
      {canCopy && (
        <span className="rl-agent-sr" role="status">
          {state === 'copied' ? t.copied : state === 'failed' ? t.copyFailed : ''}
        </span>
      )}
    </div>
  );
});
