/**
 * Machine-readable index of the CSS custom properties defined in `tokens.css`.
 * Tests assert that every token listed here exists in each theme, and the
 * showcase renders foundations from this list instead of copying values.
 */

export type ThemeName = 'light' | 'dark';
export type DensityName = 'comfortable' | 'compact';

export interface TokenGroup {
  id: string;
  label: string;
  description: string;
  tokens: readonly TokenEntry[];
}

export interface TokenEntry {
  name: `--rl-${string}`;
  role: string;
}

export const colorGroups = [
  {
    id: 'background',
    label: 'Background',
    description: '页面与容器层级。用明度差表达层级，而不是阴影。',
    tokens: [
      { name: '--rl-bg-canvas', role: '页面底色' },
      { name: '--rl-bg-surface', role: '内容表面' },
      { name: '--rl-bg-subtle', role: '次级区域 / 中性徽标' },
      { name: '--rl-bg-raised', role: '浮起表面' },
      { name: '--rl-bg-hover', role: '中性悬停' },
      { name: '--rl-bg-pressed', role: '中性按压' },
      { name: '--rl-bg-inverse', role: '深墨填充' },
      { name: '--rl-bg-disabled', role: '禁用填充' },
    ],
  },
  {
    id: 'foreground',
    label: 'Foreground',
    description: '文本层级。正文默认使用 primary，不以彩色文字为默认。',
    tokens: [
      { name: '--rl-fg-primary', role: '主文本' },
      { name: '--rl-fg-muted', role: '次级文本' },
      { name: '--rl-fg-subtle', role: '元信息 / 编号' },
      { name: '--rl-fg-inverse', role: '深墨填充上的文本' },
      { name: '--rl-fg-on-accent', role: '信号橙填充上的文本' },
      { name: '--rl-fg-disabled', role: '禁用文本' },
    ],
  },
  {
    id: 'border',
    label: 'Border',
    description: 'subtle 仅作装饰分隔；可交互边界使用 strong。',
    tokens: [
      { name: '--rl-border-subtle', role: '装饰分隔线' },
      { name: '--rl-border-default', role: '容器轮廓' },
      { name: '--rl-border-strong', role: '控件边界（≥3:1）' },
    ],
  },
  {
    id: 'signal',
    label: 'Research Signal',
    description: '小面积使用的研究橙。每个视图只保留一处主要信号。',
    tokens: [
      { name: '--rl-accent', role: '信号填充' },
      { name: '--rl-accent-hover', role: '信号悬停' },
      { name: '--rl-accent-subtle', role: '选中底色' },
      { name: '--rl-accent-text', role: '浅底上的强调文字' },
      { name: '--rl-accent-amber', role: '档案辅助标记（装饰）' },
    ],
  },
  {
    id: 'status',
    label: 'Status',
    description: '业务状态色。必须与文字同时出现，不能只靠颜色。',
    tokens: [
      { name: '--rl-info', role: '信息' },
      { name: '--rl-info-subtle', role: '信息底色' },
      { name: '--rl-success', role: '完成' },
      { name: '--rl-success-subtle', role: '完成底色' },
      { name: '--rl-warning', role: '注意' },
      { name: '--rl-warning-subtle', role: '注意底色' },
      { name: '--rl-danger', role: '错误 / 高风险' },
      { name: '--rl-danger-subtle', role: '错误底色' },
    ],
  },
  {
    id: 'focus',
    label: 'Focus',
    description: '焦点色独立于品牌橙与危险色。',
    tokens: [{ name: '--rl-focus', role: '焦点环' }],
  },
] as const satisfies readonly TokenGroup[];

