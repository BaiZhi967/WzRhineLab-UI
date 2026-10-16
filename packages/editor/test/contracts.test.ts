import { describe, expect, it } from 'vitest';
import {
  editorModes,
  saveStatusKinds,
  type EditorCommand,
  type EditorSelection,
} from '../src/contracts.js';

describe('editor contracts', () => {
  it('keeps the supported modes and save statuses explicit', () => {
    expect(editorModes).toEqual(['source', 'preview', 'split']);
    expect(saveStatusKinds).toEqual(['clean', 'dirty', 'saving', 'saved', 'error', 'conflict']);
  });

  it('accepts discriminated editor commands without exposing an engine state', () => {
    const commands: EditorCommand[] = [
      { type: 'undo' },
      { type: 'redo' },
      { type: 'toggle-mark', mark: 'bold' },
      { type: 'set-heading', level: 2 },
      { type: 'toggle-list', kind: 'bullet' },
      { type: 'insert-link', href: 'https://example.com', text: 'Example' },
      { type: 'insert-text', text: 'inserted' },
    ];
    expect(commands.map((command) => command.type)).toEqual([
      'undo', 'redo', 'toggle-mark', 'set-heading', 'toggle-list', 'insert-link', 'insert-text',
    ]);
  });

  it('keeps selection as a simple source offset pair', () => {
    const selection: EditorSelection = { from: 4, to: 9 };
    expect(selection).toEqual({ from: 4, to: 9 });
  });
});
