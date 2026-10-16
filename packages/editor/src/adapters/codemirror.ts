import { defaultKeymap, history, historyKeymap, redo, redoDepth, undo, undoDepth } from '@codemirror/commands';
import { markdown } from '@codemirror/lang-markdown';
import { searchKeymap } from '@codemirror/search';
import { EditorState } from '@codemirror/state';
import { EditorView, keymap } from '@codemirror/view';
import type { EditorAdapter, EditorAdapterOptions, EditorChange, EditorCommand, EditorHost, EditorSelection } from '../contracts.js';

const selectionOf = (state: EditorState): EditorSelection => ({ from: state.selection.main.from, to: state.selection.main.to });

function selectedText(state: EditorState): string {
  const selection = state.selection.main;
  return state.sliceDoc(selection.from, selection.to);
}

function commandChanges(state: EditorState, command: EditorCommand): { from: number; to: number; insert: string } | undefined {
  const selection = state.selection.main;
  const selected = selectedText(state);
  if (command.type === 'insert-text') return { from: selection.from, to: selection.to, insert: command.text };
  if (command.type === 'insert-link') {
    const text = (command.text ?? selected) || command.href;
    return { from: selection.from, to: selection.to, insert: `[${text}](${command.href})` };
  }
  if (command.type === 'toggle-mark') {
    if (!selected) return { from: selection.from, to: selection.to, insert: `${command.mark === 'bold' ? '**' : command.mark === 'italic' ? '*' : command.mark === 'code' ? '`' : '~~'}${command.mark === 'bold' ? '**' : command.mark === 'italic' ? '*' : command.mark === 'code' ? '`' : '~~'}` };
    const mark = command.mark === 'bold' ? '**' : command.mark === 'italic' ? '*' : command.mark === 'code' ? '`' : '~~';
    return { from: selection.from, to: selection.to, insert: `${mark}${selected}${mark}` };
  }
  const line = state.doc.lineAt(selection.from);
  const withoutHeading = line.text.replace(/^\s*#{1,6}\s+/, '');
  if (command.type === 'set-heading') {
    const prefix = command.level === 0 ? '' : `${'#'.repeat(command.level)} `;
    return { from: line.from, to: line.to, insert: `${prefix}${withoutHeading}` };
  }
  if (command.type === 'toggle-list') {
    const prefix = command.kind === 'bullet' ? '- ' : command.kind === 'ordered' ? '1. ' : '- [ ] ';
    const pattern = /^(?:\s*- \[ \] |\s*- |\s*\d+\. )/;
    const next = pattern.test(line.text) ? line.text.replace(pattern, '') : `${prefix}${line.text}`;
    return { from: line.from, to: line.to, insert: next };
  }
  return undefined;
}

export function createCodeMirrorAdapter(): EditorAdapter {
  return {
    create(container: HTMLElement, options: EditorAdapterOptions): EditorHost {
      let composing = false;
      let externalUpdate = false;
      const listeners = new Set<(change: EditorChange) => void>();
      const update = (viewUpdate: { state: EditorState; docChanged: boolean; selectionSet: boolean }) => {
        if (!viewUpdate.docChanged && !viewUpdate.selectionSet) return;
        const change: EditorChange = { source: viewUpdate.state.doc.toString(), selection: selectionOf(viewUpdate.state), composing, origin: externalUpdate ? 'external' : 'user' };
        if (viewUpdate.docChanged) options.onChange?.(change);
        if (viewUpdate.docChanged || viewUpdate.selectionSet) options.onSelectionChange?.(change.selection!);
        listeners.forEach((listener) => listener(change));
      };
      const view = new EditorView({
        state: EditorState.create({
          doc: options.source,
          selection: options.selection ? { anchor: Math.min(options.selection.from, options.source.length), head: Math.min(options.selection.to, options.source.length) } : undefined,
          extensions: [
            markdown(),
            history(),
            keymap.of([...defaultKeymap, ...historyKeymap, ...searchKeymap]),
            EditorView.lineWrapping,
            EditorView.editable.of(!options.readOnly),
            EditorState.readOnly.of(options.readOnly === true),
            EditorView.updateListener.of(update),
          ],
        }),
        parent: container,
      });
      const startComposition = () => { composing = true; options.onCompositionChange?.(true); };
      const endComposition = () => { composing = false; options.onCompositionChange?.(false); };
      view.contentDOM.addEventListener('compositionstart', startComposition);
      view.contentDOM.addEventListener('compositionend', endComposition);
      view.contentDOM.addEventListener('focus', () => options.onFocus?.());
      view.contentDOM.addEventListener('blur', () => options.onBlur?.());
      const host: EditorHost = {
        getSnapshot: () => ({ source: view.state.doc.toString(), selection: selectionOf(view.state), composing, readOnly: options.readOnly === true, canUndo: !options.readOnly && undoDepth(view.state) > 0, canRedo: !options.readOnly && redoDepth(view.state) > 0 }),
        setSource: (source) => {
          if (source === view.state.doc.toString()) return;
          externalUpdate = true;
          const selection = view.state.selection.main;
          const anchor = Math.min(selection.anchor, source.length);
          const head = Math.min(selection.head, source.length);
          view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: source }, selection: { anchor, head } });
          externalUpdate = false;
        },
        focus: () => view.focus(),
        dispatch: (command) => {
          if (options.readOnly) return false;
          if (command.type === 'undo') return undo(view);
          if (command.type === 'redo') return redo(view);
          const changes = commandChanges(view.state, command);
          if (!changes) return false;
          view.dispatch({ changes });
          return true;
        },
        subscribe: (listener) => { listeners.add(listener); return () => listeners.delete(listener); },
        destroy: () => {
          view.contentDOM.removeEventListener('compositionstart', startComposition);
          view.contentDOM.removeEventListener('compositionend', endComposition);
          view.destroy();
          listeners.clear();
        },
      };
      return host;
    },
  };
}
