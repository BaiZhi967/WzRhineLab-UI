import type { ArtifactKind, ArtifactView, FilePreviewMode, LedgerActor, LedgerEventView, PinnedSummaryView, TerminalView, UsageStatRow } from '@wzrhine/agent-core';

/**
 * Copy for the workspace family (ADR-0011 §10): terminals, sub-agents, context usage, pinned
 * summary, artifacts, file preview, activity ledger, run summary and the compaction notice.
 * Keys are flat (prefixed by component) so `AgentMessagesProvider` can override single entries.
 */
export type ArtifactStatusKey = ArtifactView['status'];
export type ArtifactChangeKey = NonNullable<ArtifactView['change']>;
export type LedgerOutcomeKey = NonNullable<LedgerEventView['outcome']>;
export type LedgerFilterKey = 'all' | LedgerActor;
export type CompactionStatus = 'running' | 'completed' | 'cancelled' | 'failed' | 'interrupted' | 'save-pending';
export type CompactionPhase = 'preparing' | 'compacting' | 'saving';
export type TerminalHistoryStatus = NonNullable<TerminalView['history']>[number]['status'];
export type UsageStatUnit = UsageStatRow['unit'];
export type RunPersistenceKey = 'saved' | 'saving' | 'failed' | 'unknown';
export type TerminalGroupKey = 'open' | 'ended' | 'unknown' | 'inherited';

