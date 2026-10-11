import * as React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MotionConfig } from 'motion/react';
import { describe, expect, it, vi } from 'vitest';
import type { ContextUsageView, FilePreviewView, MaterialPageView, SubagentView, TerminalView } from '@wzrhine/agent-core';
import { ChunkPager } from '../src/components/tools/ChunkPager';
import { ToolOutput } from '../src/components/tools/ToolOutput';
import { FilePreview, pathCrumbs } from '../src/components/artifact/FilePreview';
import { FilePreviewTabs } from '../src/components/artifact/FilePreviewTabs';
import type { FilePreviewTab } from '../src/components/artifact/FilePreviewTabs';
import { ArtifactList } from '../src/components/artifact/ArtifactCard';
import { ContextUsage } from '../src/components/workspace/ContextUsage';
import { PersistentTerminal } from '../src/components/workspace/PersistentTerminal';
import { CompactionNotice } from '../src/components/workspace/CompactionNotice';
import { SubAgentCard, SubAgentList } from '../src/components/workspace/SubAgentCard';
import { AgentMessagesProvider, agentEnUS } from '../src/provider/AgentMessages';
import { sampleArtifacts, sampleTerminals } from '../src/fixtures/session';

const page = (patch: Partial<MaterialPageView> = {}): MaterialPageView => ({
  offset: 0,
  nextOffset: 4096,
  length: 4096,
  total: 18200,
  unit: 'bytes',
  complete: false,
  content: 'line one\nline two',
  status: 'ready',
  ...patch,
});

