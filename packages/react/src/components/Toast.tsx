import * as React from 'react';
import { Toast as BaseToast } from '@base-ui/react/toast';
import { usePortalContainer, usePortalPending } from '../provider/portal';
import type { StatusKind } from './StatusBadge';

/**
 * Notifications on Base UI Toast (ADR-0001). The viewport is a polite live region (F6 jumps
 * into it); `priority: 'high'` toasts are announced assertively. Toasts pause their timer
 * while hovered or focused, stack with a peek, and can be swiped away on touch.
 * `RhineProvider` mounts the provider and viewport, so call `useToast()` anywhere inside it.
 */

export type ToastStatus = Exclude<StatusKind, 'neutral'> | 'neutral';

export interface ToastOptions {
  title: React.ReactNode;
  description?: React.ReactNode;
  status?: ToastStatus;
  /** Auto-dismiss delay in ms. `0` keeps it until dismissed; use for errors that need action. */
  timeout?: number;
  /** `high` interrupts screen readers (role=alert). Reserve for failures and time-critical notices. */
  priority?: 'low' | 'high';
  /** A single follow-up action, e.g. 撤销 / 查看. */
  action?: { label: string; onClick: () => void };
  onClose?: () => void;
}

interface ToastData {
  status: ToastStatus;
  action?: ToastOptions['action'];
}

export interface ToastApi {
  /** Show a toast; returns its id. */
  show: (options: ToastOptions) => string;
  /** Replace the content of an existing toast (e.g. 处理中 → 已完成). */
  update: (id: string, options: Partial<ToastOptions>) => void;
  dismiss: (id?: string) => void;
}

export function useToast(): ToastApi {
  const manager = BaseToast.useToastManager<ToastData>();
  return React.useMemo<ToastApi>(
    () => ({
      show: ({ title, description, status = 'neutral', timeout, priority, action, onClose }) =>
        manager.add({ title, description, timeout, priority, onClose, type: status, data: { status, action } }),
      update: (id, { title, description, status, timeout, priority, action }) =>
        manager.update(id, (prev) => ({
          ...(title !== undefined && { title }),
          ...(description !== undefined && { description }),
          ...(timeout !== undefined && { timeout }),
          ...(priority !== undefined && { priority }),
          ...(status !== undefined && { type: status }),
          data: {
            status: status ?? prev.data?.status ?? 'neutral',
            action: action ?? prev.data?.action,
          },
        })),
      dismiss: (id) => manager.close(id),
    }),
    [manager],
  );
}

function StatusIcon({ status }: { status: ToastStatus }) {
  return (
    <svg className="rl-toast__icon" viewBox="0 0 16 16" aria-hidden="true" focusable="false" data-status={status}>
      {status === 'success' && <path d="m3.5 8.5 3 3 6-7" />}
      {status === 'danger' && <path d="M5 5l6 6M11 5l-6 6" />}
      {status === 'warning' && <path d="M8 2.5 14 13.5H2L8 2.5ZM8 7v2.5M8 11.5v.01" />}
      {status === 'info' && <path d="M8 7.5V11.5M8 5v.01" />}
      {status === 'neutral' && <path d="M4 8h8" />}
    </svg>
  );
}

function ToastList() {
  const { toasts } = BaseToast.useToastManager<ToastData>();
  return toasts.map((toast) => {
    const status = toast.data?.status ?? 'neutral';
    const action = toast.data?.action;
    return (
      <BaseToast.Root key={toast.id} toast={toast} className="rl-toast" data-status={status}>
        <BaseToast.Content className="rl-toast__content">
          <StatusIcon status={status} />
          <div className="rl-toast__text">
            <BaseToast.Title className="rl-toast__title" />
            <BaseToast.Description className="rl-toast__description" />
          </div>
          {action && (
            <BaseToast.Action className="rl-toast__action" onClick={action.onClick}>
              {action.label}
            </BaseToast.Action>
          )}
          <BaseToast.Close className="rl-toast__close" aria-label="关闭通知">
            <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
              <path d="M4 4l8 8M12 4l-8 8" />
            </svg>
          </BaseToast.Close>
        </BaseToast.Content>
      </BaseToast.Root>
    );
  });
}

/** Viewport that renders queued toasts. Mounted by RhineProvider; render it yourself only without one. */
export function ToastViewport() {
  const container = usePortalContainer();
  // Wait for the provider's portal node so the viewport never lands outside the themed root.
  if (usePortalPending()) return null;
  return (
    <BaseToast.Portal container={container}>
      <BaseToast.Viewport className="rl-toast-viewport" data-slot="toast-viewport">
        <ToastList />
      </BaseToast.Viewport>
    </BaseToast.Portal>
  );
}

export const ToastProvider = BaseToast.Provider;
