import * as React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import {
  Button,
  Field,
  IconButton,
  Input,
  Menu,
  MenuCheckboxItem,
  MenuGroup,
  MenuItem,
  MenuRadioGroup,
  MenuRadioItem,
  MenuSeparator,
  Popover,
  PopoverClose,
  RhineProvider,
  useToast,
} from '../src';

const wrap = (ui: React.ReactNode, props: Partial<React.ComponentProps<typeof RhineProvider>> = {}) =>
  render(<RhineProvider {...props}>{ui}</RhineProvider>);

describe('Popover', () => {
  function FilterPopover(props: Partial<React.ComponentProps<typeof Popover>>) {
    return (
      <Popover
        trigger={<Button variant="secondary">筛选…</Button>}
        title="筛选条件"
        description="仅影响当前列表。"
        actions={
          <PopoverClose>
            <Button size="sm">完成</Button>
          </PopoverClose>
        }
        {...props}
      >
        <Field label="编号前缀">
          <Input defaultValue="ARC" />
        </Field>
      </Popover>
    );
  }

  it('trigger exposes expanded state; popup is a labelled dialog inside the provider portal', async () => {
    const user = userEvent.setup();
    const { container } = wrap(<FilterPopover />);
    const trigger = screen.getByRole('button', { name: '筛选…' });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await user.click(trigger);
    const popup = await screen.findByRole('dialog', { name: '筛选条件' });
    expect(popup).toHaveAccessibleDescription('仅影响当前列表。');
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(container.querySelector('.rl-portal')!.contains(popup)).toBe(true);
    expect(popup).toHaveAttribute('data-size', 'md');
  });

  it('is non-modal: outside content stays in the accessibility tree', async () => {
    const user = userEvent.setup();
    wrap(
      <>
        <FilterPopover />
        <button type="button">外部按钮</button>
      </>,
    );
    await user.click(screen.getByRole('button', { name: '筛选…' }));
    await screen.findByRole('dialog');
    expect(screen.getByRole('button', { name: '外部按钮' })).toBeInTheDocument();
  });

  it('Escape closes and returns focus to the trigger', async () => {
    const user = userEvent.setup();
    wrap(<FilterPopover />);
    const trigger = screen.getByRole('button', { name: '筛选…' });
    trigger.focus();
    await user.keyboard('{Enter}');
    const popup = await screen.findByRole('dialog');
    await waitFor(() => expect(popup.contains(document.activeElement)).toBe(true));
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(trigger).toHaveFocus();
  });

  it('PopoverClose closes; controlled open is respected', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    function Controlled() {
      const [open, setOpen] = React.useState(true);
      return (
        <FilterPopover
          open={open}
          onOpenChange={(next) => {
            onOpenChange(next);
            setOpen(next);
          }}
        />
      );
    }
    wrap(<Controlled />);
    await screen.findByRole('dialog');
    await user.click(screen.getByRole('button', { name: '完成' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
  });

  it('uses aria-label when there is no visible title', async () => {
    const user = userEvent.setup();
    wrap(
      <Popover trigger={<IconButton icon={<svg />} label="记录详情" />} aria-label="记录详情预览" arrow>
        <p>REC-EXAMPLE</p>
      </Popover>,
    );
    await user.click(screen.getByRole('button', { name: '记录详情' }));
    expect(await screen.findByRole('dialog', { name: '记录详情预览' })).toBeInTheDocument();
    expect(document.querySelector('.rl-popover__arrow')).not.toBeNull();
  });
});

describe('Menu', () => {
  function RecordMenu({ onExport, onArchive }: { onExport?: () => void; onArchive?: () => void }) {
    const [compact, setCompact] = React.useState(false);
    const [sort, setSort] = React.useState('recent');
    return (
      <>
        <Menu trigger={<IconButton icon={<svg />} label="记录操作" />}>
          <MenuGroup label="操作">
            <MenuItem onSelect={onExport} shortcut="Ctrl E">
              导出
            </MenuItem>
            <MenuItem disabled>复制编号</MenuItem>
            <MenuItem tone="danger" onSelect={onArchive}>
              归档…
            </MenuItem>
          </MenuGroup>
          <MenuSeparator />
          <MenuCheckboxItem checked={compact} onCheckedChange={setCompact}>
            紧凑显示
          </MenuCheckboxItem>
          <MenuRadioGroup label="排序" value={sort} onValueChange={setSort}>
            <MenuRadioItem value="recent">最近更新</MenuRadioItem>
            <MenuRadioItem value="id">编号</MenuRadioItem>
          </MenuRadioGroup>
        </Menu>
        <output>
          {String(compact)}/{sort}
        </output>
      </>
    );
  }

  it('opens with the keyboard, exposes menu semantics and moves focus into it', async () => {
    const user = userEvent.setup();
    wrap(<RecordMenu />);
    const trigger = screen.getByRole('button', { name: '记录操作' });
    expect(trigger).toHaveAttribute('aria-haspopup', 'menu');
    trigger.focus();
    await user.keyboard('{ArrowDown}');
    const menu = await screen.findByRole('menu');
    await waitFor(() => expect(menu.contains(document.activeElement)).toBe(true));
    expect(screen.getByRole('menuitem', { name: /导出/ })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: '复制编号' })).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByRole('menuitemcheckbox', { name: '紧凑显示' })).toHaveAttribute('aria-checked', 'false');
    expect(screen.getByRole('menuitemradio', { name: '最近更新' })).toHaveAttribute('aria-checked', 'true');
  });

  it('selecting an item runs it, closes the menu and returns focus', async () => {
    const user = userEvent.setup();
    const onExport = vi.fn();
    wrap(<RecordMenu onExport={onExport} />);
    const trigger = screen.getByRole('button', { name: '记录操作' });
    await user.click(trigger);
    await user.click(await screen.findByRole('menuitem', { name: /导出/ }));
    expect(onExport).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(screen.queryByRole('menu')).toBeNull());
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it('disabled items do not fire', async () => {
    const user = userEvent.setup();
    wrap(<RecordMenu />);
    await user.click(screen.getByRole('button', { name: '记录操作' }));
    await user.click(await screen.findByRole('menuitem', { name: '复制编号' }));
    expect(screen.getByRole('menu')).toBeInTheDocument();
  });

  it('checkbox and radio items update state and keep the menu open', async () => {
    const user = userEvent.setup();
    wrap(<RecordMenu />);
    await user.click(screen.getByRole('button', { name: '记录操作' }));
    await user.click(await screen.findByRole('menuitemcheckbox', { name: '紧凑显示' }));
    await user.click(screen.getByRole('menuitemradio', { name: '编号' }));
    expect(screen.getByRole('menu')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('true/id');
    expect(screen.getByRole('menuitemcheckbox', { name: '紧凑显示' })).toHaveAttribute('aria-checked', 'true');
  });

  it('Escape closes without running anything', async () => {
    const user = userEvent.setup();
    const onArchive = vi.fn();
    wrap(<RecordMenu onArchive={onArchive} />);
    await user.click(screen.getByRole('button', { name: '记录操作' }));
    await screen.findByRole('menu');
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('menu')).toBeNull());
    expect(onArchive).not.toHaveBeenCalled();
  });
});

