import { render, screen } from '@testing-library/react';
import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import type { EditorAdapter, EditorHost } from '../src/contracts.js';
import { EditorModeView } from '../src/components/EditorModeView.js';

function adapterFixture(): EditorAdapter {
  return {
    create: (_container, options): EditorHost => {
      let source = options.source;
      return {
        getSnapshot: () => ({ source, selection: options.selection, composing: false, readOnly: options.readOnly === true, canUndo: false, canRedo: false }),
        setSource: (next) => { source = next; },
        focus: vi.fn(),
        dispatch: vi.fn(() => true),
        subscribe: () => () => {},
        destroy: vi.fn(),
      };
    },
  };
}

describe('EditorModeView', () => {
  it('renders only the selected source or preview mode from one source value', () => {
    const onModeChange = vi.fn();
    const { rerender } = render(<EditorModeView mode="source" source="# Source" adapter={adapterFixture()} onModeChange={onModeChange} />);
    expect(screen.getByTestId('editor-source-pane')).toBeInTheDocument();
    expect(screen.queryByTestId('editor-preview-pane')).not.toBeInTheDocument();
    rerender(<EditorModeView mode="preview" source="# Preview" adapter={adapterFixture()} onModeChange={onModeChange} />);
    expect(screen.queryByTestId('editor-source-pane')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Preview' })).toBeInTheDocument();
  });

  it('composes split mode, forwards preview callbacks and keeps source updates controlled', () => {
    const onLinkActivate = vi.fn();
    const onRetry = vi.fn();
    const { rerender } = render(
      <EditorModeView mode="split" source="# First" adapter={adapterFixture()} onModeChange={() => {}} onLinkActivate={onLinkActivate} onRetry={onRetry} />,
    );
    expect(screen.getByTestId('editor-source-pane')).toBeInTheDocument();
    expect(screen.getByTestId('editor-preview-pane')).toBeInTheDocument();
    rerender(<EditorModeView mode="split" source={'# Second\n\n[Open](https://example.com)'} adapter={adapterFixture()} onModeChange={() => {}} onLinkActivate={onLinkActivate} onRetry={onRetry} />);
    expect(screen.getByRole('heading', { name: 'Second' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Open' })).toBeInTheDocument();
    expect(screen.queryByRole('separator', { name: 'Resize editor preview' })).not.toBeInTheDocument();
  });
});
