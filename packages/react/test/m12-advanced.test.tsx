import * as React from 'react';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  Accordion,
  AccordionItem,
  Button,
  ContextMenu,
  MenuCheckboxItem,
  MenuItem,
  MenuSeparator,
  NumberField,
  RhineProvider,
  Slider,
  enUS,
} from '../src';

/** M12 group 1 (ADR-0010 §2): Accordion, Slider, NumberField, ContextMenu. */

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

const sections = [
  { value: 'scope', title: '适用范围', content: '仅限样本库内部记录。' },
  { value: 'method', title: '采样方法', content: '按批次抽取。', meta: '3 项' },
  { value: 'locked', title: '审批流程', content: '需要权限。', disabled: true },
];

describe('Accordion', () => {
  it('renders headings (default h3) wrapping buttons with aria-expanded and labelled regions', async () => {
    const user = userEvent.setup();
    render(<Accordion items={sections} />);
    const headings = screen.getAllByRole('heading', { level: 3 });
    expect(headings).toHaveLength(3);
    const trigger = within(headings[0]!).getByRole('button', { name: '适用范围' });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('region')).toBeNull();
    await user.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    const region = screen.getByRole('region', { name: '适用范围' });
    expect(region).toHaveTextContent('仅限样本库内部记录。');
    expect(trigger).toHaveAttribute('aria-controls', region.id);
  });

  it('headingLevel sets the heading element; an item can override it', () => {
    render(
      <Accordion headingLevel={4}>
        <AccordionItem value="a" title="甲">一</AccordionItem>
        <AccordionItem value="b" title="乙" headingLevel={5}>
          二
        </AccordionItem>
      </Accordion>,
    );
    expect(screen.getByRole('heading', { level: 4, name: '甲' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 5, name: '乙' })).toBeInTheDocument();
  });

  it('single mode closes the other item; multiple keeps both open', async () => {
    const user = userEvent.setup();
    const { unmount } = render(<Accordion items={sections} defaultValue={['scope']} />);
    await user.click(screen.getByRole('button', { name: /采样方法/ }));
    expect(screen.getByRole('button', { name: '适用范围' })).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByRole('button', { name: /采样方法/ })).toHaveAttribute('aria-expanded', 'true');
    unmount();

    render(<Accordion items={sections} multiple defaultValue={['scope']} />);
    await user.click(screen.getByRole('button', { name: /采样方法/ }));
    expect(screen.getByRole('button', { name: '适用范围' })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('button', { name: /采样方法/ })).toHaveAttribute('aria-expanded', 'true');
  });

  it('controlled value reports string[] and only changes through the parent', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const { rerender } = render(<Accordion items={sections} value={[]} onValueChange={onValueChange} />);
    await user.click(screen.getByRole('button', { name: '适用范围' }));
    expect(onValueChange).toHaveBeenLastCalledWith(['scope']);
    expect(screen.getByRole('button', { name: '适用范围' })).toHaveAttribute('aria-expanded', 'false');
    rerender(<Accordion items={sections} value={['method']} onValueChange={onValueChange} />);
    expect(screen.getByRole('button', { name: /采样方法/ })).toHaveAttribute('aria-expanded', 'true');
  });

  it('keyboard: Enter and Space toggle; Tab skips disabled triggers', async () => {
    const user = userEvent.setup();
    render(
      <>
        <Accordion items={[sections[0]!, sections[2]!, sections[1]!]} />
        <button type="button">之后</button>
      </>,
    );
    const first = screen.getByRole('button', { name: '适用范围' });
    first.focus();
    await user.keyboard('{Enter}');
    expect(first).toHaveAttribute('aria-expanded', 'true');
    await user.keyboard(' ');
    expect(first).toHaveAttribute('aria-expanded', 'false');
    const locked = screen.getByRole('button', { name: '审批流程' });
    expect(locked).toBeDisabled();
    await user.tab();
    expect(screen.getByRole('button', { name: /采样方法/ })).toHaveFocus();
  });

  it('meta text is part of the trigger name', () => {
    render(<Accordion items={sections} />);
    expect(screen.getByRole('button', { name: '采样方法 3 项' })).toBeInTheDocument();
  });
});

const effort = [
  { value: 0, label: '关闭' },
  { value: 1, label: '低' },
  { value: 2, label: '中' },
  { value: 3, label: '高' },
  { value: 4, label: '最高' },
];

