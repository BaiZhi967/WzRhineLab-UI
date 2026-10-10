# Drawer

- 状态：**Beta（M9）** · 契约：[ADR-0006 §4](../development/adr/0006-overlays-feedback-contracts.md)
- 底座：Base UI 1.9.0 `drawer`（Dialog 的焦点与滚动锁定 + 滑动关闭）
- 源码：`packages/react/src/components/Drawer.tsx`，样式 `drawer.css`（Drawer 段）· Showcase：`#/components/drawer`；档案检索场景窄布局的记录详情

## 用途 / 非用途
| 用于 | 不用于 |
| --- | --- |
| 与当前页面并列查看的内容：记录详情、筛选条件、短表单 | 需要确认后果的操作（用 `AlertDialog`） |
| 窄屏上替代侧栏详情（底部弹出） | 多步骤长流程、超过一屏的编辑任务（用独立页面） |
| | 非模态的常驻侧栏（未提供 `modal={false}`） |

## API
```tsx
<Drawer
  trigger={<Button variant="secondary">查看详情</Button>}
  eyebrow="ARCHIVE / DETAIL"
  title="ARC-1024"
  description="记录详情"
  side="end"            // 'end'（默认）| 'start'，跟随书写方向
  size="md"             // 'sm' | 'md' | 'lg'，复用 --rl-dialog-width-*
  actions={<><DrawerClose><Button variant="ghost">取消</Button></DrawerClose><Button>保存</Button></>}
  onCloseRequest={(reason) => (saving ? false : undefined)}
>
  <MetadataList items={…} />
</Drawer>

// 受控、无触发器（例如从列表项打开）；finalFocus 指定关闭后的焦点
<Drawer open={open} onOpenChange={setOpen} title={record.title} finalFocus={cardRef}>…</Drawer>
```

| 属性 | 说明 |
| --- | --- |
| `title` *必填* | 对话框名称（`aria-labelledby`） |
| `description` / `eyebrow` | 描述（`aria-describedby`）/ 标题上方的档案标签 |
| `children` | 正文，单独滚动；溢出时成为可聚焦的 `region`（名称取标题），键盘可滚动 |
| `actions` | 底部固定操作栏 |
| `trigger` | 打开抽屉的元素；省略时用受控 `open` |
| `open` / `defaultOpen` / `onOpenChange` | 受控 / 非受控 |
| `onClosed` | 退出过渡结束、焦点归还后触发 |
| `side` | 宽屏时贴靠的逻辑边：`end` 在 LTR 下为右侧、RTL 下为左侧 |
| `size` | 宽屏面板宽度 400 / 520 / 720（且不超过视口宽度减 48px）；底部弹出时始终全宽 |
| `closeLabel` | 头部关闭按钮（`IconButton`）名称，默认「关闭」 |
| `onCloseRequest(reason)` | 用户发起关闭前调用；返回 `false` 取消本次关闭，焦点不动。程序化 `open={false}` 不经过它 |
| `initialFocus` / `finalFocus` | 打开时 / 关闭后的焦点目标；默认分别为面板本身、触发器（或打开前的焦点元素） |

`DrawerCloseReason`：`'escape' | 'outside' | 'close-button' | 'trigger' | 'swipe'`。前四项与 `DialogCloseReason` 相同；`swipe` 为滑动关闭，Android 返回手势（CloseWatcher）归为 `escape`。

`DrawerClose`：包住一个按钮，激活时关闭最近的 Drawer（原因 `close-button`）。

## 布局
| 视口 | 形态 | `swipeDirection` |
| --- | --- | --- |
| ≥ 40rem | 侧边面板，全高，贴靠 `side` 对应的物理边 | 与贴靠边一致（`right` / `left`） |
| < 40rem（`matchMedia('(max-width: 39.99rem)')`） | 底部弹出，全宽，最高 85dvh，顶部有装饰性拖动条 | `down` |

