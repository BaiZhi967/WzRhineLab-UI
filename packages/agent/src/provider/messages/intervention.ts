import type { ApprovalRisk, ApprovalStatus, DraftStatus, FileDiffView, QuestionnaireStatus, RecoveryView } from '@wzrhine/agent-core';

/**
 * Copy for the intervention family (ADR-0011 §6, §10): ApprovalPanel, QuestionnaireCard,
 * ErrorRecoveryNotice, InterventionDock. Keys are flat (prefix = component) so a partial
 * override through `AgentMessagesProvider` replaces single strings, not whole groups.
 */
export interface AgentInterventionMessages {
  // ---------- ApprovalPanel ----------
  /** Eyebrow above the title: operation id in mono. */
  approvalOperation: (operationId: string) => string;
  approvalStatus: Record<ApprovalStatus, string>;
  approvalRisk: Record<ApprovalRisk, string>;
  approvalSubject: string;
  approvalScope: string;
  approvalExpires: string;
  approvalIrreversibleTitle: string;
  approvalUnsandboxedTitle: string;
  approvalUnsandboxed: string;
  approvalEvidence: string;
  approvalEvidenceToggle: (count: number) => string;
  approvalMaterialLoading: string;
  approvalUnavailable: string;
  approvalUnavailableHint: string;
  approvalRetryMaterial: string;
  approvalRejectNote: string;
  approvalReject: string;
  approvalAllowOnce: string;
  approvalAllowSession: string;
  /** Default reason when `availability.allowed` is false without a reason. */
  approvalNotAllowed: string;
  /** Why "allow" is off in states other than waiting. */
  approvalAllowBlocked: Partial<Record<ApprovalStatus, string>>;
  approvalSubmitting: string;
  approvalUnknownTitle: string;
  approvalUnknownBody: string;
  approvalUnknownNotRetryable: string;
  approvalRetrySubmit: string;
  approvalApproved: string;
  approvalApprovedSession: string;
  approvalRejected: string;
  approvalExpiredTitle: string;
  approvalExpiredBody: string;
  approvalRefresh: string;
  approvalReceiptAt: (time: string) => string;

  // ---------- internal diff ----------
  diffLabel: (path: string) => string;
  diffChange: Record<FileDiffView['change'], string>;
  diffStats: (additions: number, deletions: number) => string;
  diffAdded: string;
  diffRemoved: string;
  diffTruncated: string;
  diffBinary: string;
  diffEmpty: string;

  // ---------- QuestionnaireCard ----------
  questionTitle: string;
  questionFormLabel: string;
  questionProgress: (answered: number, total: number) => string;
  questionPager: string;
  questionNext: string;
  questionPagePrev: string;
  questionPageNext: string;
  questionDot: (index: number, state: 'answered' | 'skipped' | 'unanswered') => string;
  questionPageNo: (page: number, total: number) => string;
  questionOther: string;
  questionOtherDescription: string;
  questionOtherInput: (title: string) => string;
  questionPlaceholder: string;
  questionRequired: string;
  questionCount: (current: number, max: number) => string;
  questionOverLimit: (title: string) => string;
  questionSkip: string;
  questionUndoSkip: string;
  questionSkipped: string;
  questionSubmit: string;
  questionRetrySubmit: string;
  questionConfirm: (unanswered: number) => string;
  questionRequiredMissing: (count: number) => string;
  questionBack: string;
  questionSkipAndSubmit: string;
  questionHintChoice: (last: boolean) => string;
  questionHintText: string;
  questionDraft: Record<DraftStatus, string>;
  questionRetrySave: string;
  questionSubmitting: string;
  questionUnknownTitle: string;
  questionUnknownBody: string;
  questionRejected: string;
  questionStatus: Record<QuestionnaireStatus, string>;
  questionSummaryTitle: Record<'completed' | 'expired' | 'interrupted', string>;
  questionSummarySkipped: string;
  questionSummaryUnanswered: string;
  questionSummaryUnansweredInterrupted: string;
  questionCopy: string;
  /** Separator between chosen option labels in the summary. */
  questionJoin: string;
  questionNeverGrants: string;

  // ---------- ErrorRecoveryNotice ----------
  recoveryKind: Record<RecoveryView['kind'], string>;
  /** Fixed consequence sentence per kind; empty string = none. */
  recoveryNote: Record<RecoveryView['kind'], string>;
  recoveryPreserved: string;
  recoveryCode: string;
  recoveryDismiss: string;

  // ---------- InterventionDock ----------
  dockLabel: string;
  dockMore: (count: number) => string;
}

