import * as React from 'react';
import { MotionConfig } from 'motion/react';
import { Tooltip as BaseTooltip } from '@base-ui/react/tooltip';
import { cx } from '../utils/cx';

export type RhineTheme = 'light' | 'dark' | 'system';
export type RhineDensity = 'comfortable' | 'compact';
/** `user` follows the OS setting; `reduce` forces reduced motion for this subtree. */
export type RhineMotionPreference = 'user' | 'reduce';

interface PortalContextValue {
  container: React.RefObject<HTMLElement | null>;
}

const PortalContext = React.createContext<PortalContextValue | null>(null);

/**
 * Portal target for popups (Dialog, Select, Tooltip). Inside a RhineProvider it is a node within the
 * themed root, so popups inherit --rl-* tokens, theme, density and reduced-motion. Outside a provider
 * Base UI falls back to <body>, and popups render unstyled by theme — wrap the app in RhineProvider.
 */
export function usePortalContainer(): React.RefObject<HTMLElement | null> | undefined {
  return React.useContext(PortalContext)?.container;
}

export type RhineProviderProps = Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> & {
  theme?: RhineTheme;
  density?: RhineDensity;
  motion?: RhineMotionPreference;
  /** Hover delay before a tooltip opens (ms). Moving between adjacent triggers is instant. */
  tooltipDelay?: number;
  children: React.ReactNode;
};

/**
 * Root of a WzRhineLab UI subtree: renders the `.rl-theme` scope, a portal target inside it,
 * the motion/react reduced-motion policy and shared tooltip timing. Nestable — an inner provider
 * can switch theme or density for a region.
 */
export const RhineProvider = React.forwardRef<HTMLDivElement, RhineProviderProps>(function RhineProvider(
  { theme = 'light', density = 'comfortable', motion = 'user', tooltipDelay = 500, className, children, ...rest },
  ref,
) {
  const portalRef = React.useRef<HTMLDivElement>(null);
  const value = React.useMemo(() => ({ container: portalRef }), []);
  return (
    <MotionConfig reducedMotion={motion === 'reduce' ? 'always' : 'user'}>
      <BaseTooltip.Provider delay={tooltipDelay}>
        <PortalContext.Provider value={value}>
          <div
            {...rest}
            ref={ref}
            className={cx('rl-theme', className)}
            data-rl-theme={theme}
            data-rl-density={density}
            data-rl-motion={motion === 'reduce' ? 'reduce' : undefined}
          >
            {children}
            <div ref={portalRef} className="rl-portal" data-slot="portal" />
          </div>
        </PortalContext.Provider>
      </BaseTooltip.Provider>
    </MotionConfig>
  );
});
