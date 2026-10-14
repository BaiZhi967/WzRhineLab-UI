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

/**
 * Reasoning-effort level of a model. The six built-in levels have localised copy in
 * `@wzrhine/agent`; adapters may use any other string (vendor tiers, numeric levels) and supply
 * labels through `ModelEffortOption.label`, the ModelPicker `effortLabels` prop or the
 * `composer.effort` message table (ADR-0013 §1).
 */
export type ModelEffort = 'off' | 'low' | 'medium' | 'high' | 'max' | 'xhigh' | (string & {});

/** The effort levels `@wzrhine/agent` ships copy for. */
export type KnownModelEffort = 'off' | 'low' | 'medium' | 'high' | 'max' | 'xhigh';

/** An effort choice carrying its own copy; beats the message table. */
export interface ModelEffortOption {
  id: ModelEffort;
  label?: string;
  /** Longer hint shown under the label (Radio description). */
  description?: string;
}

/** Model capabilities the library ships copy for; any other string renders as-is (ADR-0013 §2). */
export type ModelCapability = 'image' | 'video' | 'tools' | 'reasoning' | 'long-context';

export interface ModelOptionView {
  id: string;
  label: string;
  providerId: string;
  description?: string;
  capabilities?: (ModelCapability | (string & {}))[];
  /** Effort levels this model accepts: bare ids (copy from the message table) or labelled options. */
  efforts?: (ModelEffort | ModelEffortOption)[];
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
