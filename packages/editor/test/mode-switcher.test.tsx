import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { RhineProvider } from '@wzrhine/react';
import { EditorMessagesProvider, editorEnUS } from '../src/provider/EditorMessages.js';
import { EditorModeSwitcher } from '../src/components/EditorModeSwitcher.js';

describe('EditorModeSwitcher', () => {
  it('renders controlled tabs and reports mode intent', async () => {
    const user = userEvent.setup();
    const onModeChange = vi.fn();
    render(
      <RhineProvider theme="light">
        <EditorMessagesProvider messages={editorEnUS}>
          <EditorModeSwitcher value="source" onModeChange={onModeChange} />
        </EditorMessagesProvider>
      </RhineProvider>,
    );
    expect(screen.getByRole('tab', { name: editorEnUS.mode.source })).toHaveAttribute('aria-selected', 'true');
    await user.click(screen.getByRole('tab', { name: editorEnUS.mode.split }));
    expect(onModeChange).toHaveBeenCalledWith('split');
  });

  it('supports keyboard tab navigation without owning document state', async () => {
    const user = userEvent.setup();
    const onModeChange = vi.fn();
    render(
      <RhineProvider theme="light">
        <EditorMessagesProvider messages={editorEnUS}>
          <EditorModeSwitcher value="source" onModeChange={onModeChange} />
        </EditorMessagesProvider>
      </RhineProvider>,
    );
    const source = screen.getByRole('tab', { name: editorEnUS.mode.source });
    await user.click(source);
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: editorEnUS.mode.preview })).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(onModeChange).toHaveBeenCalledWith('preview');
  });
});
