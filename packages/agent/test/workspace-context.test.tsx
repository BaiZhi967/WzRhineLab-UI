import * as React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MotionConfig } from 'motion/react';
import { RhineProvider } from '@wzrhine/react';
import { describe, expect, it, vi } from 'vitest';
import type { ContextUsageView, PinnedSummaryView, SubagentView } from '@wzrhine/agent-core';
import { SubAgentCard, SubAgentList, subagentSparkPhase } from '../src/components/workspace/SubAgentCard';
import { ContextUsage } from '../src/components/workspace/ContextUsage';
import { PinnedSummary } from '../src/components/workspace/PinnedSummary';
import { sampleContextUsage, samplePinnedSummary, sampleSubagents } from '../src/fixtures/session';

describe('SubAgentCard & SubAgentList', () => {
  it('renders identity, parent, task, status with elapsed and partial usage label', () => {
    render(<SubAgentCard agent={sampleSubagents[1]!} />);
    const card = screen.getByRole('article', { name: '测试分析' });
    expect(within(card).getByRole('heading', { level: 3, name: '测试分析' })).toBeInTheDocument();
    expect(card).toHaveTextContent('父任务 #2');
    expect(card).toHaveTextContent('运行数据分析脚本');
    expect(card).toHaveTextContent('执行工具');
    expect(card).toHaveTextContent('32.1s');
    expect(card).toHaveTextContent('4.2K token');
    expect(card).toHaveTextContent('部分用量');
    expect(card.querySelector('[role="progressbar"], [role="meter"], progress')).toBeNull();
  });

  it('spark only while active; executing phase maps to executing rhythm', () => {
    expect(subagentSparkPhase({ status: 'running', phase: 'executing-tool' })).toBe('executing');
    expect(subagentSparkPhase({ status: 'running', phase: 'thinking' })).toBe('thinking');
    expect(subagentSparkPhase({ status: 'completed' })).toBeUndefined();
    const { container, rerender } = render(<SubAgentCard agent={sampleSubagents[1]!} />);
    expect(container.querySelector('.rl-agent-spark')).toHaveAttribute('data-phase', 'executing');
    rerender(<SubAgentCard agent={{ ...sampleSubagents[1]!, status: 'completed' }} />);
    expect(container.querySelector('.rl-agent-spark')).toBeNull();
  });

  it('needs-attention: warning frame + sentence + pending badge', () => {
    render(<SubAgentCard agent={sampleSubagents[3]!} />);
    const card = screen.getByRole('article', { name: '报告校对' });
    expect(card).toHaveAttribute('data-attention', 'true');
    expect(card).toHaveTextContent('子任务需要你处理后才能继续');
    expect(card).toHaveTextContent('1 项待回答');
    expect(card).toHaveTextContent('需要你处理');
  });

  it('open button only with onOpen, passes the id', async () => {
    const user = userEvent.setup();
    const onOpen = vi.fn();
    const { rerender } = render(<SubAgentCard agent={sampleSubagents[0]!} />);
    expect(screen.queryByRole('button')).toBeNull();
    rerender(<SubAgentCard agent={sampleSubagents[0]!} onOpen={onOpen} />);
    await user.click(screen.getByRole('button', { name: '查看子任务：文件核查' }));
    expect(onOpen).toHaveBeenCalledWith('s-1');
  });

  it('unknown usage never shows a number', () => {
    const agent: SubagentView = { ...sampleSubagents[0]!, usage: { tokens: 900, completeness: 'unknown' } };
    render(<SubAgentCard agent={agent} />);
    expect(screen.getByText('用量未知')).toBeInTheDocument();
    expect(screen.queryByText(/900/)).toBeNull();
  });

  it('list: Tab moves through each card open button; headings per card; dedupe', async () => {
    const user = userEvent.setup();
    render(<SubAgentList agents={[...sampleSubagents, sampleSubagents[0]!]} onOpen={vi.fn()} title="子任务" />);
    expect(screen.getByRole('heading', { level: 2, name: '子任务' })).toBeInTheDocument();
    expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(4);
    expect(screen.getAllByRole('listitem')).toHaveLength(4);
    await user.tab();
    expect(screen.getByRole('button', { name: '查看子任务：文件核查' })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('button', { name: '查看子任务：测试分析' })).toHaveFocus();
  });

  it('reduced motion: spark loop never runs', () => {
    const { container } = render(
      <MotionConfig reducedMotion="always">
        <RhineProvider motion="reduce">
          <SubAgentCard agent={sampleSubagents[1]!} />
        </RhineProvider>
      </MotionConfig>,
    );
    expect(container.querySelector('.rl-agent-spark')).not.toHaveAttribute('data-loop', 'running');
  });
});

