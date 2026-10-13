'use client';

import * as React from 'react';
import type { ToolCallView } from '@wzrhine/agent-core';
import { toolStatusMeta } from '@wzrhine/agent-core';
import { Collapsible, Skeleton } from '@wzrhine/react';
import { useAgentFormat, useAgentMessages } from '../../provider/AgentMessages.js';
import { cx } from '../../utils/cx.js';
import { ToolDetail } from './ToolDetails.js';
import type { ToolDetailActions } from './ToolDetails.js';
import { ActionButton, ToolCategoryChip, Notice, ToolStatusPill } from './shared.js';

/**
 * ToolRecord (atlas 12): one tool call. The whole row is the disclosure trigger (a real
 * `<button>` from `@wzrhine/react` Collapsible, `aria-expanded` / `aria-controls`) whose
 * accessible name reads category, name, subject, summary, status and elapsed time. The raw tool
 * name is in the name's `title` and in the details.
 *
 * Details mount on first open (the panel is unmounted while closed). When
 * `tool.detailsLoaded === false`, opening calls `onLoadDetails(id)` once and shows a skeleton in
 * an `aria-busy` container until the adapter delivers the record; `detailsError` shows the
 * failure with a retry that calls `onLoadDetails` again. A summary is never presented as the full
 * record. The expanded state lives here (or in `expanded` / `onExpandedChange`) and survives any
 * status change. Height animates through Collapsible (CSS, interruptible, instant when reduced);
 * the row itself has no layout animation.
 */
export type ToolRecordProps = Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> & {
  tool: ToolCallView;
  expanded?: boolean;
  defaultExpanded?: boolean;
  onExpandedChange?: (expanded: boolean, id: string) => void;
  /** Called when the row opens and `tool.detailsLoaded === false`, and on retry. */
  onLoadDetails?: (id: string) => void;
  /** Loading the full record failed (shown with a retry when `onLoadDetails` exists). */
  detailsError?: React.ReactNode;
  detailsLoading?: boolean;
  onRetry?: (tool: ToolCallView) => void;
  /** Override the detail body. Return `undefined` to fall back to the built-in view. */
  renderDetail?: (tool: ToolCallView) => React.ReactNode | undefined;
  /** Callbacks for the built-in detail views (read more, reload, open terminal…). */
  detailActions?: ToolDetailActions;
  /** Controls placed next to the row (outside the trigger button), e.g. 「在对话中定位」. */
  actions?: React.ReactNode;
  /** Extra content at the end of the details (e.g. Code Mode script). */
  detailsFooter?: React.ReactNode;
};

