import * as React from 'react';
import { cx } from '../utils/cx.js';
import { Breadcrumb } from './Breadcrumb.js';
import type { BreadcrumbItem } from './Breadcrumb.js';
import { MetadataList, isEmptyValue } from './MetadataList.js';
import type { MetadataItem } from './MetadataList.js';
import { StatusBadge } from './StatusBadge.js';
import type { StatusKind } from './StatusBadge.js';

/**
 * Archive record header: location trail, record ID, status, title, classification,
 * summary, key timestamps and actions. Every field except `title` is optional and is
 * omitted when absent — the header never fabricates IDs, dates or access levels.
 */

/** Same shape as a Breadcrumb item (ADR-0005 §4). */
export type RecordTrailItem = BreadcrumbItem;

export interface RecordStatus {
  tone: StatusKind;
  /** Visible text; colour never carries the status alone. */
  label: React.ReactNode;
}

export type RecordHeaderProps = Omit<React.HTMLAttributes<HTMLElement>, 'title' | 'id'> & {
  title: React.ReactNode;
  /** Record identifier, e.g. "ARC-1024". Rendered in mono above the title. */
  recordId?: string;
  status?: RecordStatus;
  /** Ancestors of this record. Rendered as a breadcrumb <nav>; the last item is the current page. */
  trail?: readonly RecordTrailItem[];
  /** Classification terms, e.g. ["样本", "海洋来源"]. Joined with a hairline separator. */
  classification?: readonly React.ReactNode[];
  summary?: React.ReactNode;
  /** Key facts beside the title (created / updated / owner). Empty values are hidden. */
  meta?: readonly MetadataItem[];
  actions?: React.ReactNode;
  /** Heading level of the title; keep the document outline correct. */
  headingLevel?: 1 | 2 | 3;
  /** Accessible name of the breadcrumb navigation. */
  trailLabel?: string;
};

export const RecordHeader = React.forwardRef<HTMLElement, RecordHeaderProps>(function RecordHeader(
  {
    title,
    recordId,
    status,
    trail,
    classification,
    summary,
    meta,
    actions,
    headingLevel = 1,
    trailLabel = '档案位置',
    className,
    ...rest
  },
  ref,
) {
  const Heading = `h${headingLevel}` as 'h1' | 'h2' | 'h3';
  const terms = (classification ?? []).filter((term) => !isEmptyValue(term));
  const hasMeta = (meta ?? []).some((item) => !isEmptyValue(item.value));

  return (
    <header {...rest} ref={ref} className={cx('rl-record', className)} data-slot="record-header" data-has-meta={hasMeta || undefined}>
      {trail && trail.length > 0 && (
        // maxItems={0}: record trails are short and always shown in full.
        <Breadcrumb className="rl-record__trail" items={trail} label={trailLabel} maxItems={0} />
      )}

      <div className="rl-record__main">
        <div className="rl-record__identity">
          {(recordId || status) && (
            <p className="rl-record__id-row">
              {recordId && <span className="rl-record__id">{recordId}</span>}
              {status && (
                <StatusBadge status={status.tone} size="sm" appearance="outline">
                  {status.label}
                </StatusBadge>
              )}
            </p>
          )}
          <Heading className="rl-record__title">{title}</Heading>
          {terms.length > 0 && (
            <p className="rl-record__classification">
              {terms.map((term, index) => (
                <span key={index} className="rl-record__term">
                  {term}
                </span>
              ))}
            </p>
          )}
          {!isEmptyValue(summary as React.ReactNode) && <p className="rl-record__summary">{summary}</p>}
        </div>

        {hasMeta && <MetadataList className="rl-record__meta" items={meta!} size="sm" />}
      </div>

      {actions != null && <div className="rl-record__actions">{actions}</div>}
    </header>
  );
});
