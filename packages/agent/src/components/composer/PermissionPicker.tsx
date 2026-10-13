'use client';

import * as React from 'react';
import { Alert, AlertDialog, Button, Menu, MenuRadioGroup, MenuRadioItem } from '@wzrhine/react';
import type { PermissionModeView } from '@wzrhine/agent-core';
import { AgentIcon } from '../../primitives/icons.js';
import { useAgentMessages } from '../../provider/AgentMessages.js';
import { cx } from '../../utils/cx.js';

export interface PermissionPickerProps {
  modes: readonly PermissionModeView[];
  /** Current mode id (controlled). */
  value: string;
  /**
   * Called with the chosen mode. Elevated modes call it only after the AlertDialog is confirmed.
   * Return a Promise to keep the confirmation open (loading) until it settles; a rejection keeps
   * it open with the AlertDialog error text. Without it the trigger is rendered disabled.
   */
  onChange?: (modeId: string, mode: PermissionModeView) => void | Promise<unknown>;
  disabled?: boolean;
  error?: React.ReactNode;
  receipt?: React.ReactNode;
  confirmErrorText?: React.ReactNode;
  disabledReason?: string;
  /** Override the confirmation copy for elevated modes. */
  confirmTitle?: (mode: PermissionModeView) => React.ReactNode;
  confirmDescription?: (mode: PermissionModeView) => React.ReactNode;
  confirmLabel?: (mode: PermissionModeView) => React.ReactNode;
  side?: 'top' | 'bottom';
  align?: 'start' | 'center' | 'end';
  className?: string;
}

/**
 * Permission mode picker. Trigger (shield icon + label) opens a `@wzrhine/react` Menu with a radio
 * group of modes (descriptions under each label). Choosing a mode with `risk: 'elevated'` does
 * not switch: it opens an AlertDialog (role="alertdialog", focus on 取消) and `onChange` runs
 * only on confirm. Focus returns to the trigger after the menu or the dialog closes.
 * Elevated modes use the danger tone *and* the text "需确认" on the menu item and a warning
 * glyph on the trigger, never colour alone. Motion: inherited from Menu / AlertDialog.
 */
export function PermissionPicker({
  modes,
  value,
  onChange,
  disabled = false,
  error,
  receipt,
  confirmErrorText,
  disabledReason,
  confirmTitle,
  confirmDescription,
  confirmLabel,
  side = 'top',
  align = 'start',
  className,
}: PermissionPickerProps) {
  const messages = useAgentMessages().composer;
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  // The mode awaiting confirmation stays set while the dialog animates out.
  const [pending, setPending] = React.useState<PermissionModeView | null>(null);
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const current = modes.find((m) => m.id === value);
  const elevated = current?.risk === 'elevated';
  const label = current?.label ?? value;

  const [menuOpen, setMenuOpen] = React.useState(false);
  const [changeError, setChangeError] = React.useState<React.ReactNode>(null);
  const pick = (id: string) => {
    setMenuOpen(false);
    const mode = modes.find((m) => m.id === id);
    if (!mode || id === value || !onChange) return;
    if (mode.risk === 'elevated') {
      setPending(mode);
      setConfirmOpen(true);
      return;
    }
    setChangeError(null);
    Promise.resolve(onChange(id, mode)).catch((reason) => {
      setChangeError(reason instanceof Error ? reason.message : (confirmErrorText ?? messages.permissionConfirmDescription));
    });
  };

  return (
    <>
      <Menu
        open={menuOpen}
        onOpenChange={setMenuOpen}
        side={side}
        align={align}
        disabled={disabled || !onChange}
        className={cx('rl-agent-permission-menu', className)}
        trigger={
          <Button
            ref={triggerRef}
            variant="ghost"
            size="sm"
            className="rl-agent-picker-trigger rl-agent-permission"
            data-risk={elevated ? 'elevated' : 'normal'}
            disabled={disabled || !onChange}
            title={disabledReason}
            aria-label={messages.permissionTriggerLabel(label)}
            iconStart={<AgentIcon name={elevated ? 'warning' : 'shield'} />}
            iconEnd={<AgentIcon name="chevron-down" />}
          >
            <span className="rl-agent-picker-trigger__text">{label}</span>
          </Button>
        }
      >
        <MenuRadioGroup label={messages.permissionMenu} value={value} onValueChange={pick}>
          {modes.map((mode) => (
            <MenuRadioItem key={mode.id} value={mode.id}>
              <span className="rl-agent-permission__item" data-risk={mode.risk ?? 'normal'}>
                <span className="rl-agent-permission__label">
                  {mode.label}
                  {mode.risk === 'elevated' && <span className="rl-agent-permission__flag">{messages.permissionElevated}</span>}
                </span>
                {mode.description && <span className="rl-agent-permission__description">{mode.description}</span>}
              </span>
            </MenuRadioItem>
          ))}
        </MenuRadioGroup>
      </Menu>
      {(error || changeError) && <Alert tone="danger" size="sm" title={error === true ? messages.permissionMenu : undefined}>{error === true ? messages.permissionMenu : (error || changeError)}</Alert>}
      {receipt && <p className="rl-agent-permission__receipt" role="status">{receipt}</p>}
      {pending && onChange && (
        <AlertDialog
          open={confirmOpen}
          onOpenChange={setConfirmOpen}
          onClosed={() => {
            setPending(null);
            triggerRef.current?.focus();
          }}
          tone="danger"
          title={confirmTitle ? confirmTitle(pending) : messages.permissionConfirmTitle(pending.label)}
          description={confirmDescription ? confirmDescription(pending) : (pending.description ?? messages.permissionConfirmDescription)}
          confirmLabel={confirmLabel ? confirmLabel(pending) : messages.permissionConfirm(pending.label)}
          onConfirm={() => onChange(pending.id, pending)}
          errorText={confirmErrorText}
        >
          {pending.description && confirmDescription === undefined && <p className="rl-agent-permission__warning">{messages.permissionConfirmDescription}</p>}
        </AlertDialog>
      )}
    </>
  );
}
