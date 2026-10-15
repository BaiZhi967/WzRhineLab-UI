# @wzrhine/agent · API reference

> 由 `scripts/api-report.mjs` 从 `dist/index.d.ts` 生成，请勿手改。版本 0.3.0，共 400 个导出（87 components，66 functions & hooks，20 constants，99 interfaces，128 types）。

## Components

### `ActivityLedger`

*component* — ActivityLedger (atlas 33): audit events of agent, tool, system and user in `sequence` order. Filtering hides rows but never reorders them; duplicate ids are dropped. Each row has the actor (icon + text), title, optional detail, a `<time dateTime>` and the outcome as glyph + text. Filter tabs are `@wzrhine/react` Tabs (arrow keys, `aria-selected`).

| Prop | Type | Description |
| --- | --- | --- |
| `defaultFilter` | `LedgerFilterKey` |  |
| `events` * | `LedgerEventView[]` |  |
| `filter` | `LedgerFilterKey` | Actor filter (controlled). |
| `loading` | `boolean` | First load in progress (Skeleton rows, `aria-busy`). |
| `messages` | `WorkspaceMessagesProp` |  |
| `onFilterChange` | `((filter: LedgerFilterKey) => void)` |  |
| `onOpenEvent` | `((event: LedgerEventView) => void)` | Opens one event; each row title becomes a button. |
| `showFilters` | `boolean` | Show the filter tabs (default true). |

`*` 必填。原生 DOM 属性（如 `onClick`、`aria-*`）未列出。

### `AgentEmptyState`

*component*

| Prop | Type | Description |
| --- | --- | --- |
| `action` | `React.ReactNode` | Custom action instead of the create button. |
| `createLabel` | `React.ReactNode` |  |
| `description` | `React.ReactNode` |  |
| `headingLevel` | `EmptyStateHeadingLevel` | Render the title as `<h2>`–`<h6>`; omitted = `<p>`. |
| `icon` | `React.ReactNode` | Replace the kind's icon; `null` removes it. Always decorative. |
| `kind` | `EmptyStateKind` |  |
| `onCreate` | `(() => void)` | Primary action; renders a button labelled `createLabel`. |
| `size` | `EmptyStateSize` | `sm` inside tables and cards; `md` for a whole region. |
| `title` | `React.ReactNode` |  |

`*` 必填。原生 DOM 属性（如 `onClick`、`aria-*`）未列出。

### `AgentEntrance`

*component* — Plays a single first entrance and never again: later re-renders (streaming text, status changes) do not replay it, because the decision is frozen at mount. Content is visible from the first frame under reduced motion (no transform, ≤ fast opacity fade).

| Prop | Type | Description |
| --- | --- | --- |
| `animate` | `boolean` | Animate this mount. Pass `false` for items present on first render or restored from history. |
| `as` | `"div" \| "li" \| "article" \| "section"` |  |
| `index` | `number` | Position among items that arrived together (stagger). |
| `kind` | `AgentEntranceKind` |  |

`*` 必填。原生 DOM 属性（如 `onClick`、`aria-*`）未列出。

### `AgentHeader`

*component*

| Prop | Type | Description |
| --- | --- | --- |
| `actions` | `React.ReactNode` | Trailing slot (e.g. a Menu with more conversation actions). |
| `backLabel` | `string` |  |
| `badges` | `AgentHeaderBadge[]` |  |
| `contextLabel` | `string` |  |
| `contextOpen` | `boolean` | Explicit pane state; defaults to the surrounding AgentShell. |
| `headingLevel` | `2 \| 3 \| 4 \| 5 \| 6 \| 1` |  |
| `identity` | `AgentIdentityView` |  |
| `onBack` | `(() => void)` |  |
| `onOpenOrigin` | `((origin: ConversationOrigin) => void)` |  |
| `onRename` | `(() => void)` |  |
| `onToggleContext` | `(() => void)` | Explicit toggle; defaults to the surrounding AgentShell's toggle when it has a context slot. |
| `origin` | `ConversationOrigin` |  |
| `pending` | `boolean` | Disables rename (e.g. while a request is pending); other controls stay. |
| `renameLabel` | `string` |  |
| `runPhase` | `RunPhase` |  |
| `runStatus` | `RunStatus` |  |
| `statusLabel` | `string` | Overrides the status label (e.g. a custom phase text). |
| `syncStatus` | `SyncStatus` |  |
| `title` | `string` |  |

`*` 必填。原生 DOM 属性（如 `onClick`、`aria-*`）未列出。

### `AgentIcon`

*component*

| Prop | Type | Description |
| --- | --- | --- |
| `children` | `React.ReactNode` | Custom SVG inner nodes; win over the built-in path for `name`. |
| `name` * | `string` | Built-in icon name. Any other string is accepted together with `children` (ADR-0013 §3): the children become the icon content and `data-icon` carries the custom name. |

`*` 必填。原生 DOM 属性（如 `onClick`、`aria-*`）未列出。

### `AgentMessage`

*component*

| Prop | Type | Description |
| --- | --- | --- |
| `actionCapabilities` | `((message: MessageView) => MessageActionCapabilities \| undefined)` | Per-message availability of the actions (e.g. fork off while a run is active). |
| `announceInterval` | `number` | Minimum gap between streaming announcements (ms). |
| `defaultDetailsOpen` | `boolean` |  |
| `detailsOpen` | `boolean` | Controlled open state of the run-details disclosure. |
| `details` | `RunDetailsView` | Run details shown in the "运行详情" disclosure; defaults to `message.details`. |
| `feedback` | `MessageFeedback \| null` |  |
| `footer` | `React.ReactNode` | Extra content after the body (e.g. a RunSummary from another family). |
| `message` * | `MessageView` |  |
| `model` | `string` | Model label shown after the assistant author. |
| `onCopy` | `CopyHandler` |  |
| `onDetailsOpenChange` | `((open: boolean) => void)` |  |
| `onEdit` | `((messageId: string) => void)` |  |
| `onFeedback` | `((messageId: string, value: MessageFeedback \| null) => void)` |  |
| `onFork` | `((messageId: string) => void)` |  |
| `onOpenCitation` | `((citation: CitationView) => void)` |  |
| `onOpenThinking` | `((thinkingId: string) => void)` |  |
| `onRecoveryAction` | `((errorId: string, actionId: string) => void)` |  |
| `onRegenerate` | `((messageId: string) => void)` |  |
| `onRestoreInput` | `((messageId: string) => void)` | Put this turn's input back into the composer (distinct from `onEdit`). |
| `onRetry` | `((messageId: string) => void)` |  |
| `renderArtifact` | `ArtifactRenderer` |  |
| `renderPart` | `((part: MessagePartView, rendered: React.ReactNode) => React.ReactNode)` | Replaces the rendering of single parts; receives the default rendering. |
| `renderTool` | `ToolRenderer` |  |
| `renderers` | `MessagePartRenderers` |  |

`*` 必填。原生 DOM 属性（如 `onClick`、`aria-*`）未列出。

### `AgentMessagesProvider`

*component*

| Prop | Type | Description |
| --- | --- | --- |
| `children` * | `React.ReactNode` |  |
| `messages` | `AgentMessagesOverrides` | Full table (`agentEnUS`) or a partial override merged over the outer one. |

`*` 必填。原生 DOM 属性（如 `onClick`、`aria-*`）未列出。

### `AgentProcess`

*component*

| Prop | Type | Description |
| --- | --- | --- |
| `defaultExpanded` | `boolean` |  |
| `expanded` | `boolean` |  |
| `headingLevel` | `2 \| 3 \| 4 \| 5 \| 6` | Heading level of the call titles (default 3). |
| `onExpandedChange` | `((expanded: boolean) => void)` |  |
| `onLoadRecord` | `((blockId: string) => void)` |  |
| `onOpenFull` | `((runId: string) => void)` |  |
| `onOpenThinking` | `((thinkingId: string) => void)` |  |
| `renderTool` | `ToolRenderer` |  |
| `renderers` | `MessagePartRenderers` |  |
| `run` * | `RunView` |  |

`*` 必填。原生 DOM 属性（如 `onClick`、`aria-*`）未列出。

### `AgentShell`

*component*

| Prop | Type | Description |
| --- | --- | --- |
| `activeId` | `string` | Id of the conversation being read; a change closes the index sheet on narrow layouts. |
| `breakpoints` | `{ context?: number; index?: number; }` | Breakpoints in rem of the shell's own width (defaults: context 64, index 40). |
| `composer` | `React.ReactNode` | Docked at the bottom of the reading column. |
| `contextLabel` | `string` | Title of the context sheet on compact / narrow layouts. |
| `contextMax` | `number` |  |
| `contextMin` | `number` |  |
| `contextOpen` | `boolean` |  |
| `contextSize` | `number` | Width of the inline context pane in CSS pixels. |
| `context` | `React.ReactNode` | Side pane, usually an AgentSidePane. |
| `conversation` | `React.ReactNode` | Main reading area (MessageList). |
| `defaultContextOpen` | `boolean` |  |
| `defaultContextSize` | `number` |  |
| `defaultIndexOpen` | `boolean` |  |
| `direction` | `"forward" \| "back"` | Direction of the view drill-down animation. |
| `header` | `React.ReactNode` |  |
| `indexLabel` | `string` | Accessible name of the index column and title of the index sheet. |
| `indexOpen` | `boolean` |  |
| `index` | `React.ReactNode` | Conversation index column, usually a ConversationList. |
| `layout` | `AgentShellLayout` | Force a layout (tests, hosts that already know their size). Overrides measurement. |
| `mainLabel` | `string` | Accessible name of the reading column. |
| `onContextClosed` | `(() => void)` |  |
| `onContextOpenChange` | `((open: boolean, reason: AgentShellOpenReason) => void)` |  |
| `onContextSizeChange` | `((size: number) => void)` |  |
| `onIndexOpenChange` | `((open: boolean, reason: AgentShellOpenReason) => void)` |  |
| `rail` | `React.ReactNode` | App navigation rail (hidden on narrow layouts; the host offers its own menu there). |
| `readingMin` | `number` |  |
| `resizable` | `boolean` | Show the ResizeHandle between reading column and pane (default true). |
| `resizeLargeStep` | `number` |  |
| `resizeStep` | `number` |  |
| `viewKey` | `string` | Stable view identity for main conversation ↔ sub-task transitions. |

`*` 必填。原生 DOM 属性（如 `onClick`、`aria-*`）未列出。

### `AgentSidePane`

*component*

| Prop | Type | Description |
| --- | --- | --- |
| `activeTab` | `string` |  |
| `closeLabel` | `string` |  |
| `defaultTab` | `string` |  |
| `headingLevel` | `2 \| 3 \| 4 \| 5 \| 6` |  |
| `hideHeading` | `boolean` | Hide the visible heading (the landmark keeps its name). |
| `label` | `string` | Accessible name of the landmark (and visible heading). |
| `onClose` | `(() => void)` |  |
| `onTabChange` | `((id: string) => void)` |  |
| `sections` * | `AgentSidePaneSection[]` |  |
| `tabsLabel` | `string` | Accessible name of the tab list. |

`*` 必填。原生 DOM 属性（如 `onClick`、`aria-*`）未列出。

### `AgentSpark`

*component*

| Prop | Type | Description |
| --- | --- | --- |
| `animate` | `boolean` | Force the static frame (e.g. twelve sparks in a dense list). Default: animate when active. |
| `phase` * | `SparkPhase` |  |
| `size` | `"sm" \| "md"` |  |

`*` 必填。原生 DOM 属性（如 `onClick`、`aria-*`）未列出。

### `AgentStatus`

*component*

| Prop | Type | Description |
| --- | --- | --- |
| `active` | `boolean` |  |
| `appearance` | `"pill" \| "inline"` | `pill` = tinted chip; `inline` = glyph + text without a frame. |
| `glyph` * | `StatusGlyphName` |  |
| `label` * | `React.ReactNode` |  |
| `meta` | `React.ReactNode` | Secondary text after the label (elapsed time, count). |
| `size` | `"sm" \| "md"` |  |
| `tone` * | `AgentTone` |  |

`*` 必填。原生 DOM 属性（如 `onClick`、`aria-*`）未列出。

### `AgentWorkspaceEmpty`

*component* — AgentWorkspaceEmpty: the reading column when no conversation is selected. Same as AgentEmptyState, centred in the available height.

| Prop | Type | Description |
| --- | --- | --- |
| `action` | `React.ReactNode` | Custom action instead of the create button. |
| `createLabel` | `React.ReactNode` |  |
| `description` | `React.ReactNode` |  |
| `headingLevel` | `EmptyStateHeadingLevel` | Render the title as `<h2>`–`<h6>`; omitted = `<p>`. |
| `icon` | `React.ReactNode` | Replace the kind's icon; `null` removes it. Always decorative. |
| `kind` | `EmptyStateKind` |  |
| `onCreate` | `(() => void)` | Primary action; renders a button labelled `createLabel`. |
| `size` | `EmptyStateSize` | `sm` inside tables and cards; `md` for a whole region. |
| `title` | `React.ReactNode` |  |

`*` 必填。原生 DOM 属性（如 `onClick`、`aria-*`）未列出。

### `ApplyPatchDetail`

*component* — ApplyPatchDetail (atlas 40): per-file change and status; a conflict names its files.

| Prop | Type | Description |
| --- | --- | --- |
| `detail` * | `{ kind: "patch"; files: FileDiffView[]; revision?: string; materialReady?: boolean; hunksAvailable?: boolean; baseVersion?: string; raw?: MaterialPageView; }` |  |
| `onReload` | `((path: string) => void)` |  |
| `onViewFull` | `((path: string) => void)` |  |
| `rawActions` | `ChunkPagerActions` |  |

`*` 必填。原生 DOM 属性（如 `onClick`、`aria-*`）未列出。

### `ApprovalPanel`

*component*

| Prop | Type | Description |
| --- | --- | --- |
| `allowLabel` | `string` |  |
| `allowSessionLabel` | `string` |  |
| `approval` * | `ApprovalView` |  |
| `autoFocus` | `boolean` | Focus the title once on mount. Off by default: new approvals never steal focus. |
| `density` | `"compact" \| "full"` | `compact` docks above the composer: tighter spacing, evidence always behind a disclosure. |
| `evidenceCollapseAt` | `number` | Evidence with more items than this (or with long values) goes behind a disclosure. Default 3. |
| `headingLevel` | `2 \| 3 \| 4` | Title element level. Default 3. |
| `onApprove` | `AgentActionHandler<[ApprovalScope, AgentActionContext]>` |  |
| `onRefresh` | `(() => void)` | Shown in `expired`: refresh the approval state from the runtime. |
| `onReject` | `AgentActionHandler<[AgentActionContext]>` |  |
| `onRetryMaterial` | `(() => void)` | Shown in `unavailable`: reload the approval material. |
| `rejectLabel` | `string` |  |
| `rejectNote` | `React.ReactNode` | Overrides of the footer note and button labels. |
| `renderMaterial` | `((approval: ApprovalView) => React.ReactNode)` | Custom material view (e.g. tools `DiffPreview`). Default: an internal read-only diff of `approval.diff`. |

`*` 必填。原生 DOM 属性（如 `onClick`、`aria-*`）未列出。

### `ArtifactCard`

*component* — ArtifactCard (atlas 29): one generated file / report / image. 「已保存」 appears only for `status: 'saved'`; `generating` shows a Spinner without a percentage; `partial` and `failed` keep their reason as visible text. Actions render only with their callbacks; deleted or unavailable artifacts cannot be opened or downloaded.

| Prop | Type | Description |
| --- | --- | --- |
| `artifact` * | `ArtifactView` |  |
| `compact` | `boolean` |  |
| `headingLevel` | `HeadingLevel` |  |
| `messages` | `WorkspaceMessagesProp` |  |
| `onDownload` | `((artifact: ArtifactView) => void)` |  |
| `onOpen` | `((artifact: ArtifactView) => void)` |  |
| `onRetry` | `((artifact: ArtifactView) => void)` | Retries a failed artifact. |
| `onReveal` | `((artifact: ArtifactView) => void)` | Shows the file in its folder (host file manager). |
| `renderPreview` | `((artifact: ArtifactView) => React.ReactNode)` | Custom preview (chart, rendered markdown…); default: image thumbnail, text excerpt or kind icon. |

`*` 必填。原生 DOM 属性（如 `onClick`、`aria-*`）未列出。

### `ArtifactFallback`

*component*

| Prop | Type | Description |
| --- | --- | --- |
| `artifact` * | `ArtifactView` |  |

`*` 必填。原生 DOM 属性（如 `onClick`、`aria-*`）未列出。

### `ArtifactList`

*component* — Artifacts as a list (`<ul>`). Duplicate ids are dropped; items present on first render are static, items added later enter once (AgentEntrance `row`, reduced → no movement). `truncated` adds a plain note after the list (「部分产物未列出」, never a count it does not know) with an optional 「查看全部产物」 button.

| Prop | Type | Description |
| --- | --- | --- |
| `artifacts` * | `ArtifactView[]` |  |
| `headingLevel` | `HeadingLevel` |  |
| `messages` | `WorkspaceMessagesProp` |  |
| `onDownload` | `((artifact: ArtifactView) => void)` |  |
| `onOpen` | `((artifact: ArtifactView) => void)` |  |
| `onRetry` | `((artifact: ArtifactView) => void)` | Retries a failed artifact. |
| `onReveal` | `((artifact: ArtifactView) => void)` | Shows the file in its folder (host file manager). |
| `onShowAll` | `(() => void)` | Opens the full artifact list; drawn next to the truncated note. |
| `renderPreview` | `((artifact: ArtifactView) => React.ReactNode)` | Custom preview (chart, rendered markdown…); default: image thumbnail, text excerpt or kind icon. |
| `truncated` | `boolean` | The host listed only part of the artifacts: adds 「部分产物未列出」. |

`*` 必填。原生 DOM 属性（如 `onClick`、`aria-*`）未列出。

### `AttachmentList`

*component* — Attachment and reference chips (atlas 17), `role="list"`. Every card has a fixed size, so progress and status changes never move neighbours. Names are ellipsised with the full name in `title` and in the accessible text; size uses `useAgentFormat().bytes`. Thumbnails are drawn only for `kind: 'image'` with a `data:image/`, `blob:` or same-origin URL (anything else falls back to the icon). Statuses are text + glyph: 正在上传 (Progress when the fraction is known, else Spinner), 上传失败 (+ retry), 引用已失效, 不可用. Motion: none beyond the Progress / Spinner primitives (reduced-motion aware).

| Prop | Type | Description |
| --- | --- | --- |
| `aria-label` | `string` |  |
| `attachments` | `readonly AttachmentView[]` |  |
| `className` | `string` |  |
| `disabled` | `boolean` | Blocks remove / retry (e.g. while sending). |
| `onRemove` | `((item: { type: "attachment"; attachment: AttachmentView; } \| { type: "reference"; reference: ReferenceView; }) => void)` | Removes the UI reference only; deleting remote files is the adapter's decision. No callback → no button. |
| `onRetry` | `((attachment: AttachmentView) => void)` | Retry a failed upload. No callback → no retry button. |
| `references` | `readonly ReferenceView[]` |  |
| `renderPreview` | `((attachment: AttachmentView) => React.ReactNode)` | Custom preview for an attachment (replaces icon / thumbnail). |

`*` 必填。原生 DOM 属性（如 `onClick`、`aria-*`）未列出。

### `ChunkPager`

*component* — ChunkPager: an honest view of one page of stored material (old file content, manifests, patches, terminal output). The header says which range is shown — 「字节 0–4096 / 18200」 or 「第 1–200 行 / 812」 (line and item offsets are 0-based in the contract and shown 1-based) — and whether this page reaches the end (「已读至末尾」) or is a fragment (「片段」).

| Prop | Type | Description |
| --- | --- | --- |
| `canGoBack` * | `boolean` | A previous page exists in the host's offset history (drives 「上一页」). |
| `label` * | `string` | Name of the material (「终端输出」, 「旧文件内容」); names the group and the scroll region. |
| `newer` | `boolean` | Newer material exists than this snapshot. |
| `onFirst` | `(() => void)` | Back to offset 0. Enabled when the page does not start at 0. |
| `onNext` | `((nextOffset: number) => void)` | Next page. Enabled only when `page.nextOffset` is defined (never computed here). |
| `onPrevious` | `(() => void)` |  |
| `onReadLatest` | `(() => void)` | Drops back to the newest snapshot; draws 「读取最新」 next to the `newer` notice. |
| `onRetry` | `(() => void)` | Retries a page that failed to load. |
| `page` * | `MaterialPageView` |  |
| `renderContent` | `((text: string) => React.ReactNode)` | Custom renderer of the page text (highlighting); default is wrapped monospace text. |

`*` 必填。原生 DOM 属性（如 `onClick`、`aria-*`）未列出。

### `CitationChip`

*component*

| Prop | Type | Description |
| --- | --- | --- |
| `citation` * | `CitationView` |  |
| `icon` | `React.ReactNode` | Custom icon content (SVG inner nodes); wins over the built-in source-type icon. |
| `label` | `React.ReactNode` | Visible text instead of "[n]" (e.g. a short file name). |
| `onOpen` | `((citation: CitationView) => void)` |  |
| `selected` | `boolean` |  |
| `showIcon` | `boolean` | Show the source-type icon before the index. |

`*` 必填。原生 DOM 属性（如 `onClick`、`aria-*`）未列出。

### `CodeBlock`

*component*

| Prop | Type | Description |
| --- | --- | --- |
| `children` | `React.ReactNode` | Replaces the plain `<code>` content (e.g. host-highlighted tokens). The copy text stays `code`. |
| `code` * | `string` |  |
| `copyLabel` | `string` | Copy-button name override. |
| `copyable` | `boolean` | `false` hides the copy button. Default: shown when a copy path exists. |
| `filename` | `string` |  |
| `language` | `string` |  |
| `maxHeight` | `string` | CSS length; taller code scrolls vertically inside the block. |
| `onCopy` | `CopyHandler` |  |
| `showLineNumbers` | `boolean` | Show a line-number gutter (decorative, not copied). |

`*` 必填。原生 DOM 属性（如 `onClick`、`aria-*`）未列出。

### `CodeModeToolTree`

*component*

| Prop | Type | Description |
| --- | --- | --- |
| `defaultExpandedIds` | `readonly string[]` |  |
| `detailActions` | `ToolDetailActions` | Callbacks for the built-in detail views (read more, reload, open terminal…). |
| `detailsErrors` | `Readonly<Record<string, React.ReactNode>>` |  |
| `expandedIds` | `readonly string[]` |  |
| `label` | `string` | Tree name; defaults to the root's display name. |
| `onExpandedChange` | `((ids: string[]) => void)` |  |
| `onLoadDetails` | `((id: string) => void)` | Called when the row opens and `tool.detailsLoaded === false`, and on retry. |
| `onViewScript` | `((tool: ToolCallView) => void)` | Open the full script of a truncated parent. |
| `renderDetail` | `((tool: ToolCallView) => React.ReactNode \| undefined)` | Override the detail body. Return `undefined` to fall back to the built-in view. |
| `renderTool` | `((tool: ToolCallView, depth: number) => React.ReactNode \| undefined)` | Replace a node's row. Return `undefined` to use ToolRecord. |
| `root` | `ToolCallView` |  |
| `tools` | `readonly ToolCallView[]` |  |

`*` 必填。原生 DOM 属性（如 `onClick`、`aria-*`）未列出。

### `CompactionNotice`

*component* — CompactionNotice (Wpi context compaction bar): a strip in the message flow for one context compaction. Running: AgentSpark (executing rhythm) + 「正在整理上下文」 + elapsed + cancel. Completed: token delta 「32K → 12K token」 and an optional summary disclosure (Collapsible). `phase` adds a sub-label while running (「准备中」 / 「正在生成摘要」 / 「正在保存结果」). Failed and interrupted (the run stopped before the compaction settled; the old context is kept) show `retryHint`, default 「可输入 /compact 重试」. Save pending: 「重试保存」. The title is a polite status, so the transition to a settled state is announced once.

| Prop | Type | Description |
| --- | --- | --- |
| `busy` | `boolean` | Busy flag for the buttons while an action is being submitted. |
| `elapsedMs` | `number` | Elapsed time of a running compaction (the host updates it; nothing polls here). |
| `messages` | `WorkspaceMessagesProp` |  |
| `onCancel` | `AgentActionHandler` | Cancels a running compaction. |
| `onRetrySave` | `AgentActionHandler` | Retries saving the result (`save-pending`). |
| `onSummaryOpenChange` | `((open: boolean) => void)` |  |
| `phase` | `CompactionPhase` | Sub-step of a running compaction, shown as a sub-label. |
| `renderMarkdown` | `((source: string) => React.ReactNode)` |  |
| `retryHint` | `React.ReactNode` | Hint after a failed / interrupted compaction; default 「可输入 /compact 重试」. `null` hides it. |
| `status` * | `CompactionStatus` |  |
| `summaryOpen` | `boolean` | Summary disclosure (controlled). |
| `summary` | `string` | Text of the compaction summary (plain text, or markdown through `renderMarkdown`). |
| `tokensAfter` | `number` |  |
| `tokensBefore` | `number` |  |

`*` 必填。原生 DOM 属性（如 `onClick`、`aria-*`）未列出。

### `Composer`

*component* — Full agent input frame (atlas 14): intervention slot, attachment / reference row, the token-mirror textarea, `@` / `/` menus, toolbar slots, the send / stop button and a feedback line.

| Prop | Type | Description |
| --- | --- | --- |
| `allowEmptyText` | `boolean` | Allow sending when the text is empty if at least one attachment or reference exists. |
| `aria-label` | `string` |  |
| `attachments` | `readonly AttachmentView[]` |  |
| `blocked` | `string \| boolean` | Input blocked by a pending intervention (e.g. a questionnaire): the textarea becomes read-only and `aria-disabled`, the reason replaces the placeholder and shows in the feedback line. `true` uses the default copy ("请先在上方回答问题"). |
| `canSend` | `boolean` | Extra condition for sending (e.g. a model must be selected), with its reason. |
| `className` | `string` |  |
| `commandLoading` | `boolean` |  |
| `commandOptions` | `readonly CommandOption[]` | Enables the `/` menu (commands first, then skills). Filtered locally unless `onCommandQuery` is given. |
| `defaultValue` | `string` |  |
| `disabledReason` | `string` | Why the composer is disabled (feedback line). |
| `disabled` | `boolean` |  |
| `draftStatus` | `DraftStatus` |  |
| `feedback` | `React.ReactNode` | Extra feedback content after the status text. |
| `id` | `string` |  |
| `intervention` | `React.ReactNode` | Approval / questionnaire cards docked above the frame (height animates via grid rows). |
| `maxLength` | `number` | Shows a character counter and blocks sending above the limit (code points of the plain text). |
| `mentionError` | `React.ReactNode` |  |
| `mentionLoading` | `boolean` |  |
| `mentionOptions` | `readonly MentionOption[]` | Enables the `@` menu. Filtered locally unless `onMentionQuery` is given (then the host filters). |
| `mentionTokenName` | `((option: MentionOption, query: string) => string)` | Token text for a chosen option (default: drilled folder + label). |
| `menuSide` | `"top" \| "bottom"` | Side the menus open on. |
| `onCommandQuery` | `((query: string \| null) => void)` |  |
| `onCommand` | `((option: CommandOption, match: TriggerMatch) => "insert" \| void)` | A command or skill was chosen. Return `'insert'` to replace the typed `/query` with a token; otherwise the typed query is removed and the host dispatches its own action. |
| `onDisabledCommand` | `((option: CommandOption, match: TriggerMatch) => "consume" \| void)` | A disabled command was chosen: nothing is dispatched; its reason shows in the feedback line. |
| `onFilesDrop` | `((files: File[]) => void)` | Files dropped on the frame (drag-over highlight while dragging). No callback → no drop zone. |
| `onFilesPaste` | `((files: File[]) => void)` | Files pasted into the textarea. Text paste is untouched. |
| `onMentionDrill` | `((option: MentionOption) => void)` | A folder was drilled into (the query is already rewritten to `folder/`). |
| `onMentionQuery` | `((query: string \| null) => void)` | Query typed after `@` while the menu is open; `null` when it closes. |
| `onMentionRetry` | `(() => void)` |  |
| `onReferenceAdd` | `((option: MentionOption, tokenName: string) => void)` | A mention was inserted as a token: bind the reference. |
| `onRemoveAttachment` | `((attachment: AttachmentView) => void)` |  |
| `onRemoveReference` | `((reference: ReferenceView) => void)` |  |
| `onRetryAction` | `((kind: "send" \| "stop", actionId: string \| undefined) => void)` | Retry an `unknown` send / stop with its original actionId (ADR-0011 §4). |
| `onRetryAttachment` | `((attachment: AttachmentView) => void)` |  |
| `onRetryDraftSave` | `(() => void)` |  |
| `onRetryPersistence` | `(() => void)` |  |
| `onStop` | `(() => void)` |  |
| `onSubmit` | `((input: SendInput) => void)` | Receives the plain text (`@name` / `/name`), the raw value with markers, references and attachments. |
| `onTokenRemoved` | `((token: ComposerToken) => void)` | A token disappeared from the text (whole-token delete, cut, overwrite): unbind its reference. |
| `onValueChange` | `((value: string) => void)` |  |
| `persistence` | `"idle" \| DraftStatus` |  |
| `placeholder` | `string` |  |
| `readOnly` | `boolean` |  |
| `references` | `readonly ReferenceView[]` |  |
| `replacement` | `React.ReactNode` | Rendered instead of the input frame, menus and feedback line, e.g. a `ComposerNotice` for a sub-agent, archived or inherited thread. The `intervention` slot stays above it, so approvals and questions still dock. The draft value is kept and comes back when `replacement` is removed. |
| `retryBusy` | `boolean` |  |
| `runStatus` | `RunStatus` |  |
| `sendDisabledReason` | `string` |  |
| `showCount` | `boolean` | Show the counter without a limit. |
| `slash` | `"line-start" \| "word-start"` |  |
| `stopStatus` | `ActionReceipt \| ActionStatus` |  |
| `submitOn` | `"enter" \| "mod-enter"` |  |
| `submitStatus` | `ActionReceipt \| ActionStatus` | Receipt of the last send. `submitting` / `unknown` block Enter and the button (no duplicates). |
| `tokenKind` | `((token: ComposerToken) => ComposerTokenKind)` |  |
| `toolbarEnd` | `React.ReactNode` | Toolbar end before the send button (ModelPicker, PermissionPicker, context ring). |
| `toolbarStart` | `React.ReactNode` | Toolbar start (e.g. a "+" Menu: 添加图片 / 引用文件 / 使用技能). |
| `value` | `string` |  |

`*` 必填。原生 DOM 属性（如 `onClick`、`aria-*`）未列出。

### `ComposerInput`

*component* — Token-mirror textarea (ADR-0011 §8). A real `<textarea>` sits on top with a transparent background and owns typing, IME, selection, undo and accessibility; an `aria-hidden` mirror underneath renders the same value with identical typography, where tokens (`U+2068 trigger name U+2069`) get a tinted background drawn only with background and box-shadow, so glyph positions match the textarea exactly.

| Prop | Type | Description |
| --- | --- | --- |
| `className` | `string` | Class on the wrapper. |
| `defaultValue` | `string` |  |
| `hint` | `React.ReactNode` | Screen-reader hint linked via aria-describedby; `false` removes it. |
| `inputClassName` | `string` | Class on the textarea. |
| `onMenuKey` | `((event: React.KeyboardEvent<HTMLTextAreaElement>) => boolean)` | Called for every key outside IME composition, before token deletion and submit. Return `true` when the key was consumed (menu navigation): the default action is prevented. |
| `onSubmit` | `(() => void)` | Enter (or Mod+Enter with `submitOn="mod-enter"`) outside IME composition. Without it Enter inserts a newline. |
| `onTokenRemoved` | `((token: ComposerToken) => void)` | A token disappeared from the text through a user edit (whole-token delete, cut, overwrite). |
| `onTriggerChange` | `((match: TriggerMatch \| null) => void)` | Active `@` / `/` trigger before the caret; `null` when none. Not called during IME composition. |
| `onValueChange` | `((value: string, caret: number) => void)` | Every edit (typing, IME, paste, cut, token insert / delete). `caret` is the new selection end. |
| `slash` | `"line-start" \| "word-start"` |  |
| `submitOn` | `"enter" \| "mod-enter"` |  |
| `tokenKind` | `((token: ComposerToken) => ComposerTokenKind)` | Mirror colour per token (default: `@` → file, `/` → command). |
| `triggers` | `readonly TriggerChar[]` | Triggers to detect (default both). |
| `value` | `string` |  |

`*` 必填。原生 DOM 属性（如 `onClick`、`aria-*`）未列出。

### `ComposerNotice`

*component*

| Prop | Type | Description |
| --- | --- | --- |
| `actions` | `readonly ComposerNoticeAction[]` |  |
| `busyActionIds` | `readonly string[]` | Ids of actions currently running (button shows busy). |
| `icon` | `AgentIconName \| null` | Replace the tone icon; `null` hides it. |
| `live` | `"off" \| "polite"` | `polite` announces the message when it appears. Default `off`. |
| `message` * | `React.ReactNode` |  |
| `onAction` | `((id: string) => void)` |  |
| `tone` | `ComposerNoticeTone` | Default `info`. |

