import * as React from 'react';

// Stub (M9 scaffolding); implemented per ADR-0006 §7.
export type SpinnerSize = 'sm' | 'md' | 'lg';
export type SpinnerProps = { size?: SpinnerSize; label?: string };
export function Spinner(_props: SpinnerProps): React.ReactElement | null {
  return null;
}
