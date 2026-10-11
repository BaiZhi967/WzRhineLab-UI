import * as React from 'react';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MotionConfig } from 'motion/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { MessageView, RunDetailsView, SkillUseView } from '@wzrhine/agent-core';
import { AgentMessage } from '../src/components/message/AgentMessage';
import { MessageActions } from '../src/components/message/MessageActions';
import { MessageList } from '../src/components/message/MessageList';
import { RunDetails, hasRunDetails } from '../src/components/message/RunDetails';
import { SkillUseList } from '../src/components/message/SkillUseList';
import { AgentMessagesProvider, agentEnUS } from '../src/provider/AgentMessages';

/* Gaps found against the reference app: run details, skill uses, action capabilities, restore input, holdFollow. */

const fullDetails: RunDetailsView = {
  permission: '工作区写入',
  provider: '示例提供商',
  model: 'sample-model',
  modelId: 'sample-model-2026-10',
  effort: '高',
  startedAt: '2026-10-11T14:20:00+08:00',
  elapsedMs: 42_000,
  elapsedKind: 'exact',
  lastActivityAt: '2026-10-11T14:20:42+08:00',
  usage: { input: 12_000, output: 3_500, total: 15_500, cacheRead: 8_000, cacheWrite: 1_200, completeness: 'exact' },
  toolModelUsage: { input: 900, output: 200, total: 1_100, completeness: 'partial', unreportedCalls: 2 },
  compactionTokens: 4_200,
  errorCode: 'E_STREAM',
  notes: ['示例备注一', '示例备注二'],
};

const rows = (container: HTMLElement) => Array.from(container.querySelectorAll('[data-row]')).map((el) => el.getAttribute('data-row'));
const row = (container: HTMLElement, key: string) => container.querySelector(`[data-row="${key}"]`) as HTMLElement | null;

describe('RunDetails', () => {
  it('renders every row as a dt/dd pair inside a <dl>, in order', () => {
    const { container } = render(<RunDetails details={fullDetails} aria-label="运行详情" />);
    const dl = container.querySelector('dl')!;
    expect(dl).toHaveAccessibleName('运行详情');
    expect(rows(container)).toEqual([
      'permission',
      'provider',
      'model',
      'model-id',
      'effort',
      'started',
      'elapsed',
      'last-activity',
      'usage',
      'cache',
      'tool-usage',
      'compaction',
      'error-code',
      'notes',
    ]);
    for (const el of dl.querySelectorAll('[data-row]')) {
      expect(el.querySelector('dt')).not.toBeNull();
      expect(el.querySelector('dd')).not.toBeNull();
    }
    expect(within(row(container, 'model-id')!).getByText('sample-model-2026-10').closest('dd')).toHaveAttribute('data-mono');
    expect(row(container, 'error-code')!.querySelector('dd')).toHaveAttribute('data-mono');
    expect(row(container, 'started')!.querySelector('time')).toHaveAttribute('datetime', fullDetails.startedAt);
    expect(row(container, 'last-activity')!.querySelector('time')).toHaveAttribute('datetime', fullDetails.lastActivityAt);
    expect(row(container, 'elapsed')).toHaveTextContent('42s');
    expect(row(container, 'usage')).toHaveTextContent('输入 12K tokens / 输出 3.5K tokens / 合计 15.5K tokens');
    expect(row(container, 'usage')).toHaveTextContent('完整统计');
    expect(row(container, 'cache')).toHaveTextContent('读取 8K tokens / 写入 1.2K tokens');
    expect(row(container, 'tool-usage')).toHaveTextContent('部分统计');
    expect(row(container, 'tool-usage')).toHaveTextContent('2 次调用未返回用量');
    expect(row(container, 'compaction')).toHaveTextContent('4.2K tokens');
    expect(within(row(container, 'notes')!).getAllByRole('listitem')).toHaveLength(2);
  });

  it('omits missing fields instead of showing 0', () => {
    const { container } = render(<RunDetails details={{ model: 'sample-model', usage: { output: 300, completeness: 'estimated' } }} />);
    expect(rows(container)).toEqual(['model', 'usage']);
    const usage = row(container, 'usage')!;
    expect(usage).toHaveTextContent('输出 300 tokens');
    expect(usage).not.toHaveTextContent('输入');
    expect(usage).not.toHaveTextContent('合计');
    expect(usage).toHaveTextContent('估计');
    expect(container.textContent).not.toMatch(/\b0\b/);
  });

  it('keeps an explicit zero (zero is data, missing is not)', () => {
    const { container } = render(<RunDetails details={{ compactionTokens: 0 }} />);
    expect(row(container, 'compaction')).toHaveTextContent('0 tokens');
  });

  it('elapsed wording: lower bound → 至少, unknown → 未记录, missing → no row', () => {
    const { container, rerender } = render(<RunDetails details={{ elapsedMs: 90_000, elapsedKind: 'lower-bound' }} />);
    expect(row(container, 'elapsed')).toHaveTextContent('至少 1m 30s');
    rerender(<RunDetails details={{ elapsedMs: 90_000, elapsedKind: 'unknown' }} />);
    expect(row(container, 'elapsed')).toHaveTextContent('未记录');
    rerender(<RunDetails details={{ elapsedKind: 'lower-bound' }} />);
    expect(row(container, 'elapsed')).toHaveTextContent('未记录');
    rerender(<RunDetails details={{ model: 'm' }} />);
    expect(row(container, 'elapsed')).toBeNull();
  });

  it('tool-model usage with only unreported calls still says so', () => {
    const { container } = render(<RunDetails details={{ toolModelUsage: { completeness: 'unknown', unreportedCalls: 3 } }} />);
    expect(row(container, 'tool-usage')).toHaveTextContent('统计未知');
    expect(row(container, 'tool-usage')).toHaveTextContent('3 次调用未返回用量');
  });

  it('renders nothing for empty details; hasRunDetails agrees', () => {
    const { container } = render(<RunDetails details={{ notes: [] }} />);
    expect(container.querySelector('dl')).toBeNull();
    expect(hasRunDetails({})).toBe(false);
    expect(hasRunDetails(undefined)).toBe(false);
    expect(hasRunDetails({ elapsedKind: 'unknown' })).toBe(true);
  });

  it('English table', () => {
    const { container } = render(
      <AgentMessagesProvider messages={agentEnUS}>
        <RunDetails details={{ elapsedMs: 5_000, elapsedKind: 'lower-bound', toolModelUsage: { completeness: 'partial', unreportedCalls: 1 } }} />
      </AgentMessagesProvider>,
    );
    expect(row(container, 'elapsed')).toHaveTextContent('At least 5s');
    expect(row(container, 'tool-usage')).toHaveTextContent('1 call returned no usage');
  });
});

