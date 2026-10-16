'use client';

import * as React from 'react';
import { Icon, IconButton } from '@wzrhine/react';
import { useEditorMessages } from '../provider/EditorMessages.js';

export interface DocumentTab {
  id: string;
  title: string;
  dirty?: boolean;
  closable?: boolean;
  disabled?: boolean;
}

export interface DocumentTabsProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children' | 'role'> {
  tabs: readonly DocumentTab[];
  activeId: string;
  onActiveChange: (id: string) => void;
  onClose?: (id: string) => void;
  onCloseRequest?: (tab: DocumentTab) => void;
  label?: string;
  closeLabel?: (title: string) => string;
}

function closeIcon() {
  return <Icon name="Close" size="1em"><path d="M6 6l12 12M18 6 6 18" /></Icon>;
}

export const DocumentTabs = React.forwardRef<HTMLDivElement, DocumentTabsProps>(function DocumentTabs(
  { tabs, activeId, onActiveChange, onClose, onCloseRequest, label, closeLabel, className, ...rest },
  ref,
) {
  const messages = useEditorMessages();
  const tabRefs = React.useRef(new Map<string, HTMLButtonElement>());
  const activate = (id: string) => onActiveChange(id);
  const move = (index: number, direction: 1 | -1) => {
    if (tabs.length === 0) return;
    for (let offset = 1; offset <= tabs.length; offset += 1) {
      const next = tabs[(index + direction * offset + tabs.length) % tabs.length];
      if (next && !next.disabled) {
        activate(next.id);
        tabRefs.current.get(next.id)?.focus();
        return;
      }
    }
  };
  const close = (tab: DocumentTab) => {
    if (tab.closable === false) return;
    if (onCloseRequest) onCloseRequest(tab);
    else onClose?.(tab.id);
    const index = tabs.findIndex((item) => item.id === tab.id);
    const fallback = tabs[index + 1] ?? tabs[index - 1];
    if (fallback) requestAnimationFrame(() => tabRefs.current.get(fallback.id)?.focus());
  };

  return (
    <div {...rest} ref={ref} className={['rl-editor__document-tabs', className].filter(Boolean).join(' ')}>
      <div role="tablist" aria-label={label ?? messages.tabs.label} className="rl-editor__document-tab-list">
        {tabs.map((tab, index) => {
          const dirtyId = `rl-editor-tab-dirty-${index}`;
          return (
            <div className="rl-editor__document-tab" data-active={tab.id === activeId || undefined} key={tab.id}>
              <button
                type="button"
                role="tab"
                ref={(node) => { if (node) tabRefs.current.set(tab.id, node); else tabRefs.current.delete(tab.id); }}
                aria-selected={tab.id === activeId}
                aria-controls={`rl-editor-panel-${tab.id}`}
                aria-describedby={tab.dirty ? dirtyId : undefined}
                aria-disabled={tab.disabled || undefined}
                disabled={tab.disabled}
                tabIndex={tab.id === activeId ? 0 : -1}
                data-tab-id={tab.id}
                onClick={() => activate(tab.id)}
                onKeyDown={(event) => {
                  if (event.key === 'ArrowRight') { event.preventDefault(); move(index, 1); }
                  else if (event.key === 'ArrowLeft') { event.preventDefault(); move(index, -1); }
                  else if (event.key === 'Home') { event.preventDefault(); tabs.find((item) => !item.disabled) && tabRefs.current.get(tabs.find((item) => !item.disabled)!.id)?.focus(); }
                  else if (event.key === 'End') { event.preventDefault(); [...tabs].reverse().find((item) => !item.disabled) && tabRefs.current.get([...tabs].reverse().find((item) => !item.disabled)!.id)?.focus(); }
                  else if (event.key === 'Delete' && tab.closable !== false) { event.preventDefault(); close(tab); }
                }}
              >
                <span className="rl-editor__document-tab-title">{tab.title}</span>
                {tab.dirty && <span id={dirtyId} className="rl-editor__document-tab-dirty"><span aria-hidden="true">•</span><span className="rl-editor__sr">{messages.tabs.dirty}</span></span>}
              </button>
              {tab.closable !== false && (
                <IconButton
                  size="sm"
                  variant="ghost"
                  label={(closeLabel ?? messages.tabs.close)(tab.title)}
                  icon={closeIcon()}
                  onClick={(event) => { event.stopPropagation(); close(tab); }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
});
