import { canStopRun, encodeToken } from '@wzrhine/agent-core';
import type { ActionStatus, CommandOption, DraftStatus, MentionOption, RunStatus, TriggerChar } from '@wzrhine/agent-core';

/*
 * Pure helpers for the composer family (no React). Hosts may use the filters for local option
 * lists; remote lists are filtered by the host in `onMentionQuery` / `onCommandQuery`.
 */

/** DOM id of option `index` in the listbox `listboxId` (used by aria-activedescendant). */
export function menuOptionId(listboxId: string, index: number): string {
  return `${listboxId}-option-${index}`;
}

/**
 * Next active index for ↑ / ↓. Clamped at both ends (no wrap-around), so holding a key never
 * jumps from the last option back to the first. Disabled options stay reachable: their reason is
 * read out when active. Returns -1 for an empty list.
 */
export function moveActiveIndex(count: number, index: number, delta: number): number {
  if (count <= 0) return -1;
  if (index < 0) return delta > 0 ? 0 : count - 1;
  return Math.max(0, Math.min(count - 1, index + delta));
}

/** Splits an `@` query into the drilled folder prefix (`src/components/`) and the filter (`but`). */
export function splitMentionQuery(query: string): { directory: string; filter: string } {
  const slash = query.lastIndexOf('/');
  return slash === -1 ? { directory: '', filter: query } : { directory: query.slice(0, slash + 1), filter: query.slice(slash + 1) };
}

/** Query after drilling into a folder option: `src/` + `components/`. */
export function drillQuery(query: string, option: MentionOption): string {
  return `${splitMentionQuery(query).directory}${option.label}/`;
}

/** Default token name for a mention: the drilled folder prefix + the option label (`src/agent.ts`). */
export function defaultMentionTokenName(option: MentionOption, query: string): string {
  return `${splitMentionQuery(query).directory}${option.label}`;
}

/** Case-insensitive filter over label and detail, using the filter part of the query. */
export function filterMentionOptions(options: readonly MentionOption[], query: string): MentionOption[] {
  const needle = splitMentionQuery(query).filter.toLowerCase();
  if (!needle) return [...options];
  return options.filter((o) => o.label.toLowerCase().includes(needle) || (o.detail ?? '').toLowerCase().includes(needle));
}

/** Matches name, aliases, label and description; exact name / alias matches come first. */
export function filterCommandOptions(options: readonly CommandOption[], query: string): CommandOption[] {
  const needle = query.toLowerCase();
  if (!needle) return [...options];
  const hits = options.filter((o) =>
    [o.name, o.label, o.description ?? '', ...(o.aliases ?? [])].some((text) => text.toLowerCase().includes(needle)),
  );
  const exact = (o: CommandOption) => o.name.toLowerCase() === needle || (o.aliases ?? []).some((a) => a.toLowerCase() === needle);
  return [...hits.filter(exact), ...hits.filter((o) => !exact(o))];
}

/** Commands (and actions) first, then skills, keeping the host order inside each kind. */
export function orderCommandOptions(options: readonly CommandOption[]): CommandOption[] {
  return [...options.filter((o) => o.kind !== 'skill'), ...options.filter((o) => o.kind === 'skill')];
}

export interface OptionGroup<T> {
  key: string;
  label: string | undefined;
  items: Array<{ option: T; index: number }>;
}

/** Groups consecutive options by `group(option)`, keeping their flat index for keyboard state. */
export function groupOptions<T>(options: readonly T[], group: (option: T) => string | undefined): OptionGroup<T>[] {
  const groups: OptionGroup<T>[] = [];
  options.forEach((option, index) => {
    const label = group(option);
    const last = groups[groups.length - 1];
    if (last && last.label === label) last.items.push({ option, index });
    else groups.push({ key: `${groups.length}-${label ?? ''}`, label, items: [{ option, index }] });
  });
  return groups;
}

