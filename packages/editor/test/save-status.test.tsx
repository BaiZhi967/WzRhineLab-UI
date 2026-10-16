import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { RhineProvider } from '@wzrhine/react';
import { EditorMessagesProvider, editorEnUS } from '../src/provider/EditorMessages.js';
import { SaveStatus } from '../src/components/SaveStatus.js';

function renderStatus(props: React.ComponentProps<typeof SaveStatus>) {
  return render(
    <RhineProvider theme="light">
      <EditorMessagesProvider messages={editorEnUS}>
        <SaveStatus {...props} />
      </EditorMessagesProvider>
    </RhineProvider>,
  );
}

describe('SaveStatus', () => {
  it.each(['clean', 'dirty', 'saving', 'saved', 'error', 'conflict'] as const)('renders %s as a named status', (status) => {
    renderStatus({ status });
    expect(screen.getByRole('status')).toHaveAttribute('data-status', status);
    expect(screen.getByRole('status')).toHaveTextContent(editorEnUS.saveStatus[status]);
  });

  it('keeps focusable retry and conflict actions caller-owned', async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    const onResolveConflict = vi.fn();
    renderStatus({ status: 'error', onRetry });
    await user.click(screen.getByRole('button', { name: editorEnUS.retry }));
    expect(onRetry).toHaveBeenCalledTimes(1);
    renderStatus({ status: 'conflict', onResolveConflict });
    await user.click(screen.getByRole('button', { name: editorEnUS.resolveConflict }));
    expect(onResolveConflict).toHaveBeenCalledTimes(1);
  });
});
