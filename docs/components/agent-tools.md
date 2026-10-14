# Agent · 工具与执行（ToolActivity · ToolRecord · CodeModeToolTree · ToolOutput · ChunkPager · ToolHistory · DiffPreview · 工具详情）

- 状态：**Alpha（M12）** · 契约：[ADR-0011](../development/adr/0011-agent-contracts.md) §4–5、§10，动效：[ADR-0012](../development/adr/0012-agent-motion.md)
- 底座：`@wzrhine/react` `Collapsible`（Base UI collapsible）、`Skeleton`；状态字形 / `AgentStatus` / `AgentSpark` / `AgentEntrance` 来自 `@wzrhine/agent` 基座
- 源码：`packages/agent/src/components/tools/*`，样式 `packages/agent/src/styles/tools.css`，文案 `provider/messages/tools.ts` · Showcase：`#/agent/tools`

## 用途 / 非用途
| 组件 | 用于 | 不用于 |
| --- | --- | --- |
| `ToolActivity` | 一轮工具调用的分组：数量、进行中、用时、状态统计、行列表、历史入口 | 跨轮次的完整记录（用 ToolHistory） |
| `ToolRecord` | 一次工具调用：分类、名称、对象、摘要、状态；展开看授权来源与详情 | 审批决策（交给 intervention 族，可在其中复用工具详情） |
| `CodeModeToolTree` | Code Mode / 脚本父任务及其派生调用，任意深度 | 把子调用合并成一个状态 |
| `ToolOutput` | 有界的输出预览：文本、JSON、代码、终端、列表、错误、空 | 长期查看的全文（用 `onOpenFull` 交给宿主） |
| `ChunkPager` | 分页读取已保存的材料（旧文件内容、清单、补丁、终端输出）的一页：范围、末尾 / 片段、翻页 | 计算偏移（下一页位置只来自运行时的 `nextOffset`）；实时追加的输出 |
| `ToolHistory` | 「完整工具记录」分页列表 | 实时流（用 ToolActivity） |
| `DiffPreview` / `MultiFileDiff` | 单文件 / 多文件差异预览、写入提案 | 补丁引擎（`lineDiff` 只是预览辅助，适配器的规范 diff 优先） |
| `FileReadDetail` 等 11 个详情 + `ToolDetail` | 按 `detail.kind` 渲染专项详情；可单独用于审批卡 | 未声明的工具（自动走 `GenericToolDetail`） |

## API
```tsx
<ToolActivity tools={run.tools} elapsedMs={18_400} onLoadDetails={loadRecord} onOpenHistory={openHistory} />

<ToolRecord tool={tool} onLoadDetails={(id) => adapter.loadOperation(id)} detailsError={errors[tool.id]}
            detailActions={{ onReadMore: (t, offset) => …, onOpenTerminal: (terminalId) => … }} />

<CodeModeToolTree root={codeModeCall} onViewScript={openScript} />          // 或 tools={flat}（按 parentId 建树）
<ToolOutput output={{ kind: 'terminal', content, truncated: 'display' }} onLoadMore={more} onOpenFull={openFull} />
<ChunkPager page={materialPage} label="旧文件内容" canGoBack={offsets.length > 0}
            onFirst={first} onPrevious={back} onNext={(next) => go(next)} onRetry={retry} newer={stale} onReadLatest={latest} />
<ToolOutput output={output} page={materialPage} pager={{ canGoBack, onNext, onPrevious }} />   // 用 ChunkPager 代替内联预览
<ToolHistory items={pages.flat()} total={total} hasMore loading={loading} error={error} onLoadMore={next} />
<DiffPreview diff={fileDiff} onReload={reread} />                            // 或 path + before + after
<MultiFileDiff files={patch.files} />
<RunCommandDetail detail={detail} onOpenTerminal={openTerminal} />
```

