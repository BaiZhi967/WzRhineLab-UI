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
  hasMore?: boolean;
  loadingMore?: boolean;
  onLoadMore?: () => void;
  onRetry?: () => void;
  disabled?: boolean;
};

export function ReferencePicker({ value: valueProp, onValueChange, items = [], open: openProp, defaultOpen, onOpenChange, anchor, hideTrigger = false, onAdd, onNavigate, onUp, onSearch, loading = false, error, truncated = false, hasMore = false, loadingMore = false, onLoadMore, onRetry, disabled = false, className, ...rest }: ReferencePickerProps) {
  const m = useAgentMessages().composer;
  const [issue, setIssue] = React.useState<React.ReactNode>(null);
  const [innerValue, setInnerValue] = React.useState(valueProp ?? '');
  const [innerOpen, setInnerOpen] = React.useState(defaultOpen ?? false);
  const [adding, setAdding] = React.useState(false);
  const addAttempt = React.useRef(0);
  const composing = React.useRef(false);
  const value = valueProp ?? innerValue;
  const open = openProp ?? innerOpen;
  const trigger = hideTrigger ? undefined : <Button size="sm" variant="ghost" disabled={disabled}>{m.referencePicker.add}</Button>;
  const setOpen = (next: boolean) => { addAttempt.current += 1; setAdding(false); if (openProp === undefined) setInnerOpen(next); onOpenChange?.(next); };
  const add = async (path: string) => {
    const candidate = path.trim();
    if (disabled || adding || !candidate) return;
    const attempt = ++addAttempt.current;
    setAdding(true);
    setIssue(null);
    try {
      const ok = await onAdd(candidate);
      if (addAttempt.current !== attempt) return;
      if (ok) setOpen(false);
      else setIssue(m.referencePicker.error);
    } catch (reason) {
      if (addAttempt.current !== attempt) return;
      setIssue(reason instanceof Error ? reason.message : m.referencePicker.error);
    } finally {
      if (addAttempt.current === attempt) setAdding(false);
    }
  };
  return <div {...rest} className={cx('rl-agent-reference-picker', className)}>
    <Popover trigger={trigger} anchor={anchor} open={open} onOpenChange={setOpen} title={m.referencePicker.label} initialFocus={false}>
      <form className="rl-agent-reference-picker__body" onSubmit={(event) => { event.preventDefault(); if (!composing.current) void add(value); }}>
        <Input aria-label={m.referencePicker.search} value={value} onValueChange={(next) => { addAttempt.current += 1; setAdding(false); if (valueProp === undefined) setInnerValue(next); onValueChange?.(next); onSearch?.(next); }} disabled={disabled || adding} onCompositionStart={() => { composing.current = true; }} onCompositionEnd={() => { composing.current = false; }} />
        <div className="rl-agent-reference-picker__actions">{onUp && <Button size="sm" variant="ghost" onClick={onUp}>{m.referencePicker.up}</Button>}</div>
        <Button size="sm" variant="secondary" type="submit" disabled={disabled || adding || value.trim() === ''}>{m.referencePicker.add}</Button>
        {loading ? <p role="status">{m.referencePicker.loading}</p> : error || issue ? <div role="alert"><p>{error || issue}</p>{onRetry && <Button size="sm" variant="ghost" onClick={onRetry}>{m.retry}</Button>}</div> : items.length === 0 ? <p>{m.referencePicker.empty}</p> : <ul>{items.map((item) => <li key={item.path}><button type="button" disabled={item.disabled || adding} onClick={() => item.kind === 'folder' ? onNavigate?.(item.path) : void add(item.path)}>{item.name}</button></li>)}</ul>}
        {truncated && <p role="status">{m.referencePicker.truncated}</p>}
        {hasMore && onLoadMore && <Button size="sm" variant="ghost" loading={loadingMore} disabled={loadingMore || disabled} onClick={onLoadMore}>{m.loadMore}</Button>}
      </form>
    </Popover>
  </div>;
}
