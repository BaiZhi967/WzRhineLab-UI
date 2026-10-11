import type { ModelEffort, ModelOptionView } from '@wzrhine/agent-core';

/** Copy for the composer family (ADR-0011 §10): Composer, ComposerInput, menus, attachments, pickers. */
export interface AgentComposerMessages {
  /** Accessible name of the message textarea. */
  inputLabel: string;
  placeholder: string;
  /** Screen-reader hint linked to the textarea with aria-describedby. */
  inputHint: string;
  /** Hint when `submitOn="mod-enter"`. */
  inputHintModEnter: string;
  blockedPlaceholder: string;
  // ---------- mention menu ----------
  mentionTitle: string;
  mentionKeys: string;
  mentionLoading: string;
  mentionEmpty: string;
  mentionError: string;
  mentionRetry: string;
  /** Spoken suffix for drillable folder options. */
  mentionDrill: string;
  // ---------- slash menu ----------
  commandTitle: string;
  commandKeys: string;
  commandLoading: string;
  commandEmpty: string;
  commandGroup: string;
  skillGroup: string;
  skillSelected: string;
  /** Text for disabled options: "不可用：…". */
  optionUnavailable: (reason: string | undefined) => string;
  // ---------- attachments ----------
  attachmentsLabel: string;
  remove: (name: string) => string;
  retryUpload: (name: string) => string;
  uploading: string;
  uploadingName: (name: string) => string;
  uploadFailed: string;
  stale: string;
  unavailable: string;
  referenceLoading: string;
  referenceFailed: string;
  external: string;
  kind: Record<'image' | 'file' | 'pdf' | 'text' | 'code' | 'unknown', string>;
  referenceKind: Record<'file' | 'folder' | 'skill' | 'command' | 'url' | 'symbol' | 'custom', string>;
  // ---------- send / stop ----------
  send: string;
  sending: string;
  stop: string;
  stopPending: string;
  resultPending: string;
  retrySameSend: string;
  retrySameStop: string;
  retrySave: string;
  // ---------- feedback line ----------
  draftSaving: string;
  draftSaved: string;
  draftError: string;
  submitFailed: string;
  submitUnknown: string;
  retry: string;
  emptyReason: string;
  uploadingReason: string;
  overLimitReason: string;
  submittingReason: string;
  runningReason: string;
  /** Character counter; receives formatted numbers. */
  characters: (count: string, max: string | undefined) => string;
  dropFiles: string;
  // ---------- model picker ----------
  modelPlaceholder: string;
  /** Accessible name of the trigger: "模型：vision-1，思考强度：均衡". */
  modelTriggerLabel: (model: string, effort: string | undefined) => string;
  modelPickerLabel: string;
  effortHeading: string;
  effortNone: string;
  effortNote: string;
  switchModel: string;
  modelHeading: string;
  back: string;
  modelsLoading: string;
  modelsError: string;
  modelsEmpty: string;
  effort: Record<ModelEffort, string>;
  capability: Record<NonNullable<ModelOptionView['capabilities']>[number], string>;
  // ---------- permission picker ----------
  permissionTriggerLabel: (label: string) => string;
  permissionMenu: string;
  permissionElevated: string;
  permissionConfirmTitle: (label: string) => string;
  permissionConfirmDescription: string;
  permissionConfirm: (label: string) => string;
  // ---------- composer notice (replacement) ----------
  /** Spoken prefix that names the notice tone (the icon is decorative). */
  noticeTone: Record<'neutral' | 'info' | 'warning' | 'danger', string>;
}

