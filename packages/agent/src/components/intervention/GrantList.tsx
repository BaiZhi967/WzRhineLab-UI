'use client';

import * as React from 'react';
import { Alert, Button, Skeleton, StatusBadge } from '@wzrhine/react';
import type { AgentActionContext, AgentActionHandler, GrantView } from '@wzrhine/agent-core';
import { AgentIcon } from '../../primitives/icons.js';
import { useAgentMessages } from '../../provider/AgentMessages.js';
import { cx } from '../../utils/cx.js';
import { useActionLock } from './action-lock.js';

/**
 * Standing permissions the user granted (session trust for a task, extra directory access…),
 * typically in a settings pane or side panel (ADR-0011 §6, `GrantView`).
 *
 * Behaviour
 * - Each row shows the target verbatim in mono, its detail, the scope label and availability.
 *   An unavailable grant shows its reason as text (never colour alone) and, when `onReselect`
 *   is given, a 「重新选择」 button so the host can let the user pick the target again.
 * - 「撤销」 appears only when `onRevoke` is given. Every revoke emits `AgentActionContext
 *   { actionId, targetId: grant.id }`; `actionId` = stable per-row-mount id + counter (the shared
 *   intervention action lock), so double clicks never send twice and two lists never collide.
 * - Receipts: `submitting` → the row is `aria-busy` and its button busy; `unknown` → 「结果待确认」
 *   plus 「重试撤销」 that re-sends the **same** `actionId` (from this mount or `receipt.actionId`),
 *   unless `receipt.retryable === false`; `rejected` → the reason, revoke available again;
 *   `accepted` → 「已撤销」 until the host drops the row. The host adapter is the authority.
 * - `loading` shows a skeleton (list `aria-busy`), `error` an Alert with `onRetry`, no grants the
 *   `empty` text. `addSlot` is a host-provided chooser (e.g. a "添加目录" Button + picker) in the header.
 *
 * A11y: `<section aria-labelledby>`; grants are a `<ul>`; row buttons are named after their target
 * (「撤销 npm test」) while the visible text stays short; a visually hidden `role="status"` announces
 * revoke progress and unconfirmed results. No focus is moved.
 *
 * Motion: none. Rows appear and leave instantly; reduced motion changes nothing.
 */
export interface GrantListProps extends Omit<React.HTMLAttributes<HTMLElement>, 'title' | 'children'> {
  /** Heading (default from messages: 「会话授权」). */
  title?: React.ReactNode;
  grants: readonly GrantView[];
  /** Revoke one grant. Without it no revoke button is rendered. */
  onRevoke?: AgentActionHandler<[GrantView, AgentActionContext]>;
  /** Unavailable grants: let the host re-select the target. */
  onReselect?: (grant: GrantView) => void;
  loading?: boolean;
  /** Load failure text; shows an Alert (with 「重新读取」 when `onRetry` is given). */
  error?: React.ReactNode;
  onRetry?: () => void;
  /** Text when there are no grants (default from messages). */
  empty?: React.ReactNode;
  /** Note under the list, e.g. what revoking does. */
  footerNote?: React.ReactNode;
  /** Host-provided chooser for adding a grant, shown in the header. */
  addSlot?: React.ReactNode;
  /** Title element level. Default 3. */
  headingLevel?: 2 | 3 | 4;
}

interface RowProps {
  grant: GrantView;
  onRevoke?: GrantListProps['onRevoke'];
  onReselect?: GrantListProps['onReselect'];
}

