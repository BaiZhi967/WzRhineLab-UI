import * as React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { StatusBadge, Surface } from '../src';
import type { StatusKind } from '../src';

describe('Surface', () => {
  it('renders a section that becomes a region landmark when labelled', () => {
    render(
      <Surface aria-labelledby="t">
        <h2 id="t">样本记录</h2>
      </Surface>,
    );
    const region = screen.getByRole('region', { name: '样本记录' });
    expect(region.tagName).toBe('SECTION');
    expect(region).toHaveAttribute('data-tone', 'default');
    expect(region).toHaveAttribute('data-padding', 'md');
    expect(region).toHaveAttribute('data-bordered', 'true');
  });

  it('supports alternate elements, tones and padding', () => {
    const ref = React.createRef<HTMLElement>();
    render(<Surface ref={ref} as="div" tone="raised" padding="none" bordered={false} data-testid="s" />);
    const el = screen.getByTestId('s');
    expect(el.tagName).toBe('DIV');
    expect(ref.current).toBe(el);
    expect(el).toHaveAttribute('data-tone', 'raised');
    expect(el).toHaveAttribute('data-padding', 'none');
    expect(el).not.toHaveAttribute('data-bordered');
  });
});

describe('StatusBadge', () => {
  const statuses: StatusKind[] = ['neutral', 'info', 'success', 'warning', 'danger'];

  it.each(statuses)('%s keeps a visible text label and decorative indicator', (status) => {
    const { container } = render(<StatusBadge status={status}>状态 {status}</StatusBadge>);
    expect(screen.getByText(`状态 ${status}`)).toBeVisible();
    const badge = container.querySelector('.rl-badge');
    expect(badge).toHaveAttribute('data-status', status);
    expect(container.querySelector('.rl-badge__indicator')).toHaveAttribute('aria-hidden', 'true');
  });

  it('defaults to neutral, md, subtle and passes native props', () => {
    render(
      <StatusBadge title="审核中" data-testid="b">
        Review
      </StatusBadge>,
    );
    const badge = screen.getByTestId('b');
    expect(badge).toHaveAttribute('data-status', 'neutral');
    expect(badge).toHaveAttribute('data-size', 'md');
    expect(badge).toHaveAttribute('data-appearance', 'subtle');
    expect(badge).toHaveAttribute('title', '审核中');
  });
});