`*` 必填。原生 DOM 属性（如 `onClick`、`aria-*`）未列出。

### `ContextUsage`

*component* — ContextUsage (atlas 27): context / token budget. A percentage — the ring arc, the Meter — is drawn only when `usagePercent` returns a number (exact or estimated value with a reliable max); unknown or partial data shows text without a `role="meter"`. Non-exact numbers always carry 「估计值」 / 「部分数据」. Near (≥ 80%) and over the limit add a warning sentence, not only colour. `usage.stats` (cache hit rate, TTFT, TPS…) render in the full view and the popover as one `<dl>` per section; a missing value shows 「—」 (read as 「无数据」), never 0.

| Prop | Type | Description |
| --- | --- | --- |
| `align` | `PopoverAlign` |  |
| `messages` | `WorkspaceMessagesProp` |  |
| `onOpenChange` | `((open: boolean) => void)` |  |
| `openOnHover` | `boolean` | `ring`: also open the Popover on hover (focus and click still open it). |
| `open` | `boolean` |  |
| `segmentScale` | `"full" \| "fit-used"` |  |
| `side` | `PopoverSide` | Popover placement for `ring`. |
| `usage` * | `ContextUsageView` |  |
| `variant` | `ContextUsageVariant` | `ring`: compact trigger (ring + 「12.4K / 32K」) that opens the full view in a Popover. `bar`: one line with a meter. `full`: meter, breakdown legend, warnings and note. |

`*` 必填。原生 DOM 属性（如 `onClick`、`aria-*`）未列出。

### `ConversationList`

*component*

| Prop | Type | Description |
| --- | --- | --- |
| `collapsedGroups` | `readonly string[]` |  |
| `collapsibleGroups` | `boolean` |  |
| `empty` | `React.ReactNode` | Empty state shown when there are no conversations and no search. |
| `error` | `React.ReactNode` | Error message; `true` uses the default copy. |
| `headingLevel` | `2 \| 3 \| 4 \| 5 \| 6` | Level of the group headings (and the empty-state title). |
| `isDisabled` | `((item: ConversationView) => boolean)` | Rows that cannot be selected or acted on (e.g. while a switch is pending). |
| `label` | `string` | Accessible name of the list region. |
| `loading` | `boolean` |  |
| `now` | `Date` | Reference time for row timestamps (default: now). |
| `onArchive` | `((item: ConversationView) => void)` |  |
| `onCollapsedGroupsChange` | `((groups: string[]) => void)` |  |
| `onDelete` | `((item: ConversationView) => void \| Promise<unknown>)` |  |
| `onPin` | `((item: ConversationView, pinned: boolean) => void)` |  |
| `onRetry` | `(() => void)` |  |
| `onSearchChange` | `((query: string) => void)` | Renders the search input. |
| `onSelect` | `((id: string) => void)` |  |
| `onUnarchive` | `((item: ConversationView) => void)` |  |
| `renderActions` | `((item: ConversationView) => React.ReactNode)` | Extra controls per row (rendered before the "more" menu). |
| `search` | `string` | Controlled search query; the host filters `sections`. |
| `sections` * | `ConversationSection[]` |  |
| `selectedId` | `string` |  |
| `skeletonRows` | `number` | Number of skeleton rows while loading. |

`*` 必填。原生 DOM 属性（如 `onClick`、`aria-*`）未列出。

### `ConversationRow`

*component*

| Prop | Type | Description |
| --- | --- | --- |
| `actions` | `React.ReactNode` | Extra controls next to the "more" button. |
| `disabled` | `boolean` |  |
| `item` * | `ConversationView` |  |
| `now` | `Date` | Reference time for the today / earlier format (default: now). |
| `onArchive` | `((item: ConversationView) => void)` |  |
| `onDelete` | `((item: ConversationView) => void \| Promise<unknown>)` | Confirmed delete. Return a Promise to keep the dialog open until it settles. |
| `onPin` | `((item: ConversationView, pinned: boolean) => void)` | Toggle pin; receives the requested state. |
| `onSelect` | `((id: string) => void)` |  |
| `onUnarchive` | `((item: ConversationView) => void)` |  |
| `selected` | `boolean` |  |

`*` 必填。原生 DOM 属性（如 `onClick`、`aria-*`）未列出。

### `DiffPreview`

*component*

| Prop | Type | Description |
| --- | --- | --- |
| `after` | `string` |  |
| `before` | `string` | Convenience: compute a preview diff from two strings (ignored when `diff` is given). |
| `diff` | `FileDiffView` |  |
| `hideHeader` | `boolean` | Hide the header (when an outer disclosure already shows it). |
| `onReload` | `(() => void)` | Re-read the latest file (shown on conflict). |
| `onViewFull` | `(() => void)` | Open the full diff (shown when the diff is truncated). |
| `path` | `string` | Path for the `before` / `after` form. |
| `status` | `"unavailable" \| "preview" \| "proposed" \| "applied" \| "conflict"` | Status for the `before` / `after` form (defaults to `preview`). |

`*` 必填。原生 DOM 属性（如 `onClick`、`aria-*`）未列出。

### `DiffStats`

*component* — `+N −M` with a spoken label.

| Prop | Type | Description |
| --- | --- | --- |
| `additions` * | `number` |  |
| `deletions` * | `number` |  |

`*` 必填。原生 DOM 属性（如 `onClick`、`aria-*`）未列出。

### `DiffStatusPill`

*component*

| Prop | Type | Description |
| --- | --- | --- |
| `status` * | `NonNullable<"unavailable" \| "preview" \| "proposed" \| "applied" \| "conflict" \| undefined>` |  |

`*` 必填。原生 DOM 属性（如 `onClick`、`aria-*`）未列出。

### `EditFileDetail`

*component* — EditFileDetail (atlas 39): every edit as 「编辑 N」 with range, strategy and a before/after diff.

| Prop | Type | Description |
| --- | --- | --- |
| `detail` * | `{ kind: "file-edit"; path: string; edits: { id: string; range?: ReadRangeView; before: string; after: string; strategy?: string; truncated?: boolean; }[]; expectedVersion?: string; materialReady?: boolean; replacementCount?: number; page?: MaterialPageView; complete?: boolean; }` |  |
| `display` | `"diff" \| "verbatim"` |  |
| `pageActions` | `ChunkPagerActions` |  |

`*` 必填。原生 DOM 属性（如 `onClick`、`aria-*`）未列出。

### `ErrorRecoveryNotice`

*component*

| Prop | Type | Description |
| --- | --- | --- |
| `announce` | `boolean` | Announce danger notices with `role="alert"`. Pass `false` for notices restored from history. |
| `busyActionIds` | `readonly string[]` | Ids of actions currently running (button shows busy). |
| `onAction` | `((actionId: string) => void)` |  |
| `onDismiss` | `(() => void)` | Resolved notices only. |
| `recovery` * | `RecoveryView` |  |

`*` 必填。原生 DOM 属性（如 `onClick`、`aria-*`）未列出。

### `FilePreview`

*component* — FilePreview (atlas 30): read-only preview of a file the adapter loaded. Tabs (`@wzrhine/react`, arrow keys) switch preview / raw / metadata; text is real, selectable text in its own focusable scroll region, with decorative line numbers that are not copied. Images get their `alt` and a zoom group (`zoomLevels`, default 25–400% of the natural width, plus 「适应宽度」) inside a scroll container. Binary and unknown kinds say 「无法预览此类型」 and offer 「在外部打开」. Partial loads say how much is loaded and offer 「加载更多」; a changed file keeps the old content with 「文件已更新」 + 「重新加载」, and `onReload` is also always offered as 「重新读取」.

| Prop | Type | Description |
| --- | --- | --- |
| `breadcrumbRoot` | `string` | Workspace root. Paths under it show as a workspace-relative breadcrumb (root name first); paths outside it get the 「外部」 badge. |
| `copyable` | `boolean` | Copy the loaded text. Default true for text-like files. |
| `defaultMode` | `FilePreviewMode` |  |
| `defaultOpenTarget` | `string` | Target used by the primary half of the split button; default the first `app` target. |
| `defaultZoom` | `FilePreviewZoom` | Initial image zoom; default `fit`. |
| `file` * | `FilePreviewView` |  |
| `headingLevel` | `HeadingLevel` |  |
| `messages` | `WorkspaceMessagesProp` |  |
| `mode` | `FilePreviewMode` | Active tab (controlled). |
| `onClose` | `(() => void)` |  |
| `onCopyPath` | `((path: string, file: FilePreviewView) => void \| Promise<void>)` | Copies `file.path` (menu item 「复制路径」); default writes it to the clipboard. |
| `onLoadMore` | `(() => void)` | Loads the next chunk of a partially loaded file. |
| `onModeChange` | `((mode: FilePreviewMode) => void)` |  |
| `onOpenExternal` | `((file: FilePreviewView) => void)` |  |
| `onOpenWith` | `((targetId: string, file: FilePreviewView) => void)` |  |
| `onReference` | `((file: FilePreviewView) => void)` | Adds the file as a reference to the conversation. |
| `onReload` | `(() => void)` |  |
| `onRetry` | `(() => void)` |  |
| `openTargets` | `FileOpenTarget[]` | Ways to open the file. With `onOpenWith` they render a split button + menu. |
| `referenceDisabled` | `boolean` |  |
| `reloading` | `boolean` |  |
| `renderCode` | `((code: string, language?: string) => React.ReactNode)` | Code renderer (highlighting); default is numbered plain lines. |
| `renderMarkdown` | `((source: string) => React.ReactNode)` | Markdown renderer for the preview tab; default shows the source. |
| `zoomLevels` | `number[]` | Image zoom percentages (of the natural width); a 「适应宽度」 option is always added. |

`*` 必填。原生 DOM 属性（如 `onClick`、`aria-*`）未列出。

### `FilePreviewTabs`

*component* — FilePreviewTabs: a strip of open files above one preview panel. ARIA tabs with a roving tabIndex: ←/→ move to the neighbour and activate it (wrapping), Home / End jump to the ends; Delete / Backspace close the focused tab; Escape anywhere in the strip calls `onCloseAll`. A middle click (`auxclick`, button 1) closes a tab. Each tab has its own close button named 「关闭 name」 (not inside the tab, so the tab keeps a plain name).

| Prop | Type | Description |
| --- | --- | --- |
| `activeId` * | `string` | The open tab (controlled). |
| `messages` | `WorkspaceMessagesProp` |  |
| `onActivate` * | `(id: string) => void` |  |
| `onCloseAll` | `(() => void)` | Closes every file; Escape inside the strip and the trailing close button call it. |
| `onCloseTab` * | `(id: string) => void` |  |
| `renderPanel` * | `(id: string) => React.ReactNode` | Panel content of the active tab (usually a `FilePreview`). |
| `returnFocusRef` | `React.RefObject<HTMLElement \| null>` | Focus target after the last tab closes (the element that opened the preview). |
| `tabs` * | `FilePreviewTab[]` |  |

`*` 必填。原生 DOM 属性（如 `onClick`、`aria-*`）未列出。

### `FileReadDetail`

*component* — FileReadDetail (atlas 37): path, range, preview with line numbers from `range.start`, real result info.

| Prop | Type | Description |
| --- | --- | --- |
| `detail` * | `{ kind: "file-read"; path: string; range?: ReadRangeView; preview?: string; eof?: boolean; nextOffset?: number; totalLines?: number; bytes?: number; version?: string; nextOffsetUnit?: "lines" \| "bytes"; error?: "not-found" \| "forbidden" \| "error"; }` |  |
| `onReadMore` | `((nextOffset: number) => void)` | Continue reading from the runtime-provided `nextOffset`. Rendered only when `nextOffset` exists. |

`*` 必填。原生 DOM 属性（如 `onClick`、`aria-*`）未列出。

### `FileWriteDetail`

*component* — FileWriteDetail (atlas 38): target, write mode, expected vs current version, proposal diff.

| Prop | Type | Description |
| --- | --- | --- |
| `beforeActions` | `ChunkPagerActions` |  |
| `detail` * | `{ kind: "file-write"; path: string; mode: "create" \| "overwrite" \| "append"; diff?: FileDiffView; expectedVersion?: string; currentVersion?: string; materialReady?: boolean; }` |  |
| `display` | `"diff" \| "verbatim"` |  |
| `onReload` | `(() => void)` |  |
| `onViewFull` | `(() => void)` |  |

`*` 必填。原生 DOM 属性（如 `onClick`、`aria-*`）未列出。

### `GenericToolDetail`

*component* — GenericToolDetail: any tool without a special view — input JSON + output.

| Prop | Type | Description |
| --- | --- | --- |
| `detail` * | `{ kind: "generic"; input?: unknown; output?: ToolOutputView; }` |  |
| `outputProps` | `Pick<ToolOutputProps, "onLoadMore" \| "onOpenFull" \| "loadingMore" \| "onCopyText">` |  |

`*` 必填。原生 DOM 属性（如 `onClick`、`aria-*`）未列出。

### `GrantList`

*component*

| Prop | Type | Description |
| --- | --- | --- |
| `addSlot` | `React.ReactNode` | Host-provided chooser for adding a grant, shown in the header. |
| `empty` | `React.ReactNode` | Text when there are no grants (default from messages). |
| `error` | `React.ReactNode` | Load failure text; shows an Alert (with 「重新读取」 when `onRetry` is given). |
| `footerNote` | `React.ReactNode` | Note under the list, e.g. what revoking does. |
| `grants` * | `readonly GrantView[]` |  |
| `headingLevel` | `2 \| 3 \| 4` | Title element level. Default 3. |
| `loading` | `boolean` |  |
| `onReselect` | `((grant: GrantView) => void)` | Unavailable grants: let the host re-select the target. |
| `onRetry` | `(() => void)` |  |
| `onRevoke` | `AgentActionHandler<[GrantView, AgentActionContext]>` | Revoke one grant. Without it no revoke button is rendered. |
| `title` | `React.ReactNode` | Heading (default from messages: 「会话授权」). |

`*` 必填。原生 DOM 属性（如 `onClick`、`aria-*`）未列出。

### `InterventionDock`

*component*

| Prop | Type | Description |
| --- | --- | --- |
| `animateInitial` | `boolean` | Animate cards already present on the first render. Default false (restored state). |
| `label` | `string` | Accessible name of the region. |
| `moreCount` | `number` | Number of further pending interventions not shown. |

`*` 必填。原生 DOM 属性（如 `onClick`、`aria-*`）未列出。

### `JumpToLatest`

*component*

| Prop | Type | Description |
| --- | --- | --- |
| `atLatest` * | `boolean` | At the newest content: the button is hidden. |
| `label` | `string` |  |
| `loading` | `boolean` |  |
| `onJump` * | `() => void` |  |
| `unreadCount` | `number` |  |

`*` 必填。原生 DOM 属性（如 `onClick`、`aria-*`）未列出。

### `ManageFilesDetail`

*component* — ManageFilesDetail (atlas 41): operation table; delete rows carry 「不能自动恢复」 in text.

| Prop | Type | Description |
| --- | --- | --- |
| `detail` * | `{ kind: "manage-files"; operations: { id: string; type: "mkdir" \| "move" \| "copy" \| "rename" \| "delete"; source: string; target?: string; recursive?: boolean; status?: "pending" \| "completed" \| "failed" \| "conflict"; reason?: string; }[]; hasMore?: boolean; materialReady?: boolean; counts?: Partial<Record<"mkdir" \| "move" \| "copy" \| "rename" \| "delete", number>>; total?: number; page?: MaterialPageView; }` |  |
| `loadingMore` | `boolean` |  |
| `onLoadMore` | `(() => void)` |  |
| `pageActions` | `ChunkPagerActions` |  |

`*` 必填。原生 DOM 属性（如 `onClick`、`aria-*`）未列出。

### `MCPExecuteDetail`

*component* — MCPExecuteDetail (atlas 43): server, tool, endpoint, catalog revision, full arguments, remote status.

| Prop | Type | Description |
| --- | --- | --- |
| `detail` * | `{ kind: "mcp"; server: string; tool: string; endpoint?: string; catalogRevision?: string; catalogStale?: boolean; arguments?: unknown; output?: ToolOutputView; remote?: "pending" \| "completed" \| "failed" \| "unknown"; }` |  |
| `onReconcile` | `(() => void)` | Ask the adapter to reconcile an unknown remote result. Shown only for `remote: 'unknown'`. |
| `outputProps` | `Pick<ToolOutputProps, "onLoadMore" \| "onOpenFull" \| "loadingMore" \| "onCopyText">` |  |

`*` 必填。原生 DOM 属性（如 `onClick`、`aria-*`）未列出。

### `MentionMenu`

*component* — `@` file / context picker (atlas 15). A listbox panel anchored above the composer; focus stays in the textarea (`aria-activedescendant`). Groups are `role="group"` with a visible heading, matches are `<mark>`ed, the path is dimmed, folders can be drilled into (Tab / Enter → the query becomes `name/`), disabled options stay reachable so their reason is read out.

| Prop | Type | Description |
| --- | --- | --- |
| `activeIndex` * | `number` |  |
| `className` | `string` |  |
| `error` | `React.ReactNode` | Error text; shown with a retry button when `onRetry` is given. |
| `id` | `string` | Base id; the listbox is `${id}-listbox`, options `${id}-listbox-option-${index}`. |
| `loading` | `boolean` |  |
| `onActiveIndexChange` * | `(index: number) => void` |  |
| `onDrill` | `((option: MentionOption) => void)` | Click on a drillable folder. Without it folders are inserted like files. |
| `onRetry` | `(() => void)` |  |
| `onSelect` * | `(option: MentionOption) => void` | Click on an enabled option (keyboard selection goes through the owning Composer). |
| `open` * | `boolean` |  |
| `options` * | `readonly MentionOption[]` | Options in display order (the host filters them for `query`). |
| `query` * | `string` | Text typed after `@` (may contain a drilled folder prefix, `src/comp`). |
| `side` | `"inline" \| "top" \| "bottom"` | `top` / `bottom` = absolutely positioned against the composer; `inline` = in normal flow (standalone use). |
| `title` | `React.ReactNode` |  |

`*` 必填。原生 DOM 属性（如 `onClick`、`aria-*`）未列出。

### `MessageActions`

*component*

| Prop | Type | Description |
| --- | --- | --- |
| `capabilities` | `Partial<Record<MessageActionKey, CapabilityInput>>` | Availability per action; a disabled one is shown `aria-disabled` with its reason. |
| `children` | `React.ReactNode` | Extra trailing buttons (rendered inside the toolbar, part of the roving order). |
| `copyText` | `string` | Text copied by the copy action; omit to hide copy. |
| `feedback` | `MessageFeedback \| null` |  |
| `label` | `string` | Toolbar name; defaults to the copy table. |
| `onCopy` | `CopyHandler` |  |
| `onEdit` | `(() => void)` |  |
| `onFeedback` | `((value: MessageFeedback \| null) => void)` |  |
| `onFork` | `(() => void)` |  |
| `onRegenerate` | `(() => void)` |  |
| `onRestoreInput` | `(() => void)` | Restore this turn's input into the composer (not the same as `onEdit`). |
| `order` | `MessageActionKey[]` | Preferred action order; omitted uses the library order. |

`*` 必填。原生 DOM 属性（如 `onClick`、`aria-*`）未列出。

### `MessageErrorNotice`

*component* — Error part: a static callout-style notice (not a live region; the message status announces).

| Prop | Type | Description |
| --- | --- | --- |
| `error` * | `RecoveryView` |  |
| `onAction` | `((errorId: string, actionId: string) => void)` |  |

`*` 必填。原生 DOM 属性（如 `onClick`、`aria-*`）未列出。

### `MessageList`

*component*

| Prop | Type | Description |
| --- | --- | --- |
| `animateEntrance` | `boolean` | Turn off entrance motion for appended messages. |
| `earlierError` | `React.ReactNode` | Error text for the last earlier-load attempt; shows a retry button. |
| `empty` | `React.ReactNode` | Replaces the default empty state. |
| `followThreshold` | `number` |  |
| `footer` | `React.ReactNode` | Content after the last message inside the scroller (run summary, typing line). |
| `hasEarlier` | `boolean` |  |
| `holdFollow` | `boolean` | Pause auto-follow while true (content still renders); resumes on release if still at the latest. |
| `isStreaming` | `boolean` |  |
| `jumpThreshold` | `number` |  |
| `label` | `string` | Accessible name of the viewport. |
| `loadingEarlier` | `boolean` |  |
| `loading` | `boolean` | First load: no messages yet. |
| `messageProps` | `Omit<AgentMessageProps, "message">` | Props forwarded to the default AgentMessage (handlers, renderers). |
| `messages` * | `MessageView[]` |  |
| `nestedScrollSelector` | `string` |  |
| `onFollowChange` | `((following: boolean) => void)` |  |
| `onLoadEarlier` | `(() => void)` |  |
| `renderMessage` | `((message: MessageView, index: number) => React.ReactNode)` | Custom rendering per message; the list still wraps it in a keyed `<li data-message-id>`. |

`*` 必填。原生 DOM 属性（如 `onClick`、`aria-*`）未列出。

### `MessagePart`

*component*

| Prop | Type | Description |
| --- | --- | --- |
| `onCopy` | `CopyHandler` |  |
| `onOpenCitation` | `((citation: CitationView) => void)` |  |
| `onOpenThinking` | `((thinkingId: string) => void)` |  |
| `onRecoveryAction` | `((errorId: string, actionId: string) => void)` | Error part actions: `(errorId, actionId)`. Without it the action buttons are not rendered. |
| `part` * | `MessagePartView` |  |
| `renderArtifact` | `ArtifactRenderer` |  |
| `renderTool` | `ToolRenderer` |  |
| `renderers` | `MessagePartRenderers` |  |

`*` 必填。原生 DOM 属性（如 `onClick`、`aria-*`）未列出。

### `ModelPicker`

*component* — Model and reasoning-effort picker (atlas 19). A trigger button (model label + effort, truncated) opens a Popover with two layers: - effort layer: current model with a 切换模型 drill button and a RadioGroup of the model's efforts (arrow keys move and select); - model layer: providers as labelled groups (a disabled provider shows its reason), model buttons with capability tags; unavailable models are `aria-disabled` with the reason as their description; the selected one has `aria-current` and a check. ↑ / ↓ move between models.

| Prop | Type | Description |
| --- | --- | --- |
| `align` | `"end" \| "start" \| "center"` |  |
| `className` | `string` |  |
| `defaultLayer` | `"effort" \| "models"` | Initial layer when the popover opens. |
| `defaultOpen` | `boolean` |  |
| `disabled` | `boolean` |  |
| `effortLabels` | `Record<string, string>` | Component-level effort labels (ADR-0009 priority: prop > option label > `composer.effort` message table > raw id). Add labels here for effort ids outside the built-in set. |
| `effortState` | `"default" \| "unset" \| "invalid"` |  |
| `effort` | `ModelEffort \| null` | Selected effort (controlled); must be one of the model's `efforts`. |
| `error` | `React.ReactNode` | Error text for the model list (`true` → default copy). |
| `loading` | `boolean` |  |
| `onEffortChange` | `((effort: ModelEffort) => void)` |  |
| `onEffortReset` | `(() => void)` |  |
| `onModelChange` | `((modelId: string, model: ModelOptionView) => void)` |  |
| `onOpenChange` | `((open: boolean) => void)` |  |
| `open` | `boolean` |  |
| `providers` * | `readonly ModelProviderView[]` |  |
| `selectedModel` | `string \| null` | Selected model id (controlled). |
| `side` | `"top" \| "bottom"` |  |

`*` 必填。原生 DOM 属性（如 `onClick`、`aria-*`）未列出。

### `MultiFileDiff`

*component*

| Prop | Type | Description |
| --- | --- | --- |
| `defaultExpanded` | `readonly string[]` |  |
| `expanded` | `readonly string[]` |  |
| `files` * | `readonly FileDiffView[]` |  |
| `label` | `string` | List name; defaults to 「改动的文件」. |
| `onExpandedChange` | `((paths: string[]) => void)` |  |
| `onReload` | `((path: string) => void)` |  |
| `onViewFull` | `((path: string) => void)` |  |

`*` 必填。原生 DOM 属性（如 `onClick`、`aria-*`）未列出。

### `NativeModelDetail`

*component* — NativeModelDetail (atlas 44): provider · model, purpose, inputs, params, results and save state.

| Prop | Type | Description |
| --- | --- | --- |
| `detail` * | `{ kind: "model"; provider: string; model: string; purpose?: string; inputs?: { id: string; label: string; size?: number; mimeType?: string; destination?: string; }[]; params?: Record<string, string \| number \| boolean>; results?: { id: string; label: string; preview?: string; alt?: string; saved: boolean; }[]; save?: "pending" \| "saving" \| "saved" \| "partial" \| "failed"; costNotice?: string; endpoint?: string; route?: string; timeoutMs?: number; sha256?: string; arguments?: unknown; remote?: boolean \| "pending" \| "completed" \| "failed" \| "unknown"; stopReason?: string; saveRetry?: boolean; saveError?: string; }` |  |
| `onRetrySave` | `(() => void)` | Save the generated material again (never calls the model again). Shown for partial / failed saves. |
| `retrying` | `boolean` |  |
| `running` | `boolean` | The tool call is still running: show activity without a percentage. |

`*` 必填。原生 DOM 属性（如 `onClick`、`aria-*`）未列出。

### `PermissionPicker`

*component* — Permission mode picker. Trigger (shield icon + label) opens a `@wzrhine/react` Menu with a radio group of modes (descriptions under each label). Choosing a mode with `risk: 'elevated'` does not switch: it opens an AlertDialog (role="alertdialog", focus on 取消) and `onChange` runs only on confirm. Focus returns to the trigger after the menu or the dialog closes. Elevated modes use the danger tone *and* the text "需确认" on the menu item and a warning glyph on the trigger, never colour alone. Motion: inherited from Menu / AlertDialog.

| Prop | Type | Description |
| --- | --- | --- |
| `align` | `"end" \| "start" \| "center"` |  |
| `className` | `string` |  |
| `confirmDescription` | `((mode: PermissionModeView) => React.ReactNode)` |  |
| `confirmErrorText` | `React.ReactNode` |  |
| `confirmLabel` | `((mode: PermissionModeView) => React.ReactNode)` |  |
| `confirmTitle` | `((mode: PermissionModeView) => React.ReactNode)` | Override the confirmation copy for elevated modes. |
| `disabledReason` | `string` |  |
| `disabled` | `boolean` |  |
| `error` | `React.ReactNode` |  |
| `modes` * | `readonly PermissionModeView[]` |  |
| `onChange` | `((modeId: string, mode: PermissionModeView) => void \| Promise<unknown>)` | Called with the chosen mode. Elevated modes call it only after the AlertDialog is confirmed. Return a Promise to keep the confirmation open (loading) until it settles; a rejection keeps it open with the AlertDialog error text. Without it the trigger is rendered disabled. |
| `receipt` | `React.ReactNode` |  |
| `side` | `"top" \| "bottom"` |  |
| `value` * | `string` | Current mode id (controlled). |

`*` 必填。原生 DOM 属性（如 `onClick`、`aria-*`）未列出。

### `PersistentTerminal`

*component* — PersistentTerminal (atlas 22): one terminal session with its own lifecycle. A command returning never closes the session (`idle` says so); a stop request shows 「停止尚未确认」 until the adapter confirms it; `unknown` is never shown as ended.

| Prop | Type | Description |
| --- | --- | --- |
| `headingLevel` | `HeadingLevel` |  |
| `hideName` | `boolean` | Hide the name heading (e.g. inside `TerminalTabs`, where the tab already names it). |
| `messages` | `WorkspaceMessagesProp` |  |
| `onInput` | `AgentActionHandler<[text: string, terminal: TerminalView]>` | Sends one line to the session. Without it (or when read-only) no input line is drawn. |
| `onLoadEarlier` | `AgentActionHandler<[terminal: TerminalView]>` | Loads older output (`terminal.outputTruncated`). The scroll position is kept. |
| `onLoadMoreHistory` | `AgentActionHandler<[terminal: TerminalView]>` | Loads earlier entries of `terminal.history`. |
| `onReadLatest` | `AgentActionHandler<[terminal: TerminalView]>` | Reads the newest output (`terminal.newerOutput`); draws 「有新输出，读取最新」. |
| `onStop` | `AgentActionHandler<[terminal: TerminalView]>` | Requests a stop. Drawn only when `terminal.stoppable`. Also used by 「重试停止」. |
| `page` | `MaterialPageView` | One page of stored output; replaces the live tail with a `ChunkPager`. |
| `pager` | `Partial<ChunkPagerActions>` | Paging callbacks for `page` (`canGoBack` defaults to false). |
| `terminal` * | `TerminalView` |  |

`*` 必填。原生 DOM 属性（如 `onClick`、`aria-*`）未列出。

### `PinnedSummary`

*component* — PinnedSummary (atlas 28): read-only card with the important context of a conversation. The body sits in a Collapsible (CSS height transition, interruptible, instant under reduced motion). Content updates never replay an entrance; `updating` shows a small Spinner with 「正在更新」, `stale` a warning sentence, `missing` an empty sentence. Unavailable sources stay listed but disabled, with the reason as visible text.

| Prop | Type | Description |
| --- | --- | --- |
| `defaultExpanded` | `boolean` |  |
| `expanded` | `boolean` | Body expanded (controlled). |
| `headingLevel` | `HeadingLevel` |  |
| `messages` | `WorkspaceMessagesProp` |  |
| `onExpandedChange` | `((expanded: boolean) => void)` |  |
| `onOpenSource` | `((citation: CitationView) => void)` | Opens a source. Without it sources are listed as text. |
| `onPinChange` | `((pinned: boolean) => void)` |  |
| `pinned` | `boolean` | Pin state; the pin toggle is drawn only with `onPinChange`. |
| `renderMarkdown` | `((source: string) => React.ReactNode)` | Markdown renderer for the body; default is plain text with kept line breaks. |
| `summary` * | `PinnedSummaryView` |  |

`*` 必填。原生 DOM 属性（如 `onClick`、`aria-*`）未列出。

### `QuestionnaireCard`

*component*

| Prop | Type | Description |
| --- | --- | --- |
| `advanceOnSingleChoice` | `boolean` |  |
| `disabled` | `boolean` |  |
| `draftError` | `React.ReactNode` |  |
| `initialPage` | `number` | Start on this page instead of the first unanswered question. |
| `onAnswerChange` | `((answer: QuestionAnswer) => void)` |  |
| `onCopyAnswers` | `((text: string) => void)` | Read-only summary: copy the answers as plain text (host writes the clipboard). |
| `onDiscardDraft` | `(() => void \| Promise<unknown>)` | Ended questionnaire (completed / expired / interrupted) with an unsaved draft (`draftStatus` `dirty` or `error`): drop the local draft. Confirmed through an AlertDialog. Return a Promise to keep the dialog open until the host settles. |
| `onFlush` | `((answers: QuestionAnswer[]) => void \| Promise<void>)` | Called by the `flush()` handle with the current answers. |
| `onRetrySave` | `(() => void)` | Shown with a failed draft save. |
| `onSubmit` | `AgentActionHandler<[QuestionAnswer[], AgentActionContext]>` |  |
| `questionnaire` * | `QuestionnaireView` |  |
| `renderQuestion` | `((context: QuestionRenderContext) => React.ReactNode)` | Custom question body (ADR-0013 §4). Called for every question; return `null` / `undefined` to keep the built-in body. Required for custom `kind`s beyond single / multiple / text — without it they fall back to a free-text answer. |
| `title` | `React.ReactNode` | Header title override (default: `questionnaire.title` or 「需要你的回答」). |

`*` 必填。原生 DOM 属性（如 `onClick`、`aria-*`）未列出。

### `QuestionToolDetail`

*component* — QuestionToolDetail: question count and each answer (or 「已跳过」).

| Prop | Type | Description |
| --- | --- | --- |
| `detail` * | `{ kind: "question"; questionnaireId: string; count: number; answers?: { question: string; answer?: string; skipped?: boolean; }[]; }` |  |

`*` 必填。原生 DOM 属性（如 `onClick`、`aria-*`）未列出。

### `ReferencePicker`

*component*

| Prop | Type | Description |
| --- | --- | --- |
| `anchor` | `HTMLElement \| React.RefObject<HTMLElement \| null>` |  |
| `defaultOpen` | `boolean` |  |
| `disabled` | `boolean` |  |
| `error` | `React.ReactNode` |  |
| `hasMore` | `boolean` |  |
| `hideTrigger` | `boolean` |  |
| `items` | `readonly ReferenceOption[]` |  |
| `loadingMore` | `boolean` |  |
| `loading` | `boolean` |  |
| `onAdd` * | `(path: string) => Promise<boolean> \| boolean` |  |
| `onLoadMore` | `(() => void)` |  |
| `onNavigate` | `((path: string) => void)` |  |
| `onOpenChange` | `((open: boolean) => void)` |  |
| `onRetry` | `(() => void)` |  |
| `onSearch` | `((query: string) => void)` |  |
| `onUp` | `(() => void)` |  |
| `onValueChange` | `((value: string) => void)` |  |
| `open` | `boolean` |  |
| `truncated` | `boolean` |  |
| `value` | `string` |  |