describe('Toast', () => {
  function Notifier({ onReady }: { onReady?: (api: ReturnType<typeof useToast>) => void }) {
    const toast = useToast();
    React.useEffect(() => {
      onReady?.(toast);
    }, [toast, onReady]);
    return (
      <Button
        onClick={() =>
          toast.show({
            title: '记录已归档',
            description: 'REC-EXAMPLE',
            status: 'success',
            action: { label: '撤销', onClick: undo },
          })
        }
      >
        归档
      </Button>
    );
  }
  const undo = vi.fn();

  it('RhineProvider mounts a polite live-region viewport inside the themed root', () => {
    const { container } = wrap(<p>内容</p>);
    const viewport = container.querySelector('.rl-toast-viewport');
    expect(viewport).not.toBeNull();
    expect(viewport!.closest('.rl-theme')).not.toBeNull();
    expect(viewport).toHaveAttribute('aria-live', 'polite');
  });

  it('a nested provider shares the outer toast queue', () => {
    const { container } = wrap(
      <RhineProvider theme="dark">
        <p>预览</p>
      </RhineProvider>,
    );
    expect(container.querySelectorAll('.rl-toast-viewport')).toHaveLength(1);
  });

  it('shows title, description, status, action and a named close button', async () => {
    const user = userEvent.setup();
    wrap(<Notifier />);
    await user.click(screen.getByRole('button', { name: '归档' }));
    const toast = await screen.findByText('记录已归档');
    const root = toast.closest('.rl-toast')!;
    expect(root).toHaveAttribute('data-status', 'success');
    expect(root).toHaveTextContent('REC-EXAMPLE');
    await user.click(screen.getByRole('button', { name: '撤销' }));
    expect(undo).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: '关闭通知' })).toBeInTheDocument();
  });

  it('close button dismisses; update replaces content', async () => {
    const user = userEvent.setup();
    let api: ReturnType<typeof useToast> | undefined;
    wrap(<Notifier onReady={(a) => (api = a)} />);
    let id = '';
    act(() => {
      id = api!.show({ title: '正在同步…', status: 'info', timeout: 0 });
    });
    expect(await screen.findByText('正在同步…')).toBeInTheDocument();
    act(() => api!.update(id, { title: '同步完成', status: 'success' }));
    expect(await screen.findByText('同步完成')).toBeInTheDocument();
    expect(screen.getByText('同步完成').closest('.rl-toast')).toHaveAttribute('data-status', 'success');
    await user.click(screen.getByRole('button', { name: '关闭通知' }));
    await waitFor(() => expect(screen.queryByText('同步完成')).toBeNull());
  });

  it('auto-dismisses after the timeout', async () => {
    let api: ReturnType<typeof useToast> | undefined;
    wrap(<Notifier onReady={(a) => (api = a)} />, { toastTimeout: 50 });
    act(() => {
      api!.show({ title: '短暂通知' });
    });
    expect(await screen.findByText('短暂通知')).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByText('短暂通知')).toBeNull(), { timeout: 2000 });
  });

  it('high priority toasts are announced assertively', async () => {
    let api: ReturnType<typeof useToast> | undefined;
    wrap(<Notifier onReady={(a) => (api = a)} />);
    act(() => {
      api!.show({ title: '同步失败', status: 'danger', priority: 'high', timeout: 0 });
    });
    await screen.findAllByText('同步失败');
    expect(screen.getAllByRole('alert').some((el) => el.textContent?.includes('同步失败'))).toBe(true);
  });
});
