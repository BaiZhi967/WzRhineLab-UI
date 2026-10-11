import * as React from 'react';
import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MotionConfig } from 'motion/react';
import { describe, expect, it, vi } from 'vitest';
import type { ToolCallView } from '@wzrhine/agent-core';
import {
  AgentMessagesProvider,
  agentEnUS,
  CodeModeToolTree,
  ToolActivity,
  ToolHistory,
  ToolRecord,
  childOutcome,
  orderTools,
} from '../src/index';
import { sampleTools } from '../src/fixtures/session';

const [readTool, commandTool, editTool, mcpTool, codeModeTool] = sampleTools as [
  ToolCallView,
  ToolCallView,
  ToolCallView,
  ToolCallView,
  ToolCallView,
];

const row = (name: RegExp | string) => screen.getByRole('button', { name });

describe('ToolRecord', () => {
  it('row is a disclosure button with a full accessible name; details mount on first open', async () => {
    const user = userEvent.setup();
    render(<ToolRecord tool={readTool} />);
    const trigger = row(/读取文件/);
    expect(trigger.tagName).toBe('BUTTON');
    expect(trigger).toHaveAccessibleName(/读取：.*读取文件 data\/reef\/manifest\.csv .*已完成 用时 120ms/);
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText('只读自动允许', { exact: false })).toBeNull();
    await user.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('group', { name: '读取文件 详情' })).toBeInTheDocument();
    expect(screen.getByText(/授权：自动允许 · 只读自动允许/)).toBeInTheDocument();
    expect(screen.getByText('read_file', { selector: 'code' })).toBeInTheDocument();
  });

  it('opens with Enter and Space from the keyboard', async () => {
    const user = userEvent.setup();
    render(<ToolRecord tool={commandTool} />);
    const trigger = row(/执行命令/);
    trigger.focus();
    await user.keyboard('{Enter}');
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await user.keyboard(' ');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  it('expanded state survives a status change', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<ToolRecord tool={commandTool} />);
    await user.click(row(/执行命令/));
    rerender(<ToolRecord tool={{ ...commandTool, status: 'completed' }} />);
    expect(row(/执行命令/)).toHaveAttribute('aria-expanded', 'true');
    expect(row(/执行命令/)).toHaveAccessibleName(/已完成/);
  });

  it('lazy details: calls onLoadDetails once on open, shows loading, then content', async () => {
    const user = userEvent.setup();
    const onLoad = vi.fn();
    const lazy: ToolCallView = {
      ...readTool,
      detailsLoaded: false,
      detail: undefined,
    };
    const { rerender } = render(<ToolRecord tool={lazy} onLoadDetails={onLoad} />);
    expect(onLoad).not.toHaveBeenCalled();
    await user.click(row(/读取文件/));
    expect(onLoad).toHaveBeenCalledTimes(1);
    expect(onLoad).toHaveBeenCalledWith('op-1');
    expect(screen.getByRole('status')).toHaveTextContent('正在读取完整记录');
    expect(screen.getByText('正在读取完整记录…').closest('[aria-busy="true"]')).not.toBeNull();
    rerender(<ToolRecord tool={lazy} onLoadDetails={onLoad} />);
    expect(onLoad).toHaveBeenCalledTimes(1);
    rerender(<ToolRecord tool={readTool} onLoadDetails={onLoad} />);
    expect(screen.getByText('可从第 41 行继续读取')).toBeInTheDocument();
  });

  it('load error shows retry that calls onLoadDetails again', async () => {
    const user = userEvent.setup();
    const onLoad = vi.fn();
    render(<ToolRecord tool={{ ...readTool, detailsLoaded: false }} onLoadDetails={onLoad} detailsError defaultExpanded />);
    expect(screen.getByText('完整记录读取失败')).toBeInTheDocument();
    expect(onLoad).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: '重试' }));
    expect(onLoad).toHaveBeenCalledWith('op-1');
  });

  it('unknown receipt is a warning, never success', () => {
    render(<ToolRecord tool={{ ...mcpTool, receipt: { status: 'unknown' } }} defaultExpanded />);
    expect(row(/MCP 工具/)).toHaveAccessibleName(/结果待确认/);
    expect(screen.getByText(/操作回执待确认/)).toBeInTheDocument();
    expect(screen.getByText('远端结果待确认，需要核对')).toBeInTheDocument();
    expect(document.querySelector('.rl-agent-tool')).toHaveAttribute('data-status', 'unknown');
  });

  it('renderDetail overrides the detail; undefined falls back', () => {
    const { rerender } = render(<ToolRecord tool={readTool} defaultExpanded renderDetail={() => <p>custom</p>} />);
    expect(screen.getByText('custom')).toBeInTheDocument();
    rerender(<ToolRecord tool={readTool} defaultExpanded renderDetail={() => undefined} />);
    expect(screen.getByText('可从第 41 行继续读取')).toBeInTheDocument();
  });

  it('controlled expanded reports changes without toggling itself', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ToolRecord tool={readTool} expanded={false} onExpandedChange={onChange} />);
    await user.click(row(/读取文件/));
    expect(onChange).toHaveBeenCalledWith(true, 'op-1');
    expect(row(/读取文件/)).toHaveAttribute('aria-expanded', 'false');
  });

  it('two instances have distinct panel ids', () => {
    render(
      <>
        <ToolRecord tool={readTool} defaultExpanded />
        <ToolRecord tool={readTool} defaultExpanded />
      </>,
    );
    const controls = screen.getAllByRole('button', { name: /读取文件/ }).map((b) => b.getAttribute('aria-controls'));
    expect(controls[0]).toBeTruthy();
    expect(controls[0]).not.toBe(controls[1]);
  });

  it('english table', () => {
    render(
      <AgentMessagesProvider messages={agentEnUS}>
        <ToolRecord tool={readTool} />
      </AgentMessagesProvider>,
    );
    expect(row(/Read:/)).toHaveAccessibleName(/Done/);
  });
});

