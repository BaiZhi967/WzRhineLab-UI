# @wzrhine/patterns · API reference

> 由 `scripts/api-report.mjs` 从 `dist/index.d.ts` 生成，请勿手改。版本 0.3.0，共 32 个导出（9 components，2 functions & hooks，2 constants，15 interfaces，4 types）。

## Components

### `AppliedFilters`

*component*

| Prop | Type | Description |
| --- | --- | --- |
| `className` | `string` |  |
| `clearAllLabel` | `string` |  |
| `filters` * | `readonly AppliedFilterItem[]` |  |
| `label` | `string` | Accessible name of the region. |
| `onClearAll` | `(() => void)` | Provided (with items present) renders the clear-all entry. |
| `onRemove` | `((id: string) => void)` |  |
| `removeLabel` | `((filter: AppliedFilterItem) => string)` |  |

`*` 必填。原生 DOM 属性（如 `onClick`、`aria-*`）未列出。

### `InspectorPanel`

*component*

| Prop | Type | Description |
| --- | --- | --- |
| `actions` | `React.ReactNode` | Action bar; buttons are composed by the caller from `@wzrhine/react`. |
| `children` | `React.ReactNode` |  |
| `className` | `string` |  |
| `closeLabel` | `string` |  |
| `eyebrow` | `React.ReactNode` | Small archive-style label above the title, e.g. "INSPECTOR". |
| `label` | `string` | Accessible name of the region; defaults to a string `title`. |
| `meta` | `readonly MetadataItem[]` | Metadata rows, rendered with MetadataList (stacked, compact). |
| `onClose` | `(() => void)` | Rendered when provided; reports the intent only. |
| `open` | `boolean` | Controlled visibility; false hides the region entirely. Defaults to true. |
| `title` * | `React.ReactNode` |  |

`*` 必填。原生 DOM 属性（如 `onClick`、`aria-*`）未列出。

### `ListDetail`

*component*

| Prop | Type | Description |
| --- | --- | --- |
| `backLabel` | `string` | Text of the back (overlay) / close (split) entry in the detail bar. |
| `className` | `string` |  |
| `defaultDetailId` | `string \| null` |  |
| `detailId` | `string \| null` | Controlled open record id; `null` = closed. |
| `detailLabel` | `string` |  |
| `detail` * | `React.ReactNode` | Detail region content; rendered only while `detailId` is non-null. |
| `listLabel` | `string` | Accessible names of the list and detail regions. |
| `list` * | `React.ReactNode` | Collection region content: a DataTable, ResourceGrid or any custom list. |
| `modeThreshold` | `number` | Container width threshold (px) for `auto`; at or above it the layout is `split`. |
| `mode` | `"auto" \| ListDetailMode` | `'auto'` (default) resolves from the container width; explicit values never measure. |
| `onDetailChange` | `((id: string \| null) => void)` |  |
| `onModeResolve` | `((mode: ListDetailMode) => void)` |  |

`*` 必填。原生 DOM 属性（如 `onClick`、`aria-*`）未列出。

### `PatternsMessagesProvider`

*component* — Copy for a subtree, without needing a full `RhineProvider`. Nested providers merge with the outer one per namespace; sibling providers stay isolated.

| Prop | Type | Description |
| --- | --- | --- |
| `children` * | `React.ReactNode` |  |
| `messages` | `PatternsMessagesOverrides` | Partial table merged over the outer provider's (or `patternsZhCN`). |

`*` 必填。原生 DOM 属性（如 `onClick`、`aria-*`）未列出。

### `QueryToolbar`

*component*

| Prop | Type | Description |
| --- | --- | --- |
| `busy` | `boolean` | A commit is in flight: submit/reset disabled, the typed value stays. |
| `children` | `React.ReactNode` | Filter control slots (Combobox, Select, custom). |
| `className` | `string` |  |
| `defaultQuery` | `string` |  |
| `onPendingQueryChange` | `((value: string) => void)` |  |
| `onQueryChange` | `((query: string) => void)` |  |
| `onReset` | `(() => void)` | Reset clears query and filters and resets paging — executed by the caller. |
| `pendingQuery` | `string` | Value being typed; kept internally when not provided. Synced when the caller changes `query`. |
| `query` | `string` | Committed query (controlled); the caller decides when to accept a submission. |
| `resetDisabled` | `boolean` |  |
| `resetLabel` | `string` |  |
| `resultSummary` | `React.ReactNode` | Result summary, announced politely (role="status"), e.g. "共 128 条结果". |
| `searchLabel` | `string` |  |
| `searchPlaceholder` | `string` |  |
| `submitLabel` | `string` |  |
| `toolbarLabel` | `string` | Accessible name of the search region; defaults to the built-in copy. |

