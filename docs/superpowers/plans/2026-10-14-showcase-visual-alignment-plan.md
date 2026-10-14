# Showcase Visual Alignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Align the Showcase chrome and content rail across breakpoints, remove avoidable specimen-card whitespace, and make the Wpi adoption workbench responsive at its actual usable widths.

**Architecture:** Keep the existing Showcase shell, `Specimen` API, AgentShell API, routes, and sample data. Center the existing `sc-main` max-width inside the frame and derive topbar/footer padding from that same rail; opt independent short specimens into the existing `align="start"` behavior; reuse the existing `.sc-agent-workbench` frame and let Adoption move to compact before its context pane squeezes the reading column.

**Tech Stack:** React 19, TypeScript, Vite, CSS custom properties backed by `--rl-*` tokens, Playwright.

**Spec:** `docs/superpowers/specs/2026-10-14-showcase-visual-alignment-design.md`

## Global Constraints

- 只修改 `WzRhineLab-UI`，不改 `Wpi-Agent`。
- 不改变 `@wzrhine/*` 公开组件 API、路由语义或示例数据契约。
- 保留现有主题、密度、动效和导航交互；只调整 Showcase 的编排和展示容器。
- 保持 320–1920 CSS px 的响应式覆盖，并继续通过无横向溢出、键盘导航、减动和视觉回归检查。
- 现有 `.zcodeignore` 是预先存在的未跟踪文件，不纳入本次变更。
- Showcase 的样式只能引用 `--rl-*` token；不引入新的产品依赖或全局宿主样式。

## Review Focus

- 超宽 frame 的内容轨道：正文、topbar settings 和 footer 的有效左右边界必须一致；由 Task 1 的 1920px geometry test 覆盖。
- 320/390/768px 的响应式重排：不能产生页面横向溢出，也不能压缩交互目标；由 Task 1 的 width sweep 覆盖。
- 独立短 specimen：`align="start"` 必须真的让卡片由内容决定高度；由 Task 2 的 data-align/height assertions 覆盖。
- Adoption 的中等宽度：context 必须进入 compact，reading 主列保持至少 320px；由 Task 3 的 1280px layout test 覆盖。
- Adoption 的窄屏和大屏：窄屏不同时挤压 rail/index/context，大屏仍保留 wide 三栏；由 Task 3 的 390/1920 tests 覆盖。

---

### Task 1: Establish the shared Showcase content rail

**Files:**
- Create: `apps/docs/e2e/showcase-layout.spec.ts`
- Modify: `apps/docs/src/style.css` in the shell/frame and responsive sections

**Interfaces:**
- Consumes: `setSettings`, `findHorizontalOverflow`, and `widths` from `apps/docs/e2e/helpers.ts`.
- Produces: reusable Playwright geometry assertions for the chrome/content rail that later tasks extend.

- [ ] **Step 1: Write the failing geometry tests**

Add a `Showcase rail geometry` describe block. At viewport `1920 × 1000`, visit `/#/` with reduced motion, wait for `h1`, and read `getBoundingClientRect()` for `.sc-page`, `.sc-topbar__crumb`, `.sc-topbar__settings`, and `.sc-footer span:last-child`. Assert the page content left equals the crumb left, the page content right equals the settings right, and the page content right equals the footer’s last text right within one CSS pixel; save that viewport screenshot to `test-results/screens/rail-1920.png`. Add a width sweep for `390`, `768`, `1280`, and `1920` that visits `/#/`, `/#/foundations`, and `/#/agent/adoption`, calls `findHorizontalOverflow`, and asserts no offenders plus `scrollWidth <= clientWidth`.

- [ ] **Step 2: Run the new tests and verify the expected failure**

Run:

```text
pnpm --filter @wzrhine/showcase exec playwright test e2e/showcase-layout.spec.ts --project=chromium
```

Expected: the overflow checks pass on the current baseline, but the 1920px rail test fails because `.sc-main` is left-aligned and the topbar/footer still use the full frame edges.

- [ ] **Step 3: Implement the shared rail in `apps/docs/src/style.css`**

