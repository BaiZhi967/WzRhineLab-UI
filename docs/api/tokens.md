# @wzrhine/tokens · API reference

> 由 `scripts/api-report.mjs` 从 `dist/index.d.ts` 生成，请勿手改。版本 0.0.0，共 34 个导出（4 functions & hooks，19 constants，4 interfaces，7 types）。

## Functions & hooks

### `contrastRatio`

*function*

```ts
function contrastRatio: (a: string, b: string) => number
```

### `parseColor`

*function*

```ts
function parseColor: (input: string) => Rgb | null
```

### `relativeLuminance`

*function*

```ts
function relativeLuminance: ({ r, g, b }: Rgb) => number
```

### `tokenVar`

*function* — `var(--rl-…)` for a contract token. Typed, so a renamed or misspelled token fails to compile in CSS-in-JS or inline styles instead of silently resolving to nothing.

```ts
function tokenVar: (name: PublicToken, fallback?: string) => string
```

## Constants

### `allPublicTokens`

*const* — Every public token, in contract order.

```ts
const allPublicTokens: readonly ("--rl-bg-canvas" | "--rl-bg-surface" | "--rl-bg-subtle" | "--rl-bg-raised" | "--rl-bg-hover" | "--rl-bg-pressed" | "--rl-bg-inverse" | "--rl-bg-disabled" | "--rl-bg-readonly" | "--rl-fg-primary" | "--rl-fg-muted" | "--rl-fg-subtle" | "--rl-fg-inverse" | "--rl-fg-on-accent" | "--rl-fg-on-danger" | "--rl-fg-disabled" | "--rl-border-subtle" | "--rl-border-default" | "--rl-border-strong" | "--rl-accent" | "--rl-accent-hover" | "--rl-accent-subtle" | "--rl-accent-text" | "--rl-accent-amber" | "--rl-info" | "--rl-info-subtle" | "--rl-success" | "--rl-success-subtle" | "--rl-warning" | "--rl-warning-subtle" | "--rl-danger" | "--rl-danger-subtle" | "--rl-focus" | "--rl-inverse-hover" | "--rl-shadow-raised" | "--rl-shadow-floating" | "--rl-font-body" | "--rl-font-mono" | "--rl-type-display" | "--rl-type-heading-1" | "--rl-type-heading-2" | "--rl-type-heading-3" | "--rl-type-body" | "--rl-type-body-sm" | "--rl-type-label" | "--rl-type-label-sm" | "--rl-type-meta" | "--rl-type-mono" | "--rl-tracking-display" | "--rl-tracking-caps" | "--rl-tracking-mono" | "--rl-space-0" | "--rl-space-1" | "--rl-space-2" | "--rl-space-3" | "--rl-space-4" | "--rl-space-6" | "--rl-space-8" | "--rl-space-12" | "--rl-space-16" | "--rl-radius-none" | "--rl-radius-xs" | "--rl-radius-sm" | "--rl-radius-md" | "--rl-radius-lg" | "--rl-radius-round" | "--rl-border-width" | "--rl-border-width-strong" | "--rl-focus-width" | "--rl-focus-offset" | "--rl-focus-ring" | "--rl-control-height-sm" | "--rl-control-height-md" | "--rl-control-height-lg" | "--rl-control-padding-x-sm" | "--rl-control-padding-x-md" | "--rl-control-padding-x-lg" | "--rl-control-gap" | "--rl-surface-padding" | "--rl-icon-size-sm" | "--rl-icon-size-md" | "--rl-icon-size-lg" | "--rl-badge-height-sm" | "--rl-badge-height-md" | "--rl-indicator-size" | "--rl-field-label-width" | "--rl-dialog-width-sm" | "--rl-dialog-width-md" | "--rl-dialog-width-lg" | "--rl-tooltip-max-width" | "--rl-popup-max-height" | "--rl-popup-offset" | "--rl-popover-width-sm" | "--rl-popover-width-md" | "--rl-popover-width-lg" | "--rl-menu-min-width" | "--rl-toast-width" | "--rl-orbit-size" | "--rl-z-overlay" | "--rl-z-dialog" | "--rl-z-popover" | "--rl-z-tooltip" | "--rl-z-toast" | "--rl-motion-instant" | "--rl-motion-press" | "--rl-motion-fast" | "--rl-motion-base" | "--rl-motion-panel" | "--rl-motion-scene" | "--rl-motion-showcase" | "--rl-motion-loop" | "--rl-ease-out" | "--rl-ease-in-out" | "--rl-ease-linear")[]
```

