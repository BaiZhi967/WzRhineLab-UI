# RhineProvider · Tabs · Tooltip · Dialog · Select

- 状态：**Beta（M2-A）** · 底座：Base UI 1.9.0（ADR-0001，2026-10-10 升级）
- 源码：`packages/react/src/provider/RhineProvider.tsx`、`components/{Tabs,Tooltip,Dialog,Select}.tsx`、`overlays.css`
- Showcase：`#/components/tabs`、`/tooltip`、`/dialog`、`/select`

## RhineProvider
应用（或局部区域）的根。渲染 `.rl-theme` 作用域，并在作用域内放置弹层挂载点；同时配置 motion/react 的减动策略和 Tooltip 的共享延迟。可以嵌套，例如在暗色预览区里再套一层。

```tsx
import '@wzrhine/tokens/styles.css';
import '@wzrhine/react/styles.css';
<RhineProvider theme="light" density="comfortable" motion="user">
  <App />
</RhineProvider>
```

| 属性 | 默认 | 说明 |
| --- | --- | --- |
| `theme` | `light` | `light` / `dark` / `system` |
| `density` | `comfortable` | `comfortable` / `compact` |
| `motion` | `user` | `user` 跟随系统；`reduce` 强制减少动态效果（CSS 与 motion/react 同时生效） |
| `tooltipDelay` | `500` | 悬停打开 Tooltip 的延迟（ms），相邻触发器之间切换为即时 |

所有弹层（Dialog、AlertDialog、Drawer、Select、Tooltip、Popover、Menu、Toast）通过 `usePortalContainer()` 挂载到最近的 Provider。另有 `toastTimeout`（默认 5000ms）、`toastLimit`（同时显示的上限，默认 3）、`toasts`（嵌套 Provider 默认不再挂第二个通知队列）；通知用法见 [Popover · Menu · Toast](popover-menu-toast.md)。不放在 Provider 内时，Base UI 会挂到 `<body>`，弹层将拿不到主题 tokens。

## Tabs
```tsx
<Tabs defaultValue="overview" variant="line">
  <TabList aria-label="记录视图">
    <Tab value="overview">概览</Tab>
    <Tab value="metadata" meta="12">元数据</Tab>
  </TabList>
  <TabPanel value="overview">…</TabPanel>
</Tabs>
```
- `variant`：`line`（页面级，研究橙指示线）/ `segmented`（面板内紧凑切换）；`size`：`sm` / `md`。
- `value` / `defaultValue` / `onValueChange(value: string)`；`TabList` 必须提供 `aria-label` 或 `aria-labelledby`。
- 键盘：←/→ 移动焦点，Home/End 跳到首尾，Enter/Space 激活（手动激活）。禁用的 Tab 仍可用方向键发现（`aria-disabled`），但不能激活。这是 WAI-ARIA 推荐做法。
- Motion：指示器用 Base UI 的 `--active-tab-*` 做 CSS 过渡，时长 `--rl-motion-base`（200ms）。中途切换时从当前位置改道；减动时直接定位。
- 溢出：Tab 过多时列表横向滚动、不换行。滚动未到尾端时，末端有渐隐提示（`data-overflowing`）。

## Tooltip
```tsx
<Tooltip content="导出档案">
  <IconButton icon={<Download />} label="导出档案" />
</Tooltip>
```
- 只作视觉标签：触屏和读屏用户读不到它。触发器必须已有相同的可访问名称。重要信息请用可见文字。
- 键盘聚焦立即显示；悬停按 Provider 延迟显示；Esc 关闭。`side`：top / right / bottom / left。
- Motion：fast 120ms 淡入并轻微缩放，减动时不缩放。

## Dialog
```tsx
<Dialog
  trigger={<Button variant="secondary">归档记录…</Button>}
  eyebrow="ARCHIVE / CONFIRM" title="确认归档" description="归档后记录变为只读。"
  actions={<>
    <DialogClose><Button variant="ghost">取消</Button></DialogClose>
    <DialogClose><Button onClick={archive}>确认归档</Button></DialogClose>
  </>}
/>
```
| 属性 | 说明 |
| --- | --- |
| `trigger` | 打开弹窗的元素；不传时由 `open` 控制 |
| `title` *必填* / `description` / `eyebrow` | 标题和描述自动关联到 `aria-labelledby` / `aria-describedby` |
| `actions` / `children` | 页脚操作区与主体内容 |
| `open` / `defaultOpen` / `onOpenChange` | 受控 / 非受控 |
| `onClosed` | 退出动画结束、焦点已归还后触发 |
| `size` | `sm` 400 / `md` 520 / `lg` 720px（`--rl-dialog-width-*`） |
| `dismissOnOutsideClick` | 破坏性确认建议设为 `false` |
| `initialFocus` | 打开时聚焦的元素 ref |
| `onCloseRequest(reason)` | 用户发起关闭前调用（M9，ADR-0006 §3）。`reason` 为 `escape` / `outside` / `close-button`（`DialogClose`）/ `trigger`；返回 `false` 取消本次关闭，弹窗保持打开、焦点不动。程序设置 `open={false}` 不经过它。用法见 [AlertDialog · Dialog 关闭保护](alert-dialog.md) |

Base UI 负责焦点陷阱、Esc 关闭、页面滚动锁定、背景隔离和焦点归还。Motion：遮罩 120ms；面板 280ms 并上浮 8px；减动时只淡入淡出，不位移。快速连续开关不会残留弹窗。

## Select
```tsx
<Field label="记录类别" description="用于档案检索筛选。">
  <Select name="category" options={[{ value: 'specimen', label: '样本' }]} placeholder="选择类别" />
</Field>
```
- `options`：`{ value, label, disabled? }[]`，或分组 `{ label, options }[]`。
- `value` / `defaultValue` / `onValueChange(value | null)`；`name` 让值随原生表单提交。
- 支持 `required` / `disabled` / `readOnly` / `invalid` / `size`。放在 Field 内时，标签、说明、错误和校验状态都由 Field 提供。
- 键盘：↓/Enter/Space 打开，方向键与首字母定位，Enter 选择，Esc 取消且不改值，关闭后焦点回到触发器。
- Motion：弹层 fast 120ms 淡入并下移 4px，减动时只淡入。弹层会避开视口边缘。

## 测试
- 单测：`packages/react/test/overlays.test.tsx`（17 项）；Dialog `onCloseRequest` 在 `alert-dialog.test.tsx` 与类型测试 `alert-dialog.test-d.tsx`。
- 浏览器：`apps/docs/e2e/overlays.spec.ts`（Dialog 9 项、Select 5 项、Tabs 4 项、Tooltip 3 项）。
- 响应式与 axe：已纳入全站 `responsive.spec.ts` 与 `a11y.spec.ts`。
