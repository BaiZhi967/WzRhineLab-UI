import type { ContextUsageView, MentionOption, SubagentView } from '@wzrhine/agent';

/*
 * Static sample view-models for the parts the mock runtime does not stream (示例). They are not
 * real monitoring values: every label says 示例 and usage is marked `estimated` / `partial`.
 */

export const sampleFiles: MentionOption[] = [
  { id: 'f-config', label: 'config.py', kind: 'file', detail: 'src/config.py', group: '文件（示例）' },
  { id: 'f-check', label: 'check.py', kind: 'file', detail: 'src/check.py', group: '文件（示例）' },
  { id: 'f-manifest', label: 'manifest.csv', kind: 'file', detail: 'data/manifest.csv', group: '文件（示例）' },
  { id: 'f-readme', label: 'README.md', kind: 'file', detail: 'README.md', group: '文件（示例）' },
];

export const sampleContextUsage: ContextUsageView = {
  used: 8_600,
  max: 32_000,
  unit: 'tokens',
  completeness: 'estimated',
  label: '上下文（示例）',
  segments: [
    { id: 'messages', label: '消息（示例）', value: 4_900, tone: 'info' },
    { id: 'tools', label: '工具结果（示例）', value: 2_700, tone: 'accent' },
    { id: 'other', label: '其他（示例）', value: 1_000, tone: 'neutral' },
  ],
  note: '估计值，仅用于演示（示例）',
};

export const sampleSubagents: SubagentView[] = [
  { id: 'sa-1', name: '配置核查（示例）', task: '核对配置项与默认值', parentLabel: '主任务（示例）', status: 'completed', elapsedMs: 4_200, usage: { tokens: 1_300, completeness: 'partial' } },
  { id: 'sa-2', name: '样本统计（示例）', task: '按类型汇总样本数量', parentLabel: '主任务（示例）', status: 'running', phase: 'executing-tool', elapsedMs: 9_800, usage: { tokens: 2_100, completeness: 'partial' } },
];
