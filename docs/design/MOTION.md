# MOTION · React 动效规范（Draft 0.1）

> 模式目录（每个已实现模式的完整字段）见 [MOTION-PATTERNS.md](MOTION-PATTERNS.md)；属性所有权、预设与 token 映射、按属性类型的减动解析、生命周期契约见 [ADR-0007](../development/adr/0007-motion-ownership.md)。

## 动效原则
**可解释、精确、克制、可中断**。每个动画必须传达：反馈 / 空间关系 / 状态身份 / 任务过程。优先使用 opacity 与 transform，不应为了「科技感」默认启用持续闪动、错乱字符或全屏扫光。

## 时间 Tokens
| 名称 | 建议值 | 使用 |
| --- | --- | --- |
| instant | 0ms | 减动时的不必要布局位移 |
| press | 80ms | 按压 |
| fast | 120ms | hover / focus 过渡 |
| base | 200ms | 标签、选中与反馈 |
| panel | 280ms | 普通面板 / 详情层 |
| scene | 420ms | 档案视图身份连续 |
| showcase | 700ms | 仅用户主动触发的演示场景 |

曲线起点：out=[0.16,1,0.3,1]；inOut=[0.65,0,0.35,1]；linear 用于真实进度反馈。Spring 仅用于可拖拽/可打断目标，禁止无语义弹跳。每类动画最终需通过可视评估（短时闪动、连击、CPU 降速）验证，**数值为待校准起点**。

## 模式与接口
- `MotionConfig reducedMotion="user"` 配置在演示 app 或使用者入口层；同时检查 `useReducedMotion`，对于非 Motion 的 CSS/Canvas/WebGL 动画手动降级。
- `AnimatePresence` 处理必要的退出阶段；需保证 Dialog 等基础组件的焦点隔离、Escape、Portal、卸载和焦点归还正确。
- `layout` 和 `layoutId` 只处理确有连续身份的卡片/指示器；对含文字的节点优先 `layout="position"` 避免文字拉伸。
- 避免每一项长列表 stagger；如果采用，前几项每项 20–30ms、设总延时上限。
- 不要将 React 组件的 `key` 变化用作重置所有内部状态的方法。

## 交互矩阵
| 组件 | 入场/变化 | 退出/还原 | reduced-motion |
| --- | --- | --- | --- |
| Button | hover 120ms；press 80ms（≤0.99 scale） | 保留即时点击反馈 | 颜色/边框直接变化 |
| Tabs | 180–220ms 指示器位移 | 快切接续当前位置 | 指示器直接定位 |
| Tooltip | 100–120ms opacity | 80–100ms | 直接显示或短淡入 |
| Dialog | backdrop 160ms；内容 220–280ms + 8px | 从当前状态淡出 | 不移动，只显隐 |
| Toast | 180–240ms 轻移入 | 150ms | 直接定位 |
| ArchiveCard | 260–420ms 身份连续 | 从当前进度反向 | 直接更新详情 |
| Progress | 实际百分比与消息同步 | 完成后停止 | 确定性数值变化 |

## 中断和生命周期
1. 用户连续点击、快速切换或退出时必须从**当前视觉状态**接续，不排队播放过时动画。
2. 过期的异步任务结果不能把已经关闭的对话框重新挂载。
3. 模态退出完成前维持背景交互隔离，之后归还触发按钮焦点。
4. 页面不可见、Canvas 不在视口、禁用演示或 reduced-motion 时停止后台循环。
5. 任何「扫描/解密」视觉属于 **Showcase effect**，不可延迟业务结果显示；所有变更必须能被屏幕阅读器感知。

## 性能门槛
以 60Hz 屏幕争取单帧预算约 16.7ms，动画不得引起大范围强制同步布局。优先 GPU 合成属性；避免多层 `backdrop-filter`、全屏噪点动画、逐字符 DOM 大量插入。布局/交互测试至少覆盖 30fps 降级、快速反向、卸载、隐藏页、reduce、移动端。

## 测试与演示
Showcase 每类动画提供 Default / Slow x0.25 / Reduced / Interrupt 四组状态；Playwright 的减动媒体模拟 + 手动键盘测试。参数来源与调整记录纳入组件文档。
