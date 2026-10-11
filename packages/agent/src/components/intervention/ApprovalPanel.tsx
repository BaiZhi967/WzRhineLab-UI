'use client';

import * as React from 'react';
import { Button, Callout, Collapsible, Skeleton, StatusBadge } from '@wzrhine/react';
import type { StatusKind } from '@wzrhine/react';
import type {
  AgentActionContext,
  AgentActionHandler,
  AgentTone,
  ApprovalEvidenceView,
  ApprovalRisk,
  ApprovalScope,
  ApprovalStatus,
  ApprovalView,
  StatusGlyphName,
} from '@wzrhine/agent-core';
import { AgentStatus } from '../../primitives/AgentStatus.js';
import { AgentIcon } from '../../primitives/icons.js';
import { useAgentFormat, useAgentMessages } from '../../provider/AgentMessages.js';
import { cx } from '../../utils/cx.js';
import { useActionLock } from './action-lock.js';
import { ApprovalDiff } from './ApprovalDiff.js';
import { InterventionIcon } from './icons.js';

/**
 * Tool-permission approval card (atlas 20, ADR-0011 §6).
 *
 * Behaviour
 * - **Reject is always possible** while a decision is open (waiting, material-loading,
 *   unavailable, unknown): it never depends on the material. It is busy only while a decision is
 *   being submitted and gone once the request is approved, rejected or expired.
 * - **Allow** needs `status === 'waiting'` and `availability.allowed` (the adapter verified the
 *   full material and revision). Otherwise it is disabled and the reason is shown as visible text
 *   linked with `aria-describedby`. "Trust for this session" appears only when `scopes` offers
 *   `'session'` and `onApprove` exists. A capability without a callback renders no button.
 * - Every decision emits `AgentActionContext { actionId, targetId: operationId, baseRevision:
 *   revision }`. `actionId` = stable per-mount id + counter. Re-entry is blocked synchronously
 *   (double click) until the handler settles, and for `accepted` / `unknown` results until the
 *   view-model changes.
 * - `unknown`: a warning explains the decision may or may not have arrived; the control that sent
 *   it becomes 「重试提交」, which calls the same handler with the **same** `actionId` and scope.
 *   No retry is offered when `receipt.retryable === false` or the attempt was made in another mount.
 * - `approved` / `rejected` are static receipts; `expired` hides the decision and offers only
 *   `onRefresh` when given. Buttons only emit intent; the host adapter is the authority.
 *
 * A11y: `<section aria-labelledby>` on the title; the status pill pairs glyph + text; a visually
 * hidden `role="status"` region (mounted with the card) announces submitting / unknown / receipts.
 * New approvals never steal focus; `autoFocus` focuses the title (`tabIndex=-1`) once on mount.
 *
 * Motion: none of its own. Wrap in `AgentEntrance kind="card"` (InterventionDock does) for the
 * first entrance; the evidence disclosure is the Collapsible height transition. Reduced motion
 * changes nothing that carries information.
 */
export interface ApprovalPanelProps extends Omit<React.HTMLAttributes<HTMLElement>, 'title' | 'children'> {
  approval: ApprovalView;
  onApprove?: AgentActionHandler<[ApprovalScope, AgentActionContext]>;
  onReject?: AgentActionHandler<[AgentActionContext]>;
  /** Shown in `unavailable`: reload the approval material. */
  onRetryMaterial?: () => void;
  /** Shown in `expired`: refresh the approval state from the runtime. */
  onRefresh?: () => void;
  /** Custom material view (e.g. tools `DiffPreview`). Default: an internal read-only diff of `approval.diff`. */
  renderMaterial?: (approval: ApprovalView) => React.ReactNode;
  /** `compact` docks above the composer: tighter spacing, evidence always behind a disclosure. */
  density?: 'compact' | 'full';
  /** Focus the title once on mount. Off by default: new approvals never steal focus. */
  autoFocus?: boolean;
  /** Title element level. Default 3. */
  headingLevel?: 2 | 3 | 4;
  /** Evidence with more items than this (or with long values) goes behind a disclosure. Default 3. */
  evidenceCollapseAt?: number;
  /** Overrides of the footer note and button labels. */
  rejectNote?: React.ReactNode;
  rejectLabel?: string;
  allowLabel?: string;
  allowSessionLabel?: string;
}

