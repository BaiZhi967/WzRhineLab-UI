import * as React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Button, CommandPalette, MenuItem, RhineProvider, ScrollArea, SplitButton, enUS, zhCN } from '../src';
import type { CommandItem } from '../src';

/** M12 gap closure (ADR-0010 §2): SplitButton, ScrollArea, CommandPalette async mode. */

describe('SplitButton', () => {
  function Harness(props: Partial<React.ComponentProps<typeof SplitButton>>) {
    return (
      <RhineProvider motion="reduce">
        <SplitButton label="导出 CSV" menuLabel="更多导出格式" {...props}>
          <MenuItem>导出 JSON</MenuItem>
          <MenuItem>导出 PDF</MenuItem>
        </SplitButton>
      </RhineProvider>
    );
  }

  it('is a named group of two real buttons', () => {
    render(<Harness />);
    const group = screen.getByRole('group', { name: '导出 CSV' });
    const buttons = within(group).getAllByRole('button');
    expect(buttons).toHaveLength(2);
    expect(buttons.map((b) => b.tagName)).toEqual(['BUTTON', 'BUTTON']);
    expect(buttons[0]).toHaveAccessibleName('导出 CSV');
    expect(buttons[1]).toHaveAccessibleName('更多导出格式');
    expect(buttons[1]).toHaveAttribute('aria-haspopup', 'menu');
    expect(buttons[1]).toHaveAttribute('aria-expanded', 'false');
    expect(group).toHaveAttribute('data-variant', 'primary');
  });

  it('the main part runs onClick; the toggle opens the menu without running it', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    const onJson = vi.fn();
    render(
      <RhineProvider motion="reduce">
        <SplitButton label="导出 CSV" menuLabel="更多导出格式" onClick={onClick}>
          <MenuItem onSelect={onJson}>导出 JSON</MenuItem>
        </SplitButton>
      </RhineProvider>,
    );
    await user.click(screen.getByRole('button', { name: '导出 CSV' }));
    expect(onClick).toHaveBeenCalledTimes(1);
    await user.click(screen.getByRole('button', { name: '更多导出格式' }));
    await user.click(await screen.findByRole('menuitem', { name: '导出 JSON' }));
    expect(onJson).toHaveBeenCalledTimes(1);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('keyboard: Tab reaches both halves; Enter on the toggle opens the menu, Escape returns focus', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.tab();
    expect(screen.getByRole('button', { name: '导出 CSV' })).toHaveFocus();
    await user.tab();
    const toggle = screen.getByRole('button', { name: '更多导出格式' });
    expect(toggle).toHaveFocus();
    await user.keyboard('{Enter}');
    const menu = await screen.findByRole('menu');
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(within(menu).getAllByRole('menuitem')).toHaveLength(2);
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('menu')).toBeNull());
    expect(toggle).toHaveFocus();
  });

  it('disabled disables both; loading keeps both focusable, the main busy, and the menu closed', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<Harness disabled />);
    for (const b of screen.getAllByRole('button')) expect(b).toBeDisabled();
    rerender(<Harness loading />);
    const main = screen.getByRole('button', { name: '导出 CSV' });
    expect(main).not.toBeDisabled();
    expect(main).toHaveAttribute('aria-busy', 'true');
    expect(main).toHaveAttribute('aria-disabled', 'true');
    const toggle = screen.getByRole('button', { name: '更多导出格式' });
    expect(toggle).not.toBeDisabled();
    expect(toggle).toHaveAttribute('aria-disabled', 'true');
    toggle.focus();
    await user.keyboard('{Enter}');
    await user.click(toggle);
    expect(screen.queryByRole('menu')).toBeNull();
    expect(toggle).toHaveFocus();
  });

  it('a menu item that starts loading keeps focus on the toggle', async () => {
    const user = userEvent.setup();
    function Busy() {
      const [loading, setLoading] = React.useState(false);
      return (
        <RhineProvider motion="reduce">
          <SplitButton label="导出 CSV" menuLabel="更多导出格式" loading={loading}>
            <MenuItem onSelect={() => setLoading(true)}>导出 JSON</MenuItem>
          </SplitButton>
        </RhineProvider>
      );
    }
    render(<Busy />);
    const toggle = screen.getByRole('button', { name: '更多导出格式' });
    toggle.focus();
    await user.keyboard('{Enter}');
    await screen.findByRole('menu');
    await user.keyboard('{Enter}');
    await waitFor(() => expect(screen.queryByRole('menu')).toBeNull());
    expect(toggle).toHaveAttribute('aria-disabled', 'true');
    await waitFor(() => expect(toggle).toHaveFocus());
  });

  it('passes variant and size to both halves', () => {
    render(<Harness variant="secondary" size="sm" />);
    const [main, toggle] = screen.getAllByRole('button');
    expect(main).toHaveAttribute('data-variant', 'secondary');
    expect(main).toHaveAttribute('data-size', 'sm');
    expect(toggle).toHaveAttribute('data-variant', 'secondary');
    expect(toggle).toHaveAttribute('data-size', 'sm');
  });
});

