'use client';

import * as React from 'react';

/** How long the copied / failed feedback stays before the control returns to its idle label. */
export const COPY_FEEDBACK_MS = 1200;

export type CopyState = 'idle' | 'copied' | 'failed';

/**
 * Host copy handler. Return `false` (or throw / reject) to report a failure; anything else counts
 * as copied. Without a handler the text goes to `navigator.clipboard.writeText`.
 */
export type CopyHandler = (text: string) => void | boolean | Promise<void | boolean>;

/** True after mount when the async Clipboard API exists (never during SSR, so markup matches). */
export function useClipboardAvailable(): boolean {
  const [available, setAvailable] = React.useState(false);
  React.useEffect(() => {
    setAvailable(typeof navigator !== 'undefined' && typeof navigator.clipboard?.writeText === 'function');
  }, []);
  return available;
}

/** Copy with a short copied / failed state. The timeout only resets feedback; it never polls. */
export function useCopy(onCopy?: CopyHandler): { state: CopyState; copy: (text: string) => Promise<void> } {
  const [state, setState] = React.useState<CopyState>('idle');
  const timer = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const mounted = React.useRef(true);
  React.useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      clearTimeout(timer.current);
    };
  }, []);

  const copy = React.useCallback(
    async (text: string) => {
      clearTimeout(timer.current);
      let ok = false;
      try {
        if (onCopy) ok = (await onCopy(text)) !== false;
        else if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(text);
          ok = true;
        }
      } catch {
        ok = false;
      }
      if (!mounted.current) return;
      setState(ok ? 'copied' : 'failed');
      timer.current = setTimeout(() => {
        if (mounted.current) setState('idle');
      }, COPY_FEEDBACK_MS);
    },
    [onCopy],
  );

  return { state, copy };
}

/** Text to announce after a minimum gap, so fast phase changes are merged (ADR-0012 §4). */
export function useThrottledText(text: string, intervalMs: number): string {
  const [shown, setShown] = React.useState(text);
  const last = React.useRef(0);
  React.useEffect(() => {
    if (text === shown) return undefined;
    const wait = Math.max(0, last.current + intervalMs - Date.now());
    const id = setTimeout(() => {
      last.current = Date.now();
      setShown(text);
    }, wait);
    return () => clearTimeout(id);
  }, [text, shown, intervalMs]);
  return shown;
}
