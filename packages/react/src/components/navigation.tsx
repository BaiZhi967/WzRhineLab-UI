'use client';

import * as React from 'react';
import { motion } from 'motion/react';
import { cx } from '../utils/cx.js';
import { useRhineMotion } from '../motion/useRhineMotion.js';
import { Tooltip } from './Tooltip.js';

export type NavItemProps = Omit<React.HTMLAttributes<HTMLElement>, 'children'> & {
  label: React.ReactNode;
  icon?: React.ReactNode;
  active?: boolean;
  badge?: React.ReactNode;
  collapsed?: boolean;
  href?: string;
  render?: React.ReactElement<Record<string, unknown>> | ((props: React.HTMLAttributes<HTMLElement>) => React.ReactElement);
  disabled?: boolean;
};

const NavContext = React.createContext({ collapsed: false });

export const NavItem = React.forwardRef<HTMLElement, NavItemProps>(function NavItem({ label, icon, active, badge, collapsed: collapsedProp, href, render, disabled, className, onClick, ...rest }, ref) {
  const collapsed = collapsedProp ?? React.useContext(NavContext).collapsed;
  const content = <>{icon && <span className="rl-nav-item__icon" aria-hidden="true">{icon}</span>}<span className={cx('rl-nav-item__label', collapsed && 'rl-visually-hidden')}>{label}</span>{badge && <span className="rl-nav-item__badge">{badge}</span>}</>;
  const common = { ...rest, ref, className: cx('rl-nav-item', className), 'aria-current': active ? ('page' as const) : undefined, 'aria-disabled': disabled || undefined, 'data-rl-nav-item': '', 'data-disabled': disabled || undefined, tabIndex: disabled ? -1 : 0,
    onClick: (event: React.MouseEvent<HTMLElement>) => { if (disabled) { event.preventDefault(); return; } onClick?.(event); }, children: content,
  };
  let element: React.ReactElement<Record<string, unknown>>;
  if (typeof render === 'function') element = render(common as React.HTMLAttributes<HTMLElement>) as React.ReactElement<Record<string, unknown>>;
  else if (render) element = React.cloneElement(render as React.ReactElement<any>, { ...common, onClick: (event: React.MouseEvent<HTMLElement>) => {
    common.onClick(event);
    if (!event.defaultPrevented && !disabled) (render.props.onClick as React.MouseEventHandler<HTMLElement> | undefined)?.(event);
  }});
  else if (href) element = <a {...common as React.AnchorHTMLAttributes<HTMLAnchorElement>} ref={ref as React.Ref<HTMLAnchorElement>} href={disabled ? undefined : href} />;
  else element = <button {...common as React.ButtonHTMLAttributes<HTMLButtonElement>} ref={ref as React.Ref<HTMLButtonElement>} type="button" disabled={disabled} />;
  return collapsed ? <Tooltip content={label} side="right">{element}</Tooltip> : element;
});

function Navigation({ children, className, collapsed = false, onKeyDown, onFocusCapture, ...rest }: NavRailProps) {
  const rootRef = React.useRef<HTMLElement>(null);
  const { resolve } = useRhineMotion();
  const [indicator, setIndicator] = React.useState<{ top: number; height: number } | null>(null);
  const tabStop = React.useRef<HTMLElement | null>(null);
  const items = () => Array.from(rootRef.current?.querySelectorAll<HTMLElement>('[data-rl-nav-item]') ?? []).filter((item) => item.getAttribute('aria-disabled') !== 'true');
  const update = React.useCallback(() => {
    const root = rootRef.current;
    if (!root) return;
    const selected = root.querySelector<HTMLElement>('[data-rl-nav-item][aria-current]');
    if (!selected) { setIndicator(null); return; }
    const bounds = selected.getBoundingClientRect();
    const top = bounds.top - root.getBoundingClientRect().top + root.scrollTop;
    setIndicator((old) => old?.top === top && old.height === bounds.height ? old : { top, height: bounds.height });
  }, []);
  React.useLayoutEffect(() => {
    const list = items();
    const current = list.includes(tabStop.current!) ? tabStop.current : list.find((item) => item.hasAttribute('aria-current')) ?? list[0];
    list.forEach((item) => { item.tabIndex = item === current ? 0 : -1; });
    update();
  });
  React.useEffect(() => {
    const root = rootRef.current;
    if (!root || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(update);
    observer.observe(root);
    items().forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, [children, update]);
  const handleKeys = (event: React.KeyboardEvent<HTMLElement>) => {
    onKeyDown?.(event);
    if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || !['ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) return;
    const list = items();
    const index = list.indexOf(document.activeElement as HTMLElement);
    if (index < 0) return;
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? list.length - 1 : Math.min(list.length - 1, Math.max(0, index + (event.key === 'ArrowDown' ? 1 : -1)));
    event.preventDefault();
    list[next]?.focus();
  };
  return <NavContext.Provider value={{ collapsed }}><nav {...rest} ref={rootRef} className={className} data-collapsed={collapsed || undefined} onKeyDown={handleKeys} onFocusCapture={(event) => {
    onFocusCapture?.(event);
    const target = event.target as HTMLElement;
    if (!target.matches('[data-rl-nav-item]')) return;
    tabStop.current = target;
    items().forEach((item) => { item.tabIndex = item === target ? 0 : -1; });
  }}>{indicator && <motion.div aria-hidden="true" className="rl-nav-indicator" initial={false} animate={{ y: indicator.top, height: indicator.height }} transition={resolve('layout', 'base')} />}{children}</nav></NavContext.Provider>;
}

export type NavRailProps = React.HTMLAttributes<HTMLElement> & { children: React.ReactNode; collapsed?: boolean };
export function NavRail({ children, collapsed = false, className, onKeyDown, ...rest }: NavRailProps) {
  return <Navigation {...rest} collapsed={collapsed} className={cx('rl-nav-rail', className)} onKeyDown={onKeyDown}>{children}</Navigation>;
}

export type NavGroupProps = React.HTMLAttributes<HTMLElement> & { label: React.ReactNode; children: React.ReactNode; collapsed?: boolean };
export function NavGroup({ label, children, collapsed = false, className, ...rest }: NavGroupProps) {
  return <section {...rest} className={cx('rl-nav-group', className)}><h2 className={cx('rl-nav-group__label', collapsed && 'rl-visually-hidden')}>{label}</h2>{children}</section>;
}

export type NavListProps = React.HTMLAttributes<HTMLElement> & { children: React.ReactNode; label?: string };
export function NavList({ children, label, className, ...rest }: NavListProps) {
  return <Navigation {...rest} aria-label={label ?? rest['aria-label']} className={cx('rl-nav-list', className)}>{children}</Navigation>;
}
