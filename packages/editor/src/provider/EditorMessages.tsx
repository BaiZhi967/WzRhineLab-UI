'use client';

import * as React from 'react';
import type { SaveStatusKind } from '../contracts.js';

export interface EditorMessages {
  saveStatus: Record<SaveStatusKind, string>;
  mode: {
    label: string;
    source: string;
    preview: string;
    split: string;
  };
  tabs: {
    label: string;
    dirty: string;
    close: (title: string) => string;
  };
  toolbar: {
    label: string;
  };
  retry: string;
  resolveConflict: string;
}

export type EditorMessagesOverrides = {
  saveStatus?: Partial<EditorMessages['saveStatus']>;
  mode?: Partial<EditorMessages['mode']>;
  tabs?: Partial<EditorMessages['tabs']>;
  toolbar?: Partial<EditorMessages['toolbar']>;
  retry?: string;
  resolveConflict?: string;
};

export interface EditorMessagesProviderProps {
  messages?: EditorMessagesOverrides;
  children?: React.ReactNode;
}

export const editorZhCN: EditorMessages = {
  saveStatus: {
    clean: '未修改',
    dirty: '有未保存的更改',
    saving: '正在保存…',
    saved: '已保存',
    error: '保存失败',
    conflict: '存在冲突',
  },
  mode: { label: '编辑模式', source: '源码', preview: '预览', split: '分栏' },
  tabs: { label: '打开文档', dirty: '有未保存的更改', close: (title) => `关闭 ${title}` },
  toolbar: { label: '编辑工具栏' },
  retry: '重试保存',
  resolveConflict: '处理冲突',
};

export const editorEnUS: EditorMessages = {
  saveStatus: {
    clean: 'No changes',
    dirty: 'Unsaved changes',
    saving: 'Saving…',
    saved: 'Saved',
    error: 'Save failed',
    conflict: 'Conflict detected',
  },
  mode: { label: 'Editor mode', source: 'Source', preview: 'Preview', split: 'Split' },
  tabs: { label: 'Open documents', dirty: 'Unsaved changes', close: (title) => `Close ${title}` },
  toolbar: { label: 'Editor toolbar' },
  retry: 'Retry save',
  resolveConflict: 'Resolve conflict',
};

export function mergeEditorMessages(base: EditorMessages, overrides?: EditorMessagesOverrides): EditorMessages {
  if (!overrides) return base;
  return {
    saveStatus: { ...base.saveStatus, ...overrides.saveStatus },
    mode: { ...base.mode, ...overrides.mode },
    tabs: { ...base.tabs, ...overrides.tabs },
    toolbar: { ...base.toolbar, ...overrides.toolbar },
    retry: overrides.retry ?? base.retry,
    resolveConflict: overrides.resolveConflict ?? base.resolveConflict,
  };
}

const EditorMessagesContext = React.createContext<EditorMessages>(editorZhCN);

export function EditorMessagesProvider({ messages, children }: EditorMessagesProviderProps) {
  const outer = React.useContext(EditorMessagesContext);
  const value = React.useMemo(() => mergeEditorMessages(outer, messages), [outer, messages]);
  return <EditorMessagesContext.Provider value={value}>{children}</EditorMessagesContext.Provider>;
}

export function useEditorMessages(): EditorMessages {
  return React.useContext(EditorMessagesContext);
}
