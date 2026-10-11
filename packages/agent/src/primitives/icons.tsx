'use client';

import * as React from 'react';

/*
 * Original agent icon set (ICONS.md): 16 × 16 viewBox, 1.5 stroke, round caps / joins,
 * `currentColor`, always `aria-hidden` — the accessible name comes from the surrounding control.
 * Family-specific icons live next to their components; add shared ones here.
 */

export type AgentIconName =
  | 'chevron-down'
  | 'chevron-right'
  | 'chevron-left'
  | 'arrow-down'
  | 'arrow-up'
  | 'arrow-left'
  | 'close'
  | 'plus'
  | 'search'
  | 'more'
  | 'pin'
  | 'archive'
  | 'unarchive'
  | 'trash'
  | 'edit'
  | 'fork'
  | 'copy'
  | 'check'
  | 'retry'
  | 'send'
  | 'stop'
  | 'attach'
  | 'image'
  | 'at'
  | 'slash'
  | 'file'
  | 'folder'
  | 'code'
  | 'terminal'
  | 'tool'
  | 'shield'
  | 'question'
  | 'agent'
  | 'spark'
  | 'panel'
  | 'link'
  | 'external'
  | 'download'
  | 'history'
  | 'warning'
  | 'info'
  | 'clock'
  | 'model'
  | 'globe'
  | 'database'
  | 'layers'
  | 'list';

