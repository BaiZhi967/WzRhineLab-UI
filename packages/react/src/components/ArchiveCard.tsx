'use client';

import * as React from 'react';
import { motion } from 'motion/react';
import { useRhineMotion } from '../motion/useRhineMotion.js';
import { cx } from '../utils/cx.js';
import { StatusBadge } from './StatusBadge.js';
import type { StatusKind } from './StatusBadge.js';

/**
 * Compact archive record for lists and grids (COMPONENTS.md "标准档案卡").
 * Only `id` and `title` are required; every other field is hidden when missing, so
 * the card never shows invented times, readings or permissions. When `href` or
 * `onOpen` is set the whole card is one link/button whose name is the title; secondary
 * metadata is attached as its description.
 *
 * Shared identity (opt-in, ADR-0007): with `motion="identity"` the record ID is a shared element;
 * an `<ArchiveIdentity id>` for the same record elsewhere (e.g. a detail header) moves from the card's
 * ID to its own place (`scene` 420ms, position only so text never stretches). Reduced motion: the
 * detail just appears. Use it only when the detail *replaces* the card (list view → detail view):
 * motion hides every non-leading member of a shared identity, so a card and its detail must not be
 * on screen together. Scope duplicate lists with motion's `<LayoutGroup id>`.
 */

export interface ArchiveCardStatus {
  tone: StatusKind;
  label: React.ReactNode;
}

export type ArchiveCardProps = {
  id: string;
  title: React.ReactNode;
  category?: React.ReactNode;
  /** Short secondary classification, e.g. a discipline. */
  subcategory?: React.ReactNode;
  status?: ArchiveCardStatus;
  /** ISO date for <time dateTime>; `updatedLabel` is the visible text (defaults to the ISO string). */
  updatedAt?: string;
  updatedLabel?: React.ReactNode;
  /** Optional thumbnail. Provide `alt` that describes it, or `alt=""` when purely decorative. */
  media?: { src: string; alt: string };
  /** Navigate to the record (renders <a>). */
  href?: string;
  /** Open the record in place (renders <button>). Ignored when `href` is set. */
  onOpen?: () => void;
  /** Selected in a list/detail layout. */
  selected?: boolean;
  /** `row` for lists, `tile` for grids. */
  layout?: 'row' | 'tile';
  /** `identity`: the record ID continues into a matching `ArchiveIdentity` (list → detail). Default `none`. */
  motion?: 'none' | 'identity';
  className?: string;
};

const identityKey = (id: string) => `rl-archive-identity:${id}`;

function IdentityLabel({ id, className, children }: { id: string; className: string; children: React.ReactNode }) {
  const motionPrefs = useRhineMotion();
  return (
    <motion.span
      className={className}
      layoutId={identityKey(id)}
      layout="position"
      data-rl-identity={id}
      transition={motionPrefs.resolve('layout', 'scene')}
    >
      {children}
    </motion.span>
  );
}

export type ArchiveIdentityProps = {
  /** Record ID; must match the `ArchiveCard` it continues from. */
  id: string;
  /** Visible text; defaults to the ID. */
  children?: React.ReactNode;
  className?: string;
};

/** Target end of an ArchiveCard shared identity, e.g. the ID line of a detail pane. */
export function ArchiveIdentity({ id, children, className }: ArchiveIdentityProps) {
  return (
    <IdentityLabel id={id} className={cx('rl-archive-identity', className)}>
      {children ?? id}
    </IdentityLabel>
  );
}

export const ArchiveCard = React.forwardRef<HTMLElement, ArchiveCardProps>(function ArchiveCard(
  { id, title, category, subcategory, status, updatedAt, updatedLabel, media, href, onOpen, selected, layout = 'row', motion: motionMode = 'none', className },
  ref,
) {
  const reactId = React.useId();
  const titleId = `${reactId}-title`;
  const metaId = `${reactId}-meta`;
  const hasClassification = category != null || subcategory != null;
  const interactive = href != null || onOpen != null;

  const body = (
    <>
      {media && (
        <span className="rl-archive-card__media">
          <img src={media.src} alt={media.alt} loading="lazy" decoding="async" />
        </span>
      )}
      <span className="rl-archive-card__body">
        {motionMode === 'identity' ? (
          <IdentityLabel id={id} className="rl-archive-card__id">
            {id}
          </IdentityLabel>
        ) : (
          <span className="rl-archive-card__id">{id}</span>
        )}
        <span className="rl-archive-card__title" id={titleId}>
          {title}
        </span>
        {hasClassification && (
          <span className="rl-archive-card__class">
            {category != null && <span>{category}</span>}
            {subcategory != null && <span>{subcategory}</span>}
          </span>
        )}
      </span>
      {(updatedAt || status) && (
        <span className="rl-archive-card__aside" id={metaId}>
          {updatedAt && (
            <time className="rl-archive-card__date" dateTime={updatedAt}>
              {updatedLabel ?? updatedAt}
            </time>
          )}
          {status && (
            <StatusBadge status={status.tone} size="sm" appearance="outline">
              {status.label}
            </StatusBadge>
          )}
        </span>
      )}
    </>
  );

  const common = {
    className: cx('rl-archive-card', className),
    'data-slot': 'archive-card',
    'data-layout': layout,
    'data-selected': selected || undefined,
    'data-interactive': interactive || undefined,
  } as const;

  const describedBy = updatedAt || status ? metaId : undefined;

  if (href != null) {
    return (
      <a
        {...common}
        ref={ref as React.Ref<HTMLAnchorElement>}
        href={href}
        aria-labelledby={titleId}
        aria-describedby={describedBy}
        aria-current={selected ? 'true' : undefined}
      >
        {body}
      </a>
    );
  }
  if (onOpen != null) {
    return (
      <button
        {...common}
        ref={ref as React.Ref<HTMLButtonElement>}
        type="button"
        onClick={onOpen}
        aria-labelledby={titleId}
        aria-describedby={describedBy}
        aria-pressed={selected ?? undefined}
      >
        {body}
      </button>
    );
  }
  return (
    <article {...common} ref={ref as React.Ref<HTMLElement>} aria-labelledby={titleId}>
      {body}
    </article>
  );
});
