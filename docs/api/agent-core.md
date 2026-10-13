# @wzrhine/agent-core · API reference

> 由 `scripts/api-report.mjs` 从 `dist/index.d.ts` 生成，请勿手改。版本 0.2.0，共 131 个导出（32 functions & hooks，9 constants，57 interfaces，33 types）。

## Functions & hooks

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

### `deleteTokenAt`

*function* — Whole-token deletion. Backspace right after a token (or after the token + one space) and Delete right before one remove the whole token and one adjacent space. Returns `null` when the key should behave normally (no token at the caret, or a non-collapsed selection).

```ts
function deleteTokenAt: (value: string, selectionStart: number, selectionEnd: number, key: "Backspace" | "Delete") => (EditResult & { removed: ComposerToken; }) | null
```

### `detectTrigger`

*function* — Detect an active `@` / `/` trigger before the caret. Triggers only start at the beginning of a line or after whitespace, never inside code, and the query cannot contain whitespace. `/` commands are only recognised at the start of the message or a line (paths stay text).

```ts
function detectTrigger: (value: string, caret: number, triggers?: readonly TriggerChar[]) => TriggerMatch | null
```

### `diffStats`

*function* — Totals across files.

```ts
function diffStats: (files: readonly FileDiffView[]) => { files: number; additions: number; deletions: number; }
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

### `insertToken`

*function* — Insert a token at `[from, to)` (usually the typed `@query`), padding with spaces so it never glues to neighbouring words. Returns the new value and caret (after the trailing space).

```ts
function insertToken: (value: string, from: number, to: number, trigger: TriggerChar, name: string) => EditResult
```

### `isStaleRevision`

*function* — True when `incoming` must not replace `current` (older revision). Equal revisions are accepted.

```ts
function isStaleRevision: (current: string | undefined, incoming: string | undefined) => boolean
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

### `matchRanges`

*function* — Highlight ranges of `query` inside `text` (case-insensitive), for menu matches.

```ts
function matchRanges: (text: string, query: string) => Array<[number, number]>
```

### `mergeById`

*function* — Merge `incoming` items into `current` by id. A replayed item with an older revision is ignored; new items are appended. The result is sorted by `sequence` when every item has one, otherwise insertion order is kept. Never produces duplicate ids.

```ts
function mergeById: <T extends Identified>(current: readonly T[], incoming: readonly T[]) => T[]
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

*function* — Split a workspace path into human-readable crumbs. Relative paths are treated as rooted paths instead of being discarded; when an absolute path is under `root`, the root directory is the first crumb. This pure helper is also useful to non-React adapters.

```ts
function pathCrumbs: (path: string | undefined, root?: string) => string[]
```

### `reconcileTokens`

*function* — Reconcile bindings restored by a host with the tokens that are still present in a draft. Bindings are returned in their original order, while stale bindings are omitted. Matching is by trigger and exact token name, including spaces; the helper never invents a binding.

```ts
function reconcileTokens: <T extends TokenBinding>(value: string, bindings: readonly T[]) => T[]
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

### `stripStray`

*function* — Remove isolate characters that no longer belong to a complete token (after partial edits).

```ts
function stripStray: (value: string) => string
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

## Constants

### `actionStatusMeta`

*const*

```ts
const actionStatusMeta: Record<ActionStatus, StatusMeta>
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

### `AgentIdentityView`

*interface* — Conversation, message and run view-models (ADR-0011 §2). Snapshots only: plain, serialisable data with stable ids. Adapters dedupe, order and guard revisions before they reach a component.

| Member | Type | Description |
| --- | --- | --- |
| `id` * | `string` |  |
| `monogram` | `string` | Initials or a short monogram used when no avatar renderer is given. |
| `name` * | `string` |  |
| `role` | `string` | Short role / kind label, e.g. "Research agent". |

### `ApprovalEvidenceView`

*interface*

| Member | Type | Description |
| --- | --- | --- |
| `format` | `"text" \| "code" \| "json" \| "path"` |  |
| `id` * | `string` |  |
| `label` * | `string` |  |
| `value` * | `string` | Plain text, code or JSON shown verbatim. |

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
| `kind` * | `ArtifactKind` |  |
| `mimeType` | `string` |  |
| `path` | `string` |  |
| `preview` | `string` | Short text preview or thumbnail URL (for `image`). |
| `reason` | `string` |  |
| `size` | `number` |  |
| `status` * | `"unavailable" \| "generating" \| "partial" \| "saved" \| "failed" \| "stale"` | `saved` only after the artifact is actually persisted. `partial` keeps `reason`. `generating` shows activity without a percentage. |
| `title` * | `string` |  |
| `version` | `string` | Version or revision label. |

