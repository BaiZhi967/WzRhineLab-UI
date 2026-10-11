# ADR-0009 · M9.5 默认文案与 locale 策略

- 状态：**Accepted** · 关联里程碑：M9.5 Ecosystem hardening
- 范围：`@wzrhine/react` 组件内置的可见文字与读屏文字（「上一页」「关闭」「正在加载…」等），以及数字格式化的 locale
- 不在范围：Showcase 与示例应用的页面文案；完整的 i18n 框架（复数规则、消息提取、翻译工作流）；RTL 视觉审查（Drawer 已按书写方向放置，见 ADR-0006 §4）

## 背景
M7–M9 的每个组件都把中文默认文案写成属性默认值（ADR-0005 §8、ADR-0006 均约定「默认中文、可通过属性覆盖」，并把统一方案留给本 ADR）。截至 M9 共有约 30 条内置文案，分散在 16 个组件中，其中部分（DataTable 全选框「全选 / 取消全选」、行选择框「选择 X」、Toast 关闭按钮「关闭通知」、Field「（可选）」、MetadataList「未记录」、Textarea 计数「已输入 a / b」、Stat「正在加载」）**没有任何覆盖入口**。英文或其他语言的宿主只能接受中文读屏文字，这在可访问性上是缺陷，而不只是本地化问题。

## 决策

### 1. 机制：Provider 级文案表 + 组件级属性覆盖
- 新增 `RhineProvider` 属性 `messages?: Partial<RhineMessages>`（以及独立的 `RhineMessagesProvider`，供不使用 `RhineProvider` 的局部区域）。嵌套 Provider 与外层合并（浅合并到每个组件的命名空间）。
- 优先级：**组件属性 > 最近 Provider 的 messages > 内置默认（zh-CN）**。已有的组件属性（`cancelLabel`、`labels`、`loadingText`…）保持不变、继续生效。
- `RhineMessages` 是按组件分组的纯数据对象，文本为字符串，带参数的文本为函数（例如 `pagination.page: (n) => string`），不引入 ICU 消息格式与运行时解析器。
- 导出 `zhCN`（内置默认）与 `enUS` 两份完整文案表，以及 `useRhineMessages()` hook（返回合并后的表，供使用者在自定义组件中复用同一份文案）。`enUS` 由维护者审阅前标注为「参考译文」，不承诺措辞稳定。
- 不在组件里读取 `navigator.language` 或自动切换语言：语言由宿主决定，避免 SSR 与客户端渲染结果不一致。

### 2. 覆盖范围：所有内置文字必须可覆盖
- 每一条内置可见文字与读屏文字都进入 `RhineMessages`，包括目前无法覆盖的那几条。新增文案时同步增加到 `zhCN` 与 `enUS`，并由单测保证两份表的键完全一致（类型层面由 `RhineMessages` 约束，运行时测试再检查一遍，防止 `enUS` 漏项后回落到中文）。
- 组件内部不得再出现中文字面量默认值：新增 package-boundary 规则，`components/*.tsx` 的代码（排除注释）中不得包含 CJK 字符串字面量。

### 3. 数字与日期格式
- 文案表外另设 `locale?: string`（`RhineProvider` 属性，默认 `zh-CN`），供 `Intl.NumberFormat` 使用：Stat、Pagination 的计数、Progress / Meter 的默认值文本。组件已有的 `locale` 属性（Stat）优先。
- 组件不格式化日期：日期仍由调用方传入已格式化的文本与机器可读的 `dateTime`。

### 4. 语言标记
- `RhineProvider` 新增可选 `lang` 属性，设置时写到 `.rl-theme` 根元素（以及弹层挂载点所在的同一子树），让读屏按正确语言朗读；不设置时不写，继承宿主文档。

## 实现修订（M9.5 实现后）
- 命名空间共 15 个，完整键表见 [locale.md](../../components/locale.md)。比上文多出两项：`toast.region`（Base UI 在通知视口上写死了 `aria-label="Notifications"`，现在可覆盖；`zhCN` 保留原值 `Notifications`，保证默认输出不变）与 `progress.meterValue`（Meter 带状态时的读屏值，原先内含中文逗号）。
- 带数字参数的函数多一个格式化参数，例如 `pagination.page(n, format)`，`format` 按 Provider 的 `locale` 格式化数字；`zhCN` 不使用它（输出不变），`enUS` 使用（「of 1,000 items」）。
- 合并：每个命名空间内逐键覆盖，值为 `undefined` 的键被忽略；组件属性显式传 `undefined` 等同于未传。`Pagination.labels` 同样逐键合并。
- `lang` 只写在 `RhineProvider` 的 `.rl-theme` 根元素上，弹层挂载在根内因而继承；`RhineMessagesProvider` 不渲染元素。Toast 文案取自**挂载通知视口的 Provider**：嵌套 Provider 默认共用外层视口，因此显示外层文案；需要局部语言的通知时给内层 `RhineProvider` 传 `toasts`。
- CJK 字面量规则的范围比上文更宽：`components/` 与 `provider/` 下所有 `.ts` / `.tsx`（去掉注释后），包括汉字、假名、韩文与全角标点；`provider/messages.tsx` 是唯一例外。
- 文案表文件带 `'use client'`（ADR-0008 §2 的规则：它导出 Provider 与 hook）。服务端组件可以把 `messages={enUS}` 作为客户端引用传给 `RhineProvider`，不受「函数不能作为 props」的限制。

## 后果
- 新增公开 API：`RhineMessages` 类型、`zhCN`、`enUS`、`useRhineMessages`、`RhineMessagesProvider`，`RhineProviderProps` 增加 `messages`、`locale`、`lang`。全部为可选新增，不改变现有渲染结果（默认文案逐字不变，由既有单测与视觉基线保证）。
- 每个组件改为从 hook 读取默认文案；不使用 Provider 时回落到 `zhCN`，SSR 与客户端一致。
- 后续新增组件的检查项多一条：文案进入 `RhineMessages`。

## 验证方法
单测（三层优先级、嵌套合并、`zhCN` / `enUS` 键一致、无 Provider 时回落）、package-boundary 的 CJK 字面量规则（含反向验证）、Showcase 增加「English messages」演示区并跑 axe、视觉基线零差异（默认中文不变）、ssr-hydrate 示例回归。结果记录在 `docs/development/acceptance/2026-10-11-m9.5.md`。
