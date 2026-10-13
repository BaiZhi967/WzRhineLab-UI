# @wzrhine/effects · API reference

> 由 `scripts/api-report.mjs` 从 `dist/index.d.ts` 生成，请勿手改。版本 0.2.0，共 24 个导出（5 components，9 functions & hooks，5 interfaces，5 types）。

## Components

### `ArchiveReveal`

*component*

| Prop | Type | Description |
| --- | --- | --- |
| `concealedLabel` | `string` | Accessible text while concealed, e.g. "受限内容". Defaults to the text itself. |
| `duration` | `number` | Full reveal duration at speed 1 (ms). |
| `onSettled` | `((revealed: boolean) => void)` | Called once the effect settles at the requested state. |
| `paused` | `boolean` |  |
| `revealed` * | `boolean` | Target state. Changing it animates from the current position. |
| `text` * | `string` |  |

`*` 必填。原生 DOM 属性（如 `onClick`、`aria-*`）未列出。

### `EffectClock`

*component*

| Prop | Type | Description |
| --- | --- | --- |
| `children` * | `React.ReactNode` |  |
| `reduced` | `boolean` |  |
| `speed` | `number` |  |

`*` 必填。原生 DOM 属性（如 `onClick`、`aria-*`）未列出。

### `MotionPlayer`

*component*

| Prop | Type | Description |
| --- | --- | --- |
| `className` | `string` |  |
| `defaultActive` | `boolean` | Initial active state. |
| `demo` * | `(props: MotionDemoProps) => React.ReactNode` | Renders one lane. Must be deterministic for a given (play, active). |
| `interruptAfterMs` | `number` | How long after each play (ms) the Interrupt lane reverses; keep it shorter than the demo's duration. |
| `lanes` | `readonly MotionLane[]` | Lanes to show; defaults to all four. |
| `spec` | `React.ReactNode` | One-line timing spec shown under the title, e.g. "scene 420ms · ease-in-out". |
| `title` * | `React.ReactNode` | Visible title of the comparison; also names the region. |

`*` 必填。原生 DOM 属性（如 `onClick`、`aria-*`）未列出。

### `OrbitalDiagram`

*component*

| Prop | Type | Description |
| --- | --- | --- |
| `animate` | `boolean` | Slow ambient rotation. Off by default; disabled by reduced motion. |
| `center` | `string` | Centre caption, e.g. a record ID. |
| `className` | `string` |  |
| `label` * | `string` | Accessible name of the node list. |
| `nodes` * | `readonly OrbitNode[]` |  |
| `period` | `number` | Seconds per revolution of the outer ring at speed 1. |
| `rings` | `number` |  |
| `selectedLabel` | `string` | Localised suffix announced for a selected node. |
| `size` | `number` |  |

`*` 必填。原生 DOM 属性（如 `onClick`、`aria-*`）未列出。

### `ScanSurface`

*component*

| Prop | Type | Description |
| --- | --- | --- |
| `children` * | `React.ReactNode` |  |
| `className` | `string` |  |
| `containerType` | `boolean` |  |
| `duration` | `number \| "fast" \| "base" \| "panel" \| "showcase"` | Sweep duration at speed 1 (ms). |
| `onScanEnd` | `(() => void)` |  |
| `overflow` | `"hidden" \| "visible"` |  |
| `scanKey` | `string \| number` | Change this value to run one sweep (a counter or timestamp). |
| `tone` | `"accent" \| "info" \| "warning" \| "success" \| "neutral"` |  |

`*` 必填。原生 DOM 属性（如 `onClick`、`aria-*`）未列出。

## Functions & hooks

### `isWide`

*function* — CJK and other full-width characters get full-width glyphs so the line does not reflow.

```ts
function isWide: (ch: string) => boolean
```

### `isWideGlyph`

*function* — True for glyphs drawn from the full-width scramble set.

```ts
function isWideGlyph: (ch: string) => boolean
```

### `maskText`

*function* — Static mask shown while content is concealed.

```ts
function maskText: (text: string) => string
```

### `scrambleCells`

*function* — Characters resolve left to right as progress goes 0 → 1; unresolved positions cycle through glyphs as `frame` advances. progress ≥ 1 returns the text; progress ≤ 0 returns the mask.

```ts
function scrambleCells: (text: string, progress: number, frame: number) => ScrambleCell[]
```

### `scrambleText`

*function*

```ts
function scrambleText: (text: string, progress: number, frame: number) => string
```

### `stepToward`

*function* — Move `current` toward `target` by `step` without overshooting.

