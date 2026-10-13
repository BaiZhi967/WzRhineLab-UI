import type { Completeness } from '../contracts/status.js';

/**
 * Locale-aware formatting used by agent components (ADR-0011 §10). Numbers go through
 * `Intl.NumberFormat`; nothing here invents precision the data does not have.
 */

/** 12400 → "12.4K", 1_500_000 → "1.5M". Below 1000 the plain number. */
export function formatCompact(value: number, locale = 'zh-CN'): string {
  if (!Number.isFinite(value)) return '—';
  const abs = Math.abs(value);
  const nf = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 });
  if (abs >= 1_000_000) return `${nf.format(value / 1_000_000)}M`;
  if (abs >= 1_000) return `${nf.format(value / 1_000)}K`;
  return new Intl.NumberFormat(locale).format(value);
}

/** Milliseconds → "850ms", "12.4s", "3m 05s", "1h 02m". */
export function formatDuration(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) return '—';
  if (ms < 1000) return `${Math.round(ms)}ms`;
  const s = ms / 1000;
  if (s < 60) return `${Number(s.toFixed(1))}s`;
  const totalSeconds = Math.floor(s);
  const h = Math.floor(totalSeconds / 3600);
  const min = Math.floor((totalSeconds % 3600) / 60);
  const sec = totalSeconds % 60;
  if (h > 0) return `${h}h ${String(min).padStart(2, '0')}m`;
  return `${min}m ${String(sec).padStart(2, '0')}s`;
}

/** Bytes → "512 B", "2.4 KB", "12.4 MB" (base 1024). */
export function formatBytes(bytes: number, locale = 'zh-CN'): string {
  if (!Number.isFinite(bytes) || bytes < 0) return '—';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  const nf = new Intl.NumberFormat(locale, { maximumFractionDigits: unit === 0 ? 0 : 1 });
  return `${nf.format(value)} ${units[unit]}`;
}

/**
 * Percentage for a usage value, or `null` when it must not be shown: unknown / partial data or a
 * missing / non-positive maximum never produce a percentage.
 */
export function usagePercent(used: number | undefined, max: number | undefined, completeness: Completeness): number | null {
  if (completeness === 'unknown' || completeness === 'partial') return null;
  if (used === undefined || max === undefined || !Number.isFinite(used) || !Number.isFinite(max) || max <= 0) return null;
  return Math.round((used / max) * 100);
}

/** Level of a usage ratio for colouring: `near` from 80%, `over` above 100%. */
export function usageLevel(used: number | undefined, max: number | undefined): 'normal' | 'near' | 'over' | 'unknown' {
  if (used === undefined || max === undefined || max <= 0) return 'unknown';
  const ratio = used / max;
  if (ratio > 1) return 'over';
  if (ratio >= 0.8) return 'near';
  return 'normal';
}

/** Count Unicode code points (questionnaire limits count characters, not UTF-16 units). */
export function codePointLength(text: string): number {
  let n = 0;
  for (const _ of text) n += 1;
  return n;
}

/** Last non-empty line of a streaming text (ThinkingBlock collapsed preview). */
export function lastLine(text: string | undefined): string {
  if (!text) return '';
  const lines = text.split('\n');
  for (let i = lines.length - 1; i >= 0; i -= 1) {
    const line = lines[i]!.trim();
    if (line) return line;
  }
  return '';
}

/** Highlight ranges of `query` inside `text` (case-insensitive), for menu matches. */
export function matchRanges(text: string, query: string): Array<[number, number]> {
  if (!query) return [];
  const lower = text.toLowerCase();
  const q = query.toLowerCase();
  const ranges: Array<[number, number]> = [];
  let from = 0;
  for (;;) {
    const index = lower.indexOf(q, from);
    if (index === -1) break;
    ranges.push([index, index + q.length]);
    from = index + q.length;
  }
  return ranges;
}

/**
 * Split a workspace path into human-readable crumbs. Relative paths are treated as rooted paths
 * instead of being discarded; when an absolute path is under `root`, the root directory is the
 * first crumb. This pure helper is also useful to non-React adapters.
 */
export function pathCrumbs(path: string | undefined, root?: string): string[] {
  if (!path) return [];
  const normalize = (value: string) => value.replace(/\\/g, '/').replace(/\/+/g, '/').replace(/\/$/, '');
  const full = normalize(path);
  const base = root ? normalize(root) : undefined;
  const under = base && (full === base || full.startsWith(`${base}/`) || (/^[a-z]:/i.test(base) && full.toLowerCase().startsWith(`${base.toLowerCase()}/`)));
  if (under && base) {
    const rootName = base.split('/').filter(Boolean).pop() ?? base;
    return [rootName, ...full.slice(base.length).split('/').filter(Boolean)];
  }
  return full.split('/').filter(Boolean);
}
