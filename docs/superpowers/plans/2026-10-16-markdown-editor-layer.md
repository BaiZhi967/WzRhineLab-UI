# Markdown Editor Layer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver an engine-neutral Markdown source editor layer with a controlled CodeMirror adapter, document tabs, toolbar commands, mode switching, preview composition, and explicit save/conflict states, without implementing a complete WYSIWYM editor.

**Architecture:** Add an optional `@wzrhine/editor` package. Its root entry contains contracts and UI primitives; the `./codemirror` entry contains the optional source-editor adapter and is the only entry that imports CodeMirror. The editor consumes `@wzrhine/content` for preview and `@wzrhine/react` for shared controls; document persistence, file access, autosave, routing, conflict resolution, and command registration remain caller-owned.

**Tech Stack:** React 19, TypeScript strict, `@wzrhine/react`, `@wzrhine/content`, `@wzrhine/tokens`, `motion/react` through existing provider contracts, CodeMirror 6 (`@codemirror/state`, `@codemirror/view`, `@codemirror/lang-markdown`, `@codemirror/commands`, optional `@codemirror/search`), Vitest + Testing Library, Playwright Showcase E2E.

**Spec:** `docs/superpowers/specs/2026-10-16-markdown-writing-workbench-design.md` and `docs/roadmap/requests/WZUI-REQ-20261016-002.md`

## Global Constraints

- Markdown source is the only document fact; editor state, syntax trees, and selections are temporary state.
- `@wzrhine/react` must not import CodeMirror or any editor runtime.
- `@wzrhine/editor` root must be usable without CodeMirror installed; CodeMirror is available only through `@wzrhine/editor/codemirror` and optional peer dependencies.
- The first editor supports Markdown source editing, preview, and split modes; it does not provide complete WYSIWYM, collaboration, remote cursors, block dragging, graph views, or plugin downloads.
- The host owns file reads/writes, autosave, debounce, revision checks, conflicts, routes, permissions, and command registries.
- Runtime React modules start with `'use client'`; pure contracts and command utilities remain server-importable.
- Public components use controlled values and actions; no global editor store, router, filesystem API, or persistence is introduced.
- Existing `Workbench`, `Tabs`, `ResizeHandle`, `ScrollArea`, `Dialog`, `AlertDialog`, `IconButton`, and `@wzrhine/content/MarkdownRenderer` are reused before adding new layout primitives.
- CSS is opt-in, uses `rl-editor-*` classes and `--rl-*` tokens, and does not use literal colors, pixel lengths, bare element selectors, or global resets.
- Validation covers IME composition, selection, undo/redo, paste, read-only, focus return, save states, conflict preservation, SSR, 320/390/768/1280/1920 widths, reduced motion, real tarballs, and optional adapter loading.

## Review Focus

- External source updates must not overwrite a dirty local document or lose the current selection; tests belong to Tasks 3 and 5.
- IME composition must suppress submit/format shortcuts and preserve text and selection; tests belong to Task 5.
- Closing a dirty tab must preserve focus and require an explicit discard decision; tests belong to Task 4.
- CodeMirror must remain out of the root entry and ordinary content pages; tests belong to Tasks 1, 6, and 8.
- Save error/conflict/unknown states must preserve source and expose retry/action intent without claiming success; tests belong to Tasks 3, 4, and 7.

### Task 1: Freeze the editor package and optional CodeMirror boundary

**Files:**
- Create: `docs/development/adr/0017-editor-package-and-source-adapter.md`
- Create: `packages/editor/package.json`
- Create: `packages/editor/tsconfig.json`
- Create: `packages/editor/tsconfig.build.json`
- Create: `packages/editor/vitest.config.ts`
- Create: `packages/editor/LICENSE`
- Create: `packages/editor/README.md`
- Create: `packages/editor/CHANGELOG.md`
- Create: `packages/editor/src/index.ts`
- Create: `packages/editor/src/codemirror.ts`
- Create: `packages/editor/src/editor.css`
- Create: `packages/editor/src/components.css`
- Create: `packages/editor/test/setup.ts`
- Create: `packages/editor/test/package-boundary.test.ts`
- Modify: `pnpm-lock.yaml`

