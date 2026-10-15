import { act, render, screen } from '@testing-library/react';
import { MotionConfig } from 'motion/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useRhineMotion } from '../src/motion/useRhineMotion.js';
import { useMotionLifecycle } from '../src/motion/lifecycle.js';

function Probe() {
  const motion = useRhineMotion();
  const lifecycle = useMotionLifecycle({ active: true });
  return <output data-testid="preference" data-reduced={motion.reduced} data-state={lifecycle.state} />;
}
afterEach(() => vi.unstubAllGlobals());

describe('live motion preference', () => {
  it('shares one media listener and reacts without remounting', () => {
    let matches = false;
    const callbacks = new Set<() => void>();
    const add = vi.fn((_type, callback) => callbacks.add(callback));
    const remove = vi.fn((_type, callback) => callbacks.delete(callback));
    vi.stubGlobal('matchMedia', () => ({ get matches() { return matches; }, addEventListener: add, removeEventListener: remove }));
    const { unmount } = render(<MotionConfig reducedMotion="user"><Probe /></MotionConfig>);
    expect(screen.getByTestId('preference')).toHaveAttribute('data-reduced', 'false');
    expect(add).toHaveBeenCalledTimes(1);
    act(() => { matches = true; callbacks.forEach((callback) => callback()); });
    expect(screen.getByTestId('preference')).toHaveAttribute('data-reduced', 'true');
    expect(screen.getByTestId('preference')).toHaveAttribute('data-state', 'paused');
    act(() => { matches = false; callbacks.forEach((callback) => callback()); });
    expect(screen.getByTestId('preference')).toHaveAttribute('data-state', 'running');
    unmount();
    expect(remove).toHaveBeenCalledTimes(1);
  });
  it('preserves explicit MotionConfig policy', () => {
    vi.stubGlobal('matchMedia', () => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() }));
    const { rerender } = render(<MotionConfig reducedMotion="never"><Probe /></MotionConfig>);
    expect(screen.getByTestId('preference')).toHaveAttribute('data-reduced', 'false');
    rerender(<MotionConfig reducedMotion="always"><Probe /></MotionConfig>);
    expect(screen.getByTestId('preference')).toHaveAttribute('data-reduced', 'true');
  });
});
