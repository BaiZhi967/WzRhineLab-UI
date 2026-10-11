/**
 * Deterministic sample data (示例数据, not real measurements). Read on the server only:
 * the page slices it with `paginate()` and passes plain, serialisable rows to the client table.
 */
export interface SampleRow {
  id: string;
  label: string;
  mass: string;
  status: 'ok' | 'recheck';
}

export const record = {
  id: 'ARC-5207',
  title: '沉积岩芯分层记录',
  discipline: '地质学',
  owner: '示例研究员 F',
  created: '2026-09-18',
  updated: '2026-10-06',
  summary: '十二段岩芯样本的分层描述与称量结果，页面在服务器组件中渲染。',
};

export const samples: SampleRow[] = Array.from({ length: 12 }, (_, i) => {
  const n = i + 1;
  return {
    id: `C-${String(n).padStart(2, '0')}`,
    label: `第 ${n} 段 · 示例`,
    mass: `${(10 + ((n * 37) % 50) / 10).toFixed(2)} g`,
    status: n % 5 === 0 ? 'recheck' : 'ok',
  };
});

export const pageSize = 5;
