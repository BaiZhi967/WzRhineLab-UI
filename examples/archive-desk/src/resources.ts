import * as React from 'react';

/**
 * Resource data + local persistence + fault injection for the archive desk (P030-08).
 * All entries are deterministic generated SAMPLE data — labelled in the UI, never real assets.
 * Thumbnails are inline SVG data URIs so the example stays offline; every 40th resource points
 * at a missing src on purpose to exercise the per-item image degradation path.
 */

export type ResourceCategory = '图像' | '剖面' | '底图' | '记录';

export interface DeskResource {
  id: string;
  title: string;
  category: ResourceCategory;
  megapixels: string;
  collected: string;
  station: string;
  broken: boolean;
  sample: true;
}

const STORAGE_KEY = 'wzrhine-example:archive-desk:resources:v1';
const STORAGE_VERSION = 1;

const titleParts = ['潮间带', '浅层水体', '沉积物', '热液区', '湿地', '冰川', '海沟', '河口'];
const titleKinds = ['照片', '显微图像', '剖面', '航拍底图', '声呐记录', '测绘草图'];
const stations = ['ST-03', 'ST-07', 'ST-12', 'ST-21'];
const categories: ResourceCategory[] = ['图像', '剖面', '底图', '记录'];

const pad = (n: number, width = 3) => String(n).padStart(width, '0');

function buildResource(index: number): DeskResource {
  const kind = titleKinds[index % titleKinds.length]!;
  const part = titleParts[Math.floor(index / titleKinds.length) % titleParts.length]!;
  const day = (index % 27) + 1;
  return {
    id: `RES-${pad(index + 1)}`,
    title: `${part}${kind} ${pad(index + 1)}`,
    category: categories[index % categories.length]!,
    megapixels: `${(index % 9) * 2 + 6} MP`,
    collected: `2026-${pad((index % 9) + 1, 2)}-${pad(day, 2)}`,
    station: stations[index % stations.length]!,
    broken: index % 40 === 39,
    sample: true,
  };
}

export function generateResources(count = 240): DeskResource[] {
  return Array.from({ length: count }, (_unused, index) => buildResource(index));
}

/** Inline SVG placeholder: a real resolvable image src that stays offline. */
export function thumbnailSrc(resource: DeskResource): string {
  if (resource.broken) return `missing-src://${resource.id}`; // intentionally unloadable
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="240"><rect width="320" height="240" fill="#dcdcd4"/><rect x="12" y="12" width="296" height="216" fill="none" stroke="#7b8579" stroke-dasharray="6 4"/><text x="160" y="126" font-family="monospace" font-size="18" fill="#505850" text-anchor="middle">${resource.id}</text><text x="160" y="152" font-family="monospace" font-size="12" fill="#5d655b" text-anchor="middle">${resource.category} · 示例</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function load(): DeskResource[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return generateResources();
    const parsed = JSON.parse(raw) as { version?: number; items?: unknown };
    if (parsed?.version !== STORAGE_VERSION || !Array.isArray(parsed.items)) return generateResources();
    return parsed.items as DeskResource[];
  } catch {
    return generateResources();
  }
}

export function useResources() {
  const [items, setItems] = React.useState<DeskResource[]>(load);
  React.useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: STORAGE_VERSION, items }));
    } catch {
      // Storage unavailable: sample data stays in memory for this session.
    }
  }, [items]);
  const reset = React.useCallback(() => setItems(generateResources()), []);
  return { items, reset };
}

// ---------------------------------------------------------------------------
// Fault injection (P030-08): error / delay / stale response demo controls.
// ---------------------------------------------------------------------------

export type FaultMode = 'none' | 'error' | 'delay' | 'stale';

export interface Faults {
  mode: FaultMode;
  delayMs: number;
}

export const defaultFaults: Faults = { mode: 'none', delayMs: 600 };

export interface QueryHandle {
  cancel: () => void;
}

/**
 * Runs a "query" through the injected faults. `compute` snapshots the inputs at request time;
 * `stale` mode delivers that snapshot after the delay — the caller's request-token guard then
 * decides whether an outdated response may still land (P030-08 过期响应注入).
 */
export function runQuery<T>(
  faults: Faults,
  compute: () => T,
  onData: (data: T, meta: { stale: boolean }) => void,
  onError: (message: string) => void,
): QueryHandle {
  const captured = compute();
  const wait = faults.mode === 'delay' || faults.mode === 'stale' ? faults.delayMs : 60;
  const timer = window.setTimeout(() => {
    if (faults.mode === 'error') {
      onError('注入的读取失败（演示错误恢复）。');
      return;
    }
    onData(faults.mode === 'stale' ? captured : compute(), { stale: faults.mode === 'stale' });
  }, wait);
  return { cancel: () => window.clearTimeout(timer) };
}
