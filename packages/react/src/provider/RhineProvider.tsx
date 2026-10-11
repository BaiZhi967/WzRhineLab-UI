'use client';

import * as React from 'react';
import { MotionConfig } from 'motion/react';
import { Tooltip as BaseTooltip } from '@base-ui/react/tooltip';
import { ToastProvider, ToastViewport } from '../components/Toast.js';
import { cx } from '../utils/cx.js';
import { PortalContext } from './portal.js';
import { RhineLocaleProvider, useResolvedLocale } from './messages.js';
import type { RhineMessagesOverrides } from './messages.js';

export { usePortalContainer } from './portal.js';

export type RhineTheme = 'light' | 'dark' | 'system';
export type RhineDensity = 'comfortable' | 'compact';
/** `user` follows the OS setting; `reduce` forces reduced motion for this subtree. */
export type RhineMotionPreference = 'user' | 'reduce';

export type RhineProviderProps = Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> & {
  theme?: RhineTheme;
  density?: RhineDensity;
  motion?: RhineMotionPreference;
  /** Hover delay before a tooltip opens (ms). Moving between adjacent triggers is instant. */
  tooltipDelay?: number;
  /** Default toast auto-dismiss (ms). */
  toastTimeout?: number;
  /** Maximum toasts shown at once; older ones are hidden (inert) until space frees up. */
  toastLimit?: number;
  /**
   * Mount a toast queue for this subtree. Nested providers default to `false` so a themed
   * preview region shares the app's single toast viewport.
   */
  toasts?: boolean;
  /**
   * Built-in copy for this subtree (ADR-0009), merged per namespace over the outer provider's
   * table (or `zhCN`). Component props still win.
   */
  messages?: RhineMessagesOverrides;
  /** Number locale for Stat, Pagination, Progress / Meter; defaults to the outer provider's, else `zh-CN`. */
  locale?: string;
  /** Written as `lang` on the `.rl-theme` root (popups mount inside it) when set; otherwise inherited. */
  lang?: string;
  children: React.ReactNode;
};

const NestingContext = React.createContext(false);

/**
 * Root of a WzRhineLab UI subtree: renders the `.rl-theme` scope, a portal target inside it,
 * the motion/react reduced-motion policy, shared tooltip timing and the toast queue. Nestable —
 * an inner provider can switch theme or density for a region.
 */
export const RhineProvider = React.forwardRef<HTMLDivElement, RhineProviderProps>(function RhineProvider(
  {
    theme = 'light',
    density = 'comfortable',
    motion = 'user',
    tooltipDelay = 500,
    toastTimeout = 5000,
    toastLimit = 3,
    toasts,
    messages,
    locale,
    lang,
    className,
    children,
    ...rest
  },
  ref,
) {
  const nested = React.useContext(NestingContext);
  const localeValue = useResolvedLocale(messages, locale);
  const withToasts = toasts ?? !nested;
  const [portalNode, setPortalNode] = React.useState<HTMLDivElement | null>(null);
  const value = React.useMemo(() => ({ container: portalNode }), [portalNode]);

  const scope = (
    <div
      {...rest}
      ref={ref}
      lang={lang}
      className={cx('rl-theme', className)}
      data-rl-theme={theme}
      data-rl-density={density}
      data-rl-motion={motion === 'reduce' ? 'reduce' : undefined}
    >
      {children}
      {withToasts && <ToastViewport />}
      <div ref={setPortalNode} className="rl-portal" data-slot="portal" />
    </div>
  );

  return (
    <NestingContext.Provider value>
      <RhineLocaleProvider value={localeValue}>
        <MotionConfig reducedMotion={motion === 'reduce' ? 'always' : 'user'}>
          <BaseTooltip.Provider delay={tooltipDelay}>
            <PortalContext.Provider value={value}>
              {withToasts ? (
                <ToastProvider timeout={toastTimeout} limit={toastLimit}>
                  {scope}
                </ToastProvider>
              ) : (
                scope
              )}
            </PortalContext.Provider>
          </BaseTooltip.Provider>
        </MotionConfig>
      </RhineLocaleProvider>
    </NestingContext.Provider>
  );
});
