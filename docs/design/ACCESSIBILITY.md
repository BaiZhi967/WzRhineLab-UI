# ACCESSIBILITY · 可访问性验收规范

目标：WCAG 2.2 AA；**本仓库目前尚未通过审计**，以下为开发门槛。

- 普通大小文本对比度 ≥4.5:1，大文字 ≥3:1；关键非文字 UI 图形及控件边界 ≥3:1。
- 键盘导航顺序遵循视觉阅读顺序；所有可操作元素必须可获得、可见的焦点。
- Modal/Popover/Select 的 Escape、焦点陷阱/移动、关闭后焦点恢复依赖经验证的 headless 底座，禁止只用 div+onClick 冒充 button。
- icon-only 控件有可访问名称；装饰图标 aria-hidden；错误同时关联字段、提示与纠正方法。
- 触控目标以约 44×44px 作为优先设计目标；WCAG 2.2 AA 目标尺寸最低 24×24px，允许其指定例外，不可把 44px 错称为 AA 强制数值。
- reduced-motion: 对所有 transform/布局大位移提供退化路径；CSS/Canvas/视频/3D 不依赖 MotionConfig 自动管理。
- 支持 200% 页面缩放、窄屏、长中文、输入法组合、浏览器默认字体放大与高对比设置。
- 有实时数据时提供文字状态与合理频率的 live-region 更新；不要高频朗读所有曲线采样。
- 测试矩阵：键盘仅操作、屏幕阅读器抽检、axe、Playwright focus 路径、prefers-reduced-motion、chrome/firefox/webkit、320/390/768/1280/1920 宽度。
- 任何不满足门槛的组件不得标记为 stable；已知问题以 Issue 记录并给出替代使用方式。

参考：https://www.w3.org/TR/WCAG22/ 以及 https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html
