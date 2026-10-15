'use client';

import { ConnectionPath } from './ConnectionPath.js';
import type { ConnectionPathProps } from './ConnectionPath.js';

export interface AnnotationTraceProps extends ConnectionPathProps {}

/** Connect an object to its always-readable annotation using the shared anchor geometry. */
export function AnnotationTrace({ fromAnchor = 'right', toAnchor = 'left', route = 'curve', ...props }: AnnotationTraceProps) {
  return <ConnectionPath {...props} fromAnchor={fromAnchor} toAnchor={toAnchor} route={route} annotation />;
}
