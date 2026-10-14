'use client';

import * as React from 'react';
import { Tooltip } from '@wzrhine/react';
import type { CitationSourceType, CitationView } from '@wzrhine/agent-core';
import { AgentIcon } from '../../primitives/icons.js';
import type { AgentIconName } from '../../primitives/icons.js';
import { useAgentMessages } from '../../provider/AgentMessages.js';
import { cx } from '../../utils/cx.js';

/**
 * CitationChip (atlas 32): an inline `<button>` showing "[n]" (or a short label) inside running
 * text. Hover / focus shows a card with title, source type, locator and excerpt; the same text is
 * the button's description (`aria-describedby` → a `hidden` node), so it is never hover-only.
 *
 * - Available + `onOpen`: activating calls `onOpen(citation)`.
 * - Available without `onOpen`: the chip is informational (card on hover / focus, description).
 * - Unavailable: `aria-disabled`, still focusable, struck style, the reason is in the name and the
 *   card; `onOpen` is never called — a dead source is never presented as openable.
 *
 * Layout: same font size and inherited line height as the surrounding text, so a paragraph with
 * many chips keeps its line rhythm and wraps between chips. Motion: background colour only.
 */
export type CitationChipProps = Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'onClick' | 'type'> & {
  citation: CitationView;
  onOpen?: (citation: CitationView) => void;
  /** Visible text instead of "[n]" (e.g. a short file name). */
  label?: React.ReactNode;
  /** Show the source-type icon before the index. */
  showIcon?: boolean;
  /** Custom icon content (SVG inner nodes); wins over the built-in source-type icon. */
  icon?: React.ReactNode;
  selected?: boolean;
};

/** Icon per built-in source type; custom types fall back to the `other` icon (ADR-0013 §2). */
const sourceIcon: Record<CitationSourceType, AgentIconName> = {
  file: 'file',
  web: 'globe',
  code: 'code',
  dataset: 'database',
  message: 'list',
  other: 'link',
};

export const CitationChip = React.forwardRef<HTMLButtonElement, CitationChipProps>(function CitationChip(
  { citation, onOpen, label, showIcon = false, icon, selected, className, ...rest },
  ref,
) {
  const t = useAgentMessages().message;
  const descriptionId = React.useId();
  const unavailable = citation.unavailable === true;
  const openable = !unavailable && onOpen !== undefined;
  const name = t.citationName(citation.index, citation.title) + (unavailable ? ` (${t.citationUnavailable})` : '');
  const reason = unavailable ? (citation.reason ?? t.citationUnavailable) : undefined;
  const sourceLabel = t.sourceType[citation.sourceType] ?? citation.sourceType;
  const description = [sourceLabel, citation.locator, reason, citation.excerpt].filter(Boolean).join(' · ');

  const card = (
    <span className="rl-agent-cite__card">
      <span className="rl-agent-cite__card-title">{citation.title}</span>
      <span className="rl-agent-cite__card-meta">
        {sourceLabel}
        {citation.locator && <span className="rl-agent-cite__card-locator">{citation.locator}</span>}
      </span>
      {reason && <span className="rl-agent-cite__card-reason">{reason}</span>}
      {citation.excerpt && <span className="rl-agent-cite__card-excerpt">{citation.excerpt}</span>}
    </span>
  );

  return (
    <>
      <Tooltip content={card} className="rl-agent-cite__tooltip">
        <button
          {...rest}
          ref={ref}
          type="button"
          className={cx('rl-agent-cite', className)}
          aria-label={name}
          aria-describedby={descriptionId}
          aria-disabled={unavailable || undefined}
          aria-pressed={selected}
          data-source={citation.sourceType}
          data-unavailable={unavailable || undefined}
          data-selected={selected || undefined}
          onClick={() => {
            if (openable) onOpen(citation);
          }}
        >
          {showIcon && (
            <AgentIcon name={sourceIcon[citation.sourceType as CitationSourceType] ?? 'link'} className="rl-agent-cite__icon">
              {icon}
            </AgentIcon>
          )}
          <span className="rl-agent-cite__text">{label ?? `[${citation.index}]`}</span>
        </button>
      </Tooltip>
      <span id={descriptionId} hidden>
        {description}
      </span>
    </>
  );
});
