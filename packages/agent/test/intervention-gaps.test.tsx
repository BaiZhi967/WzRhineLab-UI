import * as React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MotionConfig } from 'motion/react';
import { describe, expect, it, vi } from 'vitest';
import { RhineProvider } from '@wzrhine/react';
import type { AgentActionContext, AgentActionResult, GrantView, QuestionnaireView } from '@wzrhine/agent-core';
import { AgentMessagesProvider, agentEnUS, GrantList, QuestionnaireCard } from '../src/index';
import { sampleQuestionnaire } from '../src/fixtures/session';

const grants: GrantView[] = [
  { id: 'g-1', target: 'npm test', detail: '工作区根目录（示例）', scopeLabel: '本次会话', available: true },
  { id: 'g-2', target: 'D:/data/samples', detail: '额外读写（示例）', scopeLabel: '额外读写', available: false, reason: '目录已被移除（示例）' },
];

type RevokeFn = (grant: GrantView, ctx: AgentActionContext) => AgentActionResult | void | Promise<AgentActionResult | void>;

describe('GrantList', () => {
  it('is a labelled section with a list; each row shows target mono, detail, scope and availability', () => {
    render(<GrantList grants={grants} />);
    const region = screen.getByRole('region', { name: '会话授权' });
    const rows = within(region).getAllByRole('listitem');
    expect(rows).toHaveLength(2);
    expect(within(rows[0]!).getByText('npm test').tagName).toBe('CODE');
    expect(within(rows[0]!).getByText('工作区根目录（示例）')).toBeInTheDocument();
    expect(rows[0]).toHaveTextContent('范围： 本次会话');
    expect(rows[0]).toHaveAttribute('data-available');
    expect(rows[1]).not.toHaveAttribute('data-available');
    expect(rows[1]).toHaveTextContent('不可用： 目录已被移除（示例）');
    expect(within(region).getByText('2 项')).toBeInTheDocument();
  });

  it('renders no buttons without callbacks (capability gating)', () => {
    render(<GrantList grants={grants} />);
    expect(screen.queryAllByRole('button')).toHaveLength(0);
  });

  it('revoke emits the grant and a per-mount context; the button is named after its target', async () => {
    const user = userEvent.setup();
    const onRevoke = vi.fn<RevokeFn>();
    render(<GrantList grants={grants} onRevoke={onRevoke} />);
    const button = screen.getByRole('button', { name: '撤销 npm test' });
    expect(button).toHaveTextContent('撤销');
    expect(button).toHaveAccessibleDescription('工作区根目录（示例）');
    await user.click(button);
    expect(onRevoke).toHaveBeenCalledTimes(1);
    const [grant, ctx] = onRevoke.mock.calls[0]!;
    expect(grant.id).toBe('g-1');
    expect(ctx.targetId).toBe('g-1');
    expect(ctx.actionId).toMatch(/^[\w-]+-1$/);
    // The lock holds until the receipt changes: a second click does not send again.
    await user.click(button);
    expect(onRevoke).toHaveBeenCalledTimes(1);
  });

  it('a pending promise shows busy; rejected results release the lock', async () => {
    const user = userEvent.setup();
    let resolve!: (r: AgentActionResult) => void;
    const onRevoke = vi.fn<RevokeFn>(() => new Promise<AgentActionResult>((r) => (resolve = r)));
    render(<GrantList grants={grants.slice(0, 1)} onRevoke={onRevoke} />);
    await user.click(screen.getByRole('button', { name: '撤销 npm test' }));
    const row = screen.getByRole('listitem');
    expect(row).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByRole('button', { name: '撤销 npm test' })).toHaveAttribute('aria-busy', 'true');
    resolve({ status: 'rejected', reason: '示例：拒绝' });
    await waitFor(() => expect(row).not.toHaveAttribute('aria-busy'));
    await user.click(screen.getByRole('button', { name: '撤销 npm test' }));
    expect(onRevoke).toHaveBeenCalledTimes(2);
    expect(onRevoke.mock.calls[1]![1].actionId).not.toBe(onRevoke.mock.calls[0]![1].actionId);
  });

  it('receipt submitting = busy row; unknown = 结果待确认 + retry with the same action id', async () => {
    const user = userEvent.setup();
    const onRevoke = vi.fn<RevokeFn>();
    const { rerender } = render(<GrantList grants={grants.slice(0, 1)} onRevoke={onRevoke} />);
    await user.click(screen.getByRole('button', { name: '撤销 npm test' }));
    const first = onRevoke.mock.calls[0]![1];

    rerender(<GrantList grants={[{ ...grants[0]!, receipt: { status: 'submitting', actionId: first.actionId } }]} onRevoke={onRevoke} />);
    expect(screen.getByRole('listitem')).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByRole('status')).toHaveTextContent('正在撤销 npm test…');

    rerender(<GrantList grants={[{ ...grants[0]!, receipt: { status: 'unknown', actionId: first.actionId, retryable: true } }]} onRevoke={onRevoke} />);
    expect(screen.getByText('结果待确认')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '撤销 npm test' })).toBeNull();
    expect(screen.getByRole('status')).toHaveTextContent('撤销 npm test 的结果待确认');
    await user.click(screen.getByRole('button', { name: '重试撤销 npm test' }));
    expect(onRevoke).toHaveBeenCalledTimes(2);
    expect(onRevoke.mock.calls[1]![1]).toEqual(first);
  });

  it('unknown after a remount retries with receipt.actionId; retryable=false offers no retry', async () => {
    const user = userEvent.setup();
    const onRevoke = vi.fn<RevokeFn>();
    const unknown = (retryable: boolean): GrantView => ({ ...grants[0]!, receipt: { status: 'unknown', actionId: 'act-from-host', retryable } });
    const { rerender } = render(<GrantList grants={[unknown(true)]} onRevoke={onRevoke} />);
    await user.click(screen.getByRole('button', { name: '重试撤销 npm test' }));
    expect(onRevoke.mock.calls[0]![1]).toEqual({ actionId: 'act-from-host', targetId: 'g-1' });
    rerender(<GrantList grants={[{ ...unknown(false), id: 'g-1b' }]} onRevoke={onRevoke} />);
    expect(screen.queryByRole('button', { name: /重试撤销/ })).toBeNull();
    expect(screen.getByText(/重试不安全/)).toBeInTheDocument();
  });

  it('accepted shows 已撤销 without buttons; rejected shows the reason and revoke again', () => {
    const { rerender } = render(<GrantList grants={[{ ...grants[0]!, receipt: { status: 'accepted' } }]} onRevoke={() => {}} />);
    expect(screen.getByText('已撤销')).toBeInTheDocument();
    expect(screen.queryByRole('button')).toBeNull();
    rerender(<GrantList grants={[{ ...grants[0]!, receipt: { status: 'rejected', reason: '示例：运行中不能撤销' } }]} onRevoke={() => {}} />);
    expect(screen.getByText('示例：运行中不能撤销')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '撤销 npm test' })).toBeEnabled();
  });

  it('unavailable rows offer 重新选择 only with onReselect', async () => {
    const user = userEvent.setup();
    const onReselect = vi.fn();
    render(<GrantList grants={grants} onReselect={onReselect} />);
    expect(screen.getAllByRole('button')).toHaveLength(1);
    await user.click(screen.getByRole('button', { name: '重新选择 D:/data/samples' }));
    expect(onReselect).toHaveBeenCalledWith(grants[1]);
  });

  it('loading, error + retry, empty, footer note and add slot', async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    const { rerender } = render(<GrantList grants={[]} loading />);
    expect(screen.getByRole('region')).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByText('正在读取授权…')).toBeInTheDocument();
    rerender(<GrantList grants={[]} error="示例：网络不可用" onRetry={onRetry} />);
    expect(screen.getByText('授权列表读取失败')).toBeInTheDocument();
    expect(screen.getByText('示例：网络不可用')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '重新读取' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
    rerender(<GrantList grants={[]} empty="示例：没有授权" footerNote="撤销后再次运行需要重新批准。" addSlot={<button type="button">添加目录</button>} title="临时授权" />);
    expect(screen.getByRole('region', { name: '临时授权' })).toBeInTheDocument();
    expect(screen.getByText('示例：没有授权')).toBeInTheDocument();
    expect(screen.getByText('撤销后再次运行需要重新批准。')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '添加目录' })).toBeInTheDocument();
    expect(screen.queryByRole('list')).toBeNull();
  });

  it('two lists never share action ids; enUS copy', async () => {
    const user = userEvent.setup();
    const a = vi.fn<RevokeFn>();
    const b = vi.fn<RevokeFn>();
    render(
      <AgentMessagesProvider messages={agentEnUS}>
        <GrantList grants={grants.slice(0, 1)} onRevoke={a} />
        <GrantList grants={grants.slice(0, 1)} onRevoke={b} />
      </AgentMessagesProvider>,
    );
    expect(screen.getAllByRole('region', { name: 'Session grants' })).toHaveLength(2);
    const [first, second] = screen.getAllByRole('button', { name: 'Revoke npm test' });
    await user.click(first!);
    await user.click(second!);
    expect(a.mock.calls[0]![1].actionId).not.toBe(b.mock.calls[0]![1].actionId);
  });
});

