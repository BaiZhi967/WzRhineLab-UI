'use client';

import * as React from 'react';
import { actionStatusMeta, effectivePhase, runPhaseMeta, runStatusMeta, sparkPhase, syncStatusMeta } from '@wzrhine/agent-core';
import type { ActionStatus, RunPhase, RunStatus as RunStatusValue, RunView, StatusMeta, SyncStatus } from '@wzrhine/agent-core';
import { AgentSpark } from '../../primitives/AgentSpark.js';
import { StatusGlyph } from '../../primitives/StatusGlyph.js';
import { loopAttributes, useAgentLoop } from '../../motion/agent-motion.js';
import { useAgentFormat, useAgentMessages } from '../../provider/AgentMessages.js';
import { cx } from '../../utils/cx.js';
import { useThrottledText } from '../message/use-copy.js';

/**
 * RunStatus (atlas 10): the run axis as glyph + label (+ phase, elapsed, hint). Sync health and
 * the receipt of the last user action are separate axes and render as their own small chips when
 * they say something (`syncStatus` ≠ live, `actionStatus` ≠ idle) — a reconnecting stream never
 * changes the run label, and an `unknown` receipt is never drawn as success.
 *
 * Appearances: `pill` (tinted chip, default), `inline` (no frame), `line` (AgentSpark + phase
 * text + elapsed, used inside assistant messages and the process header).
 *
 * Motion: active states breathe through `useAgentLoop` (paused off-screen / hidden page / reduced
 * motion); `line` uses AgentSpark. Static frames still differ per state.
 *
 * `announce` adds a visually hidden `role="status"` whose text follows the label, throttled so a
 * burst of phase changes is read once.
 */
export type RunStatusProps = Omit<React.HTMLAttributes<HTMLSpanElement>, 'children'> & {
  run?: Pick<RunView, 'status' | 'phase' | 'label' | 'elapsedMs' | 'syncStatus' | 'actionStatus'>;
  status?: RunStatusValue;
  phase?: RunPhase;
  elapsedMs?: number;
  syncStatus?: SyncStatus;
  actionStatus?: ActionStatus;
  /** Replaces the computed label. */
  labelOverride?: React.ReactNode;
  /** Short explanation shown after the status ("等待你批准 1 个操作"). */
  hint?: React.ReactNode;
  appearance?: 'pill' | 'inline' | 'line';
  size?: 'sm' | 'md';
  /** Render a polite, throttled screen-reader announcement of the label. */
  announce?: boolean;
  /** Minimum gap between announcements (ms). */
  announceInterval?: number;
};

/**
 * Same-name type alias: the package entry exports this component as `RunStatus`, which would
 * otherwise shadow the `RunStatus` type re-exported from `@wzrhine/agent-core`. Declaring both
 * here keeps `import type { RunStatus }` and `<RunStatus />` working from one entry.
 */
export type RunStatus = RunStatusValue;

const ACTIVE_STATUSES: RunStatusValue[] = ['queued', 'running', 'waiting', 'cancelling'];

function Chip({ meta, label, kind }: { meta: StatusMeta; label: string; kind: 'sync' | 'action' }) {
  return (
    <span className="rl-agent-status rl-agent-run__chip" data-tone={meta.tone} data-appearance="pill" data-size="sm" data-axis={kind}>
      <StatusGlyph name={meta.glyph} tone={meta.tone} className="rl-agent-status__glyph" />
      <span className="rl-agent-status__label">{label}</span>
    </span>
  );
}

export const RunStatus = React.forwardRef<HTMLSpanElement, RunStatusProps>(function RunStatus(
  {
    run,
    status: statusProp,
    phase: phaseProp,
    elapsedMs: elapsedProp,
    syncStatus: syncProp,
    actionStatus: actionProp,
    labelOverride,
    hint,
    appearance = 'pill',
    size = 'sm',
    announce = false,
    announceInterval = 1000,
    className,
    ...rest
  },
  ref,
) {
  const s = useAgentMessages().status;
  const fmt = useAgentFormat();
  const status = statusProp ?? run?.status ?? 'idle';
  const active = ACTIVE_STATUSES.includes(status);
  const phase = active ? effectivePhase(status, phaseProp ?? run?.phase) : undefined;
  const elapsedMs = elapsedProp ?? run?.elapsedMs;
  const sync = syncProp ?? run?.syncStatus;
  const action = actionProp ?? run?.actionStatus;

  const meta = phase && status !== 'cancelling' && status !== 'queued' ? runPhaseMeta[phase] : runStatusMeta[status];
  const textLabel = run?.label ?? (phase ? s.phase[phase] : s.run[status]);
  const label = labelOverride ?? textLabel;
  const elapsed = elapsedMs !== undefined ? fmt.duration(elapsedMs) : undefined;
  const { ref: loopRef, lifecycle } = useAgentLoop<SVGSVGElement>(meta.active && appearance !== 'line');
  const announced = useThrottledText(announce ? s.runAnnouncement(typeof label === 'string' ? label : textLabel) : '', announceInterval);

  const showSync = sync !== undefined && sync !== 'live';
  const showAction = action !== undefined && action !== 'idle';

  return (
    <span
      {...rest}
      ref={ref}
      className={cx('rl-agent-run', className)}
      data-appearance={appearance}
      data-status={status}
      data-phase={phase}
    >
      <span
        className="rl-agent-status rl-agent-run__main"
        data-tone={meta.tone}
        data-appearance={appearance === 'pill' ? 'pill' : 'inline'}
        data-size={size}
        data-active={meta.active || undefined}
      >
        {appearance === 'line' ? (
          <AgentSpark phase={sparkPhase(status, phase)} className="rl-agent-run__spark" />
        ) : (
          <StatusGlyph
            ref={loopRef}
            name={meta.glyph}
            tone={meta.tone}
            active={meta.active}
            className="rl-agent-status__glyph"
            {...loopAttributes(lifecycle)}
          />
        )}
        <span className="rl-agent-status__label">{label}</span>
        {elapsed && <span className="rl-agent-status__meta">{elapsed}</span>}
      </span>
      {showSync && <Chip kind="sync" meta={syncStatusMeta[sync]} label={s.sync[sync]} />}
      {showAction && <Chip kind="action" meta={actionStatusMeta[action]} label={s.action[action]} />}
      {hint != null && hint !== false && <span className="rl-agent-run__hint">{hint}</span>}
      {announce && (
        <span className="rl-agent-sr" role="status">
          {announced}
        </span>
      )}
    </span>
  );
});
