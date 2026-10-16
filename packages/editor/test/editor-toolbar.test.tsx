import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { RhineProvider } from '@wzrhine/react';
import { EditorToolbar } from '../src/components/EditorToolbar.js';
import { EditorMessagesProvider, editorEnUS } from '../src/provider/EditorMessages.js';

const commands = [
  { id: 'bold', label: 'Bold', command: { type: 'toggle-mark', mark: 'bold' } as const, pressed: true, shortcut: 'Mod-B' },
  { id: 'undo', label: 'Undo', command: { type: 'undo' } as const, group: 'history' },
  { id: 'heading', label: 'Heading 2', command: { type: 'set-heading', level: 2 } as const },
];

function renderToolbar(props: Partial<React.ComponentProps<typeof EditorToolbar>> = {}) {
  return render(
    <RhineProvider theme="light">
      <EditorMessagesProvider messages={editorEnUS}>
        <EditorToolbar commands={commands} onCommand={() => {}} {...props} />
      </EditorMessagesProvider>
    </RhineProvider>,
  );
}

describe('EditorToolbar', () => {
  it('renders grouped commands, pressed state and shortcut text', () => {
    renderToolbar();
    expect(screen.getByRole('toolbar', { name: editorEnUS.toolbar.label })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Bold/ })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('Mod-B')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Undo/ })).toBeInTheDocument();
  });

  it('emits exact commands and suppresses formatting while composing/readOnly', async () => {
    const user = userEvent.setup();
    const onCommand = vi.fn();
    const { rerender } = render(
      <RhineProvider theme="light">
        <EditorMessagesProvider messages={editorEnUS}>
          <EditorToolbar commands={commands} onCommand={onCommand} />
        </EditorMessagesProvider>
      </RhineProvider>,
    );
    await user.click(screen.getByRole('button', { name: /Heading 2/ }));
    expect(onCommand).toHaveBeenCalledWith({ type: 'set-heading', level: 2 });
    rerender(
      <RhineProvider theme="light">
        <EditorMessagesProvider messages={editorEnUS}>
          <EditorToolbar commands={commands} onCommand={onCommand} composing readOnly />
        </EditorMessagesProvider>
      </RhineProvider>,
    );
    expect(screen.getByRole('button', { name: /Bold/ })).toBeDisabled();
    expect(screen.getByRole('button', { name: /Heading 2/ })).toBeDisabled();
  });
});
