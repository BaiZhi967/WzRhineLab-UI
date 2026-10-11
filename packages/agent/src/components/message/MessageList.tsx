'use client';

import * as React from 'react';
import { Button, EmptyState, Spinner, useRhineMotion } from '@wzrhine/react';
import type { MessageView } from '@wzrhine/agent-core';
import { AgentEntrance } from '../../motion/agent-motion.js';
import { useAgentMessages } from '../../provider/AgentMessages.js';
import { cx } from '../../utils/cx.js';
import { AgentMessage } from './AgentMessage.js';
import type { AgentMessageProps } from './AgentMessage.js';
import { JumpToLatest } from './JumpToLatest.js';

/** Distance from the bottom (px, measured in JS) that still counts as "at the latest content". */
export const FOLLOW_THRESHOLD_PX = 4;

/** Imperative handle of MessageList. */
export interface MessageListHandle {
  /** Scroll to the newest content and resume following (smooth unless motion is reduced). */
  scrollToLatest: (options?: { smooth?: boolean }) => void;
  /** Whether the list currently follows new content. */
  isFollowing: () => boolean;
  /** The scrolling viewport element. */
  viewport: () => HTMLElement | null;
}

/**
 * MessageList (atlas 07): the conversation viewport. It owns its own vertical scroll and decides
 * when to follow new content; it never moves focus.
 *
 * Semantics: a focusable `<section aria-label="对话消息">` (keyboard scrolling) containing an
 * `<ol>` of messages. Deliberately **not** `role="log"`: a log is an implicit polite live region
 * and would read streamed text token by token. Announcements come from each AgentMessage's own
 * throttled status line instead.
 *
 * Scroll ownership:
 * - Follows the bottom while the reader is within `FOLLOW_THRESHOLD_PX` of it (on mount, while
 *   streaming, when a disclosure grows — content size is watched with ResizeObserver).
 * - Stops following as soon as the reader moves up: wheel up, touch drag, PageUp / Home /
 *   ArrowUp on the viewport, scrollbar drag (any scroll that decreases `scrollTop` and was not
 *   made by the list itself). Resumes when the reader is back at the bottom.
 * - While not following, JumpToLatest shows, counting messages appended since the reader left.
 * - A new trailing user message (just sent) scrolls to the latest once.
 * - Loading earlier messages keeps the reading anchor: the first visible `[data-message-id]` and
 *   its offset are recorded before `onLoadEarlier` and restored after the prepend.
 * - `overflow-anchor: none`, so browser scroll anchoring never fights these rules.
 *
 * Motion: only messages that appear after mount (appended, not prepended history) play the
 * AgentEntrance `message` entrance, once. No layout animation on the list. The jump uses a smooth
 * scroll, `auto` under reduced motion.
 */
export type MessageListProps = Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> & {
  messages: MessageView[];
  /** Custom rendering per message; the list still wraps it in a keyed `<li data-message-id>`. */
  renderMessage?: (message: MessageView, index: number) => React.ReactNode;
  /** Props forwarded to the default AgentMessage (handlers, renderers). */
  messageProps?: Omit<AgentMessageProps, 'message'>;
  isStreaming?: boolean;
  /** First load: no messages yet. */
  loading?: boolean;
  hasEarlier?: boolean;
  onLoadEarlier?: () => void;
  loadingEarlier?: boolean;
  /** Error text for the last earlier-load attempt; shows a retry button. */
  earlierError?: React.ReactNode;
  /** Replaces the default empty state. */
  empty?: React.ReactNode;
  /** Content after the last message inside the scroller (run summary, typing line). */
  footer?: React.ReactNode;
  onFollowChange?: (following: boolean) => void;
  /** Accessible name of the viewport. */
  label?: string;
  /** Turn off entrance motion for appended messages. */
  animateEntrance?: boolean;
};

type Anchor = { id: string; offset: number };

function itemNodes(viewport: HTMLElement): HTMLElement[] {
  return Array.from(viewport.querySelectorAll<HTMLElement>('li[data-message-id]'));
}

function distanceFromBottom(el: HTMLElement): number {
  return el.scrollHeight - el.scrollTop - el.clientHeight;
}

/** First message whose box is (partly) below the viewport's top edge, with its offset from it. */
function captureAnchor(viewport: HTMLElement): Anchor | null {
  const top = viewport.getBoundingClientRect().top;
  const nodes = itemNodes(viewport);
  const node = nodes.find((el) => el.getBoundingClientRect().bottom > top) ?? nodes[0];
  const id = node?.dataset.messageId;
  return node && id ? { id, offset: node.getBoundingClientRect().top - top } : null;
}

const UP_KEYS = new Set(['ArrowUp', 'PageUp', 'Home']);