### `borderWidths`

*const*

```ts
const borderWidths: readonly [{ readonly token: "--rl-border-width"; readonly usage: "\u9ED8\u8BA4\u8FB9\u6846"; }, { readonly token: "--rl-border-width-strong"; readonly usage: "\u5F3A\u8C03\u8F6E\u5ED3 / \u9009\u4E2D"; }, { readonly token: "--rl-focus-width"; readonly usage: "\u7126\u70B9\u73AF\u5BBD\u5EA6"; }, { readonly token: "--rl-focus-offset"; readonly usage: "\u7126\u70B9\u73AF\u504F\u79FB"; }]
```

### `colorGroups`

*const*

```ts
const colorGroups: readonly [{ readonly id: "background"; readonly label: "Background"; readonly description: "\u9875\u9762\u4E0E\u5BB9\u5668\u5C42\u7EA7\u3002\u7528\u660E\u5EA6\u5DEE\u8868\u8FBE\u5C42\u7EA7\uFF0C\u800C\u4E0D\u662F\u9634\u5F71\u3002"; readonly tokens: readonly [{ readonly name: "--rl-bg-canvas"; readonly role: "\u9875\u9762\u5E95\u8272"; }, { readonly name: "--rl-bg-surface"; readonly role: "\u5185\u5BB9\u8868\u9762"; }, { readonly name: "--rl-bg-subtle"; readonly role: "\u6B21\u7EA7\u533A\u57DF / \u4E2D\u6027\u5FBD\u6807"; }, { readonly name: "--rl-bg-raised"; readonly role: "\u6D6E\u8D77\u8868\u9762"; }, { readonly name: "--rl-bg-hover"; readonly role: "\u4E2D\u6027\u60AC\u505C"; }, { readonly name: "--rl-bg-pressed"; readonly role: "\u4E2D\u6027\u6309\u538B"; }, { readonly name: "--rl-bg-inverse"; readonly role: "\u6DF1\u58A8\u586B\u5145"; }, { readonly name: "--rl-inverse-hover"; readonly role: "\u6DF1\u58A8\u586B\u5145\u60AC\u505C"; }, { readonly name: "--rl-bg-disabled"; readonly role: "\u7981\u7528\u586B\u5145"; }, { readonly name: "--rl-bg-readonly"; readonly role: "\u53EA\u8BFB\u5B57\u6BB5"; }]; }, { readonly id: "foreground"; readonly label: "Foreground"; readonly description: "\u6587\u672C\u5C42\u7EA7\u3002\u6B63\u6587\u9ED8\u8BA4\u4F7F\u7528 primary\uFF0C\u4E0D\u4EE5\u5F69\u8272\u6587\u5B57\u4E3A\u9ED8\u8BA4\u3002"; readonly tokens: readonly [{ readonly name: "--rl-fg-primary"; readonly role: "\u4E3B\u6587\u672C"; }, { readonly name: "--rl-fg-muted"; readonly role: "\u6B21\u7EA7\u6587\u672C"; }, { readonly name: "--rl-fg-subtle"; readonly role: "\u5143\u4FE1\u606F / \u7F16\u53F7"; }, { readonly name: "--rl-fg-inverse"; readonly role: "\u6DF1\u58A8\u586B\u5145\u4E0A\u7684\u6587\u672C"; }, { readonly name: "--rl-fg-on-accent"; readonly role: "\u4FE1\u53F7\u6A59\u586B\u5145\u4E0A\u7684\u6587\u672C"; }, { readonly name: "--rl-fg-on-danger"; readonly role: "\u5371\u9669\u8272\u586B\u5145\u4E0A\u7684\u6587\u672C"; }, { readonly name: "--rl-fg-disabled"; readonly role: "\u7981\u7528\u6587\u672C"; }]; }, { readonly id: "border"; readonly label: "Border"; readonly description: "subtle \u4EC5\u4F5C\u88C5\u9970\u5206\u9694\uFF1B\u53EF\u4EA4\u4E92\u8FB9\u754C\u4F7F\u7528 strong\u3002"; readonly tokens: readonly [{ readonly name: "--rl-border-subtle"; readonly role: "\u88C5\u9970\u5206\u9694\u7EBF"; }, { readonly name: "--rl-border-default"; readonly role: "\u5BB9\u5668\u8F6E\u5ED3"; }, { readonly name: "--rl-border-strong"; readonly role: "\u63A7\u4EF6\u8FB9\u754C\uFF08\u22653:1\uFF09"; }]; }, { readonly id: "signal"; readonly label: "Research Signal"; readonly description: "\u5C0F\u9762\u79EF\u4F7F\u7528\u7684\u7814\u7A76\u6A59\u3002\u6BCF\u4E2A\u89C6\u56FE\u53EA\u4FDD\u7559\u4E00\u5904\u4E3B\u8981\u4FE1\u53F7\u3002"; readonly tokens: readonly [{ readonly name: "--rl-accent"; readonly role: "\u4FE1\u53F7\u586B\u5145"; }, { readonly name: "--rl-accent-hover"; readonly role: "\u4FE1\u53F7\u60AC\u505C"; }, { readonly name: "--rl-accent-subtle"; readonly role: "\u9009\u4E2D\u5E95\u8272"; }, { readonly name: "--rl-accent-text"; readonly role: "\u6D45\u5E95\u4E0A\u7684\u5F3A\u8C03\u6587\u5B57"; }, { readonly name: "--rl-accent-amber"; readonly role: "\u6863\u6848\u8F85\u52A9\u6807\u8BB0\uFF08\u88C5\u9970\uFF09"; }]; }, { readonly id: "status"; readonly label: "Status"; readonly description: "\u4E1A\u52A1\u72B6\u6001\u8272\u3002\u5FC5\u987B\u4E0E\u6587\u5B57\u540C\u65F6\u51FA\u73B0\uFF0C\u4E0D\u80FD\u53EA\u9760\u989C\u8272\u3002"; readonly tokens: readonly [{ readonly name: "--rl-info"; readonly role: "\u4FE1\u606F"; }, { readonly name: "--rl-info-subtle"; readonly role: "\u4FE1\u606F\u5E95\u8272"; }, { readonly name: "--rl-success"; readonly role: "\u5B8C\u6210"; }, { readonly name: "--rl-success-subtle"; readonly role: "\u5B8C\u6210\u5E95\u8272"; }, { readonly name: "--rl-warning"; readonly role: "\u6CE8\u610F"; }, { readonly name: "--rl-warning-subtle"; readonly role: "\u6CE8\u610F\u5E95\u8272"; }, { readonly name: "--rl-danger"; readonly role: "\u9519\u8BEF / \u9AD8\u98CE\u9669"; }, { readonly name: "--rl-danger-subtle"; readonly role: "\u9519\u8BEF\u5E95\u8272"; }]; }, { readonly id: "focus"; readonly label: "Focus"; readonly description: "\u7126\u70B9\u8272\u72EC\u7ACB\u4E8E\u54C1\u724C\u6A59\u4E0E\u5371\u9669\u8272\u3002"; readonly tokens: readonly [{ readonly name: "--rl-focus"; readonly role: "\u7126\u70B9\u73AF"; }]; }]
```

