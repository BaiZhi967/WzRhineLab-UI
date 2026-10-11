'use client';

import * as React from 'react';
import { motion } from 'motion/react';
import { AlertDialog, IconButton, Menu, MenuItem, MenuSeparator, useRhineMotion } from '@wzrhine/react';
import type { AgentTone, ConversationView, StatusGlyphName } from '@wzrhine/agent-core';
import { useAgentFormat, useAgentMessages } from '../../provider/AgentMessages.js';
import { AgentIcon } from '../../primitives/icons.js';
import { StatusGlyph } from '../../primitives/StatusGlyph.js';
import { loopAttributes, useAgentLoop } from '../../motion/agent-motion.js';
import { cx } from '../../utils/cx.js';
import { conversationStatus, isSameDay } from './conversation-status.js';

/**
 * ConversationRow (atlas 04): one conversation in the index.
 *
 * Structure: `<li>` with two sibling buttons, never nested: the main button selects the
 * conversation (`aria-current="true"` when selected) and the "more" IconButton opens a Menu
 * (@wzrhine/react). Because they are siblings, nothing in the menu bubbles into selection.
 *
 * - Accessible name of the main button = title + pinned + status + unread (joined with the
 *   locale separator); time and preview are its description. Status = glyph + text, never colour
 *   alone; settled runs (idle / completed / cancelled) draw nothing, attention (approval,
 *   question, children, error) always wins over the run status.
 * - Running rows show a breathing glyph through the shared loop lifecycle (`useAgentLoop`), so
 *   off-screen rows, hidden pages and reduced motion keep it static; only active rows pay for it.
 * - The title is one ellipsised line (full text in `title`); time and unread live in a fixed
 *   column, so a long title never pushes them out and an unread change never changes the height.
 * - The "more" button is visible on hover / focus-within / while its menu is open (always on
 *   touch screens) and keeps its space reserved. A capability without a callback renders no item;
 *   with no item at all there is no button.
 * - Archive is reversible, so it confirms inline: the first 「归档」 keeps the menu open and turns
 *   the item into 「确认归档」; closing the menu resets it. Delete is not reversible: it opens an
 *   AlertDialog; `onDelete` may return a Promise (the dialog waits, and stays open on rejection).
 * - `disabled` disables both buttons.
 */
export type ConversationRowProps = Omit<React.LiHTMLAttributes<HTMLLIElement>, 'onSelect' | 'title' | 'children'> & {
  item: ConversationView;
  selected?: boolean;
  disabled?: boolean;
  onSelect?: (id: string) => void;
  /** Toggle pin; receives the requested state. */
  onPin?: (item: ConversationView, pinned: boolean) => void;
  onArchive?: (item: ConversationView) => void;
  onUnarchive?: (item: ConversationView) => void;
  /** Confirmed delete. Return a Promise to keep the dialog open until it settles. */
  onDelete?: (item: ConversationView) => void | Promise<unknown>;
  /** Extra controls next to the "more" button. */
  actions?: React.ReactNode;
  /** Reference time for the today / earlier format (default: now). */
  now?: Date;
};

/** Internal wiring from ConversationList: roving tab stop and the shared selection ghost. */
export interface ConversationRowListContext {
  tabStopId: string | null;
  ghostId: string;
  selectedId: string | undefined;
  onFocusRow: (id: string) => void;
}

export const ConversationRowContext = React.createContext<ConversationRowListContext | null>(null);

function ActiveGlyph({ glyph, tone }: { glyph: StatusGlyphName; tone: AgentTone }) {
  const { ref, lifecycle } = useAgentLoop<HTMLSpanElement>(true);
  return (
    <span ref={ref} className="rl-agent-row__glyph">
      <StatusGlyph name={glyph} tone={tone} active {...loopAttributes(lifecycle)} />
    </span>
  );
}

function SelectionGhost({ layoutId, selectedId }: { layoutId: string; selectedId: string | undefined }) {
  const { resolve } = useRhineMotion();
  return (
    <motion.span
      aria-hidden="true"
      className="rl-agent-row__ghost"
      layoutId={layoutId}
      layoutDependency={selectedId}
      initial={false}
      transition={resolve('transform', 'base')}
    />
  );
}

