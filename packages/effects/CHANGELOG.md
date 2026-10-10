# Changelog · @wzrhine/effects

格式参考 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，版本号遵循 [SemVer](https://semver.org/lang/zh-CN/)。本包为 **Experimental**，0.x 期间 API 可能调整。

## [Unreleased]

尚未发布到 npm。首次发布时归入 `0.1.0`。

### Added
- **M4（ADR-0004）**：`ArchiveReveal`（确定性解密、可中断、减动直接切换）、`ScanSurface`（单次扫描，减动时为静态描边）、`OrbitalDiagram`（仪器风格轨道，可选旋转）、`MotionPlayer`（Default / Slow ×0.25 / Reduced / Interrupt 四通道），以及 `EffectClock` / `useEffectTiming`。
- 页面隐藏、离开视口、完成或卸载时停止循环；不使用 Canvas 或 WebGL。
- **M5**：通过 `dist/` 发布 ESM 与 `.d.ts`；`./styles.css` 导出。
- **M10（ADR-0007）**：`OrbitalDiagram` 增加 `data-lifecycle`（`idle` / `running` / `paused` / `stopped`）与 `data-paused`（`reduced` / `hidden` / `offscreen`）。`MotionPlayer` 的各通道设置 `MotionSpeed`，`@wzrhine/react` 的 MotionPresence / RhineMotionGroup / `useRhineMotion` 也随 Slow ×0.25 放慢。

### Changed
- **M10**：`usePageVisible` / `useInViewport` 改为重新导出 `@wzrhine/react` 的实现，effects 与组件共用一套可见性来源；导入路径不变。
- **M10**：所有循环改用共享生命周期。`OrbitalDiagram` 暂停（页面隐藏、离开视口）时保持当前角度、恢复时从该角度接续，而不是回到 0°；`ScanSurface` 在页面隐藏时立即结束本次扫描，隐藏期间请求的扫描不运行；`ArchiveReveal` 隐藏时冻结在当前进度。

### Fixed
- **M10**：`MotionPlayer` 的 Default / Slow / Interrupt 通道曾用 `MotionConfig reducedMotion="user"` 包裹，会把外层 `RhineProvider motion="reduce"` 或 `MotionConfig reducedMotion="always"` 重置为跟随系统，导致用户选择减少动态效果时这些通道仍有位移。现在只有 Reduced 通道强制减动，其他通道继承外层偏好。

### Requirements
- peer：`@wzrhine/react`（同版本线）、`react` / `react-dom` ^18.2 || ^19、`motion` ^12。

M6 未改动本包。升级步骤见 [UPGRADING.md](https://github.com/BaiZhi967/WzRhineLab-UI/blob/main/docs/development/UPGRADING.md)。
