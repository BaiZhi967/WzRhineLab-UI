import * as React from 'react';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { RhineProvider } from '@wzrhine/react';
import { AgentEmptyState, AgentHeader, AgentShell, AgentSidePane, AgentWorkspaceEmpty, ResizeHandle } from '../src';
import type { AgentShellLayout, AgentShellProps, AgentSidePaneSection } from '../src';

const wrap = (ui: React.ReactNode) => render(<RhineProvider>{ui}</RhineProvider>);

const sections: AgentSidePaneSection[] = [
  { id: 'summary', label: '摘要', content: <p>摘要内容（示例）</p> },
  { id: 'files', label: '产物', count: 3, content: <p>产物内容（示例）</p> },
  { id: 'terminal', label: '终端', content: <p>终端内容（示例）</p> },
];

function Shell(props: Partial<AgentShellProps>) {
  return (
    <AgentShell
      rail={<nav aria-label="应用导航">rail</nav>}
      index={<p>索引内容</p>}
      header={<AgentHeader title="海洋样本（示例）" />}
      conversation={<p>阅读内容</p>}
      composer={<textarea aria-label="消息（示例）" />}
      context={<AgentSidePane sections={sections} />}
      {...props}
    />
  );
}

const toggle = () => screen.getByRole('button', { name: '详情面板' });

