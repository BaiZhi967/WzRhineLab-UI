import * as React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Toast as BaseToast } from '@base-ui/react/toast';
import { describe, expect, it, vi } from 'vitest';
import { RhineProvider, useToast } from '../src';
import type { ToastApi } from '../src';

/** ADR-0006 §8: id dedupe, closing actions, action timeout floor, promise toasts. */

let api: ToastApi;
let timeouts: Array<number | undefined> = [];

function Capture() {
  api = useToast();
  // Read the queue directly to assert the effective timeout handed to Base UI.
  timeouts = BaseToast.useToastManager().toasts.map((t) => t.timeout);
  return null;
}

const wrap = (props: Partial<React.ComponentProps<typeof RhineProvider>> = {}) =>
  render(
    <RhineProvider {...props}>
      <Capture />
    </RhineProvider>,
  );

const toastEls = () => document.querySelectorAll('.rl-toast');

describe('Toast · dedupe by id', () => {
  it('showing the same id three times keeps one toast and updates it in place', async () => {
    wrap();
    const ids: string[] = [];
    for (const n of [1, 2, 3]) {
      act(() => {
        ids.push(api.show({ id: 'copy-id', title: `已复制编号（第 ${n} 次）`, status: 'success' }));
      });
    }
    expect(await screen.findByText('已复制编号（第 3 次）')).toBeInTheDocument();
    expect(ids).toEqual(['copy-id', 'copy-id', 'copy-id']);
    expect(toastEls()).toHaveLength(1);
  });

  it('different ids (or none) still stack', async () => {
    wrap();
    act(() => {
      api.show({ id: 'a', title: '甲' });
      api.show({ id: 'b', title: '乙' });
      api.show({ title: '丙' });
    });
    await screen.findByText('丙');
    expect(toastEls()).toHaveLength(3);
  });
});

describe('Toast · action', () => {
  it('runs onClick and then closes the toast by default', async () => {
    const user = userEvent.setup();
    const undo = vi.fn();
    wrap();
    act(() => {
      api.show({ title: '已删除 ARC-0007', action: { label: '撤销', onClick: undo } });
    });
    await user.click(await screen.findByRole('button', { name: '撤销' }));
    expect(undo).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(screen.queryByText('已删除 ARC-0007')).toBeNull());
  });

  it('keepOpen leaves the toast on screen', async () => {
    const user = userEvent.setup();
    const view = vi.fn();
    wrap();
    act(() => {
      api.show({ title: '导出完成', timeout: 0, action: { label: '查看', onClick: view, keepOpen: true } });
    });
    await user.click(await screen.findByRole('button', { name: '查看' }));
    expect(view).toHaveBeenCalledTimes(1);
    // Give a close (if any) time to start.
    await new Promise((r) => setTimeout(r, 50));
    expect(screen.getByText('导出完成')).toBeInTheDocument();
    expect(toastEls()[0]).not.toHaveAttribute('data-ending-style');
  });

  it('without an explicit timeout, action toasts get at least 10 s', async () => {
    wrap();
    act(() => {
      api.show({ title: '有操作', action: { label: '撤销', onClick: () => {} } });
      api.show({ title: '无操作' });
      api.show({ title: '显式', timeout: 3000, action: { label: '撤销', onClick: () => {} } });
    });
    await screen.findByText('显式');
    // Newest first.
    expect(timeouts).toEqual([3000, undefined, 10000]);
  });

  it('a longer provider timeout wins; a provider timeout of 0 stays 0', async () => {
    const first = wrap({ toastTimeout: 20000 });
    act(() => {
      api.show({ title: '有操作', action: { label: '撤销', onClick: () => {} } });
    });
    await screen.findByText('有操作');
    expect(timeouts).toEqual([20000]);
    first.unmount();
    wrap({ toastTimeout: 0 });
    act(() => {
      api.show({ title: '常驻', action: { label: '撤销', onClick: () => {} } });
    });
    await screen.findByText('常驻');
    expect(timeouts).toEqual([0]);
  });

  it('really outlives the provider timeout (real timers)', async () => {
    wrap({ toastTimeout: 60 });
    act(() => {
      api.show({ title: '带撤销', action: { label: '撤销', onClick: () => {} } });
      api.show({ title: '普通' });
    });
    await screen.findByText('普通');
    await waitFor(() => expect(screen.queryByText('普通')).toBeNull(), { timeout: 2000 });
    expect(screen.getByText('带撤销')).toBeInTheDocument();
  });
});

describe('Toast · promise', () => {
  it('loading → success in place (one toast), with spinner while loading', async () => {
    wrap();
    let resolve!: (v: number) => void;
    const work = new Promise<number>((r) => (resolve = r));
    let result: Promise<number> | undefined;
    act(() => {
      result = api.promise(work, {
        loading: '正在导出…',
        success: (n) => ({ title: '导出完成', description: `${n} 条记录（示例）` }),
        error: '导出失败',
      });
    });
    expect(await screen.findByText('正在导出…')).toBeInTheDocument();
    const toast = toastEls()[0]!;
    expect(toast).toHaveAttribute('data-status', 'info');
    expect(toast.querySelector('.rl-spinner')).not.toBeNull();
    await act(async () => {
      resolve(12);
      await result;
    });
    expect(await screen.findByText('导出完成')).toBeInTheDocument();
    expect(screen.getByText('12 条记录（示例）')).toBeInTheDocument();
    expect(toastEls()).toHaveLength(1);
    expect(toastEls()[0]).toBe(toast);
    expect(toast).toHaveAttribute('data-status', 'success');
    expect(toast.querySelector('.rl-spinner')).toBeNull();
    await expect(result).resolves.toBe(12);
  });

  it('failure: danger, high priority, does not auto-dismiss; the returned promise rejects', async () => {
    wrap({ toastTimeout: 60 });
    let reject!: (e: Error) => void;
    const work = new Promise<number>((_, r) => (reject = r));
    let result: Promise<number> | undefined;
    act(() => {
      result = api.promise(work, {
        loading: { title: '正在同步…' },
        success: '已同步',
        error: (e) => ({ title: '同步失败', description: (e as Error).message }),
      });
    });
    await screen.findByText('正在同步…');
    const caught = vi.fn();
    await act(async () => {
      reject(new Error('网络中断（示例）'));
      await result!.catch(caught);
    });
    expect(caught).toHaveBeenCalledTimes(1);
    await screen.findAllByText('同步失败');
    const toast = toastEls()[0]!;
    expect(toastEls()).toHaveLength(1);
    expect(toast).toHaveAttribute('data-status', 'danger');
    expect(screen.getAllByRole('alert').some((el) => el.textContent?.includes('同步失败'))).toBe(true);
    expect(timeouts).toEqual([0]);
    await new Promise((r) => setTimeout(r, 300));
    expect(toastEls()).toHaveLength(1);
  });

  it('caller options override the error defaults', async () => {
    wrap();
    const work = Promise.reject(new Error('x'));
    act(() => {
      api.promise(work, { loading: '处理中', success: '完成', error: { title: '失败', priority: 'low', timeout: 4000 } }).catch(() => {});
    });
    await screen.findByText('失败');
    expect(timeouts).toEqual([4000]);
    expect(screen.queryAllByRole('alert').some((el) => el.textContent?.includes('失败'))).toBe(false);
  });
});
