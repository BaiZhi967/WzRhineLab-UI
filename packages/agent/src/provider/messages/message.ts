import type {
  ArtifactView,
  AttachmentView,
  CitationView,
  Completeness,
  MessageRole,
  MessageStatus,
  ProcessCallView,
  RecoveryView,
  ReferenceView,
  SkillUseView,
  ThinkingView,
} from '@wzrhine/agent-core';

/**
 * Copy for the message family (ADR-0011 §10): MessageList, JumpToLatest, AgentMessage,
 * MessagePart, CodeBlock, ThinkingBlock, AgentProcess, RunStatus, CitationChip, MessageActions.
 * Run / phase / tool status labels come from the shared `status` table.
 */
export interface AgentMessageMessages {
  // ---------- MessageList ----------
  listLabel: string;
  loadEarlier: string;
  loadingEarlier: string;
  earlierFailed: string;
  retryEarlier: string;
  loading: string;
  empty: string;
  emptyDescription: string;

  // ---------- JumpToLatest ----------
  jumpToLatest: string;
  /** Unread counter next to the jump label. */
  newMessages: (count: number) => string;
  /** Accessible name joining the label and the counter. */
  jumpWithCount: (label: string, count: string) => string;

  // ---------- AgentMessage ----------
  /** Default author per role when the view-model has none. */
  author: Record<MessageRole, string>;
  /** Visible message state; empty string = nothing shown. Failed user messages use `sendFailed`. */
  messageStatus: Record<MessageStatus, string>;
  sendFailed: string;
  edited: string;
  inherited: string;
  retry: string;
  /** Screen-reader announcement once a streamed answer settles. */
  completedAnnouncement: string;

  // ---------- usage footer ----------
  usageLabel: string;
  usageInput: string;
  usageOutput: string;
  usageTotal: string;
  usageCacheRead: string;
  usageCacheWrite: string;
  /** Completeness marker after the numbers; empty for `exact`. */
  usageCompleteness: Record<Completeness, string>;

  // ---------- MessageActions ----------
  actionsLabel: string;
  copy: string;
  copied: string;
  copyFailed: string;
  regenerate: string;
  edit: string;
  fork: string;
  feedbackUp: string;
  feedbackDown: string;
  /** Restores this turn's input into the composer (distinct from `edit`). */
  restoreInput: string;
  /** Tooltip of a disabled action: its name plus the reason. */
  actionUnavailable: (label: string, reason: string) => string;

  // ---------- RunDetails ----------
  /** Disclosure trigger and the list's accessible name. */
  runDetails: string;
  detailsPermission: string;
  detailsProvider: string;
  detailsModel: string;
  detailsModelId: string;
  detailsEffort: string;
  detailsStartedAt: string;
  detailsElapsed: string;
  /** Elapsed time of a cut run: the real value is at least `duration`. */
  detailsElapsedAtLeast: (duration: string) => string;
  /** Elapsed time explicitly not recorded (`elapsedKind: 'unknown'`). */
  detailsNotRecorded: string;
  detailsLastActivity: string;
  detailsChatUsage: string;
  detailsCache: string;
  detailsCacheRead: string;
  detailsCacheWrite: string;
  detailsToolModelUsage: string;
  /** Tool-model calls whose provider returned no usage. */
  detailsUnreportedCalls: (count: number) => string;
  detailsCompaction: string;
  detailsTokens: (value: string) => string;
  detailsErrorCode: string;
  detailsNotes: string;
  /** Completeness tag in the details list (shown for every value, including `exact`). */
  detailsCompleteness: Record<Completeness, string>;

  // ---------- SkillUseList ----------
  skillsLabel: string;
  skillMethod: Record<SkillUseView['method'], string>;
  /** Screen-reader prefix of the shortened digest. */
  skillDigest: string;

  // ---------- parts ----------
  copyCode: string;
  codeLabel: string;
  /** Attachment status; `ready` is not shown. */
  attachmentStatus: Record<AttachmentView['status'], string>;
  attachmentUploading: (percent: number) => string;
  referenceKind: Record<ReferenceView['kind'], string>;
  referenceStatus: Record<NonNullable<ReferenceView['status']>, string>;
  external: string;
  unsupportedTitle: string;
  unsupportedType: (type: string) => string;
  artifactStatus: Record<ArtifactView['status'], string>;
  recoveryPreserved: (items: string) => string;
  recoveryCode: (code: string) => string;
  recoveryKind: Record<RecoveryView['kind'], string>;