Keep the existing `--sc-content-max` and responsive gutter values. Add `margin-inline: auto` to `.sc-main`. Replace the fixed `var(--sc-gutter)` horizontal padding on `.sc-topbar` and `.sc-footer` with `max(var(--sc-gutter), calc((100% - var(--sc-content-max)) / 2 + var(--sc-gutter)))`, preserving their existing vertical padding and mobile wrapping rules. Do not alter the sidebar grid column or component package styles.

- [ ] **Step 4: Run the geometry tests and verify they pass**

Run the same Playwright command. Expected: all rail and overflow assertions pass at Chromium widths `390`, `768`, `1280`, and `1920`.

- [ ] **Step 5: Commit the shared rail**

```text
git add apps/docs/src/style.css apps/docs/e2e/showcase-layout.spec.ts
git commit -m "样式：统一 Showcase 内容轨道"
```

### Task 2: Remove avoidable short-card stretch

**Files:**
- Modify: `apps/docs/e2e/showcase-layout.spec.ts`
- Modify: `apps/docs/src/pages/Foundations.tsx`
- Modify: `apps/docs/src/pages/ButtonPage.tsx`

**Interfaces:**
- Consumes: the existing `Specimen` `align?: 'stretch' | 'start'` prop and the rail test file from Task 1.
- Produces: page-level usage of `data-align="start"` for independent short examples; no new component API.

- [ ] **Step 1: Add failing alignment assertions**

At a `1920 × 1000` viewport, visit `/#/foundations` and assert `#space-title`’s labelled region has `data-align="start"` and `#focus-title`’s labelled region has `data-align="start"`. Visit `/#/components/button` and assert the labelled regions for `#button-sizes-title` and `#button-icons-title` have the same attribute. Also assert the Foundations spacing card’s height is less than the Typography card’s height, proving the short card is no longer stretched to the row height.

- [ ] **Step 2: Run the focused test and verify it fails**

Run:

```text
pnpm --filter @wzrhine/showcase exec playwright test e2e/showcase-layout.spec.ts --project=chromium --grep "short|alignment"
```

Expected: the new `data-align` assertions fail because these specimens currently use the default `stretch` value.

- [ ] **Step 3: Mark only independent short examples as `align="start"`**

In `FoundationsPage`, add `align="start"` to `Spacing` and `Focus`. In `ButtonPage`, add it to `Sizes` and `With icons`; leave the state matrix, loading flow, and long-content pair stretched so related comparisons retain aligned edges. Do not change the `Specimen` component default or its CSS contract.

- [ ] **Step 4: Run the focused test and verify it passes**

Run the same grep command. Expected: all labelled regions expose `data-align="start"`, and the spacing card is shorter than Typography.

- [ ] **Step 5: Commit the card rhythm change**

```text
git add apps/docs/src/pages/Foundations.tsx apps/docs/src/pages/ButtonPage.tsx apps/docs/e2e/showcase-layout.spec.ts
git commit -m "样式：整理 Showcase 短卡片节奏"
```

### Task 3: Make Adoption workbench responsive to its real width

**Files:**
- Modify: `apps/docs/e2e/showcase-layout.spec.ts`
- Modify: `apps/docs/src/agent/AdoptionPage.tsx`

**Interfaces:**
- Consumes: existing `.sc-agent-workbench` frame styles and AgentShell `breakpoints` prop; existing adoption route and sample data remain unchanged.
- Produces: Adoption uses the standard Showcase workbench frame; at content widths below 60rem the context pane is a Drawer and the reading column keeps its minimum width.

- [ ] **Step 1: Add failing layout-state tests**

Add three tests to the adoption block. At `1280 × 900`, visit `/#/agent/adoption`, assert `.rl-agent-shell[data-layout="compact"]`, and assert `.rl-agent-shell__main` is at least `320px` wide. At `390 × 900`, assert `data-layout="narrow"`, no `.rl-agent-shell__rail`, no `.rl-agent-shell__index`, and no open inline `.rl-agent-shell__context[data-open]`. At `1920 × 900`, assert `data-layout="wide"` and the open inline context is visible. Keep the existing interaction and overflow checks.

- [ ] **Step 2: Run the adoption tests and verify the expected failure**

