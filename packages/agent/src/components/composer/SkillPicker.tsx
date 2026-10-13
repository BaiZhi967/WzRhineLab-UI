'use client';

import * as React from 'react';
import { Button, Popover, Tag } from '@wzrhine/react';
import { useAgentMessages } from '../../provider/AgentMessages.js';
import { cx } from '../../utils/cx.js';

export interface SkillOption { id: string; label: string; source?: string; disabled?: boolean; disabledReason?: string; }
export type SkillPickerProps = Omit<React.HTMLAttributes<HTMLDivElement>, 'children' | 'onChange'> & {
  skills: readonly SkillOption[];
  selected: readonly SkillOption[];
  onChange: (skills: SkillOption[]) => void;
  max?: number;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  anchor?: React.RefObject<HTMLElement | null> | HTMLElement;
  hideTrigger?: boolean;
  loading?: boolean;
  error?: React.ReactNode;
  onRetry?: () => void;
  onLimitReached?: (max: number) => void;
  disabled?: boolean;
};

export function SkillPicker({ skills, selected, onChange, max = 4, open, defaultOpen, onOpenChange, anchor, hideTrigger = false, loading = false, error, onRetry, onLimitReached, disabled = false, className, ...rest }: SkillPickerProps) {
  const m = useAgentMessages().composer;
  const trigger = hideTrigger ? undefined : <Button size="sm" variant="ghost" disabled={disabled}>{m.skillPicker.add}</Button>;
  const selectedIds = new Set(selected.map((item) => item.id));
  const choose = (item: SkillOption) => {
    if (disabled) return;
    if (selectedIds.has(item.id)) {
      // An invalid/stale selection remains removable even though the option itself is disabled.
      onChange(selected.filter((entry) => entry.id !== item.id));
    } else if (!item.disabled) {
      if (selected.length < max) onChange([...selected, item]);
      else onLimitReached?.(max);
    }
  };
  return <div {...rest} className={cx('rl-agent-skill-picker', className)}>
    <Popover trigger={trigger} anchor={anchor} open={open} defaultOpen={defaultOpen} onOpenChange={onOpenChange} title={m.skillPicker.label} initialFocus={false}>
      <div role="listbox" aria-label={m.skillPicker.label} aria-multiselectable="true">
        {loading ? <p role="status">{m.skillPicker.loading}</p> : error ? <div role="alert"><p>{error === true ? m.skillPicker.error : error}</p>{onRetry && <Button size="sm" variant="ghost" onClick={onRetry}>{m.retry}</Button>}</div> : skills.length === 0 ? <p>{m.skillPicker.empty}</p> : skills.map((item) => <button key={item.id} type="button" role="option" aria-selected={selectedIds.has(item.id)} aria-disabled={item.disabled || undefined} disabled={item.disabled && !selectedIds.has(item.id)} title={item.disabledReason} onClick={() => choose(item)}><span>{item.label}</span>{item.source && <small>{item.source}</small>}</button>)}
      </div>
      <p className="rl-agent-skill-picker__limit">{m.skillPicker.limit(String(max))}</p>
    </Popover>
    {selected.length > 0 && <div className="rl-agent-skill-picker__selected" aria-label={m.skillPicker.label}>{selected.map((item) => <Tag key={item.id} tone={item.disabled ? 'invalid' : 'neutral'} onRemove={() => choose(item)} disabled={disabled}>{item.label}</Tag>)}</div>}
  </div>;
}
