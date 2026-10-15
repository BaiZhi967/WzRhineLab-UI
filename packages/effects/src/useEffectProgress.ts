'use client';

import * as React from 'react';
import { animate, useMotionValue } from 'motion/react';
import type { MotionValue } from 'motion/react';
import { transition, useMotionLifecycle } from '@wzrhine/react';
import { useEffectTiming } from './clock.js';

export type EffectProgressState = 'idle' | 'running' | 'paused' | 'settled';
export type EffectProgressPreset = Exclude<keyof typeof transition, 'loop'>;
export interface EffectProgressOptions {
  active: boolean;
  viewportRef: React.RefObject<Element | null>;
  preset?: EffectProgressPreset;
  onSettled?: (active: boolean) => void;
}
export interface EffectProgressResult {
  progress: MotionValue<number>;
  state: EffectProgressState;
  reduced: boolean;
}

/** A visual target, not task progress: state and accessible content must update independently. */
export function useEffectProgress({ active, viewportRef, preset = 'scene', onSettled }: EffectProgressOptions): EffectProgressResult {
  const timing = useEffectTiming();
  const lifecycle = useMotionLifecycle({ active: true, viewportRef, reduced: timing.reduced });
  const progress = useMotionValue(active ? 1 : 0);
  const [state, setState] = React.useState<EffectProgressState>('settled');
  const lastTarget = React.useRef(active);
  const pending = React.useRef(false);
  const revision = React.useRef(0);
  const callback = React.useRef(onSettled);
  callback.current = onSettled;

  React.useEffect(() => {
    const token = ++revision.current;
    if (lastTarget.current !== active) {
      lastTarget.current = active;
      pending.current = true;
    }
    const target = active ? 1 : 0;
    const settle = () => {
      if (revision.current !== token) return;
      setState('settled');
      if (pending.current) {
        pending.current = false;
        callback.current?.(active);
      }
    };
    if (timing.reduced) {
      progress.jump(target);
      settle();
      return () => { revision.current += 1; };
    }
    if (progress.get() === target) {
      settle();
      return () => { revision.current += 1; };
    }
    if (!lifecycle.running) {
      setState('paused');
      return () => { revision.current += 1; };
    }
    setState('running');
    const spec = transition[preset];
    const controls = animate(progress, target, {
      ...spec,
      duration: timing.scale(spec.duration * 1000) / 1000,
      onComplete: settle,
    });
    return () => {
      revision.current += 1;
      controls.stop();
    };
  }, [active, lifecycle.running, timing, preset, progress]);
  return { progress, state, reduced: timing.reduced };
}