export interface AgentWorkspaceMessages {
  // ---------- PersistentTerminal / TerminalTabs ----------
  terminalBackend: Record<'pty' | 'process', string>;
  terminalCwd: string;
  terminalOutput: (name: string) => string;
  terminalNoOutput: string;
  terminalNewOutput: string;
  terminalLoadEarlier: string;
  terminalPartialCapture: string;
  terminalInputLabel: (name: string) => string;
  terminalInputPlaceholder: string;
  terminalSend: string;
  terminalStop: (name: string) => string;
  terminalStopVisible: string;
  terminalStopPending: string;
  terminalRetryStop: string;
  terminalUnknownNotice: string;
  terminalIdleNotice: string;
  terminalReadOnly: string;
  terminalExitCode: (code: number) => string;
  terminalCalls: (count: number) => string;
  terminalTabs: string;
  terminalEmpty: string;
  terminalReadLatest: string;
  terminalNotes: string;
  terminalHistory: string;
  terminalHistoryStatus: Record<TerminalHistoryStatus, string>;
  terminalHistoryLoadMore: string;
  // ---------- TerminalRow / TerminalList ----------
  terminalOpen: (name: string) => string;
  terminalLastCommand: string;
  terminalReadOnlyShort: string;
  terminalReadOnlyDescription: string;
  terminalGroup: Record<TerminalGroupKey, string>;
  terminalList: string;
  terminalLoadMore: string;
  terminalLoading: string;
  retry: string;
  // ---------- SubAgentCard / SubAgentList ----------
  subagentList: string;
  subagentParent: (id: string) => string;
  subagentOpen: string;
  subagentOpenNamed: (name: string) => string;
  subagentTokens: (tokens: string) => string;
  subagentPartialUsage: string;
  subagentEstimatedUsage: string;
  subagentUsageUnknown: string;
  subagentPendingInput: (count: number) => string;
  subagentAttention: string;
  subagentResult: string;
  subagentEmpty: string;
  subagentInherited: string;
  subagentInheritedGroup: string;
  subagentOpenSnapshot: string;
  subagentOpenSnapshotNamed: (name: string) => string;
  // ---------- ContextUsage ----------
  contextTitle: string;
  contextTrigger: (summary: string) => string;
  contextUnknown: string;
  contextNoMax: string;
  contextPercent: (percent: number) => string;
  contextNear: string;
  contextOver: string;
  contextBreakdown: string;
  contextUnit: Record<'tokens' | 'calls' | 'bytes' | 'items', string>;
  contextStats: string;
  /** Read in place of the visible 「—」 of a missing statistic. */
  contextStatMissing: string;
  /** Formatted value + unit of one statistic (`ms` values arrive already formatted as a duration). */
  contextStatValue: (value: string, unit: UsageStatUnit) => string;
  // ---------- PinnedSummary ----------
  summaryStatus: Record<PinnedSummaryView['status'], string>;
  summaryToggle: string;
  summaryPin: string;
  summarySources: (count: number) => string;
  summaryOpenSource: (title: string) => string;
  summarySourceUnavailable: string;
  summaryTags: string;
  summaryUpdatedAt: (time: string) => string;
  // ---------- ArtifactCard / ArtifactList ----------
  artifactKind: Record<ArtifactKind, string>;
  artifactStatus: Record<ArtifactStatusKey, string>;
  artifactChange: Record<ArtifactChangeKey, string>;
  artifactVersion: (version: string) => string;
  artifactOpen: string;
  artifactOpenNamed: (title: string) => string;
  artifactDownload: (title: string) => string;
  artifactReveal: (title: string) => string;
  artifactRetry: string;
  artifactRetryNamed: (title: string) => string;
  artifactList: string;
  artifactEmpty: string;
  artifactTruncated: string;
  artifactShowAll: string;
  // ---------- FilePreview ----------
  fileMode: Record<FilePreviewMode, string>;
  fileModes: string;
  fileExternal: string;
  fileContent: (name: string) => string;
  fileUnsupported: string;
  fileLoading: string;
  fileError: string;
  fileRetry: string;
  fileLoaded: (loaded: string, total: string) => string;
  fileLoadedNoTotal: (loaded: string) => string;
  fileLargeFile: string;
  fileLoadMore: string;
  fileChanged: string;
  fileReload: string;
  fileMissing: string;
  fileUnavailable: string;
  fileCopy: string;
  fileCopied: string;
  fileCopyFailed: string;
  fileOpenExternal: string;
  fileReference: string;
  fileClose: string;
  fileZoom: string;
  fileMeta: Record<'name' | 'path' | 'type' | 'size' | 'version' | 'language', string>;
  fileNoContent: string;
  fileReread: string;
  fileZoomFit: string;
  fileOpenWith: (target: string) => string;
  fileOpenTargets: (name: string) => string;
  fileOpenGroup: Record<'app' | 'reveal', string>;
  fileCopyPath: string;
  fileCopiedPath: string;
  fileCopyPathFailed: string;
  fileBreadcrumb: (name: string) => string;
  fileBreadcrumbExpand: (count: number) => string;
  // ---------- FilePreviewTabs ----------
  fileTabs: string;
  fileTabClose: (name: string) => string;
  fileTabCloseTitle: string;
  fileTabCloseAll: string;
  // ---------- ActivityLedger ----------
  ledgerList: string;
  ledgerFilters: string;
  ledgerFilter: Record<LedgerFilterKey, string>;
  ledgerActor: Record<LedgerActor, string>;
  ledgerOutcome: Record<LedgerOutcomeKey, string>;
  ledgerOpen: (title: string) => string;
  ledgerEmpty: string;
  ledgerEmptyFiltered: string;
  ledgerLoading: string;
  // ---------- RunSummary ----------
  runTitle: string;
  runPartial: string;
  runSaving: string;
  runPersistence: Record<RunPersistenceKey, string>;
  runRetrySave: string;
  runMetrics: string;
  runElapsed: string;
  runTools: string;
  runToolCount: (count: number) => string;
  runFailedTools: string;
  runTokens: string;
  runArtifacts: string;
  runSideEffects: string;
  runOpenTrace: string;
  runOpenDetails: string;
  // ---------- CompactionNotice ----------
  compactionStatus: Record<CompactionStatus, string>;
  compactionDelta: (before: string, after: string) => string;
  compactionCancel: string;
  compactionRetrySave: string;
  compactionRetryHint: string;
  compactionSummary: string;
  compactionPhase: Record<CompactionPhase, string>;
}

