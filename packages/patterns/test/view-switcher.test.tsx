import * as React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ViewSwitcher } from '../src';

const options = [
  { value: 'list', label: '列表' },
  { value: 'grid', label: '网格' },
  { value: 'table', label: '表格' },
] as const;

function Harness() {
  const [value, setValue] = React.useState<string>('list');
  return <ViewSwitcher label="视图" options={options} value={value} onValueChange={setValue} />;
}

describe('ViewSwitcher semantics', () => {
  it('renders a radiogroup with the current value announced', () => {
    render(<Harness />);
    const group = screen.getByRole('radiogroup', { name: '视图' });
    expect(within(group).getByRole('radio', { name: '列表' })).toHaveAttribute('aria-checked', 'true');
    expect(within(group).getByRole('radio', { name: '网格' })).toHaveAttribute('aria-checked', 'false');
  });

  it('icons never remain the only label (text label always rendered)', () => {
    render(
      <ViewSwitcher
        label="视图"
        options={[{ value: 'a', label: '列表', icon: <svg data-testid="i" /> }]}
        value="a"
      />,
    );
    expect(screen.getByRole('radio', { name: '列表' })).toBeInTheDocument();
    expect(screen.getByTestId('i')).toBeInTheDocument();
  });

  it('clicking another option reports the intent', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<ViewSwitcher label="视图" options={options} value="list" onValueChange={onValueChange} />);
    await user.click(screen.getByRole('radio', { name: '网格' }));
    expect(onValueChange).toHaveBeenCalledWith('grid');
  });

  it('uncontrolled usage starts from defaultValue (first option without one)', async () => {
    const user = userEvent.setup();
    render(<ViewSwitcher label="视图" options={options} defaultValue="grid" />);
    expect(screen.getByRole('radio', { name: '网格' })).toHaveAttribute('aria-checked', 'true');
    await user.click(screen.getByRole('radio', { name: '表格' }));
    expect(screen.getByRole('radio', { name: '表格' })).toHaveAttribute('aria-checked', 'true');
  });
});

describe('ViewSwitcher keyboard', () => {
  it('ArrowRight moves focus and selects the next option, wrapping at the end', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.tab();
    expect(screen.getByRole('radio', { name: '列表' })).toHaveFocus();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('radio', { name: '网格' })).toHaveFocus();
    expect(screen.getByRole('radio', { name: '网格' })).toHaveAttribute('aria-checked', 'true');
    await user.keyboard('{ArrowRight}{ArrowRight}');
    expect(screen.getByRole('radio', { name: '列表' })).toHaveAttribute('aria-checked', 'true');
  });

  it('ArrowLeft moves backwards; Home and End jump to the edges', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.tab();
    await user.keyboard('{ArrowLeft}');
    expect(screen.getByRole('radio', { name: '表格' })).toHaveFocus();
    await user.keyboard('{Home}');
    expect(screen.getByRole('radio', { name: '列表' })).toHaveFocus();
    await user.keyboard('{End}');
    expect(screen.getByRole('radio', { name: '表格' })).toHaveFocus();
  });

  it('only the checked option is in the tab order (roving tabindex)', () => {
    render(<Harness />);
    expect(screen.getByRole('radio', { name: '列表' })).toHaveAttribute('tabindex', '0');
    expect(screen.getByRole('radio', { name: '网格' })).toHaveAttribute('tabindex', '-1');
  });

  it('disabled options are skipped by arrow navigation', async () => {
    const user = userEvent.setup();
    const mixed = [
      { value: 'list', label: '列表' },
      { value: 'grid', label: '网格', disabled: true },
      { value: 'table', label: '表格' },
    ];
    function MixedHarness() {
      const [value, setValue] = React.useState('list');
      return <ViewSwitcher label="视图" options={mixed} value={value} onValueChange={setValue} />;
    }
    render(<MixedHarness />);
    await user.tab();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('radio', { name: '表格' })).toHaveFocus();
    expect(screen.getByRole('radio', { name: '表格' })).toHaveAttribute('aria-checked', 'true');
  });
});

describe('ViewSwitcher fallback boundary', () => {
  it('a value outside the options renders nothing checked; the first option becomes tabbable', () => {
    render(<ViewSwitcher label="视图" options={options} value="gone" />);
    const radios = screen.getAllByRole('radio');
    expect(radios.map((r) => r.getAttribute('aria-checked'))).toEqual(['false', 'false', 'false']);
    expect(radios[0]).toHaveAttribute('tabindex', '0');
  });

  it('the whole group can be disabled', () => {
    render(<ViewSwitcher label="视图" options={options} value="list" disabled />);
    for (const radio of screen.getAllByRole('radio')) {
      expect(radio).toBeDisabled();
    }
  });
});
