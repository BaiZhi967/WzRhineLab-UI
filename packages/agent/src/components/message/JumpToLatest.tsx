'use client';

import * as React from 'react';
import { MotionPresence, Spinner } from '@wzrhine/react';
import { AgentIcon } from '../../primitives/icons.js';
import { useAgentMessages } from '../../provider/AgentMessages.js';
import { cx } from '../../utils/cx.js';

/**
 * JumpToLatest (atlas 35): floating pill shown while the reader is away from the newest content.
 * A real `<button>` named "返回最新消息" (+ "N 条新消息" when `unreadCount` > 0). Appearing never
 * moves focus; if the button held focus when it hides, focus is left to the caller (MessageList
 * moves nothing — the viewport keeps the reading position).
 *
 * `loading`: the jump is in progress (smooth scroll / fetching the tail): `aria-busy`, spinner.
 * Motion: MotionPresence `fade` (opacity, `fast`); reduced motion shows / hides at once.
 */
export type JumpToLatestProps = Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'onClick' | 'type'> & {
  /** At the newest content: the button is hidden. */
  atLatest: boolean;
  unreadCount?: number;
  onJump: () => void;
  loading?: boolean;
  label?: string;
};

export const JumpToLatest = React.forwardRef<HTMLButtonElement, JumpToLatestProps>(function JumpToLatest(
  { atLatest, unreadCount = 0, onJump, loading = false, label, className, ...rest },
  ref,
) {
  const t = useAgentMessages().message;
  const name = label ?? t.jumpToLatest;
  const count = unreadCount > 0 ? t.newMessages(unreadCount) : undefined;
  return (
    <MotionPresence show={!atLatest} preset="fade" className="rl-agent-jump" data-slot="jump-to-latest">
      <button
        {...rest}
        ref={ref}
        type="button"
        className={cx('rl-agent-jump__button', className)}
        aria-label={count ? t.jumpWithCount(name, count) : name}
        aria-busy={loading || undefined}
        data-unread={unreadCount > 0 || undefined}
        onClick={() => {
          if (!loading) onJump();
        }}
      >
        {loading ? <Spinner size="sm" /> : <AgentIcon name="arrow-down" className="rl-agent-jump__icon" />}
        <span className="rl-agent-jump__label">{name}</span>
        {count && <span className="rl-agent-jump__count">{count}</span>}
      </button>
    </MotionPresence>
  );
});