### `AttachmentView`

*interface*

| Member | Type | Description |
| --- | --- | --- |
| `alt` | `string` | Alternative text for image thumbnails. |
| `id` * | `string` |  |
| `kind` * | `"unknown" \| "text" \| "code" \| "image" \| "file" \| "pdf"` |  |
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

### `CitationView`

*interface*

| Member | Type | Description |
| --- | --- | --- |
| `excerpt` | `string` |  |
| `id` * | `string` |  |
| `index` * | `number` | Visible index, e.g. 1 → "[1]". |
| `locator` | `string` | Path, URL or locator shown in the hover card. |
| `reason` | `string` |  |
| `sourceType` * | `"code" \| "file" \| "web" \| "dataset" \| "message" \| "other"` |  |
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
| `kind` * | `"command" \| "skill" \| "action"` |  |
| `label` * | `string` |  |
| `name` * | `string` | Inserted / dispatched name without the slash. |
| `selected` | `boolean` |  |
| `shortcut` | `string` |  |

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
| `tone` | `"info" \| "accent" \| "success" \| "warning" \| "neutral"` |  |
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
| `attention` | `"error" \| "approval" \| "question" \| "children"` | Needs the user (approval, question, child needs attention). Shown above unread. |
| `disabled` | `boolean \| { reason?: string; }` |  |
| `id` * | `string` |  |
| `origin` | `ConversationOrigin` |  |
| `pinned` | `boolean` |  |
| `preview` | `string` | Second line: agent name, message count, last activity… |
| `revision` | `string` |  |
| `runPhase` | `RunPhase` |  |
| `runStatus` | `RunStatus` |  |
| `title` * | `string` |  |
| `unreadOutcome` | `"unknown" \| "failed" \| "delivered" \| "pending"` | Whether the latest reference/result was delivered to the host. |
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
| `kind` * | `"context" \| "add" \| "remove" \| "meta"` |  |
| `newLine` | `number` |  |
| `oldLine` | `number` |  |
| `text` * | `string` |  |

### `EditResult`

*interface*

| Member | Type | Description |
| --- | --- | --- |
| `caret` * | `number` |  |
| `value` * | `string` |  |

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

### `FilePreviewView`

*interface*

| Member | Type | Description |
| --- | --- | --- |
| `alt` | `string` |  |
| `content` | `string` | Loaded text (possibly a chunk) or image URL. |
| `external` | `boolean` |  |
| `id` * | `string` |  |
| `kind` * | `"unknown" \| "text" \| "code" \| "markdown" \| "image" \| "binary"` |  |
| `language` | `string` |  |
| `metadata` | `{ label: string; value: string; }[]` |  |
| `mimeType` | `string` |  |
| `name` * | `string` |  |
| `partial` | `{ loadedBytes: number; totalBytes?: number; }` | Only part of the file is loaded. |
| `path` | `string` |  |
| `reason` | `string` |  |
| `size` | `number` |  |
| `status` * | `"unavailable" \| "ready" \| "error" \| "loading" \| "large-file" \| "changed" \| "missing"` |  |
| `version` | `string` |  |

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

### `LedgerEventView`

*interface*

| Member | Type | Description |
| --- | --- | --- |
| `actor` * | `LedgerActor` |  |
| `at` * | `string` | ISO timestamp. |
| `detail` | `string` |  |
| `id` * | `string` |  |
| `outcome` | `"info" \| "success" \| "warning" \| "neutral" \| "danger"` |  |
| `sequence` * | `number` |  |
| `title` * | `string` |  |

### `LineDiffOptions`

*interface* — Bounded line diff for previews (ADR-0011 §5). Trims the common head and tail, keeps `context` lines around the replaced block and caps each side at `maxLines`. It is a preview aid, not a patch engine: the adapter's canonical diff wins whenever one exists.

| Member | Type | Description |
| --- | --- | --- |
| `context` | `number` |  |
| `maxLines` | `number` |  |

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
| `status` * | `"ready" \| "error" \| "loading"` |  |
| `total` | `number` | Total size when known. |
| `unit` * | `"bytes" \| "items" \| "lines"` |  |

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
| `kind` * | `"symbol" \| "file" \| "command" \| "skill" \| "folder" \| "url" \| "custom"` |  |
| `label` * | `string` |  |

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

### `ModelOptionView`

*interface*

