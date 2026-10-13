'use client';

import * as React from 'react';
import { Button, Collapsible } from '@wzrhine/react';
import type { SubagentView } from '@wzrhine/agent-core';
import { SubAgentList } from './SubAgentCard.js';
import { cx } from '../../utils/cx.js';

export interface RunOverviewFact { label: React.ReactNode; value: React.ReactNode; }
export interface RunOverviewSection { id: string; title: React.ReactNode; content: React.ReactNode; defaultOpen?: boolean; }
export type RunOverviewProps = Omit<React.HTMLAttributes<HTMLElement>, 'children'> & {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  facts?: readonly RunOverviewFact[];
  sections?: readonly RunOverviewSection[];
  subagents?: readonly SubagentView[];
  terminals?: React.ReactNode;
  onClose?: () => void;
  onReopen?: () => void;
};

export function RunOverview({ open: openProp, defaultOpen = true, onOpenChange, facts = [], sections = [], subagents, terminals, onClose, onReopen, className, ...rest }: RunOverviewProps) {
  const [inner, setInner] = React.useState(defaultOpen);
  const open = openProp ?? inner;
  const setOpen = (next: boolean) => { if (openProp === undefined) setInner(next); onOpenChange?.(next); };
  if (!open) return <button type="button" className={cx('rl-agent-run-overview__capsule', className)} onClick={() => { setOpen(true); onReopen?.(); }}>Open run overview</button>;
  return <aside {...rest} className={cx('rl-agent-run-overview', className)} aria-label="Run overview">
    <header className="rl-agent-run-overview__header"><strong>Run overview</strong>{onClose && <Button size="sm" variant="ghost" onClick={() => { setOpen(false); onClose(); }}>Close</Button>}{!onClose && <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>Collapse</Button>}</header>
    {facts.length > 0 && <dl className="rl-agent-run-overview__facts">{facts.map((fact, index) => <div key={index}><dt>{fact.label}</dt><dd>{fact.value}</dd></div>)}</dl>}
    {subagents && <SubAgentList agents={[...subagents]} groupInherited title="Sub agents" />}
    {terminals}
    {sections.map((section) => <Collapsible key={section.id} defaultOpen={section.defaultOpen ?? true} trigger={section.title} className="rl-agent-run-overview__section">{section.content}</Collapsible>)}
  </aside>;
}
