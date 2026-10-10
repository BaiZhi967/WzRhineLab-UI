import * as React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  Button,
  Checkbox,
  CheckboxGroup,
  Field,
  Fieldset,
  Form,
  Input,
  Radio,
  RadioGroup,
  RhineProvider,
  Separator,
  Switch,
  Textarea,
  VisuallyHidden,
} from '../src';

/** Native form submission data, as a server would receive it. */
function formEntries(form: HTMLFormElement) {
  return [...new FormData(form).entries()].map(([k, v]) => [k, String(v)]);
}

let errors: ReturnType<typeof vi.spyOn>;
beforeEach(() => {
  errors = vi.spyOn(console, 'error');
});
afterEach(() => {
  // React key / nesting / act warnings are failures, not noise.
  expect(errors).not.toHaveBeenCalled();
  errors.mockRestore();
});

describe('Textarea', () => {
  it('takes label, description and error from Field', () => {
    render(
      <Field label="复核意见" description="不超过 500 字。" invalid error="请填写复核意见。">
        <Textarea name="note" />
      </Field>,
    );
    const textarea = screen.getByRole('textbox', { name: '复核意见' });
    expect(textarea.tagName).toBe('TEXTAREA');
    expect(textarea).toHaveAttribute('aria-invalid', 'true');
    expect(textarea).toHaveAccessibleDescription(expect.stringContaining('不超过 500 字。'));
    expect(textarea).toHaveAccessibleDescription(expect.stringContaining('请填写复核意见。'));
  });

  it('keeps newlines, submits under its name and reports onValueChange', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const { container } = render(
      <form>
        <Field label="备注">
          <Textarea name="note" onValueChange={onValueChange} />
        </Field>
      </form>,
    );
    await user.type(screen.getByRole('textbox', { name: '备注' }), '第一行{enter}第二行');
    expect(onValueChange).toHaveBeenLastCalledWith('第一行\n第二行', expect.anything());
    expect(formEntries(container.querySelector('form')!)).toEqual([['note', '第一行\n第二行']]);
  });

  it('counter is linked as a description and tracks controlled value', async () => {
    const user = userEvent.setup();
    function Harness() {
      const [value, setValue] = React.useState('ab');
      return (
        <Field label="摘要">
          <Textarea value={value} onValueChange={setValue} maxLength={10} showCount />
        </Field>
      );
    }
    render(<Harness />);
    const textarea = screen.getByRole('textbox', { name: '摘要' });
    expect(textarea).toHaveAccessibleDescription('已输入 2 / 10');
    await user.type(textarea, 'cde');
    expect(textarea).toHaveAccessibleDescription('已输入 5 / 10');
    expect(textarea).toHaveAttribute('maxlength', '10');
  });

  it('uncontrolled counter starts from defaultValue', () => {
    render(<Textarea aria-label="说明" defaultValue="样本" maxLength={8} showCount />);
    expect(screen.getByRole('textbox', { name: '说明' })).toHaveAccessibleDescription('已输入 2 / 8');
  });

  it('required + native validity shows the error on submit', async () => {
    const user = userEvent.setup();
    render(
      <Form onSubmit={(e) => e.preventDefault()}>
        <Field label="意见" error="请填写意见。" errorMatch="valueMissing">
          <Textarea required />
        </Field>
        <Button type="submit">提交</Button>
      </Form>,
    );
    await user.click(screen.getByRole('button', { name: '提交' }));
    const textarea = screen.getByRole('textbox', { name: '意见' });
    await waitFor(() => expect(textarea).toHaveAttribute('aria-invalid', 'true'));
    expect(screen.getByText('请填写意见。')).toBeVisible();
    // Form moves focus to the first invalid control.
    expect(textarea).toHaveFocus();
  });

  it('readOnly stays focusable; disabled leaves the tab order', async () => {
    const user = userEvent.setup();
    render(
      <>
        <Textarea aria-label="只读" readOnly defaultValue="固定" />
        <Textarea aria-label="禁用" disabled />
        <button type="button">next</button>
      </>,
    );
    await user.tab();
    expect(screen.getByRole('textbox', { name: '只读' })).toHaveFocus();
    await user.type(screen.getByRole('textbox', { name: '只读' }), 'x');
    expect(screen.getByRole('textbox', { name: '只读' })).toHaveValue('固定');
    await user.tab();
    expect(screen.getByRole('button', { name: 'next' })).toHaveFocus();
  });

  it('forwards ref and exposes rows / resize / maxRows to CSS', () => {
    const ref = React.createRef<HTMLTextAreaElement>();
    render(<Textarea ref={ref} aria-label="x" rows={5} maxRows={10} autoResize resize="none" />);
    expect(ref.current).toBe(screen.getByRole('textbox'));
    expect(ref.current).toHaveAttribute('rows', '5');
    const root = ref.current!.closest('.rl-textarea') as HTMLElement;
    expect(root.style.getPropertyValue('--rl-textarea-rows')).toBe('5');
    expect(root.style.getPropertyValue('--rl-textarea-max-rows')).toBe('10');
    expect(root).toHaveAttribute('data-auto-resize');
    expect(root).toHaveAttribute('data-resize', 'none');
  });
});

