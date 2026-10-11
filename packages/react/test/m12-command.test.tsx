import * as React from 'react';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Button, Combobox, CommandPalette, FileDropZone, RhineProvider, enUS, matchHotkey, matchesAccept, validateFiles } from '../src';
import type { CommandItem, ComboboxOption } from '../src';

/** M12 group 2 (ADR-0010 §2): Combobox, CommandPalette, FileDropZone. */

const categories: ComboboxOption[] = [
  { value: 'exp', label: '实验记录', group: '记录' },
  { value: 'obs', label: '观测日志', group: '记录', description: '按日归档' },
  { value: 'spec', label: '样本档案', group: '样本' },
  { value: 'locked', label: '封存样本', group: '样本', disabled: true },
];

describe('Combobox', () => {
  it('labels the input and wires combobox / listbox semantics', async () => {
    const user = userEvent.setup();
    render(<Combobox label="档案类别" description="可输入关键字筛选" items={categories} />);
    const input = screen.getByRole('combobox', { name: '档案类别' });
    expect(input.tagName).toBe('INPUT');
    expect(input).toHaveAccessibleDescription('可输入关键字筛选');
    expect(input).toHaveAttribute('aria-expanded', 'false');
    await user.click(input);
    const listbox = await screen.findByRole('listbox');
    expect(input).toHaveAttribute('aria-expanded', 'true');
    expect(within(listbox).getAllByRole('option')).toHaveLength(4);
    // Groups are labelled by their heading.
    expect(within(listbox).getByRole('group', { name: '记录' })).toBeInTheDocument();
    expect(within(listbox).getByRole('group', { name: '样本' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /封存样本/ })).toHaveAttribute('aria-disabled', 'true');
  });

  it('filters while typing, then ArrowDown + Enter selects and the input shows the label', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Combobox label="档案类别" items={categories} onValueChange={onValueChange} />);
    const input = screen.getByRole('combobox', { name: '档案类别' });
    await user.type(input, '样本');
    const options = await screen.findAllByRole('option');
    expect(options.map((o) => o.textContent)).toEqual(['样本档案', '封存样本']);
    expect(screen.queryByRole('group', { name: '记录' })).toBeNull();
    await user.keyboard('{ArrowDown}');
    expect(input.getAttribute('aria-activedescendant')).toBe(options[0]!.id);
    await user.keyboard('{Enter}');
    expect(onValueChange).toHaveBeenLastCalledWith('spec');
    expect(input).toHaveValue('样本档案');
    await waitFor(() => expect(screen.queryByRole('listbox')).toBeNull());
  });

  it('disabled options stay visible (aria-disabled) and cannot be selected', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Combobox label="档案类别" items={categories} onValueChange={onValueChange} />);
    const input = screen.getByRole('combobox', { name: '档案类别' });
    await user.type(input, '封存');
    await user.click(await screen.findByRole('option', { name: '封存样本' }));
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('shows the empty text, and Escape closes the list', async () => {
    const user = userEvent.setup();
    render(<Combobox label="档案类别" items={categories} emptyText="无匹配类别" />);
    const input = screen.getByRole('combobox', { name: '档案类别' });
    await user.type(input, 'zzz');
    expect(await screen.findByText('无匹配类别')).toBeInTheDocument();
    await user.keyboard('{Escape}');
    await waitFor(() => expect(input).toHaveAttribute('aria-expanded', 'false'));
  });

  it('does not select while an IME composition is in progress', async () => {
    const onValueChange = vi.fn();
    render(<Combobox label="档案类别" items={categories} onValueChange={onValueChange} />);
    const input = screen.getByRole('combobox', { name: '档案类别' });
    await userEvent.setup().click(input);
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    await waitFor(() => expect(input.getAttribute('aria-activedescendant')).toBeTruthy());
    fireEvent.compositionStart(input);
    fireEvent.keyDown(input, { key: 'Enter', keyCode: 229, isComposing: true });
    expect(onValueChange).not.toHaveBeenCalled();
    fireEvent.compositionEnd(input);
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onValueChange).toHaveBeenCalledTimes(1);
  });

  it('submits the selected value under `name` and supports controlled value', async () => {
    function Controlled() {
      const [value, setValue] = React.useState<string | null>('obs');
      return (
        <form data-testid="form">
          <Combobox label="档案类别" name="category" items={categories} value={value} onValueChange={setValue} />
          <output>{String(value)}</output>
        </form>
      );
    }
    render(<Controlled />);
    const form = screen.getByTestId('form') as HTMLFormElement;
    expect(new FormData(form).get('category')).toBe('obs');
    expect(screen.getByRole('combobox', { name: '档案类别' })).toHaveValue('观测日志');
    await userEvent.setup().click(screen.getByRole('button', { name: '清除选择' }));
    expect(document.querySelector('output')).toHaveTextContent('null');
    expect(new FormData(form).get('category')).toBe('');
  });

  it('async: filter={null} keeps server results, loading shows a status row and marks the list busy', async () => {
    const user = userEvent.setup();
    function Remote() {
      const [query, setQuery] = React.useState('');
      const [loading, setLoading] = React.useState(false);
      const items = query === 'zz' ? [{ value: 'srv', label: '服务端结果' }] : [];
      return (
        <Combobox
          label="远程检索"
          items={items}
          filter={null}
          loading={loading}
          inputValue={query}
          onInputValueChange={(next) => {
            setQuery(next);
            setLoading(next !== 'zz');
          }}
        />
      );
    }
    render(<Remote />);
    const input = screen.getByRole('combobox', { name: '远程检索' });
    await user.type(input, 'z');
    const popup = await screen.findByText('正在搜索…');
    expect(popup.closest('[aria-busy="true"]')).not.toBeNull();
    // The empty text is withheld while loading.
    expect(screen.queryByText('没有匹配的选项')).toBeNull();
    await user.type(input, 'z');
    // The server result does not contain "zz" but filter={null} keeps it.
    expect(await screen.findByRole('option', { name: '服务端结果' })).toBeInTheDocument();
    expect(screen.queryByText('正在搜索…')).toBeNull();
  });

  it('invalid + error marks the input and describes it; disabled disables input and buttons', () => {
    const { rerender } = render(<Combobox label="档案类别" items={categories} invalid error="请选择类别" />);
    const input = screen.getByRole('combobox', { name: '档案类别' });
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription(expect.stringContaining('请选择类别'));
    rerender(<Combobox label="档案类别" items={categories} disabled />);
    expect(screen.getByRole('combobox', { name: '档案类别' })).toBeDisabled();
    expect(document.querySelector('.rl-combobox')).toHaveAttribute('data-disabled');
  });

  it('copy comes from the message table', async () => {
    render(
      <RhineProvider messages={enUS}>
        <Combobox label="Category" items={categories} defaultValue="exp" />
      </RhineProvider>,
    );
    expect(screen.getByRole('button', { name: 'Clear selection' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Show options' })).toBeInTheDocument();
  });
});

const commands: CommandItem[] = [
  { id: 'new', label: '新建实验记录', group: '记录', shortcut: 'Ctrl N', keywords: ['create'] },
  { id: 'export', label: '导出档案', group: '记录', description: '导出为 CSV' },
  { id: 'purge', label: '清除缓存', group: '系统', disabled: true, disabledReason: '需要管理员权限' },
  { id: 'theme', label: '切换主题', group: '系统' },
];

describe('CommandPalette', () => {
  function Harness(props: Partial<React.ComponentProps<typeof CommandPalette>> & { onRun?: (c: CommandItem) => boolean | void }) {
    const { onRun = () => undefined, ...rest } = props;
    return (
      <RhineProvider motion="reduce">
        <CommandPalette commands={commands} onSelect={onRun} trigger={<Button>打开命令面板</Button>} {...rest} />
      </RhineProvider>
    );
  }

  it('opens from the trigger as a named modal dialog with focus in the input', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole('button', { name: '打开命令面板' }));
    const dialog = await screen.findByRole('dialog', { name: '命令面板' });
    const input = within(dialog).getByRole('combobox', { name: '搜索命令' });
    await waitFor(() => expect(input).toHaveFocus());
    expect(input).toHaveAccessibleDescription('↑ ↓ 选择，Enter 执行，Esc 关闭');
    expect(within(dialog).getByRole('group', { name: '记录' })).toBeInTheDocument();
    // The first command is highlighted from the start.
    const first = within(dialog).getAllByRole('option')[0]!;
    await waitFor(() => expect(input.getAttribute('aria-activedescendant')).toBe(first.id));
    expect(within(first).getByText('Ctrl N').tagName).toBe('KBD');
  });

  it('filters by label and keywords, highlights matches, Enter runs and closes, focus returns', async () => {
    const user = userEvent.setup();
    const onRun = vi.fn();
    render(<Harness onRun={onRun} />);
    const trigger = screen.getByRole('button', { name: '打开命令面板' });
    await user.click(trigger);
    const input = await screen.findByRole('combobox', { name: '搜索命令' });
    await user.type(input, '导出');
    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(1);
    expect(options[0]!.querySelector('mark')).toHaveTextContent('导出');
    await user.keyboard('{Enter}');
    expect(onRun).toHaveBeenCalledWith(expect.objectContaining({ id: 'export' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    await waitFor(() => expect(trigger).toHaveFocus());

    await user.click(trigger);
    const again = await screen.findByRole('combobox', { name: '搜索命令' });
    // The query is reset on reopen.
    expect(again).toHaveValue('');
    await user.type(again, 'create');
    expect(screen.getAllByRole('option').map((o) => o.textContent)).toEqual(['新建实验记录Ctrl N']);
  });

  it('ArrowDown moves the active option; Escape closes', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole('button', { name: '打开命令面板' }));
    const input = await screen.findByRole('combobox', { name: '搜索命令' });
    const options = screen.getAllByRole('option');
    await user.keyboard('{ArrowDown}');
    expect(input.getAttribute('aria-activedescendant')).toBe(options[1]!.id);
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('disabled commands show their reason and cannot run', async () => {
    const user = userEvent.setup();
    const onRun = vi.fn();
    render(<Harness onRun={onRun} />);
    await user.click(screen.getByRole('button', { name: '打开命令面板' }));
    const input = await screen.findByRole('combobox', { name: '搜索命令' });
    await user.type(input, '清除');
    const option = screen.getByRole('option', { name: /清除缓存/ });
    expect(option).toHaveAttribute('aria-disabled', 'true');
    expect(option).toHaveTextContent('需要管理员权限');
    await user.keyboard('{Enter}');
    await user.click(option);
    expect(onRun).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('onSelect returning false keeps the palette open; empty text when nothing matches', async () => {
    const user = userEvent.setup();
    const onRun = vi.fn(() => false);
    render(<Harness onRun={onRun} />);
    await user.click(screen.getByRole('button', { name: '打开命令面板' }));
    const input = await screen.findByRole('combobox', { name: '搜索命令' });
    await user.keyboard('{Enter}');
    expect(onRun).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    await user.type(input, 'zzzz');
    expect(screen.queryAllByRole('option')).toHaveLength(0);
    expect(screen.getByText('没有匹配的命令')).toBeInTheDocument();
  });

  it('hotkey toggles the palette, is ignored while composing, and focus returns to the prior element', async () => {
    const user = userEvent.setup();
    render(
      <>
        <button type="button">之前的焦点</button>
        <Harness hotkey="ctrl+k" trigger={undefined} />
      </>,
    );
    const before = screen.getByRole('button', { name: '之前的焦点' });
    before.focus();
    fireEvent.keyDown(document, { key: 'k', ctrlKey: true, isComposing: true });
    expect(screen.queryByRole('dialog')).toBeNull();
    fireEvent.keyDown(document, { key: 'k', ctrlKey: true });
    const input = await screen.findByRole('combobox', { name: '搜索命令' });
    await waitFor(() => expect(input).toHaveFocus());
    await user.keyboard('{Control>}k{/Control}');
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    await waitFor(() => expect(before).toHaveFocus());
  });

  it('matchHotkey maps mod to Meta on Apple platforms and Ctrl elsewhere', () => {
    const ev = (init: KeyboardEventInit) => new KeyboardEvent('keydown', init);
    expect(matchHotkey('mod+k', ev({ key: 'k', ctrlKey: true }), false)).toBe(true);
    expect(matchHotkey('mod+k', ev({ key: 'k', metaKey: true }), false)).toBe(false);
    expect(matchHotkey('mod+k', ev({ key: 'K', metaKey: true }), true)).toBe(true);
    expect(matchHotkey('mod+shift+p', ev({ key: 'p', ctrlKey: true }), false)).toBe(false);
    expect(matchHotkey('mod+shift+p', ev({ key: 'P', ctrlKey: true, shiftKey: true }), false)).toBe(true);
  });

  it('controlled open', async () => {
    function Controlled() {
      const [open, setOpen] = React.useState(false);
      return (
        <RhineProvider motion="reduce">
          <button type="button" onClick={() => setOpen(true)}>
            打开
          </button>
          <output>{String(open)}</output>
          <CommandPalette open={open} onOpenChange={setOpen} commands={commands} onSelect={() => undefined} />
        </RhineProvider>
      );
    }
    const user = userEvent.setup();
    render(<Controlled />);
    await user.click(screen.getByRole('button', { name: '打开' }));
    await screen.findByRole('dialog');
    await user.keyboard('{Enter}');
    await waitFor(() => expect(screen.getByText('false', { selector: 'output' })).toBeInTheDocument());
  });
});

const file = (name: string, size: number, type: string) => {
  const f = new File(['x'], name, { type });
  Object.defineProperty(f, 'size', { value: size });
  return f;
};

/** jsdom has no DataTransfer; a plain object with `files` and `types` is what the handlers read. */
const dataTransfer = (files: File[]) => ({ files, types: ['Files'], dropEffect: 'none' });

describe('FileDropZone', () => {
  it('a native file input named by the label and the visible browse button', () => {
    render(<FileDropZone label="样本图像" description="PNG 或 JPEG，单个不超过 1 MB" accept="image/*" />);
    const input = screen.getByLabelText(/样本图像/) as HTMLInputElement;
    expect(input.type).toBe('file');
    expect(input).toHaveAccessibleName('样本图像 选择文件');
    expect(input).toHaveAccessibleDescription('PNG 或 JPEG，单个不超过 1 MB');
    expect(input).toHaveAttribute('accept', 'image/*');
    const browse = screen.getByText('选择文件');
    expect(browse.tagName).toBe('LABEL');
    expect(browse).toHaveAttribute('for', input.id);
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
  });

  it('input change validates type, size and count, and announces the result', async () => {
    const onFiles = vi.fn();
    const onReject = vi.fn();
    render(<FileDropZone label="样本图像" accept="image/*,.pdf" multiple maxFiles={2} maxSize={1024 * 1024} onFiles={onFiles} onReject={onReject} />);
    const input = screen.getByLabelText(/样本图像/) as HTMLInputElement;
    const ok = file('a.png', 10, 'image/png');
    const pdf = file('b.pdf', 10, '');
    const big = file('c.jpg', 2 * 1024 * 1024, 'image/jpeg');
    const txt = file('d.txt', 10, 'text/plain');
    const extra = file('e.png', 10, 'image/png');
    await userEvent.setup({ applyAccept: false }).upload(input, [ok, pdf, big, txt, extra]);
    expect(onFiles).toHaveBeenCalledWith([ok, pdf]);
    expect(onReject).toHaveBeenCalledWith([
      { file: big, reason: 'size' },
      { file: txt, reason: 'type' },
      { file: extra, reason: 'count' },
    ]);
    const status = screen.getByRole('status');
    expect(status).toHaveTextContent('已添加 2 个文件');
    expect(status).toHaveTextContent('「c.jpg」超过 1 MB 的大小上限');
    expect(status).toHaveTextContent('「d.txt」的文件类型不受支持');
    expect(status).toHaveTextContent('「e.png」未添加：最多 2 个文件');
    // Cleared so the same file can be picked again.
    expect(input.value).toBe('');
  });

  it('drag over highlights the area; drop runs the same validation', () => {
    const onFiles = vi.fn();
    const onReject = vi.fn();
    render(<FileDropZone label="样本图像" accept="image/*" maxSize={1024} onFiles={onFiles} onReject={onReject} />);
    const area = document.querySelector('.rl-file-drop__area')!;
    fireEvent.dragEnter(area, { dataTransfer: dataTransfer([]) });
    expect(area).toHaveAttribute('data-drag-over');
    fireEvent.dragLeave(area, { dataTransfer: dataTransfer([]) });
    expect(area).not.toHaveAttribute('data-drag-over');
    const big = file('big.png', 4096, 'image/png');
    fireEvent.dragEnter(area, { dataTransfer: dataTransfer([big]) });
    fireEvent.drop(area, { dataTransfer: dataTransfer([big]) });
    expect(area).not.toHaveAttribute('data-drag-over');
    expect(onFiles).not.toHaveBeenCalled();
    expect(onReject).toHaveBeenCalledWith([{ file: big, reason: 'size' }]);
    expect(screen.getByRole('status')).toHaveTextContent('「big.png」超过 1 KB 的大小上限');
    // Without `multiple`, only one file is accepted per drop.
    const a = file('a.png', 10, 'image/png');
    const b = file('b.png', 10, 'image/png');
    fireEvent.drop(area, { dataTransfer: dataTransfer([a, b]) });
    expect(onFiles).toHaveBeenCalledWith([a]);
    expect(onReject).toHaveBeenLastCalledWith([{ file: b, reason: 'count' }]);
  });

  it('disabled ignores drops and disables the input', () => {
    const onFiles = vi.fn();
    render(<FileDropZone label="样本图像" disabled onFiles={onFiles} />);
    const area = document.querySelector('.rl-file-drop__area')!;
    fireEvent.drop(area, { dataTransfer: dataTransfer([file('a.png', 1, 'image/png')]) });
    expect(onFiles).not.toHaveBeenCalled();
    expect(screen.getByLabelText(/样本图像/)).toBeDisabled();
  });

  it('custom prompt, invalid + error, enUS copy', () => {
    render(
      <RhineProvider messages={enUS}>
        <FileDropZone label="Images" invalid error="Attach at least one image" maxSize={1024 * 1024}>
          Drag images here
        </FileDropZone>
      </RhineProvider>,
    );
    const input = screen.getByLabelText(/Images/);
    expect(screen.getByText('Drag images here')).toBeInTheDocument();
    expect(screen.getByText('Choose files')).toBeInTheDocument();
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription('Attach at least one image');
    const area = document.querySelector('.rl-file-drop__area')!;
    act(() => {
      fireEvent.drop(area, { dataTransfer: dataTransfer([file('big.png', 5 * 1024 * 1024, 'image/png')]) });
    });
    expect(screen.getByRole('status')).toHaveTextContent('"big.png" is larger than 1 MB');
  });

  it('matchesAccept follows the native accept syntax', () => {
    const f = (name: string, type: string) => ({ name, type });
    expect(matchesAccept(f('a.PNG', 'image/png'), '.png')).toBe(true);
    expect(matchesAccept(f('a.png', 'image/png'), 'image/*')).toBe(true);
    expect(matchesAccept(f('a.pdf', 'application/pdf'), 'image/*')).toBe(false);
    expect(matchesAccept(f('a.pdf', 'application/pdf'), 'image/*, application/pdf')).toBe(true);
    expect(matchesAccept(f('a', ''), undefined)).toBe(true);
    expect(validateFiles([], {})).toEqual({ accepted: [], rejected: [] });
  });
});