const skills: SkillUseView[] = [
  { id: 's1', name: 'reef-analysis', source: '当前工作区', method: 'selected', digest: '0123456789abcdef' },
  { id: 's2', name: 'table-format', method: 'model-loaded' },
];

describe('SkillUseList', () => {
  it('labelled list with name · source · method · digest (8 chars, mono)', () => {
    const { container } = render(<SkillUseList skills={skills} />);
    const list = screen.getByRole('list', { name: '已加载技能' });
    const items = within(list).getAllByRole('listitem');
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent('reef-analysis · 当前工作区 · 手动选择 · 摘要 01234567');
    expect(items[0]).not.toHaveTextContent('89abcdef');
    const digest = container.querySelector('.rl-agent-skills__digest')!;
    expect(digest).toHaveAttribute('title', '0123456789abcdef');
    expect(items[1]).toHaveTextContent('table-format · 模型加载');
    expect(items[1]!.querySelector('.rl-agent-skills__digest')).toBeNull();
  });

  it('renders nothing when empty; AgentMessage renders it automatically', () => {
    const { container } = render(<SkillUseList skills={[]} />);
    expect(container).toBeEmptyDOMElement();
    render(<AgentMessage message={{ id: 'a', role: 'assistant', status: 'complete', parts: [], skillUses: skills }} />);
    expect(screen.getByRole('list', { name: '已加载技能' })).toBeInTheDocument();
  });

  it('two lists get distinct label ids', () => {
    render(
      <>
        <SkillUseList skills={skills} />
        <SkillUseList skills={skills} />
      </>,
    );
    const ids = screen.getAllByRole('list').map((l) => l.getAttribute('aria-labelledby'));
    expect(new Set(ids).size).toBe(2);
  });
});

const assistant: MessageView = {
  id: 'a1',
  role: 'assistant',
  status: 'complete',
  parts: [{ type: 'text', id: 'a1-p', text: '示例回答' }],
  details: { model: 'sample-model', elapsedMs: 3_000, elapsedKind: 'lower-bound' },
};