describe('AgentShell', () => {
  it('renders every slot in its region; the reading column is a labelled section', () => {
    wrap(<Shell layout="wide" defaultContextOpen />);
    const main = screen.getByRole('region', { name: '对话' });
    expect(main.querySelector('.rl-agent-shell__header')).toHaveTextContent('海洋样本（示例）');
    expect(within(main).getByText('阅读内容')).toBeInTheDocument();
    expect(within(main).getByRole('textbox', { name: '消息（示例）' })).toBeInTheDocument();
    expect(within(screen.getByRole('region', { name: '会话索引' })).getByText('索引内容')).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: '应用导航' })).toBeInTheDocument();
    expect(screen.getByRole('complementary', { name: '上下文详情' })).toBeInTheDocument();
    expect(screen.queryByRole('main')).toBeNull();
  });

  it.each<[AgentShellLayout, boolean, boolean]>([
    ['wide', true, true],
    ['compact', true, true],
    ['narrow', false, false],
  ])('layout="%s" is forced (index inline: %s, rail: %s)', (layout, indexInline, rail) => {
    const { container } = wrap(<Shell layout={layout} />);
    const root = container.querySelector('.rl-agent-shell')!;
    expect(root).toHaveAttribute('data-layout', layout);
    expect(!!screen.queryByRole('region', { name: '会话索引' })).toBe(indexInline);
    expect(!!screen.queryByRole('navigation', { name: '应用导航' })).toBe(rail);
    // Only the wide layout keeps the context column inline.
    expect(!!root.querySelector('.rl-agent-shell__context')).toBe(layout === 'wide');
  });

  it('narrow layout: the header offers an index toggle that opens the index sheet', async () => {
    const user = userEvent.setup();
    wrap(<Shell layout="narrow" />);
    const open = screen.getByRole('button', { name: '打开会话列表' });
    expect(open).toHaveAttribute('aria-haspopup', 'dialog');
    await user.click(open);
    const sheet = await screen.findByRole('dialog', { name: '会话索引' });
    expect(within(sheet).getByText('索引内容')).toBeInTheDocument();
  });

  it('uncontrolled contextOpen: the header toggle flips aria-pressed and the inline pane', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { container } = wrap(<Shell layout="wide" onContextOpenChange={onChange} />);
    const pane = container.querySelector('.rl-agent-shell__context')!;
    expect(toggle()).toHaveAttribute('aria-pressed', 'false');
    expect(pane).not.toHaveAttribute('data-open');
    expect(pane).toHaveAttribute('aria-hidden', 'true');
    expect(screen.queryByRole('separator')).toBeNull();

    await user.click(toggle());
    expect(toggle()).toHaveAttribute('aria-pressed', 'true');
    expect(pane).toHaveAttribute('data-open');
    expect(pane).not.toHaveAttribute('aria-hidden');
    expect(screen.getByRole('separator', { name: '调整详情面板宽度' })).toBeInTheDocument();
    expect(onChange).toHaveBeenLastCalledWith(true, 'toggle');

    await user.click(toggle());
    expect(toggle()).toHaveAttribute('aria-pressed', 'false');
    expect(onChange).toHaveBeenLastCalledWith(false, 'toggle');
  });

  it('controlled contextOpen: the toggle only requests; the parent decides', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { container, rerender } = wrap(<Shell layout="wide" contextOpen={false} onContextOpenChange={onChange} />);
    await user.click(toggle());
    expect(onChange).toHaveBeenCalledWith(true, 'toggle');
    expect(toggle()).toHaveAttribute('aria-pressed', 'false');
    expect(container.querySelector('.rl-agent-shell__context')).not.toHaveAttribute('data-open');
    rerender(
      <RhineProvider>
        <Shell layout="wide" contextOpen onContextOpenChange={onChange} />
      </RhineProvider>,
    );
    expect(toggle()).toHaveAttribute('aria-pressed', 'true');
    expect(container.querySelector('.rl-agent-shell__context')).toHaveAttribute('data-open');
  });

  it('closing the inline pane from inside returns focus to the toggle', async () => {
    const user = userEvent.setup();
    wrap(<Shell layout="wide" />);
    await user.click(toggle());
    const close = screen.getByRole('button', { name: '关闭详情面板' });
    await user.click(close);
    expect(toggle()).toHaveAttribute('aria-pressed', 'false');
    expect(toggle()).toHaveFocus();
  });

  it.each<AgentShellLayout>(['compact', 'narrow'])('layout="%s": the pane opens as a sheet without its own close button', async (layout) => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { container } = wrap(<Shell layout={layout} onContextOpenChange={onChange} />);
    expect(container.querySelector('.rl-agent-shell__context')).toBeNull();
    expect(screen.queryByRole('complementary')).toBeNull();
    // The modal sheet hides the background from the a11y tree, so keep a reference.
    const button = toggle();
    await user.click(button);
    const sheet = await screen.findByRole('dialog', { name: '上下文详情' });
    const pane = within(sheet).getByRole('complementary', { name: '上下文详情' });
    expect(pane).toHaveAttribute('data-presentation', 'sheet');
    expect(within(sheet).queryByRole('button', { name: '关闭详情面板' })).toBeNull();
    expect(within(sheet).getByRole('tab', { name: '摘要' })).toBeInTheDocument();
    expect(button).toHaveAttribute('aria-pressed', 'true');
    // The Drawer has its own close button; dismissing it reports 'dismiss'.
    await user.keyboard('{Escape}');
    await waitFor(() => expect(button).toHaveAttribute('aria-pressed', 'false'));
    expect(onChange).toHaveBeenLastCalledWith(false, 'dismiss');
  });

  it('two instances keep separate ids and state', async () => {
    const user = userEvent.setup();
    const { container } = wrap(
      <>
        <Shell layout="wide" mainLabel="对话 A" />
        <Shell layout="wide" mainLabel="对话 B" />
      </>,
    );
    const ids = Array.from(container.querySelectorAll('[id]')).map((el) => el.id);
    expect(ids.length).toBeGreaterThan(0);
    expect(new Set(ids).size).toBe(ids.length);
    const a = screen.getByRole('region', { name: '对话 A' });
    const b = screen.getByRole('region', { name: '对话 B' });
    await user.click(within(a).getByRole('button', { name: '详情面板' }));
    expect(within(a).getByRole('button', { name: '详情面板' })).toHaveAttribute('aria-pressed', 'true');
    expect(within(b).getByRole('button', { name: '详情面板' })).toHaveAttribute('aria-pressed', 'false');
    expect(container.querySelectorAll('.rl-agent-shell__context[data-open]')).toHaveLength(1);
  });

  it('without a context slot the header has no toggle', () => {
    wrap(<Shell layout="wide" context={undefined} />);
    expect(screen.queryByRole('button', { name: '详情面板' })).toBeNull();
  });
});
describe('ResizeHandle', () => {
  function Controlled(props: { onSize?: (n: number) => void; dir?: 'rtl' }) {
    const [size, setSize] = React.useState(320);
    return (
      <div dir={props.dir}>
        <ResizeHandle
          size={size}
          onSizeChange={(n) => {
            setSize(n);
            props.onSize?.(n);
          }}
          min={200}
          max={480}
          resetSize={320}
        />
      </div>
    );
  }
  const sep = () => screen.getByRole('separator', { name: '调整详情面板宽度' });

  it('is a focusable vertical separator with value, range and text', () => {
    wrap(<ResizeHandle defaultSize={300} min={200} max={480} />);
    expect(sep()).toHaveAttribute('aria-orientation', 'vertical');
    expect(sep()).toHaveAttribute('aria-valuenow', '300');
    expect(sep()).toHaveAttribute('aria-valuemin', '200');
    expect(sep()).toHaveAttribute('aria-valuemax', '480');
    expect(sep()).toHaveAttribute('aria-valuetext', '宽度 300 像素');
    expect(sep().tabIndex).toBe(0);
  });

  it('← grows a pane at the inline end, → shrinks it; Shift uses the large step', async () => {
    const user = userEvent.setup();
    wrap(<Controlled />);
    act(() => sep().focus());
    await user.keyboard('{ArrowLeft}');
    expect(sep()).toHaveAttribute('aria-valuenow', '336');
    await user.keyboard('{ArrowRight}{ArrowRight}');
    expect(sep()).toHaveAttribute('aria-valuenow', '304');
    await user.keyboard('{Shift>}{ArrowLeft}{/Shift}');
    expect(sep()).toHaveAttribute('aria-valuenow', '368');
  });

  it('pane="start" and rtl flip the arrow direction', async () => {
    const user = userEvent.setup();
    const { unmount } = wrap(<ResizeHandle defaultSize={300} min={200} max={480} pane="start" />);
    act(() => sep().focus());
    await user.keyboard('{ArrowRight}');
    expect(sep()).toHaveAttribute('aria-valuenow', '316');
    unmount();
    wrap(<Controlled dir="rtl" />);
    act(() => sep().focus());
    await user.keyboard('{ArrowRight}');
    expect(sep()).toHaveAttribute('aria-valuenow', '336');
  });

  it('Home / End jump to min / max; values clamp at both ends', async () => {
    const user = userEvent.setup();
    const onSize = vi.fn();
    wrap(<Controlled onSize={onSize} />);
    act(() => sep().focus());
    await user.keyboard('{End}');
    expect(sep()).toHaveAttribute('aria-valuenow', '480');
    await user.keyboard('{Shift>}{ArrowLeft}{/Shift}');
    expect(sep()).toHaveAttribute('aria-valuenow', '480');
    await user.keyboard('{Home}');
    expect(sep()).toHaveAttribute('aria-valuenow', '200');
    await user.keyboard('{ArrowRight}');
    expect(sep()).toHaveAttribute('aria-valuenow', '200');
    expect(onSize.mock.calls.map(([n]) => n)).toEqual([480, 200]);
  });

  it('an out-of-range size is clamped for display', () => {
    wrap(<ResizeHandle size={900} min={200} max={480} />);
    expect(sep()).toHaveAttribute('aria-valuenow', '480');
  });

  it('double-click resets to resetSize', async () => {
    const user = userEvent.setup();
    wrap(<Controlled />);
    act(() => sep().focus());
    await user.keyboard('{End}');
    await user.dblClick(sep());
    expect(sep()).toHaveAttribute('aria-valuenow', '320');
  });

  it('pointer drag follows the pointer', () => {
    wrap(<Controlled />);
    const el = sep();
    fireEvent.pointerDown(el, { button: 0, pointerId: 1, clientX: 500 });
    expect(el).toHaveAttribute('data-dragging');
    fireEvent.pointerMove(el, { pointerId: 1, clientX: 460 });
    expect(el).toHaveAttribute('aria-valuenow', '360');
    fireEvent.pointerUp(el, { pointerId: 1 });
    expect(el).not.toHaveAttribute('data-dragging');
  });

  it('disabled: not focusable and ignores keys', async () => {
    const user = userEvent.setup();
    wrap(<ResizeHandle defaultSize={300} min={200} max={480} disabled />);
    expect(sep()).toHaveAttribute('aria-disabled', 'true');
    expect(sep().tabIndex).toBe(-1);
    act(() => sep().focus());
    await user.keyboard('{End}');
    expect(sep()).toHaveAttribute('aria-valuenow', '300');
  });
});

