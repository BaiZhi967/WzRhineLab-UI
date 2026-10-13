'use client';

import * as React from 'react';

/**
 * Built-in copy (ADR-0009). Every visible or screen-reader string a component renders on its own
 * lives here, grouped by component. This file is the only place in `components/` and `provider/`
 * allowed to contain CJK text (package-boundary test).
 *
 * Priority: component prop > nearest provider `messages` > `zhCN`.
 *
 * The tables live in a `'use client'` module on purpose: a Server Component can then pass
 * `messages={enUS}` to `RhineProvider` as a client reference, although the tables contain functions.
 */

/** Formats a number with the provider's `locale` (Intl.NumberFormat). */
export type RhineNumberFormat = (value: number) => string;

/**
 * Parameterised entries are functions. Functions with numeric arguments receive the provider's
 * number formatter as their last argument; using it is up to the table (`zhCN` keeps the
 * pre-M9.5 output, which prints raw digits).
 */
export interface RhineMessages {
  workbench: { index: string; content: string; resize: string; width: (width: string) => string; };
  tree: { loading: string; empty: string; retry: (name: string) => string; expand: (name: string) => string; collapse: (name: string) => string; };
  tag: { remove: (name: string) => string; };
  alert: {
    /** Dismiss button of a dismissible Alert. */
    dismiss: string;
  };
  alertDialog: {
    cancel: string;
    /** Shown when `onConfirm` rejects and no `errorText` is given. */
    error: string;
  };
  dialog: { close: string };
  breadcrumb: {
    /** Accessible name of the `<nav>`. */
    nav: string;
    /** Button that reveals collapsed levels. */
    expand: (count: number, format: RhineNumberFormat) => string;
  };
  combobox: {
    /** Shown in the list when nothing matches. */
    empty: string;
    /** Status row while `loading`. */
    loading: string;
    /** Accessible name of the clear button. */
    clear: string;
    /** Accessible name of the button that opens the list. */
    openList: string;
  };
  commandPalette: {
    /** Accessible name of the dialog (visually hidden). */
    title: string;
    /** Accessible name of the search input. */
    inputLabel: string;
    placeholder: string;
    /** Shown when no command matches. */
    empty: string;
    /** Keyboard hint in the footer, also the input's description. */
    hint: string;
    /** Visually hidden close button for touch screen readers. */
    close: string;
    /** Status row while `loading` (async search). */
    loading: string;
  };
  dataTable: {
    empty: string;
    loading: string;
    error: string;
    retry: string;
    /** Header checkbox while not every row on the page is selected. */
    selectAll: string;
    /** Header checkbox while every row on the page is selected. */
    deselectAll: string;
    /** Row checkbox; `label` is `getRowLabel(row)` or the row id. */
    selectRow: (label: string) => string;
    /** Selection summary; `offPage` = selected rows that are not on the current page. */
    selection: (count: number, offPage: number, format: RhineNumberFormat) => string;
  };
  drawer: {
    close: string;
  };
  field: {
    /** Marker after the label of an `optional` field. */
    optional: string;
  };
  fileDropZone: {
    /** Default prompt inside the drop area. */
    prompt: string;
    /** Text of the visible button that opens the file picker. */
    browse: string;
    /** A file whose type does not match `accept`. */
    rejectedType: (fileName: string) => string;
    /** A file larger than `maxSize`; `limit` is already formatted, e.g. "1 MB". */
    rejectedSize: (fileName: string, limit: string) => string;
    /** A file beyond `maxFiles`. */
    rejectedCount: (fileName: string, max: number, format: RhineNumberFormat) => string;
    /** Polite announcement after files were accepted. */
    accepted: (count: number, format: RhineNumberFormat) => string;
  };
  metadataList: {
    /** Spoken text of an empty value shown as "—" (`empty="placeholder"`). */
    missing: string;
  };
  numberField: {
    /** Accessible name of the decrement stepper button. */
    decrement: string;
    /** Accessible name of the increment stepper button. */
    increment: string;
    /** `aria-roledescription` of the text input (Base UI defaults to English "Number field"). */
    roleDescription: string;
  };
  pagination: {
    nav: string;
    previous: string;
    next: string;
    page: (page: number, format: RhineNumberFormat) => string;
    compact: (page: number, pageCount: number, format: RhineNumberFormat) => string;
    status: (from: number, to: number, total: number, format: RhineNumberFormat) => string;
  };
  progress: {
    /** Spoken value of an indeterminate Progress (`value={null}`). */
    indeterminate: string;
    /** Spoken value of a Meter with a state label, e.g. "72%，偏高". */
    meterValue: (value: string, state: string) => string;
  };
  recordHeader: {
    /** Accessible name of the breadcrumb trail. */
    trail: string;
  };
  select: {
    placeholder: string;
  };
  stat: {
    loading: string;
    /** Spoken text of a missing value shown as "—". */
    empty: string;
    up: string;
    down: string;
    flat: string;
  };
  textarea: {
    count: (current: number, max: number, format: RhineNumberFormat) => string;
  };
  timeline: {
    empty: string;
  };
  toast: {
    /** Close button of every toast. */
    close: string;
    /**
     * Accessible name of the toast viewport region. `zhCN` keeps Base UI's built-in
     * "Notifications" so the default output does not change.
     */
    region: string;
  };
}