describe('AgentMessage run details', () => {
  it('shows a closed 运行详情 disclosure that opens on Enter', async () => {
    const user = userEvent.setup();
    render(<AgentMessage message={assistant} />);
    const trigger = screen.getByRole('button', { name: '运行详情' });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText('至少 3s')).toBeNull();
    trigger.focus();
    await user.keyboard('{Enter}');
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('至少 3s')).toBeInTheDocument();
  });

  it('details prop overrides message.details; controlled open', async () => {
    const onDetailsOpenChange = vi.fn();
    const { rerender } = render(<AgentMessage message={assistant} details={{ errorCode: 'E_X' }} detailsOpen onDetailsOpenChange={onDetailsOpenChange} />);
    expect(screen.getByText('E_X')).toBeInTheDocument();
    expect(screen.queryByText('sample-model')).toBeNull();
    await userEvent.click(screen.getByRole('button', { name: '运行详情' }));
    expect(onDetailsOpenChange).toHaveBeenCalledWith(false);
    expect(screen.getByText('E_X')).toBeInTheDocument();
    rerender(<AgentMessage message={assistant} details={{ errorCode: 'E_X' }} detailsOpen={false} onDetailsOpenChange={onDetailsOpenChange} />);
    expect(screen.getByRole('button', { name: '运行详情' })).toHaveAttribute('aria-expanded', 'false');
  });

  it('no disclosure when there are no details', () => {
    render(<AgentMessage message={{ ...assistant, details: {} }} />);
    expect(screen.queryByRole('button', { name: '运行详情' })).toBeNull();
  });

  it('reduced motion: the disclosure still toggles', async () => {
    render(
      <MotionConfig reducedMotion="always">
        <AgentMessage message={assistant} />
      </MotionConfig>,
    );
    await userEvent.click(screen.getByRole('button', { name: '运行详情' }));
    expect(screen.getByText('至少 3s')).toBeInTheDocument();
  });
});

