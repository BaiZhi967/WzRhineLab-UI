'use client';

import * as React from 'react';
import type { AgentActionResult } from '@wzrhine/agent-core';

/**
 * Per-mount action identity and double-submit guard shared by ApprovalPanel and QuestionnaireCard
 * (ADR-0011 §4). Internal; not exported from the package.
 *
 * - `nextActionId()` = stable per-mount prefix (`React.useId`) + counter, so two cards on one page
 *   never collide and a retry can reuse the exact id of the attempt it repeats.
 * - `run(call)` blocks re-entry synchronously (a ref, not state, so a double click inside one
 *   frame is caught). The lock holds while the handler's promise is pending (`pending` = true:
 *   the control shows busy) and afterwards until the view-model changes (`viewKey`). Only a
 *   `rejected` result or a thrown / rejected handler releases it at once, because then the
 *   host keeps the same view and the user may try again.
 */
export function useActionLock(viewKey: string) {
  const prefix = React.useId();
  const counter = React.useRef(0);
  const lockRef = React.useRef<{ key: string; pending: boolean } | null>(null);
  const [, force] = React.useReducer((n: number) => n + 1, 0);
  const mounted = React.useRef(true);
  React.useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const lock = lockRef.current;
  const locked = lock !== null && (lock.pending || lock.key === viewKey);
  const pending = lock?.pending === true;

  const nextActionId = React.useCallback(() => {
    counter.current += 1;
    return `${prefix.replace(/[^\w-]/g, '')}-${counter.current}`;
  }, [prefix]);

  const settle = (key: string, result: AgentActionResult | void, failed = false) => {
    lockRef.current = failed || (result && result.status === 'rejected') ? null : { key, pending: false };
    if (mounted.current) force();
  };

  const run = (call: () => AgentActionResult | void | Promise<AgentActionResult | void>): boolean => {
    const current = lockRef.current;
    if (current && (current.pending || current.key === viewKey)) return false;
    const key = viewKey;
    lockRef.current = { key, pending: true };
    let out: AgentActionResult | void | Promise<AgentActionResult | void>;
    try {
      out = call();
    } catch (error) {
      lockRef.current = null;
      force();
      throw error;
    }
    if (out && typeof (out as Promise<unknown>).then === 'function') {
      force();
      (out as Promise<AgentActionResult | void>).then(
        (result) => settle(key, result),
        () => settle(key, undefined, true),
      );
    } else {
      settle(key, out as AgentActionResult | void);
    }
    return true;
  };

  return { locked, pending, nextActionId, run };
}