export const zhComposer: AgentComposerMessages = {
  inputLabel: '消息内容',
  placeholder: '写下想法，@ 引用文件，/ 命令与技能',
  inputHint: 'Enter 发送，Shift + Enter 换行；输入 @ 引用文件，/ 选择命令或技能。',
  inputHintModEnter: 'Ctrl + Enter 发送，Enter 换行；输入 @ 引用文件，/ 选择命令或技能。',
  blockedPlaceholder: '请先在上方回答问题',
  mentionTitle: '引用文件与上下文',
  mentionKeys: '↑↓ 选择 · Enter 插入 · Tab 进入文件夹 · Esc 关闭',
  mentionLoading: '正在读取候选…',
  mentionEmpty: '没有匹配的文件',
  mentionError: '候选读取失败',
  mentionRetry: '重新读取',
  mentionDrill: '文件夹，Enter 或 Tab 进入',
  commandTitle: '命令与技能',
  commandKeys: '↑↓ 选择 · Enter 选用 · Esc 关闭',
  commandLoading: '正在读取命令…',
  commandEmpty: '没有匹配的命令或技能',
  commandGroup: '命令',
  skillGroup: '技能',
  skillSelected: '已选用',
  optionUnavailable: (reason) => (reason ? `不可用：${reason}` : '不可用'),
  attachmentsLabel: '待发送的附件与引用',
  remove: (name) => `移除 ${name}`,
  retryUpload: (name) => `重试上传 ${name}`,
  uploading: '正在上传',
  uploadingName: (name) => `正在上传 ${name}`,
  uploadFailed: '上传失败',
  stale: '引用已失效',
  unavailable: '不可用',
  referenceLoading: '正在读取引用',
  referenceFailed: '引用读取失败',
  external: '工作区外',
  kind: { image: '图片', file: '文件', pdf: 'PDF', text: '文本', code: '代码', unknown: '未知类型' },
  referenceKind: { file: '文件', folder: '文件夹', skill: '技能', command: '命令', url: '链接', symbol: '符号', custom: '引用' },
  send: '发送',
  sending: '正在发送',
  stop: '停止生成',
  stopPending: '停止待确认',
  resultPending: '结果待确认',
  retrySameSend: '重试同一发送',
  retrySameStop: '重试同一停止',
  retrySave: '重试保存',
  draftSaving: '正在保存草稿',
  draftSaved: '草稿已保存',
  draftError: '草稿保存失败，内容仍保留在本机',
  submitFailed: '发送失败，草稿已保留',
  submitUnknown: '发送结果待确认，未重复发送',
  retry: '重试',
  emptyReason: '输入内容后才能发送',
  uploadingReason: '附件仍在上传',
  overLimitReason: '内容超出字数上限',
  submittingReason: '正在发送，请稍候',
  runningReason: '当前运行结束或停止后才能发送',
  characters: (count, max) => (max ? `字符 ${count} / ${max}` : `字符 ${count}`),
  dropFiles: '松开以添加文件',
  modelPlaceholder: '选择模型',
  modelTriggerLabel: (model, effort) => (effort ? `模型：${model}，思考强度：${effort}` : `模型：${model}`),
  modelPickerLabel: '模型与思考强度',
  effortHeading: '思考强度',
  effortNone: '此模型使用默认参数',
  effortNote: '仅影响这个对话的下一轮回答。',
  switchModel: '切换模型',
  modelHeading: '选择模型',
  back: '返回思考强度',
  modelsLoading: '正在读取模型…',
  modelsError: '模型列表读取失败',
  modelsEmpty: '没有可用的模型',
  effort: { off: '关闭', low: '快速', medium: '均衡', high: '深入', max: '最大' },
  capability: { image: '图片', video: '视频', tools: '工具', reasoning: '推理', 'long-context': '长上下文' },
  permissionTriggerLabel: (label) => `权限模式：${label}`,
  permissionMenu: '权限模式',
  permissionElevated: '需确认',
  permissionConfirmTitle: (label) => `启用「${label}」？`,
  permissionConfirmDescription: '此模式下文件写入与终端命令将自动执行，可能访问工作区外的文件、网络和系统资源。',
  permissionConfirm: (label) => `启用${label}`,
  noticeTone: { neutral: '说明：', info: '提示：', warning: '注意：', danger: '错误：' },
};

