# 概念源稿归档 · 2026-10-14

本目录归档 2026-10-14 收到的第二批原创图标概念稿（`WzRhineLab-UI_Icon_Concepts`），作为批次 2026-10-14-batch-01 的设计来源记录。与 [../README.md](../README.md) 中归档的第一批 36 枚草案（optical-core 等）不是同一批资产。

## 内容

- `icon-*.svg`：36 枚独立概念稿，原始导出形态（24×24、1.75 stroke、round cap/join、currentColor；含导出噪声如空 `defs`、命名空间声明）。
- `01_RESEARCH_INSTRUMENTS` / `02_ARCHIVE_SYSTEM` / `03_TERMINAL_NAVIGATION` / `04_USAGE_CONTEXT`：四张概念板的 PNG 与 SVG 源。

## 使用方式与权威边界

- **正式源是 React 几何**：`packages/react/src/components/Icon.tsx` 中的 `PATHS`。本目录仅供溯源与再设计参考，不是第二份可独立编辑的正式资产（主规范 §15、ENG-05）。
- 进入公共集合时按家族母体做了几何归一化（文档/文件夹/盾牌/屏幕共用既有母体），逐枚归一化决策见 `../../icon-review/2026-10-14-batch-01/scope.md`。
- `icon-settings.svg` 未采用：现有 `Settings` 已是公共契约，概念稿未提供语义增量（SEM-02）。
- 概念稿为原创矢量绘制，无游戏素材、无字体文件；正式接入以来源记录与本归档为准。
