import * as React from 'react';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MotionConfig } from 'motion/react';
import { describe, expect, it, vi } from 'vitest';
import type { MessageView, RunView } from '@wzrhine/agent-core';
import { AgentMessage, messagePlainText } from '../src/components/message/AgentMessage';
import { MessageActions } from '../src/components/message/MessageActions';
import { AgentProcess } from '../src/components/process/AgentProcess';
import { RunStatus } from '../src/components/process/RunStatus';
import { sampleMessages, sampleRun } from '../src/fixtures/session';

const [userMsg, assistantMsg, , streamingMsg] = sampleMessages as [MessageView, MessageView, MessageView, MessageView];

describe('AgentMessage', () => {
  it('user message: article named by its header, author and <time>, inline chips grouped', () => {
    const { container } = render(<AgentMessage message={userMsg} />);
    const article = screen.getByRole('article');
    expect(article).toHaveAttribute('data-role', 'user');
    expect(article).toHaveAccessibleName(/你/);
    const time = container.querySelector('time')!;
    expect(time).toHaveAttribute('datetime', userMsg.createdAt);
    expect(time.textContent).toMatch(/\d{2}:\d{2}/);
    const inline = container.querySelector('.rl-agent-message__inline')!;
    expect(inline.querySelectorAll('.rl-agent-part--inline')).toHaveLength(2);
  });

  it('assistant message: model label, usage footer, every part rendered', () => {
    const { container } = render(<AgentMessage message={assistantMsg} model="sample-model" />);
    expect(screen.getByText('sample-model')).toBeInTheDocument();
    expect(container.querySelector('.rl-agent-usage')).toHaveTextContent('合计 15.5K');
    expect(container.querySelector('.rl-agent-usage__completeness')).toBeNull();
    expect(screen.getAllByRole('button', { name: /^引用/ })).toHaveLength(2);
    expect(screen.getByText('无法显示此内容')).toBeInTheDocument();
  });

  it('usage that is not exact is labelled', () => {
    render(<AgentMessage message={{ ...assistantMsg, usage: { total: 900, completeness: 'partial' } }} />);
    expect(screen.getByText('部分统计')).toBeInTheDocument();
    render(<AgentMessage message={{ ...assistantMsg, id: 'x', usage: { total: 900, completeness: 'estimated' } }} />);
    expect(screen.getByText('估计')).toBeInTheDocument();
  });

  it('system message, edited and inherited markers', () => {
    render(<AgentMessage message={{ id: 's', role: 'system', status: 'complete', parts: [{ type: 'text', id: 'p', text: '会话已分叉（示例）' }] }} />);
    expect(screen.getByRole('article')).toHaveAttribute('data-role', 'system');
    expect(screen.getByRole('article')).toHaveAccessibleName('系统');
    render(<AgentMessage message={{ ...userMsg, id: 'e', edited: true, inherited: true }} />);
    expect(screen.getByText('已编辑')).toBeInTheDocument();
    expect(screen.getByText('继承的历史')).toBeInTheDocument();
  });

  it('failed message: static status text (no alert) and retry only with onRetry', async () => {
    const failed: MessageView = { ...assistantMsg, id: 'f', status: 'failed' };
    const { rerender } = render(<AgentMessage message={failed} />);
    expect(screen.getByText('生成失败')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.queryByRole('button', { name: '重试' })).toBeNull();
    const onRetry = vi.fn();
    rerender(<AgentMessage message={failed} onRetry={onRetry} />);
    await userEvent.click(screen.getByRole('button', { name: '重试' }));
    expect(onRetry).toHaveBeenCalledWith('f');
    rerender(<AgentMessage message={{ ...userMsg, status: 'failed' }} />);
    expect(screen.getByText('发送失败')).toBeInTheDocument();
  });

  it('interrupted / cancelled / partial show glyph + text', () => {
    for (const [status, text] of [['interrupted', '已中断'], ['cancelled', '已停止'], ['partial', '部分输出']] as const) {
      const { unmount, container } = render(<AgentMessage message={{ ...assistantMsg, status }} />);
      expect(container.querySelector('.rl-agent-message__status')).toHaveTextContent(text);
      expect(container.querySelector('.rl-agent-message__status svg')).toHaveAttribute('aria-hidden', 'true');
      unmount();
    }
  });

  it('actions are capability-gated per role and hidden while streaming', () => {
    const handlers = { onRegenerate: vi.fn(), onEdit: vi.fn(), onFork: vi.fn(), onFeedback: vi.fn(), onCopy: vi.fn() };
    const { rerender } = render(<AgentMessage message={assistantMsg} {...handlers} />);
    const bar = screen.getByRole('toolbar', { name: '消息操作' });
    const names = within(bar).getAllByRole('button').map((b) => b.getAttribute('aria-label'));
    expect(names).toEqual(['复制消息', '重新生成', '从此处分叉', '有帮助', '没有帮助']);
    rerender(<AgentMessage message={userMsg} {...handlers} />);
    expect(within(screen.getByRole('toolbar')).getAllByRole('button').map((b) => b.getAttribute('aria-label'))).toEqual(['复制消息', '编辑消息', '从此处分叉']);
    rerender(<AgentMessage message={streamingMsg} {...handlers} />);
    expect(screen.queryByRole('toolbar')).toBeNull();
    rerender(<AgentMessage message={assistantMsg} />);
    expect(screen.queryByRole('toolbar')).toBeNull();
  });

  it('streaming announces the phase once, then completion; never tokens', () => {
    vi.useFakeTimers();
    const { rerender, container } = render(<AgentMessage message={streamingMsg} announceInterval={0} />);
    const status = () => container.querySelector('.rl-agent-sr[role="status"]')!;
    act(() => vi.advanceTimersByTime(10));
    expect(status()).toHaveTextContent('执行工具');
    const grown: MessageView = { ...streamingMsg, parts: [streamingMsg.parts[0]!, { type: 'markdown', id: 'm-4-p1', source: '更多文本……', streaming: true }] };
    rerender(<AgentMessage message={grown} announceInterval={0} />);
    act(() => vi.advanceTimersByTime(10));
    expect(status()).toHaveTextContent('执行工具');
    expect(status().textContent).not.toContain('更多文本');
    rerender(<AgentMessage message={{ ...grown, status: 'complete' }} announceInterval={0} />);
    act(() => vi.advanceTimersByTime(10));
    expect(status()).toHaveTextContent('回答已完成');
    vi.useRealTimers();
  });

  it('history messages have no live status', () => {
    const { container } = render(<AgentMessage message={assistantMsg} />);
    expect(container.querySelector('[role="status"]')).toBeNull();
    expect(screen.getByRole('article')).not.toHaveAttribute('aria-busy');
  });

  it('renderPart wraps the default rendering', () => {
    render(<AgentMessage message={userMsg} renderPart={(part, node) => <div data-testid={`w-${part.id}`}>{node}</div>} />);
    expect(screen.getByTestId('w-m-1-p1')).toHaveTextContent('分析这些水下图像');
  });

  it('messagePlainText joins text, markdown and code', () => {
    expect(messagePlainText(assistantMsg)).toContain('model = load');
    expect(messagePlainText(assistantMsg)).toContain('我会先检查样本清单');
  });
});

