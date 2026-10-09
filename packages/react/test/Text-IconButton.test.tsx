import * as React from 'react';
import { MotionConfig } from 'motion/react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { IconButton, Text } from '../src';

describe('Text', () => {
  it('picks a semantic default element per variant', () => {
    const { container } = render(
      <>
        <Text variant="heading-2">标题</Text>
        <Text>正文</Text>
        <Text variant="mono">ARC-1024</Text>
      </>,
    );
    expect(screen.getByRole('heading', { level: 2, name: '标题' })).toHaveAttribute('data-variant', 'heading-2');
    expect(screen.getByText('正文').tagName).toBe('P');
    expect(container.querySelector('[data-variant="mono"]')?.tagName).toBe('SPAN');
  });

  it('decouples visual size from heading level', () => {
    render(
      <Text variant="display" as="h2">
        展示标题
      </Text>,
    );
    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading).toHaveAttribute('data-variant', 'display');
  });

  it('applies tone, truncate and numeric flags and forwards native props', () => {
    const ref = React.createRef<HTMLElement>();
    render(
      <Text ref={ref} tone="muted" truncate numeric title="完整文本" as="time" dateTime="2026-10-09">
        2026-10-09
      </Text>,
    );
    const el = screen.getByText('2026-10-09');
    expect(ref.current).toBe(el);
    expect(el.tagName).toBe('TIME');
    expect(el).toHaveAttribute('datetime', '2026-10-09');
    expect(el).toHaveAttribute('data-tone', 'muted');
    expect(el).toHaveAttribute('data-truncate', 'true');
    expect(el).toHaveAttribute('data-numeric', 'true');
    expect(el).toHaveAttribute('title', '完整文本');
  });
});

describe('IconButton', () => {
  const icon = <svg data-testid="glyph" />;

  it('uses label as the accessible name and hides the icon', () => {
    render(<IconButton icon={icon} label="关闭面板" />);
    const button = screen.getByRole('button', { name: '关闭面板' });
    expect(button).toHaveAttribute('type', 'button');
    expect(button).toHaveAttribute('title', '关闭面板');
    expect(screen.getByTestId('glyph').parentElement).toHaveAttribute('aria-hidden', 'true');
  });

  it('accepts aria-labelledby instead of label', () => {
    render(
      <>
        <span id="lbl">固定</span>
        <IconButton icon={icon} aria-labelledby="lbl" />
      </>,
    );
    expect(screen.getByRole('button', { name: '固定' })).toBeInTheDocument();
  });

  it('exposes toggle state via aria-pressed', async () => {
    const user = userEvent.setup();
    function Toggle() {
      const [on, setOn] = React.useState(false);
      return <IconButton icon={icon} label="网格视图" pressed={on} onClick={() => setOn((v) => !v)} />;
    }
    render(<Toggle />);
    const button = screen.getByRole('button', { name: '网格视图' });
    expect(button).toHaveAttribute('aria-pressed', 'false');
    await user.click(button);
    expect(button).toHaveAttribute('aria-pressed', 'true');
    await user.keyboard(' ');
    expect(button).toHaveAttribute('aria-pressed', 'false');
  });

  it('disabled blocks activation', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<IconButton icon={icon} label="删除" disabled onClick={onClick} />);
    await user.click(screen.getByRole('button', { name: '删除' }));
    expect(onClick).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: '删除' })).toBeDisabled();
  });

  it('renders under reduced motion without errors', () => {
    const error = vi.spyOn(console, 'error');
    render(
      <MotionConfig reducedMotion="always">
        <IconButton icon={icon} label="刷新" />
      </MotionConfig>,
    );
    expect(screen.getByRole('button', { name: '刷新' })).toBeInTheDocument();
    expect(error).not.toHaveBeenCalled();
  });
});
