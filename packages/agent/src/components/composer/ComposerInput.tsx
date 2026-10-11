'use client';

import * as React from 'react';
import { detectTrigger, deleteTokenAt, insertToken as insertTokenText, parseTokens, snapCaret, tokenCounts } from '@wzrhine/agent-core';
import type { ComposerToken, TriggerChar, TriggerMatch } from '@wzrhine/agent-core';
import { useAgentMessages } from '../../provider/AgentMessages.js';
import { cx } from '../../utils/cx.js';
import { stripStrayWithCaret } from './composer-text.js';

/** Visual kind of a token in the mirror layer. */
export type ComposerTokenKind = 'file' | 'skill' | 'command';

export interface ComposerSelection {
  start: number;
  end: number;
}

/** Imperative handle of ComposerInput (also forwarded by Composer). */
export interface ComposerInputHandle {
  focus: () => void;
  /**
   * Insert a token at `range` (default: the current selection), padded with spaces. Goes through
   * the browser's editing commands when available so the insertion is part of native undo.
   */
  insertToken: (trigger: TriggerChar, name: string, range?: { from: number; to: number }) => void;
  /** Replace `[from, to)` with plain text (used for folder drilling and clearing a query). */
  replaceRange: (from: number, to: number, text: string) => void;
  getSelection: () => ComposerSelection;
  /** The underlying textarea (focus management, measurement). */
  element: HTMLTextAreaElement | null;
}

type NativeTextareaProps = Omit<
  React.TextareaHTMLAttributes<HTMLTextAreaElement>,
  'value' | 'defaultValue' | 'onChange' | 'onSubmit' | 'children'
>;

export type ComposerInputProps = NativeTextareaProps & {
  value?: string;
  defaultValue?: string;
  /** Every edit (typing, IME, paste, cut, token insert / delete). `caret` is the new selection end. */
  onValueChange?: (value: string, caret: number) => void;
  /** Enter (or Mod+Enter with `submitOn="mod-enter"`) outside IME composition. Without it Enter inserts a newline. */
  onSubmit?: () => void;
  submitOn?: 'enter' | 'mod-enter';
  /**
   * Called for every key outside IME composition, before token deletion and submit. Return `true`
   * when the key was consumed (menu navigation): the default action is prevented.
   */
  onMenuKey?: (event: React.KeyboardEvent<HTMLTextAreaElement>) => boolean;
  /** Active `@` / `/` trigger before the caret; `null` when none. Not called during IME composition. */
  onTriggerChange?: (match: TriggerMatch | null) => void;
  /** Triggers to detect (default both). */
  triggers?: readonly TriggerChar[];
  /** A token disappeared from the text through a user edit (whole-token delete, cut, overwrite). */
  onTokenRemoved?: (token: ComposerToken) => void;
  /** Mirror colour per token (default: `@` → file, `/` → command). */
  tokenKind?: (token: ComposerToken) => ComposerTokenKind;
  /** Screen-reader hint linked via aria-describedby; `false` removes it. */
  hint?: React.ReactNode | false;
  /** Class on the wrapper. */
  className?: string;
  /** Class on the textarea. */
  inputClassName?: string;
};

const ZWSP = '\u200b';

function defaultTokenKind(token: ComposerToken): ComposerTokenKind {
  return token.trigger === '@' ? 'file' : 'command';
}

function sameMatch(a: TriggerMatch | null, b: TriggerMatch | null): boolean {
  if (a === null || b === null) return a === b;
  return a.trigger === b.trigger && a.query === b.query && a.from === b.from && a.to === b.to;
}

/** Mirror nodes: plain text, token spans (glyph widths untouched) and a trailing zero-width space. */
function renderMirror(value: string, kindOf: (token: ComposerToken) => ComposerTokenKind): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  let last = 0;
  for (const token of parseTokens(value)) {
    if (token.start > last) nodes.push(value.slice(last, token.start));
    nodes.push(
      <span key={token.start} className="rl-agent-token" data-kind={kindOf(token)}>
        {value.slice(token.start, token.end)}
      </span>,
    );
    last = token.end;
  }
  // The trailing ZWSP gives a final empty line (after "\n") a height, matching the textarea.
  nodes.push(value.slice(last) + ZWSP);
  return nodes;
}

