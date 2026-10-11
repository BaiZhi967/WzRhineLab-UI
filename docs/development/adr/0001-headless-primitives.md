# ADR-0001 · React Headless 交互底座选型

- 状态：**Accepted** · 2026-10-09（维护者确认采用 Base UI）
- 选定：**`@base-ui/react` 1.8.0**（MIT；peer React 17–19；`sideEffects: false`；按子路径导入）
- 背景：科研/档案 UI 需要自定义表现，但 Dialog/Select/Tabs/Menu 等需要完整键盘与焦点语义。

## 候选与评价
| 轴 | Base UI | React Aria Components | Radix Primitives |
| --- | --- | --- | --- |
| 样式自由度 | 无样式，`className`/`render`/data 属性 | 无样式，render props | 无样式 |
| 退出动画 + motion/react | 官方文档支持：受控 `open` + `AnimatePresence` + `Portal keepMounted` + `render={<motion.div/>}`；以 `getAnimations()` 等待退出 | 需自行管理挂载 | 需 `forceMount` 手动协调 |
| 组件覆盖 | Dialog/AlertDialog/Drawer/Popover/Tooltip/Menu/Select/Combobox/Tabs/Field/Form/Toast… | 最全（含日期、i18n） | 较全，Field/Form 缺失 |
| 体积 | 子路径导入，tree-shake 友好 | 较大 | 中等 |
| 维护 | MUI 团队，1.x 稳定版 | Adobe，稳定 | 更新放缓 |

结论：Base UI 与本项目「tokens 决定视觉、motion/react 决定动效」的分工最贴合，且一套库覆盖 M1–M2 全部复杂组件，满足「不叠加多套交互库」。

## 验证证据（2026-10-09，本地真实运行）
**jsdom（`packages/react/test/spike/base-ui-spike.test.tsx`，9 项通过）**
- Dialog：`role=dialog`，标题/描述自动关联；打开后焦点进入；Esc 关闭并归还焦点到触发按钮；外部内容 `aria-hidden`；快速开关不残留；`MotionConfig reducedMotion="always"` 下即时关闭。
- Field：Label / Description / Error 自动接入 `aria-describedby`；`aria-invalid`；Root `disabled` 传递到控件。
- Select：`combobox` + `listbox`，方向键/Enter 选择、Esc 取消不改值，关闭后焦点回到触发器。

**Chromium（`apps/docs/e2e/base-ui-spike.spec.ts`，9 项通过；该文件已在 405953a 随 ADR Lab 原型移除，覆盖并入 `overlays.spec.ts`；jsdom spike 保留在 `packages/react/test/spike/`）**
- 8 次 Tab/Shift+Tab 焦点始终在弹窗内；Esc 后焦点回到触发器。
- 打开时页面滚动锁定，主导航退出可访问树。
- 连续 3 次开关后只存在 1 个弹窗；退出动画结束后卸载；焦点正确归还。
- 系统减动时弹窗无位移 transform。
- 弹层 Portal 到 `.rl-theme` 根内，暗色 tokens 生效；明/暗打开状态 axe 0 violations。
- 390px 下 Select 弹层不超出视口。

## 已知限制
- jsdom 不执行 Base UI focus guard 的重定向，Tab 循环只能在真实浏览器断言（已覆盖）。
- Field 的 `valueMissing` 只在值被编辑过或提交时报告（Base UI 刻意降噪）；表单提交路径仍会校验。
- Dialog 在 Base UI 中不支持手势；需要拖拽/吸附的面板改用 Drawer。

## 使用约束
1. 只从子路径导入（`@base-ui/react/dialog`），禁止根入口全量导入。
2. 所有弹层必须设置 `Portal container` 到 `.rl-theme` 作用域内，否则 tokens、主题与 `data-rl-motion` 不生效。M2 将在 `@wzrhine/react` 提供统一的 Provider 注入。
3. 使用 motion/react 动画时 Popup 必须动画 `opacity`（Base UI 依赖它判断退出完成）；位移幅度取 `useRhineMotion()`，减动时为 0。
4. 简单弹层（Select/Popover/Tooltip）优先使用 Base UI 的 `data-starting-style`/`data-ending-style` CSS 过渡，时长取 `--rl-motion-*`。
5. 不与 Radix / React Aria 混用；新增复杂组件前先检查 Base UI 是否已有对应原语。
6. `@base-ui/react` 作为 `@wzrhine/react` 的 `dependency` 精确锁定版本；升级需重跑 spike 套件。

## 后果
- `@wzrhine/react` 增加 1 个运行时依赖（Base UI 及 floating-ui）；只用 Button/Surface 的宿主因子路径导入与 tree-shake 不受影响（M5 发布前以 bundle 分析复核）。
- M1-B 的 Input / Field 直接基于 Base UI Field 实现；M2 的 Dialog / Select 从 `apps/docs/src/pages/lab` 原型升级为正式组件（原型目录已在 405953a 移除）。

## 修订 · 2026-10-10：升级 1.9.0
- `@base-ui/react` 1.8.0 → **1.9.0**（2026-10-09 发布的 minor 版本，changelog 无破坏性变更）；传递依赖 `@base-ui/utils` 0.4.0 → 0.5.0，floating-ui 系列版本不变。
- 动机：上游修复与本项目全部九个包裹模块相交——Menu 的 focus guard 循环与 hover-out 动画、Popover/Tooltip 的 remount 过渡、Select 大列表挂载性能、Tabs 函数值选择、Toast 交互期间计时器暂停、Field 的 `defaultValue` 告警；并为 M7 表单组件带来 Checkbox/Radio/Switch 的 `aria-label` 优先级与 RadioGroup 方向键、inputRef 修复。
- 重验（分支 `chore/base-ui-1.9.0`，真实运行，证据见 [验收记录](../acceptance/2026-10-10-base-ui-1.9.0.md)）：jsdom 131 项（含本 ADR 要求的 spike 三组：Dialog+motion / Field / Select）、Showcase 三内核 E2E 238 项、视觉基线 31/31 零 diff、示例逐内核 archive-desk 13×3 / host-embed 27 / ssr-hydrate 18、`api:check` 无公开 API 漂移、`license:audit` 与 `verify:packages` 通过。
- 使用约束 1–6 维持不变；继续以 `dependency` 精确锁定版本。