describe('MessageActions', () => {
  it('renders nothing without capabilities', () => {
    const { container } = render(<MessageActions />);
    expect(container).toBeEmptyDOMElement();
  });

  it('roving tabindex with arrows / Home / End', async () => {
    const user = userEvent.setup();
    render(<MessageActions onRegenerate={vi.fn()} onEdit={vi.fn()} onFork={vi.fn()} />);
    const buttons = within(screen.getByRole('toolbar')).getAllByRole('button');
    expect(buttons.map((b) => b.tabIndex)).toEqual([0, -1, -1]);
    await user.tab();
    expect(buttons[0]).toHaveFocus();
    await user.keyboard('{ArrowRight}');
    expect(buttons[1]).toHaveFocus();
    expect(buttons.map((b) => b.tabIndex)).toEqual([-1, 0, -1]);
    await user.keyboard('{End}');
    expect(buttons[2]).toHaveFocus();
    await user.keyboard('{ArrowRight}');
    expect(buttons[0]).toHaveFocus();
    await user.keyboard('{ArrowLeft}');
    expect(buttons[2]).toHaveFocus();
    await user.keyboard('{Home}');
    expect(buttons[0]).toHaveFocus();
  });

  it('feedback toggles with aria-pressed and can be cleared', async () => {
    const onFeedback = vi.fn();
    const { rerender } = render(<MessageActions feedback={null} onFeedback={onFeedback} />);
    const up = screen.getByRole('button', { name: '有帮助' });
    expect(up).toHaveAttribute('aria-pressed', 'false');
    await userEvent.click(up);
    expect(onFeedback).toHaveBeenLastCalledWith('up');
    rerender(<MessageActions feedback="up" onFeedback={onFeedback} />);
    expect(screen.getByRole('button', { name: '有帮助' })).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(screen.getByRole('button', { name: '有帮助' }));
    expect(onFeedback).toHaveBeenLastCalledWith(null);
  });

  it('copy shows copied, then resets after 1.2s; a throwing handler shows failed', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const onCopy = vi.fn();
    const { rerender } = render(<MessageActions copyText="hello" onCopy={onCopy} />);
    await act(async () => fireEvent.click(screen.getByRole('button', { name: '复制消息' })));
    expect(onCopy).toHaveBeenCalledWith('hello');
    expect(screen.getByRole('button', { name: '已复制' })).toHaveAttribute('data-state', 'copied');
    await act(async () => vi.advanceTimersByTime(1250));
    expect(screen.getByRole('button', { name: '复制消息' })).toBeInTheDocument();
    rerender(
      <MessageActions
        copyText="hello"
        onCopy={() => {
          throw new Error('denied');
        }}
      />,
    );
    await act(async () => fireEvent.click(screen.getByRole('button', { name: '复制消息' })));
    expect(screen.getByRole('button', { name: '复制失败' })).toBeInTheDocument();
    vi.useRealTimers();
  });

  it('copy without onCopy appears only when the Clipboard API exists', () => {
    // user-event installs a clipboard stub on navigator; start from a browser without one.
    Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true });
    const { unmount } = render(<MessageActions copyText="x" />);
    expect(screen.queryByRole('button')).toBeNull();
    unmount();
    Object.defineProperty(navigator, 'clipboard', { value: { writeText: vi.fn().mockResolvedValue(undefined) }, configurable: true });
    render(<MessageActions copyText="x" />);
    expect(screen.getByRole('button', { name: '复制消息' })).toBeInTheDocument();
    Reflect.deleteProperty(navigator, 'clipboard');
  });
});

