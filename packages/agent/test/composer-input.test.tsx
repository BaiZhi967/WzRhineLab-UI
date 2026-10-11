import * as React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { TOKEN_CLOSE, TOKEN_OPEN, encodeToken } from '@wzrhine/agent-core';
import type { TriggerMatch } from '@wzrhine/agent-core';
import { ComposerInput } from '../src/components/composer/ComposerInput';
import type { ComposerInputHandle } from '../src/components/composer/ComposerInput';
import { stripStrayWithCaret } from '../src/components/composer/composer-text';
import { AgentMessagesProvider, agentEnUS } from '../src/provider/AgentMessages';

function Controlled(props: Partial<React.ComponentProps<typeof ComposerInput>> & { initial?: string; handle?: React.Ref<ComposerInputHandle> }) {
  const { initial = '', handle, ...rest } = props;
  const [value, setValue] = React.useState(initial);
  return (
    <ComposerInput
      ref={handle}
      {...rest}
      value={value}
      onValueChange={(next, caret) => {
        setValue(next);
        rest.onValueChange?.(next, caret);
      }}
    />
  );
}

const textarea = () => screen.getByRole('textbox') as HTMLTextAreaElement;
const mirror = (container: HTMLElement) => container.querySelector('.rl-agent-composer-input__mirror') as HTMLElement;