**Interfaces:**
- Root exports: `.` and `./styles.css`; optional adapter export: `./codemirror`; no root import may reference CodeMirror.
- Runtime dependencies: `@wzrhine/content`, `@wzrhine/tokens`.
- Peer dependencies: `@wzrhine/react`, `react`, `react-dom`, `motion`.
- Optional peer dependencies for `./codemirror`: `@codemirror/commands`, `@codemirror/lang-markdown`, `@codemirror/search`, `@codemirror/state`, `@codemirror/view`.
- `sideEffects`: CSS only; package version follows the scheduled R4 release group and must not change the current 0.3.0 line during planning.

- [ ] **Step 1: Write failing boundary tests**

  Assert root entry has no CSS side effect and no CodeMirror import, `src/index.ts` is pure, `src/codemirror.ts` is client-marked, CSS selectors are `rl-editor-*`/`rl-theme`, and no editor source imports Base UI, Agent packages, filesystem APIs, or network clients.

- [ ] **Step 2: Write ADR-0017**

  Record the engine-neutral contract, root/subpath export boundary, optional peer rationale, CodeMirror 6 source-editor choice, SSR behavior, license review, package-size measurement, and explicit WYSIWYM deferral. Reference the CodeMirror state/transaction model and the existing content package.

- [ ] **Step 3: Create the package scaffold and lock dependencies**

  Mirror the `@wzrhine/content` package layout, include publish exports and CSS entry, add optional CodeMirror peers without making them mandatory for root consumers, and run `pnpm install`.

- [ ] **Step 4: Run the boundary test**

  Run: `pnpm --filter @wzrhine/editor test -- package-boundary.test.ts`

  Expected: PASS for the scaffold; any root-to-CodeMirror dependency leak is a failure.

- [ ] **Step 5: Commit the boundary**

  ```bash
  git add docs/development/adr/0017-editor-package-and-source-adapter.md packages/editor pnpm-lock.yaml
  git commit -m "架构：建立 Markdown 编辑器包边界"
  ```

### Task 2: Add the reusable toolbar and toggle interaction needed by editor controls

**Files:**
- Create: `packages/react/src/components/Toolbar.tsx`
- Create: `packages/react/src/components/ToggleButton.tsx`
- Modify: `packages/react/src/index.ts`
- Modify: `packages/react/src/components.css`
- Modify: `packages/react/test/m12-advanced.test.tsx` or a focused new test file beside existing React tests
- Modify: `packages/react/test/package-boundary.test.ts` if the boundary list needs a new CSS slice

**Interfaces:**
- `ToolbarProps`: orientation, label, children, disabled, and standard region attributes; keyboard behavior is roving focus with Arrow/Home/End and Tab entering/leaving the toolbar.
- `ToggleButtonProps`: `pressed`, `onPressedChange`, `disabled`, `loading`, `children`, optional icon, and an accessible name; renders `aria-pressed` and does not collapse focus while loading.
- The editor toolbar consumes these components through public `@wzrhine/react` exports; no editor-specific command knowledge enters React.

- [ ] **Step 1: Write failing toolbar tests**

  Cover `role="toolbar"`, orientation, roving focus, Arrow/Home/End, disabled items, focus-visible, and two toolbar instances not sharing active state.

- [ ] **Step 2: Write failing toggle tests**

  Cover `aria-pressed`, controlled updates, disabled/loading behavior, keyboard activation, accessible name, reduced-motion press feedback, and no duplicate activation.

- [ ] **Step 3: Implement the minimal Base UI-compatible primitives**

  Use semantic buttons and the existing motion/provider patterns; do not add a second headless interaction library or editor-specific props.

- [ ] **Step 4: Run React tests and typecheck**

  Run: `pnpm --filter @wzrhine/react test -- Toolbar ToggleButton` and `pnpm --filter @wzrhine/react typecheck`.

  Expected: existing React tests remain green and new toolbar/toggle tests pass.

- [ ] **Step 5: Commit the shared interaction enhancement**

  ```bash
  git add packages/react/src packages/react/test
  git commit -m "feat：增加编辑器工具栏基础交互"
  ```

