import { render, screen } from '@testing-library/react';
import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import type { EditorAdapter, EditorChange, EditorHost, EditorSnapshot } from '../src/contracts.js';
import { EditorSurface } from '../src/components/EditorSurface.js';

function fakeAdapter(): { adapter: EditorAdapter; host: EditorHost; changes: EditorChange[] } {
  const changes: EditorChange[] = [];
  let source = '';
  let listener: ((change: EditorChange) => void) | undefined;
  const host: EditorHost = {
    getSnapshot: () => ({ source, composing: false, readOnly: false, canUndo: false, canRedo: false }),
    setSource: (next) => { source = next; },
    focus: vi.fn(),
    dispatch: vi.fn(() => true),
    subscribe: (next) => { listener = next; return () => { listener = undefined; }; },
    destroy: vi.fn(),
  };
  const adapter: EditorAdapter = {
    create: (_container, options) => {
      source = options.source;
      listener = options.onChange;
      return host;
    },
  };
  return { adapter, host, changes };
}

describe('EditorSurface', () => {
  it('mounts an adapter, exposes an accessible surface, and destroys it', () => {
    const { adapter, host } = fakeAdapter();
    const { unmount } = render(<EditorSurface adapter={adapter} source="# Title" aria-label="Markdown source" />);
    expect(screen.getByRole('textbox', { name: 'Markdown source' })).toBeInTheDocument();
    unmount();
    expect(host.destroy).toHaveBeenCalledTimes(1);
  });

  it('syncs external source changes without replacing the adapter', () => {
    const { adapter, host } = fakeAdapter();
    const { rerender } = render(<EditorSurface adapter={adapter} source="one" aria-label="Source" />);
    rerender(<EditorSurface adapter={adapter} source="two" aria-label="Source" />);
    expect(host.getSnapshot().source).toBe('two');
  });

  it('renders a recoverable adapter error instead of a blank editor', () => {
    const adapter: EditorAdapter = { create: () => { throw new Error('adapter failed'); } };
    render(<EditorSurface adapter={adapter} source="source" aria-label="Source" />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Editor unavailable')).toBeInTheDocument();
  });
});
