'use client';

import * as React from 'react';
import { IconButton } from '@wzrhine/react';
import type { FilePreviewView } from '@wzrhine/agent-core';
import { AgentIcon } from '../../primitives/icons.js';
import type { AgentIconName } from '../../primitives/icons.js';
import { cx } from '../../utils/cx.js';
import { useWorkspaceMessages } from '../workspace/shared.js';
import type { WorkspaceMessagesProp } from '../workspace/shared.js';

export interface FilePreviewTab {
  id: string;
  name: string;
  kind?: FilePreviewView['kind'];
}

export type FilePreviewTabsProps = Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> & {
  tabs: FilePreviewTab[];
  /** The open tab (controlled). */
  activeId: string;
  onActivate: (id: string) => void;
  onCloseTab: (id: string) => void;
  /** Closes every file; Escape inside the strip and the trailing close button call it. */
  onCloseAll?: () => void;
  /** Panel content of the active tab (usually a `FilePreview`). */
  renderPanel: (id: string) => React.ReactNode;
  /** Focus target after the last tab closes (the element that opened the preview). */
  returnFocusRef?: React.RefObject<HTMLElement | null>;
  messages?: WorkspaceMessagesProp;
};

const kindIcon: Record<FilePreviewView['kind'], AgentIconName> = {
  text: 'file',
  markdown: 'file',
  code: 'code',
  image: 'image',
  binary: 'database',
  unknown: 'file',
};

/**
 * FilePreviewTabs: a strip of open files above one preview panel. ARIA tabs with a roving
 * tabIndex: ←/→ move to the neighbour and activate it (wrapping), Home / End jump to the ends;
 * Delete / Backspace close the focused tab; Escape anywhere in the strip calls `onCloseAll`.
 * A middle click (`auxclick`, button 1) closes a tab. Each tab has its own close button named
 * 「关闭 name」 (not inside the tab, so the tab keeps a plain name).
 *
 * When the active tab closes, the next neighbour (or the previous one at the end) activates and
 * receives focus; when the last tab closes, focus moves to `returnFocusRef`. The active tab is
 * kept in view with `scrollIntoView({ inline: 'nearest' })` (guarded for environments without
 * it). Long names truncate visually; the full name is in `title` and in the accessible name.
 *
 * Motion: none (the active marker is a colour/border change).
 */
