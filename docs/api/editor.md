# @wzrhine/editor · API reference

> 由 `scripts/api-report.mjs` 从 `dist/index.d.ts` 生成，请勿手改。版本 0.6.0，共 36 个导出（8 components，2 functions & hooks，4 constants，18 interfaces，4 types）。

## Components

### `DocumentTabs`

*component*

| Prop | Type | Description |
| --- | --- | --- |
| `activeId` * | `string` |  |
| `closeLabel` | `((title: string) => string)` |  |
| `label` | `string` |  |
| `onActiveChange` * | `(id: string) => void` |  |
| `onCloseRequest` | `((tab: DocumentTab) => void)` |  |
| `onClose` | `((id: string) => void)` |  |
| `tabs` * | `readonly DocumentTab[]` |  |

`*` 必填。原生 DOM 属性（如 `onClick`、`aria-*`）未列出。

### `EditorMessagesProvider`

*component*

| Prop | Type | Description |
| --- | --- | --- |
| `children` | `React.ReactNode` |  |
| `messages` | `EditorMessagesOverrides` |  |

`*` 必填。原生 DOM 属性（如 `onClick`、`aria-*`）未列出。

### `EditorModeSwitcher`

*component*

| Prop | Type | Description |
| --- | --- | --- |
| `label` | `string` |  |
| `onModeChange` * | `(mode: EditorMode) => void` |  |
| `value` * | `"source" \| "preview" \| "split"` |  |

`*` 必填。原生 DOM 属性（如 `onClick`、`aria-*`）未列出。

### `EditorModeView`

*component*

| Prop | Type | Description |
| --- | --- | --- |
| `adapter` * | `EditorAdapter` |  |
| `mode` * | `"source" \| "preview" \| "split"` |  |
| `onBlur` | `(() => void)` |  |
| `onChange` | `((change: EditorChange) => void)` |  |
| `onCompositionChange` | `((composing: boolean) => void)` |  |
| `onFocus` | `(() => void)` |  |
| `onLinkActivate` | `((href: string) => void)` |  |
| `onModeChange` * | `(mode: EditorMode) => void` |  |
| `onRetry` | `(() => void)` |  |
| `onSelectionChange` | `((selection: EditorSelection) => void)` |  |
| `onSplitSizeChange` | `((size: number) => void)` |  |
| `previewError` | `React.ReactNode` |  |
| `previewStatus` | `MarkdownRenderStatus` |  |
| `readOnly` | `boolean` |  |
| `renderImage` | `MarkdownImageRenderer` |  |
| `resizableDivider` | `boolean` |  |
| `source` * | `string` |  |
| `splitMax` | `number` |  |
| `splitMin` | `number` |  |
| `splitSize` | `number` |  |
| `status` | `React.ReactNode` |  |
| `toolbar` | `React.ReactNode` |  |

`*` 必填。原生 DOM 属性（如 `onClick`、`aria-*`）未列出。

### `EditorSurface`

*component*

| Prop | Type | Description |
| --- | --- | --- |
| `adapter` * | `EditorAdapter` |  |
| `onBlur` | `(() => void)` |  |
| `onChange` | `((change: EditorChange) => void)` |  |
| `onCompositionChange` | `((composing: boolean) => void)` |  |
| `onFocus` | `(() => void)` |  |
| `onSelectionChange` | `((selection: EditorSelection) => void)` |  |
| `placeholder` | `React.ReactNode` |  |
| `readOnly` | `boolean` |  |
| `selection` | `EditorSelection` |  |
| `source` * | `string` |  |

`*` 必填。原生 DOM 属性（如 `onClick`、`aria-*`）未列出。

### `EditorToolbar`

*component*

| Prop | Type | Description |
| --- | --- | --- |
| `commands` * | `readonly EditorToolbarCommand[]` |  |
| `composing` | `boolean` |  |
| `label` | `string` |  |
| `onCommand` * | `(command: EditorCommand) => void` |  |
| `readOnly` | `boolean` |  |
| `toolbarEnd` | `React.ReactNode` |  |
| `toolbarStart` | `React.ReactNode` |  |

`*` 必填。原生 DOM 属性（如 `onClick`、`aria-*`）未列出。

### `PreviewPane`

*component*

| Prop | Type | Description |
| --- | --- | --- |
| `error` | `React.ReactNode` |  |
| `onLinkActivate` | `((href: string) => void)` |  |
| `onRetry` | `(() => void)` |  |
| `renderImage` | `MarkdownImageRenderer` |  |
| `retryLabel` | `string` |  |
| `source` * | `string` |  |
| `status` | `MarkdownRenderStatus` |  |

`*` 必填。原生 DOM 属性（如 `onClick`、`aria-*`）未列出。

### `SaveStatus`

*component*

| Prop | Type | Description |
| --- | --- | --- |
| `onResolveConflict` | `(() => void)` |  |
| `onRetry` | `(() => void)` |  |
| `status` * | `"clean" \| "dirty" \| "saving" \| "saved" \| "error" \| "conflict"` |  |

