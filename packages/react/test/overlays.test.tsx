import * as React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import {
  Button,
  Dialog,
  DialogClose,
  Field,
  IconButton,
  RhineProvider,
  Select,
  Tab,
  TabList,
  TabPanel,
  Tabs,
  Tooltip,
} from '../src';

const wrap = (ui: React.ReactNode, props: Partial<React.ComponentProps<typeof RhineProvider>> = {}) =>
  render(<RhineProvider {...props}>{ui}</RhineProvider>);

describe('RhineProvider', () => {
  it('renders a themed scope with a portal node inside it', () => {
    const { container } = wrap(<p>内容</p>, { theme: 'dark', density: 'compact', motion: 'reduce' });
    const root = container.querySelector('.rl-theme')!;
    expect(root).toHaveAttribute('data-rl-theme', 'dark');
    expect(root).toHaveAttribute('data-rl-density', 'compact');
    expect(root).toHaveAttribute('data-rl-motion', 'reduce');
    expect(root.querySelector(':scope > .rl-portal')).not.toBeNull();
  });
});

describe('Tabs', () => {
  function RecordTabs(props: Partial<React.ComponentProps<typeof Tabs>>) {
    return (
      <Tabs defaultValue="overview" {...props}>
        <TabList aria-label="记录视图">
          <Tab value="overview">概览</Tab>
          <Tab value="imagery" meta="4">
            影像
          </Tab>
          <Tab value="notes" disabled>
            备注
          </Tab>
          <Tab value="history">历史</Tab>
        </TabList>
        <TabPanel value="overview">概览内容</TabPanel>
        <TabPanel value="imagery">影像内容</TabPanel>
        <TabPanel value="notes">备注内容</TabPanel>
        <TabPanel value="history">历史内容</TabPanel>
      </Tabs>
    );
  }

  it('wires tablist, tabs and panels', () => {
    render(<RecordTabs />);
    expect(screen.getByRole('tablist', { name: '记录视图' })).toBeInTheDocument();
    const overview = screen.getByRole('tab', { name: '概览' });
    expect(overview).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tabpanel', { name: '概览' })).toHaveTextContent('概览内容');
    expect(screen.getByRole('tab', { name: '影像4' })).toHaveAttribute('aria-selected', 'false');
  });

  it('arrow keys move focus (disabled tabs stay discoverable but inert); Enter activates', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<RecordTabs onValueChange={onValueChange} />);
    screen.getByRole('tab', { name: '概览' }).focus();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: '影像4' })).toHaveFocus();
    await user.keyboard('{ArrowRight}');
    const notes = screen.getByRole('tab', { name: '备注' });
    expect(notes).toHaveFocus();
    expect(notes).toHaveAttribute('aria-disabled', 'true');
    await user.keyboard('{Enter}');
    expect(onValueChange).not.toHaveBeenCalled();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: '历史' })).toHaveFocus();
    expect(onValueChange).not.toHaveBeenCalled();
    await user.keyboard('{Enter}');
    expect(onValueChange).toHaveBeenCalledWith('history');
    expect(screen.getByRole('tabpanel')).toHaveTextContent('历史内容');
  });

  it('supports controlled value', async () => {
    const user = userEvent.setup();
    function Controlled() {
      const [value, setValue] = React.useState('overview');
      return (
        <>
          <RecordTabs value={value} onValueChange={setValue} />
          <output>{value}</output>
        </>
      );
    }
    render(<Controlled />);
    await user.click(screen.getByRole('tab', { name: '影像4' }));
    expect(screen.getByRole('status')).toHaveTextContent('imagery');
  });

  it('renders the indicator and variant attributes', () => {
    const { container } = render(<RecordTabs variant="segmented" size="sm" />);
    expect(container.querySelector('.rl-tabs')).toHaveAttribute('data-variant', 'segmented');
    expect(container.querySelector('.rl-tabs__indicator')).not.toBeNull();
  });
});

describe('Tooltip', () => {
  it('shows on keyboard focus inside the provider portal and keeps the trigger name', async () => {
    const user = userEvent.setup();
    const { container } = wrap(
      <Tooltip content="导出档案">
        <IconButton icon={<svg />} label="导出档案" />
      </Tooltip>,
    );
    await user.tab();
    const trigger = screen.getByRole('button', { name: '导出档案' });
    expect(trigger).toHaveFocus();
    await waitFor(() => expect(container.querySelector('.rl-portal .rl-tooltip')).not.toBeNull());
    expect(container.querySelector('.rl-tooltip')).toHaveTextContent('导出档案');
    await user.keyboard('{Escape}');
    await waitFor(() => expect(container.querySelector('.rl-tooltip')).toBeNull());
  });

  it('does not open when disabled', async () => {
    const user = userEvent.setup();
    const { container } = wrap(
      <Tooltip content="刷新" disabled>
        <Button>刷新</Button>
      </Tooltip>,
    );
    await user.tab();
    await act(() => new Promise((r) => setTimeout(r, 50)));
    expect(container.querySelector('.rl-tooltip')).toBeNull();
  });
});