`*` 必填。原生 DOM 属性（如 `onClick`、`aria-*`）未列出。

### `ResizeHandle`

*component*

| Prop | Type | Description |
| --- | --- | --- |
| `defaultSize` | `number` |  |
| `disabled` | `boolean` |  |
| `getAriaValueText` | `((size: number) => string)` |  |
| `label` | `string` | Accessible name; defaults to the shell copy 「调整详情面板宽度」. |
| `largeStep` | `number` | Shift + arrow step. |
| `max` * | `number` |  |
| `min` * | `number` |  |
| `onDraggingChange` | `((dragging: boolean) => void)` |  |
| `onSizeChange` | `((size: number) => void)` |  |
| `pane` | `"end" \| "start"` | Logical side of the handle the resized pane is on. |
| `resetSize` | `number` | Size restored on double-click; defaults to `defaultSize`. |
| `size` | `number` |  |
| `step` | `number` | Arrow-key step in CSS pixels. |

`*` 必填。原生 DOM 属性（如 `onClick`、`aria-*`）未列出。

### `RunCommandDetail`

*component* — RunCommandDetail (atlas 42): command, cwd, shell, timeout, execution state, exit code, terminal output.

| Prop | Type | Description |
| --- | --- | --- |
| `detail` * | `{ kind: "command"; command: string; cwd?: string; shell?: string; timeoutMs?: number; exitCode?: number; execution?: "pending" \| "running" \| "returned" \| "background" \| "timed-out" \| "cancel-unconfirmed"; output?: ToolOutputView; terminalId?: string; sandboxed?: boolean; }` |  |
| `onCopyText` | `((text: string) => void \| Promise<void>)` |  |
| `onOpenTerminal` | `((terminalId: string) => void)` |  |
| `outputProps` | `Pick<ToolOutputProps, "onLoadMore" \| "onOpenFull" \| "loadingMore" \| "onCopyText">` | Passed through to the output (display truncation). |

`*` 必填。原生 DOM 属性（如 `onClick`、`aria-*`）未列出。

### `RunDetails`

*component*

| Prop | Type | Description |
| --- | --- | --- |
| `details` * | `RunDetailsView` |  |

`*` 必填。原生 DOM 属性（如 `onClick`、`aria-*`）未列出。

### `RunOverview`

*component*

| Prop | Type | Description |
| --- | --- | --- |
| `defaultOpen` | `boolean` |  |
| `facts` | `readonly RunOverviewFact[]` |  |
| `messages` | `WorkspaceMessagesProp` |  |
| `onClose` | `(() => void)` |  |
| `onOpenChange` | `((open: boolean) => void)` |  |
| `onReopen` | `(() => void)` |  |
| `onSectionOpenChange` | `((id: string, open: boolean) => void)` |  |
| `open` | `boolean` |  |
| `sectionOpen` | `Readonly<Record<string, boolean>>` |  |
| `sections` | `readonly RunOverviewSection[]` |  |
| `subagents` | `readonly SubagentView[]` |  |
| `terminals` | `React.ReactNode` |  |

`*` 必填。原生 DOM 属性（如 `onClick`、`aria-*`）未列出。

### `RunStatus`

*component* — Same-name type alias: the package entry exports this component as `RunStatus`, which would otherwise shadow the `RunStatus` type re-exported from `@wzrhine/agent-core`. Declaring both here keeps `import type { RunStatus }` and `<RunStatus />` working from one entry.

| Prop | Type | Description |
| --- | --- | --- |
| `actionStatus` | `ActionStatus` |  |
| `announceInterval` | `number` | Minimum gap between announcements (ms). |
| `announce` | `boolean` | Render a polite, throttled screen-reader announcement of the label. |
| `appearance` | `"pill" \| "inline" \| "line"` |  |
| `elapsedMs` | `number` |  |
| `hint` | `React.ReactNode` | Short explanation shown after the status ("等待你批准 1 个操作"). |
| `labelOverride` | `React.ReactNode` | Replaces the computed label. |
| `phase` | `RunPhase` |  |
| `run` | `Pick<RunView, "status" \| "phase" \| "label" \| "elapsedMs" \| "syncStatus" \| "actionStatus">` |  |
| `size` | `"sm" \| "md"` |  |
| `status` | `RunStatusValue` |  |
| `syncStatus` | `SyncStatus` |  |

`*` 必填。原生 DOM 属性（如 `onClick`、`aria-*`）未列出。

### `RunSummary`

*component* — RunSummary (atlas 36): outcome of one run. Run success and persistence are separate facts: a completed run whose result is still saving shows both (「已完成」 + 「结果保存中」), a failed save offers 「重试保存」. `sideEffects` adds a sentence asking the user to check external state. Token counts carry their completeness label.

| Prop | Type | Description |
| --- | --- | --- |
| `headingLevel` | `HeadingLevel` |  |
| `messages` | `WorkspaceMessagesProp` |  |
| `onOpenArtifact` | `((id: string) => void)` | Opens one artifact from the mini list. |
| `onOpenDetails` | `(() => void)` |  |
| `onOpenTrace` | `(() => void)` |  |
| `onRetrySave` | `AgentActionHandler` | Retries persisting the result (`persistence: 'failed'`). |
| `run` * | `RunSummaryView` |  |

`*` 必填。原生 DOM 属性（如 `onClick`、`aria-*`）未列出。

### `ScriptDisclosure`

*component* — ScriptDisclosure: 「查看脚本」 for a Code Mode parent. The script mounts on open, scrolls inside its own region and states when it is truncated (`onOpenFull` only when given).

| Prop | Type | Description |
| --- | --- | --- |
| `defaultOpen` | `boolean` |  |
| `onOpenFull` | `(() => void)` |  |
| `script` * | `{ language?: string; source: string; truncated?: boolean; }` |  |

`*` 必填。原生 DOM 属性（如 `onClick`、`aria-*`）未列出。

### `SendStopButton`

*component* — One persistent button for send ↔ stop (atlas 18). It is the same `<button>` element in every state, so focus is never lost when it switches; inert states use `aria-disabled` (still focusable, announced) instead of the native `disabled` attribute.

| Prop | Type | Description |
| --- | --- | --- |
| `canSend` * | `boolean` | There is something to send (non-empty text, nothing uploading, within limits). |
| `className` | `string` |  |
| `disabledReason` | `string` | Why sending is not possible; shown in the tooltip and linked with aria-describedby. |
| `draftStatus` | `DraftStatus` |  |
| `labels` | `Partial<Record<SendStopState \| "send-retry" \| "stop-retry", string>>` | Override labels per state. |
| `mode` | `"send" \| "stop"` | Force a mode. Default: `stop` while `canStopRun(runStatus)` or `cancelling`, else `send`. |
| `onRetrySave` | `(() => void)` | Draft save failed: the button becomes 重试保存. |
| `onRetry` | `((kind: "send" \| "stop", actionId: string \| undefined) => void)` | Retry an `unknown` action with its original `actionId` (ADR-0011 §4). Without it, or when the receipt says `retryable: false`, the unknown state is inert so no duplicate action is created. |
| `onSend` | `(() => void)` |  |
| `onStop` | `(() => void)` |  |
| `retryBusy` | `boolean` |  |
| `runStatus` | `RunStatus` |  |
| `sendReceipt` | `ActionReceipt \| ActionStatus` | Receipt of the last send (`submitting` → inert, `unknown` → 结果待确认). |
| `stopReceipt` | `ActionReceipt \| ActionStatus` | Receipt of the last stop request (`submitting` / `accepted` while the run still runs → 停止待确认). |

`*` 必填。原生 DOM 属性（如 `onClick`、`aria-*`）未列出。

### `SkillPicker`

*component*

| Prop | Type | Description |
| --- | --- | --- |
| `anchor` | `HTMLElement \| React.RefObject<HTMLElement \| null>` |  |
| `defaultOpen` | `boolean` |  |
| `disabled` | `boolean` |  |
| `error` | `React.ReactNode` |  |
| `hideTrigger` | `boolean` |  |
| `loading` | `boolean` |  |
| `max` | `number` |  |
| `onChange` * | `(skills: SkillOption[]) => void` |  |
| `onLimitReached` | `((max: number) => void)` |  |
| `onOpenChange` | `((open: boolean) => void)` |  |
| `onRetry` | `(() => void)` |  |
| `open` | `boolean` |  |
| `selected` * | `readonly SkillOption[]` |  |
| `skills` * | `readonly SkillOption[]` |  |

`*` 必填。原生 DOM 属性（如 `onClick`、`aria-*`）未列出。

### `SkillUseList`

*component*

| Prop | Type | Description |
| --- | --- | --- |
| `label` | `React.ReactNode` | Visible label; defaults to the copy table. |
| `skills` * | `SkillUseView[]` |  |

`*` 必填。原生 DOM 属性（如 `onClick`、`aria-*`）未列出。

### `SlashCommandMenu`

*component* — `/` command and skill picker (atlas 16). Same mechanics as MentionMenu: listbox panel above the composer, focus stays in the textarea, ↑ / ↓ clamp, Enter / Tab choose, Esc closes and remembers the query. Rows show `/name`, aliases, description, the shortcut (`<kbd>`, visual only) and, for disabled entries, the reason. Selected skills carry a check and "已选用".

| Prop | Type | Description |
| --- | --- | --- |
| `activeIndex` * | `number` |  |
| `className` | `string` |  |
| `id` | `string` |  |
| `loading` | `boolean` |  |
| `onActiveIndexChange` * | `(index: number) => void` |  |
| `onDisabledSelect` | `((option: CommandOption) => void)` | Click on a disabled option: nothing is dispatched, the host may show the reason. |
| `onSelect` * | `(option: CommandOption) => void` | Click on an enabled option. The host decides: insert a token or dispatch an action. |
| `open` * | `boolean` |  |
| `options` * | `readonly CommandOption[]` | Options in display order. Composer orders them commands first, then skills (`orderCommandOptions`). |
| `query` * | `string` | Text typed after `/`. |
| `side` | `"inline" \| "top" \| "bottom"` | `top` / `bottom` = absolutely positioned against the composer; `inline` = in normal flow (standalone use). |
| `title` | `React.ReactNode` |  |

`*` 必填。原生 DOM 属性（如 `onClick`、`aria-*`）未列出。

### `StatusGlyph`

*component*

| Prop | Type | Description |
| --- | --- | --- |
| `active` | `boolean` | Ongoing activity: CSS adds a slow breathing halo (`data-loop` from the caller). |
| `children` | `React.ReactNode` | Custom SVG inner nodes; win over the built-in glyph for `name`. |
| `name` * | `string` | Built-in glyph name. Any other string is accepted together with `children` (ADR-0013 §3): the children become the glyph content and `data-glyph` carries the custom name. |
| `tone` | `AgentTone` |  |

`*` 必填。原生 DOM 属性（如 `onClick`、`aria-*`）未列出。

### `SubAgentCard`

*component* — SubAgentCard (atlas 24): one child agent tracked separately from its parent. Usage is shown as a number with a completeness label (「部分用量」); no progress bar is derived from the status. `needs-attention` / `waiting-user` get a warning frame plus a sentence, never colour alone.

| Prop | Type | Description |
| --- | --- | --- |
| `agent` * | `SubagentView` |  |
| `animate` | `boolean` | Animate the spark (default). `false` forces the static frame, e.g. in long lists. |
| `headingLevel` | `HeadingLevel` |  |
| `messages` | `WorkspaceMessagesProp` |  |
| `onOpenSnapshot` | `((id: string) => void)` | Opens the read-only snapshot of an inherited record; draws 「查看快照」. |
| `onOpen` | `((id: string) => void)` | Opens the sub-task; draws 「查看子任务」. Not drawn for inherited records. |

`*` 必填。原生 DOM 属性（如 `onClick`、`aria-*`）未列出。

### `SubAgentList`

*component* — Several sub-agents as a list of cards. Duplicate ids are dropped (first wins); order is the given order. Each card keeps its own heading so screen-reader users can jump between them. `groupInherited` moves inherited records into a second list under its own heading (one level above the cards); the given order is kept inside each group.

| Prop | Type | Description |
| --- | --- | --- |
| `agents` * | `SubagentView[]` |  |
| `animate` | `boolean` |  |
| `disabled` | `boolean` |  |
| `empty` | `React.ReactNode` |  |
| `groupBy` | `"none" \| "state"` |  |
| `groupInherited` | `boolean` | Put inherited records under their own 「继承的子任务记录」 heading after the live ones. |
| `headingLevel` | `HeadingLevel` | Level of each card heading; the list heading (`title`) is one level above. |
| `messages` | `WorkspaceMessagesProp` |  |
| `onOpenSnapshot` | `((id: string) => void)` |  |
| `onOpen` | `((id: string) => void)` |  |
| `title` | `string \| (string & React.ReactElement<unknown, string \| React.JSXElementConstructor<any>>) \| (string & Iterable<React.ReactNode>) \| (string & React.ReactPortal) \| (string & Promise<AwaitedReactNode>)` | Visible list heading; omitted → the list is named by `aria-label` only. |
| `variant` | `"row" \| "card"` |  |

`*` 必填。原生 DOM 属性（如 `onClick`、`aria-*`）未列出。

### `SubagentToolDetail`

*component* — SubagentToolDetail: sub-task name, task and a link to the child conversation.

| Prop | Type | Description |
| --- | --- | --- |
| `detail` * | `{ kind: "agent"; agentName: string; task?: string; childConversationId?: string; }` |  |
| `onOpenChild` | `((childConversationId: string) => void)` |  |

`*` 必填。原生 DOM 属性（如 `onClick`、`aria-*`）未列出。

### `TerminalList`

*component* — Terminals grouped into 未关闭 / 状态待确认 / 已结束 / 继承记录, each a Collapsible with a count. Within a group the given order is kept: a status flicker moves a row between groups at most, never reshuffles a group. Empty groups are not drawn.

| Prop | Type | Description |
| --- | --- | --- |
| `currentId` | `string` |  |
| `defaultCollapsed` | `TerminalGroupKey[]` | Groups collapsed on first render (uncontrolled per group). Default: inherited. |
| `empty` | `React.ReactNode` |  |
| `error` | `React.ReactNode` |  |
| `hasMore` | `boolean` | `false` hides the 「加载更多终端」 button even when `onLoadMore` is given. |
| `loadingMore` | `boolean` |  |
| `loading` | `boolean` |  |
| `messages` | `WorkspaceMessagesProp` |  |
| `onLoadMore` | `(() => void)` |  |
| `onOpen` | `((terminal: TerminalView) => void)` |  |
| `onRetry` | `(() => void)` |  |
| `onStop` | `AgentActionHandler<[terminal: TerminalView, context: { actionId: string; }]>` |  |
| `terminals` * | `TerminalView[]` |  |
| `total` | `number` |  |

`*` 必填。原生 DOM 属性（如 `onClick`、`aria-*`）未列出。

### `TerminalRow`

*component* — TerminalRow (atlas 23): sidebar summary of one terminal. Opening and stopping are two separate buttons (never nested). The long cwd is truncated visually, the full path is in the title and in the open button's description. Read-only rows say so in text, not only by missing controls. Motion: none beyond the colour transitions of the buttons.

| Prop | Type | Description |
| --- | --- | --- |
| `current` | `boolean` | Marks the open terminal (`aria-current`). |
| `messages` | `WorkspaceMessagesProp` |  |
| `onOpen` | `((terminal: TerminalView) => void)` | Opens the terminal (row button). Without it the row is plain text. |
| `onStop` | `AgentActionHandler<[terminal: TerminalView, context: { actionId: string; }]>` | Stop action; a separate button, drawn only when the terminal is stoppable. |
| `terminal` * | `TerminalView` |  |

`*` 必填。原生 DOM 属性（如 `onClick`、`aria-*`）未列出。

### `TerminalTabs`

*component* — Several terminals as tabs (Tabs from `@wzrhine/react`: roving focus, arrow keys, Home / End). Each tab names the terminal and its status, so the status is readable without opening it.

| Prop | Type | Description |
| --- | --- | --- |
| `defaultValue` | `string` |  |
| `headingLevel` | `HeadingLevel` |  |
| `messages` | `WorkspaceMessagesProp` |  |
| `onInput` | `AgentActionHandler<[text: string, terminal: TerminalView]>` |  |
| `onLoadEarlier` | `AgentActionHandler<[terminal: TerminalView]>` |  |
| `onLoadMoreHistory` | `AgentActionHandler<[terminal: TerminalView]>` |  |
| `onReadLatest` | `AgentActionHandler<[terminal: TerminalView]>` |  |
| `onStop` | `AgentActionHandler<[terminal: TerminalView]>` |  |
| `onValueChange` | `((id: string) => void)` |  |
| `terminals` * | `TerminalView[]` |  |
| `value` | `string` | Active terminal id (controlled). |

`*` 必填。原生 DOM 属性（如 `onClick`、`aria-*`）未列出。

### `ThinkingBlock`

*component*

| Prop | Type | Description |
| --- | --- | --- |
| `defaultExpanded` | `boolean` |  |
| `expanded` | `boolean` |  |
| `label` | `React.ReactNode` | Overrides `thinking.label` / the default label. |
| `onExpandedChange` | `((expanded: boolean) => void)` |  |
| `onOpenFull` | `((thinkingId: string) => void)` | Shown as a button under the truncated notice. |
| `renderers` | `MessagePartRenderers` |  |
| `thinking` * | `ThinkingView` |  |

`*` 必填。原生 DOM 属性（如 `onClick`、`aria-*`）未列出。

### `ToolActivity`

*component*

| Prop | Type | Description |
| --- | --- | --- |
| `active` | `boolean` | The round is still running. Defaults to "any row is active". |
| `defaultExpanded` | `boolean` |  |
| `detailActions` | `ToolDetailActions` | Callbacks for the built-in detail views (read more, reload, open terminal…). |
| `detailsErrors` | `Readonly<Record<string, React.ReactNode>>` | Load errors by tool id (`detailsError` of each row). |
| `elapsedMs` | `number` | Elapsed time of the round. |
| `expandedIds` | `readonly string[]` | Controlled expanded rows by id. |
| `expanded` | `boolean` |  |
| `onExpandedChange` | `((expanded: boolean) => void)` |  |
| `onLoadDetails` | `((id: string) => void)` | Called when the row opens and `tool.detailsLoaded === false`, and on retry. |
| `onOpenHistory` | `(() => void)` | Shows the 「完整工具记录」 link. |
| `onToolExpandedChange` | `((id: string, expanded: boolean) => void)` |  |
| `renderDetail` | `((tool: ToolCallView) => React.ReactNode \| undefined)` | Override the detail body. Return `undefined` to fall back to the built-in view. |
| `renderTool` | `((tool: ToolCallView) => React.ReactNode \| undefined)` | Replace a row. Return `undefined` to use the default ToolRecord. |
| `title` | `string \| (string & React.ReactElement<unknown, string \| React.JSXElementConstructor<any>>) \| (string & Iterable<React.ReactNode>) \| (string & React.ReactPortal) \| (string & Promise<AwaitedReactNode>)` | Header title override (default 「N 个操作」). |
| `tools` * | `readonly ToolCallView[]` |  |

`*` 必填。原生 DOM 属性（如 `onClick`、`aria-*`）未列出。

### `ToolCategoryChip`

*component*

| Prop | Type | Description |
| --- | --- | --- |
| `category` | `(string & {}) \| ToolCategory` |  |
| `className` | `string` |  |

`*` 必填。原生 DOM 属性（如 `onClick`、`aria-*`）未列出。

### `ToolDetail`

*component* — Render the built-in detail view for `detail.kind` (or the generic one).

| Prop | Type | Description |
| --- | --- | --- |
| `beforeActions` | `ChunkPagerActions` |  |
| `detail` | `ToolDetailView` |  |
| `loadingMore` | `boolean` |  |
| `onCopyText` | `((text: string) => void \| Promise<void>)` |  |
| `onLoadMoreOperations` | `((tool: ToolCallView) => void)` |  |
| `onLoadMoreOutput` | `((tool: ToolCallView) => void)` |  |
| `onOpenChild` | `((childConversationId: string, tool: ToolCallView) => void)` |  |
| `onOpenFullOutput` | `((tool: ToolCallView) => void)` |  |
| `onOpenTerminal` | `((terminalId: string, tool: ToolCallView) => void)` |  |
| `onReadMore` | `((tool: ToolCallView, nextOffset: number) => void)` |  |
| `onReconcile` | `((tool: ToolCallView) => void)` |  |
| `onReload` | `((tool: ToolCallView, path?: string) => void)` |  |
| `onRetrySave` | `((tool: ToolCallView) => void)` |  |
| `onViewFull` | `((tool: ToolCallView, path?: string) => void)` |  |
| `pageActions` | `ChunkPagerActions` |  |
| `rawActions` | `ChunkPagerActions` |  |
| `retrying` | `boolean` |  |
| `tool` * | `ToolCallView` |  |

`*` 必填。原生 DOM 属性（如 `onClick`、`aria-*`）未列出。

### `ToolFallback`

*component*

| Prop | Type | Description |
| --- | --- | --- |
| `tool` * | `ToolCallView` |  |

`*` 必填。原生 DOM 属性（如 `onClick`、`aria-*`）未列出。

### `ToolHistory`

*component*

| Prop | Type | Description |
| --- | --- | --- |
| `defaultExpanded` | `boolean` |  |
| `detailActions` | `ToolDetailActions` | Callbacks for the built-in detail views (read more, reload, open terminal…). |
| `detailsErrors` | `Readonly<Record<string, React.ReactNode>>` |  |
| `error` | `React.ReactNode` |  |
| `expanded` | `boolean` |  |
| `hasMore` | `boolean` |  |
| `items` * | `readonly ToolCallView[]` | All loaded rows (pages concatenated; duplicates allowed, they are dropped here). |
| `loading` | `boolean` |  |
| `onExpandedChange` | `((expanded: boolean) => void)` |  |
| `onLoadDetails` | `((id: string) => void)` | Called when the row opens and `tool.detailsLoaded === false`, and on retry. |
| `onLoadMore` | `(() => void)` |  |
| `onOpenOperation` | `((id: string) => void)` |  |
| `renderDetail` | `((tool: ToolCallView) => React.ReactNode \| undefined)` | Override the detail body. Return `undefined` to fall back to the built-in view. |
| `title` | `string \| (string & React.ReactElement<unknown, string \| React.JSXElementConstructor<any>>) \| (string & Iterable<React.ReactNode>) \| (string & React.ReactPortal) \| (string & Promise<AwaitedReactNode>)` |  |
| `total` | `number` |  |

`*` 必填。原生 DOM 属性（如 `onClick`、`aria-*`）未列出。

### `ToolOutput`

*component*

| Prop | Type | Description |
| --- | --- | --- |
| `copyable` | `boolean` | Hide the copy button. |
| `label` | `React.ReactNode` | Heading text; defaults to the kind label (「终端输出」, 「JSON」…). |
| `loadingMore` | `boolean` | Busy state for `onLoadMore`. |
| `onCopyText` | `((text: string) => void \| Promise<void>)` | Replace the clipboard write (tests, host clipboards). |
| `onLoadMore` | `(() => void)` | Load the next display chunk (`truncated: 'display'`). |
| `onOpenFull` | `(() => void)` | Open the full output elsewhere (`truncated: 'display'`). |
| `output` * | `ToolOutputView` |  |
| `page` | `MaterialPageView` | One page of the stored output; replaces the inline body with a `ChunkPager`. |
| `pager` | `Partial<ChunkPagerActions>` | Paging callbacks for `page` (`canGoBack` defaults to false). |
| `regionLabel` | `string` | Name of the scroll region; defaults to the label text. |

`*` 必填。原生 DOM 属性（如 `onClick`、`aria-*`）未列出。

### `ToolRecord`

*component*

| Prop | Type | Description |
| --- | --- | --- |
| `actions` | `React.ReactNode` | Controls placed next to the row (outside the trigger button), e.g. 「在对话中定位」. |
| `defaultExpanded` | `boolean` |  |
| `detailActions` | `ToolDetailActions` | Callbacks for the built-in detail views (read more, reload, open terminal…). |
| `detailsError` | `React.ReactNode` | Loading the full record failed (shown with a retry when `onLoadDetails` exists). |
| `detailsFooter` | `React.ReactNode` | Extra content at the end of the details (e.g. Code Mode script). |
| `detailsLoading` | `boolean` |  |
| `expanded` | `boolean` |  |
| `onExpandedChange` | `((expanded: boolean, id: string) => void)` |  |
| `onLoadDetails` | `((id: string) => void)` | Called when the row opens and `tool.detailsLoaded === false`, and on retry. |
| `onRetry` | `((tool: ToolCallView) => void)` |  |
| `renderDetail` | `((tool: ToolCallView) => React.ReactNode \| undefined)` | Override the detail body. Return `undefined` to fall back to the built-in view. |
| `tool` * | `ToolCallView` |  |

`*` 必填。原生 DOM 属性（如 `onClick`、`aria-*`）未列出。

### `ToolStatusPill`

*component* — Status pill for a tool status: glyph + shared label (+ meta).

| Prop | Type | Description |
| --- | --- | --- |
| `appearance` | `"pill" \| "inline"` |  |
| `meta` | `React.ReactNode` |  |
| `status` * | `ToolStatus` |  |

`*` 必填。原生 DOM 属性（如 `onClick`、`aria-*`）未列出。

### `UnsupportedPart`

*component* — Fallback for unregistered custom renderers and unknown part types. Never blank.

| Prop | Type | Description |
| --- | --- | --- |
| `summary` | `string` |  |
| `type` * | `string` |  |

`*` 必填。原生 DOM 属性（如 `onClick`、`aria-*`）未列出。

## Functions & hooks

### `agentStaggerDelay`

*function*

```ts
function agentStaggerDelay: (index: number, reduced: boolean, speed?: number) => number
```

### `answerState`

*function*

```ts
function answerState: (question: QuestionView, answer: QuestionAnswer | undefined) => QuestionAnswerState
```

### `answerText`

*function* — Human-readable answer of one question; `null` when there is none (caller picks the label).

```ts
function answerText: (question: QuestionView, answer: QuestionAnswer | undefined, join: string) => string | null
```

### `buildTree`

*function* — Build a parent → children tree from flat items with `parentId` (Code Mode trees). Orphans go to the root.

```ts
function buildTree: <T extends { id: string; parentId?: string; }>(items: readonly T[]) => Array<T & { children: T[]; }>
```

### `canStopRun`

*function* — Statuses for which the run can still be stopped.

```ts
function canStopRun: (status: RunStatus) => boolean
```

### `capability`

*function* — Normalise `true` / `false` / `{ enabled, reason }`; `undefined` means "not offered".

```ts
function capability: (input: CapabilityInput | undefined) => Capability | undefined
```

### `childOutcome`

*function* — Outcome of a parent from its direct children only. Each child keeps its own status; the parent's own status is never used to paint the children.

```ts
function childOutcome: (children: readonly Pick<ToolCallView, "status">[]) => { kind: "empty" | "running" | "done" | "partial" | "failed" | "unknown"; failed: number; running: number; unknown: number; total: number; }
```

### `codePointLength`

*function* — Count Unicode code points (questionnaire limits count characters, not UTF-16 units).

```ts
function codePointLength: (text: string) => number
```

### `compareRevision`

*function* — Compare two revision strings. Numeric strings compare numerically; others lexically. Returns <0 when `a` is older than `b`, 0 when equal, >0 when newer.

```ts
function compareRevision: (a: string | undefined, b: string | undefined) => number
```

### `dedupeById`

*function* — Drop later duplicates of the same id, keeping the first occurrence.

```ts
function dedupeById: <T extends { id: string; }>(items: readonly T[]) => T[]
```

### `defaultMentionTokenName`

*function* — Default token name for a mention: the drilled folder prefix + the option label (`src/agent.ts`).

```ts
function defaultMentionTokenName: (option: MentionOption, query: string) => string
```

### `deleteTokenAt`

*function* — Whole-token deletion. Backspace right after a token (or after the token + one space) and Delete right before one remove the whole token and one adjacent space. Returns `null` when the key should behave normally (no token at the caret, or a non-collapsed selection).

```ts
function deleteTokenAt: (value: string, selectionStart: number, selectionEnd: number, key: "Backspace" | "Delete") => (EditResult & { removed: ComposerToken; }) | null
```

### `detectTrigger`

*function* — Detect an active `@` / `/` trigger before the caret. Triggers only start at the beginning of a line or after whitespace, never inside code, and the query cannot contain whitespace. `/` commands are only recognised at the start of the message or a line (paths stay text).

```ts
function detectTrigger: (value: string, caret: number, triggers?: readonly TriggerChar[], options?: { slash?: "line-start" | "word-start"; }) => TriggerMatch | null
```

### `diffStats`

*function* — Totals across files.

```ts
function diffStats: (files: readonly FileDiffView[]) => { files: number; additions: number; deletions: number; }
```

### `drillQuery`

*function* — Query after drilling into a folder option: `src/` + `components/`.

```ts
function drillQuery: (query: string, option: MentionOption) => string
```

### `effectivePhase`

*function* — Phase shown for a run: explicit phase, else derived from the run status.

```ts
function effectivePhase: (status: RunStatus, phase?: RunPhase) => RunPhase | undefined
```

### `encodeToken`

*function*

```ts
function encodeToken: (trigger: TriggerChar, name: string) => string
```

### `filterCommandOptions`

*function* — Matches name, aliases, label and description; exact name / alias matches come first.

```ts
function filterCommandOptions: (options: readonly CommandOption[], query: string) => CommandOption[]
```

### `filterMentionOptions`

*function* — Case-insensitive filter over label and detail, using the filter part of the query.

```ts
function filterMentionOptions: (options: readonly MentionOption[], query: string) => MentionOption[]
```

### `formatBytes`

*function* — Bytes → "512 B", "2.4 KB", "12.4 MB" (base 1024).

```ts
function formatBytes: (bytes: number, locale?: string) => string
```

### `formatCompact`

*function* — 12400 → "12.4K", 1_500_000 → "1.5M". Below 1000 the plain number.

```ts
function formatCompact: (value: number, locale?: string) => string
```

### `formatDuration`

*function* — Milliseconds → "850ms", "12.4s", "3m 05s", "1h 02m".

```ts
function formatDuration: (ms: number) => string
```

### `hasRunDetails`

*function* — Whether the view-model would render at least one row.

```ts
function hasRunDetails: (details: RunDetailsView | undefined) => details is RunDetailsView
```

### `insertToken`

*function* — Insert a token at `[from, to)` (usually the typed `@query`), padding with spaces so it never glues to neighbouring words. Returns the new value and caret (after the trailing space).

```ts
function insertToken: (value: string, from: number, to: number, trigger: TriggerChar, name: string) => EditResult
```

### `isOverLimit`

*function* — Code-point length of the free text is over `maxLength`.

```ts
function isOverLimit: (question: QuestionView, answer: QuestionAnswer | undefined) => boolean
```

### `isStaleRevision`

*function* — True when `incoming` must not replace `current` (older revision). Equal revisions are accepted.

```ts
function isStaleRevision: (current: string | undefined, incoming: string | undefined) => boolean
```

### `isTerminalReadOnly`

*function* — Inherited / read-only terminals are history only: no input, no stop.

```ts
function isTerminalReadOnly: (terminal: TerminalView) => boolean
```

### `lastLine`

*function* — Last non-empty line of a streaming text (ThinkingBlock collapsed preview).

```ts
function lastLine: (text: string | undefined) => string
```

### `lineDiff`

*function*

```ts
function lineDiff: (before: string, after: string, { context, maxLines }?: LineDiffOptions) => { hunk: DiffHunkView; additions: number; deletions: number; truncated: boolean; }
```

### `loopAttributes`

*function* — Data attributes that drive CSS loops: `data-loop="running" | "paused"` and the pause reason. CSS only animates `[data-loop='running']`, so hidden pages and off-screen items cost nothing.

```ts
function loopAttributes: (lifecycle: MotionLifecycle) => { "data-loop": "running" | "paused" | "idle"; "data-loop-paused"?: string; }
```

### `matchRanges`

*function* — Highlight ranges of `query` inside `text` (case-insensitive), for menu matches.

```ts
function matchRanges: (text: string, query: string) => Array<[number, number]>
```

### `mergeAgentMessages`

*function*

```ts
function mergeAgentMessages: (base: AgentMessages, overrides: AgentMessagesOverrides | undefined) => AgentMessages
```

### `mergeById`

*function* — Merge `incoming` items into `current` by id. A replayed item with an older revision is ignored; new items are appended. The result is sorted by `sequence` when every item has one, otherwise insertion order is kept. Never produces duplicate ids.

```ts
function mergeById: <T extends Identified>(current: readonly T[], incoming: readonly T[]) => T[]
```

### `messagePlainText`

*function* — Plain text of the copyable parts (text, markdown source, code).

```ts
function messagePlainText: (message: MessageView) => string
```

### `moveActiveIndex`

*function* — Next active index for ↑ / ↓. Clamped at both ends (no wrap-around), so holding a key never jumps from the last option back to the first. Disabled options stay reachable: their reason is read out when active. Returns -1 for an empty list.