function GrantRow({ grant, onRevoke, onReselect }: RowProps) {
  const m = useAgentMessages().intervention;
  const id = React.useId();
  const detailId = `${id}-detail`;
  const status = grant.receipt?.status ?? 'idle';
  const lock = useActionLock(`${grant.id}:${status}:${grant.available ? 1 : 0}`);
  const attempt = React.useRef<AgentActionContext | null>(null);

  const send = (ctx: AgentActionContext) => {
    if (!onRevoke) return;
    lock.run(() => {
      attempt.current = ctx;
      return onRevoke(grant, ctx);
    });
  };

  // The lock also holds after a sync / accepted / unknown result until the receipt changes.
  const submitting = status === 'submitting' || lock.locked;
  const unknown = status === 'unknown';
  const accepted = status === 'accepted';
  const retryId = attempt.current?.actionId ?? grant.receipt?.actionId;
  const describedBy = grant.detail || !grant.available ? detailId : undefined;
  const canRetry = unknown && !!onRevoke && grant.receipt?.retryable !== false && retryId !== undefined;

  return (
    <li className="rl-agent-grant" data-available={grant.available || undefined} data-receipt={status} aria-busy={submitting || undefined}>
      <div className="rl-agent-grant__main">
        <code className="rl-agent-grant__target">{grant.target}</code>
        <StatusBadge size="sm" status="neutral" appearance="outline" className="rl-agent-grant__scope">
          <span className="rl-agent-sr">{m.grantScope} </span>
          {grant.scopeLabel}
        </StatusBadge>
      </div>
      {(grant.detail || !grant.available) && (
        <div id={detailId} className="rl-agent-grant__detail">
          {grant.detail && <p className="rl-agent-grant__text">{grant.detail}</p>}
          {!grant.available && (
            <p className="rl-agent-grant__unavailable">
              <AgentIcon name="warning" />
              <span>
                <span className="rl-agent-grant__unavailable-label">{m.grantUnavailable}</span> {grant.reason ?? m.grantUnavailableReason}
              </span>
            </p>
          )}
        </div>
      )}
      {unknown && (
        <p className="rl-agent-grant__receipt" data-tone="warning">
          <AgentIcon name="warning" />
          <span>
            <strong className="rl-agent-grant__receipt-title">{m.grantUnknownTitle}</strong>{' '}
            {grant.receipt?.reason ?? (grant.receipt?.retryable === false ? m.grantUnknownNotRetryable : m.grantUnknownBody)}
          </span>
        </p>
      )}
      {status === 'rejected' && (
        <p className="rl-agent-grant__receipt" data-tone="danger">
          <AgentIcon name="close" />
          <span>{grant.receipt?.reason ?? m.grantRejected}</span>
        </p>
      )}
      {accepted && (
        <p className="rl-agent-grant__receipt" data-tone="success">
          <AgentIcon name="check" />
          <span>{m.grantRevoked}</span>
        </p>
      )}
      {!accepted && (onRevoke || (!grant.available && onReselect)) && (
        <div className="rl-agent-grant__actions">
          {!grant.available && onReselect && (
            <Button size="sm" variant="secondary" aria-label={m.grantReselectLabel(grant.target)} disabled={submitting} onClick={() => onReselect(grant)}>
              {m.grantReselect}
            </Button>
          )}
          {onRevoke &&
            (canRetry ? (
              <Button
                size="sm"
                variant="primary"
                loading={submitting}
                iconStart={<AgentIcon name="retry" />}
                aria-label={m.grantRetryRevokeLabel(grant.target)}
                onClick={() => send({ actionId: retryId!, targetId: grant.id })}
              >
                {m.grantRetryRevoke}
              </Button>
            ) : (
              !unknown && (
                <Button
                  size="sm"
                  variant="secondary"
                  loading={submitting}
                  aria-label={m.grantRevokeLabel(grant.target)}
                  aria-describedby={describedBy}
                  onClick={() => send({ actionId: lock.nextActionId(), targetId: grant.id })}
                >
                  {m.grantRevoke}
                </Button>
              )
            ))}
        </div>
      )}
    </li>
  );
}

export const GrantList = React.forwardRef<HTMLElement, GrantListProps>(function GrantList(
  { title, grants, onRevoke, onReselect, loading = false, error, onRetry, empty, footerNote, addSlot, headingLevel = 3, className, ...rest },
  ref,
) {
  const m = useAgentMessages().intervention;
  const id = React.useId();
  const titleId = `${id}-title`;
  const Heading = `h${headingLevel}` as 'h3';
  const hasError = error != null && error !== false;

  const busy = grants.find((g) => g.receipt?.status === 'submitting');
  const unknown = grants.find((g) => g.receipt?.status === 'unknown');
  const sr = busy ? m.grantRevokingSr(busy.target) : unknown ? m.grantUnknownSr(unknown.target) : '';

  let body: React.ReactNode;
  if (loading) {
    body = (
      <div className="rl-agent-grants__loading" aria-busy="true">
        <p className="rl-agent-grants__loading-text">{m.grantLoading}</p>
        <Skeleton lines={3} />
      </div>
    );
  } else if (hasError) {
    body = (
      <Alert
        tone="danger"
        title={m.grantError}
        className="rl-agent-grants__error"
        action={
          onRetry ? (
            <Button size="sm" variant="secondary" iconStart={<AgentIcon name="retry" />} onClick={onRetry}>
              {m.grantRetry}
            </Button>
          ) : undefined
        }
      >
        {error === true ? null : error}
      </Alert>
    );
  } else if (grants.length === 0) {
    body = <p className="rl-agent-grants__empty">{empty ?? m.grantEmpty}</p>;
  } else {
    body = (
      <ul className="rl-agent-grants__list">
        {grants.map((grant) => (
          <GrantRow key={grant.id} grant={grant} onRevoke={onRevoke} onReselect={onReselect} />
        ))}
      </ul>
    );
  }

  return (
    <section {...rest} ref={ref} className={cx('rl-agent-grants', className)} aria-labelledby={titleId} aria-busy={loading || undefined}>
      <header className="rl-agent-grants__header">
        <Heading id={titleId} className="rl-agent-grants__title">
          {title ?? m.grantTitle}
        </Heading>
        {!loading && !hasError && grants.length > 0 && <span className="rl-agent-grants__count">{m.grantCount(grants.length)}</span>}
        {addSlot != null && addSlot !== false && <div className="rl-agent-grants__add">{addSlot}</div>}
      </header>
      {body}
      {footerNote != null && footerNote !== false && <p className="rl-agent-grants__note">{footerNote}</p>}
      <p className="rl-agent-sr" role="status">
        {sr}
      </p>
    </section>
  );
});
