# Visual Concepts · 概念图索引

这八张图均是针对 WzRhineLab UI 创建的原创概念探索，**非官方明日方舟美术素材**。展示方向而非工程真值；图中 AI 生成的文字、假读数、交互面积、颜色/时长数值不作为验收依据。

## 目录结构与图片命名
最终计划采用 `docs/concepts/images/`，原始 PNG 与经过压缩的展示 WebP 分开保存：
1. `01-research-ui-overview.png` —— 设计系统首页、科研设备与模块入口。
2. `02-component-library.png` —— Button / Tabs / Input / Badge / Table 等组件全景。
3. `03-archive-dashboard.png` —— 档案与研究数据详情。
4. `04-responsive-mobile-tablet.png` —— 手机/平板排版与档案详情。
5. `05-foundation-tokens.png` —— 调色板、字体、间距、图标与状态。
6. `06-archive-workbench-detail.png` —— 完整实验与样本工作台。
7. `07-motion-storyboard.png` —— Motion 时间曲线、故事板与动画规范。
8. `08-responsive-ecosystem.png` —— 手机/平板/桌面响应式演化。

**当前状态**：8 张源图随本次交付包保留。此目录索引不表示所有二进制已入 GitHub；需检查 `docs/concepts/images/` 是否真实存在并填写下方交付记录。不要把失效链接放到 README 显示为完整交付。

## 使用原则
- 以轮廓、节奏、比例关系和信息组织作参考；不要照抄单图拼出的一次性 UI。
- 正式代码中的 tokens 与时长以 STYLE/MOTION 为准。
- 图中可能有不准确的英文、百分比、状态和日期；需改为可验证的静态示例或真实数据。
- 组件完成后提供浏览器真实运行截图与图片对照，而不只贴概念图。

## 归档验收
- [ ] 八张 PNG 在 Git 仓库中能通过 GitHub 文件查看并独立下载
- [ ] 研究 PDF 原件在仓库 `docs/research/` 可下载
- [ ] 图像来源/使用目的/文件大小/许可说明记录
- [ ] 压缩预览图没有替换原件、无外部商标素材

## 视觉基准与导入

此前新增的八张简化 SVG 结构草图因与既定风格不符，已从仓库删除，不再作为设计参考。请以本页列出的八张高分辨率 PNG 原图为视觉基准（WebP 仅用于展示加速）。

上传说明：先下载并保存 `WzRhineLab-UI_concepts_and_research_2026-10-09.zip`，在 Windows 本地克隆仓库后运行 `scripts/import-visual-assets.ps1 -AssetZip <ZIP完整路径> -Commit -Push`。脚本会验 SHA-256，复制 8 PNG + 8 WebP + 1 PDF 到相应路径，并产生一次中文提交。**不要直接把 ZIP 上传到 GitHub 网页：GitHub 不会自动解压。**

参考 [ASSET-MANIFEST](../research/ASSET-MANIFEST.md) 及仓库根 README。