```ts
function moveActiveIndex: (count: number, index: number, delta: number) => number
```

### `normalizeAnswers`

*function* — The answers to submit: answered questions normalised (unknown option ids and an unselected custom text dropped), explicitly skipped and unanswered optional questions as `skipped: true`. Unanswered required questions are returned in `missing` and must block submission.

```ts
function normalizeAnswers: (questions: readonly QuestionView[], answers: ReadonlyMap<string, QuestionAnswer> | readonly QuestionAnswer[]) => { answers: QuestionAnswer[]; missing: string[]; overLimit: string[]; }
```

### `normalizeEfforts`

*function* — Bare ids become options; labelled options pass through.

```ts
function normalizeEfforts: (efforts: readonly (ModelEffort | ModelEffortOption)[] | undefined) => ModelEffortOption[]
```

### `orderCommandOptions`

*function* — Commands (and actions) first, then skills, keeping the host order inside each kind.

```ts
function orderCommandOptions: (options: readonly CommandOption[]) => CommandOption[]
```

### `orderLedger`

*function* — Events in sequence order, duplicates dropped (first occurrence wins).

```ts
function orderLedger: (events: readonly LedgerEventView[]) => LedgerEventView[]
```

### `orderTools`

*function* — Dedupe by id (first occurrence wins) and order by `sequence` when every row has one.

```ts
function orderTools: (tools: readonly ToolCallView[]) => ToolCallView[]
```

### `parseTokens`

*function*

```ts
function parseTokens: (value: string) => ComposerToken[]
```

### `parseUnifiedDiff`

