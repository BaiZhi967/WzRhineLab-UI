# Markdown Content Layer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver the first read-only Markdown content layer for WzRhineLab-UI as an optional `@wzrhine/content` package, with safe rendering, heading indexing, code blocks, and a runnable Showcase reference page.

**Architecture:** Add a new optional package that depends on `@wzrhine/tokens` and a Markdown parser stack, while taking `@wzrhine/react` as a peer for shared controls, provider context, and tokens. Keep Markdown source as the only document fact, expose pure heading/URL utilities, and render through an engine-neutral `MarkdownRenderer`; editor hosts, file access, persistence, and WYSIWYM engines remain outside this plan.

**Tech Stack:** React 19, TypeScript strict, `@wzrhine/react`, `@wzrhine/tokens`, `react-markdown`, `remark-gfm`, `motion/react` only through the existing provider contract, Vitest + Testing Library, Playwright Showcase E2E, the existing package build/API/size/license scripts.

**Spec:** `docs/superpowers/specs/2026-10-16-markdown-writing-workbench-design.md` and `docs/roadmap/requests/WZUI-REQ-20261016-001.md`

## Global Constraints

- Markdown source is the only fact source; derived headings and statistics never write back into source.
- `@wzrhine/react` must not gain a Markdown parser, highlighter, sanitizer, or editor dependency.
- Raw HTML is disabled by default and there is no first-version `allowRawHtml` escape hatch.
- Links and images use an explicit protocol policy; a local path is not treated as an authorized URL.
- The package entry has no CSS side effect; consumers explicitly import `@wzrhine/content/styles.css`.
- All CSS uses `rl-content-*` classes and `--rl-*` tokens; no `:root`, bare element selectors, literal colors, or literal pixel lengths.
- Runtime React modules start with `'use client'`; pure heading and URL utility modules remain server-importable.
- CJK copy lives only in `src/provider/ContentMessages.tsx`.
- The package does not read files, fetch URLs, create object URLs, own Workers, or persist data.
- The first release supports read-only Markdown rendering and explicitly excludes complete WYSIWYM editing, collaboration, backlinks, graph views, PDF/Office engines, and runtime plugin loading.
- Validation records 320/390/768/1280/1920 widths, long Chinese, long English words, long code, reduced motion, SSR, package boundaries, and real tarball consumption.

## Review Focus

- Unsafe HTML and URL schemes must remain inert or visibly rejected; tests belong to Task 2 and Task 5.
- Duplicate/CJK headings and headings inside fenced code must generate stable, unique IDs; tests belong to Task 2 and Task 5.
- Long code and prose must stay readable through local scrolling and must not create page overflow; tests belong to Task 4 and Task 7.
- Copy success/failure and image failure must keep accessible status text without stealing focus; tests belong to Task 4 and Task 5.
- SSR, hydration, pure-module imports, CSS side effects, and tree-shaking must remain valid in the published tarball; tests belong to Tasks 1, 6, and 8.

### Task 1: Freeze the content package boundary and dependency decision

**Files:**
- Create: `docs/development/adr/0016-content-package-and-markdown-safety.md`
- Create: `packages/content/package.json`
- Create: `packages/content/tsconfig.json`
- Create: `packages/content/tsconfig.build.json`
- Create: `packages/content/vitest.config.ts`
- Create: `packages/content/LICENSE`
- Create: `packages/content/README.md`
- Create: `packages/content/CHANGELOG.md`
- Create: `packages/content/src/index.ts`
- Create: `packages/content/src/components.css`
- Create: `packages/content/src/content.css`
- Create: `packages/content/test/setup.ts`
- Create: `packages/content/test/package-boundary.test.ts`
- Modify: `pnpm-lock.yaml`

**Interfaces:**
- Produces the candidate package name `@wzrhine/content`, exports `.`, `./styles.css`, and `./package.json`, and establishes the dependency shape used by every later task.
- `dependencies`: `@wzrhine/tokens`, `react-markdown`, `remark-gfm`.
- `peerDependencies`: `@wzrhine/react`, `motion`, `react`, `react-dom`.
- `sideEffects`: `['**/*.css']`; package version follows the active R2 release group when implementation is scheduled, and this plan does not change the current 0.3.0 line.

- [ ] **Step 1: Write the failing package-boundary tests**

  Assert that the entry has no CSS import, CSS files use only `rl-content`/`rl-theme` selectors and tokens, pure modules are not marked client, and source files do not import `@base-ui/react`, `@wzrhine/agent`, network clients, or file-system APIs.