/** Removes every `trigger + name` token (and one adjacent space) from a value. */
export function removeTokens(value: string, trigger: TriggerChar, name: string): string {
  const token = encodeToken(trigger, name);
  let out = value;
  for (;;) {
    const at = out.indexOf(token);
    if (at === -1) return out;
    let start = at;
    let end = at + token.length;
    if (out[end] === ' ') end += 1;
    else if (start > 0 && out[start - 1] === ' ') start -= 1;
    out = out.slice(0, start) + out.slice(end);
  }
}

/** Thumbnails are only drawn from `data:image/`, `blob:` or same-origin URLs handed in by the host. */
export function isSafeThumbnail(url: string | undefined, origin?: string): boolean {
  if (!url) return false;
  if (/^data:image\//i.test(url) || /^blob:/i.test(url)) return true;
  if (/^[a-z][a-z\d+.-]*:/i.test(url) || url.startsWith('//')) {
    if (!origin) return false;
    try {
      return new URL(url).origin === origin;
    } catch {
      return false;
    }
  }
  // Relative URL: same origin by definition.
  return true;
}

/** Visible state of the persistent send / stop button (ADR-0011 §3–4). */
export type SendStopState =
  | 'send'
  | 'sending'
  | 'send-unknown'
  | 'retry-save'
  | 'stop'
  | 'stop-pending'
  | 'stop-unknown';

export interface SendStopInput {
  canSend: boolean;
  /** Explicit mode; otherwise derived from `runStatus`. */
  mode?: 'send' | 'stop';
  runStatus?: RunStatus;
  /** Receipt of the last send. */
  sendStatus?: ActionStatus;
  /** Receipt of the last stop request. */
  stopStatus?: ActionStatus;
  draftStatus?: DraftStatus;
  hasSend: boolean;
  hasStop: boolean;
  hasRetry: boolean;
  /** From the unknown receipt: whether retrying the same action is safe (default true). */
  retryable?: boolean;
  hasRetrySave: boolean;
}

export interface SendStopResolved {
  state: SendStopState;
  /** Whether activating the button does something right now. */
  enabled: boolean;
  /** Which callback an activation calls. */
  action: 'send' | 'stop' | 'retry' | 'retry-save' | null;
  /** Icon shown: arrow or square. */
  icon: 'send' | 'stop';
}

/**
 * Decides the button state. "Stop sent" ≠ "stopped": while the run is `cancelling` or the stop
 * request is in flight / accepted but the run still runs, the button is `stop-pending` (inert).
 * Unknown receipts never look like success and never create a new action: they offer the retry
 * callback (same actionId, host-owned) when it is safe, otherwise stay inert.
 */
export function resolveSendStop(input: SendStopInput): SendStopResolved {
  const stoppable =
    input.mode === 'stop' || (input.mode === undefined && input.runStatus !== undefined && (canStopRun(input.runStatus) || input.runStatus === 'cancelling'));
  if (stoppable && (input.hasStop || input.runStatus === 'cancelling' || input.stopStatus !== undefined)) {
    if (input.runStatus === 'cancelling' || input.stopStatus === 'submitting' || input.stopStatus === 'accepted') {
      return { state: 'stop-pending', enabled: false, action: null, icon: 'stop' };
    }
    if (input.stopStatus === 'unknown') {
      const canRetry = input.hasRetry && input.retryable !== false;
      return { state: 'stop-unknown', enabled: canRetry, action: canRetry ? 'retry' : null, icon: 'stop' };
    }
    return { state: 'stop', enabled: input.hasStop, action: input.hasStop ? 'stop' : null, icon: 'stop' };
  }
  if (input.sendStatus === 'submitting') return { state: 'sending', enabled: false, action: null, icon: 'send' };
  if (input.sendStatus === 'unknown') {
    const canRetry = input.hasRetry && input.retryable !== false;
    return { state: 'send-unknown', enabled: canRetry, action: canRetry ? 'retry' : null, icon: 'send' };
  }
  if (input.draftStatus === 'error' && input.hasRetrySave) return { state: 'retry-save', enabled: true, action: 'retry-save', icon: 'send' };
  const enabled = input.canSend && input.hasSend && !stoppable;
  return { state: 'send', enabled, action: enabled ? 'send' : null, icon: 'send' };
}