### `contrastPairs`

*const* — Pairings the components actually render. Each is verified in both themes.

```ts
const contrastPairs: readonly ContrastPair[]
```

### `densityTokens`

*const*

```ts
const densityTokens: readonly [{ readonly token: "--rl-control-height-sm"; readonly usage: "\u5C0F\u53F7\u63A7\u4EF6\u9AD8\u5EA6"; }, { readonly token: "--rl-control-height-md"; readonly usage: "\u9ED8\u8BA4\u63A7\u4EF6\u9AD8\u5EA6"; }, { readonly token: "--rl-control-height-lg"; readonly usage: "\u5927\u53F7\u63A7\u4EF6\u9AD8\u5EA6"; }, { readonly token: "--rl-control-padding-x-sm"; readonly usage: "\u5C0F\u53F7\u63A7\u4EF6\u6C34\u5E73\u5185\u8DDD"; }, { readonly token: "--rl-control-padding-x-md"; readonly usage: "\u9ED8\u8BA4\u63A7\u4EF6\u6C34\u5E73\u5185\u8DDD"; }, { readonly token: "--rl-control-padding-x-lg"; readonly usage: "\u5927\u53F7\u63A7\u4EF6\u6C34\u5E73\u5185\u8DDD"; }, { readonly token: "--rl-control-gap"; readonly usage: "\u63A7\u4EF6\u5185\u56FE\u6807\u4E0E\u6587\u5B57\u95F4\u8DDD"; }, { readonly token: "--rl-surface-padding"; readonly usage: "\u8868\u9762\u9ED8\u8BA4\u5185\u8DDD"; }, { readonly token: "--rl-badge-height-sm"; readonly usage: "\u5C0F\u53F7\u5FBD\u6807\u9AD8\u5EA6\uFF08\u975E\u70B9\u51FB\u76EE\u6807\uFF09"; }, { readonly token: "--rl-badge-height-md"; readonly usage: "\u9ED8\u8BA4\u5FBD\u6807\u9AD8\u5EA6\uFF08\u975E\u70B9\u51FB\u76EE\u6807\uFF09"; }, { readonly token: "--rl-indicator-size"; readonly usage: "\u72B6\u6001\u5706\u70B9"; }, { readonly token: "--rl-field-label-width"; readonly usage: "\u884C\u5185\u5B57\u6BB5\u6807\u7B7E\u5217\u5BBD"; }, { readonly token: "--rl-dialog-width-sm"; readonly usage: "\u5C0F\u53F7\u5BF9\u8BDD\u6846\u5BBD\u5EA6"; }, { readonly token: "--rl-dialog-width-md"; readonly usage: "\u9ED8\u8BA4\u5BF9\u8BDD\u6846\u5BBD\u5EA6"; }, { readonly token: "--rl-dialog-width-lg"; readonly usage: "\u5927\u53F7\u5BF9\u8BDD\u6846\u5BBD\u5EA6"; }, { readonly token: "--rl-tooltip-max-width"; readonly usage: "\u63D0\u793A\u6700\u5927\u5BBD\u5EA6"; }, { readonly token: "--rl-popup-max-height"; readonly usage: "\u4E0B\u62C9\u5217\u8868\u6700\u5927\u9AD8\u5EA6"; }, { readonly token: "--rl-popup-offset"; readonly usage: "\u6D6E\u5C42\u4E0E\u89E6\u53D1\u5668\u95F4\u8DDD"; }, { readonly token: "--rl-popover-width-sm"; readonly usage: "\u5C0F\u53F7\u5F39\u51FA\u9762\u677F\u5BBD\u5EA6"; }, { readonly token: "--rl-popover-width-md"; readonly usage: "\u9ED8\u8BA4\u5F39\u51FA\u9762\u677F\u5BBD\u5EA6"; }, { readonly token: "--rl-popover-width-lg"; readonly usage: "\u5927\u53F7\u5F39\u51FA\u9762\u677F\u5BBD\u5EA6"; }, { readonly token: "--rl-menu-min-width"; readonly usage: "\u83DC\u5355\u6700\u5C0F\u5BBD\u5EA6"; }, { readonly token: "--rl-toast-width"; readonly usage: "\u901A\u77E5\u5BBD\u5EA6"; }, { readonly token: "--rl-orbit-size"; readonly usage: "\u8F68\u9053\u793A\u610F\u56FE\u5C3A\u5BF8\uFF08\u5C55\u793A\u6548\u679C\uFF09"; }]
```