describe('MessageActions capabilities', () => {
  it('a disabled capability is aria-disabled, focusable, explains why and never calls back', async () => {
    const user = userEvent.setup();
    const onFork = vi.fn();
    const onRegenerate = vi.fn();
    render(<MessageActions onRegenerate={onRegenerate} onFork={onFork} capabilities={{ fork: { enabled: false, reason: '运行中不可分叉' } }} />);
    const fork = screen.getByRole('button', { name: '从此处分叉' });
    expect(fork).toHaveAttribute('aria-disabled', 'true');
    expect(fork).not.toBeDisabled();
    expect(fork).toHaveAccessibleDescription('运行中不可分叉');
    await user.click(fork);
    expect(onFork).not.toHaveBeenCalled();

    // Still in the roving order and focusable; Enter / Space do nothing either.
    screen.getByRole('button', { name: '重新生成' }).focus();
    await user.keyboard('{ArrowRight}');
    expect(fork).toHaveFocus();
    await user.keyboard('{Enter}');
    await user.keyboard(' ');
    expect(onFork).not.toHaveBeenCalled();
  });

  it('the reason is visible: keyboard focus opens a tooltip with name · reason', async () => {
    const user = userEvent.setup();
    render(<MessageActions onFork={() => undefined} capabilities={{ fork: { enabled: false, reason: '运行中不可分叉' } }} />);
    await user.tab();
    expect(screen.getByRole('button', { name: '从此处分叉' })).toHaveFocus();
    await waitFor(() => expect(document.querySelector('.rl-tooltip')).toHaveTextContent('从此处分叉 · 运行中不可分叉'));
  });

  it('enabled actions get no reason tooltip', async () => {
    const user = userEvent.setup();
    render(<MessageActions onFork={() => undefined} />);
    await user.tab();
    await act(() => new Promise((r) => setTimeout(r, 50)));
    expect(document.querySelector('.rl-tooltip')).toBeNull();
  });

  it('boolean false disables without a reason; enabled ones still work', async () => {
    const onEdit = vi.fn();
    const onRegenerate = vi.fn();
    render(<MessageActions onEdit={onEdit} onRegenerate={onRegenerate} capabilities={{ edit: false, regenerate: true }} />);
    const edit = screen.getByRole('button', { name: '编辑消息' });
    expect(edit).toHaveAttribute('aria-disabled', 'true');
    expect(edit).not.toHaveAttribute('aria-describedby');
    await userEvent.click(edit);
    expect(onEdit).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole('button', { name: '重新生成' }));
    expect(onRegenerate).toHaveBeenCalledTimes(1);
  });

  it('a capability without a callback still renders nothing', () => {
    const { container } = render(<MessageActions capabilities={{ fork: true, restore: { enabled: false, reason: '示例' } }} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('disabled feedback keeps aria-pressed but does not toggle', async () => {
    const onFeedback = vi.fn();
    render(<MessageActions feedback="up" onFeedback={onFeedback} capabilities={{ feedback: { enabled: false, reason: '已归档' } }} />);
    const up = screen.getByRole('button', { name: '有帮助' });
    expect(up).toHaveAttribute('aria-pressed', 'true');
    expect(up).toHaveAttribute('aria-disabled', 'true');
    await userEvent.click(up);
    expect(onFeedback).not.toHaveBeenCalled();
  });

  it('flipping a capability keeps focus on the same button', async () => {
    const onFork = vi.fn();
    const { rerender } = render(<MessageActions onFork={onFork} capabilities={{ fork: { enabled: false, reason: '运行中' } }} />);
    const fork = screen.getByRole('button', { name: '从此处分叉' });
    fork.focus();
    rerender(<MessageActions onFork={onFork} capabilities={{ fork: true }} />);
    expect(screen.getByRole('button', { name: '从此处分叉' })).toBe(fork);
    expect(fork).toHaveFocus();
    expect(fork).not.toHaveAttribute('aria-disabled');
    await userEvent.click(fork);
    expect(onFork).toHaveBeenCalledTimes(1);
  });

  it('reason ids are unique per instance', () => {
    render(
      <>
        <MessageActions onFork={() => undefined} capabilities={{ fork: { enabled: false, reason: '甲' } }} />
        <MessageActions onFork={() => undefined} capabilities={{ fork: { enabled: false, reason: '乙' } }} />
      </>,
    );
    const [a, b] = screen.getAllByRole('button', { name: '从此处分叉' });
    expect(a).toHaveAccessibleDescription('甲');
    expect(b).toHaveAccessibleDescription('乙');
  });
});

describe('restore input', () => {
  it('MessageActions: 重新编辑本轮输入 is its own action, distinct from 编辑消息', async () => {
    const onEdit = vi.fn();
    const onRestoreInput = vi.fn();
    render(<MessageActions onEdit={onEdit} onRestoreInput={onRestoreInput} />);
    await userEvent.click(screen.getByRole('button', { name: '重新编辑本轮输入' }));
    expect(onRestoreInput).toHaveBeenCalledTimes(1);
    expect(onEdit).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: '编辑消息' })).toBeInTheDocument();
  });

  it('AgentMessage forwards onRestoreInput with the id, also on failed messages; not on inherited', async () => {
    const onRestoreInput = vi.fn();
    const failed: MessageView = { ...assistant, id: 'f1', status: 'failed', details: undefined };
    const { rerender } = render(<AgentMessage message={failed} onRestoreInput={onRestoreInput} />);
    await userEvent.click(screen.getByRole('button', { name: '重新编辑本轮输入' }));
    expect(onRestoreInput).toHaveBeenCalledWith('f1');
    rerender(<AgentMessage message={{ ...failed, inherited: true }} onRestoreInput={onRestoreInput} />);
    expect(screen.queryByRole('button', { name: '重新编辑本轮输入' })).toBeNull();
    rerender(<AgentMessage message={{ ...failed, status: 'streaming' }} onRestoreInput={onRestoreInput} />);
    expect(screen.queryByRole('button', { name: '重新编辑本轮输入' })).toBeNull();
  });

  it('AgentMessage actionCapabilities receives the message and gates actions', async () => {
    const onFork = vi.fn();
    const actionCapabilities = vi.fn((m: MessageView) => (m.id === 'a1' ? { fork: { enabled: false, reason: '运行中不可分叉' } } : undefined));
    render(<AgentMessage message={assistant} onFork={onFork} actionCapabilities={actionCapabilities} />);
    expect(actionCapabilities).toHaveBeenCalledWith(assistant);
    const fork = screen.getByRole('button', { name: '从此处分叉' });
    expect(fork).toHaveAccessibleDescription('运行中不可分叉');
    await userEvent.click(fork);
    expect(onFork).not.toHaveBeenCalled();
  });

  it('English label', () => {
    render(
      <AgentMessagesProvider messages={agentEnUS}>
        <MessageActions onRestoreInput={() => undefined} />
      </AgentMessagesProvider>,
    );
    expect(screen.getByRole('button', { name: "Re-edit this turn's input" })).toBeInTheDocument();
  });
});