`*` 必填。原生 DOM 属性（如 `onClick`、`aria-*`）未列出。

## Functions & hooks

### `mergeEditorMessages`

*function*

```ts
function mergeEditorMessages: (base: EditorMessages, overrides?: EditorMessagesOverrides) => EditorMessages
```

### `useEditorMessages`

*function*

```ts
function useEditorMessages: () => EditorMessages
```

## Constants

### `editorEnUS`

*const*

```ts
const editorEnUS: EditorMessages
```

### `editorModes`

*const*

```ts
const editorModes: readonly ["source", "preview", "split"]
```

### `editorZhCN`

*const*

```ts
const editorZhCN: EditorMessages
```

### `saveStatusKinds`

*const*

```ts
const saveStatusKinds: readonly ["clean", "dirty", "saving", "saved", "error", "conflict"]
```

## Interfaces

### `DocumentTab`

*interface*

| Member | Type | Description |
| --- | --- | --- |
| `closable` | `boolean` |  |
| `dirty` | `boolean` |  |
| `disabled` | `boolean` |  |
| `id` * | `string` |  |
| `title` * | `string` |  |

### `DocumentTabsProps`

*interface*

| Member | Type | Description |
| --- | --- | --- |
| `activeId` * | `string` |  |
| `closeLabel` | `((title: string) => string)` |  |
| `label` | `string` |  |
| `onActiveChange` * | `(id: string) => void` |  |
| `onCloseRequest` | `((tab: DocumentTab) => void)` |  |
| `onClose` | `((id: string) => void)` |  |
| `tabs` * | `readonly DocumentTab[]` |  |

### `DocumentView`

*interface*

| Member | Type | Description |
| --- | --- | --- |
| `id` * | `string` |  |
| `mode` * | `"source" \| "preview" \| "split"` |  |
| `readOnly` | `boolean` |  |
| `revision` | `string` |  |
| `saveStatus` * | `"clean" \| "dirty" \| "saving" \| "saved" \| "error" \| "conflict"` |  |
| `selection` | `EditorSelection` |  |
| `source` * | `string` |  |
| `title` * | `string` |  |

### `EditorAdapter`

*interface*

| Member | Type | Description |
| --- | --- | --- |
| `create` * | `(container: HTMLElement, options: EditorAdapterOptions) => EditorHost` |  |

### `EditorAdapterOptions`

*interface*

| Member | Type | Description |
| --- | --- | --- |
| `ariaLabel` | `string` |  |
| `onBlur` | `(() => void)` |  |
| `onChange` | `((change: EditorChange) => void)` |  |
| `onCompositionChange` | `((composing: boolean) => void)` |  |
| `onFocus` | `(() => void)` |  |
| `onSelectionChange` | `((selection: EditorSelection) => void)` |  |
| `readOnly` | `boolean` |  |
| `selection` | `EditorSelection` |  |
| `source` * | `string` |  |

### `EditorChange`

*interface*

| Member | Type | Description |
| --- | --- | --- |
| `composing` * | `boolean` |  |
| `origin` * | `"user" \| "external"` |  |
| `selection` | `EditorSelection` |  |
| `source` * | `string` |  |

### `EditorHost`

*interface*

| Member | Type | Description |
| --- | --- | --- |
| `destroy` * | `() => void` |  |
| `dispatch` * | `(command: EditorCommand) => boolean` |  |
| `focus` * | `() => void` |  |
| `getSnapshot` * | `() => EditorSnapshot` |  |
| `setSource` * | `(source: string) => void` |  |
| `subscribe` * | `(listener: (change: EditorChange) => void) => () => void` |  |

### `EditorMessages`

*interface*

| Member | Type | Description |
| --- | --- | --- |
| `mode` * | `{ label: string; source: string; preview: string; split: string; }` |  |
| `resolveConflict` * | `string` |  |
| `retry` * | `string` |  |
| `saveStatus` * | `Record<"clean" \| "dirty" \| "saving" \| "saved" \| "error" \| "conflict", string>` |  |
| `tabs` * | `{ label: string; dirty: string; close: (title: string) => string; }` |  |
| `toolbar` * | `{ label: string; }` |  |

### `EditorMessagesProviderProps`

*interface*

| Member | Type | Description |
| --- | --- | --- |
| `children` | `React.ReactNode` |  |
| `messages` | `EditorMessagesOverrides` |  |

### `EditorModeSwitcherProps`

*interface*

| Member | Type | Description |
| --- | --- | --- |
| `label` | `string` |  |
| `onModeChange` * | `(mode: EditorMode) => void` |  |
| `value` * | `"source" \| "preview" \| "split"` |  |

### `EditorModeViewProps`

*interface*

