import type { Capability, CapabilityInput } from '../contracts/actions.js';

/**
 * Pure snapshot helpers (ADR-0011 §9). They belong to the adapter side of the boundary, but are
 * shipped here so every consumer dedupes, orders and guards revisions the same way.
 */

/** Normalise `true` / `false` / `{ enabled, reason }`; `undefined` means "not offered". */
export function capability(input: CapabilityInput | undefined): Capability | undefined {
  if (input === undefined) return undefined;
  return typeof input === 'boolean' ? { enabled: input } : input;
}

/**
 * Compare two revision strings. Numeric strings compare numerically; others lexically.
 * Returns <0 when `a` is older than `b`, 0 when equal, >0 when newer.
 */
export function compareRevision(a: string | undefined, b: string | undefined): number {
  if (a === b) return 0;
  if (a === undefined) return -1;
  if (b === undefined) return 1;
  const na = Number(a);
  const nb = Number(b);
  if (Number.isFinite(na) && Number.isFinite(nb) && a.trim() !== '' && b.trim() !== '') return na - nb;
  if (a.length !== b.length && /^\d+$/.test(a) && /^\d+$/.test(b)) return a.length - b.length;
  return a < b ? -1 : 1;
}

/** True when `incoming` must not replace `current` (older revision). Equal revisions are accepted. */
export function isStaleRevision(current: string | undefined, incoming: string | undefined): boolean {
  if (current === undefined || incoming === undefined) return false;
  return compareRevision(incoming, current) < 0;
}

interface Identified {
  id: string;
  sequence?: number;
  revision?: string;
}

/**
 * Merge `incoming` items into `current` by id. A replayed item with an older revision is ignored;
 * new items are appended. The result is sorted by `sequence` when every item has one, otherwise
 * insertion order is kept. Never produces duplicate ids.
 */
export function mergeById<T extends Identified>(current: readonly T[], incoming: readonly T[]): T[] {
  const map = new Map<string, T>();
  const order: string[] = [];
  for (const item of current) {
    if (!map.has(item.id)) order.push(item.id);
    map.set(item.id, item);
  }
  for (const item of incoming) {
    const existing = map.get(item.id);
    if (!existing) {
      order.push(item.id);
      map.set(item.id, item);
    } else if (!isStaleRevision(existing.revision, item.revision)) {
      map.set(item.id, item);
    }
  }
  const merged = order.map((id) => map.get(id)!);
  if (merged.every((item) => typeof item.sequence === 'number')) {
    return merged.slice().sort((a, b) => a.sequence! - b.sequence!);
  }
  return merged;
}

/** Drop later duplicates of the same id, keeping the first occurrence. */
export function dedupeById<T extends { id: string }>(items: readonly T[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const item of items) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    out.push(item);
  }
  return out;
}

/** Find gaps in a sequence-ordered list (e.g. to request missing events). */
export function sequenceGaps(items: readonly { sequence?: number }[]): Array<{ from: number; to: number }> {
  const seqs = items
    .map((item) => item.sequence)
    .filter((s): s is number => typeof s === 'number')
    .sort((a, b) => a - b);
  const gaps: Array<{ from: number; to: number }> = [];
  for (let i = 1; i < seqs.length; i += 1) {
    if (seqs[i]! - seqs[i - 1]! > 1) gaps.push({ from: seqs[i - 1]! + 1, to: seqs[i]! - 1 });
  }
  return gaps;
}

/** Build a parent → children tree from flat items with `parentId` (Code Mode trees). Orphans go to the root. */
export function buildTree<T extends { id: string; parentId?: string }>(items: readonly T[]): Array<T & { children: T[] }> {
  type Node = T & { children: T[] };
  const nodes = new Map<string, Node>();
  for (const item of dedupeById(items)) nodes.set(item.id, { ...item, children: [] });
  const roots: Node[] = [];
  for (const node of nodes.values()) {
    const parent = node.parentId ? nodes.get(node.parentId) : undefined;
    if (parent && parent !== node) parent.children.push(node);
    else roots.push(node);
  }
  return roots;
}
