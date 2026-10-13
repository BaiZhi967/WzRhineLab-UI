import * as React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MotionConfig } from 'motion/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { MessageView } from '@wzrhine/agent-core';
import { MessageList } from '../src/components/message/MessageList';
import type { MessageListHandle } from '../src/components/message/MessageList';
import { JumpToLatest } from '../src/components/message/JumpToLatest';
import { sampleMessages } from '../src/fixtures/session';

/*
 * jsdom has no layout: the viewport's scroll metrics are faked per element. `scrollHeight` grows
 * with the number of rendered messages; `scrollTop` is a clamped plain property.
 */
const ROW = 100;
const VIEW = 300;
let observers: Array<() => void> = [];

function fakeLayout() {
  const proto = HTMLElement.prototype;
  const tops = new WeakMap<Element, number>();
  const isViewport = (el: Element) => el.classList.contains('rl-agent-list__viewport');
  const rows = (el: Element) => el.querySelectorAll('li[data-message-id]').length;
  const spies = [
    vi.spyOn(proto, 'scrollHeight', 'get').mockImplementation(function (this: HTMLElement) {
      return isViewport(this) ? rows(this) * ROW : 0;
    }),
    vi.spyOn(proto, 'clientHeight', 'get').mockImplementation(function (this: HTMLElement) {
      return isViewport(this) ? VIEW : 0;
    }),
  ];
  Object.defineProperty(proto, 'scrollTop', {
    configurable: true,
    get(this: HTMLElement) {
      return tops.get(this) ?? 0;
    },
    set(this: HTMLElement, v: number) {
      const max = isViewport(this) ? Math.max(0, rows(this) * ROW - VIEW) : 0;
      tops.set(this, Math.max(0, Math.min(max, v)));
    },
  });
  // Message boxes: stacked rows offset by the viewport's scrollTop.
  const rect = vi.spyOn(proto, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
    const viewport = this.closest('.rl-agent-list__viewport') as HTMLElement | null;
    if (this.matches('li[data-message-id]') && viewport) {
      const index = Array.from(viewport.querySelectorAll('li[data-message-id]')).indexOf(this);
      const top = index * ROW - viewport.scrollTop;
      return { top, bottom: top + ROW, left: 0, right: 100, width: 100, height: ROW, x: 0, y: top, toJSON() {} } as DOMRect;
    }
    return { top: 0, bottom: VIEW, left: 0, right: 100, width: 100, height: VIEW, x: 0, y: 0, toJSON() {} } as DOMRect;
  });
  return () => {
    spies.forEach((s) => s.mockRestore());
    rect.mockRestore();
    Reflect.deleteProperty(proto, 'scrollTop');
  };
}

class FakeResizeObserver {
  constructor(private cb: () => void) {}
  observe() {
    observers.push(this.cb);
  }
  disconnect() {
    observers = observers.filter((c) => c !== this.cb);
  }
  unobserve() {}
}

const msg = (id: string, role: MessageView['role'] = 'assistant', text = `示例 ${id}`): MessageView => ({
  id,
  role,
  status: 'complete',
  parts: [{ type: 'text', id: `${id}-p`, text }],
});
const many = (n: number, from = 0) => Array.from({ length: n }, (_, i) => msg(`m${from + i}`));

let restore: () => void;
beforeEach(() => {
  restore = fakeLayout();
  observers = [];
  vi.stubGlobal('ResizeObserver', FakeResizeObserver);
});
afterEach(() => {
  restore();
  vi.unstubAllGlobals();
});

const viewport = () => screen.getByRole('region', { name: '对话消息' });
const jump = () => screen.queryByRole('button', { name: /返回最新消息/ });
const following = () => viewport().closest('.rl-agent-list')!.hasAttribute('data-following');

function scrollTo(top: number) {
  const el = viewport();
  el.scrollTop = top;
  fireEvent.scroll(el);
}

describe('MessageList semantics', () => {
  it('is a focusable labelled section with an ordered list, not a live log', () => {
    render(<MessageList messages={sampleMessages} />);
    const el = viewport();
    expect(el.tagName).toBe('SECTION');
    expect(el).toHaveAttribute('tabindex', '0');
    expect(el).not.toHaveAttribute('role', 'log');
    expect(el).not.toHaveAttribute('aria-live');
    expect(el.querySelector('ol')!.children).toHaveLength(4);
    expect(screen.getAllByRole('article')).toHaveLength(4);
  });

  it('empty and loading states', () => {
    const { rerender } = render(<MessageList messages={[]} />);
    expect(screen.getByText('还没有消息')).toBeInTheDocument();
    rerender(<MessageList messages={[]} empty={<p>自定义空</p>} />);
    expect(screen.getByText('自定义空')).toBeInTheDocument();
    rerender(<MessageList messages={[]} loading />);
    expect(screen.getByRole('status')).toHaveTextContent('正在加载消息');
    expect(viewport()).toHaveAttribute('aria-busy', 'true');
  });

  it('renderMessage and footer slots', () => {
    render(<MessageList messages={many(2)} renderMessage={(m) => <span>custom {m.id}</span>} footer={<p>运行摘要</p>} />);
    expect(screen.getByText('custom m0')).toBeInTheDocument();
    expect(screen.getByText('运行摘要')).toBeInTheDocument();
  });
});