describe('ComposerInput', () => {
  it('renders a labelled textarea with a hint and an aria-hidden mirror', () => {
    const { container } = render(<ComposerInput />);
    const input = textarea();
    expect(input).toHaveAccessibleName('消息内容');
    expect(input).toHaveAccessibleDescription(/Enter 发送/);
    expect(input).toHaveAttribute('placeholder', '写下想法，@ 引用文件，/ 命令与技能');
    expect(mirror(container)).toHaveAttribute('aria-hidden', 'true');
    // Trailing zero-width space keeps a last empty line measurable.
    expect(mirror(container).textContent).toBe('\u200b');
  });

  it('uses the provider copy and the label prop', () => {
    render(
      <AgentMessagesProvider messages={agentEnUS}>
        <ComposerInput aria-label="Draft" submitOn="mod-enter" />
      </AgentMessagesProvider>,
    );
    expect(textarea()).toHaveAccessibleName('Draft');
    expect(textarea()).toHaveAccessibleDescription(/Ctrl \+ Enter sends/);
  });

  it('renders tokens in the mirror with their kind; text stays identical', () => {
    const value = `see ${encodeToken('@', 'src/agent.ts')} and ${encodeToken('/', 'analyze')}`;
    const { container } = render(<ComposerInput value={value} onValueChange={() => {}} tokenKind={(t) => (t.trigger === '@' ? 'file' : 'skill')} />);
    const tokens = container.querySelectorAll('.rl-agent-token');
    expect(tokens).toHaveLength(2);
    expect(tokens[0]).toHaveAttribute('data-kind', 'file');
    expect(tokens[1]).toHaveAttribute('data-kind', 'skill');
    expect(mirror(container).textContent).toBe(`${value}\u200b`);
    expect(textarea().value).toBe(value);
  });

  it('is uncontrolled with defaultValue', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<ComposerInput defaultValue="ab" onValueChange={onValueChange} />);
    await user.type(textarea(), 'c');
    expect(textarea().value).toBe('abc');
    expect(onValueChange).toHaveBeenLastCalledWith('abc', 3);
  });

  it('Enter submits, Shift+Enter inserts a newline', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<Controlled onSubmit={onSubmit} />);
    await user.type(textarea(), 'hi');
    await user.keyboard('{Shift>}{Enter}{/Shift}');
    expect(textarea().value).toBe('hi\n');
    expect(onSubmit).not.toHaveBeenCalled();
    await user.keyboard('{Enter}');
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(textarea().value).toBe('hi\n');
  });

  it("submitOn='mod-enter' sends with Ctrl+Enter only", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<Controlled onSubmit={onSubmit} submitOn="mod-enter" />);
    await user.type(textarea(), 'x{Enter}');
    expect(onSubmit).not.toHaveBeenCalled();
    await user.keyboard('{Control>}{Enter}{/Control}');
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('never submits during IME composition (ref, isComposing and keyCode 229)', () => {
    const onSubmit = vi.fn();
    const onMenuKey = vi.fn(() => true);
    render(<Controlled initial="ni" onSubmit={onSubmit} onMenuKey={onMenuKey} />);
    const input = textarea();
    fireEvent.compositionStart(input);
    fireEvent.keyDown(input, { key: 'Enter' });
    fireEvent.compositionEnd(input);
    fireEvent.keyDown(input, { key: 'Enter', isComposing: true });
    fireEvent.keyDown(input, { key: 'Enter', keyCode: 229 });
    expect(onSubmit).not.toHaveBeenCalled();
    expect(onMenuKey).not.toHaveBeenCalled();
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onMenuKey).toHaveBeenCalledTimes(1);
    // Consumed by the menu → no submit either.
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('reports triggers while typing, waits for compositionend during IME', async () => {
    const user = userEvent.setup();
    const seen: Array<TriggerMatch | null> = [];
    render(<Controlled onTriggerChange={(m) => seen.push(m)} />);
    await user.type(textarea(), '@sr');
    expect(seen.at(-1)).toEqual({ trigger: '@', query: 'sr', from: 0, to: 3 });
    await user.type(textarea(), ' ');
    expect(seen.at(-1)).toBeNull();

    const input = textarea();
    fireEvent.compositionStart(input);
    fireEvent.change(input, { target: { value: '@sr @文', selectionStart: 6, selectionEnd: 6 } });
    const during = seen.length;
    expect(seen.at(-1)).toBeNull();
    input.setSelectionRange(input.value.length, input.value.length);
    fireEvent.compositionEnd(input);
    expect(seen.length).toBe(during + 1);
    expect(seen.at(-1)).toEqual({ trigger: '@', query: '文', from: 4, to: 6 });
  });

  it('Backspace after a token deletes it whole and reports the removal', async () => {
    const user = userEvent.setup();
    const onTokenRemoved = vi.fn();
    const value = `${encodeToken('@', 'a.ts')} `;
    render(<Controlled initial={value} onTokenRemoved={onTokenRemoved} />);
    const input = textarea();
    input.focus();
    input.setSelectionRange(value.length, value.length);
    await user.keyboard('{Backspace}');
    expect(input.value).toBe('');
    expect(onTokenRemoved).toHaveBeenCalledWith(expect.objectContaining({ trigger: '@', name: 'a.ts' }));
  });

  it('Delete right before a token deletes it whole', async () => {
    const user = userEvent.setup();
    const value = `x ${encodeToken('/', 'plan')} y`;
    render(<Controlled initial={value} />);
    const input = textarea();
    input.focus();
    input.setSelectionRange(2, 2);
    await user.keyboard('{Delete}');
    expect(input.value).toBe('x y');
  });

  it('reports tokens removed by other edits (cut / overwrite) and strips stray isolates', () => {
    const onTokenRemoved = vi.fn();
    const token = encodeToken('@', 'a.ts');
    render(<Controlled initial={`${token} b`} onTokenRemoved={onTokenRemoved} />);
    const input = textarea();
    // Simulate a cut that removed half of the token.
    fireEvent.change(input, { target: { value: `${TOKEN_OPEN}@a b`, selectionStart: 3, selectionEnd: 3 } });
    expect(onTokenRemoved).toHaveBeenCalledTimes(1);
    expect(input.value).toBe('@a b');
    expect(input.value).not.toContain(TOKEN_OPEN);
  });

  it('snaps a caret placed inside a token to the nearer edge', () => {
    const value = `${encodeToken('@', 'abcdef')} z`;
    render(<Controlled initial={value} />);
    const input = textarea();
    input.focus();
    fireEvent.pointerDown(input);
    input.setSelectionRange(2, 2);
    fireEvent.select(input);
    expect(input.selectionStart).toBe(0);
    fireEvent.pointerDown(input);
    input.setSelectionRange(7, 7);
    fireEvent.select(input);
    expect(input.selectionStart).toBe(9);
  });

  it('imperative insertToken replaces the range and moves the caret after the token', () => {
    const handle = React.createRef<ComposerInputHandle>();
    const onValueChange = vi.fn();
    render(<Controlled initial="see @sr" handle={handle} onValueChange={onValueChange} />);
    act(() => handle.current!.insertToken('@', 'src', { from: 4, to: 7 }));
    const expected = `see ${encodeToken('@', 'src')} `;
    expect(textarea().value).toBe(expected);
    expect(onValueChange).toHaveBeenLastCalledWith(expected, expected.length);
    expect(handle.current!.element).toBe(textarea());
    act(() => handle.current!.focus());
    expect(textarea()).toHaveFocus();
  });

  it('disabled and readOnly are native', () => {
    const { rerender } = render(<ComposerInput disabled />);
    expect(textarea()).toBeDisabled();
    rerender(<ComposerInput readOnly />);
    expect(textarea()).toHaveAttribute('readonly');
  });

  it('gives each instance its own hint id', () => {
    render(
      <>
        <ComposerInput />
        <ComposerInput />
      </>,
    );
    const [a, b] = screen.getAllByRole('textbox');
    expect(a!.getAttribute('aria-describedby')).not.toBe(b!.getAttribute('aria-describedby'));
  });
});

describe('stripStrayWithCaret', () => {
  it('keeps complete tokens and shifts the caret by removed characters', () => {
    const token = encodeToken('@', 'a');
    expect(stripStrayWithCaret(`x${TOKEN_CLOSE}y`, 3)).toEqual({ value: 'xy', caret: 2 });
    expect(stripStrayWithCaret(`${token}x`, token.length + 1)).toEqual({ value: `${token}x`, caret: token.length + 1 });
  });
});
