# Accordion · Slider · NumberField · ContextMenu

- 状态：**Beta（M12）** · 底座：Base UI Accordion / Slider / NumberField + Field / ContextMenu（ADR-0001、ADR-0010 §2）
- 源码：`packages/react/src/components/{Accordion,Slider,NumberField,ContextMenu}.tsx`，样式 `advanced.css`（ContextMenu 复用 `feedback.css` 的 `rl-menu`）· Showcase：`#/components/advanced`

## 用途 / 非用途
| 组件 | 用于 | 不用于 |
| --- | --- | --- |
| `Accordion` | 一组同级分区的展开 / 收起（设置分组、侧栏分区、规程章节） | 单个可折叠区域（用 `Collapsible`）；切换视图（用 `Tabs`）；导航菜单 |
| `Slider` | 在有界范围内选择数值或离散档位（执行强度、阈值、区间） | 需要精确输入的数值（用 `NumberField`）；超过约 10 个无序选项（用 `Select`）；只读读数（用 `Meter`） |
| `NumberField` | 有步进语义的数值参数（并发上限、重试次数、预算） | 编号、电话、邮编等「数字形状的文本」（用 `Input`）；粗略比例（考虑 `Slider`） |
| `ContextMenu` | 对一个对象（会话行、档案卡片）的快捷命令 | 唯一入口：每条命令必须在可见按钮 / `Menu` 中也能找到；页面级导航 |

## API
```tsx
<Accordion items={[{ value: 'scope', title: '适用范围', content: '…', meta: '01' }]} defaultValue={['scope']} />
<Accordion multiple headingLevel={2} value={open} onValueChange={setOpen}>
  <AccordionItem value="a" title="采样设置" meta="3 项">…</AccordionItem>
</Accordion>

<Slider label="执行强度" min={0} max={4} marks={[{ value: 0, label: '关闭' }, …]} value={effort} onValueChange={setEffort} showValue name="effort" />
<Slider label="温度区间" defaultValue={[18, 26]} thumbLabels={['温度下限', '温度上限']} formatValue={(v) => `${v} ℃`} />

<NumberField label="并发上限" description="1–8 个任务。" min={1} max={8} value={n} onValueChange={setN} unit="个" name="concurrency" />

<ContextMenu trigger={<div aria-label="档案行 REC-0142">…</div>}>
  <MenuItem onSelect={copy}>复制编号</MenuItem>
  <MenuCheckboxItem checked={pinned} onCheckedChange={setPinned}>固定到顶部</MenuCheckboxItem>
  <MenuSeparator />
  <MenuItem tone="danger">归档…</MenuItem>
</ContextMenu>
```

| 组件 | 关键属性 |
| --- | --- |
| `Accordion` | `items`（数据形式）或 `children`（`AccordionItem` 组合）、`multiple`、`value` / `defaultValue` / `onValueChange(string[])`、`headingLevel`（2–6，默认 3）、`disabled`、`keepMounted`、`hiddenUntilFound` |
| `AccordionItem` | `value` *必填*、`title` *必填*、`meta`（行尾等宽文字，属于按钮名称）、`disabled`、`headingLevel`（覆盖父级）、`onOpenChange` |
| `Slider` | `label` *必填*（`aria-label` / `aria-labelledby` 类型上禁止）、`hideLabel`、`description`、`value` / `defaultValue`（数字或数组）、`onValueChange` / `onValueCommitted`、`min` / `max` / `step` / `largeStep`、`minStepsBetweenValues`、`marks`、`format`（Intl）、`formatValue`、`getAriaValueText`、`thumbLabels`、`showValue`、`name`、`disabled` |
| `NumberField` | `label` *必填*、`hideLabel`、`description`、`error` + `invalid`、`required` / `optional`、`value`（`number \| null`）/ `defaultValue` / `onValueChange` / `onValueCommitted`、`min` / `max` / `step` / `largeStep` / `smallStep`、`format`（Intl）、`snapOnStep`、`size`（`sm` / `md` / `lg`，与 Input 同高）、`unit`、`placeholder`、`name`、`disabled`、`readOnly`、`inputRef` |
| `ContextMenu` | `trigger` *必填*（单个元素）、`children`（Menu 部件）、`open` / `defaultOpen` / `onOpenChange`、`disabled`（保留浏览器原生菜单）、`className`（弹层） |

API 选择：ContextMenu 采用与 `Menu` 一致的 `trigger` + `children`，而不是 `content` 属性，这样 `MenuItem`、`MenuCheckboxItem`、`MenuRadioGroup`、`MenuGroup`、`MenuSeparator` 可以原样复用（Base UI ContextMenu 的弹层与条目就是 Menu 的部件，已在单测与 E2E 中验证）。同一组条目可以同时放进 `ContextMenu` 和可见的 `Menu` 按钮。