`*` 必填。原生 DOM 属性（如 `onClick`、`aria-*`）未列出。

### `ResourceGrid`

*component*

泛型组件：`ResourceGrid<Item>`。

| Prop | Type | Description |
| --- | --- | --- |
| `className` | `string` |  |
| `emptyAction` | `React.ReactNode` |  |
| `emptyText` | `React.ReactNode` |  |
| `getItemId` * | `(item: Item) => string` |  |
| `getItemLabel` | `((item: Item) => string)` | Accessible name of a card's checkbox; defaults to the title text when it is a string. |
| `getItemSpec` | `((item: Item) => ResourceGridItemSpec)` |  |
| `getItemTitle` * | `(item: Item) => React.ReactNode` |  |
| `items` * | `readonly Item[]` |  |
| `label` | `string` | Accessible name of the list. |
| `loadingRows` | `number` |  |
| `onOpen` | `((id: string) => void)` | Open entry; selection and opening are distinct interactions. |
| `onRetry` | `(() => void)` |  |
| `onSelectionChange` | `((ids: Set<string>) => void)` |  |
| `selectedIds` | `ReadonlySet<string>` |  |
| `status` | `"ready" \| "loading" \| "error"` |  |

`*` 必填。原生 DOM 属性（如 `onClick`、`aria-*`）未列出。

### `SectionIndex`

*component*

| Prop | Type | Description |
| --- | --- | --- |
| `activeId` | `string` | Current section; kept internally (observed) when not provided. |
| `className` | `string` |  |
| `label` | `string` | Accessible name of the nav. |
| `offsetTop` | `number` | Fixed header offset (px) applied after scrolling a section into view. |
| `onActiveChange` | `((id: string) => void)` |  |
| `onNavigate` | `((id: string) => void)` | Active navigation by the user (distinct from passive observation). |
| `scrollRoot` | `React.RefObject<HTMLElement \| null>` | Explicit scroll root; defaults to the nearest scrolling ancestor. |
| `sections` * | `readonly SectionIndexSection[]` |  |
| `smoothScroll` | `boolean` | Opt-in smooth scrolling; always off under reduced motion. |

`*` 必填。原生 DOM 属性（如 `onClick`、`aria-*`）未列出。

### `SelectionToolbar`

*component*

| Prop | Type | Description |
| --- | --- | --- |
| `actions` | `readonly SelectionToolbarAction[]` |  |
| `className` | `string` |  |
| `clearLabel` | `string` |  |
| `label` | `string` | Accessible name of the toolbar. |
| `onClear` | `(() => void)` |  |
| `scope` | `SelectionScope` | Which range the count refers to; combined with `totalLabel` for an explainable scope. |
| `selectedCount` * | `number` |  |
| `totalLabel` | `React.ReactNode` | Range note, e.g. "当前页 25 条 / 已加载 100 条". |

`*` 必填。原生 DOM 属性（如 `onClick`、`aria-*`）未列出。

### `ViewSwitcher`

*component*

泛型组件：`ViewSwitcher<V>`。

| Prop | Type | Description |
| --- | --- | --- |
| `className` | `string` |  |
| `defaultValue` | `V` |  |
| `disabled` | `boolean` |  |
| `label` * | `string` | Accessible name of the radiogroup, e.g. "视图". |
| `onValueChange` | `((value: V) => void)` |  |
| `options` * | `readonly ViewSwitcherOption<V>[]` |  |
| `value` | `V` |  |

`*` 必填。原生 DOM 属性（如 `onClick`、`aria-*`）未列出。

## Functions & hooks

### `mergePatternsMessages`

*function* — Shallow merge per namespace; `undefined` values in the override are ignored.

```ts
function mergePatternsMessages: (base: PatternsMessages, overrides: PatternsMessagesOverrides | undefined) => PatternsMessages
```

### `usePatternsMessages`

*function* — The merged message table of the nearest provider (`patternsZhCN` without one).

```ts
function usePatternsMessages: () => PatternsMessages
```

## Constants

### `patternsEnUS`

*const* — Reference translation (ADR-0009 §1): wording is not guaranteed to be stable.

```ts
const patternsEnUS: PatternsMessages
```

### `patternsZhCN`

*const*

```ts
const patternsZhCN: PatternsMessages
```