/* holdFollow: same jsdom layout fake as message-list.test.tsx (rows of 100, viewport of 300). */
const ROW = 100;
const VIEW = 300;
let observers: Array<() => void> = [];

function fakeLayout() {
  const proto = HTMLElement.prototype;
  const tops = new WeakMap<Element, number>();
  const isViewport = (el: Element) => el.classList.contains('rl-agent-list__viewport');
  const count = (el: Element) => el.querySelectorAll('li[data-message-id]').length;
  const spies = [
    vi.spyOn(proto, 'scrollHeight', 'get').mockImplementation(function (this: HTMLElement) {
      return isViewport(this) ? count(this) * ROW : 0;
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
      const max = isViewport(this) ? Math.max(0, count(this) * ROW - VIEW) : 0;
      tops.set(this, Math.max(0, Math.min(max, v)));
    },
  });
  return () => {
    spies.forEach((s) => s.mockRestore());
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

const msg = (id: string, role: MessageView['role'] = 'assistant'): MessageView => ({ id, role, status: 'complete', parts: [{ type: 'text', id: `${id}-p`, text: `示例 ${id}` }] });
const many = (n: number) => Array.from({ length: n }, (_, i) => msg(`m${i}`));

describe('MessageList holdFollow', () => {
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

  it('mount still starts at the latest content while held', () => {
    render(<MessageList messages={many(5)} holdFollow />);
    expect(viewport().scrollTop).toBe(200);
  });

  it('while held, new messages and growth do not scroll; release returns to the bottom', async () => {
    const onFollowChange = vi.fn();
    const { rerender } = render(<MessageList messages={many(5)} onFollowChange={onFollowChange} />);
    expect(viewport().scrollTop).toBe(200);
    rerender(<MessageList messages={many(5)} holdFollow onFollowChange={onFollowChange} />);
    expect(viewport().closest('.rl-agent-list')).toHaveAttribute('data-hold');

    rerender(<MessageList messages={many(7)} holdFollow onFollowChange={onFollowChange} />);
    expect(viewport().scrollTop).toBe(200);
    act(() => observers.forEach((cb) => cb()));
    expect(viewport().scrollTop).toBe(200);
    // Follow intent is kept (not a "reader left" event) but the jump offers the held content.
    expect(onFollowChange).not.toHaveBeenCalled();
    expect(jump()).toHaveAccessibleName('返回最新消息，2 条新消息');

    rerender(<MessageList messages={many(7)} onFollowChange={onFollowChange} />);
    expect(viewport().scrollTop).toBe(400);
    await waitFor(() => expect(jump()).toBeNull());
    rerender(<MessageList messages={many(8)} onFollowChange={onFollowChange} />);
    expect(viewport().scrollTop).toBe(500);
  });

  it('release does not pull a reader who scrolled up during the hold', () => {
    const { rerender } = render(<MessageList messages={many(6)} holdFollow />);
    const el = viewport();
    el.scrollTop = 100;
    fireEvent.scroll(el);
    rerender(<MessageList messages={many(7)} holdFollow />);
    rerender(<MessageList messages={many(7)} holdFollow={false} />);
    expect(el.scrollTop).toBe(100);
    rerender(<MessageList messages={many(8)} />);
    expect(el.scrollTop).toBe(100);
  });

  it('an explicit jump or a just-sent user message still scrolls while held', async () => {
    const { rerender } = render(<MessageList messages={many(5)} holdFollow />);
    rerender(<MessageList messages={many(7)} holdFollow />);
    expect(viewport().scrollTop).toBe(200);
    await userEvent.click(jump()!);
    expect(viewport().scrollTop).toBe(400);
    rerender(<MessageList messages={[...many(7), msg('u1', 'user')]} holdFollow />);
    expect(viewport().scrollTop).toBe(500);
  });

  it('scrolling back to the bottom while held clears the jump', async () => {
    const { rerender } = render(<MessageList messages={many(5)} holdFollow />);
    rerender(<MessageList messages={many(6)} holdFollow />);
    expect(jump()).not.toBeNull();
    const el = viewport();
    el.scrollTop = 300;
    fireEvent.scroll(el);
    await waitFor(() => expect(jump()).toBeNull());
  });
});
