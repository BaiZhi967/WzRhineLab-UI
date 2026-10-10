import * as React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AlertDialog, Button, Dialog, DialogClose, RhineProvider } from '../src';
import type { AlertDialogProps } from '../src';
// Imported from the module until the coordinator re-exports it from src/index.ts.
import type { DialogCloseReason } from '../src/components/Dialog';

const wrap = (ui: React.ReactNode, props: Partial<React.ComponentProps<typeof RhineProvider>> = {}) =>
  render(<RhineProvider {...props}>{ui}</RhineProvider>);

function deferred() {
  let resolve!: () => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<void>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function Delete(props: Partial<AlertDialogProps>) {
  return (
    <AlertDialog
      trigger={<Button variant="ghost">删除记录…</Button>}
      title="删除 REC-EXAMPLE？"
      description="删除后无法恢复。"
      confirmLabel="删除"
      onConfirm={() => {}}
      {...props}
    />
  );
}

describe('AlertDialog', () => {
  it('renders role=alertdialog named by the title and described by the description, inside the portal', async () => {
    const user = userEvent.setup();
    const { container } = wrap(<Delete eyebrow="ARCHIVE / DELETE" />);
    await user.click(screen.getByRole('button', { name: '删除记录…' }));
    const dialog = await screen.findByRole('alertdialog', { name: '删除 REC-EXAMPLE？' });
    expect(dialog).toHaveAccessibleDescription('删除后无法恢复。');
    expect(container.querySelector('.rl-portal')!.contains(dialog)).toBe(true);
    expect(dialog).toHaveClass('rl-dialog', 'rl-alert-dialog');
    expect(dialog).toHaveAttribute('data-size', 'sm');
    expect(dialog).toHaveAttribute('data-tone', 'danger');
    expect(dialog).toHaveTextContent('ARCHIVE / DELETE');
  });

  it('puts cancel before confirm and focuses cancel first', async () => {
    const user = userEvent.setup();
    wrap(<Delete />);
    await user.click(screen.getByRole('button', { name: '删除记录…' }));
    const dialog = await screen.findByRole('alertdialog');
    const buttons = Array.from(dialog.querySelectorAll('button')).map((b) => b.textContent);
    expect(buttons).toEqual(['取消', '删除']);
    await waitFor(() => expect(screen.getByRole('button', { name: '取消' })).toHaveFocus());
    expect(screen.getByRole('button', { name: '删除' })).toHaveAttribute('data-tone', 'danger');
  });

  it('initial focus stays on cancel even when children contain tabbable content', async () => {
    wrap(
      <Delete defaultOpen>
        <a href="#affected">受影响的 3 条记录</a>
      </Delete>,
    );
    await screen.findByRole('alertdialog');
    await waitFor(() => expect(screen.getByRole('button', { name: '取消' })).toHaveFocus());
  });

  it('after a rejection focus moves back to confirm even if it had moved inside the dialog', async () => {
    const user = userEvent.setup();
    const d = deferred();
    wrap(
      <Delete defaultOpen onConfirm={() => d.promise}>
        <a href="#affected">受影响的 3 条记录</a>
      </Delete>,
    );
    const confirm = await screen.findByRole('button', { name: '删除' });
    await user.click(confirm);
    screen.getByRole('link', { name: '受影响的 3 条记录' }).focus();
    await act(async () => d.reject(new Error('x')));
    await screen.findByRole('alert');
    await waitFor(() => expect(confirm).toHaveFocus());
  });

  it('tone="default" and custom cancelLabel', async () => {
    wrap(<Delete defaultOpen tone="default" cancelLabel="继续编辑" />);
    const dialog = await screen.findByRole('alertdialog');
    expect(dialog).toHaveAttribute('data-tone', 'default');
    expect(screen.getByRole('button', { name: '继续编辑' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '删除' })).toHaveAttribute('data-tone', 'default');
  });

  it('Escape cancels without confirming; focus returns to the trigger; onClosed fires', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    const onClosed = vi.fn();
    const onOpenChange = vi.fn();
    wrap(<Delete onConfirm={onConfirm} onClosed={onClosed} onOpenChange={onOpenChange} />);
    const trigger = screen.getByRole('button', { name: '删除记录…' });
    trigger.focus();
    await user.keyboard('{Enter}');
    await screen.findByRole('alertdialog');
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull());
    await waitFor(() => expect(trigger).toHaveFocus());
    await waitFor(() => expect(onClosed).toHaveBeenCalledTimes(1));
    expect(onConfirm).not.toHaveBeenCalled();
    expect(onOpenChange.mock.calls).toEqual([[true], [false]]);
  });

  it('cancel button closes without confirming', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    wrap(<Delete onConfirm={onConfirm} />);
    await user.click(screen.getByRole('button', { name: '删除记录…' }));
    await user.click(await screen.findByRole('button', { name: '取消' }));
    await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull());
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('synchronous confirm runs once and closes', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    wrap(<Delete onConfirm={onConfirm} />);
    await user.click(screen.getByRole('button', { name: '删除记录…' }));
    await user.click(await screen.findByRole('button', { name: '删除' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull());
  });

  it('async confirm: pending keeps the dialog open, blocks cancel and Escape, closes on resolve', async () => {
    const user = userEvent.setup();
    const d = deferred();
    const onConfirm = vi.fn(() => d.promise);
    wrap(<Delete onConfirm={onConfirm} />);
    await user.click(screen.getByRole('button', { name: '删除记录…' }));
    const confirm = await screen.findByRole('button', { name: '删除' });
    await user.click(confirm);
    expect(confirm).toHaveAttribute('aria-busy', 'true');
    expect(confirm).toHaveFocus();
    const cancel = screen.getByRole('button', { name: '取消' });
    expect(cancel).toBeDisabled();
    await user.keyboard('{Escape}');
    await user.click(confirm);
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    await act(async () => d.resolve());
    await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull());
  });

  it('async confirm rejects: stays open, shows errorText as role=alert, focus on confirm, can retry', async () => {
    const user = userEvent.setup();
    let d = deferred();
    const onConfirm = vi.fn(() => d.promise);
    wrap(<Delete onConfirm={onConfirm} />);
    await user.click(screen.getByRole('button', { name: '删除记录…' }));
    const confirm = await screen.findByRole('button', { name: '删除' });
    await user.click(confirm);
    await act(async () => d.reject(new Error('network')));
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('操作未完成，请重试。');
    expect(screen.getByRole('alertdialog')).toContainElement(alert);
    expect(confirm).not.toHaveAttribute('aria-busy');
    await waitFor(() => expect(confirm).toHaveFocus());
    expect(screen.getByRole('button', { name: '取消' })).toBeEnabled();

    d = deferred();
    await user.click(confirm);
    expect(onConfirm).toHaveBeenCalledTimes(2);
    await act(async () => d.resolve());
    await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull());
  });

  it('a throwing onConfirm is treated like a rejection; custom errorText', async () => {
    const user = userEvent.setup();
    wrap(
      <Delete
        defaultOpen
        errorText="删除失败，请稍后再试。"
        onConfirm={() => {
          throw new Error('boom');
        }}
      />,
    );
    await user.click(await screen.findByRole('button', { name: '删除' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('删除失败，请稍后再试。');
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
  });

  it('error is cleared when the dialog is reopened', async () => {
    const user = userEvent.setup();
    wrap(<Delete onConfirm={() => Promise.reject(new Error('x'))} />);
    await user.click(screen.getByRole('button', { name: '删除记录…' }));
    await user.click(await screen.findByRole('button', { name: '删除' }));
    await screen.findByRole('alert');
    await user.click(screen.getByRole('button', { name: '取消' }));
    await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull());
    await user.click(screen.getByRole('button', { name: '删除记录…' }));
    await screen.findByRole('alertdialog');
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('a stale promise resolving after a controlled close does not reopen or close a later opening', async () => {
    const user = userEvent.setup();
    const first = deferred();
    const onOpenChange = vi.fn();
    function Controlled() {
      const [open, setOpen] = React.useState(true);
      return (
        <>
          <button type="button" onClick={() => setOpen((o) => !o)}>
            切换
          </button>
          <AlertDialog
            open={open}
            onOpenChange={(next) => {
              onOpenChange(next);
              setOpen(next);
            }}
            title="删除？"
            description="删除后无法恢复。"
            confirmLabel="删除"
            onConfirm={() => first.promise}
          />
        </>
      );
    }
    wrap(<Controlled />);
    await user.click(await screen.findByRole('button', { name: '删除' }));
    // Programmatic close while pending (Base UI does not see a user dismissal).
    await act(async () => screen.getByText('切换').click());
    await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull());
    await act(async () => screen.getByText('切换').click());
    const reopened = await screen.findByRole('alertdialog');
    expect(screen.getByRole('button', { name: '删除' })).not.toHaveAttribute('aria-busy');
    await act(async () => first.resolve());
    expect(reopened).toBeInTheDocument();
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it('a promise settling after unmount does not warn or throw', async () => {
    const user = userEvent.setup();
    const d = deferred();
    const error = vi.spyOn(console, 'error');
    const { unmount } = wrap(<Delete defaultOpen onConfirm={() => d.promise} />);
    await user.click(await screen.findByRole('button', { name: '删除' }));
    unmount();
    await act(async () => d.reject(new Error('late')));
    expect(error).not.toHaveBeenCalled();
  });

  it('controlled open without a trigger (e.g. from a menu item)', async () => {
    const user = userEvent.setup();
    function Controlled() {
      const [open, setOpen] = React.useState(false);
      return (
        <>
          <Button onClick={() => setOpen(true)}>打开</Button>
          <AlertDialog
            open={open}
            onOpenChange={setOpen}
            title="外部控制"
            description="说明。"
            confirmLabel="确认归档"
            tone="default"
            onConfirm={() => {}}
          />
          <output>{String(open)}</output>
        </>
      );
    }
    wrap(<Controlled />);
    await user.click(screen.getByRole('button', { name: '打开' }));
    expect(await screen.findByRole('alertdialog', { name: '外部控制' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '确认归档' }));
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('false'));
    await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull());
  });

  it('closes instantly under forced reduced motion', async () => {
    const user = userEvent.setup();
    wrap(<Delete />, { motion: 'reduce' });
    await user.click(screen.getByRole('button', { name: '删除记录…' }));
    await screen.findByRole('alertdialog');
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull());
  });
});

