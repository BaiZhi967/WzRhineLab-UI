'use client';

import * as React from 'react';
import { Button } from '@wzrhine/react';
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
    <div {...rest} ref={ref} className={['rl-editor__save-status', className].filter(Boolean).join(' ')} data-status={status}>
      <span className="rl-editor__save-status-label" role="status" aria-live="polite" data-status={status}>{messages.saveStatus[status]}</span>
      <span className="rl-editor__save-status-actions">
        {status === 'error' && onRetry && <Button size="sm" variant="secondary" onClick={onRetry}>{messages.retry}</Button>}
        {status === 'conflict' && onResolveConflict && <Button size="sm" variant="ghost" onClick={onResolveConflict}>{messages.resolveConflict}</Button>}
      </span>
    </div>
  );
});