export const MessageList = React.forwardRef<MessageListHandle, MessageListProps>(function MessageList(
  {
    messages,
    renderMessage,
    messageProps,
    isStreaming = false,
    loading = false,
    hasEarlier = false,
    onLoadEarlier,
    loadingEarlier = false,
    earlierError,
    empty,
    footer,
    onFollowChange,
    label,
    animateEntrance = true,
    className,
    ...rest
  },
  ref,
) {
  const t = useAgentMessages().message;
  const { reduced } = useRhineMotion();
  const viewportRef = React.useRef<HTMLElement | null>(null);
  const contentRef = React.useRef<HTMLDivElement | null>(null);
  const followingRef = React.useRef(true);
  const [following, setFollowingState] = React.useState(true);
  const [leaveLastId, setLeaveLastId] = React.useState<string | null>(null);
  const lastTop = React.useRef(0);
  const touchY = React.useRef<number | null>(null);
  const anchor = React.useRef<Anchor | null>(null);
  const messagesRef = React.useRef(messages);
  messagesRef.current = messages;

  const setFollowing = React.useCallback((next: boolean) => {
    if (followingRef.current === next) return;
    followingRef.current = next;
    setFollowingState(next);
    setLeaveLastId(next ? null : (messagesRef.current[messagesRef.current.length - 1]?.id ?? null));
  }, []);

  /** Programmatic scroll: remembered as the last position so the scroll event is not read as intent. */
  const setTop = React.useCallback((value: number) => {
    const el = viewportRef.current;
    if (!el) return;
    el.scrollTop = value;
    lastTop.current = el.scrollTop;
  }, []);

  const toBottom = React.useCallback(() => {
    const el = viewportRef.current;
    if (el) setTop(el.scrollHeight);
  }, [setTop]);

  const restoreAnchor = React.useCallback((): boolean => {
    const el = viewportRef.current;
    const saved = anchor.current;
    if (!el || !saved) return false;
    const node = itemNodes(el).find((n) => n.dataset.messageId === saved.id);
    if (!node) {
      anchor.current = null;
      return false;
    }
    setTop(el.scrollTop + node.getBoundingClientRect().top - el.getBoundingClientRect().top - saved.offset);
    return true;
  }, [setTop]);

  const scrollToLatest = React.useCallback(
    (options?: { smooth?: boolean }) => {
      const el = viewportRef.current;
      anchor.current = null;
      setFollowing(true);
      if (!el) return;
      const smooth = (options?.smooth ?? true) && !reduced;
      if (smooth && typeof el.scrollTo === 'function') el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
      else toBottom();
    },
    [reduced, setFollowing, toBottom],
  );

  React.useImperativeHandle(
    ref,
    () => ({ scrollToLatest, isFollowing: () => followingRef.current, viewport: () => viewportRef.current }),
    [scrollToLatest],
  );

  const releaseFollow = React.useCallback(() => {
    const el = viewportRef.current;
    if (!el || el.scrollHeight <= el.clientHeight) return;
    setFollowing(false);
  }, [setFollowing]);

  // Prepend detection: read the old DOM before React commits the new list (snapshot pattern).
  const prevFirst = React.useRef(messages[0]?.id);
  if (messages[0]?.id !== prevFirst.current && anchor.current === null && viewportRef.current && !followingRef.current) {
    anchor.current = captureAnchor(viewportRef.current);
  }

  // Entrance only for messages appended after mount; prepended history and the first render stay still.
  const known = React.useRef<Set<string> | null>(null);
  if (known.current === null) known.current = new Set(messages.map((m) => m.id));
  let lastKnownIndex = -1;
  messages.forEach((m, i) => {
    if (known.current!.has(m.id)) lastKnownIndex = i;
  });
  // Nothing in common with what was shown before (conversation switch, snapshot reload): history.
  const replaced = lastKnownIndex === -1 && known.current.size > 0;
  const replacedRef = React.useRef(false);
  replacedRef.current = replaced;

  const prevLast = React.useRef(messages[messages.length - 1]?.id);
  React.useLayoutEffect(() => {
    const ids = known.current!;
    if (replacedRef.current) {
      // A different conversation: start at its latest content, following.
      anchor.current = null;
      setFollowing(true);
    }
    for (const m of messages) ids.add(m.id);
    prevFirst.current = messages[0]?.id;

    const last = messages[messages.length - 1];
    const sent = last !== undefined && last.id !== prevLast.current && last.role === 'user';
    prevLast.current = last?.id;

    if (restoreAnchor()) {
      if (!loadingEarlier) anchor.current = null;
      return;
    }
    if (sent) scrollToLatest({ smooth: false });
    else if (followingRef.current) toBottom();
  }, [messages, loadingEarlier, restoreAnchor, scrollToLatest, setFollowing, toBottom]);

  // Content growth (streaming text, disclosures, images): keep the bottom or the anchor.
  React.useEffect(() => {
    const content = contentRef.current;
    if (!content || typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(() => {
      if (restoreAnchor()) return;
      if (followingRef.current) toBottom();
    });
    observer.observe(content);
    return () => observer.disconnect();
  }, [restoreAnchor, toBottom]);

  const reportedFollow = React.useRef(following);
  React.useEffect(() => {
    if (reportedFollow.current === following) return;
    reportedFollow.current = following;
    onFollowChange?.(following);
  }, [following, onFollowChange]);

  const handleScroll = () => {
    const el = viewportRef.current;
    if (!el) return;
    const top = el.scrollTop;
    const distance = distanceFromBottom(el);
    // Programmatic moves update `lastTop` first, so any other change is the reader's own scroll.
    if (Math.abs(top - lastTop.current) > 1 && !loadingEarlier) anchor.current = null;
    if (top < lastTop.current - 1 && distance > FOLLOW_THRESHOLD_PX) {
      // Moved up and not by us: scrollbar drag, keyboard, wheel, touch, find-in-page.
      releaseFollow();
    } else if (distance <= FOLLOW_THRESHOLD_PX && !anchor.current) {
      setFollowing(true);
    }
    lastTop.current = top;
  };

  const handleLoadEarlier = () => {
    const el = viewportRef.current;
    if (!onLoadEarlier || loadingEarlier) return;
    if (el) anchor.current = captureAnchor(el);
    setFollowing(false);
    onLoadEarlier();
  };

  React.useEffect(() => {
    if (earlierError) anchor.current = null;
  }, [earlierError]);

  const unread = (() => {
    if (following || leaveLastId === null) return 0;
    const index = messages.findIndex((m) => m.id === leaveLastId);
    return index === -1 ? 0 : messages.length - 1 - index;
  })();

  const ownsEvent = (target: EventTarget) => target instanceof Node && viewportRef.current?.contains(target) === true;
  const showEmpty = messages.length === 0 && !loading;

  return (
    <div {...rest} className={cx('rl-agent-list', className)} data-following={following || undefined} data-streaming={isStreaming || undefined}>
      <section
        ref={viewportRef}
        className="rl-agent-list__viewport"
        aria-label={label ?? t.listLabel}
        aria-busy={loading || loadingEarlier || undefined}
        tabIndex={0}
        onScroll={handleScroll}
        onWheel={(event) => {
          if (!ownsEvent(event.target)) return;
          anchor.current = null;
          if (event.deltaY < 0) releaseFollow();
        }}
        onKeyDown={(event) => {
          if (event.target !== event.currentTarget) return;
          if (UP_KEYS.has(event.key) || (event.key === ' ' && event.shiftKey)) {
            anchor.current = null;
            releaseFollow();
          }
        }}
        onTouchStart={(event) => {
          touchY.current = event.touches[0]?.clientY ?? null;
        }}
        onTouchMove={(event) => {
          const y = event.touches[0]?.clientY;
          if (touchY.current !== null && y !== undefined) {
            if (y > touchY.current) {
              anchor.current = null;
              releaseFollow();
            }
            touchY.current = y;
          }
        }}
        onTouchEnd={() => {
          touchY.current = null;
        }}
      >
        <div ref={contentRef} className="rl-agent-list__content">
          {hasEarlier && onLoadEarlier && (
            <div className="rl-agent-list__earlier">
              {earlierError ? (
                <p className="rl-agent-list__earlier-error">
                  <span>{earlierError === true ? t.earlierFailed : earlierError}</span>
                  <Button size="sm" variant="secondary" onClick={handleLoadEarlier}>
                    {t.retryEarlier}
                  </Button>
                </p>
              ) : (
                <Button size="sm" variant="ghost" loading={loadingEarlier} onClick={handleLoadEarlier}>
                  {loadingEarlier ? t.loadingEarlier : t.loadEarlier}
                </Button>
              )}
            </div>
          )}
          {loading && messages.length === 0 && (
            <div className="rl-agent-list__loading">
              <Spinner size="sm" label={t.loading} />
              <span aria-hidden="true">{t.loading}</span>
            </div>
          )}
          {showEmpty && <div className="rl-agent-list__empty">{empty ?? <EmptyState size="sm" title={t.empty} description={t.emptyDescription} />}</div>}
          {messages.length > 0 && (
            <ol className="rl-agent-list__items">
              {messages.map((message, index) => {
                const appended = !replaced && !known.current!.has(message.id) && index > lastKnownIndex;
                return (
                  <AgentEntrance
                    key={message.id}
                    as="li"
                    kind="message"
                    animate={animateEntrance && appended}
                    className="rl-agent-list__item"
                    data-message-id={message.id}
                    data-role={message.role}
                  >
                    {renderMessage ? renderMessage(message, index) : <AgentMessage {...messageProps} message={message} />}
                  </AgentEntrance>
                );
              })}
            </ol>
          )}
          {footer != null && <div className="rl-agent-list__footer">{footer}</div>}
        </div>
      </section>
      <div className="rl-agent-list__jump">
        <JumpToLatest atLatest={following} unreadCount={unread} onJump={() => scrollToLatest()} />
      </div>
    </div>
  );
});