describe('ChunkPager', () => {
  it('range header, fragment label and a focusable named region', () => {
    render(<ChunkPager page={page()} label="终端输出" canGoBack={false} />);
    const group = screen.getByRole('group', { name: '终端输出' });
    expect(group).toHaveTextContent('字节 0–4,096 / 18,200');
    expect(group).toHaveTextContent('片段');
    const region = screen.getByRole('region', { name: '终端输出 当前页' });
    expect(region).toHaveAttribute('tabindex', '0');
    expect(region).toHaveTextContent('line two');
  });

  it('lines are shown 1-based; complete pages say 已读至末尾', () => {
    render(<ChunkPager page={page({ unit: 'lines', offset: 200, length: 100, total: 300, nextOffset: undefined, complete: true })} label="旧文件内容" canGoBack />);
    expect(screen.getByRole('group', { name: '旧文件内容' })).toHaveTextContent('第 201–300 行 / 300');
    expect(screen.getByText('已读至末尾')).toBeInTheDocument();
  });

  it('next is enabled only with nextOffset and passes it on; reasons are described', async () => {
    const user = userEvent.setup();
    const onNext = vi.fn();
    const onPrevious = vi.fn();
    const onFirst = vi.fn();
    const { rerender } = render(<ChunkPager page={page()} label="材料" canGoBack={false} onFirst={onFirst} onPrevious={onPrevious} onNext={onNext} />);
    const next = screen.getByRole('button', { name: '下一页' });
    const prev = screen.getByRole('button', { name: '上一页' });
    const first = screen.getByRole('button', { name: '返回开头' });
    expect(next).not.toHaveAttribute('aria-disabled');
    expect(prev).toHaveAttribute('aria-disabled', 'true');
    expect(prev).toHaveAccessibleDescription('已在开头');
    expect(first).toHaveAttribute('aria-disabled', 'true');
    await user.click(prev);
    await user.click(first);
    expect(onPrevious).not.toHaveBeenCalled();
    expect(onFirst).not.toHaveBeenCalled();
    await user.click(next);
    expect(onNext).toHaveBeenCalledWith(4096);

    rerender(<ChunkPager page={page({ offset: 4096, nextOffset: undefined, complete: false })} label="材料" canGoBack onFirst={onFirst} onPrevious={onPrevious} onNext={onNext} />);
    const next2 = screen.getByRole('button', { name: '下一页' });
    expect(next2).toHaveAttribute('aria-disabled', 'true');
    expect(next2).toHaveAccessibleDescription('运行时没有提供下一页位置');
    await user.click(next2);
    expect(onNext).toHaveBeenCalledTimes(1);
    await user.click(screen.getByRole('button', { name: '上一页' }));
    await user.click(screen.getByRole('button', { name: '返回开头' }));
    expect(onPrevious).toHaveBeenCalledTimes(1);
    expect(onFirst).toHaveBeenCalledTimes(1);

    rerender(<ChunkPager page={page({ offset: 4096, nextOffset: undefined, complete: true })} label="材料" canGoBack onNext={onNext} />);
    expect(screen.getByRole('button', { name: '下一页' })).toHaveAccessibleDescription('已读至末尾，没有下一页');
  });

  it('loading: skeleton in aria-busy, buttons disabled', () => {
    const { container } = render(<ChunkPager page={page({ status: 'loading', content: undefined })} label="材料" canGoBack onNext={vi.fn()} onPrevious={vi.fn()} />);
    expect(container.querySelector('[aria-busy="true"]')).toHaveTextContent('正在读取这一页');
    expect(screen.getByRole('button', { name: '下一页' })).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByRole('button', { name: '上一页' })).toHaveAttribute('aria-disabled', 'true');
  });

  it('error: reason + retry; next disabled', async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    render(<ChunkPager page={page({ status: 'error', reason: '快照已过期', content: undefined })} label="材料" canGoBack={false} onRetry={onRetry} onNext={vi.fn()} />);
    expect(screen.getByText('这一页读取失败')).toBeInTheDocument();
    expect(screen.getByText('快照已过期')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '下一页' })).toHaveAccessibleDescription('这一页读取失败，先重试');
    await user.click(screen.getByRole('button', { name: '重试' }));
    expect(onRetry).toHaveBeenCalled();
  });

  it('newer: notice + read latest; custom renderer; English copy', async () => {
    const user = userEvent.setup();
    const onReadLatest = vi.fn();
    render(
      <AgentMessagesProvider messages={agentEnUS}>
        <ChunkPager page={page()} label="Output" canGoBack={false} newer onReadLatest={onReadLatest} renderContent={(t) => <mark>{t.length}</mark>} />
      </AgentMessagesProvider>,
    );
    expect(screen.getByText('Newer content exists; this is an older snapshot')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Read latest' }));
    expect(onReadLatest).toHaveBeenCalled();
    expect(screen.getByRole('group', { name: 'Output' })).toHaveTextContent('Bytes 0–4,096 / 18,200');
    expect(screen.getByText('17').tagName).toBe('MARK');
  });

  it('ToolOutput renders a ChunkPager through `page`', async () => {
    const user = userEvent.setup();
    const onNext = vi.fn();
    render(<ToolOutput output={{ kind: 'terminal', status: 'complete', content: 'tail', truncated: 'display' }} page={page()} pager={{ onNext }} onLoadMore={vi.fn()} />);
    expect(screen.getByRole('region', { name: '终端输出 当前页' })).toHaveTextContent('line one');
    expect(screen.queryByText('仅显示部分输出，完整内容可继续加载')).toBeNull();
    await user.click(screen.getByRole('button', { name: '下一页' }));
    expect(onNext).toHaveBeenCalledWith(4096);
  });
});

const file = (patch: Partial<FilePreviewView> = {}): FilePreviewView => ({
  id: 'f-1',
  name: 'classify.py',
  path: '/work/reef/src/classify.py',
  kind: 'code',
  status: 'ready',
  content: 'print(1)\n',
  ...patch,
});