### Task 3: Implement engine-neutral editor contracts and localized editor state components

**Files:**
- Create: `packages/editor/src/contracts.ts`
- Create: `packages/editor/src/provider/EditorMessages.tsx`
- Create: `packages/editor/src/components/SaveStatus.tsx`
- Create: `packages/editor/src/components/EditorModeSwitcher.tsx`
- Create: `packages/editor/test/contracts.test.ts`
- Create: `packages/editor/test/editor-messages.test.tsx`
- Create: `packages/editor/test/save-status.test.tsx`
- Create: `packages/editor/test/mode-switcher.test.tsx`
- Modify: `packages/editor/src/index.ts`

**Interfaces:**
- `EditorMode = 'source' | 'preview' | 'split'`.
- `SaveStatusKind = 'clean' | 'dirty' | 'saving' | 'saved' | 'error' | 'conflict'`.
- `EditorSelection = { from: number; to: number }`.
- `EditorChange = { source: string; selection?: EditorSelection; composing: boolean; origin: 'user' | 'external' }`.
- `EditorCommand` is a discriminated union for `undo`, `redo`, `toggle-mark`, `set-heading`, `toggle-list`, `insert-link`, and `insert-text` with explicit payloads where needed.
- `EditorHost` exposes `getSnapshot`, `setSource`, `focus`, `dispatch(command)`, `subscribe(listener)`, and `destroy` without exposing CodeMirror state.
- `EditorAdapter` exposes `create(container, options): EditorHost`; options include initial source, readOnly, and change/focus callbacks.
- `DocumentView` includes `id`, `title`, `source`, `mode`, `readOnly`, `revision`, `selection`, and `saveStatus`.
- `SaveStatus` renders facts and retry/action intent; it never changes a dirty source or claims a save result.
- `EditorModeSwitcher` is a controlled `Tabs` composition and emits `onModeChange` only.

- [ ] **Step 1: Write failing pure contract tests**

  Assert command discriminants, stable selection shape, save-state exhaustiveness, and no dependency on DOM or CodeMirror from `contracts.ts`.

- [ ] **Step 2: Write failing message/provider tests**

  Cover zhCN/enUS, partial overrides, nested provider merge, and isolated instances; keep CJK in `EditorMessages.tsx` only.

- [ ] **Step 3: Write failing `SaveStatus` and mode-switcher tests**

  Cover every save state, `aria-live` only for transitions, error retry action, conflict action, controlled mode changes, keyboard tab switching, and focus retention.

- [ ] **Step 4: Implement contracts and state components**

  Reuse `@wzrhine/react` Tabs, Alert/Callout, Button/IconButton, and message/provider conventions; do not add persistence or network actions.

- [ ] **Step 5: Run the focused editor suite**

  Run: `pnpm --filter @wzrhine/editor test -- contracts editor-messages save-status mode-switcher` and `pnpm --filter @wzrhine/editor typecheck`.

  Expected: PASS with the root package still importable without CodeMirror installed.

- [ ] **Step 6: Commit the contracts and state layer**

  ```bash
  git add packages/editor/src packages/editor/test
  git commit -m "feat：建立 Markdown 编辑器合同与状态组件"
  ```

### Task 4: Implement document tabs and command toolbar

**Files:**
- Create: `packages/editor/src/components/DocumentTabs.tsx`
- Create: `packages/editor/src/components/EditorToolbar.tsx`
- Create: `packages/editor/test/document-tabs.test.tsx`
- Create: `packages/editor/test/editor-toolbar.test.tsx`
- Modify: `packages/editor/src/index.ts`
- Modify: `packages/editor/src/editor.css`

**Interfaces:**
- `DocumentTab = { id: string; title: string; dirty?: boolean; closable?: boolean; disabled?: boolean }`.
- `DocumentTabsProps`: `tabs`, controlled `activeId`, `onActiveChange`, `onClose`, `onCloseRequest`, `label`, and optional `closeLabel`.
- `EditorToolbarCommand = { id; label; command: EditorCommand; pressed?: boolean; disabled?: boolean; shortcut?: string; group?: string }`.
- `EditorToolbarProps`: `commands`, `onCommand`, `readOnly`, `composing`, `label`, and optional start/end slots.

