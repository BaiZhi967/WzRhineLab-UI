# ICONS · 图标、徽记与装饰规则（Draft 0.1）

## 定位
图标是**信息与操作符号**而非 UI 装饰填充。保留克制、几何、线性、科研终端气质；官方莱茵生命标志、明日方舟角色头像与游戏原始图标不得直接放进可发布资产。

## 统一网格
- 基准 viewBox：24 × 24；标准展示尺寸 16/20/24px；导航可选 18/20px。
- 推荐 1.75–2px stroke，round/square 策略统一（优先 round linecap + round linejoin），同一图标集中统一视觉重量。
- 以光学中心而非 SVG 几何中心校准；图标盒与文本 baseline、按钮内边距须逐像素人工确认。
- stroke 使用 currentColor；危险/成功语义必须与文本配合；避免所有图标橙色。
- 图标用 SVG，无字体图标和 Emoji 作为产品默认图标。

## 图标分类
通用：home/search/filter/settings/close/check/chevron/arrow/download/upload。科研：flask/microscope/layers/scan/chart/signal/satellite。档案：file/search-file/archive/folder/tag/history/lock。装饰：tick/ruler/orbit/crosshair 不应抢占实际可用空间。

## 尺寸与点击目标
图形 16px 并不意味着点击目标 16px；桌面优先 32–40px 操作区域，触控优先约 44px 以上可用区域（对应 WCAG 2.2 AA 的最小目标尺寸规则及例外需独立核验）。`IconButton` 的 aria-label 必填，若图标只是文字重复的装饰则 aria-hidden=true。

## 色彩状态
default currentColor；hover 继承按钮/链接；active/selected 与 focus-visible 区分；disabled 不依赖仅降低 opacity。危险、警告需组合明确名称和辅助形状。

## 来源和版权
早期默认采用 lucide-react 作为占位和技术参考，锁定版本并保留许可；真正品牌/研究类 icon 另写原创 SVG，禁止直接抠图、描摹游戏资源。
> 现状（2026-10-11）：实际没有引入 lucide-react 或任何图标依赖。Showcase 图标是 `apps/docs/src/icons.tsx` 中的原创 24×24 线性 SVG（1.75 stroke、round cap/join、`currentColor`）；组件内部的状态与控件图标是各组件源码内联的原创 SVG（多为 16×16 viewBox），默认 `aria-hidden`。提交任何新图标应附来源、语义定义、SVG 视口、截图与许可信息。

## 验收
16/20/24px 原始像素检查：视觉居中、线条厚度、边缘留白、光学补偿；同时检查暗色、禁用、RTL方向（箭头类）、屏幕阅读器名称及高倍率缩放。

## 0.2.0 公共入口

R01 采用库内原创 SVG 路线：`Icon` 可从 `@wzrhine/react` 或 `@wzrhine/react/icons` 导入。公共集合统一 24×24 viewBox、1.75 stroke、round cap/join、currentColor。`AgentIcon` 的 16×16 网格保留为已有内部/兼容图标体系；新消费界面优先使用公共入口。本仓不新增 lucide-react 运行时依赖。