### `easingTokens`

*const*

```ts
const easingTokens: readonly [{ readonly token: "--rl-ease-out"; readonly name: "out"; readonly points: readonly [0.16, 1, 0.3, 1]; readonly usage: "\u9ED8\u8BA4\uFF1A\u8FDB\u5165\u3001\u53CD\u9988"; }, { readonly token: "--rl-ease-in-out"; readonly name: "inOut"; readonly points: readonly [0.65, 0, 0.35, 1]; readonly usage: "\u4F4D\u7F6E\u4EA4\u6362\u3001\u5F80\u8FD4"; }]
```

### `minimumContrast`

*const*

```ts
const minimumContrast: Record<ContrastLevel, number>
```

### `motionDurations`

*const* — Duration tokens in milliseconds. Source of truth for CSS (`--rl-motion-*`) and motion/react presets.

```ts
const motionDurations: { readonly instant: 0; readonly press: 80; readonly fast: 120; readonly base: 200; readonly panel: 280; readonly scene: 420; readonly showcase: 700; }
```

### `motionEasings`

*const* — Cubic-bezier control points. `linear` is reserved for real progress feedback.

```ts
const motionEasings: { readonly out: readonly [0.16, 1, 0.3, 1]; readonly inOut: readonly [0.65, 0, 0.35, 1]; }
```