/** Override shape accepted by providers: any namespace, any subset of its keys. */
export type RhineMessagesOverrides = { [K in keyof RhineMessages]?: Partial<RhineMessages[K]> };

/** Built-in default (zh-CN). Output is identical to the pre-M9.5 hard-coded defaults. */
export const zhCN: RhineMessages = {
  workbench: { index: '索引', content: '工作台内容', resize: '调整索引宽度', width: (width) => `宽度 ${width} 像素` },
  tree: { loading: '正在读取…', empty: '暂无项目', retry: (name) => `重试读取 ${name}`, expand: (name) => `展开 ${name}`, collapse: (name) => `收起 ${name}` },
  tag: { remove: (name) => `移除 ${name}` },
  alert: { dismiss: '关闭提示' },
  alertDialog: { cancel: '取消', error: '操作未完成，请重试。' },
  dialog: { close: '关闭' },
  breadcrumb: { nav: '路径', expand: (count) => `显示全部 ${count} 级路径` },
  combobox: { empty: '没有匹配的选项', loading: '正在搜索…', clear: '清除选择', openList: '展开选项' },
  commandPalette: {
    title: '命令面板',
    inputLabel: '搜索命令',
    placeholder: '输入命令名称或关键词…',
    empty: '没有匹配的命令',
    hint: '↑ ↓ 选择，Enter 执行，Esc 关闭',
    close: '关闭命令面板',
    loading: '正在搜索命令…',
  },
  dataTable: {
    empty: '没有符合条件的记录',
    loading: '正在加载…',
    error: '加载失败。',
    retry: '重试',
    selectAll: '全选',
    deselectAll: '取消全选',
    selectRow: (label) => `选择 ${label}`,
    selection: (count, offPage) => `已选 ${count} 条${offPage > 0 ? `（其中 ${offPage} 条在其他页）` : ''}`,
  },
  drawer: { close: '关闭' },
  field: { optional: '（可选）' },
  fileDropZone: {
    prompt: '将文件拖放到此处，或',
    browse: '选择文件',
    rejectedType: (name) => `「${name}」的文件类型不受支持`,
    rejectedSize: (name, limit) => `「${name}」超过 ${limit} 的大小上限`,
    rejectedCount: (name, max) => `「${name}」未添加：最多 ${max} 个文件`,
    accepted: (count) => `已添加 ${count} 个文件`,
  },
  metadataList: { missing: '未记录' },
  numberField: { decrement: '减少', increment: '增加', roleDescription: '数字输入框' },
  pagination: {
    nav: '分页',
    previous: '上一页',
    next: '下一页',
    page: (p) => `第 ${p} 页`,
    compact: (p, n) => `第 ${p} / ${n} 页`,
    status: (from, to, total) => (total === 0 ? '共 0 条' : `第 ${from}–${to} 条，共 ${total} 条`),
  },
  progress: { indeterminate: '进行中', meterValue: (value, state) => `${value}，${state}` },
  recordHeader: { trail: '档案位置' },
  select: { placeholder: '请选择' },
  stat: { loading: '正在加载', empty: '无数据', up: '上升', down: '下降', flat: '持平' },
  textarea: { count: (current, max) => `已输入 ${current} / ${max}` },
  timeline: { empty: '暂无记录' },
  toast: { close: '关闭通知', region: 'Notifications' },
};

