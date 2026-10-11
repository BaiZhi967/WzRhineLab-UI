import type { FileDiffView, ToolAuthorizationView, ToolDetailView, ToolOutputView } from '@wzrhine/agent-core';

type FileDiffStatus = NonNullable<FileDiffView['status']>;
type FileChange = FileDiffView['change'];
type CommandDetail = Extract<ToolDetailView, { kind: 'command' }>;
type ManageDetail = Extract<ToolDetailView, { kind: 'manage-files' }>;
type McpDetail = Extract<ToolDetailView, { kind: 'mcp' }>;
type ModelDetail = Extract<ToolDetailView, { kind: 'model' }>;
type WriteDetail = Extract<ToolDetailView, { kind: 'file-write' }>;
type ManageOp = ManageDetail['operations'][number]['type'];
type ManageStatus = NonNullable<ManageDetail['operations'][number]['status']>;
type ReceiptStatus = 'idle' | 'submitting' | 'accepted' | 'rejected' | 'unknown';
type ReadUnit = 'lines' | 'bytes';
type PageUnit = 'bytes' | 'lines' | 'items';

/**
 * Copy for the tools family (ADR-0011 §5, §10): ToolRecord, ToolActivity, CodeModeToolTree,
 * ToolOutput, ToolHistory, DiffPreview and the tool detail views. Status and category labels
 * come from the shared `status` namespace.
 */
export interface AgentToolsMessages {
  // ---------- ToolRecord ----------
  /** Accessible name of a tool row trigger. */
  rowLabel: (parts: { category?: string; name: string; subject?: string; summary?: string; status: string; elapsed?: string }) => string;
  rawName: (name: string) => string;
  detailsRegion: (name: string) => string;
  loadingDetails: string;
  detailsError: string;
  retry: string;
  noDetails: string;
  authorization: (decision: string, source?: string) => string;
  authorizationDecision: Record<ToolAuthorizationView['decision'], string>;
  receipt: Record<ReceiptStatus, string>;

  // ---------- ToolActivity ----------
  operationCount: (count: number) => string;
  runningCount: (count: number) => string;
  activityList: string;
  statusCounts: string;
  openHistory: string;

  // ---------- CodeModeToolTree ----------
  childList: (parent: string) => string;
  viewScript: string;
  scriptLabel: (language?: string) => string;
  scriptTruncated: string;
  openFullScript: string;
  outcomeAllDone: (count: number) => string;
  outcomePartial: (failed: number) => string;
  outcomeAllFailed: (count: number) => string;
  outcomeRunning: (running: number, total: number) => string;
  outcomeUnknown: (count: number) => string;
  outcomeEmpty: string;
  parentNotice: string;

  // ---------- ToolOutput ----------
  outputKind: Record<ToolOutputView['kind'], string>;
  outputLabel: string;
  inputLabel: string;
  copy: string;
  copied: string;
  copyFailed: string;
  emptyOutput: string;
  outputUnavailable: string;
  outputLoading: string;
  outputStreaming: string;
  truncatedDisplay: string;
  truncatedExecution: string;
  loadMore: string;
  openFull: string;
  outputTotal: (total: string, unit: NonNullable<ToolOutputView['totalUnit']>) => string;

  // ---------- ChunkPager ----------
  /** Range of the shown page; `start` / `end` are already formatted, `total` when known. */
  pagerRange: (start: string, end: string, total: string | undefined, unit: PageUnit) => string;
  pagerComplete: string;
  pagerFragment: string;
  pagerRegion: (label: string) => string;
  pagerNavigation: (label: string) => string;
  pagerFirst: string;
  pagerPrevious: string;
  pagerNext: string;
  pagerAtStart: string;
  pagerAtEnd: string;
  pagerNoNextOffset: string;
  pagerBusy: string;
  pagerFailed: string;
  pagerLoading: string;
  pagerError: string;
  pagerRetry: string;
  pagerEmpty: string;
  pagerNewer: string;
  pagerReadLatest: string;

