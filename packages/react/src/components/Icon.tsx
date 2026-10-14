'use client';

import * as React from 'react';
import { cx } from '../utils/cx.js';

/**
 * Public, dependency-free line icon entry used by consumers that need a stable icon grid.
 * Family grammar (docs/design/ICONS.md): 24×24 master, 1.75 stroke, round cap/join, currentColor.
 */
export const iconNames = [
  'Settings', 'Settings2', 'SlidersHorizontal', 'Minus', 'Maximize', 'Maximize2', 'Minimize2', 'PanelTopClose', 'PanelTopOpen', 'Power', 'Square',
  'FolderOpen', 'FolderPlus', 'FolderMinus', 'FileCode2', 'FoldVertical', 'Plug', 'Puzzle', 'Boxes',
  'ShieldAlert', 'ShieldHalf', 'ChevronUp', 'Eye', 'ImagePlus', 'MessagesSquare', 'PinOff', 'RotateCcw',
  'SquareChartGantt', 'Users', 'ChevronDown', 'ChevronLeft', 'ChevronRight', 'Plus', 'X', 'Check',
  // Foundation / common operations
  'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'AtSign', 'MoreHorizontal', 'Play', 'Pause', 'Search', 'Menu', 'List',
  'Copy', 'Pencil', 'Pin', 'Trash2', 'Paperclip', 'RefreshCw', 'RotateCw', 'Download', 'Upload', 'Filter',
  'Link', 'SquareArrowOutUpRight', 'CircleCheck', 'Info', 'TriangleAlert', 'Lock', 'Clock', 'Globe',
  // Archive / knowledge
  'Archive', 'ArchiveRestore', 'Bookmark', 'File', 'FileText', 'FileSearch', 'Folder', 'Tag', 'Index', 'Database', 'History',
  // Research / instruments
  'Activity', 'Caliper', 'Flask', 'Focus', 'Layers', 'Microscope', 'Molecule', 'Orbit', 'Sample', 'Satellite', 'Scope', 'Signal', 'Telemetry',
  // Workspace / agent
  'Agent', 'Code2', 'Command', 'Cpu', 'GitBranch', 'GitFork', 'Grid2X2', 'Home', 'Image', 'MessageCircleQuestion', 'ShieldCheck', 'Sparkles', 'Terminal', 'Wrench',
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
  // Foundation / common operations
  ArrowDown: <path d="M12 5v14M6 13l6 6 6-6" />,
  ArrowLeft: <path d="M19 12H5M11 6l-6 6 6 6" />,
  ArrowRight: <path d="M5 12h14M13 6l6 6-6 6" />,
  ArrowUp: <path d="M12 19V5M6 11l6-6 6 6" />,
  AtSign: <><circle cx="12" cy="12" r="3.5" /><path d="M15.5 8.5V13a2.5 2.5 0 0 0 5 0V12A8.5 8.5 0 1 0 15.6 19.7" /></>,
  MoreHorizontal: <path d="M5 12h.01M12 12h.01M19 12h.01" />,
  Play: <path d="M7.5 5l12 7-12 7Z" />,
  Pause: <path d="M9 5v14M15 5v14" />,
  Search: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="M15.5 15.5 21 21" /></>,
  Menu: <path d="M4 6h16M4 12h12M4 18h16" />,
  List: <path d="M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01" />,
  Copy: <><rect x="9" y="9" width="12" height="12" rx="1.5" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></>,
  Pencil: <><path d="M17 3l4 4L9 19l-5 1 1-5Z" /><path d="M15 5l4 4" /></>,
  Pin: <path d="M15 4l5 5-3 1-4 4v4l-2-2H7l3-3V9L7 7l1-3z" />,
  Trash2: <><path d="M3 6h18" /><path d="M19 6v13a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /><path d="M9 6V4a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 4v2" /><path d="M10 11v6M14 11v6" /></>,
  Paperclip: <path d="M20.7 10.3l-8.5 8.5a5.5 5.5 0 0 1-7.78-7.78l8.49-8.49a3.5 3.5 0 0 1 4.95 4.95l-8.49 8.48a1.5 1.5 0 0 1-2.12-2.12l7.78-7.78" />,
  RefreshCw: <><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" /><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" /><path d="M3 21v-5h5" /></>,
  RotateCw: <path d="M20 12a8 8 0 1 1-3-6.2M20 4v5h-5" />,
  Download: <><path d="M12 3v14" /><path d="M7 12l5 5 5-5" /><path d="M4 18v3h16v-3" /></>,
  Upload: <><path d="M12 17V3" /><path d="M7 8l5-5 5 5" /><path d="M4 18v3h16v-3" /></>,
  Filter: <><path d="M3 5h18l-7 8v7l-4-2v-7Z" /><path d="M10 9h4" /></>,
  Link: <><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></>,
  SquareArrowOutUpRight: <><path d="M15 3h6v6" /><path d="M10 14 21 3" /><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /></>,
  CircleCheck: <><circle cx="12" cy="12" r="8.5" /><path d="m8 12 3 3 5-6" /></>,
  Info: <><circle cx="12" cy="12" r="8.5" /><path d="M12 11v5M12 8h.01" /></>,
  TriangleAlert: <><path d="M12 4l9 16H3Z" /><path d="M12 10v4M12 17h.01" /></>,
  Lock: <><rect x="5" y="10" width="14" height="11" rx="1.5" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /><circle cx="12" cy="15" r="1.2" /><path d="M12 16.2V18" /></>,
  Clock: <><circle cx="12" cy="12" r="8.5" /><path d="M12 7v5l4 2" /></>,
  Globe: <><circle cx="12" cy="12" r="8.5" /><path d="M3.5 12h17" /><ellipse cx="12" cy="12" rx="4" ry="8.5" /></>,
  // Archive / knowledge
  Archive: <><rect x="3" y="3" width="18" height="5" rx="1" /><path d="M4 8v13h16V8" /><path d="M10 14h4" /></>,
  ArchiveRestore: <><rect x="3" y="3" width="18" height="5" rx="1" /><path d="M4 8v13h16V8" /><path d="M12 18v-5M9.5 15.5 12 13l2.5 2.5" /></>,
  Bookmark: <><path d="M6 3h12v18l-6-4-6 4Z" /><path d="M9 8h6" /></>,
  File: <path d="M6 3h8l4 4v14H6zM14 3v5h5" />,
  FileText: <><path d="M6 3h8l4 4v14H6zM14 3v5h5" /><path d="M9 12h6M9 16h4" /></>,
  FileSearch: <><path d="M6 3h8l4 4v14H6zM14 3v5h5" /><path d="M9 9h3" /><circle cx="13" cy="14.5" r="3.5" /><path d="m15.5 17 2.5 2.5" /></>,
  Folder: <path d="M3 6h7l2 2h9v10H3z" />,
  Tag: <><path d="M3 4h10l8 8-8 8L3 10Z" /><circle cx="7" cy="8" r="1.3" /></>,
  Index: <><path d="M5 4h14v16H5Z" /><path d="M9 8h7M9 12h7M9 16h4" /></>,
  Database: <><ellipse cx="12" cy="5.5" rx="8" ry="3" /><path d="M4 5.5V18q8 6 16 0V5.5" /><path d="M4 11.5q8 6 16 0" /><path d="M12 16.5V20" /></>,
  History: <><path d="M4 9a9 9 0 1 1 0 7M4 4v5h5" /><path d="M12 7v5l4 2" /></>,
  // Research / instruments
  Activity: <path d="M3 13h4l3-7 4 13 3-8 2 2h2" />,
  Caliper: <><path d="M4 4v15h16M4 9h13M10 9v6M17 9v4" /><path d="M7 4v3M13 4v3M19 4v3M7 19v-3" /></>,
  Flask: <><path d="M9 3h6M10 3v7l-5.3 9.1Q4 21 6.2 21h11.6q2.2 0 1.5-1.9L14 10V3" /><path d="M7.5 15h9" /></>,
  Focus: <><path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5" /><circle cx="12" cy="12" r="2" /></>,
  Layers: <><path d="m3 8 9-5 9 5-9 5Z" /><path d="m3 12 9 5 9-5M3 16l9 5 9-5" /></>,
  Microscope: <><path d="M9 3l5 4-3 4-5-4ZM9 10l3 3M12 13q5 0 5 4M4 21h16M7 17h3" /><circle cx="17" cy="17" r="2" /></>,
  Molecule: <><circle cx="5" cy="12" r="2" /><circle cx="15" cy="5" r="2" /><circle cx="19" cy="17" r="2" /><circle cx="11" cy="14" r="2" /><path d="M7 11l6-5M7 13l2 1M13 15l4 2" /></>,
  Orbit: <><circle cx="12" cy="12" r="2" /><ellipse cx="12" cy="12" rx="9" ry="4" transform="rotate(-35 12 12)" /><circle cx="18.8" cy="6.6" r="1.25" fill="currentColor" stroke="none" /></>,
  Sample: <><rect x="6" y="3" width="12" height="18" rx="1.5" /><path d="M9 7h6" /><circle cx="12" cy="13" r="3" /><path d="M9 18h6" /></>,
  Satellite: <><rect x="9" y="9" width="6" height="6" rx="1" /><path d="M9 10 5 6M15 14l4 4" /><path d="M4 3l4 4-2 2-4-4ZM16 15l4 4-2 2-4-4Z" /><circle cx="12" cy="12" r="1.2" /></>,
  Scope: <><circle cx="12" cy="12" r="7" /><circle cx="12" cy="12" r="2" /><path d="M12 3v2M12 19v2M3 12h2M19 12h2" /></>,
  Signal: <path d="M4 19v-4M9 19v-8M14 19v-12M19 19V3" />,
  Telemetry: <><rect x="4" y="5" width="16" height="14" rx="1" /><path d="m6 15 3-3 3 2 3-5 3 2" /><path d="M7 8h3" /></>,
  // Workspace / agent
  Agent: <><path d="M12 3l8 5v8l-8 5-8-5V8Z" /><path d="M8 12h8M12 8v8" /><circle cx="12" cy="12" r="1.25" fill="currentColor" stroke="none" /></>,
  Code2: <path d="m17 16 4-4-4-4M7 8l-4 4 4 4M14 4l-4 16" />,
  Command: <><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8" cy="8" r="1.8" /><circle cx="16" cy="8" r="1.8" /><circle cx="8" cy="16" r="1.8" /><circle cx="16" cy="16" r="1.8" /><path d="M9.8 8h4.4M8 9.8v4.4M16 9.8v4.4" /></>,
  Cpu: <><rect x="5" y="5" width="14" height="14" rx="1.5" /><rect x="9.5" y="9.5" width="5" height="5" /><path d="M9 2.5V5M15 2.5V5M9 19v2.5M15 19v2.5M2.5 9H5M2.5 15H5M19 9h2.5M19 15h2.5" /></>,
  GitBranch: <><path d="M6 3v12" /><circle cx="18" cy="6" r="3" /><circle cx="6" cy="18" r="3" /><path d="M18 9a9 9 0 0 1-9 9" /></>,
  GitFork: <><circle cx="12" cy="18" r="3" /><circle cx="6" cy="6" r="3" /><circle cx="18" cy="6" r="3" /><path d="M18 9v2c0 .6-.4 1-1 1H7c-.6 0-1-.4-1-1V9" /><path d="M12 12v3" /></>,
  Grid2X2: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
  Home: <path d="m3 11 9-7 9 7M6 10v10h12V10M10 20v-6h4v6" />,
  Image: <><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="8" cy="9" r="1" /><path d="m4 17 5-5 3 3 2-2 5 5" /></>,
  MessageCircleQuestion: <><path d="M9.8 20.2A8.5 8.5 0 1 0 4.65 16.27L3 21Z" /><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3" /><path d="M12 17h.01" /></>,
  ShieldCheck: <><path d="M12 3 20 6v5c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6z" /><path d="m9 12 2 2 4-4" /></>,
  Sparkles: <><path d="M12 4c.6 3.8 2.2 5.4 6 6-3.8.6-5.4 2.2-6 6-.6-3.8-2.2-5.4-6-6 3.8-.6 5.4-2.2 6-6Z" /><path d="M18.5 3.5c.3 1.4.9 2 2.3 2.3-1.4.3-2 .9-2.3 2.3-.3-1.4-.9-2-2.3-2.3 1.4-.3 2-.9 2.3-2.3Z" /></>,
  Terminal: <><rect x="4" y="5" width="16" height="14" rx="1" /><path d="m7 9 3 3-3 3" /><path d="M12 16h5" /></>,
  Wrench: <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />,
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
