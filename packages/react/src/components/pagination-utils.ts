// Pure pagination helpers (no React): importable from React Server Components (ADR-0008 §2).

/** One slot in the page list: a page number or an ellipsis before / after the current window. */
export type PaginationItem = number | 'ellipsis-start' | 'ellipsis-end';

/**
 * Page list with first, last and `siblingCount` pages on each side of `page`. A gap of one page
 * is shown as that page, not an ellipsis, so the list length stays stable while paging.
 */
export function getPaginationItems(page: number, pageCount: number, siblingCount = 1): PaginationItem[] {
  const total = Math.max(1, Math.floor(pageCount));
  const current = clamp(page, 1, total);
  // first + last + current + 2 siblings + 2 ellipsis slots
  const slots = siblingCount * 2 + 5;
  if (total <= slots) return range(1, total);

  const left = Math.max(current - siblingCount, 1);
  const right = Math.min(current + siblingCount, total);
  const showStart = left > 3;
  const showEnd = right < total - 2;

  if (!showStart) return [...range(1, slots - 2), 'ellipsis-end', total];
  if (!showEnd) return [1, 'ellipsis-start', ...range(total - (slots - 3), total)];
  return [1, 'ellipsis-start', ...range(left, right), 'ellipsis-end', total];
}

function range(from: number, to: number): number[] {
  return Array.from({ length: to - from + 1 }, (_, i) => from + i);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(Math.round(value), min), max);
}

/** Rows of one page for client-side pagination. `page` starts at 1. */
export function paginate<Row>(rows: readonly Row[], page: number, pageSize: number): Row[] {
  const size = Math.max(1, Math.floor(pageSize));
  const pageCount = Math.max(1, Math.ceil(rows.length / size));
  const current = clamp(page, 1, pageCount);
  return rows.slice((current - 1) * size, current * size);
}
