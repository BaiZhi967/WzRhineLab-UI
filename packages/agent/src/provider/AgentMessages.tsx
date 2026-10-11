'use client';

import * as React from 'react';
import { useRhineLocale } from '@wzrhine/react';
import type { RhineNumberFormat } from '@wzrhine/react';
import { formatBytes, formatCompact, formatDuration } from '@wzrhine/agent-core';
import { enStatus, zhStatus } from './messages/status.js';
import type { AgentStatusMessages } from './messages/status.js';
import { enShell, zhShell } from './messages/shell.js';
import type { AgentShellMessages } from './messages/shell.js';
import { enMessage, zhMessage } from './messages/message.js';
import type { AgentMessageMessages } from './messages/message.js';
import { enTools, zhTools } from './messages/tools.js';
import type { AgentToolsMessages } from './messages/tools.js';
import { enComposer, zhComposer } from './messages/composer.js';
import type { AgentComposerMessages } from './messages/composer.js';
import { enIntervention, zhIntervention } from './messages/intervention.js';
import type { AgentInterventionMessages } from './messages/intervention.js';
import { enWorkspace, zhWorkspace } from './messages/workspace.js';
import type { AgentWorkspaceMessages } from './messages/workspace.js';

/**
 * Built-in copy of `@wzrhine/agent` (ADR-0011 §10), same rules as ADR-0009: component prop >
 * nearest `AgentMessagesProvider` > `agentZhCN`. Files under `provider/messages/` are the only
 * agent sources allowed to contain CJK text (package-boundary test). The number locale comes
 * from the nearest `RhineProvider` / `RhineMessagesProvider`.
 */
export interface AgentMessages {
  status: AgentStatusMessages;
  shell: AgentShellMessages;
  message: AgentMessageMessages;
  tools: AgentToolsMessages;
  composer: AgentComposerMessages;
  intervention: AgentInterventionMessages;
  workspace: AgentWorkspaceMessages;
}

export type AgentMessagesOverrides = { [K in keyof AgentMessages]?: Partial<AgentMessages[K]> };

export const agentZhCN: AgentMessages = {
  status: zhStatus,
  shell: zhShell,
  message: zhMessage,
  tools: zhTools,
  composer: zhComposer,
  intervention: zhIntervention,
  workspace: zhWorkspace,
};

export const agentEnUS: AgentMessages = {
  status: enStatus,
  shell: enShell,
  message: enMessage,
  tools: enTools,
  composer: enComposer,
  intervention: enIntervention,
  workspace: enWorkspace,
};

export function mergeAgentMessages(base: AgentMessages, overrides: AgentMessagesOverrides | undefined): AgentMessages {
  if (!overrides) return base;
  const result = { ...base } as unknown as Record<string, Record<string, unknown>>;
  for (const [namespace, entries] of Object.entries(overrides)) {
    if (!entries || !(namespace in base)) continue;
    const merged = { ...result[namespace] };
    for (const [key, value] of Object.entries(entries)) {
      if (value !== undefined) merged[key] = value;
    }
    result[namespace] = merged;
  }
  return result as unknown as AgentMessages;
}

const AgentMessagesContext = React.createContext<AgentMessages>(agentZhCN);

export interface AgentMessagesProviderProps {
  /** Full table (`agentEnUS`) or a partial override merged over the outer one. */
  messages?: AgentMessagesOverrides;
  children: React.ReactNode;
}

export function AgentMessagesProvider({ messages, children }: AgentMessagesProviderProps) {
  const outer = React.useContext(AgentMessagesContext);
  const value = React.useMemo(() => mergeAgentMessages(outer, messages), [outer, messages]);
  return <AgentMessagesContext.Provider value={value}>{children}</AgentMessagesContext.Provider>;
}

export function useAgentMessages(): AgentMessages {
  return React.useContext(AgentMessagesContext);
}

export interface AgentFormat {
  locale: string;
  number: RhineNumberFormat;
  compact: (value: number) => string;
  bytes: (value: number) => string;
  duration: (ms: number) => string;
  /** Time of day ("14:20") in the provider locale. */
  time: (iso: string) => string;
  /** Short date ("10月9日" / "Oct 9"). */
  date: (iso: string) => string;
}

/** Locale-aware formatters for the nearest provider. */
export function useAgentFormat(): AgentFormat {
  const { locale, formatNumber } = useRhineLocale();
  return React.useMemo(() => {
    const timeFormat = new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit', hour12: false });
    const dateFormat = new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric' });
    const safe = (fmt: Intl.DateTimeFormat) => (iso: string) => {
      const d = new Date(iso);
      return Number.isNaN(d.getTime()) ? iso : fmt.format(d);
    };
    return {
      locale,
      number: formatNumber,
      compact: (v) => formatCompact(v, locale),
      bytes: (v) => formatBytes(v, locale),
      duration: formatDuration,
      time: safe(timeFormat),
      date: safe(dateFormat),
    };
  }, [locale, formatNumber]);
}
