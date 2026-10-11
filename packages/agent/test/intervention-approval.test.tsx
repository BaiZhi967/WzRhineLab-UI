import * as React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { AgentActionContext, ApprovalScope, ApprovalStatus, ApprovalView, FileDiffView } from '@wzrhine/agent-core';
import { AgentMessagesProvider, agentEnUS, ApprovalPanel } from '../src/index';
import { sampleApproval } from '../src/fixtures/session';

const diff: FileDiffView = {
  path: 'src/config.py',
  change: 'update',
  hunks: [
    {
      id: 'h1',
      header: '@@ -12,1 +12,2 @@',
      lines: [
        { kind: 'remove', text: 'debug = true', oldLine: 12 },
        { kind: 'add', text: 'debug = false', newLine: 12 },
        { kind: 'add', text: 'log_level = "info"', newLine: 13 },
      ],
    },
  ],
};

const make = (patch: Partial<ApprovalView> = {}): ApprovalView => ({ ...sampleApproval, diff, ...patch });

const allow = () => screen.getByRole('button', { name: '允许一次' });
const reject = () => screen.getByRole('button', { name: '拒绝' });

describe('ApprovalPanel', () => {
  it('is a labelled section with operation id, tool, reason, risk text, subject, summary and scope', () => {
    render(<ApprovalPanel approval={make()} onApprove={() => {}} onReject={() => {}} />);
    const region = screen.getByRole('region', { name: /编辑文件.*修改代码文件/ });
    expect(region).toHaveAttribute('data-status', 'waiting');
    expect(within(region).getByText('OPERATION / #op-3')).toBeInTheDocument();
    expect(within(region).getByText('中风险')).toBeInTheDocument();
    expect(within(region).getByText('等待批准')).toBeInTheDocument();
    expect(within(region).getAllByText('src/config.py').length).toBeGreaterThan(0);
    expect(within(region).getByText(sampleApproval.summary)).toBeInTheDocument();
    expect(within(region).getByText('1 个文件 · 工作区内')).toBeInTheDocument();
    expect(within(region).getByText('拒绝会作为真实工具错误交回模型。')).toBeInTheDocument();
  });

  it('renders the internal diff with sign text, line numbers and sr words; renderMaterial replaces it', () => {
    const { rerender } = render(<ApprovalPanel approval={make()} onReject={() => {}} />);
    const figure = screen.getByRole('figure', { name: /src\/config\.py/ });
    const rows = within(figure).getAllByRole('listitem');
    expect(rows).toHaveLength(3);
    expect(rows[0]).toHaveAttribute('data-kind', 'remove');
    expect(rows[0]).toHaveTextContent('12−删除 debug = true');
    expect(rows[1]).toHaveTextContent('+新增 debug = false');
    rerender(<ApprovalPanel approval={make()} onReject={() => {}} renderMaterial={(a) => <p>custom {a.operationId}</p>} />);
    expect(screen.queryByRole('figure')).toBeNull();
    expect(screen.getByText('custom op-3')).toBeInTheDocument();
  });

  it('allow emits scope + context with targetId, baseRevision and a per-mount actionId', async () => {
    const user = userEvent.setup();
    const onApprove = vi.fn<(scope: ApprovalScope, ctx: AgentActionContext) => void>();
    render(<ApprovalPanel approval={make()} onApprove={onApprove} onReject={() => {}} />);
    await user.click(allow());
    expect(onApprove).toHaveBeenCalledTimes(1);
    const [scope, ctx] = onApprove.mock.calls[0]!;
    expect(scope).toBe('once');
    expect(ctx).toMatchObject({ targetId: 'op-3', baseRevision: '7' });
    expect(ctx.actionId).toMatch(/-1$/);
  });

  it('availability false: allow disabled with visible reason via aria-describedby, reject enabled', async () => {
    const user = userEvent.setup();
    const onReject = vi.fn();
    render(<ApprovalPanel approval={make({ availability: { allowed: false, reason: '材料版本已变化（示例）' } })} onApprove={() => {}} onReject={onReject} />);
    expect(allow()).toBeDisabled();
    expect(allow()).toHaveAccessibleDescription('材料版本已变化（示例）');
    expect(screen.getByText('材料版本已变化（示例）')).toBeVisible();
    expect(reject()).toBeEnabled();
    await user.click(reject());
    expect(onReject).toHaveBeenCalledWith(expect.objectContaining({ targetId: 'op-3', baseRevision: '7' }));
  });

  it('session scope only when offered and onApprove exists; no callback → no button', async () => {
    const user = userEvent.setup();
    const onApprove = vi.fn();
    const { rerender } = render(<ApprovalPanel approval={make({ scopes: ['once'] })} onApprove={onApprove} onReject={() => {}} />);
    expect(screen.queryByRole('button', { name: '本次会话信任此任务' })).toBeNull();
    rerender(<ApprovalPanel approval={make()} onApprove={onApprove} onReject={() => {}} />);
    await user.click(screen.getByRole('button', { name: '本次会话信任此任务' }));
    expect(onApprove.mock.calls[0]![0]).toBe('session');
    rerender(<ApprovalPanel approval={make({ revision: '8' })} />);
    expect(screen.queryAllByRole('button')).toHaveLength(0);
  });

  it('double click sends one decision; the lock lifts when the view changes', async () => {
    const user = userEvent.setup();
    const onApprove = vi.fn();
    const { rerender } = render(<ApprovalPanel approval={make()} onApprove={onApprove} onReject={() => {}} />);
    await user.dblClick(allow());
    await user.click(allow());
    expect(onApprove).toHaveBeenCalledTimes(1);
    rerender(<ApprovalPanel approval={make({ revision: '8' })} onApprove={onApprove} onReject={() => {}} />);
    await user.click(allow());
    expect(onApprove).toHaveBeenCalledTimes(2);
    expect(onApprove.mock.calls[1]![1].actionId).not.toBe(onApprove.mock.calls[0]![1].actionId);
  });

  it('a pending promise keeps buttons busy; a rejected result releases the lock', async () => {
    const user = userEvent.setup();
    let resolve!: (v: { status: 'rejected'; reason: string }) => void;
    const onApprove = vi.fn(() => new Promise<{ status: 'rejected'; reason: string }>((r) => (resolve = r)));
    render(<ApprovalPanel approval={make()} onApprove={onApprove} onReject={() => {}} />);
    await user.click(allow());
    expect(allow()).toHaveAttribute('aria-busy', 'true');
    await user.click(allow());
    expect(onApprove).toHaveBeenCalledTimes(1);
    resolve({ status: 'rejected', reason: 'stale' });
    await screen.findByRole('button', { name: '允许一次' });
    await vi.waitFor(() => expect(allow()).not.toHaveAttribute('aria-busy'));
    await user.click(allow());
    expect(onApprove).toHaveBeenCalledTimes(2);
  });

  it('material-loading: loading text + skeleton, allow disabled, reject enabled', () => {
    render(<ApprovalPanel approval={make({ status: 'material-loading' })} onApprove={() => {}} onReject={() => {}} />);
    expect(screen.getByText('正在读取完整审批内容…')).toBeInTheDocument();
    expect(screen.getByText('正在读取完整审批内容…').parentElement).toHaveAttribute('aria-busy', 'true');
    expect(allow()).toBeDisabled();
    expect(allow()).toHaveAccessibleDescription('完整审批内容读取完成后才能允许。');
    expect(reject()).toBeEnabled();
  });

  it('unavailable: notice + retry material button; reject still enabled', async () => {
    const user = userEvent.setup();
    const onRetryMaterial = vi.fn();
    render(<ApprovalPanel approval={make({ status: 'unavailable', availability: { allowed: false } })} onApprove={() => {}} onReject={() => {}} onRetryMaterial={onRetryMaterial} />);
    expect(screen.getByText('完整审批内容暂不可用')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '重新读取审批内容' }));
    expect(onRetryMaterial).toHaveBeenCalled();
    expect(allow()).toBeDisabled();
    expect(reject()).toBeEnabled();
  });

  it('submitting: buttons busy, nothing re-sent', async () => {
    const user = userEvent.setup();
    const onReject = vi.fn();
    render(<ApprovalPanel approval={make({ status: 'submitting' })} onApprove={() => {}} onReject={onReject} />);
    expect(reject()).toBeDisabled();
    expect(allow()).toBeDisabled();
    await user.click(reject());
    expect(onReject).not.toHaveBeenCalled();
  });

  it('unknown: warning + retry sends the SAME handler, scope and actionId', async () => {
    const user = userEvent.setup();
    const onApprove = vi.fn();
    const { rerender } = render(<ApprovalPanel approval={make()} onApprove={onApprove} onReject={() => {}} />);
    await user.click(screen.getByRole('button', { name: '本次会话信任此任务' }));
    rerender(<ApprovalPanel approval={make({ status: 'unknown', receipt: { status: 'unknown', retryable: true } })} onApprove={onApprove} onReject={() => {}} />);
    expect(screen.getByRole('region')).toHaveTextContent('结果待确认');
    expect(screen.queryByRole('button', { name: '允许一次' })).toBeNull();
    await user.click(screen.getByRole('button', { name: '重试提交' }));
    expect(onApprove).toHaveBeenCalledTimes(2);
    expect(onApprove.mock.calls[1]).toEqual(onApprove.mock.calls[0]);
    // Still locked until the view changes.
    await user.click(screen.getByRole('button', { name: '重试提交' }));
    expect(onApprove).toHaveBeenCalledTimes(2);
  });

  it('unknown not retryable: no retry button', async () => {
    const user = userEvent.setup();
    const onApprove = vi.fn();
    const { rerender } = render(<ApprovalPanel approval={make()} onApprove={onApprove} onReject={() => {}} />);
    await user.click(allow());
    rerender(<ApprovalPanel approval={make({ status: 'unknown', receipt: { status: 'unknown', retryable: false } })} onApprove={onApprove} onReject={() => {}} />);
    expect(screen.queryByRole('button', { name: '重试提交' })).toBeNull();
    expect(screen.getByText(/重试不安全/)).toBeInTheDocument();
  });

  it.each<[ApprovalStatus, string]>([
    ['approved', '已允许此操作'],
    ['rejected', '已拒绝，结果已作为工具错误交回模型'],
    ['expired', '授权已过期'],
  ])('%s is a static receipt without decision buttons', (status, text) => {
    render(<ApprovalPanel approval={make({ status })} onApprove={() => {}} onReject={() => {}} />);
    expect(screen.getAllByText(text).length).toBeGreaterThan(0);
    expect(screen.queryByRole('button', { name: '拒绝' })).toBeNull();
    expect(screen.queryByRole('button', { name: '允许一次' })).toBeNull();
  });

  it('expired offers only onRefresh', async () => {
    const user = userEvent.setup();
    const onRefresh = vi.fn();
    render(<ApprovalPanel approval={make({ status: 'expired' })} onApprove={() => {}} onReject={() => {}} onRefresh={onRefresh} />);
    expect(screen.getAllByRole('button')).toHaveLength(1);
    await user.click(screen.getByRole('button', { name: '刷新审批状态' }));
    expect(onRefresh).toHaveBeenCalled();
  });

  it('irreversible, unsandboxed and JSON evidence; long evidence goes behind a Collapsible', async () => {
    const user = userEvent.setup();
    const json = JSON.stringify({ type: 'dataset', id: 'sp-001', fields: Array.from({ length: 12 }, (_, i) => `f${i}`) }, null, 2);
    render(
      <ApprovalPanel
        approval={make({
          risk: 'high',
          irreversible: '删除后不能自动恢复',
          unsandboxed: true,
          evidence: [{ id: 'a', label: '参数', value: json, format: 'json' }],
        })}
        onReject={() => {}}
      />,
    );
    expect(screen.getByText('高风险')).toBeInTheDocument();
    expect(screen.getAllByRole('note')).toHaveLength(2);
    expect(screen.getByText('删除后不能自动恢复')).toBeInTheDocument();
    expect(screen.getByText('不在沙箱中运行')).toBeInTheDocument();
    const trigger = screen.getByRole('button', { name: '查看审批依据（1 项）' });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await user.click(trigger);
    expect(screen.getByText(/"id": "sp-001"/).closest('pre')).toBeInTheDocument();
  });

  it('short evidence is shown inline as a definition list', () => {
    render(<ApprovalPanel approval={make()} onReject={() => {}} />);
    expect(screen.getByText('目标文件').tagName).toBe('DT');
    expect(screen.getByText('v7').tagName).toBe('DD');
  });

  it('never steals focus; autoFocus focuses the heading once', () => {
    const { unmount } = render(<ApprovalPanel approval={make()} onReject={() => {}} />);
    expect(document.body).toHaveFocus();
    unmount();
    render(<ApprovalPanel approval={make()} onReject={() => {}} autoFocus />);
    expect(screen.getByRole('heading', { level: 3 })).toHaveFocus();
  });

  it('two instances get distinct ids and action ids', async () => {
    const user = userEvent.setup();
    const a = vi.fn();
    const b = vi.fn();
    render(
      <>
        <ApprovalPanel approval={make({ availability: { allowed: false } })} onApprove={a} onReject={a} />
        <ApprovalPanel approval={make({ operationId: 'op-9' })} onApprove={b} onReject={b} />
      </>,
    );
    const regions = screen.getAllByRole('region');
    expect(regions[0]!.getAttribute('aria-labelledby')).not.toBe(regions[1]!.getAttribute('aria-labelledby'));
    await user.click(within(regions[0]!).getByRole('button', { name: '拒绝' }));
    await user.click(within(regions[1]!).getByRole('button', { name: '拒绝' }));
    expect(a.mock.calls[0]![0].actionId).not.toBe(b.mock.calls[0]![0].actionId);
  });

  it('uses the English table from AgentMessagesProvider', () => {
    render(
      <AgentMessagesProvider messages={agentEnUS}>
        <ApprovalPanel approval={make()} onApprove={() => {}} onReject={() => {}} />
      </AgentMessagesProvider>,
    );
    expect(screen.getByRole('button', { name: 'Allow once' })).toBeInTheDocument();
    expect(screen.getByText('Medium risk')).toBeInTheDocument();
  });
});