describe('Checkbox', () => {
  it('whole row is the label; clicking the text toggles', async () => {
    const user = userEvent.setup();
    render(<Checkbox label="复核完成后通知我" description="通过联系邮箱发送。" />);
    const checkbox = screen.getByRole('checkbox', { name: '复核完成后通知我' });
    expect(checkbox).toHaveAccessibleDescription('通过联系邮箱发送。');
    expect(checkbox).toHaveAttribute('aria-checked', 'false');
    await user.click(screen.getByText('复核完成后通知我'));
    expect(checkbox).toHaveAttribute('aria-checked', 'true');
  });

  it('Space toggles from the keyboard', async () => {
    const user = userEvent.setup();
    render(<Checkbox label="锁定记录" />);
    await user.tab();
    const checkbox = screen.getByRole('checkbox', { name: '锁定记录' });
    expect(checkbox).toHaveFocus();
    await user.keyboard(' ');
    expect(checkbox).toHaveAttribute('aria-checked', 'true');
    await user.keyboard(' ');
    expect(checkbox).toHaveAttribute('aria-checked', 'false');
  });

  it('submits value only when checked', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <form>
        <Checkbox name="lock" value="yes" label="锁定" />
      </form>,
    );
    const form = container.querySelector('form')!;
    expect(formEntries(form)).toEqual([]);
    await user.click(screen.getByRole('checkbox', { name: '锁定' }));
    expect(formEntries(form)).toEqual([['lock', 'yes']]);
  });

  it('controlled with onCheckedChange', async () => {
    const user = userEvent.setup();
    function Harness() {
      const [checked, setChecked] = React.useState(false);
      return (
        <>
          <Checkbox label="归档" checked={checked} onCheckedChange={setChecked} />
          <output>{String(checked)}</output>
        </>
      );
    }
    render(<Harness />);
    await user.click(screen.getByRole('checkbox', { name: '归档' }));
    expect(screen.getByRole('status')).toHaveTextContent('true');
  });

  it('indeterminate reads as mixed', () => {
    render(<Checkbox label="全选" indeterminate />);
    expect(screen.getByRole('checkbox', { name: '全选' })).toHaveAttribute('aria-checked', 'mixed');
  });

  it('required confirmation shows its error on submit and marks the label visually only', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn((e: React.FormEvent) => e.preventDefault());
    render(
      <Form onSubmit={onSubmit}>
        <Checkbox name="ack" required label="我已核对样本编号" error="提交前请确认。" />
        <Button type="submit">提交</Button>
      </Form>,
    );
    const checkbox = screen.getByRole('checkbox', { name: '我已核对样本编号' });
    expect(screen.getByText('*')).toHaveAttribute('aria-hidden', 'true');
    await user.click(screen.getByRole('button', { name: '提交' }));
    expect(onSubmit).not.toHaveBeenCalled();
    await waitFor(() => expect(checkbox).toHaveAttribute('aria-invalid', 'true'));
    expect(checkbox).toHaveAccessibleDescription(expect.stringContaining('提交前请确认。'));
    await user.click(checkbox);
    await user.click(screen.getByRole('button', { name: '提交' }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('disabled is announced and inert', async () => {
    const user = userEvent.setup();
    render(
      <>
        <Checkbox label="不可用" disabled />
        <button type="button">next</button>
      </>,
    );
    const checkbox = screen.getByRole('checkbox', { name: '不可用' });
    expect(checkbox).toHaveAttribute('aria-disabled', 'true');
    await user.click(screen.getByText('不可用'));
    expect(checkbox).toHaveAttribute('aria-checked', 'false');
    await user.tab();
    expect(screen.getByRole('button', { name: 'next' })).toHaveFocus();
  });

  it('hideLabel keeps the accessible name', () => {
    render(<Checkbox label="选择 ARC-1024" hideLabel />);
    const checkbox = screen.getByRole('checkbox', { name: '选择 ARC-1024' });
    expect(screen.getByText('选择 ARC-1024').closest('.rl-visually-hidden')).not.toBeNull();
    expect(checkbox).toBeInTheDocument();
  });
});

describe('CheckboxGroup', () => {
  it('is a named group whose items submit under the group name', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <form>
        <CheckboxGroup label="通知方式" name="channels" defaultValue={['email']} description="可多选。">
          <Checkbox value="email" label="邮件" />
          <Checkbox value="digest" label="每周摘要" description="周一上午发送。" />
        </CheckboxGroup>
      </form>,
    );
    const group = screen.getByRole('group', { name: '通知方式' });
    expect(group).toHaveAccessibleDescription('可多选。');
    const digest = screen.getByRole('checkbox', { name: '每周摘要' });
    expect(digest).toHaveAccessibleDescription(expect.stringContaining('周一上午发送。'));
    await user.click(digest);
    expect(formEntries(container.querySelector('form')!)).toEqual([
      ['channels', 'email'],
      ['channels', 'digest'],
    ]);
  });

  it('controlled value', async () => {
    const user = userEvent.setup();
    function Harness() {
      const [value, setValue] = React.useState<string[]>([]);
      return (
        <>
          <CheckboxGroup label="字段" value={value} onValueChange={setValue}>
            <Checkbox value="id" label="编号" />
            <Checkbox value="title" label="标题" />
          </CheckboxGroup>
          <output>{value.join(',')}</output>
        </>
      );
    }
    render(<Harness />);
    await user.click(screen.getByRole('checkbox', { name: '标题' }));
    await user.click(screen.getByRole('checkbox', { name: '编号' }));
    expect(screen.getByRole('status')).toHaveTextContent('title,id');
  });

  it('validate enforces "at least one" with a linked error', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn((e: React.FormEvent) => e.preventDefault());
    render(
      <Form onSubmit={onSubmit}>
        <CheckboxGroup
          label="导出字段"
          name="fields"
          required
          validationMode="onSubmit"
          validate={(value) => ((value as string[] | undefined)?.length ? null : '至少选择一项。')}
          error="至少选择一项。"
        >
          <Checkbox value="id" label="编号" />
        </CheckboxGroup>
        <Button type="submit">导出</Button>
      </Form>,
    );
    await user.click(screen.getByRole('button', { name: '导出' }));
    await waitFor(() => expect(screen.getByText('至少选择一项。')).toBeVisible());
    expect(onSubmit).not.toHaveBeenCalled();
    await user.click(screen.getByRole('checkbox', { name: '编号' }));
    await user.click(screen.getByRole('button', { name: '导出' }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
  });

  it('disabled group disables every item; one item can be disabled alone', () => {
    const { rerender } = render(
      <CheckboxGroup label="组">
        <Checkbox value="a" label="甲" />
        <Checkbox value="b" label="乙" disabled />
      </CheckboxGroup>,
    );
    expect(screen.getByRole('checkbox', { name: '甲' })).not.toHaveAttribute('aria-disabled');
    expect(screen.getByRole('checkbox', { name: '乙' })).toHaveAttribute('aria-disabled', 'true');
    rerender(
      <CheckboxGroup label="组" disabled>
        <Checkbox value="a" label="甲" />
        <Checkbox value="b" label="乙" disabled />
      </CheckboxGroup>,
    );
    expect(screen.getByRole('checkbox', { name: '甲' })).toHaveAttribute('aria-disabled', 'true');
  });
});

