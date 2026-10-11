# Combobox · CommandPalette · FileDropZone

- 状态：**Beta（M12）** · 底座：Base UI Combobox + Field / Dialog + Autocomplete（1.9.0，ADR-0001、ADR-0010 §2）；FileDropZone 为原生 `<input type="file">` + drop 事件
- 源码：`packages/react/src/components/{Combobox,CommandPalette,FileDropZone}.tsx`，样式 `command.css`（CommandPalette 复用 `rl-dialog__backdrop`）· Showcase：`#/components/command`

## 用途 / 非用途
| 组件 | 用于 | 不用于 |
| --- | --- | --- |
| `Combobox` | 选项较多、需要输入关键字筛选的单选（档案类别、模型、文件路径）；服务端检索 | 少于约 8 项且无需搜索（用 `Select`）；多选或标签输入（未实现）；自由文本输入（用 `Input`） |
| `CommandPalette` | 全局命令搜索与执行（`Ctrl/⌘ K`） | 唯一入口：每条命令都应在可见界面中也能找到；表单内的值选择（用 `Combobox`）；导航菜单 |
| `FileDropZone` | 选择或拖入附件，并在客户端按类型 / 大小 / 数量预校验 | 上传本身（组件不发请求）；文件列表管理（调用方自行渲染）；文件夹选择 |

## API
```tsx
<Combobox label="档案类别" description="输入关键字筛选" items={categories} value={v} onValueChange={setV} name="category" />
<Combobox label="远程检索" items={results} filter={null} loading={loading} inputValue={q} onInputValueChange={search} />

<CommandPalette hotkey="mod+k" commands={commands} onSelect={(c) => run(c.id)} trigger={<Button>打开命令面板</Button>} />

<FileDropZone label="样本图像" accept="image/*" multiple maxFiles={3} maxSize={1024 * 1024} onFiles={add} onReject={showRejected} />
```

### Combobox
`ComboboxOption`：`value: string`（提交值与键）、`label: string`（显示文本、选中后输入框内容、默认过滤依据）、`description?: ReactNode`、`disabled?`、`group?: string`。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `label` *必填* | `ReactNode` | — | 可见标签，也是输入框名称 |
| `items` *必填* | `readonly ComboboxOption[]` | — | 带 `group` 时按首次出现顺序分组；无 `group` 的项组成一个无标题组 |
| `description` / `error` | `ReactNode` | — | 由内置 `Field` 关联；`error` 在原生校验失败或 `invalid` 时显示 |
| `value` / `defaultValue` / `onValueChange` | `string \| null` | — | 选中值；清除后回调 `null` |
| `inputValue` / `defaultInputValue` / `onInputValueChange` | `string` | — | 输入框文本，异步检索时受控 |
| `open` / `onOpenChange` | `boolean` | — | 列表展开状态 |
| `filter` | `(option, query) => boolean \| null` | Base UI 默认包含匹配（`label`，使用 Provider locale） | `null` 关闭过滤，原样显示 `items` |
| `loading` / `loadingText` | `boolean` / `ReactNode` | `false` / `combobox.loading` | 显示 Spinner 状态行，弹层 `aria-busy`，期间不显示空状态 |
| `emptyText` | `ReactNode` | `combobox.empty` | 无匹配时显示 |
| `clearable` / `clearLabel` | `boolean` / `string` | `true` / `combobox.clear` | 有选中值且非只读时显示清除按钮 |
| `openLabel` | `string` | `combobox.openList` | 展开按钮名称 |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | 与 Input 同高 |
| `name` / `required` / `disabled` / `readOnly` / `invalid` | — | — | `name` 提交选中项的 `value` |
| `placeholder` / `id` / `className` / `style` | — | — | `id` 给输入框；`className` / `style` 给外层 Field |

`ref` 转发到 `<input>`。组件记住出现过的每个选项的 `label`，异步结果变化后已选值仍显示原标签。

