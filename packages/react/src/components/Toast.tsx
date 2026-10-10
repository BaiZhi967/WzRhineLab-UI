import * as React from 'react';
import { Toast as BaseToast } from '@base-ui/react/toast';
import { usePortalContainer, usePortalPending } from '../provider/portal.js';
import { Spinner } from './Spinner.js';
import type { StatusKind } from './StatusBadge.js';

/**
 * Notifications on Base UI Toast (ADR-0001). The viewport is a polite live region (F6 jumps
 * into it); `priority: 'high'` toasts are announced assertively. Toasts pause their timer
 * while hovered or focused, stack with a peek, and can be swiped away on touch.
 * `RhineProvider` mounts the provider and viewport, so call `useToast()` anywhere inside it.
 *
 * ADR-0006 §8: `show({ id })` with a visible id updates that toast in place and restarts its
 * timer; the action closes its toast after running (unless `keepOpen`); toasts with an action
 * stay at least 10 s; `promise()` turns one toast from 处理中 into the result.
 */

export type ToastStatus = Exclude<StatusKind, 'neutral'> | 'neutral';

/** A single follow-up action, e.g. 撤销 / 查看 / 重试. */
export interface ToastAction {
  label: string;
  onClick: () => void;
  /** Keep the toast open after the action runs. By default it closes. */
  keepOpen?: boolean;
}

export interface ToastOptions {
  /** Showing a toast with the id of one still on screen updates it in place (no stacking). */
  id?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  status?: ToastStatus;
  /**
   * Auto-dismiss delay in ms. `0` keeps it until dismissed; use for errors that need action.
   * Defaults to the provider's `toastTimeout`; with an `action`, to at least 10 s.
   */
  timeout?: number;
  /** `high` interrupts screen readers (role=alert). Reserve for failures and time-critical notices. */
  priority?: 'low' | 'high';
  /** The page must still offer the same result or an equivalent control; the toast is a shortcut. */
  action?: ToastAction;
  onClose?: () => void;
}

/** A promise stage: a title, full options, or (for success / error) a function of the outcome. */
export type ToastPromiseStage<Arg> = string | ToastOptions | ((value: Arg) => string | ToastOptions);

export interface ToastPromiseOptions<Value> {
  /** Shown until the promise settles; never auto-dismisses. Status defaults to `info`. */
  loading: string | ToastOptions;
  /** Status defaults to `success`. */
  success: ToastPromiseStage<Value>;
  /** Status defaults to `danger`, priority to `high` and timeout to `0` (stays until dismissed). */
  error: ToastPromiseStage<unknown>;
}

interface ToastData {
  status: ToastStatus;
  action?: ToastAction;
}

export interface ToastApi {
  /** Show a toast; returns its id. With an existing `id`, updates that toast instead. */
  show: (options: ToastOptions) => string;
  /** Replace the content of an existing toast (e.g. 处理中 → 已完成). */
  update: (id: string, options: Partial<ToastOptions>) => void;
  dismiss: (id?: string) => void;
  /**
   * One toast follows the promise: `loading` until it settles, then `success` or `error` in
   * place. Returns a promise with the same outcome (it rejects when the input rejects).
   */
  promise: <Value>(promise: Promise<Value>, options: ToastPromiseOptions<Value>) => Promise<Value>;
}

/** Toasts with an action stay at least this long, so there is time to reach the button. */
const ACTION_MIN_TIMEOUT = 10000;
const BASE_DEFAULT_TIMEOUT = 5000;

/** The provider's default timeout; Base UI keeps it private, so ToastProvider republishes it. */
const ToastTimeoutContext = React.createContext(BASE_DEFAULT_TIMEOUT);

export type ToastProviderProps = React.ComponentProps<typeof BaseToast.Provider>;

/** Toast queue. Mounted by RhineProvider; render it yourself only without one. */
export function ToastProvider({ timeout = BASE_DEFAULT_TIMEOUT, ...rest }: ToastProviderProps) {
  return (
    <ToastTimeoutContext.Provider value={timeout}>
      <BaseToast.Provider timeout={timeout} {...rest} />
    </ToastTimeoutContext.Provider>
  );
}

function resolveTimeout(timeout: number | undefined, action: ToastAction | undefined, providerTimeout: number) {
  if (timeout !== undefined || !action) return timeout;
  // `0` at the provider means "never auto-dismiss"; keep that.
  return providerTimeout === 0 ? 0 : Math.max(providerTimeout, ACTION_MIN_TIMEOUT);
}

function toManager(
  { id, title, description, status = 'neutral', timeout, priority, action, onClose }: ToastOptions,
  providerTimeout: number,
) {
  return {
    ...(id !== undefined && { id }),
    title,
    description,
    timeout: resolveTimeout(timeout, action, providerTimeout),
    priority,
    onClose,
    type: status,
    data: { status, action } satisfies ToastData,
  };
}

function resolveStage<Arg>(
  stage: ToastPromiseStage<Arg>,
  value: Arg,
  defaults: Pick<ToastOptions, 'status' | 'priority' | 'timeout'>,
  providerTimeout: number,
) {
  const resolved = typeof stage === 'function' ? stage(value) : stage;
  const options: ToastOptions = typeof resolved === 'string' ? { title: resolved } : resolved;
  const merged = toManager({ ...defaults, ...options }, providerTimeout);
  // Base UI owns the toast type during a promise (loading → success / error); keep ours in data.
  const { type: _type, id: _id, ...rest } = merged as typeof merged & { id?: string };
  return rest;
}

export function useToast(): ToastApi {
  const manager = BaseToast.useToastManager<ToastData>();
  const providerTimeout = React.useContext(ToastTimeoutContext);
  return React.useMemo<ToastApi>(
    () => ({
      show: (options) => manager.add(toManager(options, providerTimeout)),
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
      promise: (promise, { loading, success, error }) =>
        manager.promise(promise, {
          loading: resolveStage(loading, undefined, { status: 'info' }, providerTimeout),
          success: (value) => resolveStage(success, value, { status: 'success' }, providerTimeout),
          error: (reason: unknown) =>
            resolveStage(error, reason, { status: 'danger', priority: 'high', timeout: 0 }, providerTimeout),
        }),
    }),
    [manager, providerTimeout],
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
  const { toasts, close } = BaseToast.useToastManager<ToastData>();
  return toasts.map((toast) => {
    const status = toast.data?.status ?? 'neutral';
    const action = toast.data?.action;
    const runAction = () => {
      action?.onClick();
      if (!action?.keepOpen) close(toast.id);
    };
    return (
      <BaseToast.Root key={toast.id} toast={toast} className="rl-toast" data-status={status}>
        <BaseToast.Content className="rl-toast__content">
          {toast.type === 'loading' ? <Spinner size="md" className="rl-toast__icon" /> : <StatusIcon status={status} />}
          <div className="rl-toast__text">
            <BaseToast.Title className="rl-toast__title" />
            <BaseToast.Description className="rl-toast__description" />
          </div>
          {action && (
            <BaseToast.Action className="rl-toast__action" onClick={runAction}>
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