describe('RadioGroup', () => {
  function Levels(props: Partial<React.ComponentProps<typeof RadioGroup>>) {
    return (
      <RadioGroup label="保密级别" name="level" description="决定可见范围。" {...props}>
        <Radio value="public" label="公开" />
        <Radio value="internal" label="内部" description="仅本机构成员可见。" />
        <Radio value="secret" label="机密" disabled />
      </RadioGroup>
    );
  }

  it('is a named radiogroup with descriptions', () => {
    render(<Levels />);
    const group = screen.getByRole('radiogroup', { name: '保密级别' });
    expect(group).toHaveAccessibleDescription('决定可见范围。');
    expect(screen.getByRole('radio', { name: '内部' })).toHaveAccessibleDescription(expect.stringContaining('仅本机构成员可见。'));
  });

  it('Tab enters at the checked option; arrows move and select; disabled options are skipped', async () => {
    const user = userEvent.setup();
    render(
      <>
        <button type="button">before</button>
        <Levels defaultValue="internal" />
        <button type="button">after</button>
      </>,
    );
    await user.click(screen.getByRole('button', { name: 'before' }));
    await user.tab();
    const internal = screen.getByRole('radio', { name: '内部' });
    expect(internal).toHaveFocus();
    await user.keyboard('{ArrowDown}');
    // 机密 is disabled, so focus wraps to 公开.
    const pub = screen.getByRole('radio', { name: '公开' });
    expect(pub).toHaveFocus();
    expect(pub).toHaveAttribute('aria-checked', 'true');
    await user.tab();
    expect(screen.getByRole('button', { name: 'after' })).toHaveFocus();
  });

  it('submits the chosen value; controlled via onValueChange', async () => {
    const user = userEvent.setup();
    function Harness() {
      const [value, setValue] = React.useState<unknown>('public');
      return (
        <form>
          <Levels value={value} onValueChange={setValue} />
          <output>{String(value)}</output>
        </form>
      );
    }
    const { container } = render(<Harness />);
    await user.click(screen.getByText('内部'));
    expect(screen.getByRole('status')).toHaveTextContent('internal');
    expect(formEntries(container.querySelector('form')!)).toEqual([['level', 'internal']]);
  });

  it('required: Form blocks submit and shows the group error', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn((e: React.FormEvent) => e.preventDefault());
    render(
      <Form onSubmit={onSubmit}>
        <Levels required error="请选择保密级别。" />
        <Button type="submit">保存</Button>
      </Form>,
    );
    expect(screen.getByRole('radiogroup', { name: '保密级别' })).toHaveAttribute('aria-required', 'true');
    await user.click(screen.getByRole('button', { name: '保存' }));
    expect(onSubmit).not.toHaveBeenCalled();
    await waitFor(() => expect(screen.getByText('请选择保密级别。')).toBeVisible());
    await user.click(screen.getByText('公开'));
    await user.click(screen.getByRole('button', { name: '保存' }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
  });

  it('disabled group disables every radio', () => {
    render(<Levels disabled />);
    for (const radio of screen.getAllByRole('radio')) expect(radio).toHaveAttribute('aria-disabled', 'true');
  });

  it('throws when Radio is used outside RadioGroup', () => {
    errors.mockImplementation(() => {});
    expect(() => render(<Radio value="a" label="甲" />)).toThrow();
    errors.mockClear();
  });
});

describe('Switch', () => {
  it('has switch semantics and toggles on click and Space', async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    render(<Switch label="自动归档" description="复核通过 30 天后移入归档。" onCheckedChange={onCheckedChange} />);
    const sw = screen.getByRole('switch', { name: '自动归档' });
    expect(sw).toHaveAccessibleDescription('复核通过 30 天后移入归档。');
    await user.click(screen.getByText('自动归档'));
    expect(sw).toHaveAttribute('aria-checked', 'true');
    sw.focus();
    await user.keyboard(' ');
    expect(sw).toHaveAttribute('aria-checked', 'false');
    expect(onCheckedChange).toHaveBeenCalledTimes(2);
  });

  it('submits "on" only when checked', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <form>
        <Switch name="auto" label="自动" />
      </form>,
    );
    const form = container.querySelector('form')!;
    expect(formEntries(form)).toEqual([]);
    await user.click(screen.getByRole('switch', { name: '自动' }));
    expect(formEntries(form)).toEqual([['auto', 'on']]);
  });

  it('readOnly keeps focus but ignores toggles; disabled is inert', async () => {
    const user = userEvent.setup();
    render(
      <>
        <Switch label="只读" readOnly defaultChecked />
        <Switch label="禁用" disabled />
      </>,
    );
    const ro = screen.getByRole('switch', { name: '只读' });
    await user.click(ro);
    expect(ro).toHaveAttribute('aria-checked', 'true');
    expect(ro).toHaveAttribute('aria-readonly', 'true');
    const off = screen.getByRole('switch', { name: '禁用' });
    await user.click(off);
    expect(off).toHaveAttribute('aria-checked', 'false');
  });
});

