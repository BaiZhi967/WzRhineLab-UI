import * as React from 'react';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MotionConfig } from 'motion/react';
import { describe, expect, it, vi } from 'vitest';
import { RhineProvider } from '@wzrhine/react';
import type { ConversationSection, ConversationView } from '@wzrhine/agent-core';
import { AgentMessagesProvider, ConversationList, ConversationRow, agentEnUS } from '../src';
import type { ConversationListProps } from '../src';
import { sampleConversations } from '../src/fixtures/session';

const wrap = (ui: React.ReactNode) => render(<RhineProvider>{ui}</RhineProvider>);
const now = new Date('2026-10-11T18:00:00+08:00');

function ListHarness(props: Partial<ConversationListProps> & { initial?: string }) {
  const { initial, onSelect, ...rest } = props;
  const [selected, setSelected] = React.useState<string | undefined>(initial);
  return (
    <ConversationList
      sections={sampleConversations}
      now={now}
      {...rest}
      selectedId={selected}
      onSelect={(id) => {
        setSelected(id);
        onSelect?.(id);
      }}
    />
  );
}

const rowButton = (name: RegExp | string) => screen.getByRole('button', { name });
const mainButtons = (root: HTMLElement = document.body) => Array.from(root.querySelectorAll<HTMLButtonElement>('.rl-agent-row__main'));

