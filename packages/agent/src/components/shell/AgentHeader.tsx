'use client';

import * as React from 'react';
import { IconButton } from '@wzrhine/react';
import { effectivePhase, runPhaseMeta, runStatusMeta, syncStatusMeta } from '@wzrhine/agent-core';
import type { AgentIdentityView, ConversationOrigin, RunPhase, RunStatus, SyncStatus } from '@wzrhine/agent-core';
import { useAgentFormat, useAgentMessages } from '../../provider/AgentMessages.js';
import { AgentIcon } from '../../primitives/icons.js';
import { AgentStatus } from '../../primitives/AgentStatus.js';
import { loopAttributes, useAgentLoop } from '../../motion/agent-motion.js';
import { cx } from '../../utils/cx.js';
import { useAgentShell } from './AgentShell.js';

/**
 * AgentHeader (atlas 02): title bar of the open conversation.
 *
 * Start → end: back (only with `onBack`), index toggle (only inside a narrow AgentShell whose
 * index is a sheet), origin link (fork / sub-agent, only with `origin` + `onOpenOrigin`),
 * sub-agent badge, title + rename, agent identity, run status, sync status, then the trailing
 * group: counts, `actions` and the context toggle.
 *
 * - The title is a heading (`headingLevel`, default 2) truncated to one line; the full text is in
 *   `title` and, because truncation is visual only, still read in full by assistive tech.
 *   The trailing group never shrinks, so long titles cannot squeeze status or actions.
 * - Rename (only with `onRename`) is visible on hover / focus-within but always reserves its
 *   space, so the title never jumps; its opacity transition is `--rl-motion-fast`.
 * - Run status = AgentStatus (glyph + text): the phase label while active or waiting, else the
 *   run label.
 *   Active runs breathe through the shared loop lifecycle (static off-screen / hidden / reduced).
 *   Sync is a separate axis: a second pill appears whenever `syncStatus` is not `live`.
 *   No `runStatus` = no pill (unknown is never painted as a state).
 * - The context toggle (only with `onToggleContext`, or automatically inside an AgentShell that
 *   has a context slot) is an IconButton with a stable name and `aria-pressed` = pane open.
 * - `badges` are small counts (terminals, sub-tasks) with their own accessible text.
 */
export interface AgentHeaderBadge {
  id: string;
  icon?: React.ReactNode;
  count: number;
  /** Accessible text, e.g. "2 个终端运行中". */
  label: string;
}

export type AgentHeaderProps = Omit<React.HTMLAttributes<HTMLElement>, 'title'> & {
  title?: string;
  identity?: AgentIdentityView;
  runStatus?: RunStatus;
  runPhase?: RunPhase;
  /** Overrides the status label (e.g. a custom phase text). */
  statusLabel?: string;
  syncStatus?: SyncStatus;
  origin?: ConversationOrigin;
  onOpenOrigin?: (origin: ConversationOrigin) => void;
  onBack?: () => void;
  backLabel?: string;
  onRename?: () => void;
  renameLabel?: string;
  /** Explicit pane state; defaults to the surrounding AgentShell. */
  contextOpen?: boolean;
  /** Explicit toggle; defaults to the surrounding AgentShell's toggle when it has a context slot. */
  onToggleContext?: () => void;
  contextLabel?: string;
  badges?: AgentHeaderBadge[];
  /** Trailing slot (e.g. a Menu with more conversation actions). */
  actions?: React.ReactNode;
  headingLevel?: 1 | 2 | 3 | 4 | 5 | 6;
  /** Disables rename (e.g. while a request is pending); other controls stay. */
  pending?: boolean;
};

function RunPill({ status, phase, label }: { status: RunStatus; phase?: RunPhase; label?: string }) {
  const messages = useAgentMessages().status;
  const run = runStatusMeta[status];
  // `waiting` is not "active" (nothing breathes) but still carries the phase that says what it
  // waits for (approval / answer / sub-tasks), as in RunStatus.
  const shownPhase = run.active || status === 'waiting' ? effectivePhase(status, phase) : undefined;
  const meta = shownPhase ? runPhaseMeta[shownPhase] : run;
  const text = label ?? (shownPhase ? messages.phase[shownPhase] : messages.run[status]);
  const { ref, lifecycle } = useAgentLoop<HTMLSpanElement>(meta.active);
  return (
    <AgentStatus
      ref={ref}
      className="rl-agent-header__status"
      glyph={meta.glyph}
      tone={meta.tone}
      label={text}
      active={meta.active}
      data-run={status}
      {...loopAttributes(lifecycle)}
    />
  );
}