  // ---------- ToolHistory ----------
  historyTitle: string;
  historyLoaded: (count: number) => string;
  historyTotal: (loaded: number, total: number) => string;
  historyLoadMore: string;
  historyLoading: string;
  historyError: string;
  historyEmpty: string;
  historyList: string;
  openOperation: string;

  // ---------- DiffPreview ----------
  diffChange: Record<FileChange, string>;
  diffStatus: Record<FileDiffStatus, string>;
  diffStatsLabel: (additions: number, deletions: number) => string;
  diffFiles: (count: number) => string;
  diffRegion: (path: string) => string;
  diffAdded: string;
  diffRemoved: string;
  diffTruncated: string;
  diffViewFull: string;
  diffBinary: string;
  diffUnavailable: string;
  diffEmpty: string;
  noNewlineAtEnd: (side: 'old' | 'new') => string;
  conflictTitle: string;
  conflictBody: string;
  reloadFile: string;
  movedTo: (path: string) => string;
  multiFileList: string;

  // ---------- shared detail copy ----------
  path: string;
  materialPending: string;
  revision: (value: string) => string;
  codeRegion: (label: string) => string;

  // ---------- file-read ----------
  readRange: (start: number, end: number | undefined, unit: ReadUnit) => string;
  readEof: string;
  readNotEof: string;
  readContinue: (offset: number, unit: ReadUnit) => string;
  readTotalLines: (count: string) => string;
  readBytes: (size: string) => string;
  readMore: string;
  readPreview: (path: string) => string;
  readError: Record<'not-found' | 'forbidden' | 'error', (file: string) => string>;
  readResult: string;

  // ---------- file-write / edit / patch ----------
  writeMode: Record<WriteDetail['mode'], string>;
  writeTarget: string;
  writeModeLabel: string;
  expectedVersion: string;
  currentVersion: string;
  versionConflict: (expected: string, current: string) => string;
  editTitle: (index: number) => string;
  editStrategy: string;
  editRange: string;
  editTruncated: string;
  patchConflict: (files: string) => string;
  patchFiles: string;

  // ---------- manage-files ----------
  manageOp: Record<ManageOp, string>;
  manageStatus: Record<ManageStatus, string>;
  manageColumns: { type: string; path: string; status: string };
  manageRecursive: string;
  /** Spoken between source and target (the visible arrow is decorative). */
  manageTarget: string;
  manageIrreversible: string;
  manageList: string;
  manageLoadMore: string;

  // ---------- command ----------
  commandLabel: string;
  commandCwd: string;
  commandShell: string;
  commandTimeout: string;
  commandExecution: Record<NonNullable<CommandDetail['execution']>, string>;
  exitCode: (code: number) => string;
  exitCodeFailed: (code: number) => string;
  exitCodeMissing: string;
  unsandboxed: string;
  openTerminal: string;
  commandOutput: string;
  copyCommand: string;

  // ---------- mcp ----------
  mcpServer: string;
  mcpTool: string;
  mcpEndpoint: string;
  mcpCatalog: string;
  mcpCatalogStale: string;
  mcpArguments: string;
  mcpRemote: Record<NonNullable<McpDetail['remote']>, string>;
  mcpReconcile: string;

  // ---------- model ----------
  modelTitle: (provider: string, model: string) => string;
  modelProvider: string;
  modelPurpose: string;
  modelInputs: string;
  modelDestination: (destination: string) => string;
  modelParams: string;
  modelResults: string;
  modelResultSaved: string;
  modelResultUnsaved: string;
  modelSave: Record<NonNullable<ModelDetail['save']>, string>;
  modelRetrySave: string;
  modelRetrySaveHint: string;
  modelRunning: string;

  // ---------- question / agent ----------
  questionCount: (count: number) => string;
  questionSkipped: string;
  questionNoAnswers: string;
  questionAnswers: string;
  agentName: string;
  agentTask: string;
  openChild: string;
}

const zhUnit = { lines: '行', bytes: '字节', items: '项' } as const;