describe('FilePreview additions', () => {
  it('split control: primary opens with the default target; menu lists targets, copy path and reference', async () => {
    const user = userEvent.setup();
    const onOpenWith = vi.fn();
    const onCopyPath = vi.fn();
    const onReference = vi.fn();
    render(
      <FilePreview
        file={file()}
        openTargets={[
          { id: 'code', label: 'VS Code' },
          { id: 'sys', label: '系统默认' },
          { id: 'folder', label: '文件管理器', group: 'reveal' },
        ]}
        defaultOpenTarget="sys"
        onOpenWith={onOpenWith}
        onCopyPath={onCopyPath}
        onReference={onReference}
      />,
    );
    await user.click(screen.getByRole('button', { name: '用 系统默认 打开' }));
    expect(onOpenWith).toHaveBeenLastCalledWith('sys', expect.objectContaining({ id: 'f-1' }));
    await user.click(screen.getByRole('button', { name: 'classify.py 的更多打开方式' }));
    const menu = await screen.findByRole('menu');
    const items = within(menu).getAllByRole('menuitem').map((i) => i.textContent);
    expect(items).toEqual(['VS Code', '系统默认', '文件管理器', '复制路径', '在对话中引用']);
    await user.click(within(menu).getByRole('menuitem', { name: 'VS Code' }));
    expect(onOpenWith).toHaveBeenLastCalledWith('code', expect.anything());
    await user.click(screen.getByRole('button', { name: 'classify.py 的更多打开方式' }));
    await user.click(await screen.findByRole('menuitem', { name: '复制路径' }));
    expect(onCopyPath).toHaveBeenCalledWith('/work/reef/src/classify.py', expect.anything());
    expect(await screen.findByText('已复制路径')).toBeInTheDocument();
  });

  it('copy path falls back to the clipboard', async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
    render(<FilePreview file={file()} openTargets={[{ id: 'code', label: 'VS Code' }]} onOpenWith={vi.fn()} />);
    await user.click(screen.getByRole('button', { name: 'classify.py 的更多打开方式' }));
    await user.click(await screen.findByRole('menuitem', { name: '复制路径' }));
    expect(writeText).toHaveBeenCalledWith('/work/reef/src/classify.py');
  });

  it('no split control without onOpenWith', () => {
    render(<FilePreview file={file()} openTargets={[{ id: 'code', label: 'VS Code' }]} />);
    expect(screen.queryByRole('button', { name: /打开方式/ })).toBeNull();
  });

  it('breadcrumb is workspace-relative under breadcrumbRoot; outside gets 外部', () => {
    const { rerender } = render(<FilePreview file={file()} breadcrumbRoot="/work/reef" />);
    const nav = screen.getByRole('navigation', { name: 'classify.py 的路径' });
    expect(within(nav).getAllByRole('listitem').map((li) => li.textContent)).toEqual(['reef', 'src', 'classify.py']);
    expect(screen.queryByText('外部')).toBeNull();
    rerender(<FilePreview file={file({ path: '/home/me/.env', name: '.env' })} breadcrumbRoot="/work/reef" />);
    expect(screen.getByText('外部')).toBeInTheDocument();
  });

  it('pathCrumbs handles Windows separators and case', () => {
    expect(pathCrumbs('E:\\Work\\Reef\\a.txt', 'e:/work/reef')).toEqual({ items: [{ label: 'reef' }, { label: 'a.txt' }], outside: false });
    expect(pathCrumbs(undefined)).toBeUndefined();
  });

  it('onReload is offered as 重新读取 for ready files', async () => {
    const user = userEvent.setup();
    const onReload = vi.fn();
    render(<FilePreview file={file()} onReload={onReload} />);
    await user.click(screen.getByRole('button', { name: '重新读取' }));
    expect(onReload).toHaveBeenCalled();
  });

  it('image zoom: fit by default, custom levels, natural-width sizing', async () => {
    const user = userEvent.setup();
    render(<FilePreview file={file({ kind: 'image', name: 'a.svg', content: 'data:image/svg+xml,<svg/>', alt: '示例图' })} zoomLevels={[400, 100, 100]} />);
    const img = screen.getByRole('img', { name: '示例图' });
    const group = screen.getByRole('group', { name: '缩放' });
    expect(within(group).getAllByRole('button').map((b) => b.textContent)).toEqual(['适应宽度', '100%', '400%']);
    expect(screen.getByRole('button', { name: '适应宽度' })).toHaveAttribute('aria-pressed', 'true');
    expect(img).toHaveAttribute('data-zoom', 'fit');
    Object.defineProperty(img, 'naturalWidth', { configurable: true, value: 120 });
    fireEvent.load(img);
    await user.click(screen.getByRole('button', { name: '400%' }));
    expect(img).toHaveAttribute('data-zoom', '400');
    expect(img.style.width).toBe('480px');
  });
});

const tabs: FilePreviewTab[] = [
  { id: 'a', name: 'alpha.py', kind: 'code' },
  { id: 'b', name: 'beta-with-a-very-long-name.md', kind: 'markdown' },
  { id: 'c', name: 'gamma.png', kind: 'image' },
];