export const typeRoles = [
  { name: 'display', token: '--rl-type-display', spec: '36 / 44 · 600', usage: '展示标题' },
  { name: 'heading-1', token: '--rl-type-heading-1', spec: '28 / 36 · 600', usage: '页面标题' },
  { name: 'heading-2', token: '--rl-type-heading-2', spec: '22 / 30 · 600', usage: '一级内容标题' },
  { name: 'heading-3', token: '--rl-type-heading-3', spec: '18 / 26 · 600', usage: '面板标题' },
  { name: 'body', token: '--rl-type-body', spec: '16 / 24 · 400', usage: '正文、表单' },
  { name: 'body-sm', token: '--rl-type-body-sm', spec: '14 / 21 · 400', usage: '紧凑信息' },
  { name: 'label', token: '--rl-type-label', spec: '14 / 20 · 600', usage: '控件文字' },
  { name: 'meta', token: '--rl-type-meta', spec: '12 / 18 · 500', usage: '辅助标签，不用于长正文' },
  { name: 'mono', token: '--rl-type-mono', spec: '12 / 18 · 500', usage: '编号、时间、单位' },
] as const;

export const spaceScale = [
  { token: '--rl-space-0', px: 0 },
  { token: '--rl-space-1', px: 4 },
  { token: '--rl-space-2', px: 8 },
  { token: '--rl-space-3', px: 12 },
  { token: '--rl-space-4', px: 16 },
  { token: '--rl-space-6', px: 24 },
  { token: '--rl-space-8', px: 32 },
  { token: '--rl-space-12', px: 48 },
  { token: '--rl-space-16', px: 64 },
] as const;

export const radiusScale = [
  { token: '--rl-radius-none', usage: '表格、分隔区块' },
  { token: '--rl-radius-xs', usage: '徽标、标签' },
  { token: '--rl-radius-sm', usage: '按钮、默认表面' },
  { token: '--rl-radius-md', usage: '表单控件' },
  { token: '--rl-radius-lg', usage: '浮层（M2）' },
] as const;

export const borderWidths = [
  { token: '--rl-border-width', usage: '默认边框' },
  { token: '--rl-border-width-strong', usage: '强调轮廓 / 选中' },
  { token: '--rl-focus-width', usage: '焦点环宽度' },
  { token: '--rl-focus-offset', usage: '焦点环偏移' },
] as const;

export const densityTokens = [
  { token: '--rl-control-height-sm', usage: '小号控件高度' },
  { token: '--rl-control-height-md', usage: '默认控件高度' },
  { token: '--rl-control-height-lg', usage: '大号控件高度' },
  { token: '--rl-control-padding-x-sm', usage: '小号控件水平内距' },
  { token: '--rl-control-padding-x-md', usage: '默认控件水平内距' },
  { token: '--rl-control-padding-x-lg', usage: '大号控件水平内距' },
  { token: '--rl-control-gap', usage: '控件内图标与文字间距' },
  { token: '--rl-surface-padding', usage: '表面默认内距' },
  { token: '--rl-badge-height-sm', usage: '小号徽标高度（非点击目标）' },
  { token: '--rl-badge-height-md', usage: '默认徽标高度（非点击目标）' },
  { token: '--rl-indicator-size', usage: '状态圆点' },
] as const;

/** Duration tokens in milliseconds. Source of truth for CSS (`--rl-motion-*`) and motion/react presets. */
export const motionDurations = {
  instant: 0,
  press: 80,
  fast: 120,
  base: 200,
  panel: 280,
  scene: 420,
  showcase: 700,
} as const;

export type MotionDurationName = keyof typeof motionDurations;

export const motionUsage: Record<MotionDurationName, string> = {
  instant: '减动时的不必要布局位移',
  press: '按压反馈',
  fast: 'hover / focus 过渡',
  base: '标签、选中与反馈',
  panel: '普通面板 / 详情层',
  scene: '档案视图身份连续',
  showcase: '仅用户主动触发的演示场景',
};

export const motionTokens = (Object.keys(motionDurations) as MotionDurationName[]).map((name) => ({
  token: `--rl-motion-${name}` as const,
  name,
  ms: motionDurations[name],
}));

/** Cubic-bezier control points. `linear` is reserved for real progress feedback. */
export const motionEasings = {
  out: [0.16, 1, 0.3, 1],
  inOut: [0.65, 0, 0.35, 1],
} as const satisfies Record<string, readonly [number, number, number, number]>;

