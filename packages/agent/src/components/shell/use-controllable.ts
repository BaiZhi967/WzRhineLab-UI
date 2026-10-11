'use client';

import * as React from 'react';

/**
 * Controlled / uncontrolled state pair used by the shell family. `value !== undefined` means the
 * parent owns the state; the setter then only reports the request through `onChange`.
 */
export function useControllable<T>(value: T | undefined, defaultValue: T, onChange?: (next: T) => void): [T, (next: T) => void] {
  const [inner, setInner] = React.useState(defaultValue);
  const controlled = value !== undefined;
  const current = controlled ? value : inner;
  const latest = React.useRef(current);
  latest.current = current;
  const onChangeRef = React.useRef(onChange);
  onChangeRef.current = onChange;
  const set = React.useCallback(
    (next: T) => {
      if (Object.is(next, latest.current)) return;
      if (!controlled) setInner(next);
      onChangeRef.current?.(next);
    },
    [controlled],
  );
  return [current, set];
}

/** Layout effect on the client, plain effect during SSR (no warning). */
export const useIsoLayoutEffect = typeof window === 'undefined' ? React.useEffect : React.useLayoutEffect;
