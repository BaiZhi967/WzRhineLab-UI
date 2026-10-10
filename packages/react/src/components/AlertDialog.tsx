import * as React from 'react';

// Stub (M9 scaffolding); implemented per ADR-0006 §2.
export type AlertDialogTone = 'danger' | 'default';
export type AlertDialogProps = { title: React.ReactNode; description: React.ReactNode; confirmLabel: React.ReactNode; onConfirm: () => void | Promise<unknown>; tone?: AlertDialogTone };
export function AlertDialog(_props: AlertDialogProps): React.ReactElement | null {
  return null;
}