describe('Slider', () => {
  it('names the range input from the visible label and exposes min / max / now', () => {
    render(<Slider label="执行强度" defaultValue={30} />);
    const slider = screen.getByRole('slider', { name: '执行强度' });
    expect(slider).toHaveAttribute('aria-valuenow', '30');
    expect(slider).toHaveAttribute('min', '0');
    expect(slider).toHaveAttribute('max', '100');
  });

  it('keyboard: arrows step, PageUp takes largeStep, Home / End jump', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Slider label="阈值" defaultValue={50} step={5} largeStep={20} onValueChange={onValueChange} />);
    const slider = screen.getByRole('slider', { name: '阈值' });
    slider.focus();
    await user.keyboard('{ArrowRight}');
    expect(slider).toHaveAttribute('aria-valuenow', '55');
    expect(onValueChange).toHaveBeenLastCalledWith(55);
    await user.keyboard('{ArrowDown}{ArrowDown}');
    expect(slider).toHaveAttribute('aria-valuenow', '45');
    await user.keyboard('{PageUp}');
    expect(slider).toHaveAttribute('aria-valuenow', '65');
    await user.keyboard('{End}');
    expect(slider).toHaveAttribute('aria-valuenow', '100');
    await user.keyboard('{Home}');
    expect(slider).toHaveAttribute('aria-valuenow', '0');
  });

  it('marks render ticks with labels and become the spoken value', async () => {
    const user = userEvent.setup();
    const { container } = render(<Slider label="执行强度" min={0} max={4} marks={effort} defaultValue={2} showValue />);
    const slider = screen.getByRole('slider', { name: '执行强度' });
    expect(slider).toHaveAttribute('aria-valuetext', '中');
    expect(container.querySelectorAll('.rl-slider__tick')).toHaveLength(5);
    expect(container.querySelector('.rl-slider__marks')).toHaveAttribute('aria-hidden', 'true');
    expect(container.querySelector('output')).toHaveTextContent('中');
    slider.focus();
    await user.keyboard('{ArrowRight}');
    expect(slider).toHaveAttribute('aria-valuetext', '高');
    expect(container.querySelector('output')).toHaveTextContent('高');
  });

  it('format uses the provider locale; formatValue and getAriaValueText override text', () => {
    render(
      <RhineProvider locale="de-DE">
        <Slider label="比例" defaultValue={0.25} min={0} max={1} step={0.01} format={{ style: 'percent' }} />
        <Slider label="温度" defaultValue={1234.5} max={2000} step={0.5} formatValue={(v) => `${v} K`} />
        <Slider label="自定" defaultValue={3} getAriaValueText={(f, v) => `第 ${v} 档`} />
      </RhineProvider>,
    );
    expect(screen.getByRole('slider', { name: '比例' })).toHaveAttribute(
      'aria-valuetext',
      new Intl.NumberFormat('de-DE', { style: 'percent' }).format(0.25),
    );
    expect(screen.getByRole('slider', { name: '温度' })).toHaveAttribute('aria-valuetext', '1234.5 K');
    expect(screen.getByRole('slider', { name: '自定' })).toHaveAttribute('aria-valuetext', '第 3 档');
  });

  it('range: one thumb per value with distinct names, reports arrays', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Slider label="温度范围" defaultValue={[20, 60]} thumbLabels={['下限', '上限']} onValueChange={onValueChange} />);
    const lower = screen.getByRole('slider', { name: '下限' });
    const upper = screen.getByRole('slider', { name: '上限' });
    expect(lower).toHaveAttribute('aria-valuenow', '20');
    expect(upper).toHaveAttribute('aria-valuenow', '60');
    upper.focus();
    await user.keyboard('{ArrowLeft}');
    expect(onValueChange).toHaveBeenLastCalledWith([20, 59]);
    expect(screen.getByRole('group', { name: '温度范围' })).toBeInTheDocument();
  });

  it('controlled value only changes through the parent', async () => {
    const user = userEvent.setup();
    function Harness() {
      const [value, setValue] = React.useState(2);
      return (
        <>
          <Slider label="档位" min={0} max={4} marks={effort} value={value} onValueChange={setValue} />
          <output data-testid="out">{value}</output>
        </>
      );
    }
    render(<Harness />);
    const slider = screen.getByRole('slider', { name: '档位' });
    slider.focus();
    await user.keyboard('{ArrowLeft}');
    expect(screen.getByTestId('out')).toHaveTextContent('1');
    expect(slider).toHaveAttribute('aria-valuetext', '低');
  });

  it('submits under name; disabled ignores keys', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <form>
        <Slider label="强度" name="effort" min={0} max={4} defaultValue={3} />
        <Slider label="锁定" name="locked" defaultValue={10} disabled />
      </form>,
    );
    expect(formEntries(container.querySelector('form')!)).toEqual([['effort', '3']]);
    const locked = screen.getByRole('slider', { name: '锁定' });
    expect(locked).toBeDisabled();
    await user.keyboard('{ArrowRight}');
    expect(locked).toHaveAttribute('aria-valuenow', '10');
  });

  it('description is linked to the thumb', () => {
    render(<Slider label="强度" description="越高越慢（示例）。" defaultValue={1} />);
    expect(screen.getByRole('slider', { name: '强度' })).toHaveAccessibleDescription('越高越慢（示例）。');
  });
});