export const enComposer: AgentComposerMessages = {
  inputLabel: 'Message',
  placeholder: 'Write a message, @ to reference files, / for commands and skills',
  inputHint: 'Enter sends, Shift + Enter adds a line; type @ to reference files, / for commands or skills.',
  inputHintModEnter: 'Ctrl + Enter sends, Enter adds a line; type @ to reference files, / for commands or skills.',
  blockedPlaceholder: 'Answer the question above first',
  mentionTitle: 'Files and context',
  mentionKeys: '↑↓ move · Enter insert · Tab open folder · Esc close',
  mentionLoading: 'Loading suggestions…',
  mentionEmpty: 'No matching files',
  mentionError: 'Could not load suggestions',
  mentionRetry: 'Load again',
  mentionDrill: 'folder, Enter or Tab to open',
  commandTitle: 'Commands and skills',
  commandKeys: '↑↓ move · Enter choose · Esc close',
  commandLoading: 'Loading commands…',
  commandEmpty: 'No matching commands or skills',
  commandGroup: 'Commands',
  skillGroup: 'Skills',
  skillSelected: 'Selected',
  optionUnavailable: (reason) => (reason ? `Unavailable: ${reason}` : 'Unavailable'),
  attachmentsLabel: 'Attachments and references to send',
  remove: (name) => `Remove ${name}`,
  retryUpload: (name) => `Retry uploading ${name}`,
  uploading: 'Uploading',
  uploadingName: (name) => `Uploading ${name}`,
  uploadFailed: 'Upload failed',
  stale: 'Reference no longer valid',
  unavailable: 'Unavailable',
  referenceLoading: 'Loading reference',
  referenceFailed: 'Could not load reference',
  external: 'Outside workspace',
  kind: { image: 'Image', file: 'File', pdf: 'PDF', text: 'Text', code: 'Code', unknown: 'Unknown type' },
  referenceKind: { file: 'File', folder: 'Folder', skill: 'Skill', command: 'Command', url: 'Link', symbol: 'Symbol', custom: 'Reference' },
  send: 'Send',
  sending: 'Sending',
  stop: 'Stop generating',
  stopPending: 'Stop not yet confirmed',
  resultPending: 'Result not yet confirmed',
  retrySameSend: 'Retry the same send',
  retrySameStop: 'Retry the same stop',
  retrySave: 'Retry saving',
  draftSaving: 'Saving draft',
  draftSaved: 'Draft saved',
  draftError: 'Draft not saved; the text is still kept on this device',
  submitFailed: 'Send failed; the draft is kept',
  submitUnknown: 'Send result not confirmed; nothing was sent twice',
  retry: 'Retry',
  emptyReason: 'Type a message to send',
  uploadingReason: 'Attachments are still uploading',
  overLimitReason: 'The message is over the character limit',
  submittingReason: 'Sending, please wait',
  runningReason: 'You can send once the current run ends or is stopped',
  characters: (count, max) => (max ? `${count} / ${max} characters` : `${count} characters`),
  dropFiles: 'Drop to add files',
  modelPlaceholder: 'Choose a model',
  modelTriggerLabel: (model, effort) => (effort ? `Model: ${model}, reasoning effort: ${effort}` : `Model: ${model}`),
  modelPickerLabel: 'Model and reasoning effort',
  effortHeading: 'Reasoning effort',
  effortNone: 'This model uses its default settings',
  effortNote: 'Applies to the next reply in this conversation only.',
  switchModel: 'Switch model',
  modelHeading: 'Choose a model',
  back: 'Back to reasoning effort',
  modelsLoading: 'Loading models…',
  modelsError: 'Could not load models',
  modelsEmpty: 'No models available',
  effort: { off: 'Off', low: 'Fast', medium: 'Balanced', high: 'Deep', max: 'Max' },
  capability: { image: 'Images', video: 'Video', tools: 'Tools', reasoning: 'Reasoning', 'long-context': 'Long context' },
  permissionTriggerLabel: (label) => `Permission mode: ${label}`,
  permissionMenu: 'Permission mode',
  permissionElevated: 'Needs confirmation',
  permissionConfirmTitle: (label) => `Turn on “${label}”?`,
  permissionConfirmDescription: 'File writes and terminal commands will run automatically and may reach files, network and system resources outside the workspace.',
  permissionConfirm: (label) => `Turn on ${label}`,
  noticeTone: { neutral: 'Note:', info: 'Info:', warning: 'Warning:', danger: 'Error:' },
};
