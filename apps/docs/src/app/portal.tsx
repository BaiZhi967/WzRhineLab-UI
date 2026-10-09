import * as React from 'react';

/**
 * Portal target inside the active `.rl-theme` root, so popups inherit --rl-* tokens,
 * theme, density and reduced-motion attributes instead of escaping to <body>.
 */
export const PortalContainerContext = React.createContext<React.RefObject<HTMLElement | null> | null>(null);

export function usePortalContainer() {
  return React.useContext(PortalContainerContext);
}