describe('ConversationRow', () => {
  const base: ConversationView = { id: 'c-1', title: '海洋样本', preview: '4 条消息', updatedAt: '2026-10-11T14:20:00+08:00' };

  it('names the main button with title, status and unread; time and preview describe it', () => {
    wrap(
      <ul>
        <ConversationRow item={{ ...base, runStatus: 'running', runPhase: 'executing-tool', unread: 2, pinned: true }} now={now} />
      </ul>,
    );
    const button = rowButton(/海洋样本/);
    expect(button).toHaveAccessibleName('海洋样本，已置顶，执行工具，2 条未读');
    expect(button).toHaveAccessibleDescription(/4 条消息/);
    expect(button.querySelector('time')).toHaveAttribute('dateTime', base.updatedAt);
    expect(button.querySelector('time')).toHaveTextContent('14:20');
    expect(button.querySelector('.rl-agent-row__title')).toHaveAttribute('title', '海洋样本');
  });

  it('shows the date for earlier days and keeps unknown runs glyph-free', () => {
    wrap(
      <ul>
        <ConversationRow item={{ ...base, updatedAt: '2026-10-01T09:00:00+08:00' }} now={now} />
      </ul>,
    );
    const button = rowButton(/海洋样本/);
    expect(button).toHaveAccessibleName('海洋样本');
    expect(button.querySelector('time')?.textContent).not.toBe('09:00');
    expect(button.querySelector('.rl-agent-glyph')).toBeNull();
  });

  it('attention wins over the run status and is spelled out', () => {
    wrap(
      <ul>
        <ConversationRow item={{ ...base, runStatus: 'waiting', runPhase: 'waiting-approval', attention: 'approval' }} now={now} />
        <ConversationRow item={{ ...base, id: 'c-2', title: '失败', runStatus: 'failed', attention: 'error' }} now={now} />
        <ConversationRow item={{ ...base, id: 'c-3', title: '完成', runStatus: 'completed' }} now={now} />
      </ul>,
    );
    expect(rowButton(/海洋样本/)).toHaveAccessibleName('海洋样本，待批准');
    expect(rowButton(/失败/)).toHaveAccessibleName('失败，出错');
    expect(rowButton(/完成/)).toHaveAccessibleName('完成');
    expect(rowButton(/海洋样本/).querySelector('[data-glyph="approval"]')).not.toBeNull();
  });

  it('running rows breathe through the loop lifecycle; reduced motion keeps them static', () => {
    const item = { ...base, runStatus: 'running' as const };
    const { unmount } = wrap(
      <ul>
        <ConversationRow item={item} now={now} />
      </ul>,
    );
    const glyph = document.querySelector('.rl-agent-row .rl-agent-glyph')!;
    expect(glyph).toHaveAttribute('data-active');
    expect(glyph).toHaveAttribute('data-loop', 'running');
    unmount();
    render(
      <MotionConfig reducedMotion="always">
        <ul>
          <ConversationRow item={item} now={now} />
        </ul>
      </MotionConfig>,
    );
    expect(document.querySelector('.rl-agent-row .rl-agent-glyph')).toHaveAttribute('data-loop-paused', 'reduced');
  });

  it('renders no menu button without callbacks (capability gating)', () => {
    wrap(
      <ul>
        <ConversationRow item={base} onSelect={() => {}} now={now} />
      </ul>,
    );
    expect(screen.queryByRole('button', { name: /操作/ })).toBeNull();
  });

  it('menu opens without selecting; pin and two-step archive', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const onPin = vi.fn();
    const onArchive = vi.fn();
    wrap(
      <ul>
        <ConversationRow item={base} onSelect={onSelect} onPin={onPin} onArchive={onArchive} now={now} />
      </ul>,
    );
    await user.click(screen.getByRole('button', { name: '海洋样本 的操作' }));
    expect(await screen.findByRole('menu')).toBeInTheDocument();
    expect(onSelect).not.toHaveBeenCalled();
    await user.click(screen.getByRole('menuitem', { name: '置顶' }));
    expect(onPin).toHaveBeenCalledWith(base, true);
    expect(onSelect).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: '海洋样本 的操作' }));
    await user.click(await screen.findByRole('menuitem', { name: '归档' }));
    expect(onArchive).not.toHaveBeenCalled();
    await user.click(await screen.findByRole('menuitem', { name: '确认归档' }));
    expect(onArchive).toHaveBeenCalledTimes(1);
    expect(onSelect).not.toHaveBeenCalled();

    // Reopening starts from the first step again.
    await user.click(screen.getByRole('button', { name: '海洋样本 的操作' }));
    expect(await screen.findByRole('menuitem', { name: '归档' })).toBeInTheDocument();
  });

  it('archived rows offer unarchive, not pin / archive', async () => {
    const user = userEvent.setup();
    const onUnarchive = vi.fn();
    wrap(
      <ul>
        <ConversationRow item={{ ...base, archived: true }} onPin={() => {}} onArchive={() => {}} onUnarchive={onUnarchive} now={now} />
      </ul>,
    );
    await user.click(screen.getByRole('button', { name: '海洋样本 的操作' }));
    const menu = await screen.findByRole('menu');
    expect(within(menu).queryByRole('menuitem', { name: '置顶' })).toBeNull();
    expect(within(menu).queryByRole('menuitem', { name: '归档' })).toBeNull();
    await user.click(within(menu).getByRole('menuitem', { name: '取消归档' }));
    expect(onUnarchive).toHaveBeenCalledTimes(1);
  });

  it('delete asks for confirmation in an AlertDialog; cancel keeps it', async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    wrap(
      <ul>
        <ConversationRow item={base} onDelete={onDelete} now={now} />
      </ul>,
    );
    await user.click(screen.getByRole('button', { name: '海洋样本 的操作' }));
    await user.click(await screen.findByRole('menuitem', { name: '删除' }));
    const dialog = await screen.findByRole('alertdialog', { name: '删除会话？' });
    expect(dialog).toHaveAccessibleDescription(/「海洋样本」及其全部消息将被删除/);
    await user.click(within(dialog).getByRole('button', { name: '取消' }));
    expect(onDelete).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: '海洋样本 的操作' }));
    await user.click(await screen.findByRole('menuitem', { name: '删除' }));
    await user.click(within(await screen.findByRole('alertdialog')).getByRole('button', { name: '删除会话' }));
    expect(onDelete).toHaveBeenCalledWith(base);
  });

  it('disabled rows cannot be selected or opened', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    wrap(
      <ul>
        <ConversationRow item={base} disabled onSelect={onSelect} onPin={() => {}} now={now} />
      </ul>,
    );
    expect(rowButton(/^海洋样本$/)).toBeDisabled();
    expect(screen.getByRole('button', { name: '海洋样本 的操作' })).toBeDisabled();
    await user.click(rowButton(/^海洋样本$/));
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('falls back to the untitled label and uses the English table', () => {
    render(
      <RhineProvider>
        <AgentMessagesProvider messages={agentEnUS}>
          <ul>
            <ConversationRow item={{ ...base, title: '  ', unread: 3 }} now={now} />
          </ul>
        </AgentMessagesProvider>
      </RhineProvider>,
    );
    expect(screen.getByRole('button', { name: 'Untitled conversation, 3 unread' })).toBeInTheDocument();
  });
});