### `motionLoopMs`

*const* — Period for indeterminate loops (spinner). Disabled entirely under reduced motion.

```ts
const motionLoopMs: 900
```

### `motionTokens`

*const*

```ts
const motionTokens: { token: "--rl-motion-instant" | "--rl-motion-press" | "--rl-motion-fast" | "--rl-motion-base" | "--rl-motion-panel" | "--rl-motion-scene" | "--rl-motion-showcase"; name: "instant" | "press" | "fast" | "base" | "panel" | "scene" | "showcase"; ms: 0 | 80 | 120 | 200 | 280 | 420 | 700; }[]
```

### `motionUsage`

*const*

```ts
const motionUsage: Record<"instant" | "press" | "fast" | "base" | "panel" | "scene" | "showcase", string>
```

### `publicTokens`

*const*

```ts
const publicTokens: { readonly color: readonly ["--rl-bg-canvas", "--rl-bg-surface", "--rl-bg-subtle", "--rl-bg-raised", "--rl-bg-hover", "--rl-bg-pressed", "--rl-bg-inverse", "--rl-bg-disabled", "--rl-bg-readonly", "--rl-fg-primary", "--rl-fg-muted", "--rl-fg-subtle", "--rl-fg-inverse", "--rl-fg-on-accent", "--rl-fg-on-danger", "--rl-fg-disabled", "--rl-border-subtle", "--rl-border-default", "--rl-border-strong", "--rl-accent", "--rl-accent-hover", "--rl-accent-subtle", "--rl-accent-text", "--rl-accent-amber", "--rl-info", "--rl-info-subtle", "--rl-success", "--rl-success-subtle", "--rl-warning", "--rl-warning-subtle", "--rl-danger", "--rl-danger-subtle", "--rl-focus", "--rl-inverse-hover"]; readonly elevation: readonly ["--rl-shadow-raised", "--rl-shadow-floating"]; readonly typography: readonly ["--rl-font-body", "--rl-font-mono", "--rl-type-display", "--rl-type-heading-1", "--rl-type-heading-2", "--rl-type-heading-3", "--rl-type-body", "--rl-type-body-sm", "--rl-type-label", "--rl-type-label-sm", "--rl-type-meta", "--rl-type-mono", "--rl-tracking-display", "--rl-tracking-caps", "--rl-tracking-mono"]; readonly space: readonly ["--rl-space-0", "--rl-space-1", "--rl-space-2", "--rl-space-3", "--rl-space-4", "--rl-space-6", "--rl-space-8", "--rl-space-12", "--rl-space-16"]; readonly shape: readonly ["--rl-radius-none", "--rl-radius-xs", "--rl-radius-sm", "--rl-radius-md", "--rl-radius-lg", "--rl-radius-round", "--rl-border-width", "--rl-border-width-strong"]; readonly focus: readonly ["--rl-focus-width", "--rl-focus-offset", "--rl-focus-ring"]; readonly size: readonly ["--rl-control-height-sm", "--rl-control-height-md", "--rl-control-height-lg", "--rl-control-padding-x-sm", "--rl-control-padding-x-md", "--rl-control-padding-x-lg", "--rl-control-gap", "--rl-surface-padding", "--rl-icon-size-sm", "--rl-icon-size-md", "--rl-icon-size-lg", "--rl-badge-height-sm", "--rl-badge-height-md", "--rl-indicator-size", "--rl-field-label-width", "--rl-dialog-width-sm", "--rl-dialog-width-md", "--rl-dialog-width-lg", "--rl-tooltip-max-width", "--rl-popup-max-height", "--rl-popup-offset", "--rl-popover-width-sm", "--rl-popover-width-md", "--rl-popover-width-lg", "--rl-menu-min-width", "--rl-toast-width", "--rl-orbit-size"]; readonly layer: readonly ["--rl-z-overlay", "--rl-z-dialog", "--rl-z-popover", "--rl-z-tooltip", "--rl-z-toast"]; readonly motion: readonly ["--rl-motion-instant", "--rl-motion-press", "--rl-motion-fast", "--rl-motion-base", "--rl-motion-panel", "--rl-motion-scene", "--rl-motion-showcase", "--rl-motion-loop", "--rl-ease-out", "--rl-ease-in-out", "--rl-ease-linear"]; }
```

