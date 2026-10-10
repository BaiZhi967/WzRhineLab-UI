import * as React from 'react';

// Stub (M9 scaffolding); implemented per ADR-0006 §6.
export type EmptyStateKind = 'empty' | 'no-results' | 'no-permission' | 'first-use';
export type EmptyStateProps = { title: React.ReactNode; kind?: EmptyStateKind };
export function EmptyState(_props: EmptyStateProps): React.ReactElement | null {
  return null;
}