Run:

```text
pnpm --filter @wzrhine/showcase exec playwright test e2e/showcase-layout.spec.ts e2e/agent-adoption.spec.ts --project=chromium
```

Expected: the new 1280px test fails because Adoption currently overrides the context breakpoint to `48rem`, so all columns remain inline at that content width.

- [ ] **Step 3: Use the standard Showcase frame and breakpoint**

In `AdoptionWorkbench`, change `breakpoints` to `{ context: 60, index: 40 }`. In `AdoptionPage`, replace the inline `minHeight` wrapper around `<AdoptionWorkbench />` with `<div className="sc-agent-workbench"><AdoptionWorkbench /></div>`. Keep `defaultContextOpen`, the controlled index state, and all slots unchanged; the existing `.sc-agent-workbench > .rl-agent-shell` rule supplies the predictable height, border, and overflow boundary.

- [ ] **Step 4: Run the adoption tests and verify they pass**

Run the same command. Expected: the 1280px shell is compact with a ≥320px reading column, 390px is narrow with sheets instead of inline side columns, and 1920px remains wide with the context pane visible.

- [ ] **Step 5: Commit the Adoption layout change**

```text
git add apps/docs/src/agent/AdoptionPage.tsx apps/docs/e2e/showcase-layout.spec.ts
git commit -m "样式：修正 Adoption 工作台断点"
```

### Task 4: Refresh visual evidence and run the release gates

**Files:**
- Modify: `apps/docs/e2e/visual/baseline.spec.ts` to include the Adoption page in the stable viewport set.
- Modify: `apps/docs/e2e/visual/__screenshots__/win32/*.png` only for snapshots changed by the rail/card/Adoption layout.
- No additional production files unless a test exposes a regression owned by the preceding task.

**Interfaces:**
- Consumes: the completed rail, specimen, and Adoption changes plus the existing visual baseline suite.
- Produces: reviewed visual snapshots and a clean verification record for the Showcase-only branch.

- [ ] **Step 1: Add the Adoption page to the visual route matrix and run focused visual tests**

Add `{ name: 'agent-adoption', hash: '/#/agent/adoption' }` to the `pages` array in `apps/docs/e2e/visual/baseline.spec.ts`. Then run:

```text
pnpm --filter @wzrhine/showcase test:visual -- --grep "foundations|button|agent-overview|agent-adoption"
```

Expected: affected screenshots fail with diffs that show the intended centered rail, shorter independent cards, or responsive Adoption frame; unrelated snapshots remain green.

- [ ] **Step 2: Update only the affected baselines**

Run:

```text
pnpm --filter @wzrhine/showcase test:visual:update -- --grep "foundations|button|agent-overview|agent-adoption"
```

Inspect every changed PNG at 390px and 1280px, including the new Adoption baselines, plus the 1920px geometry screenshot saved by the layout suite. Reject any snapshot with clipping, a blank lazy-loaded page, hidden content, or a new horizontal scrollbar.

- [ ] **Step 3: Run focused visual and E2E verification**

Run:

```text
pnpm --filter @wzrhine/showcase test:visual
pnpm --filter @wzrhine/showcase test:e2e
pnpm --filter @wzrhine/showcase exec playwright test e2e/showcase-layout.spec.ts --project=firefox --workers=4
pnpm --filter @wzrhine/showcase exec playwright test e2e/showcase-layout.spec.ts --project=webkit --workers=4
```

Expected: visual baselines and all targeted browser layout tests pass.

- [ ] **Step 4: Run repository verification**

Run:

```text
pnpm release:check
```

Expected: typecheck, package tests, Showcase build, examples, API report/check, docs index/check, license audit, package verification, and size check all exit 0.

- [ ] **Step 5: Review and commit the evidence**

Run `git diff --check`, inspect `git status --short`, and confirm the diff contains only the design/plan docs, Showcase source/tests, and intended snapshots; `.zcodeignore` remains untracked. Then commit:

```text
git add apps/docs/e2e/visual/baseline.spec.ts apps/docs/e2e/visual/__screenshots__
git commit -m "测试：更新 Showcase 视觉基线"
```