/** Runs a native editing command on the focused textarea; false when unsupported (jsdom, old engines). */
function execEdit(textarea: HTMLTextAreaElement, command: 'insertText' | 'delete', text?: string): boolean {
  if (typeof document === 'undefined' || typeof document.execCommand !== 'function') return false;
  if (document.activeElement !== textarea) textarea.focus();
  try {
    return document.execCommand(command, false, text);
  } catch {
    return false;
  }
}

/**
 * Token-mirror textarea (ADR-0011 §8). A real `<textarea>` sits on top with a transparent
 * background and owns typing, IME, selection, undo and accessibility; an `aria-hidden` mirror
 * underneath renders the same value with identical typography, where tokens
 * (`U+2068 trigger name U+2069`) get a tinted background drawn only with background and
 * box-shadow, so glyph positions match the textarea exactly.
 *
 * - Height follows the mirror content, clamped by `--rl-agent-composer-min / -max` (CSS min / max
 *   height); width changes are tracked with ResizeObserver when available.
 * - The caret never rests inside a token: arrow keys jump across it, clicks snap to the nearer edge.
 * - Backspace / Delete next to a token remove it whole (native `delete` command → part of undo).
 * - IME: composition is tracked with `compositionstart/end`, `nativeEvent.isComposing` and
 *   keyCode 229. While composing nothing is submitted, menu keys are not handled and trigger
 *   detection waits for `compositionend`.
 *
 * Motion: none (height changes are immediate, measured, never animated).
 */
