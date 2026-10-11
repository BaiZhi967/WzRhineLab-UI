import * as React from 'react';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MotionConfig } from 'motion/react';
import { describe, expect, it, vi } from 'vitest';
import { TOKEN_OPEN, encodeToken } from '@wzrhine/agent-core';
import type { ActionStatus, CommandOption, MentionOption, ReferenceView, RunStatus, SendInput } from '@wzrhine/agent-core';
import { Composer } from '../src/components/composer/Composer';
import type { ComposerProps } from '../src/components/composer/Composer';
import { MentionMenu } from '../src/components/composer/MentionMenu';
import { SlashCommandMenu } from '../src/components/composer/SlashCommandMenu';
import {
  filterCommandOptions,
  filterMentionOptions,
  moveActiveIndex,
  orderCommandOptions,
  removeTokens,
  splitMentionQuery,
} from '../src/components/composer/composer-utils';

const files: MentionOption[] = [
  { id: 'src', label: 'src', kind: 'folder', drillable: true, detail: 'src/', group: '文件夹' },
  { id: 'readme', label: 'README.md', kind: 'file', detail: 'README.md', group: '文件' },
  { id: 'agent', label: 'agent.ts', kind: 'file', detail: 'src/agent.ts', group: '文件' },
  { id: 'secret', label: 'secret.env', kind: 'file', detail: '.env', group: '文件', disabled: true, disabledReason: '已被忽略规则排除' },
];

const commands: CommandOption[] = [
  { id: 's1', name: 'analyze', label: '分析数据', kind: 'skill', description: '示例技能' },
  { id: 'c1', name: 'compact', label: '整理上下文', kind: 'command', description: '压缩历史', shortcut: 'Ctrl K', aliases: ['cmp'] },
  { id: 'c2', name: 'fork', label: '分叉对话', kind: 'command', disabled: true, disabledReason: '运行中不能分叉' },
];

function Harness(props: Partial<ComposerProps> & { initial?: string; onSent?: (input: SendInput) => void }) {
  const { initial = '', onSent, ...rest } = props;
  const [value, setValue] = React.useState(initial);
  const [refs, setRefs] = React.useState<ReferenceView[]>([]);
  return (
    <Composer
      mentionOptions={files}
      commandOptions={commands}
      references={refs}
      onReferenceAdd={(option, name) => setRefs((r) => [...r, { id: option.id, kind: option.kind, label: name }])}
      onRemoveReference={(ref) => setRefs((r) => r.filter((x) => x.id !== ref.id))}
      onSubmit={(input) => {
        onSent?.(input);
        setValue('');
      }}
      {...rest}
      value={value}
      onValueChange={(next) => {
        setValue(next);
        rest.onValueChange?.(next);
      }}
    />
  );
}

const input = () => screen.getByRole('combobox', { name: '消息内容' }) as HTMLTextAreaElement;
const sendButton = () => document.querySelector('.rl-agent-send') as HTMLButtonElement;

