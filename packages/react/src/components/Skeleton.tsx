import * as React from 'react';

// Stub (M9 scaffolding); implemented per ADR-0006 §7.
export type SkeletonShape = 'text' | 'block' | 'circle';
export type SkeletonProps = { shape?: SkeletonShape };
export function Skeleton(_props: SkeletonProps): React.ReactElement | null {
  return null;
}
