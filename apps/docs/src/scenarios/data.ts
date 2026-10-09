/**
 * Fixture records for the M3 acceptance scenarios.
 *
 * These are hand-written sample archive entries, labelled as samples in the UI. They are
 * static and deterministic: no random values, no live "readings", no fabricated sensor
 * streams. Each scenario derives everything it shows (counts, filters, status) from this
 * data, so the screens exercise real component logic rather than decorative numbers.
 */

export type RecordCategory = 'specimen' | 'experiment' | 'field-report' | 'document';
export type RecordStatus = 'draft' | 'review' | 'archived' | 'flagged';

export interface ArchiveRecord {
  id: string;
  title: string;
  category: RecordCategory;
  discipline: string;
  status: RecordStatus;
  owner: string;
  created: string;
  updated: string;
  summary?: string;
  location?: string;
  tags: readonly string[];
}

export const categoryLabel: Record<RecordCategory, string> = {
  specimen: '样本',
  experiment: '实验记录',
  'field-report': '外勤报告',
  document: '文档',
};

export const statusLabel: Record<RecordStatus, string> = {
  draft: '草稿',
  review: '审核中',
  archived: '已归档',
  flagged: '需复核',
};

export const statusTone = {
  draft: 'neutral',
  review: 'info',
  archived: 'success',
  flagged: 'warning',
} as const satisfies Record<RecordStatus, 'neutral' | 'info' | 'success' | 'warning' | 'danger'>;

export const records: readonly ArchiveRecord[] = [
  {
    id: 'ARC-1024',
    title: '晶体结构观测流程',
    category: 'experiment',
    discipline: '材料学',
    status: 'review',
    owner: '示例研究员 A',
    created: '2026-09-21',
    updated: '2026-10-08',
    summary: '记录晶体样本在三种温度条件下的结构观测步骤与结论。',
    location: '实验楼 2F · 观测室',
    tags: ['晶体', '观测', '温控'],
  },
  {
    id: 'ARC-1031',
    title: '沉积岩样本 #7',
    category: 'specimen',
    discipline: '地质学',
    status: 'archived',
    owner: '示例研究员 B',
    created: '2026-08-02',
    updated: '2026-09-30',
    summary: '外勤采集的沉积岩样本，已完成切片与登记。',
    location: '样本库 · B 区',
    tags: ['沉积岩', '切片'],
  },
  {
    id: 'ARC-1036',
    title: '北坡采样外勤报告',
    category: 'field-report',
    discipline: '地质学',
    status: 'flagged',
    owner: '示例研究员 C',
    created: '2026-09-12',
    updated: '2026-10-09',
    summary: '采样坐标记录不完整，需补充后复核。',
    tags: ['外勤', '采样'],
  },
  {
    id: 'ARC-1042',
    title: '低温保存操作规程',
    category: 'document',
    discipline: '生物学',
    status: 'archived',
    owner: '示例研究员 A',
    created: '2026-06-15',
    updated: '2026-07-01',
    tags: ['规程', '低温'],
  },
  {
    id: 'ARC-1047',
    title: '藻类培养对照实验',
    category: 'experiment',
    discipline: '生物学',
    status: 'draft',
    owner: '示例研究员 D',
    created: '2026-10-03',
    updated: '2026-10-07',
    summary: '对照组与实验组的培养条件设计，尚未开始执行。',
    tags: ['藻类', '对照'],
  },
  {
    id: 'ARC-1050',
    title: '大气颗粒物滤膜样本',
    category: 'specimen',
    discipline: '大气科学',
    status: 'review',
    owner: '示例研究员 B',
    created: '2026-09-28',
    updated: '2026-10-06',
    location: '样本库 · C 区',
    tags: ['大气', '滤膜'],
  },
  {
    id: 'ARC-1053',
    title: '样本编号规范（第二版）',
    category: 'document',
    discipline: '档案管理',
    status: 'review',
    owner: '示例研究员 C',
    created: '2026-09-01',
    updated: '2026-10-02',
    tags: ['规范'],
  },
];

/** Experiment protocol steps for the monitoring scenario: a fixed plan, advanced by user action. */
export interface ProtocolStep {
  id: string;
  title: string;
  description: string;
}

export const protocol: readonly ProtocolStep[] = [
  { id: 's1', title: '样本登记', description: '核对样本编号与来源。' },
  { id: 's2', title: '预处理', description: '按规程清洁并干燥样本。' },
  { id: 's3', title: '第一轮观测', description: '在室温条件下记录结构。' },
  { id: 's4', title: '温控观测', description: '在两档温度下重复观测。' },
  { id: 's5', title: '结论与归档', description: '整理结论并提交复核。' },
];
