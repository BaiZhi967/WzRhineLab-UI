'use client';

import { ConnectionPath } from './ConnectionPath.js';
import type { ConnectionPathProps } from './ConnectionPath.js';

export interface SignalPathProps extends ConnectionPathProps {}

/** A static relationship with an explicitly controlled signal; never an automatic loop. */
export function SignalPath(props: SignalPathProps) {
  return <ConnectionPath {...props} />;
}