- [ ] **Step 1: Write failing document-tab tests**

  Cover tab semantics, active state, dirty marker, close affordance, disabled/unclear close actions, adjacent-tab focus after close, last-tab fallback, keyboard navigation, and two instances isolated.

- [ ] **Step 2: Write failing toolbar tests**

  Cover command grouping, `aria-pressed`, disabled commands, composing suppression, readOnly suppression, shortcut labels, focus retention after command, and action callbacks carrying exact `EditorCommand` values.

- [ ] **Step 3: Implement tabs and toolbar**

  Use existing Tabs semantics where appropriate, `Toolbar`/`ToggleButton` for command controls, and `AlertDialog` only when the caller supplies a close guard; the component must not decide whether a document is safe to discard.

- [ ] **Step 4: Add token-based editor CSS**

  Style dirty markers, active tab, close controls, toolbar groups, overflow, and reduced-motion states with `rl-editor-*` classes and tokens.

- [ ] **Step 5: Run the focused component suite**

  Run: `pnpm --filter @wzrhine/editor test -- document-tabs editor-toolbar package-boundary.test.ts`

  Expected: PASS with keyboard focus returning to an adjacent tab or caller fallback.

- [ ] **Step 6: Commit tabs and toolbar**

  ```bash
  git add packages/editor/src packages/editor/test
  git commit -m "feat：增加 Markdown 文档标签与工具栏"
  ```

### Task 5: Implement the optional CodeMirror source adapter and `EditorSurface`

**Files:**
- Create: `packages/editor/src/adapters/codemirror.ts`
- Create: `packages/editor/src/components/EditorSurface.tsx`
- Create: `packages/editor/test/codemirror-adapter.test.tsx`
- Create: `packages/editor/test/editor-surface.test.tsx`
- Modify: `packages/editor/src/codemirror.ts`
- Modify: `packages/editor/src/index.ts`
- Modify: `packages/editor/src/editor.css`

**Interfaces:**
- `createCodeMirrorAdapter(): EditorAdapter` is exported only from `@wzrhine/editor/codemirror`.
- The adapter uses Markdown language support, undo/redo commands, selection state, composition events, and optional search extension; it emits `EditorChange` without exposing `EditorState`.
- `EditorSurfaceProps`: `adapter`, controlled `source`, `readOnly`, optional `selection`, `onChange`, `onSelectionChange`, `onCompositionChange`, `onFocus`, `onBlur`, `aria-label`, and `placeholder`.
- `EditorSurface` creates/destroys the host on mount/unmount, applies external source changes only when the source differs, and preserves local selection when possible.

- [ ] **Step 1: Write failing adapter tests**

  Cover initial source, user input change events, selection changes, `Mod-z`/`Mod-Shift-z`, readOnly, focus/blur, compositionstart/compositionend, external source replacement, command dispatch, destroy cleanup, and two adapter instances isolated.

- [ ] **Step 2: Write failing `EditorSurface` tests**

  Cover adapter mount/unmount, controlled source synchronization, no feedback loop on equal source, `aria-label`, readOnly, focus delegation, external update preserving selection, and error fallback when adapter creation fails.

- [ ] **Step 3: Implement CodeMirror adapter**

  Build the extension set from `@codemirror/state`, `@codemirror/view`, `@codemirror/lang-markdown`, `@codemirror/commands`, and optional search; use transactions as the only mutation path and translate them into `EditorChange`.

- [ ] **Step 4: Implement `EditorSurface`**

  Keep the root entry engine-neutral; load CodeMirror only when the `./codemirror` adapter is imported. Preserve the native/fallback DOM structure needed for SSR and mount the editor only on the client.

- [ ] **Step 5: Run the adapter and surface suite**

  Run: `pnpm --filter @wzrhine/editor test -- codemirror-adapter editor-surface package-boundary.test.ts` and `pnpm --filter @wzrhine/editor typecheck`.

  Expected: root imports pass without CodeMirror installed; the optional adapter tests pass with the declared peers installed.

