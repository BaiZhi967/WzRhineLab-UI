# ADR-0004 · 展示动效独立为可选包 `@wzrhine/effects`

- 状态：**Accepted** · 日期：2026-10-09 · 关联里程碑：M4

## 背景
M4 要求原创的扫描、轨道、解密类展示效果与动效播放器，同时退出门禁规定「不影响基础包体」。ARCHITECTURE.md 也要求 WebGL、粒子等展示类代码放在可选包或示例中，不得进入基础 `Button` 的依赖链。

## 决策
1. 新建 workspace 包 `packages/effects`（`@wzrhine/effects`），包含 ArchiveReveal、ScanSurface、OrbitalDiagram、MotionPlayer，以及计时上下文 EffectClock。
2. 依赖方向是单向的：effects 以 **peer** 方式依赖 `@wzrhine/react`（复用 `useRhineMotion` 和 tokens）；`@wzrhine/react` 不导入、不声明 effects。由 `packages/effects/test/boundary.test.ts` 强制检查。
3. 样式单独入口 `@wzrhine/effects/styles.css`；包入口无 CSS 副作用。
4. 不使用 Canvas、WebGL 或第三方图形库（测试强制），全部是 DOM 加 SVG。
5. 每个 `@keyframes` 都必须有减动覆盖（测试强制）；效果在页面隐藏、离开视口、完成或卸载时停止。
6. Showcase 用 `React.lazy` 按需加载效果页，作为「不影响主包」的端到端证据。
7. effects CSS 只有 `@container` 的阈值允许使用字面 px（容器查询条件不能读取 CSS 变量），测试按此放行。

## 后果
- 使用方需要额外安装、导入一个包和一份样式；换来的是基础包体积与依赖链不受 M4 影响（实测见 M4 验收记录）。
- 「可选 3D」不在本次范围。若以后加入，应作为 effects 包的独立子路径（例如 `@wzrhine/effects/three`），并重新评估体积与性能门禁。
