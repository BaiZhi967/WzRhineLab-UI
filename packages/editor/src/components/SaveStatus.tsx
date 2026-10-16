'use client';

import * as React from 'react';
import type { SaveStatusKind } from '../contracts.js';
import { useEditorMessages } from '../provider/EditorMessages.js';

export interface SaveStatusProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> {
  status: SaveStatusKind;
  onRetry?: () => void;
  onResolveConflict?: () => void;
}

export const SaveStatus = React.forwardRef<HTMLDivElement, SaveStatusProps>(function SaveStatus(
  { status, onRetry, onResolveConflict, className, ...rest },
  ref,
) {
  const messages = useEditorMessages();
  return (
    <div {...rest} ref={ref} className={['rl-editor__save-status', className].filter(Boolean).join(' ')} role="status" aria-live="polite" data-status={status}>
      <span className="rl-editor__save-status-label">{messages.saveStatus[status]}</span>
      {status === 'error' && onRetry && <button type="button" onClick={onRetry}>{messages.retry}</button>}
      {status === 'conflict' && onResolveConflict && <button type="button" onClick={onResolveConflict}>{messages.resolveConflict}</button>}
    </div>
  );
});