function TabsHarness({ initial = tabs, onCloseAll }: { initial?: FilePreviewTab[]; onCloseAll?: () => void }) {
  const [list, setList] = React.useState(initial);
  const [active, setActive] = React.useState(initial[0]?.id ?? '');
  const opener = React.useRef<HTMLButtonElement>(null);
  return (
    <>
      <button ref={opener} type="button">
        opener
      </button>
      <FilePreviewTabs
        tabs={list}
        activeId={active}
        onActivate={setActive}
        onCloseTab={(id) => setList((l) => l.filter((t) => t.id !== id))}
        onCloseAll={
          onCloseAll &&
          (() => {
            onCloseAll();
            setList([]);
          })
        }
        renderPanel={(id) => <p>panel {id}</p>}
        returnFocusRef={opener}
      />
    </>
  );
}

describe('FilePreviewTabs', () => {
  it('tablist semantics, roving tabIndex, title with the full name, panel linked', () => {
    render(<TabsHarness />);
    const list = screen.getByRole('tablist', { name: '已打开的文件' });
    const all = within(list).getAllByRole('tab');
    expect(all.map((t) => t.getAttribute('tabindex'))).toEqual(['0', '-1', '-1']);
    expect(all[1]).toHaveAttribute('title', 'beta-with-a-very-long-name.md');
    const panel = screen.getByRole('tabpanel');
    expect(panel).toHaveAttribute('aria-labelledby', all[0]!.id);
    expect(all[0]).toHaveAttribute('aria-controls', panel.id);
    expect(panel).toHaveTextContent('panel a');
    expect(screen.getByRole('button', { name: '关闭 alpha.py' })).toBeInTheDocument();
  });

  it('arrow keys / Home / End move and activate (wrapping)', async () => {
    const user = userEvent.setup();
    render(<TabsHarness />);
    const first = screen.getByRole('tab', { name: 'alpha.py' });
    first.focus();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: /beta/ })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: /beta/ })).toHaveFocus();
    expect(screen.getByRole('tabpanel')).toHaveTextContent('panel b');
    await user.keyboard('{End}');
    expect(screen.getByRole('tab', { name: 'gamma.png' })).toHaveFocus();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'alpha.py' })).toHaveFocus();
    await user.keyboard('{ArrowLeft}');
    expect(screen.getByRole('tab', { name: 'gamma.png' })).toHaveAttribute('aria-selected', 'true');
    await user.keyboard('{Home}');
    expect(screen.getByRole('tab', { name: 'alpha.py' })).toHaveAttribute('aria-selected', 'true');
  });

  it('closing the active tab activates and focuses the next neighbour; last close returns focus', async () => {
    const user = userEvent.setup();
    render(<TabsHarness />);
    screen.getByRole('tab', { name: 'alpha.py' }).focus();
    await user.keyboard('{Delete}');
    expect(screen.queryByRole('tab', { name: 'alpha.py' })).toBeNull();
    expect(screen.getByRole('tab', { name: /beta/ })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: /beta/ })).toHaveFocus();
    await user.click(screen.getByRole('button', { name: '关闭 beta-with-a-very-long-name.md' }));
    expect(screen.getByRole('tab', { name: 'gamma.png' })).toHaveFocus();
    await user.keyboard('{Backspace}');
    expect(screen.queryByRole('tablist')).toBeNull();
    expect(screen.getByRole('button', { name: 'opener' })).toHaveFocus();
  });

  it('closing the last tab activates the previous one', async () => {
    const user = userEvent.setup();
    render(<TabsHarness />);
    screen.getByRole('tab', { name: 'alpha.py' }).focus();
    await user.keyboard('{End}{Delete}');
    expect(screen.getByRole('tab', { name: /beta/ })).toHaveAttribute('aria-selected', 'true');
  });

  it('middle click (auxclick button 1) closes a tab; other buttons do not', () => {
    render(<TabsHarness />);
    const gamma = screen.getByRole('tab', { name: 'gamma.png' });
    fireEvent(gamma, new MouseEvent('auxclick', { bubbles: true, button: 2 }));
    expect(screen.getByRole('tab', { name: 'gamma.png' })).toBeInTheDocument();
    fireEvent(gamma, new MouseEvent('auxclick', { bubbles: true, button: 1 }));
    expect(screen.queryByRole('tab', { name: 'gamma.png' })).toBeNull();
    expect(screen.getByRole('tab', { name: 'alpha.py' })).toHaveAttribute('aria-selected', 'true');
  });

  it('Escape in the strip calls onCloseAll and returns focus', async () => {
    const user = userEvent.setup();
    const onCloseAll = vi.fn();
    render(<TabsHarness onCloseAll={onCloseAll} />);
    screen.getByRole('tab', { name: 'alpha.py' }).focus();
    await user.keyboard('{Escape}');
    expect(onCloseAll).toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'opener' })).toHaveFocus();
  });

  it('scrollIntoView is called when present and skipped when missing', async () => {
    const user = userEvent.setup();
    const spy = vi.fn();
    const original = HTMLElement.prototype.scrollIntoView;
    HTMLElement.prototype.scrollIntoView = spy;
    try {
      render(<TabsHarness />);
      screen.getByRole('tab', { name: 'alpha.py' }).focus();
      await user.keyboard('{ArrowRight}');
      expect(spy).toHaveBeenLastCalledWith({ block: 'nearest', inline: 'nearest' });
    } finally {
      HTMLElement.prototype.scrollIntoView = original;
    }
  });

  it('two instances have distinct ids', () => {
    render(
      <>
        <TabsHarness />
        <TabsHarness />
      </>,
    );
    const ids = screen.getAllByRole('tab').map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

const usage: ContextUsageView = {
  used: 12_400,
  max: 32_000,
  unit: 'tokens',
  completeness: 'exact',
  stats: [
    {
      id: 'cache',
      title: '缓存',
      rows: [
        { label: '命中率', value: 62.5, unit: 'percent' },
        { label: '缓存读取', value: 8_000, unit: 'tokens' },
        { label: '缓存写入', unit: 'tokens' },
      ],
    },
    {
      id: 'speed',
      title: '速度',
      rows: [
        { label: '首字延迟', value: 840, unit: 'ms' },
        { label: '生成速度', value: 42.25, unit: 'tokens-per-s', completeness: 'estimated' },
        { label: '请求次数', value: 0, unit: 'count' },
        { label: '重试', value: 3, unit: 'count', completeness: 'unknown' },
      ],
    },
  ],
};

describe('ContextUsage stats', () => {
  it('renders one dl per section; missing values show — never 0', () => {
    const { container } = render(<ContextUsage usage={usage} />);
    const stats = screen.getByRole('group', { name: '用量统计' });
    expect(within(stats).getByRole('region', { name: '缓存' }).querySelector('dl')).not.toBeNull();
    expect(container.querySelectorAll('.rl-agent-context__stat-list')).toHaveLength(2);
    const value = (label: string) => within(stats).getByText(label).nextElementSibling as HTMLElement;
    expect(value('命中率')).toHaveTextContent('62.5%');
    expect(value('缓存读取')).toHaveTextContent('8K token');
    expect(value('缓存写入')).toHaveTextContent('—');
    expect(value('缓存写入')).toHaveTextContent('无数据');
    expect(value('缓存写入')).not.toHaveTextContent('0');
    expect(value('首字延迟')).toHaveTextContent('840ms');
    expect(value('生成速度')).toHaveTextContent('42.3 token/s');
    expect(value('生成速度')).toHaveTextContent('估计值');
    expect(value('请求次数')).toHaveTextContent('0 次');
    expect(value('重试')).toHaveTextContent('—');
  });

  it('stats also render inside the ring popover; openOnHover passes through', async () => {
    const user = userEvent.setup();
    render(<ContextUsage usage={usage} variant="ring" openOnHover />);
    await user.click(screen.getByRole('button', { name: /上下文用量/ }));
    const dialog = await screen.findByRole('dialog', { name: '上下文用量' });
    expect(within(dialog).getByRole('group', { name: '用量统计' })).toBeInTheDocument();
  });

  it('no stats group without stats', () => {
    render(<ContextUsage usage={{ ...usage, stats: undefined }} />);
    expect(screen.queryByRole('group', { name: '用量统计' })).toBeNull();
  });
});

const term = (patch: Partial<TerminalView> = {}): TerminalView => ({ ...sampleTerminals[0]!, ...patch });

describe('PersistentTerminal additions', () => {
  it('newer output: 有新输出，读取最新 only with the callback', async () => {
    const user = userEvent.setup();
    const onReadLatest = vi.fn();
    const { rerender } = render(<PersistentTerminal terminal={term({ newerOutput: true })} />);
    expect(screen.queryByRole('button', { name: '有新输出，读取最新' })).toBeNull();
    rerender(<PersistentTerminal terminal={term({ newerOutput: true })} onReadLatest={onReadLatest} />);
    await user.click(screen.getByRole('button', { name: '有新输出，读取最新' }));
    expect(onReadLatest).toHaveBeenCalledWith(expect.objectContaining({ id: 'term-a' }));
    rerender(<PersistentTerminal terminal={term({ newerOutput: false })} onReadLatest={onReadLatest} />);
    expect(screen.queryByRole('button', { name: '有新输出，读取最新' })).toBeNull();
  });

  it('notes as a list; history as an ordered list with status text, exit code and time', async () => {
    const user = userEvent.setup();
    const onLoadMoreHistory = vi.fn();
    render(
      <PersistentTerminal
        terminal={term({
          notes: ['空闲为推断', '结果待保存'],
          history: [
            { id: 'h1', command: 'pytest -q', status: 'failed', exitCode: 1, at: '2026-10-09T08:00:00Z' },
            { id: 'h2', command: 'python run.py', status: 'running' },
            { id: 'h3', command: 'ls', status: 'unknown' },
          ],
        })}
        onLoadMoreHistory={onLoadMoreHistory}
      />,
    );
    const notes = screen.getByRole('list', { name: '终端说明' });
    expect(within(notes).getAllByRole('listitem')).toHaveLength(2);
    const history = screen.getByRole('region', { name: '调用记录' });
    const items = within(history).getAllByRole('listitem');
    expect(history.querySelector('ol')).not.toBeNull();
    expect(items[0]).toHaveTextContent('pytest -q');
    expect(items[0]).toHaveTextContent('失败');
    expect(items[0]).toHaveTextContent('退出码 1');
    expect(items[0]!.querySelector('time')).toHaveAttribute('dateTime', '2026-10-09T08:00:00Z');
    expect(items[1]).toHaveTextContent('运行中');
    expect(items[2]).toHaveTextContent('状态待确认');
    await user.click(within(history).getByRole('button', { name: '加载更早的调用' }));
    expect(onLoadMoreHistory).toHaveBeenCalled();
  });

  it('page replaces the live tail with a ChunkPager', async () => {
    const user = userEvent.setup();
    const onNext = vi.fn();
    render(<PersistentTerminal terminal={term()} page={page({ content: 'stored chunk' })} pager={{ onNext, canGoBack: true, onPrevious: vi.fn() }} />);
    expect(screen.queryByRole('log')).toBeNull();
    expect(screen.getByRole('region', { name: '终端 A 输出 当前页' })).toHaveTextContent('stored chunk');
    expect(screen.getByRole('button', { name: '上一页' })).not.toHaveAttribute('aria-disabled');
    await user.click(screen.getByRole('button', { name: '下一页' }));
    expect(onNext).toHaveBeenCalledWith(4096);
  });
});

describe('CompactionNotice additions', () => {
  it('interrupted shows its label and the default retry hint', () => {
    const { container } = render(<CompactionNotice status="interrupted" />);
    expect(screen.getByRole('status')).toHaveTextContent('上下文整理已中断');
    expect(screen.getByText('可输入 /compact 重试')).toBeInTheDocument();
    expect(container.firstElementChild).toHaveAttribute('data-status', 'interrupted');
  });

  it('custom and hidden retry hint', () => {
    const { rerender } = render(<CompactionNotice status="failed" retryHint="稍后自动重试" />);
    expect(screen.getByText('稍后自动重试')).toBeInTheDocument();
    rerender(<CompactionNotice status="failed" retryHint={null} />);
    expect(screen.queryByText('可输入 /compact 重试')).toBeNull();
    rerender(<CompactionNotice status="completed" />);
    expect(screen.queryByText('可输入 /compact 重试')).toBeNull();
  });

  it('phase sub-label only while running', () => {
    const { rerender } = render(<CompactionNotice status="running" phase="saving" />);
    expect(screen.getByRole('status')).toHaveTextContent('正在保存结果');
    rerender(<CompactionNotice status="completed" phase="saving" />);
    expect(screen.queryByText('正在保存结果')).toBeNull();
  });

  it('English copy for interrupted', () => {
    render(
      <AgentMessagesProvider messages={agentEnUS}>
        <CompactionNotice status="interrupted" />
      </AgentMessagesProvider>,
    );
    expect(screen.getByText('Compaction interrupted')).toBeInTheDocument();
    expect(screen.getByText('Type /compact to retry')).toBeInTheDocument();
  });
});

describe('ArtifactList truncated', () => {
  it('note + optional show all', async () => {
    const user = userEvent.setup();
    const onShowAll = vi.fn();
    const { rerender } = render(<ArtifactList artifacts={sampleArtifacts} />);
    expect(screen.queryByText('部分产物未列出')).toBeNull();
    rerender(<ArtifactList artifacts={sampleArtifacts} truncated />);
    expect(screen.getByText('部分产物未列出')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '查看全部产物' })).toBeNull();
    rerender(<ArtifactList artifacts={sampleArtifacts} truncated onShowAll={onShowAll} />);
    await user.click(screen.getByRole('button', { name: '查看全部产物' }));
    expect(onShowAll).toHaveBeenCalled();
  });

  it('empty but truncated never says 暂无产物', () => {
    render(<ArtifactList artifacts={[]} truncated />);
    expect(screen.getByText('部分产物未列出')).toBeInTheDocument();
    expect(screen.queryByText('暂无产物')).toBeNull();
  });
});

