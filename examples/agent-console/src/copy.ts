/** App chrome copy (the components bring their own tables: agentZhCN / agentEnUS). */
export type Locale = 'zh' | 'en';

export interface AppCopy {
  title: string;
  intro: string;
  settings: string;
  dark: string;
  english: string;
  primary: string;
  secondary: string;
  secondaryHint: string;
  showSecondary: string;
  instance: { primary: string; secondary: string };
  mainLabel: (instance: string) => string;
  indexLabel: (instance: string) => string;
  paneLabel: (instance: string) => string;
  composerLabel: (instance: string) => string;
  placeholder: string;
  blockedByApproval: string;
  logTitle: (instance: string) => string;
  logHint: string;
  tabs: { context: string; terminal: string; agents: string };
  agentRole: string;
  subagentsTitle: string;
}

export const copy: Record<Locale, AppCopy> = {
  zh: {
    title: 'Agent 控制台（示例）',
    intro: '通过消费者 adapter 接入 @wzrhine/agent：模拟运行时发出带重复、乱序和旧修订重放的事件，adapter 去重后交给组件。全部数据均为示例，不是真实监测指标。',
    settings: '显示设置',
    dark: '深色主题',
    english: 'English',
    primary: '主实例',
    secondary: '第二实例（多实例隔离）',
    secondaryHint: '独立的 adapter、运行时与输入状态；与主实例不共享 id 或状态。',
    showSecondary: '显示第二实例',
    instance: { primary: '主实例', secondary: '第二实例' },
    mainLabel: (i) => `对话（${i}，示例）`,
    indexLabel: (i) => `会话（${i}）`,
    paneLabel: (i) => `详情（${i}）`,
    composerLabel: (i) => `向 Agent 发送消息（${i}）`,
    placeholder: '描述任务，输入 @ 引用文件（示例）',
    blockedByApproval: '请先在上方处理审批（示例）',
    logTitle: (i) => `适配器日志（${i}）`,
    logHint: '运行时事件、去重决定与动作 actionId（示例）。',
    tabs: { context: '上下文', terminal: '终端', agents: '子任务' },
    agentRole: '示例 Agent',
    subagentsTitle: '子任务（示例）',
  },
  en: {
    title: 'Agent console (sample)',
    intro: 'Wires @wzrhine/agent through a consumer adapter: a mock runtime emits duplicate, out-of-order and stale-revision events, and the adapter dedupes them before the components see them. All data is sample data, not real measurements.',
    settings: 'Display settings',
    dark: 'Dark theme',
    english: 'English',
    primary: 'Primary instance',
    secondary: 'Second instance (isolation)',
    secondaryHint: 'Its own adapter, runtime and input state; it shares no ids or state with the primary instance.',
    showSecondary: 'Show second instance',
    instance: { primary: 'primary', secondary: 'second' },
    mainLabel: (i) => `Conversation (${i}, sample)`,
    indexLabel: (i) => `Conversations (${i})`,
    paneLabel: (i) => `Details (${i})`,
    composerLabel: (i) => `Message the agent (${i})`,
    placeholder: 'Describe a task, type @ to reference a file (sample)',
    blockedByApproval: 'Handle the approval above first (sample)',
    logTitle: (i) => `Adapter log (${i})`,
    logHint: 'Runtime events, dedupe decisions and action ids (sample; log lines stay in Chinese).',
    tabs: { context: 'Context', terminal: 'Terminal', agents: 'Sub-tasks' },
    agentRole: 'Sample agent',
    subagentsTitle: 'Sub-tasks (sample)',
  },
};
