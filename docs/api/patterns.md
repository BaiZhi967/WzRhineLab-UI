# @wzrhine/patterns · API reference

> 由 `scripts/api-report.mjs` 从 `dist/index.d.ts` 生成，请勿手改。版本 0.3.0，共 11 个导出（2 components，2 functions & hooks，2 constants，3 interfaces，2 types）。

## Components

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
| `listDetail` * | `{ back: string; list: string; detail: string; }` | ListDetail copy; overrides the `backLabel` / `listLabel` / `detailLabel` props' defaults. |

### `PatternsMessagesProviderProps`

*interface*

| Member | Type | Description |
| --- | --- | --- |
| `children` * | `React.ReactNode` |  |
| `messages` | `PatternsMessagesOverrides` | Partial table merged over the outer provider's (or `patternsZhCN`). |

## Types

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