const inheritedAgent: SubagentView = { id: 's-9', name: '旧核查', task: '上一轮的核查记录', status: 'needs-attention', pendingInput: 2, inherited: true };

describe('SubAgentCard inherited', () => {
  it('badge, no attention, no open; snapshot only with the callback', async () => {
    const user = userEvent.setup();
    const onOpen = vi.fn();
    const onOpenSnapshot = vi.fn();
    const { rerender } = render(<SubAgentCard agent={inheritedAgent} onOpen={onOpen} />);
    const card = screen.getByRole('article', { name: '旧核查' });
    expect(card).toHaveAttribute('data-inherited', 'true');
    expect(card).not.toHaveAttribute('data-attention');
    expect(card).toHaveTextContent('继承的子任务记录');
    expect(screen.queryByText('子任务需要你处理后才能继续')).toBeNull();
    expect(screen.queryByRole('button')).toBeNull();
    rerender(<SubAgentCard agent={inheritedAgent} onOpen={onOpen} onOpenSnapshot={onOpenSnapshot} />);
    await user.click(screen.getByRole('button', { name: '查看快照：旧核查' }));
    expect(onOpenSnapshot).toHaveBeenCalledWith('s-9');
    expect(onOpen).not.toHaveBeenCalled();
  });

  it('inherited running record draws no spark', () => {
    const { container } = render(
      <MotionConfig reducedMotion="always">
        <SubAgentCard agent={{ ...inheritedAgent, status: 'running' }} />
      </MotionConfig>,
    );
    expect(container.querySelector('.rl-agent-spark')).toBeNull();
  });

  it('SubAgentList groups inherited records under their own heading', () => {
    const live: SubagentView = { id: 's-1', name: '新任务', task: '本轮任务', status: 'running' };
    const { rerender } = render(<SubAgentList agents={[inheritedAgent, live]} />);
    expect(screen.queryByRole('heading', { name: '继承的子任务记录' })).toBeNull();
    rerender(<SubAgentList agents={[inheritedAgent, live]} groupInherited />);
    const group = screen.getByRole('group', { name: '继承的子任务记录' });
    expect(within(group).getByRole('heading', { level: 2, name: '继承的子任务记录' })).toBeInTheDocument();
    expect(within(group).getByRole('article', { name: '旧核查' })).toBeInTheDocument();
    expect(within(group).queryByRole('article', { name: '新任务' })).toBeNull();
    const articles = screen.getAllByRole('article').map((a) => a.getAttribute('aria-labelledby') && a.textContent?.slice(0, 3));
    expect(articles[0]).toContain('新任务');
  });
});
