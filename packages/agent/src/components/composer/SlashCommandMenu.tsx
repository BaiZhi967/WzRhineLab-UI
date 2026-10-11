'use client';

import * as React from 'react';
import { Spinner } from '@wzrhine/react';
import type { CommandOption } from '@wzrhine/agent-core';
import { AgentIcon } from '../../primitives/icons.js';
import { useAgentMessages } from '../../provider/AgentMessages.js';
import { groupOptions } from './composer-utils.js';
import { Highlight, MenuGroup, MenuOption, MenuPanel } from './MenuPanel.js';

export interface SlashCommandMenuProps {
  open: boolean;
  /** Text typed after `/`. */
  query: string;
  /** Options in display order. Composer orders them commands first, then skills (`orderCommandOptions`). */
  options: readonly CommandOption[];
  activeIndex: number;
  onActiveIndexChange: (index: number) => void;
  /** Click on an enabled option. The host decides: insert a token or dispatch an action. */
  onSelect: (option: CommandOption) => void;
  /** Click on a disabled option: nothing is dispatched, the host may show the reason. */
  onDisabledSelect?: (option: CommandOption) => void;
  loading?: boolean;
  id?: string;
  /** `top` / `bottom` = absolutely positioned against the composer; `inline` = in normal flow (standalone use). */
  side?: 'top' | 'bottom' | 'inline';
  title?: React.ReactNode;
  className?: string;
}

/**
 * `/` command and skill picker (atlas 16). Same mechanics as MentionMenu: listbox panel above the
 * composer, focus stays in the textarea, ↑ / ↓ clamp, Enter / Tab choose, Esc closes and
 * remembers the query. Rows show `/name`, aliases, description, the shortcut (`<kbd>`, visual
 * only) and, for disabled entries, the reason. Selected skills carry a check and "已选用".
 *
 * The menu never executes anything: choosing calls `onSelect`; a disabled entry calls
 * `onDisabledSelect` instead. Groups: `option.group`, else 命令 / 技能 by kind.
 * Motion: MotionPresence `fade` (reduced → instant).
 */
export function SlashCommandMenu({
  open,
  query,
  options,
  activeIndex,
  onActiveIndexChange,
  onSelect,
  onDisabledSelect,
  loading = false,
  id,
  side,
  title,
  className,
}: SlashCommandMenuProps) {
  const messages = useAgentMessages().composer;
  const autoId = React.useId();
  const base = id ?? autoId;
  const listboxId = `${base}-listbox`;
  const choose = (index: number) => {
    const option = options[index];
    if (!option) return;
    if (option.disabled) onDisabledSelect?.(option);
    else onSelect(option);
  };

  let status: React.ReactNode = null;
  if (loading) {
    status = (
      <p className="rl-agent-menu__status" role="status">
        <Spinner size="sm" />
        {messages.commandLoading}
      </p>
    );
  } else if (options.length === 0) {
    status = (
      <p className="rl-agent-menu__status" role="status">
        {messages.commandEmpty}
      </p>
    );
  }

  const groupLabel = (o: CommandOption) => o.group ?? (o.kind === 'skill' ? messages.skillGroup : messages.commandGroup);

  return (
    <MenuPanel
      open={open}
      panelId={`${base}-panel`}
      listboxId={listboxId}
      label={messages.commandTitle}
      title={title ?? messages.commandTitle}
      keys={messages.commandKeys}
      icon={<AgentIcon name="slash" />}
      side={side}
      status={status}
      count={loading ? 0 : options.length}
      activeIndex={activeIndex}
      className={className}
    >
      {groupOptions(options, groupLabel).map((group) => (
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
              <AgentIcon name={option.kind === 'skill' ? 'spark' : option.kind === 'action' ? 'tool' : 'slash'} className="rl-agent-menu__icon" />
              <span className="rl-agent-menu__body">
                <span className="rl-agent-menu__label">
                  <span>
                    <Highlight text={option.label} query={query} />
                  </span>
                  <span className="rl-agent-menu__command">
                    /<Highlight text={option.name} query={query} />
                  </span>
                  {option.aliases && option.aliases.length > 0 && (
                    <span className="rl-agent-menu__aliases">{option.aliases.map((a) => `/${a}`).join(' ')}</span>
                  )}
                </span>
                {option.disabled ? (
                  <span className="rl-agent-menu__reason">{messages.optionUnavailable(option.disabledReason)}</span>
                ) : (
                  option.description && <span className="rl-agent-menu__detail">{option.description}</span>
                )}
              </span>
              {option.shortcut && (
                <kbd className="rl-agent-menu__kbd" aria-hidden="true">
                  {option.shortcut}
                </kbd>
              )}
              {option.selected && (
                <>
                  <AgentIcon name="check" className="rl-agent-menu__trail" />
                  <span className="rl-agent-sr">{messages.skillSelected}</span>
                </>
              )}
            </MenuOption>
          ))}
        </MenuGroup>
      ))}
    </MenuPanel>
  );
}
