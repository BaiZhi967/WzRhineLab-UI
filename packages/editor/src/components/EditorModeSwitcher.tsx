'use client';

import * as React from 'react';
import { Tab, TabList, TabPanel, Tabs } from '@wzrhine/react';
import type { EditorMode } from '../contracts.js';
import { useEditorMessages } from '../provider/EditorMessages.js';

export interface EditorModeSwitcherProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> {
  value: EditorMode;
  onModeChange: (mode: EditorMode) => void;
  label?: string;
}

export const EditorModeSwitcher = React.forwardRef<HTMLDivElement, EditorModeSwitcherProps>(function EditorModeSwitcher(
  { value, onModeChange, label, className, ...rest },
  ref,
) {
  const messages = useEditorMessages();
  return (
    <div {...rest} ref={ref} className={['rl-editor__mode-switcher', className].filter(Boolean).join(' ')}>
      <Tabs value={value} onValueChange={(next) => onModeChange(next as EditorMode)}>
        <TabList aria-label={label ?? messages.mode.label}>
          <Tab value="source">{messages.mode.source}</Tab>
          <Tab value="preview">{messages.mode.preview}</Tab>
          <Tab value="split">{messages.mode.split}</Tab>
        </TabList>
        <TabPanel value="source" className="rl-editor__mode-switcher-panel" />
        <TabPanel value="preview" className="rl-editor__mode-switcher-panel" />
        <TabPanel value="split" className="rl-editor__mode-switcher-panel" />
      </Tabs>
    </div>
  );
});
