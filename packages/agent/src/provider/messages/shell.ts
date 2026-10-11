import type { ConversationView } from '@wzrhine/agent-core';

type Attention = NonNullable<ConversationView['attention']>;

/**
 * Copy for the shell family (ADR-0011 §10): AgentShell, ResizeHandle, AgentHeader,
 * ConversationList, ConversationRow, AgentSidePane and the workspace empty state.
 * Functions receive already formatted numbers and names.
 */
export interface AgentShellMessages {
  /** Index column / index sheet title. */
  indexLabel: string;
  /** Reading column (`<section aria-label>`). */
  mainLabel: string;
  /** Context sheet title on narrow layouts. */
  contextLabel: string;
  /** Resize handle between the reading column and the context pane. */
  resizeContext: string;
  /** `aria-valuetext` of a resize handle; receives the formatted width. */
  resizeValue: (size: string) => string;

  back: string;
  openIndex: string;
  /** Origin button of a forked / sub-agent conversation. */
  originFork: (parentTitle: string) => string;
  originSubagent: (parentTitle: string) => string;
  originUnknownParent: string;
  subagentBadge: string;
  untitled: string;
  rename: string;
  /** Context toggle (stable name; the state is `aria-pressed`). */
  contextToggle: string;
  /** Screen-reader prefix of the agent identity. */
  agentIdentity: (name: string, role?: string) => string;
  attention: Record<Attention, string>;

  listLabel: string;
  searchLabel: string;
  searchPlaceholder: string;
  searchResults: (count: string) => string;
  loading: string;
  error: string;
  retry: string;
  emptyTitle: string;
  emptyDescription: string;
  searchEmptyTitle: (query: string) => string;
  searchEmptyDescription: string;

  /** Joins the parts of a row's accessible name (title, pinned, status, unread). */
  separator: string;
  pinned: string;
  unread: (count: string) => string;
  /** Name of the row "more" menu button. */
  more: (title: string) => string;
  pin: string;
  unpin: string;
  archive: string;
  confirmArchive: string;
  unarchive: string;
  delete: string;
  deleteTitle: string;
  deleteDescription: (title: string) => string;
  deleteConfirm: string;
  deleteError: string;

  paneLabel: string;
  paneTabs: string;
  paneClose: string;

  workspaceEmptyTitle: string;
  workspaceEmptyDescription: string;
  create: string;
}

export const zhShell: AgentShellMessages = {
  indexLabel: '会话索引',
  mainLabel: '对话',
  contextLabel: '上下文详情',
  resizeContext: '调整详情面板宽度',
  resizeValue: (size) => `宽度 ${size} 像素`,

  back: '返回上级对话',
  openIndex: '打开会话列表',
  originFork: (title) => `分支来源：${title}`,
  originSubagent: (title) => `所属对话：${title}`,
  originUnknownParent: '上级对话',
  subagentBadge: '子任务',
  untitled: '未命名对话',
  rename: '重命名对话',
  contextToggle: '详情面板',
  agentIdentity: (name, role) => (role ? `智能体：${name}，${role}` : `智能体：${name}`),
  attention: {
    approval: '待批准',
    question: '待回答',
    children: '子任务需要处理',
    error: '出错',
  },

  listLabel: '会话列表',
  searchLabel: '搜索会话',
  searchPlaceholder: '搜索标题',
  searchResults: (count) => `找到 ${count} 个会话`,
  loading: '正在读取会话…',
  error: '会话列表读取失败',
  retry: '重试',
  emptyTitle: '还没有会话',
  emptyDescription: '新建会话后会出现在这里。',
  searchEmptyTitle: (query) => `没有与「${query}」匹配的会话`,
  searchEmptyDescription: '换一个关键词，或清除搜索。',

  separator: '，',
  pinned: '已置顶',
  unread: (count) => `${count} 条未读`,
  more: (title) => `${title} 的操作`,
  pin: '置顶',
  unpin: '取消置顶',
  archive: '归档',
  confirmArchive: '确认归档',
  unarchive: '取消归档',
  delete: '删除',
  deleteTitle: '删除会话？',
  deleteDescription: (title) => `「${title}」及其全部消息将被删除，此操作无法撤销。`,
  deleteConfirm: '删除会话',
  deleteError: '删除失败，会话仍保留。请稍后重试。',

  paneLabel: '上下文详情',
  paneTabs: '详情分类',
  paneClose: '关闭详情面板',

  workspaceEmptyTitle: '未选择会话',
  workspaceEmptyDescription: '从会话列表选择一个会话，或新建一个。',
  create: '新建会话',
};

export const enShell: AgentShellMessages = {
  indexLabel: 'Conversation index',
  mainLabel: 'Conversation',
  contextLabel: 'Context details',
  resizeContext: 'Resize details pane',
  resizeValue: (size) => `Width ${size} pixels`,

  back: 'Back to parent conversation',
  openIndex: 'Open conversation list',
  originFork: (title) => `Forked from: ${title}`,
  originSubagent: (title) => `Parent conversation: ${title}`,
  originUnknownParent: 'parent conversation',
  subagentBadge: 'Sub-task',
  untitled: 'Untitled conversation',
  rename: 'Rename conversation',
  contextToggle: 'Details pane',
  agentIdentity: (name, role) => (role ? `Agent: ${name}, ${role}` : `Agent: ${name}`),
  attention: {
    approval: 'Needs approval',
    question: 'Needs an answer',
    children: 'Sub-task needs attention',
    error: 'Error',
  },

  listLabel: 'Conversations',
  searchLabel: 'Search conversations',
  searchPlaceholder: 'Search titles',
  searchResults: (count) => `${count} conversations found`,
  loading: 'Loading conversations…',
  error: 'Could not load conversations',
  retry: 'Retry',
  emptyTitle: 'No conversations yet',
  emptyDescription: 'New conversations appear here.',
  searchEmptyTitle: (query) => `No conversations match “${query}”`,
  searchEmptyDescription: 'Try another keyword or clear the search.',

  separator: ', ',
  pinned: 'Pinned',
  unread: (count) => `${count} unread`,
  more: (title) => `Actions for ${title}`,
  pin: 'Pin',
  unpin: 'Unpin',
  archive: 'Archive',
  confirmArchive: 'Confirm archive',
  unarchive: 'Unarchive',
  delete: 'Delete',
  deleteTitle: 'Delete conversation?',
  deleteDescription: (title) => `“${title}” and all of its messages will be deleted. This cannot be undone.`,
  deleteConfirm: 'Delete conversation',
  deleteError: 'Delete failed; the conversation was kept. Try again later.',

  paneLabel: 'Context details',
  paneTabs: 'Detail sections',
  paneClose: 'Close details pane',

  workspaceEmptyTitle: 'No conversation selected',
  workspaceEmptyDescription: 'Pick a conversation from the list, or start a new one.',
  create: 'New conversation',
};
