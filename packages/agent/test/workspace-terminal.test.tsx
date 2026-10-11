import * as React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { TerminalSessionStatus, TerminalView } from '@wzrhine/agent-core';
import { PersistentTerminal, TerminalTabs } from '../src/components/workspace/PersistentTerminal';
import { TerminalList, TerminalRow, terminalGroup } from '../src/components/workspace/TerminalRow';
import { AgentMessagesProvider, agentEnUS } from '../src/provider/AgentMessages';
import { sampleTerminals } from '../src/fixtures/session';

const running = sampleTerminals[0]!;
const stopPending = sampleTerminals[1]!;
const inherited = sampleTerminals[2]!;

const term = (patch: Partial<TerminalView> = {}): TerminalView => ({ ...running, ...patch });

describe('PersistentTerminal', () => {
  it('renders identity, status, cwd with full title and a non-live log', () => {
    render(<PersistentTerminal terminal={running} />);
    const region = screen.getByRole('region', { name: '终端 A' });
    expect(within(region).getByText('term-a')).toBeInTheDocument();
    expect(within(region).getByText('PTY')).toBeInTheDocument();
    expect(within(region).getByRole('status')).toHaveTextContent('运行中');
    expect(within(region).getByText('/workspace/reef').closest('p')).toHaveAttribute('title', '/workspace/reef');
    const log = within(region).getByRole('log', { name: '终端 A 输出' });
    expect(log).toHaveAttribute('aria-live', 'off');
    expect(log).toHaveAttribute('tabindex', '0');
    expect(log).toHaveTextContent('Processing image 2/3');
  });

  it('draws no input and no stop without callbacks', () => {
    render(<PersistentTerminal terminal={running} />);
    expect(screen.queryByRole('textbox')).toBeNull();
    expect(screen.queryByRole('button', { name: /停止/ })).toBeNull();
  });

  it('Enter sends the line; IME composition does not', async () => {
    const user = userEvent.setup();
    const onInput = vi.fn();
    render(<PersistentTerminal terminal={term({ status: 'waiting-input' })} onInput={onInput} />);
    const input = screen.getByRole('textbox', { name: '向 终端 A 输入' });
    await user.type(input, 'y{Enter}');
    expect(onInput).toHaveBeenCalledWith('y', expect.objectContaining({ id: 'term-a' }));
    expect(input).toHaveValue('');

    fireEvent.compositionStart(input);
    fireEvent.change(input, { target: { value: 'ni' } });
    fireEvent.keyDown(input, { key: 'Enter', keyCode: 229 });
    expect(onInput).toHaveBeenCalledTimes(1);
    fireEvent.compositionEnd(input);
    fireEvent.keyDown(input, { key: 'Enter', keyCode: 229 });
    expect(onInput).toHaveBeenCalledTimes(1);
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onInput).toHaveBeenCalledTimes(2);
    expect(onInput).toHaveBeenLastCalledWith('ni', expect.anything());
  });

  it.each<TerminalSessionStatus>(['idle', 'ended', 'stop-pending', 'unknown', 'opening'])('no input line while %s', (status) => {
    render(<PersistentTerminal terminal={term({ status })} onInput={vi.fn()} />);
    expect(screen.queryByRole('textbox')).toBeNull();
  });

  it('stop only when stoppable; stop-pending shows unconfirmed text and retry', async () => {
    const user = userEvent.setup();
    const onStop = vi.fn();
    const { rerender } = render(<PersistentTerminal terminal={term({ stoppable: false })} onStop={onStop} />);
    expect(screen.queryByRole('button', { name: /停止/ })).toBeNull();
    rerender(<PersistentTerminal terminal={running} onStop={onStop} />);
    await user.click(screen.getByRole('button', { name: '停止 终端 A' }));
    expect(onStop).toHaveBeenCalledTimes(1);
    rerender(<PersistentTerminal terminal={term({ status: 'stop-pending' })} onStop={onStop} />);
    expect(screen.getByText('停止尚未确认')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '停止 终端 A' })).toBeNull();
    await user.click(screen.getByRole('button', { name: '重试停止' }));
    expect(onStop).toHaveBeenCalledTimes(2);
  });

  it('unknown is never shown as ended; idle says the session is still open', () => {
    const { rerender } = render(<PersistentTerminal terminal={term({ status: 'unknown' })} />);
    expect(screen.getByRole('status')).toHaveTextContent('状态待确认');
    expect(screen.queryByText('已结束')).toBeNull();
    rerender(<PersistentTerminal terminal={term({ status: 'idle' })} />);
    expect(screen.getByText('命令已返回，终端尚未关闭')).toBeInTheDocument();
  });

  it('inherited terminal: read-only banner, no input, no stop, exit code', () => {
    render(<PersistentTerminal terminal={{ ...inherited, stoppable: true, status: 'ended' }} onInput={vi.fn()} onStop={vi.fn()} />);
    expect(screen.getByText('继承的终端记录 · 只读')).toBeInTheDocument();
    expect(screen.queryByRole('textbox')).toBeNull();
    expect(screen.queryAllByRole('button')).toHaveLength(0);
    expect(screen.getByText('退出码 0')).toBeInTheDocument();
  });

  it('truncated output offers load earlier only with a callback; partial capture is labelled', async () => {
    const user = userEvent.setup();
    const onLoadEarlier = vi.fn();
    const { rerender } = render(<PersistentTerminal terminal={term({ outputTruncated: true, partialCapture: true })} />);
    expect(screen.queryByRole('button', { name: '加载更早输出' })).toBeNull();
    expect(screen.getByText('仅部分捕获')).toBeInTheDocument();
    rerender(<PersistentTerminal terminal={term({ outputTruncated: true })} onLoadEarlier={onLoadEarlier} />);
    await user.click(screen.getByRole('button', { name: '加载更早输出' }));
    expect(onLoadEarlier).toHaveBeenCalledWith(expect.objectContaining({ id: 'term-a' }));
  });

  it('follows the bottom; after scrolling up new output shows a 「有新输出」 button', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<PersistentTerminal terminal={running} />);
    const log = screen.getByRole('log');
    Object.defineProperty(log, 'scrollHeight', { configurable: true, value: 1000 });
    Object.defineProperty(log, 'clientHeight', { configurable: true, value: 200 });
    log.scrollTop = 100;
    fireEvent.scroll(log);
    rerender(<PersistentTerminal terminal={term({ output: `${running.output}\nmore` })} />);
    const jump = screen.getByRole('button', { name: '有新输出' });
    await user.click(jump);
    expect(log.scrollTop).toBe(1000);
    expect(screen.queryByRole('button', { name: '有新输出' })).toBeNull();
    expect(log).toHaveFocus();
    // Following again: more output does not bring the button back.
    rerender(<PersistentTerminal terminal={term({ output: `${running.output}\nmore\nagain` })} />);
    expect(screen.queryByRole('button', { name: '有新输出' })).toBeNull();
  });

  it('cursor is static and only drawn while input is possible', () => {
    const { container, rerender } = render(<PersistentTerminal terminal={running} onInput={vi.fn()} />);
    const cursor = container.querySelector('.rl-agent-terminal__cursor');
    expect(cursor).toHaveAttribute('aria-hidden', 'true');
    rerender(<PersistentTerminal terminal={term({ status: 'ended' })} onInput={vi.fn()} />);
    expect(container.querySelector('.rl-agent-terminal__cursor')).toBeNull();
  });

  it('two instances use distinct ids', () => {
    render(
      <>
        <PersistentTerminal terminal={running} onInput={vi.fn()} />
        <PersistentTerminal terminal={running} onInput={vi.fn()} />
      </>,
    );
    const inputs = screen.getAllByRole('textbox');
    expect(inputs[0]!.id).not.toBe(inputs[1]!.id);
    const regions = screen.getAllByRole('region', { name: '终端 A' });
    expect(regions[0]!.getAttribute('aria-labelledby')).not.toBe(regions[1]!.getAttribute('aria-labelledby'));
  });

  it('English copy through the provider', () => {
    render(
      <AgentMessagesProvider messages={agentEnUS}>
        <PersistentTerminal terminal={term({ status: 'stop-pending' })} />
      </AgentMessagesProvider>,
    );
    expect(screen.getByText('Stop not confirmed yet')).toBeInTheDocument();
  });
});