*function* — Parse a unified diff (`--- a/x`, `+++ b/x`, `@@ -1,3 +1,4

```ts
function parseUnifiedDiff: (source: string) => FileDiffView[]
```

### `pathCrumbs`

*function* — Breadcrumb items for a path. Under `root` the path is shown relative to it (root's last segment first); outside it (or for absolute paths without a root match) `outside` is true.

```ts
function pathCrumbs: (path: string | undefined, root?: string) => { items: BreadcrumbItem[]; outside: boolean; } | undefined
```

### `reconcileTokens`

*function* — Reconcile bindings restored by a host with the tokens that are still present in a draft. Bindings are returned in their original order, while stale bindings are omitted. Matching is by trigger and exact token name, including spaces; the helper never invents a binding.

```ts
function reconcileTokens: <T extends TokenBinding>(value: string, bindings: readonly T[]) => T[]
```

### `removeTokens`

*function* — Removes every `trigger + name` token (and one adjacent space) from a value.

```ts
function removeTokens: (value: string, trigger: TriggerChar, name: string) => string
```

### `resolveDiff`

*function* — Resolve the props into one FileDiffView.

```ts
function resolveDiff: (props: Pick<DiffPreviewProps, "diff" | "before" | "after" | "path" | "status">) => FileDiffView | undefined
```

### `resolveSendStop`

*function* — Decides the button state. "Stop sent" ≠ "stopped": while the run is `cancelling` or the stop request is in flight / accepted but the run still runs, the button is `stop-pending` (inert). Unknown receipts never look like success and never create a new action: they offer the retry callback (same actionId, host-owned) when it is safe, otherwise stay inert.

```ts
function resolveSendStop: (input: SendStopInput) => SendStopResolved
```

### `sequenceGaps`

*function* — Find gaps in a sequence-ordered list (e.g. to request missing events).

```ts
function sequenceGaps: (items: readonly { sequence?: number; }[]) => Array<{ from: number; to: number; }>
```

### `snapCaret`

*function* — If `caret` sits strictly inside a token, move it to the nearer edge.

```ts
function snapCaret: (value: string, caret: number) => number
```

### `sparkPhase`

*function*

```ts
function sparkPhase: (status: RunStatus, phase?: RunPhase) => SparkPhase
```

### `splitMentionQuery`

*function* — Splits an `@` query into the drilled folder prefix (`src/components/`) and the filter (`but`).

```ts
function splitMentionQuery: (query: string) => { directory: string; filter: string; }
```

### `statusProps`

*function* — Convenience: render a status from a `StatusMeta` record plus its label.

```ts
function statusProps: (meta: StatusMeta, label: React.ReactNode) => Pick<AgentStatusProps, "glyph" | "tone" | "label" | "active">
```

### `stripStray`

*function* — Remove isolate characters that no longer belong to a complete token (after partial edits).

```ts
function stripStray: (value: string) => string
```

### `subagentSparkPhase`

*function* — AgentSpark phase for a sub-agent, or `undefined` when nothing is in progress.

```ts
function subagentSparkPhase: (agent: Pick<SubagentView, "status" | "phase">) => SparkPhase | undefined
```

### `terminalGroup`

*function* — Which TerminalList group a terminal belongs to. Inherited first, then status.

```ts
function terminalGroup: (terminal: TerminalView) => TerminalGroupKey
```

### `tokenCounts`

*function* — Count tokens per `trigger + name`, to unbind references whose token was deleted from the text.

```ts
function tokenCounts: (value: string) => Map<string, number>
```

### `toPlainText`

*function* — Readable text for sending: isolates removed, tokens become `@name` / `/name`.

```ts
function toPlainText: (value: string) => string
```

### `usageLevel`

*function* — Level of a usage ratio for colouring: `near` from 80%, `over` above 100%.

```ts
function usageLevel: (used: number | undefined, max: number | undefined) => "normal" | "near" | "over" | "unknown"
```

### `usagePercent`

*function* — Percentage for a usage value, or `null` when it must not be shown: unknown / partial data or a missing / non-positive maximum never produce a percentage.

```ts
function usagePercent: (used: number | undefined, max: number | undefined, completeness: Completeness) => number | null
```

### `useAgentContextPresentation`

*function* — How the surrounding shell presents the context slot (AgentSidePane hides its close button in a sheet).

```ts
function useAgentContextPresentation: () => AgentContextPresentation
```

### `useAgentFormat`

*function* — Locale-aware formatters for the nearest provider.

```ts
function useAgentFormat: () => AgentFormat
```

### `useAgentLoop`

*function* — Loop lifecycle for agent activity indicators (AgentSpark, breathing dots, shimmer). Runs only while `active`, the page is visible, the element is on screen and motion is not reduced. Returns the lifecycle plus a ref to attach to the animated element.

```ts
function useAgentLoop: <T extends Element>(active: boolean) => { ref: React.RefObject<T | null>; lifecycle: MotionLifecycle; }
```

### `useAgentMessages`

*function*

```ts
function useAgentMessages: () => AgentMessages
```

### `useAgentShell`

*function* — The nearest AgentShell's state and toggles, or `null` outside a shell.

```ts
function useAgentShell: () => AgentShellContextValue | null
```

### `useStableOrder`

*function* — Append-only order for paged history: rows already shown keep their position; new ids are appended (sorted by `sequence` among themselves). Duplicates — the same id on two pages, or a live row replayed into history — are dropped; the latest data for a known id replaces its content but not its place.

```ts
function useStableOrder: (items: readonly ToolCallView[]) => ToolCallView[]
```

### `useSwapTransition`

*function* — Cross-fade transition for two stacked icons (send ↔ stop). Reduced: instant swap.

```ts
function useSwapTransition: () => { enter: Transition; exit: Transition; reduced: boolean; }
```

## Constants

### `actionStatusMeta`

*const*

```ts
const actionStatusMeta: Record<ActionStatus, StatusMeta>
```

### `AGENT_STAGGER_CAP_MS`

*const*

```ts
const AGENT_STAGGER_CAP_MS: 120
```

### `AGENT_STAGGER_MS`

*const* — Stagger step and cap for rows that arrive together (MOTION.md: 20–30ms per item, capped).

```ts
const AGENT_STAGGER_MS: 24
```

### `agentEnUS`

*const*

```ts
const agentEnUS: AgentMessages
```

### `agentZhCN`

*const*

```ts
const agentZhCN: AgentMessages
```

### `artifactKindIcon`

*const* — Icon per built-in kind; custom kinds fall back to `file` (ADR-0013 §2).

```ts
const artifactKindIcon: Record<ArtifactKind, AgentIconName>
```

### `COPY_FEEDBACK_MS`

*const* — How long the copied / failed feedback stays before the control returns to its idle label.

```ts
const COPY_FEEDBACK_MS: 1200
```

### `DIGEST_LENGTH`

*const*

```ts
const DIGEST_LENGTH: 8
```

### `FOLLOW_THRESHOLD_PX`

*const* — Distance from the bottom (px, measured in JS) that still counts as "at the latest content".

```ts
const FOLLOW_THRESHOLD_PX: 4
```

### `isChoiceQuestion`

*const* — `single` / `multiple` are the built-in choice kinds; anything else (incl. `text` and custom kinds, ADR-0013 §4) answers through free text and/or renderer-owned option ids.

```ts
const isChoiceQuestion: (question: QuestionView) => boolean
```

### `isKnownQuestionKind`

*const* — Built-in kinds with their own controls; any other string is a custom kind.

```ts
const isKnownQuestionKind: (question: QuestionView) => boolean
```

### `isQuestionOptional`

*const* — Questions are optional unless `optional === false`.

```ts
const isQuestionOptional: (question: QuestionView) => boolean
```

### `runPhaseMeta`

*const*

```ts
const runPhaseMeta: Record<RunPhase, StatusMeta>
```

### `runStatusMeta`

*const*

```ts
const runStatusMeta: Record<RunStatus, StatusMeta>
```

### `subagentStatusMeta`

*const*

```ts
const subagentStatusMeta: Record<SubagentStatus, StatusMeta>
```

### `syncStatusMeta`

*const*

```ts
const syncStatusMeta: Record<SyncStatus, StatusMeta>
```

### `terminalStatusMeta`

*const*

```ts
const terminalStatusMeta: Record<TerminalSessionStatus, StatusMeta>
```

### `TOKEN_CLOSE`

*const*

```ts
const TOKEN_CLOSE: "⁩"
```

### `TOKEN_OPEN`

*const* — Composer token encoding (ADR-0011 §8). A token is `FSI + trigger + name + PDI` (U+2068 … U+2069): invisible, zero-width isolates that survive copy, undo and IME in a real textarea. The mirror layer styles the same ranges; bindings (which file / skill) live in the composer state, the text only records positions.

```ts
const TOKEN_OPEN: "⁨"
```

### `toolStatusMeta`

*const*

```ts
const toolStatusMeta: Record<ToolStatus, StatusMeta>
```

## Interfaces

### `ActionReceipt`

*interface* — Receipt of the most recent action against an object, shown next to its controls.

| Member | Type | Description |
| --- | --- | --- |
| `actionId` | `string` |  |
| `at` | `string` |  |
| `reason` | `string` | Message for `rejected` / `unknown`. |
| `retryable` | `boolean` | For `unknown`: whether retrying the same action is safe. |
| `status` * | `ActionStatus` |  |

### `AgentActionContext`

*interface* — Identity of one user action. `actionId` is reused when retrying the same unknown action.

| Member | Type | Description |
| --- | --- | --- |
| `actionId` * | `string` |  |
| `baseRevision` | `string` | Revision the user was looking at. The adapter rejects stale actions with it. |
| `targetId` * | `string` | What the action targets: message, operation, questionnaire, terminal… |

### `AgentComposerMessages`

*interface* — Copy for the composer family (ADR-0011 §10): Composer, ComposerInput, menus, attachments, pickers.

| Member | Type | Description |
| --- | --- | --- |
| `attachmentsLabel` * | `string` |  |
| `back` * | `string` |  |
| `blockedPlaceholder` * | `string` |  |
| `capability` * | `Record<ModelCapability, string> & Record<string, string>` |  |
| `characters` * | `(count: string, max: string \| undefined) => string` | Character counter; receives formatted numbers. |
| `commandEmpty` * | `string` |  |
| `commandGroup` * | `string` |  |
| `commandKeys` * | `string` |  |
| `commandLoading` * | `string` |  |
| `commandTitle` * | `string` |  |
| `draftError` * | `string` |  |
| `draftSaved` * | `string` |  |
| `draftSaving` * | `string` |  |
| `dropFiles` * | `string` |  |
| `effortHeading` * | `string` |  |
| `effortInvalid` * | `string` |  |
| `effortNone` * | `string` |  |
| `effortNote` * | `string` |  |
| `effort` * | `Record<KnownModelEffort, string> & Record<string, string>` | Built-in effort levels are required; custom levels may add entries (missing ones render the raw id). |
| `emptyReason` * | `string` |  |
| `external` * | `string` |  |
| `inputHintModEnter` * | `string` | Hint when `submitOn="mod-enter"`. |
| `inputHint` * | `string` | Screen-reader hint linked to the textarea with aria-describedby. |
| `inputLabel` * | `string` | Accessible name of the message textarea. |
| `kind` * | `Record<AttachmentKind, string> & Record<string, string>` |  |
| `loadMore` * | `string` |  |
| `mentionDrill` * | `string` | Spoken suffix for drillable folder options. |
| `mentionEmpty` * | `string` |  |
| `mentionError` * | `string` |  |
| `mentionKeys` * | `string` |  |
| `mentionLoading` * | `string` |  |
| `mentionRetry` * | `string` |  |
| `mentionTitle` * | `string` |  |
| `modelHeading` * | `string` |  |
| `modelPickerLabel` * | `string` |  |
| `modelPlaceholder` * | `string` |  |
| `modelTriggerLabel` * | `(model: string, effort: string \| undefined) => string` | Accessible name of the trigger: "模型：vision-1，思考强度：均衡". |
| `modelsEmpty` * | `string` |  |
| `modelsError` * | `string` |  |
| `modelsLoading` * | `string` |  |
| `noticeTone` * | `Record<"neutral" \| "info" \| "warning" \| "danger", string>` | Spoken prefix that names the notice tone (the icon is decorative). |
| `optionUnavailable` * | `(reason: string \| undefined) => string` | Text for disabled options: "不可用：…". |
| `overLimitReason` * | `string` |  |
| `permissionConfirmDescription` * | `string` |  |
| `permissionConfirmTitle` * | `(label: string) => string` |  |
| `permissionConfirm` * | `(label: string) => string` |  |
| `permissionElevated` * | `string` |  |
| `permissionMenu` * | `string` |  |
| `permissionTriggerLabel` * | `(label: string) => string` |  |
| `placeholder` * | `string` |  |
| `referenceFailed` * | `string` |  |
| `referenceKind` * | `Record<ReferenceKind, string> & Record<string, string>` |  |
| `referenceLoading` * | `string` |  |
| `referencePicker` * | `{ label: string; add: string; up: string; search: string; loading: string; error: string; empty: string; truncated: string; }` |  |
| `remove` * | `(name: string) => string` |  |
| `resetEffort` * | `string` |  |
| `resultPending` * | `string` |  |
| `retrySameSend` * | `string` |  |
| `retrySameStop` * | `string` |  |
| `retrySave` * | `string` |  |
| `retryUpload` * | `(name: string) => string` |  |
| `retry` * | `string` |  |
| `runningReason` * | `string` |  |
| `send` * | `string` |  |
| `sending` * | `string` |  |
| `skillGroup` * | `string` |  |
| `skillPicker` * | `{ label: string; add: string; limit: (max: string) => string; loading: string; error: string; empty: string; }` |  |
| `skillSelected` * | `string` |  |
| `stale` * | `string` |  |
| `stopPending` * | `string` |  |
| `stop` * | `string` |  |
| `submitFailed` * | `string` |  |
| `submitUnknown` * | `string` |  |
| `submittingReason` * | `string` |  |
| `switchModel` * | `string` |  |
| `unavailable` * | `string` |  |
| `uploadFailed` * | `string` |  |
| `uploadingName` * | `(name: string) => string` |  |
| `uploadingReason` * | `string` |  |
| `uploading` * | `string` |  |

### `AgentFormat`

*interface*

| Member | Type | Description |
| --- | --- | --- |
| `bytes` * | `(value: number) => string` |  |
| `compact` * | `(value: number) => string` |  |
| `date` * | `(iso: string) => string` | Short date ("10月9日" / "Oct 9"). |
| `duration` * | `(ms: number) => string` |  |
| `locale` * | `string` |  |
| `number` * | `RhineNumberFormat` |  |
| `time` * | `(iso: string) => string` | Time of day ("14:20") in the provider locale. |

### `AgentHeaderBadge`

*interface* — AgentHeader (atlas 02): title bar of the open conversation.

| Member | Type | Description |
| --- | --- | --- |
| `count` * | `number` |  |
| `icon` | `React.ReactNode` |  |
| `id` * | `string` |  |
| `label` * | `string` | Accessible text, e.g. "2 个终端运行中". |

### `AgentIdentityView`

*interface* — Conversation, message and run view-models (ADR-0011 §2). Snapshots only: plain, serialisable data with stable ids. Adapters dedupe, order and guard revisions before they reach a component.

| Member | Type | Description |
| --- | --- | --- |
| `id` * | `string` |  |
| `monogram` | `string` | Initials or a short monogram used when no avatar renderer is given. |
| `name` * | `string` |  |
| `role` | `string` | Short role / kind label, e.g. "Research agent". |

### `AgentInterventionMessages`

*interface* — Copy for the intervention family (ADR-0011 §6, §10): ApprovalPanel, QuestionnaireCard, ErrorRecoveryNotice, InterventionDock, GrantList. Keys are flat (prefix = component) so a partial override through `AgentMessagesProvider` replaces single strings, not whole groups.

| Member | Type | Description |
| --- | --- | --- |
| `approvalAllowBlocked` * | `Partial<Record<ApprovalStatus, string>>` | Why "allow" is off in states other than waiting. |
| `approvalAllowOnce` * | `string` |  |
| `approvalAllowSession` * | `string` |  |
| `approvalApprovedSession` * | `string` |  |
| `approvalApproved` * | `string` |  |
| `approvalEvidenceToggle` * | `(count: number) => string` |  |
| `approvalEvidence` * | `string` |  |
| `approvalExpiredBody` * | `string` |  |
| `approvalExpiredTitle` * | `string` |  |
| `approvalExpires` * | `string` |  |
| `approvalIrreversibleTitle` * | `string` |  |
| `approvalMaterialLoading` * | `string` |  |
| `approvalNotAllowed` * | `string` | Default reason when `availability.allowed` is false without a reason. |
| `approvalOperation` * | `(operationId: string) => string` | Eyebrow above the title: operation id in mono. |
| `approvalReceiptAt` * | `(time: string) => string` |  |
| `approvalRefresh` * | `string` |  |
| `approvalRejectNote` * | `string` |  |
| `approvalReject` * | `string` |  |
| `approvalRejected` * | `string` |  |
| `approvalRetryMaterial` * | `string` |  |
| `approvalRetrySubmit` * | `string` |  |
| `approvalRisk` * | `Record<ApprovalRisk, string>` |  |
| `approvalScope` * | `string` |  |
| `approvalStatus` * | `Record<ApprovalStatus, string>` |  |
| `approvalSubject` * | `string` |  |
| `approvalSubmitting` * | `string` |  |
| `approvalUnavailableHint` * | `string` |  |
| `approvalUnavailable` * | `string` |  |
| `approvalUnknownBody` * | `string` |  |
| `approvalUnknownNotRetryable` * | `string` |  |
| `approvalUnknownTitle` * | `string` |  |
| `approvalUnsandboxedTitle` * | `string` |  |
| `approvalUnsandboxed` * | `string` |  |
| `diffAdded` * | `string` |  |
| `diffBinary` * | `string` |  |
| `diffChange` * | `Record<"add" \| "delete" \| "update" \| "move", string>` |  |
| `diffEmpty` * | `string` |  |
| `diffLabel` * | `(path: string) => string` |  |
| `diffRemoved` * | `string` |  |
| `diffStats` * | `(additions: number, deletions: number) => string` |  |
| `diffTruncated` * | `string` |  |
| `dockLabel` * | `string` |  |
| `dockMore` * | `(count: number) => string` |  |
| `grantCount` * | `(count: number) => string` |  |
| `grantEmpty` * | `string` |  |
| `grantError` * | `string` |  |
| `grantLoading` * | `string` |  |
| `grantRejected` * | `string` |  |
| `grantReselectLabel` * | `(target: string) => string` |  |
| `grantReselect` * | `string` |  |
| `grantRetryRevokeLabel` * | `(target: string) => string` |  |
| `grantRetryRevoke` * | `string` |  |
| `grantRetry` * | `string` |  |
| `grantRevokeLabel` * | `(target: string) => string` |  |
| `grantRevoke` * | `string` |  |
| `grantRevoked` * | `string` |  |
| `grantRevokingSr` * | `(target: string) => string` |  |
| `grantScope` * | `string` | Spoken prefix before the scope label. |
| `grantTitle` * | `string` |  |
| `grantUnavailableReason` * | `string` |  |
| `grantUnavailable` * | `string` |  |
| `grantUnknownBody` * | `string` |  |
| `grantUnknownNotRetryable` * | `string` |  |
| `grantUnknownSr` * | `(target: string) => string` |  |
| `grantUnknownTitle` * | `string` |  |
| `questionBack` * | `string` |  |
| `questionConfirm` * | `(unanswered: number) => string` |  |
| `questionCopy` * | `string` |  |
| `questionCount` * | `(current: number, max: number) => string` |  |
| `questionDiscardConfirm` * | `string` |  |
| `questionDiscardDescription` * | `string` |  |
| `questionDiscardDraft` * | `string` |  |
| `questionDiscardError` * | `string` |  |
| `questionDiscardTitle` * | `string` |  |
| `questionDot` * | `(index: number, state: "answered" \| "skipped" \| "unanswered") => string` |  |
| `questionDraft` * | `Record<DraftStatus, string>` |  |
| `questionEndedDraft` * | `string` | Ended questionnaire with a draft that never reached the host. |
| `questionFormLabel` * | `string` |  |
| `questionHintChoice` * | `(last: boolean) => string` |  |
| `questionHintText` * | `string` |  |
| `questionJoin` * | `string` | Separator between chosen option labels in the summary. |
| `questionNeverGrants` * | `string` |  |
| `questionNext` * | `string` |  |
| `questionOtherDescription` * | `string` |  |
| `questionOtherInput` * | `(title: string) => string` |  |
| `questionOther` * | `string` |  |
| `questionOverLimit` * | `(title: string) => string` |  |
| `questionPageNext` * | `string` |  |
| `questionPageNo` * | `(page: number, total: number) => string` |  |
| `questionPagePrev` * | `string` |  |
| `questionPager` * | `string` |  |
| `questionPlaceholder` * | `string` |  |
| `questionProgress` * | `(answered: number, total: number) => string` |  |
| `questionRejected` * | `string` |  |
| `questionRequiredMissing` * | `(count: number) => string` |  |
| `questionRequired` * | `string` |  |
| `questionRetrySave` * | `string` |  |
| `questionRetrySubmit` * | `string` |  |
| `questionSkipAndSubmit` * | `string` |  |
| `questionSkip` * | `string` |  |
| `questionSkipped` * | `string` |  |
| `questionStatus` * | `Record<QuestionnaireStatus, string>` |  |
| `questionSubmit` * | `string` |  |
| `questionSubmitting` * | `string` |  |
| `questionSummarySkipped` * | `string` |  |
| `questionSummaryTitle` * | `Record<"completed" \| "interrupted" \| "expired", string>` |  |
| `questionSummaryUnansweredInterrupted` * | `string` |  |
| `questionSummaryUnanswered` * | `string` |  |
| `questionTitle` * | `string` |  |
| `questionUndoSkip` * | `string` |  |
| `questionUnknownBody` * | `string` |  |
| `questionUnknownTitle` * | `string` |  |
| `recoveryCode` * | `string` |  |
| `recoveryDismiss` * | `string` |  |
| `recoveryKind` * | `Record<RecoveryKind, string> & Record<string, string>` | Known kinds are required; custom kinds may add entries (missing ones render the raw id). |
| `recoveryNote` * | `Record<RecoveryKind, string> & Record<string, string>` | Fixed consequence sentence per kind; empty string = none. Custom kinds have no note. |
| `recoveryPreserved` * | `string` |  |

### `AgentMessagePartHandlers`

*interface* — AgentMessage (atlas 05): one `<article>` per message, named by its header (author + time).

| Member | Type | Description |
| --- | --- | --- |
| `onOpenCitation` | `((citation: CitationView) => void)` |  |
| `onOpenThinking` | `((thinkingId: string) => void)` |  |
| `onRecoveryAction` | `((errorId: string, actionId: string) => void)` |  |
| `renderArtifact` | `ArtifactRenderer` |  |
| `renderTool` | `ToolRenderer` |  |
| `renderers` | `MessagePartRenderers` |  |

### `AgentMessages`

*interface* — Built-in copy of `@wzrhine/agent` (ADR-0011 §10), same rules as ADR-0009: component prop > nearest `AgentMessagesProvider` > `agentZhCN`. Files under `provider/messages/` are the only agent sources allowed to contain CJK text (package-boundary test). The number locale comes from the nearest `RhineProvider` / `RhineMessagesProvider`.

| Member | Type | Description |
| --- | --- | --- |
| `composer` * | `AgentComposerMessages` |  |
| `intervention` * | `AgentInterventionMessages` |  |
| `message` * | `AgentMessageMessages` |  |
| `shell` * | `AgentShellMessages` |  |
| `status` * | `AgentStatusMessages` |  |
| `tools` * | `AgentToolsMessages` |  |
| `workspace` * | `AgentWorkspaceMessages` |  |

### `AgentMessagesProviderProps`

*interface*

| Member | Type | Description |
| --- | --- | --- |
| `children` * | `React.ReactNode` |  |
| `messages` | `AgentMessagesOverrides` | Full table (`agentEnUS`) or a partial override merged over the outer one. |

### `AgentShellContextValue`

*interface*

| Member | Type | Description |
| --- | --- | --- |
| `contextOpen` * | `boolean` |  |
| `hasContext` * | `boolean` |  |
| `hasIndex` * | `boolean` |  |
| `indexCollapsed` * | `boolean` | The index is not visible as an inline column (narrow layout or collapsed). |
| `indexOpen` * | `boolean` |  |
| `layout` * | `AgentShellLayout` |  |
| `setContextOpen` * | `(open: boolean, reason?: AgentShellOpenReason) => void` |  |
| `setIndexOpen` * | `(open: boolean, reason?: AgentShellOpenReason) => void` |  |
| `toggleContext` * | `() => void` |  |

### `AgentShellMessages`

*interface* — Copy for the shell family (ADR-0011 §10): AgentShell, ResizeHandle, AgentHeader, ConversationList, ConversationRow, AgentSidePane and the workspace empty state. Functions receive already formatted numbers and names.

| Member | Type | Description |
| --- | --- | --- |
| `agentIdentity` * | `(name: string, role?: string) => string` | Screen-reader prefix of the agent identity. |
| `archive` * | `string` |  |
| `attention` * | `Record<Attention, string>` |  |
| `back` * | `string` |  |
| `confirmArchive` * | `string` |  |
| `contextLabel` * | `string` | Context sheet title on narrow layouts. |
| `contextToggle` * | `string` | Context toggle (stable name; the state is `aria-pressed`). |
| `create` * | `string` |  |
| `deleteConfirm` * | `string` |  |
| `deleteDescription` * | `(title: string) => string` |  |
| `deleteError` * | `string` |  |
| `deleteTitle` * | `string` |  |
| `delete` * | `string` |  |
| `emptyDescription` * | `string` |  |
| `emptyTitle` * | `string` |  |
| `error` * | `string` |  |
| `indexLabel` * | `string` | Index column / index sheet title. |
| `listLabel` * | `string` |  |
| `loading` * | `string` |  |
| `mainLabel` * | `string` | Reading column (`<section aria-label>`). |
| `more` * | `(title: string) => string` | Name of the row "more" menu button. |
| `openIndex` * | `string` |  |
| `originFork` * | `(parentTitle: string) => string` | Origin button of a forked / sub-agent conversation. |
| `originSubagent` * | `(parentTitle: string) => string` |  |
| `originUnknownParent` * | `string` |  |
| `paneClose` * | `string` |  |
| `paneLabel` * | `string` |  |
| `paneTabs` * | `string` |  |
| `pin` * | `string` |  |
| `pinned` * | `string` |  |
| `rename` * | `string` |  |
| `resizeContext` * | `string` | Resize handle between the reading column and the context pane. |
| `resizeValue` * | `(size: string) => string` | `aria-valuetext` of a resize handle; receives the formatted width. |
| `retry` * | `string` |  |
| `searchEmptyDescription` * | `string` |  |
| `searchEmptyTitle` * | `(query: string) => string` |  |
| `searchLabel` * | `string` |  |
| `searchPlaceholder` * | `string` |  |
| `searchResults` * | `(count: string) => string` |  |
| `separator` * | `string` | Joins the parts of a row's accessible name (title, pinned, status, unread). |
| `subagentBadge` * | `string` |  |
| `unarchive` * | `string` |  |
| `unpin` * | `string` |  |
| `unread` * | `(count: string) => string` |  |
| `untitled` * | `string` |  |
| `workspaceEmptyDescription` * | `string` |  |
| `workspaceEmptyTitle` * | `string` |  |

### `AgentSidePaneSection`

*interface* — AgentSidePane (atlas 26): the context / detail pane. A `complementary` landmark (`<aside aria-label>`) with Tabs (@wzrhine/react) over `sections`.

| Member | Type | Description |
| --- | --- | --- |
| `content` * | `React.ReactNode` |  |
| `count` | `number` |  |
| `id` * | `string` |  |
| `label` * | `string` |  |

### `AgentWorkspaceMessages`

*interface*

| Member | Type | Description |
| --- | --- | --- |
| `artifactChange` * | `Record<ArtifactChangeKey, string>` |  |
| `artifactDownload` * | `(title: string) => string` |  |
| `artifactEmpty` * | `string` |  |
| `artifactKind` * | `Record<ArtifactKind, string> & Record<string, string>` | Known kinds are required; custom kinds may add entries (missing ones render the raw id). |
| `artifactList` * | `string` |  |
| `artifactOpenNamed` * | `(title: string) => string` |  |
| `artifactOpen` * | `string` |  |
| `artifactRetryNamed` * | `(title: string) => string` |  |
| `artifactRetry` * | `string` |  |
| `artifactReveal` * | `(title: string) => string` |  |
| `artifactShowAll` * | `string` |  |
| `artifactStatus` * | `Record<"failed" \| "stale" \| "unavailable" \| "saved" \| "generating" \| "partial", string>` |  |
| `artifactTruncated` * | `string` |  |
| `artifactVersion` * | `(version: string) => string` |  |
| `compactionCancel` * | `string` |  |
| `compactionDelta` * | `(before: string, after: string) => string` |  |
| `compactionPhase` * | `Record<CompactionPhase, string>` |  |
| `compactionRetryHint` * | `string` |  |
| `compactionRetrySave` * | `string` |  |
| `compactionStatus` * | `Record<CompactionStatus, string>` |  |
| `compactionSummary` * | `string` |  |
| `contextBreakdown` * | `string` |  |
| `contextNear` * | `string` |  |
| `contextNoMax` * | `string` |  |
| `contextOver` * | `string` |  |
| `contextPercent` * | `(percent: number) => string` |  |
| `contextStatMissing` * | `string` | Read in place of the visible 「—」 of a missing statistic. |
| `contextStatValue` * | `(value: string, unit: UsageStatUnit) => string` | Formatted value + unit of one statistic (`ms` values arrive already formatted as a duration). |
| `contextStats` * | `string` |  |
| `contextTitle` * | `string` |  |
| `contextTrigger` * | `(summary: string) => string` |  |
| `contextUnit` * | `Record<"tokens" \| "calls" \| "bytes" \| "items", string>` |  |
| `contextUnknown` * | `string` |  |
| `fileBreadcrumbExpand` * | `(count: number) => string` |  |
| `fileBreadcrumb` * | `(name: string) => string` |  |
| `fileChanged` * | `string` |  |
| `fileClose` * | `string` |  |
| `fileContent` * | `(name: string) => string` |  |
| `fileCopiedPath` * | `string` |  |
| `fileCopied` * | `string` |  |
| `fileCopyFailed` * | `string` |  |
| `fileCopyPathFailed` * | `string` |  |
| `fileCopyPath` * | `string` |  |
| `fileCopy` * | `string` |  |
| `fileError` * | `string` |  |
| `fileExternal` * | `string` |  |
| `fileLargeFile` * | `string` |  |
| `fileLoadMore` * | `string` |  |
| `fileLoadedNoTotal` * | `(loaded: string) => string` |  |
| `fileLoaded` * | `(loaded: string, total: string) => string` |  |
| `fileLoading` * | `string` |  |
| `fileMeta` * | `Record<"size" \| "name" \| "type" \| "path" \| "version" \| "language", string>` |  |
| `fileMissing` * | `string` |  |
| `fileMode` * | `Record<FilePreviewMode, string>` |  |
| `fileModes` * | `string` |  |
| `fileNoContent` * | `string` |  |
| `fileOpenExternal` * | `string` |  |
| `fileOpenGroup` * | `Record<"app" \| "reveal", string>` |  |
| `fileOpenTargets` * | `(name: string) => string` |  |
| `fileOpenWith` * | `(target: string) => string` |  |
| `fileReference` * | `string` |  |
| `fileReload` * | `string` |  |
| `fileReread` * | `string` |  |
| `fileRetry` * | `string` |  |
| `fileTabCloseAll` * | `string` |  |
| `fileTabCloseTitle` * | `string` |  |
| `fileTabClose` * | `(name: string) => string` |  |
| `fileTabs` * | `string` |  |
| `fileUnavailable` * | `string` |  |
| `fileUnsupported` * | `string` |  |
| `fileZoomFit` * | `string` |  |
| `fileZoom` * | `string` |  |
| `ledgerActor` * | `Record<LedgerActor, string>` |  |
| `ledgerEmptyFiltered` * | `string` |  |
| `ledgerEmpty` * | `string` |  |
| `ledgerFilter` * | `Record<LedgerFilterKey, string>` |  |
| `ledgerFilters` * | `string` |  |
| `ledgerList` * | `string` |  |
| `ledgerLoading` * | `string` |  |
| `ledgerOpen` * | `(title: string) => string` |  |
| `ledgerOutcome` * | `Record<LedgerOutcomeKey, string>` |  |
| `retry` * | `string` |  |
| `runArtifacts` * | `string` |  |
| `runElapsed` * | `string` |  |
| `runFailedTools` * | `string` |  |
| `runMetrics` * | `string` |  |
| `runOpenDetails` * | `string` |  |
| `runOpenTrace` * | `string` |  |
| `runOverview` * | `{ label: string; capsule: string; close: string; collapse: string; subagents: string; }` |  |
| `runPartial` * | `string` |  |
| `runPersistence` * | `Record<RunPersistenceKey, string>` |  |
| `runRetrySave` * | `string` |  |
| `runSaving` * | `string` |  |
| `runSideEffects` * | `string` |  |
| `runTitle` * | `string` |  |
| `runTokens` * | `string` |  |
| `runToolCount` * | `(count: number) => string` |  |
| `runTools` * | `string` |  |
| `subagentAttention` * | `string` |  |
| `subagentEmpty` * | `string` |  |
| `subagentEstimatedUsage` * | `string` |  |
| `subagentGroup` * | `Record<"completed" \| "attention" \| "active" \| "inherited", string>` |  |
| `subagentInheritedGroup` * | `string` |  |
| `subagentInherited` * | `string` |  |
| `subagentList` * | `string` |  |
| `subagentOpenNamed` * | `(name: string) => string` |  |
| `subagentOpenSnapshotNamed` * | `(name: string) => string` |  |
| `subagentOpenSnapshot` * | `string` |  |
| `subagentOpen` * | `string` |  |
| `subagentParent` * | `(id: string) => string` |  |
| `subagentPartialUsage` * | `string` |  |
| `subagentPendingInput` * | `(count: number) => string` |  |
| `subagentResult` * | `string` |  |
| `subagentTokens` * | `(tokens: string) => string` |  |
| `subagentUsageUnknown` * | `string` |  |
| `summaryOpenSource` * | `(title: string) => string` |  |
| `summaryPin` * | `string` |  |
| `summarySourceUnavailable` * | `string` |  |
| `summarySources` * | `(count: number) => string` |  |
| `summaryStatus` * | `Record<"stale" \| "current" \| "updating" \| "missing", string>` |  |
| `summaryTags` * | `string` |  |
| `summaryToggle` * | `string` |  |
| `summaryUpdatedAt` * | `(time: string) => string` |  |
| `terminalBackend` * | `Record<"pty" \| "process", string>` |  |
| `terminalCalls` * | `(count: number) => string` |  |
| `terminalCwd` * | `string` |  |
| `terminalEmpty` * | `string` |  |
| `terminalExitCode` * | `(code: number) => string` |  |
| `terminalGroup` * | `Record<TerminalGroupKey, string>` |  |
| `terminalHistoryLoadMore` * | `string` |  |
| `terminalHistoryStatus` * | `Record<"unknown" \| "running" \| "failed" \| "returned", string>` |  |
| `terminalHistory` * | `string` |  |
| `terminalIdleNotice` * | `string` |  |
| `terminalInputLabel` * | `(name: string) => string` |  |
| `terminalInputPlaceholder` * | `string` |  |
| `terminalLastCommand` * | `string` |  |
| `terminalList` * | `string` |  |
| `terminalLoadEarlier` * | `string` |  |
| `terminalLoadMore` * | `string` |  |
| `terminalLoading` * | `string` |  |
| `terminalNewOutput` * | `string` |  |
| `terminalNoOutput` * | `string` |  |
| `terminalNotes` * | `string` |  |
| `terminalOpen` * | `(name: string) => string` |  |
| `terminalOutput` * | `(name: string) => string` |  |
| `terminalPartialCapture` * | `string` |  |
| `terminalReadLatest` * | `string` |  |
| `terminalReadOnlyDescription` * | `string` |  |
| `terminalReadOnlyShort` * | `string` |  |
| `terminalReadOnly` * | `string` |  |
| `terminalRetryStop` * | `string` |  |
| `terminalSend` * | `string` |  |
| `terminalStopPending` * | `string` |  |
| `terminalStopVisible` * | `string` |  |
| `terminalStop` * | `(name: string) => string` |  |
| `terminalTabs` * | `string` |  |
| `terminalUnknownNotice` * | `string` |  |

### `ApprovalEvidenceView`

*interface*

| Member | Type | Description |
| --- | --- | --- |
| `format` | `"text" \| "code" \| "path" \| "json"` |  |
| `id` * | `string` |  |
| `label` * | `string` |  |
| `value` * | `string` | Plain text, code or JSON shown verbatim. |

### `ApprovalPanelProps`

*interface* — Tool-permission approval card (atlas 20, ADR-0011 §6).

| Member | Type | Description |
| --- | --- | --- |
| `allowLabel` | `string` |  |
| `allowSessionLabel` | `string` |  |
| `approval` * | `ApprovalView` |  |
| `autoFocus` | `boolean` | Focus the title once on mount. Off by default: new approvals never steal focus. |
| `density` | `"compact" \| "full"` | `compact` docks above the composer: tighter spacing, evidence always behind a disclosure. |
| `evidenceCollapseAt` | `number` | Evidence with more items than this (or with long values) goes behind a disclosure. Default 3. |
| `headingLevel` | `2 \| 3 \| 4` | Title element level. Default 3. |
| `onApprove` | `AgentActionHandler<[ApprovalScope, AgentActionContext]>` |  |
| `onRefresh` | `(() => void)` | Shown in `expired`: refresh the approval state from the runtime. |
| `onReject` | `AgentActionHandler<[AgentActionContext]>` |  |
| `onRetryMaterial` | `(() => void)` | Shown in `unavailable`: reload the approval material. |
| `rejectLabel` | `string` |  |
| `rejectNote` | `React.ReactNode` | Overrides of the footer note and button labels. |
| `renderMaterial` | `((approval: ApprovalView) => React.ReactNode)` | Custom material view (e.g. tools `DiffPreview`). Default: an internal read-only diff of `approval.diff`. |

### `ApprovalView`

*interface*

| Member | Type | Description |
| --- | --- | --- |
| `availability` * | `{ allowed: boolean; reason?: string; }` | Adapter verdict on the material. Approve is disabled unless `allowed`. |
| `diff` | `FileDiffView` |  |
| `evidence` | `ApprovalEvidenceView[]` |  |
| `expiresAt` | `string` |  |
| `irreversible` | `string` | Irreversible effects named explicitly ("删除后不能自动恢复"). |
| `operationId` * | `string` |  |
| `reason` | `string` | Why approval is needed ("修改代码文件", "调用远端服务"). |
| `receipt` | `ActionReceipt` |  |
| `revision` * | `string` |  |
| `risk` | `ApprovalRisk` |  |
| `scope` | `string` | What can change: "1 个文件 · 工作区内". |
| `scopes` | `ApprovalScope[]` | Scopes offered for approval; default `['once']`. |
| `status` * | `ApprovalStatus` |  |
| `summary` * | `string` | What the operation does, one sentence. |
| `tool` * | `Pick<ToolCallView, "name" \| "displayName" \| "subject" \| "category" \| "detail">` | Tool being approved; used for the heading and subject. |
| `unsandboxed` | `boolean` | The operation is not sandboxed. |

### `ArtifactView`

*interface*

| Member | Type | Description |
| --- | --- | --- |
| `alt` | `string` |  |
| `change` | `"created" \| "modified" \| "moved" \| "deleted"` | Change against the workspace, for file artifacts. |
| `id` * | `string` |  |
| `kind` * | `(string & {}) \| ArtifactKind` |  |
| `mimeType` | `string` |  |
| `path` | `string` |  |
| `preview` | `string` | Short text preview or thumbnail URL (for `image`). |
| `reason` | `string` |  |
| `size` | `number` |  |
| `status` * | `"failed" \| "stale" \| "unavailable" \| "saved" \| "generating" \| "partial"` | `saved` only after the artifact is actually persisted. `partial` keeps `reason`. `generating` shows activity without a percentage. |
| `title` * | `string` |  |
| `version` | `string` | Version or revision label. |

### `AttachmentListProps`

*interface*

| Member | Type | Description |
| --- | --- | --- |
| `aria-label` | `string` |  |
| `attachments` | `readonly AttachmentView[]` |  |
| `className` | `string` |  |
| `disabled` | `boolean` | Blocks remove / retry (e.g. while sending). |
| `onRemove` | `((item: { type: "attachment"; attachment: AttachmentView; } \| { type: "reference"; reference: ReferenceView; }) => void)` | Removes the UI reference only; deleting remote files is the adapter's decision. No callback → no button. |
| `onRetry` | `((attachment: AttachmentView) => void)` | Retry a failed upload. No callback → no retry button. |
| `references` | `readonly ReferenceView[]` |  |
| `renderPreview` | `((attachment: AttachmentView) => React.ReactNode)` | Custom preview for an attachment (replaces icon / thumbnail). |

### `AttachmentView`

*interface*

| Member | Type | Description |
| --- | --- | --- |
| `alt` | `string` | Alternative text for image thumbnails. |
| `id` * | `string` |  |
| `kind` * | `AttachmentKind \| (string & {})` |  |
| `mimeType` | `string` |  |
| `name` * | `string` |  |
| `progress` | `number` | 0–1 when known; omit for indeterminate uploads. |
| `reason` | `string` | Reason for `failed` / `stale` / `disabled`. |
| `size` | `number` | Bytes. |
| `status` * | `"failed" \| "stale" \| "ready" \| "uploading" \| "disabled"` |  |
| `thumbnail` | `string` | Thumbnail URL (data: or same-origin). Only rendered for `kind: 'image'`. |

### `Capability`

*interface* — A capability flag with an optional reason shown when it is unavailable.

| Member | Type | Description |
| --- | --- | --- |
| `enabled` * | `boolean` |  |
| `reason` | `string` | Read out and shown as hint text when `enabled` is false. |

### `ChunkPagerActions`

*interface* — Paging callbacks shared by every component that can show a `MaterialPageView`.

| Member | Type | Description |
| --- | --- | --- |
| `canGoBack` * | `boolean` | A previous page exists in the host's offset history (drives 「上一页」). |
| `newer` | `boolean` | Newer material exists than this snapshot. |
| `onFirst` | `(() => void)` | Back to offset 0. Enabled when the page does not start at 0. |
| `onNext` | `((nextOffset: number) => void)` | Next page. Enabled only when `page.nextOffset` is defined (never computed here). |
| `onPrevious` | `(() => void)` |  |
| `onReadLatest` | `(() => void)` | Drops back to the newest snapshot; draws 「读取最新」 next to the `newer` notice. |
| `onRetry` | `(() => void)` | Retries a page that failed to load. |

### `CitationView`

*interface*

| Member | Type | Description |
| --- | --- | --- |
| `excerpt` | `string` |  |
| `id` * | `string` |  |
| `index` * | `number` | Visible index, e.g. 1 → "[1]". |
| `locator` | `string` | Path, URL or locator shown in the hover card. |
| `reason` | `string` |  |
| `sourceType` * | `(string & {}) \| CitationSourceType` |  |
| `title` * | `string` |  |
| `unavailable` | `boolean` | Source is no longer reachable; the chip stays but cannot be opened. |

### `CommandOption`

*interface*

| Member | Type | Description |
| --- | --- | --- |
| `aliases` | `string[]` |  |
| `description` | `string` |  |
| `disabledReason` | `string` |  |
| `disabled` | `boolean` |  |
| `group` | `string` |  |
| `id` * | `string` |  |
| `kind` * | `"skill" \| "command" \| "action"` |  |
| `label` * | `string` |  |
| `name` * | `string` | Inserted / dispatched name without the slash. |
| `selected` | `boolean` |  |
| `shortcut` | `string` |  |

### `ComposerInputHandle`

*interface* — Imperative handle of ComposerInput (also forwarded by Composer).

| Member | Type | Description |
| --- | --- | --- |
| `element` * | `HTMLTextAreaElement \| null` | The underlying textarea (focus management, measurement). |
| `focus` * | `() => void` |  |
| `getSelection` * | `() => ComposerSelection` |  |
| `insertToken` * | `(trigger: TriggerChar, name: string, range?: { from: number; to: number; }) => void` | Insert a token at `range` (default: the current selection), padded with spaces. Goes through the browser's editing commands when available so the insertion is part of native undo. |
| `replaceRange` * | `(from: number, to: number, text: string) => void` | Replace `[from, to)` with plain text (used for folder drilling and clearing a query). |

### `ComposerNoticeAction`

*interface*

| Member | Type | Description |
| --- | --- | --- |
| `id` * | `string` |  |
| `label` * | `string` |  |
| `tone` | `"danger" \| "primary" \| "secondary"` |  |

### `ComposerNoticeProps`

*interface*

| Member | Type | Description |
| --- | --- | --- |
| `actions` | `readonly ComposerNoticeAction[]` |  |
| `busyActionIds` | `readonly string[]` | Ids of actions currently running (button shows busy). |
| `icon` | `AgentIconName \| null` | Replace the tone icon; `null` hides it. |
| `live` | `"off" \| "polite"` | `polite` announces the message when it appears. Default `off`. |
| `message` * | `React.ReactNode` |  |
| `onAction` | `((id: string) => void)` |  |
| `tone` | `ComposerNoticeTone` | Default `info`. |

### `ComposerSelection`

*interface*

| Member | Type | Description |
| --- | --- | --- |
| `end` * | `number` |  |
| `start` * | `number` |  |

### `ComposerState`

*interface*

| Member | Type | Description |
| --- | --- | --- |
| `attachments` | `AttachmentView[]` |  |
| `draftStatus` | `DraftStatus` |  |
| `references` | `ReferenceView[]` |  |
| `submitStatus` | `ActionStatus` |  |
| `value` * | `string` |  |

### `ComposerToken`

*interface*

| Member | Type | Description |
| --- | --- | --- |
| `end` * | `number` | Index after TOKEN_CLOSE. |
| `name` * | `string` |  |
| `start` * | `number` | Index of TOKEN_OPEN. |
| `trigger` * | `TriggerChar` |  |

### `ContextUsageSegment`

*interface*

| Member | Type | Description |
| --- | --- | --- |
| `id` * | `string` |  |
| `label` * | `string` |  |
| `tone` | `"neutral" \| "info" \| "warning" \| "success" \| "accent"` |  |
| `value` * | `number` |  |

### `ContextUsageView`

*interface*

| Member | Type | Description |
| --- | --- | --- |
| `completeness` * | `Completeness` |  |
| `disabled` | `boolean \| { reason?: string; }` |  |
| `estimated` | `boolean` | The number is an estimate rather than a sampled provider value. |
| `label` | `string` |  |
| `max` | `number` | Only reliable maxima produce a percentage. |
| `note` | `string` | "模型配置已变化，等待重新估计" etc. |
| `segments` | `ContextUsageSegment[]` |  |
| `stats` | `UsageStatSection[]` | Extra provider-neutral statistics (cache hit rate, TTFT, TPS…). |
| `unit` * | `"tokens" \| "calls" \| "bytes" \| "items"` |  |
| `used` | `number` |  |

### `ConversationOrigin`

*interface* — Where a conversation came from.

| Member | Type | Description |
| --- | --- | --- |
| `kind` * | `"fork" \| "subagent"` |  |
| `parentId` * | `string` | Parent conversation id. |
| `parentTitle` | `string` |  |

### `ConversationSection`

*interface*

| Member | Type | Description |
| --- | --- | --- |
| `id` * | `string` |  |
| `items` * | `ConversationView[]` |  |
| `label` * | `string` |  |

### `ConversationView`

*interface*

| Member | Type | Description |
| --- | --- | --- |
| `archived` | `boolean` |  |
| `attention` | `"children" \| "question" \| "error" \| "approval"` | Needs the user (approval, question, child needs attention). Shown above unread. |
| `disabled` | `boolean \| { reason?: string; }` |  |
| `id` * | `string` |  |
| `origin` | `ConversationOrigin` |  |
| `pinned` | `boolean` |  |
| `preview` | `string` | Second line: agent name, message count, last activity… |
| `revision` | `string` |  |
| `runPhase` | `RunPhase` |  |
| `runStatus` | `RunStatus` |  |
| `title` * | `string` |  |
| `unreadOutcome` | `"unknown" \| "failed" \| "pending" \| "delivered"` | Whether the latest reference/result was delivered to the host. |
| `unread` | `number` | Unread finished-run count; 0 / undefined hides the marker. |
| `updatedAt` | `string` | ISO timestamp of the last activity. |

### `DiffHunkView`

*interface*

| Member | Type | Description |
| --- | --- | --- |
| `header` | `string` |  |
| `id` * | `string` |  |
| `lines` * | `DiffLineView[]` |  |

### `DiffLineView`

*interface* — A unified diff hunk set for one file.

| Member | Type | Description |
| --- | --- | --- |
| `kind` * | `"add" \| "context" \| "remove" \| "meta"` |  |
| `newLine` | `number` |  |
| `oldLine` | `number` |  |
| `text` * | `string` |  |

### `EditResult`

*interface*

| Member | Type | Description |
| --- | --- | --- |
| `caret` * | `number` |  |
| `value` * | `string` |  |

### `ErrorRecoveryNoticeProps`

*interface* — Error and recovery notice (atlas 34). Tells the user what was kept, what is still unconfirmed and which recovery actions are safe.

| Member | Type | Description |
| --- | --- | --- |
| `announce` | `boolean` | Announce danger notices with `role="alert"`. Pass `false` for notices restored from history. |
| `busyActionIds` | `readonly string[]` | Ids of actions currently running (button shows busy). |
| `onAction` | `((actionId: string) => void)` |  |
| `onDismiss` | `(() => void)` | Resolved notices only. |
| `recovery` * | `RecoveryView` |  |

### `FileDiffView`

*interface*

| Member | Type | Description |
| --- | --- | --- |
| `additions` | `number` |  |
| `before` | `MaterialPageView` | Original material before the write, when the host provides it. |
| `binary` | `boolean` |  |
| `change` * | `"add" \| "delete" \| "update" \| "move"` |  |
| `conflictReason` | `string` |  |
| `created` | `boolean` | True when this operation created the target rather than modifying it. |
| `deletions` | `number` |  |
| `hunks` * | `DiffHunkView[]` |  |
| `movedTo` | `string` | Target path for moves / renames. |
| `noNewlineAtEnd` | `{ old?: boolean; new?: boolean; }` | No trailing newline at end of file (old / new). |
| `observedBytes` | `number` | Observed byte size used when line statistics are unavailable. |
| `path` * | `string` |  |
| `revision` | `string` |  |
| `statsReliable` | `boolean` | Whether additions/deletions came from a complete, trustworthy observation. |
| `status` | `"unavailable" \| "preview" \| "proposed" \| "applied" \| "conflict"` |  |
| `truncated` | `boolean` | Lines omitted from the shown hunks. |

### `FileOpenTarget`

*interface* — One way to open the file, offered by the host (an editor, the system viewer, a folder).

| Member | Type | Description |
| --- | --- | --- |
| `group` | `"app" \| "reveal"` | `app` opens the file; `reveal` shows it in a folder. Default `app`. |
| `id` * | `string` |  |
| `label` * | `string` |  |

### `FilePreviewTab`

*interface*

| Member | Type | Description |
| --- | --- | --- |
| `id` * | `string` |  |
| `kind` | `"unknown" \| "image" \| "text" \| "code" \| "markdown" \| "binary"` |  |
| `name` * | `string` |  |

### `FilePreviewView`

*interface*

| Member | Type | Description |
| --- | --- | --- |
| `alt` | `string` |  |
| `content` | `string` | Loaded text (possibly a chunk) or image URL. |
| `external` | `boolean` |  |
| `id` * | `string` |  |
| `kind` * | `"unknown" \| "image" \| "text" \| "code" \| "markdown" \| "binary"` |  |
| `language` | `string` |  |
| `metadata` | `{ label: string; value: string; }[]` |  |
| `mimeType` | `string` |  |
| `name` * | `string` |  |
| `partial` | `{ loadedBytes: number; totalBytes?: number; }` | Only part of the file is loaded. |
| `path` | `string` |  |
| `reason` | `string` |  |
| `size` | `number` |  |
| `status` * | `"unavailable" \| "error" \| "missing" \| "ready" \| "loading" \| "large-file" \| "changed"` |  |
| `version` | `string` |  |

### `GrantListProps`

*interface* — Standing permissions the user granted (session trust for a task, extra directory access…), typically in a settings pane or side panel (ADR-0011 §6, `GrantView`).

| Member | Type | Description |
| --- | --- | --- |
| `addSlot` | `React.ReactNode` | Host-provided chooser for adding a grant, shown in the header. |
| `empty` | `React.ReactNode` | Text when there are no grants (default from messages). |
| `error` | `React.ReactNode` | Load failure text; shows an Alert (with 「重新读取」 when `onRetry` is given). |
| `footerNote` | `React.ReactNode` | Note under the list, e.g. what revoking does. |
| `grants` * | `readonly GrantView[]` |  |
| `headingLevel` | `2 \| 3 \| 4` | Title element level. Default 3. |
| `loading` | `boolean` |  |
| `onReselect` | `((grant: GrantView) => void)` | Unavailable grants: let the host re-select the target. |
| `onRetry` | `(() => void)` |  |
| `onRevoke` | `AgentActionHandler<[GrantView, AgentActionContext]>` | Revoke one grant. Without it no revoke button is rendered. |
| `title` | `React.ReactNode` | Heading (default from messages: 「会话授权」). |

### `GrantView`

*interface* — A standing permission the user granted (session trust, extra directory access).

| Member | Type | Description |
| --- | --- | --- |
| `available` * | `boolean` | Still usable; `false` shows `reason` and offers re-selection by the host. |
| `detail` | `string` |  |
| `id` * | `string` |  |
| `reason` | `string` |  |
| `receipt` | `ActionReceipt` |  |
| `scopeLabel` * | `string` | "本次会话", "额外读写"… |
| `target` * | `string` | Command, directory or task the grant covers (shown verbatim). |

### `InterventionDockProps`

*interface* — Stacks the current interventions (ApprovalPanel, QuestionnaireCard, ErrorRecoveryNotice) directly above the composer.

| Member | Type | Description |
| --- | --- | --- |
| `animateInitial` | `boolean` | Animate cards already present on the first render. Default false (restored state). |
| `label` | `string` | Accessible name of the region. |
| `moreCount` | `number` | Number of further pending interventions not shown. |

### `LedgerEventView`

*interface*

| Member | Type | Description |
| --- | --- | --- |
| `actor` * | `LedgerActor` |  |
| `at` * | `string` | ISO timestamp. |
| `detail` | `string` |  |
| `id` * | `string` |  |
| `outcome` | `"neutral" \| "info" \| "warning" \| "danger" \| "success"` |  |
| `sequence` * | `number` |  |
| `title` * | `string` |  |

### `LineDiffOptions`

*interface* — Bounded line diff for previews (ADR-0011 §5). Trims the common head and tail, keeps `context` lines around the replaced block and caps each side at `maxLines`. It is a preview aid, not a patch engine: the adapter's canonical diff wins whenever one exists.

| Member | Type | Description |
| --- | --- | --- |
| `context` | `number` |  |
| `maxLines` | `number` |  |

### `MarkdownRenderContext`

*interface*

| Member | Type | Description |
| --- | --- | --- |
| `id` * | `string` | Part or thinking id the source belongs to. |
| `streaming` * | `boolean` | The source is still growing; a renderer may skip expensive work until it settles. |

### `MaterialPageView`

*interface* — One page of stored material (old file content, manifests, patches, terminal output). The next offset comes from the real result only; the host keeps the history of previous offsets.

| Member | Type | Description |
| --- | --- | --- |
| `complete` * | `boolean` | This page reaches the end of the material. |
| `content` | `string` |  |
| `length` * | `number` | Length of this page in `unit`. |
| `nextOffset` | `number` | Start of the next page; absent at the end. |
| `offset` * | `number` | Start of this page. |
| `reason` | `string` |  |
| `status` * | `"error" \| "ready" \| "loading"` |  |
| `total` | `number` | Total size when known. |
| `unit` * | `"bytes" \| "items" \| "lines"` |  |

### `MentionMenuProps`

*interface*

| Member | Type | Description |
| --- | --- | --- |
| `activeIndex` * | `number` |  |
| `className` | `string` |  |
| `error` | `React.ReactNode` | Error text; shown with a retry button when `onRetry` is given. |
| `id` | `string` | Base id; the listbox is `${id}-listbox`, options `${id}-listbox-option-${index}`. |
| `loading` | `boolean` |  |
| `onActiveIndexChange` * | `(index: number) => void` |  |
| `onDrill` | `((option: MentionOption) => void)` | Click on a drillable folder. Without it folders are inserted like files. |
| `onRetry` | `(() => void)` |  |
| `onSelect` * | `(option: MentionOption) => void` | Click on an enabled option (keyboard selection goes through the owning Composer). |
| `open` * | `boolean` |  |
| `options` * | `readonly MentionOption[]` | Options in display order (the host filters them for `query`). |
| `query` * | `string` | Text typed after `@` (may contain a drilled folder prefix, `src/comp`). |
| `side` | `"inline" \| "top" \| "bottom"` | `top` / `bottom` = absolutely positioned against the composer; `inline` = in normal flow (standalone use). |
| `title` | `React.ReactNode` |  |

### `MentionOption`

*interface*

| Member | Type | Description |
| --- | --- | --- |
| `detail` | `string` | Path / description, matched and shown dimmed. |
| `disabledReason` | `string` |  |
| `disabled` | `boolean` |  |
| `drillable` | `boolean` | Folders can be drilled into instead of inserted. |
| `group` | `string` |  |
| `id` * | `string` |  |
| `kind` * | `ReferenceKind \| (string & {})` |  |
| `label` * | `string` |  |

### `MessageListHandle`

*interface* — Imperative handle of MessageList.

| Member | Type | Description |
| --- | --- | --- |
| `isFollowing` * | `() => boolean` | Whether the list currently follows new content. |
| `scrollToLatest` * | `(options?: { smooth?: boolean; }) => void` | Scroll to the newest content and resume following (smooth unless motion is reduced). |
| `viewport` * | `() => HTMLElement \| null` | The scrolling viewport element. |

### `MessagePartProps`

*interface* — MessagePart (atlas 06): renders one `MessagePartView` by `type`. Stable by `part.id` (the caller keys it). Every branch keeps real text in the DOM; nothing is ever rendered blank: a `custom` part without a registered renderer, or a part type this version does not know, shows a fallback box with the type / renderer name, the summary and "无法显示此内容".

| Member | Type | Description |
| --- | --- | --- |
| `onCopy` | `CopyHandler` |  |
| `onOpenCitation` | `((citation: CitationView) => void)` |  |
| `onOpenThinking` | `((thinkingId: string) => void)` |  |
| `onRecoveryAction` | `((errorId: string, actionId: string) => void)` | Error part actions: `(errorId, actionId)`. Without it the action buttons are not rendered. |
| `part` * | `MessagePartView` |  |
| `renderArtifact` | `ArtifactRenderer` |  |
| `renderTool` | `ToolRenderer` |  |
| `renderers` | `MessagePartRenderers` |  |

### `MessagePartRenderers`

*interface* — Content renderers. Every entry is optional: without `markdown` the source is shown as plain text (line breaks kept, fenced code as a CodeBlock, HTML never parsed); without `code` the built-in CodeBlock is used; a `custom` part whose `renderer` key is missing shows a readable fallback with its summary instead of rendering nothing.

| Member | Type | Description |
| --- | --- | --- |
| `code` | `((part: CodePart) => React.ReactNode)` |  |
| `custom` | `Record<string, (part: CustomPart) => React.ReactNode>` |  |
| `markdown` | `((source: string, context: MarkdownRenderContext) => React.ReactNode)` |  |

### `MessageView`

*interface*

| Member | Type | Description |
| --- | --- | --- |
| `author` | `string` | Visible author name ("你", agent name, model label). |
| `conversationId` | `string` |  |
| `createdAt` | `string` |  |
| `details` | `RunDetailsView` | Run details for the assistant turn. |
| `edited` | `boolean` | User edited the message after sending. |
| `id` * | `string` |  |
| `inherited` | `boolean` | Inherited from a parent/fork; read-only. |
| `parts` * | `MessagePartView[]` |  |
| `revision` | `string` |  |
| `role` * | `MessageRole` |  |
| `runId` | `string` |  |
| `sequence` | `number` |  |
| `skillUses` | `SkillUseView[]` | Skills actually loaded for this turn. |
| `status` * | `MessageStatus` |  |
| `usage` | `TokenUsageView` | Run-level usage footer for assistant messages. |

### `ModelEffortOption`

*interface* — An effort choice carrying its own copy; beats the message table.

| Member | Type | Description |
| --- | --- | --- |
| `description` | `string` | Longer hint shown under the label (Radio description). |
| `id` * | `ModelEffort` |  |
| `label` | `string` |  |

### `ModelOptionView`

*interface*

| Member | Type | Description |
| --- | --- | --- |
| `capabilities` | `(ModelCapability \| (string & {}))[]` |  |
| `description` | `string` |  |
| `disabled` | `boolean` |  |
| `efforts` | `(ModelEffortOption \| ModelEffort)[]` | Effort levels this model accepts: bare ids (copy from the message table) or labelled options. |
| `id` * | `string` |  |
| `label` * | `string` |  |
| `providerId` * | `string` |  |
| `unavailableReason` | `string` |  |

### `ModelPickerProps`

*interface*

| Member | Type | Description |
| --- | --- | --- |
| `align` | `"end" \| "start" \| "center"` |  |
| `className` | `string` |  |
| `defaultLayer` | `"effort" \| "models"` | Initial layer when the popover opens. |
| `defaultOpen` | `boolean` |  |
| `disabled` | `boolean` |  |
| `effortLabels` | `Record<string, string>` | Component-level effort labels (ADR-0009 priority: prop > option label > `composer.effort` message table > raw id). Add labels here for effort ids outside the built-in set. |
| `effortState` | `"default" \| "unset" \| "invalid"` |  |
| `effort` | `ModelEffort \| null` | Selected effort (controlled); must be one of the model's `efforts`. |
| `error` | `React.ReactNode` | Error text for the model list (`true` → default copy). |
| `loading` | `boolean` |  |
| `onEffortChange` | `((effort: ModelEffort) => void)` |  |
| `onEffortReset` | `(() => void)` |  |
| `onModelChange` | `((modelId: string, model: ModelOptionView) => void)` |  |
| `onOpenChange` | `((open: boolean) => void)` |  |
| `open` | `boolean` |  |
| `providers` * | `readonly ModelProviderView[]` |  |
| `selectedModel` | `string \| null` | Selected model id (controlled). |
| `side` | `"top" \| "bottom"` |  |

### `ModelProviderView`

*interface*

| Member | Type | Description |
| --- | --- | --- |
| `disabled` | `boolean` |  |
| `id` * | `string` |  |
| `label` * | `string` |  |
| `models` * | `ModelOptionView[]` |  |
| `unavailableReason` | `string` |  |

### `PermissionModeView`

*interface*

| Member | Type | Description |
| --- | --- | --- |
| `description` | `string` |  |
| `id` * | `string` |  |
| `label` * | `string` |  |
| `risk` | `"normal" \| "elevated"` | `elevated` modes (full access) ask for confirmation before switching. |

### `PermissionPickerProps`

*interface*

| Member | Type | Description |
| --- | --- | --- |
| `align` | `"end" \| "start" \| "center"` |  |
| `className` | `string` |  |
| `confirmDescription` | `((mode: PermissionModeView) => React.ReactNode)` |  |
| `confirmErrorText` | `React.ReactNode` |  |
| `confirmLabel` | `((mode: PermissionModeView) => React.ReactNode)` |  |
| `confirmTitle` | `((mode: PermissionModeView) => React.ReactNode)` | Override the confirmation copy for elevated modes. |
| `disabledReason` | `string` |  |
| `disabled` | `boolean` |  |
| `error` | `React.ReactNode` |  |
| `modes` * | `readonly PermissionModeView[]` |  |
| `onChange` | `((modeId: string, mode: PermissionModeView) => void \| Promise<unknown>)` | Called with the chosen mode. Elevated modes call it only after the AlertDialog is confirmed. Return a Promise to keep the confirmation open (loading) until it settles; a rejection keeps it open with the AlertDialog error text. Without it the trigger is rendered disabled. |
| `receipt` | `React.ReactNode` |  |
| `side` | `"top" \| "bottom"` |  |
| `value` * | `string` | Current mode id (controlled). |

### `PinnedSummaryView`

*interface*

| Member | Type | Description |
| --- | --- | --- |
| `body` * | `string` |  |
| `id` * | `string` |  |
| `sources` | `CitationView[]` |  |
| `status` * | `"stale" \| "current" \| "updating" \| "missing"` |  |
| `tags` | `string[]` |  |
| `title` * | `string` |  |
| `updatedAt` | `string` |  |

### `ProcessCallView`

*interface*

| Member | Type | Description |
| --- | --- | --- |
| `blocks` * | `ProcessBlockView[]` |  |
| `elapsedMs` | `number` |  |
| `id` * | `string` |  |
| `ordinal` * | `number` | 1-based call round. |
| `status` * | `"running" \| "completed" \| "failed" \| "interrupted"` |  |

### `QuestionAnswer`

*interface*

| Member | Type | Description |
| --- | --- | --- |
| `optionIds` | `string[]` | Chosen option ids (single: at most one). |
| `questionId` * | `string` |  |
| `skipped` | `boolean` |  |
| `text` | `string` | Text answer or the custom "other" text. |

### `QuestionnaireCardHandle`

*interface* — Agent → user questionnaire (atlas 21, ADR-0011 §6). Collects information only: it never grants tool permissions.

| Member | Type | Description |
| --- | --- | --- |
| `flush` * | `() => void \| Promise<void>` | Ask the host to persist the current answers now (e.g. before closing the page). |
| `focus` * | `() => void` | Focus the first control of the current page. |

### `QuestionnaireCardProps`

*interface*

| Member | Type | Description |
| --- | --- | --- |
| `advanceOnSingleChoice` | `boolean` |  |
| `disabled` | `boolean` |  |
| `draftError` | `React.ReactNode` |  |
| `initialPage` | `number` | Start on this page instead of the first unanswered question. |
| `onAnswerChange` | `((answer: QuestionAnswer) => void)` |  |
| `onCopyAnswers` | `((text: string) => void)` | Read-only summary: copy the answers as plain text (host writes the clipboard). |
| `onDiscardDraft` | `(() => void \| Promise<unknown>)` | Ended questionnaire (completed / expired / interrupted) with an unsaved draft (`draftStatus` `dirty` or `error`): drop the local draft. Confirmed through an AlertDialog. Return a Promise to keep the dialog open until the host settles. |
| `onFlush` | `((answers: QuestionAnswer[]) => void \| Promise<void>)` | Called by the `flush()` handle with the current answers. |
| `onRetrySave` | `(() => void)` | Shown with a failed draft save. |
| `onSubmit` | `AgentActionHandler<[QuestionAnswer[], AgentActionContext]>` |  |
| `questionnaire` * | `QuestionnaireView` |  |
| `renderQuestion` | `((context: QuestionRenderContext) => React.ReactNode)` | Custom question body (ADR-0013 §4). Called for every question; return `null` / `undefined` to keep the built-in body. Required for custom `kind`s beyond single / multiple / text — without it they fall back to a free-text answer. |
| `title` | `React.ReactNode` | Header title override (default: `questionnaire.title` or 「需要你的回答」). |

### `QuestionnaireView`

*interface*

| Member | Type | Description |
| --- | --- | --- |
| `answers` * | `QuestionAnswer[]` |  |
| `draftStatus` * | `DraftStatus` |  |
| `id` * | `string` |  |
| `questions` * | `QuestionView[]` |  |
| `receipt` | `ActionReceipt` |  |
| `revision` * | `string` |  |
| `status` * | `QuestionnaireStatus` |  |
| `submitStatus` * | `ActionStatus` |  |
| `title` | `string` |  |

### `QuestionOptionView`

*interface*

| Member | Type | Description |
| --- | --- | --- |
| `description` | `string` |  |
| `id` * | `string` |  |
| `label` * | `string` |  |

### `QuestionRenderContext`

*interface* — Everything a `renderQuestion` override needs: the question, its answer, and the same update channel the built-in controls use (ADR-0013 §4).

| Member | Type | Description |
| --- | --- | --- |
| `answer` * | `QuestionAnswer` |  |
| `defaultBody` * | `React.ReactNode` | The built-in body for this question; return or wrap it to keep the default rendering. |
| `editable` * | `boolean` | False while the questionnaire is busy / ended / disabled; custom controls should follow it. |
| `question` * | `QuestionView` |  |
| `update` * | `(next: QuestionAnswer) => void` | Replace this question's answer (reports `onAnswerChange`, like the built-in controls). |

### `QuestionView`

*interface*

| Member | Type | Description |
| --- | --- | --- |
| `allowCustom` | `boolean` | Offer a free-text "other" answer for choice questions. |
| `id` * | `string` |  |
| `kind` * | `(string & {}) \| QuestionKind` |  |
| `maxLength` | `number` | Max characters (code points) for text answers. |
| `optional` | `boolean` | May be skipped. Default true. |
| `options` | `QuestionOptionView[]` |  |
| `prompt` | `string` |  |
| `title` * | `string` |  |

### `ReadRangeView`

*interface*

| Member | Type | Description |
| --- | --- | --- |
| `end` | `number` |  |
| `start` * | `number` | 1-based lines or byte offsets, see `unit`. |
| `unit` * | `"bytes" \| "lines"` |  |

### `RecoveryView`

*interface* — Recoverable error state (ErrorRecoveryNotice).

| Member | Type | Description |
| --- | --- | --- |
| `actions` | `{ id: string; label: string; tone?: "primary" \| "secondary" \| "danger"; }[]` | Safe actions; `id` is passed back to the handler. Labels must say what they act on. |
| `code` | `string` |  |
| `id` * | `string` |  |
| `kind` * | `(string & {}) \| RecoveryKind` |  |
| `message` | `string` |  |
| `preserved` | `string[]` | What is still safe: output kept, draft kept… |
| `title` * | `string` |  |

### `ReferenceOption`

*interface*

| Member | Type | Description |
| --- | --- | --- |
| `disabled` | `boolean` |  |
| `kind` | `"file" \| "folder"` |  |
| `name` * | `string` |  |
| `path` * | `string` |  |

### `ReferenceView`

*interface* — A context reference attached to a message or the composer (file, folder, skill, URL…).

| Member | Type | Description |
| --- | --- | --- |
| `delivered` | `boolean` |  |
| `detail` | `string` | Full path / URL / description used for the accessible name and tooltip. |
| `external` | `boolean` | Outside the workspace. |
| `id` * | `string` |  |
| `kind` * | `ReferenceKind \| (string & {})` |  |
| `label` * | `string` |  |
| `reason` | `string` |  |
| `status` | `"failed" \| "stale" \| "ready" \| "loading"` |  |

### `RunDetailsView`

*interface* — What actually ran for one turn (run-details disclosure). Every field optional; missing ≠ zero.

| Member | Type | Description |
| --- | --- | --- |
| `compactionTokens` | `number` | Tokens spent on context compaction during the turn. |
| `effort` | `string` |  |
| `elapsedKind` | `"unknown" \| "exact" \| "lower-bound"` | `lower-bound`: the run was cut, the real time is at least `elapsedMs`. |
| `elapsedMs` | `number` |  |
| `errorCode` | `string` |  |
| `lastActivityAt` | `string` |  |
| `modelId` | `string` |  |
| `model` | `string` |  |
| `notes` | `string[]` |  |
| `permission` | `string` |  |
| `provider` | `string` |  |
| `startedAt` | `string` |  |
| `toolModelUsage` | `(TokenUsageView & { unreportedCalls?: number; })` | Usage of models called from inside tools. |
| `usage` | `TokenUsageView` |  |

### `RunOverviewFact`

*interface*

| Member | Type | Description |
| --- | --- | --- |
| `label` * | `React.ReactNode` |  |
| `value` * | `React.ReactNode` |  |

### `RunOverviewSection`

*interface*

| Member | Type | Description |
| --- | --- | --- |
| `content` * | `React.ReactNode` |  |
| `defaultOpen` | `boolean` |  |
| `id` * | `string` |  |
| `title` * | `React.ReactNode` |  |

### `RunSummaryView`

*interface*

| Member | Type | Description |
| --- | --- | --- |
| `artifacts` | `ArtifactView[]` |  |
| `elapsedMs` | `number` |  |
| `failedTools` | `number` |  |
| `id` * | `string` |  |
| `persistence` | `"unknown" \| "failed" \| "saving" \| "saved"` | Run success and persistence are separate facts. |
| `sideEffects` | `boolean` |  |
| `status` * | `RunStatus \| "saving" \| "partial"` |  |
| `title` | `string` |  |
| `toolCount` | `number` |  |
| `usage` | `{ tokens?: number; completeness: Completeness; }` |  |

### `RunView`

*interface*

| Member | Type | Description |
| --- | --- | --- |
| `actionStatus` | `ActionStatus` |  |
| `artifacts` | `ArtifactView[]` |  |
| `calls` | `ProcessCallView[]` |  |
| `elapsedMs` | `number` |  |
| `error` | `RecoveryView` |  |
| `id` * | `string` |  |
| `label` | `string` | Overrides the default phase label. |
| `model` | `string` |  |
| `persistence` | `"unknown" \| "failed" \| "saving" \| "saved"` | Run finished but local persistence is pending / failed. |
| `phase` | `RunPhase` |  |
| `receipt` | `ActionReceipt` |  |
| `sideEffects` | `boolean` | Tool calls in this run may have changed external state. |
| `startedAt` | `string` |  |
| `status` * | `RunStatus` |  |
| `syncStatus` | `SyncStatus` |  |
| `toolCount` | `number` |  |
| `toolStatusCounts` | `Partial<Record<ToolStatus, number>>` |  |
| `truncated` | `boolean` | Some calls are not shown. |
| `usage` | `TokenUsageView` |  |

### `SendInput`

*interface* — Composer, picker and command view-models (ADR-0011 §8). A real textarea owns IME, selection and undo; tokens in the text are marked with Unicode isolates (see `composer-tokens`).

| Member | Type | Description |
| --- | --- | --- |
| `attachments` * | `AttachmentView[]` |  |
| `raw` * | `string` | Raw value including token markers. |
| `references` * | `ReferenceView[]` |  |
| `text` * | `string` | Readable text: tokens converted back to `@name` / `/name`. |

### `SendStopInput`

*interface*

| Member | Type | Description |
| --- | --- | --- |
| `canSend` * | `boolean` |  |
| `draftStatus` | `DraftStatus` |  |
| `hasRetrySave` * | `boolean` |  |
| `hasRetry` * | `boolean` |  |
| `hasSend` * | `boolean` |  |
| `hasStop` * | `boolean` |  |
| `mode` | `"send" \| "stop"` | Explicit mode; otherwise derived from `runStatus`. |
| `retryable` | `boolean` | From the unknown receipt: whether retrying the same action is safe (default true). |
| `runStatus` | `RunStatus` |  |
| `sendStatus` | `ActionStatus` | Receipt of the last send. |
| `stopStatus` | `ActionStatus` | Receipt of the last stop request. |

### `SendStopResolved`

*interface*

| Member | Type | Description |
| --- | --- | --- |
| `action` * | `"retry" \| "send" \| "stop" \| "retry-save" \| null` | Which callback an activation calls. |
| `enabled` * | `boolean` | Whether activating the button does something right now. |
| `icon` * | `"send" \| "stop"` | Icon shown: arrow or square. |
| `state` * | `SendStopState` |  |

### `SkillOption`

*interface*

| Member | Type | Description |
| --- | --- | --- |
| `disabledReason` | `string` |  |
| `disabled` | `boolean` |  |
| `id` * | `string` |  |
| `label` * | `string` |  |
| `source` | `string` |  |

### `SkillUseView`

*interface* — A skill / plugin that was actually loaded for a turn (vs. merely requested).

| Member | Type | Description |
| --- | --- | --- |
| `digest` | `string` | Content digest (shown shortened) so reviewers can tell versions apart. |
| `id` * | `string` |  |
| `method` * | `"selected" \| "model-loaded"` |  |
| `name` * | `string` |  |
| `source` | `string` | Where it came from: "应用内置", "当前工作区"… |

### `SlashCommandMenuProps`

*interface*

| Member | Type | Description |
| --- | --- | --- |
| `activeIndex` * | `number` |  |
| `className` | `string` |  |
| `id` | `string` |  |
| `loading` | `boolean` |  |
| `onActiveIndexChange` * | `(index: number) => void` |  |
| `onDisabledSelect` | `((option: CommandOption) => void)` | Click on a disabled option: nothing is dispatched, the host may show the reason. |
| `onSelect` * | `(option: CommandOption) => void` | Click on an enabled option. The host decides: insert a token or dispatch an action. |
| `open` * | `boolean` |  |
| `options` * | `readonly CommandOption[]` | Options in display order. Composer orders them commands first, then skills (`orderCommandOptions`). |
| `query` * | `string` | Text typed after `/`. |
| `side` | `"inline" \| "top" \| "bottom"` | `top` / `bottom` = absolutely positioned against the composer; `inline` = in normal flow (standalone use). |
| `title` | `React.ReactNode` |  |

### `StatusMeta`

*interface* — Glyph + tone for every status (ADR-0011 §3). Labels are not here: copy lives in the `@wzrhine/agent` message tables so it can be localised. A state is always rendered as glyph + text, so tone is never the only signal.

| Member | Type | Description |
| --- | --- | --- |
| `active` * | `boolean` | Activity is ongoing (may show a slow indicator; static under reduced motion). |
| `glyph` * | `StatusGlyphName` |  |
| `settled` * | `boolean` | Terminal state: nothing will change without a new action. |
| `tone` * | `AgentTone` |  |

### `SubagentView`

*interface*

| Member | Type | Description |
| --- | --- | --- |
| `elapsedMs` | `number` |  |
| `id` * | `string` |  |
| `inherited` | `boolean` | Record inherited from an earlier run / parent: a read-only snapshot. |
| `name` * | `string` |  |
| `parentId` | `string` |  |
| `parentLabel` | `string` |  |
| `pendingInput` | `number` |  |
| `phase` | `RunPhase` |  |
| `resultAvailable` | `boolean` |  |
| `status` * | `SubagentStatus` |  |
| `task` * | `string` |  |
| `usage` | `{ tokens?: number; completeness: Completeness; }` | Usage so far, labelled partial when incomplete. |

### `TerminalView`

*interface*

| Member | Type | Description |
| --- | --- | --- |
| `activity` | `string` |  |
| `backend` | `"pty" \| "process"` |  |
| `calls` | `number` |  |
| `cwd` | `string` |  |
| `disabled` | `boolean \| { reason?: string; }` |  |
| `exitCode` | `number` |  |
| `history` | `{ id: string; command: string; status: "running" \| "returned" \| "failed" \| "unknown"; exitCode?: number; at?: string; }[]` | Commands run in this terminal, newest last. |
| `id` * | `string` |  |
| `inherited` | `boolean` |  |
| `lastCommand` | `string` |  |
| `name` * | `string` |  |
| `newerOutput` | `boolean` | Newer output exists than the loaded snapshot. |
| `notes` | `string[]` | Short facts shown as notes ("空闲为推断", "结果待保存"). |
| `outputTruncated` | `boolean` | Older output exists. |
| `output` | `string` | Loaded output tail (plain text; ANSI already stripped by the adapter). |
| `partialCapture` | `boolean` | Only part of the output was captured. |
| `readOnly` | `boolean` | Inherited from a parent / earlier run: history only, no input, no stop. |
| `receipt` | `ActionReceipt` |  |
| `shell` | `string` |  |
| `source` | `string` |  |
| `status` * | `TerminalSessionStatus` |  |
| `stopReason` | `string` |  |
| `stoppable` | `boolean` | The host can stop it. Without it no stop control is drawn. |
| `tail` | `string` |  |

### `ThinkingView`

*interface* — Public thinking summary for one model call. Never assumes full private reasoning exists.

| Member | Type | Description |
| --- | --- | --- |
| `elapsedMs` | `number` | Milliseconds. |
| `id` * | `string` |  |
| `label` | `string` |  |
| `latestLine` | `string` | Latest single line, shown collapsed while streaming. |
| `status` * | `"completed" \| "interrupted" \| "streaming"` |  |
| `summary` | `string` | Approved summary text (markdown allowed through the renderer). |
| `truncated` | `boolean` | The shown summary is cut; offer the full record. |

### `TokenBinding`

*interface* — A host binding associated with one composer token. Extra fields are preserved.

| Member | Type | Description |
| --- | --- | --- |
| `name` * | `string` |  |
| `trigger` * | `TriggerChar` |  |

### `TokenUsageView`

*interface*

| Member | Type | Description |
| --- | --- | --- |
| `cacheRead` | `number` |  |
| `cacheWrite` | `number` |  |
| `completeness` * | `Completeness` |  |
| `input` | `number` |  |
| `note` | `string` | "inherited" history, "not returned by provider"… |
| `output` | `number` |  |
| `total` | `number` |  |

### `ToolAuthorizationView`

*interface* — Where the permission for this call came from. Shown as text, never inferred.

| Member | Type | Description |
| --- | --- | --- |
| `decision` * | `"approved" \| "expired" \| "pending" \| "denied" \| "auto"` |  |
| `source` | `string` | Human-readable source: "只读自动允许", "命中常用命令规则"… |

### `ToolCallView`

*interface*

| Member | Type | Description |
| --- | --- | --- |
| `authorization` | `ToolAuthorizationView` |  |
| `category` | `(string & {}) \| ToolCategory` |  |
| `children` | `ToolCallView[]` |  |
| `detail` | `ToolDetailView` |  |
| `detailsLoaded` | `boolean` | Full record not loaded; expanding calls `onLoadDetails`. |
| `disabled` | `boolean \| { reason?: string; }` | Host-level busy/disabled state, with an optional explanation. |
| `displayName` | `string` | Localised name. Falls back to `name`. |
| `elapsedMs` | `number` |  |
| `failure` | `{ code?: string; message: string; retryable?: boolean; }` | Structured failure information; a failed row may still be retryable. |
| `id` * | `string` | Operation id; never shown twice in one list (adapter dedupes). |
| `name` * | `string` | Raw tool name (`read_file`, `mcp.execute`). |
| `parentId` | `string` | Parent operation for nested (Code Mode / script) calls. |
| `receipt` | `ActionReceipt` |  |
| `script` | `{ language?: string; source: string; truncated?: boolean; }` | Script source for Code Mode parents. |
| `sequence` | `number` | Monotonic order across live rows and history. |
| `startedAt` | `string` |  |
| `status` * | `ToolStatus` |  |
| `subject` | `string` | Main argument shown in the row: path, command, pattern… |
| `summary` | `string` | One-line result summary. |

### `ToolDetailActions`

*interface* — Callbacks the built-in detail views can emit, keyed by what they act on.

| Member | Type | Description |
| --- | --- | --- |
| `beforeActions` | `ChunkPagerActions` |  |
| `loadingMore` | `boolean` |  |
| `onCopyText` | `((text: string) => void \| Promise<void>)` |  |
| `onLoadMoreOperations` | `((tool: ToolCallView) => void)` |  |
| `onLoadMoreOutput` | `((tool: ToolCallView) => void)` |  |
| `onOpenChild` | `((childConversationId: string, tool: ToolCallView) => void)` |  |
| `onOpenFullOutput` | `((tool: ToolCallView) => void)` |  |
| `onOpenTerminal` | `((terminalId: string, tool: ToolCallView) => void)` |  |
| `onReadMore` | `((tool: ToolCallView, nextOffset: number) => void)` |  |
| `onReconcile` | `((tool: ToolCallView) => void)` |  |
| `onReload` | `((tool: ToolCallView, path?: string) => void)` |  |
| `onRetrySave` | `((tool: ToolCallView) => void)` |  |
| `onViewFull` | `((tool: ToolCallView, path?: string) => void)` |  |
| `pageActions` | `ChunkPagerActions` |  |
| `rawActions` | `ChunkPagerActions` |  |
| `retrying` | `boolean` |  |

### `ToolOutputView`

*interface*

| Member | Type | Description |
| --- | --- | --- |
| `content` | `string` | The loaded portion. |
| `error` | `string` |  |
| `kind` * | `"text" \| "code" \| "empty" \| "terminal" \| "list" \| "error" \| "json"` |  |
| `language` | `string` |  |
| `status` | `"unavailable" \| "partial" \| "loading" \| "complete"` |  |
| `summary` | `string` | One-line result summary ("返回 12 项", "exit 1"). |
| `totalUnit` | `"bytes" \| "items" \| "lines"` |  |
| `total` | `number` | Total size of the full output, when known (bytes or lines, see `totalUnit`). |
| `truncated` | `"display" \| "execution"` | `display`: the UI shows a limited snippet, the full output exists (load more / open full). `execution`: the tool itself cut its output (limit reached). They must never be conflated. |

### `TriggerMatch`

*interface*

| Member | Type | Description |
| --- | --- | --- |
| `from` * | `number` | Index of the trigger character. |
| `query` * | `string` | Text typed after the trigger. |
| `to` * | `number` | Caret index (end of query). |
| `trigger` * | `TriggerChar` |  |

### `UsageStatRow`

*interface*

| Member | Type | Description |
| --- | --- | --- |
| `completeness` | `Completeness` |  |
| `label` * | `string` |  |
| `unit` * | `"tokens" \| "percent" \| "ms" \| "tokens-per-s" \| "count"` |  |
| `value` | `number` | Missing values render as "—", never 0. |

### `UsageStatSection`

*interface*

| Member | Type | Description |
| --- | --- | --- |
| `id` * | `string` |  |
| `rows` * | `UsageStatRow[]` |  |
| `title` * | `string` |  |

## Types

### `ActionStatus`

*type* — Receipt of one user action (send, stop, approve, submit). `unknown` means the request may or may not have reached the runtime: keep the original action identity and reconcile, never show success.

```ts
type ActionStatus = 'idle' | 'submitting' | 'accepted' | 'rejected' | 'unknown'
```

### `ActivityLedgerProps`

*type*

| Member | Type | Description |
| --- | --- | --- |
| `defaultFilter` | `LedgerFilterKey` |  |
| `events` * | `LedgerEventView[]` |  |
| `filter` | `LedgerFilterKey` | Actor filter (controlled). |
| `loading` | `boolean` | First load in progress (Skeleton rows, `aria-busy`). |
| `messages` | `WorkspaceMessagesProp` |  |
| `onFilterChange` | `((filter: LedgerFilterKey) => void)` |  |
| `onOpenEvent` | `((event: LedgerEventView) => void)` | Opens one event; each row title becomes a button. |
| `showFilters` | `boolean` | Show the filter tabs (default true). |

### `AgentActionHandler`

*type* — Sync or async action callback.

```ts
type AgentActionHandler = ( ...args: Args ) => AgentActionResult | void | Promise<AgentActionResult | void>
```

### `AgentActionResult`

*type*

```ts
type AgentActionResult = | { status: 'accepted'; revision?: string } | { status: 'rejected'; reason: string; code?: string } | { status: 'unknown'; retryable: boolean; reason?: string }
```

### `AgentContextPresentation`

*type* — Where the context slot is rendered right now.

```ts
type AgentContextPresentation = 'inline' | 'sheet' | 'standalone'
```

### `AgentEmptyStateProps`

*type* — AgentEmptyState: EmptyState (@wzrhine/react) with agent defaults. No live role (an empty region is not an event). `onCreate` adds a 「新建会话」 button; without it there is no button.

| Member | Type | Description |
| --- | --- | --- |
| `action` | `React.ReactNode` | Custom action instead of the create button. |
| `createLabel` | `React.ReactNode` |  |
| `description` | `React.ReactNode` |  |
| `headingLevel` | `EmptyStateHeadingLevel` | Render the title as `<h2>`–`<h6>`; omitted = `<p>`. |
| `icon` | `React.ReactNode` | Replace the kind's icon; `null` removes it. Always decorative. |
| `kind` | `EmptyStateKind` |  |
| `onCreate` | `(() => void)` | Primary action; renders a button labelled `createLabel`. |
| `size` | `EmptyStateSize` | `sm` inside tables and cards; `md` for a whole region. |
| `title` | `React.ReactNode` |  |

### `AgentEntranceKind`

*type* — First-entrance kinds. `message` = new message; `row` = tool / ledger row; `card` = intervention card.

```ts
type AgentEntranceKind = 'message' | 'row' | 'card'
```

### `AgentEntranceProps`

*type*

| Member | Type | Description |
| --- | --- | --- |
| `animate` | `boolean` | Animate this mount. Pass `false` for items present on first render or restored from history. |
| `as` | `"div" \| "li" \| "article" \| "section"` |  |
| `index` | `number` | Position among items that arrived together (stagger). |
| `kind` | `AgentEntranceKind` |  |

### `AgentHeaderProps`

*type*

| Member | Type | Description |
| --- | --- | --- |
| `actions` | `React.ReactNode` | Trailing slot (e.g. a Menu with more conversation actions). |
| `backLabel` | `string` |  |
| `badges` | `AgentHeaderBadge[]` |  |
| `contextLabel` | `string` |  |
| `contextOpen` | `boolean` | Explicit pane state; defaults to the surrounding AgentShell. |
| `headingLevel` | `2 \| 3 \| 4 \| 5 \| 6 \| 1` |  |
| `identity` | `AgentIdentityView` |  |
| `onBack` | `(() => void)` |  |
| `onOpenOrigin` | `((origin: ConversationOrigin) => void)` |  |
| `onRename` | `(() => void)` |  |
| `onToggleContext` | `(() => void)` | Explicit toggle; defaults to the surrounding AgentShell's toggle when it has a context slot. |
| `origin` | `ConversationOrigin` |  |
| `pending` | `boolean` | Disables rename (e.g. while a request is pending); other controls stay. |
| `renameLabel` | `string` |  |
| `runPhase` | `RunPhase` |  |
| `runStatus` | `RunStatus` |  |
| `statusLabel` | `string` | Overrides the status label (e.g. a custom phase text). |
| `syncStatus` | `SyncStatus` |  |
| `title` | `string` |  |

### `AgentIconName`

*type*

```ts
type AgentIconName = 'chevron-down' | 'chevron-right' | 'chevron-left' | 'arrow-down' | 'arrow-up' | 'arrow-left' | 'close' | 'plus' | 'search' | 'more' | 'pin' | 'archive' | 'unarchive' | 'trash' | 'edit' | 'fork' | 'copy' | 'check' | 'retry' | 'send' | 'stop' | 'attach' | 'image' | 'at' | 'slash' | 'file' | 'folder' | 'code' | 'terminal' | 'tool' | 'shield' | 'question' | 'agent' | 'spark' | 'panel' | 'link' | 'external' | 'download' | 'history' | 'warning' | 'info' | 'clock' | 'model' | 'globe' | 'database' | 'layers' | 'list'
```

### `AgentIconProps`

*type*

| Member | Type | Description |
| --- | --- | --- |
| `children` | `React.ReactNode` | Custom SVG inner nodes; win over the built-in path for `name`. |
| `name` * | `string` | Built-in icon name. Any other string is accepted together with `children` (ADR-0013 §3): the children become the icon content and `data-icon` carries the custom name. |

### `AgentMessageProps`

*type*

| Member | Type | Description |
| --- | --- | --- |
| `actionCapabilities` | `((message: MessageView) => MessageActionCapabilities \| undefined)` | Per-message availability of the actions (e.g. fork off while a run is active). |
| `announceInterval` | `number` | Minimum gap between streaming announcements (ms). |
| `defaultDetailsOpen` | `boolean` |  |
| `detailsOpen` | `boolean` | Controlled open state of the run-details disclosure. |
| `details` | `RunDetailsView` | Run details shown in the "运行详情" disclosure; defaults to `message.details`. |
| `feedback` | `MessageFeedback \| null` |  |
| `footer` | `React.ReactNode` | Extra content after the body (e.g. a RunSummary from another family). |
| `message` * | `MessageView` |  |
| `model` | `string` | Model label shown after the assistant author. |
| `onCopy` | `CopyHandler` |  |
| `onDetailsOpenChange` | `((open: boolean) => void)` |  |
| `onEdit` | `((messageId: string) => void)` |  |
| `onFeedback` | `((messageId: string, value: MessageFeedback \| null) => void)` |  |
| `onFork` | `((messageId: string) => void)` |  |
| `onOpenCitation` | `((citation: CitationView) => void)` |  |
| `onOpenThinking` | `((thinkingId: string) => void)` |  |
| `onRecoveryAction` | `((errorId: string, actionId: string) => void)` |  |
| `onRegenerate` | `((messageId: string) => void)` |  |
| `onRestoreInput` | `((messageId: string) => void)` | Put this turn's input back into the composer (distinct from `onEdit`). |
| `onRetry` | `((messageId: string) => void)` |  |
| `renderArtifact` | `ArtifactRenderer` |  |
| `renderPart` | `((part: MessagePartView, rendered: React.ReactNode) => React.ReactNode)` | Replaces the rendering of single parts; receives the default rendering. |
| `renderTool` | `ToolRenderer` |  |
| `renderers` | `MessagePartRenderers` |  |

### `AgentMessagesOverrides`

*type*

```ts
type AgentMessagesOverrides = { [K in keyof AgentMessages]?: { [P in keyof AgentMessages[K]]?: OverrideEntry<AgentMessages[K][P]>; }; }
```

### `AgentProcessProps`

*type* — AgentProcess (atlas 09): the record of one run, grouped by model call.

| Member | Type | Description |
| --- | --- | --- |
| `defaultExpanded` | `boolean` |  |
| `expanded` | `boolean` |  |
| `headingLevel` | `2 \| 3 \| 4 \| 5 \| 6` | Heading level of the call titles (default 3). |
| `onExpandedChange` | `((expanded: boolean) => void)` |  |
| `onLoadRecord` | `((blockId: string) => void)` |  |
| `onOpenFull` | `((runId: string) => void)` |  |
| `onOpenThinking` | `((thinkingId: string) => void)` |  |
| `renderTool` | `ToolRenderer` |  |
| `renderers` | `MessagePartRenderers` |  |
| `run` * | `RunView` |  |

### `AgentShellLayout`

*type* — AgentShell (atlas 01): the workbench frame. It owns regions, slots, focus and responsive behaviour only; routing, window chrome and data stay with the host (ADR-0011 §9).

```ts
type AgentShellLayout = 'wide' | 'compact' | 'narrow'
```

### `AgentShellOpenReason`

*type* — Why an open state changed: user toggle, sheet dismissal, layout breakpoint, a new selection.

```ts
type AgentShellOpenReason = 'toggle' | 'dismiss' | 'layout' | 'selection'
```

### `AgentShellProps`

*type*

| Member | Type | Description |
| --- | --- | --- |
| `activeId` | `string` | Id of the conversation being read; a change closes the index sheet on narrow layouts. |
| `breakpoints` | `{ context?: number; index?: number; }` | Breakpoints in rem of the shell's own width (defaults: context 64, index 40). |
| `composer` | `React.ReactNode` | Docked at the bottom of the reading column. |
| `contextLabel` | `string` | Title of the context sheet on compact / narrow layouts. |
| `contextMax` | `number` |  |
| `contextMin` | `number` |  |
| `contextOpen` | `boolean` |  |
| `contextSize` | `number` | Width of the inline context pane in CSS pixels. |
| `context` | `React.ReactNode` | Side pane, usually an AgentSidePane. |
| `conversation` | `React.ReactNode` | Main reading area (MessageList). |
| `defaultContextOpen` | `boolean` |  |
| `defaultContextSize` | `number` |  |
| `defaultIndexOpen` | `boolean` |  |
| `direction` | `"forward" \| "back"` | Direction of the view drill-down animation. |
| `header` | `React.ReactNode` |  |
| `indexLabel` | `string` | Accessible name of the index column and title of the index sheet. |
| `indexOpen` | `boolean` |  |
| `index` | `React.ReactNode` | Conversation index column, usually a ConversationList. |
| `layout` | `AgentShellLayout` | Force a layout (tests, hosts that already know their size). Overrides measurement. |
| `mainLabel` | `string` | Accessible name of the reading column. |
| `onContextClosed` | `(() => void)` |  |
| `onContextOpenChange` | `((open: boolean, reason: AgentShellOpenReason) => void)` |  |
| `onContextSizeChange` | `((size: number) => void)` |  |
| `onIndexOpenChange` | `((open: boolean, reason: AgentShellOpenReason) => void)` |  |
| `rail` | `React.ReactNode` | App navigation rail (hidden on narrow layouts; the host offers its own menu there). |
| `readingMin` | `number` |  |
| `resizable` | `boolean` | Show the ResizeHandle between reading column and pane (default true). |
| `resizeLargeStep` | `number` |  |
| `resizeStep` | `number` |  |
| `viewKey` | `string` | Stable view identity for main conversation ↔ sub-task transitions. |

### `AgentSidePaneProps`

*type*

| Member | Type | Description |
| --- | --- | --- |
| `activeTab` | `string` |  |
| `closeLabel` | `string` |  |
| `defaultTab` | `string` |  |
| `headingLevel` | `2 \| 3 \| 4 \| 5 \| 6` |  |
| `hideHeading` | `boolean` | Hide the visible heading (the landmark keeps its name). |
| `label` | `string` | Accessible name of the landmark (and visible heading). |
| `onClose` | `(() => void)` |  |
| `onTabChange` | `((id: string) => void)` |  |
| `sections` * | `AgentSidePaneSection[]` |  |
| `tabsLabel` | `string` | Accessible name of the tab list. |

### `AgentSparkProps`

*type* — AgentSpark (atlas 25): a 3 × 3 dot matrix hinting at what the agent is doing. Purely visual (`aria-hidden`); the text next to it carries the status. Each phase has its own rhythm, all driven by CSS keyframes over `--rl-motion-loop` multiples. The loop runs only while the phase is active, the page is visible and the matrix is on screen (shared motion lifecycle); reduced motion and settled phases render one static frame that still differs per phase.

```ts
type AgentSparkProps = Omit<React.HTMLAttributes<HTMLSpanElement>, 'children'> & { phase: SparkPhase; size?: 'sm' | 'md'; /** Force the static frame (e.g. twelve sparks in a dense list). Default: animate when active. */ animate?: boolean; }
```

### `AgentStatusProps`

*type* — The status pill shared by every agent component: glyph + label (+ optional meta such as an elapsed time). Tone is never the only signal. Not a live region by itself: components that announce changes wrap it in their own `role="status"` with a throttled text.

| Member | Type | Description |
| --- | --- | --- |
| `active` | `boolean` |  |
| `appearance` | `"pill" \| "inline"` | `pill` = tinted chip; `inline` = glyph + text without a frame. |
| `glyph` * | `StatusGlyphName` |  |
| `label` * | `React.ReactNode` |  |
| `meta` | `React.ReactNode` | Secondary text after the label (elapsed time, count). |
| `size` | `"sm" \| "md"` |  |
| `tone` * | `AgentTone` |  |

### `AgentTone`

*type* — Visual tone shared with `@wzrhine/react` StatusBadge.

```ts
type AgentTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger' | 'accent'
```

### `ApplyPatchDetailProps`

*type*

```ts
type ApplyPatchDetailProps = DetailBase & { detail: DetailOf<'patch'>; onReload?: (path: string) => void; onViewFull?: (path: string) => void; rawActions?: ChunkPagerActions; }
```

### `ApprovalRisk`

*type*

```ts
type ApprovalRisk = 'low' | 'medium' | 'high'
```

### `ApprovalScope`

*type* — Approval scopes the host offers. `once` is the default; `session` only when the host allows it.

```ts
type ApprovalScope = 'once' | 'session'
```

### `ApprovalStatus`

*type* — Approval and questionnaire view-models (ADR-0011 §6). Approval needs complete, verified material to be approvable; reject always works. A questionnaire collects information and never grants permission. Unknown receipts keep the same revision and answers so the adapter can reconcile.

```ts
type ApprovalStatus = 'waiting' | 'material-loading' | 'unavailable' | 'submitting' | 'unknown' | 'approved' | 'rejected' | 'expired'
```

### `ArtifactCardProps`

*type*

| Member | Type | Description |
| --- | --- | --- |
| `artifact` * | `ArtifactView` |  |
| `compact` | `boolean` |  |
| `headingLevel` | `HeadingLevel` |  |
| `messages` | `WorkspaceMessagesProp` |  |
| `onDownload` | `((artifact: ArtifactView) => void)` |  |
| `onOpen` | `((artifact: ArtifactView) => void)` |  |
| `onRetry` | `((artifact: ArtifactView) => void)` | Retries a failed artifact. |
| `onReveal` | `((artifact: ArtifactView) => void)` | Shows the file in its folder (host file manager). |
| `renderPreview` | `((artifact: ArtifactView) => React.ReactNode)` | Custom preview (chart, rendered markdown…); default: image thumbnail, text excerpt or kind icon. |

### `ArtifactKind`

*type* — Artifact kinds the library ships copy and icons for; any other string falls back to the `file` icon and the raw id as its label (ADR-0013 §2).

```ts
type ArtifactKind = 'text' | 'markdown' | 'code' | 'image' | 'file' | 'diff' | 'data' | 'unknown'
```

### `ArtifactListProps`

*type*

| Member | Type | Description |
| --- | --- | --- |
| `artifacts` * | `ArtifactView[]` |  |
| `headingLevel` | `HeadingLevel` |  |
| `messages` | `WorkspaceMessagesProp` |  |
| `onDownload` | `((artifact: ArtifactView) => void)` |  |
| `onOpen` | `((artifact: ArtifactView) => void)` |  |
| `onRetry` | `((artifact: ArtifactView) => void)` | Retries a failed artifact. |
| `onReveal` | `((artifact: ArtifactView) => void)` | Shows the file in its folder (host file manager). |
| `onShowAll` | `(() => void)` | Opens the full artifact list; drawn next to the truncated note. |
| `renderPreview` | `((artifact: ArtifactView) => React.ReactNode)` | Custom preview (chart, rendered markdown…); default: image thumbnail, text excerpt or kind icon. |
| `truncated` | `boolean` | The host listed only part of the artifacts: adds 「部分产物未列出」. |

### `ArtifactRenderer`

*type* — Renders an artifact (wired to the workspace family's ArtifactCard by the host).

```ts
type ArtifactRenderer = (artifact: ArtifactView) => React.ReactNode
```

### `AttachmentKind`

*type* — Attachment kinds the library ships copy and icons for. Any other string is accepted and falls back to the `file` icon and the raw id as its label (ADR-0013 §2).

```ts
type AttachmentKind = 'image' | 'file' | 'pdf' | 'text' | 'code' | 'unknown'
```

### `CapabilityInput`

*type* — Normalised capability: `true` / `false` / `{ enabled, reason }`.

```ts
type CapabilityInput = boolean | Capability
```

### `ChunkPagerProps`

*type*

| Member | Type | Description |
| --- | --- | --- |
| `canGoBack` * | `boolean` | A previous page exists in the host's offset history (drives 「上一页」). |
| `label` * | `string` | Name of the material (「终端输出」, 「旧文件内容」); names the group and the scroll region. |
| `newer` | `boolean` | Newer material exists than this snapshot. |
| `onFirst` | `(() => void)` | Back to offset 0. Enabled when the page does not start at 0. |
| `onNext` | `((nextOffset: number) => void)` | Next page. Enabled only when `page.nextOffset` is defined (never computed here). |
| `onPrevious` | `(() => void)` |  |
| `onReadLatest` | `(() => void)` | Drops back to the newest snapshot; draws 「读取最新」 next to the `newer` notice. |
| `onRetry` | `(() => void)` | Retries a page that failed to load. |
| `page` * | `MaterialPageView` |  |
| `renderContent` | `((text: string) => React.ReactNode)` | Custom renderer of the page text (highlighting); default is wrapped monospace text. |

### `CitationChipProps`

*type* — CitationChip (atlas 32): an inline `<button>` showing "[n]" (or a short label) inside running text. Hover / focus shows a card with title, source type, locator and excerpt; the same text is the button's description (`aria-describedby` → a `hidden` node), so it is never hover-only.

| Member | Type | Description |
| --- | --- | --- |
| `citation` * | `CitationView` |  |
| `icon` | `React.ReactNode` | Custom icon content (SVG inner nodes); wins over the built-in source-type icon. |
| `label` | `React.ReactNode` | Visible text instead of "[n]" (e.g. a short file name). |
| `onOpen` | `((citation: CitationView) => void)` |  |
| `selected` | `boolean` |  |
| `showIcon` | `boolean` | Show the source-type icon before the index. |

### `CitationSourceType`

*type* — Citation source types the library ships copy and icons for; any other string falls back to the `other` presentation (ADR-0013 §2).

```ts
type CitationSourceType = 'file' | 'web' | 'code' | 'dataset' | 'message' | 'other'
```

### `CodeBlockProps`

*type* — CodeBlock: a `<figure>` with a caption (language / file name) and a copy button over a horizontally scrollable `<pre><code>`. Long lines never widen the page; the scroller is focusable (`tabIndex=0`, named by the caption) so keyboard users can scroll it. No highlighting is done here: pass `children` (or MessagePart `renderers.code`) for a highlighted rendering.

| Member | Type | Description |
| --- | --- | --- |
| `children` | `React.ReactNode` | Replaces the plain `<code>` content (e.g. host-highlighted tokens). The copy text stays `code`. |
| `code` * | `string` |  |
| `copyLabel` | `string` | Copy-button name override. |
| `copyable` | `boolean` | `false` hides the copy button. Default: shown when a copy path exists. |
| `filename` | `string` |  |
| `language` | `string` |  |
| `maxHeight` | `string` | CSS length; taller code scrolls vertically inside the block. |
| `onCopy` | `CopyHandler` |  |
| `showLineNumbers` | `boolean` | Show a line-number gutter (decorative, not copied). |

### `CodeModeToolTreeProps`

*type* — CodeModeToolTree (atlas 13): a Code Mode / script parent and the calls it spawned. Nested `<ul>` lists carry the hierarchy (each list is named 「X 的子操作」), CSS borders draw the connectors. Every node is a full ToolRecord with its own status — never merged with the parent — and the outcome line is computed from the direct children (「部分完成：1 个子操作失败」). Recursion handles any depth.

| Member | Type | Description |
| --- | --- | --- |
| `defaultExpandedIds` | `readonly string[]` |  |
| `detailActions` | `ToolDetailActions` | Callbacks for the built-in detail views (read more, reload, open terminal…). |
| `detailsErrors` | `Readonly<Record<string, React.ReactNode>>` | Load errors by tool id (`detailsError` of each row). |
| `expandedIds` | `readonly string[]` |  |
| `label` | `string` | Tree name; defaults to the root's display name. |
| `onExpandedChange` | `((ids: string[]) => void)` |  |
| `onLoadDetails` | `((id: string) => void)` | Called when the row opens and `tool.detailsLoaded === false`, and on retry. |
| `onViewScript` | `((tool: ToolCallView) => void)` | Open the full script of a truncated parent. |
| `renderDetail` | `((tool: ToolCallView) => React.ReactNode \| undefined)` | Override the detail body. Return `undefined` to fall back to the built-in view. |
| `renderTool` | `((tool: ToolCallView, depth: number) => React.ReactNode \| undefined)` | Replace a node's row. Return `undefined` to use ToolRecord. |
| `root` | `ToolCallView` |  |
| `tools` | `readonly ToolCallView[]` |  |

### `CodePart`

*type*

```ts
type CodePart = Extract<MessagePartView, { type: 'code'; }>
```

### `CompactionNoticeProps`

*type*

| Member | Type | Description |
| --- | --- | --- |
| `busy` | `boolean` | Busy flag for the buttons while an action is being submitted. |
| `elapsedMs` | `number` | Elapsed time of a running compaction (the host updates it; nothing polls here). |
| `messages` | `WorkspaceMessagesProp` |  |
| `onCancel` | `AgentActionHandler` | Cancels a running compaction. |
| `onRetrySave` | `AgentActionHandler` | Retries saving the result (`save-pending`). |
| `onSummaryOpenChange` | `((open: boolean) => void)` |  |
| `phase` | `CompactionPhase` | Sub-step of a running compaction, shown as a sub-label. |
| `renderMarkdown` | `((source: string) => React.ReactNode)` |  |
| `retryHint` | `React.ReactNode` | Hint after a failed / interrupted compaction; default 「可输入 /compact 重试」. `null` hides it. |
| `status` * | `CompactionStatus` |  |
| `summaryOpen` | `boolean` | Summary disclosure (controlled). |
| `summary` | `string` | Text of the compaction summary (plain text, or markdown through `renderMarkdown`). |
| `tokensAfter` | `number` |  |
| `tokensBefore` | `number` |  |

### `CompactionPhase`

*type*

```ts
type CompactionPhase = 'preparing' | 'compacting' | 'saving'
```

### `CompactionStatus`

*type*

```ts
type CompactionStatus = 'running' | 'completed' | 'cancelled' | 'failed' | 'interrupted' | 'save-pending'
```

### `Completeness`

*type* — How complete a number is. Percentages are drawn only for `exact` values with a reliable max.

```ts
type Completeness = 'exact' | 'estimated' | 'partial' | 'unknown'
```

### `ComposerInputProps`

*type*

| Member | Type | Description |
| --- | --- | --- |
| `className` | `string` | Class on the wrapper. |
| `defaultValue` | `string` |  |
| `hint` | `React.ReactNode` | Screen-reader hint linked via aria-describedby; `false` removes it. |
| `inputClassName` | `string` | Class on the textarea. |
| `onMenuKey` | `((event: React.KeyboardEvent<HTMLTextAreaElement>) => boolean)` | Called for every key outside IME composition, before token deletion and submit. Return `true` when the key was consumed (menu navigation): the default action is prevented. |
| `onSubmit` | `(() => void)` | Enter (or Mod+Enter with `submitOn="mod-enter"`) outside IME composition. Without it Enter inserts a newline. |
| `onTokenRemoved` | `((token: ComposerToken) => void)` | A token disappeared from the text through a user edit (whole-token delete, cut, overwrite). |
| `onTriggerChange` | `((match: TriggerMatch \| null) => void)` | Active `@` / `/` trigger before the caret; `null` when none. Not called during IME composition. |
| `onValueChange` | `((value: string, caret: number) => void)` | Every edit (typing, IME, paste, cut, token insert / delete). `caret` is the new selection end. |
| `slash` | `"line-start" \| "word-start"` |  |
| `submitOn` | `"enter" \| "mod-enter"` |  |
| `tokenKind` | `((token: ComposerToken) => ComposerTokenKind)` | Mirror colour per token (default: `@` → file, `/` → command). |
| `triggers` | `readonly TriggerChar[]` | Triggers to detect (default both). |
| `value` | `string` |  |

### `ComposerNoticeTone`

*type* — A notice that stands in for the input frame when this thread cannot take a message: a sub-agent conversation (「这是子代理的对话，回到主对话发送消息」), an archived thread (「恢复归档」), an inherited / read-only thread. Pass it to `Composer replacement`; the intervention dock above stays, so approvals and questions still reach the user.

```ts
type ComposerNoticeTone = 'neutral' | 'info' | 'warning' | 'danger'
```

### `ComposerProps`

*type*

| Member | Type | Description |
| --- | --- | --- |
| `allowEmptyText` | `boolean` | Allow sending when the text is empty if at least one attachment or reference exists. |
| `aria-label` | `string` |  |
| `attachments` | `readonly AttachmentView[]` |  |
| `blocked` | `string \| boolean` | Input blocked by a pending intervention (e.g. a questionnaire): the textarea becomes read-only and `aria-disabled`, the reason replaces the placeholder and shows in the feedback line. `true` uses the default copy ("请先在上方回答问题"). |
| `canSend` | `boolean` | Extra condition for sending (e.g. a model must be selected), with its reason. |
| `className` | `string` |  |
| `commandLoading` | `boolean` |  |
| `commandOptions` | `readonly CommandOption[]` | Enables the `/` menu (commands first, then skills). Filtered locally unless `onCommandQuery` is given. |
| `defaultValue` | `string` |  |
| `disabledReason` | `string` | Why the composer is disabled (feedback line). |
| `disabled` | `boolean` |  |
| `draftStatus` | `DraftStatus` |  |
| `feedback` | `React.ReactNode` | Extra feedback content after the status text. |
| `id` | `string` |  |
| `intervention` | `React.ReactNode` | Approval / questionnaire cards docked above the frame (height animates via grid rows). |
| `maxLength` | `number` | Shows a character counter and blocks sending above the limit (code points of the plain text). |
| `mentionError` | `React.ReactNode` |  |
| `mentionLoading` | `boolean` |  |
| `mentionOptions` | `readonly MentionOption[]` | Enables the `@` menu. Filtered locally unless `onMentionQuery` is given (then the host filters). |
| `mentionTokenName` | `((option: MentionOption, query: string) => string)` | Token text for a chosen option (default: drilled folder + label). |
| `menuSide` | `"top" \| "bottom"` | Side the menus open on. |
| `onCommandQuery` | `((query: string \| null) => void)` |  |
| `onCommand` | `((option: CommandOption, match: TriggerMatch) => "insert" \| void)` | A command or skill was chosen. Return `'insert'` to replace the typed `/query` with a token; otherwise the typed query is removed and the host dispatches its own action. |
| `onDisabledCommand` | `((option: CommandOption, match: TriggerMatch) => "consume" \| void)` | A disabled command was chosen: nothing is dispatched; its reason shows in the feedback line. |
| `onFilesDrop` | `((files: File[]) => void)` | Files dropped on the frame (drag-over highlight while dragging). No callback → no drop zone. |
| `onFilesPaste` | `((files: File[]) => void)` | Files pasted into the textarea. Text paste is untouched. |
| `onMentionDrill` | `((option: MentionOption) => void)` | A folder was drilled into (the query is already rewritten to `folder/`). |
| `onMentionQuery` | `((query: string \| null) => void)` | Query typed after `@` while the menu is open; `null` when it closes. |
| `onMentionRetry` | `(() => void)` |  |
| `onReferenceAdd` | `((option: MentionOption, tokenName: string) => void)` | A mention was inserted as a token: bind the reference. |
| `onRemoveAttachment` | `((attachment: AttachmentView) => void)` |  |
| `onRemoveReference` | `((reference: ReferenceView) => void)` |  |
| `onRetryAction` | `((kind: "send" \| "stop", actionId: string \| undefined) => void)` | Retry an `unknown` send / stop with its original actionId (ADR-0011 §4). |
| `onRetryAttachment` | `((attachment: AttachmentView) => void)` |  |
| `onRetryDraftSave` | `(() => void)` |  |
| `onRetryPersistence` | `(() => void)` |  |
| `onStop` | `(() => void)` |  |
| `onSubmit` | `((input: SendInput) => void)` | Receives the plain text (`@name` / `/name`), the raw value with markers, references and attachments. |
| `onTokenRemoved` | `((token: ComposerToken) => void)` | A token disappeared from the text (whole-token delete, cut, overwrite): unbind its reference. |
| `onValueChange` | `((value: string) => void)` |  |
| `persistence` | `"idle" \| DraftStatus` |  |
| `placeholder` | `string` |  |
| `readOnly` | `boolean` |  |
| `references` | `readonly ReferenceView[]` |  |
| `replacement` | `React.ReactNode` | Rendered instead of the input frame, menus and feedback line, e.g. a `ComposerNotice` for a sub-agent, archived or inherited thread. The `intervention` slot stays above it, so approvals and questions still dock. The draft value is kept and comes back when `replacement` is removed. |
| `retryBusy` | `boolean` |  |
| `runStatus` | `RunStatus` |  |
| `sendDisabledReason` | `string` |  |
| `showCount` | `boolean` | Show the counter without a limit. |
| `slash` | `"line-start" \| "word-start"` |  |
| `stopStatus` | `ActionReceipt \| ActionStatus` |  |
| `submitOn` | `"enter" \| "mod-enter"` |  |
| `submitStatus` | `ActionReceipt \| ActionStatus` | Receipt of the last send. `submitting` / `unknown` block Enter and the button (no duplicates). |
| `tokenKind` | `((token: ComposerToken) => ComposerTokenKind)` |  |
| `toolbarEnd` | `React.ReactNode` | Toolbar end before the send button (ModelPicker, PermissionPicker, context ring). |
| `toolbarStart` | `React.ReactNode` | Toolbar start (e.g. a "+" Menu: 添加图片 / 引用文件 / 使用技能). |
| `value` | `string` |  |

### `ComposerTokenKind`

*type* — Visual kind of a token in the mirror layer.

```ts
type ComposerTokenKind = 'file' | 'skill' | 'command'
```

### `ContextUsageProps`

*type*

| Member | Type | Description |
| --- | --- | --- |
| `align` | `PopoverAlign` |  |
| `messages` | `WorkspaceMessagesProp` |  |
| `onOpenChange` | `((open: boolean) => void)` |  |
| `openOnHover` | `boolean` | `ring`: also open the Popover on hover (focus and click still open it). |
| `open` | `boolean` |  |
| `segmentScale` | `"full" \| "fit-used"` |  |
| `side` | `PopoverSide` | Popover placement for `ring`. |
| `usage` * | `ContextUsageView` |  |
| `variant` | `ContextUsageVariant` | `ring`: compact trigger (ring + 「12.4K / 32K」) that opens the full view in a Popover. `bar`: one line with a meter. `full`: meter, breakdown legend, warnings and note. |

### `ContextUsageVariant`

*type*

```ts
type ContextUsageVariant = 'ring' | 'bar' | 'full'
```

### `ConversationListProps`

*type* — ConversationList (atlas 03): grouped conversation index with search, selection and row actions.

| Member | Type | Description |
| --- | --- | --- |
| `collapsedGroups` | `readonly string[]` |  |
| `collapsibleGroups` | `boolean` |  |
| `empty` | `React.ReactNode` | Empty state shown when there are no conversations and no search. |
| `error` | `React.ReactNode` | Error message; `true` uses the default copy. |
| `headingLevel` | `2 \| 3 \| 4 \| 5 \| 6` | Level of the group headings (and the empty-state title). |
| `isDisabled` | `((item: ConversationView) => boolean)` | Rows that cannot be selected or acted on (e.g. while a switch is pending). |
| `label` | `string` | Accessible name of the list region. |
| `loading` | `boolean` |  |
| `now` | `Date` | Reference time for row timestamps (default: now). |
| `onArchive` | `((item: ConversationView) => void)` |  |
| `onCollapsedGroupsChange` | `((groups: string[]) => void)` |  |
| `onDelete` | `((item: ConversationView) => void \| Promise<unknown>)` |  |
| `onPin` | `((item: ConversationView, pinned: boolean) => void)` |  |
| `onRetry` | `(() => void)` |  |
| `onSearchChange` | `((query: string) => void)` | Renders the search input. |
| `onSelect` | `((id: string) => void)` |  |
| `onUnarchive` | `((item: ConversationView) => void)` |  |
| `renderActions` | `((item: ConversationView) => React.ReactNode)` | Extra controls per row (rendered before the "more" menu). |
| `search` | `string` | Controlled search query; the host filters `sections`. |
| `sections` * | `ConversationSection[]` |  |
| `selectedId` | `string` |  |
| `skeletonRows` | `number` | Number of skeleton rows while loading. |

### `ConversationRowProps`

*type* — ConversationRow (atlas 04): one conversation in the index.

| Member | Type | Description |
| --- | --- | --- |
| `actions` | `React.ReactNode` | Extra controls next to the "more" button. |
| `disabled` | `boolean` |  |
| `item` * | `ConversationView` |  |
| `now` | `Date` | Reference time for the today / earlier format (default: now). |
| `onArchive` | `((item: ConversationView) => void)` |  |
| `onDelete` | `((item: ConversationView) => void \| Promise<unknown>)` | Confirmed delete. Return a Promise to keep the dialog open until it settles. |
| `onPin` | `((item: ConversationView, pinned: boolean) => void)` | Toggle pin; receives the requested state. |
| `onSelect` | `((id: string) => void)` |  |
| `onUnarchive` | `((item: ConversationView) => void)` |  |
| `selected` | `boolean` |  |

### `CopyHandler`

*type* — Host copy handler. Return `false` (or throw / reject) to report a failure; anything else counts as copied. Without a handler the text goes to `navigator.clipboard.writeText`.

```ts
type CopyHandler = (text: string) => void | boolean | Promise<void | boolean>
```

### `CopyState`

*type*

```ts
type CopyState = 'idle' | 'copied' | 'failed'
```

### `CustomPart`

*type*

```ts
type CustomPart = Extract<MessagePartView, { type: 'custom'; }>
```

### `DiffPreviewProps`

*type* — DiffPreview (atlas 31): one file diff. Header = path, change kind, `+N −M` stats and the proposal status. Lines sit in their own horizontally scrolling, focusable region (the page never overflows); each line is old line no · new line no · sign · code. The sign is visible text (`+` / `−` / space) and screen readers hear 「新增」/「删除」; line numbers are hidden from assistive tech and unselectable, so copying a block copies code only. Added / removed lines are tinted with the success / danger subtle tokens *and* carry the sign, never colour alone.

| Member | Type | Description |
| --- | --- | --- |
| `after` | `string` |  |
| `before` | `string` | Convenience: compute a preview diff from two strings (ignored when `diff` is given). |
| `diff` | `FileDiffView` |  |
| `hideHeader` | `boolean` | Hide the header (when an outer disclosure already shows it). |
| `onReload` | `(() => void)` | Re-read the latest file (shown on conflict). |
| `onViewFull` | `(() => void)` | Open the full diff (shown when the diff is truncated). |
| `path` | `string` | Path for the `before` / `after` form. |
| `status` | `"unavailable" \| "preview" \| "proposed" \| "applied" \| "conflict"` | Status for the `before` / `after` form (defaults to `preview`). |

### `DraftStatus`

*type* — Draft persistence (composer, questionnaire).

```ts
type DraftStatus = 'clean' | 'dirty' | 'saving' | 'saved' | 'error'
```

### `EditFileDetailProps`

*type*

```ts
type EditFileDetailProps = DetailBase & { detail: DetailOf<'file-edit'>; pageActions?: ChunkPagerActions; display?: 'verbatim' | 'diff'; }
```

### `FilePreviewMode`

*type*

```ts
type FilePreviewMode = 'preview' | 'raw' | 'metadata'
```

### `FilePreviewProps`

*type*

| Member | Type | Description |
| --- | --- | --- |
| `breadcrumbRoot` | `string` | Workspace root. Paths under it show as a workspace-relative breadcrumb (root name first); paths outside it get the 「外部」 badge. |
| `copyable` | `boolean` | Copy the loaded text. Default true for text-like files. |
| `defaultMode` | `FilePreviewMode` |  |
| `defaultOpenTarget` | `string` | Target used by the primary half of the split button; default the first `app` target. |
| `defaultZoom` | `FilePreviewZoom` | Initial image zoom; default `fit`. |
| `file` * | `FilePreviewView` |  |
| `headingLevel` | `HeadingLevel` |  |
| `messages` | `WorkspaceMessagesProp` |  |
| `mode` | `FilePreviewMode` | Active tab (controlled). |
| `onClose` | `(() => void)` |  |
| `onCopyPath` | `((path: string, file: FilePreviewView) => void \| Promise<void>)` | Copies `file.path` (menu item 「复制路径」); default writes it to the clipboard. |
| `onLoadMore` | `(() => void)` | Loads the next chunk of a partially loaded file. |
| `onModeChange` | `((mode: FilePreviewMode) => void)` |  |
| `onOpenExternal` | `((file: FilePreviewView) => void)` |  |
| `onOpenWith` | `((targetId: string, file: FilePreviewView) => void)` |  |
| `onReference` | `((file: FilePreviewView) => void)` | Adds the file as a reference to the conversation. |
| `onReload` | `(() => void)` |  |
| `onRetry` | `(() => void)` |  |
| `openTargets` | `FileOpenTarget[]` | Ways to open the file. With `onOpenWith` they render a split button + menu. |
| `referenceDisabled` | `boolean` |  |
| `reloading` | `boolean` |  |
| `renderCode` | `((code: string, language?: string) => React.ReactNode)` | Code renderer (highlighting); default is numbered plain lines. |
| `renderMarkdown` | `((source: string) => React.ReactNode)` | Markdown renderer for the preview tab; default shows the source. |
| `zoomLevels` | `number[]` | Image zoom percentages (of the natural width); a 「适应宽度」 option is always added. |

### `FilePreviewTabsProps`

*type*

| Member | Type | Description |
| --- | --- | --- |
| `activeId` * | `string` | The open tab (controlled). |
| `messages` | `WorkspaceMessagesProp` |  |
| `onActivate` * | `(id: string) => void` |  |
| `onCloseAll` | `(() => void)` | Closes every file; Escape inside the strip and the trailing close button call it. |
| `onCloseTab` * | `(id: string) => void` |  |
| `renderPanel` * | `(id: string) => React.ReactNode` | Panel content of the active tab (usually a `FilePreview`). |
| `returnFocusRef` | `React.RefObject<HTMLElement \| null>` | Focus target after the last tab closes (the element that opened the preview). |
| `tabs` * | `FilePreviewTab[]` |  |

### `FilePreviewZoom`

*type* — A zoom percentage of the image's natural width, or `fit` (scale to the preview width).

```ts
type FilePreviewZoom = number | 'fit'
```

### `FileReadDetailProps`

*type*

```ts
type FileReadDetailProps = DetailBase & { detail: DetailOf<'file-read'>; /** Continue reading from the runtime-provided `nextOffset`. Rendered only when `nextOffset` exists. */ onReadMore?: (nextOffset: number) => void; }
```

### `FileWriteDetailProps`

*type*

```ts
type FileWriteDetailProps = DetailBase & { detail: DetailOf<'file-write'>; onReload?: () => void; onViewFull?: () => void; beforeActions?: ChunkPagerActions; display?: 'verbatim' | 'diff'; }
```

### `GenericToolDetailProps`

*type*

```ts
type GenericToolDetailProps = DetailBase & { detail: DetailOf<'generic'>; outputProps?: Pick<ToolOutputProps, 'onLoadMore' | 'onOpenFull' | 'loadingMore' | 'onCopyText'>; }
```

### `JumpToLatestProps`

*type* — JumpToLatest (atlas 35): floating pill shown while the reader is away from the newest content. A real `<button>` named "返回最新消息" (+ "N 条新消息" when `unreadCount` > 0). Appearing never moves focus; if the button held focus when it hides, focus is left to the caller (MessageList moves nothing — the viewport keeps the reading position).

```ts
type JumpToLatestProps = Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'onClick' | 'type'> & { /** At the newest content: the button is hidden. */ atLatest: boolean; unreadCount?: number; onJump: () => void; loading?: boolean; label?: string; }
```

### `KnownModelEffort`

*type* — The effort levels `@wzrhine/agent` ships copy for.

```ts
type KnownModelEffort = 'off' | 'low' | 'medium' | 'high' | 'max' | 'xhigh'
```

### `LedgerActor`

*type*

```ts
type LedgerActor = 'agent' | 'tool' | 'system' | 'user'
```

### `LedgerFilterKey`

*type*

```ts
type LedgerFilterKey = 'all' | LedgerActor
```

### `ManageFilesDetailProps`

*type*

```ts
type ManageFilesDetailProps = DetailBase & { detail: DetailOf<'manage-files'>; onLoadMore?: () => void; loadingMore?: boolean; pageActions?: ChunkPagerActions; }
```

### `MCPExecuteDetailProps`

*type*

| Member | Type | Description |
| --- | --- | --- |
| `detail` * | `{ kind: "mcp"; server: string; tool: string; endpoint?: string; catalogRevision?: string; catalogStale?: boolean; arguments?: unknown; output?: ToolOutputView; remote?: "pending" \| "completed" \| "failed" \| "unknown"; }` |  |
| `onReconcile` | `(() => void)` | Ask the adapter to reconcile an unknown remote result. Shown only for `remote: 'unknown'`. |
| `outputProps` | `Pick<ToolOutputProps, "onLoadMore" \| "onOpenFull" \| "loadingMore" \| "onCopyText">` |  |

### `MessageActionCapabilities`

*type* — Per-action availability: `Capability` (`{ enabled, reason }`) or a boolean. Absent = enabled.

```ts
type MessageActionCapabilities = Partial<Record<MessageActionKey, CapabilityInput>>
```

### `MessageActionKey`

*type* — Actions that can be gated by a capability.

```ts
type MessageActionKey = 'copy' | 'regenerate' | 'edit' | 'fork' | 'restore' | 'feedback'
```

### `MessageActionsProps`

*type* — MessageActions: a `role="toolbar"` of icon buttons for one message. A capability without a callback renders no button (ADR-0011 §4); copy appears when `copyText` is given and either `onCopy` or the Clipboard API exists. One tab stop: arrow keys / Home / End move between the buttons (roving tabindex), Tab leaves the toolbar.

| Member | Type | Description |
| --- | --- | --- |
| `capabilities` | `Partial<Record<MessageActionKey, CapabilityInput>>` | Availability per action; a disabled one is shown `aria-disabled` with its reason. |
| `children` | `React.ReactNode` | Extra trailing buttons (rendered inside the toolbar, part of the roving order). |
| `copyText` | `string` | Text copied by the copy action; omit to hide copy. |
| `feedback` | `MessageFeedback \| null` |  |
| `label` | `string` | Toolbar name; defaults to the copy table. |
| `onCopy` | `CopyHandler` |  |
| `onEdit` | `(() => void)` |  |
| `onFeedback` | `((value: MessageFeedback \| null) => void)` |  |
| `onFork` | `(() => void)` |  |
| `onRegenerate` | `(() => void)` |  |
| `onRestoreInput` | `(() => void)` | Restore this turn's input into the composer (not the same as `onEdit`). |
| `order` | `MessageActionKey[]` | Preferred action order; omitted uses the library order. |

### `MessageFeedback`

*type*

```ts
type MessageFeedback = 'up' | 'down'
```

### `MessageListProps`

*type* — MessageList (atlas 07): the conversation viewport. It owns its own vertical scroll and decides when to follow new content; it never moves focus.

| Member | Type | Description |
| --- | --- | --- |
| `animateEntrance` | `boolean` | Turn off entrance motion for appended messages. |
| `earlierError` | `React.ReactNode` | Error text for the last earlier-load attempt; shows a retry button. |
| `empty` | `React.ReactNode` | Replaces the default empty state. |
| `followThreshold` | `number` |  |
| `footer` | `React.ReactNode` | Content after the last message inside the scroller (run summary, typing line). |
| `hasEarlier` | `boolean` |  |
| `holdFollow` | `boolean` | Pause auto-follow while true (content still renders); resumes on release if still at the latest. |
| `isStreaming` | `boolean` |  |
| `jumpThreshold` | `number` |  |
| `label` | `string` | Accessible name of the viewport. |
| `loadingEarlier` | `boolean` |  |
| `loading` | `boolean` | First load: no messages yet. |
| `messageProps` | `Omit<AgentMessageProps, "message">` | Props forwarded to the default AgentMessage (handlers, renderers). |
| `messages` * | `MessageView[]` |  |
| `nestedScrollSelector` | `string` |  |
| `onFollowChange` | `((following: boolean) => void)` |  |
| `onLoadEarlier` | `(() => void)` |  |
| `renderMessage` | `((message: MessageView, index: number) => React.ReactNode)` | Custom rendering per message; the list still wraps it in a keyed `<li data-message-id>`. |

### `MessagePartType`

*type*

```ts
type MessagePartType = MessagePartView['type']
```

### `MessagePartView`

*type*

| Member | Type | Description |
| --- | --- | --- |
| `id` * | `string` |  |
| `type` * | `"image" \| "text" \| "code" \| "custom" \| "thinking" \| "error" \| "status" \| "markdown" \| "tool-call" \| "attachment" \| "reference" \| "citation" \| "artifact"` |  |

### `MessageRole`

*type*

```ts
type MessageRole = 'user' | 'assistant' | 'system' | 'tool'
```

### `MessageStatus`

*type* — Message delivery state; streaming is not a status of its own but `status: 'streaming'`.

```ts
type MessageStatus = 'pending' | 'streaming' | 'complete' | 'partial' | 'failed' | 'cancelled' | 'interrupted'
```

### `ModelCapability`

*type* — Model capabilities the library ships copy for; any other string renders as-is (ADR-0013 §2).

```ts
type ModelCapability = 'image' | 'video' | 'tools' | 'reasoning' | 'long-context'
```

### `ModelEffort`

*type* — Reasoning-effort level of a model. The six built-in levels have localised copy in `@wzrhine/agent`; adapters may use any other string (vendor tiers, numeric levels) and supply labels through `ModelEffortOption.label`, the ModelPicker `effortLabels` prop or the `composer.effort` message table (ADR-0013 §1).

```ts
type ModelEffort = 'off' | 'low' | 'medium' | 'high' | 'max' | 'xhigh' | (string & {})
```

### `MultiFileDiffProps`

*type* — MultiFileDiff: several file diffs as a list of disclosures, each with its own status (a conflict in one file never colours the others). The first file and every conflicting file are open by default; `expanded` / `onExpandedChange` control it by path.

| Member | Type | Description |
| --- | --- | --- |
| `defaultExpanded` | `readonly string[]` |  |
| `expanded` | `readonly string[]` |  |
| `files` * | `readonly FileDiffView[]` |  |
| `label` | `string` | List name; defaults to 「改动的文件」. |
| `onExpandedChange` | `((paths: string[]) => void)` |  |
| `onReload` | `((path: string) => void)` |  |
| `onViewFull` | `((path: string) => void)` |  |

### `NativeModelDetailProps`

*type*

| Member | Type | Description |
| --- | --- | --- |
| `detail` * | `{ kind: "model"; provider: string; model: string; purpose?: string; inputs?: { id: string; label: string; size?: number; mimeType?: string; destination?: string; }[]; params?: Record<string, string \| number \| boolean>; results?: { id: string; label: string; preview?: string; alt?: string; saved: boolean; }[]; save?: "pending" \| "saving" \| "saved" \| "partial" \| "failed"; costNotice?: string; endpoint?: string; route?: string; timeoutMs?: number; sha256?: string; arguments?: unknown; remote?: boolean \| "pending" \| "completed" \| "failed" \| "unknown"; stopReason?: string; saveRetry?: boolean; saveError?: string; }` |  |
| `onRetrySave` | `(() => void)` | Save the generated material again (never calls the model again). Shown for partial / failed saves. |
| `retrying` | `boolean` |  |
| `running` | `boolean` | The tool call is still running: show activity without a percentage. |

### `PersistentTerminalProps`

*type*

| Member | Type | Description |
| --- | --- | --- |
| `headingLevel` | `HeadingLevel` |  |
| `hideName` | `boolean` | Hide the name heading (e.g. inside `TerminalTabs`, where the tab already names it). |
| `messages` | `WorkspaceMessagesProp` |  |
| `onInput` | `AgentActionHandler<[text: string, terminal: TerminalView]>` | Sends one line to the session. Without it (or when read-only) no input line is drawn. |
| `onLoadEarlier` | `AgentActionHandler<[terminal: TerminalView]>` | Loads older output (`terminal.outputTruncated`). The scroll position is kept. |
| `onLoadMoreHistory` | `AgentActionHandler<[terminal: TerminalView]>` | Loads earlier entries of `terminal.history`. |
| `onReadLatest` | `AgentActionHandler<[terminal: TerminalView]>` | Reads the newest output (`terminal.newerOutput`); draws 「有新输出，读取最新」. |
| `onStop` | `AgentActionHandler<[terminal: TerminalView]>` | Requests a stop. Drawn only when `terminal.stoppable`. Also used by 「重试停止」. |
| `page` | `MaterialPageView` | One page of stored output; replaces the live tail with a `ChunkPager`. |
| `pager` | `Partial<ChunkPagerActions>` | Paging callbacks for `page` (`canGoBack` defaults to false). |
| `terminal` * | `TerminalView` |  |

### `PinnedSummaryProps`

*type*

| Member | Type | Description |
| --- | --- | --- |
| `defaultExpanded` | `boolean` |  |
| `expanded` | `boolean` | Body expanded (controlled). |
| `headingLevel` | `HeadingLevel` |  |
| `messages` | `WorkspaceMessagesProp` |  |
| `onExpandedChange` | `((expanded: boolean) => void)` |  |
| `onOpenSource` | `((citation: CitationView) => void)` | Opens a source. Without it sources are listed as text. |
| `onPinChange` | `((pinned: boolean) => void)` |  |
| `pinned` | `boolean` | Pin state; the pin toggle is drawn only with `onPinChange`. |
| `renderMarkdown` | `((source: string) => React.ReactNode)` | Markdown renderer for the body; default is plain text with kept line breaks. |
| `summary` * | `PinnedSummaryView` |  |

### `ProcessBlockView`

*type* — One step inside a model call (stage text, tool reference, thinking).

| Member | Type | Description |
| --- | --- | --- |
| `id` * | `string` |  |
| `type` * | `"tool" \| "text" \| "thinking" \| "pending-record"` |  |

### `QuestionAnswerState`

*type* — Pure answer helpers for QuestionnaireCard (ADR-0011 §6). No React; safe for adapters.

```ts
type QuestionAnswerState = 'answered' | 'skipped' | 'unanswered'
```

### `QuestionKind`

*type* — Question kinds with built-in controls. Any other string is a custom kind: QuestionnaireCard renders it through `renderQuestion` (falling back to a free-text answer) and treats its answer as text-like (ADR-0013 §4).

```ts
type QuestionKind = 'single' | 'multiple' | 'text'
```

### `QuestionnaireStatus`

*type*

```ts
type QuestionnaireStatus = 'waiting' | 'drafting' | 'saving' | 'submit-pending' | 'unknown' | 'completed' | 'expired' | 'interrupted'
```

### `QuestionToolDetailProps`

*type*

```ts
type QuestionToolDetailProps = DetailBase & { detail: DetailOf<'question'>; }
```

### `RecoveryKind`

*type* — Recovery kinds the library ships copy and tones for; any other string falls back to the `unknown` presentation (warning tone + question glyph) and renders its raw id (ADR-0013 §2).

```ts
type RecoveryKind = | 'retryable' | 'save-pending' | 'cancel-unconfirmed' | 'tool-side-effects' | 'timeout' | 'offline' | 'unknown' | 'resolved'
```

### `ReferenceKind`

*type* — Reference kinds the library ships copy and icons for; any other string is accepted and falls back to the `custom` presentation (ADR-0013 §2).

```ts
type ReferenceKind = 'file' | 'folder' | 'skill' | 'command' | 'url' | 'symbol' | 'custom'
```

### `ReferencePickerProps`

*type*

| Member | Type | Description |
| --- | --- | --- |
| `anchor` | `HTMLElement \| React.RefObject<HTMLElement \| null>` |  |
| `defaultOpen` | `boolean` |  |
| `disabled` | `boolean` |  |
| `error` | `React.ReactNode` |  |
| `hasMore` | `boolean` |  |
| `hideTrigger` | `boolean` |  |
| `items` | `readonly ReferenceOption[]` |  |
| `loadingMore` | `boolean` |  |
| `loading` | `boolean` |  |
| `onAdd` * | `(path: string) => Promise<boolean> \| boolean` |  |
| `onLoadMore` | `(() => void)` |  |
| `onNavigate` | `((path: string) => void)` |  |
| `onOpenChange` | `((open: boolean) => void)` |  |
| `onRetry` | `(() => void)` |  |
| `onSearch` | `((query: string) => void)` |  |
| `onUp` | `(() => void)` |  |
| `onValueChange` | `((value: string) => void)` |  |
| `open` | `boolean` |  |
| `truncated` | `boolean` |  |
| `value` | `string` |  |

### `ResizeHandleProps`

*type* — ResizeHandle (atlas 01): a focusable vertical splitter between two columns.

| Member | Type | Description |
| --- | --- | --- |
| `defaultSize` | `number` |  |
| `disabled` | `boolean` |  |
| `getAriaValueText` | `((size: number) => string)` |  |
| `label` | `string` | Accessible name; defaults to the shell copy 「调整详情面板宽度」. |
| `largeStep` | `number` | Shift + arrow step. |
| `max` * | `number` |  |
| `min` * | `number` |  |
| `onDraggingChange` | `((dragging: boolean) => void)` |  |
| `onSizeChange` | `((size: number) => void)` |  |
| `pane` | `"end" \| "start"` | Logical side of the handle the resized pane is on. |
| `resetSize` | `number` | Size restored on double-click; defaults to `defaultSize`. |
| `size` | `number` |  |
| `step` | `number` | Arrow-key step in CSS pixels. |

### `RunCommandDetailProps`

*type*

| Member | Type | Description |
| --- | --- | --- |
| `detail` * | `{ kind: "command"; command: string; cwd?: string; shell?: string; timeoutMs?: number; exitCode?: number; execution?: "pending" \| "running" \| "returned" \| "background" \| "timed-out" \| "cancel-unconfirmed"; output?: ToolOutputView; terminalId?: string; sandboxed?: boolean; }` |  |
| `onCopyText` | `((text: string) => void \| Promise<void>)` |  |
| `onOpenTerminal` | `((terminalId: string) => void)` |  |
| `outputProps` | `Pick<ToolOutputProps, "onLoadMore" \| "onOpenFull" \| "loadingMore" \| "onCopyText">` | Passed through to the output (display truncation). |

### `RunDetailsProps`

*type* — RunDetails: what actually ran for one turn, as a `<dl>` of labelled rows (`<div>` groups of `<dt>` + `<dd>`). Rows, in order: permission, provider, model, model id (mono), effort, start (`<time>`), elapsed, last activity (`<time>`), chat usage, cache read / write, tool-model usage, compaction tokens, error code (mono), notes.

```ts
type RunDetailsProps = Omit<React.HTMLAttributes<HTMLDListElement>, 'children'> & { details: RunDetailsView; }
```

### `RunOverviewProps`

*type*

| Member | Type | Description |
| --- | --- | --- |
| `defaultOpen` | `boolean` |  |
| `facts` | `readonly RunOverviewFact[]` |  |
| `messages` | `WorkspaceMessagesProp` |  |
| `onClose` | `(() => void)` |  |
| `onOpenChange` | `((open: boolean) => void)` |  |
| `onReopen` | `(() => void)` |  |
| `onSectionOpenChange` | `((id: string, open: boolean) => void)` |  |
| `open` | `boolean` |  |
| `sectionOpen` | `Readonly<Record<string, boolean>>` |  |
| `sections` | `readonly RunOverviewSection[]` |  |
| `subagents` | `readonly SubagentView[]` |  |
| `terminals` | `React.ReactNode` |  |

### `RunPhase`

*type* — What a run is doing right now. Finer than `RunStatus` and purely descriptive: it drives the label, glyph and AgentSpark phase, never the available actions.

```ts
type RunPhase = | 'queued' | 'preparing' | 'waiting-model' | 'thinking' | 'responding' | 'executing-tool' | 'waiting-user' | 'waiting-approval' | 'waiting-children' | 'waiting-resource' | 'compacting' | 'saving' | 'cancelling'
```

### `RunStatusProps`

*type* — RunStatus (atlas 10): the run axis as glyph + label (+ phase, elapsed, hint). Sync health and the receipt of the last user action are separate axes and render as their own small chips when they say something (`syncStatus` ≠ live, `actionStatus` ≠ idle) — a reconnecting stream never changes the run label, and an `unknown` receipt is never drawn as success.

| Member | Type | Description |
| --- | --- | --- |
| `actionStatus` | `ActionStatus` |  |
| `announceInterval` | `number` | Minimum gap between announcements (ms). |
| `announce` | `boolean` | Render a polite, throttled screen-reader announcement of the label. |
| `appearance` | `"pill" \| "inline" \| "line"` |  |
| `elapsedMs` | `number` |  |
| `hint` | `React.ReactNode` | Short explanation shown after the status ("等待你批准 1 个操作"). |
| `labelOverride` | `React.ReactNode` | Replaces the computed label. |
| `phase` | `RunPhase` |  |
| `run` | `Pick<RunView, "status" \| "phase" \| "label" \| "elapsedMs" \| "syncStatus" \| "actionStatus">` |  |
| `size` | `"sm" \| "md"` |  |
| `status` | `RunStatusValue` |  |
| `syncStatus` | `SyncStatus` |  |

### `RunSummaryProps`

*type*

| Member | Type | Description |
| --- | --- | --- |
| `headingLevel` | `HeadingLevel` |  |
| `messages` | `WorkspaceMessagesProp` |  |
| `onOpenArtifact` | `((id: string) => void)` | Opens one artifact from the mini list. |
| `onOpenDetails` | `(() => void)` |  |
| `onOpenTrace` | `(() => void)` |  |
| `onRetrySave` | `AgentActionHandler` | Retries persisting the result (`persistence: 'failed'`). |
| `run` * | `RunSummaryView` |  |

### `SendStopButtonProps`

*type*

| Member | Type | Description |
| --- | --- | --- |
| `canSend` * | `boolean` | There is something to send (non-empty text, nothing uploading, within limits). |
| `className` | `string` |  |
| `disabledReason` | `string` | Why sending is not possible; shown in the tooltip and linked with aria-describedby. |
| `draftStatus` | `DraftStatus` |  |
| `labels` | `Partial<Record<SendStopState \| "send-retry" \| "stop-retry", string>>` | Override labels per state. |
| `mode` | `"send" \| "stop"` | Force a mode. Default: `stop` while `canStopRun(runStatus)` or `cancelling`, else `send`. |
| `onRetrySave` | `(() => void)` | Draft save failed: the button becomes 重试保存. |
| `onRetry` | `((kind: "send" \| "stop", actionId: string \| undefined) => void)` | Retry an `unknown` action with its original `actionId` (ADR-0011 §4). Without it, or when the receipt says `retryable: false`, the unknown state is inert so no duplicate action is created. |
| `onSend` | `(() => void)` |  |
| `onStop` | `(() => void)` |  |
| `retryBusy` | `boolean` |  |
| `runStatus` | `RunStatus` |  |
| `sendReceipt` | `ActionReceipt \| ActionStatus` | Receipt of the last send (`submitting` → inert, `unknown` → 结果待确认). |
| `stopReceipt` | `ActionReceipt \| ActionStatus` | Receipt of the last stop request (`submitting` / `accepted` while the run still runs → 停止待确认). |

### `SendStopState`

*type* — Visible state of the persistent send / stop button (ADR-0011 §3–4).

```ts
type SendStopState = 'send' | 'sending' | 'send-unknown' | 'retry-save' | 'stop' | 'stop-pending' | 'stop-unknown'
```

### `SkillPickerProps`

*type*

| Member | Type | Description |
| --- | --- | --- |
| `anchor` | `HTMLElement \| React.RefObject<HTMLElement \| null>` |  |
| `defaultOpen` | `boolean` |  |
| `disabled` | `boolean` |  |
| `error` | `React.ReactNode` |  |
| `hideTrigger` | `boolean` |  |
| `loading` | `boolean` |  |
| `max` | `number` |  |
| `onChange` * | `(skills: SkillOption[]) => void` |  |
| `onLimitReached` | `((max: number) => void)` |  |
| `onOpenChange` | `((open: boolean) => void)` |  |
| `onRetry` | `(() => void)` |  |
| `open` | `boolean` |  |
| `selected` * | `readonly SkillOption[]` |  |
| `skills` * | `readonly SkillOption[]` |  |

### `SkillUseListProps`

*type* — SkillUseList: the skills that were actually loaded for a turn (not merely requested), as a compact meta row: "已加载技能：name · source · 手动选择 / 模型加载 · digest". The digest is cut to its first 8 characters in mono (the full value is the `title`), enough to tell versions apart.

```ts
type SkillUseListProps = Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> & { skills: SkillUseView[]; /** Visible label; defaults to the copy table. */ label?: React.ReactNode; }
```

### `SparkPhase`

*type* — AgentSpark phase (dot-matrix rhythm) for a run phase.

```ts
type SparkPhase = 'idle' | 'thinking' | 'responding' | 'executing' | 'waiting' | 'done' | 'error'
```

### `StatusGlyphName`

*type* — Status glyph names drawn by `@wzrhine/agent` (`StatusGlyph`). Each one is paired with text.

```ts
type StatusGlyphName = | 'idle' | 'pending' | 'thinking' | 'tool' | 'waiting-user' | 'approval' | 'saving' | 'done' | 'failed' | 'stopping' | 'stopped' | 'active' | 'unknown' | 'terminal' | 'children' | 'compacting' | 'reconnecting' | 'offline'
```

### `StatusGlyphProps`

*type*

| Member | Type | Description |
| --- | --- | --- |
| `active` | `boolean` | Ongoing activity: CSS adds a slow breathing halo (`data-loop` from the caller). |
| `children` | `React.ReactNode` | Custom SVG inner nodes; win over the built-in glyph for `name`. |
| `name` * | `string` | Built-in glyph name. Any other string is accepted together with `children` (ADR-0013 §3): the children become the glyph content and `data-glyph` carries the custom name. |
| `tone` | `AgentTone` |  |

### `SubAgentCardProps`

*type*

| Member | Type | Description |
| --- | --- | --- |
| `agent` * | `SubagentView` |  |
| `animate` | `boolean` | Animate the spark (default). `false` forces the static frame, e.g. in long lists. |
| `headingLevel` | `HeadingLevel` |  |
| `messages` | `WorkspaceMessagesProp` |  |
| `onOpenSnapshot` | `((id: string) => void)` | Opens the read-only snapshot of an inherited record; draws 「查看快照」. |
| `onOpen` | `((id: string) => void)` | Opens the sub-task; draws 「查看子任务」. Not drawn for inherited records. |

### `SubAgentListProps`

*type*

| Member | Type | Description |
| --- | --- | --- |
| `agents` * | `SubagentView[]` |  |
| `animate` | `boolean` |  |
| `disabled` | `boolean` |  |
| `empty` | `React.ReactNode` |  |
| `groupBy` | `"none" \| "state"` |  |
| `groupInherited` | `boolean` | Put inherited records under their own 「继承的子任务记录」 heading after the live ones. |
| `headingLevel` | `HeadingLevel` | Level of each card heading; the list heading (`title`) is one level above. |
| `messages` | `WorkspaceMessagesProp` |  |
| `onOpenSnapshot` | `((id: string) => void)` |  |
| `onOpen` | `((id: string) => void)` |  |
| `title` | `string \| (string & React.ReactElement<unknown, string \| React.JSXElementConstructor<any>>) \| (string & Iterable<React.ReactNode>) \| (string & React.ReactPortal) \| (string & Promise<AwaitedReactNode>)` | Visible list heading; omitted → the list is named by `aria-label` only. |
| `variant` | `"row" \| "card"` |  |

### `SubagentStatus`

*type*

```ts
type SubagentStatus = | 'queued' | 'preparing' | 'running' | 'waiting-children' | 'waiting-user' | 'needs-attention' | 'completed' | 'failed' | 'interrupted' | 'cancelled'
```

### `SubagentToolDetailProps`

*type*

```ts
type SubagentToolDetailProps = DetailBase & { detail: DetailOf<'agent'>; onOpenChild?: (childConversationId: string) => void; }
```

### `SyncStatus`

*type* — Connection / event-stream health for the snapshot being shown. Never changes the run status.

```ts
type SyncStatus = 'live' | 'reconnecting' | 'stale' | 'offline' | 'unknown'
```

### `TerminalGroupKey`

*type*

```ts
type TerminalGroupKey = 'open' | 'ended' | 'unknown' | 'inherited'
```

### `TerminalListProps`

*type*

| Member | Type | Description |
| --- | --- | --- |
| `currentId` | `string` |  |
| `defaultCollapsed` | `TerminalGroupKey[]` | Groups collapsed on first render (uncontrolled per group). Default: inherited. |
| `empty` | `React.ReactNode` |  |
| `error` | `React.ReactNode` |  |
| `hasMore` | `boolean` | `false` hides the 「加载更多终端」 button even when `onLoadMore` is given. |
| `loadingMore` | `boolean` |  |
| `loading` | `boolean` |  |
| `messages` | `WorkspaceMessagesProp` |  |
| `onLoadMore` | `(() => void)` |  |
| `onOpen` | `((terminal: TerminalView) => void)` |  |
| `onRetry` | `(() => void)` |  |
| `onStop` | `AgentActionHandler<[terminal: TerminalView, context: { actionId: string; }]>` |  |
| `terminals` * | `TerminalView[]` |  |
| `total` | `number` |  |

### `TerminalRowProps`

*type*

| Member | Type | Description |
| --- | --- | --- |
| `current` | `boolean` | Marks the open terminal (`aria-current`). |
| `messages` | `WorkspaceMessagesProp` |  |
| `onOpen` | `((terminal: TerminalView) => void)` | Opens the terminal (row button). Without it the row is plain text. |
| `onStop` | `AgentActionHandler<[terminal: TerminalView, context: { actionId: string; }]>` | Stop action; a separate button, drawn only when the terminal is stoppable. |
| `terminal` * | `TerminalView` |  |

### `TerminalSessionStatus`

*type* — `unclosed`: the session is alive (a command returning does not close it). `stop-pending`: a stop was requested and is not confirmed yet.

```ts
type TerminalSessionStatus = | 'opening' | 'running' | 'waiting-input' | 'idle' | 'stop-pending' | 'closing' | 'ended' | 'failed' | 'unknown'
```

### `TerminalTabsProps`

*type*

| Member | Type | Description |
| --- | --- | --- |
| `defaultValue` | `string` |  |
| `headingLevel` | `HeadingLevel` |  |
| `messages` | `WorkspaceMessagesProp` |  |
| `onInput` | `AgentActionHandler<[text: string, terminal: TerminalView]>` |  |
| `onLoadEarlier` | `AgentActionHandler<[terminal: TerminalView]>` |  |
| `onLoadMoreHistory` | `AgentActionHandler<[terminal: TerminalView]>` |  |
| `onReadLatest` | `AgentActionHandler<[terminal: TerminalView]>` |  |
| `onStop` | `AgentActionHandler<[terminal: TerminalView]>` |  |
| `onValueChange` | `((id: string) => void)` |  |
| `terminals` * | `TerminalView[]` |  |
| `value` | `string` | Active terminal id (controlled). |

### `ThinkingBlockProps`

*type* — ThinkingBlock (atlas 08): the public thinking summary of one model call as a disclosure, collapsed by default. It never assumes private reasoning exists: without a summary it says so.

| Member | Type | Description |
| --- | --- | --- |
| `defaultExpanded` | `boolean` |  |
| `expanded` | `boolean` |  |
| `label` | `React.ReactNode` | Overrides `thinking.label` / the default label. |
| `onExpandedChange` | `((expanded: boolean) => void)` |  |
| `onOpenFull` | `((thinkingId: string) => void)` | Shown as a button under the truncated notice. |
| `renderers` | `MessagePartRenderers` |  |
| `thinking` * | `ThinkingView` |  |

### `ToolActivityProps`

*type* — ToolActivity (atlas 11): one round of tool calls. The header is a disclosure button with the operation count, the running count, elapsed time and aggregated status counts (glyph + text). While any row is active an AgentSpark (executing) runs next to the count; it is decorative — the running count is the text. Rows are deduped by id and ordered by `sequence`.

| Member | Type | Description |
| --- | --- | --- |
| `active` | `boolean` | The round is still running. Defaults to "any row is active". |
| `defaultExpanded` | `boolean` |  |
| `detailActions` | `ToolDetailActions` | Callbacks for the built-in detail views (read more, reload, open terminal…). |
| `detailsErrors` | `Readonly<Record<string, React.ReactNode>>` | Load errors by tool id (`detailsError` of each row). |
| `elapsedMs` | `number` | Elapsed time of the round. |
| `expandedIds` | `readonly string[]` | Controlled expanded rows by id. |
| `expanded` | `boolean` |  |
| `onExpandedChange` | `((expanded: boolean) => void)` |  |
| `onLoadDetails` | `((id: string) => void)` | Called when the row opens and `tool.detailsLoaded === false`, and on retry. |
| `onOpenHistory` | `(() => void)` | Shows the 「完整工具记录」 link. |
| `onToolExpandedChange` | `((id: string, expanded: boolean) => void)` |  |
| `renderDetail` | `((tool: ToolCallView) => React.ReactNode \| undefined)` | Override the detail body. Return `undefined` to fall back to the built-in view. |
| `renderTool` | `((tool: ToolCallView) => React.ReactNode \| undefined)` | Replace a row. Return `undefined` to use the default ToolRecord. |
| `title` | `string \| (string & React.ReactElement<unknown, string \| React.JSXElementConstructor<any>>) \| (string & Iterable<React.ReactNode>) \| (string & React.ReactPortal) \| (string & Promise<AwaitedReactNode>)` | Header title override (default 「N 个操作」). |
| `tools` * | `readonly ToolCallView[]` |  |

### `ToolCategory`

*type* — Read / write / execute / network / model: drives the category chip and icon. The listed values have built-in copy + icon; any other string falls back to the `other` icon and renders its raw id as the chip label (ADR-0013 §2).

```ts
type ToolCategory = 'read' | 'write' | 'execute' | 'network' | 'model' | 'agent' | 'question' | 'other'
```

### `ToolDetailKind`

*type*

```ts
type ToolDetailKind = ToolDetailView['kind']
```

### `ToolDetailProps`

*type*

```ts
type ToolDetailProps = ToolDetailActions & { tool: ToolCallView; detail?: ToolDetailView; }
```

### `ToolDetailView`

*type*

| Member | Type | Description |
| --- | --- | --- |
| `kind` * | `"agent" \| "command" \| "question" \| "model" \| "generic" \| "file-read" \| "file-write" \| "file-edit" \| "patch" \| "manage-files" \| "mcp"` |  |

### `ToolHistoryProps`

*type* — ToolHistory (atlas 46): 「完整工具记录」 disclosure listing every loaded page. Rows are deduped by id across pages and never reordered once read; a load error keeps the loaded rows and offers 「加载更多」 again (no retry loop). The count says how many are loaded (and the total when the adapter knows it). Rows mount without entrance motion (history is restored, not new). `onOpenOperation` adds a 「在对话中定位」 button beside each row.

| Member | Type | Description |
| --- | --- | --- |
| `defaultExpanded` | `boolean` |  |
| `detailActions` | `ToolDetailActions` | Callbacks for the built-in detail views (read more, reload, open terminal…). |
| `detailsErrors` | `Readonly<Record<string, React.ReactNode>>` | Load errors by tool id (`detailsError` of each row). |
| `error` | `React.ReactNode` |  |
| `expanded` | `boolean` |  |
| `hasMore` | `boolean` |  |
| `items` * | `readonly ToolCallView[]` | All loaded rows (pages concatenated; duplicates allowed, they are dropped here). |
| `loading` | `boolean` |  |
| `onExpandedChange` | `((expanded: boolean) => void)` |  |
| `onLoadDetails` | `((id: string) => void)` | Called when the row opens and `tool.detailsLoaded === false`, and on retry. |
| `onLoadMore` | `(() => void)` |  |
| `onOpenOperation` | `((id: string) => void)` |  |
| `renderDetail` | `((tool: ToolCallView) => React.ReactNode \| undefined)` | Override the detail body. Return `undefined` to fall back to the built-in view. |
| `title` | `string \| (string & React.ReactElement<unknown, string \| React.JSXElementConstructor<any>>) \| (string & Iterable<React.ReactNode>) \| (string & React.ReactPortal) \| (string & Promise<AwaitedReactNode>)` |  |
| `total` | `number` |  |

### `ToolOutputProps`

*type* — ToolOutput (atlas 45): bounded preview of one tool output. The body never grows past `--rl-agent-output-max-height`; it scrolls inside a focusable, named region so keyboard users can scroll it and the page never overflows. Text stays selectable; the copy button copies the loaded portion only.

| Member | Type | Description |
| --- | --- | --- |
| `copyable` | `boolean` | Hide the copy button. |
| `label` | `React.ReactNode` | Heading text; defaults to the kind label (「终端输出」, 「JSON」…). |
| `loadingMore` | `boolean` | Busy state for `onLoadMore`. |
| `onCopyText` | `((text: string) => void \| Promise<void>)` | Replace the clipboard write (tests, host clipboards). |
| `onLoadMore` | `(() => void)` | Load the next display chunk (`truncated: 'display'`). |
| `onOpenFull` | `(() => void)` | Open the full output elsewhere (`truncated: 'display'`). |
| `output` * | `ToolOutputView` |  |
| `page` | `MaterialPageView` | One page of the stored output; replaces the inline body with a `ChunkPager`. |
| `pager` | `Partial<ChunkPagerActions>` | Paging callbacks for `page` (`canGoBack` defaults to false). |
| `regionLabel` | `string` | Name of the scroll region; defaults to the label text. |

### `ToolRecordProps`

*type* — ToolRecord (atlas 12): one tool call. The whole row is the disclosure trigger (a real `<button>` from `@wzrhine/react` Collapsible, `aria-expanded` / `aria-controls`) whose accessible name reads category, name, subject, summary, status and elapsed time. The raw tool name is in the name's `title` and in the details.

| Member | Type | Description |
| --- | --- | --- |
| `actions` | `React.ReactNode` | Controls placed next to the row (outside the trigger button), e.g. 「在对话中定位」. |
| `defaultExpanded` | `boolean` |  |
| `detailActions` | `ToolDetailActions` | Callbacks for the built-in detail views (read more, reload, open terminal…). |
| `detailsError` | `React.ReactNode` | Loading the full record failed (shown with a retry when `onLoadDetails` exists). |
| `detailsFooter` | `React.ReactNode` | Extra content at the end of the details (e.g. Code Mode script). |
| `detailsLoading` | `boolean` |  |
| `expanded` | `boolean` |  |
| `onExpandedChange` | `((expanded: boolean, id: string) => void)` |  |
| `onLoadDetails` | `((id: string) => void)` | Called when the row opens and `tool.detailsLoaded === false`, and on retry. |
| `onRetry` | `((tool: ToolCallView) => void)` |  |
| `renderDetail` | `((tool: ToolCallView) => React.ReactNode \| undefined)` | Override the detail body. Return `undefined` to fall back to the built-in view. |
| `tool` * | `ToolCallView` |  |

### `ToolRenderer`

*type* — Renders a tool call (wired to the tools family's ToolRecord by the host).

```ts
type ToolRenderer = (tool: ToolCallView) => React.ReactNode
```

### `ToolRowSharedProps`

*type* — Props forwarded to every row.

```ts
type ToolRowSharedProps = Pick<ToolRecordProps, 'onLoadDetails' | 'renderDetail' | 'detailActions'> & { /** Load errors by tool id (`detailsError` of each row). */ detailsErrors?: Readonly<Record<string, React.ReactNode>>; }
```

### `ToolStatus`

*type* — One tool operation. `unknown` = remote result not confirmed (MCP timeout, lost receipt).

```ts
type ToolStatus = | 'queued' | 'running' | 'waiting-approval' | 'waiting-user' | 'waiting-children' | 'partial' | 'completed' | 'failed' | 'denied' | 'cancelled' | 'timed-out' | 'unknown'
```

### `TriggerChar`

*type*

```ts
type TriggerChar = '@' | '/'
```

