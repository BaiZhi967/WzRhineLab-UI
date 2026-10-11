'use client';

import * as React from 'react';
import { Collapsible, IconButton, Spinner } from '@wzrhine/react';
import type { CitationView, PinnedSummaryView } from '@wzrhine/agent-core';
import { useAgentFormat } from '../../provider/AgentMessages.js';
import { AgentIcon } from '../../primitives/icons.js';
import { cx } from '../../utils/cx.js';
import { Heading, useWorkspaceMessages } from './shared.js';
import type { HeadingLevel, WorkspaceMessagesProp } from './shared.js';

export type PinnedSummaryProps = Omit<React.HTMLAttributes<HTMLElement>, 'children'> & {
  summary: PinnedSummaryView;
  /** Body expanded (controlled). */
  expanded?: boolean;
  defaultExpanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
  /** Pin state; the pin toggle is drawn only with `onPinChange`. */
  pinned?: boolean;
  onPinChange?: (pinned: boolean) => void;
  /** Opens a source. Without it sources are listed as text. */
  onOpenSource?: (citation: CitationView) => void;
  /** Markdown renderer for the body; default is plain text with kept line breaks. */
  renderMarkdown?: (source: string) => React.ReactNode;
  headingLevel?: HeadingLevel;
  messages?: WorkspaceMessagesProp;
};

/**
 * PinnedSummary (atlas 28): read-only card with the important context of a conversation. The body
 * sits in a Collapsible (CSS height transition, interruptible, instant under reduced motion).
 * Content updates never replay an entrance; `updating` shows a small Spinner with 「正在更新」,
 * `stale` a warning sentence, `missing` an empty sentence. Unavailable sources stay listed but
 * disabled, with the reason as visible text.
 */
export const PinnedSummary = React.forwardRef<HTMLElement, PinnedSummaryProps>(function PinnedSummary(
  {
    summary,
    expanded,
    defaultExpanded = true,
    onExpandedChange,
    pinned,
    onPinChange,
    onOpenSource,
    renderMarkdown,
    headingLevel = 3,
    messages: override,
    className,
    ...rest
  },
  ref,
) {
  const m = useWorkspaceMessages(override);
  const format = useAgentFormat();
  const id = React.useId();
  const titleId = `${id}-title`;
  const sources = summary.sources ?? [];

  return (
    <section {...rest} ref={ref} className={cx('rl-agent-summary', className)} aria-labelledby={titleId} data-status={summary.status}>
      <header className="rl-agent-summary__header">
        <AgentIcon name="pin" className="rl-agent-summary__icon" />
        <Heading level={headingLevel} id={titleId} className="rl-agent-summary__title">
          {summary.title}
        </Heading>
        {onPinChange && (
          <IconButton
            size="sm"
            variant="ghost"
            icon={<AgentIcon name="pin" />}
            label={m.summaryPin}
            pressed={Boolean(pinned)}
            onClick={() => onPinChange(!pinned)}
          />
        )}
      </header>
      <p className="rl-agent-summary__state" role="status">
        {summary.status === 'updating' && (
          <>
            <Spinner size="sm" />
            <span>{m.summaryStatus.updating}</span>
          </>
        )}
        {summary.status === 'stale' && (
          <span className="rl-agent-summary__stale">
            <AgentIcon name="warning" />
            {m.summaryStatus.stale}
          </span>
        )}
      </p>
      {summary.status === 'missing' && !summary.body ? (
        <p className="rl-agent-summary__missing">{m.summaryStatus.missing}</p>
      ) : (
        <Collapsible
          className="rl-agent-summary__disclosure"
          open={expanded}
          defaultOpen={expanded === undefined ? defaultExpanded : undefined}
          onOpenChange={onExpandedChange}
          trigger={<span>{m.summaryToggle}</span>}
        >
          <div className="rl-agent-summary__body">{renderMarkdown ? renderMarkdown(summary.body) : <p className="rl-agent-summary__text">{summary.body}</p>}</div>
          {summary.tags && summary.tags.length > 0 && (
            <ul className="rl-agent-summary__tags" aria-label={m.summaryTags}>
              {summary.tags.map((tag) => (
                <li key={tag} className="rl-agent-summary__tag">
                  {tag}
                </li>
              ))}
            </ul>
          )}
          {sources.length > 0 && (
            <div className="rl-agent-summary__sources">
              <p className="rl-agent-summary__sources-title" id={`${id}-sources`}>
                {m.summarySources(sources.length)}
              </p>
              <ul className="rl-agent-summary__source-list" aria-labelledby={`${id}-sources`}>
                {sources.map((source) => (
                  <li key={source.id}>
                    <SourceButton source={source} onOpenSource={onOpenSource} m={m} />
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Collapsible>
      )}
      {summary.updatedAt && (
        <p className="rl-agent-summary__updated">
          <time dateTime={summary.updatedAt}>{m.summaryUpdatedAt(format.time(summary.updatedAt))}</time>
        </p>
      )}
    </section>
  );
});

function SourceButton({ source, onOpenSource, m }: { source: CitationView; onOpenSource?: (c: CitationView) => void; m: ReturnType<typeof useWorkspaceMessages> }) {
  const reasonId = React.useId();
  const content = (
    <>
      <span className="rl-agent-summary__source-index">[{source.index}]</span>
      <span className="rl-agent-summary__source-title">{source.title}</span>
    </>
  );
  const reason = source.unavailable ? (
    <span id={reasonId} className="rl-agent-summary__source-reason">
      {source.reason ?? m.summarySourceUnavailable}
    </span>
  ) : null;
  if (!onOpenSource) {
    return (
      <span className="rl-agent-summary__source" data-unavailable={source.unavailable || undefined} title={source.locator}>
        {content}
        {reason}
      </span>
    );
  }
  return (
    <span className="rl-agent-summary__source-row">
      <button
        type="button"
        className="rl-agent-summary__source"
        disabled={source.unavailable}
        aria-label={m.summaryOpenSource(source.title)}
        aria-describedby={source.unavailable ? reasonId : undefined}
        title={source.locator}
        data-unavailable={source.unavailable || undefined}
        onClick={() => onOpenSource(source)}
      >
        {content}
      </button>
      {reason}
    </span>
  );
}