| 组件 | 属性 | 说明 |
| --- | --- | --- |
| ToolRecord | `tool` *必填* | `ToolCallView`；`displayName ?? name` 为名称，原始名在 `title` 与详情的等宽 `code` 中 |
| ToolRecord | `expanded` / `defaultExpanded` / `onExpandedChange(open, id)` | 展开状态；不受状态变化影响 |
| ToolRecord | `onLoadDetails(id)` / `detailsError` | `detailsLoaded === false` 时首次展开调用一次；错误时显示「重试」再次调用 |
| ToolRecord | `renderDetail(tool)` | 覆盖详情；返回 `undefined` 回落到内置视图 |
| ToolRecord | `detailActions` | 内置详情的回调（`onReadMore` / `onReload` / `onViewFull` / `onLoadMoreOperations` / `onOpenTerminal` / `onReconcile` / `onRetrySave` / `onOpenChild` / `onLoadMoreOutput` / `onOpenFullOutput` / `onCopyText`） |
| ToolRecord | `actions` | 行旁（触发按钮之外）的控件，例如「在对话中定位」 |
| ToolActivity | `tools` / `active` / `elapsedMs` | 行按 id 去重、按 sequence 排序；`active` 默认「有行未结束」 |
| ToolActivity | `expanded` / `defaultExpanded` / `onExpandedChange` | 默认：进行中展开，结束后折叠，用户切换后以用户为准 |
| ToolActivity | `expandedIds` / `onToolExpandedChange` | 受控的行展开 |
| ToolActivity | `renderTool` / `onOpenHistory` / `title` | 行覆盖、历史入口（无回调不渲染）、标题覆盖 |
| CodeModeToolTree | `root` 或 `tools` | 带 `children` 的父节点，或带 `parentId` 的扁平列表（`buildTree`） |
| CodeModeToolTree | `expandedIds` / `defaultExpandedIds` / `onExpandedChange(ids)` | 节点展开 |
| CodeModeToolTree | `renderTool(tool, depth)` / `onViewScript(tool)` | 节点覆盖、截断脚本的完整查看 |
| ToolOutput | `output` *必填* | `ToolOutputView`；`label` / `regionLabel` 覆盖标题与滚动区名称 |
| ToolOutput | `onLoadMore` / `onOpenFull` / `loadingMore` | 仅 `truncated: 'display'` 时渲染 |
| ToolOutput | `copyable` / `onCopyText` | 复制按钮（默认 `navigator.clipboard`） |
| ToolOutput | `page` / `pager` | 传入 `MaterialPageView` 时主体换成 `ChunkPager`（复制当前页；不再显示展示截断提示），`pager` 为其回调 |
| ChunkPager | `page` *必填* / `label` *必填* | `MaterialPageView`；`label` 命名分组（`role="group"`）与滚动区（「label 当前页」） |
| ChunkPager | `canGoBack` *必填* | 宿主是否保存了上一页的偏移；组件不保存历史 |
| ChunkPager | `onFirst` / `onPrevious` / `onNext(nextOffset)` | 只绘制传入的按钮；不能操作时 `aria-disabled` + 原因（title + `aria-describedby`），仍在 Tab 序列中 |
| ChunkPager | `onRetry` / `newer` + `onReadLatest` / `renderContent(text)` | 失败重试；有更新快照时提示「读取最新」；自定义内容渲染（默认 pre-wrap 等宽） |
| ToolHistory | `items` / `total` / `hasMore` / `loading` / `error` / `onLoadMore` / `onOpenOperation` | 分页、计数、错误保留已加载行 |
| DiffPreview | `diff` 或 `before` + `after` (+ `path` / `status`) | 规范 diff 优先；字符串形式用 `lineDiff` 计算有界预览 |
| DiffPreview | `onViewFull` / `onReload` / `hideHeader` | 截断时查看完整差异；冲突时重新读取 |
| MultiFileDiff | `files` / `expanded` / `defaultExpanded` / `onExpandedChange(paths)` | 默认展开首个文件与所有冲突文件 |
| 工具详情 | `detail` + 各自回调 | 见下表 |

