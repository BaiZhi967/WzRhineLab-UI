'use client';

import * as React from 'react';
import { Button } from '@wzrhine/react';
import { runStatusMeta } from '@wzrhine/agent-core';
import type { AgentActionHandler, RunSummaryView, StatusMeta } from '@wzrhine/agent-core';
import { useAgentFormat, useAgentMessages } from '../../provider/AgentMessages.js';
import { AgentStatus, statusProps } from '../../primitives/AgentStatus.js';
import { AgentIcon } from '../../primitives/icons.js';
import { cx } from '../../utils/cx.js';
import { completenessTag, Heading, useWorkspaceMessages } from './shared.js';
import type { HeadingLevel, WorkspaceMessagesProp } from './shared.js';

export type RunSummaryProps = Omit<React.HTMLAttributes<HTMLElement>, 'children'> & {
  run: RunSummaryView;
  onOpenTrace?: () => void;
  onOpenDetails?: () => void;
  /** Retries persisting the result (`persistence: 'failed'`). */
  onRetrySave?: AgentActionHandler;
  /** Opens one artifact from the mini list. */
  onOpenArtifact?: (id: string) => void;
  headingLevel?: HeadingLevel;
  messages?: WorkspaceMessagesProp;
};

const partialMeta: StatusMeta = { glyph: 'unknown', tone: 'warning', active: false, settled: true };
const savingMeta: StatusMeta = { glyph: 'saving', tone: 'info', active: true, settled: false };
const persistenceMeta: Record<NonNullable<RunSummaryView['persistence']>, StatusMeta> = {
  saved: { glyph: 'done', tone: 'success', active: false, settled: true },
  saving: savingMeta,
  failed: { glyph: 'failed', tone: 'danger', active: false, settled: true },
  unknown: { glyph: 'unknown', tone: 'warning', active: false, settled: false },
};
const artifactTone = { generating: 'info', partial: 'warning', saved: 'success', failed: 'danger', unavailable: 'neutral', stale: 'warning' } as const;

/**
 * RunSummary (atlas 36): outcome of one run. Run success and persistence are separate facts: a
 * completed run whose result is still saving shows both (「已完成」 + 「结果保存中」), a failed save
 * offers 「重试保存」. `sideEffects` adds a sentence asking the user to check external state.
 * Token counts carry their completeness label.
 *
 * Motion: when the status settles while mounted, the frame colour transitions once (`fast`,
 * CSS); nothing loops. Reduced motion → the colour changes directly.
 */
export const RunSummary = React.forwardRef<HTMLElement, RunSummaryProps>(function RunSummary(
  { run, onOpenTrace, onOpenDetails, onRetrySave, onOpenArtifact, headingLevel = 3, messages: override, className, ...rest },
  ref,
) {
  const m = useWorkspaceMessages(override);
  const status = useAgentMessages().status;
  const format = useAgentFormat();
  const id = React.useId();
  const titleId = `${id}-title`;

  const outcome =
    run.status === 'partial'
      ? statusProps(partialMeta, m.runPartial)
      : run.status === 'saving'
        ? statusProps(savingMeta, m.runSaving)
        : statusProps(runStatusMeta[run.status], status.run[run.status]);
  // `status: 'saving'` already says it; don't repeat the persistence pill.
  const persistence = run.persistence && run.persistence !== 'saved' && !(run.status === 'saving' && run.persistence === 'saving') ? run.persistence : undefined;
  const tag = run.usage ? completenessTag(run.usage.completeness, status.completeness) : undefined;
  const settled = run.status === 'completed' || run.status === 'failed' || run.status === 'cancelled' || run.status === 'interrupted' || run.status === 'partial';

  return (
    <section
      {...rest}
      ref={ref}
      className={cx('rl-agent-run-summary', className)}
      aria-labelledby={titleId}
      data-status={run.status}
      data-tone={outcome.tone}
      data-settled={settled || undefined}
    >
      <header className="rl-agent-run-summary__header">
        <Heading level={headingLevel} id={titleId} className="rl-agent-run-summary__title">
          {run.title ?? m.runTitle}
        </Heading>
        <span role="status" className="rl-agent-run-summary__outcome">
          <AgentStatus {...outcome} size="md" />
          {persistence && <AgentStatus {...statusProps(persistenceMeta[persistence], m.runPersistence[persistence])} />}
        </span>
      </header>
      <dl className="rl-agent-run-summary__metrics" aria-label={m.runMetrics}>
        {run.elapsedMs !== undefined && (
          <div>
            <dt>{m.runElapsed}</dt>
            <dd>{format.duration(run.elapsedMs)}</dd>
          </div>
        )}
        {run.toolCount !== undefined && (
          <div>
            <dt>{m.runTools}</dt>
            <dd>{m.runToolCount(run.toolCount)}</dd>
          </div>
        )}
        {run.failedTools !== undefined && run.failedTools > 0 && (
          <div data-tone="danger">
            <dt>{m.runFailedTools}</dt>
            <dd>{m.runToolCount(run.failedTools)}</dd>
          </div>
        )}
        {run.usage && (
          <div>
            <dt>{m.runTokens}</dt>
            <dd>
              {run.usage.tokens !== undefined && run.usage.completeness !== 'unknown' ? format.compact(run.usage.tokens) : status.completeness.unknown}
              {tag && run.usage.completeness !== 'unknown' && <span className="rl-agent-run-summary__tag">{tag}</span>}
            </dd>
          </div>
        )}
      </dl>
      {run.artifacts && run.artifacts.length > 0 && (
        <div className="rl-agent-run-summary__artifacts">
          <p className="rl-agent-run-summary__label" id={`${id}-artifacts`}>
            {m.runArtifacts}
          </p>
          <ul aria-labelledby={`${id}-artifacts`}>
            {run.artifacts.map((artifact) => (
              <li key={artifact.id} className="rl-agent-run-summary__artifact">
                {onOpenArtifact && artifact.status !== 'unavailable' ? (
                  <button type="button" className="rl-agent-run-summary__artifact-title" title={artifact.title} onClick={() => onOpenArtifact(artifact.id)}>
                    {artifact.title}
                  </button>
                ) : (
                  <span className="rl-agent-run-summary__artifact-title" title={artifact.title}>
                    {artifact.title}
                  </span>
                )}
                <span className="rl-agent-run-summary__artifact-status" data-tone={artifactTone[artifact.status]}>
                  {m.artifactStatus[artifact.status]}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {run.sideEffects && (
        <p className="rl-agent-run-summary__notice" data-tone="warning">
          <AgentIcon name="warning" />
          {m.runSideEffects}
        </p>
      )}
      {(onOpenTrace || onOpenDetails || (run.persistence === 'failed' && onRetrySave)) && (
        <div className="rl-agent-run-summary__actions">
          {run.persistence === 'failed' && onRetrySave && (
            <Button size="sm" variant="primary" iconStart={<AgentIcon name="retry" />} onClick={() => void onRetrySave()}>
              {m.runRetrySave}
            </Button>
          )}
          {onOpenTrace && (
            <Button size="sm" variant="secondary" iconStart={<AgentIcon name="list" />} onClick={onOpenTrace}>
              {m.runOpenTrace}
            </Button>
          )}
          {onOpenDetails && (
            <Button size="sm" variant="ghost" onClick={onOpenDetails}>
              {m.runOpenDetails}
            </Button>
          )}
        </div>
      )}
    </section>
  );
});
