import type { TriggerChar } from '../contracts/composer.js';

/**
 * Composer token encoding (ADR-0011 §8). A token is `FSI + trigger + name + PDI`
 * (U+2068 … U+2069): invisible, zero-width isolates that survive copy, undo and IME in a real
 * textarea. The mirror layer styles the same ranges; bindings (which file / skill) live in the
 * composer state, the text only records positions.
 */

export const TOKEN_OPEN = '\u2068';
export const TOKEN_CLOSE = '\u2069';

export interface ComposerToken {
  trigger: TriggerChar;
  name: string;
  /** Index of TOKEN_OPEN. */
  start: number;
  /** Index after TOKEN_CLOSE. */
  end: number;
}

/** `/` or `@` + name; token names may contain spaces but never isolate characters. */
const TOKEN_RE = /\u2068([@/])([^\u2068\u2069]+?)\u2069/g;

export function encodeToken(trigger: TriggerChar, name: string): string {
  return `${TOKEN_OPEN}${trigger}${name.replace(/[\u2068\u2069]/g, '')}${TOKEN_CLOSE}`;
}

export function parseTokens(value: string): ComposerToken[] {
  const tokens: ComposerToken[] = [];
  for (const match of value.matchAll(TOKEN_RE)) {
    tokens.push({ trigger: match[1] as TriggerChar, name: match[2]!, start: match.index!, end: match.index! + match[0].length });
  }
  return tokens;
}

/** Readable text for sending: isolates removed, tokens become `@name` / `/name`. */
export function toPlainText(value: string): string {
  return stripStray(value).replace(TOKEN_RE, (_, trigger: string, name: string) => `${trigger}${name}`);
}

/** Remove isolate characters that no longer belong to a complete token (after partial edits). */
export function stripStray(value: string): string {
  const tokens = parseTokens(value);
  let out = '';
  let cursor = 0;
  for (const token of tokens) {
    out += value.slice(cursor, token.start).replace(/[\u2068\u2069]/g, '');
    out += value.slice(token.start, token.end);
    cursor = token.end;
  }
  return out + value.slice(cursor).replace(/[\u2068\u2069]/g, '');
}

export interface EditResult {
  value: string;
  caret: number;
}

/**
 * Insert a token at `[from, to)` (usually the typed `@query`), padding with spaces so it never
 * glues to neighbouring words. Returns the new value and caret (after the trailing space).
 */
export function insertToken(value: string, from: number, to: number, trigger: TriggerChar, name: string): EditResult {
  const before = value.slice(0, from);
  const after = value.slice(to);
  const lead = before.length > 0 && !/\s$/.test(before) ? ' ' : '';
  const trail = after.startsWith(' ') ? '' : ' ';
  const token = encodeToken(trigger, name);
  const next = `${before}${lead}${token}${trail}${after}`;
  return { value: next, caret: before.length + lead.length + token.length + 1 };
}

/** If `caret` sits strictly inside a token, move it to the nearer edge. */
export function snapCaret(value: string, caret: number): number {
  for (const token of parseTokens(value)) {
    if (caret > token.start && caret < token.end) {
      return caret - token.start < token.end - caret ? token.start : token.end;
    }
  }
  return caret;
}

/**
 * Whole-token deletion. Backspace right after a token (or after the token + one space) and
 * Delete right before one remove the whole token and one adjacent space. Returns `null` when the
 * key should behave normally (no token at the caret, or a non-collapsed selection).
 */
export function deleteTokenAt(
  value: string,
  selectionStart: number,
  selectionEnd: number,
  key: 'Backspace' | 'Delete',
): (EditResult & { removed: ComposerToken }) | null {
  if (selectionStart !== selectionEnd) return null;
  const caret = selectionStart;
  for (const token of parseTokens(value)) {
    let hit = false;
    if (key === 'Backspace') hit = caret === token.end || (caret === token.end + 1 && value[token.end] === ' ');
    else hit = caret === token.start || (caret === token.start - 1 && value[caret] === ' ');
    if (!hit) continue;
    let start = token.start;
    let end = token.end;
    if (value[end] === ' ') end += 1;
    else if (start > 0 && value[start - 1] === ' ') start -= 1;
    return { value: value.slice(0, start) + value.slice(end), caret: start, removed: token };
  }
  return null;
}

/** Count tokens per `trigger + name`, to unbind references whose token was deleted from the text. */
export function tokenCounts(value: string): Map<string, number> {
  const counts = new Map<string, number>();
  for (const token of parseTokens(value)) {
    const key = `${token.trigger}${token.name}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}

/** A host binding associated with one composer token. Extra fields are preserved. */
export interface TokenBinding {
  trigger: TriggerChar;
  name: string;
  [key: string]: unknown;
}

/**
 * Reconcile bindings restored by a host with the tokens that are still present in a draft.
 * Bindings are returned in their original order, while stale bindings are omitted. Matching is
 * by trigger and exact token name, including spaces; the helper never invents a binding.
 */
export function reconcileTokens<T extends TokenBinding>(value: string, bindings: readonly T[]): T[] {
  const counts = tokenCounts(value);
  const seen = new Map<string, number>();
  return bindings.filter((binding) => {
    const key = `${binding.trigger}${binding.name}`;
    const used = seen.get(key) ?? 0;
    const available = counts.get(key) ?? 0;
    if (used >= available) return false;
    seen.set(key, used + 1);
    return true;
  });
}

export interface TriggerMatch {
  trigger: TriggerChar;
  /** Text typed after the trigger. */
  query: string;
  /** Index of the trigger character. */
  from: number;
  /** Caret index (end of query). */
  to: number;
}

/** True when `index` is inside a fenced ``` block or an inline `code` span on its line. */
function insideCode(value: string, index: number): boolean {
  const fences = (value.slice(0, index).match(/```/g) ?? []).length;
  if (fences % 2 === 1) return true;
  const lineStart = value.lastIndexOf('\n', index - 1) + 1;
  const line = value.slice(lineStart, index).replace(/```/g, '');
  return (line.match(/`/g) ?? []).length % 2 === 1;
}

/**
 * Detect an active `@` / `/` trigger before the caret. Triggers only start at the beginning of a
 * line or after whitespace, never inside code, and the query cannot contain whitespace.
 * `/` commands are only recognised at the start of the message or a line (paths stay text).
 */
export function detectTrigger(value: string, caret: number, triggers: readonly TriggerChar[] = ['@', '/']): TriggerMatch | null {
  const before = value.slice(0, caret);
  // `@` queries may contain `/` (folder drilling: `@src/comp`); `/` queries may not.
  const match = /(^|[\s\u2069])(@)([^\s@\u2068\u2069]*)$/.exec(before) ?? /(^|[\s\u2069])(\/)([^\s/@\u2068\u2069]*)$/.exec(before);
  if (!match) return null;
  const trigger = match[2] as TriggerChar;
  if (!triggers.includes(trigger)) return null;
  const from = caret - match[3]!.length - 1;
  if (trigger === '/') {
    // Only at line start (optionally after other tokens), so "a/b" or "see /etc" stay plain text.
    const lineStart = value.lastIndexOf('\n', from - 1) + 1;
    const lead = value.slice(lineStart, from).replace(TOKEN_RE, '').trim();
    if (lead !== '') return null;
  }
  if (insideCode(value, from)) return null;
  return { trigger, query: match[3]!, from, to: caret };
}
