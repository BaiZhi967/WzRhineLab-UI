'use client';

import * as React from 'react';
import { useRhineMessages } from '../provider/messages.js';
import { cx } from '../utils/cx.js';
import { IconButton } from './IconButton.js';

/**
 * In-page status message and explanatory note (ADR-0006 §5). Tone is always carried by an
 * icon and text as well as colour.
 *
 * `Alert` chooses its announcement explicitly with `live`: `off` (default; present on load,
 * not announced), `polite` (`role="status"`) or `assertive` (`role="alert"`, failures only).
 * Live regions announce changes, so render a polite Alert first and then change its content.
 * One message, one live container: do not repeat it in a Toast. The role sits on the message
 * text, so the action and dismiss buttons are not read out as part of the announcement.
 * The component holds no hidden state: `onDismiss` renders a close button and the caller
 * removes the Alert and moves focus somewhere sensible (e.g. the control that triggered it).
 *
 *   <Alert tone="warning" title="3 条记录未通过校验" onDismiss={hide}>导出前请先修正。</Alert>
 *
 * `Callout` is a side note (`role="note"`): never live, never dismissible.
 */

export type AlertTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';
export type AlertLive = 'off' | 'polite' | 'assertive';

type BaseProps = Omit<React.HTMLAttributes<HTMLDivElement>, 'title' | 'role'> & {
  tone?: AlertTone;
  title?: React.ReactNode;
  children?: React.ReactNode;
  /** Replace the tone icon; `null` removes it. */
  icon?: React.ReactNode;
};

export type AlertProps = BaseProps & {
  live?: AlertLive;
  /** Follow-up control(s), e.g. a small Button 「查看」. */
  action?: React.ReactNode;
  /** Shows a close button. The caller removes the Alert and places focus. */
  onDismiss?: () => void;
  /** Accessible name of the close button. */
  dismissLabel?: string;
};

export type CalloutProps = BaseProps;

const liveRole: Record<AlertLive, 'status' | 'alert' | undefined> = {
  off: undefined,
  polite: 'status',
  assertive: 'alert',
};

/** Tone glyphs; same shapes as the Toast status icon so a status reads the same everywhere. */
function ToneIcon({ tone, className }: { tone: AlertTone; className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" aria-hidden="true" focusable="false" data-tone={tone}>
      {tone === 'success' && <path d="m3.5 8.5 3 3 6-7" />}
      {tone === 'danger' && <path d="M5 5l6 6M11 5l-6 6" />}
      {tone === 'warning' && <path d="M8 2.5 14 13.5H2L8 2.5ZM8 7v2.5M8 11.5v.01" />}
      {tone === 'info' && <path d="M8 7.5V11.5M8 5v.01" />}
      {tone === 'neutral' && <path d="M4 8h8" />}
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false" className="rl-alert__close-icon">
      <path d="M4 4l8 8M12 4l-8 8" />
    </svg>
  );
}

function Message({
  tone,
  icon,
  title,
  children,
  role,
}: {
  tone: AlertTone;
  icon: React.ReactNode;
  title: React.ReactNode;
  children: React.ReactNode;
  role?: 'status' | 'alert';
}) {
  return (
    <div className="rl-alert__message" role={role}>
      {icon === undefined ? (
        <ToneIcon tone={tone} className="rl-alert__icon rl-alert__glyph" />
      ) : icon === null ? null : (
        <span className="rl-alert__icon" aria-hidden="true">
          {icon}
        </span>
      )}
      <div className="rl-alert__text">
        {title != null && title !== false && <p className="rl-alert__title">{title}</p>}
        {children != null && children !== false && <div className="rl-alert__body">{children}</div>}
      </div>
    </div>
  );
}

export const Alert = React.forwardRef<HTMLDivElement, AlertProps>(function Alert(
  { tone = 'info', title, children, icon, live = 'off', action, onDismiss, dismissLabel, className, ...rest },
  ref,
) {
  const messages = useRhineMessages();
  return (
    <div {...rest} ref={ref} className={cx('rl-alert', className)} data-slot="alert" data-tone={tone} data-live={live}>
      <Message tone={tone} icon={icon} title={title} role={liveRole[live]}>
        {children}
      </Message>
      {action != null && <div className="rl-alert__action">{action}</div>}
      {onDismiss && (
        <IconButton className="rl-alert__dismiss" size="sm" variant="ghost" icon={<CloseIcon />} label={dismissLabel ?? messages.alert.dismiss} onClick={onDismiss} />
      )}
    </div>
  );
});

export const Callout = React.forwardRef<HTMLDivElement, CalloutProps>(function Callout(
  { tone = 'info', title, children, icon, className, ...rest },
  ref,
) {
  return (
    <div {...rest} ref={ref} role="note" className={cx('rl-alert', 'rl-callout', className)} data-slot="callout" data-tone={tone}>
      <Message tone={tone} icon={icon} title={title}>
        {children}
      </Message>
    </div>
  );
});