| 详情 | 关键行为 |
| --- | --- |
| `FileReadDetail` | 范围「第 a–b 行」；预览行号从 `range.start` 起；「已读到文件末尾」/「可从第 N 行继续读取」只来自 `eof` / `nextOffset`；`onReadMore(nextOffset)` 仅在有 `nextOffset` 时出现；not-found / forbidden 写出文件名 |
| `FileWriteDetail` | 目标、写入方式（新建 / 覆盖 / 追加）、期望与当前版本，不一致即冲突提示；`materialReady === false` →「正在读取完整材料…」 |
| `EditFileDetail` | 「编辑 N」、范围、匹配方式；before / after 由 `lineDiff` 计算，行号按范围偏移 |
| `ApplyPatchDetail` | `MultiFileDiff`，每个文件独立状态；冲突提示写出文件名；修订号 |
| `ManageFilesDetail` | 操作表（`<table>`）：类型、源 → 目标、包含子目录、状态；删除行写「不能自动恢复」；`hasMore` + `onLoadMore` 才有「加载更多」 |
| `RunCommandDetail` | 可选中命令 + 复制、工作目录、Shell、超时；执行状态「调用已返回」≠「后台仍在运行」≠「已超时」≠「停止尚未确认」；非零退出码「退出码 1 · 请检查输出」；`sandboxed === false` →「非沙箱」；终端输出；`onOpenTerminal` 需 `terminalId` |
| `MCPExecuteDetail` | 服务、工具、地址、目录修订；`catalogStale` →「目录已变化，旧材料不可信」；完整参数 JSON；`remote: 'unknown'` →「远端结果待确认，需要核对」+ 可选 `onReconcile` |
| `NativeModelDetail` | 提供方 · 模型、用途、输入材料（大小 / 类型 / 发送至）、参数、结果（缩略图 alt）、保存状态；部分 / 失败可「重新保存」，描述为「只重新保存，不会再次调用模型」；运行中只显示活动，不显示百分比 |
| `QuestionToolDetail` / `SubagentToolDetail` / `GenericToolDetail` | 问题数与回答（「已跳过」）；子任务名称、任务、`onOpenChild`；通用：输入 JSON + 输出 |

## 受控
- ToolRecord / ToolActivity / ToolHistory 的展开都支持受控与非受控；受控时组件只回调，不自行切换。
- 延迟加载只在 `detailsLoaded === false` 且首次展开时调用一次 `onLoadDetails`（StrictMode 双调用安全）；`detailsError` 存在时不自动重试。
- ChunkPager 完全受控：宿主保存偏移历史，`onNext` 收到运行时给出的 `nextOffset`；组件只在新页到达时把滚动区滚回顶部。
- ToolHistory 的顺序：已经显示的行位置永不改变；新 id 追加在后（彼此按 sequence 排序）；同一 id 出现在多页时只显示一次。

## 可访问性
- 工具行整行是 `<button>`（Collapsible 触发器，`aria-expanded` / `aria-controls`），可访问名称 = 分类 + 名称 + 对象 + 摘要 + 状态 + 用时；行外的控件（`actions`）不嵌套在按钮里。
- 详情面板关闭时卸载，打开后是命名的 `group`（「读取文件 详情」）；延迟加载时容器 `aria-busy` + `role="status"`「正在读取完整记录…」。
- 状态始终是字形 + 文字（`AgentStatus`），`unknown` 为警示色菱形问号，不显示为成功；分类芯片同样有文字。
- 分类（`ToolCategory`）开放扩展（ADR-0013 §2）：内置 8 类有图标与文案；自定义类别回落到 `other` 的图标与 tone，标签显示原始 id（不会误标为「其他」），可经 `status.category` 文案表按键增补。
- 所有可能过宽的内容（代码、diff、命令、操作表、输出）在自己的 `role="region"` + `tabIndex=0` + `aria-label` 滚动容器里，键盘可聚焦后用方向键滚动，页面不会横向溢出。
- Diff：符号列可见（`+` / `−`），读屏额外读「新增」/「删除」；行号 `aria-hidden` 且不可选中，复制只得到代码。增删底色之外始终有符号。
- 层级：CodeModeToolTree 用嵌套 `<ul>`，每层列表命名为「X 的子操作」。
- ChunkPager：头部「字节 a–b / N」或「第 a–b 行 / N」（行 / 项从 1 开始显示，数字经 `useAgentFormat` 格式化），以及「已读至末尾」/「片段」文字标签。翻页按钮不用原生 `disabled`，而是 `aria-disabled` + 描述原因（「已在开头」「已读至末尾，没有下一页」「运行时没有提供下一页位置」「正在读取，请稍候」「这一页读取失败，先重试」），键盘与读屏用户都能听到为什么不能翻页。加载中为 `aria-busy` 的 Skeleton。
- 复制按钮带隐藏的 `role="status"`，播报「已复制」/「复制失败」。
- 「重新保存」等可能被误解的按钮通过 `aria-describedby` 关联说明文字。
- 强制颜色模式：芯片、提示、按钮补边框；diff 增删行改为 Canvas 底 + Highlight 符号。