export const ConversationRow = React.forwardRef<HTMLLIElement, ConversationRowProps>(function ConversationRow(
  { item, selected = false, disabled = false, onSelect, onPin, onArchive, onUnarchive, onDelete, actions, now, className, ...rest },
  ref,
) {
  const messages = useAgentMessages();
  const shell = messages.shell;
  const format = useAgentFormat();
  const list = React.useContext(ConversationRowContext);
  const descId = React.useId();
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [confirmArchive, setConfirmArchive] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [deleteMounted, setDeleteMounted] = React.useState(false);

  const title = item.title.trim() || shell.untitled;
  const status = conversationStatus(item, messages.status, shell);
  const unread = item.unread && item.unread > 0 ? item.unread : 0;
  const nameParts = [title, item.pinned ? shell.pinned : null, status?.label ?? null, unread ? shell.unread(format.number(unread)) : null];
  const name = nameParts.filter(Boolean).join(shell.separator);

  let time: string | null = null;
  if (item.updatedAt) {
    const date = new Date(item.updatedAt);
    if (!Number.isNaN(date.getTime())) time = isSameDay(date, now ?? new Date()) ? format.time(item.updatedAt) : format.date(item.updatedAt);
  }

  const canPin = !!onPin && !item.archived;
  const canArchive = !!onArchive && !item.archived;
  const canUnarchive = !!onUnarchive && !!item.archived;
  const canDelete = !!onDelete;
  const hasMenu = canPin || canArchive || canUnarchive || canDelete;
  const tabbable = list ? list.tabStopId === item.id : true;

  return (
    <li
      {...rest}
      ref={ref}
      className={cx('rl-agent-row', className)}
      data-id={item.id}
      data-selected={selected || undefined}
      data-disabled={disabled || undefined}
      data-status={status?.kind}
      data-menu-open={menuOpen || undefined}
      data-has-menu={hasMenu || actions != null || undefined}
    >
      {selected && list && <SelectionGhost layoutId={list.ghostId} selectedId={list.selectedId} />}
      <button
        type="button"
        className="rl-agent-row__main"
        aria-current={selected ? 'true' : undefined}
        aria-label={name}
        aria-describedby={time || item.preview ? descId : undefined}
        disabled={disabled}
        tabIndex={tabbable ? 0 : -1}
        onFocus={() => list?.onFocusRow(item.id)}
        onClick={() => onSelect?.(item.id)}
      >
        <span className="rl-agent-row__status" aria-hidden="true">
          {status &&
            (status.active ? (
              <ActiveGlyph glyph={status.glyph} tone={status.tone} />
            ) : (
              <span className="rl-agent-row__glyph">
                <StatusGlyph name={status.glyph} tone={status.tone} />
              </span>
            ))}
        </span>
        <span className="rl-agent-row__title" title={title}>
          {item.pinned && <AgentIcon name="pin" className="rl-agent-row__pin" />}
          <span className="rl-agent-row__title-text">{title}</span>
        </span>
        <span className="rl-agent-row__meta" aria-hidden="true">
          {unread > 0 && <span className="rl-agent-row__unread">{format.compact(unread)}</span>}
          {time && (
            <time className="rl-agent-row__time" dateTime={item.updatedAt}>
              {time}
            </time>
          )}
        </span>
        {item.preview && (
          <span className="rl-agent-row__preview" aria-hidden="true">
            {item.preview}
          </span>
        )}
        <span id={descId} className="rl-agent-sr">
          {[time, item.preview].filter(Boolean).join(shell.separator)}
        </span>
      </button>
      {(hasMenu || actions != null) && (
        <span className="rl-agent-row__actions">
          {actions}
          {hasMenu && (
            <Menu
              open={menuOpen}
              onOpenChange={(open) => {
                setMenuOpen(open);
                if (!open) setConfirmArchive(false);
              }}
              align="end"
              disabled={disabled}
              trigger={
                <IconButton
                  className="rl-agent-row__more"
                  size="sm"
                  icon={<AgentIcon name="more" />}
                  label={shell.more(title)}
                  disabled={disabled}
                  tabIndex={tabbable ? 0 : -1}
                  onFocus={() => list?.onFocusRow(item.id)}
                />
              }
            >
              {canPin && (
                <MenuItem icon={<AgentIcon name="pin" />} onSelect={() => onPin(item, !item.pinned)}>
                  {item.pinned ? shell.unpin : shell.pin}
                </MenuItem>
              )}
              {canArchive && (
                <MenuItem
                  icon={<AgentIcon name="archive" />}
                  keepOpen={!confirmArchive}
                  onSelect={() => {
                    if (!confirmArchive) {
                      setConfirmArchive(true);
                      return;
                    }
                    setConfirmArchive(false);
                    onArchive(item);
                  }}
                >
                  {confirmArchive ? shell.confirmArchive : shell.archive}
                </MenuItem>
              )}
              {canUnarchive && (
                <MenuItem icon={<AgentIcon name="unarchive" />} onSelect={() => onUnarchive(item)}>
                  {shell.unarchive}
                </MenuItem>
              )}
              {canDelete && (canPin || canArchive || canUnarchive) && <MenuSeparator />}
              {canDelete && (
                <MenuItem
                  icon={<AgentIcon name="trash" />}
                  tone="danger"
                  onSelect={() => {
                    setDeleteMounted(true);
                    setDeleteOpen(true);
                  }}
                >
                  {shell.delete}
                </MenuItem>
              )}
            </Menu>
          )}
        </span>
      )}
      {canDelete && deleteMounted && (
        <AlertDialog
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          title={shell.deleteTitle}
          description={shell.deleteDescription(title)}
          confirmLabel={shell.deleteConfirm}
          errorText={shell.deleteError}
          onConfirm={() => onDelete(item)}
        />
      )}
    </li>
  );
});