| Member | Type | Description |
| --- | --- | --- |
| `capabilities` | `("image" \| "video" \| "tools" \| "reasoning" \| "long-context")[]` |  |
| `description` | `string` |  |
| `disabled` | `boolean` |  |
| `efforts` | `ModelEffort[]` |  |
| `id` * | `string` |  |
| `label` * | `string` |  |
| `providerId` * | `string` |  |
| `unavailableReason` | `string` |  |

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

### `PinnedSummaryView`

*interface*

| Member | Type | Description |
| --- | --- | --- |
| `body` * | `string` |  |
| `id` * | `string` |  |
| `sources` | `CitationView[]` |  |
| `status` * | `"stale" \| "missing" \| "current" \| "updating"` |  |
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
| `status` * | `"failed" \| "running" \| "completed" \| "interrupted"` |  |

### `QuestionAnswer`

*interface*

| Member | Type | Description |
| --- | --- | --- |
| `optionIds` | `string[]` | Chosen option ids (single: at most one). |
| `questionId` * | `string` |  |
| `skipped` | `boolean` |  |
| `text` | `string` | Text answer or the custom "other" text. |

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

### `QuestionView`

*interface*

| Member | Type | Description |
| --- | --- | --- |
| `allowCustom` | `boolean` | Offer a free-text "other" answer for choice questions. |
| `id` * | `string` |  |
| `kind` * | `QuestionKind` |  |
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
| `kind` * | `"unknown" \| "retryable" \| "save-pending" \| "cancel-unconfirmed" \| "tool-side-effects" \| "timeout" \| "offline" \| "resolved"` |  |
| `message` | `string` |  |
| `preserved` | `string[]` | What is still safe: output kept, draft kept… |
| `title` * | `string` |  |

### `ReferenceView`

*interface* — A context reference attached to a message or the composer (file, folder, skill, URL…).

| Member | Type | Description |
| --- | --- | --- |
| `delivered` | `boolean` |  |
| `detail` | `string` | Full path / URL / description used for the accessible name and tooltip. |
| `external` | `boolean` | Outside the workspace. |
| `id` * | `string` |  |
| `kind` * | `"symbol" \| "file" \| "command" \| "skill" \| "folder" \| "url" \| "custom"` |  |
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

### `RunSummaryView`

*interface*

| Member | Type | Description |
| --- | --- | --- |
| `artifacts` | `ArtifactView[]` |  |
| `elapsedMs` | `number` |  |
| `failedTools` | `number` |  |
| `id` * | `string` |  |
| `persistence` | `"unknown" \| "saved" \| "failed" \| "saving"` | Run success and persistence are separate facts. |
| `sideEffects` | `boolean` |  |
| `status` * | `"partial" \| RunStatus \| "saving"` |  |
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
| `persistence` | `"unknown" \| "saved" \| "failed" \| "saving"` | Run finished but local persistence is pending / failed. |
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

### `SkillUseView`

*interface* — A skill / plugin that was actually loaded for a turn (vs. merely requested).

| Member | Type | Description |
| --- | --- | --- |
| `digest` | `string` | Content digest (shown shortened) so reviewers can tell versions apart. |
| `id` * | `string` |  |
| `method` * | `"selected" \| "model-loaded"` |  |
| `name` * | `string` |  |
| `source` | `string` | Where it came from: "应用内置", "当前工作区"… |

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
| `category` | `ToolCategory` |  |
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

### `ToolOutputView`

*interface*

| Member | Type | Description |
| --- | --- | --- |
| `content` | `string` | The loaded portion. |
| `error` | `string` |  |
| `kind` * | `"text" \| "code" \| "json" \| "error" \| "terminal" \| "list" \| "empty"` |  |
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

### `AgentActionHandler`

*type* — Sync or async action callback.

```ts
type AgentActionHandler = (...args: Args) => AgentActionResult | void | Promise<AgentActionResult | void>
```

### `AgentActionResult`

*type*

```ts
type AgentActionResult = { status: 'accepted'; revision?: string; } | { status: 'rejected'; reason: string; code?: string; } | { status: 'unknown'; retryable: boolean; reason?: string; }
```

### `AgentTone`

*type* — Visual tone shared with `@wzrhine/react` StatusBadge.