describe('ScrollArea', () => {
  const lines = Array.from({ length: 40 }, (_, i) => <p key={i}>示例日志行 {i + 1}</p>);

  it('the viewport is a named region and the native scroller', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(
      <ScrollArea label="运行日志" maxHeight="10rem" viewportRef={ref}>
        {lines}
      </ScrollArea>,
    );
    const region = screen.getByRole('region', { name: '运行日志' });
    expect(ref.current).toBe(region);
    expect(region).toHaveClass('rl-scroll-area__viewport');
    expect(region.style.overflow).toBe('scroll');
    // Vertical-only areas do not grow a horizontal scroller.
    expect(region.style.overflowX).toBe('hidden');
    expect(region.closest('.rl-scroll-area')).toHaveAttribute('style', expect.stringContaining('--rl-scroll-area-max-height: 10rem'));
    expect(within(region).getByText('示例日志行 40')).toBeInTheDocument();
  });

  it('only overflowing viewports join the tab order (jsdom has no layout, so it reports no overflow)', () => {
    render(<ScrollArea label="短列表">短内容</ScrollArea>);
    expect(screen.getByRole('region', { name: '短列表' })).toHaveAttribute('tabindex', '-1');
  });

  it('orientation="both" keeps horizontal scrolling', () => {
    render(
      <ScrollArea label="宽表格" orientation="both">
        {lines}
      </ScrollArea>,
    );
    const region = screen.getByRole('region', { name: '宽表格' });
    expect(region.style.overflowX).toBe('');
    expect(region.closest('.rl-scroll-area')).toHaveAttribute('data-orientation', 'both');
  });

  it('onScrollIntentUp: wheel up and up keys report intent; wheel down / other keys do not', () => {
    const onUp = vi.fn();
    render(
      <ScrollArea label="消息" onScrollIntentUp={onUp}>
        {lines}
      </ScrollArea>,
    );
    const region = screen.getByRole('region', { name: '消息' });
    fireEvent.wheel(region, { deltaY: 120 });
    expect(onUp).not.toHaveBeenCalled();
    fireEvent.wheel(region, { deltaY: -120 });
    expect(onUp).toHaveBeenCalledTimes(1);
    fireEvent.keyDown(region, { key: 'ArrowDown' });
    fireEvent.keyDown(region, { key: 'End' });
    expect(onUp).toHaveBeenCalledTimes(1);
    fireEvent.keyDown(region, { key: 'ArrowUp' });
    fireEvent.keyDown(region, { key: 'PageUp' });
    fireEvent.keyDown(region, { key: 'Home' });
    fireEvent.keyDown(region, { key: ' ', shiftKey: true });
    expect(onUp).toHaveBeenCalledTimes(5);
    // Keys inside focusable children belong to them (e.g. a textarea in the log).
    fireEvent.keyDown(within(region).getByText('示例日志行 1'), { key: 'ArrowUp' });
    expect(onUp).toHaveBeenCalledTimes(5);
  });

  it('native onScroll reaches the caller', () => {
    const onScroll = vi.fn();
    render(
      <ScrollArea label="消息" onScroll={onScroll}>
        {lines}
      </ScrollArea>,
    );
    fireEvent.scroll(screen.getByRole('region', { name: '消息' }));
    expect(onScroll).toHaveBeenCalledTimes(1);
  });
});

const commands: CommandItem[] = [
  { id: 'open', label: '打开记录', group: '记录', icon: <svg data-testid="cmd-icon" />, meta: 'ARC-1024' },
  { id: 'export', label: '导出当前档案', group: '记录' },
];

