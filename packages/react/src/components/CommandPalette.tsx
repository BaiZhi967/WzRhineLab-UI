'use client';

import * as React from 'react';
import { Autocomplete } from '@base-ui/react/autocomplete';
import { Dialog as BaseDialog } from '@base-ui/react/dialog';
import { AnimatePresence, motion } from 'motion/react';
import { useRhineMotion } from '../motion/useRhineMotion.js';
import { useRhineMessages } from '../provider/messages.js';
import { usePortalContainer } from '../provider/portal.js';
import { cx } from '../utils/cx.js';

/**
 * Modal command search (ADR-0010 §2): Base UI Dialog (focus trap, Escape, scroll lock, focus
 * return to whatever was focused before opening) around an inline, always-open Base UI
 * Autocomplete list. Focus stays in the input; ↑ / ↓ move the active option through
 * `aria-activedescendant`, Enter runs it, Esc closes the dialog. The first match is always
 * highlighted. Disabled commands stay visible with their reason and cannot run.
 * Enter/exit motion follows Dialog (motion/react: backdrop fast, panel 280ms + 8px rise;
 * opacity only under reduced motion).
 *
 *   <CommandPalette hotkey="mod+k" commands={commands} onSelect={(c) => run(c.id)} />
 */

export interface CommandItem {
  id: string;
  label: string;
  description?: string;
  /** Group heading; commands sharing it are listed together in first-seen order. */
  group?: string;
  /** Visual shortcut hint such as "Ctrl E" (hidden from assistive tech, like MenuItem). Wire it yourself. */
  shortcut?: string;
  /** Extra search terms (synonyms, English names). */
  keywords?: readonly string[];
  disabled?: boolean;
  /** Shown under a disabled command, e.g. 「需要编辑权限」. */
  disabledReason?: string;
}

export type CommandPaletteProps = {
  commands: readonly CommandItem[];
  /** Runs a command. Return `false` to keep the palette open. */
  onSelect: (command: CommandItem) => boolean | void;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Element that opens the palette (usually a Button). */
  trigger?: React.ReactElement<Record<string, unknown>>;
  /**
   * Global shortcut that toggles the palette, e.g. `mod+k` (`mod` = ⌘ on Apple platforms, Ctrl
   * elsewhere). Combine with `ctrl`, `meta`, `alt`, `shift`. Ignored during IME composition.
   */
  hotkey?: string;
  /** Accessible name of the dialog (visually hidden; default from messages). */
  title?: string;
  placeholder?: string;
  emptyText?: React.ReactNode;
  /** Footer keyboard hint (default from messages); `null` hides it. */
  hint?: React.ReactNode | null;
  /** Custom match. Default: every whitespace-separated term appears in label, keywords, group or description. */
  filter?: (command: CommandItem, query: string) => boolean;
  className?: string;
};

type CommandGroup = { value: string; items: CommandItem[] };

const normalize = (text: string) => text.toLocaleLowerCase();
const terms = (query: string) => normalize(query).split(/\s+/).filter(Boolean);

function defaultFilter(command: CommandItem, query: string) {
  const haystack = normalize([command.label, command.description ?? '', command.group ?? '', ...(command.keywords ?? [])].join(' '));
  return terms(query).every((term) => haystack.includes(term));
}

/** Label split into plain and matched parts; matched parts render as <mark>. */
function highlight(label: string, query: string): React.ReactNode {
  const words = terms(query);
  if (words.length === 0) return label;
  const lower = normalize(label);
  const marks = new Array<boolean>(label.length).fill(false);
  for (const word of words) {
    let from = lower.indexOf(word);
    while (from !== -1) {
      for (let i = from; i < from + word.length; i += 1) marks[i] = true;
      from = lower.indexOf(word, from + word.length);
    }
  }
  const parts: React.ReactNode[] = [];
  let start = 0;
  for (let i = 1; i <= label.length; i += 1) {
    if (i === label.length || marks[i] !== marks[start]) {
      const text = label.slice(start, i);
      parts.push(marks[start] ? <mark key={start} className="rl-command__mark">{text}</mark> : text);
      start = i;
    }
  }
  return parts;
}

function isApplePlatform() {
  if (typeof navigator === 'undefined') return false;
  const platform = (navigator as Navigator & { userAgentData?: { platform?: string } }).userAgentData?.platform ?? navigator.platform ?? '';
  return /mac|iphone|ipad|ipod/i.test(platform);
}

/** Parses `mod+k` style hotkeys into a predicate over keyboard events. */
export function matchHotkey(hotkey: string, event: KeyboardEvent, apple = isApplePlatform()): boolean {
  const parts = hotkey.toLowerCase().split('+').map((p) => p.trim()).filter(Boolean);
  const key = parts.pop();
  if (!key) return false;
  const want = { ctrl: false, meta: false, alt: false, shift: false };
  for (const part of parts) {
    if (part === 'mod') want[apple ? 'meta' : 'ctrl'] = true;
    else if (part === 'ctrl' || part === 'control') want.ctrl = true;
    else if (part === 'meta' || part === 'cmd') want.meta = true;
    else if (part === 'alt' || part === 'option') want.alt = true;
    else if (part === 'shift') want.shift = true;
  }
  return (
    event.key.toLowerCase() === key &&
    event.ctrlKey === want.ctrl &&
    event.metaKey === want.meta &&
    event.altKey === want.alt &&
    event.shiftKey === want.shift
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true" focusable="false">
      <circle cx="7" cy="7" r="4.75" />
      <path d="m10.5 10.5 3.5 3.5" strokeLinecap="round" />
    </svg>
  );
}