describe('AgentProcess', () => {
  it('active run: expanded by default, phase headline, calls as labelled sections', () => {
    const { container } = render(<AgentProcess run={sampleRun} />);
    const trigger = screen.getByRole('button', { name: /运行过程/ });
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(trigger).toHaveTextContent('执行工具');
    expect(trigger).toHaveTextContent('18.4s');
    expect(screen.getByRole('region', { name: '模型调用 1' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: '模型调用 2' })).toBeInTheDocument();
    expect(container.querySelectorAll('.rl-agent-thinking')).toHaveLength(2);
    expect(screen.getByText('接下来运行分类脚本并检查配置。')).toBeInTheDocument();
  });

  it('only the last block of the running call is current', () => {
    const { container } = render(<AgentProcess run={sampleRun} />);
    const current = container.querySelectorAll('[data-current]');
    expect(current).toHaveLength(1);
    expect(current[0]).toHaveAttribute('aria-current', 'step');
    expect(current[0]).toHaveAttribute('data-block-type', 'pending-record');
  });

  it('pending record never invents a result; load button only with a handler', async () => {
    const { rerender } = render(<AgentProcess run={sampleRun} />);
    expect(screen.getByText('1 条工具记录稍后到达')).toBeInTheDocument();
    expect(screen.getByText('记录稍后到达')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '载入记录' })).toBeNull();
    const onLoadRecord = vi.fn();
    rerender(<AgentProcess run={sampleRun} onLoadRecord={onLoadRecord} />);
    await userEvent.click(screen.getByRole('button', { name: '载入记录' }));
    expect(onLoadRecord).toHaveBeenCalledWith('pr-1');
  });

  it('tool fallback lists nested children; renderTool replaces it', () => {
    const { rerender } = render(<AgentProcess run={sampleRun} />);
    const children = screen.getByRole('list', { name: '2 个子操作' });
    expect(within(children).getAllByRole('listitem')).toHaveLength(2);
    rerender(<AgentProcess run={sampleRun} renderTool={(tool) => <span>T:{tool.id}</span>} />);
    expect(screen.getByText('T:op-5')).toBeInTheDocument();
    expect(screen.queryByRole('list', { name: '2 个子操作' })).toBeNull();
  });

  it('settled run: collapsed, summary headline; user toggle wins after it settles', async () => {
    const done: RunView = { ...sampleRun, status: 'completed', toolCount: undefined };
    const { rerender } = render(<AgentProcess run={sampleRun} />);
    const trigger = () => screen.getByRole('button', { name: /运行过程/ });
    rerender(<AgentProcess run={done} />);
    expect(trigger()).toHaveAttribute('aria-expanded', 'false');
    expect(trigger()).toHaveTextContent('2 次模型调用 · 5 个操作');
    await userEvent.click(trigger());
    expect(trigger()).toHaveAttribute('aria-expanded', 'true');
    rerender(<AgentProcess run={{ ...done, elapsedMs: 20_000 }} />);
    expect(trigger()).toHaveAttribute('aria-expanded', 'true');
  });

  it('truncated run: notice and open-full', async () => {
    const onOpenFull = vi.fn();
    render(<AgentProcess run={{ ...sampleRun, status: 'interrupted', truncated: true }} defaultExpanded onOpenFull={onOpenFull} />);
    expect(screen.getByRole('button', { name: /运行过程/ })).toHaveTextContent('已展示 2 次模型调用');
    expect(screen.getByText(/达到展示上限/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: '查看完整记录' }));
    expect(onOpenFull).toHaveBeenCalledWith('run-2187');
  });

  it('stage text truncated marker', () => {
    render(<AgentProcess run={{ ...sampleRun, calls: [{ id: 'c', ordinal: 1, status: 'completed', blocks: [{ type: 'text', id: 't', text: '阶段', truncated: true }] }] }} />);
    expect(screen.getByText('已截取')).toBeInTheDocument();
  });
});