```ts
type AgentTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger' | 'accent'
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

### `ArtifactKind`

*type*

```ts
type ArtifactKind = 'text' | 'markdown' | 'code' | 'image' | 'file' | 'diff' | 'data' | 'unknown'
```

### `CapabilityInput`

*type* — Normalised capability: `true` / `false` / `{ enabled, reason }`.

```ts
type CapabilityInput = boolean | Capability
```

### `Completeness`

*type* — How complete a number is. Percentages are drawn only for `exact` values with a reliable max.

```ts
type Completeness = 'exact' | 'estimated' | 'partial' | 'unknown'
```

### `DraftStatus`

*type* — Draft persistence (composer, questionnaire).

```ts
type DraftStatus = 'clean' | 'dirty' | 'saving' | 'saved' | 'error'
```

### `FilePreviewMode`

*type*

```ts
type FilePreviewMode = 'preview' | 'raw' | 'metadata'
```

### `LedgerActor`

*type*

```ts
type LedgerActor = 'agent' | 'tool' | 'system' | 'user'
```

### `MessagePartType`

*type*

```ts
type MessagePartType = MessagePartView['type']
```

### `MessagePartView`

*type*

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

### `ModelEffort`

*type*

```ts
type ModelEffort = 'off' | 'low' | 'medium' | 'high' | 'max' | 'xhigh'
```

### `ProcessBlockView`

*type* — One step inside a model call (stage text, tool reference, thinking).

### `QuestionKind`

*type*

```ts
type QuestionKind = 'single' | 'multiple' | 'text'
```

### `QuestionnaireStatus`

*type*

```ts
type QuestionnaireStatus = 'waiting' | 'drafting' | 'saving' | 'submit-pending' | 'unknown' | 'completed' | 'expired' | 'interrupted'
```

### `RunPhase`

*type* — What a run is doing right now. Finer than `RunStatus` and purely descriptive: it drives the label, glyph and AgentSpark phase, never the available actions.

```ts
type RunPhase = 'queued' | 'preparing' | 'waiting-model' | 'thinking' | 'responding' | 'executing-tool' | 'waiting-user' | 'waiting-approval' | 'waiting-children' | 'waiting-resource' | 'compacting' | 'saving' | 'cancelling'
```

### `RunStatus`

*type* — Coarse lifecycle of one agent run. Decides which actions are possible (stop, retry).

```ts
type RunStatus = 'idle' | 'queued' | 'running' | 'waiting' | 'cancelling' | 'completed' | 'failed' | 'cancelled' | 'interrupted'
```

### `SparkPhase`

*type* — AgentSpark phase (dot-matrix rhythm) for a run phase.

```ts
type SparkPhase = 'idle' | 'thinking' | 'responding' | 'executing' | 'waiting' | 'done' | 'error'
```

### `StatusGlyphName`

*type* — Status glyph names drawn by `@wzrhine/agent` (`StatusGlyph`). Each one is paired with text.

```ts
type StatusGlyphName = 'idle' | 'pending' | 'thinking' | 'tool' | 'waiting-user' | 'approval' | 'saving' | 'done' | 'failed' | 'stopping' | 'stopped' | 'active' | 'unknown' | 'terminal' | 'children' | 'compacting' | 'reconnecting' | 'offline'
```

### `SubagentStatus`

*type*

```ts
type SubagentStatus = 'queued' | 'preparing' | 'running' | 'waiting-children' | 'waiting-user' | 'needs-attention' | 'completed' | 'failed' | 'interrupted' | 'cancelled'
```

### `SyncStatus`

*type* — Connection / event-stream health for the snapshot being shown. Never changes the run status.

```ts
type SyncStatus = 'live' | 'reconnecting' | 'stale' | 'offline' | 'unknown'
```

### `TerminalSessionStatus`

*type* — `unclosed`: the session is alive (a command returning does not close it). `stop-pending`: a stop was requested and is not confirmed yet.

```ts
type TerminalSessionStatus = 'opening' | 'running' | 'waiting-input' | 'idle' | 'stop-pending' | 'closing' | 'ended' | 'failed' | 'unknown'
```

### `ToolCategory`

*type* — Read / write / execute / network / model: drives the category chip and icon.

```ts
type ToolCategory = 'read' | 'write' | 'execute' | 'network' | 'model' | 'agent' | 'question' | 'other'
```

### `ToolDetailKind`

*type*

```ts
type ToolDetailKind = ToolDetailView['kind']
```

### `ToolDetailView`

*type*

### `ToolStatus`

*type* — One tool operation. `unknown` = remote result not confirmed (MCP timeout, lost receipt).

```ts
type ToolStatus = 'queued' | 'running' | 'waiting-approval' | 'waiting-user' | 'waiting-children' | 'partial' | 'completed' | 'failed' | 'denied' | 'cancelled' | 'timed-out' | 'unknown'
```

### `TriggerChar`

*type*

```ts
type TriggerChar = '@' | '/'
```

