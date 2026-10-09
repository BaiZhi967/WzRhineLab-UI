import * as React from 'react';
import { Popover as BasePopover } from '@base-ui/react/popover';
import { usePortalContainer } from '../provider/portal';
import { cx } from '../utils/cx';

/**
 * Non-modal floating panel on Base UI Popover (ADR-0001). Unlike Tooltip it may hold
 * interactive content and is reachable by touch and assistive tech: the trigger gets
 * aria-expanded / aria-controls, the popup is a labelled dialog, focus moves in on open
 * and returns on close, Escape and outside clicks dismiss. Popup motion is a CSS
 * transition on Base UI's starting/ending styles (--rl-motion-fast).
 */

export type PopoverSide = 'top' | 'bottom' | 'left' | 'right';
export type PopoverAlign = 'start' | 'center' | 'end';
export type PopoverSize = 'sm' | 'md' | 'lg';

export type PopoverProps = {
  /** Element that toggles the popover (usually a Button or IconButton with its own name). */
  trigger: React.ReactElement<Record<string, unknown>>;
  /** Visible heading; also the popup's accessible name. Use `aria-label` when there is no title. */
  title?: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
  /** Footer actions. Wrap dismiss-only buttons in `<PopoverClose>`. */
  actions?: React.ReactNode;
  side?: PopoverSide;
  align?: PopoverAlign;
  size?: PopoverSize;
  /** Also open on hover (for preview content). Focus and click still open it. */
  openOnHover?: boolean;
  /** Show a pointer arrow toward the trigger. */
  arrow?: boolean;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Element to focus on open; defaults to the first tabbable element, or the popup. */
  initialFocus?: React.RefObject<HTMLElement | null>;
  /** Accessible name when no visible `title` is rendered. */
  'aria-label'?: string;
  className?: string;
};

export function Popover({
  trigger,
  title,
  description,
  children,
  actions,
  side = 'bottom',
  align = 'center',
  size = 'md',
  openOnHover = false,
  arrow = false,
  open,
  defaultOpen,
  onOpenChange,
  initialFocus,
  'aria-label': ariaLabel,
  className,
}: PopoverProps) {
  const container = usePortalContainer();
  return (
    <BasePopover.Root
      open={open}
      defaultOpen={defaultOpen}
      onOpenChange={onOpenChange ? (next) => onOpenChange(next) : undefined}
    >
      <BasePopover.Trigger render={trigger} openOnHover={openOnHover} />
      <BasePopover.Portal container={container}>
        <BasePopover.Positioner
          className="rl-popover__positioner"
          side={side}
          align={align}
          sideOffset={8}
          collisionPadding={8}
          positionMethod="fixed"
        >
          <BasePopover.Popup
            className={cx('rl-popover', className)}
            data-slot="popover"
            data-size={size}
            aria-label={title == null ? ariaLabel : undefined}
            initialFocus={initialFocus}
          >
            {arrow && (
              <BasePopover.Arrow className="rl-popover__arrow">
                <svg viewBox="0 0 16 8" aria-hidden="true" focusable="false">
                  <path className="rl-popover__arrow-fill" d="M0 8 8 0l8 8Z" />
                  <path className="rl-popover__arrow-stroke" d="M0 8 8 0l8 8" />
                </svg>
              </BasePopover.Arrow>
            )}
            {(title != null || description != null) && (
              <header className="rl-popover__header">
                {title != null && <BasePopover.Title className="rl-popover__title">{title}</BasePopover.Title>}
                {description != null && (
                  <BasePopover.Description className="rl-popover__description">{description}</BasePopover.Description>
                )}
              </header>
            )}
            {children != null && <div className="rl-popover__body">{children}</div>}
            {actions != null && <footer className="rl-popover__actions">{actions}</footer>}
          </BasePopover.Popup>
        </BasePopover.Positioner>
      </BasePopover.Portal>
    </BasePopover.Root>
  );
}

export type PopoverCloseProps = {
  /** The element that closes the popover, e.g. `<Button variant="ghost">完成</Button>`. */
  children: React.ReactElement<Record<string, unknown>>;
};

/** Wraps a button so activating it closes the nearest Popover. */
export function PopoverClose({ children }: PopoverCloseProps) {
  return <BasePopover.Close render={children} />;
}
