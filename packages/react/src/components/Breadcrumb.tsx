import * as React from 'react';
import { cx } from '../utils/cx.js';

/**
 * Location path (ADR-0005 §4): `<nav>` + ordered list; the last item without `href` is the
 * current page. Separators are CSS-generated, so assistive tech reads only the items.
 * Long paths collapse their middle items behind a button that expands in place.
 *
 *   <Breadcrumb items={[{ label: '档案库', href: '#/' }, { label: '样本', href: '#/samples' }, { label: 'ARC-1024' }]} />
 */

export interface BreadcrumbItem {
  label: React.ReactNode;
  /** Omit for the current page; items with `href` render as links. */
  href?: string;
}

export interface BreadcrumbLinkProps {
  href: string;
  className: string;
  title?: string;
  children: React.ReactNode;
}

export type BreadcrumbProps = Omit<React.HTMLAttributes<HTMLElement>, 'children'> & {
  items: readonly BreadcrumbItem[];
  /** Accessible name of the navigation landmark. */
  label?: string;
  /**
   * Collapse when the path has more than this many items: the first item and the last two stay,
   * the rest hide behind an expand button. `0` never collapses.
   */
  maxItems?: number;
  /** Accessible name of the expand button; receives the total number of levels. */
  expandLabel?: (count: number) => string;
  /** Render links with a router component instead of `<a>`. */
  renderLink?: (props: BreadcrumbLinkProps) => React.ReactNode;
};

const textOf = (node: React.ReactNode): string | undefined =>
  typeof node === 'string' || typeof node === 'number' ? String(node) : undefined;

export const Breadcrumb = React.forwardRef<HTMLElement, BreadcrumbProps>(function Breadcrumb(
  {
    items,
    label = '路径',
    maxItems = 4,
    expandLabel = (count) => `显示全部 ${count} 级路径`,
    renderLink,
    className,
    ...rest
  },
  ref,
) {
  const [expanded, setExpanded] = React.useState(false);
  const listRef = React.useRef<HTMLOListElement>(null);
  const collapsible = maxItems > 0 && items.length > maxItems && items.length > 3;
  const collapsed = collapsible && !expanded;
  const hiddenFrom = 1;
  const hiddenTo = items.length - 2;

  const expand = () => {
    setExpanded(true);
    // The button disappears; move focus to the first revealed link so it is not lost.
    requestAnimationFrame(() => {
      listRef.current?.querySelectorAll<HTMLElement>('a, [aria-current]')[hiddenFrom]?.focus();
    });
  };

  if (items.length === 0) return null;

  return (
    <nav {...rest} ref={ref} className={cx('rl-breadcrumb', className)} aria-label={rest['aria-label'] ?? label} data-slot="breadcrumb">
      <ol ref={listRef} className="rl-breadcrumb__list">
        {items.map((item, index) => {
          if (collapsed && index >= hiddenFrom && index < hiddenTo) {
            if (index !== hiddenFrom) return null;
            return (
              <li key="collapsed" className="rl-breadcrumb__item" data-collapsed="">
                <button type="button" className="rl-breadcrumb__expand" aria-label={expandLabel(items.length)} onClick={expand}>
                  <span aria-hidden="true">…</span>
                </button>
              </li>
            );
          }
          const current = index === items.length - 1 && !item.href;
          const title = textOf(item.label);
          return (
            <li key={index} className="rl-breadcrumb__item">
              {item.href ? (
                renderLink ? (
                  renderLink({ href: item.href, className: 'rl-breadcrumb__link', title, children: item.label })
                ) : (
                  <a className="rl-breadcrumb__link" href={item.href} title={title}>
                    {item.label}
                  </a>
                )
              ) : (
                <span
                  className="rl-breadcrumb__current"
                  aria-current={current ? 'page' : undefined}
                  title={title}
                  // Focus target after expanding; never in the tab order.
                  tabIndex={collapsible ? -1 : undefined}
                >
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
});