## 键盘
| 按键 | 行为 |
| --- | --- |
| Tab / Shift+Tab | 依次经过分组头、工具行、行旁动作、详情内的按钮与滚动区 |
| Enter / Space | 展开 / 折叠分组、工具行、脚本、多文件 diff 的文件；ChunkPager 的返回开头 / 上一页 / 下一页 |
| 方向键 | 在已聚焦的输出 / diff / 代码滚动区内滚动 |

## 状态矩阵
| 维度 | 状态 |
| --- | --- |
| 工具状态 | queued / running / waiting-approval / waiting-user / waiting-children / partial / completed / failed / denied / cancelled / timed-out / unknown（文案来自 `status.tool`） |
| 详情 | 已加载 / 延迟加载中 / 加载失败（重试）/ 无详情 / 自定义 |
| 输出 | text / json（可解析即美化）/ code / terminal / list / error / empty；loading / unavailable / partial；截断 display（加载更多 / 完整输出）与 execution（无更多可加载） |
| Diff | preview / proposed / applied / conflict / unavailable；binary；truncated；无尾换行；move |
| Code Mode 结果 | 尚无子操作 / 进行中 / 全部完成 / 部分完成（N 个失败）/ 全部失败 / 结果待确认 |
| 历史 | 空 / 加载中 / 有更多 / 错误（保留已加载） |
| ChunkPager | ready（片段 / 已读至末尾）/ loading / error（原因 + 重试）/ 空页；有 / 无 `nextOffset`；`canGoBack`；`offset === 0`；newer（读取最新） |

## Motion
| 场景 | 动效 | 减动 |
| --- | --- | --- |
| 分组、行、脚本、文件折叠 | Collapsible 的 CSS `height`（`--rl-motion-base`），过程中再次切换从当前高度反向 | 时长 token 归零，即时 |
| 新到的工具行 | `AgentEntrance kind="row"`：`opacity` + `y` 4px，`fast`，错峰 24ms、封顶 120ms；挂载时已有的行与一次超过 20 行的批量不播放 | 无位移、无错峰 |
| 分组进行中 | `AgentSpark phase="executing"`（装饰，`aria-hidden`；文字为「N 个进行中」），只在可见且非减动时循环 | 静态帧 |
| 运行中状态字形 | 基座的呼吸光晕 | 静态 |
| 历史行、Code Mode 树节点 | 无入场（恢复的数据 / 深层树避免重排） | — |
| 列表 | 无 layout 动画 | — |
| ChunkPager 翻页 | 无动画；新页到达时滚动区回到顶部 | — |

## 测试
- 单测：`packages/agent/test/tools.test.tsx`（ToolRecord 10、ToolActivity 6、CodeModeToolTree 3、ToolHistory 4、列表内延迟加载 1）、`tools-details.test.tsx`（ToolOutput 5、DiffPreview 4、11 个详情与分发器 10）；`package-boundary.test.ts` 覆盖 CJK、token、`'use client'`。
- 补充单测：`packages/agent/test/gaps-tools-workspace.test.tsx` 中 ChunkPager 7 项（范围与末尾 / 片段、行号从 1 起、`nextOffset` 决定下一页可用并原样传出、禁用原因描述、加载、错误重试、newer、英文文案、ToolOutput `page`）。
- 浏览器：`apps/docs/e2e/agent-tools.spec.ts`（ChunkPager 下一页 / 上一页 / 返回开头与末尾禁用、键盘展开、状态变化后保持展开、延迟加载、历史加载更多无重复、两种截断文案、diff 符号列、axe、320px 无横向溢出且 diff 在内部滚动），Chromium。
