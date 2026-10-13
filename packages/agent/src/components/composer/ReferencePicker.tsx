'use client';

import * as React from 'react';
import { Button, Input, Popover } from '@wzrhine/react';
import { useAgentMessages } from '../../provider/AgentMessages.js';
import { cx } from '../../utils/cx.js';

export interface ReferenceOption { path: string; name: string; kind?: 'file' | 'folder'; disabled?: boolean; }
export type ReferencePickerProps = Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> & {
  value?: string;
  onValueChange?: (value: string) => void;
  items?: readonly ReferenceOption[];
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  anchor?: React.RefObject<HTMLElement | null> | HTMLElement;
  hideTrigger?: boolean;
  onAdd: (path: string) => Promise<boolean> | boolean;
  onNavigate?: (path: string) => void;
  onUp?: () => void;
  onSearch?: (query: string) => void;
  loading?: boolean;
  error?: React.ReactNode;
  truncated?: boolean;
  disabled?: boolean;
};

export function ReferencePicker({ value = '', onValueChange, items = [], open, defaultOpen, onOpenChange, anchor, hideTrigger = false, onAdd, onNavigate, onUp, onSearch, loading = false, error, truncated = false, disabled = false, className, ...rest }: ReferencePickerProps) {
  const m = useAgentMessages().composer;
  const [issue, setIssue] = React.useState<React.ReactNode>(null);
  const trigger = hideTrigger ? undefined : <Button size="sm" variant="ghost" disabled={disabled}>{m.referencePicker.add}</Button>;
  const add = async (path: string) => { if (disabled) return; const ok = await onAdd(path); if (ok) { setIssue(null); onOpenChange?.(false); } else setIssue(m.referencePicker.error); };
  return <div {...rest} className={cx('rl-agent-reference-picker', className)}>
    <Popover trigger={trigger} anchor={anchor} open={open} defaultOpen={defaultOpen} onOpenChange={onOpenChange} title={m.referencePicker.label} initialFocus={false}>
      <div className="rl-agent-reference-picker__body">
        <Input aria-label={m.referencePicker.search} value={value} onValueChange={(next) => { onValueChange?.(next); onSearch?.(next); }} disabled={disabled} />
        <div className="rl-agent-reference-picker__actions">{onUp && <Button size="sm" variant="ghost" onClick={onUp}>{m.referencePicker.up}</Button>}</div>
        {loading ? <p role="status">{m.referencePicker.loading}</p> : error || issue ? <p role="alert">{error || issue}</p> : items.length === 0 ? <p>{m.referencePicker.empty}</p> : <ul>{items.map((item) => <li key={item.path}><button type="button" disabled={item.disabled} onClick={() => item.kind === 'folder' ? onNavigate?.(item.path) : void add(item.path)}>{item.name}</button></li>)}</ul>}
        {truncated && <p role="status">{m.referencePicker.truncated}</p>}
      </div>
    </Popover>
  </div>;
}
