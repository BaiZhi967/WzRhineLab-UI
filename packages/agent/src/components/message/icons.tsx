'use client';

import * as React from 'react';

/*
 * Message-family icons not in the shared set (ICONS.md): 16 × 16 viewBox, 1.5 stroke, round caps,
 * `currentColor`, always `aria-hidden` (the control carries the name).
 */
const paths = {
  'thumb-up': <path d="M5.5 7 8 2.5c1 0 1.7.8 1.5 1.8L9 6.5h3.3a1.2 1.2 0 0 1 1.2 1.4l-.8 4.3a1.5 1.5 0 0 1-1.5 1.3H5.5ZM5.5 7h-2v6.5h2" />,
  'thumb-down': <path d="M10.5 9 8 13.5c-1 0-1.7-.8-1.5-1.8L7 9.5H3.7a1.2 1.2 0 0 1-1.2-1.4l.8-4.3A1.5 1.5 0 0 1 4.8 2.5h5.7ZM10.5 9h2V2.5h-2" />,
  message: <path d="M3 3.5h10v7H7.5L4.5 13v-2.5H3Z" />,
} as const;

export type MessageIconName = keyof typeof paths;

export function MessageIcon({ name, className }: { name: MessageIconName; className?: string }) {
  return (
    <svg className={className ? `rl-agent-icon ${className}` : 'rl-agent-icon'} viewBox="0 0 16 16" aria-hidden="true" focusable="false" data-icon={name}>
      {paths[name]}
    </svg>
  );
}