- [ ] **Step 2: Write ADR-0016**

  Record the package boundary, `react-markdown` + `remark-gfm` choice, default `skipHtml` behavior, URL policy ownership, optional highlighting, license review, SSR rules, and the explicit absence of a WYSIWYM engine.

- [ ] **Step 3: Create the minimal package manifest and build configuration**

  Mirror the `@wzrhine/patterns` package layout, use `src/index.ts` as the workspace export, publish `dist` plus README/CHANGELOG/LICENSE, and keep CSS opt-in through `src/components.css`.

- [ ] **Step 4: Run the package boundary test**

  Run: `pnpm --filter @wzrhine/content test -- package-boundary.test.ts`

  Expected: PASS for the scaffold; no implementation modules are allowed to bypass the boundary.

- [ ] **Step 5: Install and lock the declared dependencies**

  Run: `pnpm install`

  Expected: `pnpm-lock.yaml` contains the new package and the selected Markdown dependencies without changing unrelated package resolutions.

- [ ] **Step 6: Commit the package boundary**

  ```bash
  git add docs/development/adr/0016-content-package-and-markdown-safety.md packages/content pnpm-lock.yaml
  git commit -m "架构：建立 Markdown 内容包边界"
  ```

### Task 2: Implement heading indexing and URL policy as pure utilities

**Files:**
- Create: `packages/content/src/markdown/heading-index.ts`
- Create: `packages/content/src/markdown/url-policy.ts`
- Create: `packages/content/test/heading-index.test.ts`
- Create: `packages/content/test/url-policy.test.ts`
- Modify: `packages/content/src/index.ts`

**Interfaces:**
- Produces `MarkdownHeading` and `extractHeadings(source: string): readonly MarkdownHeading[]`.
- Produces `slugifyHeading(text: string, occurrence?: number): string`.
- Produces `MarkdownUrlKind = 'link' | 'image'` and `resolveMarkdownUrl(url: string, kind: MarkdownUrlKind): string | undefined`.
- `MarkdownHeading` fields are `{ id: string; depth: 1 | 2 | 3 | 4 | 5 | 6; text: string; line: number }`.

- [ ] **Step 1: Write failing heading tests**

  Cover ATX headings, setext headings, heading text with inline emphasis, CJK text, duplicate headings (`-2`, `-3` suffixes), trailing ATX markers, and headings inside fenced code being ignored. Assert source line numbers and stable IDs.

- [ ] **Step 2: Implement `slugifyHeading`**

  Normalize whitespace, preserve Unicode letters/numbers, remove formatting punctuation, use `heading` for an empty result, and append the one-based occurrence suffix only after the first duplicate.

- [ ] **Step 3: Implement `extractHeadings`**

  Scan line-by-line with an explicit fenced-code state for backtick and tilde fences; recognize ATX depths 1–6 and setext depth 1–2; strip closing `#` markers before slugging; return immutable heading records in source order.

- [ ] **Step 4: Write failing URL-policy tests**

  Allow relative paths, hash anchors, `http:`, `https:`, `mailto:`, and `tel:` links; reject `javascript:`, `vbscript:`, `file:`, unknown schemes, and image `data:` URLs. Preserve the original safe URL string.

- [ ] **Step 5: Implement `resolveMarkdownUrl`**

  Trim control whitespace, parse the scheme case-insensitively, allow the listed schemes, reject unsafe schemes and malformed control characters, and return `undefined` for rejected values.

- [ ] **Step 6: Run the focused utility tests**

  Run: `pnpm --filter @wzrhine/content test -- heading-index.test.ts url-policy.test.ts`

  Expected: PASS, including duplicate/CJK/fenced-code and unsafe-scheme cases.

- [ ] **Step 7: Commit the pure utilities**

  ```bash
  git add packages/content/src/markdown packages/content/src/index.ts packages/content/test/heading-index.test.ts packages/content/test/url-policy.test.ts
  git commit -m "feat：增加 Markdown 标题索引与 URL 策略"
  ```

### Task 3: Add localized content messages and copy status contracts

**Files:**
- Create: `packages/content/src/provider/ContentMessages.tsx`
- Create: `packages/content/test/content-messages.test.tsx`
- Modify: `packages/content/src/index.ts`
- Modify: `packages/content/test/package-boundary.test.ts`

