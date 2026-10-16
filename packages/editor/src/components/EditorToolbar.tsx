'use client';

import * as React from 'react';
import { Button, Separator, ToggleButton, Toolbar } from '@wzrhine/react';
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
  let previousGroup: string | undefined;
  return (
    <div {...rest} ref={ref} className={['rl-editor__toolbar', className].filter(Boolean).join(' ')}>
      <Toolbar label={label ?? messages.toolbar.label}>
        {toolbarStart && <span data-rl-toolbar-slot="start" className="rl-editor__toolbar-slot">{toolbarStart}</span>}
        {commands.flatMap((item) => {
          const separator = item.group && item.group !== previousGroup && previousGroup !== undefined
            ? <Separator key={`${item.id}-separator`} data-rl-toolbar-slot="separator" decorative orientation="vertical" />
            : null;
          previousGroup = item.group;
          const disabled = blocked || item.disabled === true;
          const label = <><span>{item.label}</span>{item.shortcut && <kbd aria-hidden="true">{item.shortcut}</kbd>}</>;
          const toggle = item.command.type === 'toggle-mark' || item.command.type === 'toggle-list';
          return [separator, toggle ? (
            <ToggleButton key={item.id} pressed={item.pressed === true} disabled={disabled} onPressedChange={() => onCommand(item.command)} aria-label={item.shortcut ? `${item.label} (${item.shortcut})` : item.label}>{label}</ToggleButton>
          ) : (
            <Button key={item.id} size="sm" variant="ghost" disabled={disabled} onClick={() => onCommand(item.command)} aria-label={item.shortcut ? `${item.label} (${item.shortcut})` : item.label}>{label}</Button>
          )];
        })}
        {toolbarEnd && <span data-rl-toolbar-slot="end" className="rl-editor__toolbar-slot">{toolbarEnd}</span>}
      </Toolbar>
    </div>
  );
});
