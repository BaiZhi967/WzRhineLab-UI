'use client';

import * as React from 'react';
import { cx } from '../utils/cx.js';

export type ResizeHandleProps = Omit<React.HTMLAttributes<HTMLDivElement>, 'children' | 'role' | 'defaultValue' | 'onChange'> & {
  size?: number;
  defaultSize?: number;
  onSizeChange?: (size: number) => void;
  onDraggingChange?: (dragging: boolean) => void;
  min: number;
  max: number;
  step?: number;
  largeStep?: number;
  resetSize?: number;
  pane?: 'start' | 'end';
  label?: string;
  getAriaValueText?: (size: number) => string;
  disabled?: boolean;
};

const clamp = (value: number, min: number, max: number) => Math.round(Math.min(Math.max(value, min), Math.max(min, max)));
const rtl = (el: Element) => typeof getComputedStyle !== 'undefined' && getComputedStyle(el).direction === 'rtl';

export const ResizeHandle = React.forwardRef<HTMLDivElement, ResizeHandleProps>(function ResizeHandle({ size: sizeProp, defaultSize, onSizeChange, onDraggingChange, min, max, step = 16, largeStep = 64, resetSize, pane = 'end', label = 'Resize panel', getAriaValueText, disabled = false, className, onKeyDown, onPointerDown, onPointerMove, onPointerUp, onPointerCancel, onLostPointerCapture, onDoubleClick, ...rest }, ref) {
  const [inner, setInner] = React.useState(defaultSize ?? min);
  const raw = sizeProp ?? inner;
  const value = clamp(raw, min, max);
  const drag = React.useRef<{ x: number; value: number; direction: number; pointerId: number } | null>(null);
  const commit = (next: number) => { const clamped = clamp(next, min, max); if (sizeProp === undefined) setInner(clamped); onSizeChange?.(clamped); };
  const direction = (el: Element) => ((pane === 'end') !== rtl(el) ? -1 : 1);
  const stop = () => { if (drag.current) { drag.current = null; onDraggingChange?.(false); } };
  return <div {...rest} ref={ref} role="separator" aria-orientation="vertical" aria-label={rest['aria-labelledby'] ? undefined : label} aria-valuenow={value} aria-valuemin={min} aria-valuemax={Math.max(min, max)} aria-valuetext={getAriaValueText?.(value) ?? `${value}px`} aria-disabled={disabled || undefined} tabIndex={disabled ? -1 : 0} className={cx('rl-resize-handle', className)} data-pane={pane} data-dragging={drag.current ? true : undefined} onKeyDown={(event) => { onKeyDown?.(event); if (event.defaultPrevented || disabled) return; const amount = event.shiftKey ? largeStep : step; const dir = direction(event.currentTarget); const next = event.key === 'ArrowLeft' ? value - amount * dir : event.key === 'ArrowRight' ? value + amount * dir : event.key === 'Home' ? min : event.key === 'End' ? max : null; if (next == null) return; event.preventDefault(); commit(next); }} onPointerDown={(event) => { onPointerDown?.(event); if (event.defaultPrevented || disabled || event.button !== 0) return; event.currentTarget.setPointerCapture?.(event.pointerId); drag.current = { x: event.clientX, value, direction: direction(event.currentTarget), pointerId: event.pointerId }; onDraggingChange?.(true); event.preventDefault(); event.currentTarget.focus(); }} onPointerMove={(event) => { onPointerMove?.(event); const current = drag.current; if (!current || current.pointerId !== event.pointerId) return; commit(current.value + (event.clientX - current.x) * current.direction); }} onPointerUp={(event) => { onPointerUp?.(event); if (drag.current?.pointerId === event.pointerId) stop(); }} onPointerCancel={(event) => { onPointerCancel?.(event); if (drag.current?.pointerId === event.pointerId) stop(); }} onLostPointerCapture={(event) => { onLostPointerCapture?.(event); if (drag.current) stop(); }} onDoubleClick={(event) => { onDoubleClick?.(event); if (!event.defaultPrevented && !disabled) commit(resetSize ?? defaultSize ?? min); }} />;
});