describe('RunStatus', () => {
  it('phase label, elapsed and separate sync / action chips', () => {
    const { container } = render(<RunStatus run={{ status: 'running', phase: 'executing-tool', elapsedMs: 8400, syncStatus: 'reconnecting', actionStatus: 'unknown' }} />);
    expect(container).toHaveTextContent('执行工具');
    expect(container).toHaveTextContent('8.4s');
    expect(container.querySelector('[data-axis="sync"]')).toHaveTextContent('正在重新连接');
    const action = container.querySelector('[data-axis="action"]')!;
    expect(action).toHaveTextContent('结果待确认');
    expect(action).not.toHaveAttribute('data-tone', 'success');
  });

  it('live sync and idle action are not drawn; settled statuses ignore the phase', () => {
    const { container } = render(<RunStatus status="completed" phase="thinking" syncStatus="live" actionStatus="idle" />);
    expect(container).toHaveTextContent('已完成');
    expect(container).not.toHaveTextContent('思考中');
    expect(container.querySelector('[data-axis]')).toBeNull();
  });

  it('every run status renders glyph + text', () => {
    for (const status of ['idle', 'queued', 'running', 'waiting', 'cancelling', 'completed', 'failed', 'cancelled', 'interrupted'] as const) {
      const { container, unmount } = render(<RunStatus status={status} />);
      expect(container.querySelector('svg, .rl-agent-spark')).not.toBeNull();
      expect(container.querySelector('.rl-agent-status__label')!.textContent!.length).toBeGreaterThan(0);
      unmount();
    }
  });

  it('labelOverride, hint, line appearance', () => {
    const { container } = render(<RunStatus status="running" phase="thinking" appearance="line" labelOverride="核对文件" hint="示例提示" />);
    expect(container).toHaveTextContent('核对文件');
    expect(container).toHaveTextContent('示例提示');
    expect(container.querySelector('.rl-agent-spark')).toHaveAttribute('data-phase', 'thinking');
  });

  it('announce: polite status follows the label, throttled', () => {
    vi.useFakeTimers();
    const { rerender } = render(<RunStatus status="running" phase="thinking" announce announceInterval={1000} />);
    const status = screen.getByRole('status');
    act(() => vi.advanceTimersByTime(0));
    expect(status).toHaveTextContent('运行状态：思考中');
    rerender(<RunStatus status="running" phase="responding" announce announceInterval={1000} />);
    rerender(<RunStatus status="running" phase="executing-tool" announce announceInterval={1000} />);
    act(() => vi.advanceTimersByTime(1100));
    expect(status).toHaveTextContent('运行状态：执行工具');
    vi.useRealTimers();
  });

  it('reduced motion: active glyph does not loop', () => {
    const { container } = render(
      <MotionConfig reducedMotion="always">
        <RunStatus status="running" />
      </MotionConfig>,
    );
    expect(container.querySelector('.rl-agent-glyph')).not.toHaveAttribute('data-loop', 'running');
  });
});