  // ---------- CitationChip ----------
  citationName: (index: number, title: string) => string;
  citationUnavailable: string;
  sourceType: Record<CitationView['sourceType'], string>;

  // ---------- ThinkingBlock ----------
  thinking: string;
  thinkingStatus: Record<ThinkingView['status'], string>;
  thinkingEmpty: string;
  thinkingTruncated: string;
  openFull: string;

  // ---------- AgentProcess ----------
  processLabel: string;
  processSummary: (calls: number, operations: number) => string;
  processTruncatedSummary: (calls: number, operations: number) => string;
  processCall: (ordinal: number) => string;
  callStatus: Record<ProcessCallView['status'], string>;
  stageTruncated: string;
  pendingRecord: string;
  loadRecord: string;
  processTruncated: string;
  toolChildren: (count: number) => string;
}

export const zhMessage: AgentMessageMessages = {
  listLabel: '对话消息',
  loadEarlier: '加载更早消息',
  loadingEarlier: '正在加载更早消息',
  earlierFailed: '更早消息加载失败',
  retryEarlier: '重新加载更早消息',
  loading: '正在加载消息',
  empty: '还没有消息',
  emptyDescription: '发送第一条消息后，对话会显示在这里。',

  jumpToLatest: '返回最新消息',
  newMessages: (n) => `${n} 条新消息`,
  jumpWithCount: (label, count) => `${label}，${count}`,

  author: { user: '你', assistant: '助手', system: '系统', tool: '工具' },
  messageStatus: {
    pending: '发送中',
    streaming: '生成中',
    complete: '',
    partial: '部分输出',
    failed: '生成失败',
    cancelled: '已停止',
    interrupted: '已中断',
  },
  sendFailed: '发送失败',
  edited: '已编辑',
  inherited: '继承的历史',
  retry: '重试',
  completedAnnouncement: '回答已完成',

  usageLabel: '用量',
  usageInput: '输入',
  usageOutput: '输出',
  usageTotal: '合计',
  usageCacheRead: '缓存读取',
  usageCacheWrite: '缓存写入',
  usageCompleteness: { exact: '', estimated: '估计', partial: '部分统计', unknown: '统计未知' },

  actionsLabel: '消息操作',
  copy: '复制消息',
  copied: '已复制',
  copyFailed: '复制失败',
  regenerate: '重新生成',
  edit: '编辑消息',
  fork: '从此处分叉',
  feedbackUp: '有帮助',
  feedbackDown: '没有帮助',
  restoreInput: '重新编辑本轮输入',
  actionUnavailable: (label, reason) => `${label} · ${reason}`,

  runDetails: '运行详情',
  detailsPermission: '权限',
  detailsProvider: '提供商',
  detailsModel: '模型',
  detailsModelId: '模型 ID',
  detailsEffort: '推理强度',
  detailsStartedAt: '开始时间',
  detailsElapsed: '耗时',
  detailsElapsedAtLeast: (d) => `至少 ${d}`,
  detailsNotRecorded: '未记录',
  detailsLastActivity: '最近活动',
  detailsChatUsage: '聊天用量',
  detailsCache: '缓存',
  detailsCacheRead: '读取',
  detailsCacheWrite: '写入',
  detailsToolModelUsage: '工具内模型用量',
  detailsUnreportedCalls: (n) => `${n} 次调用未返回用量`,
  detailsCompaction: '上下文压缩',
  detailsTokens: (v) => `${v} tokens`,
  detailsErrorCode: '错误码',
  detailsNotes: '备注',
  detailsCompleteness: { exact: '完整统计', estimated: '估计', partial: '部分统计', unknown: '统计未知' },

  skillsLabel: '已加载技能',
  skillMethod: { selected: '手动选择', 'model-loaded': '模型加载' },
  skillDigest: '摘要',

  copyCode: '复制代码',
  codeLabel: '代码',
  attachmentStatus: { ready: '', uploading: '上传中', failed: '上传失败', stale: '已过期', disabled: '不可用' },
  attachmentUploading: (p) => `上传中 ${p}%`,
  referenceKind: { file: '文件', folder: '文件夹', skill: '技能', command: '命令', url: '链接', symbol: '符号', custom: '引用' },
  referenceStatus: { ready: '', loading: '载入中', stale: '已过期', failed: '不可用' },
  external: '工作区外',
  unsupportedTitle: '无法显示此内容',
  unsupportedType: (type) => `内容类型：${type}`,
  artifactStatus: { generating: '生成中', partial: '部分完成', saved: '已保存', failed: '失败', unavailable: '不可用', stale: '已过期' },
  recoveryPreserved: (items) => `已保留：${items}`,
  recoveryCode: (code) => `错误码 ${code}`,
  recoveryKind: {
    retryable: '可重试',
    'save-pending': '保存待完成',
    'cancel-unconfirmed': '停止未确认',
    'tool-side-effects': '可能已产生副作用',
    timeout: '已超时',
    offline: '已离线',
    unknown: '结果未知',
    resolved: '已恢复',
  },

  citationName: (i, title) => `引用 ${i}：${title}`,
  citationUnavailable: '来源不可用',
  sourceType: { file: '文件', web: '网页', code: '代码', dataset: '数据集', message: '消息', other: '其他来源' },

  thinking: '思考',
  thinkingStatus: { streaming: '进行中', completed: '已结束', interrupted: '已中断' },
  thinkingEmpty: '没有可公开的思考摘要。',
  thinkingTruncated: '此段思考展示已截取。',
  openFull: '查看完整记录',

  processLabel: '运行过程',
  processSummary: (c, o) => `${c} 次模型调用 · ${o} 个操作`,
  processTruncatedSummary: (c, o) => `已展示 ${c} 次模型调用 · ${o} 个操作`,
  processCall: (n) => `模型调用 ${n}`,
  callStatus: { running: '进行中', completed: '已完成', interrupted: '已中断', failed: '失败' },
  stageTruncated: '已截取',
  pendingRecord: '记录稍后到达',
  loadRecord: '载入记录',
  processTruncated: '部分过程内容达到展示上限，已截取；工具记录与最终回答另行保留。',
  toolChildren: (n) => `${n} 个子操作`,
};

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