export const zhTools: AgentToolsMessages = {
  rowLabel: ({ category, name, subject, summary, status, elapsed }) =>
    [category && `${category}：`, name, subject, summary, status, elapsed].filter(Boolean).join(' '),
  rawName: (name) => `工具名 ${name}`,
  detailsRegion: (name) => `${name} 详情`,
  loadingDetails: '正在读取完整记录…',
  detailsError: '完整记录读取失败',
  retry: '重试',
  noDetails: '此操作没有可显示的详情',
  authorization: (decision, source) => (source ? `授权：${decision} · ${source}` : `授权：${decision}`),
  authorizationDecision: {
    auto: '自动允许',
    approved: '已批准',
    denied: '已拒绝',
    pending: '等待批准',
    expired: '批准已过期',
  },
  receipt: {
    idle: '未提交',
    submitting: '正在提交操作',
    accepted: '操作已被接受',
    rejected: '操作未被接受',
    unknown: '操作回执待确认，请核对后再重试',
  },

  operationCount: (n) => `${n} 个操作`,
  runningCount: (n) => `${n} 个进行中`,
  activityList: '本轮工具操作',
  statusCounts: '状态统计',
  openHistory: '完整工具记录',

  childList: (parent) => `${parent} 的子操作`,
  viewScript: '查看脚本',
  scriptLabel: (language) => (language ? `脚本 · ${language}` : '脚本'),
  scriptTruncated: '脚本较长，仅显示部分内容',
  openFullScript: '查看完整脚本',
  outcomeAllDone: (n) => `全部 ${n} 个子操作已完成`,
  outcomePartial: (failed) => `部分完成：${failed} 个子操作失败`,
  outcomeAllFailed: (n) => `${n} 个子操作全部失败`,
  outcomeRunning: (running, total) => `${total} 个子操作中 ${running} 个进行中`,
  outcomeUnknown: (n) => `${n} 个子操作结果待确认`,
  outcomeEmpty: '尚无子操作',
  parentNotice: '父任务结束不代表所有子操作的外部副作用都已成功',

  outputKind: {
    text: '文本',
    json: 'JSON',
    code: '代码',
    terminal: '终端输出',
    list: '列表',
    error: '错误',
    empty: '无输出',
  },
  outputLabel: '输出',
  inputLabel: '输入参数',
  copy: '复制',
  copied: '已复制',
  copyFailed: '复制失败',
  emptyOutput: '无输出',
  outputUnavailable: '输出不可用',
  outputLoading: '正在读取输出…',
  outputStreaming: '输出仍在更新',
  truncatedDisplay: '仅显示部分输出，完整内容可继续加载',
  truncatedExecution: '工具输出已达上限，结果本身被截断',
  loadMore: '加载更多',
  openFull: '查看完整输出',
  outputTotal: (total, unit) => `共 ${total} ${zhUnit[unit]}`,

  pagerRange: (start, end, total, unit) => {
    const range = unit === 'bytes' ? `字节 ${start}–${end}` : unit === 'lines' ? `第 ${start}–${end} 行` : `第 ${start}–${end} 项`;
    return total !== undefined ? `${range} / ${total}` : range;
  },
  pagerComplete: '已读至末尾',
  pagerFragment: '片段',
  pagerRegion: (label) => `${label} 当前页`,
  pagerNavigation: (label) => `${label} 翻页`,
  pagerFirst: '返回开头',
  pagerPrevious: '上一页',
  pagerNext: '下一页',
  pagerAtStart: '已在开头',
  pagerAtEnd: '已读至末尾，没有下一页',
  pagerNoNextOffset: '运行时没有提供下一页位置',
  pagerBusy: '正在读取，请稍候',
  pagerFailed: '这一页读取失败，先重试',
  pagerLoading: '正在读取这一页…',
  pagerError: '这一页读取失败',
  pagerRetry: '重试',
  pagerEmpty: '这一页没有内容',
  pagerNewer: '已有更新的内容，当前显示的是旧快照',
  pagerReadLatest: '读取最新',

  historyTitle: '完整工具记录',
  historyLoaded: (n) => `已加载 ${n} 个操作`,
  historyTotal: (loaded, total) => `已加载 ${loaded} / ${total} 个操作`,
  historyLoadMore: '加载更多操作',
  historyLoading: '正在读取操作记录…',
  historyError: '操作记录读取失败，已加载的记录保留',
  historyEmpty: '还没有工具记录',
  historyList: '工具记录',
  openOperation: '在对话中定位',

  diffChange: {
    add: '新增文件',
    delete: '删除文件',
    update: '修改',
    move: '移动',
  },
  diffStatus: {
    preview: '预览',
    proposed: '待批准',
    applied: '已应用',
    conflict: '版本冲突',
    unavailable: '不可用',
  },
  diffStatsLabel: (a, d) => `新增 ${a} 行，删除 ${d} 行`,
  diffFiles: (n) => `${n} 个文件`,
  diffRegion: (path) => `${path} 的差异`,
  diffAdded: '新增',
  diffRemoved: '删除',
  diffTruncated: '仅显示部分差异',
  diffViewFull: '查看完整差异',
  diffBinary: '二进制文件，不显示内容差异',
  diffUnavailable: '差异暂不可用',
  diffEmpty: '没有内容变化',
  noNewlineAtEnd: (side) => (side === 'old' ? '原文件末尾没有换行符' : '新文件末尾没有换行符'),
  conflictTitle: '文件版本冲突',
  conflictBody: '重新读取最新文件后再决定',
  reloadFile: '重新读取文件',
  movedTo: (path) => `移动到 ${path}`,
  multiFileList: '改动的文件',

  path: '路径',
  materialPending: '正在读取完整材料…',
  revision: (v) => `修订 ${v}`,
  codeRegion: (label) => `${label}（可滚动）`,

  readRange: (start, end, unit) =>
    unit === 'lines'
      ? end != null
        ? `第 ${start}–${end} 行`
        : `从第 ${start} 行起`
      : end != null
        ? `字节 ${start}–${end}`
        : `从字节 ${start} 起`,
  readEof: '已读到文件末尾',
  readNotEof: '尚未读到文件末尾',
  readContinue: (offset, unit) => (unit === 'lines' ? `可从第 ${offset} 行继续读取` : `可从字节 ${offset} 继续读取`),
  readTotalLines: (n) => `共 ${n} 行`,
  readBytes: (size) => `大小 ${size}`,
  readMore: '继续读取',
  readPreview: (path) => `${path} 内容预览`,
  readError: {
    'not-found': (file) => `找不到文件：${file}`,
    forbidden: (file) => `无权读取：${file}`,
    error: (file) => `读取失败：${file}`,
  },
  readResult: '读取结果',

  writeMode: { create: '新建文件', overwrite: '覆盖写入', append: '追加写入' },
  writeTarget: '目标文件',
  writeModeLabel: '写入方式',
  expectedVersion: '期望版本',
  currentVersion: '当前版本',
  versionConflict: (expected, current) => `文件版本已变化：期望 ${expected}，当前 ${current}`,
  editTitle: (i) => `编辑 ${i}`,
  editStrategy: '匹配方式',
  editRange: '范围',
  editTruncated: '这处编辑较长，仅显示部分内容',
  patchConflict: (files) => `补丁冲突：${files}`,
  patchFiles: '补丁文件',

  manageOp: {
    mkdir: '新建目录',
    move: '移动',
    copy: '复制',
    rename: '重命名',
    delete: '删除',
  },
  manageStatus: {
    pending: '待执行',
    completed: '已完成',
    failed: '失败',
    conflict: '冲突',
  },
  manageColumns: { type: '操作', path: '路径', status: '状态' },
  manageRecursive: '包含子目录',
  manageTarget: '至',
  manageIrreversible: '不能自动恢复',
  manageList: '文件操作',
  manageLoadMore: '加载更多文件操作',

  commandLabel: '命令',
  commandCwd: '工作目录',
  commandShell: 'Shell',
  commandTimeout: '超时',
  commandExecution: {
    pending: '等待执行',
    running: '运行中',
    returned: '调用已返回',
    background: '后台仍在运行',
    'timed-out': '已超时',
    'cancel-unconfirmed': '停止尚未确认',
  },
  exitCode: (c) => `退出码 ${c}`,
  exitCodeFailed: (c) => `退出码 ${c} · 请检查输出`,
  exitCodeMissing: '退出码未记录',
  unsandboxed: '非沙箱：命令可以访问沙箱外的文件与网络',
  openTerminal: '打开终端',
  commandOutput: '命令输出',
  copyCommand: '复制命令',

  mcpServer: '服务',
  mcpTool: '工具',
  mcpEndpoint: '地址',
  mcpCatalog: '目录修订',
  mcpCatalogStale: '目录已变化，旧材料不可信',
  mcpArguments: '完整参数',
  mcpRemote: {
    pending: '等待远端结果',
    completed: '远端已完成',
    failed: '远端失败',
    unknown: '远端结果待确认，需要核对',
  },
  mcpReconcile: '核对远端结果',

  modelTitle: (provider, model) => `${provider} · ${model}`,
  modelProvider: '模型',
  modelPurpose: '用途',
  modelInputs: '输入材料',
  modelDestination: (d) => `发送至 ${d}`,
  modelParams: '参数',
  modelResults: '生成结果',
  modelResultSaved: '已保存',
  modelResultUnsaved: '未保存',
  modelSave: {
    pending: '等待保存',
    saving: '正在保存',
    saved: '已保存',
    partial: '部分材料已保存',
    failed: '保存失败',
  },
  modelRetrySave: '重新保存',
  modelRetrySaveHint: '只重新保存，不会再次调用模型',
  modelRunning: '模型调用进行中',

  questionCount: (n) => `${n} 个问题`,
  questionSkipped: '已跳过',
  questionNoAnswers: '尚无回答',
  questionAnswers: '回答',
  agentName: '子任务',
  agentTask: '任务',
  openChild: '打开子任务',
};

