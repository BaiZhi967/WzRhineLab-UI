import * as React from 'react';
import { MotionConfig } from 'motion/react';
import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { transition, useRhineMotion } from '../src';
import type { RhineTransitionName } from '../src';

function Probe({ name = 'base' }: { name?: RhineTransitionName }) {
  const motion = useRhineMotion();
  return <output data-testid="probe">{JSON.stringify({ reduced: motion.reduced, t: motion.get(name) })}</output>;
}

const read = () => JSON.parse(screen.getByTestId('probe').textContent ?? '{}') as {
  reduced: boolean;
  t: { duration: number };
};

describe('useRhineMotion', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns the named preset when motion is allowed', () => {
    render(
      <MotionConfig reducedMotion="never">
        <Probe name="panel" />
      </MotionConfig>,
    );
    expect(read()).toEqual({ reduced: false, t: JSON.parse(JSON.stringify(transition.panel)) });
  });

  it('collapses every preset to instant when MotionConfig forces reduce', () => {
    render(
      <MotionConfig reducedMotion="always">
        <Probe name="scene" />
      </MotionConfig>,
    );
    expect(read()).toEqual({ reduced: true, t: { duration: 0 } });
  });

  it('defaults to full motion without a MotionConfig', () => {
    render(<Probe />);
    expect(read().reduced).toBe(false);
  });
});
