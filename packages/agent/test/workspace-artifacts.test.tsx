import * as React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MotionConfig } from 'motion/react';
import { describe, expect, it, vi } from 'vitest';
import type { ArtifactView, FilePreviewView, LedgerEventView, RunSummaryView } from '@wzrhine/agent-core';
import { ArtifactCard, ArtifactList } from '../src/components/artifact/ArtifactCard';
import { FilePreview } from '../src/components/artifact/FilePreview';
import { ActivityLedger, orderLedger } from '../src/components/workspace/ActivityLedger';
import { RunSummary } from '../src/components/workspace/RunSummary';
import { CompactionNotice } from '../src/components/workspace/CompactionNotice';
import { sampleArtifacts, sampleLedger } from '../src/fixtures/session';

const art = (patch: Partial<ArtifactView> = {}): ArtifactView => ({ ...sampleArtifacts[0]!, ...patch });

describe('ArtifactCard & ArtifactList', () => {
  it('saved label only for saved; generating has activity without a percentage', () => {
    const statuses: ArtifactView['status'][] = ['generating', 'partial', 'saved', 'failed', 'unavailable', 'stale'];
    for (const status of statuses) {
      const { unmount } = render(<ArtifactCard artifact={art({ status })} />);
      const card = screen.getByRole('article');
      if (status === 'saved') expect(card).toHaveTextContent('已保存');
      else expect(card).not.toHaveTextContent('已保存');
      expect(card.textContent).not.toMatch(/\d+%/);
      if (status === 'generating') expect(card).toHaveAttribute('aria-busy', 'true');
      unmount();
    }
  });

  it('meta: kind, size, version, change badge; reason is the description', () => {
    render(<ArtifactCard artifact={art({ version: '3', change: 'modified', status: 'partial', reason: '本地保存未完成' })} />);
    const card = screen.getByRole('article', { name: 'classification_results.csv' });
    expect(card).toHaveTextContent('数据');
    expect(card).toHaveTextContent('2.1 KB');
    expect(card).toHaveTextContent('版本 3');
    expect(card).toHaveTextContent('已修改');
    expect(card).toHaveAccessibleDescription('本地保存未完成');
  });

  it('actions only with callbacks; failed offers retry and no open', async () => {
    const user = userEvent.setup();
    const onOpen = vi.fn();
    const onDownload = vi.fn();
    const onRetry = vi.fn();
    const { rerender } = render(<ArtifactCard artifact={art()} />);
    expect(screen.queryByRole('button')).toBeNull();
    rerender(<ArtifactCard artifact={art()} onOpen={onOpen} onDownload={onDownload} onReveal={vi.fn()} />);
    await user.click(screen.getByRole('button', { name: '打开 classification_results.csv' }));
    await user.click(screen.getByRole('button', { name: '下载 classification_results.csv' }));
    expect(screen.getByRole('button', { name: '在文件夹中显示 classification_results.csv' })).toBeInTheDocument();
    expect(onOpen).toHaveBeenCalledTimes(1);
    expect(onDownload).toHaveBeenCalledTimes(1);
    rerender(<ArtifactCard artifact={art({ status: 'failed' })} onOpen={onOpen} onRetry={onRetry} />);
    expect(screen.queryByRole('button', { name: /^打开/ })).toBeNull();
    await user.click(screen.getByRole('button', { name: '重试 classification_results.csv' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
    rerender(<ArtifactCard artifact={art({ status: 'unavailable' })} onOpen={onOpen} onDownload={onDownload} />);
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('image preview uses alt; unsafe URLs fall back to the kind icon', () => {
    const { container, rerender } = render(<ArtifactCard artifact={art({ kind: 'image', preview: 'data:image/svg+xml,<svg/>', alt: '珊瑚图' })} />);
    expect(screen.getByRole('img', { name: '珊瑚图' })).toBeInTheDocument();
    rerender(<ArtifactCard artifact={art({ kind: 'image', preview: 'https://example.com/x.png', alt: 'x' })} />);
    expect(container.querySelector('img')).toBeNull();
  });

  it('list: role list, dedupe, only later items animate', () => {
    const { container, rerender } = render(<ArtifactList artifacts={[...sampleArtifacts, sampleArtifacts[0]!]} />);
    expect(screen.getByRole('list', { name: '产物' })).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
    const firstItem = container.querySelector('li')!;
    expect(firstItem.getAttribute('style') ?? '').not.toMatch(/opacity: 0/);
    rerender(<ArtifactList artifacts={[...sampleArtifacts, art({ id: 'a-new', title: 'new.txt' })]} />);
    const items = container.querySelectorAll('li');
    expect(items[3]!.getAttribute('style') ?? '').toMatch(/opacity: 0/);
  });

  it('reduced motion: new items have no transform offset', () => {
    const { container, rerender } = render(
      <MotionConfig reducedMotion="always">
        <ArtifactList artifacts={sampleArtifacts} />
      </MotionConfig>,
    );
    rerender(
      <MotionConfig reducedMotion="always">
        <ArtifactList artifacts={[...sampleArtifacts, art({ id: 'a-new', title: 'new.txt' })]} />
      </MotionConfig>,
    );
    const style = container.querySelectorAll('li')[3]!.getAttribute('style') ?? '';
    expect(style).not.toMatch(/translateY\(4px\)/);
  });
});

const file = (patch: Partial<FilePreviewView> = {}): FilePreviewView => ({
  id: 'f-1',
  name: 'classify.py',
  path: 'src/classify.py',
  kind: 'code',
  language: 'python',
  size: 120,
  status: 'ready',
  content: 'import os\nprint(1)\n',
  ...patch,
});

describe('FilePreview', () => {
  it('header, numbered lines in a focusable region; raw tab with arrow keys', async () => {
    const user = userEvent.setup();
    render(<FilePreview file={file({ external: true, version: '7' })} />);
    const section = screen.getByRole('region', { name: 'classify.py' });
    const crumbs = within(section).getByRole('navigation', { name: 'classify.py 的路径' });
    expect(within(crumbs).getAllByRole('listitem').map((li) => li.textContent)).toEqual(['src', 'classify.py']);
    expect(crumbs).toHaveAttribute('title', 'src/classify.py');
    expect(section).toHaveTextContent('外部');
    expect(section).toHaveTextContent('版本 7');
    const content = screen.getByRole('region', { name: 'classify.py 内容' });
    expect(content).toHaveAttribute('tabindex', '0');
    expect(content.querySelectorAll('.rl-agent-file__ln')).toHaveLength(2);
    const tabs = screen.getAllByRole('tab');
    expect(tabs.map((t) => t.textContent)).toEqual(['预览', '原始', '元数据']);
    await user.click(tabs[0]!);
    await user.keyboard('{ArrowRight}{Enter}');
    expect(screen.getByRole('tab', { name: '原始' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tabpanel').querySelector('.rl-agent-file__ln')).toBeNull();
    await user.keyboard('{ArrowRight}{Enter}');
    expect(screen.getByRole('tabpanel')).toHaveTextContent('python');
  });

  it('controlled mode', async () => {
    const user = userEvent.setup();
    const onModeChange = vi.fn();
    render(<FilePreview file={file()} mode="metadata" onModeChange={onModeChange} />);
    expect(screen.getByRole('tab', { name: '元数据' })).toHaveAttribute('aria-selected', 'true');
    await user.click(screen.getByRole('tab', { name: '预览' }));
    expect(onModeChange).toHaveBeenCalledWith('preview');
    expect(screen.getByRole('tab', { name: '元数据' })).toHaveAttribute('aria-selected', 'true');
  });

  it('image with alt and zoom buttons', async () => {
    const user = userEvent.setup();
    render(<FilePreview file={file({ kind: 'image', name: 'reef.svg', content: 'data:image/svg+xml,<svg/>', alt: '示例图' })} />);
    expect(screen.queryByRole('tab', { name: '原始' })).toBeNull();
    const img = screen.getByRole('img', { name: '示例图' });
    await user.click(screen.getByRole('button', { name: '200%' }));
    expect(screen.getByRole('button', { name: '200%' })).toHaveAttribute('aria-pressed', 'true');
    expect(img).toHaveAttribute('data-zoom', '200');
  });

  it('binary / unknown: unsupported text + open externally', async () => {
    const user = userEvent.setup();
    const onOpenExternal = vi.fn();
    render(<FilePreview file={file({ kind: 'binary', content: undefined })} onOpenExternal={onOpenExternal} />);
    expect(screen.getByText('无法预览此类型')).toBeInTheDocument();
    const buttons = screen.getAllByRole('button', { name: '在外部打开' });
    await user.click(buttons[buttons.length - 1]!);
    expect(onOpenExternal).toHaveBeenCalled();
  });

  it('loading / error / missing / changed / partial', async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    const onReload = vi.fn();
    const onLoadMore = vi.fn();
    const { rerender, container } = render(<FilePreview file={file({ status: 'loading', content: undefined })} />);
    expect(container.querySelector('[aria-busy="true"]')).toHaveTextContent('正在加载文件');
    rerender(<FilePreview file={file({ status: 'error', reason: '权限不足' })} onRetry={onRetry} />);
    expect(screen.getByText('文件加载失败')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '重试' }));
    expect(onRetry).toHaveBeenCalled();
    rerender(<FilePreview file={file({ status: 'missing' })} />);
    expect(screen.getByText('文件不存在')).toBeInTheDocument();
    rerender(<FilePreview file={file({ status: 'changed' })} onReload={onReload} />);
    expect(screen.getByText('文件已更新')).toBeInTheDocument();
    expect(screen.getByText('print(1)')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '重新加载' }));
    expect(onReload).toHaveBeenCalled();
    rerender(<FilePreview file={file({ status: 'large-file', partial: { loadedBytes: 1024, totalBytes: 4096 } })} onLoadMore={onLoadMore} />);
    expect(screen.getByText('已加载 1 KB / 4 KB')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '加载更多' }));
    expect(onLoadMore).toHaveBeenCalled();
  });

  it('copy writes the content and shows copied state; reference and close', async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
    const onReference = vi.fn();
    const onClose = vi.fn();
    render(<FilePreview file={file()} onReference={onReference} onClose={onClose} />);
    await user.click(screen.getByRole('button', { name: '复制内容' }));
    expect(writeText).toHaveBeenCalledWith('import os\nprint(1)\n');
    expect(await screen.findByRole('button', { name: '已复制' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '在对话中引用' }));
    expect(onReference).toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: '关闭预览' }));
    expect(onClose).toHaveBeenCalled();
  });
});

