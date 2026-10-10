import * as React from 'react';

// Stub (M9 scaffolding); implemented per ADR-0006 §4.
export type DrawerSide = 'start' | 'end';
export type DrawerSize = 'sm' | 'md' | 'lg';
export type DrawerProps = { title: React.ReactNode; children?: React.ReactNode; side?: DrawerSide; size?: DrawerSize };
export function Drawer(_props: DrawerProps): React.ReactElement | null {
  return null;
}
