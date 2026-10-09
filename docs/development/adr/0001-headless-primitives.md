# ADR-0001 · React Headless 交互底座选型

- 状态：**Proposed**；尚未确认 / 尚未在工程内安装。
- 背景：科研/档案 UI 需要自定义表现，但 Dialog/Select/Tabs/Menu 等需要完整键盘与焦点语义。
- 候选：Base UI、React Aria Components、Radix UI Primitives。
- 评价轴：React19/SSR/StrictMode、受控模型、ARIA 完整性、Focus Trap/Portal、退出动画挂载、体积、稳定性、许可证、维护状态。
- 暂定做法：M0 仅使用原生 button/span/section 等语义 DOM；M1 选择单一交互底座并记录验证结果，再实现 M2 复杂组件。
- 禁止：在未决情况下把多个交互库叠加，或自行实现复杂 focus trap 冒充稳定基础库。
