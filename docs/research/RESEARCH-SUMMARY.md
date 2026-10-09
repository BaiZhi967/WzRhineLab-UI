# WzRhineLab-UI 风格研究摘要（2026-10-09）

> 深度研究 PDF 的 Markdown 落地提要。完整 22 页研究报告原件归档在用户 Library，二进制原件的 GitHub 导入状态见 ASSET-MANIFEST.md。

## 1. 视觉语言的三种层次
- **档案科研**：暖纸/墨色、精确编号、标尺、分类、权限、状态、清晰分栏。适合长期使用的管理平台。
- **航天机构**：较大字体比例、标记色、轨道与圆弧、任务标题与方向信息。适合主页/概览/项目叙事。
- **测量仪器**：读数单位、图形、时间轴、量程、科学标注。适合真实数据可视化，但严禁假状态与假传感器数据。

这些是基于官方视觉与第三方示例的**设计分析，不是明日方舟官方 design tokens 或设计理论声明**。

## 2. 信息设计思想
参考国际主义平面设计和现代机构识别系统，重点不是堆积「科技装饰」，而是让信息可定位、可读、可比较：网格对齐、模块标题稳定、元信息与正文区分、数值有单位。可检索性和可靠性应优先于动画表演。

## 3. 可移植的样式策略
- 浅暖纸色为基础、近黑为信息骨架、橙色做少量任务/操作强调。
- 橙色强调与 warning/error/focus/selection 是不同语义，即便颜色相近也不混用 token。
- 大号标题 + 小型编号体现机构感，但正文至少保持舒适尺寸。
- 细线与透明层只用于辅助层次，必要控件边界需符合可访问性要求。
- 用真实内容设计密度；切勿从 AI 图稿提取未经验证的随机色号、百分比或权限状态。

## 4. Motion 规则
状态先于装饰：交互被确认、身份连续、层级切换、局部更新。基线交互大致 80–320ms，用户主动启动的展示动效可更长。快速反向应从当前运动进度接续；减动保留最终状态与反馈，但取消非必要大幅移动和循环扫光。

## 5. 复用与工程的取舍
- [RhineLabUI](https://github.com/LBEILC/RhineLabUI) 最适合作为运动与空间演示研究，不适合当作 React 组件底座。
- [ak-ui](https://github.com/YunYouJun/ak-ui) 适合研究 CSS tokens/框架无关风格层。
- [ReEnd-Components](https://github.com/VBeatDead/ReEnd-Components) 适合研究 React 组件包和工业视觉，但单个组件键盘行为需审查。
- [Rhine-Lab-Theme-Index-Page](https://github.com/QingXia-Ela/Rhine-Lab-Theme-Index-Page) 适合研究落地页；README 商用声明与 MIT 文件相互矛盾，直接复用前需澄清。
- [dsh-Rhine-Lab-theme](https://github.com/ReLuckyLucy/dsh-Rhine-Lab-theme) 适合研究语义色如何映射到真实产品。

## 6. 研发建议
先建立 CSS tokens、Button/Input/Surface/Badge，再实现 Tooltip/Tabs/Dialog 等交互，最后加入原创 ArchiveCard / InstrumentPanel / Timeline。将 WebGL 与音效隔离在可选演示层，业务组件不依赖它们。

## 7. 概念图的适用性
八张高保真 PNG 对应首页、组件库、档案、跨屏、令牌、工作台细节、Motion、响应式生态。图片以材质和版式为视觉评审参考；真正实现时必须重新校验字体、对比度、点击目标与真实 DOM 布局。
