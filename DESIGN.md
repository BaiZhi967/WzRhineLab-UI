# WzRhineLab UI · 设计总纲

> 状态：**v0.2**（2026-10-11，M0–M10 已实现；初版 Draft v0.1 为 2026-10-09）；本文为规范源，图稿为探索性参考而非可直接复现的设计稿。色值经 [ADR-0003](docs/development/adr/0003-token-tuning-and-button-variants.md) 对比度校准，公开 token 契约已在 M6 冻结（`@wzrhine/tokens` 的 `publicTokens`）；尚未发布 npm，也未通过外部无障碍审计。

## 1. 产品定义与边界
一套原创、可跨项目复用的 React + Motion UI 框架与组件库，参考明日方舟「莱茵生命」的**机构秩序、科研档案、精密仪器、航天信息图形**的气质，但不复制官方图标、标志、游戏画面、素材和角色名称。最终交付物：tokens、可访问组件、动画预设、布局模式、图标规则、文档站、示例应用。

**风格关键词**：Precision / Research / Archive / Institutional / Warm Technical / Restrained Motion。

**原则排序**：信息正确 > 可读与可达 > 一致性 > 动效反馈 > 装饰。默认是高可读的浅色科研工作台，深色仪表盘作为可选主题；不是泛赛博霓虹风，也不是全站扫描动画。

## 2. 三层视觉语法
1. **Research Foundation**：暖白背景、近黑文字、稳定网格、精确编号、小面积研究橙；供高频业务组件。
2. **Archive Pattern**：档案编号、分类、所属、版本、状态、时间与权限；真实信息优先，缺少真实数据时不生成假读数。
3. **Instrument Accent**：刻度、轨道、准星、标尺、圆环、剖面标签；只出现在监测、标注或产品展示场景，并标注语义。

## 3. 统一构图
- 以 4px 基础空间刻度编排；常用 8/12/16/24/32/48。
- 页面由 Navigation / Header / Content / Context 三类区域组织；不把每块面板平均分列。
- 所有信息元素采用可重复对齐线；同角色在不同页面保持相同对齐和层级。
- 主要正文宽度根据内容类型约束；高密度表格可横向滚动，不缩小到不可读。
- 不把固定设计稿按比例整体缩放适配移动端；手机使用重排与渐进披露。
- 装饰分隔线不能充当唯一交互边界；焦点、错误、选中各用独立语义。

## 4. 色彩与排版
规范以 [docs/design/STYLE.md](docs/design/STYLE.md) 中的语义 tokens 为准。**提出的数值不代表官方色值**。字体以中文无衬线 + 英文无衬线 + 数据等宽三角色；编号允许 tracking，中文段落不人为扩大字距。信号色承担重要变化，正文不以彩色文字为默认。

## 5. 动效与声音
见 [docs/design/MOTION.md](docs/design/MOTION.md)。动画必须回答「状态是否已变化」「新内容来自哪里」「对象身份如何连续」之一。默认简短、单轴、可中断；非必要持续动画不可用于业务页；尊重减少动态效果。音效不属于 v0.x 基线范围。

## 6. 组件与图标
- 统一语义 API，区分视觉 variant 和业务状态 status；不以装饰取代可访问标签。
- 对基本组件：响应式、键盘、焦点、disabled、loading、error、RTL/长文本（按需）、暗色、减动完整验收。
- 图标使用单一线条语法，中心视觉对齐，明确 stroke/viewBox；详情见 [docs/design/ICONS.md](docs/design/ICONS.md)。
- 不允许在组件内部硬编码「FPS 60」「在线」「经纬度」等假数据。

## 7. 设计交付验收
任何新组件必须提供：API 说明、状态矩阵、至少两种布局宽度截图、键盘/焦点路径、动画时序及 reduced-motion 替代、tokens 引用、Story/demo、必要单元测试。每次设计提案需有 **参考来源 / 决策 / 代价 / 验证方法**。

## 8. 参考和知识产权
参考研究见 [docs/research/REFERENCES.md](docs/research/REFERENCES.md)。概念图见 [docs/concepts/README.md](docs/concepts/README.md)。所有概念图为原创探索；AI 图片上的任意字号、色值、技术读数均需经文档与代码复核。公开发行前核实源代码许可证、第三方字体与图标许可证，不引入未获授权的原作资源。
