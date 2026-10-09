import * as React from 'react';
import { MotionConfig } from 'motion/react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Button } from '../src';

describe('Button', () => {
  it('renders a native button with type="button" by default', () => {
    render(<Button>保存记录</Button>);
    const button = screen.getByRole('button', { name: '保存记录' });
    expect(button.tagName).toBe('BUTTON');
    expect(button).toHaveAttribute('type', 'button');
    expect(button).toHaveAttribute('data-variant', 'primary');
    expect(button).toHaveAttribute('data-size', 'md');
  });

  it('does not submit a surrounding form unless type="submit"', async () => {
    const onSubmit = vi.fn((e: React.FormEvent) => e.preventDefault());
    render(
      <form onSubmit={onSubmit}>
        <Button>Plain</Button>
        <Button type="submit">Submit</Button>
      </form>,
    );
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Plain' }));
    expect(onSubmit).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Submit' }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('activates with mouse, Enter and Space', async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Run</Button>);
    const user = userEvent.setup();
    await user.click(screen.getByRole('button'));
    await user.tab();
    await user.tab({ shift: true });
    expect(screen.getByRole('button')).toHaveFocus();
    await user.keyboard('{Enter}');
    await user.keyboard(' ');
    expect(onClick).toHaveBeenCalledTimes(3);
  });

  it('disabled blocks activation and leaves the tab order', async () => {
    const onClick = vi.fn();
    render(
      <>
        <Button disabled onClick={onClick}>
          Disabled
        </Button>
        <Button>Next</Button>
      </>,
    );
    const user = userEvent.setup();
    const disabled = screen.getByRole('button', { name: 'Disabled' });
    expect(disabled).toBeDisabled();
    await user.click(disabled);
    await user.tab();
    expect(screen.getByRole('button', { name: 'Next' })).toHaveFocus();
    expect(onClick).not.toHaveBeenCalled();
  });

  describe('loading', () => {
    it('keeps the accessible name and focus, and announces busy', () => {
      render(<Button loading>保存记录</Button>);
      const button = screen.getByRole('button', { name: '保存记录' });
      expect(button).toHaveAttribute('aria-busy', 'true');
      expect(button).toHaveAttribute('aria-disabled', 'true');
      expect(button).not.toBeDisabled();
      button.focus();
      expect(button).toHaveFocus();
    });

    it('prevents repeated activation and form submission', async () => {
      const onClick = vi.fn();
      const onSubmit = vi.fn((e: React.FormEvent) => e.preventDefault());
      render(
        <form onSubmit={onSubmit}>
          <Button type="submit" loading onClick={onClick}>
            Save
          </Button>
        </form>,
      );
      const user = userEvent.setup();
      const button = screen.getByRole('button');
      await user.click(button);
      await user.click(button);
      button.focus();
      await user.keyboard('{Enter}');
      expect(onClick).not.toHaveBeenCalled();
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it('keeps focus on the same element when loading toggles', async () => {
      function Harness() {
        const [busy, setBusy] = React.useState(false);
        return (
          <Button loading={busy} onClick={() => setBusy(true)}>
            Process
          </Button>
        );
      }
      render(<Harness />);
      const user = userEvent.setup();
      const button = screen.getByRole('button', { name: 'Process' });
      await user.click(button);
      expect(button).toHaveAttribute('aria-busy', 'true');
      expect(button).toHaveFocus();
      expect(screen.getByRole('button', { name: 'Process' })).toBe(button);
    });

    it('renders a decorative spinner only while loading', () => {
      const { container, rerender } = render(<Button>Go</Button>);
      expect(container.querySelector('.rl-button__spinner')).toBeNull();
      rerender(<Button loading>Go</Button>);
      const spinner = container.querySelector('.rl-button__spinner');
      expect(spinner).not.toBeNull();
      expect(spinner).toHaveAttribute('aria-hidden', 'true');
    });
  });

  it('forwards refs, className and native props', () => {
    const ref = React.createRef<HTMLButtonElement>();
    render(
      <Button ref={ref} className="custom" aria-describedby="hint" data-testid="btn" variant="accent" size="lg">
        Go
      </Button>,
    );
    const button = screen.getByTestId('btn');
    expect(ref.current).toBe(button);
    expect(button).toHaveClass('rl-button', 'custom');
    expect(button).toHaveAttribute('aria-describedby', 'hint');
    expect(button).toHaveAttribute('data-variant', 'accent');
    expect(button).toHaveAttribute('data-size', 'lg');
  });

  it('hides decorative icons from assistive tech', () => {
    render(<Button iconStart={<svg data-testid="icon" />}>Export</Button>);
    expect(screen.getByRole('button', { name: 'Export' })).toBeInTheDocument();
    expect(screen.getByTestId('icon').parentElement).toHaveAttribute('aria-hidden', 'true');
  });

  it('marks the spinner static under reduced motion', () => {
    const { container } = render(
      <MotionConfig reducedMotion="always">
        <Button loading>Go</Button>
      </MotionConfig>,
    );
    expect(container.querySelector('.rl-spinner')).toHaveAttribute('data-reduced', 'true');
  });

  it('unmounts cleanly mid-loading without warnings', () => {
    const error = vi.spyOn(console, 'error');
    const { unmount } = render(<Button loading>Go</Button>);
    unmount();
    expect(error).not.toHaveBeenCalled();
  });
});
