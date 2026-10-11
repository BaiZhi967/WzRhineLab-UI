import * as React from 'react';
import '@wzrhine/agent/styles.css';
import { AgentOverviewPage } from './OverviewPage';
import { AgentShellPage } from './ShellPage';
import { AgentMessagePage } from './MessagePage';
import { AgentToolsPage } from './ToolsPage';
import { AgentComposerPage } from './ComposerPage';
import { AgentInterventionPage } from './InterventionPage';
import { AgentWorkspacePage } from './WorkspacePage';
import { AgentMotionPage } from './MotionPage';

/** Lazy chunk entry: every Agent UI page plus the agent stylesheet. */
export function AgentPages({ id }: { id: string }) {
  switch (id) {
    case 'agent-shell':
      return <AgentShellPage />;
    case 'agent-message':
      return <AgentMessagePage />;
    case 'agent-tools':
      return <AgentToolsPage />;
    case 'agent-composer':
      return <AgentComposerPage />;
    case 'agent-intervention':
      return <AgentInterventionPage />;
    case 'agent-workspace':
      return <AgentWorkspacePage />;
    case 'agent-motion':
      return <AgentMotionPage />;
    default:
      return <AgentOverviewPage />;
  }
}