- [ ] **Step 6: Commit the source adapter**

  ```bash
  git add packages/editor/src packages/editor/test packages/editor/package.json pnpm-lock.yaml
  git commit -m "feat：增加 CodeMirror Markdown 源码适配器"
  ```

### Task 6: Implement preview composition and source/preview/split behavior

**Files:**
- Create: `packages/editor/src/components/PreviewPane.tsx`
- Create: `packages/editor/src/components/EditorModeView.tsx`
- Create: `packages/editor/test/preview-pane.test.tsx`
- Create: `packages/editor/test/editor-mode-view.test.tsx`
- Modify: `packages/editor/src/index.ts`
- Modify: `packages/editor/src/editor.css`

**Interfaces:**
- `PreviewPaneProps`: controlled `source`, optional `status`, `onRetry`, `onLinkActivate`, `renderImage`, and `aria-label`; delegates rendering to `@wzrhine/content/MarkdownRenderer`.
- `EditorModeViewProps`: `mode`, `source`, `adapter`, `readOnly`, `onChange`, `onSelectionChange`, `onModeChange`, and slots for toolbar/status.
- `EditorModeView` renders only the selected mode: source, preview, or split; split uses a bounded CSS layout and existing `ResizeHandle` only when the caller opts into a resizable divider.

- [ ] **Step 1: Write failing preview tests**

  Cover source handoff to `MarkdownRenderer`, loading/error/empty propagation, link/image callbacks, content provider inheritance, and no file/network access from the preview component.

- [ ] **Step 2: Write failing mode-view tests**

  Cover controlled mode switching, source/preview visibility, split composition, readOnly, source changes updating preview, preview callbacks, narrow container fallback, and focus remaining in the active surface.

- [ ] **Step 3: Implement preview and mode composition**

  Use `@wzrhine/content` for preview and existing `Tabs`/layout primitives for mode navigation; do not add a new application shell or persistence layer.

- [ ] **Step 4: Run the mode-view suite**

  Run: `pnpm --filter @wzrhine/editor test -- preview-pane editor-mode-view`.

  Expected: PASS with source/preview/split all driven by the same controlled source.

- [ ] **Step 5: Commit preview composition**

  ```bash
  git add packages/editor/src packages/editor/test
  git commit -m "feat：增加 Markdown 编辑预览模式组合"
  ```

### Task 7: Add the editor Showcase reference page and browser acceptance

**Files:**
- Create: `apps/docs/src/pages/EditorPage.tsx`
- Create: `apps/docs/e2e/editor.spec.ts`
- Modify: `apps/docs/package.json`
- Modify: `apps/docs/src/app/routes.ts`
- Modify: `apps/docs/src/App.tsx`
- Modify: `apps/docs/e2e/helpers.ts`
- Modify: `pnpm-lock.yaml`

**Interfaces:**
- Showcase consumes only public `@wzrhine/editor`, `@wzrhine/editor/codemirror`, `@wzrhine/content`, `@wzrhine/react`, and `@wzrhine/tokens` exports.
- The fixture uses local static documents and an in-memory save adapter; it does not read files or call a server.
- The page demonstrates source, preview, split, dirty/saving/saved/error/conflict, tabs, close guard, undo/redo, IME-safe Enter, and narrow-layout fallback.

- [ ] **Step 1: Write failing browser acceptance**

  Cover route load, source typing updates preview, source/preview/split switching, undo/redo, dirty marker, simulated save error/retry, conflict preserving local source, tab close focus, theme/density/reduced-motion, and no overflow at 320/390/768/1280/1920.

- [ ] **Step 2: Add the route and static reference page**

  Use `Workbench`, `Tabs`, `DocumentTabs`, `EditorToolbar`, `EditorSurface`, `PreviewPane`, `SaveStatus`, and `SectionIndex`; label all data as fixture content and explicitly state that WYSIWYM is deferred.

- [ ] **Step 3: Add shared responsive coverage**

  Add the editor hash route to `apps/docs/e2e/helpers.ts`; exclude only intentional editor/code scrollers from overflow measurement.

