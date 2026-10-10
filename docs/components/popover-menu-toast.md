# Popover · Menu · Toast

- 状态：**Beta（M2-B）** · 底座：Base UI 1.9.0（ADR-0001，2026-10-10 升级）
- 源码：`packages/react/src/components/{Popover,Menu,Toast}.tsx`、`feedback.css`
- Showcase：`#/components/popover`、`/menu`、`/toast`

## Popover
非模态浮层，可放交互内容（筛选、行内编辑、预览）。触屏和读屏用户都能访问，这是它与 Tooltip 的区别。

```tsx
<Popover
  trigger={<Button variant="secondary">筛选…</Button>}
  title="筛选条件" description="仅影响当前列表。" arrow
  actions={<PopoverClose><Button size="sm">完成</Button></PopoverClose>}
>
  <Field label="编号前缀"><Input /></Field>
</Popover>
```

| 属性 | 说明 |
| --- | --- |
| `trigger` *必填* | 打开浮层的元素，需自带可访问名称 |
| `title` / `description` | 浮层的名称和描述；没有标题时用 `aria-label` |
| `children` / `actions` | 内容与页脚；只用于关闭的按钮包在 `PopoverClose` 里 |
| `side` / `align` | 方向：top / right / bottom / left；对齐：start / center / end |
| `size` | `sm` 240 / `md` 320 / `lg` 420px |
| `arrow` | 显示指向触发器的箭头 |
| `openOnHover` | 悬停也会打开，点击和键盘仍可用 |
| `open` / `defaultOpen` / `onOpenChange` / `initialFocus` | 受控 / 非受控；打开时聚焦的元素 |

- 键盘：Enter / Space 打开，焦点移入浮层；Tab 可移出（非模态）；Esc 关闭并把焦点还给触发器；点击外部关闭。
- Motion：fast 120ms 淡入并轻微缩放；减动时只淡入。

## Menu
对象上的命令列表。选值用 Select，切换视图用 Tabs。

```tsx
<Menu trigger={<IconButton icon={<More />} label="REC-0101 的操作" />} align="end">
  <MenuGroup label="操作">
    <MenuItem icon={<Download />} shortcut="Ctrl E" onSelect={exportRecord}>导出</MenuItem>
    <MenuItem tone="danger" onSelect={() => setConfirm(id)}>归档…</MenuItem>
  </MenuGroup>
  <MenuSeparator />
  <MenuCheckboxItem checked={compact} onCheckedChange={setCompact}>紧凑显示</MenuCheckboxItem>
  <MenuRadioGroup label="排序" value={sort} onValueChange={setSort}>
    <MenuRadioItem value="recent">最近更新</MenuRadioItem>
  </MenuRadioGroup>
</Menu>
```

- `MenuItem`：`onSelect`、`icon`、`shortcut`（仅视觉提示，需自行绑定快捷键）、`tone="danger"`、`disabled`、`keepOpen`。
- `MenuCheckboxItem` / `MenuRadioGroup` + `MenuRadioItem`：选择后菜单保持打开，便于连续调整。
- 键盘：↓ / Enter / Space 打开并聚焦第一项；方向键、首字母、Home / End 导航；Enter 执行并关闭，焦点回到触发器；Esc 关闭且不执行。
- 禁用项可被方向键发现（`aria-disabled`），但不能执行，符合 WAI-ARIA。
- 危险操作应先弹确认 Dialog，再用 Toast 告知结果（见 Showcase「Row actions」）。

## Toast
`RhineProvider` 默认挂载唯一的通知视口（嵌套的 Provider 共用外层队列），在组件中调用 `useToast()` 即可。

