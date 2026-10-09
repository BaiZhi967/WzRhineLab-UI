# Popover · Menu · Toast

- 状态：**Beta（M2-B）** · 底座：Base UI 1.8.0（ADR-0001）
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
```

| 选项 | 说明 |
| --- | --- |
| `title` *必填* / `description` | 一句话说明结果，最好带上具体对象（如编号） |
| `status` | neutral / info / success / warning / danger，表现为左侧状态条和图标 |
| `timeout` | 毫秒；`0` 表示不自动消失，用于需要处理的错误。默认值由 `RhineProvider toastTimeout` 设置（5000） |
| `priority` | `high` 由读屏立即播报（`role=alert`），只用于失败或紧急事项 |
| `action` | 单个后续操作，如撤销、重试 |

- 可访问性：视口是 polite 实时区域，F6 可跳入。关闭按钮名称为「关闭通知」；Base UI 在通知堆叠收起、且焦点不在其中时，对辅助技术隐藏关闭按钮。
- 交互：悬停或聚焦时暂停计时并展开堆叠；触屏可向右或向下滑动关闭；最多同时显示 `toastLimit`（3）条。
- Motion：panel 280ms 自下滑入，减动时只淡入。视口宽度随屏幕自适应，不使用断点。

## 测试
- 单测：`packages/react/test/feedback.test.tsx`（Popover 5、Menu 5、Toast 6）。
- 浏览器：`apps/docs/e2e/feedback.spec.ts`（Popover 8、Menu 6、Toast 5），包括打开浮层时页面不滚动、390px 和 320px 视口、明暗主题 axe。
