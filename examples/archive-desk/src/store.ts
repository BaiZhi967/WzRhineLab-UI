import * as React from 'react';

/**
 * Record store for the archive desk example. State lives in localStorage so a reload keeps the
 * user's own edits; the seed entries are hand-written samples and are labelled as such in the UI.
 */

export type RecordStatus = 'draft' | 'review' | 'archived';

export interface DeskRecord {
  id: string;
  title: string;
  discipline: string;
  owner: string;
  status: RecordStatus;
  created: string;
  updated: string;
  summary: string;
  history: { at: string; text: string }[];
  sample: boolean;
}

export const statusLabel: Record<RecordStatus, string> = { draft: '草稿', review: '审核中', archived: '已归档' };
export const statusTone = { draft: 'neutral', review: 'info', archived: 'success' } as const;

const STORAGE_KEY = 'wzrhine-example:archive-desk:records:v2';
const STORAGE_VERSION = 2;

const handwrittenSeed: DeskRecord[] = [
  {
    id: 'ARC-0001',
    title: '低温样本保存流程',
    discipline: '生物学',
    owner: '示例研究员 A',
    status: 'archived',
    created: '2026-09-02',
    updated: '2026-09-18',
    summary: '记录样本在低温条件下的保存步骤与复核结论。',
    history: [
      { at: '2026-09-02', text: '创建草稿' },
      { at: '2026-09-10', text: '提交审核' },
      { at: '2026-09-18', text: '归档' },
    ],
    sample: true,
  },
  {
    id: 'ARC-0002',
    title: '光谱仪校准记录',
    discipline: '物理学',
    owner: '示例研究员 B',
    status: 'review',
    created: '2026-09-21',
    updated: '2026-10-03',
    summary: '季度例行校准，附三组参考光源的比对说明。',
    history: [
      { at: '2026-09-21', text: '创建草稿' },
      { at: '2026-10-03', text: '提交审核' },
    ],
    sample: true,
  },
  {
    id: 'ARC-0003',
    title: '外勤采样路线规划',
    discipline: '地质学',
    owner: '示例研究员 C',
    status: 'draft',
    created: '2026-10-05',
    updated: '2026-10-05',
    summary: '',
    history: [{ at: '2026-10-05', text: '创建草稿' }],
    sample: true,
  },
];

const pad2 = (n: number) => String(n).padStart(2, '0');

/** Deterministic generated sample records (P030-08 dataset: 1,000 archives with the handwritten seeds). */
function generateArchives(count: number, startIndex: number): DeskRecord[] {
  const disciplines = ['生物学', '物理学', '地质学', '化学', '海洋学', '大气科学'];
  const owners = ['示例研究员 A', '示例研究员 B', '示例研究员 C', '示例研究员 D'];
  const subjects = ['低温保存', '光谱校准', '路线规划', '群落观测', '消融监测', '沉降分析', '底质采样', '环流示踪'];
  const statuses: RecordStatus[] = ['draft', 'review', 'archived'];
  return Array.from({ length: count }, (_unused, offset) => {
    const index = startIndex + offset;
    const created = `2025-${pad2((index % 12) + 1)}-${pad2((index % 27) + 1)}`;
    return {
      id: `ARC-${String(index).padStart(4, '0')}`,
      title: `${subjects[index % subjects.length]}记录 ${index}`,
      discipline: disciplines[index % disciplines.length]!,
      owner: owners[index % owners.length]!,
      status: statuses[index % 3]!,
      created,
      updated: `2026-${pad2((index % 12) + 1)}-${pad2((index % 27) + 1)}`,
      summary: '',
      history: [{ at: created, text: '创建草稿' }],
      sample: true,
    };
  });
}

const seed: DeskRecord[] = [...handwrittenSeed, ...generateArchives(997, 4)];

function load(): DeskRecord[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return seed;
    const parsed = JSON.parse(raw) as { version?: number; items?: unknown };
    if (parsed?.version !== STORAGE_VERSION || !Array.isArray(parsed.items)) return seed;
    return parsed.items as DeskRecord[];
  } catch {
    return seed;
  }
}

export function today(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function nextId(records: readonly DeskRecord[]): string {
  const max = records.reduce((m, r) => Math.max(m, Number(r.id.slice(4)) || 0), 0);
  return `ARC-${String(max + 1).padStart(4, '0')}`;
}

export interface NewRecord {
  title: string;
  discipline: string;
  owner: string;
  summary: string;
}

export function useRecords() {
  const [records, setRecords] = React.useState<DeskRecord[]>(load);

  React.useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: STORAGE_VERSION, items: records }));
    } catch {
      // Storage unavailable (private mode): edits stay in memory for this session.
    }
  }, [records]);

  const create = React.useCallback(
    (input: NewRecord): string => {
      const id = nextId(records);
      const at = today();
      const record: DeskRecord = { ...input, id, status: 'draft', created: at, updated: at, history: [{ at, text: '创建草稿' }], sample: false };
      setRecords((rs) => [...rs, record]);
      return id;
    },
    [records],
  );

  const advance = React.useCallback((id: string) => {
    setRecords((rs) =>
      rs.map((r) => {
        if (r.id !== id || r.status === 'archived') return r;
        const status: RecordStatus = r.status === 'draft' ? 'review' : 'archived';
        const at = today();
        return { ...r, status, updated: at, history: [...r.history, { at, text: status === 'review' ? '提交审核' : '归档' }] };
      }),
    );
  }, []);

  const remove = React.useCallback((id: string) => setRecords((rs) => rs.filter((r) => r.id !== id)), []);
  const reset = React.useCallback(() => setRecords(seed), []);

  return { records, create, advance, remove, reset };
}
