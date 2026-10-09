import * as React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Button, Field, Input } from '../src';

describe('Field + Input', () => {
  it('labels the control and reads the description', () => {
    render(
      <Field label="记录编号" description="由归档系统分配。">
        <Input name="id" />
      </Field>,
    );
    const input = screen.getByRole('textbox', { name: '记录编号' });
    expect(input).toHaveAccessibleDescription('由归档系统分配。');
    expect(input).toHaveAttribute('name', 'id');
  });

  it('clicking the label focuses the control', async () => {
    const user = userEvent.setup();
    render(
      <Field label="名称">
        <Input />
      </Field>,
    );
    await user.click(screen.getByText('名称'));
    expect(screen.getByRole('textbox', { name: '名称' })).toHaveFocus();
  });

  it('marks required visually without polluting the accessible name', () => {
    render(
      <Field label="记录编号" required>
        <Input required />
      </Field>,
    );
    const input = screen.getByRole('textbox', { name: '记录编号' });
    expect(input).toBeRequired();
    expect(screen.getByText('*')).toHaveAttribute('aria-hidden', 'true');
  });

  it('shows the native validity error on submit and links it to the control', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn((e: React.FormEvent) => e.preventDefault());
    render(
      <form onSubmit={onSubmit} noValidate={false}>
        <Field label="记录编号" error="请填写记录编号。" errorMatch="valueMissing" validationMode="onChange">
          <Input required />
        </Field>
        <Button type="submit">提交</Button>
      </form>,
    );
    const input = screen.getByRole('textbox', { name: '记录编号' });
    await user.type(input, 'A');
    await user.clear(input);
    await waitFor(() => expect(input).toHaveAttribute('aria-invalid', 'true'));
    expect(screen.getByText('请填写记录编号。')).toBeVisible();
    expect(input).toHaveAccessibleDescription(expect.stringContaining('请填写记录编号。'));
    await user.type(input, 'ARC-1');
    await waitFor(() => expect(input).not.toHaveAttribute('aria-invalid'));
    expect(screen.queryByText('请填写记录编号。')).toBeNull();
  });

  it('renders an externally controlled error when invalid is set', () => {
    render(
      <Field label="编号" invalid error="该编号已存在。">
        <Input defaultValue="ARC-1024" />
      </Field>,
    );
    const input = screen.getByRole('textbox', { name: '编号' });
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription(expect.stringContaining('该编号已存在。'));
  });

  it('runs a custom validate function', async () => {
    const user = userEvent.setup();
    render(
      <Field
        label="档案编号"
        validationMode="onBlur"
        validate={(value) => (/^ARC-\d{4}$/.test(String(value)) ? null : '格式应为 ARC-0000。')}
        error="格式应为 ARC-0000。"
      >
        <Input />
      </Field>,
    );
    const input = screen.getByRole('textbox', { name: '档案编号' });
    await user.type(input, 'abc');
    await user.tab();
    await waitFor(() => expect(input).toHaveAttribute('aria-invalid', 'true'));
    await user.clear(input);
    await user.type(input, 'ARC-1024');
    await user.tab();
    await waitFor(() => expect(input).not.toHaveAttribute('aria-invalid'));
  });

  it('disabled on Field disables the control and leaves the tab order', async () => {
    const user = userEvent.setup();
    render(
      <>
        <Field label="名称" disabled>
          <Input />
        </Field>
        <button type="button">next</button>
      </>,
    );
    expect(screen.getByRole('textbox', { name: '名称' })).toBeDisabled();
    await user.tab();
    expect(screen.getByRole('button', { name: 'next' })).toHaveFocus();
  });

  it('readOnly stays focusable and does not accept typing', async () => {
    const user = userEvent.setup();
    render(
      <Field label="创建时间">
        <Input readOnly defaultValue="2026-10-09" />
      </Field>,
    );
    const input = screen.getByRole('textbox', { name: '创建时间' });
    await user.click(input);
    expect(input).toHaveFocus();
    await user.type(input, 'x');
    expect(input).toHaveValue('2026-10-09');
    expect(input.closest('.rl-input')).toHaveAttribute('data-readonly', 'true');
  });

  it('controlled value with onValueChange', async () => {
    const user = userEvent.setup();
    function Harness() {
      const [value, setValue] = React.useState('');
      return (
        <>
          <Field label="标题">
            <Input value={value} onValueChange={setValue} />
          </Field>
          <output>{value}</output>
        </>
      );
    }
    render(<Harness />);
    await user.type(screen.getByRole('textbox', { name: '标题' }), '样本');
    expect(screen.getByRole('status')).toHaveTextContent('样本');
  });

  it('suffix text is announced as a description; prefix icon is hidden', () => {
    render(
      <Field label="直径" description="以样本最宽处计。">
        <Input prefix={<svg data-testid="icon" />} suffix="mm" mono inputMode="decimal" />
      </Field>,
    );
    const input = screen.getByRole('textbox', { name: '直径' });
    expect(input).toHaveAccessibleDescription(expect.stringContaining('mm'));
    expect(input).toHaveAccessibleDescription(expect.stringContaining('以样本最宽处计。'));
    expect(screen.getByTestId('icon').parentElement).toHaveAttribute('aria-hidden', 'true');
  });

  it('standalone Input forwards ref and accepts aria-label', () => {
    const ref = React.createRef<HTMLInputElement>();
    render(<Input ref={ref} aria-label="搜索档案" type="search" invalid />);
    const input = screen.getByRole('searchbox', { name: '搜索档案' });
    expect(ref.current).toBe(input);
    expect(input).toHaveAttribute('aria-invalid', 'true');
  });
});
