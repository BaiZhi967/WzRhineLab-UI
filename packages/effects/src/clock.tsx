'use client';

import * as React from 'react';
import { useRhineMotion } from '@wzrhine/react';

/**
 * Timing context for showcase effects. `speed` scales every effect duration (0.25 = four times
 * slower, used by the motion player's Slow lane); `reduced` forces the reduced-motion path in
 * addition to the OS / RhineProvider preference.
 */
interface EffectClockValue {
  speed: number;
  forceReduced: boolean;
}

const EffectClockContext = React.createContext<EffectClockValue>({ speed: 1, forceReduced: false });

export interface EffectClockProps {
  speed?: number;
  reduced?: boolean;
  children: React.ReactNode;
}

export function EffectClock({ speed = 1, reduced = false, children }: EffectClockProps) {
  const value = React.useMemo(() => ({ speed: speed > 0 ? speed : 1, forceReduced: reduced }), [speed, reduced]);
  return <EffectClockContext.Provider value={value}>{children}</EffectClockContext.Provider>;
}

export interface EffectTiming {
  speed: number;
  reduced: boolean;
  /** Scale a base duration (ms) by the current speed. */
  scale: (ms: number) => number;
}

export function useEffectTiming(): EffectTiming {
  const { speed, forceReduced } = React.useContext(EffectClockContext);
  const { reduced } = useRhineMotion();
  return React.useMemo(
    () => ({ speed, reduced: forceReduced || reduced, scale: (ms: number) => ms / speed }),
    [speed, forceReduced, reduced],
  );
}
