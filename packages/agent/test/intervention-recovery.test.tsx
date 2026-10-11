import * as React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MotionConfig } from 'motion/react';
import { describe, expect, it, vi } from 'vitest';
import type { RecoveryView } from '@wzrhine/agent-core';
import { ApprovalPanel, ErrorRecoveryNotice, InterventionDock } from '../src/index';
import { sampleApproval } from '../src/fixtures/session';

const base = (kind: RecoveryView['kind'], patch: Partial<RecoveryView> = {}): RecoveryView => ({
  id: `r-${kind}`,
  kind,
  title: `title ${kind}`,
  ...patch,
});

describe('ErrorRecoveryNotice', () => {
  it.each<[RecoveryView['kind'], string, string]>([
    ['retryable', 'info', '可重试'],
    ['save-pending', 'warning', '保存未完成'],
    ['cancel-unconfirmed', 'warning', '停止未确认'],
    ['tool-side-effects', 'danger', '可能已有副作用'],
    ['timeout', 'warning', '已超时'],
    ['offline', 'info', '已离线'],
    ['unknown', 'warning', '状态未知'],
    ['resolved', 'success', '已恢复'],
  ])('%s → tone %s with label text', (kind, tone, label) => {
    render(<ErrorRecoveryNotice recovery={base(kind)} />);
    const region = screen.getByRole('region', { name: `title ${kind}` });
    expect(region).toHaveAttribute('data-tone', tone);
    expect(within(region).getByText(label)).toBeInTheDocument();
  });

  it('kind-specific consequence sentences keep the states distinct', () => {
    render(
      <>
        <ErrorRecoveryNotice recovery={base('cancel-unconfirmed')} />
        <ErrorRecoveryNotice recovery={base('tool-side-effects')} announce={false} />
        <ErrorRecoveryNotice recovery={base('save-pending')} />
      </>,
    );
    expect(screen.getByText('停止尚未确认，工具可能仍在运行。')).toBeInTheDocument();
    expect(screen.getByText('工具可能已产生外部影响，不会自动重放。')).toBeInTheDocument();
    expect(screen.getByText('重试保存不会再次调用模型。')).toBeInTheDocument();
  });

  it('role=alert only for danger and only when announce', () => {
    const { rerender } = render(<ErrorRecoveryNotice recovery={base('tool-side-effects')} />);
    expect(screen.getByRole('alert')).toHaveTextContent('title tool-side-effects');
    rerender(<ErrorRecoveryNotice recovery={base('tool-side-effects')} announce={false} />);
    expect(screen.queryByRole('alert')).toBeNull();
    rerender(<ErrorRecoveryNotice recovery={base('cancel-unconfirmed')} />);
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('preserved list, code, actions → onAction(id); no handler → no buttons', async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    const view = base('save-pending', {
      message: 'm',
      code: 'AGENT_PERSISTENCE_PENDING',
      preserved: ['已有输出', '草稿'],
      actions: [
        { id: 'retry-save', label: '仅重试本地保存', tone: 'primary' },
        { id: 'check', label: '核对工具结果' },
      ],
    });
    const { rerender } = render(<ErrorRecoveryNotice recovery={view} onAction={onAction} />);
    expect(screen.getByText('已保留：')).toBeInTheDocument();
    expect(screen.getAllByRole('listitem').map((li) => li.textContent)).toEqual(['已有输出', '草稿']);
    expect(screen.getByText('AGENT_PERSISTENCE_PENDING').tagName).toBe('CODE');
    await user.click(screen.getByRole('button', { name: '仅重试本地保存' }));
    expect(onAction).toHaveBeenCalledWith('retry-save');
    rerender(<ErrorRecoveryNotice recovery={view} />);
    expect(screen.queryAllByRole('button')).toHaveLength(0);
  });

  it('dismiss only for resolved', async () => {
    const user = userEvent.setup();
    const onDismiss = vi.fn();
    const { rerender } = render(<ErrorRecoveryNotice recovery={base('retryable')} onDismiss={onDismiss} />);
    expect(screen.queryByRole('button', { name: '关闭提示' })).toBeNull();
    rerender(<ErrorRecoveryNotice recovery={base('resolved')} onDismiss={onDismiss} />);
    await user.click(screen.getByRole('button', { name: '关闭提示' }));
    expect(onDismiss).toHaveBeenCalled();
  });
});

describe('InterventionDock', () => {
  it('is a labelled region only with content; shows the pending counter', () => {
    const { rerender } = render(<InterventionDock />);
    expect(screen.queryByRole('region')).toBeNull();
    rerender(
      <InterventionDock moreCount={2}>
        <ApprovalPanel key="op-3" approval={sampleApproval} onReject={() => {}} />
      </InterventionDock>,
    );
    const dock = screen.getByRole('region', { name: '待处理的干预' });
    expect(dock).toHaveAttribute('data-open');
    expect(within(dock).getByText('还有 2 个待处理')).toBeInTheDocument();
  });

  it('cards on first render are static; later cards enter once', () => {
    const { container, rerender } = render(
      <InterventionDock>
        <ErrorRecoveryNotice key="a" recovery={base('retryable')} />
      </InterventionDock>,
    );
    const first = container.querySelector('[data-agent-entrance="card"]') as HTMLElement;
    expect(first.style.opacity === '' || first.style.opacity === '1').toBe(true);
    rerender(
      <InterventionDock>
        <ErrorRecoveryNotice key="a" recovery={base('retryable')} />
        <ErrorRecoveryNotice key="b" recovery={base('offline')} />
      </InterventionDock>,
    );
    const items = container.querySelectorAll<HTMLElement>('[data-agent-entrance="card"]');
    expect(items).toHaveLength(2);
    expect(Number(items[1]!.style.opacity)).toBeLessThan(1);
  });

  it('reduced motion: new cards have no transform offset', () => {
    const { container, rerender } = render(
      <MotionConfig reducedMotion="always">
        <InterventionDock />
      </MotionConfig>,
    );
    rerender(
      <MotionConfig reducedMotion="always">
        <InterventionDock>
          <ErrorRecoveryNotice key="b" recovery={base('offline')} />
        </InterventionDock>
      </MotionConfig>,
    );
    const item = container.querySelector<HTMLElement>('[data-agent-entrance="card"]')!;
    expect(item.style.transform === '' || item.style.transform === 'none').toBe(true);
  });
});