**Interfaces:**
- Produces `ContentMessages`, `ContentMessagesOverrides`, `ContentMessagesProviderProps`, `contentZhCN`, `contentEnUS`, `mergeContentMessages`, `useContentMessages`, and `ContentMessagesProvider`.
- Message shape: `code.copy`, `code.copied`, `code.copyFailed`, `code.label`, `image.unavailable`, and `unsupported.title` / `unsupported.detail(kind)`.

- [ ] **Step 1: Write failing provider tests**

  Assert default zhCN, explicit enUS, partial override merge, nearest-provider precedence, and two providers on one page remaining isolated.

- [ ] **Step 2: Implement the provider**

  Follow the existing `PatternsMessagesProvider` precedence rules; keep all CJK literals in this file; obtain numeric locale behavior from the nearest `RhineProvider` only when a later component needs it.

- [ ] **Step 3: Run the provider and boundary tests**

  Run: `pnpm --filter @wzrhine/content test -- content-messages.test.tsx package-boundary.test.ts`

  Expected: PASS with no CJK literals outside `src/provider/ContentMessages.tsx`.

- [ ] **Step 4: Commit the message contract**

  ```bash
  git add packages/content/src/provider packages/content/src/index.ts packages/content/test
  git commit -m "feat：建立 Markdown 内容文案合同"
  ```

### Task 4: Implement the accessible `CodeBlock` content primitive

**Files:**
- Create: `packages/content/src/components/CodeBlock.tsx`
- Create: `packages/content/src/code.css`
- Create: `packages/content/test/code-block.test.tsx`
- Modify: `packages/content/src/components.css`
- Modify: `packages/content/src/index.ts`

**Interfaces:**
- Produces `CodeBlockProps` with `code`, optional `language`, `filename`, `showLineNumbers`, `maxHeight`, `copyable`, `onCopy`, `children`, `copyLabel`, `className`, and `style`.
- Produces copy states `idle | copied | failed` internally; the rendered status uses `ContentMessages` and `role="status"`.

- [ ] **Step 1: Write failing component tests**

  Cover semantic `figure/figcaption/pre/code`, language/filename caption, decorative line numbers, focusable horizontal scroll region, `onCopy` success/failure, clipboard fallback, `copyable={false}`, copied/failed status announcement, long-line overflow, and two instances not sharing copy state.

- [ ] **Step 2: Implement `CodeBlock`**

  Use `IconButton` from `@wzrhine/react` for the copy action, keep copied text equal to the original `code`, expose highlighted content only through `children`, and never make line numbers part of copied text.

- [ ] **Step 3: Implement token-based CSS**

  Scope every selector to `.rl-content-code` or `.rl-theme`, use existing surface/text/focus/motion tokens, allow local horizontal/vertical scrolling, and avoid literal colors/pixel lengths.

- [ ] **Step 4: Run component tests and CSS boundary tests**

  Run: `pnpm --filter @wzrhine/content test -- code-block.test.tsx package-boundary.test.ts`

  Expected: PASS; focus remains on the invoking control and reduced motion does not add a new motion requirement.

- [ ] **Step 5: Commit the code block primitive**

  ```bash
  git add packages/content/src/components/CodeBlock.tsx packages/content/src/code.css packages/content/src/components.css packages/content/src/index.ts packages/content/test/code-block.test.tsx
  git commit -m "feat：增加 Markdown 代码块"
  ```

### Task 5: Implement `MarkdownRenderer` with safe defaults and renderer slots

**Files:**
- Create: `packages/content/src/components/MarkdownRenderer.tsx`
- Create: `packages/content/src/markdown.css`
- Create: `packages/content/test/markdown-renderer.test.tsx`
- Modify: `packages/content/src/components.css`
- Modify: `packages/content/src/index.ts`

**Interfaces:**
- Produces `MarkdownRenderStatus = 'ready' | 'loading' | 'empty' | 'error'`.
- Produces `MarkdownRendererProps` with `source: string`, optional `status`, `error`, `onRetry`, `components`, `onLinkActivate`, `renderImage`, `className`, and standard non-children section attributes.
- Produces `MarkdownImageProps` with `src`, `alt`, optional `title`, and the original image node props.
- The first API has no raw-HTML opt-in; `react-markdown` runs with `remarkGfm`, `skipHtml`, and `resolveMarkdownUrl`.

- [ ] **Step 1: Write failing renderer tests**

  Assert headings receive IDs from `extractHeadings`, GFM tables/task-list syntax renders, raw HTML remains text/inert, unsafe link/image URLs do not become active resources, safe links call `onLinkActivate` without changing their accessible name, custom image rendering receives the authorized input, code fences use `CodeBlock`, and loading/empty/error states preserve semantic status and retry behavior.