describe('AgentHeader', () => {
  it('back only with onBack; rename only with onRename', async () => {
    const user = userEvent.setup();
    const onBack = vi.fn();
    const onRename = vi.fn();
    const { rerender } = wrap(<AgentHeader title="海洋样本" />);
    expect(screen.queryByRole('button', { name: '返回上级对话' })).toBeNull();
    expect(screen.queryByRole('button', { name: '重命名对话' })).toBeNull();
    rerender(
      <RhineProvider>
        <AgentHeader title="海洋样本" onBack={onBack} onRename={onRename} />
      </RhineProvider>,
    );
    await user.click(screen.getByRole('button', { name: '返回上级对话' }));
    await user.click(screen.getByRole('button', { name: '重命名对话' }));
    expect(onBack).toHaveBeenCalledTimes(1);
    expect(onRename).toHaveBeenCalledTimes(1);
  });

  it('pending disables rename only', () => {
    wrap(<AgentHeader title="海洋样本" onBack={() => {}} onRename={() => {}} pending />);
    expect(screen.getByRole('button', { name: '重命名对话' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '返回上级对话' })).toBeEnabled();
  });

  it('the context toggle keeps a stable name and reports state with aria-pressed', async () => {
    const user = userEvent.setup();
    function Harness() {
      const [open, setOpen] = React.useState(false);
      return <AgentHeader title="海洋样本" contextOpen={open} onToggleContext={() => setOpen((v) => !v)} />;
    }
    wrap(<Harness />);
    expect(toggle()).toHaveAttribute('aria-pressed', 'false');
    await user.click(toggle());
    expect(toggle()).toHaveAttribute('aria-pressed', 'true');
  });

  it('no toggle outside a shell without onToggleContext', () => {
    wrap(<AgentHeader title="海洋样本" />);
    expect(screen.queryByRole('button', { name: '详情面板' })).toBeNull();
  });

  it.each([
    ['reconnecting', '正在重新连接'],
    ['stale', '数据可能过期'],
    ['offline', '已离线'],
    ['unknown', '同步状态未知'],
  ] as const)('sync %s shows a chip with text', (sync, text) => {
    const { container } = wrap(<AgentHeader title="海洋样本" syncStatus={sync} />);
    const chip = container.querySelector('.rl-agent-header__sync')!;
    expect(chip).toHaveAttribute('data-sync', sync);
    expect(chip).toHaveTextContent(text);
  });

  it('sync live shows no chip; no runStatus shows no run pill', () => {
    const { container } = wrap(<AgentHeader title="海洋样本" syncStatus="live" />);
    expect(container.querySelector('.rl-agent-header__sync')).toBeNull();
    expect(container.querySelector('.rl-agent-header__status')).toBeNull();
    expect(container.querySelector('.rl-agent-header__meta')).toBeNull();
  });

  it('run status shows the phase while active and the run label otherwise', () => {
    const { container, rerender } = wrap(<AgentHeader title="海洋样本" runStatus="running" runPhase="executing-tool" />);
    expect(container.querySelector('.rl-agent-header__status')).toHaveTextContent('执行工具');
    rerender(
      <RhineProvider>
        <AgentHeader title="海洋样本" runStatus="waiting" runPhase="waiting-approval" />
      </RhineProvider>,
    );
    expect(container.querySelector('.rl-agent-header__status')).toHaveTextContent('等待批准');
    expect(container.querySelector('.rl-agent-header__status [data-glyph="approval"]')).not.toBeNull();
    rerender(
      <RhineProvider>
        <AgentHeader title="海洋样本" runStatus="completed" />
      </RhineProvider>,
    );
    expect(container.querySelector('.rl-agent-header__status')).toHaveAttribute('data-run', 'completed');
  });

  it('a long title stays complete in the heading text and title attribute', () => {
    const long = '酶结构比对：一个非常非常长的中文标题用于验证单行截断与状态和操作不被挤压（示例）';
    wrap(<AgentHeader title={long} headingLevel={3} onToggleContext={() => {}} />);
    const heading = screen.getByRole('heading', { level: 3, name: long });
    expect(heading).toHaveAttribute('title', long);
    expect(heading).toHaveTextContent(long);
  });

  it('empty title falls back to the untitled label', () => {
    wrap(<AgentHeader title="   " />);
    expect(screen.getByRole('heading', { level: 2, name: '未命名对话' })).toBeInTheDocument();
  });

  it('sub-agent origin: badge, origin button, and an unknown parent fallback', async () => {
    const user = userEvent.setup();
    const onOpenOrigin = vi.fn();
    const origin = { kind: 'subagent' as const, parentId: 'c-1', parentTitle: '珊瑚礁图像分类' };
    const { rerender } = wrap(<AgentHeader title="子任务" origin={origin} onOpenOrigin={onOpenOrigin} />);
    expect(screen.getByText('子任务', { selector: '.rl-agent-header__badge' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '所属对话：珊瑚礁图像分类' }));
    expect(onOpenOrigin).toHaveBeenCalledWith(origin);
    rerender(
      <RhineProvider>
        <AgentHeader title="分支" origin={{ kind: 'fork', parentId: 'c-1' }} onOpenOrigin={onOpenOrigin} />
      </RhineProvider>,
    );
    expect(screen.getByRole('button', { name: '分支来源：上级对话' })).toBeInTheDocument();
    rerender(
      <RhineProvider>
        <AgentHeader title="分支" origin={{ kind: 'fork', parentId: 'c-1' }} />
      </RhineProvider>,
    );
    expect(screen.queryByRole('button', { name: /分支来源/ })).toBeNull();
  });

  it('identity and badges have screen-reader text', () => {
    wrap(<AgentHeader title="海洋样本" identity={{ id: 'a', name: 'Research', role: '示例 Agent' }} badges={[{ id: 't', count: 2, label: '2 个终端运行中' }]} />);
    expect(screen.getByText('智能体：Research，示例 Agent')).toBeInTheDocument();
    expect(screen.getByText('2 个终端运行中')).toBeInTheDocument();
  });
});

