// Side-effect free: styles are opt-in via `@wzrhine/editor/styles.css`.
export { editorModes, saveStatusKinds } from './contracts.js';
export type {
  DocumentView,
  EditorAdapter,
  EditorAdapterOptions,
  EditorChange,
  EditorCommand,
  EditorHost,
  EditorMode,
  EditorSelection,
  EditorSnapshot,
  SaveStatusKind,
} from './contracts.js';
export { EditorMessagesProvider, editorEnUS, editorZhCN, mergeEditorMessages, useEditorMessages } from './provider/EditorMessages.js';
export type { EditorMessages, EditorMessagesOverrides, EditorMessagesProviderProps } from './provider/EditorMessages.js';
export { SaveStatus } from './components/SaveStatus.js';
export type { SaveStatusProps } from './components/SaveStatus.js';
export { EditorModeSwitcher } from './components/EditorModeSwitcher.js';
export type { EditorModeSwitcherProps } from './components/EditorModeSwitcher.js';
export { DocumentTabs } from './components/DocumentTabs.js';
export type { DocumentTab, DocumentTabsProps } from './components/DocumentTabs.js';
export { EditorToolbar } from './components/EditorToolbar.js';
export type { EditorToolbarCommand, EditorToolbarProps } from './components/EditorToolbar.js';