export const FilePreviewTabs = React.forwardRef<HTMLDivElement, FilePreviewTabsProps>(function FilePreviewTabs(
  { tabs, activeId, onActivate, onCloseTab, onCloseAll, renderPanel, returnFocusRef, messages: override, className, ...rest },
  ref,
) {
  const m = useWorkspaceMessages(override);
  const baseId = React.useId();
  const tabRefs = React.useRef(new Map<string, HTMLButtonElement>());
  const pendingFocus = React.useRef<string | null | 'return'>(null);
  const active = tabs.find((t) => t.id === activeId) ?? tabs[0];
  const tabId = (id: string) => `${baseId}-tab-${id}`;
  const panelId = `${baseId}-panel`;

  React.useEffect(() => {
    if (!active) return;
    const el = tabRefs.current.get(active.id);
    if (el && typeof el.scrollIntoView === 'function') el.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }, [active?.id]);

  // Hosts often unmount the strip once nothing is open: return focus from the unmount as well.
  const returnRef = React.useRef(returnFocusRef);
  returnRef.current = returnFocusRef;
  React.useEffect(
    () => () => {
      if (pendingFocus.current === 'return') returnRef.current?.current?.focus();
    },
    [],
  );

  // Focus moves after the host re-renders with the new tab list.
  React.useEffect(() => {
    const target = pendingFocus.current;
    if (target === null) return;
    pendingFocus.current = null;
    if (target === 'return') returnFocusRef?.current?.focus();
    else tabRefs.current.get(target)?.focus();
  });

  const activate = (id: string, focus: boolean) => {
    if (focus) pendingFocus.current = id;
    if (id !== active?.id) onActivate(id);
    else if (focus) tabRefs.current.get(id)?.focus();
  };

  const close = (id: string) => {
    const index = tabs.findIndex((t) => t.id === id);
    if (index < 0) return;
    const rest = tabs.filter((t) => t.id !== id);
    if (rest.length === 0) {
      pendingFocus.current = 'return';
    } else if (id === active?.id) {
      const next = rest[Math.min(index, rest.length - 1)]!;
      pendingFocus.current = next.id;
      onActivate(next.id);
    } else {
      // Closing a background tab from its close button keeps focus on the active tab.
      pendingFocus.current = active?.id ?? null;
    }
    onCloseTab(id);
  };

  const onTabKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    const count = tabs.length;
    let next: number | undefined;
    switch (event.key) {
      case 'ArrowRight':
        next = (index + 1) % count;
        break;
      case 'ArrowLeft':
        next = (index - 1 + count) % count;
        break;
      case 'Home':
        next = 0;
        break;
      case 'End':
        next = count - 1;
        break;
      case 'Delete':
      case 'Backspace':
        event.preventDefault();
        close(tabs[index]!.id);
        return;
      default:
        return;
    }
    event.preventDefault();
    activate(tabs[next]!.id, true);
  };

  if (tabs.length === 0) return null;

  return (
    <div {...rest} ref={ref} className={cx('rl-agent-file-tabs', className)}>
      <div
        className="rl-agent-file-tabs__bar"
        onKeyDown={(event) => {
          if (event.key === 'Escape' && onCloseAll) {
            event.preventDefault();
            pendingFocus.current = 'return';
            onCloseAll();
          }
        }}
      >
        {/*
         * The tablist owns only tabs (close buttons inside it would break the tablist's required
         * children). It is `display: contents`, so tabs and their close buttons sit side by side
         * as flex items of the scroller, paired visually through `order`.
         */}
        <div className="rl-agent-file-tabs__scroller">
        <div className="rl-agent-file-tabs__strip" role="tablist" aria-label={m.fileTabs} aria-orientation="horizontal">
          {tabs.map((tab, index) => {
            const selected = tab.id === active?.id;
            return (
              <button
                key={tab.id}
                ref={(el) => {
                  if (el) tabRefs.current.set(tab.id, el);
                  else tabRefs.current.delete(tab.id);
                }}
                type="button"
                role="tab"
                id={tabId(tab.id)}
                className="rl-agent-file-tabs__tab"
                data-active={selected || undefined}
                style={{ order: index * 2 }}
                aria-selected={selected}
                aria-controls={selected ? panelId : undefined}
                tabIndex={selected ? 0 : -1}
                title={tab.name}
                onClick={() => activate(tab.id, false)}
                onMouseDown={(event) => {
                  // Stop the browser's middle-click autoscroll so auxclick can close the tab.
                  if (event.button === 1) event.preventDefault();
                }}
                onAuxClick={(event) => {
                  if (event.button !== 1) return;
                  event.preventDefault();
                  close(tab.id);
                }}
                onKeyDown={(event) => onTabKeyDown(event, index)}
              >
                <AgentIcon name={kindIcon[tab.kind ?? 'unknown']} className="rl-agent-file-tabs__icon" />
                <span className="rl-agent-file-tabs__name">{tab.name}</span>
              </button>
            );
          })}
        </div>
        {tabs.map((tab, index) => {
          const selected = tab.id === active?.id;
          return (
            <button
              key={tab.id}
              type="button"
              className="rl-agent-file-tabs__close"
              data-active={selected || undefined}
              style={{ order: index * 2 + 1 }}
              aria-label={m.fileTabClose(tab.name)}
              title={m.fileTabCloseTitle}
              tabIndex={selected ? 0 : -1}
              onClick={() => close(tab.id)}
            >
              <AgentIcon name="close" />
            </button>
          );
        })}
        </div>
        {onCloseAll && (
          <IconButton
            size="sm"
            variant="ghost"
            className="rl-agent-file-tabs__close-all"
            icon={<AgentIcon name="close" />}
            label={m.fileTabCloseAll}
            onClick={() => {
              pendingFocus.current = 'return';
              onCloseAll();
            }}
          />
        )}
      </div>
      {active && (
        <div id={panelId} role="tabpanel" aria-labelledby={tabId(active.id)} className="rl-agent-file-tabs__panel" tabIndex={-1}>
          {renderPanel(active.id)}
        </div>
      )}
    </div>
  );
});