export const enMessage: AgentMessageMessages = {
  listLabel: 'Conversation messages',
  loadEarlier: 'Load earlier messages',
  loadingEarlier: 'Loading earlier messages',
  earlierFailed: 'Could not load earlier messages',
  retryEarlier: 'Retry loading earlier messages',
  loading: 'Loading messages',
  empty: 'No messages yet',
  emptyDescription: 'Send the first message to start the conversation.',

  jumpToLatest: 'Jump to latest',
  newMessages: (n) => plural(n, 'new message', 'new messages'),
  jumpWithCount: (label, count) => `${label}, ${count}`,

  author: { user: 'You', assistant: 'Assistant', system: 'System', tool: 'Tool' },
  messageStatus: {
    pending: 'Sending',
    streaming: 'Generating',
    complete: '',
    partial: 'Partial output',
    failed: 'Generation failed',
    cancelled: 'Stopped',
    interrupted: 'Interrupted',
  },
  sendFailed: 'Failed to send',
  edited: 'Edited',
  inherited: 'Inherited history',
  retry: 'Retry',
  completedAnnouncement: 'Answer complete',

  usageLabel: 'Usage',
  usageInput: 'In',
  usageOutput: 'Out',
  usageTotal: 'Total',
  usageCacheRead: 'Cache read',
  usageCacheWrite: 'Cache write',
  usageCompleteness: { exact: '', estimated: 'Estimated', partial: 'Partial', unknown: 'Unknown' },

  actionsLabel: 'Message actions',
  copy: 'Copy message',
  copied: 'Copied',
  copyFailed: 'Copy failed',
  regenerate: 'Regenerate',
  edit: 'Edit message',
  fork: 'Fork from here',
  feedbackUp: 'Helpful',
  feedbackDown: 'Not helpful',
  restoreInput: "Re-edit this turn's input",
  actionUnavailable: (label, reason) => `${label} · ${reason}`,

  runDetails: 'Run details',
  detailsPermission: 'Permission',
  detailsProvider: 'Provider',
  detailsModel: 'Model',
  detailsModelId: 'Model ID',
  detailsEffort: 'Effort',
  detailsStartedAt: 'Started',
  detailsElapsed: 'Elapsed',
  detailsElapsedAtLeast: (d) => `At least ${d}`,
  detailsNotRecorded: 'Not recorded',
  detailsLastActivity: 'Last activity',
  detailsChatUsage: 'Chat usage',
  detailsCache: 'Cache',
  detailsCacheRead: 'Read',
  detailsCacheWrite: 'Write',
  detailsToolModelUsage: 'Tool model usage',
  detailsUnreportedCalls: (n) => `${plural(n, 'call', 'calls')} returned no usage`,
  detailsCompaction: 'Context compaction',
  detailsTokens: (v) => `${v} tokens`,
  detailsErrorCode: 'Error code',
  detailsNotes: 'Notes',
  detailsCompleteness: { exact: 'Complete', estimated: 'Estimated', partial: 'Partial', unknown: 'Unknown' },

  skillsLabel: 'Skills loaded',
  skillMethod: { selected: 'Selected', 'model-loaded': 'Loaded by model' },
  skillDigest: 'Digest',

  copyCode: 'Copy code',
  codeLabel: 'Code',
  attachmentStatus: { ready: '', uploading: 'Uploading', failed: 'Upload failed', stale: 'Out of date', disabled: 'Unavailable' },
  attachmentUploading: (p) => `Uploading ${p}%`,
  referenceKind: { file: 'File', folder: 'Folder', skill: 'Skill', command: 'Command', url: 'Link', symbol: 'Symbol', custom: 'Reference' },
  referenceStatus: { ready: '', loading: 'Loading', stale: 'Out of date', failed: 'Unavailable' },
  external: 'Outside workspace',
  unsupportedTitle: 'This content cannot be shown',
  unsupportedType: (type) => `Content type: ${type}`,
  artifactStatus: { generating: 'Generating', partial: 'Partly done', saved: 'Saved', failed: 'Failed', unavailable: 'Unavailable', stale: 'Out of date' },
  recoveryPreserved: (items) => `Kept: ${items}`,
  recoveryCode: (code) => `Error ${code}`,
  recoveryKind: {
    retryable: 'Retryable',
    'save-pending': 'Save pending',
    'cancel-unconfirmed': 'Stop unconfirmed',
    'tool-side-effects': 'May have side effects',
    timeout: 'Timed out',
    offline: 'Offline',
    unknown: 'Result unknown',
    resolved: 'Recovered',
  },

  citationName: (i, title) => `Citation ${i}: ${title}`,
  citationUnavailable: 'Source unavailable',
  sourceType: { file: 'File', web: 'Web page', code: 'Code', dataset: 'Dataset', message: 'Message', other: 'Other source' },

  thinking: 'Thinking',
  thinkingStatus: { streaming: 'In progress', completed: 'Done', interrupted: 'Interrupted' },
  thinkingEmpty: 'No public thinking summary.',
  thinkingTruncated: 'This thinking summary is cut short.',
  openFull: 'Open full record',

  processLabel: 'Run process',
  processSummary: (c, o) => `${plural(c, 'model call', 'model calls')} · ${plural(o, 'operation', 'operations')}`,
  processTruncatedSummary: (c, o) => `Showing ${plural(c, 'model call', 'model calls')} · ${plural(o, 'operation', 'operations')}`,
  processCall: (n) => `Model call ${n}`,
  callStatus: { running: 'In progress', completed: 'Done', interrupted: 'Interrupted', failed: 'Failed' },
  stageTruncated: 'Cut short',
  pendingRecord: 'Record arrives later',
  loadRecord: 'Load record',
  processTruncated: 'Part of the process hit the display limit and was cut; tool records and the final answer are kept separately.',
  toolChildren: (n) => plural(n, 'nested operation', 'nested operations'),
};
