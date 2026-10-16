import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { createCodeMirrorAdapter } from '../src/adapters/codemirror.js';

describe('CodeMirror adapter', () => {
  it('mounts Markdown source and emits user changes', async () => {
    const user = userEvent.setup();
    const container = document.createElement('div');
    document.body.append(container);
    const onChange = vi.fn();
    const host = createCodeMirrorAdapter().create(container, { source: '# Title', onChange });
    const content = container.querySelector('.cm-content');
    expect(content).toBeTruthy();
    await user.click(content!);
    await user.type(content!, ' more');
    expect(onChange).toHaveBeenCalled();
    expect(host.getSnapshot().source).toContain('more');
    host.destroy();
  });

  it('supports insert-text, undo and redo commands', () => {
    const container = document.createElement('div');
    const host = createCodeMirrorAdapter().create(container, { source: 'one' });
    expect(host.getSnapshot().canUndo).toBe(false);
    expect(host.getSnapshot().canRedo).toBe(false);
    expect(host.dispatch({ type: 'insert-text', text: ' two' })).toBe(true);
    expect(host.getSnapshot().source).toBe(' twoone');
    expect(host.getSnapshot().canUndo).toBe(true);
    expect(host.dispatch({ type: 'undo' })).toBe(true);
    expect(host.getSnapshot().source).toBe('one');
    expect(host.getSnapshot().canRedo).toBe(true);
    expect(host.dispatch({ type: 'redo' })).toBe(true);
    expect(host.getSnapshot().source).toBe(' twoone');
    host.destroy();
  });

  it('preserves readOnly, composition state and external source updates', () => {
    const container = document.createElement('div');
    const host = createCodeMirrorAdapter().create(container, { source: 'old', readOnly: true });
    const content = container.querySelector('.cm-content')!;
    content.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }));
    expect(host.getSnapshot().composing).toBe(true);
    content.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true }));
    expect(host.getSnapshot().composing).toBe(false);
    expect(host.dispatch({ type: 'insert-text', text: ' blocked' })).toBe(false);
    host.setSource('new');
    expect(host.getSnapshot().source).toBe('new');
    host.destroy();
  });

  it('reports selection and composition changes without exposing CodeMirror state', () => {
    const container = document.createElement('div');
    const onSelectionChange = vi.fn();
    const onCompositionChange = vi.fn();
    const host = createCodeMirrorAdapter().create(container, {
      source: 'one',
      selection: { from: 1, to: 2 },
      onSelectionChange,
      onCompositionChange,
    });
    expect(host.getSnapshot().selection).toEqual({ from: 1, to: 2 });
    const content = container.querySelector('.cm-content')!;
    content.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }));
    content.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true }));
    expect(onCompositionChange.mock.calls.map(([value]) => value)).toEqual([true, false]);
    expect(host.dispatch({ type: 'insert-text', text: 'x' })).toBe(true);
    expect(onSelectionChange).toHaveBeenCalled();
    host.destroy();
  });
});