export const zhWorkspace: AgentWorkspaceMessages = {
  terminalBackend: { pty: 'PTY', process: '进程' },
  terminalCwd: '目录',
  terminalOutput: (name) => `${name} 输出`,
  terminalNoOutput: '暂无输出',
  terminalNewOutput: '有新输出',
  terminalLoadEarlier: '加载更早输出',
  terminalPartialCapture: '仅部分捕获',
  terminalInputLabel: (name) => `向 ${name} 输入`,
  terminalInputPlaceholder: '输入后按 Enter 发送',
  terminalSend: '发送',
  terminalStop: (name) => `停止 ${name}`,
  terminalStopVisible: '停止',
  terminalStopPending: '停止尚未确认',
  terminalRetryStop: '重试停止',
  terminalUnknownNotice: '状态待确认：无法确认终端是否仍在运行',
  terminalIdleNotice: '命令已返回，终端尚未关闭',
  terminalReadOnly: '继承的终端记录 · 只读',
  terminalExitCode: (code) => `退出码 ${code}`,
  terminalCalls: (count) => `${count} 次调用`,
  terminalTabs: '终端',
  terminalEmpty: '暂无终端',
  terminalReadLatest: '有新输出，读取最新',
  terminalNotes: '终端说明',
  terminalHistory: '调用记录',
  terminalHistoryStatus: { running: '运行中', returned: '已返回', failed: '失败', unknown: '状态待确认' },
  terminalHistoryLoadMore: '加载更早的调用',
  terminalOpen: (name) => `打开 ${name}`,
  terminalLastCommand: '最近命令',
  terminalReadOnlyShort: '只读',
  terminalReadOnlyDescription: '继承的只读记录，不能输入或停止',
  terminalGroup: { open: '未关闭', ended: '已结束', unknown: '状态待确认', inherited: '继承记录' },
  terminalList: '终端列表',
  terminalLoadMore: '加载更多终端',
  terminalLoading: '正在读取终端…',
  retry: '重试',
  subagentList: '子任务',
  subagentParent: (id) => `父任务 ${id}`,
  subagentOpen: '查看子任务',
  subagentOpenNamed: (name) => `查看子任务：${name}`,
  subagentTokens: (tokens) => `${tokens} token`,
  subagentPartialUsage: '部分用量',
  subagentEstimatedUsage: '估计用量',
  subagentUsageUnknown: '用量未知',
  subagentPendingInput: (count) => `${count} 项待回答`,
  subagentAttention: '子任务需要你处理后才能继续',
  subagentResult: '结果可查看',
  subagentEmpty: '暂无子任务',
  subagentInherited: '继承的子任务记录',
  subagentInheritedGroup: '继承的子任务记录',
  subagentOpenSnapshot: '查看快照',
  subagentOpenSnapshotNamed: (name) => `查看快照：${name}`,
  contextTitle: '上下文用量',
  contextTrigger: (summary) => `上下文用量 ${summary}`,
  contextUnknown: '用量未知',
  contextNoMax: '上限未知，不显示百分比',
  contextPercent: (percent) => `${percent}%`,
  contextNear: '接近上限',
  contextOver: '已超过上限',
  contextBreakdown: '构成',
  contextUnit: { tokens: 'token', calls: '次调用', bytes: '字节', items: '项' },
  contextStats: '用量统计',
  contextStatMissing: '无数据',
  contextStatValue: (value, unit) =>
    unit === 'tokens' ? `${value} token` : unit === 'percent' ? `${value}%` : unit === 'tokens-per-s' ? `${value} token/s` : unit === 'count' ? `${value} 次` : value,
  summaryStatus: { current: '最新', updating: '正在更新', stale: '摘要可能已过期', missing: '暂无摘要' },
  summaryToggle: '摘要内容',
  summaryPin: '固定摘要',
  summarySources: (count) => `来源 · ${count}`,
  summaryOpenSource: (title) => `打开来源 ${title}`,
  summarySourceUnavailable: '来源不可用',
  summaryTags: '标签',
  summaryUpdatedAt: (time) => `更新于 ${time}`,
  artifactKind: { text: '文本', markdown: 'Markdown', code: '代码', image: '图片', file: '文件', diff: '差异', data: '数据', unknown: '未知类型' },
  artifactStatus: { generating: '生成中', partial: '部分完成', saved: '已保存', failed: '生成失败', unavailable: '不可用', stale: '可能已过期' },
  artifactChange: { created: '新建', modified: '已修改', moved: '已移动', deleted: '已删除' },
  artifactVersion: (version) => `版本 ${version}`,
  artifactOpen: '打开',
  artifactOpenNamed: (title) => `打开 ${title}`,
  artifactDownload: (title) => `下载 ${title}`,
  artifactReveal: (title) => `在文件夹中显示 ${title}`,
  artifactRetry: '重试',
  artifactRetryNamed: (title) => `重试 ${title}`,
  artifactList: '产物',
  artifactEmpty: '暂无产物',
  artifactTruncated: '部分产物未列出',
  artifactShowAll: '查看全部产物',
  fileMode: { preview: '预览', raw: '原始', metadata: '元数据' },
  fileModes: '查看方式',
  fileExternal: '外部',
  fileContent: (name) => `${name} 内容`,
  fileUnsupported: '无法预览此类型',
  fileLoading: '正在加载文件',
  fileError: '文件加载失败',
  fileRetry: '重试',
  fileLoaded: (loaded, total) => `已加载 ${loaded} / ${total}`,
  fileLoadedNoTotal: (loaded) => `已加载 ${loaded}`,
  fileLargeFile: '文件较大，只加载了一部分',
  fileLoadMore: '加载更多',
  fileChanged: '文件已更新',
  fileReload: '重新加载',
  fileMissing: '文件不存在',
  fileUnavailable: '文件不可用',
  fileCopy: '复制内容',
  fileCopied: '已复制',
  fileCopyFailed: '复制失败',
  fileOpenExternal: '在外部打开',
  fileReference: '在对话中引用',
  fileClose: '关闭预览',
  fileZoom: '缩放',
  fileMeta: { name: '名称', path: '路径', type: '类型', size: '大小', version: '版本', language: '语言' },
  fileNoContent: '没有可显示的内容',
  fileReread: '重新读取',
  fileZoomFit: '适应宽度',
  fileOpenWith: (target) => `用 ${target} 打开`,
  fileOpenTargets: (name) => `${name} 的更多打开方式`,
  fileOpenGroup: { app: '打开方式', reveal: '在文件夹中显示' },
  fileCopyPath: '复制路径',
  fileCopiedPath: '已复制路径',
  fileCopyPathFailed: '复制路径失败',
  fileBreadcrumb: (name) => `${name} 的路径`,
  fileBreadcrumbExpand: (count) => `展开全部 ${count} 级路径`,
  fileTabs: '已打开的文件',
  fileTabClose: (name) => `关闭 ${name}`,
  fileTabCloseTitle: '关闭标签（中键单击也可关闭）',
  fileTabCloseAll: '关闭全部文件（Esc）',
  ledgerList: '运行事件',
  ledgerFilters: '事件来源',
  ledgerFilter: { all: '全部', agent: 'Agent', tool: '工具', system: '系统', user: '用户' },
  ledgerActor: { agent: 'Agent', tool: '工具', system: '系统', user: '用户' },
  ledgerOutcome: { info: '信息', success: '成功', warning: '注意', danger: '失败', neutral: '记录' },
  ledgerOpen: (title) => `查看事件：${title}`,
  ledgerEmpty: '暂无事件',
  ledgerEmptyFiltered: '该来源暂无事件',
  ledgerLoading: '正在加载事件',
  runTitle: '本轮运行',
  runPartial: '部分完成',
  runSaving: '结果保存中',
  runPersistence: { saved: '结果已保存', saving: '结果保存中', failed: '保存失败', unknown: '保存状态未知' },
  runRetrySave: '重试保存',
  runMetrics: '运行指标',
  runElapsed: '用时',
  runTools: '工具调用',
  runToolCount: (count) => `${count} 次`,
  runFailedTools: '失败工具',
  runTokens: 'Token',
  runArtifacts: '产物',
  runSideEffects: '工具调用可能已改变外部状态，请核对',
  runOpenTrace: '查看过程',
  runOpenDetails: '查看详情',
  compactionStatus: {
    running: '正在整理上下文',
    completed: '上下文已整理',
    cancelled: '已取消整理上下文',
    failed: '上下文整理失败',
    interrupted: '上下文整理已中断',
    'save-pending': '整理结果待保存',
  },
  compactionDelta: (before, after) => `${before} → ${after} token`,
  compactionCancel: '取消',
  compactionRetrySave: '重试保存',
  compactionRetryHint: '可输入 /compact 重试',
  compactionSummary: '整理摘要',
  compactionPhase: { preparing: '准备中', compacting: '正在生成摘要', saving: '正在保存结果' },
};

