'use client';

import * as React from 'react';

export type ToolbarOrientation = 'horizontal' | 'vertical';

export type ToolbarProps = Omit<React.HTMLAttributes<HTMLDivElement>, 'children' | 'role'> & {
  label: string;
  orientation?: ToolbarOrientation;
  children?: React.ReactNode;
};

function isDisabled(child: React.ReactElement): boolean {
  const props = child.props as { disabled?: boolean; 'aria-disabled'?: boolean | string };
  return props.disabled === true || props['aria-disabled'] === true || props['aria-disabled'] === 'true';
}

export const Toolbar = React.forwardRef<HTMLDivElement, ToolbarProps>(function Toolbar(
  { label, orientation = 'horizontal', children, className, onKeyDown, ...rest },
  ref,
) {
  const items = React.Children.toArray(children);
  const enabledIndices = items.flatMap((child, index) => React.isValidElement(child) && !isDisabled(child) ? [index] : []);
  const [activeIndex, setActiveIndex] = React.useState(enabledIndices[0] ?? 0);
  const currentIndex = enabledIndices.includes(activeIndex) ? activeIndex : (enabledIndices[0] ?? 0);

  const move = (event: React.KeyboardEvent<HTMLDivElement>, direction: 1 | -1, toEdge?: 'start' | 'end') => {
    const target = event.target as HTMLElement;
    if (!target.matches('[data-rl-toolbar-item]')) return;
    const current = enabledIndices.indexOf(Number(target.dataset.rlToolbarIndex));
    if (current < 0) return;
    const next = toEdge === 'start' ? 0 : toEdge === 'end' ? enabledIndices.length - 1 : (current + direction + enabledIndices.length) % enabledIndices.length;
    const nextIndex = enabledIndices[next];
    if (nextIndex === undefined) return;
    event.preventDefault();
    setActiveIndex(nextIndex);
    const root = event.currentTarget;
    root.querySelector<HTMLElement>(`[data-rl-toolbar-index="${nextIndex}"]`)?.focus();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(event);
    if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || enabledIndices.length === 0) return;
    const forward = orientation === 'horizontal' ? event.key === 'ArrowRight' : event.key === 'ArrowDown';
    const backward = orientation === 'horizontal' ? event.key === 'ArrowLeft' : event.key === 'ArrowUp';
    if (forward) move(event, 1);
    else if (backward) move(event, -1);
    else if (event.key === 'Home') move(event, 1, 'start');
    else if (event.key === 'End') move(event, 1, 'end');
  };

  return (
    <div
      {...rest}
      ref={ref}
      role="toolbar"
      aria-label={label}
      aria-orientation={orientation}
      className={['rl-toolbar', className].filter(Boolean).join(' ')}
      data-orientation={orientation}
      onKeyDown={handleKeyDown}
    >
      {items.map((child, index) => {
        if (!React.isValidElement(child)) return child;
        const disabled = isDisabled(child);
        const props = child.props as { onFocus?: React.FocusEventHandler; tabIndex?: number };
        return React.cloneElement(child as React.ReactElement<Record<string, unknown>>, {
          'data-rl-toolbar-item': '',
          'data-rl-toolbar-index': String(index),
          tabIndex: disabled ? -1 : index === currentIndex ? 0 : -1,
          onFocus: (event: React.FocusEvent) => {
            setActiveIndex(index);
            props.onFocus?.(event);
          },
        });
      })}
    </div>
  );
});
