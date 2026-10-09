/**
 * Stable theme contract (M6).
 *
 * The complete list of public `--rl-*` custom properties defined by `tokens.css`, grouped by
 * purpose, plus the data attributes that switch theme, density and motion. Tests assert that
 * `tokens.css` defines exactly this set, so the list cannot drift silently:
 *
 * - Removing or renaming a token, or an attribute value, is a breaking change (CHANGELOG + migration).
 * - Adding a token is a minor change and must be added here in the same commit.
 * - Changing a colour value is allowed in a patch release if every `contrastPairs` entry still passes.
 *
 * Variables named after a component (`--rl-button-*`, `--rl-toast-*` set inside component CSS)
 * are internal to `@wzrhine/react` and are not part of this contract.
 */

export const themeAttributes = {
  theme: { attribute: 'data-rl-theme', values: ['light', 'dark', 'system'] },
  density: { attribute: 'data-rl-density', values: ['comfortable', 'compact'] },
  motion: { attribute: 'data-rl-motion', values: ['reduce'] },
} as const;

export const publicTokens = {
  /** Redefined by every theme. */
  color: [
    '--rl-bg-canvas',
    '--rl-bg-surface',
    '--rl-bg-subtle',
    '--rl-bg-raised',
    '--rl-bg-hover',
    '--rl-bg-pressed',
    '--rl-bg-inverse',
    '--rl-bg-disabled',
    '--rl-bg-readonly',
    '--rl-fg-primary',
    '--rl-fg-muted',
    '--rl-fg-subtle',
    '--rl-fg-inverse',
    '--rl-fg-on-accent',
    '--rl-fg-on-danger',
    '--rl-fg-disabled',
    '--rl-border-subtle',
    '--rl-border-default',
    '--rl-border-strong',
    '--rl-accent',
    '--rl-accent-hover',
    '--rl-accent-subtle',
    '--rl-accent-text',
    '--rl-accent-amber',
    '--rl-info',
    '--rl-info-subtle',
    '--rl-success',
    '--rl-success-subtle',
    '--rl-warning',
    '--rl-warning-subtle',
    '--rl-danger',
    '--rl-danger-subtle',
    '--rl-focus',
    '--rl-inverse-hover',
  ],
  /** Redefined by every theme. */
  elevation: ['--rl-shadow-raised', '--rl-shadow-floating'],
  typography: [
    '--rl-font-body',
    '--rl-font-mono',
    '--rl-type-display',
    '--rl-type-heading-1',
    '--rl-type-heading-2',
    '--rl-type-heading-3',
    '--rl-type-body',
    '--rl-type-body-sm',
    '--rl-type-label',
    '--rl-type-label-sm',
    '--rl-type-meta',
    '--rl-type-mono',
    '--rl-tracking-display',
    '--rl-tracking-caps',
    '--rl-tracking-mono',
  ],
  space: [
    '--rl-space-0',
    '--rl-space-1',
    '--rl-space-2',
    '--rl-space-3',
    '--rl-space-4',
    '--rl-space-6',
    '--rl-space-8',
    '--rl-space-12',
    '--rl-space-16',
  ],
  shape: [
    '--rl-radius-none',
    '--rl-radius-xs',
    '--rl-radius-sm',
    '--rl-radius-md',
    '--rl-radius-lg',
    '--rl-radius-round',
    '--rl-border-width',
    '--rl-border-width-strong',
  ],
  focus: ['--rl-focus-width', '--rl-focus-offset', '--rl-focus-ring'],
  /** Redefined by `data-rl-density="compact"` (only the control and surface entries). */
  size: [
    '--rl-control-height-sm',
    '--rl-control-height-md',
    '--rl-control-height-lg',
    '--rl-control-padding-x-sm',
    '--rl-control-padding-x-md',
    '--rl-control-padding-x-lg',
    '--rl-control-gap',
    '--rl-surface-padding',
    '--rl-icon-size-sm',
    '--rl-icon-size-md',
    '--rl-icon-size-lg',
    '--rl-badge-height-sm',
    '--rl-badge-height-md',
    '--rl-indicator-size',
    '--rl-field-label-width',
    '--rl-dialog-width-sm',
    '--rl-dialog-width-md',
    '--rl-dialog-width-lg',
    '--rl-tooltip-max-width',
    '--rl-popup-max-height',
    '--rl-popup-offset',
    '--rl-popover-width-sm',
    '--rl-popover-width-md',
    '--rl-popover-width-lg',
    '--rl-menu-min-width',
    '--rl-toast-width',
    '--rl-orbit-size',
  ],
  layer: ['--rl-z-overlay', '--rl-z-dialog', '--rl-z-popover', '--rl-z-tooltip', '--rl-z-toast'],
  /** Durations collapse to 0ms under reduced motion (except `--rl-motion-loop`, whose users stop looping). */
  motion: [
    '--rl-motion-instant',
    '--rl-motion-press',
    '--rl-motion-fast',
    '--rl-motion-base',
    '--rl-motion-panel',
    '--rl-motion-scene',
    '--rl-motion-showcase',
    '--rl-motion-loop',
    '--rl-ease-out',
    '--rl-ease-in-out',
    '--rl-ease-linear',
  ],
} as const;

export type TokenCategory = keyof typeof publicTokens;
export type PublicToken = (typeof publicTokens)[TokenCategory][number];

/** Every public token, in contract order. */
export const allPublicTokens: readonly PublicToken[] = Object.values(publicTokens).flat();

/** Tokens each theme block (`dark`, `system`) must redefine. */
export const themedPublicTokens: readonly PublicToken[] = [...publicTokens.color, ...publicTokens.elevation];

/**
 * `var(--rl-…)` for a contract token. Typed, so a renamed or misspelled token fails to compile
 * in CSS-in-JS or inline styles instead of silently resolving to nothing.
 */
export function tokenVar(name: PublicToken, fallback?: string): string {
  return fallback === undefined ? `var(${name})` : `var(${name}, ${fallback})`;
}
