import * as React from 'react';
import { Tooltip as BaseTooltip } from '@base-ui/react/tooltip';
import { usePortalContainer } from '../provider/RhineProvider';
import { cx } from '../utils/cx';

export type TooltipSide = 'top' | 'bottom' | 'left' | 'right';

export type TooltipProps = {
  /** Short visual label. Must match the trigger's accessible name — tooltips are not announced. */
  content: React.ReactNode;
  /**
   * A single focusable element (Button, IconButton, link). It must already have an accessible
   * name; the tooltip only mirrors it for sighted mouse and keyboard users.
   */
  children: React.ReactElement<Record<string, unknown>>;
  side?: TooltipSide;
  /** Override the provider's hover delay (ms). Focus always opens immediately. */
  delay?: number;
  disabled?: boolean;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
};

/**
 * Visual label for icon-only or truncated controls (Base UI Tooltip). Not for essential
 * information: tooltips are unavailable to touch and screen-reader users, so put anything
 * important in visible text or a Popover instead.
 */
export function Tooltip({
  content,
  children,
  side = 'top',
  delay,
  disabled,
  open,
  defaultOpen,
  onOpenChange,
  className,
}: TooltipProps) {
  const container = usePortalContainer();
  return (
    <BaseTooltip.Root
      open={open}
      defaultOpen={defaultOpen}
      onOpenChange={onOpenChange ? (o) => onOpenChange(o) : undefined}
      disabled={disabled}
    >
      <BaseTooltip.Trigger render={children} delay={delay} />
      <BaseTooltip.Portal container={container}>
        <BaseTooltip.Positioner side={side} sideOffset={6} collisionPadding={8} className="rl-tooltip__positioner">
          <BaseTooltip.Popup className={cx('rl-tooltip', className)} data-slot="tooltip">
            {content}
          </BaseTooltip.Popup>
        </BaseTooltip.Positioner>
      </BaseTooltip.Portal>
    </BaseTooltip.Root>
  );
}
