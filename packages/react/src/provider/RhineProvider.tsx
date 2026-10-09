import * as React from 'react';
import { MotionConfig } from 'motion/react';
import { Toast as BaseToast } from '@base-ui/react/toast';
import { Tooltip as BaseTooltip } from '@base-ui/react/tooltip';
import { ToastViewport } from '../components/Toast.js';
import { cx } from '../utils/cx.js';
import { PortalContext } from './portal.js';

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
    className,
    children,
    ...rest
  },
  ref,
) {
  const nested = React.useContext(NestingContext);
  const withToasts = toasts ?? !nested;
  const [portalNode, setPortalNode] = React.useState<HTMLDivElement | null>(null);
  const value = React.useMemo(() => ({ container: portalNode }), [portalNode]);

  const scope = (
    <div
      {...rest}
      ref={ref}
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
      <MotionConfig reducedMotion={motion === 'reduce' ? 'always' : 'user'}>
        <BaseTooltip.Provider delay={tooltipDelay}>
          <PortalContext.Provider value={value}>
            {withToasts ? (
              <BaseToast.Provider timeout={toastTimeout} limit={toastLimit}>
                {scope}
              </BaseToast.Provider>
            ) : (
              scope
            )}
          </PortalContext.Provider>
        </BaseTooltip.Provider>
      </MotionConfig>
    </NestingContext.Provider>
  );
});
