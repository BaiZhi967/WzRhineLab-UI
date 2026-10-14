'use client';

import * as React from 'react';

/**
 * Built-in copy of `@wzrhine/patterns` (ADR-0014 §3), same rules as ADR-0009: component prop >
 * nearest `PatternsMessagesProvider` > `patternsZhCN`. This file is the only patterns source
 * allowed to contain CJK text (package-boundary test). The number locale comes from the nearest
 * `RhineProvider` / `RhineMessagesProvider` of @wzrhine/react, exactly like @wzrhine/agent.
 *
 * Namespaces arrive with their components (P030-02 onwards); key surfaces follow
 * docs/roadmap/0.3.0-contracts.md §6.
 */
export interface PatternsMessages {
  /** ListDetail copy; overrides the `backLabel` / `listLabel` / `detailLabel` props' defaults. */
  listDetail: {
    /** Back (overlay) / close (split) entry of the detail bar. */
    back: string;
    /** Accessible name of the collection region. */
    list: string;
    /** Accessible name of the detail region. */
    detail: string;
  };
  inspectorPanel: {
    /** Accessible name of the header close button. */
    close: string;
  };
  queryToolbar: {
    /** Accessible name of the search region. */
    region: string;
    /** Accessible name of the search input. */
    search: string;
    /** Visible placeholder of the search input. */
    placeholder: string;
    /** Submit button text. */
    submit: string;
    /** Reset button text. */
    reset: string;
  };
  appliedFilters: {
    /** Accessible name of the region. */
    region: string;
    /** Accessible name of a condition's remove button. */
    remove: (name: string) => string;
    /** Clear-all entry text. */
    clearAll: string;
  };
}

/** Override shape: every namespace and entry is optional; `undefined` entries are ignored. */
export type PatternsMessagesOverrides = {
  [K in keyof PatternsMessages]?: { [P in keyof PatternsMessages[K]]?: PatternsMessages[K][P] };
};

export const patternsZhCN: PatternsMessages = {
  listDetail: { back: '返回列表', list: '记录列表', detail: '记录详情' },
  inspectorPanel: { close: '关闭' },
  queryToolbar: {
    region: '搜索与筛选',
    search: '搜索记录',
    placeholder: '输入关键词，回车提交',
    submit: '搜索',
    reset: '重置',
  },
  appliedFilters: { region: '已应用条件', remove: (name) => `移除 ${name}`, clearAll: '清空全部' },
};

/** Reference translation (ADR-0009 §1): wording is not guaranteed to be stable. */
export const patternsEnUS: PatternsMessages = {
  listDetail: { back: 'Back to list', list: 'Records', detail: 'Record details' },
  inspectorPanel: { close: 'Close' },
  queryToolbar: {
    region: 'Search & filters',
    search: 'Search records',
    placeholder: 'Type keywords, press Enter to submit',
    submit: 'Search',
    reset: 'Reset',
  },
  appliedFilters: { region: 'Applied filters', remove: (name) => `Remove ${name}`, clearAll: 'Clear all' },
};

/** Shallow merge per namespace; `undefined` values in the override are ignored. */
export function mergePatternsMessages(
  base: PatternsMessages,
  overrides: PatternsMessagesOverrides | undefined,
): PatternsMessages {
  if (!overrides) return base;
  const result = { ...base } as Record<string, Record<string, unknown>>;
  for (const [namespace, entries] of Object.entries(overrides)) {
    if (!entries || !(namespace in base)) continue;
    const merged = { ...result[namespace] };
    for (const [key, value] of Object.entries(entries)) {
      if (value !== undefined) merged[key] = value;
    }
    result[namespace] = merged;
  }
  return result as unknown as PatternsMessages;
}

const PatternsMessagesContext = React.createContext<PatternsMessages>(patternsZhCN);

export interface PatternsMessagesProviderProps {
  /** Partial table merged over the outer provider's (or `patternsZhCN`). */
  messages?: PatternsMessagesOverrides;
  children: React.ReactNode;
}

/**
 * Copy for a subtree, without needing a full `RhineProvider`. Nested providers merge with the
 * outer one per namespace; sibling providers stay isolated.
 */
export function PatternsMessagesProvider({ messages, children }: PatternsMessagesProviderProps) {
  const outer = React.useContext(PatternsMessagesContext);
  const merged = React.useMemo(() => mergePatternsMessages(outer, messages), [outer, messages]);
  return <PatternsMessagesContext.Provider value={merged}>{children}</PatternsMessagesContext.Provider>;
}

/** The merged message table of the nearest provider (`patternsZhCN` without one). */
export function usePatternsMessages(): PatternsMessages {
  return React.useContext(PatternsMessagesContext);
}