export const enWorkspace: AgentWorkspaceMessages = {
  terminalBackend: { pty: 'PTY', process: 'Process' },
  terminalCwd: 'Directory',
  terminalOutput: (name) => `${name} output`,
  terminalNoOutput: 'No output yet',
  terminalNewOutput: 'New output',
  terminalLoadEarlier: 'Load earlier output',
  terminalPartialCapture: 'Partially captured',
  terminalInputLabel: (name) => `Input to ${name}`,
  terminalInputPlaceholder: 'Type and press Enter to send',
  terminalSend: 'Send',
  terminalStop: (name) => `Stop ${name}`,
  terminalStopVisible: 'Stop',
  terminalStopPending: 'Stop not confirmed yet',
  terminalRetryStop: 'Retry stop',
  terminalUnknownNotice: 'Status unconfirmed: the terminal may still be running',
  terminalIdleNotice: 'Command returned; the terminal is still open',
  terminalReadOnly: 'Inherited terminal record · read-only',
  terminalExitCode: (code) => `Exit code ${code}`,
  terminalCalls: (count) => `${count} ${count === 1 ? 'call' : 'calls'}`,
  terminalTabs: 'Terminals',
  terminalEmpty: 'No terminals',
  terminalReadLatest: 'New output: read latest',
  terminalNotes: 'Terminal notes',
  terminalHistory: 'Calls',
  terminalHistoryStatus: { running: 'Running', returned: 'Returned', failed: 'Failed', unknown: 'Status unconfirmed' },
  terminalHistoryLoadMore: 'Load earlier calls',
  terminalOpen: (name) => `Open ${name}`,
  terminalLastCommand: 'Last command',
  terminalReadOnlyShort: 'Read-only',
  terminalReadOnlyDescription: 'Inherited read-only record; no input or stop',
  terminalGroup: { open: 'Open', ended: 'Ended', unknown: 'Status unconfirmed', inherited: 'Inherited' },
  terminalList: 'Terminals',
  terminalLoadMore: 'Load more terminals',
  terminalLoading: 'Loading terminals…',
  retry: 'Retry',
  subagentList: 'Sub-tasks',
  subagentParent: (id) => `Parent ${id}`,
  subagentOpen: 'View sub-task',
  subagentOpenNamed: (name) => `View sub-task: ${name}`,
  subagentTokens: (tokens) => `${tokens} tokens`,
  subagentPartialUsage: 'Partial usage',
  subagentEstimatedUsage: 'Estimated usage',
  subagentUsageUnknown: 'Usage unknown',
  subagentPendingInput: (count) => `${count} pending ${count === 1 ? 'answer' : 'answers'}`,
  subagentAttention: 'This sub-task needs you before it can continue',
  subagentResult: 'Result available',
  subagentEmpty: 'No sub-tasks',
  subagentInherited: 'Inherited sub-task record',
  subagentInheritedGroup: 'Inherited sub-task records',
  subagentOpenSnapshot: 'View snapshot',
  subagentOpenSnapshotNamed: (name) => `View snapshot: ${name}`,
  contextTitle: 'Context usage',
  contextTrigger: (summary) => `Context usage ${summary}`,
  contextUnknown: 'Usage unknown',
  contextNoMax: 'Limit unknown; no percentage shown',
  contextPercent: (percent) => `${percent}%`,
  contextNear: 'Near the limit',
  contextOver: 'Over the limit',
  contextBreakdown: 'Breakdown',
  contextUnit: { tokens: 'tokens', calls: 'calls', bytes: 'bytes', items: 'items' },
  contextStats: 'Usage statistics',
  contextStatMissing: 'No data',
  contextStatValue: (value, unit) =>
    unit === 'tokens' ? `${value} tokens` : unit === 'percent' ? `${value}%` : unit === 'tokens-per-s' ? `${value} tokens/s` : value,
  summaryStatus: { current: 'Current', updating: 'Updating', stale: 'Summary may be out of date', missing: 'No summary yet' },
  summaryToggle: 'Summary',
  summaryPin: 'Pin summary',
  summarySources: (count) => `Sources · ${count}`,
  summaryOpenSource: (title) => `Open source ${title}`,
  summarySourceUnavailable: 'Source unavailable',
  summaryTags: 'Tags',
  summaryUpdatedAt: (time) => `Updated ${time}`,
  artifactKind: { text: 'Text', markdown: 'Markdown', code: 'Code', image: 'Image', file: 'File', diff: 'Diff', data: 'Data', unknown: 'Unknown type' },
  artifactStatus: { generating: 'Generating', partial: 'Partly done', saved: 'Saved', failed: 'Failed', unavailable: 'Unavailable', stale: 'May be out of date' },
  artifactChange: { created: 'New', modified: 'Modified', moved: 'Moved', deleted: 'Deleted' },
  artifactVersion: (version) => `Version ${version}`,
  artifactOpen: 'Open',
  artifactOpenNamed: (title) => `Open ${title}`,
  artifactDownload: (title) => `Download ${title}`,
  artifactReveal: (title) => `Show ${title} in folder`,
  artifactRetry: 'Retry',
  artifactRetryNamed: (title) => `Retry ${title}`,
  artifactList: 'Artifacts',
  artifactEmpty: 'No artifacts',
  artifactTruncated: 'Some artifacts are not listed',
  artifactShowAll: 'Show all artifacts',
  fileMode: { preview: 'Preview', raw: 'Raw', metadata: 'Metadata' },
  fileModes: 'View',
  fileExternal: 'External',
  fileContent: (name) => `${name} content`,
  fileUnsupported: 'This file type cannot be previewed',
  fileLoading: 'Loading file',
  fileError: 'Could not load the file',
  fileRetry: 'Retry',
  fileLoaded: (loaded, total) => `Loaded ${loaded} / ${total}`,
  fileLoadedNoTotal: (loaded) => `Loaded ${loaded}`,
  fileLargeFile: 'Large file; only part of it is loaded',
  fileLoadMore: 'Load more',
  fileChanged: 'File has changed',
  fileReload: 'Reload',
  fileMissing: 'File does not exist',
  fileUnavailable: 'File unavailable',
  fileCopy: 'Copy content',
  fileCopied: 'Copied',
  fileCopyFailed: 'Copy failed',
  fileOpenExternal: 'Open externally',
  fileReference: 'Reference in conversation',
  fileClose: 'Close preview',
  fileZoom: 'Zoom',
  fileMeta: { name: 'Name', path: 'Path', type: 'Type', size: 'Size', version: 'Version', language: 'Language' },
  fileNoContent: 'Nothing to show',
  fileReread: 'Read again',
  fileZoomFit: 'Fit width',
  fileOpenWith: (target) => `Open with ${target}`,
  fileOpenTargets: (name) => `More ways to open ${name}`,
  fileOpenGroup: { app: 'Open with', reveal: 'Show in folder' },
  fileCopyPath: 'Copy path',
  fileCopiedPath: 'Path copied',
  fileCopyPathFailed: 'Could not copy path',
  fileBreadcrumb: (name) => `Path of ${name}`,
  fileBreadcrumbExpand: (count) => `Show all ${count} path levels`,
  fileTabs: 'Open files',
  fileTabClose: (name) => `Close ${name}`,
  fileTabCloseTitle: 'Close tab (middle-click also closes)',
  fileTabCloseAll: 'Close all files (Esc)',
  ledgerList: 'Run events',
  ledgerFilters: 'Event source',
  ledgerFilter: { all: 'All', agent: 'Agent', tool: 'Tool', system: 'System', user: 'User' },
  ledgerActor: { agent: 'Agent', tool: 'Tool', system: 'System', user: 'User' },
  ledgerOutcome: { info: 'Info', success: 'Success', warning: 'Attention', danger: 'Failed', neutral: 'Record' },
  ledgerOpen: (title) => `View event: ${title}`,
  ledgerEmpty: 'No events',
  ledgerEmptyFiltered: 'No events from this source',
  ledgerLoading: 'Loading events',
  runTitle: 'This run',
  runPartial: 'Partly done',
  runSaving: 'Saving result',
  runPersistence: { saved: 'Result saved', saving: 'Saving result', failed: 'Save failed', unknown: 'Save status unknown' },
  runRetrySave: 'Retry save',
  runMetrics: 'Run metrics',
  runElapsed: 'Time',
  runTools: 'Tool calls',
  runToolCount: (count) => `${count}`,
  runFailedTools: 'Failed tools',
  runTokens: 'Tokens',
  runArtifacts: 'Artifacts',
  runSideEffects: 'Tool calls may have changed external state; please check',
  runOpenTrace: 'View process',
  runOpenDetails: 'View details',
  compactionStatus: {
    running: 'Compacting context',
    completed: 'Context compacted',
    cancelled: 'Compaction cancelled',
    failed: 'Compaction failed',
    interrupted: 'Compaction interrupted',
    'save-pending': 'Compaction result not saved yet',
  },
  compactionDelta: (before, after) => `${before} → ${after} tokens`,
  compactionCancel: 'Cancel',
  compactionRetrySave: 'Retry save',
  compactionRetryHint: 'Type /compact to retry',
  compactionSummary: 'Compaction summary',
  compactionPhase: { preparing: 'Preparing', compacting: 'Writing summary', saving: 'Saving result' },
};
