import type { PageData } from './App';

/** Deterministic sample data for the page. Server-side "loading" is just this function. */
export function loadPage(theme: PageData['theme']): PageData {
  return {
    theme,
    record: {
      id: 'ARC-3104',
      title: '矿物样本含水率测定',
      discipline: '地质学',
      owner: '示例研究员 D',
      created: '2026-09-12',
      updated: '2026-10-02',
      summary: '三批矿物样本在恒温干燥前后的质量比对，用于估算含水率。',
    },
    samples: [
      { id: 'S-01', label: '第一批 · 表层', mass: '12.40 g', status: 'ok' },
      { id: 'S-02', label: '第二批 · 中层', mass: '11.87 g', status: 'ok' },
      { id: 'S-03', label: '第三批 · 深层', mass: '13.02 g', status: 'recheck' },
    ],
    events: [
      { id: 'e1', title: '创建记录', at: '2026-09-12' },
      { id: 'e2', title: '录入样本', at: '2026-09-20' },
      { id: 'e3', title: '提交审核', at: '2026-10-02' },
    ],
  };
}
