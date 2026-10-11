'use client';

import * as React from 'react';
import { Button, EmptyState } from '@wzrhine/react';
import type { EmptyStateProps } from '@wzrhine/react';
import { useAgentMessages } from '../../provider/AgentMessages.js';
import { AgentIcon } from '../../primitives/icons.js';
import { cx } from '../../utils/cx.js';

/**
 * AgentEmptyState: EmptyState (@wzrhine/react) with agent defaults. No live role (an empty
 * region is not an event). `onCreate` adds a 「新建会话」 button; without it there is no button.
 */
export type AgentEmptyStateProps = Omit<EmptyStateProps, 'title' | 'action'> & {
  title?: React.ReactNode;
  /** Primary action; renders a button labelled `createLabel`. */
  onCreate?: () => void;
  createLabel?: React.ReactNode;
  /** Custom action instead of the create button. */
  action?: React.ReactNode;
};

export const AgentEmptyState = React.forwardRef<HTMLDivElement, AgentEmptyStateProps>(function AgentEmptyState(
  { title, description, onCreate, createLabel, action, kind = 'first-use', headingLevel = 2, className, ...rest },
  ref,
) {
  const shell = useAgentMessages().shell;
  return (
    <EmptyState
      {...rest}
      ref={ref}
      className={cx('rl-agent-empty', className)}
      kind={kind}
      headingLevel={headingLevel}
      title={title ?? shell.workspaceEmptyTitle}
      description={description === undefined ? shell.workspaceEmptyDescription : description}
      action={
        action ??
        (onCreate ? (
          <Button size="sm" variant="secondary" onClick={onCreate}>
            <AgentIcon name="plus" />
            {createLabel ?? shell.create}
          </Button>
        ) : undefined)
      }
    />
  );
});

/**
 * AgentWorkspaceEmpty: the reading column when no conversation is selected. Same as
 * AgentEmptyState, centred in the available height.
 */
export const AgentWorkspaceEmpty = React.forwardRef<HTMLDivElement, AgentEmptyStateProps>(function AgentWorkspaceEmpty(
  { className, ...rest },
  ref,
) {
  return <AgentEmptyState {...rest} ref={ref} className={cx('rl-agent-empty--workspace', className)} />;
});