### CommandPalette
`CommandItem`：`id: string`、`label: string`、`description?`、`group?`（按首次出现顺序分组）、`shortcut?`（仅视觉提示，如 `Ctrl N`，`aria-hidden`，快捷键需自行绑定）、`keywords?: readonly string[]`（同义词、英文名）、`disabled?`、`disabledReason?`（仅在禁用时显示）。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `commands` *必填* | `readonly CommandItem[]` | — | 命令列表 |
| `onSelect` *必填* | `(command) => boolean \| void` | — | 执行命令；返回 `false` 时面板保持打开 |
| `open` / `defaultOpen` / `onOpenChange` | `boolean` | `defaultOpen=false` | 打开状态 |
| `trigger` | `ReactElement` | — | 打开面板的元素（通常是 `Button`），经 `Dialog.Trigger render` 渲染 |
| `hotkey` | `string` | — | 全局切换快捷键，如 `mod+k`；`mod` 在 Apple 平台为 ⌘，其他平台为 Ctrl；可组合 `ctrl` / `meta`（`cmd`）/ `alt`（`option`）/ `shift` |
| `title` | `string` | `commandPalette.title` | 对话框名称（视觉隐藏） |
| `placeholder` | `string` | `commandPalette.placeholder` | 搜索框占位 |
| `emptyText` | `ReactNode` | `commandPalette.empty` | 无匹配时显示 |
| `hint` | `ReactNode \| null` | `commandPalette.hint` | 底部键盘提示，同时是输入框的描述；`null` 隐藏 |
| `filter` | `(command, query) => boolean` | 见下 | 自定义匹配；`query` 已去除首尾空白 |
| `className` | `string` | — | 加在面板（`rl-command`）上 |

默认匹配：查询按空白拆词，每个词（不区分大小写，`toLocaleLowerCase`）都要出现在 `label`、`description`、`group`、`keywords` 拼接的文本中。标签中匹配到的片段渲染为 `<mark class="rl-command__mark">`（只高亮 `label`，不高亮描述与关键词）。辅助导出 `matchHotkey(hotkey, event, apple?)` 用于判断键盘事件是否匹配。

### FileDropZone
| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `label` *必填* | `ReactNode` | — | 区域上方的可见标签，与「选择文件」一起组成输入框名称 |
| `description` | `ReactNode` | — | 关联为输入框描述 |
| `accept` | `string` | — | 与原生属性同语法：扩展名（`.png`）、精确 MIME（`application/pdf`）、通配（`image/*`），逗号分隔 |
| `multiple` | `boolean` | `false` | 原生多选 |
| `maxSize` | `number`（字节） | — | 单个文件上限 |
| `maxFiles` | `number` | 未设 `multiple` 时为 1，否则不限 | 单次选择 / 拖放最多接收的数量 |
| `onFiles` | `(files: File[]) => void` | — | 本次被接收的文件；全部被拒时不调用 |
| `onReject` | `(rejections: FileRejection[]) => void` | — | `{ file, reason: 'type' \| 'size' \| 'count' }`，每个文件只记第一条失败规则（类型 → 大小 → 数量） |
| `children` | `ReactNode` | `fileDropZone.prompt` | 替换区域内提示文字（不替换按钮） |
| `browseLabel` | `ReactNode` | `fileDropZone.browse` | 「选择文件」按钮文字 |
| `formatSize` | `(bytes) => string` | B / KB / MB，数字按 Provider locale 格式化 | 拒绝消息中 `maxSize` 的写法 |
| `invalid` / `error` | `boolean` / `ReactNode` | `false` | `invalid` 时在区域下方显示 `error`，并关联为描述 |
| `disabled` | `boolean` | `false` | 禁用输入框，忽略拖放 |
| `name` / `id` / `className` / `style` | — | — | `name`、`id` 给原生输入框 |

`ref` 转发到原生 `<input type="file">`。辅助导出 `matchesAccept(file, accept)` 与 `validateFiles(files, { accept, maxSize, maxFiles })`，与组件内部校验同一实现。

## 受控行为
- Combobox：`value: string | null`，清除按钮或 Esc（列表已关闭时）把值设为 `null`。`inputValue` 与 `value` 相互独立；选中后输入框显示该项 `label`。服务端检索：`filter={null}`，在 `onInputValueChange` 中发请求并更新 `items`，请求期间设 `loading`（Showcase 用清除旧定时器的方式保证最新查询生效，组件本身不做防抖或竞态处理）。
- CommandPalette：`open` / `onOpenChange` 与 Dialog 相同。每次打开时查询重置为空；执行命令后（`onSelect` 未返回 `false`）调用 `onOpenChange(false)`。选中条目不会把条目文字写回输入框，保留用户输入。
- FileDropZone：无受控值。每次选择后清空原生输入框（以便再次选择同一文件），文件列表由调用方通过 `onFiles` 保存。