describe('NumberField', () => {
  it('label, description and error are wired like Field', () => {
    render(<NumberField label="并发上限" description="1–16 个任务。" invalid error="超出范围。" defaultValue={20} />);
    const input = screen.getByRole('textbox', { name: '并发上限' });
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription(expect.stringContaining('1–16 个任务。'));
    expect(input).toHaveAccessibleDescription(expect.stringContaining('超出范围。'));
    expect(input).toHaveAttribute('aria-roledescription', '数字输入框');
  });

  it('stepper buttons have names from the message table and clamp at max', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<NumberField label="并发上限" min={1} max={4} defaultValue={3} onValueChange={onValueChange} />);
    const input = screen.getByRole('textbox', { name: '并发上限' });
    const increment = screen.getByRole('button', { name: '增加' });
    await user.click(increment);
    expect(input).toHaveValue('4');
    expect(onValueChange).toHaveBeenLastCalledWith(4);
    expect(increment).toBeDisabled();
    await user.click(screen.getByRole('button', { name: '减少' }));
    expect(input).toHaveValue('3');
  });

  it('keyboard: ArrowUp / ArrowDown step and clamp; Home / End jump to bounds', async () => {
    const user = userEvent.setup();
    render(<NumberField label="批次" min={0} max={10} step={2} defaultValue={6} />);
    const input = screen.getByRole('textbox', { name: '批次' });
    input.focus();
    await user.keyboard('{ArrowUp}');
    expect(input).toHaveValue('8');
    await user.keyboard('{ArrowUp}{ArrowUp}{ArrowUp}');
    expect(input).toHaveValue('10');
    await user.keyboard('{ArrowDown}');
    expect(input).toHaveValue('8');
    await user.keyboard('{Home}');
    expect(input).toHaveValue('0');
    await user.keyboard('{End}');
    expect(input).toHaveValue('10');
  });

  it('formats with Intl options and the provider locale; submits the raw number', () => {
    const { container } = render(
      <RhineProvider locale="de-DE">
        <form>
          <NumberField label="预算" name="budget" defaultValue={1234.5} format={{ style: 'currency', currency: 'EUR' }} />
        </form>
      </RhineProvider>,
    );
    expect(screen.getByRole('textbox', { name: '预算' })).toHaveValue(new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(1234.5));
    expect(formEntries(container.querySelector('form')!)).toEqual([['budget', '1234.5']]);
  });

  it('controlled value (number | null): typing reports numbers and clearing reports null', async () => {
    const user = userEvent.setup();
    const seen: Array<number | null> = [];
    function Harness() {
      const [value, setValue] = React.useState<number | null>(5);
      return (
        <NumberField
          label="重试次数"
          value={value}
          onValueChange={(next) => {
            seen.push(next);
            setValue(next);
          }}
        />
      );
    }
    render(<Harness />);
    const input = screen.getByRole('textbox', { name: '重试次数' });
    await user.clear(input);
    expect(seen.at(-1)).toBeNull();
    await user.type(input, '12');
    expect(seen.at(-1)).toBe(12);
    expect(input).toHaveValue('12');
  });

  it('disabled and readOnly block changes; steppers are unavailable', async () => {
    const user = userEvent.setup();
    render(
      <>
        <NumberField label="禁用" defaultValue={1} disabled />
        <NumberField label="只读" defaultValue={2} readOnly />
      </>,
    );
    expect(screen.getByRole('textbox', { name: '禁用' })).toBeDisabled();
    const readonly = screen.getByRole('textbox', { name: '只读' });
    expect(readonly).toHaveAttribute('readonly');
    readonly.focus();
    await user.keyboard('{ArrowUp}');
    expect(readonly).toHaveValue('2');
    // Base UI keeps steppers focusable-when-disabled: unavailable via aria-disabled (and native disabled at bounds / when disabled).
    for (const button of screen.getAllByRole('button')) expect(button).toHaveAttribute('aria-disabled', 'true');
  });

  it('size and unit: unit text is read as a description', () => {
    const { container } = render(<NumberField label="间隔" size="sm" unit="秒" defaultValue={30} />);
    expect(container.querySelector('.rl-number-field__group')).toHaveAttribute('data-size', 'sm');
    expect(screen.getByRole('textbox', { name: '间隔' })).toHaveAccessibleDescription('秒');
  });

  it('stepper names follow enUS and provider overrides', () => {
    render(
      <RhineProvider messages={{ ...enUS, numberField: { ...enUS.numberField, increment: 'Up one' } }}>
        <NumberField label="Count" defaultValue={1} />
      </RhineProvider>,
    );
    expect(screen.getByRole('button', { name: 'Up one' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Decrease' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Count' })).toHaveAttribute('aria-roledescription', 'Number field');
  });
});