export const ComposerInput = React.forwardRef<ComposerInputHandle, ComposerInputProps>(function ComposerInput(
  {
    value: valueProp,
    defaultValue = '',
    onValueChange,
    onSubmit,
    submitOn = 'enter',
    onMenuKey,
    onTriggerChange,
    triggers = ['@', '/'],
    onTokenRemoved,
    tokenKind = defaultTokenKind,
    hint,
    className,
    inputClassName,
    onKeyDown,
    onSelect,
    onScroll,
    onCompositionStart,
    onCompositionEnd,
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledBy,
    'aria-describedby': ariaDescribedBy,
    placeholder,
    rows = 1,
    ...rest
  },
  ref,
) {
  const messages = useAgentMessages().composer;
  const hintId = React.useId();
  const [inner, setInner] = React.useState(defaultValue);
  const controlled = valueProp !== undefined;
  const value = controlled ? valueProp : inner;

  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const mirrorRef = React.useRef<HTMLDivElement>(null);
  const contentRef = React.useRef<HTMLDivElement>(null);
  const wrapperRef = React.useRef<HTMLDivElement>(null);
  const composing = React.useRef(false);
  const valueRef = React.useRef(value);
  const lastCaret = React.useRef<number | null>(null);
  const lastMatch = React.useRef<TriggerMatch | null>(null);
  const pendingCaret = React.useRef<{ value: string; caret: number } | null>(null);
  /** Last value produced by a user edit; anything else arriving through `value` is external. */
  const committed = React.useRef(value);
  /** The next selection change comes from a pointer (snap to the nearer edge, not the travel direction). */
  const pointer = React.useRef(false);
  valueRef.current = value;

  const emitTrigger = React.useCallback(
    (text: string, start: number, end: number) => {
      if (composing.current) return;
      const match = start === end ? detectTrigger(text, start, triggers) : null;
      if (sameMatch(match, lastMatch.current)) return;
      lastMatch.current = match;
      onTriggerChange?.(match);
    },
    [onTriggerChange, triggers],
  );

  /** Single entry for every user edit: strips stray isolates, reports removed tokens, re-detects triggers. */
  const commit = React.useCallback(
    (raw: string, rawCaret: number) => {
      const previous = valueRef.current;
      const { value: next, caret } = stripStrayWithCaret(raw, rawCaret);
      if (next !== raw) pendingCaret.current = { value: next, caret };
      if (onTokenRemoved) {
        const before = tokenCounts(previous);
        const after = tokenCounts(next);
        const old = parseTokens(previous);
        for (const [key, count] of before) {
          const left = after.get(key) ?? 0;
          if (left >= count) continue;
          const matching = old.filter((t) => `${t.trigger}${t.name}` === key);
          for (const token of matching.slice(left)) onTokenRemoved(token);
        }
      }
      valueRef.current = next;
      committed.current = next;
      if (!controlled) setInner(next);
      onValueChange?.(next, caret);
      lastCaret.current = caret;
      emitTrigger(next, caret, caret);
    },
    [controlled, emitTrigger, onTokenRemoved, onValueChange],
  );

  /** Replace a range, through the native editing stack when possible (keeps undo), else controlled. */
  const replace = React.useCallback(
    (from: number, to: number, text: string, caretAfter?: number) => {
      if (from === to && text === '') return;
      const el = textareaRef.current;
      const current = valueRef.current;
      const target = caretAfter ?? from + text.length;
      if (el && !el.disabled && !el.readOnly) {
        el.setSelectionRange(from, to);
        const ok = text === '' ? execEdit(el, 'delete') : execEdit(el, 'insertText', text);
        if (ok) {
          // The native input event already went through onChange → commit.
          el.setSelectionRange(target, target);
          lastCaret.current = target;
          emitTrigger(el.value, target, target);
          return;
        }
      }
      const next = current.slice(0, from) + text + current.slice(to);
      pendingCaret.current = { value: next, caret: target };
      commit(next, target);
      if (typeof requestAnimationFrame === 'function') {
        requestAnimationFrame(() => {
          const node = textareaRef.current;
          if (node && node.value === next && document.activeElement === node) node.setSelectionRange(target, target);
        });
      }
    },
    [commit, emitTrigger],
  );

  React.useImperativeHandle(
    ref,
    (): ComposerInputHandle => ({
      focus: () => textareaRef.current?.focus(),
      insertToken: (trigger, name, range) => {
        const el = textareaRef.current;
        const current = valueRef.current;
        const from = range?.from ?? el?.selectionStart ?? current.length;
        const to = range?.to ?? el?.selectionEnd ?? from;
        const result = insertTokenText(current, from, to, trigger, name);
        const inserted = result.value.slice(from, result.value.length - (current.length - to));
        replace(from, to, inserted, result.caret);
      },
      replaceRange: (from, to, text) => replace(from, to, text),
      getSelection: () => {
        const el = textareaRef.current;
        const end = valueRef.current.length;
        return { start: el?.selectionStart ?? end, end: el?.selectionEnd ?? end };
      },
      get element() {
        return textareaRef.current;
      },
    }),
    [replace],
  );

  const syncScroll = React.useCallback(() => {
    const el = textareaRef.current;
    if (el && mirrorRef.current) mirrorRef.current.scrollTop = el.scrollTop;
  }, []);

  const sizeToContent = React.useCallback(() => {
    const el = textareaRef.current;
    const content = contentRef.current;
    if (!el || !content) return;
    let height = content.offsetHeight;
    if (height <= 0) {
      // No layout from the mirror (jsdom, hidden ancestor): fall back to the textarea itself.
      el.style.height = 'auto';
      height = el.scrollHeight;
    }
    // CSS min-height / max-height clamp to --rl-agent-composer-min / -max.
    if (height > 0) el.style.height = `${height}px`;
    else el.style.removeProperty('height');
    syncScroll();
  }, [syncScroll]);

  React.useLayoutEffect(() => {
    const pending = pendingCaret.current;
    const el = textareaRef.current;
    if (pending && el && pending.value === value && el.value === value) {
      pendingCaret.current = null;
      if (document.activeElement === el) el.setSelectionRange(pending.caret, pending.caret);
    }
    sizeToContent();
  }, [value, sizeToContent]);

  // External value changes (host cleared the draft after sending, restored a draft…): re-detect
  // the trigger so an open menu never outlives its text.
  React.useEffect(() => {
    if (value === committed.current) return;
    committed.current = value;
    const el = textareaRef.current;
    const focused = el !== null && typeof document !== 'undefined' && document.activeElement === el;
    if (focused) emitTrigger(value, el.selectionStart, el.selectionEnd);
    else if (lastMatch.current !== null) {
      lastMatch.current = null;
      onTriggerChange?.(null);
    }
  }, [value, emitTrigger, onTriggerChange]);

  React.useEffect(() => {
    const node = wrapperRef.current;
    if (!node || typeof ResizeObserver === 'undefined') return;
    let width = node.clientWidth;
    const observer = new ResizeObserver(() => {
      // Only width changes re-wrap the text; our own height updates must not loop.
      if (node.clientWidth === width) return;
      width = node.clientWidth;
      sizeToContent();
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [sizeToContent]);

  const isComposingEvent = (event: React.KeyboardEvent<HTMLTextAreaElement>) =>
    composing.current || event.nativeEvent.isComposing || event.keyCode === 229;

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    pointer.current = false;
    onKeyDown?.(event);
    if (event.defaultPrevented || isComposingEvent(event)) return;
    if (onMenuKey?.(event)) {
      event.preventDefault();
      return;
    }
    const el = event.currentTarget;
    if ((event.key === 'Backspace' || event.key === 'Delete') && !event.altKey && !event.ctrlKey && !event.metaKey) {
      const hit = deleteTokenAt(el.value, el.selectionStart, el.selectionEnd, event.key);
      if (hit) {
        event.preventDefault();
        const removedLength = el.value.length - hit.value.length;
        replace(hit.caret, hit.caret + removedLength, '', hit.caret);
      }
      return;
    }
    if (event.key === 'Enter' && onSubmit) {
      const mod = event.ctrlKey || event.metaKey;
      const sends = submitOn === 'enter' ? !event.shiftKey && !event.altKey : mod;
      if (sends) {
        event.preventDefault();
        onSubmit();
      }
    }
  };

  const handleSelect = (event: React.SyntheticEvent<HTMLTextAreaElement>) => {
    onSelect?.(event);
    const el = event.currentTarget;
    const { selectionStart: start, selectionEnd: end } = el;
    if (start === end && !composing.current) {
      const text = el.value;
      const inside = parseTokens(text).find((t) => start > t.start && start < t.end);
      if (inside) {
        const prev = lastCaret.current;
        // Arrow keys cross a token in the direction of travel; pointer clicks snap to the nearer edge.
        const to =
          !pointer.current && prev !== null && prev <= inside.start
            ? inside.end
            : !pointer.current && prev !== null && prev >= inside.end
              ? inside.start
              : snapCaret(text, start);
        el.setSelectionRange(to, to);
        lastCaret.current = to;
        emitTrigger(text, to, to);
        return;
      }
    }
    lastCaret.current = end;
    emitTrigger(el.value, start, end);
  };

  const describedBy = cx(ariaDescribedBy, hint !== false && hintId) || undefined;
  const hintText = hint === undefined ? (submitOn === 'mod-enter' ? messages.inputHintModEnter : messages.inputHint) : hint;

  return (
    <div ref={wrapperRef} className={cx('rl-agent-composer-input', className)} data-slot="composer-input">
      <div ref={mirrorRef} className="rl-agent-composer-input__mirror" aria-hidden="true">
        <div ref={contentRef} className="rl-agent-composer-input__text rl-agent-composer-input__mirror-content">
          {renderMirror(value, tokenKind)}
        </div>
      </div>
      <textarea
        {...rest}
        ref={textareaRef}
        rows={rows}
        value={value}
        placeholder={placeholder ?? messages.placeholder}
        aria-label={ariaLabelledBy ? undefined : (ariaLabel ?? messages.inputLabel)}
        aria-labelledby={ariaLabelledBy}
        aria-describedby={describedBy}
        className={cx('rl-agent-composer-input__text rl-agent-composer-input__control', inputClassName)}
        onChange={(event) => commit(event.currentTarget.value, event.currentTarget.selectionEnd)}
        onKeyDown={handleKeyDown}
        onSelect={handleSelect}
        onPointerDown={(event) => {
          pointer.current = true;
          rest.onPointerDown?.(event);
        }}
        onScroll={(event) => {
          syncScroll();
          onScroll?.(event);
        }}
        onCompositionStart={(event) => {
          composing.current = true;
          onCompositionStart?.(event);
        }}
        onCompositionEnd={(event) => {
          composing.current = false;
          onCompositionEnd?.(event);
          const el = event.currentTarget;
          emitTrigger(el.value, el.selectionStart, el.selectionEnd);
        }}
      />
      {hint !== false && (
        <span id={hintId} className="rl-agent-sr">
          {hintText}
        </span>
      )}
    </div>
  );
});
