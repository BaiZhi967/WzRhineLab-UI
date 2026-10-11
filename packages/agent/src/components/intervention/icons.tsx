'use client';

import * as React from 'react';

/*
 * Intervention-only glyphs (ICONS.md rules: 16 × 16, 1.5 stroke, round caps, currentColor,
 * aria-hidden). Shared names come from `primitives/icons.tsx`.
 */

type LocalIconName = 'shield-alert' | 'lock-open' | 'trash-warning';

const paths: Record<LocalIconName, React.ReactNode> = {
  'shield-alert': <path d="M8 2 3 4v4c0 3 2.2 5 5 6 2.8-1 5-3 5-6V4L8 2ZM8 5.5v3M8 10.5v.01" />,
  'lock-open': <path d="M4 7.5h8v6H4zM5.5 7.5V5a2.5 2.5 0 0 1 4.9-.7M8 10v1.5" />,
  'trash-warning': <path d="M3 4.5h10M6.5 4.5v-2h3v2M4.5 4.5l.5 9h6l.5-9M8 7v3M8 11.5v.01" />,
};

export function InterventionIcon({ name, className }: { name: LocalIconName; className?: string }) {
  return (
    <svg className={className ? `rl-agent-icon ${className}` : 'rl-agent-icon'} viewBox="0 0 16 16" aria-hidden="true" focusable="false" data-icon={name}>
      {paths[name]}
    </svg>
  );
}