- [ ] **Step 2: Implement renderer composition**

  Use `ReactMarkdown` with `remarkGfm`; map heading nodes to semantic headings with matching IDs; map fenced code to `CodeBlock`; map links through the URL policy and optional activation callback; map images through `renderImage` or a lazy native `img` fallback; never add `rehypeRaw`.

- [ ] **Step 3: Implement content CSS**

  Style readable prose width, heading rhythm, links, lists, blockquotes, tables, task-list markers, images, error/empty/loading states, and long-word wrapping with `rl-content-*` classes and existing tokens. Do not create global typography selectors.

- [ ] **Step 4: Run the focused renderer suite**

  Run: `pnpm --filter @wzrhine/content test -- markdown-renderer.test.tsx code-block.test.tsx heading-index.test.ts url-policy.test.ts`

  Expected: PASS for safe HTML/URL handling, duplicate headings, GFM, code blocks, and state fallbacks.

- [ ] **Step 5: Commit the renderer**

  ```bash
  git add packages/content/src/components/MarkdownRenderer.tsx packages/content/src/markdown.css packages/content/test/markdown-renderer.test.tsx packages/content/src/components.css packages/content/src/index.ts
  git commit -m "feat：增加安全 Markdown 渲染器"
  ```

### Task 6: Document the content package and expose generated API

**Files:**
- Modify: `packages/content/README.md`
- Modify: `packages/content/CHANGELOG.md`
- Create: `docs/components/content.md`
- Create: `docs/api/content.md` (generated, never hand-edit)
- Modify: `docs/README.md`
- Modify: `README.md`
- Modify: `docs/development/ARCHITECTURE.md`
- Modify: `docs/development/THIRD-PARTY-LICENSES.md` (generated)
- Modify: `scripts/api-report.mjs`
- Modify: `scripts/docs-index.mjs`
- Modify: `scripts/license-audit.mjs`

**Interfaces:**
- Public documentation must match the generated declarations and state that the package is read-only Markdown content, not an editor.
- API report must include the new package and produce `docs/api/content.md`.
- Docs index must include the content component headings and API symbols.

- [ ] **Step 1: Write package and component documentation**

  Include purpose/non-purpose, installation and explicit CSS import, props, controlled status, renderer slots, URL policy, keyboard/focus behavior, loading/empty/error/unsupported states, themes/density, reduced motion, SSR, examples, counterexamples, tests, known limitations, and the deferred WYSIWYM/editor scope.

- [ ] **Step 2: Add package metadata to generation scripts**

  Add `content` to `scripts/api-report.mjs`, the API package list in `scripts/docs-index.mjs`, and the runtime package list in `scripts/license-audit.mjs`. Keep the package out of any script that is intentionally limited to existing baseline packages only after documenting the change.

- [ ] **Step 3: Build declarations and generate reports**

  Run: `pnpm --filter @wzrhine/content build`; then `pnpm api:report`, `pnpm docs:index`, and `pnpm license:audit`.

  Expected: `docs/api/content.md`, the docs search index, and the license report are generated from real output and reviewed for unexpected exports or dependencies.

- [ ] **Step 4: Validate docs and API drift**

  Run: `pnpm api:check` and `pnpm docs:check`.

  Expected: PASS with the generated content API and documentation index committed together.

- [ ] **Step 5: Commit documentation and generated reports**

  ```bash
  git add packages/content/README.md packages/content/CHANGELOG.md docs/components/content.md docs/api/content.md docs/README.md README.md docs/development/ARCHITECTURE.md docs/development/THIRD-PARTY-LICENSES.md apps/docs/src/search-index.json scripts/api-report.mjs scripts/docs-index.mjs scripts/license-audit.mjs
  git commit -m "文档：补齐 Markdown 内容层说明"
  ```

### Task 7: Add a Showcase reference page and browser acceptance

**Files:**
- Create: `apps/docs/src/pages/ContentPage.tsx`
- Create: `apps/docs/e2e/content.spec.ts`
- Modify: `apps/docs/src/app/routes.ts`
- Modify: `apps/docs/src/App.tsx`
- Modify: `apps/docs/e2e/helpers.ts`
- Modify: `apps/docs/src/styles.css` or the existing Showcase style split only if the new page needs route-local layout rules

**Interfaces:**
- The Showcase page consumes only published workspace exports: `@wzrhine/content`, `@wzrhine/react`, and `@wzrhine/tokens`.
- The fixture source is static and visibly labeled as example content; no file system, network, or editor engine is added.

