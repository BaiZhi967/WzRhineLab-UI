'use client';

import * as React from 'react';
import { Button, Collapsible } from '@wzrhine/react';
import type { SubagentView } from '@wzrhine/agent-core';
import { SubAgentList } from './SubAgentCard.js';
import { cx } from '../../utils/cx.js';
import { useWorkspaceMessages } from './shared.js';
import type { WorkspaceMessagesProp } from './shared.js';

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
  sectionOpen?: Readonly<Record<string, boolean>>;
  onSectionOpenChange?: (id: string, open: boolean) => void;
  messages?: WorkspaceMessagesProp;
};

export function RunOverview({ open: openProp, defaultOpen = true, onOpenChange, facts = [], sections = [], subagents, terminals, onClose, onReopen, sectionOpen, onSectionOpenChange, messages: override, className, ...rest }: RunOverviewProps) {
  const m = useWorkspaceMessages(override);
  const [inner, setInner] = React.useState(defaultOpen);
  const [innerSections, setInnerSections] = React.useState<Record<string, boolean>>({});
  const open = openProp ?? inner;
  const setOpen = (next: boolean) => { if (openProp === undefined) setInner(next); onOpenChange?.(next); };
  if (!open) return <button type="button" className={cx('rl-agent-run-overview__capsule', className)} onClick={() => { setOpen(true); onReopen?.(); }}>{m.runOverview.capsule}</button>;
  return <aside {...rest} className={cx('rl-agent-run-overview', className)} aria-label={m.runOverview.label}>
    <header className="rl-agent-run-overview__header"><strong>{m.runOverview.label}</strong>{onClose && <Button size="sm" variant="ghost" onClick={() => { setOpen(false); onClose(); }}>{m.runOverview.close}</Button>}{!onClose && <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>{m.runOverview.collapse}</Button>}</header>
    {facts.length > 0 && <dl className="rl-agent-run-overview__facts">{facts.map((fact, index) => <div key={index}><dt>{fact.label}</dt><dd>{fact.value}</dd></div>)}</dl>}
    {subagents && <SubAgentList agents={[...subagents]} groupBy="state" groupInherited title={m.runOverview.subagents} />}
    {terminals}
    {sections.map((section) => <Collapsible key={section.id} open={sectionOpen?.[section.id] ?? innerSections[section.id] ?? section.defaultOpen ?? true} onOpenChange={(next) => { if (!sectionOpen) setInnerSections((old) => ({ ...old, [section.id]: next })); onSectionOpenChange?.(section.id, next); }} trigger={section.title} className="rl-agent-run-overview__section">{section.content}</Collapsible>)}
  </aside>;
}