describe('ActivityLedger', () => {
  it('orders by sequence and dedupes', () => {
    const shuffled = [sampleLedger[2]!, sampleLedger[0]!, sampleLedger[1]!, sampleLedger[0]!];
    expect(orderLedger(shuffled).map((e) => e.id)).toEqual(['ev-1', 'ev-2', 'ev-3']);
  });

  it('rows: actor text, title, time element, outcome text', () => {
    render(<ActivityLedger events={sampleLedger} />);
    const rows = screen.getAllByRole('listitem');
    expect(rows).toHaveLength(6);
    expect(rows[2]).toHaveTextContent('工具');
    expect(rows[2]).toHaveTextContent('read_file · data/reef/manifest.csv');
    expect(rows[2]).toHaveTextContent('成功');
    expect(rows[2]!.querySelector('time')).toHaveAttribute('dateTime', sampleLedger[2]!.at);
  });

  it('filter tabs keep order and expose aria-selected', async () => {
    const user = userEvent.setup();
    const onFilterChange = vi.fn();
    render(<ActivityLedger events={sampleLedger} onFilterChange={onFilterChange} />);
    const tools = screen.getByRole('tab', { name: /工具/ });
    await user.click(tools);
    expect(tools).toHaveAttribute('aria-selected', 'true');
    expect(onFilterChange).toHaveBeenCalledWith('tool');
    const titles = screen.getAllByRole('listitem').map((li) => li.querySelector('.rl-agent-ledger__title')!.textContent);
    expect(titles).toEqual(['read_file · data/reef/manifest.csv', 'run_command · classify.py']);
    await user.keyboard('{ArrowRight}{Enter}');
    expect(screen.getByRole('tab', { name: /系统/ })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getAllByRole('listitem')).toHaveLength(1);
  });

  it('controlled filter, empty filtered, empty and loading', () => {
    const { rerender, container } = render(<ActivityLedger events={sampleLedger.filter((e) => e.actor !== 'user')} filter="user" />);
    expect(screen.getByText('该来源暂无事件')).toBeInTheDocument();
    rerender(<ActivityLedger events={[]} />);
    expect(screen.getByText('暂无事件')).toBeInTheDocument();
    rerender(<ActivityLedger events={[]} loading />);
    expect(container.querySelector('[aria-busy="true"]')).toHaveTextContent('正在加载事件');
  });

  it('onOpenEvent turns titles into buttons', async () => {
    const user = userEvent.setup();
    const onOpenEvent = vi.fn();
    render(<ActivityLedger events={sampleLedger} onOpenEvent={onOpenEvent} />);
    await user.click(screen.getByRole('button', { name: '查看事件：开始思考' }));
    expect(onOpenEvent).toHaveBeenCalledWith(expect.objectContaining({ id: 'ev-2' }));
  });

  it('only events arriving after mount animate', () => {
    const late: LedgerEventView = { id: 'ev-7', sequence: 7, actor: 'system', title: '运行完成', at: sampleLedger[5]!.at, outcome: 'success' };
    const { container, rerender } = render(<ActivityLedger events={sampleLedger} />);
    expect(container.querySelector('li')!.getAttribute('style') ?? '').not.toMatch(/opacity: 0/);
    rerender(<ActivityLedger events={[...sampleLedger, late]} />);
    const rows = container.querySelectorAll('li');
    expect(rows[6]!.getAttribute('style') ?? '').toMatch(/opacity: 0/);
  });
});

