# @wzrhine/content · API reference

> 由 `scripts/api-report.mjs` 从 `dist/index.d.ts` 生成，请勿手改。版本 0.4.0，共 22 个导出（3 components，5 functions & hooks，2 constants，5 interfaces，7 types）。

## Components

### `CodeBlock`

*component*

| Prop | Type | Description |
| --- | --- | --- |
| `children` | `React.ReactNode` |  |
| `code` * | `string` |  |
| `copyLabel` | `string` |  |
| `copyable` | `boolean` |  |
| `filename` | `string` |  |
| `language` | `string` |  |
| `maxHeight` | `string` |  |
| `onCopy` | `CodeCopyHandler` |  |
| `showLineNumbers` | `boolean` |  |

`*` 必填。原生 DOM 属性（如 `onClick`、`aria-*`）未列出。

### `ContentMessagesProvider`

*component*

| Prop | Type | Description |
| --- | --- | --- |
| `children` | `React.ReactNode` |  |
| `messages` | `ContentMessagesOverrides` |  |

`*` 必填。原生 DOM 属性（如 `onClick`、`aria-*`）未列出。

### `MarkdownRenderer`

*component*

| Prop | Type | Description |
| --- | --- | --- |
| `components` | `Partial<Components>` |  |
| `error` | `React.ReactNode` |  |
| `onLinkActivate` | `((href: string) => void)` |  |
| `onRetry` | `(() => void)` |  |
| `renderImage` | `MarkdownImageRenderer` |  |
| `retryLabel` | `string` |  |
| `source` * | `string` |  |
| `status` | `MarkdownRenderStatus` |  |

`*` 必填。原生 DOM 属性（如 `onClick`、`aria-*`）未列出。

## Functions & hooks

### `extractHeadings`

*function*

```ts
function extractHeadings: (source: string) => readonly MarkdownHeading[]
```

### `mergeContentMessages`

*function*

```ts
function mergeContentMessages: (base: ContentMessages, overrides?: ContentMessagesOverrides) => ContentMessages
```

### `resolveMarkdownUrl`

*function*

```ts
function resolveMarkdownUrl: (url: string, kind: MarkdownUrlKind) => string | undefined
```

### `slugifyHeading`

*function*

```ts
function slugifyHeading: (text: string, occurrence?: number) => string
```

### `useContentMessages`

*function*

```ts
function useContentMessages: () => ContentMessages
```

## Constants

### `contentEnUS`

*const*

```ts
const contentEnUS: ContentMessages
```

### `contentZhCN`

*const*

```ts
const contentZhCN: ContentMessages
```

## Interfaces

### `ContentMessages`

*interface*

| Member | Type | Description |
| --- | --- | --- |
| `code` * | `{ copy: string; copied: string; copyFailed: string; label: string; }` |  |
| `image` * | `{ unavailable: string; }` |  |
| `state` * | `{ loading: string; empty: string; retry: string; }` |  |
| `unsupported` * | `{ title: string; detail: (kind: string) => string; }` |  |

### `ContentMessagesOverrides`

*interface*

| Member | Type | Description |
| --- | --- | --- |
| `code` | `Partial<{ copy: string; copied: string; copyFailed: string; label: string; }>` |  |
| `image` | `Partial<{ unavailable: string; }>` |  |
| `state` | `Partial<{ loading: string; empty: string; retry: string; }>` |  |
| `unsupported` | `Partial<{ title: string; detail: (kind: string) => string; }>` |  |

### `ContentMessagesProviderProps`

*interface*

| Member | Type | Description |
| --- | --- | --- |
| `children` | `React.ReactNode` |  |
| `messages` | `ContentMessagesOverrides` |  |

### `MarkdownHeading`

*interface*

| Member | Type | Description |
| --- | --- | --- |
| `depth` * | `MarkdownHeadingDepth` |  |
| `id` * | `string` |  |
| `line` * | `number` |  |
| `text` * | `string` |  |

### `MarkdownImageProps`

*interface*

| Member | Type | Description |
| --- | --- | --- |
| `alt` * | `string` |  |
| `src` * | `string` |  |
| `title` | `string` |  |

## Types

### `CodeBlockProps`

*type*

| Member | Type | Description |
| --- | --- | --- |
| `children` | `React.ReactNode` |  |
| `code` * | `string` |  |
| `copyLabel` | `string` |  |
| `copyable` | `boolean` |  |
| `filename` | `string` |  |
| `language` | `string` |  |
| `maxHeight` | `string` |  |
| `onCopy` | `CodeCopyHandler` |  |
| `showLineNumbers` | `boolean` |  |

### `CodeCopyHandler`

*type*

```ts
type CodeCopyHandler = (code: string) => void | Promise<void>
```

### `MarkdownHeadingDepth`

*type*

```ts
type MarkdownHeadingDepth = 1 | 2 | 3 | 4 | 5 | 6
```

### `MarkdownImageRenderer`

*type*

```ts
type MarkdownImageRenderer = (image: MarkdownImageProps) => React.ReactNode
```

### `MarkdownRendererProps`

*type*

| Member | Type | Description |
| --- | --- | --- |
| `components` | `Partial<Components>` |  |
| `error` | `React.ReactNode` |  |
| `onLinkActivate` | `((href: string) => void)` |  |
| `onRetry` | `(() => void)` |  |
| `renderImage` | `MarkdownImageRenderer` |  |
| `retryLabel` | `string` |  |
| `source` * | `string` |  |
| `status` | `MarkdownRenderStatus` |  |

### `MarkdownRenderStatus`

*type*

```ts
type MarkdownRenderStatus = 'ready' | 'loading' | 'empty' | 'error'
```

### `MarkdownUrlKind`

*type*

```ts
type MarkdownUrlKind = 'link' | 'image'
```