describe('ToolActivity', () => {
  it('dedupes by id, orders by sequence, counts and is open while active', () => {
    const tools = [editTool, readTool, commandTool, { ...readTool, summary: 'dup' }];
    render(<ToolActivity tools={tools} elapsedMs={18_400} />);
    const header = screen.getByRole('button', { name: /3 个操作/ });
    expect(header).toHaveAttribute('aria-expanded', 'true');
    expect(header).toHaveTextContent('1 个进行中');
    expect(header).toHaveTextContent('用时 18.4s');
    const list = screen.getByRole('list', { name: '本轮工具操作' });
    const names = within(list)
      .getAllByRole('button')
      .map((b) => b.getAttribute('aria-label'));
    expect(names).toHaveLength(3);
    expect(names[0]).toMatch(/读取文件/);
    expect(names[1]).toMatch(/执行命令/);
    expect(names[2]).toMatch(/编辑文件/);
    expect(document.querySelector('.rl-agent-activity .rl-agent-spark')).not.toBeNull();
  });

  it('settled rounds start collapsed and have no spark', () => {
    render(<ToolActivity tools={[readTool]} />);
    expect(screen.getByRole('button', { name: /1 个操作/ })).toHaveAttribute('aria-expanded', 'false');
    expect(document.querySelector('.rl-agent-activity .rl-agent-spark')).toBeNull();
  });

  it('only rows that arrive after mount get an entrance; large batches do not', () => {
    const { rerender } = render(<ToolActivity tools={[commandTool]} defaultExpanded />);
    const initial = document.querySelector('[data-agent-entrance]') as HTMLElement;
    expect(initial.style.opacity).not.toBe('0');
    rerender(<ToolActivity tools={[commandTool, editTool]} defaultExpanded />);
    const items = document.querySelectorAll<HTMLElement>('[data-agent-entrance]');
    expect(items[1]!.style.opacity).toBe('0');
    const many = Array.from({ length: 25 }, (_, i) => ({
      ...readTool,
      id: `bulk-${i}`,
      sequence: 100 + i,
    }));
    rerender(<ToolActivity tools={[commandTool, editTool, ...many]} defaultExpanded />);
    const bulk = Array.from(document.querySelectorAll<HTMLElement>('[data-agent-entrance]')).slice(2);
    expect(bulk.every((el) => el.style.opacity !== '0')).toBe(true);
  });

  it('reduced motion: new rows render without transform', () => {
    const { rerender } = render(
      <MotionConfig reducedMotion="always">
        <ToolActivity tools={[commandTool]} defaultExpanded />
      </MotionConfig>,
    );
    rerender(
      <MotionConfig reducedMotion="always">
        <ToolActivity tools={[commandTool, editTool]} defaultExpanded />
      </MotionConfig>,
    );
    const items = document.querySelectorAll<HTMLElement>('[data-agent-entrance]');
    expect(items[1]!.style.transform === '' || items[1]!.style.transform === 'none').toBe(true);
  });

  it('history link only with onOpenHistory; renderTool override', async () => {
    const user = userEvent.setup();
    const open = vi.fn();
    const { rerender } = render(<ToolActivity tools={[readTool]} defaultExpanded />);
    expect(screen.queryByRole('button', { name: '完整工具记录' })).toBeNull();
    rerender(<ToolActivity tools={[readTool]} defaultExpanded onOpenHistory={open} renderTool={(t) => <p>row {t.id}</p>} />);
    expect(screen.getByText('row op-1')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '完整工具记录' }));
    expect(open).toHaveBeenCalled();
  });

  it('orderTools keeps insertion order when sequences are missing', () => {
    const a = { ...readTool, id: 'a', sequence: undefined };
    const b = { ...readTool, id: 'b', sequence: 1 };
    expect(orderTools([a, b, a]).map((t) => t.id)).toEqual(['a', 'b']);
  });
});

