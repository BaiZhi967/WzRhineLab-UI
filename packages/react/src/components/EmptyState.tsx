'use client';

import * as React from 'react';
import { cx } from '../utils/cx.js';

/**
 * Placeholder for a region with nothing to show (ADR-0006 §6). `kind` only picks the default
 * decorative icon. The title is a heading when `headingLevel` is given, otherwise a paragraph
 * (e.g. inside a table cell). No live role: the filter result count announces empty results.
 *
 *   <EmptyState kind="no-results" title="没有符合条件的记录" headingLevel={3}
 *     description="调整筛选条件后重试。" action={<Button size="sm" variant="secondary">清除筛选</Button>} />
 */

export type EmptyStateKind = 'empty' | 'no-results' | 'no-permission' | 'first-use';
export type EmptyStateSize = 'sm' | 'md';
export type EmptyStateHeadingLevel = 2 | 3 | 4 | 5 | 6;

export type EmptyStateProps = Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> & {
  title: React.ReactNode;
  kind?: EmptyStateKind;
  description?: React.ReactNode;
  /** Next step, e.g. 「清除筛选」 or 「新建记录」. */
  action?: React.ReactNode;
  /** Replace the kind's icon; `null` removes it. Always decorative. */
  icon?: React.ReactNode;
  /** Render the title as `<h2>`–`<h6>`; omitted = `<p>`. */
  headingLevel?: EmptyStateHeadingLevel;
  /** `sm` inside tables and cards; `md` for a whole region. */
  size?: EmptyStateSize;
};

const glyphs: Record<EmptyStateKind, React.ReactNode> = {
  // Open tray.
  empty: <path d="M2.5 9.5 4.5 3.5h7l2 6M2.5 9.5v3h11v-3M2.5 9.5h3.25l.75 1.5h3l.75-1.5h3.25" />,
  // Magnifier with a dash: nothing matched.
  'no-results': <path d="M7 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10ZM10.75 10.75 14 14M5 7h4" />,
  // Padlock.
  'no-permission': <path d="M4 7.5h8v6H4zM5.5 7.5V5.5a2.5 2.5 0 0 1 5 0v2M8 10v1.5" />,
  // Sheet with a plus: create the first item.
  'first-use': <path d="M4 2.5h5.5l2.5 2.5v8.5H4zM9.5 2.5V5H12M8 7.5v4M6 9.5h4" />,
};

export const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(function EmptyState(
  { title, kind = 'empty', description, action, icon, headingLevel, size = 'md', className, ...rest },
  ref,
) {
  const Title = (headingLevel ? `h${headingLevel}` : 'p') as 'p';
  return (
    <div {...rest} ref={ref} className={cx('rl-empty', className)} data-slot="empty-state" data-kind={kind} data-size={size}>
      {icon === undefined ? (
        <svg className="rl-empty__icon rl-empty__glyph" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
          {glyphs[kind]}
        </svg>
      ) : icon === null ? null : (
        <span className="rl-empty__icon" aria-hidden="true">
          {icon}
        </span>
      )}
      <Title className="rl-empty__title">{title}</Title>
      {description != null && description !== false && <p className="rl-empty__description">{description}</p>}
      {action != null && action !== false && <div className="rl-empty__action">{action}</div>}
    </div>
  );
});