export const zhIntervention: AgentInterventionMessages = {
  approvalOperation: (id) => `OPERATION / #${id}`,
  approvalStatus: {
    waiting: '等待批准',
    'material-loading': '正在读取材料',
    unavailable: '材料不可用',
    submitting: '提交中',
    unknown: '结果待确认',
    approved: '已允许',
    rejected: '已拒绝',
    expired: '已过期',
  },
  approvalRisk: { low: '低风险', medium: '中风险', high: '高风险' },
  approvalSubject: '操作对象',
  approvalScope: '影响范围',
  approvalExpires: '有效期至',
  approvalIrreversibleTitle: '不可撤销',
  approvalUnsandboxedTitle: '不在沙箱中运行',
  approvalUnsandboxed: '此操作可能访问工作区外的文件、网络和系统资源，权限等同于当前系统用户。',
  approvalEvidence: '审批依据',
  approvalEvidenceToggle: (n) => `查看审批依据（${n} 项）`,
  approvalMaterialLoading: '正在读取完整审批内容…',
  approvalUnavailable: '完整审批内容暂不可用',
  approvalUnavailableHint: '仍可拒绝；允许需要完整、已核验的材料。',
  approvalRetryMaterial: '重新读取审批内容',
  approvalRejectNote: '拒绝会作为真实工具错误交回模型。',
  approvalReject: '拒绝',
  approvalAllowOnce: '允许一次',
  approvalAllowSession: '本次会话信任此任务',
  approvalNotAllowed: '审批材料尚未核验，暂不能允许。',
  approvalAllowBlocked: {
    'material-loading': '完整审批内容读取完成后才能允许。',
    unavailable: '完整审批内容不可用，不能允许。',
    submitting: '正在提交决定。',
    unknown: '上一次决定的结果待确认，不能发起新的允许。',
  },
  approvalSubmitting: '正在提交决定…',
  approvalUnknownTitle: '结果待确认',
  approvalUnknownBody: '决定可能已送达，也可能没有。重试会使用同一动作编号，不会重复执行。',
  approvalUnknownNotRetryable: '决定可能已送达。重试不安全，请等待状态同步。',
  approvalRetrySubmit: '重试提交',
  approvalApproved: '已允许此操作',
  approvalApprovedSession: '已允许，本次会话信任此任务',
  approvalRejected: '已拒绝，结果已作为工具错误交回模型',
  approvalExpiredTitle: '授权已过期',
  approvalExpiredBody: '此请求已失效，不能再批准。如仍需执行，需要 Agent 重新发起。',
  approvalRefresh: '刷新审批状态',
  approvalReceiptAt: (time) => `记录于 ${time}`,

  diffLabel: (path) => `${path} 的变更`,
  diffChange: { add: '新建', delete: '删除', update: '修改', move: '移动' },
  diffStats: (a, d) => `+${a} −${d}`,
  diffAdded: '新增',
  diffRemoved: '删除',
  diffTruncated: '部分行未显示',
  diffBinary: '二进制文件，无法预览内容',
  diffEmpty: '没有可显示的行',

  questionTitle: '需要你的回答',
  questionFormLabel: '回答问题',
  questionProgress: (a, n) => `已答 ${a} / ${n}`,
  questionPager: '问题分页',
  questionNext: '下一题',
  questionPagePrev: '上一页',
  questionPageNext: '下一页',
  questionDot: (i, s) => `第 ${i} 题，${s === 'answered' ? '已回答' : s === 'skipped' ? '已跳过' : '未回答'}`,
  questionPageNo: (p, n) => `${p} / ${n}`,
  questionOther: '其他',
  questionOtherDescription: '自己填写回答',
  questionOtherInput: (title) => `${title}：其他回答`,
  questionPlaceholder: '输入你的回答',
  questionRequired: '必答',
  questionCount: (c, m) => `已输入 ${c} / ${m}`,
  questionOverLimit: (title) => `「${title}」超出字数上限`,
  questionSkip: '跳过本题',
  questionUndoSkip: '撤销跳过',
  questionSkipped: '已跳过此题',
  questionSubmit: '提交回答',
  questionRetrySubmit: '重试提交相同答案',
  questionConfirm: (n) => `还有 ${n} 题未回答，将按跳过提交。`,
  questionRequiredMissing: (n) => `还有 ${n} 道必答题未回答。`,
  questionBack: '返回填写',
  questionSkipAndSubmit: '跳过并提交',
  questionHintChoice: (last) => `数字键选择 · Enter ${last ? '提交' : '下一题'}`,
  questionHintText: 'Ctrl + Enter 提交',
  questionDraft: { clean: '', dirty: '有未保存的修改', saving: '正在保存草稿…', saved: '草稿已保存', error: '草稿保存失败' },
  questionRetrySave: '重试保存草稿',
  questionSubmitting: '正在提交回答…',
  questionUnknownTitle: '提交结果待确认',
  questionUnknownBody: '回答可能已送达。重试会提交相同的答案与版本，不会重复记录。',
  questionRejected: '回答未被接受',
  questionStatus: {
    waiting: '等待回答',
    drafting: '填写中',
    saving: '保存中',
    'submit-pending': '提交中',
    unknown: '结果待确认',
    completed: '已提交',
    expired: '已过期',
    interrupted: '已中断',
  },
  questionSummaryTitle: { completed: '已提交回答', expired: '问卷已过期', interrupted: '运行已中断，问卷未提交' },
  questionSummarySkipped: '已跳过',
  questionSummaryUnanswered: '未回答',
  questionSummaryUnansweredInterrupted: '未回答（已中断）',
  questionCopy: '复制回答',
  questionJoin: '、',
  questionNeverGrants: '问卷只收集信息，不授予任何工具权限。',

  recoveryKind: {
    retryable: '可重试',
    'save-pending': '保存未完成',
    'cancel-unconfirmed': '停止未确认',
    'tool-side-effects': '可能已有副作用',
    timeout: '已超时',
    offline: '已离线',
    unknown: '状态未知',
    resolved: '已恢复',
  },
  recoveryNote: {
    retryable: '',
    'save-pending': '重试保存不会再次调用模型。',
    'cancel-unconfirmed': '停止尚未确认，工具可能仍在运行。',
    'tool-side-effects': '工具可能已产生外部影响，不会自动重放。',
    timeout: '',
    offline: '',
    unknown: '结果尚未确认，请先核对状态。',
    resolved: '',
  },
  recoveryPreserved: '已保留：',
  recoveryCode: '错误代码',
  recoveryDismiss: '关闭提示',

  dockLabel: '待处理的干预',
  dockMore: (n) => `还有 ${n} 个待处理`,
};