describe('CodeModeToolTree', () => {
  it('nested lists, children keep their own status, outcome from children', async () => {
    const user = userEvent.setup();
    render(<CodeModeToolTree root={codeModeTool} />);
    const tree = screen.getByRole('list', { name: 'Code Mode' });
    const children = within(tree).getByRole('list', {
      name: 'Code Mode 的子操作',
    });
    const childRows = within(children).getAllByRole('button');
    expect(childRows[0]).toHaveAccessibleName(/已完成/);
    expect(childRows[1]).toHaveAccessibleName(/失败/);
    expect(screen.getByText('部分完成：1 个子操作失败')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '查看脚本' }));
    expect(screen.getByRole('region', { name: '脚本 · typescript' })).toHaveTextContent('tools.find_files');
  });

  it('builds the tree from a flat list with parentId, supports deep nesting and expandedIds', async () => {
    const user = userEvent.setup();
    const flat: ToolCallView[] = [
      { id: 'p', name: 'code_mode', status: 'running' },
      {
        id: 'c1',
        parentId: 'p',
        name: 'read_directory',
        status: 'completed',
        sequence: 1,
      },
      {
        id: 'c2',
        parentId: 'c1',
        name: 'read_file',
        status: 'completed',
        sequence: 2,
      },
      {
        id: 'c3',
        parentId: 'c2',
        name: 'apply_patch',
        status: 'waiting-approval',
        sequence: 3,
      },
    ];
    const onChange = vi.fn();
    render(<CodeModeToolTree tools={flat} expandedIds={['c2']} onExpandedChange={onChange} />);
    expect(screen.getByRole('list', { name: 'read_file 的子操作' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /read_file/ })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('1 个子操作中 1 个进行中')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /apply_patch/ }));
    expect(onChange).toHaveBeenCalledWith(['c2', 'c3']);
  });

  it('childOutcome', () => {
    expect(childOutcome([]).kind).toBe('empty');
    expect(childOutcome([{ status: 'completed' }]).kind).toBe('done');
    expect(childOutcome([{ status: 'failed' }]).kind).toBe('failed');
    expect(childOutcome([{ status: 'failed' }, { status: 'completed' }])).toMatchObject({ kind: 'partial', failed: 1 });
    expect(childOutcome([{ status: 'unknown' }, { status: 'completed' }]).kind).toBe('unknown');
    expect(childOutcome([{ status: 'running' }, { status: 'failed' }]).kind).toBe('running');
  });
});