## 受控行为
- Accordion：`value: string[]`；单选模式下数组最多一项。受控时只有父组件更新才会改变展开状态。
- Slider：值的形状决定回调形状。`defaultValue={2}` → `onValueChange(number)`；`defaultValue={[1, 2]}` → `onValueChange(number[])`（返回副本，可直接存入 state）。`onValueCommitted` 在松开指针或按键后触发一次。
- NumberField：`value: number | null`，`null` 表示空。输入可解析的文字即回调数字，清空回调 `null`；失焦时按 `format` 重新格式化并在 `min` / `max` 内夹取。
- ContextMenu：`open` / `onOpenChange` 与 Menu 相同。

## 表单提交
- Slider：每个滑块是原生 `<input type="range">`（视觉隐藏），按 `name` 提交数值；区间滑块每个滑块各提交一次。
- NumberField：隐藏的原生 number 输入按 `name` 提交**原始数值**（例如 `1234.5`），与显示格式（`€1,234.50`、`25%`）无关。
- 二者都可放在 `Form` 中；`NumberField` 带 `name` 时显示 `<Form errors>` 中的服务端错误（与 `Field` 共用错误部件）。

## 可访问性
- Accordion：每个标题是真实的 `h2`–`h6`（默认 `h3`，按页面大纲选择），内含 `<button aria-expanded aria-controls>`；面板为 `role="region"`，由按钮命名。关闭的面板默认卸载，不留在可访问树中。`meta` 与标题之间插入空格，读作「采样方法 3 项」。
- Slider：根节点 `role="group"`，由可见标签命名；每个滑块的 range input 通过 `aria-labelledby` 指向同一标签，区间滑块用 `thumbLabels` 给出不同名称。刻度标签 `aria-hidden`，避免重复朗读；落在刻度上时刻度标签就是 `aria-valuetext`（「中」而不是「2」）。`description` 通过 `aria-describedby` 关联到滑块。
- NumberField：标签、描述、错误由 Base UI Field 关联（`aria-labelledby` / `aria-describedby` / `aria-invalid`）；`unit` 作为描述朗读。`aria-roledescription` 默认是英文「Number field」，这里改为文案表 `numberField.roleDescription`（zhCN「数字输入框」）。步进按钮 `tabIndex=-1`（键盘用方向键即可），但没有 `aria-hidden`，触屏读屏仍可操作；名称来自 `numberField.increment` / `decrement`。到达边界或只读时按钮为 `aria-disabled`。
- ContextMenu：触发区域默认 `tabIndex=0`（可传自己的 `tabIndex` 覆盖），聚焦后可用键盘打开。给触发区域一个名称（`aria-label` 或可见文字）以及说明「右键或 Shift+F10」的 `aria-describedby`。弹层使用 Menu 语义，打开期间外部内容对辅助技术隐藏（Base UI 行为）。
- 焦点环：2px `--rl-focus`；Accordion 按钮的焦点环向内偏移，避免被分隔线裁切；Slider 的焦点环画在滑块上（`:has(:focus-visible)`）。
- 对比：只使用已有对比组合——`fg-primary` / `fg-muted` 在 `bg-surface`、`border-strong` 在 `bg-surface`（滑轨边框、刻度，3:1 非文本）、`bg-inverse` 填充（指示条）、`danger` 边界。没有新增 token 或对比组合。

