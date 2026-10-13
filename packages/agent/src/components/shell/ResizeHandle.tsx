'use client';

import * as React from 'react';
import { useAgentFormat, useAgentMessages } from '../../provider/AgentMessages.js';
import { cx } from '../../utils/cx.js';
import { useControllable } from './use-controllable.js';

/**
 * ResizeHandle (atlas 01): a focusable vertical splitter between two columns.
 *
 * - Semantics: `role="separator"` + `aria-orientation="vertical"` with `aria-valuenow / min / max`
 *   and a readable `aria-valuetext`; the value is the size (CSS pixels) of the pane it resizes.
 * - Pointer: drag with pointer capture; the size follows the pointer directly (no animation,
 *   ADR-0012 「侧栏拖动调宽」). Double-click resets to `resetSize` (default `defaultSize`).
 * - Keyboard: ←/→ move the splitter by `step` (Shift: `largeStep`), Home / End jump to min / max.
 *   Arrows move the splitter physically, so with the pane at the inline end ← makes it wider; the
 *   direction follows `dir="rtl"`.
 * - Controlled with `size` + `onSizeChange`, or uncontrolled with `defaultSize`.
 */
export type ResizeHandleProps = Omit<React.HTMLAttributes<HTMLDivElement>, 'children' | 'role' | 'defaultValue' | 'onChange'> & {
  size?: number;
  defaultSize?: number;
  onSizeChange?: (size: number) => void;
  onDraggingChange?: (dragging: boolean) => void;
  min: number;
  max: number;
  /** Arrow-key step in CSS pixels. */
  step?: number;
  /** Shift + arrow step. */
  largeStep?: number;
  /** Size restored on double-click; defaults to `defaultSize`. */
  resetSize?: number;
  /** Logical side of the handle the resized pane is on. */
  pane?: 'start' | 'end';
  /** Accessible name; defaults to the shell copy 「调整详情面板宽度」. */
  label?: string;
  getAriaValueText?: (size: number) => string;
  disabled?: boolean;
};

const clamp = (value: number, min: number, max: number) => Math.round(Math.min(Math.max(value, min), Math.max(min, max)));

function isRtl(el: Element): boolean {
  if (typeof getComputedStyle === 'undefined') return false;
  return getComputedStyle(el).direction === 'rtl' || el.closest('[dir]')?.getAttribute('dir') === 'rtl';
}

export const ResizeHandle = React.forwardRef<HTMLDivElement, ResizeHandleProps>(function ResizeHandle(
  {
    size: sizeProp,
    defaultSize,
    onSizeChange,
    onDraggingChange,
    min,
    max,
    step = 16,
    largeStep = 64,
    resetSize,
    pane = 'end',
    label,
    getAriaValueText,
    disabled = false,
    className,
    onKeyDown,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel,
    onLostPointerCapture,
    onDoubleClick,
    ...rest
  },
  ref,
) {
  const messages = useAgentMessages().shell;
  const format = useAgentFormat();
  const initial = defaultSize ?? min;
  const [rawSize, setRawSize] = useControllable(sizeProp, initial, onSizeChange);
  const size = clamp(rawSize, min, max);
  const drag = React.useRef<{ x: number; size: number; dir: number; id: number } | null>(null);
  const [dragging, setDragging] = React.useState(false);

  const commit = (next: number) => setRawSize(clamp(next, min, max));

  // Physical direction in which a positive pointer delta grows the pane.
  const growDirection = (el: Element) => {
    const towardStart = pane === 'end';
    const rtl = isRtl(el);
    return towardStart !== rtl ? -1 : 1;
  };

  const endDrag = () => {
    drag.current = null;
    setDragging(false);
    onDraggingChange?.(false);
  };

  return (
    <div
      {...rest}
      ref={ref}
      role="separator"
      aria-orientation="vertical"
      aria-label={rest['aria-labelledby'] ? undefined : (label ?? messages.resizeContext)}
      aria-valuenow={size}
      aria-valuemin={min}
      aria-valuemax={Math.max(min, max)}
      aria-valuetext={getAriaValueText ? getAriaValueText(size) : messages.resizeValue(format.number(size))}
      aria-disabled={disabled || undefined}
      tabIndex={disabled ? -1 : 0}
      className={cx('rl-agent-resize', className)}
      data-pane={pane}
      data-dragging={dragging || undefined}
      data-disabled={disabled || undefined}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (event.defaultPrevented || disabled) return;
        const amount = event.shiftKey ? largeStep : step;
        const dir = growDirection(event.currentTarget);
        let next: number | null = null;
        if (event.key === 'ArrowLeft') next = size - amount * dir;
        else if (event.key === 'ArrowRight') next = size + amount * dir;
        else if (event.key === 'Home') next = min;
        else if (event.key === 'End') next = max;
        if (next === null) return;
        event.preventDefault();
        commit(next);
      }}
      onPointerDown={(event) => {
        onPointerDown?.(event);
        if (event.defaultPrevented || disabled || event.button !== 0) return;
        event.currentTarget.setPointerCapture?.(event.pointerId);
        drag.current = { x: event.clientX, size, dir: growDirection(event.currentTarget), id: event.pointerId };
        setDragging(true);
        onDraggingChange?.(true);
        // Keeps the drag from selecting text; focus still lands on the handle.
        event.preventDefault();
        event.currentTarget.focus();
      }}
      onPointerMove={(event) => {
        onPointerMove?.(event);
        const current = drag.current;
        if (!current || current.id !== event.pointerId) return;
        commit(current.size + (event.clientX - current.x) * current.dir);
      }}
      onPointerUp={(event) => {
        onPointerUp?.(event);
        if (drag.current?.id === event.pointerId) endDrag();
      }}
      onPointerCancel={(event) => {
        onPointerCancel?.(event);
        endDrag();
      }}
      onLostPointerCapture={(event) => {
        onLostPointerCapture?.(event);
        endDrag();
      }}
      onDoubleClick={(event) => {
        onDoubleClick?.(event);
        if (event.defaultPrevented || disabled) return;
        commit(resetSize ?? initial);
      }}
    />
  );
});
