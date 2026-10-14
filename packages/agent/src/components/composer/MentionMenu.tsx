'use client';

import * as React from 'react';
import { Button, Spinner } from '@wzrhine/react';
import type { MentionOption, ReferenceKind } from '@wzrhine/agent-core';
import { AgentIcon } from '../../primitives/icons.js';
import type { AgentIconName } from '../../primitives/icons.js';
import { useAgentMessages } from '../../provider/AgentMessages.js';
import { groupOptions, splitMentionQuery } from './composer-utils.js';
import { Highlight, MenuGroup, MenuOption, MenuPanel } from './MenuPanel.js';

/** Icon per built-in reference kind; custom kinds fall back to the `custom` icon (ADR-0013 §2). */
const kindIcon: Record<ReferenceKind, AgentIconName> = {
  file: 'file',
  folder: 'folder',
  skill: 'spark',
  command: 'slash',
  url: 'link',
  symbol: 'code',
  custom: 'at',
};

export interface MentionMenuProps {
  open: boolean;
  /** Text typed after `@` (may contain a drilled folder prefix, `src/comp`). */
  query: string;
  /** Options in display order (the host filters them for `query`). */
  options: readonly MentionOption[];
  activeIndex: number;
  onActiveIndexChange: (index: number) => void;
  /** Click on an enabled option (keyboard selection goes through the owning Composer). */
  onSelect: (option: MentionOption) => void;
  /** Click on a drillable folder. Without it folders are inserted like files. */
  onDrill?: (option: MentionOption) => void;
  loading?: boolean;
  /** Error text; shown with a retry button when `onRetry` is given. */
  error?: React.ReactNode;
  onRetry?: () => void;
  /** Base id; the listbox is `${id}-listbox`, options `${id}-listbox-option-${index}`. */
  id?: string;
  /** `top` / `bottom` = absolutely positioned against the composer; `inline` = in normal flow (standalone use). */
  side?: 'top' | 'bottom' | 'inline';
  title?: React.ReactNode;
  className?: string;
}

/**
 * `@` file / context picker (atlas 15). A listbox panel anchored above the composer; focus stays
 * in the textarea (`aria-activedescendant`). Groups are `role="group"` with a visible heading,
 * matches are `<mark>`ed, the path is dimmed, folders can be drilled into (Tab / Enter → the query
 * becomes `name/`), disabled options stay reachable so their reason is read out.
 *
 * Keyboard (handled by Composer): ↑ / ↓ move and clamp at the ends (no wrap-around), Enter / Tab
 * choose (Tab or Enter on a folder drills), Esc closes and the same query will not reopen it.
 * Motion: MotionPresence `fade` (reduced → instant).
 */
export function MentionMenu({
  open,
  query,
  options,
  activeIndex,
  onActiveIndexChange,
  onSelect,
  onDrill,
  loading = false,
  error,
  onRetry,
  id,
  side,
  title,
  className,
}: MentionMenuProps) {
  const messages = useAgentMessages().composer;
  const autoId = React.useId();
  const base = id ?? autoId;
  const listboxId = `${base}-listbox`;
  const { directory, filter } = splitMentionQuery(query);
  const choose = (index: number) => {
    const option = options[index];
    if (!option || option.disabled) return;
    if (option.drillable && onDrill) onDrill(option);
    else onSelect(option);
  };

  let status: React.ReactNode = null;
  if (loading) {
    status = (
      <p className="rl-agent-menu__status" role="status">
        <Spinner size="sm" />
        {messages.mentionLoading}
      </p>
    );
  } else if (error != null && error !== false) {
    status = (
      <div className="rl-agent-menu__status" data-tone="danger" role="alert">
        <AgentIcon name="warning" />
        <span>{error === true ? messages.mentionError : error}</span>
        {onRetry && (
          <Button size="sm" variant="ghost" onMouseDown={(event) => event.preventDefault()} onClick={onRetry}>
            {messages.mentionRetry}
          </Button>
        )}
      </div>
    );
  } else if (options.length === 0) {
    status = (
      <p className="rl-agent-menu__status" role="status">
        {messages.mentionEmpty}
      </p>
    );
  }

  return (
    <MenuPanel
      open={open}
      panelId={`${base}-panel`}
      listboxId={listboxId}
      label={messages.mentionTitle}
      title={
        <>
          {title ?? messages.mentionTitle}
          {directory && <span className="rl-agent-menu__scope">{directory}</span>}
        </>
      }
      keys={messages.mentionKeys}
      icon={<AgentIcon name="at" />}
      side={side}
      status={status}
      count={loading || (error != null && error !== false) ? 0 : options.length}
      activeIndex={activeIndex}
      className={className}
    >
      {groupOptions(options, (o) => o.group).map((group) => (
        <MenuGroup key={group.key} label={group.label}>
          {group.items.map(({ option, index }) => (
            <MenuOption
              key={option.id}
              listboxId={listboxId}
              index={index}
              active={index === activeIndex}
              disabled={option.disabled}
              onActivate={onActiveIndexChange}
              onChoose={choose}
              data-kind={option.kind}
            >
              <AgentIcon name={option.drillable ? 'folder' : (kindIcon[option.kind as ReferenceKind] ?? kindIcon.custom)} className="rl-agent-menu__icon" />
              <span className="rl-agent-menu__body">
                <span className="rl-agent-menu__label">
                  <span>
                    <Highlight text={option.label} query={filter} />
                  </span>
                </span>
                {option.detail && (
                  <span className="rl-agent-menu__detail" title={option.detail}>
                    {option.detail}
                  </span>
                )}
                {option.disabled && <span className="rl-agent-menu__reason">{messages.optionUnavailable(option.disabledReason)}</span>}
              </span>
              {option.drillable && (
                <>
                  <AgentIcon name="chevron-right" className="rl-agent-menu__trail" />
                  <span className="rl-agent-sr">{messages.mentionDrill}</span>
                </>
              )}
            </MenuOption>
          ))}
        </MenuGroup>
      ))}
    </MenuPanel>
  );
}
