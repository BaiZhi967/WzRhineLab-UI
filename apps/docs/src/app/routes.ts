import { useEffect, useState } from 'react';

export type RouteGroup = 'start' | 'foundations' | 'components' | 'navigation' | 'advanced' | 'agent' | 'archive' | 'motion';

export interface RouteDef {
  id: string;
  path: string;
  label: string;
  group: RouteGroup;
  index: string;
}

export const routes = [
  { id: 'overview', path: '/', label: 'Overview', group: 'start', index: '00' },
  { id: 'foundations', path: '/foundations', label: 'Foundations', group: 'foundations', index: '01' },
  { id: 'locale', path: '/foundations/locale', label: 'Locale & messages', group: 'foundations', index: '24' },
  { id: 'button', path: '/components/button', label: 'Button', group: 'components', index: '02' },
  { id: 'icon-button', path: '/components/icon-button', label: 'IconButton', group: 'components', index: '03' },
  { id: 'surface', path: '/components/surface', label: 'Surface', group: 'components', index: '04' },
  { id: 'status-badge', path: '/components/status-badge', label: 'StatusBadge', group: 'components', index: '05' },
  { id: 'text', path: '/components/text', label: 'Text', group: 'components', index: '06' },
  { id: 'field', path: '/components/field', label: 'Field & Input', group: 'components', index: '07' },
  { id: 'choice', path: '/components/choice', label: 'Choice & Textarea', group: 'components', index: '15' },
  { id: 'tabs', path: '/components/tabs', label: 'Tabs', group: 'navigation', index: '08' },
  { id: 'tooltip', path: '/components/tooltip', label: 'Tooltip', group: 'navigation', index: '09' },
  { id: 'dialog', path: '/components/dialog', label: 'Dialog', group: 'navigation', index: '10' },
  { id: 'select', path: '/components/select', label: 'Select', group: 'navigation', index: '11' },
  { id: 'popover', path: '/components/popover', label: 'Popover', group: 'navigation', index: '12' },
  { id: 'menu', path: '/components/menu', label: 'Menu', group: 'navigation', index: '13' },
  { id: 'toast', path: '/components/toast', label: 'Toast', group: 'navigation', index: '14' },
  { id: 'alert-dialog', path: '/components/alert-dialog', label: 'AlertDialog', group: 'navigation', index: '21' },
  { id: 'drawer', path: '/components/drawer', label: 'Drawer', group: 'navigation', index: '22' },
  { id: 'feedback', path: '/components/feedback', label: 'Alert & feedback', group: 'components', index: '23' },
  { id: 'advanced', path: '/components/advanced', label: 'Advanced interaction', group: 'advanced', index: '25' },
  { id: 'command', path: '/components/command', label: 'Combobox & command', group: 'advanced', index: '26' },
  { id: 'agent-overview', path: '/agent', label: 'Agent workbench', group: 'agent', index: '30' },
  { id: 'agent-shell', path: '/agent/shell', label: 'Shell & conversations', group: 'agent', index: '31' },
  { id: 'agent-message', path: '/agent/messages', label: 'Messages & process', group: 'agent', index: '32' },
  { id: 'agent-tools', path: '/agent/tools', label: 'Tools & execution', group: 'agent', index: '33' },
  { id: 'agent-composer', path: '/agent/composer', label: 'Composer', group: 'agent', index: '34' },
  { id: 'agent-intervention', path: '/agent/intervention', label: 'Approval & questions', group: 'agent', index: '35' },
  { id: 'agent-workspace', path: '/agent/workspace', label: 'Workspace & artifacts', group: 'agent', index: '36' },
  { id: 'agent-motion', path: '/agent/motion', label: 'Agent motion', group: 'agent', index: '37' },
  { id: 'agent-adoption', path: '/agent/adoption', label: 'Wpi adoption readiness', group: 'agent', index: '38' },
  { id: 'archive', path: '/archive', label: 'Archive patterns', group: 'archive', index: '16' },
  { id: 'data', path: '/archive/data', label: 'Data & navigation', group: 'archive', index: '20' },
  { id: 'scenarios', path: '/archive/scenarios', label: 'Acceptance scenarios', group: 'archive', index: '17' },
  { id: 'patterns', path: '/patterns', label: 'Page patterns', group: 'archive', index: '39' },
  { id: 'recipes', path: '/recipes', label: 'Page recipes', group: 'archive', index: '40' },
  { id: 'content', path: '/archive/content', label: 'Markdown content', group: 'archive', index: '41' },
  { id: 'editor', path: '/archive/editor', label: 'Markdown editor', group: 'archive', index: '42' },
  { id: 'motion', path: '/motion', label: 'Motion', group: 'motion', index: '18' },
  { id: 'effects', path: '/motion/effects', label: 'Showcase effects', group: 'motion', index: '19' },
] as const satisfies readonly RouteDef[];

export type RouteId = (typeof routes)[number]['id'];

export const groupLabels: Record<RouteGroup, string> = {
  start: 'Start',
  foundations: 'Foundations',
  components: 'Components',
  navigation: 'Navigation & Overlay',
  advanced: 'Advanced interaction',
  agent: 'Agent UI',
  archive: 'Data & Archive',
  motion: 'Motion',
};

export function hrefFor(id: RouteId): string {
  const route = routes.find((r) => r.id === id)!;
  return `#${route.path}`;
}

export type Route = (typeof routes)[number];

function resolve(hash: string): Route {
  const path = hash.replace(/^#/, '') || '/';
  return routes.find((r) => r.path === path) ?? routes[0];
}

export function useHashRoute(): Route {
  const [route, setRoute] = useState(() => resolve(window.location.hash));
  useEffect(() => {
    const onChange = () => setRoute(resolve(window.location.hash));
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return route;
}