const run = (patch: Partial<RunSummaryView> = {}): RunSummaryView => ({
  id: 'r-1',
  status: 'completed',
  elapsedMs: 12_400,
  toolCount: 4,
  usage: { tokens: 15_500, completeness: 'exact' },
  artifacts: sampleArtifacts,
  persistence: 'saved',
  ...patch,
});

describe('RunSummary', () => {
  it('completed: status, metrics, artifacts with status', () => {
    render(<RunSummary run={run()} />);
    const section = screen.getByRole('region', { name: '本轮运行' });
    expect(within(section).getByRole('status')).toHaveTextContent('已完成');
    expect(section).toHaveTextContent('12.4s');
    expect(section).toHaveTextContent('4 次');
    expect(section).toHaveTextContent('15.5K');
    expect(within(section).getByRole('list')).toHaveTextContent('classification_results.csv已保存');
    expect(section).toHaveAttribute('data-tone', 'success');
  });

  it('run success and persistence are separate; failed save offers retry', async () => {
    const user = userEvent.setup();
    const onRetrySave = vi.fn();
    const { rerender } = render(<RunSummary run={run({ persistence: 'saving' })} />);
    expect(screen.getByRole('status')).toHaveTextContent('已完成');
    expect(screen.getByRole('status')).toHaveTextContent('结果保存中');
    rerender(<RunSummary run={run({ persistence: 'failed' })} onRetrySave={onRetrySave} />);
    expect(screen.getByRole('status')).toHaveTextContent('保存失败');
    await user.click(screen.getByRole('button', { name: '重试保存' }));
    expect(onRetrySave).toHaveBeenCalled();
  });

  it('partial, saving, failed, cancelled statuses; failed tools; side effects', () => {
    const { rerender } = render(<RunSummary run={run({ status: 'partial', usage: { tokens: 900, completeness: 'partial' } })} />);
    expect(screen.getByRole('status')).toHaveTextContent('部分完成');
    expect(screen.getByText('部分数据')).toBeInTheDocument();
    rerender(<RunSummary run={run({ status: 'saving', persistence: 'saving' })} />);
    expect(screen.getByRole('status').textContent).toBe('结果保存中');
    rerender(<RunSummary run={run({ status: 'failed', failedTools: 2 })} />);
    expect(screen.getByRole('status')).toHaveTextContent('失败');
    expect(screen.getByText('失败工具')).toBeInTheDocument();
    rerender(<RunSummary run={run({ status: 'cancelled', sideEffects: true })} />);
    expect(screen.getByRole('status')).toHaveTextContent('已停止');
    expect(screen.getByText('工具调用可能已改变外部状态，请核对')).toBeInTheDocument();
  });

  it('actions only with callbacks', async () => {
    const user = userEvent.setup();
    const onOpenTrace = vi.fn();
    const { rerender } = render(<RunSummary run={run()} />);
    expect(screen.queryByRole('button')).toBeNull();
    rerender(<RunSummary run={run()} onOpenTrace={onOpenTrace} onOpenDetails={vi.fn()} />);
    await user.click(screen.getByRole('button', { name: '查看过程' }));
    expect(onOpenTrace).toHaveBeenCalled();
    expect(screen.getByRole('button', { name: '查看详情' })).toBeInTheDocument();
  });
});