| Member | Type | Description |
| --- | --- | --- |
| `adapter` * | `EditorAdapter` |  |
| `mode` * | `"source" \| "preview" \| "split"` |  |
| `onBlur` | `(() => void)` |  |
| `onChange` | `((change: EditorChange) => void)` |  |
| `onCompositionChange` | `((composing: boolean) => void)` |  |
| `onFocus` | `(() => void)` |  |
| `onLinkActivate` | `((href: string) => void)` |  |
| `onModeChange` * | `(mode: EditorMode) => void` |  |
| `onRetry` | `(() => void)` |  |
| `onSelectionChange` | `((selection: EditorSelection) => void)` |  |
| `onSplitSizeChange` | `((size: number) => void)` |  |
| `previewError` | `React.ReactNode` |  |
| `previewStatus` | `MarkdownRenderStatus` |  |
| `readOnly` | `boolean` |  |
| `renderImage` | `MarkdownImageRenderer` |  |
| `resizableDivider` | `boolean` |  |
| `source` * | `string` |  |
| `splitMax` | `number` |  |
| `splitMin` | `number` |  |
| `splitSize` | `number` |  |
| `status` | `React.ReactNode` |  |
| `toolbar` | `React.ReactNode` |  |

### `EditorSelection`

*interface*

| Member | Type | Description |
| --- | --- | --- |
| `from` * | `number` |  |
| `to` * | `number` |  |

### `EditorSnapshot`

*interface*

| Member | Type | Description |
| --- | --- | --- |
| `canRedo` * | `boolean` |  |
| `canUndo` * | `boolean` |  |
| `composing` * | `boolean` |  |
| `readOnly` * | `boolean` |  |
| `selection` | `EditorSelection` |  |
| `source` * | `string` |  |

### `EditorSurfaceProps`

*interface*

| Member | Type | Description |
| --- | --- | --- |
| `adapter` * | `EditorAdapter` |  |
| `onBlur` | `(() => void)` |  |
| `onChange` | `((change: EditorChange) => void)` |  |
| `onCompositionChange` | `((composing: boolean) => void)` |  |
| `onFocus` | `(() => void)` |  |
| `onSelectionChange` | `((selection: EditorSelection) => void)` |  |
| `placeholder` | `React.ReactNode` |  |
| `readOnly` | `boolean` |  |
| `selection` | `EditorSelection` |  |
| `source` * | `string` |  |

### `EditorToolbarCommand`

*interface*

| Member | Type | Description |
| --- | --- | --- |
| `command` * | `EditorCommand` |  |
| `disabled` | `boolean` |  |
| `group` | `string` |  |
| `id` * | `string` |  |
| `label` * | `string` |  |
| `pressed` | `boolean` |  |
| `shortcut` | `string` |  |

### `EditorToolbarProps`

*interface*

| Member | Type | Description |
| --- | --- | --- |
| `commands` * | `readonly EditorToolbarCommand[]` |  |
| `composing` | `boolean` |  |
| `label` | `string` |  |
| `onCommand` * | `(command: EditorCommand) => void` |  |
| `readOnly` | `boolean` |  |
| `toolbarEnd` | `React.ReactNode` |  |
| `toolbarStart` | `React.ReactNode` |  |

### `PreviewPaneProps`

*interface*

| Member | Type | Description |
| --- | --- | --- |
| `error` | `React.ReactNode` |  |
| `onLinkActivate` | `((href: string) => void)` |  |
| `onRetry` | `(() => void)` |  |
| `renderImage` | `MarkdownImageRenderer` |  |
| `retryLabel` | `string` |  |
| `source` * | `string` |  |
| `status` | `MarkdownRenderStatus` |  |

### `SaveStatusProps`

*interface*

| Member | Type | Description |
| --- | --- | --- |
| `onResolveConflict` | `(() => void)` |  |
| `onRetry` | `(() => void)` |  |
| `status` * | `"clean" \| "dirty" \| "saving" \| "saved" \| "error" \| "conflict"` |  |

## Types

### `EditorCommand`

*type*

| Member | Type | Description |
| --- | --- | --- |
| `type` * | `"undo" \| "redo" \| "toggle-mark" \| "set-heading" \| "toggle-list" \| "insert-link" \| "insert-text"` |  |

### `EditorMessagesOverrides`

*type*

```ts
type EditorMessagesOverrides = { saveStatus?: Partial<EditorMessages['saveStatus']>; mode?: Partial<EditorMessages['mode']>; tabs?: Partial<EditorMessages['tabs']>; toolbar?: Partial<EditorMessages['toolbar']>; retry?: string; resolveConflict?: string; }
```

### `EditorMode`

*type*

```ts
type EditorMode = (typeof editorModes)[number]
```

### `SaveStatusKind`

*type*

```ts
type SaveStatusKind = (typeof saveStatusKinds)[number]
```


## Optional subpath `./codemirror`

由 `scripts/api-report.mjs` 从 `dist/codemirror.d.ts` 生成，共 1 个导出。

### `createCodeMirrorAdapter`

*function*

```ts
function createCodeMirrorAdapter: () => EditorAdapter
```

