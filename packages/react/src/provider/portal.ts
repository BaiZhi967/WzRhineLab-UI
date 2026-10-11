'use client';

import * as React from 'react';

export interface PortalContextValue {
  /** The portal node, or null until the provider has mounted it. */
  container: HTMLElement | null;
}

export const PortalContext = React.createContext<PortalContextValue | null>(null);

/**
 * Portal target for popups (Dialog, Select, Tooltip, Popover, Menu, Toast). Inside a RhineProvider it
 * is a node within the themed root, so popups inherit --rl-* tokens, theme, density and reduced
 * motion. The value is the element itself (not a ref) so portals re-render once it exists;
 * a null container would otherwise make Base UI fall back to <body> and lose the theme.
 * Returns `undefined` outside a provider.
 */
export function usePortalContainer(): HTMLElement | null | undefined {
  const ctx = React.useContext(PortalContext);
  return ctx ? ctx.container : undefined;
}

/** True while inside a provider whose portal node is not mounted yet; popups should wait. */
export function usePortalPending(): boolean {
  const ctx = React.useContext(PortalContext);
  return ctx !== null && ctx.container === null;
}