/** Reference English translation (参考译文): wording may change before 1.0. */
export const enUS: RhineMessages = {
  workbench: { index: 'Index', content: 'Workbench content', resize: 'Resize index', width: (width) => `Width ${width} pixels` },
  tree: { loading: 'Loading…', empty: 'No items', retry: (name) => `Retry loading ${name}`, expand: (name) => `Expand ${name}`, collapse: (name) => `Collapse ${name}` },
  tag: { remove: (name) => `Remove ${name}` },
  alert: { dismiss: 'Dismiss alert' },
  alertDialog: { cancel: 'Cancel', error: 'The action did not complete. Please try again.' },
  dialog: { close: 'Close' },
  breadcrumb: { nav: 'Breadcrumb', expand: (count, f) => `Show all ${f(count)} levels` },
  combobox: { empty: 'No matching options', loading: 'Searching…', clear: 'Clear selection', openList: 'Show options' },
  commandPalette: {
    title: 'Command palette',
    inputLabel: 'Search commands',
    placeholder: 'Type a command or keyword…',
    empty: 'No matching commands',
    hint: '↑ ↓ to choose, Enter to run, Esc to close',
    close: 'Close command palette',
    loading: 'Searching commands…',
  },
  dataTable: {
    empty: 'No matching records',
    loading: 'Loading…',
    error: 'Failed to load.',
    retry: 'Retry',
    selectAll: 'Select all',
    deselectAll: 'Deselect all',
    selectRow: (label) => `Select ${label}`,
    selection: (count, offPage, f) => `${f(count)} selected${offPage > 0 ? ` (${f(offPage)} on other pages)` : ''}`,
  },
  drawer: { close: 'Close' },
  field: { optional: '(optional)' },
  fileDropZone: {
    prompt: 'Drop files here, or',
    browse: 'Choose files',
    rejectedType: (name) => `"${name}" is not a supported file type`,
    rejectedSize: (name, limit) => `"${name}" is larger than ${limit}`,
    rejectedCount: (name, max, f) => `"${name}" was not added: up to ${f(max)} files`,
    accepted: (count, f) => `${f(count)} ${count === 1 ? 'file' : 'files'} added`,
  },
  metadataList: { missing: 'Not recorded' },
  numberField: { decrement: 'Decrease', increment: 'Increase', roleDescription: 'Number field' },
  pagination: {
    nav: 'Pagination',
    previous: 'Previous',
    next: 'Next',
    page: (p, f) => `Page ${f(p)}`,
    compact: (p, n, f) => `Page ${f(p)} of ${f(n)}`,
    status: (from, to, total, f) => (total === 0 ? '0 items' : `${f(from)}–${f(to)} of ${f(total)} items`),
  },
  progress: { indeterminate: 'In progress', meterValue: (value, state) => `${value}, ${state}` },
  recordHeader: { trail: 'Record location' },
  select: { placeholder: 'Select…' },
  stat: { loading: 'Loading', empty: 'No data', up: 'Up', down: 'Down', flat: 'No change' },
  textarea: { count: (current, max, f) => `${f(current)} / ${f(max)} characters` },
  timeline: { empty: 'No entries' },
  toast: { close: 'Dismiss notification', region: 'Notifications' },
};

/** Default number locale when no provider sets one (ADR-0009 §3). Never read from the runtime. */
export const DEFAULT_LOCALE = 'zh-CN';

export interface RhineLocaleValue {
  messages: RhineMessages;
  locale: string;
}

const RhineLocaleContext = React.createContext<RhineLocaleValue>({ messages: zhCN, locale: DEFAULT_LOCALE });

/** Shallow merge per namespace; `undefined` values in the override are ignored. */
export function mergeMessages(base: RhineMessages, overrides: RhineMessagesOverrides | undefined): RhineMessages {
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
  return result as unknown as RhineMessages;
}

export interface RhineMessagesProviderProps {
  /** Partial table merged over the outer provider's (or `zhCN`). */
  messages?: RhineMessagesOverrides;
  /** Number locale for this subtree; defaults to the outer provider's (or `zh-CN`). */
  locale?: string;
  children: React.ReactNode;
}

/** Internal: merges a provider's overrides over the outer value (shared by both providers). */
export function useResolvedLocale(messages: RhineMessagesOverrides | undefined, locale: string | undefined): RhineLocaleValue {
  const outer = React.useContext(RhineLocaleContext);
  const merged = React.useMemo(() => mergeMessages(outer.messages, messages), [outer.messages, messages]);
  const resolvedLocale = locale ?? outer.locale;
  return React.useMemo(() => ({ messages: merged, locale: resolvedLocale }), [merged, resolvedLocale]);
}

/** Internal: publishes a resolved value (used by RhineProvider). */
export const RhineLocaleProvider = RhineLocaleContext.Provider;

/**
 * Copy (and number locale) for a region without its own RhineProvider. Nested providers merge
 * with the outer one per namespace.
 */
export function RhineMessagesProvider({ messages, locale, children }: RhineMessagesProviderProps) {
  const value = useResolvedLocale(messages, locale);
  return <RhineLocaleContext.Provider value={value}>{children}</RhineLocaleContext.Provider>;
}

/** The merged message table of the nearest provider (`zhCN` without one). */
export function useRhineMessages(): RhineMessages {
  return React.useContext(RhineLocaleContext).messages;
}

/** Messages, number locale and a cached formatter of the nearest provider (also used by @wzrhine/agent). */
export function useRhineLocale(): RhineLocaleValue & { formatNumber: RhineNumberFormat } {
  const value = React.useContext(RhineLocaleContext);
  const formatNumber = React.useMemo(() => {
    const formatter = new Intl.NumberFormat(value.locale);
    return (n: number) => formatter.format(n);
  }, [value.locale]);
  return { ...value, formatNumber };
}
