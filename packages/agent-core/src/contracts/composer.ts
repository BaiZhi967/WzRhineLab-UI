import type { AttachmentView, ReferenceView } from './conversation.js';
import type { ActionStatus, DraftStatus } from './status.js';

/**
 * Composer, picker and command view-models (ADR-0011 §8). A real textarea owns IME, selection
 * and undo; tokens in the text are marked with Unicode isolates (see `composer-tokens`).
 */

export interface SendInput {
  /** Readable text: tokens converted back to `@name` / `/name`. */
  text: string;
  /** Raw value including token markers. */
  raw: string;
  references: ReferenceView[];
  attachments: AttachmentView[];
}

export interface ComposerState {
  value: string;
  draftStatus?: DraftStatus;
  submitStatus?: ActionStatus;
  attachments?: AttachmentView[];
  references?: ReferenceView[];
}

export type TriggerChar = '@' | '/';

export interface MentionOption {
  id: string;
  label: string;
  /** Path / description, matched and shown dimmed. */
  detail?: string;
  kind: ReferenceView['kind'];
  /** Folders can be drilled into instead of inserted. */
  drillable?: boolean;
  disabled?: boolean;
  disabledReason?: string;
  group?: string;
}

export interface CommandOption {
  id: string;
  /** Inserted / dispatched name without the slash. */
  name: string;
  label: string;
  description?: string;
  kind: 'command' | 'skill' | 'action';
  aliases?: string[];
  shortcut?: string;
  disabled?: boolean;
  disabledReason?: string;
  selected?: boolean;
  group?: string;
}

export type ModelEffort = 'off' | 'low' | 'medium' | 'high' | 'max' | 'xhigh';

export interface ModelOptionView {
  id: string;
  label: string;
  providerId: string;
  description?: string;
  capabilities?: ('image' | 'video' | 'tools' | 'reasoning' | 'long-context')[];
  efforts?: ModelEffort[];
  disabled?: boolean;
  unavailableReason?: string;
}

export interface ModelProviderView {
  id: string;
  label: string;
  disabled?: boolean;
  unavailableReason?: string;
  models: ModelOptionView[];
}

export interface PermissionModeView {
  id: string;
  label: string;
  description?: string;
  /** `elevated` modes (full access) ask for confirmation before switching. */
  risk?: 'normal' | 'elevated';
}
