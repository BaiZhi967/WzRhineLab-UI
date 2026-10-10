import * as React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { Button, Dialog, DialogClose, Popover, RhineProvider, Tab, TabList, TabPanel, Tabs, useToast } from '../src';

/**
 * M10 interrupt matrix (jsdom part). Rapid open / close / open must end in the final requested
 * state with exactly one popup; dismissing mid-enter must not leave ghosts. Real timing (Tabs
 * indicator mid-flight, toast transitions) is covered by apps/docs/e2e/motion-core.spec.ts.
 */

const wrap = (ui: React.ReactNode, props: Partial<React.ComponentProps<typeof RhineProvider>> = {}) =>
  render(<RhineProvider {...props}>{ui}</RhineProvider>);

const sleep = (ms: number) => act(() => new Promise((r) => setTimeout(r, ms)));

describe('Dialog · interrupt', () => {
  // The modal makes the rest of the page inert, so the test drives `open` through a handle.
  const handle: { set?: (open: boolean) => void } = {};
  function Controlled({ onClosed }: { onClosed?: () => void }) {
    const [open, setOpen] = React.useState(false);
    handle.set = setOpen;
    return (
      <Dialog open={open} onOpenChange={setOpen} onClosed={onClosed} title="确认归档" actions={<DialogClose><Button>取消</Button></DialogClose>} />
    );
  }
  const setOpen = (open: boolean) => act(() => handle.set!(open));

  it('open → close → open mid-exit leaves one popup, open, with a working close', async () => {
    wrap(<Controlled />);
    setOpen(true);
    await screen.findByRole('dialog', { name: '确认归档' });
    // Close and reopen before the 280ms exit can finish.
    setOpen(false);
    await sleep(30);
    setOpen(true);
    await sleep(400);
    expect(document.querySelectorAll('.rl-dialog')).toHaveLength(1);
    expect(document.querySelectorAll('.rl-dialog__backdrop')).toHaveLength(1);
    expect(screen.getByRole('dialog', { name: '确认归档' })).toBeInTheDocument();
    // The surviving popup is the live one: it still closes normally.
    await userEvent.setup().click(screen.getByRole('button', { name: '取消' }));
    await waitFor(() => expect(document.querySelectorAll('.rl-dialog')).toHaveLength(0));
  });

  it('rapid close → open → close ends closed with nothing left behind', async () => {
    let closed = 0;
    wrap(<Controlled onClosed={() => (closed += 1)} />);
    setOpen(true);
    await screen.findByRole('dialog');
    for (let i = 0; i < 3; i += 1) {
      setOpen(false);
      await sleep(10);
      setOpen(true);
      await sleep(10);
    }
    setOpen(false);
    await waitFor(() => expect(document.querySelectorAll('.rl-dialog')).toHaveLength(0), { timeout: 2000 });
    await waitFor(() => expect(closed).toBeGreaterThanOrEqual(1));
    expect(document.querySelectorAll('.rl-dialog__backdrop')).toHaveLength(0);
  });
});

describe('Popover · interrupt', () => {
  it('toggling the trigger rapidly ends in the last requested state with one popup', async () => {
    const user = userEvent.setup();
    wrap(<Popover trigger={<Button variant="secondary">筛选…</Button>} title="筛选条件">内容</Popover>);
    const trigger = screen.getByRole('button', { name: '筛选…' });
    for (let i = 0; i < 5; i += 1) await user.click(trigger);
    // Odd number of clicks: open.
    await waitFor(() => expect(trigger).toHaveAttribute('aria-expanded', 'true'));
    expect(document.querySelectorAll('.rl-popover')).toHaveLength(1);
    await user.click(trigger);
    await waitFor(() => expect(document.querySelectorAll('.rl-popover')).toHaveLength(0));
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });
});

describe('Toast · interrupt', () => {
  const api: { toast?: ReturnType<typeof useToast> } = {};
  function Capture() {
    api.toast = useToast();
    return null;
  }

  it('dismissed mid-enter: removed without ghosts, and the queue keeps working', async () => {
    wrap(<Capture />);
    let id = '';
    act(() => {
      id = api.toast!.show({ title: '记录已归档', timeout: 0 });
    });
    expect(document.querySelectorAll('.rl-toast')).toHaveLength(1);
    // Dismiss during the enter transition, before it can settle.
    act(() => api.toast!.dismiss(id));
    await waitFor(() => expect(document.querySelectorAll('.rl-toast')).toHaveLength(0), { timeout: 2000 });
    act(() => {
      api.toast!.show({ title: '第二条', timeout: 0 });
    });
    expect(await screen.findByText('第二条')).toBeInTheDocument();
    expect(document.querySelectorAll('.rl-toast')).toHaveLength(1);
  });
});

describe('Tabs · interrupt', () => {
  it('switching again before the indicator settles selects the latest tab only', async () => {
    const user = userEvent.setup();
    render(
      <Tabs defaultValue="a">
        <TabList aria-label="记录视图">
          <Tab value="a">概览</Tab>
          <Tab value="b">元数据</Tab>
          <Tab value="c">历史</Tab>
        </TabList>
        <TabPanel value="a">概览内容</TabPanel>
        <TabPanel value="b">元数据内容</TabPanel>
        <TabPanel value="c">历史内容</TabPanel>
      </Tabs>,
    );
    await user.click(screen.getByRole('tab', { name: '历史' }));
    await user.click(screen.getByRole('tab', { name: '元数据' }));
    expect(screen.getByRole('tab', { name: '元数据' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getAllByRole('tab', { selected: true })).toHaveLength(1);
    expect(screen.getByRole('tabpanel')).toHaveTextContent('元数据内容');
  });
});
