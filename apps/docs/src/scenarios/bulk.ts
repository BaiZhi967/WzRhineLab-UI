/**
 * Deterministic 1000-row fixture for the M8 pagination scenario (ADR-0005 §6 consequences).
 * Generated from a fixed seed so E2E and visual baselines are stable; every row is plainly a
 * sample (titles say 样本记录 and IDs are sequential). No measurements or live values.
 */

export interface BulkRecord {
  id: string;
  title: string;
  category: '样本' | '实验记录' | '外勤报告' | '文档';
  status: 'draft' | 'review' | 'archived' | 'flagged';
  updated: string;
}

/** Mulberry32: small, fast, deterministic. */
function seeded(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const categories: BulkRecord['category'][] = ['样本', '实验记录', '外勤报告', '文档'];
const statuses: BulkRecord['status'][] = ['draft', 'review', 'archived', 'archived', 'flagged'];
const subjects = ['晶体结构', '海洋沉积物', '低温样本', '光谱比对', '设备巡检', '培养基', '野外采样', '归档迁移'];

export const bulkRecords: readonly BulkRecord[] = (() => {
  const rand = seeded(20261010);
  const start = Date.UTC(2026, 0, 1);
  return Array.from({ length: 1000 }, (_, i) => {
    const day = Math.floor(rand() * 280);
    const d = new Date(start + day * 86_400_000);
    return {
      id: `ARC-${String(i + 1).padStart(4, '0')}`,
      title: `${subjects[Math.floor(rand() * subjects.length)]} · 样本记录 ${i + 1}`,
      category: categories[Math.floor(rand() * categories.length)]!,
      status: statuses[Math.floor(rand() * statuses.length)]!,
      updated: d.toISOString().slice(0, 10),
    };
  });
})();