- [ ] **Step 1: Write the failing browser acceptance**

  Cover route load, rendered headings/IDs, GFM table and task list, safe/unsafe links, code copy announcement, loading/empty/error/retry states, theme/density controls, reduced motion, and no horizontal overflow at 320px.

- [ ] **Step 2: Add the route and reference page**

  Add a route under the existing archive/content navigation, render separate specimens for MarkdownRenderer, CodeBlock, heading index/SectionIndex composition, and state fallbacks, and include a short note that WYSIWYM editing is deferred.

- [ ] **Step 3: Add the route to shared responsive coverage**

  Add the hash route to `apps/docs/e2e/helpers.ts` so the existing 320/390/768/1280/1920 overflow sweep covers it.

- [ ] **Step 4: Run the browser checks**

  Run: `pnpm --filter @wzrhine/showcase test:e2e -- content.spec.ts` and `pnpm --filter @wzrhine/showcase test:e2e -- responsive.spec.ts`

  Expected: PASS in Chromium with no route overflow, no unsafe navigation, correct focus/status behavior, and the declared theme/reduced-motion states.

- [ ] **Step 5: Commit the reference page**

  ```bash
  git add apps/docs/src/pages/ContentPage.tsx apps/docs/e2e/content.spec.ts apps/docs/src/app/routes.ts apps/docs/src/App.tsx apps/docs/e2e/helpers.ts apps/docs/src/styles.css
  git commit -m "示例：增加 Markdown 内容层 Showcase"
  ```

### Task 8: Add package verification, size budget, and final content-layer gates

**Files:**
- Modify: `scripts/verify-packages.mjs`
- Modify: `scripts/size-check.mjs`
- Modify: `size-budget.json`
- Modify: `docs/development/SIZE.md`
- Modify: `packages/content/test/package-boundary.test.ts` if a published-package regression is found

**Interfaces:**
- `verify-packages.mjs` packs and consumes `@wzrhine/content`, checks its exports/CSS/types/license, and imports a `MarkdownRenderer` in the throwaway consumer.
- `size-check.mjs` measures `content-full`, `content-markdown`, and `content-css` with `@wzrhine/react` externalized as a peer.
- Size budgets are generated from actual gzip measurements; no guessed budget is committed.

- [ ] **Step 1: Write the failing package-consumer checks**

  Add content to the pack list, pure-module map, consumer package manifest, TSX probe, SSR probe, CSS probe, and dist/source guard. Assert no parser source leaks into unrelated packages and no `src/` or test files enter the tarball.

- [ ] **Step 2: Add size entries and measurement probes**

  Add `content` to the `distMap` package list, add the three content entries and an `export { MarkdownRenderer }` probe, externalize `@wzrhine/react`, and use the real built `dist` map.

- [ ] **Step 3: Build and measure before setting budgets**

  Run: `pnpm build:packages` and `pnpm size:check --update`.

  Expected: review the generated `size-budget.json` diff, explain every new entry in `docs/development/SIZE.md`, and reject any unexpected parser or highlight dependency in a small import.

- [ ] **Step 4: Run package, size, license, type, and unit gates**

  Run: `pnpm --filter @wzrhine/content typecheck`, `pnpm --filter @wzrhine/content test`, `pnpm --filter @wzrhine/content build`, `pnpm verify:packages`, `pnpm size:check`, `pnpm license:audit`, `pnpm typecheck`, and `pnpm test`.

  Expected: PASS with a real tarball consumer and no unrelated package regressions.

- [ ] **Step 5: Run the final repository checks**

  Run: `pnpm build`, `pnpm test:e2e`, `pnpm docs:check`, `pnpm api:check`, and `pnpm release:check`.

  Expected: record actual command output, browser/environment, visual differences, unexecuted manual checks, and remaining limitations in a content-layer acceptance record. Do not call the package Released until a real version is published.

- [ ] **Step 6: Commit the verification updates**

  ```bash
  git add scripts/verify-packages.mjs scripts/size-check.mjs size-budget.json docs/development/SIZE.md packages/content/test/package-boundary.test.ts
  git commit -m "质量：接入 Markdown 内容包发布门禁"
  ```

## Execution Handoff

This plan covers only the Markdown content layer. It does not implement `@wzrhine/editor`, document tabs, save status, `WritingWorkbench`, or a WYSIWYM engine. After this plan is accepted, implementation should start at Task 1 and keep each task independently reviewable. The final state should be `LibraryValidating` until the package has real build, tarball, browser, accessibility, and acceptance evidence.