describe('Dialog onCloseRequest', () => {
  function Guarded({ onCloseRequest }: { onCloseRequest: (reason: DialogCloseReason) => boolean | void }) {
    return (
      <Dialog
        trigger={<Button>编辑</Button>}
        title="编辑备注"
        onCloseRequest={onCloseRequest}
        actions={
          <DialogClose>
            <Button variant="ghost">关闭</Button>
          </DialogClose>
        }
      >
        <input aria-label="备注" />
      </Dialog>
    );
  }

  it('returning false keeps the dialog open for Escape and close buttons; reasons are mapped', async () => {
    const user = userEvent.setup();
    const onCloseRequest = vi.fn(() => false);
    wrap(<Guarded onCloseRequest={onCloseRequest} />);
    await user.click(screen.getByRole('button', { name: '编辑' }));
    const dialog = await screen.findByRole('dialog', { name: '编辑备注' });
    await user.keyboard('{Escape}');
    expect(dialog).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '关闭' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(onCloseRequest.mock.calls).toEqual([['escape'], ['close-button']]);
  });

  it('returning true / undefined lets the close through', async () => {
    const user = userEvent.setup();
    const onCloseRequest = vi.fn(() => undefined);
    wrap(<Guarded onCloseRequest={onCloseRequest} />);
    await user.click(screen.getByRole('button', { name: '编辑' }));
    await screen.findByRole('dialog');
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(onCloseRequest).toHaveBeenCalledWith('escape');
  });

  it('outside press reports "outside"', async () => {
    const user = userEvent.setup();
    const onCloseRequest = vi.fn(() => false);
    const { container } = wrap(<Guarded onCloseRequest={onCloseRequest} />);
    await user.click(screen.getByRole('button', { name: '编辑' }));
    await screen.findByRole('dialog');
    await user.click(container.querySelector('.rl-dialog__backdrop')!);
    expect(onCloseRequest).toHaveBeenCalledWith('outside');
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('is not consulted on opening or on programmatic close', async () => {
    const onCloseRequest = vi.fn(() => false);
    function Controlled() {
      const [open, setOpen] = React.useState(true);
      return (
        <>
          <Dialog open={open} onOpenChange={setOpen} title="外部控制" onCloseRequest={onCloseRequest} />
          <button type="button" onClick={() => setOpen(false)}>
            外部关闭
          </button>
        </>
      );
    }
    wrap(<Controlled />);
    await screen.findByRole('dialog');
    await act(async () => screen.getByText('外部关闭').click());
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(onCloseRequest).not.toHaveBeenCalled();
  });

  it('dirty form: guard opens a nested AlertDialog; 继续编辑 keeps text, 放弃 closes both', async () => {
    const user = userEvent.setup();
    function Editor() {
      const [open, setOpen] = React.useState(false);
      const [text, setText] = React.useState('');
      const [confirm, setConfirm] = React.useState(false);
      return (
        <Dialog
          trigger={<Button>编辑</Button>}
          open={open}
          onOpenChange={(next) => {
            setOpen(next);
            if (!next) setText('');
          }}
          title="编辑备注"
          onCloseRequest={() => {
            if (text === '') return;
            setConfirm(true);
            return false;
          }}
        >
          <input aria-label="备注" value={text} onChange={(e) => setText(e.currentTarget.value)} />
          <AlertDialog
            open={confirm}
            onOpenChange={setConfirm}
            title="放弃未保存的更改？"
            description="输入的内容将丢失。"
            cancelLabel="继续编辑"
            confirmLabel="放弃"
            onConfirm={() => {
              setOpen(false);
              setText('');
            }}
          />
        </Dialog>
      );
    }
    wrap(<Editor />);
    await user.click(screen.getByRole('button', { name: '编辑' }));
    const field = await screen.findByRole('textbox', { name: '备注' });
    await user.type(field, '草稿');
    await user.keyboard('{Escape}');
    const nested = await screen.findByRole('alertdialog', { name: '放弃未保存的更改？' });
    await user.click(screen.getByRole('button', { name: '继续编辑' }));
    await waitFor(() => expect(nested).not.toBeInTheDocument());
    expect(screen.getByRole('dialog', { name: '编辑备注' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: '备注' })).toHaveValue('草稿');

    await user.keyboard('{Escape}');
    await screen.findByRole('alertdialog');
    await user.click(screen.getByRole('button', { name: '放弃' }));
    await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull());
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });
});