### `radiusScale`

*const*

```ts
const radiusScale: readonly [{ readonly token: "--rl-radius-none"; readonly usage: "\u8868\u683C\u3001\u5206\u9694\u533A\u5757"; }, { readonly token: "--rl-radius-xs"; readonly usage: "\u5FBD\u6807\u3001\u6807\u7B7E"; }, { readonly token: "--rl-radius-sm"; readonly usage: "\u6309\u94AE\u3001\u9ED8\u8BA4\u8868\u9762"; }, { readonly token: "--rl-radius-md"; readonly usage: "\u8868\u5355\u63A7\u4EF6"; }, { readonly token: "--rl-radius-lg"; readonly usage: "\u6D6E\u5C42\uFF08M2\uFF09"; }]
```

### `spaceScale`

*const*

```ts
const spaceScale: readonly [{ readonly token: "--rl-space-0"; readonly px: 0; }, { readonly token: "--rl-space-1"; readonly px: 4; }, { readonly token: "--rl-space-2"; readonly px: 8; }, { readonly token: "--rl-space-3"; readonly px: 12; }, { readonly token: "--rl-space-4"; readonly px: 16; }, { readonly token: "--rl-space-6"; readonly px: 24; }, { readonly token: "--rl-space-8"; readonly px: 32; }, { readonly token: "--rl-space-12"; readonly px: 48; }, { readonly token: "--rl-space-16"; readonly px: 64; }]
```

### `themeAttributes`

*const* — Stable theme contract (M6).

```ts
const themeAttributes: { readonly theme: { readonly attribute: "data-rl-theme"; readonly values: readonly ["light", "dark", "system"]; }; readonly density: { readonly attribute: "data-rl-density"; readonly values: readonly ["comfortable", "compact"]; }; readonly motion: { readonly attribute: "data-rl-motion"; readonly values: readonly ["reduce"]; }; }
```

### `themedPublicTokens`

*const* — Tokens each theme block (`dark`, `system`) must redefine.

```ts
const themedPublicTokens: readonly ("--rl-bg-canvas" | "--rl-bg-surface" | "--rl-bg-subtle" | "--rl-bg-raised" | "--rl-bg-hover" | "--rl-bg-pressed" | "--rl-bg-inverse" | "--rl-bg-disabled" | "--rl-bg-readonly" | "--rl-fg-primary" | "--rl-fg-muted" | "--rl-fg-subtle" | "--rl-fg-inverse" | "--rl-fg-on-accent" | "--rl-fg-on-danger" | "--rl-fg-disabled" | "--rl-border-subtle" | "--rl-border-default" | "--rl-border-strong" | "--rl-accent" | "--rl-accent-hover" | "--rl-accent-subtle" | "--rl-accent-text" | "--rl-accent-amber" | "--rl-info" | "--rl-info-subtle" | "--rl-success" | "--rl-success-subtle" | "--rl-warning" | "--rl-warning-subtle" | "--rl-danger" | "--rl-danger-subtle" | "--rl-focus" | "--rl-inverse-hover" | "--rl-shadow-raised" | "--rl-shadow-floating")[]
```