describe('MessageList scroll ownership', () => {
  it('keeps follow ownership while the reader scrolls an inner code region', () => {
    render(<MessageList messages={many(6)} renderMessage={(message) => <pre data-scroll-ownership="inner">{message.id}</pre>} />);
    fireEvent.wheel(screen.getByText('m1'), { deltaY: -40 });
    expect(following()).toBe(true);
    fireEvent.touchStart(screen.getByText('m1'), { touches: [{ clientY: 10 }] });
    fireEvent.touchMove(screen.getByText('m1'), { touches: [{ clientY: 50 }] });
    expect(following()).toBe(true);
  });

  it('keeps a prepended reading anchor while historical content continues growing', () => {
    const { rerender } = render(<MessageList messages={many(6)} hasEarlier onLoadEarlier={() => {}} />);
    scrollTo(100);
    fireEvent.click(screen.getByRole('button', { name: '加载更早消息' }));
    rerender(<MessageList messages={[msg('old'), ...many(6)]} />);
    expect(viewport().scrollTop).toBe(200);
    const saved = viewport().scrollTop;
    act(() => observers.forEach((callback) => callback()));
    expect(viewport().scrollTop).toBe(saved);
  });
  it('starts at the bottom and follows appended content', () => {
    const { rerender } = render(<MessageList messages={many(5)} />);
    expect(viewport().scrollTop).toBe(200);
    rerender(<MessageList messages={many(6)} />);
    expect(viewport().scrollTop).toBe(300);
    expect(jump()).toBeNull();
  });

  it('scrolling up stops following; new content shows JumpToLatest with a count; jump returns', async () => {
    const onFollowChange = vi.fn();
    const { rerender } = render(<MessageList messages={many(6)} onFollowChange={onFollowChange} />);
    scrollTo(100);
    expect(onFollowChange).toHaveBeenLastCalledWith(false);
    rerender(<MessageList messages={many(8)} onFollowChange={onFollowChange} />);
    expect(viewport().scrollTop).toBe(100);
    const button = jump()!;
    expect(button).toHaveAccessibleName('返回最新消息，2 条新消息');
    expect(document.activeElement).not.toBe(button);
    await userEvent.click(button);
    expect(viewport().scrollTop).toBe(500);
    expect(onFollowChange).toHaveBeenLastCalledWith(true);
    await waitFor(() => expect(jump()).toBeNull());
  });

  it('keyboard PageUp / Home and wheel up release follow', () => {
    const { rerender } = render(<MessageList messages={many(6)} />);
    fireEvent.keyDown(viewport(), { key: 'PageUp' });
    rerender(<MessageList messages={many(7)} />);
    expect(viewport().scrollTop).toBe(300);
    expect(jump()).not.toBeNull();

    scrollTo(400);
    expect(following()).toBe(true);
    fireEvent.wheel(viewport(), { deltaY: -40 });
    rerender(<MessageList messages={many(8)} />);
    expect(viewport().scrollTop).toBe(400);
  });

  it('resumes following when the reader returns to the bottom', () => {
    const { rerender } = render(<MessageList messages={many(6)} />);
    scrollTo(50);
    scrollTo(300);
    rerender(<MessageList messages={many(7)} />);
    expect(viewport().scrollTop).toBe(400);
  });

  it('a newly sent user message scrolls to the latest once, even when reading history', async () => {
    const { rerender } = render(<MessageList messages={many(6)} />);
    scrollTo(0);
    rerender(<MessageList messages={[...many(6), msg('u1', 'user')]} />);
    expect(viewport().scrollTop).toBe(400);
    expect(following()).toBe(true);
    await waitFor(() => expect(jump()).toBeNull());
  });

  it('content growth (ResizeObserver) keeps the bottom while following only', () => {
    const { rerender } = render(<MessageList messages={many(4)} />);
    rerender(<MessageList messages={many(4)} />);
    const el = viewport();
    el.scrollTop = 0;
    // simulate growth with the reader still "following" (no scroll event fired)
    act(() => observers.forEach((cb) => cb()));
    expect(el.scrollTop).toBe(100);
    scrollTo(0);
    act(() => observers.forEach((cb) => cb()));
    expect(el.scrollTop).toBe(0);
  });

  it('loading earlier messages keeps the visible anchor', async () => {
    const onLoadEarlier = vi.fn();
    const { rerender } = render(<MessageList messages={many(6, 10)} hasEarlier onLoadEarlier={onLoadEarlier} />);
    scrollTo(150); // m11 is the first visible row (100..200), 50px above the top edge
    await userEvent.click(screen.getByRole('button', { name: '加载更早消息' }));
    expect(onLoadEarlier).toHaveBeenCalledTimes(1);
    rerender(<MessageList messages={many(6, 10)} hasEarlier onLoadEarlier={onLoadEarlier} loadingEarlier />);
    rerender(<MessageList messages={[...many(3, 0), ...many(6, 10)]} hasEarlier onLoadEarlier={onLoadEarlier} loadingEarlier={false} />);
    // m11 is now at index 4 → 400; keep the -50 offset
    expect(viewport().scrollTop).toBe(450);
  });

  it('earlier-load error offers a retry', async () => {
    const onLoadEarlier = vi.fn();
    render(<MessageList messages={many(3)} hasEarlier onLoadEarlier={onLoadEarlier} earlierError />);
    expect(screen.getByText('更早消息加载失败')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: '重新加载更早消息' }));
    expect(onLoadEarlier).toHaveBeenCalled();
  });

  it('scrollToLatest via ref; never moves focus', () => {
    const ref = React.createRef<MessageListHandle>();
    render(
      <>
        <button type="button">outside</button>
        <MessageList ref={ref} messages={many(6)} />
      </>,
    );
    const outside = screen.getByRole('button', { name: 'outside' });
    outside.focus();
    scrollTo(0);
    expect(ref.current!.isFollowing()).toBe(false);
    act(() => ref.current!.scrollToLatest({ smooth: false }));
    expect(viewport().scrollTop).toBe(300);
    expect(ref.current!.isFollowing()).toBe(true);
    expect(outside).toHaveFocus();
  });
});