describe('ContextMenu', () => {
  function Row({ onCopy = () => {} }: { onCopy?: () => void }) {
    return (
      <>
        <ContextMenu trigger={<div aria-label="记录 REC-0142">REC-0142</div>}>
          <MenuItem onSelect={onCopy}>复制编号</MenuItem>
          <MenuCheckboxItem defaultChecked>固定到顶部</MenuCheckboxItem>
          <MenuSeparator />
          <MenuItem tone="danger" disabled>
            删除
          </MenuItem>
        </ContextMenu>
        <Button>其他</Button>
      </>
    );
  }

  it('the target is focusable and opens a menu at the pointer on contextmenu', async () => {
    const user = userEvent.setup();
    const onCopy = vi.fn();
    render(<Row onCopy={onCopy} />);
    const target = screen.getByText('REC-0142');
    expect(target).toHaveAttribute('tabindex', '0');
    fireEvent.contextMenu(target, { clientX: 40, clientY: 40 });
    const menu = await screen.findByRole('menu');
    expect(menu.closest('.rl-menu')).not.toBeNull();
    expect(within(menu).getByRole('menuitemcheckbox', { name: '固定到顶部' })).toHaveAttribute('aria-checked', 'true');
    expect(within(menu).getByRole('menuitem', { name: '删除' })).toHaveAttribute('aria-disabled', 'true');
    await user.click(within(menu).getByRole('menuitem', { name: '复制编号' }));
    expect(onCopy).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(screen.queryByRole('menu')).toBeNull());
  });

  it('Escape closes and returns focus to the target', async () => {
    const user = userEvent.setup();
    render(<Row />);
    const target = screen.getByText('REC-0142');
    target.focus();
    // Shift+F10 / the ContextMenu key make the browser fire `contextmenu` on the focused element.
    fireEvent.contextMenu(target);
    await screen.findByRole('menu');
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('menu')).toBeNull());
    await waitFor(() => expect(target).toHaveFocus());
  });

  it('keeps an explicit tabIndex and supports controlled open', async () => {
    const onOpenChange = vi.fn();
    const { rerender } = render(
      <ContextMenu trigger={<div tabIndex={-1}>区域</div>} open={false} onOpenChange={onOpenChange}>
        <MenuItem>一</MenuItem>
      </ContextMenu>,
    );
    const target = screen.getByText('区域');
    expect(target).toHaveAttribute('tabindex', '-1');
    fireEvent.contextMenu(target);
    expect(onOpenChange).toHaveBeenLastCalledWith(true);
    expect(screen.queryByRole('menu')).toBeNull();
    rerender(
      <ContextMenu trigger={<div tabIndex={-1}>区域</div>} open onOpenChange={onOpenChange}>
        <MenuItem>一</MenuItem>
      </ContextMenu>,
    );
    expect(await screen.findByRole('menu')).toBeInTheDocument();
  });

  it('disabled leaves the native context menu alone', () => {
    render(
      <ContextMenu trigger={<div>区域</div>} disabled>
        <MenuItem>一</MenuItem>
      </ContextMenu>,
    );
    const event = new MouseEvent('contextmenu', { bubbles: true, cancelable: true });
    act(() => {
      screen.getByText('区域').dispatchEvent(event);
    });
    expect(event.defaultPrevented).toBe(false);
    expect(screen.queryByRole('menu')).toBeNull();
  });
});
