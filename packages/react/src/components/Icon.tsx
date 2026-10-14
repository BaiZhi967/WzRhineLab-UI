'use client';

import * as React from 'react';
import { cx } from '../utils/cx.js';

/** Public, dependency-free line icon entry used by consumers that need a stable icon grid. */
export const iconNames = [
  'Settings', 'Settings2', 'SlidersHorizontal', 'Minus', 'Maximize', 'Maximize2', 'Minimize2', 'PanelTopClose', 'PanelTopOpen', 'Power', 'Square',
  'FolderOpen', 'FolderPlus', 'FolderMinus', 'FileCode2', 'FoldVertical', 'Plug', 'Puzzle', 'Boxes',
  'ShieldAlert', 'ShieldHalf', 'ChevronUp', 'Eye', 'ImagePlus', 'MessagesSquare', 'PinOff', 'RotateCcw',
  'SquareChartGantt', 'Users', 'ChevronDown', 'ChevronLeft', 'ChevronRight', 'Plus', 'X', 'Check',
] as const;
export type IconName = (typeof iconNames)[number];

const PATHS: Record<IconName, React.ReactNode> = {
  Settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-1.8 1.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.1h-2.6V20a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1-1.8-1.8.1-.1A1.7 1.7 0 0 0 8 15a1.7 1.7 0 0 0-1.6-1H6v-2.6h.4A1.7 1.7 0 0 0 8 10a1.7 1.7 0 0 0-.3-1.9l-.1-.1 1.8-1.8.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.6v-.1H15V5a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1 1.8 1.8-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.1v2.6H21a1.7 1.7 0 0 0-1.6 1Z" /></>,
  Settings2: <><path d="M4 6h10M18 6h2M4 12h3M11 12h9M4 18h10M18 18h2" /><circle cx="16" cy="6" r="2" /><circle cx="9" cy="12" r="2" /><circle cx="16" cy="18" r="2" /></>,
  SlidersHorizontal: <><path d="M4 6h16M4 12h16M4 18h16" /><circle cx="9" cy="6" r="2" /><circle cx="15" cy="12" r="2" /><circle cx="11" cy="18" r="2" /></>,
  Minus: <path d="M5 12h14" />, Maximize: <rect x="5" y="5" width="14" height="14" rx="1" />, Maximize2: <path d="M8 3H3v5M3 3l5 5M16 3h5v5M21 3l-5 5M8 21H3v-5M3 21l5-5M16 21h5v-5M21 21l-5-5" />, Minimize2: <path d="M8 16 16 8M8 8l8 8" />, PanelTopClose: <><path d="M4 5h16v14H4zM4 9h16" /><path d="m9 13 3 3 3-3" /></>, PanelTopOpen: <><path d="M4 5h16v14H4zM4 9h16" /><path d="m9 17 3-3 3 3" /></>, Power: <><path d="M12 3v9" /><path d="M7.1 5.6a7 7 0 1 0 9.8 0" /></>, Square: <rect x="4" y="4" width="16" height="16" rx="1" />,
  FolderOpen: <><path d="M3 6h7l2 2h9v10H3z" /><path d="m3 8 2 8h14l2-8" /></>, FolderPlus: <><path d="M3 6h7l2 2h9v10H3z" /><path d="M12 10v6M9 13h6" /></>, FolderMinus: <><path d="M3 6h7l2 2h9v10H3z" /><path d="M9 13h6" /></>, FileCode2: <><path d="M6 3h8l4 4v14H6zM14 3v5h5" /><path d="m11 13-2 2 2 2M15 13l2 2-2 2" /></>, FoldVertical: <><path d="M7 3v18M17 3v18M3 8l4 4 4-4M13 16l4-4 4 4" /></>,
  Plug: <><path d="M9 7V3M15 7V3M6 7h12v3a6 6 0 0 1-12 0zM12 16v5" /></>, Puzzle: <path d="M9 3h3a2 2 0 1 1 4 0v3h3v3a2 2 0 1 1 0 4v3h-3a2 2 0 1 1-4 0h-3v-3a2 2 0 1 1 0-4V6h3z" />, Boxes: <><path d="m4 7 4-2 4 2-4 2-4-2ZM12 7l4-2 4 2-4 2-4-2ZM4 7v6l4 2 4-2V7M12 7v6l4 2 4-2V7" /></>,
  ShieldAlert: <><path d="M12 3 20 6v5c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6z" /><path d="M12 8v4M12 15v.01" /></>, ShieldHalf: <><path d="M12 3 20 6v5c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6z" /><path d="M12 3v18" /></>,
  ChevronUp: <path d="m5 14 7-7 7 7" />, ChevronDown: <path d="m5 10 7 7 7-7" />, ChevronLeft: <path d="m14 5-7 7 7 7" />, ChevronRight: <path d="m10 5 7 7-7 7" />, Eye: <><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" /><circle cx="12" cy="12" r="2.5" /></>, ImagePlus: <><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="8" cy="9" r="1" /><path d="m4 17 5-5 3 3 2-2 5 5M17 3v6M14 6h6" /></>, MessagesSquare: <><path d="M3 5h14v10H8l-5 4z" /><path d="M8 19h9l4-3V7h-2" /></>, PinOff: <><path d="m3 3 18 18M15 4l5 5-3 1-4 4v4l-2-2H7l3-3V9L7 7l1-3z" /></>, RotateCcw: <path d="M4 12a8 8 0 1 0 3-6.2M4 4v5h5" />, SquareChartGantt: <><rect x="4" y="4" width="16" height="16" rx="1" /><path d="M8 8h8M8 12h5M8 16h8" /></>, Users: <><circle cx="9" cy="8" r="3" /><path d="M3 20c0-3 2.5-5 6-5s6 2 6 5M16 11a3 3 0 1 0 0-6M17 15c2.5.2 4 1.8 4 4" /></>, Plus: <path d="M12 5v14M5 12h14" />, X: <path d="M5 5l14 14M19 5 5 19" />, Check: <path d="m5 12 4 4L19 6" />,
};

export type IconProps = Omit<React.SVGAttributes<SVGSVGElement>, 'name'> & {
  /** Built-in icon name. Any other string is accepted together with `children` (custom SVG content). */
  name: IconName | (string & {});
  size?: number | string;
  /** Custom SVG inner nodes; win over the built-in path for `name`. */
  children?: React.ReactNode;
};

export const Icon = React.forwardRef<SVGSVGElement, IconProps>(function Icon({ name, size = 24, className, strokeWidth = 1.75, children, ...rest }, ref) {
  return <svg {...rest} ref={ref} className={cx('rl-icon', className)} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" data-icon={name} role={rest['aria-label'] ? 'img' : undefined} aria-hidden={rest['aria-label'] ? undefined : true} focusable="false">{children ?? PATHS[name as IconName] ?? null}</svg>;
});
