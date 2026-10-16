'use client';

import * as React from 'react';
import { ToggleButton, Toolbar } from '@wzrhine/react';
import type { EditorCommand } from '../contracts.js';
import { useEditorMessages } from '../provider/EditorMessages.js';

export interface EditorToolbarCommand {
  id: string;
  label: string;
  command: EditorCommand;
  pressed?: boolean;
  disabled?: boolean;
  shortcut?: string;
  group?: string;
}

export interface EditorToolbarProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children' | 'role'> {
  commands: readonly EditorToolbarCommand[];
  onCommand: (command: EditorCommand) => void;
  readOnly?: boolean;
  composing?: boolean;
  toolbarStart?: React.ReactNode;
  toolbarEnd?: React.ReactNode;
  label?: string;
}

export const EditorToolbar = React.forwardRef<HTMLDivElement, EditorToolbarProps>(function EditorToolbar(
  { commands, onCommand, readOnly = false, composing = false, toolbarStart, toolbarEnd, label, className, ...rest },
  ref,
) {
  const messages = useEditorMessages();
  const blocked = readOnly || composing;
  return (
    <div {...rest} ref={ref} className={['rl-editor__toolbar', className].filter(Boolean).join(' ')}>
      <Toolbar label={label ?? messages.toolbar.label}>
        {toolbarStart}
        {commands.map((item) => {
          const disabled = blocked || item.disabled === true;
          return (
            <ToggleButton
              key={item.id}
              pressed={item.pressed === true}
              disabled={disabled}
              onPressedChange={() => onCommand(item.command)}
              aria-label={item.shortcut ? `${item.label} (${item.shortcut})` : item.label}
            >
              <span>{item.label}</span>
              {item.shortcut && <kbd aria-hidden="true">{item.shortcut}</kbd>}
            </ToggleButton>
          );
        })}
        {toolbarEnd}
      </Toolbar>
    </div>
  );
});
