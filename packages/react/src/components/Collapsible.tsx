'use client';

import * as React from 'react';
import { Collapsible as BaseCollapsible } from '@base-ui/react/collapsible';
import { cx } from '../utils/cx.js';

/**
 * Show / hide one region on Base UI Collapsible (ADR-0010 §2). The trigger is a real `<button>`
 * with `aria-expanded` / `aria-controls`; the panel animates its height through Base UI's
 * `--collapsible-panel-height` variable (CSS transition, interruptible: toggling mid-flight
 * reverses from the current height). Reduced motion zeroes the duration token, so it snaps.
 *
 * The panel is unmounted while closed unless `keepMounted` is set, so collapsed content never
 * lingers in the accessibility tree and heavy content mounts only on first open.
 *
 *   <Collapsible trigger={<span>工具详情</span>}>…</Collapsible>
 */

export type CollapsibleProps = Omit<React.HTMLAttributes<HTMLDivElement>, 'children' | 'onChange'> & {
  /** Content of the trigger button (label, status, meta). The chevron is added unless `chevron={false}`. */
  trigger: React.ReactNode;
  children?: React.ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  disabled?: boolean;
  /** Keep the panel in the DOM (hidden) while closed, e.g. to preserve scroll position inside it. */
  keepMounted?: boolean;
  /** Show the rotating chevron at the end of the trigger. */
  chevron?: boolean;
  /** Extra props for the trigger button (accessible name override, data attributes). */
  triggerProps?: Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'type'>;
  /** Class name for the panel element. */
  panelClassName?: string;
};

function Chevron() {
  return (
    <svg className="rl-collapsible__chevron" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <path d="m4 6 4 4 4-4" />
    </svg>
  );
}

export const Collapsible = React.forwardRef<HTMLDivElement, CollapsibleProps>(function Collapsible(
  {
    trigger,
    children,
    open,
    defaultOpen,
    onOpenChange,
    disabled,
    keepMounted = false,
    chevron = true,
    triggerProps,
    panelClassName,
    className,
    ...rest
  },
  ref,
) {
  return (
    <BaseCollapsible.Root
      {...rest}
      ref={ref}
      open={open}
      defaultOpen={defaultOpen}
      onOpenChange={onOpenChange ? (next) => onOpenChange(next) : undefined}
      disabled={disabled}
      className={cx('rl-collapsible', className)}
      data-slot="collapsible"
    >
      <BaseCollapsible.Trigger {...triggerProps} className={cx('rl-collapsible__trigger', triggerProps?.className)}>
        <span className="rl-collapsible__label">{trigger}</span>
        {chevron && <Chevron />}
      </BaseCollapsible.Trigger>
      <BaseCollapsible.Panel keepMounted={keepMounted} className={cx('rl-collapsible__panel', panelClassName)}>
        <div className="rl-collapsible__content">{children}</div>
      </BaseCollapsible.Panel>
    </BaseCollapsible.Root>
  );
});