describe('CommandPalette async mode', () => {
  it('default behaviour is unchanged: local filter, no status text', async () => {
    const user = userEvent.setup();
    render(
      <RhineProvider motion="reduce">
        <CommandPalette defaultOpen commands={commands} onSelect={() => undefined} />
      </RhineProvider>,
    );
    const input = await screen.findByRole('combobox', { name: '搜索命令' });
    await user.type(input, '导出');
    expect(screen.getAllByRole('option')).toHaveLength(1);
    expect(document.querySelector('.rl-command__status')).toBeEmptyDOMElement();
    expect(screen.getByRole('listbox')).not.toHaveAttribute('aria-busy');
  });

  it('controlled query: typing calls onQueryChange, filter={null} shows server results verbatim, loading row + busy list', async () => {
    const user = userEvent.setup();
    const seen: string[] = [];
    function Remote() {
      const [query, setQuery] = React.useState('');
      const results: CommandItem[] = query === 'zz' ? [{ id: 'srv', label: '服务端结果', meta: '远程' }] : [];
      return (
        <RhineProvider motion="reduce">
          <CommandPalette
            defaultOpen
            commands={results}
            filter={null}
            loading={query === 'z'}
            query={query}
            onQueryChange={(next) => {
              seen.push(next);
              setQuery(next);
            }}
            onSelect={() => undefined}
          />
        </RhineProvider>
      );
    }
    render(<Remote />);
    const input = await screen.findByRole('combobox', { name: '搜索命令' });
    await user.type(input, 'z');
    expect(seen).toEqual(['z']);
    const status = document.querySelector('.rl-command__status')!;
    expect(status).toHaveTextContent('正在搜索命令…');
    expect(screen.getByRole('listbox', { hidden: true })).toHaveAttribute('aria-busy', 'true');
    // The empty text waits while loading.
    expect(document.querySelector('.rl-command__empty')).toBeEmptyDOMElement();
    await user.type(input, 'z');
    expect(seen).toEqual(['z', 'zz']);
    // The label does not contain "zz" but filter={null} keeps it.
    const option = await screen.findByRole('option', { name: /服务端结果/ });
    expect(option).toHaveTextContent('远程');
    expect(status).toBeEmptyDOMElement();
  });

  it('opening resets a controlled query through onQueryChange', async () => {
    const user = userEvent.setup();
    const onQueryChange = vi.fn();
    render(
      <RhineProvider motion="reduce">
        <CommandPalette commands={commands} query="旧查询" onQueryChange={onQueryChange} onSelect={() => undefined} trigger={<Button>打开</Button>} />
      </RhineProvider>,
    );
    await user.click(screen.getByRole('button', { name: '打开' }));
    expect(onQueryChange).toHaveBeenCalledWith('');
  });

  it('icon is decorative and meta is shown after the label', async () => {
    render(
      <RhineProvider motion="reduce">
        <CommandPalette defaultOpen commands={commands} onSelect={() => undefined} />
      </RhineProvider>,
    );
    const option = await screen.findByRole('option', { name: /打开记录/ });
    expect(option).toHaveAttribute('data-icon');
    expect(within(option).getByTestId('cmd-icon').parentElement).toHaveAttribute('aria-hidden', 'true');
    expect(within(option).getByText('ARC-1024')).toHaveClass('rl-command__meta');
  });

  it('loadingText overrides the copy; enUS has its own text', async () => {
    const { unmount } = render(
      <RhineProvider motion="reduce">
        <CommandPalette defaultOpen commands={[]} loading loadingText="查询中" onSelect={() => undefined} />
      </RhineProvider>,
    );
    await screen.findByRole('dialog');
    expect(document.querySelector('.rl-command__status')).toHaveTextContent('查询中');
    unmount();
    render(
      <RhineProvider motion="reduce" messages={enUS}>
        <CommandPalette defaultOpen commands={[]} loading onSelect={() => undefined} />
      </RhineProvider>,
    );
    await screen.findByRole('dialog');
    expect(document.querySelector('.rl-command__status')).toHaveTextContent('Searching commands…');
    expect(zhCN.commandPalette.loading).toBe('正在搜索命令…');
  });
});
