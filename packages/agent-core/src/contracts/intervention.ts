import type { ActionReceipt } from './actions.js';
import type { ActionStatus, DraftStatus } from './status.js';
import type { FileDiffView, ToolCallView } from './tools.js';

/**
 * Approval and questionnaire view-models (ADR-0011 §6). Approval needs complete, verified material
 * to be approvable; reject always works. A questionnaire collects information and never grants
 * permission. Unknown receipts keep the same revision and answers so the adapter can reconcile.
 */

export type ApprovalStatus = 'waiting' | 'material-loading' | 'unavailable' | 'submitting' | 'unknown' | 'approved' | 'rejected' | 'expired';

export type ApprovalRisk = 'low' | 'medium' | 'high';

export interface ApprovalEvidenceView {
  id: string;
  label: string;
  /** Plain text, code or JSON shown verbatim. */
  value: string;
  format?: 'text' | 'code' | 'json' | 'path';
}

/** Approval scopes the host offers. `once` is the default; `session` only when the host allows it. */
export type ApprovalScope = 'once' | 'session';

export interface ApprovalView {
  operationId: string;
  revision: string;
  status: ApprovalStatus;
  /** Tool being approved; used for the heading and subject. */
  tool: Pick<ToolCallView, 'name' | 'displayName' | 'subject' | 'category' | 'detail'>;
  /** What the operation does, one sentence. */
  summary: string;
  /** Why approval is needed ("修改代码文件", "调用远端服务"). */
  reason?: string;
  risk?: ApprovalRisk;
  /** What can change: "1 个文件 · 工作区内". */
  scope?: string;
  /** Irreversible effects named explicitly ("删除后不能自动恢复"). */
  irreversible?: string;
  /** The operation is not sandboxed. */
  unsandboxed?: boolean;
  evidence?: ApprovalEvidenceView[];
  diff?: FileDiffView;
  /** Adapter verdict on the material. Approve is disabled unless `allowed`. */
  availability: { allowed: boolean; reason?: string };
  /** Scopes offered for approval; default `['once']`. */
  scopes?: ApprovalScope[];
  expiresAt?: string;
  receipt?: ActionReceipt;
}

/** A standing permission the user granted (session trust, extra directory access). */
export interface GrantView {
  id: string;
  /** Command, directory or task the grant covers (shown verbatim). */
  target: string;
  detail?: string;
  /** "本次会话", "额外读写"… */
  scopeLabel: string;
  /** Still usable; `false` shows `reason` and offers re-selection by the host. */
  available: boolean;
  reason?: string;
  receipt?: ActionReceipt;
}

export type QuestionKind = 'single' | 'multiple' | 'text';

export interface QuestionOptionView {
  id: string;
  label: string;
  description?: string;
}

export interface QuestionView {
  id: string;
  kind: QuestionKind;
  title: string;
  prompt?: string;
  options?: QuestionOptionView[];
  /** Offer a free-text "other" answer for choice questions. */
  allowCustom?: boolean;
  /** May be skipped. Default true. */
  optional?: boolean;
  /** Max characters (code points) for text answers. */
  maxLength?: number;
}

export interface QuestionAnswer {
  questionId: string;
  /** Chosen option ids (single: at most one). */
  optionIds?: string[];
  /** Text answer or the custom "other" text. */
  text?: string;
  skipped?: boolean;
}

export type QuestionnaireStatus = 'waiting' | 'drafting' | 'saving' | 'submit-pending' | 'unknown' | 'completed' | 'expired' | 'interrupted';

export interface QuestionnaireView {
  id: string;
  revision: string;
  title?: string;
  status: QuestionnaireStatus;
  questions: QuestionView[];
  answers: QuestionAnswer[];
  draftStatus: DraftStatus;
  submitStatus: ActionStatus;
  receipt?: ActionReceipt;
}
