'use client';

import * as React from 'react';
import { Button, EmptyState, Skeleton } from '@wzrhine/react';
import { usePatternsMessages } from '../provider/PatternMessages.js';
import { cx } from '../utils/cx.js';

/**
 * Resource card grid (0.3.0-contracts §6.7): list semantics with named checkboxes and the title
 * as the open entry — open, select and more actions are separately reachable, never nested.
 * Thumbnails keep their intrinsic size (no layout shift), degrade per item on load failure and
 * recover when the caller swaps the src; a card without a thumbnail stays fully operable.
 * Selection is an explicit finite id set (ReadonlySet, same contract as DataTable). Object URLs
 * and observers are released by whoever created them — the component only tracks img errors.
 */
export interface ResourceGridThumbnail {
  src: string;
  alt: string;
  /** Reserved size to avoid layout shift; defaults to a 4:3 placeholder box. */
  width?: number;
  height?: number;
}

export interface ResourceGridItemSpec {
  thumbnail?: ResourceGridThumbnail;
  /** Status slot on the card (StatusBadge etc.). */
  badge?: React.ReactNode;
  /** Secondary line, truncated by CSS. */
  description?: React.ReactNode;
  /** Actions outside the open entry (never nested inside it). */
  moreActions?: React.ReactNode;
}

export interface ResourceGridProps<Item> {
  items: readonly Item[];
  getItemId: (item: Item) => string;
  getItemTitle: (item: Item) => React.ReactNode;
  getItemSpec?: (item: Item) => ResourceGridItemSpec;
  /** Accessible name of a card's checkbox; defaults to the title text when it is a string. */
  getItemLabel?: (item: Item) => string;
  selectedIds?: ReadonlySet<string>;
  onSelectionChange?: (ids: Set<string>) => void;
  /** Open entry; selection and opening are distinct interactions. */
  onOpen?: (id: string) => void;
  status?: 'ready' | 'loading' | 'error';
  loadingRows?: number;
  onRetry?: () => void;
  emptyText?: React.ReactNode;
  emptyAction?: React.ReactNode;
  /** Accessible name of the list. */
  label?: string;
  className?: string;
}

export function ResourceGrid<Item>({
  items,
  getItemId,
  getItemTitle,
  getItemSpec,
  getItemLabel,
  selectedIds,
  onSelectionChange,
  onOpen,
  status = 'ready',
  loadingRows = 4,
  onRetry,
  emptyText,
  emptyAction,
  label,
  className,
}: ResourceGridProps<Item>) {
  const messages = usePatternsMessages();
  const [failedSrc, setFailedSrc] = React.useState<ReadonlySet<string>>(new Set());

  const toggle = (id: string) => {
    if (!onSelectionChange) return;
    const next = new Set(selectedIds ?? []);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onSelectionChange(next);
  };

  const rows = status === 'loading' ? Array.from({ length: loadingRows }) : items;

  return (
    <>
      {/* The skeleton cards are decorative (aria-hidden); the loading fact is announced here
          instead, the same split DataTable uses. */}
      {status === 'loading' && (
        <p className="rl-resource-grid__status" role="status">
          {messages.resourceGrid.loading}
        </p>
      )}
      <ul
        className={cx('rl-resource-grid', className)}
        data-slot="resource-grid"
        aria-label={label}
        aria-busy={status === 'loading' || undefined}
        data-status={status}
      >
        {rows.map((row, index) => {
          if (status === 'loading') {
            return (
              <li key={index} className="rl-resource-grid__card" data-loading aria-hidden="true">
                <Skeleton className="rl-resource-grid__thumb-skeleton" />
                <Skeleton shape="text" width={index % 2 === 1 ? '50%' : '70%'} />
              </li>
            );
          }
          const item = row as Item;
          const id = getItemId(item);
          const spec = getItemSpec?.(item) ?? {};
          const title = getItemTitle(item);
          const name =
            getItemLabel?.(item) ?? (typeof title === 'string' ? title : undefined) ?? messages.resourceGrid.item;
          const thumbnail = spec.thumbnail;
          const failed = thumbnail != null && failedSrc.has(thumbnail.src);
          return (
            <li key={id} className="rl-resource-grid__card" data-selected={selectedIds?.has(id) || undefined}>
              <div className="rl-resource-grid__select">
                {onSelectionChange && (
                  <input
                    type="checkbox"
                    className="rl-resource-grid__checkbox"
                    checked={selectedIds?.has(id) ?? false}
                    onChange={() => toggle(id)}
                    aria-label={name}
                  />
                )}
                {spec.badge != null && <span className="rl-resource-grid__badge">{spec.badge}</span>}
              </div>
              {thumbnail != null &&
                (failed ? (
                  <span
                    className="rl-resource-grid__thumb rl-resource-grid__thumb--failed"
                    role="img"
                    aria-label={messages.resourceGrid.imageFailed}
                  >
                    <span aria-hidden="true" className="rl-resource-grid__failed-mark">
                      ✕
                    </span>
                  </span>
                ) : (
                  <span className="rl-resource-grid__thumb">
                    <img
                      src={thumbnail.src}
                      alt={thumbnail.alt}
                      width={thumbnail.width ?? 640}
                      height={thumbnail.height ?? 480}
                      loading="lazy"
                      onError={() => setFailedSrc((prev) => new Set(prev).add(thumbnail.src))}
                    />
                  </span>
                ))}
              {onOpen ? (
                <button type="button" className="rl-resource-grid__open" onClick={() => onOpen(id)}>
                  <span className="rl-resource-grid__title">{title}</span>
                </button>
              ) : (
                <span className="rl-resource-grid__title">{title}</span>
              )}
              {spec.description != null && <p className="rl-resource-grid__description">{spec.description}</p>}
              {spec.moreActions != null && <div className="rl-resource-grid__more">{spec.moreActions}</div>}
            </li>
          );
        })}
        {status === 'ready' && items.length === 0 && (
          <li className="rl-resource-grid__empty">
            <EmptyState
              size="sm"
              kind="no-results"
              icon={null}
              title={emptyText ?? messages.resourceGrid.empty}
              action={emptyAction}
            />
          </li>
        )}
        {status === 'error' && (
          <li className="rl-resource-grid__empty" data-kind="error">
            <p role="alert" className="rl-resource-grid__error">
              {messages.resourceGrid.error}
            </p>
            {onRetry && (
              <Button size="sm" variant="secondary" onClick={onRetry}>
                {messages.resourceGrid.retry}
              </Button>
            )}
          </li>
        )}
      </ul>
    </>
  );
}