export const AgentHeader = React.forwardRef<HTMLElement, AgentHeaderProps>(function AgentHeader(
  {
    title,
    identity,
    runStatus,
    runPhase,
    statusLabel,
    syncStatus,
    origin,
    onOpenOrigin,
    onBack,
    backLabel,
    onRename,
    renameLabel,
    contextOpen: contextOpenProp,
    onToggleContext: onToggleProp,
    contextLabel,
    badges,
    actions,
    headingLevel = 2,
    pending = false,
    className,
    ...rest
  },
  ref,
) {
  const messages = useAgentMessages();
  const shell = messages.shell;
  const format = useAgentFormat();
  const shellState = useAgentShell();
  const Heading = `h${headingLevel}` as 'h2';
  const shownTitle = title?.trim() || shell.untitled;

  const onToggleContext = onToggleProp ?? (shellState?.hasContext ? shellState.toggleContext : undefined);
  const contextOpen = contextOpenProp ?? shellState?.contextOpen ?? false;
  const showIndexToggle = !!shellState && shellState.hasIndex && shellState.layout === 'narrow';
  const parentTitle = origin?.parentTitle?.trim() || shell.originUnknownParent;
  const originLabel = origin ? (origin.kind === 'fork' ? shell.originFork(parentTitle) : shell.originSubagent(parentTitle)) : '';
  const sync = syncStatus && syncStatus !== 'live' ? syncStatusMeta[syncStatus] : null;

  return (
    <header {...rest} ref={ref} className={cx('rl-agent-header', className)} data-run={runStatus}>
      <div className="rl-agent-header__lead">
        {onBack && <IconButton size="sm" icon={<AgentIcon name="arrow-left" />} label={backLabel ?? shell.back} onClick={onBack} />}
        {showIndexToggle && (
          <IconButton
            size="sm"
            icon={<AgentIcon name="list" />}
            label={shell.openIndex}
            aria-haspopup="dialog"
            onClick={() => shellState.setIndexOpen(true, 'toggle')}
          />
        )}
        {origin && onOpenOrigin && (
          <IconButton
            size="sm"
            icon={<AgentIcon name={origin.kind === 'fork' ? 'fork' : 'link'} />}
            label={originLabel}
            onClick={() => onOpenOrigin(origin)}
          />
        )}
      </div>
      <div className="rl-agent-header__titles">
        <div className="rl-agent-header__title-row">
          {origin?.kind === 'subagent' && (
            <span className="rl-agent-header__badge">
              <AgentIcon name="agent" />
              {shell.subagentBadge}
            </span>
          )}
          <Heading className="rl-agent-header__title" title={shownTitle}>
            {shownTitle}
          </Heading>
          {onRename && (
            <IconButton
              className="rl-agent-header__rename"
              size="sm"
              icon={<AgentIcon name="edit" />}
              label={renameLabel ?? shell.rename}
              disabled={pending}
              onClick={onRename}
            />
          )}
        </div>
        {(identity || runStatus || sync) && (
          <div className="rl-agent-header__meta">
            {identity && (
              <span className="rl-agent-header__identity">
                <span className="rl-agent-header__monogram" aria-hidden="true">
                  {identity.monogram ?? <AgentIcon name="agent" />}
                </span>
                <span className="rl-agent-sr">{shell.agentIdentity(identity.name, identity.role)}</span>
                <span className="rl-agent-header__identity-name" aria-hidden="true">
                  {identity.name}
                </span>
                {identity.role && (
                  <span className="rl-agent-header__identity-role" aria-hidden="true">
                    {identity.role}
                  </span>
                )}
              </span>
            )}
            {runStatus && <RunPill status={runStatus} phase={runPhase} label={statusLabel} />}
            {sync && syncStatus && (
              <AgentStatus
                className="rl-agent-header__sync"
                glyph={sync.glyph}
                tone={sync.tone}
                label={messages.status.sync[syncStatus]}
                data-sync={syncStatus}
              />
            )}
          </div>
        )}
      </div>
      <div className="rl-agent-header__trail">
        {badges?.map((badge) => (
          <span key={badge.id} className="rl-agent-header__count">
            {badge.icon && (
              <span className="rl-agent-header__count-icon" aria-hidden="true">
                {badge.icon}
              </span>
            )}
            <span aria-hidden="true">{format.compact(badge.count)}</span>
            <span className="rl-agent-sr">{badge.label}</span>
          </span>
        ))}
        {actions}
        {onToggleContext && (
          <IconButton
            className="rl-agent-header__toggle"
            size="sm"
            icon={<AgentIcon name="panel" />}
            label={contextLabel ?? shell.contextToggle}
            pressed={contextOpen}
            onClick={(event) => {
              // WebKit pointer activation does not focus buttons automatically. Make this
              // programmatic drawer's opener explicit before its focus scope mounts.
              event.currentTarget.focus({ preventScroll: true });
              onToggleContext();
            }}
          />
        )}
      </div>
    </header>
  );
});