## Interfaces

### `AppliedFilterItem`

*interface* — Applied filter conditions (0.3.0-contracts §4.2 / §6.4): stable ids, readable labels, single removal and clear-all. Focus contract: after a removal lands (the caller drops the item and focus falls off the unmounted button), focus moves to the next remaining remove button — or the previous one when the last item went — and to the clear-all entry when none remain. "No records" vs "no results" lives in the collection's empty state, not here.

| Member | Type | Description |
| --- | --- | --- |
| `disabled` | `boolean` | Render the remove entry disabled instead of hiding it. |
| `id` * | `string` | Stable condition id; the caller decides how duplicate labels merge. |
| `label` * | `React.ReactNode` | Readable name and value, e.g. "类别：样本". |

### `InspectorPanelProps`

*interface* — Semantic inspector region (0.3.0-contracts §6.2): title, close, metadata, actions and content slots with an accessible name. A region component — it runs no business actions; overlay use composes the existing Drawer in a recipe. `open={false}` hides the whole region via the native `hidden` attribute, so no invisible focusable controls remain. Null metadata values follow MetadataList's own empty handling (hidden by default,「未记录」with `empty="placeholder"`).

| Member | Type | Description |
| --- | --- | --- |
| `actions` | `React.ReactNode` | Action bar; buttons are composed by the caller from `@wzrhine/react`. |
| `children` | `React.ReactNode` |  |
| `className` | `string` |  |
| `closeLabel` | `string` |  |
| `eyebrow` | `React.ReactNode` | Small archive-style label above the title, e.g. "INSPECTOR". |
| `label` | `string` | Accessible name of the region; defaults to a string `title`. |
| `meta` | `readonly MetadataItem[]` | Metadata rows, rendered with MetadataList (stacked, compact). |
| `onClose` | `(() => void)` | Rendered when provided; reports the intent only. |
| `open` | `boolean` | Controlled visibility; false hides the region entirely. Defaults to true. |
| `title` * | `React.ReactNode` |  |

### `ListDetailProps`

*interface*

| Member | Type | Description |
| --- | --- | --- |
| `backLabel` | `string` | Text of the back (overlay) / close (split) entry in the detail bar. |
| `className` | `string` |  |
| `defaultDetailId` | `string \| null` |  |
| `detailId` | `string \| null` | Controlled open record id; `null` = closed. |
| `detailLabel` | `string` |  |
| `detail` * | `React.ReactNode` | Detail region content; rendered only while `detailId` is non-null. |
| `listLabel` | `string` | Accessible names of the list and detail regions. |
| `list` * | `React.ReactNode` | Collection region content: a DataTable, ResourceGrid or any custom list. |
| `modeThreshold` | `number` | Container width threshold (px) for `auto`; at or above it the layout is `split`. |
| `mode` | `"auto" \| ListDetailMode` | `'auto'` (default) resolves from the container width; explicit values never measure. |
| `onDetailChange` | `((id: string \| null) => void)` |  |
| `onModeResolve` | `((mode: ListDetailMode) => void)` |  |

### `PatternsMessages`

*interface* — Built-in copy of `@wzrhine/patterns` (ADR-0014 §3), same rules as ADR-0009: component prop > nearest `PatternsMessagesProvider` > `patternsZhCN`. This file is the only patterns source allowed to contain CJK text (package-boundary test). The number locale comes from the nearest `RhineProvider` / `RhineMessagesProvider` of `@wzrhine/react`, exactly like `@wzrhine/agent`.

| Member | Type | Description |
| --- | --- | --- |
| `appliedFilters` * | `{ region: string; remove: (name: string) => string; clearAll: string; }` |  |
| `inspectorPanel` * | `{ close: string; }` |  |
| `listDetail` * | `{ back: string; list: string; detail: string; }` | ListDetail copy; overrides the `backLabel` / `listLabel` / `detailLabel` props' defaults. |
| `queryToolbar` * | `{ region: string; search: string; placeholder: string; submit: string; reset: string; }` |  |
| `resourceGrid` * | `{ loading: string; imageFailed: string; error: string; retry: string; empty: string; item: string; }` |  |
| `sectionIndex` * | `{ region: string; }` |  |
| `selectionToolbar` * | `{ region: string; selected: (count: number, format: (value: number) => string) => string; clear: string; }` |  |

### `PatternsMessagesProviderProps`

*interface*

| Member | Type | Description |
| --- | --- | --- |
| `children` * | `React.ReactNode` |  |
| `messages` | `PatternsMessagesOverrides` | Partial table merged over the outer provider's (or `patternsZhCN`). |

