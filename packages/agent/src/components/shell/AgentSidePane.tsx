'use client';

import * as React from 'react';
import { IconButton, Tab, TabList, TabPanel, Tabs } from '@wzrhine/react';
import { useAgentFormat, useAgentMessages } from '../../provider/AgentMessages.js';
import { AgentIcon } from '../../primitives/icons.js';
import { cx } from '../../utils/cx.js';
import { useAgentContextPresentation, useAgentShell } from './AgentShell.js';
import { useControllable } from './use-controllable.js';

/**
 * AgentSidePane (atlas 26): the context / detail pane. A `complementary` landmark
 * (`<aside aria-label>`) with Tabs (@wzrhine/react) over `sections`.
 *
 * - Every panel stays mounted (`keepMounted`), hidden ones with `hidden`, and each panel is its
 *   own scroll container, so switching tabs keeps every tab's scroll position.
 * - A panel that overflows becomes keyboard-scrollable (`tabIndex=0` comes from Base UI).
 * - `count` renders after the tab label and is part of the tab's name; `content` can carry its
 *   own loading / error / empty state.
 * - Close button only with `onClose`, or automatically inside an inline AgentShell pane (it
 *   closes the pane and the shell returns focus). Inside the shell's sheet the Drawer has its
 *   own close button, so the pane's title row and close button are not repeated there.
 * - With one section the tab strip is omitted and the section label becomes the heading.
 * - Motion: tab indicator from Tabs (CSS, `--rl-motion-base`); pane open / close belongs to
 *   AgentShell. No content drift between tabs.
 */
export interface AgentSidePaneSection {
  id: string;
  label: string;
  count?: number;
  content: React.ReactNode;
}

export type AgentSidePaneProps = Omit<React.HTMLAttributes<HTMLElement>, 'children' | 'title'> & {
  sections: AgentSidePaneSection[];
  activeTab?: string;
  defaultTab?: string;
  onTabChange?: (id: string) => void;
  /** Accessible name of the landmark (and visible heading). */
  label?: string;
  /** Hide the visible heading (the landmark keeps its name). */
  hideHeading?: boolean;
  onClose?: () => void;
  closeLabel?: string;
  /** Accessible name of the tab list. */
  tabsLabel?: string;
  headingLevel?: 2 | 3 | 4 | 5 | 6;
};

export const AgentSidePane = React.forwardRef<HTMLElement, AgentSidePaneProps>(function AgentSidePane(
  {
    sections,
    activeTab,
    defaultTab,
    onTabChange,
    label,
    hideHeading = false,
    onClose: onCloseProp,
    closeLabel,
    tabsLabel,
    headingLevel = 2,
    className,
    ...rest
  },
  ref,
) {
  const shell = useAgentMessages().shell;
  const format = useAgentFormat();
  const shellState = useAgentShell();
  const presentation = useAgentContextPresentation();
  const headingId = React.useId();
  const [current, setCurrent] = useControllable(activeTab, defaultTab ?? sections[0]?.id ?? '', onTabChange);
  const value = sections.some((section) => section.id === current) ? current : (sections[0]?.id ?? '');
  const name = label ?? shell.paneLabel;
  const Heading = `h${headingLevel}` as 'h2';
  const inSheet = presentation === 'sheet';
  const onClose = onCloseProp ?? (presentation === 'inline' && shellState ? () => shellState.setContextOpen(false, 'toggle') : undefined);
  const single = sections.length === 1 ? sections[0] : undefined;
  const showHead = !inSheet && (!hideHeading || onClose);

  return (
    <aside {...rest} ref={ref} className={cx('rl-agent-pane', className)} aria-label={name} data-presentation={presentation}>
      {showHead && (
        <div className="rl-agent-pane__head">
          {hideHeading ? (
            <span />
          ) : (
            <Heading id={headingId} className="rl-agent-pane__title">
              {single ? single.label : name}
            </Heading>
          )}
          {onClose && !inSheet && (
            <IconButton size="sm" icon={<AgentIcon name="close" />} label={closeLabel ?? shell.paneClose} onClick={onClose} />
          )}
        </div>
      )}
      {single ? (
        <div className="rl-agent-pane__panel rl-agent-pane__panel--single">{single.content}</div>
      ) : (
        sections.length > 0 && (
          <Tabs className="rl-agent-pane__tabs" value={value} onValueChange={setCurrent} size="sm">
            <TabList className="rl-agent-pane__tablist" aria-label={tabsLabel ?? shell.paneTabs}>
              {sections.map((section) => (
                <Tab key={section.id} value={section.id} meta={section.count != null ? format.compact(section.count) : undefined}>
                  {section.label}
                </Tab>
              ))}
            </TabList>
            {sections.map((section) => (
              <TabPanel key={section.id} value={section.id} keepMounted className="rl-agent-pane__panel">
                {section.content}
              </TabPanel>
            ))}
          </Tabs>
        )
      )}
    </aside>
  );
});
