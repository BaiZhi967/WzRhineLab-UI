# AlertDialog · Dialog 关闭保护

- 状态：**Beta（M9）** · 契约：[ADR-0006](../development/adr/0006-overlays-feedback-contracts.md) §2、§3
- 底座：Base UI 1.9.0 `alert-dialog`（`role="alertdialog"`、强制模态、禁止外部点击关闭）
- 源码：`packages/react/src/components/AlertDialog.tsx`、`Dialog.tsx`（`onCloseRequest`），样式复用 `overlays.css` 的 `.rl-dialog`，增量在 `drawer.css` 的 AlertDialog 段 · Showcase：`#/components/alert-dialog`

## 用途 / 非用途
| 用于 | 不用于 |
| --- | --- |
| 删除、重置、放弃更改等破坏性或不可撤销操作的确认 | 普通信息、表单、多步流程（用 `Dialog`） |
| 异步操作的确认（等待结果、失败可重试） | 操作结果通知（用 Toast / Alert） |

## API
```tsx
<AlertDialog
  trigger={<Button variant="ghost">删除记录…</Button>}
  eyebrow="ARCHIVE / DELETE"
  title="删除 REC-0101？"
  description="删除后无法恢复。"
  confirmLabel="删除记录"
  onConfirm={() => api.remove(id)}   // 返回 Promise 时等待结果
/>

// 受控：从菜单项打开
<MenuItem tone="danger" onSelect={() => setTarget(id)}>删除…</MenuItem>
<AlertDialog open={target !== null} onOpenChange={(o) => !o && setTarget(null)} … />
```

| 属性 | 默认 | 说明 |
| --- | --- | --- |
| `title` | *必填* | 可访问名称（`aria-labelledby`） |
| `description` | *必填* | 后果说明（`aria-describedby`）；类型上不可省略 |
| `confirmLabel` | *必填* | 用动作命名（「删除记录」），不要用「确定」 |
| `onConfirm` | *必填* | `() => void \| Promise<unknown>` |
| `cancelLabel` | `取消` | |
| `tone` | `danger` | `danger`：确认按钮危险色填充、面板顶线危险色；`default`：普通主按钮 |
| `errorText` | `操作未完成，请重试。` | Promise 失败时在弹窗内以 `role="alert"` 显示 |
| `eyebrow` | — | 标题上方的档案标签 |
| `children` | — | 后果补充，例如受影响的记录列表 |
| `trigger` | — | 打开弹窗的元素；不传时用 `open` 控制 |
| `open` / `defaultOpen` / `onOpenChange` | — / `false` / — | `onOpenChange(open: boolean)` |
| `onClosed` | — | 退出动画结束、焦点归还后触发 |
| `className` | — | |

`aria-label` / `aria-labelledby` 在类型上禁止：名称只来自 `title`。

## 异步确认
- `onConfirm` 返回 Promise 时：确认按钮进入 `loading`（`aria-busy`，保持焦点），取消按钮禁用，Esc 被忽略，防止「看似取消、实际已提交」。
- resolve → 关闭；reject（或同步抛错）→ 保持打开，显示 `errorText`，焦点回到确认按钮，可重试或取消。
- 每次重新打开都会清除上一次的错误。Promise 在弹窗关闭、重新打开或组件卸载后才完成时被忽略：不会再关闭新的一次打开，也不会在卸载后更新状态。

## Dialog 关闭保护
```tsx
<Dialog
  title="编辑样本备注"
  onCloseRequest={(reason) => {
    if (!dirty) return;            // 放行
    setConfirmDiscard(true);       // 打开嵌套的 AlertDialog
    return false;                  // 取消本次关闭
  }}
>
  …
  <AlertDialog open={confirmDiscard} onOpenChange={setConfirmDiscard}
    title="放弃未保存的更改？" description="输入的备注将丢失。"
    cancelLabel="继续编辑" confirmLabel="放弃" onConfirm={() => { reset(); setOpen(false); }} />
</Dialog>
```
- `reason`：`escape` / `outside`（点击遮罩）/ `close-button`（`DialogClose`）/ `trigger`。返回 `false` 时取消关闭，对话框保持打开，焦点不动。
- 只拦截用户发起的关闭；受控 `open={false}` 不经过 `onCloseRequest`。
- 嵌套的 AlertDialog 放在 Dialog 内部（React 树内嵌套），Base UI 才会把 Esc 只交给最上层。

## 可访问性与键盘
- `role="alertdialog"`，名称与描述来自标题和描述。
- **初始焦点在取消按钮上**；按钮顺序取消在前、确认在后。
- Tab / Shift+Tab 在弹窗内循环；背景 inert、页面滚动锁定。
- Esc = 取消；点击遮罩**不**关闭。
- 关闭后焦点回到触发器；受控用法（从菜单打开）回到打开前的焦点元素（菜单按钮）。
- 嵌套打开时父 Dialog 仍在 DOM 中，但离开无障碍树，读屏只读到上层的 alertdialog。
- forced-colors：危险确认按钮 `ButtonText` 边框，错误消息 `CanvasText` 边线。
- 对比度：确认按钮 `--rl-fg-on-danger` / `--rl-danger`（manifest 已登记的对比对）；错误文字 `--rl-danger` / `--rl-bg-surface`。

## 动效
与 Dialog 相同，motion/react：遮罩 `fast` 淡入；面板 `panel` + 8px 上移。减动（系统设置或 `RhineProvider motion="reduce"`）时只淡入淡出、无位移，过渡即时完成。快速连续开关不残留弹窗，也不排队播放。

## 验证
单测 `packages/react/test/alert-dialog.test.tsx`、类型测试 `alert-dialog.test-d.tsx`；E2E `apps/docs/e2e/alert-dialog.spec.ts`（Chromium / Firefox / WebKit），场景用法见 `archive.spec.ts`「重置」「放弃更改」与 archive-desk 的删除确认。