export const enIntervention: AgentInterventionMessages = {
  approvalOperation: (id) => `OPERATION / #${id}`,
  approvalStatus: {
    waiting: 'Awaiting approval',
    'material-loading': 'Loading material',
    unavailable: 'Material unavailable',
    submitting: 'Submitting',
    unknown: 'Result unconfirmed',
    approved: 'Allowed',
    rejected: 'Rejected',
    expired: 'Expired',
  },
  approvalRisk: { low: 'Low risk', medium: 'Medium risk', high: 'High risk' },
  approvalSubject: 'Target',
  approvalScope: 'Scope',
  approvalExpires: 'Valid until',
  approvalIrreversibleTitle: 'Irreversible',
  approvalUnsandboxedTitle: 'Not sandboxed',
  approvalUnsandboxed: 'This operation may reach files outside the workspace, the network and system resources with your user permissions.',
  approvalEvidence: 'Evidence',
  approvalEvidenceToggle: (n) => `Show evidence (${n})`,
  approvalMaterialLoading: 'Loading the full approval material…',
  approvalUnavailable: 'The full approval material is unavailable',
  approvalUnavailableHint: 'You can still reject; allowing needs complete, verified material.',
  approvalRetryMaterial: 'Reload approval material',
  approvalRejectNote: 'Rejecting returns a real tool error to the model.',
  approvalReject: 'Reject',
  approvalAllowOnce: 'Allow once',
  approvalAllowSession: 'Trust this task for the session',
  approvalNotAllowed: 'The material has not been verified yet.',
  approvalAllowBlocked: {
    'material-loading': 'You can allow once the full material has loaded.',
    unavailable: 'The full material is unavailable, so it cannot be allowed.',
    submitting: 'Submitting your decision.',
    unknown: 'The previous decision is unconfirmed; no new approval can be sent.',
  },
  approvalSubmitting: 'Submitting decision…',
  approvalUnknownTitle: 'Result unconfirmed',
  approvalUnknownBody: 'The decision may or may not have arrived. Retrying reuses the same action id and will not run twice.',
  approvalUnknownNotRetryable: 'The decision may have arrived. Retrying is not safe; wait for the state to sync.',
  approvalRetrySubmit: 'Retry submit',
  approvalApproved: 'Operation allowed',
  approvalApprovedSession: 'Allowed and trusted for this session',
  approvalRejected: 'Rejected; returned to the model as a tool error',
  approvalExpiredTitle: 'Approval expired',
  approvalExpiredBody: 'This request is no longer valid. The agent has to ask again.',
  approvalRefresh: 'Refresh approval state',
  approvalReceiptAt: (time) => `Recorded ${time}`,

  diffLabel: (path) => `Changes to ${path}`,
  diffChange: { add: 'New', delete: 'Delete', update: 'Edit', move: 'Move' },
  diffStats: (a, d) => `+${a} −${d}`,
  diffAdded: 'Added',
  diffRemoved: 'Removed',
  diffTruncated: 'Some lines are not shown',
  diffBinary: 'Binary file; no preview',
  diffEmpty: 'No lines to show',

  questionTitle: 'Your answer is needed',
  questionFormLabel: 'Answer questions',
  questionProgress: (a, n) => `${a} / ${n} answered`,
  questionPager: 'Question pages',
  questionNext: 'Next question',
  questionPagePrev: 'Previous page',
  questionPageNext: 'Next page',
  questionDot: (i, s) => `Question ${i}, ${s}`,
  questionPageNo: (p, n) => `${p} / ${n}`,
  questionOther: 'Other',
  questionOtherDescription: 'Write your own answer',
  questionOtherInput: (title) => `${title}: other answer`,
  questionPlaceholder: 'Type your answer',
  questionRequired: 'Required',
  questionCount: (c, m) => `${c} / ${m} characters`,
  questionOverLimit: (title) => `"${title}" is over the length limit`,
  questionSkip: 'Skip question',
  questionUndoSkip: 'Undo skip',
  questionSkipped: 'Question skipped',
  questionSubmit: 'Submit answers',
  questionRetrySubmit: 'Retry with the same answers',
  questionConfirm: (n) => `${n} question${n === 1 ? '' : 's'} unanswered; they will be submitted as skipped.`,
  questionRequiredMissing: (n) => `${n} required question${n === 1 ? ' is' : 's are'} unanswered.`,
  questionBack: 'Back to answers',
  questionSkipAndSubmit: 'Skip and submit',
  questionHintChoice: (last) => `Number keys choose · Enter ${last ? 'submits' : 'goes next'}`,
  questionHintText: 'Ctrl + Enter submits',
  questionDraft: { clean: '', dirty: 'Unsaved changes', saving: 'Saving draft…', saved: 'Draft saved', error: 'Draft not saved' },
  questionRetrySave: 'Retry saving draft',
  questionSubmitting: 'Submitting answers…',
  questionUnknownTitle: 'Submission unconfirmed',
  questionUnknownBody: 'Your answers may have arrived. Retrying sends the same answers and revision.',
  questionRejected: 'Answers not accepted',
  questionStatus: {
    waiting: 'Awaiting answer',
    drafting: 'Drafting',
    saving: 'Saving',
    'submit-pending': 'Submitting',
    unknown: 'Result unconfirmed',
    completed: 'Submitted',
    expired: 'Expired',
    interrupted: 'Interrupted',
  },
  questionSummaryTitle: { completed: 'Answers submitted', expired: 'Questionnaire expired', interrupted: 'Run interrupted; not submitted' },
  questionSummarySkipped: 'Skipped',
  questionSummaryUnanswered: 'Not answered',
  questionSummaryUnansweredInterrupted: 'Not answered (interrupted)',
  questionCopy: 'Copy answers',
  questionJoin: ', ',
  questionNeverGrants: 'Questionnaires collect information only; they never grant tool permissions.',

  recoveryKind: {
    retryable: 'Retryable',
    'save-pending': 'Save pending',
    'cancel-unconfirmed': 'Stop unconfirmed',
    'tool-side-effects': 'Possible side effects',
    timeout: 'Timed out',
    offline: 'Offline',
    unknown: 'Unknown state',
    resolved: 'Resolved',
  },
  recoveryNote: {
    retryable: '',
    'save-pending': 'Retrying the save does not call the model again.',
    'cancel-unconfirmed': 'Stop is not confirmed; the tool may still be running.',
    'tool-side-effects': 'The tool may have had external effects; it will not be replayed automatically.',
    timeout: '',
    offline: '',
    unknown: 'The result is unconfirmed; check the state first.',
    resolved: '',
  },
  recoveryPreserved: 'Kept:',
  recoveryCode: 'Error code',
  recoveryDismiss: 'Dismiss',

  dockLabel: 'Pending interventions',
  dockMore: (n) => `${n} more pending`,
};