describe('TerminalTabs', () => {
  it('tabs name each terminal with status and switch with arrow keys', async () => {
    const user = userEvent.setup();
    render(<TerminalTabs terminals={sampleTerminals} />);
    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(3);
    expect(tabs[0]).toHaveTextContent('终端 A');
    expect(tabs[0]).toHaveTextContent('运行中');
    expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
    await user.click(tabs[0]!);
    await user.keyboard('{ArrowRight}{Enter}');
    expect(screen.getAllByRole('tab')[1]).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tabpanel')).toHaveTextContent('停止尚未确认');
  });

  it('controlled value', () => {
    render(<TerminalTabs terminals={sampleTerminals} value="term-c" />);
    expect(screen.getByRole('tabpanel')).toHaveTextContent('继承的终端记录 · 只读');
  });

  it('empty list', () => {
    render(<TerminalTabs terminals={[]} />);
    expect(screen.getByText('暂无终端')).toBeInTheDocument();
  });
});

describe('TerminalRow & TerminalList', () => {
  it('open and stop are separate buttons; cwd full in title', async () => {
    const user = userEvent.setup();
    const onOpen = vi.fn();
    const onStop = vi.fn();
    render(<TerminalRow terminal={running} onOpen={onOpen} onStop={onStop} />);
    const open = screen.getByRole('button', { name: '打开 终端 A' });
    const stop = screen.getByRole('button', { name: '停止 终端 A' });
    expect(open.contains(stop)).toBe(false);
    expect(open).toHaveAccessibleDescription(/python classify\.py/);
    await user.click(stop);
    expect(onStop).toHaveBeenCalledTimes(1);
    expect(onOpen).not.toHaveBeenCalled();
    await user.click(open);
    expect(onOpen).toHaveBeenCalledTimes(1);
    expect(screen.getByText('/workspace/reef')).toHaveAttribute('title', '/workspace/reef');
  });

  it('read-only rows describe themselves and have no stop', () => {
    render(<TerminalRow terminal={{ ...inherited, stoppable: true }} onOpen={vi.fn()} onStop={vi.fn()} />);
    expect(screen.queryByRole('button', { name: /停止/ })).toBeNull();
    expect(screen.getByRole('button', { name: '打开 继承终端' })).toHaveAccessibleDescription(/继承的只读记录/);
  });

  it('no stop for non-stoppable, settled or stop-pending terminals', () => {
    const { rerender } = render(<TerminalRow terminal={stopPending} onStop={vi.fn()} />);
    expect(screen.queryByRole('button', { name: /停止/ })).toBeNull();
    rerender(<TerminalRow terminal={term({ status: 'ended' })} onStop={vi.fn()} />);
    expect(screen.queryByRole('button', { name: /停止/ })).toBeNull();
    rerender(<TerminalRow terminal={term({ stoppable: false })} onStop={vi.fn()} />);
    expect(screen.queryByRole('button', { name: /停止/ })).toBeNull();
  });

  it('groups by status and keeps the given order within a group', () => {
    const list: TerminalView[] = [
      term({ id: 't2', name: 'Two' }),
      term({ id: 't1', name: 'One', status: 'unknown' }),
      term({ id: 't3', name: 'Three', status: 'idle' }),
      { ...inherited, id: 't4', name: 'Four' },
      term({ id: 't5', name: 'Five', status: 'ended' }),
      term({ id: 't2', name: 'Dup' }),
    ];
    expect(terminalGroup(list[3]!)).toBe('inherited');
    render(<TerminalList terminals={list} onOpen={vi.fn()} />);
    const triggers = screen.getAllByRole('button', { expanded: true });
    expect(triggers.map((t) => t.textContent)).toEqual(['未关闭2', '状态待确认1', '已结束1']);
    // Inherited group collapsed by default.
    const inheritedTrigger = screen.getByRole('button', { name: /继承记录/ });
    expect(inheritedTrigger).toHaveAttribute('aria-expanded', 'false');
    const openNames = screen.getAllByRole('button', { name: /^打开/ }).map((b) => b.getAttribute('aria-label'));
    expect(openNames).toEqual(['打开 Two', '打开 Three', '打开 One', '打开 Five']);
    expect(screen.queryByText('Dup')).toBeNull();
  });

  it('collapsible groups toggle; load more only with callback', async () => {
    const user = userEvent.setup();
    const onLoadMore = vi.fn();
    const { rerender } = render(<TerminalList terminals={sampleTerminals} />);
    expect(screen.queryByRole('button', { name: '加载更多终端' })).toBeNull();
    const trigger = screen.getByRole('button', { name: /继承记录/ });
    await user.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('继承终端')).toBeInTheDocument();
    rerender(<TerminalList terminals={sampleTerminals} onLoadMore={onLoadMore} />);
    await user.click(screen.getByRole('button', { name: '加载更多终端' }));
    expect(onLoadMore).toHaveBeenCalled();
  });
});