### `themedTokens`

*const* — Tokens whose value must be redefined by the dark theme.

```ts
const themedTokens: readonly string[]
```

### `typeRoles`

*const*

```ts
const typeRoles: readonly [{ readonly name: "display"; readonly token: "--rl-type-display"; readonly spec: "36 / 44 \u00B7 600"; readonly usage: "\u5C55\u793A\u6807\u9898"; }, { readonly name: "heading-1"; readonly token: "--rl-type-heading-1"; readonly spec: "28 / 36 \u00B7 600"; readonly usage: "\u9875\u9762\u6807\u9898"; }, { readonly name: "heading-2"; readonly token: "--rl-type-heading-2"; readonly spec: "22 / 30 \u00B7 600"; readonly usage: "\u4E00\u7EA7\u5185\u5BB9\u6807\u9898"; }, { readonly name: "heading-3"; readonly token: "--rl-type-heading-3"; readonly spec: "18 / 26 \u00B7 600"; readonly usage: "\u9762\u677F\u6807\u9898"; }, { readonly name: "body"; readonly token: "--rl-type-body"; readonly spec: "16 / 24 \u00B7 400"; readonly usage: "\u6B63\u6587\u3001\u8868\u5355"; }, { readonly name: "body-sm"; readonly token: "--rl-type-body-sm"; readonly spec: "14 / 21 \u00B7 400"; readonly usage: "\u7D27\u51D1\u4FE1\u606F"; }, { readonly name: "label"; readonly token: "--rl-type-label"; readonly spec: "14 / 20 \u00B7 600"; readonly usage: "\u63A7\u4EF6\u6587\u5B57"; }, { readonly name: "meta"; readonly token: "--rl-type-meta"; readonly spec: "12 / 18 \u00B7 500"; readonly usage: "\u8F85\u52A9\u6807\u7B7E\uFF0C\u4E0D\u7528\u4E8E\u957F\u6B63\u6587"; }, { readonly name: "mono"; readonly token: "--rl-type-mono"; readonly spec: "12 / 18 \u00B7 500"; readonly usage: "\u7F16\u53F7\u3001\u65F6\u95F4\u3001\u5355\u4F4D"; }]
```

## Interfaces

### `ContrastPair`

*interface*

| Member | Type | Description |
| --- | --- | --- |
| `bg` * | ``--rl-${string}`` |  |
| `fg` * | ``--rl-${string}`` |  |
| `level` * | `ContrastLevel` |  |
| `usage` * | `string` |  |

### `Rgb`

*interface* — WCAG 2.x relative luminance and contrast ratio for opaque sRGB colours.

| Member | Type | Description |
| --- | --- | --- |
| `b` * | `number` |  |
| `g` * | `number` |  |
| `r` * | `number` |  |

### `TokenEntry`

*interface*

| Member | Type | Description |
| --- | --- | --- |
| `name` * | ``--rl-${string}`` |  |
| `role` * | `string` |  |

### `TokenGroup`

*interface*

| Member | Type | Description |
| --- | --- | --- |
| `description` * | `string` |  |
| `id` * | `string` |  |
| `label` * | `string` |  |
| `tokens` * | `readonly TokenEntry[]` |  |

## Types

### `ContrastLevel`

*type*

```ts
type ContrastLevel = 'text' | 'large-text' | 'non-text'
```

### `DensityName`

*type*

```ts
type DensityName = 'comfortable' | 'compact'
```

### `MotionDurationName`

*type*

```ts
type MotionDurationName = keyof typeof motionDurations
```

### `PublicToken`

*type*

```ts
type PublicToken = (typeof publicTokens)[TokenCategory][number]
```

### `ThemedToken`

*type*

```ts
type ThemedToken = (typeof publicTokens)['color' | 'elevation'][number]
```

### `ThemeName`

*type* — Machine-readable index of the CSS custom properties defined in `tokens.css`. Tests assert that every token listed here exists in each theme, and the showcase renders foundations from this list instead of copying values.

```ts
type ThemeName = 'light' | 'dark'
```

### `TokenCategory`

*type*

```ts
type TokenCategory = keyof typeof publicTokens
```