```ts
function stepToward: (current: number, target: number, step: number) => number
```

### `useEffectTiming`

*function*

```ts
function useEffectTiming: () => EffectTiming
```

### `useInViewport`

*function* — True while the element intersects the viewport. Treated as visible where IntersectionObserver is unavailable.

```ts
function useInViewport: <T extends Element>(ref: React.RefObject<T | null>) => boolean
```

### `usePageVisible`

*function* — True while the document is visible. Loops must pause when it turns false (MOTION.md lifecycle rule 4).

```ts
function usePageVisible: () => boolean
```

## Interfaces

### `EffectClockProps`

*interface*

| Member | Type | Description |
| --- | --- | --- |
| `children` * | `React.ReactNode` |  |
| `reduced` | `boolean` |  |
| `speed` | `number` |  |

### `EffectTiming`

*interface*

| Member | Type | Description |
| --- | --- | --- |
| `reduced` * | `boolean` |  |
| `scale` * | `(ms: number) => number` | Scale a base duration (ms) by the current speed. |
| `speed` * | `number` |  |

### `MotionDemoProps`

*interface*

| Member | Type | Description |
| --- | --- | --- |
| `active` * | `boolean` | Target state toggled by each play (e.g. revealed / concealed). |
| `lane` * | `MotionLane` |  |
| `play` * | `number` | Monotonic play counter; each increment is one "play". |

### `OrbitNode`

*interface* — Instrument-style orbital diagram (DESIGN.md "Instrument Accent"): concentric rings with labelled nodes. Decorative structure around real labels, not a data visualisation: - Labels are real text in an accessible list; the SVG is aria-hidden. - Rotation is opt-in (`animate`), stops when off-screen, on hidden tabs and under reduced motion (shared lifecycle, ADR-0007); `data-lifecycle` / `data-paused` expose the current state. - Positions are fixed by `angle` props; nothing is random.

| Member | Type | Description |
| --- | --- | --- |
| `active` | `boolean` | Highlight one node (e.g. the current subject). |
| `angle` * | `number` | Position on the ring in degrees, 0 = top, clockwise. |
| `id` * | `string` |  |
| `label` * | `string` |  |
| `ring` * | `number` | Ring index, 0 = innermost. |
| `selected` | `boolean` |  |
| `tone` | `"accent" \| "info" \| "warning" \| "success" \| "neutral"` |  |

### `ScrambleCell`

*interface*

| Member | Type | Description |
| --- | --- | --- |
| `char` * | `string` |  |
| `resolved` * | `boolean` |  |

## Types

### `ArchiveRevealProps`

*type* — Decrypt-style reveal for short labels (IDs, titles). Showcase effect only (MOTION.md): - The real text is always in the accessibility tree; the scramble is aria-hidden decoration. - Toggling `revealed` mid-flight reverses from the current progress, never restarting. - Reduced motion (OS, provider, or EffectClock) swaps instantly with no glyph cycling. - The loop pauses while the page is hidden (shared `usePageVisible`, ADR-0007), resumes from the current progress, and stops once settled or unmounted. It is short and one-shot, so it does not track the viewport. Never use it to delay business data: pass content that is already loaded.

### `MotionLane`

*type* — Side-by-side motion comparison (MOTION.md "Showcase 每类动画提供 Default / Slow x0.25 / Reduced / Interrupt 四组状态"). Renders the same demo in four lanes: - Default: speed 1, inherits the surrounding motion preference (never re-enables motion). - Slow ×0.25: four times slower, for reviewing easing and choreography. - Reduced: forced reduced motion (MotionConfig "always" + data-rl-motion), the equivalent fallback. - Interrupt: speed 1; the player re-triggers the demo while it is still running, proving the effect retargets from its current state instead of queueing or restarting. One shared play control drives every lane, so the lanes stay in step. Lanes also set `MotionSpeed`, so

```ts
type MotionLane = 'default' | 'slow' | 'reduced' | 'interrupt'
```

### `MotionPlayerProps`

*type*

### `OrbitalDiagramProps`

*type*

### `ScanSurfaceProps`

*type* — Single-pass scan line over a surface, triggered by the user (e.g. "re-scan"). Showcase effect: - One sweep per `scanKey` change, never an idle infinite loop (STYLE.md forbids default infinite scans). - Children render immediately and stay interactive; the sweep is a pointer-events:none overlay. - Reduced motion: no moving line; a brief static outline marks the "scanned" moment instead. - Stop conditions (ADR-0007): skipped while the page is hidden, cut short if the page hides mid-sweep, cleared on unmount. One-shot, so it does not track the viewport.

