import * as React from 'react';
import type { DensitySetting, MotionSetting, ThemeSetting } from './settings';

export interface ScopeValue {
  theme: ThemeSetting;
  density: DensitySetting;
  motion: MotionSetting;
}

export const ScopeContext = React.createContext<ScopeValue>({
  theme: 'light',
  density: 'comfortable',
  motion: 'user',
});

type ThemeScopeProps = React.HTMLAttributes<HTMLDivElement> & Partial<ScopeValue>;

/**
 * Nested `.rl-theme` container. Inherits the surrounding settings and overrides only what is passed,
 * so demos can show compact density or reduced motion next to the defaults.
 */
export const ThemeScope = React.forwardRef<HTMLDivElement, ThemeScopeProps>(function ThemeScope(
  { theme, density, motion, className, children, ...rest },
  ref,
) {
  const parent = React.useContext(ScopeContext);
  const value: ScopeValue = {
    theme: theme ?? parent.theme,
    density: density ?? parent.density,
    motion: motion ?? parent.motion,
  };
  return (
    <ScopeContext.Provider value={value}>
      <div
        {...rest}
        ref={ref}
        className={['rl-theme', className].filter(Boolean).join(' ')}
        data-rl-theme={value.theme}
        data-rl-density={value.density}
        data-rl-motion={value.motion === 'reduce' ? 'reduce' : undefined}
      >
        {children}
      </div>
    </ScopeContext.Provider>
  );
});
