import type { ActionStatus } from './status.js';

/**
 * Actions and capabilities (ADR-0011 §4). Components emit intent; the consumer adapter decides
 * whether it was accepted. A capability without a callback is never rendered as a button.
 */

/** Identity of one user action. `actionId` is reused when retrying the same unknown action. */
export interface AgentActionContext {
  actionId: string;
  /** What the action targets: message, operation, questionnaire, terminal… */
  targetId: string;
  /** Revision the user was looking at. The adapter rejects stale actions with it. */
  baseRevision?: string;
}

export type AgentActionResult =
  | { status: 'accepted'; revision?: string }
  | { status: 'rejected'; reason: string; code?: string }
  | { status: 'unknown'; retryable: boolean; reason?: string };

/** Sync or async action callback. */
export type AgentActionHandler<Args extends unknown[] = []> = (
  ...args: Args
) => AgentActionResult | void | Promise<AgentActionResult | void>;

/** A capability flag with an optional reason shown when it is unavailable. */
export interface Capability {
  enabled: boolean;
  /** Read out and shown as hint text when `enabled` is false. */
  reason?: string;
}

/** Normalised capability: `true` / `false` / `{ enabled, reason }`. */
export type CapabilityInput = boolean | Capability;

/** Receipt of the most recent action against an object, shown next to its controls. */
export interface ActionReceipt {
  status: ActionStatus;
  actionId?: string;
  /** Message for `rejected` / `unknown`. */
  reason?: string;
  /** For `unknown`: whether retrying the same action is safe. */
  retryable?: boolean;
  at?: string;
}
