import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { RhineProvider } from '@wzrhine/react';
import { DocumentTabs } from '../src/components/DocumentTabs.js';
import { EditorMessagesProvider, editorEnUS } from '../src/provider/EditorMessages.js';

const tabs = [
  { id: 'one', title: 'One.md', dirty: true },
  { id: 'two', title: 'Two.md', closable: true },
  { id: 'three', title: 'Three.md', closable: false },
] as const;

function renderTabs(props: Partial<React.ComponentProps<typeof DocumentTabs>> = {}) {
  return render(
    <RhineProvider theme="light">
      <EditorMessagesProvider messages={editorEnUS}>
        <DocumentTabs tabs={tabs} activeId="one" onActiveChange={() => {}} {...props} />
      </EditorMessagesProvider>
    </RhineProvider>,
  );
}

describe('DocumentTabs', () => {
  it('renders tab semantics, active state and dirty marker', () => {
    renderTabs();
    expect(screen.getByRole('tablist', { name: editorEnUS.tabs.label })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /One.md/ })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: /One.md/ })).toHaveAccessibleDescription(new RegExp(editorEnUS.tabs.dirty));
    expect(screen.getByRole('tab', { name: /Three.md/ })).toBeInTheDocument();
  });

  it('reports activation and close requests with stable ids', async () => {
    const user = userEvent.setup();
    const onActiveChange = vi.fn();
    const onClose = vi.fn();
    renderTabs({ onActiveChange, onClose });
    await user.click(screen.getByRole('tab', { name: /Two.md/ }));
    expect(onActiveChange).toHaveBeenCalledWith('two');
    await user.click(screen.getByRole('button', { name: editorEnUS.tabs.close('Two.md') }));
    expect(onClose).toHaveBeenCalledWith('two');
  });

  it('does not render a close control for non-closable tabs', () => {
    renderTabs();
    expect(screen.queryByRole('button', { name: editorEnUS.tabs.close('Three.md') })).not.toBeInTheDocument();
  });
});
