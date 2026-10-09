# Changelog · @wzrhine/effects

格式参考 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，版本号遵循 [SemVer](https://semver.org/lang/zh-CN/)。本包为 **Experimental**，0.x 期间 API 可能调整。

## [Unreleased]

尚未发布到 npm。首次发布时归入 `0.1.0`。

### Added
- **M4（ADR-0004）**：`ArchiveReveal`（确定性解密、可中断、减动直接切换）、`ScanSurface`（单次扫描，减动时为静态描边）、`OrbitalDiagram`（仪器风格轨道，可选旋转）、`MotionPlayer`（Default / Slow ×0.25 / Reduced / Interrupt 四通道），以及 `EffectClock` / `useEffectTiming`。
- 页面隐藏、离开视口、完成或卸载时停止循环；不使用 Canvas 或 WebGL。
- **M5**：通过 `dist/` 发布 ESM 与 `.d.ts`；`./styles.css` 导出。

### Requirements
- peer：`@wzrhine/react`（同版本线）、`react` / `react-dom` ^18.2 || ^19、`motion` ^12。