## 表单提交
- Combobox：Base UI 的隐藏输入按 `name` 提交选中项的 `value`；清除后提交空字符串（单测断言 `FormData`）。
- FileDropZone：原生输入框带 `name`，但每次选择后即被清空，**提交时不包含文件**；需在 `onFiles` 中自行保存并上传。

## 可访问性
- Combobox：输入框 `role="combobox"`，名称来自 `label`，描述 / 错误由 `Field` 关联，`invalid` 时 `aria-invalid="true"`；列表 `role="listbox"`，高亮项经 `aria-activedescendant` 指向，焦点始终留在输入框。分组为 `role="group"`，由组标题命名；禁用项保留在列表中并带 `aria-disabled`。展开按钮默认由 Base UI 用字段标签命名，这里改为 `aria-labelledby` 指向视觉隐藏的「展开选项」；清除按钮 `aria-label`「清除选择」。状态行（`Combobox.Status`）是常驻的礼貌 live region，`loading` 时朗读「正在搜索…」，同时弹层 `aria-busy="true"`。列表展开期间 Base UI 会对页面其余部分设 `aria-hidden`（可输入的非模态 combobox 行为）。
- CommandPalette：Base UI Dialog 提供模态、焦点陷阱、滚动锁定与焦点归还（回到打开前聚焦的元素，不一定是 `trigger`）。对话框由视觉隐藏的 `Dialog.Title` 命名（「命令面板」）；打开后焦点进入搜索框（`role="combobox"`，名称「搜索命令」），底部提示通过 `aria-describedby` 作为描述。另有一个视觉隐藏的关闭按钮（「关闭命令面板」），供触屏读屏关闭。分组由组标题命名；禁用命令 `aria-disabled` 并显示 `disabledReason`；`shortcut` 渲染为 `<kbd aria-hidden="true">`，不进入名称。
- FileDropZone：唯一的交互控件是原生 `<input type="file">`，视觉隐藏但可聚焦；名称由 `aria-labelledby` 组合标签与「选择文件」（读作「样本图像 选择文件」），`description` 与 `invalid` 时的 `error` 进入 `aria-describedby`，`invalid` 时 `aria-invalid`。「选择文件」是 `<label for>`，外观为按钮，既是点击区域也是焦点环的承载者（`input:focus-visible + label`）。拖放区域只是 drop 目标，不可聚焦，也没有角色。每次选择 / 拖放的结果写入可见的 `role="status" aria-live="polite"` 区域：先「已添加 N 个文件」，再逐行列出每个被拒文件及原因。
- 焦点环：2px `--rl-focus-ring`。Combobox 画在输入框组外框（`:focus-within`）；CommandPalette 搜索行用底部 2px 内阴影线；FileDropZone 画在「选择文件」上。
- 对比：只使用已有 token 组合（`fg-primary` / `fg-muted` / `fg-subtle` 在 `bg-surface` / `bg-raised`，高亮项 `bg-inverse` + `fg-inverse`，`border-strong` 边界，`danger` 错误，`warning` 禁用原因）。没有新增 token。

## 键盘
| 组件 | 键 | 行为 |
| --- | --- | --- |
| Combobox | 输入文字 | 打开列表并筛选；输入法组字期间不筛选，组字中的 Enter 不选择 |
| | ↓ / ↑ | ↓ 打开列表；打开后移动高亮项。禁用项可以被高亮（读屏可读到它与 `aria-disabled`），但 Enter / 点击不会选中 |
| | Enter | 选中高亮项，关闭列表，输入框显示其 `label` |
| | Esc | 关闭列表；列表已关闭时再按一次清空输入框与选中值 |
| | Home / End | 在输入框内移动光标（不移动高亮项） |
| | Tab | 离开输入框；清除按钮与展开按钮 `tabIndex=-1`，不在 Tab 顺序中 |
| CommandPalette | `hotkey`（如 Ctrl/⌘ K） | 打开 / 关闭；输入法组字中（`isComposing` 或 keyCode 229）与按住重复时忽略 |
| | 输入文字 | 筛选；第一个匹配项始终高亮 |
| | ↓ / ↑ | 移动高亮项（禁用命令同样可被高亮，以便读到原因） |
| | Enter | 执行高亮命令；禁用命令不执行，面板保持打开 |
| | Esc | 关闭，焦点回到打开前的元素 |
| | Tab | 焦点被困在对话框内（Dialog 焦点陷阱），可到达视觉隐藏的关闭按钮；Tab 顺序未在测试中断言 |
| FileDropZone | Tab | 聚焦原生文件输入，「选择文件」显示焦点环 |
| | Enter / Space | 打开系统文件选择器（浏览器原生行为） |