const paths: Record<AgentIconName, React.ReactNode> = {
  'chevron-down': <path d="m4 6 4 4 4-4" />,
  'chevron-right': <path d="m6 4 4 4-4 4" />,
  'chevron-left': <path d="m10 4-4 4 4 4" />,
  'arrow-down': <path d="M8 3v10m-4-4 4 4 4-4" />,
  'arrow-up': <path d="M8 13V3M4 7l4-4 4 4" />,
  'arrow-left': <path d="M13 8H3m4-4L3 8l4 4" />,
  close: <path d="M4 4l8 8M12 4l-8 8" />,
  plus: <path d="M8 3v10M3 8h10" />,
  search: (
    <>
      <circle cx="7" cy="7" r="4" />
      <path d="m10 10 3 3" />
    </>
  ),
  more: (
    <>
      <circle cx="3.5" cy="8" r="0.75" />
      <circle cx="8" cy="8" r="0.75" />
      <circle cx="12.5" cy="8" r="0.75" />
    </>
  ),
  pin: <path d="M6 2.5h4l-.5 4 2 2v1h-7v-1l2-2-.5-4ZM8 9.5V14" />,
  archive: <path d="M2.5 3.5h11v3h-11zM3.5 6.5v6h9v-6M6.5 9h3" />,
  unarchive: <path d="M2.5 3.5h11v3h-11zM3.5 6.5v6h9v-6M8 11.5V8m-1.5 1.5L8 8l1.5 1.5" />,
  trash: <path d="M3 4.5h10M6.5 4.5v-2h3v2M4.5 4.5l.5 9h6l.5-9M7 7v4m2-4v4" />,
  edit: <path d="M10.5 2.5l3 3-7.5 7.5H3v-3l7.5-7.5Z" />,
  fork: (
    <>
      <circle cx="4.5" cy="3.5" r="1.5" />
      <circle cx="11.5" cy="3.5" r="1.5" />
      <circle cx="8" cy="12.5" r="1.5" />
      <path d="M4.5 5v1.5a2 2 0 0 0 2 2h3a2 2 0 0 0 2-2V5M8 8.5V11" />
    </>
  ),
  copy: <path d="M5.5 5.5h7v7h-7zM3.5 10.5v-7h7" />,
  check: <path d="m3.5 8.5 3 3 6-7" />,
  retry: <path d="M12.5 8a4.5 4.5 0 1 1-1.3-3.2M12.5 3v2.5H10" />,
  send: <path d="M8 13V3M4 7l4-4 4 4" />,
  stop: <rect x="4.5" y="4.5" width="7" height="7" rx="1" />,
  attach: <path d="M12 7.5 7.5 12a3 3 0 0 1-4.2-4.2L8 3.1a2 2 0 0 1 2.8 2.8L6.3 10.4a1 1 0 0 1-1.4-1.4L9 4.9" />,
  image: (
    <>
      <rect x="2.5" y="3" width="11" height="10" rx="1" />
      <circle cx="6" cy="6.5" r="1" />
      <path d="m3 11.5 3.5-3.5 2.5 2.5 1.5-1.5 2.5 2.5" />
    </>
  ),
  at: (
    <>
      <circle cx="8" cy="8" r="2.25" />
      <path d="M10.25 8v1a1.75 1.75 0 0 0 3.5 0V8A5.75 5.75 0 1 0 11 13" />
    </>
  ),
  slash: <path d="M10.5 2.5 5.5 13.5" />,
  file: <path d="M4 2.5h5l3 3v8H4zM9 2.5v3h3M6 8.5h4M6 11h4" />,
  folder: <path d="M2.5 4.5v8h11v-6.5H8L6.5 4.5Z" />,
  code: <path d="M5.5 4.5 2 8l3.5 3.5M10.5 4.5 14 8l-3.5 3.5" />,
  terminal: (
    <>
      <rect x="2" y="3" width="12" height="10" rx="1" />
      <path d="m4.5 6.5 2 1.5-2 1.5M8 10.5h3" />
    </>
  ),
  tool: <path d="M9.5 2.8a3 3 0 0 0 3.7 3.7L8 11.7 6.5 13.2a1.5 1.5 0 0 1-2.1-2.1L5.9 9.6l5.2-5.2a3 3 0 0 1-1.6-1.6Z" />,
  shield: <path d="M8 2 3 4v4c0 3 2.2 5 5 6 2.8-1 5-3 5-6V4L8 2ZM6 8l1.5 1.5L10.5 6.5" />,
  question: (
    <>
      <circle cx="8" cy="8" r="5.5" />
      <path d="M6.3 6.4a1.8 1.8 0 1 1 2.4 1.7c-.5.2-.7.6-.7 1.1v.3M8 11.3v.01" />
    </>
  ),
  agent: (
    <>
      <rect x="3" y="5" width="10" height="7.5" rx="2" />
      <path d="M8 5V2.5M6 8.5v.5M10 8.5v.5" />
    </>
  ),
  spark: <path d="M8 2v3M8 11v3M2 8h3M11 8h3M4 4l1.8 1.8M10.2 10.2 12 12M12 4l-1.8 1.8M5.8 10.2 4 12" />,
  panel: (
    <>
      <rect x="2" y="3" width="12" height="10" rx="1" />
      <path d="M10 3v10" />
    </>
  ),
  link: <path d="M6.5 9.5l3-3M7 4.5l1-1a2.5 2.5 0 0 1 3.5 3.5l-1 1M9 11.5l-1 1a2.5 2.5 0 0 1-3.5-3.5l1-1" />,
  external: <path d="M9 3h4v4M13 3 7.5 8.5M11 9.5v3.5H3V5h3.5" />,
  download: <path d="M8 2.5v7.5m-3-3 3 3 3-3M3 13h10" />,
  history: <path d="M3 8a5 5 0 1 0 1.5-3.6M3 2.5v2.5h2.5M8 5v3l2 1.5" />,
  warning: <path d="M8 2.5 14 13.5H2L8 2.5ZM8 7v2.5M8 11.5v.01" />,
  info: (
    <>
      <circle cx="8" cy="8" r="5.5" />
      <path d="M8 7.5V11M8 5v.01" />
    </>
  ),
  clock: (
    <>
      <circle cx="8" cy="8" r="5.5" />
      <path d="M8 5v3l2 1.5" />
    </>
  ),
  model: (
    <>
      <path d="M8 2.5 13 5.3v5.4L8 13.5 3 10.7V5.3Z" />
      <path d="M3 5.3 8 8l5-2.7M8 8v5.5" />
    </>
  ),
  globe: (
    <>
      <circle cx="8" cy="8" r="5.5" />
      <path d="M2.5 8h11M8 2.5c1.6 1.6 2.3 3.5 2.3 5.5S9.6 11.9 8 13.5C6.4 11.9 5.7 10 5.7 8S6.4 4.1 8 2.5Z" />
    </>
  ),
  database: (
    <>
      <ellipse cx="8" cy="4" rx="5" ry="1.75" />
      <path d="M3 4v8c0 1 2.2 1.75 5 1.75S13 13 13 12V4M3 8c0 1 2.2 1.75 5 1.75S13 9 13 8" />
    </>
  ),
  layers: <path d="M8 2.5 14 5.5 8 8.5 2 5.5ZM2 8.5l6 3 6-3M2 11l6 3 6-3" />,
  list: <path d="M5.5 4.5h8M5.5 8h8M5.5 11.5h8M2.5 4.5v.01M2.5 8v.01M2.5 11.5v.01" />,
};

export type AgentIconProps = Omit<React.SVGProps<SVGSVGElement>, 'children'> & {
  name: AgentIconName;
};

export function AgentIcon({ name, className, ...rest }: AgentIconProps) {
  return (
    <svg
      {...rest}
      className={className ? `rl-agent-icon ${className}` : 'rl-agent-icon'}
      viewBox="0 0 16 16"
      aria-hidden="true"
      focusable="false"
      data-icon={name}
    >
      {paths[name]}
    </svg>
  );
}