export const easingTokens = [
  { token: '--rl-ease-out', name: 'out', points: motionEasings.out, usage: '默认：进入、反馈' },
  { token: '--rl-ease-in-out', name: 'inOut', points: motionEasings.inOut, usage: '位置交换、往返' },
] as const;

/** Period for indeterminate loops (spinner). Disabled entirely under reduced motion. */
export const motionLoopMs = 900;

/** Tokens whose value must be redefined by the dark theme. */
export const themedTokens: readonly string[] = colorGroups.flatMap((group) =>
  group.tokens.map((token) => token.name),
);

export type ContrastLevel = 'text' | 'large-text' | 'non-text';

export interface ContrastPair {
  fg: `--rl-${string}`;
  bg: `--rl-${string}`;
  level: ContrastLevel;
  usage: string;
}

export const minimumContrast: Record<ContrastLevel, number> = {
  text: 4.5,
  'large-text': 3,
  'non-text': 3,
};

/** Pairings the components actually render. Each is verified in both themes. */
export const contrastPairs: readonly ContrastPair[] = [
  { fg: '--rl-fg-primary', bg: '--rl-bg-canvas', level: 'text', usage: '正文 / 画布' },
  { fg: '--rl-fg-primary', bg: '--rl-bg-surface', level: 'text', usage: '正文 / 表面' },
  { fg: '--rl-fg-primary', bg: '--rl-bg-subtle', level: 'text', usage: '中性徽标' },
  { fg: '--rl-fg-primary', bg: '--rl-bg-hover', level: 'text', usage: '次级按钮悬停' },
  { fg: '--rl-fg-muted', bg: '--rl-bg-canvas', level: 'text', usage: '次级文本 / 画布' },
  { fg: '--rl-fg-muted', bg: '--rl-bg-surface', level: 'text', usage: '次级文本 / 表面' },
  { fg: '--rl-fg-subtle', bg: '--rl-bg-surface', level: 'text', usage: '元信息 / 表面' },
  { fg: '--rl-fg-subtle', bg: '--rl-bg-canvas', level: 'text', usage: '元信息 / 画布' },
  { fg: '--rl-fg-inverse', bg: '--rl-bg-inverse', level: 'text', usage: 'Primary 按钮' },
  { fg: '--rl-fg-on-accent', bg: '--rl-accent', level: 'text', usage: 'Accent 按钮' },
  { fg: '--rl-fg-on-accent', bg: '--rl-accent-hover', level: 'text', usage: 'Accent 按钮悬停' },
  { fg: '--rl-accent-text', bg: '--rl-bg-canvas', level: 'text', usage: '强调文字 / 画布' },
  { fg: '--rl-accent-text', bg: '--rl-bg-surface', level: 'text', usage: '强调文字 / 表面' },
  { fg: '--rl-fg-primary', bg: '--rl-accent-subtle', level: 'text', usage: '选中项文字' },
  { fg: '--rl-info', bg: '--rl-info-subtle', level: 'text', usage: 'Info 徽标' },
  { fg: '--rl-success', bg: '--rl-success-subtle', level: 'text', usage: 'Success 徽标' },
  { fg: '--rl-warning', bg: '--rl-warning-subtle', level: 'text', usage: 'Warning 徽标' },
  { fg: '--rl-danger', bg: '--rl-danger-subtle', level: 'text', usage: 'Danger 徽标' },
  { fg: '--rl-border-strong', bg: '--rl-bg-surface', level: 'non-text', usage: '控件边界 / 表面' },
  { fg: '--rl-border-strong', bg: '--rl-bg-canvas', level: 'non-text', usage: '控件边界 / 画布' },
  { fg: '--rl-focus', bg: '--rl-bg-canvas', level: 'non-text', usage: '焦点环 / 画布' },
  { fg: '--rl-focus', bg: '--rl-bg-surface', level: 'non-text', usage: '焦点环 / 表面' },
  { fg: '--rl-accent', bg: '--rl-bg-surface', level: 'non-text', usage: '信号标记 / 表面' },
];