## 状态矩阵
- Combobox：default · hover（边框 `fg-muted`）· focus-within（焦点环，边框 `fg-primary`）· open（`data-popup-open`，箭头旋转 180°）· 选项 highlighted（`bg-inverse`）· selected（勾选指示，未高亮时 `accent-subtle` 底）· 选项 disabled（`fg-disabled`）· 分组 · description 第二行 · loading（Spinner + 状态文字）· empty · invalid（`danger` 边框 + 内描边 + Field 错误）· readOnly（`bg-readonly`，无清除按钮）· disabled（输入框与按钮均禁用）· `sm` / `md` / `lg` · 长文本（`overflow-wrap: anywhere`）。
- CommandPalette：关闭 · 打开（顶部 2px `fg-primary` 边、距顶 `--rl-space-16`、宽 `min(--rl-dialog-width-md, 100vw - 32px)`）· 条目 highlighted · disabled（`fg-disabled`；高亮时 `bg-subtle` + `fg-muted`，原因保持 `warning` 色）· 匹配片段（600 字重 + `accent` 下划线）· empty · 隐藏提示（`hint={null}`）。
- FileDropZone：default（`border-strong` 2px 虚线）· 「选择文件」hover / focus-visible · drag-over（`data-drag-over`，实线 `accent` 边 + `accent-subtle` 底）· invalid（`danger` 边 + 错误文字）· disabled（`bg-disabled`，忽略拖放）· 状态消息（多行，空时隐藏）。

## Motion
- Combobox：弹层 CSS 过渡 `opacity` + `translate`（从上方 4px 落下）`--rl-motion-fast`（120ms），由 Base UI 的 `data-starting-style` / `data-ending-style` 驱动；箭头 `rotate` 与边框 / 背景颜色同为 `--rl-motion-fast`。CSS 过渡中途反向时从当前值继续，不排队。
- CommandPalette：`motion/react` + `AnimatePresence`，Portal `keepMounted` 以便退出动画播完。背景 `opacity` 用 `fast` 预设（120ms）；面板 `opacity` + `y` 8px → 0 用 `panel` 预设（280ms，`ease.out`）。快速开关时 motion 从当前值继续动画。
- FileDropZone：区域与按钮的边框 / 背景颜色过渡 `--rl-motion-fast`；没有位移或缩放。
- 没有 `@keyframes`，没有高度动画。

## 减动
- 触发：系统 `prefers-reduced-motion: reduce` 或 `RhineProvider motion="reduce"`（`data-rl-motion="reduce"` 与 `MotionConfig reducedMotion="always"`）。
- CSS：时长 token（`--rl-motion-fast` / `base` / `panel`）归零，Combobox 弹层另设 `translate: none`。因此 Combobox 弹层、箭头、颜色变化都是即时的。
- CommandPalette：`useRhineMotion().reduced` 为真时位移为 0，`get()` 返回 `instant`（时长 0），背景与面板立即出现 / 消失。
- 尚无 E2E 断言减动下的 `transition-duration`；单测的 CommandPalette 用例都在 `motion="reduce"` 下运行，但只验证行为，不验证时长。

## 主题、密度与高对比
颜色全部来自语义 token，明暗主题自动适配；弹层与面板通过 Provider 的 portal 容器渲染在 `.rl-theme` 内（E2E 断言暗色主题下面板位于 `data-rl-theme="dark"` 根内）。Combobox 高度跟随 `--rl-control-height-*`，选项与命令行高为 `--rl-control-height-md`。forced-colors：Combobox 边框 `FieldText`，高亮项 `Highlight` / `HighlightText`，禁用 `GrayText`，弹层 / 面板边框 `CanvasText`，匹配片段 `Highlight`，拖放区边框 `CanvasText`（拖入时 `Highlight`），「选择文件」边框 `ButtonText`，焦点环 `Highlight`。