const statusGlyph: Record<ApprovalStatus, { glyph: StatusGlyphName; tone: AgentTone; active?: boolean }> = {
  waiting: { glyph: 'approval', tone: 'warning' },
  'material-loading': { glyph: 'pending', tone: 'info', active: true },
  unavailable: { glyph: 'unknown', tone: 'warning' },
  submitting: { glyph: 'pending', tone: 'info', active: true },
  unknown: { glyph: 'unknown', tone: 'warning' },
  approved: { glyph: 'done', tone: 'success' },
  rejected: { glyph: 'stopped', tone: 'danger' },
  expired: { glyph: 'stopped', tone: 'neutral' },
};

const riskStatus: Record<ApprovalRisk, StatusKind> = { low: 'neutral', medium: 'warning', high: 'danger' };

const OPEN: readonly ApprovalStatus[] = ['waiting', 'material-loading', 'unavailable', 'unknown'];

interface Attempt {
  kind: 'approve' | 'reject';
  scope: ApprovalScope;
  ctx: AgentActionContext;
}

function isLong(item: ApprovalEvidenceView) {
  return item.value.length > 160 || item.value.split('\n').length > 4;
}

function EvidenceList({ evidence }: { evidence: readonly ApprovalEvidenceView[] }) {
  return (
    <dl className="rl-agent-approval__evidence">
      {evidence.map((item) => (
        <div key={item.id} className="rl-agent-approval__evidence-row" data-format={item.format ?? 'text'}>
          <dt>{item.label}</dt>
          <dd>
            {item.format === 'code' || item.format === 'json' ? (
              <pre className="rl-agent-approval__pre" tabIndex={0}>
                <code>{item.value}</code>
              </pre>
            ) : item.format === 'path' ? (
              <code className="rl-agent-approval__mono">{item.value}</code>
            ) : (
              item.value
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export const ApprovalPanel = React.forwardRef<HTMLElement, ApprovalPanelProps>(function ApprovalPanel(
  {
    approval,
    onApprove,
    onReject,
    onRetryMaterial,
    onRefresh,
    renderMaterial,
    density = 'full',
    autoFocus = false,
    headingLevel = 3,
    evidenceCollapseAt = 3,
    rejectNote,
    rejectLabel,
    allowLabel,
    allowSessionLabel,
    className,
    ...rest
  },
  ref,
) {
  const m = useAgentMessages().intervention;
  const fmt = useAgentFormat();
  const id = React.useId();
  const titleId = `${id}-title`;
  const allowReasonId = `${id}-allow-reason`;
  const headingRef = React.useRef<HTMLHeadingElement>(null);
  const { status, operationId, revision } = approval;
  const lock = useActionLock(`${operationId}:${revision}:${status}`);
  const [attempt, setAttempt] = React.useState<Attempt | null>(null);

  // A different operation in the same mount starts from a clean slate.
  const [seenOperation, setSeenOperation] = React.useState(operationId);
  if (seenOperation !== operationId) {
    setSeenOperation(operationId);
    setAttempt(null);
  }

  React.useEffect(() => {
    if (autoFocus) headingRef.current?.focus();
    // Mount only: later approvals never move focus.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const open = OPEN.includes(status);
  const submitting = status === 'submitting' || (lock.locked && open);
  const scopes = approval.scopes ?? ['once'];
  const toolName = approval.tool.displayName ?? approval.tool.name;
  const Heading = `h${headingLevel}` as 'h3';

  const send = (kind: Attempt['kind'], scope: ApprovalScope, ctx: AgentActionContext) => {
    const handler = kind === 'approve' ? onApprove : onReject;
    if (!handler) return;
    lock.run(() => {
      setAttempt({ kind, scope, ctx });
      return kind === 'approve' ? onApprove!(scope, ctx) : onReject!(ctx);
    });
  };
  const fresh = (): AgentActionContext => ({ actionId: lock.nextActionId(), targetId: operationId, baseRevision: revision });

  // ----- allow gating -----
  const allowEnabled = status === 'waiting' && approval.availability.allowed && !submitting;
  let allowReason: string | undefined;
  if (!allowEnabled && open) {
    if (status === 'waiting') allowReason = submitting ? m.approvalAllowBlocked.submitting : (approval.availability.reason ?? m.approvalNotAllowed);
    else allowReason = m.approvalAllowBlocked[status] ?? approval.availability.reason;
  }

  const retryable = approval.receipt?.retryable !== false;
  const canRetry = status === 'unknown' && attempt !== null && retryable && (attempt.kind === 'approve' ? !!onApprove : !!onReject);

  const sr =
    status === 'submitting'
      ? m.approvalSubmitting
      : status === 'unknown'
        ? m.approvalUnknownTitle
        : status === 'approved'
          ? m.approvalApproved
          : status === 'rejected'
            ? m.approvalRejected
            : status === 'expired'
              ? m.approvalExpiredTitle
              : '';

  const evidence = approval.evidence ?? [];
  const collapseEvidence = evidence.length > 0 && (density === 'compact' || evidence.length > evidenceCollapseAt || evidence.some(isLong));

  // ----- material -----
  let material: React.ReactNode = null;
  if (status === 'material-loading') {
    material = (
      <div className="rl-agent-approval__loading" aria-busy="true">
        <p className="rl-agent-approval__loading-text">{m.approvalMaterialLoading}</p>
        <Skeleton lines={3} />
      </div>
    );
  } else if (status === 'unavailable') {
    material = (
      <div className="rl-agent-approval__unavailable">
        <Callout tone="warning" title={m.approvalUnavailable} className="rl-agent-approval__callout">
          {approval.availability.reason ?? m.approvalUnavailableHint}
        </Callout>
        {onRetryMaterial && (
          <Button size="sm" variant="secondary" iconStart={<AgentIcon name="retry" />} onClick={onRetryMaterial}>
            {m.approvalRetryMaterial}
          </Button>
        )}
      </div>
    );
  } else {
    const custom = renderMaterial?.(approval);
    material = custom ?? (approval.diff ? <ApprovalDiff diff={approval.diff} /> : null);
  }

  const receiptTime = approval.receipt?.at ? (
    <time className="rl-agent-approval__receipt-time" dateTime={approval.receipt.at}>
      {m.approvalReceiptAt(fmt.time(approval.receipt.at))}
    </time>
  ) : null;

  const busyKind = submitting ? attempt?.kind : undefined;
  const showReject = !!onReject && (open || status === 'submitting') && !(status === 'unknown' && attempt?.kind === 'reject');
  const showAllow = !!onApprove && (open || status === 'submitting') && !(status === 'unknown' && attempt?.kind === 'approve');
  const meta = statusGlyph[status];

  return (
    <section
      {...rest}
      ref={ref}
      className={cx('rl-agent-approval', className)}
      aria-labelledby={titleId}
      data-status={status}
      data-density={density}
      data-risk={approval.risk}
    >
      <header className="rl-agent-approval__header">
        <div className="rl-agent-approval__eyebrow">
          <InterventionIcon name="shield-alert" className="rl-agent-approval__shield" />
          <span className="rl-agent-approval__operation">{m.approvalOperation(operationId)}</span>
          <AgentStatus glyph={meta.glyph} tone={meta.tone} active={meta.active} label={m.approvalStatus[status]} />
          {approval.risk && (
            <StatusBadge size="sm" status={riskStatus[approval.risk]} className="rl-agent-approval__risk">
              {m.approvalRisk[approval.risk]}
            </StatusBadge>
          )}
        </div>
        <Heading id={titleId} ref={headingRef} tabIndex={-1} className="rl-agent-approval__title">
          <span className="rl-agent-approval__tool">{toolName}</span>
          {approval.reason && (
            <>
              <span className="rl-agent-approval__sep" aria-hidden="true">
                ·
              </span>
              <span className="rl-agent-approval__reason">{approval.reason}</span>
            </>
          )}
        </Heading>
      </header>

      <div className="rl-agent-approval__body">
        {approval.tool.subject && (
          <p className="rl-agent-approval__line">
            <span className="rl-agent-approval__label">{m.approvalSubject}</span>
            <code className="rl-agent-approval__subject">{approval.tool.subject}</code>
          </p>
        )}
        <p className="rl-agent-approval__summary">{approval.summary}</p>
        {(approval.scope || approval.expiresAt) && (
          <p className="rl-agent-approval__meta">
            {approval.scope && (
              <span>
                <span className="rl-agent-approval__label">{m.approvalScope}</span> {approval.scope}
              </span>
            )}
            {approval.expiresAt && (
              <span>
                <span className="rl-agent-approval__label">{m.approvalExpires}</span>{' '}
                <time dateTime={approval.expiresAt}>{fmt.time(approval.expiresAt)}</time>
              </span>
            )}
          </p>
        )}
        {approval.irreversible && (
          <Callout tone="danger" title={m.approvalIrreversibleTitle} icon={<InterventionIcon name="trash-warning" />}>
            {approval.irreversible}
          </Callout>
        )}
        {approval.unsandboxed && (
          <Callout tone="warning" title={m.approvalUnsandboxedTitle} icon={<InterventionIcon name="lock-open" />}>
            {m.approvalUnsandboxed}
          </Callout>
        )}
        {material != null && material !== false && <div className="rl-agent-approval__material">{material}</div>}
        {evidence.length > 0 &&
          (collapseEvidence ? (
            <Collapsible className="rl-agent-approval__details" trigger={<span>{m.approvalEvidenceToggle(evidence.length)}</span>}>
              <EvidenceList evidence={evidence} />
            </Collapsible>
          ) : (
            <div className="rl-agent-approval__details">
              <p className="rl-agent-approval__label">{m.approvalEvidence}</p>
              <EvidenceList evidence={evidence} />
            </div>
          ))}
      </div>

      {status === 'unknown' && (
        <div className="rl-agent-approval__unknown">
          <Callout tone="warning" title={m.approvalUnknownTitle}>
            {approval.receipt?.reason ?? (retryable ? m.approvalUnknownBody : m.approvalUnknownNotRetryable)}
          </Callout>
        </div>
      )}
      {status === 'approved' && (
        <p className="rl-agent-approval__receipt" data-tone="success">
          <AgentIcon name="check" />
          <span>{attempt?.scope === 'session' ? m.approvalApprovedSession : m.approvalApproved}</span>
          {receiptTime}
        </p>
      )}
      {status === 'rejected' && (
        <p className="rl-agent-approval__receipt" data-tone="danger">
          <AgentIcon name="close" />
          <span>{approval.receipt?.reason ?? m.approvalRejected}</span>
          {receiptTime}
        </p>
      )}
      {status === 'expired' && (
        <div className="rl-agent-approval__expired">
          <Callout tone="neutral" title={m.approvalExpiredTitle} icon={<AgentIcon name="clock" />} className="rl-agent-approval__callout">
            {m.approvalExpiredBody}
          </Callout>
          {onRefresh && (
            <Button size="sm" variant="secondary" iconStart={<AgentIcon name="retry" />} onClick={onRefresh}>
              {m.approvalRefresh}
            </Button>
          )}
        </div>
      )}

      {(showReject || showAllow || canRetry) && (
        <footer className="rl-agent-approval__footer">
          {showReject && <p className="rl-agent-approval__note">{rejectNote ?? m.approvalRejectNote}</p>}
          {allowReason && showAllow && (
            <p id={allowReasonId} className="rl-agent-approval__allow-reason">
              <AgentIcon name="info" />
              <span>{allowReason}</span>
            </p>
          )}
          <div className="rl-agent-approval__actions">
            {canRetry && (
              <Button
                size="sm"
                variant="primary"
                loading={submitting}
                iconStart={<AgentIcon name="retry" />}
                onClick={() => attempt && send(attempt.kind, attempt.scope, attempt.ctx)}
              >
                {m.approvalRetrySubmit}
              </Button>
            )}
            {showReject && (
              <Button
                size="sm"
                variant="secondary"
                loading={busyKind === 'reject'}
                disabled={submitting && busyKind !== 'reject'}
                onClick={() => send('reject', 'once', fresh())}
              >
                {rejectLabel ?? m.approvalReject}
              </Button>
            )}
            {showAllow && scopes.includes('session') && (
              <Button
                size="sm"
                variant="secondary"
                loading={busyKind === 'approve' && attempt?.scope === 'session'}
                disabled={!allowEnabled && !(busyKind === 'approve' && attempt?.scope === 'session')}
                aria-describedby={allowReason ? allowReasonId : undefined}
                onClick={() => send('approve', 'session', fresh())}
              >
                {allowSessionLabel ?? m.approvalAllowSession}
              </Button>
            )}
            {showAllow && (
              <Button
                size="sm"
                variant="accent"
                loading={busyKind === 'approve' && attempt?.scope !== 'session'}
                disabled={!allowEnabled && !(busyKind === 'approve' && attempt?.scope !== 'session')}
                aria-describedby={allowReason ? allowReasonId : undefined}
                onClick={() => send('approve', 'once', fresh())}
              >
                {allowLabel ?? m.approvalAllowOnce}
              </Button>
            )}
          </div>
        </footer>
      )}
      <p className="rl-agent-sr" role="status">
        {sr}
      </p>
    </section>
  );
});