const ended = (patch: Partial<QuestionnaireView>): QuestionnaireView => ({
  ...sampleQuestionnaire,
  status: 'completed',
  answers: [{ questionId: 'q-1-a', optionIds: ['table'] }],
  ...patch,
});

function Card(props: React.ComponentProps<typeof QuestionnaireCard>) {
  return (
    <MotionConfig reducedMotion="always">
      <RhineProvider motion="reduce">
        <QuestionnaireCard {...props} />
      </RhineProvider>
    </MotionConfig>
  );
}

describe('QuestionnaireCard onDiscardDraft', () => {
  it.each(['completed', 'expired', 'interrupted'] as const)('%s + dirty draft offers 放弃未保存填写', (status) => {
    render(<Card questionnaire={ended({ status, draftStatus: 'dirty' })} onDiscardDraft={() => {}} />);
    expect(screen.getByText('问卷已结束，仍有未保存的填写。')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '放弃未保存填写' })).toBeInTheDocument();
  });

  it('hidden without the callback, with a clean / saved draft, and while still open', () => {
    const { rerender } = render(<Card questionnaire={ended({ draftStatus: 'error' })} />);
    expect(screen.queryByRole('button', { name: '放弃未保存填写' })).toBeNull();
    rerender(<Card questionnaire={ended({ draftStatus: 'saved' })} onDiscardDraft={() => {}} />);
    expect(screen.queryByRole('button', { name: '放弃未保存填写' })).toBeNull();
    rerender(<Card questionnaire={{ ...sampleQuestionnaire, draftStatus: 'dirty' }} onDiscardDraft={() => {}} />);
    expect(screen.queryByRole('button', { name: '放弃未保存填写' })).toBeNull();
  });

  it('confirms through an AlertDialog: cancel keeps the draft and returns focus; confirm calls back', async () => {
    const user = userEvent.setup();
    const onDiscardDraft = vi.fn();
    render(<Card questionnaire={ended({ draftStatus: 'error' })} onDiscardDraft={onDiscardDraft} />);
    const trigger = screen.getByRole('button', { name: '放弃未保存填写' });
    await user.click(trigger);
    const dialog = await screen.findByRole('alertdialog', { name: '放弃未保存的填写？' });
    expect(dialog).toHaveAccessibleDescription(/放弃后无法恢复/);
    await user.click(within(dialog).getByRole('button', { name: '取消' }));
    await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull());
    expect(onDiscardDraft).not.toHaveBeenCalled();
    await waitFor(() => expect(trigger).toHaveFocus());
    await user.click(trigger);
    await user.click(within(await screen.findByRole('alertdialog')).getByRole('button', { name: '放弃填写' }));
    expect(onDiscardDraft).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull());
  });

  it('a rejected promise keeps the dialog open with an error', async () => {
    const user = userEvent.setup();
    const onDiscardDraft = vi.fn(() => Promise.reject(new Error('x')));
    render(<Card questionnaire={ended({ draftStatus: 'dirty' })} onDiscardDraft={onDiscardDraft} />);
    await user.click(screen.getByRole('button', { name: '放弃未保存填写' }));
    const dialog = await screen.findByRole('alertdialog');
    await user.click(within(dialog).getByRole('button', { name: '放弃填写' }));
    expect(await within(dialog).findByText('未能放弃填写，请重试。')).toBeInTheDocument();
  });
});