## 测试
- 单测：`packages/react/test/m12-command.test.tsx`（23 项）。Combobox 9 项：combobox / listbox / group 语义与描述、输入筛选 + ↓ + Enter 选中并显示标签、禁用项不可选、空状态与 Esc、IME 组字中 Enter 不选中、受控值与 `FormData`（含清除后为空）、`filter={null}` + `loading`（状态行、`aria-busy`、隐藏空状态）、`invalid` / `disabled`、enUS 文案。CommandPalette 8 项：trigger 打开具名模态框且焦点在输入框、描述为提示、首项高亮、`<kbd>`；label / keywords 筛选、`<mark>`、Enter 执行并关闭、焦点归还、重开时查询清空；↓ 移动与 Esc；禁用命令显示原因且 Enter / 点击都不执行；`onSelect` 返回 `false` 保持打开与空状态；`hotkey` 切换、组字中忽略、焦点回到打开前元素；`matchHotkey` 的 `mod` 映射；受控 `open`。FileDropZone 6 项：原生输入名称 / 描述 / `accept` 与 `<label for>`；类型 / 大小 / 数量校验与 live region 文案、输入框清空；拖入高亮与 drop 校验、非 `multiple` 只收 1 个；`disabled`；自定义提示、`invalid` + `error`、enUS 文案；`matchesAccept` / `validateFiles`。
- 类型测试：`packages/react/test/m12-command.test-d.tsx`（14 项）：必填属性、`string | null` 回调、`label` 只能是字符串、`filter` 签名、`size` 联合、`ref`、`onSelect` 返回值、`title` 只能是字符串、`maxSize` 为数字、文案命名空间签名。
- E2E：`apps/docs/e2e/command.spec.ts`（11 项，Chromium）：Combobox 筛选 + 键盘选中 + 焦点保持、异步 loading → 结果、弹层 axe（限定范围，见已知限制）；CommandPalette Control+K → 筛选 → Enter → 焦点归还、按钮打开 + Esc + axe、禁用命令；FileDropZone 超限拒绝与有效文件接收（`setInputFiles`）、「选择文件」焦点环、合成 `DataTransfer` 拖放；暗色主题 portal + axe；整页 axe 与 320px 无横向溢出。
- 尚未做：Firefox / WebKit E2E、视觉基线（320/390/768/1280/1920）、减动时长断言、屏幕阅读器与真实输入法抽检、真实拖放（系统文件管理器拖入）。

## 已知限制
- Combobox 只支持单选，没有多选 / chips、没有自由输入（`value` 只能是 `items` 中的值），也没有虚拟滚动；长列表需调用方自行限制数量。
- Combobox 列表展开期间 Base UI 对页面其余部分设 `aria-hidden`，axe 会对其中仍可聚焦的控件报 `aria-hidden-focus`，所以 E2E 的「弹层 axe」限定在弹层与字段范围内检查。
- Combobox 的异步检索没有内置防抖、取消或竞态保护，由调用方负责。
- CommandPalette 不做模糊匹配或排序，只按 `commands` 顺序过滤；高亮只覆盖 `label` 中的连续子串。
- CommandPalette 的 `hotkey` 监听在 `document` 上，即使焦点在其他输入框中也会触发；`shortcut` 只是提示文字，不会绑定按键。`mod` 依据 `navigator.userAgentData.platform` / `navigator.platform` 判断，Apple 平台的 ⌘ 映射只在单测中用参数验证。
- CommandPalette 的自定义 `filter` 收到的是去除首尾空白后的查询；空查询时不调用 `filter`，显示全部命令。
- FileDropZone 不上传、不保留文件列表，原生输入框每次选择后清空，表单提交不包含文件。`accept` 校验基于文件名与 `File.type`，类型为空的文件只能通过扩展名匹配；浏览器的原生选择器还会按 `accept` 预先过滤。
- FileDropZone 的 `maxFiles` 按单次选择 / 拖放计算，不累计之前已接收的文件。
- 拖放只在 jsdom（模拟对象）与 Chromium（合成 `DataTransfer`）中验证。

## 变更记录
- 0.0.0 · 2026-10-10：首次加入（M12）。文案表新增 `combobox`（`empty` / `loading` / `clear` / `openList`）、`commandPalette`（`title` / `inputLabel` / `placeholder` / `empty` / `hint` / `close`）、`fileDropZone`（`prompt` / `browse` / `rejectedType` / `rejectedSize` / `rejectedCount` / `accepted`）命名空间。
