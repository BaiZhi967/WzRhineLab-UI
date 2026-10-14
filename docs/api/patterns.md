# @wzrhine/patterns · API reference

> 由 `scripts/api-report.mjs` 从 `dist/index.d.ts` 生成，请勿手改。版本 0.3.0，共 21 个导出（6 components，2 functions & hooks，2 constants，8 interfaces，3 types）。

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
| `actions` | `React.ReactNode` | Action bar; buttons are composed by the caller from |
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
| `actions` | `React.ReactNode` | Action bar; buttons are composed by the caller from |
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

*interface* — Built-in copy of `@wzrhine/patterns` (ADR-0014 §3), same rules as ADR-0009: component prop > nearest `PatternsMessagesProvider` > `patternsZhCN`. This file is the only patterns source allowed to contain CJK text (package-boundary test). The number locale comes from the nearest `RhineProvider` / `RhineMessagesProvider` of

| Member | Type | Description |
| --- | --- | --- |
| `appliedFilters` * | `{ region: string; remove: (name: string) => string; clearAll: string; }` |  |
| `inspectorPanel` * | `{ close: string; }` |  |
| `listDetail` * | `{ back: string; list: string; detail: string; }` | ListDetail copy; overrides the `backLabel` / `listLabel` / `detailLabel` props' defaults. |
| `queryToolbar` * | `{ region: string; search: string; placeholder: string; submit: string; reset: string; }` |  |

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