describe('ConversationList', () => {
  it('groups rows under headings and lists, marking the selection with aria-current', () => {
    wrap(<ListHarness initial="c-coral" />);
    expect(screen.getByRole('heading', { level: 2, name: 'Pinned' })).toBeInTheDocument();
    const recent = screen.getByRole('list', { name: 'Recent' });
    expect(within(recent).getAllByRole('listitem')).toHaveLength(4);
    expect(screen.getByRole('button', { name: /珊瑚礁图像分类/ })).toHaveAttribute('aria-current', 'true');
    expect(screen.getAllByRole('button', { current: true })).toHaveLength(1);
    expect(screen.getByRole('region', { name: '会话列表' })).toBeInTheDocument();
  });

  it('honours headingLevel', () => {
    wrap(<ListHarness headingLevel={3} />);
    expect(screen.getByRole('heading', { level: 3, name: 'Recent' })).toBeInTheDocument();
  });

  it('click selects; aria-current and the single selection ghost move', async () => {
    const user = userEvent.setup();
    wrap(<ListHarness initial="c-ocean" />);
    await user.click(screen.getByRole('button', { name: /卫星影像处理/ }));
    expect(screen.getByRole('button', { name: /卫星影像处理/ })).toHaveAttribute('aria-current', 'true');
    expect(screen.getByRole('button', { name: /海洋塑料样本分析/ })).not.toHaveAttribute('aria-current');
    expect(document.querySelectorAll('.rl-agent-row__ghost')).toHaveLength(1);
  });

  it('one row is the Tab stop; arrows, Home and End move focus across groups', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    wrap(<ListHarness initial="c-coral" onSelect={onSelect} />);
    const buttons = mainButtons();
    expect(buttons.filter((b) => b.tabIndex === 0)).toHaveLength(1);
    expect(screen.getByRole('button', { name: /珊瑚礁图像分类/ }).tabIndex).toBe(0);

    await user.tab();
    expect(screen.getByRole('button', { name: /珊瑚礁图像分类/ })).toHaveFocus();
    await user.keyboard('{ArrowUp}');
    expect(screen.getByRole('button', { name: /Helix aurelia/ })).toHaveFocus();
    await user.keyboard('{ArrowDown}{ArrowDown}');
    expect(screen.getByRole('button', { name: /卫星影像处理/ })).toHaveFocus();
    await user.keyboard('{End}');
    expect(screen.getByRole('button', { name: /酶结构比对/ })).toHaveFocus();
    await user.keyboard('{Home}');
    expect(screen.getByRole('button', { name: /海洋塑料样本分析/ })).toHaveFocus();
    expect(onSelect).not.toHaveBeenCalled();
    await user.keyboard('{ArrowDown}{Enter}');
    expect(onSelect).toHaveBeenCalledWith('c-helix');
    expect(screen.getByRole('button', { name: /Helix aurelia/ })).toHaveAttribute('aria-current', 'true');
  });

  it('a background refresh keeps the selection and does not steal focus', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const { rerender } = wrap(
      <>
        <input aria-label="外部" />
        <ConversationList sections={sampleConversations} selectedId="c-lab" onSelect={onSelect} now={now} />
      </>,
    );
    await user.click(screen.getByRole('textbox', { name: '外部' }));
    const refreshed: ConversationSection[] = [
      { id: 'recent', label: 'Recent', items: [{ id: 'c-new', title: '新会话', updatedAt: now.toISOString() }, ...sampleConversations[1]!.items] },
    ];
    rerender(
      <RhineProvider>
        <input aria-label="外部" />
        <ConversationList sections={refreshed} selectedId="c-lab" onSelect={onSelect} now={now} />
      </RhineProvider>,
    );
    expect(screen.getByRole('textbox', { name: '外部' })).toHaveFocus();
    expect(screen.getByRole('button', { name: /实验报告草稿/ })).toHaveAttribute('aria-current', 'true');
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('search renders a labelled input and announces the count; search-empty uses no-results', async () => {
    const user = userEvent.setup();
    function Searchable() {
      const [q, setQ] = React.useState('');
      const sections = sampleConversations.map((s) => ({ ...s, items: s.items.filter((i) => i.title.includes(q)) }));
      return <ConversationList sections={sections} search={q} onSearchChange={setQ} now={now} />;
    }
    wrap(<Searchable />);
    const input = screen.getByRole('searchbox', { name: '搜索会话' });
    await user.type(input, '卫星');
    expect(screen.getByRole('status')).toHaveTextContent('找到 1 个会话');
    expect(screen.getAllByRole('listitem')).toHaveLength(1);
    await user.clear(input);
    await user.type(input, '不存在');
    expect(screen.getByText('没有与「不存在」匹配的会话')).toBeInTheDocument();
  });

  it('no search input without onSearchChange', () => {
    wrap(<ListHarness />);
    expect(screen.queryByRole('searchbox')).toBeNull();
  });

  it('loading, error with retry, and empty states', async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    const { rerender } = wrap(<ConversationList sections={[]} loading />);
    expect(screen.getByRole('region', { name: '会话列表' })).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByText('正在读取会话…')).toBeInTheDocument();
    rerender(
      <RhineProvider>
        <ConversationList sections={[]} error onRetry={onRetry} />
      </RhineProvider>,
    );
    expect(screen.getByText('会话列表读取失败')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '重试' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
    rerender(
      <RhineProvider>
        <ConversationList sections={[{ id: 'x', label: 'X', items: [] }]} />
      </RhineProvider>,
    );
    expect(screen.getByRole('heading', { name: '还没有会话' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'X' })).toBeNull();
  });

  it('renderActions adds per-row controls; disabled rows are skipped by arrows', async () => {
    const user = userEvent.setup();
    wrap(
      <ListHarness
        initial="c-ocean"
        isDisabled={(item) => item.id === 'c-helix'}
        renderActions={(item) => <button type="button">{`打开 ${item.id}`}</button>}
      />,
    );
    expect(screen.getByRole('button', { name: '打开 c-coral' })).toBeInTheDocument();
    await user.tab();
    expect(screen.getByRole('button', { name: /海洋塑料样本分析/ })).toHaveFocus();
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('button', { name: /珊瑚礁图像分类/ })).toHaveFocus();
  });

  it('two lists keep separate ids and ghosts', async () => {
    const user = userEvent.setup();
    wrap(
      <>
        <ListHarness initial="c-ocean" label="列表 A" />
        <ListHarness initial="c-lab" label="列表 B" />
      </>,
    );
    const a = screen.getByRole('region', { name: '列表 A' });
    const b = screen.getByRole('region', { name: '列表 B' });
    const headingIds = Array.from(document.querySelectorAll('.rl-agent-list__heading')).map((h) => h.id);
    expect(new Set(headingIds).size).toBe(headingIds.length);
    await user.click(within(a).getByRole('button', { name: /卫星影像处理/ }));
    expect(within(a).getByRole('button', { name: /卫星影像处理/ })).toHaveAttribute('aria-current', 'true');
    expect(within(b).getByRole('button', { name: /实验报告草稿/ })).toHaveAttribute('aria-current', 'true');
    expect(a.querySelectorAll('.rl-agent-row__ghost')).toHaveLength(1);
    expect(b.querySelectorAll('.rl-agent-row__ghost')).toHaveLength(1);
  });

  it('renders 300 rows with one ghost and keeps arrow navigation working', async () => {
    const items: ConversationView[] = Array.from({ length: 300 }, (_, i) => ({ id: `c-${i}`, title: `示例会话 ${i}`, runStatus: i % 50 === 0 ? 'running' : 'completed' }));
    const user = userEvent.setup();
    wrap(<ListHarness sections={[{ id: 'all', label: 'All', items }]} initial="c-10" />);
    expect(mainButtons()).toHaveLength(300);
    expect(document.querySelectorAll('.rl-agent-row__ghost')).toHaveLength(1);
    await user.tab();
    await user.keyboard('{End}');
    expect(screen.getByRole('button', { name: /^示例会话 299/ })).toHaveFocus();
  });

  it('under reduced motion the ghost still renders and selection is immediate', async () => {
    const user = userEvent.setup();
    render(
      <MotionConfig reducedMotion="always">
        <RhineProvider>
          <ListHarness initial="c-ocean" />
        </RhineProvider>
      </MotionConfig>,
    );
    await user.click(screen.getByRole('button', { name: /实验报告草稿/ }));
    const row = screen.getByRole('button', { name: /实验报告草稿/ }).closest('li')!;
    expect(row.querySelector('.rl-agent-row__ghost')).not.toBeNull();
  });

  it('moves focus to a neighbour when the focused row is removed by a refresh', async () => {
    function Removable() {
      const [sections, setSections] = React.useState(sampleConversations);
      return (
        <>
          <ConversationList sections={sections} now={now} />
          <button
            type="button"
            onClick={() => setSections([{ id: 'recent', label: 'Recent', items: sampleConversations[1]!.items.filter((i) => i.id !== 'c-sat') }])}
          >
            刷新
          </button>
        </>
      );
    }
    wrap(<Removable />);
    const target = screen.getByRole('button', { name: /卫星影像处理/ });
    act(() => target.focus());
    // Simulate the refresh removing the focused row (focus drops to body).
    act(() => {
      target.blur();
      fireEvent.click(screen.getByRole('button', { name: '刷新' }));
      (document.activeElement as HTMLElement | null)?.blur();
    });
    await waitFor(() => expect(document.activeElement?.classList.contains('rl-agent-row__main')).toBe(true));
  });
});