export const ToolRecord = React.forwardRef<HTMLDivElement, ToolRecordProps>(function ToolRecord(
  {
    tool,
    expanded,
    defaultExpanded = false,
    onExpandedChange,
    onLoadDetails,
    detailsError,
    detailsLoading = false,
    onRetry,
    renderDetail,
    detailActions,
    actions,
    detailsFooter,
    className,
    ...rest
  },
  ref,
) {
  const messages = useAgentMessages();
  const m = messages.tools;
  const fmt = useAgentFormat();
  const [innerOpen, setInnerOpen] = React.useState(defaultExpanded);
  const open = expanded ?? innerOpen;
  const requested = React.useRef(false);
  const needsLoad = tool.detailsLoaded === false || detailsLoading;

  // One request per row while the record is missing; StrictMode-safe via the ref.
  React.useEffect(() => {
    if (!needsLoad) {
      requested.current = false;
      return;
    }
    if (open && !requested.current && onLoadDetails && detailsError == null) {
      requested.current = true;
      onLoadDetails(tool.id);
    }
  }, [open, needsLoad, onLoadDetails, detailsError, tool.id]);

  const setOpen = (next: boolean) => {
    if (expanded === undefined) setInnerOpen(next);
    onExpandedChange?.(next, tool.id);
  };

  const category = tool.category ?? 'other';
  const name = tool.displayName ?? tool.name;
  const statusLabel = messages.status.tool[tool.status] ?? tool.status;
  const elapsed = tool.elapsedMs != null ? fmt.duration(tool.elapsedMs) : undefined;
  const label = m.rowLabel({
    category: messages.status.category[category],
    name,
    subject: tool.subject,
    summary: tool.summary,
    status: statusLabel,
    elapsed: elapsed ? messages.status.elapsed(elapsed) : undefined,
  });
  const meta = toolStatusMeta[tool.status] ?? toolStatusMeta.unknown;

  const trigger = (
    <span className="rl-agent-tool-row">
      <ToolCategoryChip category={category} className="rl-agent-tool-row__chip" />
      <span className="rl-agent-tool-row__main">
        <span className="rl-agent-tool-row__name" title={tool.name}>
          {name}
        </span>
        {tool.subject && (
          <span className="rl-agent-tool-row__subject" title={tool.subject}>
            {tool.subject}
          </span>
        )}
        {tool.summary && <span className="rl-agent-tool-row__summary">{tool.summary}</span>}
      </span>
      <span className="rl-agent-tool-row__status">
        <ToolStatusPill status={tool.status} />
        {elapsed && <span className="rl-agent-tool-row__elapsed">{elapsed}</span>}
      </span>
    </span>
  );

  return (
    <div
      {...rest}
      ref={ref}
      className={cx('rl-agent-tool', className)}
      data-status={tool.status}
      data-category={category}
      data-active={meta.active || undefined}
      data-tool-id={tool.id}
    >
      <div className="rl-agent-tool__head">
        {tool.failure && <Notice tone="danger" action={tool.failure.retryable && onRetry && <ActionButton icon="retry" onClick={() => onRetry(tool)}>{m.retry}</ActionButton>}><code>{tool.failure.code}</code> {tool.failure.message}</Notice>}
        <Collapsible
          className="rl-agent-tool__disclosure"
          open={open}
          onOpenChange={setOpen}
          trigger={trigger}
          triggerProps={{
            className: 'rl-agent-tool__trigger',
            'aria-label': label,
          }}
          panelClassName="rl-agent-tool__panel"
        >
          <ToolRecordDetails
            tool={tool}
            name={name}
            needsLoad={needsLoad}
            detailsError={detailsError}
            onRetry={onLoadDetails ? () => onLoadDetails(tool.id) : undefined}
            renderDetail={renderDetail}
            detailActions={detailActions}
            footer={detailsFooter}
          />
        </Collapsible>
        {actions != null && <div className="rl-agent-tool__actions">{actions}</div>}
      </div>
    </div>
  );
});

function ToolRecordDetails({
  tool,
  name,
  needsLoad,
  detailsError,
  onRetry,
  renderDetail,
  detailActions,
  footer,
}: {
  tool: ToolCallView;
  name: string;
  needsLoad: boolean;
  detailsError?: React.ReactNode;
  onRetry?: () => void;
  renderDetail?: (tool: ToolCallView) => React.ReactNode | undefined;
  detailActions?: ToolDetailActions;
  footer?: React.ReactNode;
}) {
  const messages = useAgentMessages();
  const m = messages.tools;
  const auth = tool.authorization;
  let body: React.ReactNode;
  if (needsLoad && detailsError != null) {
    body = (
      <Notice
        tone="danger"
        action={
          onRetry && (
            <ActionButton icon="retry" onClick={onRetry}>
              {m.retry}
            </ActionButton>
          )
        }
      >
        {detailsError === true || detailsError === '' ? m.detailsError : detailsError}
      </Notice>
    );
  } else if (needsLoad) {
    body = (
      <div className="rl-agent-tool__loading" aria-busy="true">
        <Skeleton shape="text" lines={3} />
        <p className="rl-agent-tool__loading-text" role="status">
          {m.loadingDetails}
        </p>
      </div>
    );
  } else {
    const custom = renderDetail?.(tool);
    body =
      custom !== undefined ? (
        custom
      ) : tool.detail ? (
        <ToolDetail tool={tool} {...detailActions} />
      ) : (
        <p className="rl-agent-detail__aside">{m.noDetails}</p>
      );
  }
  const receipt = tool.receipt && tool.receipt.status !== 'idle' ? tool.receipt : undefined;
  return (
    <div className="rl-agent-tool__details" role="group" aria-label={m.detailsRegion(name)}>
      <p className="rl-agent-tool__facts">
        <code className="rl-agent-tool__raw" title={m.rawName(tool.name)}>
          {tool.name}
        </code>
        {auth && <span className="rl-agent-tool__auth">{m.authorization(m.authorizationDecision[auth.decision], auth.source)}</span>}
      </p>
      {body}
      {receipt && (
        <Notice
          tone={
            receipt.status === 'unknown'
              ? 'warning'
              : receipt.status === 'rejected'
                ? 'danger'
                : receipt.status === 'accepted'
                  ? 'success'
                  : 'info'
          }
        >
          {m.receipt[receipt.status]}
          {receipt.reason ? ` · ${receipt.reason}` : ''}
        </Notice>
      )}
      {footer}
    </div>
  );
}
