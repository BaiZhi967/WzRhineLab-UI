# Showcase Visual Alignment Design

**Date:** 2026-10-14
**Status:** Approved direction; implementation pending plan review
**Scope:** `WzRhineLab-UI/apps/docs` Showcase only

## Goal

让 WzRhineLab UI Showcase 在桌面、超宽屏和窄屏上使用同一条可感知的内容轨道，减少卡片内部无效空白，并让 Agent 接入验收页在中等宽度下保持可读的主阅读列。

## Constraints

- 只修改 `WzRhineLab-UI`，不改 `Wpi-Agent`。
- 不改变 `@wzrhine/*` 公开组件 API、路由语义或示例数据契约。
- 保留现有主题、密度、动效和导航交互；只调整 Showcase 的编排和展示容器。
- 保持 320–1920 CSS px 的响应式覆盖，并继续通过无横向溢出、键盘导航、减动和视觉回归检查。
- 现有 `.zcodeignore` 是预先存在的未跟踪文件，不纳入本次变更。

## Findings Driving the Design

- `sc-main` 在超宽 frame 中只设置了 `max-width`，没有居中；topbar settings 与 footer 仍贴着整个 frame 的边界，形成三条不同的水平基线。
- `SpecimenGrid` 默认让同一网格行的卡片等高，短内容卡片依靠 `margin-top: auto` 把 note 推到底部，造成大块空白。
- `AdoptionPage` 为了展示三栏而把 AgentShell 的 context breakpoint 调得过低；在约 866px 内容宽度时，rail、index、reading、context 同时出现，主列低于可读宽度。
- 窄屏 topbar 的显示设置需要三行，属于必要的响应式堆叠；优化重点是统一起始边界和层级，不压缩交互目标。

## Design

### 1. Shared content rail

把 `--sc-content-max` 作为 Showcase 的内容轨道上限，并让 `sc-main` 在 frame 内居中。topbar 和 footer 使用与 main 相同的动态 inline inset：宽度不足时回退到当前 gutter，超出内容上限时把剩余空间平均分配到两侧，再加上 gutter。这样页面标题、卡片、顶栏设置和页脚文字的有效内容边界一致。

响应式 gutter 继续使用现有断点：≥1600 使用 64px，<1280 使用 32px，<720 使用 16px。桌面侧栏仍保持固定宽度，轨道只在侧栏右侧的 frame 内居中。

### 2. Specimen rhythm

保留成组对比卡片的等高边缘对齐；对独立的短示例明确使用 `align="start"`，让卡片高度由内容决定。优先整理已观察到空白最明显的 Foundations 与 Button 示例，后续按同一规则检查 Showcase 其余页面，不改变组件示例的语义顺序。

`Specimen` 本身继续提供 `align` 语义，不新增 masonry 或脚本测量；卡片内部的标题、正文、note 间距仍由 token 控制。

### 3. Agent adoption layout

Adoption 工作台使用 Showcase 的标准演示容器 class，固定一个可预测的最小高度与边界。AgentShell 的 context breakpoint 调整为能容纳 rail、index、reading 与 context 的真实阈值：中等宽度进入 compact，将 context 放入抽屉；窄宽度继续让 index 进入抽屉；宽屏才展示三栏内嵌 context。这样不降低组件本身的阅读最小宽度，也保留大屏验收的三栏路径。

同页的 React foundation specimen 与异步材料 specimen 复用相同的内边距、间距和 `sc-card-list` 节奏，避免工作台与普通组件卡片出现两套视觉语言。

### 4. Evidence and accessibility

新增 Showcase 几何回归断言，覆盖 390、768、1280、1920 CSS px：页面有效内容轨道的左右边界一致、文档没有横向溢出、Adoption 中等宽度的主列不低于 320px、窄屏工作台只保留 reading 列。保留现有全路由响应式、无障碍和减动测试，并更新受影响的视觉快照。

## Files in Scope

- `apps/docs/src/style.css` — 统一 rail、topbar/footer inset、Specimen 节奏和 Showcase 演示容器样式。
- `apps/docs/src/agent/AdoptionPage.tsx` — 采用标准演示容器并修正 AgentShell 响应式断点。
- `apps/docs/src/pages/Foundations.tsx` — 标记独立短示例的松排对齐。
- `apps/docs/src/pages/ButtonPage.tsx` — 标记独立短示例的松排对齐。
- `apps/docs/e2e/showcase-layout.spec.ts` — 新增跨断点几何与溢出回归。
- `apps/docs/e2e/visual/__screenshots__/...` — 仅更新受影响的 Showcase 视觉基线。

## Success Criteria

- 超宽屏下 page header、Specimen card、topbar settings 和 footer 的有效内容边界一致。
- 390、768、1280、1920 CSS px 下 `document.documentElement.scrollWidth <= window.innerWidth`。
- Adoption 在中等宽度进入 compact，reading 主列不低于 320px；在窄屏不出现 rail、index、context 三栏同时挤压。
- Foundations 与 Button 的短示例不再出现由等高拉伸造成的大块卡片内部空白。
- typecheck、package tests、Showcase E2E、视觉回归、API/doc/license/size checks 全部通过。
