import { render, screen } from '@testing-library/react';
import * as React from 'react';
import { describe, expect, it } from 'vitest';
import {
  EditorMessagesProvider,
  editorEnUS,
  editorZhCN,
  mergeEditorMessages,
  useEditorMessages,
} from '../src/provider/EditorMessages.js';

function Probe({ id }: { id: string }) {
  const messages = useEditorMessages();
  return <output data-testid={id}>{`${messages.saveStatus.dirty}|${messages.mode.source}|${messages.retry}`}</output>;
}

describe('EditorMessagesProvider', () => {
  it('provides zhCN by default and supports enUS', () => {
    render(<EditorMessagesProvider><Probe id="default" /></EditorMessagesProvider>);
    expect(screen.getByTestId('default')).toHaveTextContent(`${editorZhCN.saveStatus.dirty}|${editorZhCN.mode.source}`);
    render(<EditorMessagesProvider messages={editorEnUS}><Probe id="english" /></EditorMessagesProvider>);
    expect(screen.getByTestId('english')).toHaveTextContent(`${editorEnUS.saveStatus.dirty}|${editorEnUS.mode.source}`);
  });

  it('merges partial overrides with nested provider isolation', () => {
    const merged = mergeEditorMessages(editorEnUS, { saveStatus: { dirty: 'Unsaved local draft' } });
    expect(merged.saveStatus.dirty).toBe('Unsaved local draft');
    expect(merged.saveStatus.saved).toBe(editorEnUS.saveStatus.saved);
    render(
      <EditorMessagesProvider messages={editorEnUS}>
        <Probe id="outer" />
        <EditorMessagesProvider messages={{ retry: '再次尝试' }}>
          <Probe id="inner" />
        </EditorMessagesProvider>
      </EditorMessagesProvider>,
    );
    expect(screen.getByTestId('outer')).toHaveTextContent(editorEnUS.retry);
    expect(screen.getByTestId('inner')).toHaveTextContent('再次尝试');
  });
});
