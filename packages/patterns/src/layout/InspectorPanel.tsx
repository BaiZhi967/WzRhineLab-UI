'use client';

import * as React from 'react';
import { MetadataList } from '@wzrhine/react';
import type { MetadataItem } from '@wzrhine/react';
import { usePatternsMessages } from '../provider/PatternMessages.js';
import { cx } from '../utils/cx.js';

/**
 * Semantic inspector region (0.3.0-contracts §6.2): title, close, metadata, actions and content
 * slots with an accessible name. A region component — it runs no business actions; overlay use
 * composes the existing Drawer in a recipe. `open={false}` hides the whole region via the native
 * `hidden` attribute, so no invisible focusable controls remain. Null metadata values follow
 * MetadataList's own empty handling (hidden by default,「未记录」with `empty="placeholder"`).
 */
export interface InspectorPanelProps {
  title: React.ReactNode;
  /** Small archive-style label above the title, e.g. "INSPECTOR". */
  eyebrow?: React.ReactNode;
  /** Metadata rows, rendered with MetadataList (stacked, compact). */
  meta?: readonly MetadataItem[];
  /** Action bar; buttons are composed by the caller from @wzrhine/react. */
  actions?: React.ReactNode;
  children?: React.ReactNode;
  /** Rendered when provided; reports the intent only. */
  onClose?: () => void;
  /** Controlled visibility; false hides the region entirely. Defaults to true. */
  open?: boolean;
  closeLabel?: string;
  /** Accessible name of the region; defaults to a string `title`. */
  label?: string;
  className?: string;
}

export const InspectorPanel = React.forwardRef<HTMLElement, InspectorPanelProps>(function InspectorPanel(
  { title, eyebrow, meta, actions, children, onClose, open = true, closeLabel, label, className },
  ref,
) {
  const messages = usePatternsMessages();
  const name = label ?? (typeof title === 'string' ? title : undefined);
  return (
    <aside
      ref={ref}
      className={cx('rl-inspector', className)}
      data-slot="inspector-panel"
      aria-label={name}
      hidden={!open || undefined}
    >
      <header className="rl-inspector__header">
        <div className="rl-inspector__heading">
          {eyebrow != null && <p className="rl-inspector__eyebrow">{eyebrow}</p>}
          <div className="rl-inspector__title">{title}</div>
        </div>
        {onClose && (
          <button
            type="button"
            className="rl-inspector__close"
            aria-label={closeLabel ?? messages.inspectorPanel.close}
            onClick={onClose}
          >
            <svg className="rl-inspector__close-icon" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
              <path d="M4 4l8 8M12 4l-8 8" />
            </svg>
          </button>
        )}
      </header>
      {meta != null && meta.length > 0 && (
        <div className="rl-inspector__meta">
          <MetadataList items={meta} layout="stacked" size="sm" />
        </div>
      )}
      {actions != null && <div className="rl-inspector__actions">{actions}</div>}
      <div className="rl-inspector__body">{children}</div>
    </aside>
  );
});