describe('Composer · mentions', () => {
  it('opens the @ listbox as a combobox popup and inserts a token with ↓ + Enter', async () => {
    const user = userEvent.setup();
    const onReferenceAdd = vi.fn();
    const { container } = render(<Harness onReferenceAdd={onReferenceAdd} />);
    expect(input()).toHaveAttribute('aria-expanded', 'false');
    await user.type(input(), '@');
    const listbox = screen.getByRole('listbox', { name: '引用文件与上下文' });
    expect(input()).toHaveAttribute('aria-expanded', 'true');
    expect(input()).toHaveAttribute('aria-controls', listbox.id);
    expect(within(listbox).getAllByRole('option')).toHaveLength(4);
    expect(within(listbox).getByRole('group', { name: '文件夹' })).toBeInTheDocument();
    const first = within(listbox).getAllByRole('option')[0]!;
    expect(input()).toHaveAttribute('aria-activedescendant', first.id);
    expect(first).toHaveAttribute('aria-selected', 'true');

    await user.keyboard('{ArrowDown}');
    const second = within(listbox).getAllByRole('option')[1]!;
    expect(input()).toHaveAttribute('aria-activedescendant', second.id);
    await user.keyboard('{Enter}');
    expect(input().value).toBe(`${encodeToken('@', 'README.md')} `);
    expect(input().value).toContain(TOKEN_OPEN);
    expect(container.querySelector('.rl-agent-token[data-kind="file"]')).toHaveTextContent('README.md');
    expect(onReferenceAdd).toHaveBeenCalledWith(files[1], 'README.md');
    expect(input()).toHaveAttribute('aria-expanded', 'false');
    await waitFor(() => expect(screen.queryByRole('listbox')).not.toBeInTheDocument());
    expect(input()).toHaveFocus();
  });

  it('↑ / ↓ clamp at both ends (no wrap-around)', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.type(input(), '@');
    await user.keyboard('{ArrowUp}');
    const options = screen.getAllByRole('option');
    expect(input()).toHaveAttribute('aria-activedescendant', options[0]!.id);
    await user.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}{ArrowDown}{ArrowDown}');
    expect(input()).toHaveAttribute('aria-activedescendant', options[3]!.id);
  });

  it('filters and highlights matches; disabled options show the reason and do not insert', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.type(input(), '@sec');
    const option = screen.getByRole('option');
    expect(option).toHaveAttribute('aria-disabled', 'true');
    expect(option).toHaveTextContent('不可用：已被忽略规则排除');
    expect(option.querySelector('mark')).toHaveTextContent('sec');
    await user.keyboard('{Enter}');
    expect(input().value).toBe('@sec');
    expect(document.querySelector('.rl-agent-composer__status')).toHaveTextContent('不可用：已被忽略规则排除');
  });

  it('Tab on a folder drills: the query becomes `src/`', async () => {
    const user = userEvent.setup();
    const onMentionDrill = vi.fn();
    const onMentionQuery = vi.fn();
    render(<Harness onMentionDrill={onMentionDrill} onMentionQuery={onMentionQuery} />);
    await user.type(input(), '@s');
    await user.keyboard('{Tab}');
    expect(input().value).toBe('@src/');
    expect(onMentionDrill).toHaveBeenCalledWith(files[0]);
    expect(onMentionQuery).toHaveBeenLastCalledWith('src/');
    expect(input()).toHaveFocus();
  });

  it('Esc closes and the same query does not reopen until it changes', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.type(input(), '@re');
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(input()).toHaveAttribute('aria-expanded', 'false');
    await waitFor(() => expect(screen.queryByRole('listbox')).not.toBeInTheDocument());
    // Caret moves away and back: the same @re stays closed.
    await user.keyboard('{ArrowLeft}{ArrowRight}');
    expect(input()).toHaveAttribute('aria-expanded', 'false');
    await user.keyboard('a');
    expect(input()).toHaveAttribute('aria-expanded', 'true');
    expect(await screen.findByRole('listbox')).toBeInTheDocument();
  });

  it('Enter with the menu open never submits', async () => {
    const user = userEvent.setup();
    const onSent = vi.fn();
    render(<Harness initial="hello " onSent={onSent} />);
    input().setSelectionRange(6, 6);
    await user.type(input(), '@READ');
    await user.keyboard('{Enter}');
    expect(onSent).not.toHaveBeenCalled();
  });

  it('pointer selection keeps focus in the textarea', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.type(input(), '@agent');
    const option = screen.getByRole('option', { name: /agent\.ts/ });
    await user.hover(option);
    await user.click(option);
    expect(input().value).toBe(`${encodeToken('@', 'agent.ts')} `);
    expect(input()).toHaveFocus();
  });

  it('removing a token from the text unbinds via onTokenRemoved', async () => {
    const user = userEvent.setup();
    const onTokenRemoved = vi.fn();
    render(<Harness onTokenRemoved={onTokenRemoved} />);
    await user.type(input(), '@READ');
    await user.keyboard('{Enter}{Backspace}');
    expect(input().value).toBe('');
    expect(onTokenRemoved).toHaveBeenCalledWith(expect.objectContaining({ name: 'README.md' }));
  });

  it('shows loading, empty and error (+retry) states', async () => {
    const user = userEvent.setup();
    const onMentionRetry = vi.fn();
    const { rerender } = render(<Harness mentionLoading />);
    await user.type(input(), '@');
    expect(screen.getByText('正在读取候选…')).toBeInTheDocument();
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(input()).not.toHaveAttribute('aria-activedescendant');
    rerender(<Harness mentionOptions={[]} />);
    expect(screen.getByText('没有匹配的文件')).toBeInTheDocument();
    rerender(<Harness mentionError="示例：读取超时" onMentionRetry={onMentionRetry} />);
    expect(screen.getByRole('alert')).toHaveTextContent('示例：读取超时');
    await user.click(screen.getByRole('button', { name: '重新读取' }));
    expect(onMentionRetry).toHaveBeenCalled();
  });
});

