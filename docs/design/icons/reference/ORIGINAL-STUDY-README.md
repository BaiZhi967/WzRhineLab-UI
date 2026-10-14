# WzRhineLab UI · 图标参考稿

本交付为原创 SVG 矢量绘制的设计参考，不是通过图像模型生成的位图，也不是已接入仓库的正式图标发布。

## 内容
- boards/：4 张 3200×2240 PNG 参考板及其 SVG 源稿。
- svg-icons/：36 个独立 SVG 草案，统一 viewBox 24×24、stroke 1.75、round cap/join、currentColor。
- png-icons/：36 个透明底 256×256 PNG，深墨笔画。
- review/：逻辑尺寸 1600×1120 的 1×参考板、预览、符号检查图和几何统计。

## 依据
已阅读仓库 main 分支的 DESIGN.md、docs/design/STYLE.md、docs/design/ICONS.md、docs/concepts/README.md。
概念图片读取自已归档的 WzRhineLab-UI_concepts_and_research_2026-10-09.zip，查看了科研首页、设计基础与档案工作台；仓库概念索引将该归档列为现有视觉基准。
基于这些源文件的秩序、色彩和仪器感做原创轮廓设计，没有复制游戏图标或徽记。

规范路径（仓库内相对链接）：
- [DESIGN.md](../../../../DESIGN.md)
- [docs/design/STYLE.md](../../STYLE.md)
- [docs/design/ICONS.md](../../ICONS.md)
- [docs/concepts/README.md](../../../../docs/concepts/README.md)

## 对齐和后续使用
统一可见笔画尺度、网格和线宽。先根据笔画外接框中心归一化，再用较低权重的墨量重心进行光学校准；这个测量只能辅助视觉判断，不能证明所有界面中的感知居中。
对称图形共享中轴；非对称图形的补偿值保存在各 SVG 的内部 transform 中，使用方不应再凭感觉随机加 margin。
板上 16/20/24px 指逻辑像素。原始像素检查请打开 review/*_1x.png 并设为 100%，不要用被聊天界面缩放的预览作像素级判断。
图板文字引用系统字体，未附带或嵌入任何字体文件；缺少相同字体时 SVG 板的文字可能变化，PNG 不受影响。
36 个图标是草案，尚未在目标 React 组件、Windows/macOS 浏览器渲染与屏幕阅读器中验收；不应描述为生产就绪。静态界面示意也不代表已经实现的页面。
接入时仍需统一 Icon 包装器、无障碍名称规则、方向性、disabled/focus/selected 语义，并在目标系统检查 16/20/24px。
本次没有修改 GitHub 仓库或提交任何代码。
