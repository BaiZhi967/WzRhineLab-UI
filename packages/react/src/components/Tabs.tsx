import * as React from 'react';
import { Tabs as BaseTabs } from '@base-ui/react/tabs';
import { cx } from '../utils/cx';

/**
 * Tabs on Base UI Tabs (ADR-0001): roving focus with arrow keys, Home/End, automatic
 * tab/tabpanel wiring. The indicator slides via CSS transition on Base UI's
 * --active-tab-* variables (--rl-motion-base); it jumps under reduced motion and
 * retargets from its current position when switched mid-flight.
 */

export type TabsVariant = 'line' | 'segmented';
export type TabsSize = 'sm' | 'md';

type BaseRootProps = React.ComponentProps<typeof BaseTabs.Root>;

export type TabsProps = Omit<BaseRootProps, 'className' | 'style' | 'render' | 'value' | 'defaultValue' | 'onValueChange'> & {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  variant?: TabsVariant;
  size?: TabsSize;
  className?: string;
  style?: React.CSSProperties;
};

export const Tabs = React.forwardRef<HTMLDivElement, TabsProps>(function Tabs(
  { variant = 'line', size = 'md', onValueChange, className, style, ...rest },
  ref,
) {
  return (
    <BaseTabs.Root
      {...rest}
      ref={ref}
      onValueChange={onValueChange ? (v) => onValueChange(String(v)) : undefined}
      className={cx('rl-tabs', className)}
      style={style}
      data-slot="tabs"
      data-variant={variant}
      data-size={size}
    />
  );
});

export type TabListProps = Omit<React.ComponentProps<typeof BaseTabs.List>, 'className' | 'style' | 'render'> & {
  /** Required: names the tab set for screen readers (e.g. "记录视图"). */
  'aria-label'?: string;
  'aria-labelledby'?: string;
  className?: string;
  style?: React.CSSProperties;
};

/** Flags horizontal overflow so CSS can fade the trailing edge as a scroll affordance. */
function useOverflowState(node: HTMLElement | null) {
  const [state, setState] = React.useState({ overflowing: false, atEnd: false });
  React.useEffect(() => {
    if (!node) return;
    const update = () => {
      const overflowing = node.scrollWidth > node.clientWidth + 1;
      const atEnd = node.scrollLeft + node.clientWidth >= node.scrollWidth - 1;
      setState((prev) => (prev.overflowing === overflowing && prev.atEnd === atEnd ? prev : { overflowing, atEnd }));
    };
    update();
    node.addEventListener('scroll', update, { passive: true });
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(update);
    observer?.observe(node);
    return () => {
      node.removeEventListener('scroll', update);
      observer?.disconnect();
    };
  }, [node]);
  return state;
}

export const TabList = React.forwardRef<HTMLDivElement, TabListProps>(function TabList(
  { className, style, children, ...rest },
  ref,
) {
  const [node, setNode] = React.useState<HTMLDivElement | null>(null);
  const { overflowing, atEnd } = useOverflowState(node);
  const setRefs = React.useCallback(
    (el: HTMLDivElement | null) => {
      setNode(el);
      if (typeof ref === 'function') ref(el);
      else if (ref) ref.current = el;
    },
    [ref],
  );
  return (
    <BaseTabs.List
      {...rest}
      ref={setRefs}
      className={cx('rl-tabs__list', className)}
      style={style}
      data-overflowing={overflowing || undefined}
      data-scrolled-end={(overflowing && atEnd) || undefined}
    >
      {children}
      <BaseTabs.Indicator className="rl-tabs__indicator" />
    </BaseTabs.List>
  );
});

export type TabProps = Omit<React.ComponentProps<typeof BaseTabs.Tab>, 'className' | 'style' | 'render' | 'value'> & {
  value: string;
  /** Optional count or status after the label; read as part of the tab name. */
  meta?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
};

export const Tab = React.forwardRef<HTMLButtonElement, TabProps>(function Tab(
  { meta, className, style, children, ...rest },
  ref,
) {
  return (
    <BaseTabs.Tab {...rest} ref={ref} className={cx('rl-tabs__tab', className)} style={style}>
      <span className="rl-tabs__label">{children}</span>
      {meta != null && <span className="rl-tabs__meta">{meta}</span>}
    </BaseTabs.Tab>
  );
});

export type TabPanelProps = Omit<React.ComponentProps<typeof BaseTabs.Panel>, 'className' | 'style' | 'render' | 'value'> & {
  value: string;
  className?: string;
  style?: React.CSSProperties;
};

export const TabPanel = React.forwardRef<HTMLDivElement, TabPanelProps>(function TabPanel(
  { className, style, ...rest },
  ref,
) {
  return <BaseTabs.Panel {...rest} ref={ref} className={cx('rl-tabs__panel', className)} style={style} />;
});
