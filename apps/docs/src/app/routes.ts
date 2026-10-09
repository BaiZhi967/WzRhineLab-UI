import { useEffect, useState } from 'react';

export type RouteGroup = 'start' | 'foundations' | 'components' | 'motion' | 'lab';

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
  { id: 'button', path: '/components/button', label: 'Button', group: 'components', index: '02' },
  { id: 'surface', path: '/components/surface', label: 'Surface', group: 'components', index: '03' },
  { id: 'status-badge', path: '/components/status-badge', label: 'StatusBadge', group: 'components', index: '04' },
  { id: 'motion', path: '/motion', label: 'Motion', group: 'motion', index: '05' },
  { id: 'lab-overlays', path: '/lab/overlays', label: 'Overlays (ADR)', group: 'lab', index: 'L1' },
] as const satisfies readonly RouteDef[];

export type RouteId = (typeof routes)[number]['id'];

export const groupLabels: Record<RouteGroup, string> = {
  start: 'Start',
  foundations: 'Foundations',
  components: 'Components',
  motion: 'Motion',
  lab: 'Lab',
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