const usage = (patch: Partial<ContextUsageView> = {}): ContextUsageView => ({ ...sampleContextUsage, ...patch });

describe('ContextUsage', () => {
  it('full: meter with value/max, completeness tag and legend', () => {
    render(<ContextUsage usage={sampleContextUsage} />);
    const meter = screen.getByRole('meter');
    expect(meter).toHaveAttribute('aria-valuenow', '12400');
    expect(meter).toHaveAttribute('aria-valuemax', '32000');
    expect(meter.getAttribute('aria-valuetext')).toContain('39%');
    expect(meter.getAttribute('aria-valuetext')).toContain('估计值');
    expect(screen.getByText('12.4K / 32K · 39%')).toBeInTheDocument();
    const legend = screen.getByRole('list', { name: '构成' });
    expect(within(legend).getAllByRole('listitem')).toHaveLength(3);
    expect(legend).toHaveTextContent('消息6.8K');
  });

  it('unknown max: no meter, no percentage, explicit text', () => {
    render(<ContextUsage usage={usage({ max: undefined })} />);
    expect(screen.queryByRole('meter')).toBeNull();
    expect(document.body.textContent).not.toMatch(/%/);
    expect(screen.getByText('上限未知，不显示百分比')).toBeInTheDocument();
  });

  it('partial data: no percentage, labelled 部分数据', () => {
    render(<ContextUsage usage={usage({ completeness: 'partial' })} />);
    expect(screen.queryByRole('meter')).toBeNull();
    expect(screen.getByText('部分数据')).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/%/);
  });

  it('unknown completeness: no number at all', () => {
    render(<ContextUsage usage={usage({ completeness: 'unknown' })} variant="bar" />);
    expect(screen.getByText('用量未知')).toBeInTheDocument();
    expect(screen.queryByText(/12\.4K/)).toBeNull();
  });

  it('near and over limit add warning text', () => {
    const { rerender } = render(<ContextUsage usage={usage({ used: 28_000, completeness: 'exact' })} />);
    expect(screen.getByText('接近上限')).toBeInTheDocument();
    rerender(<ContextUsage usage={usage({ used: 36_000, completeness: 'exact' })} />);
    expect(screen.getByText('已超过上限')).toBeInTheDocument();
    expect(screen.getByRole('meter')).toHaveAttribute('aria-valuenow', '32000');
  });

  it('ring: named trigger opens a popover dialog with the full view (keyboard)', async () => {
    const user = userEvent.setup();
    render(
      <RhineProvider>
        <ContextUsage usage={sampleContextUsage} variant="ring" />
      </RhineProvider>,
    );
    const trigger = screen.getByRole('button', { name: /上下文用量 12\.4K \/ 32K/ });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    trigger.focus();
    await user.keyboard('{Enter}');
    const dialog = await screen.findByRole('dialog', { name: '上下文用量' });
    expect(within(dialog).getByRole('meter')).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  it('ring with unknown max draws a dashed ring without an arc', () => {
    const { container } = render(<ContextUsage usage={usage({ max: undefined })} variant="ring" />);
    const ring = container.querySelector('.rl-agent-context__ring')!;
    expect(ring).toHaveAttribute('data-unknown', 'true');
    expect(container.querySelector('.rl-agent-context__ring-arc')).toBeNull();
  });

  it('note text', () => {
    render(<ContextUsage usage={usage({ note: '模型配置已变化，等待重新估计' })} />);
    expect(screen.getByText('模型配置已变化，等待重新估计')).toBeInTheDocument();
  });
});

const summary = (patch: Partial<PinnedSummaryView> = {}): PinnedSummaryView => ({ ...samplePinnedSummary, ...patch });

describe('PinnedSummary', () => {
  it('renders title, body, tags, sources and time; collapse is a real disclosure', async () => {
    const user = userEvent.setup();
    render(<PinnedSummary summary={summary()} onOpenSource={vi.fn()} />);
    const region = screen.getByRole('region', { name: '固定摘要' });
    expect(region).toHaveTextContent('对水下图像中的珊瑚类型分类');
    expect(screen.getByRole('list', { name: '标签' })).toHaveTextContent('marine-biology');
    expect(region.querySelector('time')).toHaveAttribute('dateTime', samplePinnedSummary.updatedAt);
    const toggle = screen.getByRole('button', { name: '摘要内容' });
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText(/珊瑚类型分类/)).toBeNull();
  });

  it('controlled expanded', async () => {
    const user = userEvent.setup();
    const onExpandedChange = vi.fn();
    render(<PinnedSummary summary={summary()} expanded={false} onExpandedChange={onExpandedChange} />);
    await user.click(screen.getByRole('button', { name: '摘要内容' }));
    expect(onExpandedChange).toHaveBeenCalledWith(true);
    expect(screen.getByRole('button', { name: '摘要内容' })).toHaveAttribute('aria-expanded', 'false');
  });

  it('sources open; unavailable ones disabled with reason', async () => {
    const user = userEvent.setup();
    const onOpenSource = vi.fn();
    render(
      <PinnedSummary
        summary={summary({ sources: [...samplePinnedSummary.sources!, { id: 'x', index: 2, title: '旧报告', sourceType: 'file', unavailable: true, reason: '文件已不存在' }] })}
        onOpenSource={onOpenSource}
      />,
    );
    await user.click(screen.getByRole('button', { name: '打开来源 manifest.csv' }));
    expect(onOpenSource).toHaveBeenCalledWith(expect.objectContaining({ id: 'ci-1' }));
    const gone = screen.getByRole('button', { name: '打开来源 旧报告' });
    expect(gone).toBeDisabled();
    expect(gone).toHaveAccessibleDescription('文件已不存在');
  });

  it('pin toggle only with onPinChange, aria-pressed', async () => {
    const user = userEvent.setup();
    const onPinChange = vi.fn();
    const { rerender } = render(<PinnedSummary summary={summary()} />);
    expect(screen.queryByRole('button', { name: '固定摘要' })).toBeNull();
    rerender(<PinnedSummary summary={summary()} pinned onPinChange={onPinChange} />);
    const pin = screen.getByRole('button', { name: '固定摘要' });
    expect(pin).toHaveAttribute('aria-pressed', 'true');
    await user.click(pin);
    expect(onPinChange).toHaveBeenCalledWith(false);
  });

  it('updating / stale / missing states', () => {
    const { rerender } = render(<PinnedSummary summary={summary({ status: 'updating' })} />);
    expect(screen.getByRole('status')).toHaveTextContent('正在更新');
    rerender(<PinnedSummary summary={summary({ status: 'stale' })} />);
    expect(screen.getByRole('status')).toHaveTextContent('摘要可能已过期');
    rerender(<PinnedSummary summary={summary({ status: 'missing', body: '' })} />);
    expect(screen.getByText('暂无摘要')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '摘要内容' })).toBeNull();
  });

  it('body updates keep the same element (no remount / entrance replay)', () => {
    const { rerender, container } = render(<PinnedSummary summary={summary()} />);
    const section = container.querySelector('.rl-agent-summary');
    rerender(<PinnedSummary summary={summary({ body: '更新后的摘要' })} />);
    expect(container.querySelector('.rl-agent-summary')).toBe(section);
    expect(screen.getByText('更新后的摘要')).toBeInTheDocument();
  });

  it('renderMarkdown is used for the body', () => {
    render(<PinnedSummary summary={summary()} renderMarkdown={(s) => <div data-testid="md">{s.length}</div>} />);
    expect(screen.getByTestId('md')).toBeInTheDocument();
  });
});