const enUnit = { lines: 'lines', bytes: 'bytes', items: 'items' } as const;
const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

export const enTools: AgentToolsMessages = {
  rowLabel: ({ category, name, subject, summary, status, elapsed }) =>
    [category && `${category}:`, name, subject, summary, status, elapsed].filter(Boolean).join(' '),
  rawName: (name) => `Tool name ${name}`,
  detailsRegion: (name) => `${name} details`,
  loadingDetails: 'Loading the full record…',
  detailsError: 'Could not load the full record',
  retry: 'Retry',
  noDetails: 'No details to show for this operation',
  authorization: (decision, source) => (source ? `Permission: ${decision} · ${source}` : `Permission: ${decision}`),
  authorizationDecision: {
    auto: 'Allowed automatically',
    approved: 'Approved',
    denied: 'Denied',
    pending: 'Waiting for approval',
    expired: 'Approval expired',
  },
  receipt: {
    idle: 'Not submitted',
    submitting: 'Submitting',
    accepted: 'Accepted',
    rejected: 'Not accepted',
    unknown: 'Receipt unconfirmed: check before retrying',
  },

  operationCount: (n) => plural(n, 'operation', 'operations'),
  runningCount: (n) => `${n} running`,
  activityList: 'Tool operations in this round',
  statusCounts: 'Status counts',
  openHistory: 'Full tool history',

  childList: (parent) => `Child operations of ${parent}`,
  viewScript: 'View script',
  scriptLabel: (language) => (language ? `Script · ${language}` : 'Script'),
  scriptTruncated: 'Long script: showing part of it',
  openFullScript: 'View full script',
  outcomeAllDone: (n) => `All ${plural(n, 'child operation', 'child operations')} done`,
  outcomePartial: (failed) => `Partly done: ${plural(failed, 'child operation', 'child operations')} failed`,
  outcomeAllFailed: (n) => `All ${plural(n, 'child operation', 'child operations')} failed`,
  outcomeRunning: (running, total) => `${running} of ${total} child operations running`,
  outcomeUnknown: (n) => `${plural(n, 'child result', 'child results')} unconfirmed`,
  outcomeEmpty: 'No child operations yet',
  parentNotice: 'A finished parent does not mean every external side effect succeeded',

  outputKind: {
    text: 'Text',
    json: 'JSON',
    code: 'Code',
    terminal: 'Terminal output',
    list: 'List',
    error: 'Error',
    empty: 'No output',
  },
  outputLabel: 'Output',
  inputLabel: 'Input',
  copy: 'Copy',
  copied: 'Copied',
  copyFailed: 'Copy failed',
  emptyOutput: 'No output',
  outputUnavailable: 'Output unavailable',
  outputLoading: 'Loading output…',
  outputStreaming: 'Output still updating',
  truncatedDisplay: 'Showing part of the output; more can be loaded',
  truncatedExecution: 'The tool hit its output limit; the result itself is cut',
  loadMore: 'Load more',
  openFull: 'Open full output',
  outputTotal: (total, unit) => `${total} ${enUnit[unit]} in total`,

  pagerRange: (start, end, total, unit) => {
    const range = unit === 'bytes' ? `Bytes ${start}–${end}` : unit === 'lines' ? `Lines ${start}–${end}` : `Items ${start}–${end}`;
    return total !== undefined ? `${range} / ${total}` : range;
  },
  pagerComplete: 'Read to the end',
  pagerFragment: 'Fragment',
  pagerRegion: (label) => `${label} current page`,
  pagerNavigation: (label) => `${label} pages`,
  pagerFirst: 'Back to start',
  pagerPrevious: 'Previous page',
  pagerNext: 'Next page',
  pagerAtStart: 'Already at the start',
  pagerAtEnd: 'Read to the end; no next page',
  pagerNoNextOffset: 'The runtime gave no next page position',
  pagerBusy: 'Loading, please wait',
  pagerFailed: 'This page failed to load; retry first',
  pagerLoading: 'Loading this page…',
  pagerError: 'Could not load this page',
  pagerRetry: 'Retry',
  pagerEmpty: 'This page is empty',
  pagerNewer: 'Newer content exists; this is an older snapshot',
  pagerReadLatest: 'Read latest',

  historyTitle: 'Full tool history',
  historyLoaded: (n) => `${plural(n, 'operation', 'operations')} loaded`,
  historyTotal: (loaded, total) => `${loaded} / ${total} operations loaded`,
  historyLoadMore: 'Load more operations',
  historyLoading: 'Loading operations…',
  historyError: 'Could not load operations; loaded records are kept',
  historyEmpty: 'No tool records yet',
  historyList: 'Tool records',
  openOperation: 'Show in conversation',

  diffChange: {
    add: 'New file',
    delete: 'Deleted file',
    update: 'Modified',
    move: 'Moved',
  },
  diffStatus: {
    preview: 'Preview',
    proposed: 'Proposed',
    applied: 'Applied',
    conflict: 'Version conflict',
    unavailable: 'Unavailable',
  },
  diffStatsLabel: (a, d) => `${a} added, ${d} removed lines`,
  diffFiles: (n) => plural(n, 'file', 'files'),
  diffRegion: (path) => `Diff of ${path}`,
  diffAdded: 'added',
  diffRemoved: 'removed',
  diffTruncated: 'Showing part of the diff',
  diffViewFull: 'View full diff',
  diffBinary: 'Binary file: content diff not shown',
  diffUnavailable: 'Diff unavailable',
  diffEmpty: 'No content changes',
  noNewlineAtEnd: (side) => (side === 'old' ? 'Old file has no newline at end' : 'New file has no newline at end'),
  conflictTitle: 'File version conflict',
  conflictBody: 'Reload the latest file before deciding',
  reloadFile: 'Reload file',
  movedTo: (path) => `moved to ${path}`,
  multiFileList: 'Changed files',

  path: 'Path',
  materialPending: 'Loading the full material…',
  revision: (v) => `Revision ${v}`,
  codeRegion: (label) => `${label} (scrollable)`,

  readRange: (start, end, unit) =>
    unit === 'lines'
      ? end != null
        ? `Lines ${start}–${end}`
        : `From line ${start}`
      : end != null
        ? `Bytes ${start}–${end}`
        : `From byte ${start}`,
  readEof: 'Read to end of file',
  readNotEof: 'Not at end of file',
  readContinue: (offset, unit) => (unit === 'lines' ? `Can continue from line ${offset}` : `Can continue from byte ${offset}`),
  readTotalLines: (n) => `${n} lines in total`,
  readBytes: (size) => `Size ${size}`,
  readMore: 'Continue reading',
  readPreview: (path) => `Preview of ${path}`,
  readError: {
    'not-found': (file) => `File not found: ${file}`,
    forbidden: (file) => `No permission to read: ${file}`,
    error: (file) => `Could not read: ${file}`,
  },
  readResult: 'Read result',

  writeMode: {
    create: 'Create file',
    overwrite: 'Overwrite',
    append: 'Append',
  },
  writeTarget: 'Target file',
  writeModeLabel: 'Write mode',
  expectedVersion: 'Expected version',
  currentVersion: 'Current version',
  versionConflict: (expected, current) => `File changed: expected ${expected}, now ${current}`,
  editTitle: (i) => `Edit ${i}`,
  editStrategy: 'Matching',
  editRange: 'Range',
  editTruncated: 'Long edit: showing part of it',
  patchConflict: (files) => `Patch conflict: ${files}`,
  patchFiles: 'Patch files',

  manageOp: {
    mkdir: 'Create folder',
    move: 'Move',
    copy: 'Copy',
    rename: 'Rename',
    delete: 'Delete',
  },
  manageStatus: {
    pending: 'Pending',
    completed: 'Done',
    failed: 'Failed',
    conflict: 'Conflict',
  },
  manageColumns: { type: 'Operation', path: 'Path', status: 'Status' },
  manageRecursive: 'Includes subfolders',
  manageTarget: 'to',
  manageIrreversible: 'Cannot be undone automatically',
  manageList: 'File operations',
  manageLoadMore: 'Load more file operations',

  commandLabel: 'Command',
  commandCwd: 'Working directory',
  commandShell: 'Shell',
  commandTimeout: 'Timeout',
  commandExecution: {
    pending: 'Pending',
    running: 'Running',
    returned: 'Call returned',
    background: 'Still running in background',
    'timed-out': 'Timed out',
    'cancel-unconfirmed': 'Stop not yet confirmed',
  },
  exitCode: (c) => `Exit code ${c}`,
  exitCodeFailed: (c) => `Exit code ${c} · check the output`,
  exitCodeMissing: 'Exit code not recorded',
  unsandboxed: 'Not sandboxed: the command can reach files and network outside the sandbox',
  openTerminal: 'Open terminal',
  commandOutput: 'Command output',
  copyCommand: 'Copy command',

  mcpServer: 'Server',
  mcpTool: 'Tool',
  mcpEndpoint: 'Endpoint',
  mcpCatalog: 'Catalog revision',
  mcpCatalogStale: 'Catalog changed: the old material cannot be trusted',
  mcpArguments: 'Full arguments',
  mcpRemote: {
    pending: 'Waiting for remote result',
    completed: 'Remote done',
    failed: 'Remote failed',
    unknown: 'Remote result unconfirmed: needs checking',
  },
  mcpReconcile: 'Check remote result',

  modelTitle: (provider, model) => `${provider} · ${model}`,
  modelProvider: 'Model',
  modelPurpose: 'Purpose',
  modelInputs: 'Input material',
  modelDestination: (d) => `Sent to ${d}`,
  modelParams: 'Parameters',
  modelResults: 'Results',
  modelResultSaved: 'Saved',
  modelResultUnsaved: 'Not saved',
  modelSave: {
    pending: 'Waiting to save',
    saving: 'Saving',
    saved: 'Saved',
    partial: 'Partly saved',
    failed: 'Save failed',
  },
  modelRetrySave: 'Save again',
  modelRetrySaveHint: 'Only saves again; the model is not called again',
  modelRunning: 'Model call in progress',

  questionCount: (n) => plural(n, 'question', 'questions'),
  questionSkipped: 'Skipped',
  questionNoAnswers: 'No answers yet',
  questionAnswers: 'Answers',
  agentName: 'Sub-task',
  agentTask: 'Task',
  openChild: 'Open sub-task',
};