```tsx
const toast = useToast();
const id = toast.show({ title: '正在同步…', status: 'info', timeout: 0 });
toast.update(id, { title: '同步完成', status: 'success', timeout: 4000 });
toast.show({ title: '同步失败', status: 'danger', priority: 'high', timeout: 0,
             action: { label: '重试', onClick: retry } });

// 重复操作不堆叠：同一 id 原地更新并重新计时
toast.show({ id: 'copy-id', title: '已复制编号 ARC-1024', status: 'success' });

// 撤销：点击后先执行 onClick，再关闭通知；页面上仍需有结果和等效的恢复入口
toast.show({ title: '已删除 ARC-0007', status: 'warning', action: { label: '撤销', onClick: () => restore('ARC-0007') } });

// 一条通知跟随 Promise：处理中 → 成功 / 失败
await toast.promise(exportRecords(), {
  loading: '正在导出…',
  success: (n) => ({ title: '导出完成', description: `${n} 条记录` }),
  error: (e) => ({ title: '导出失败', description: String(e), action: { label: '重试', onClick: retry } }),
});
```

| 选项 | 说明 |
| --- | --- |
| `title` *必填* / `description` | 一句话说明结果，最好带上具体对象（如编号） |
| `status` | neutral / info / success / warning / danger，表现为左侧状态条和图标 |
| `id` | 同一 `id` 的通知仍在显示时，`show` 原地更新内容并重置计时（Base UI 去重），用于「已复制」这类重复操作 |
| `timeout` | 毫秒；`0` 表示不自动消失，用于需要处理的错误。默认值由 `RhineProvider toastTimeout` 设置（5000）；带 `action` 且未指定时为 `max(toastTimeout, 10000)`（`toastTimeout` 为 0 时保持 0） |
| `priority` | `high` 由读屏立即播报（`role=alert`），只用于失败或紧急事项 |
| `action` | 单个后续操作 `{ label, onClick, keepOpen? }`，如撤销、重试。点击后执行 `onClick` 并**关闭该通知**；`keepOpen: true` 保留 |

| 方法 | 说明 |
| --- | --- |
| `show(options)` | 显示通知，返回 id（传入 `id` 时返回该 id） |
| `update(id, options)` | 原地替换已有通知的部分内容；未传的字段保持不变 |
| `dismiss(id?)` | 关闭指定通知；不传则全部关闭 |
| `promise(p, { loading, success, error })` | 一条通知从「处理中」（不自动消失，显示 Spinner，status 默认 `info`）更新为成功（默认 `success`）或失败（默认 `danger`、`priority: 'high'`、`timeout: 0`）。每个阶段可为字符串（作为标题）、`ToastOptions`，或 success / error 的函数 `(结果) => 字符串 | ToastOptions`；调用方传的字段覆盖默认值。返回与输入同结果的 Promise（输入 reject 时它也 reject） |

- **行为变化（M9）**：过去点击操作后通知仍停留，现在默认关闭。需要旧行为传 `action.keepOpen: true`。
- 可撤销操作不能只靠通知撤销：通知会消失，读屏用户和键盘用户也可能来不及到达。页面上必须仍能看到结果，并提供等效的恢复入口（见 Showcase「Undo action」）。
- 同一结果已经用页面内的 Alert（live）宣告时，不再弹 Toast，避免重复播报。

- 可访问性：视口是 polite 实时区域，F6 可跳入。关闭按钮名称为「关闭通知」；Base UI 在通知堆叠收起、且焦点不在其中时，对辅助技术隐藏关闭按钮。
- 交互：悬停或聚焦时暂停计时并展开堆叠；触屏可向右或向下滑动关闭；最多同时显示 `toastLimit`（3）条。
- Motion：panel 280ms 自下滑入，减动时只淡入。视口宽度随屏幕自适应，不使用断点。

## 测试
- 单测：`packages/react/test/feedback.test.tsx`（Popover 5、Menu 5、Toast 6）；`toast-m9.test.tsx`（去重 2、操作 5、promise 3）。
- 浏览器：`apps/docs/e2e/feedback.spec.ts`（Popover 8、Menu 6、Toast 5），包括打开浮层时页面不滚动、390px 和 320px 视口、明暗主题 axe；`feedback-m9.spec.ts` 的 Toast 部分（去重、撤销恢复、操作 10 秒下限、promise 成功 / 失败、明暗 axe）。
