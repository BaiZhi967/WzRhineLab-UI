'use client';

import * as React from 'react';
import type { Completeness } from '@wzrhine/agent-core';
import { useAgentMessages } from '../../provider/AgentMessages.js';
import type { AgentWorkspaceMessages } from '../../provider/messages/workspace.js';

/**
 * Small helpers shared by the workspace and artifact families. Not exported from the package
 * entry: every component re-exposes what it needs through its own props.
 */

/** Per-instance copy override (prop) merged over the nearest `AgentMessagesProvider`. */
export type WorkspaceMessagesProp = Partial<AgentWorkspaceMessages>;

export function useWorkspaceMessages(override?: WorkspaceMessagesProp): AgentWorkspaceMessages {
  const base = useAgentMessages().workspace;
  return React.useMemo(() => {
    if (!override) return base;
    const merged = { ...base } as Record<string, unknown>;
    for (const [key, value] of Object.entries(override)) if (value !== undefined) merged[key] = value;
    return merged as unknown as AgentWorkspaceMessages;
  }, [base, override]);
}

export type HeadingLevel = 2 | 3 | 4 | 5 | 6;

export function Heading({ level, ...rest }: React.HTMLAttributes<HTMLHeadingElement> & { level: HeadingLevel }) {
  const Tag = `h${level}` as 'h2';
  return <Tag {...rest} />;
}

/**
 * Ids present on the first render are "history" and must not play an entrance; ids that appear
 * later are new. The decision per id is frozen by `AgentEntrance` at its mount.
 */
export function useIsNewId(ids: readonly string[]): (id: string) => boolean {
  const initial = React.useRef<Set<string> | null>(null);
  if (initial.current === null) initial.current = new Set(ids);
  const seen = initial.current;
  return React.useCallback((id: string) => !seen.has(id), [seen]);
}

/** Label for a non-exact number, or `undefined` for exact values. */
export function completenessTag(completeness: Completeness, labels: Record<Completeness, string>): string | undefined {
  return completeness === 'exact' ? undefined : labels[completeness];
}
