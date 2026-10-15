'use client';

import * as React from 'react';
import { MotionConfigContext } from 'motion/react';

const query = '(prefers-reduced-motion: reduce)';
let media: MediaQueryList | undefined;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((listener) => listener());

function getMedia() {
  if (typeof window === 'undefined' || !window.matchMedia) return undefined;
  return media ??= window.matchMedia(query);
}
function subscribe(listener: () => void) {
  const source = getMedia();
  if (!listeners.size) source?.addEventListener('change', notify);
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
    if (!listeners.size) {
      source?.removeEventListener('change', notify);
      media = undefined;
    }
  };
}
const snapshot = () => getMedia()?.matches ?? false;
const serverSnapshot = () => false;

/** Motion 14 snapshots the OS flag on mount; this shared store also observes live changes. */
export function useMotionPreference(): boolean {
  const system = React.useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  const { reducedMotion } = React.useContext(MotionConfigContext);
  return reducedMotion === 'always' || (reducedMotion !== 'never' && system);
}