const offset = 8;

export function CommandPalette({
  commands,
  onSelect,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  trigger,
  hotkey,
  title,
  placeholder,
  emptyText,
  hint,
  filter = defaultFilter,
  className,
}: CommandPaletteProps) {
  const messages = useRhineMessages().commandPalette;
  const container = usePortalContainer();
  const motionPrefs = useRhineMotion();
  const rise = motionPrefs.reduced ? 0 : offset;
  const [uncontrolled, setUncontrolled] = React.useState(defaultOpen);
  const controlled = openProp !== undefined;
  const open = controlled ? openProp : uncontrolled;
  const [query, setQuery] = React.useState('');
  const inputRef = React.useRef<HTMLInputElement>(null);
  const hintId = React.useId();

  const setOpen = React.useCallback(
    (next: boolean) => {
      if (next) setQuery('');
      if (!controlled) setUncontrolled(next);
      onOpenChange?.(next);
    },
    [controlled, onOpenChange],
  );

  // Latest values for the document listener without re-subscribing on every render.
  const latest = React.useRef({ open, setOpen });
  latest.current = { open, setOpen };

  React.useEffect(() => {
    if (!hotkey) return undefined;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.isComposing || event.keyCode === 229 || event.repeat) return;
      if (!matchHotkey(hotkey, event)) return;
      event.preventDefault();
      latest.current.setOpen(!latest.current.open);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [hotkey]);

  const groups = React.useMemo(() => {
    const trimmed = query.trim();
    const map = new Map<string, CommandGroup>();
    for (const command of commands) {
      if (trimmed !== '' && !filter(command, trimmed)) continue;
      const key = command.group ?? '';
      let group = map.get(key);
      if (!group) {
        group = { value: key, items: [] };
        map.set(key, group);
      }
      group.items.push(command);
    }
    return [...map.values()];
  }, [commands, filter, query]);

  const run = (command: CommandItem) => {
    if (command.disabled) return;
    if (onSelect(command) !== false) setOpen(false);
  };

  const footer = hint === undefined ? messages.hint : hint;

  return (
    <BaseDialog.Root open={open} onOpenChange={(next) => setOpen(next)}>
      {trigger && <BaseDialog.Trigger render={trigger} />}
      <AnimatePresence>
        {open && (
          <BaseDialog.Portal keepMounted container={container}>
            <BaseDialog.Backdrop
              className="rl-dialog__backdrop"
              render={
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={motionPrefs.get('fast')} />
              }
            />
            <BaseDialog.Popup
              className={cx('rl-command', className)}
              data-slot="command-palette"
              initialFocus={inputRef}
              render={
                <motion.div
                  initial={{ opacity: 0, y: rise }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: rise }}
                  transition={motionPrefs.get('panel')}
                />
              }
            >
              <BaseDialog.Title className="rl-visually-hidden">{title ?? messages.title}</BaseDialog.Title>
              <Autocomplete.Root
                open
                inline
                items={groups}
                filter={null}
                autoHighlight="always"
                keepHighlight
                value={query}
                onValueChange={(next, details) => {
                  // Selecting fills the input by default; a palette keeps the typed query instead.
                  if (details.reason !== 'item-press') setQuery(next);
                }}
                itemToStringValue={(command: CommandItem) => command.label}
              >
                <div className="rl-command__search">
                  <span className="rl-command__search-icon" aria-hidden="true">
                    <SearchIcon />
                  </span>
                  <Autocomplete.Input
                    ref={inputRef}
                    className="rl-command__input"
                    aria-label={messages.inputLabel}
                    aria-describedby={footer != null ? hintId : undefined}
                    placeholder={placeholder ?? messages.placeholder}
                  />
                </div>
                <BaseDialog.Close className="rl-visually-hidden">{messages.close}</BaseDialog.Close>
                <div className="rl-command__body">
                  <Autocomplete.Empty className="rl-command__empty">{emptyText ?? messages.empty}</Autocomplete.Empty>
                  <Autocomplete.List className="rl-command__list">
                    {(group: CommandGroup) => (
                      <Autocomplete.Group key={`g-${group.value}`} items={group.items} className="rl-command__group">
                        {group.value !== '' && <Autocomplete.GroupLabel className="rl-command__group-label">{group.value}</Autocomplete.GroupLabel>}
                        <Autocomplete.Collection>
                          {(command: CommandItem) => (
                            <Autocomplete.Item
                              key={command.id}
                              value={command}
                              disabled={command.disabled}
                              className="rl-command__item"
                              data-command-id={command.id}
                              onClick={() => run(command)}
                            >
                              <span className="rl-command__text">
                                <span className="rl-command__label">{highlight(command.label, query)}</span>
                                {command.description != null && <span className="rl-command__description">{command.description}</span>}
                                {command.disabled && command.disabledReason != null && (
                                  <span className="rl-command__reason">{command.disabledReason}</span>
                                )}
                              </span>
                              {command.shortcut != null && (
                                <kbd className="rl-command__shortcut" aria-hidden="true">
                                  {command.shortcut}
                                </kbd>
                              )}
                            </Autocomplete.Item>
                          )}
                        </Autocomplete.Collection>
                      </Autocomplete.Group>
                    )}
                  </Autocomplete.List>
                </div>
                {footer != null && (
                  <p id={hintId} className="rl-command__hint">
                    {footer}
                  </p>
                )}
              </Autocomplete.Root>
            </BaseDialog.Popup>
          </BaseDialog.Portal>
        )}
      </AnimatePresence>
    </BaseDialog.Root>
  );
}