describe('AgentSidePane', () => {
  it('is a named complementary landmark; tabs switch and keep panels mounted', async () => {
    const user = userEvent.setup();
    const onTabChange = vi.fn();
    wrap(<AgentSidePane sections={sections} label="会话详情（示例）" onTabChange={onTabChange} />);
    const pane = screen.getByRole('complementary', { name: '会话详情（示例）' });
    expect(within(pane).getByRole('tablist', { name: '详情分类' })).toBeInTheDocument();
    expect(within(pane).getByRole('tab', { name: '摘要' })).toHaveAttribute('aria-selected', 'true');
    expect(within(pane).getByRole('tab', { name: /产物/ })).toHaveTextContent('3');
    await user.click(within(pane).getByRole('tab', { name: /产物/ }));
    expect(onTabChange).toHaveBeenCalledWith('files');
    expect(within(pane).getByRole('tab', { name: /产物/ })).toHaveAttribute('aria-selected', 'true');
    expect(within(pane).getByRole('tabpanel')).toHaveTextContent('产物内容（示例）');
    // Hidden panels stay mounted.
    expect(screen.getByText('摘要内容（示例）', { selector: 'p' })).toBeInTheDocument();
    await user.keyboard('{ArrowRight}');
    expect(within(pane).getByRole('tab', { name: '终端' })).toHaveFocus();
  });

  it('controlled activeTab', async () => {
    const user = userEvent.setup();
    const onTabChange = vi.fn();
    wrap(<AgentSidePane sections={sections} activeTab="terminal" onTabChange={onTabChange} />);
    expect(screen.getByRole('tab', { name: '终端' })).toHaveAttribute('aria-selected', 'true');
    await user.click(screen.getByRole('tab', { name: '摘要' }));
    expect(onTabChange).toHaveBeenCalledWith('summary');
    expect(screen.getByRole('tab', { name: '终端' })).toHaveAttribute('aria-selected', 'true');
  });

  it('close button only with onClose', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const { rerender } = wrap(<AgentSidePane sections={sections} />);
    expect(screen.queryByRole('button', { name: '关闭详情面板' })).toBeNull();
    rerender(
      <RhineProvider>
        <AgentSidePane sections={sections} onClose={onClose} />
      </RhineProvider>,
    );
    await user.click(screen.getByRole('button', { name: '关闭详情面板' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('one section: no tab strip, the section label is the heading', () => {
    wrap(<AgentSidePane sections={[sections[0]!]} headingLevel={3} />);
    expect(screen.queryByRole('tablist')).toBeNull();
    expect(screen.getByRole('heading', { level: 3, name: '摘要' })).toBeInTheDocument();
    expect(screen.getByRole('complementary', { name: '上下文详情' })).toBeInTheDocument();
  });

  it('hideHeading keeps the landmark name', () => {
    wrap(<AgentSidePane sections={sections} hideHeading />);
    expect(screen.queryByRole('heading')).toBeNull();
    expect(screen.getByRole('complementary', { name: '上下文详情' })).toBeInTheDocument();
  });
});

describe('AgentEmptyState', () => {
  it('defaults to the workspace copy and has no button without onCreate', () => {
    wrap(<AgentEmptyState />);
    expect(screen.getByRole('heading', { level: 2, name: '未选择会话' })).toBeInTheDocument();
    expect(screen.getByText('从会话列表选择一个会话，或新建一个。')).toBeInTheDocument();
    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.queryByRole('status')).toBeNull();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('onCreate renders the create button; custom copy and level', async () => {
    const user = userEvent.setup();
    const onCreate = vi.fn();
    wrap(<AgentEmptyState title="还没有任务（示例）" description={null} headingLevel={3} onCreate={onCreate} createLabel="新建任务" />);
    expect(screen.getByRole('heading', { level: 3, name: '还没有任务（示例）' })).toBeInTheDocument();
    expect(screen.queryByText('从会话列表选择一个会话，或新建一个。')).toBeNull();
    await user.click(screen.getByRole('button', { name: '新建任务' }));
    expect(onCreate).toHaveBeenCalledTimes(1);
  });

  it('AgentWorkspaceEmpty adds the workspace modifier', () => {
    const { container } = wrap(<AgentWorkspaceEmpty onCreate={() => {}} />);
    expect(container.querySelector('.rl-agent-empty.rl-agent-empty--workspace')).not.toBeNull();
    expect(screen.getByRole('button', { name: '新建会话' })).toBeInTheDocument();
  });
});