describe('Dialog', () => {
  function ConfirmArchive({ onClosed, onConfirm }: { onClosed?: () => void; onConfirm?: () => void }) {
    return (
      <Dialog
        trigger={<Button variant="secondary">归档记录…</Button>}
        eyebrow="ARCHIVE / CONFIRM"
        title="确认归档"
        description="归档后记录变为只读。"
        onClosed={onClosed}
        actions={
          <>
            <DialogClose>
              <Button variant="ghost">取消</Button>
            </DialogClose>
            <DialogClose>
              <Button onClick={onConfirm}>确认归档</Button>
            </DialogClose>
          </>
        }
      >
        <p>记录 REC-EXAMPLE</p>
      </Dialog>
    );
  }

  it('opens from the trigger with labelled dialog semantics inside the portal', async () => {
    const user = userEvent.setup();
    const { container } = wrap(<ConfirmArchive />);
    await user.click(screen.getByRole('button', { name: '归档记录…' }));
    const dialog = await screen.findByRole('dialog', { name: '确认归档' });
    expect(dialog).toHaveAccessibleDescription('归档后记录变为只读。');
    expect(container.querySelector('.rl-portal')!.contains(dialog)).toBe(true);
    expect(dialog).toHaveAttribute('data-size', 'md');
  });

  it('Escape closes, focus returns to the trigger and onClosed fires after exit', async () => {
    const user = userEvent.setup();
    const onClosed = vi.fn();
    wrap(<ConfirmArchive onClosed={onClosed} />);
    const trigger = screen.getByRole('button', { name: '归档记录…' });
    trigger.focus();
    await user.keyboard('{Enter}');
    await screen.findByRole('dialog');
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    await waitFor(() => expect(trigger).toHaveFocus());
    await waitFor(() => expect(onClosed).toHaveBeenCalledTimes(1));
  });

  it('DialogClose actions run their handler and close', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    wrap(<ConfirmArchive onConfirm={onConfirm} />);
    await user.click(screen.getByRole('button', { name: '归档记录…' }));
    await user.click(await screen.findByRole('button', { name: '确认归档' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('controlled open without a trigger', async () => {
    function Controlled() {
      const [open, setOpen] = React.useState(true);
      return (
        <>
          <Dialog open={open} onOpenChange={setOpen} title="外部控制" />
          <output>{String(open)}</output>
        </>
      );
    }
    const user = userEvent.setup();
    wrap(<Controlled />);
    expect(await screen.findByRole('dialog', { name: '外部控制' })).toBeInTheDocument();
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('false'));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('closes instantly under forced reduced motion', async () => {
    const user = userEvent.setup();
    wrap(<ConfirmArchive />, { motion: 'reduce' });
    await user.click(screen.getByRole('button', { name: '归档记录…' }));
    await screen.findByRole('dialog');
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });
});

describe('Select', () => {
  const options = [
    { value: 'specimen', label: '样本' },
    { value: 'experiment', label: '实验记录' },
    { value: 'report', label: '外勤报告', disabled: true },
    { value: 'personnel', label: '人员档案' },
  ];

  it('takes its name from Field and selects with the keyboard', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    wrap(
      <Field label="记录类别" description="用于档案检索筛选。">
        <Select options={options} onValueChange={onValueChange} placeholder="选择类别" />
      </Field>,
    );
    const trigger = screen.getByRole('combobox', { name: '记录类别' });
    expect(trigger).toHaveAccessibleDescription('用于档案检索筛选。');
    trigger.focus();
    await user.keyboard('{ArrowDown}');
    await screen.findByRole('listbox');
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{Enter}');
    await waitFor(() => expect(onValueChange).toHaveBeenCalled());
    await waitFor(() => expect(screen.queryByRole('listbox')).toBeNull());
    expect(trigger).toHaveFocus();
  });

  it('renders groups and disabled options', async () => {
    const user = userEvent.setup();
    wrap(
      <Select
        aria-label="分类"
        options={[
          { label: '研究', options: options.slice(0, 2) },
          { label: '档案', options: options.slice(2) },
        ]}
      />,
    );
    await user.click(screen.getByRole('combobox', { name: '分类' }));
    await screen.findByRole('listbox');
    expect(screen.getByText('研究')).toBeInTheDocument();
    expect(screen.getByRole('option', { name: '外勤报告' })).toHaveAttribute('aria-disabled', 'true');
  });

  it('controlled value shows the selected label', () => {
    wrap(<Select aria-label="分类" options={options} value="personnel" onValueChange={() => {}} />);
    expect(screen.getByRole('combobox', { name: '分类' })).toHaveTextContent('人员档案');
  });

  it('submits with a form via name', async () => {
    const onSubmit = vi.fn((e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      return new FormData(e.currentTarget).get('category');
    });
    const user = userEvent.setup();
    wrap(
      <form onSubmit={onSubmit}>
        <Select aria-label="分类" name="category" options={options} defaultValue="experiment" />
        <Button type="submit">提交</Button>
      </form>,
    );
    await user.click(screen.getByRole('button', { name: '提交' }));
    expect(onSubmit.mock.results[0]!.value).toBe('experiment');
  });

  it('invalid and disabled states', () => {
    wrap(
      <>
        <Select aria-label="无效" options={options} invalid />
        <Select aria-label="禁用" options={options} disabled />
      </>,
    );
    expect(screen.getByRole('combobox', { name: '无效' })).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('combobox', { name: '禁用' })).toHaveAttribute('data-disabled');
  });
});
