# Locale & messages

- 状态：**Beta（M9.5）** · 契约：[ADR-0009](../development/adr/0009-locale-default-copy.md)
- 源码：`packages/react/src/provider/messages.tsx`（文案表、`RhineMessagesProvider`、`useRhineMessages`），`RhineProvider.tsx`（`messages` / `locale` / `lang`）· Showcase：`#/foundations/locale`

组件自己生成的每一条可见文字与读屏文字（「上一页」「关闭通知」「（可选）」「已输入 a / b」……）都来自一张按组件分组的文案表 `RhineMessages`。默认是 `zhCN`，输出与 M9 之前逐字相同。

## 用法
```tsx
import { RhineProvider, RhineMessagesProvider, enUS, useRhineMessages } from '@wzrhine/react';

// 整个应用使用英文：文案、数字格式、lang 属性
<RhineProvider messages={enUS} locale="en-US" lang="en">
  <App />
</RhineProvider>

// 只改一条，其余保持 zhCN（按命名空间浅合并）
<RhineProvider messages={{ drawer: { close: '收起' } }}>…</RhineProvider>

// 没有 RhineProvider 的局部区域
<RhineMessagesProvider messages={enUS} locale="en-US">…</RhineMessagesProvider>

// 自定义组件复用同一份文案
const m = useRhineMessages();
<button aria-label={m.drawer.close}>…</button>
```

## 优先级
**组件属性 > 最近 Provider 的 `messages` > `zhCN`。**

- 已有的文案属性继续生效：`Alert.dismissLabel`、`AlertDialog.cancelLabel / errorText`、`Breadcrumb.label / expandLabel`、`DataTable.emptyText / loadingText / errorText / retryLabel`、`Drawer.closeLabel`、`Pagination.labels`（逐键合并）、`Progress.getValueText`、`RecordHeader.trailLabel`、`Select.placeholder`、`Stat.emptyLabel / locale`、`Timeline.emptyText`。
- 属性显式传 `undefined` 等同于未传，回落到文案表（与原来的默认参数行为一致）。
- 嵌套 Provider 与外层合并：每个命名空间内逐键覆盖，未提及的键与命名空间沿用外层（外层没有则为 `zhCN`）。`messages` 中值为 `undefined` 的键被忽略。
- 组件不读取 `navigator.language`；没有 Provider 时就是 `zhCN` 与 `zh-CN`，SSR 与客户端一致。

## 命名空间
| 命名空间 | 键 | 说明 |
| --- | --- | --- |
| `alert` | `dismiss` | 可关闭 Alert 的关闭按钮 |
| `alertDialog` | `cancel`、`error` | 取消按钮；`onConfirm` 失败且未给 `errorText` 时的提示 |
| `breadcrumb` | `nav`、`expand(count, f)` | `<nav>` 名称；折叠按钮「显示全部 N 级路径」 |
| `dataTable` | `empty`、`loading`、`error`、`retry`、`selectAll`、`deselectAll`、`selectRow(label)`、`selection(count, offPage, f)` | 空 / 加载 / 错误状态；全选框；行选择框；「已选 N 条（其中 M 条在其他页）」 |
| `drawer` | `close` | 头部关闭按钮 |
| `field` | `optional` | `optional` 字段标签后的「（可选）」（Field、Checkbox、Radio、Switch 及其分组共用） |
| `metadataList` | `missing` | `empty="placeholder"` 时「—」的读屏文字 |
| `pagination` | `nav`、`previous`、`next`、`page(p, f)`、`compact(p, n, f)`、`status(from, to, total, f)` | 与 `PaginationLabels` 对应；DataTable 内置分页同样生效 |
| `progress` | `indeterminate`、`meterValue(value, state)` | 不确定进度的读屏值「进行中」；Meter 带状态时的读屏值「72%，偏高」 |
| `recordHeader` | `trail` | 档案位置面包屑的名称 |
| `select` | `placeholder` | 未选择时的占位 |
| `stat` | `loading`、`empty`、`up`、`down`、`flat` | 加载 / 无数据 / 变化方向的读屏文字 |
| `textarea` | `count(current, max, f)` | `showCount` 计数「已输入 a / b」 |
| `timeline` | `empty` | 空时间线 |
| `toast` | `close`、`region` | 通知关闭按钮；通知视口区域名称 |

带参数的条目是函数。含数字参数的函数最后一个参数 `f` 是按 Provider `locale` 格式化数字的 `RhineNumberFormat`；`zhCN` 不使用它（保持原来的原始数字输出，例如「共 1000 条」），`enUS` 使用它（「of 1,000 items」）。

## enUS
`enUS` 是**参考译文**：键与 `zhCN` 完全一致（单测逐键比较，含函数条目），但措辞在 1.0 前可能调整。产品对措辞有要求时，以 `enUS` 为基础覆盖需要的键：

```tsx
const messages = { ...enUS, toast: { ...enUS.toast, close: 'Close' } };
```

`toast.region` 在两份表中都是 `Notifications`：这是 Base UI 视口的内置名称，`zhCN` 保留它以保证默认输出不变；中文产品可以自行覆盖为「通知」。

## locale：数字格式
- `RhineProvider` / `RhineMessagesProvider` 的 `locale`（默认 `zh-CN`，嵌套时继承外层）用于 `Intl.NumberFormat`：Stat 的数值与变化量、Progress / Meter 的默认值文本（传给 Base UI 的 `locale`）、`enUS` 中 Pagination / DataTable / Breadcrumb / Textarea 的计数。
- 组件自己的 `locale` 属性（Stat、Progress、Meter）优先。
- 组件不格式化日期：日期由调用方传入已格式化的文本与 `dateTime`。

## lang
`RhineProvider lang="en"` 把 `lang` 写到它的 `.rl-theme` 根元素；Select、Dialog、Drawer、Toast 等弹层挂载在根内的 portal 节点，因而继承同一语言。不设置时不写属性，继承宿主文档。`RhineMessagesProvider` 不渲染元素，也不写 `lang`。

## 通知（Toast）与嵌套 Provider
通知的关闭按钮与视口名称取自**挂载视口的那个 Provider**，而不是调用 `toast.show()` 的位置。嵌套的 `RhineProvider` 默认不挂载自己的队列（`toasts` 默认 `false`），它内部的 `useToast()` 把通知送到外层视口，因而显示外层的文案。需要局部语言的通知时，给嵌套 Provider 加 `toasts`，它会在自己的根内挂载独立的队列与视口（Showcase 的英文栏即如此）。

## 新增组件的检查项
组件里生成的文字一律进入 `RhineMessages`，同时加到 `zhCN` 与 `enUS`。package-boundary 单测禁止 `components/*.tsx` 与 `provider/*.tsx` 的代码（去掉注释后）出现 CJK 字符，`provider/messages.tsx` 是唯一例外。