- [ ] **Step 4: Run browser checks**

  Run: `pnpm --filter @wzrhine/showcase test:e2e -- editor.spec.ts --workers=1` and the editor route in `responsive.spec.ts`.

  Expected: PASS in Chromium with focus, IME, save states, split layout, and responsive behavior verified.

- [ ] **Step 5: Commit the Showcase page**

  ```bash
  git add apps/docs/src/pages/EditorPage.tsx apps/docs/e2e/editor.spec.ts apps/docs/package.json apps/docs/src/app/routes.ts apps/docs/src/App.tsx apps/docs/e2e/helpers.ts pnpm-lock.yaml
  git commit -m "示例：增加 Markdown 编辑器 Showcase"
  ```

### Task 8: Add editor documentation, package reports, size budgets, and final gates

**Files:**
- Create: `docs/components/editor.md`
- Create: `docs/api/editor.md` (generated)
- Modify: `packages/editor/README.md`
- Modify: `packages/editor/CHANGELOG.md`
- Modify: `docs/README.md`
- Modify: `README.md`
- Modify: `docs/development/ARCHITECTURE.md`
- Modify: `docs/development/THIRD-PARTY-LICENSES.md` (generated)
- Modify: `docs/development/SIZE.md`
- Modify: `scripts/api-report.mjs`
- Modify: `scripts/docs-index.mjs`
- Modify: `scripts/license-audit.mjs`
- Modify: `scripts/verify-packages.mjs`
- Modify: `scripts/size-check.mjs`
- Modify: `size-budget.json`

**Interfaces:**
- API report includes `@wzrhine/editor` root exports and `./codemirror` declarations.
- Tarball consumer checks root import without CodeMirror and optional adapter import with the declared peers.
- Size entries measure `editor-core`, `editor-codemirror`, and `editor-css` with React/content peers externalized where appropriate.

- [ ] **Step 1: Write package/docs contracts**

  Document engine-neutral props, state ownership, keyboard/IME behavior, save/conflict states, SSR fallback, optional CodeMirror installation, no-WYSIWYM boundary, examples, known limitations, and migration rules.

- [ ] **Step 2: Add the package to generators and gates**

  Add editor to API/docs/license lists, verify package manifests and pure-module maps, consumer probes, size entries, and the architecture package table.

- [ ] **Step 3: Build and generate reports**

  Run: `pnpm build:packages`, `pnpm api:report`, `pnpm docs:index`, and `pnpm license:audit`; review generated API, docs index, and third-party license rows.

- [ ] **Step 4: Measure and set only editor budgets**

  Run: `pnpm size:check --update`; restore unrelated budget drift and document only `editor-*` entries in `docs/development/SIZE.md`.

- [ ] **Step 5: Run final editor and repository gates**

  Run: `pnpm --filter @wzrhine/editor test`, `pnpm --filter @wzrhine/editor typecheck`, `pnpm verify:packages`, `pnpm size:check`, `pnpm license:audit`, `pnpm typecheck`, `pnpm test`, `pnpm build`, `pnpm test:e2e`, `pnpm api:check`, `pnpm docs:check`, and `pnpm release:check`.

  Expected: record actual outputs, browser environment, visual differences, manual IME/reader checks, unexecuted coverage, and release status. Do not mark the editor package Released until a real version is published.

- [ ] **Step 6: Commit the package and quality updates**

  ```bash
  git add packages/editor docs/components/editor.md docs/api/editor.md docs/README.md README.md docs/development/ARCHITECTURE.md docs/development/THIRD-PARTY-LICENSES.md docs/development/SIZE.md scripts size-budget.json apps/docs/src/search-index.json
  git commit -m "质量：接入 Markdown 编辑器包门禁"
  ```

## Execution Handoff

This plan covers source editing, controlled preview composition, tabs, toolbar commands, save/conflict state, and an optional CodeMirror adapter. It does not implement a complete WYSIWYM document model, collaboration, remote cursors, block dragging, graph views, plugin downloads, or a full writing-workbench recipe. Native remains the selected execution method from the previous work package; review this plan before implementation begins.

