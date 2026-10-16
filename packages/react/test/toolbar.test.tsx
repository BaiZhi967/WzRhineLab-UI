import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { RhineProvider } from '../src';
import { ToggleButton } from '../src/components/ToggleButton';
import { Toolbar } from '../src/components/Toolbar';

function renderWithProvider(children: React.ReactNode) {
  return render(<RhineProvider theme="light">{children}</RhineProvider>);
}

describe('Toolbar', () => {
  it('provides toolbar semantics and roving focus with arrow/Home/End keys', async () => {
    const user = userEvent.setup();
    renderWithProvider(
      <Toolbar label="Formatting">
        <button type="button">Bold</button>
        <button type="button">Italic</button>
        <button type="button">Code</button>
      </Toolbar>,
    );
    const toolbar = screen.getByRole('toolbar', { name: 'Formatting' });
    expect(toolbar).toHaveAttribute('aria-orientation', 'horizontal');
    const bold = screen.getByRole('button', { name: 'Bold' });
    const italic = screen.getByRole('button', { name: 'Italic' });
    const code = screen.getByRole('button', { name: 'Code' });
    expect(bold).toHaveAttribute('tabindex', '0');
    await user.click(bold);
    await user.keyboard('{ArrowRight}');
    expect(italic).toHaveFocus();
    await user.keyboard('{End}');
    expect(code).toHaveFocus();
    await user.keyboard('{Home}');
    expect(bold).toHaveFocus();
  });

  it('skips disabled items and keeps instances independent', async () => {
    const user = userEvent.setup();
    renderWithProvider(
      <>
        <Toolbar label="First">
          <button type="button">One</button>
          <button type="button" disabled>Disabled</button>
          <button type="button">Three</button>
        </Toolbar>
        <Toolbar label="Second">
          <button type="button">A</button>
          <button type="button">B</button>
        </Toolbar>
      </>,
    );
    const one = screen.getByRole('button', { name: 'One' });
    const three = screen.getByRole('button', { name: 'Three' });
    await user.click(one);
    await user.keyboard('{ArrowRight}');
    expect(three).toHaveFocus();
    expect(screen.getByRole('button', { name: 'A' })).toHaveAttribute('tabindex', '0');
  });

  it('supports vertical orientation', async () => {
    const user = userEvent.setup();
    renderWithProvider(
      <Toolbar label="Vertical" orientation="vertical">
        <button type="button">Top</button>
        <button type="button">Bottom</button>
      </Toolbar>,
    );
    const toolbar = screen.getByRole('toolbar', { name: 'Vertical' });
    expect(toolbar).toHaveAttribute('aria-orientation', 'vertical');
    const top = screen.getByRole('button', { name: 'Top' });
    await user.click(top);
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('button', { name: 'Bottom' })).toHaveFocus();
  });
});

describe('ToggleButton', () => {
  it('exposes aria-pressed and emits the next state', async () => {
    const user = userEvent.setup();
    const onPressedChange = vi.fn();
    renderWithProvider(<ToggleButton pressed={false} onPressedChange={onPressedChange}>Bold</ToggleButton>);
    const button = screen.getByRole('button', { name: 'Bold' });
    expect(button).toHaveAttribute('aria-pressed', 'false');
    await user.click(button);
    expect(onPressedChange).toHaveBeenCalledWith(true);
  });

  it('supports keyboard activation and does not activate while disabled or loading', async () => {
    const user = userEvent.setup();
    const onPressedChange = vi.fn();
    renderWithProvider(
      <>
        <ToggleButton pressed={false} onPressedChange={onPressedChange}>Keyboard</ToggleButton>
        <ToggleButton pressed={false} onPressedChange={onPressedChange} disabled>Disabled</ToggleButton>
        <ToggleButton pressed={false} onPressedChange={onPressedChange} loading>Loading</ToggleButton>
      </>,
    );
    const keyboard = screen.getByRole('button', { name: 'Keyboard' });
    await user.click(keyboard);
    expect(onPressedChange).toHaveBeenCalledTimes(1);
    const loading = screen.getByRole('button', { name: 'Loading' });
    expect(loading).toHaveAttribute('aria-disabled', 'true');
    await user.click(loading);
    expect(onPressedChange).toHaveBeenCalledTimes(1);
  });
});
