'use client';

import * as React from 'react';
import { Button } from '@wzrhine/react';
import { sparkPhase, subagentStatusMeta } from '@wzrhine/agent-core';
import type { SparkPhase, SubagentStatus, SubagentView } from '@wzrhine/agent-core';
import { useAgentFormat, useAgentMessages } from '../../provider/AgentMessages.js';
import { AgentSpark } from '../../primitives/AgentSpark.js';
import { AgentStatus, statusProps } from '../../primitives/AgentStatus.js';
import { AgentIcon } from '../../primitives/icons.js';
import { cx } from '../../utils/cx.js';
import { Heading, useWorkspaceMessages } from './shared.js';
import type { HeadingLevel, WorkspaceMessagesProp } from './shared.js';

/** AgentSpark phase for a sub-agent, or `undefined` when nothing is in progress. */
export function subagentSparkPhase(agent: Pick<SubagentView, 'status' | 'phase'>): SparkPhase | undefined {
  switch (agent.status) {
    case 'running':
      return sparkPhase('running', agent.phase);
    case 'preparing':
    case 'queued':
      return 'responding';
    case 'waiting-children':
      return 'waiting';
    default:
      return undefined;
  }
}

const ATTENTION: SubagentStatus[] = ['needs-attention', 'waiting-user'];

export type SubAgentCardProps = Omit<React.HTMLAttributes<HTMLElement>, 'children'> & {
  agent: SubagentView;
  /** Opens the sub-task; draws 「查看子任务」. */
  onOpen?: (id: string) => void;
  headingLevel?: HeadingLevel;
  /** Animate the spark (default). `false` forces the static frame, e.g. in long lists. */
  animate?: boolean;
  messages?: WorkspaceMessagesProp;
};

/**
 * SubAgentCard (atlas 24): one child agent tracked separately from its parent. Usage is shown as
 * a number with a completeness label (「部分用量」); no progress bar is derived from the status.
 * `needs-attention` / `waiting-user` get a warning frame plus a sentence, never colour alone.
 *
 * Accessibility: an `<article>` with a heading (the name); the open action is a separate button
 * inside, so Tab moves card by card through their buttons. Motion: AgentSpark only while active
 * (shared lifecycle, static under reduced motion); no auto-scroll of the parent.
 */
export const SubAgentCard = React.forwardRef<HTMLElement, SubAgentCardProps>(function SubAgentCard(
  { agent, onOpen, headingLevel = 3, animate = true, messages: override, className, ...rest },
  ref,
) {
  const m = useWorkspaceMessages(override);
  const status = useAgentMessages().status;
  const format = useAgentFormat();
  const id = React.useId();
  const nameId = `${id}-name`;
  const meta = subagentStatusMeta[agent.status];
  const spark = subagentSparkPhase(agent);
  const attention = ATTENTION.includes(agent.status) || (agent.pendingInput ?? 0) > 0;
  const label = agent.status === 'running' && agent.phase ? status.phase[agent.phase] : status.subagent[agent.status];
  const parent = agent.parentLabel ?? (agent.parentId ? m.subagentParent(agent.parentId) : undefined);
  const usage = agent.usage;

  return (
    <article
      {...rest}
      ref={ref}
      className={cx('rl-agent-subagent', className)}
      aria-labelledby={nameId}
      data-status={agent.status}
      data-attention={attention || undefined}
    >
      <header className="rl-agent-subagent__header">
        {spark ? <AgentSpark phase={spark} animate={animate} /> : <AgentIcon name="agent" className="rl-agent-subagent__icon" />}
        <Heading level={headingLevel} id={nameId} className="rl-agent-subagent__name">
          {agent.name}
        </Heading>
        <AgentStatus
          className="rl-agent-subagent__status"
          {...statusProps(meta, label)}
          active={false}
          meta={agent.elapsedMs !== undefined ? format.duration(agent.elapsedMs) : undefined}
        />
      </header>
      {parent && <p className="rl-agent-subagent__parent">{parent}</p>}
      <p className="rl-agent-subagent__task">{agent.task}</p>
      {(usage || agent.resultAvailable) && (
        <p className="rl-agent-subagent__facts">
          {usage && (
            <span className="rl-agent-subagent__usage">
              {usage.tokens !== undefined && usage.completeness !== 'unknown' ? m.subagentTokens(format.compact(usage.tokens)) : m.subagentUsageUnknown}
              {usage.completeness === 'partial' && <span className="rl-agent-subagent__tag">{m.subagentPartialUsage}</span>}
              {usage.completeness === 'estimated' && <span className="rl-agent-subagent__tag">{m.subagentEstimatedUsage}</span>}
            </span>
          )}
          {agent.resultAvailable && (
            <span className="rl-agent-subagent__result">
              <AgentIcon name="check" />
              {m.subagentResult}
            </span>
          )}
        </p>
      )}
      {attention && (
        <p className="rl-agent-subagent__attention">
          <AgentIcon name="warning" />
          <span>{m.subagentAttention}</span>
          {(agent.pendingInput ?? 0) > 0 && <span className="rl-agent-subagent__badge">{m.subagentPendingInput(agent.pendingInput!)}</span>}
        </p>
      )}
      {onOpen && (
        <div className="rl-agent-subagent__actions">
          <Button size="sm" variant={attention ? 'primary' : 'secondary'} aria-label={m.subagentOpenNamed(agent.name)} onClick={() => onOpen(agent.id)}>
            {m.subagentOpen}
          </Button>
        </div>
      )}
    </article>
  );
});

export type SubAgentListProps = Omit<React.HTMLAttributes<HTMLElement>, 'children'> & {
  agents: SubagentView[];
  onOpen?: (id: string) => void;
  /** Level of each card heading; the list heading (`title`) is one level above. */
  headingLevel?: HeadingLevel;
  /** Visible list heading; omitted → the list is named by `aria-label` only. */
  title?: React.ReactNode;
  animate?: boolean;
  messages?: WorkspaceMessagesProp;
};

/**
 * Several sub-agents as a list of cards. Duplicate ids are dropped (first wins); order is the
 * given order. Each card keeps its own heading so screen-reader users can jump between them.
 */
export function SubAgentList({ agents, onOpen, headingLevel = 3, title, animate, messages: override, className, ...rest }: SubAgentListProps) {
  const m = useWorkspaceMessages(override);
  const id = React.useId();
  const unique = React.useMemo(() => {
    const seen = new Set<string>();
    return agents.filter((a) => (seen.has(a.id) ? false : (seen.add(a.id), true)));
  }, [agents]);
  const titleLevel = Math.max(2, headingLevel - 1) as HeadingLevel;
  return (
    <section {...rest} className={cx('rl-agent-subagent-list', className)} aria-labelledby={title != null ? `${id}-title` : undefined} aria-label={title == null ? m.subagentList : undefined}>
      {title != null && (
        <Heading level={titleLevel} id={`${id}-title`} className="rl-agent-subagent-list__title">
          {title}
        </Heading>
      )}
      {unique.length === 0 ? (
        <p className="rl-agent-subagent-list__empty">{m.subagentEmpty}</p>
      ) : (
        <ul className="rl-agent-subagent-list__items">
          {unique.map((agent) => (
            <li key={agent.id}>
              <SubAgentCard agent={agent} onOpen={onOpen} headingLevel={headingLevel} animate={animate} messages={override} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