断点由组件内 `matchMedia` 决定（`useSyncExternalStore`），视口变化时实时切换。服务端与水合首帧按宽屏渲染；面板只在打开后出现，不影响水合。书写方向在每次打开时从挂载容器读取（`direction: rtl` 或最近的 `dir="rtl"`）。

## 可访问性与键盘
- `role="dialog"`，模态：焦点进入、Tab / Shift+Tab 在面板内循环、Esc 关闭、页面滚动锁定、背景 inert（`aria-hidden`），关闭后焦点归还。
- 遮罩点击关闭（原因 `outside`）。
- 头部关闭按钮始终存在；默认初始焦点在面板本身，读屏先读标题与描述。表单抽屉可用 `initialFocus` 指向第一个字段。
- 头部、底部固定，正文 `overflow-y: auto` 且 `overscroll-behavior: contain`。
- forced-colors：面板边框 `CanvasText`。

## Motion 与减动
- **CSS 负责 `transform`**：Base UI 在拖动时把位移写入 `--drawer-swipe-movement-x/y`（以及拖动中的内联 transform），motion/react 不参与，避免两方写同一属性。
- 进出场：`data-starting-style` / `data-ending-style` 时位移到边外（`translateX(±100%)` / `translateY(100%)`），`--rl-motion-panel` + `--rl-ease-out`。CSS transition 从当前位置接续，快速开关可中途反向；Base UI 等过渡结束后才卸载。
- 拖动中（`data-swiping`）过渡时长为 `--rl-motion-instant`，跟手；快速甩出按 `--drawer-swipe-strength` 缩短退出时长。
- 遮罩：与 Dialog 同色（`color-mix(--rl-bg-inverse 36%)`），透明度随滑动进度降低。
- 减动（`prefers-reduced-motion: reduce` 与 `.rl-theme[data-rl-motion='reduce']`）：不位移，只淡入淡出；时长 token 归零，实际为瞬时出现 / 消失。

## 用例与反例
- ✅ 档案检索：宽屏用并列详情面板，窄布局（< 1024px）点击卡片或「查看」打开 Drawer，关闭后焦点回到该卡片 / 按钮。
- ✅ 保存进行中用 `onCloseRequest` 返回 `false`，同时禁用取消按钮、显示 loading。
- ❌ 在 Drawer 里放破坏性确认：用 `AlertDialog`，可嵌套在 Drawer 之上。
- ❌ 依赖 `side` 控制窄屏位置：窄于 40rem 时总是底部弹出。

## 已知限制
- 不提供 snap points、嵌套缩进效果、非模态模式（ADR-0006 §4，M12 视需求再定）。
- 未接入 `Drawer.VirtualKeyboardProvider`：底部弹出内含输入框时，软键盘处理依赖浏览器默认行为。
- 滑动关闭只在真实触控 / 指针拖动下发生，E2E 未模拟手势；`swipe` 原因由单测之外的手动验证覆盖。
- 默认文案为中文，可覆盖；统一 locale 见 M9.5。

## 测试
- 单测：`packages/react/test/drawer.test.tsx`（语义与 portal、关闭按钮名称、Esc 与焦点归还、`onClosed`、`DrawerClose`、关闭原因与拒绝关闭、程序化关闭跳过保护、宽屏 / RTL / 窄屏布局与 `swipeDirection`、未打开时不渲染、减动 CSS）；类型反向测试 `drawer.test-d.tsx`。
- E2E：`apps/docs/e2e/drawer.spec.ts`（焦点进入 / Tab 循环 / Esc / 归还、遮罩与关闭按钮、滚动锁定与 inert、1280 右侧全高、start 侧贴左、390 底部弹出与正文独立滚动、关闭保护、快速开关无残留且退出过渡可见、减动无位移、明暗 axe）；`archive.spec.ts` 档案检索窄布局 2 项；Chromium / Firefox / WebKit。

## 变更记录
- 0.0.0：首次加入（M9）。