### `QueryToolbarProps`

*interface* — Query toolbar (0.3.0-contracts §4.4 / §6.3): layout, control grouping, result summary and reset for a collection view. No filter DSL of its own — filter controls go into `children`.

| Member | Type | Description |
| --- | --- | --- |
| `busy` | `boolean` | A commit is in flight: submit/reset disabled, the typed value stays. |
| `children` | `React.ReactNode` | Filter control slots (Combobox, Select, custom). |
| `className` | `string` |  |
| `defaultQuery` | `string` |  |
| `onPendingQueryChange` | `((value: string) => void)` |  |
| `onQueryChange` | `((query: string) => void)` |  |
| `onReset` | `(() => void)` | Reset clears query and filters and resets paging — executed by the caller. |
| `pendingQuery` | `string` | Value being typed; kept internally when not provided. Synced when the caller changes `query`. |
| `query` | `string` | Committed query (controlled); the caller decides when to accept a submission. |
| `resetDisabled` | `boolean` |  |
| `resetLabel` | `string` |  |
| `resultSummary` | `React.ReactNode` | Result summary, announced politely (role="status"), e.g. "共 128 条结果". |
| `searchLabel` | `string` |  |
| `searchPlaceholder` | `string` |  |
| `submitLabel` | `string` |  |
| `toolbarLabel` | `string` | Accessible name of the search region; defaults to the built-in copy. |

### `ResourceGridItemSpec`

*interface*

| Member | Type | Description |
| --- | --- | --- |
| `badge` | `React.ReactNode` | Status slot on the card (StatusBadge etc.). |
| `description` | `React.ReactNode` | Secondary line, truncated by CSS. |
| `moreActions` | `React.ReactNode` | Actions outside the open entry (never nested inside it). |
| `thumbnail` | `ResourceGridThumbnail` |  |

### `ResourceGridProps`

*interface*

| Member | Type | Description |
| --- | --- | --- |
| `className` | `string` |  |
| `emptyAction` | `React.ReactNode` |  |
| `emptyText` | `React.ReactNode` |  |
| `getItemId` * | `(item: Item) => string` |  |
| `getItemLabel` | `((item: Item) => string)` | Accessible name of a card's checkbox; defaults to the title text when it is a string. |
| `getItemSpec` | `((item: Item) => ResourceGridItemSpec)` |  |
| `getItemTitle` * | `(item: Item) => React.ReactNode` |  |
| `items` * | `readonly Item[]` |  |
| `label` | `string` | Accessible name of the list. |
| `loadingRows` | `number` |  |
| `onOpen` | `((id: string) => void)` | Open entry; selection and opening are distinct interactions. |
| `onRetry` | `(() => void)` |  |
| `onSelectionChange` | `((ids: Set<string>) => void)` |  |
| `selectedIds` | `ReadonlySet<string>` |  |
| `status` | `"ready" \| "loading" \| "error"` |  |

### `ResourceGridThumbnail`

*interface* — Resource card grid (0.3.0-contracts §6.7): list semantics with named checkboxes and the title as the open entry — open, select and more actions are separately reachable, never nested. Thumbnails keep their intrinsic size (no layout shift), degrade per item on load failure and recover when the caller swaps the src; a card without a thumbnail stays fully operable. Selection is an explicit finite id set (ReadonlySet, same contract as DataTable). Object URLs and observers are released by whoever created them — the component only tracks img errors.

| Member | Type | Description |
| --- | --- | --- |
| `alt` * | `string` |  |
| `height` | `number` |  |
| `src` * | `string` |  |
| `width` | `number` | Reserved size to avoid layout shift; defaults to a 4:3 placeholder box. |

### `SectionIndexProps`

*interface*

| Member | Type | Description |
| --- | --- | --- |
| `activeId` | `string` | Current section; kept internally (observed) when not provided. |
| `className` | `string` |  |
| `label` | `string` | Accessible name of the nav. |
| `offsetTop` | `number` | Fixed header offset (px) applied after scrolling a section into view. |
| `onActiveChange` | `((id: string) => void)` |  |
| `onNavigate` | `((id: string) => void)` | Active navigation by the user (distinct from passive observation). |
| `scrollRoot` | `React.RefObject<HTMLElement \| null>` | Explicit scroll root; defaults to the nearest scrolling ancestor. |
| `sections` * | `readonly SectionIndexSection[]` |  |
| `smoothScroll` | `boolean` | Opt-in smooth scrolling; always off under reduced motion. |