describe('Fieldset', () => {
  it('names and describes the group; disabled reaches every control inside', () => {
    render(
      <Fieldset legend="联系方式" description="用于复核提醒。" disabled>
        <Field label="邮箱">
          <Input type="email" />
        </Field>
        <Checkbox label="接收摘要" />
        <Switch label="短信" />
      </Fieldset>,
    );
    const group = screen.getByRole('group', { name: '联系方式' });
    expect(group.tagName).toBe('FIELDSET');
    expect(group).toHaveAccessibleDescription('用于复核提醒。');
    expect(screen.getByRole('textbox', { name: '邮箱' })).toBeDisabled();
    expect(screen.getByRole('checkbox', { name: '接收摘要' })).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByRole('switch', { name: '短信' })).toHaveAttribute('aria-disabled', 'true');
  });
});

describe('Separator & VisuallyHidden', () => {
  it('Separator exposes orientation; decorative one is hidden', () => {
    render(
      <>
        <Separator orientation="vertical" data-testid="v" />
        <Separator decorative data-testid="d" />
      </>,
    );
    const sep = screen.getByRole('separator');
    expect(sep).toHaveAttribute('aria-orientation', 'vertical');
    expect(screen.getByTestId('d')).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getAllByRole('separator')).toHaveLength(1);
  });

  it('VisuallyHidden stays in the accessibility tree', () => {
    render(
      <button type="button">
        <svg aria-hidden="true" />
        <VisuallyHidden>删除记录</VisuallyHidden>
      </button>,
    );
    expect(screen.getByRole('button', { name: '删除记录' })).toBeInTheDocument();
  });

  it('focusable VisuallyHidden marks itself for the reveal-on-focus style', () => {
    render(
      <VisuallyHidden as="div" focusable>
        <a href="#main">跳到正文</a>
      </VisuallyHidden>,
    );
    expect(screen.getByRole('link', { name: '跳到正文' }).parentElement).toHaveAttribute('data-focusable', 'true');
  });
});

describe('reduced motion', () => {
  it('controls render and toggle under data-rl-motion="reduce" without errors', async () => {
    const user = userEvent.setup();
    render(
      <RhineProvider motion="reduce">
        <Switch label="自动" />
        <RadioGroup label="级别" defaultValue="a">
          <Radio value="a" label="甲" />
          <Radio value="b" label="乙" />
        </RadioGroup>
        <Checkbox label="确认" />
      </RhineProvider>,
    );
    expect(document.querySelector('.rl-theme')).toHaveAttribute('data-rl-motion', 'reduce');
    await user.click(screen.getByRole('switch', { name: '自动' }));
    await user.click(screen.getByText('乙'));
    await user.click(screen.getByText('确认'));
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('radio', { name: '乙' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('checkbox')).toHaveAttribute('aria-checked', 'true');
  });
});
