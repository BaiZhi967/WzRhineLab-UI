import * as React from 'react';
import { Dialog as BaseDialog } from '@base-ui/react/dialog';
import { AnimatePresence, motion } from 'motion/react';
import { usePortalContainer } from '../provider/RhineProvider';
import { useRhineMotion } from '../motion/useRhineMotion';
import { cx } from '../utils/cx';

/**
 * Modal dialog on Base UI Dialog (ADR-0001): focus trap, Escape, scroll lock, inert background
 * and focus return are handled by Base UI; enter/exit run through motion/react (panel 280ms,
 * 8px rise; opacity-only under reduced motion). Open state is always owned here so exit
 * animations can finish before unmount, whether the caller controls `open` or not.
 */

export type DialogSize = 'sm' | 'md' | 'lg';

export type DialogProps = {
  /** Element that opens the dialog (usually a Button). Omit when opening programmatically. */
  trigger?: React.ReactElement<Record<string, unknown>>;
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Small archive-style label above the title, e.g. "ARCHIVE / CONFIRM". */
  eyebrow?: React.ReactNode;
  /** Footer actions. Use `<DialogClose>` for buttons that only dismiss. */
  actions?: React.ReactNode;
  children?: React.ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Fires after the exit animation, when focus has returned. */
  onClosed?: () => void;
  size?: DialogSize;
  /** `false` keeps outside clicks from dismissing (use for destructive confirmations). */
  dismissOnOutsideClick?: boolean;
  /** Element to focus on open; defaults to the first tabbable element. */
  initialFocus?: React.RefObject<HTMLElement | null>;
  className?: string;
};

const offset = 8;

export function Dialog({
  trigger,
  title,
  description,
  eyebrow,
  actions,
  children,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  onClosed,
  size = 'md',
  dismissOnOutsideClick = true,
  initialFocus,
  className,
}: DialogProps) {
  const [uncontrolled, setUncontrolled] = React.useState(defaultOpen);
  const controlled = openProp !== undefined;
  const open = controlled ? openProp : uncontrolled;
  const container = usePortalContainer();
  const motionPrefs = useRhineMotion();
  const rise = motionPrefs.reduced ? 0 : offset;

  const setOpen = (next: boolean) => {
    if (!controlled) setUncontrolled(next);
    onOpenChange?.(next);
  };

  return (
    <BaseDialog.Root
      open={open}
      onOpenChange={(next) => setOpen(next)}
      onOpenChangeComplete={(isOpen) => {
        if (!isOpen) onClosed?.();
      }}
      disablePointerDismissal={!dismissOnOutsideClick}
    >
      {trigger && <BaseDialog.Trigger render={trigger} />}
      <AnimatePresence>
        {open && (
          <BaseDialog.Portal keepMounted container={container}>
            <BaseDialog.Backdrop
              className="rl-dialog__backdrop"
              render={
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={motionPrefs.get('fast')}
                />
              }
            />
            <BaseDialog.Popup
              className={cx('rl-dialog', className)}
              data-slot="dialog"
              data-size={size}
              initialFocus={initialFocus}
              render={
                <motion.div
                  initial={{ opacity: 0, y: rise }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: rise }}
                  transition={motionPrefs.get('panel')}
                />
              }
            >
              <header className="rl-dialog__header">
                {eyebrow != null && <p className="rl-dialog__eyebrow">{eyebrow}</p>}
                <BaseDialog.Title className="rl-dialog__title">{title}</BaseDialog.Title>
                {description != null && (
                  <BaseDialog.Description className="rl-dialog__description">{description}</BaseDialog.Description>
                )}
              </header>
              {children != null && <div className="rl-dialog__body">{children}</div>}
              {actions != null && <footer className="rl-dialog__actions">{actions}</footer>}
            </BaseDialog.Popup>
          </BaseDialog.Portal>
        )}
      </AnimatePresence>
    </BaseDialog.Root>
  );
}

export type DialogCloseProps = {
  /** The element that closes the dialog, typically `<Button variant="ghost">取消</Button>`. */
  children: React.ReactElement<Record<string, unknown>>;
};

/** Wraps a button so activating it closes the nearest Dialog. */
export function DialogClose({ children }: DialogCloseProps) {
  return <BaseDialog.Close render={children} />;
}
