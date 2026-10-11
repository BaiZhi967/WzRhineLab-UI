'use client';

import * as React from 'react';
import { AlertDialog as BaseAlertDialog } from '@base-ui/react/alert-dialog';
import { AnimatePresence, motion } from 'motion/react';
import { useRhineMessages } from '../provider/messages.js';
import { usePortalContainer } from '../provider/portal.js';
import { useRhineMotion } from '../motion/useRhineMotion.js';
import { cx } from '../utils/cx.js';
import { Button } from './Button.js';

/**
 * Confirmation for destructive or irreversible actions (ADR-0006 §2) on Base UI AlertDialog:
 * role="alertdialog", always modal, outside clicks never dismiss, Escape = cancel. Initial focus
 * lands on the cancel button. `onConfirm` may return a Promise: while it is pending the confirm
 * button shows `loading` (and keeps focus) and every way of cancelling is ignored; on resolve the
 * dialog closes, on reject it stays open with `errorText` in a role="alert" message.
 * Motion matches Dialog (backdrop fast, panel + 8px rise; opacity only when reduced).
 */

export type AlertDialogTone = 'danger' | 'default';

export type AlertDialogProps = {
  /** Element that opens the dialog (usually a Button). Omit when opening programmatically. */
  trigger?: React.ReactElement<Record<string, unknown>>;
  title: React.ReactNode;
  /** Required: a confirmation must say what will happen. */
  description: React.ReactNode;
  /** Small archive-style label above the title, e.g. "ARCHIVE / DELETE". */
  eyebrow?: React.ReactNode;
  /** Extra detail about the consequences, e.g. the affected records. */
  children?: React.ReactNode;
  /** Label of the confirming action; name it after the action ("删除记录"), not "确定". */
  confirmLabel: React.ReactNode;
  cancelLabel?: React.ReactNode;
  /** `danger` (default) fills the confirm button with the danger colour. */
  tone?: AlertDialogTone;
  /** Runs on confirm. Return a Promise to keep the dialog open until it settles. */
  onConfirm: () => void | Promise<unknown>;
  /** Shown in a role="alert" message when the Promise from `onConfirm` rejects. */
  errorText?: React.ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Fires after the exit animation, when focus has returned. */
  onClosed?: () => void;
  className?: string;
  /** The accessible name and description always come from `title` / `description`. */
  'aria-label'?: never;
  'aria-labelledby'?: never;
};

const offset = 8;

const isThenable = (value: unknown): value is PromiseLike<unknown> =>
  value != null && typeof (value as PromiseLike<unknown>).then === 'function';

export function AlertDialog({
  trigger,
  title,
  description,
  eyebrow,
  children,
  confirmLabel,
  cancelLabel: cancelLabelProp,
  tone = 'danger',
  onConfirm,
  errorText: errorTextProp,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  onClosed,
  className,
}: AlertDialogProps) {
  const messages = useRhineMessages();
  const cancelLabel = cancelLabelProp === undefined ? messages.alertDialog.cancel : cancelLabelProp;
  const errorText = errorTextProp === undefined ? messages.alertDialog.error : errorTextProp;
  const [uncontrolled, setUncontrolled] = React.useState(defaultOpen);
  const controlled = openProp !== undefined;
  const open = controlled ? openProp : uncontrolled;
  const [pending, setPending] = React.useState(false);
  const [failures, setFailures] = React.useState(0);
  const container = usePortalContainer();
  const motionPrefs = useRhineMotion();
  const rise = motionPrefs.reduced ? 0 : offset;
  const cancelRef = React.useRef<HTMLButtonElement>(null);
  const confirmRef = React.useRef<HTMLButtonElement>(null);
  // Identifies the confirmation in flight; bumped on close / reopen / unmount so a stale
  // promise can neither close a later opening nor set state after unmount.
  const attempt = React.useRef(0);

  // Each opening starts clean.
  const [lastOpen, setLastOpen] = React.useState(open);
  if (open !== lastOpen) {
    setLastOpen(open);
    setPending(false);
    if (open) setFailures(0);
  }
  React.useEffect(() => {
    attempt.current += 1;
  }, [open]);
  React.useEffect(
    () => () => {
      attempt.current += 1;
    },
    [],
  );

  // After a failed attempt, focus returns to the confirm button (it is focusable again).
  React.useEffect(() => {
    if (failures > 0) confirmRef.current?.focus();
  }, [failures]);

  const setOpen = (next: boolean) => {
    if (!controlled) setUncontrolled(next);
    onOpenChange?.(next);
  };

  const fail = () => {
    setPending(false);
    setFailures((n) => n + 1);
  };

  const handleConfirm = () => {
    if (pending) return;
    attempt.current += 1;
    const id = attempt.current;
    let result: void | Promise<unknown>;
    try {
      result = onConfirm();
    } catch {
      fail();
      return;
    }
    if (!isThenable(result)) {
      setOpen(false);
      return;
    }
    setPending(true);
    result.then(
      () => {
        if (attempt.current !== id) return;
        setPending(false);
        setOpen(false);
      },
      () => {
        if (attempt.current !== id) return;
        fail();
      },
    );
  };

  return (
    <BaseAlertDialog.Root
      open={open}
      onOpenChange={(next, eventDetails) => {
        // While a confirmation is in flight, cancelling would look like it undid the action.
        if (!next && pending) {
          eventDetails.cancel();
          return;
        }
        setOpen(next);
      }}
      onOpenChangeComplete={(isOpen) => {
        if (!isOpen) onClosed?.();
      }}
    >
      {trigger && <BaseAlertDialog.Trigger render={trigger} />}
      <AnimatePresence>
        {open && (
          <BaseAlertDialog.Portal keepMounted container={container}>
            <BaseAlertDialog.Backdrop
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
            <BaseAlertDialog.Popup
              className={cx('rl-dialog rl-alert-dialog', className)}
              data-slot="alert-dialog"
              data-size="sm"
              data-tone={tone}
              initialFocus={cancelRef}
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
                <BaseAlertDialog.Title className="rl-dialog__title">{title}</BaseAlertDialog.Title>
                <BaseAlertDialog.Description className="rl-dialog__description">{description}</BaseAlertDialog.Description>
              </header>
              {(children != null || failures > 0) && (
                <div className="rl-dialog__body">
                  {children}
                  {failures > 0 && (
                    // Remounted per failure so a repeated failure is announced again.
                    <p key={failures} className="rl-alert-dialog__error" role="alert">
                      {errorText}
                    </p>
                  )}
                </div>
              )}
              <footer className="rl-dialog__actions">
                <BaseAlertDialog.Close
                  disabled={pending}
                  render={<Button ref={cancelRef} variant="ghost" className="rl-alert-dialog__cancel" />}
                >
                  {cancelLabel}
                </BaseAlertDialog.Close>
                <Button
                  ref={confirmRef}
                  className="rl-alert-dialog__confirm"
                  data-tone={tone}
                  loading={pending}
                  onClick={handleConfirm}
                >
                  {confirmLabel}
                </Button>
              </footer>
            </BaseAlertDialog.Popup>
          </BaseAlertDialog.Portal>
        )}
      </AnimatePresence>
    </BaseAlertDialog.Root>
  );
}