describe('MessageList motion', () => {
  it('history does not animate; appended messages do; prepended do not', () => {
    const { rerender, container } = render(<MessageList messages={many(2, 5)} />);
    const entering = () => Array.from(container.querySelectorAll<HTMLElement>('li[data-message-id]')).filter((li) => li.style.opacity === '0').map((li) => li.dataset.messageId);
    expect(entering()).toEqual([]);
    rerender(<MessageList messages={[msg('m0'), ...many(2, 5), msg('new')]} />);
    expect(entering()).toEqual(['new']);
  });

  it('reduced motion: appended messages are visible without transform', () => {
    const { rerender, container } = render(
      <MotionConfig reducedMotion="always">
        <MessageList messages={many(1)} />
      </MotionConfig>,
    );
    rerender(
      <MotionConfig reducedMotion="always">
        <MessageList messages={many(2)} />
      </MotionConfig>,
    );
    const li = container.querySelector<HTMLElement>('li[data-message-id="m1"]')!;
    expect(li.style.transform === '' || li.style.transform === 'none').toBe(true);
  });

  it('a different conversation is treated as history (no entrance)', () => {
    const { rerender, container } = render(<MessageList messages={many(2)} />);
    rerender(<MessageList messages={[msg('x1'), msg('x2')]} />);
    const hidden = Array.from(container.querySelectorAll<HTMLElement>('li[data-message-id]')).filter((li) => li.style.opacity === '0');
    expect(hidden).toHaveLength(0);
  });

  it('two lists keep independent follow state', () => {
    render(
      <>
        <MessageList messages={many(6)} label="A" />
        <MessageList messages={many(6)} label="B" />
      </>,
    );
    const a = screen.getByRole('region', { name: 'A' });
    const b = screen.getByRole('region', { name: 'B' });
    a.scrollTop = 0;
    fireEvent.scroll(a);
    expect(a.closest('.rl-agent-list')).not.toHaveAttribute('data-following');
    expect(b.closest('.rl-agent-list')).toHaveAttribute('data-following');
  });
});

describe('JumpToLatest', () => {
  it('hidden at latest, named with count, loading blocks the jump', async () => {
    const onJump = vi.fn();
    const { rerender } = render(<JumpToLatest atLatest onJump={onJump} />);
    expect(jump()).toBeNull();
    rerender(<JumpToLatest atLatest={false} unreadCount={3} onJump={onJump} />);
    expect(jump()).toHaveAccessibleName('返回最新消息，3 条新消息');
    await userEvent.click(jump()!);
    expect(onJump).toHaveBeenCalledTimes(1);
    rerender(<JumpToLatest atLatest={false} onJump={onJump} loading />);
    expect(jump()).toHaveAttribute('aria-busy', 'true');
    await userEvent.click(jump()!);
    expect(onJump).toHaveBeenCalledTimes(1);
  });

  it('is keyboard operable', async () => {
    const onJump = vi.fn();
    render(<JumpToLatest atLatest={false} onJump={onJump} />);
    jump()!.focus();
    await userEvent.keyboard('{Enter}');
    await userEvent.keyboard(' ');
    expect(onJump).toHaveBeenCalledTimes(2);
  });
});