describe('Composer · slash commands', () => {
  it('orders commands before skills with group headings and inserts on host request', async () => {
    const user = userEvent.setup();
    const onCommand = vi.fn(() => 'insert' as const);
    const { container } = render(<Harness onCommand={onCommand} />);
    await user.type(input(), '/');
    const listbox = screen.getByRole('listbox', { name: '命令与技能' });
    const groups = within(listbox).getAllByRole('group');
    expect(groups.map((g) => g.getAttribute('aria-labelledby') && document.getElementById(g.getAttribute('aria-labelledby')!)!.textContent)).toEqual(['命令', '技能']);
    const options = within(listbox).getAllByRole('option');
    expect(options[0]).toHaveTextContent('/compact');
    expect(options[0]).toHaveTextContent('/cmp');
    expect(options[0]).toHaveTextContent('Ctrl K');
    await user.keyboard('{ArrowDown}{ArrowDown}{Enter}');
    expect(onCommand).toHaveBeenCalledWith(commands[0], expect.objectContaining({ trigger: '/', query: '' }));
    expect(input().value).toBe(`${encodeToken('/', 'analyze')} `);
    expect(container.querySelector('.rl-agent-token[data-kind="skill"]')).toBeInTheDocument();
  });

  it('a disabled command does not dispatch; the reason shows in the feedback line', async () => {
    const user = userEvent.setup();
    const onCommand = vi.fn();
    const onDisabledCommand = vi.fn();
    render(<Harness onCommand={onCommand} onDisabledCommand={onDisabledCommand} />);
    await user.type(input(), '/fork');
    await user.keyboard('{Enter}');
    expect(onCommand).not.toHaveBeenCalled();
    expect(onDisabledCommand).toHaveBeenCalledWith(commands[2]);
    expect(document.querySelector('.rl-agent-composer__status')).toHaveTextContent('不可用：运行中不能分叉');
    expect(input().value).toBe('/fork');
  });

  it('dispatching a command removes the typed /query', async () => {
    const user = userEvent.setup();
    const onCommand = vi.fn();
    render(<Harness onCommand={onCommand} />);
    await user.type(input(), '/cmp');
    await user.keyboard('{Enter}');
    expect(onCommand).toHaveBeenCalledWith(commands[1], expect.anything());
    expect(input().value).toBe('');
  });

  it('`/` in the middle of a line is plain text', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.type(input(), 'a /b');
    expect(input()).toHaveAttribute('aria-expanded', 'false');
  });
});

