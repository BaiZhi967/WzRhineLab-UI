import * as React from 'react';
import { RhineProvider } from '@wzrhine/react';
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

type ThemeScopeProps = Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> &
  Partial<ScopeValue> & { children: React.ReactNode };

/**
 * Showcase wrapper around RhineProvider that inherits unspecified settings from the nearest
 * outer scope, so a preview can override only theme or density. Each scope gets its own portal,
 * so popups opened inside a dark preview render dark.
 */
export const ThemeScope = React.forwardRef<HTMLDivElement, ThemeScopeProps>(function ThemeScope(
  { theme, density, motion, children, ...rest },
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
      <RhineProvider {...rest} ref={ref} theme={value.theme} density={value.density} motion={value.motion}>
        {children}
      </RhineProvider>
    </ScopeContext.Provider>
  );
});
