import * as React from 'react';

// Stub (M9 scaffolding); implemented per ADR-0006 §5.
export type AlertTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';
export type AlertLive = 'off' | 'polite' | 'assertive';
export type AlertProps = { tone?: AlertTone; title?: React.ReactNode; children?: React.ReactNode; live?: AlertLive };
export type CalloutProps = { tone?: AlertTone; title?: React.ReactNode; children?: React.ReactNode };
export function Alert(_props: AlertProps): React.ReactElement | null {
  return null;
}
export function Callout(_props: CalloutProps): React.ReactElement | null {
  return null;
}