describe('ToolHistory', () => {
  const page1: ToolCallView[] = [readTool, commandTool];
  const page2: ToolCallView[] = [{ ...commandTool, summary: 'replayed' }, editTool, mcpTool];

  it('appends pages without duplicates and never reorders read rows', async () => {
    const user = userEvent.setup();
    const onMore = vi.fn();
    const { rerender } = render(<ToolHistory items={page1} hasMore onLoadMore={onMore} defaultExpanded />);
    expect(screen.getByRole('button', { name: /完整工具记录/ })).toHaveTextContent('已加载 2 个操作');
    await user.click(screen.getByRole('button', { name: '加载更多操作' }));
    expect(onMore).toHaveBeenCalled();
    // A later page with an earlier sequence still appends after the rows already read.
    const early = { ...readTool, id: 'op-0', sequence: 0 };
    rerender(<ToolHistory items={[...page1, ...page2, early]} total={6} defaultExpanded />);
    const list = screen.getByRole('list', { name: '工具记录' });
    const labels = within(list)
      .getAllByRole('button')
      .map((b) => b.getAttribute('aria-label') ?? '');
    expect(labels).toHaveLength(5);
    expect(labels.filter((l) => l.includes('执行命令'))).toHaveLength(1);
    expect(labels[0]).toMatch(/读取文件 data/);
    expect(labels[1]).toMatch(/执行命令/);
    expect(screen.getByRole('button', { name: /完整工具记录/ })).toHaveTextContent('已加载 5 / 6 个操作');
  });

  it('keeps loaded rows on error and shows loading status', () => {
    const { rerender } = render(<ToolHistory items={page1} loading defaultExpanded hasMore onLoadMore={() => {}} />);
    expect(screen.getByRole('status')).toHaveTextContent('正在读取操作记录');
    expect(screen.getByRole('button', { name: '加载更多操作' })).toHaveAttribute('aria-busy', 'true');
    rerender(<ToolHistory items={page1} error defaultExpanded hasMore onLoadMore={() => {}} />);
    expect(screen.getByText('操作记录读取失败，已加载的记录保留')).toBeInTheDocument();
    expect(within(screen.getByRole('list', { name: '工具记录' })).getAllByRole('button')).toHaveLength(2);
  });

  it('onOpenOperation adds a named locate button per row', async () => {
    const user = userEvent.setup();
    const open = vi.fn();
    render(<ToolHistory items={page1} defaultExpanded onOpenOperation={open} />);
    await user.click(screen.getByRole('button', { name: /在对话中定位 · 执行命令/ }));
    expect(open).toHaveBeenCalledWith('op-2');
  });

  it('empty state', () => {
    render(<ToolHistory items={[]} defaultExpanded />);
    expect(screen.getByText('还没有工具记录')).toBeInTheDocument();
  });
});

describe('lazy loading in a list (act)', () => {
  it('row inside ToolActivity loads details via adapter', async () => {
    const user = userEvent.setup();
    function Demo() {
      const [tool, setTool] = React.useState<ToolCallView>({
        ...readTool,
        detailsLoaded: false,
        detail: undefined,
      });
      return <ToolActivity tools={[tool]} defaultExpanded onLoadDetails={() => setTool(readTool)} />;
    }
    render(<Demo />);
    await act(async () => {
      await user.click(screen.getByRole('button', { name: /读取文件/ }));
    });
    expect(screen.getByText('可从第 41 行继续读取')).toBeInTheDocument();
  });
});
