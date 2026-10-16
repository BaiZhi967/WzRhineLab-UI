export const editorModes = ['source', 'preview', 'split'] as const;
export type EditorMode = (typeof editorModes)[number];

export const saveStatusKinds = ['clean', 'dirty', 'saving', 'saved', 'error', 'conflict'] as const;
export type SaveStatusKind = (typeof saveStatusKinds)[number];

export interface EditorSelection {
  from: number;
  to: number;
}

export type EditorCommand =
  | { type: 'undo' }
  | { type: 'redo' }
  | { type: 'toggle-mark'; mark: 'bold' | 'italic' | 'code' | 'strike' }
  | { type: 'set-heading'; level: 1 | 2 | 3 | 4 | 5 | 6 | 0 }
  | { type: 'toggle-list'; kind: 'bullet' | 'ordered' | 'task' }
  | { type: 'insert-link'; href: string; text?: string }
  | { type: 'insert-text'; text: string };

export interface EditorChange {
  source: string;
  selection?: EditorSelection;
  composing: boolean;
  origin: 'user' | 'external';
}

export interface EditorSnapshot {
  source: string;
  selection?: EditorSelection;
  composing: boolean;
  readOnly: boolean;
  canUndo: boolean;
  canRedo: boolean;
}

export interface EditorHost {
  getSnapshot(): EditorSnapshot;
  setSource(source: string): void;
  focus(): void;
  dispatch(command: EditorCommand): boolean;
  subscribe(listener: (change: EditorChange) => void): () => void;
  destroy(): void;
}

export interface EditorAdapterOptions {
  source: string;
  selection?: EditorSelection;
  ariaLabel?: string;
  readOnly?: boolean;
  onChange?: (change: EditorChange) => void;
  onSelectionChange?: (selection: EditorSelection) => void;
  onCompositionChange?: (composing: boolean) => void;
  onFocus?: () => void;
  onBlur?: () => void;
}

export interface EditorAdapter {
  create(container: HTMLElement, options: EditorAdapterOptions): EditorHost;
}

export interface DocumentView {
  id: string;
  title: string;
  source: string;
  mode: EditorMode;
  readOnly?: boolean;
  revision?: string;
  selection?: EditorSelection;
  saveStatus: SaveStatusKind;
}