describe('Composer · sending', () => {
  it('Enter sends plain text, raw value and references; Shift+Enter adds a line', async () => {
    const user = userEvent.setup();
    const onSent = vi.fn();
    render(<Harness onSent={onSent} />);
    await user.type(input(), '@READ');
    await user.keyboard('{Enter}');
    await user.keyboard('look{Shift>}{Enter}{/Shift}now');
    expect(input().value).toContain('\n');
    await user.keyboard('{Enter}');
    expect(onSent).toHaveBeenCalledTimes(1);
    const sent = onSent.mock.calls[0]![0] as SendInput;
    expect(sent.text).toBe('@README.md look\nnow');
    expect(sent.raw).toContain(TOKEN_OPEN);
    expect(sent.references).toEqual([{ id: 'readme', kind: 'file', label: 'README.md' }]);
    expect(input().value).toBe('');
  });

  it('empty input cannot send; the button explains why', async () => {
    const user = userEvent.setup();
    const onSent = vi.fn();
    render(<Harness onSent={onSent} />);
    expect(sendButton()).toHaveAttribute('aria-disabled', 'true');
    expect(sendButton()).toHaveAccessibleName('发送');
    expect(sendButton()).toHaveAccessibleDescription('输入内容后才能发送');
    await user.click(sendButton());
    await user.type(input(), '   {Enter}');
    expect(onSent).not.toHaveBeenCalled();
  });

  it.each<ActionStatus>(['submitting', 'unknown'])('while submitStatus is %s Enter does nothing', async (status) => {
    const user = userEvent.setup();
    const onSent = vi.fn();
    render(<Harness initial="hi" onSent={onSent} submitStatus={status} />);
    input().focus();
    await user.keyboard('{Enter}');
    expect(onSent).not.toHaveBeenCalled();
    expect(sendButton()).toHaveAttribute('aria-disabled', 'true');
    if (status === 'unknown') {
      expect(sendButton()).toHaveAccessibleName('结果待确认');
      expect(document.querySelector('.rl-agent-composer__status')).toHaveTextContent('发送结果待确认');
    } else {
      expect(sendButton()).toHaveAccessibleName('正在发送');
    }
  });

  it('a rejected send keeps the draft and offers retry', async () => {
    const user = userEvent.setup();
    const onSent = vi.fn();
    render(<Harness initial="draft" onSent={onSent} submitStatus="rejected" />);
    expect(document.querySelector('.rl-agent-composer__status')).toHaveTextContent('发送失败，草稿已保留');
    await user.click(screen.getByRole('button', { name: '重试' }));
    expect(onSent).toHaveBeenCalledWith(expect.objectContaining({ text: 'draft' }));
  });

  it('running: the button becomes 停止生成 on the same element and Enter does not send', async () => {
    const user = userEvent.setup();
    const onSent = vi.fn();
    const onStop = vi.fn();
    const { rerender } = render(<Harness initial="next" onSent={onSent} onStop={onStop} runStatus="idle" />);
    const before = sendButton();
    before.focus();
    rerender(<Harness initial="next" onSent={onSent} onStop={onStop} runStatus="running" />);
    expect(sendButton()).toBe(before);
    expect(before).toHaveFocus();
    expect(before).toHaveAccessibleName('停止生成');
    await user.click(before);
    expect(onStop).toHaveBeenCalledTimes(1);
    input().focus();
    await user.keyboard('{Enter}');
    expect(onSent).not.toHaveBeenCalled();
    rerender(<Harness initial="next" onSent={onSent} onStop={onStop} runStatus={'cancelling' as RunStatus} />);
    expect(sendButton()).toHaveAccessibleName('停止待确认');
    expect(sendButton()).toHaveAttribute('aria-disabled', 'true');
  });

  it('maxLength shows a counter and blocks sending over the limit', async () => {
    const user = userEvent.setup();
    const onSent = vi.fn();
    render(<Harness maxLength={3} onSent={onSent} />);
    await user.type(input(), 'abcd{Enter}');
    expect(screen.getByText('字符 4 / 3')).toHaveAttribute('data-over');
    expect(onSent).not.toHaveBeenCalled();
  });
});