### `SectionIndexSection`

*interface* — Section index (0.3.0-contracts §4.3 / §6.8): named anchors for record detail sections with a passive current-section highlight. Anchors keep working without JS; with JS, a plain click is enhanced into a scroll inside the explicit scroll root (nearest scrolling ancestor by default, the viewport when there is none) honoring a fixed header offset, and smooth scrolling is opt-in and disabled under reduced motion. Modified clicks (Ctrl/Meta/Shift/Alt, middle button) are left to the browser, so "open in new tab" still works. Observation never steals focus — the active section is `aria-current`, user intent is a separate event.

| Member | Type | Description |
| --- | --- | --- |
| `id` * | `string` | Anchor id; must match the content heading's id. Stable, not generated. |
| `label` * | `React.ReactNode` |  |

### `SelectionToolbarAction`

*interface*

| Member | Type | Description |
| --- | --- | --- |
| `busy` | `boolean` |  |
| `disabled` | `boolean` |  |
| `icon` | `React.ReactNode` |  |
| `id` * | `string` |  |
| `label` * | `React.ReactNode` |  |
| `onRun` | `(() => void)` | Executed by the caller; component never runs business logic. |

### `SelectionToolbarProps`

*interface*

| Member | Type | Description |
| --- | --- | --- |
| `actions` | `readonly SelectionToolbarAction[]` |  |
| `className` | `string` |  |
| `clearLabel` | `string` |  |
| `label` | `string` | Accessible name of the toolbar. |
| `onClear` | `(() => void)` |  |
| `scope` | `SelectionScope` | Which range the count refers to; combined with `totalLabel` for an explainable scope. |
| `selectedCount` * | `number` |  |
| `totalLabel` | `React.ReactNode` | Range note, e.g. "当前页 25 条 / 已加载 100 条". |

### `ViewSwitcherOption`

*interface* — Toolbar-segmented view switcher (0.3.0-contracts §6.5): a radiogroup over the allowed view options. Switching reports the intent only — keeping query, selection and page intact is the caller's state, never a remount. Icons are never the only label. A `value` outside `options` renders nothing checked; providing a valid fallback is the caller's documented duty.

| Member | Type | Description |
| --- | --- | --- |
| `disabled` | `boolean` |  |
| `icon` | `React.ReactNode` |  |
| `label` * | `React.ReactNode` | Text label, always rendered; icons are additional. |
| `value` * | `V` |  |

### `ViewSwitcherProps`

*interface*

| Member | Type | Description |
| --- | --- | --- |
| `className` | `string` |  |
| `defaultValue` | `V` |  |
| `disabled` | `boolean` |  |
| `label` * | `string` | Accessible name of the radiogroup, e.g. "视图". |
| `onValueChange` | `((value: V) => void)` |  |
| `options` * | `readonly ViewSwitcherOption<V>[]` |  |
| `value` | `V` |  |

## Types

### `AppliedFiltersProps`

*type*

| Member | Type | Description |
| --- | --- | --- |
| `className` | `string` |  |
| `clearAllLabel` | `string` |  |
| `filters` * | `readonly AppliedFilterItem[]` |  |
| `label` | `string` | Accessible name of the region. |
| `onClearAll` | `(() => void)` | Provided (with items present) renders the clear-all entry. |
| `onRemove` | `((id: string) => void)` |  |
| `removeLabel` | `((filter: AppliedFilterItem) => string)` |  |

### `ListDetailMode`

*type* — Embeddable master-detail layout (0.3.0-contracts §4.1 / §6.1).

```ts
type ListDetailMode = 'split' | 'overlay'
```

### `PatternsMessagesOverrides`

*type* — Override shape: every namespace and entry is optional; `undefined` entries are ignored.

```ts
type PatternsMessagesOverrides = { [K in keyof PatternsMessages]?: { [P in keyof PatternsMessages[K]]?: PatternsMessages[K][P]; }; }
```

### `SelectionScope`

*type* — Selection action bar (0.3.0-contracts §5 / §6.6): selected count, range explanation, clear entry and batch actions. Batch execution belongs to the caller; a `busy` action disables its button so the same operation cannot be submitted twice, and a failed operation keeps the selection recoverable (the caller simply keeps reporting `selectedCount`). Zero selection renders nothing. First version covers explicit finite id sets only — the page / loaded / query scopes stay explainable, "all results selected" is not implied.

```ts
type SelectionScope = 'page' | 'loaded' | 'query'
```