describe('CompactionNotice', () => {
  it('running: spark, label, elapsed, cancel', async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    const { container } = render(<CompactionNotice status="running" elapsedMs={3_200} onCancel={onCancel} />);
    expect(container.querySelector('.rl-agent-spark')).toHaveAttribute('data-phase', 'executing');
    expect(screen.getByRole('status')).toHaveTextContent('正在整理上下文');
    expect(screen.getByText('3.2s')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '取消' }));
    expect(onCancel).toHaveBeenCalled();
  });

  it('completed: token delta and summary disclosure', async () => {
    const user = userEvent.setup();
    render(<CompactionNotice status="completed" tokensBefore={32_000} tokensAfter={12_000} summary="保留了研究目标与数据范围。" />);
    expect(screen.getByRole('status')).toHaveTextContent('32K → 12K token');
    const toggle = screen.getByRole('button', { name: '整理摘要' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await user.click(toggle);
    expect(screen.getByText('保留了研究目标与数据范围。')).toBeInTheDocument();
  });

  it('failed hint, cancelled, save-pending retry', async () => {
    const user = userEvent.setup();
    const onRetrySave = vi.fn();
    const { rerender, container } = render(<CompactionNotice status="failed" />);
    expect(screen.getByText('可输入 /compact 重试')).toBeInTheDocument();
    expect(container.querySelector('.rl-agent-spark')).toBeNull();
    rerender(<CompactionNotice status="cancelled" />);
    expect(screen.getByRole('status')).toHaveTextContent('已取消整理上下文');
    rerender(<CompactionNotice status="save-pending" onRetrySave={onRetrySave} />);
    await user.click(screen.getByRole('button', { name: '重试保存' }));
    expect(onRetrySave).toHaveBeenCalled();
  });

  it('no buttons without callbacks', () => {
    render(<CompactionNotice status="running" />);
    expect(screen.queryByRole('button')).toBeNull();
  });
});