describe('Composer · states and slots', () => {
  it('blocked: textarea is read-only + aria-disabled with the reason as placeholder', () => {
    render(<Harness blocked />);
    expect(input()).toHaveAttribute('readonly');
    expect(input()).toHaveAttribute('aria-disabled', 'true');
    expect(input()).toHaveAttribute('placeholder', '请先在上方回答问题');
    expect(document.querySelector('.rl-agent-composer__status')).toHaveTextContent('请先在上方回答问题');
  });

  it('blocked / disabled never open menus', async () => {
    const user = userEvent.setup();
    render(<Harness blocked="示例：等待审批" initial="" />);
    await user.type(input(), '@');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('draft status lines and retry-save', async () => {
    const user = userEvent.setup();
    const onRetryDraftSave = vi.fn();
    const { rerender } = render(<Harness draftStatus="saving" />);
    expect(screen.getByText('正在保存草稿')).toBeInTheDocument();
    rerender(<Harness draftStatus="saved" />);
    expect(screen.getByText('草稿已保存')).toBeInTheDocument();
    rerender(<Harness draftStatus="error" onRetryDraftSave={onRetryDraftSave} />);
    expect(screen.getByText('草稿保存失败，内容仍保留在本机')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '重试保存' }));
    expect(onRetryDraftSave).toHaveBeenCalled();
  });

  it('renders slots and the intervention region', () => {
    const { rerender } = render(<Harness toolbarStart={<button type="button">添加</button>} toolbarEnd={<span>示例模型</span>} intervention={<p>示例：审批卡</p>} />);
    expect(screen.getByRole('button', { name: '添加' })).toBeInTheDocument();
    expect(screen.getByText('示例模型')).toBeInTheDocument();
    const slot = document.querySelector('.rl-agent-composer__intervention')!;
    expect(slot).toHaveAttribute('data-open');
    expect(screen.getByText('示例：审批卡')).toBeInTheDocument();
    rerender(<Harness intervention={null} />);
    expect(slot).not.toHaveAttribute('data-open');
  });

  it('dropping and pasting files call the callbacks', () => {
    const onFilesDrop = vi.fn();
    const onFilesPaste = vi.fn();
    render(<Harness onFilesDrop={onFilesDrop} onFilesPaste={onFilesPaste} />);
    const frame = document.querySelector('.rl-agent-composer__frame')!;
    const file = new File(['x'], 'sample.png', { type: 'image/png' });
    const dataTransfer = { types: ['Files'], files: [file], dropEffect: 'none' };
    fireEvent.dragEnter(frame, { dataTransfer });
    expect(frame).toHaveAttribute('data-dragging');
    expect(screen.getByText('松开以添加文件')).toBeInTheDocument();
    fireEvent.drop(frame, { dataTransfer });
    expect(frame).not.toHaveAttribute('data-dragging');
    expect(onFilesDrop).toHaveBeenCalledWith([file]);
    fireEvent.paste(input(), { clipboardData: { files: [file], types: ['Files'] } });
    expect(onFilesPaste).toHaveBeenCalledWith([file]);
  });

  it('works under reduced motion and with several instances', async () => {
    const user = userEvent.setup();
    render(
      <MotionConfig reducedMotion="always">
        <Harness />
        <Harness />
      </MotionConfig>,
    );
    const [a, b] = screen.getAllByRole('combobox');
    await user.type(a!, '@');
    const listbox = screen.getByRole('listbox');
    expect(a).toHaveAttribute('aria-controls', listbox.id);
    expect(b).toHaveAttribute('aria-expanded', 'false');
    expect(a!.getAttribute('aria-activedescendant')).toMatch(listbox.id);
  });

  it('imperative handle forwards to the input', () => {
    const ref = React.createRef<import('../src/components/composer/ComposerInput').ComposerInputHandle>();
    render(<Composer ref={ref} defaultValue="x" />);
    act(() => ref.current!.focus());
    expect(screen.getByRole('textbox')).toHaveFocus();
  });
});

describe('MentionMenu / SlashCommandMenu standalone', () => {
  it('MentionMenu marks folders and dims details', () => {
    render(<MentionMenu open query="src/a" options={[files[2]!, files[0]!]} activeIndex={0} onActiveIndexChange={() => {}} onSelect={() => {}} />);
    expect(screen.getByText('src/', { selector: '.rl-agent-menu__scope' })).toBeInTheDocument();
    expect(screen.getAllByRole('option')[0]!.querySelector('mark')).toHaveTextContent('a');
    expect(screen.getAllByRole('option')[1]).toHaveTextContent('文件夹，Enter 或 Tab 进入');
  });

  it('SlashCommandMenu shows selected skills with a check', () => {
    render(
      <SlashCommandMenu
        open
        query=""
        options={[{ ...commands[0]!, selected: true }]}
        activeIndex={0}
        onActiveIndexChange={() => {}}
        onSelect={() => {}}
      />,
    );
    expect(screen.getByRole('option')).toHaveTextContent('已选用');
  });
});

describe('composer utils', () => {
  it('moveActiveIndex clamps', () => {
    expect(moveActiveIndex(0, 0, 1)).toBe(-1);
    expect(moveActiveIndex(3, 2, 1)).toBe(2);
    expect(moveActiveIndex(3, 0, -1)).toBe(0);
    expect(moveActiveIndex(3, -1, -1)).toBe(2);
  });

  it('filters, orders and splits', () => {
    expect(splitMentionQuery('src/comp')).toEqual({ directory: 'src/', filter: 'comp' });
    expect(filterMentionOptions(files, 'src/agent').map((o) => o.id)).toEqual(['agent']);
    expect(filterCommandOptions(commands, 'cmp').map((o) => o.id)).toEqual(['c1']);
    expect(orderCommandOptions(commands).map((o) => o.kind)).toEqual(['command', 'command', 'skill']);
    const v = `a ${encodeToken('@', 'x')} b ${encodeToken('@', 'x')}`;
    expect(removeTokens(v, '@', 'x')).toBe('a b');
  });
});