## 键盘
| 组件 | 键 | 行为 |
| --- | --- | --- |
| Accordion | Tab / Shift+Tab | 在标题按钮间移动，跳过禁用项 |
| | Enter / Space | 展开 / 收起 |
| | ↑ / ↓ / Home / End | **无**：Base UI 1.9 按[新版 APG](https://github.com/w3c/aria-practices/pull/3434)移除了标题间的方向键漫游 |
| Slider | ← / ↓、→ / ↑ | 减 / 增一个 `step` |
| | Shift + 方向键、PageUp / PageDown | 一个 `largeStep`（默认 10） |
| | Home / End | 最小 / 最大值 |
| NumberField | ↑ / ↓ | 增 / 减一个 `step`，夹取在 `min` / `max` |
| | Shift / Alt + 方向键 | `largeStep` / `smallStep` |
| | Home / End | 跳到 `min` / `max`（已设置时） |
| ContextMenu | Shift+F10、ContextMenu 键 | 在聚焦的触发区域上打开（浏览器在焦点元素上派发 `contextmenu`） |
| | 右键 / 触屏长按 500ms | 在指针位置打开 |
| | ↑ / ↓ / Home / End / 字母 | 菜单内移动、typeahead（同 Menu） |
| | Esc / 外部点击 | 关闭，焦点回到触发区域 |

## 状态矩阵
- Accordion：default · hover（`bg-hover`）· focus-visible · open（箭头旋转 180°）· disabled（`fg-disabled`，不可聚焦）· 长中文标题（换行，箭头留在行尾）· multiple · compact。
- Slider：default · focus-visible（滑块焦点环）· dragging（滑块 `bg-pressed`）· disabled（滑轨 / 滑块灰化，不响应键盘）· marks（首尾标签向内对齐，320px 不溢出）· range · compact。
- NumberField：default · hover · focus-within（与 Input 相同焦点环）· invalid（红边框 + 图标与文字错误）· readOnly（`bg-readonly`，可聚焦，按钮不可用）· disabled · 边界（对应按钮禁用）· `sm` / `md` / `lg` · 格式化值（货币、百分比）· compact。
- ContextMenu：关闭 · 打开（触发区域 `data-popup-open` 时 `bg-hover`）· 条目 highlighted / danger / disabled / checked（同 Menu）。

## Motion 与减动
- Accordion 面板：`height` + `opacity` 过渡 `--rl-motion-base`（200ms），高度来自 Base UI 的 `--accordion-panel-height`；中途再次切换从当前高度反向，不排队。箭头 `rotate` `--rl-motion-fast`。高度动画只在 Collapsible / Accordion 中使用（ADR-0007 的唯一例外，与 `disclosure.css` 一致）。
- Slider：没有位置过渡；拖动时由 Base UI 直接写入位置，滑块只有颜色过渡（`--rl-motion-fast`）。
- NumberField：仅颜色过渡（`--rl-motion-fast`）。
- ContextMenu：与 Menu 相同的 `opacity` + `translate` `--rl-motion-fast`。
- 减动（系统设置或 `RhineProvider motion="reduce"`）：时长 token 归零；Accordion 面板与箭头另设 `transition: none`（E2E 断言 `transition-duration` 为 0）；ContextMenu 沿用 Menu 的减动规则（不位移）。没有 `@keyframes`。

## 主题、密度与高对比
颜色全部来自语义 token，明暗主题自动适配（两种主题 axe 均通过）。紧凑密度下 Accordion 按钮、Slider 命中区、NumberField 跟随 `--rl-control-height-*` 缩小。forced-colors：分隔线 / 滑轨 `CanvasText`，指示条 `Highlight`，滑块 `ButtonText` 边框，禁用 `GrayText`，焦点环 `Highlight`。

## 已知限制
- Accordion 没有方向键漫游（见上表）；如需要，应先在 ADR 中说明理由，再在 Base UI 之上补充。
- Slider 只支持水平方向；`marks` 只在 `label` 为字符串（或给出 `valueText`）时才成为朗读值。
- NumberField 没有拖动调值区域（ScrubArea），也没有滚轮调值（`allowWheelScrub` 未暴露）。
- ContextMenu 的触屏长按只在 Base UI 源码层面确认，尚未在真机上验证；Shift+F10 仅在 Chromium E2E 中验证。

## 测试
- 单测：`packages/react/test/m12-advanced.test.tsx`（26 项：标题层级、aria-expanded / controls、单选 / 多选、受控、Enter / Space / Tab 跳过禁用；Slider 名称、方向键 / PageUp / Home / End、刻度朗读值、locale 格式、区间、受控、FormData、禁用、描述；NumberField 标签 / 描述 / 错误、步进按钮名称与夹取、方向键 / Home / End、Intl 格式与原始值提交、`null`、禁用 / 只读、单位、enUS 与覆盖；ContextMenu 打开、条目、Esc 焦点归还、受控、`tabIndex`、disabled 不拦截原生菜单）。
- 类型测试：`packages/react/test/m12-advanced.test-d.tsx`（5 项）。
- E2E：`apps/docs/e2e/advanced.spec.ts`（10 项，Chromium）：Accordion 键盘、Slider 方向键、NumberField 按钮与 ArrowUp 夹取、ContextMenu Shift+F10 / 右键 / Esc 焦点归还、减动、320px 无横向溢出、明 / 暗 / 菜单打开时 axe。Firefox / WebKit、视觉基线、屏幕阅读器抽检尚未做。

## 变更记录
- 0.0.0 · 2026-10-10：首次加入（M12）。文案表新增 `numberField` 命名空间（`decrement` / `increment` / `roleDescription`）。
