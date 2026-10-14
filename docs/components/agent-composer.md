# Composer · ComposerInput · MentionMenu · SlashCommandMenu · AttachmentList · SendStopButton · ModelPicker · PermissionPicker

- 状态：**Beta（M12）** · 契约：[ADR-0011](../development/adr/0011-agent-contracts.md) §3、§4、§8 · 动效：[ADR-0012](../development/adr/0012-agent-motion.md)
- 底座：原生 `<textarea>`（输入、IME、选区、撤销、无障碍）；Popover / Menu / AlertDialog / RadioGroup / Tooltip / Progress / Spinner 来自 `@wzrhine/react`；动效 `motion/react`
- 源码：`packages/agent/src/components/composer/*`，样式 `styles/composer.css`，文案 `provider/messages/composer.ts` · Showcase：`#/agent/composer`

## 用途 / 非用途
| 组件 | 用于 | 不用于 |
| --- | --- | --- |
| `Composer` | 智能体对话的完整输入框：附件行、token 输入、@ / 菜单、工具栏插槽、发送 / 停止、反馈行、干预卡插槽 | 普通表单多行输入（用 `Textarea`） |
| `ComposerInput` | 需要 token 着色、整体删除、IME 安全提交的输入区域（Composer 内部使用，也可单独组合） | 富文本 / Markdown 编辑器 |
| `MentionMenu` / `SlashCommandMenu` | 由宿主输入框驱动的候选 listbox（焦点留在输入框） | 独立的命令面板（用 CommandPalette） |
| `AttachmentList` | 待发送附件与上下文引用卡片 | 文件管理器；上传本身（宿主负责） |
| `SendStopButton` | 发送 ↔ 停止的常驻按钮 | 普通提交按钮 |
| `ModelPicker` | Provider / 模型 / 思考强度选择 | 模型配置页 |
| `PermissionPicker` | 对话权限模式切换，提升权限需确认 | 授予单次工具权限（用审批卡） |

## API
```tsx
<Composer
  value={draft} onValueChange={setDraft}
  mentionOptions={files} onMentionQuery={setQuery} mentionLoading={loading} mentionError={error} onMentionRetry={reload}
  onReferenceAdd={(option, tokenName) => bind(option, tokenName)} onTokenRemoved={(token) => unbind(token)}
  commandOptions={commands} onCommand={(option) => (option.kind === 'skill' ? 'insert' : dispatch(option))}
  references={refs} attachments={files} onRemoveAttachment={remove} onRetryAttachment={retry}
  onFilesDrop={upload} onFilesPaste={upload}
  onSubmit={(input) => send(input)} submitStatus={sendReceipt}
  runStatus={run.status} onStop={stop} stopStatus={stopReceipt} onRetryAction={(kind, actionId) => retrySame(kind, actionId)}
  draftStatus={draftStatus} onRetryDraftSave={saveAgain} maxLength={8000}
  blocked={questionnairePending} intervention={<QuestionnaireCard … />}
  toolbarStart={<Menu trigger={<IconButton label="添加内容" icon={…} />}>…</Menu>}
  toolbarEnd={<><ModelPicker … /><PermissionPicker … /></>}
/>
```

| 组件 | 属性 | 说明 |
| --- | --- | --- |
| Composer | `onSubmit(input: SendInput)` | `{ text: toPlainText(value), raw, references, attachments }`；绑定以 `references` 为准 |
| Composer | `submitStatus` / `stopStatus` | `ActionStatus` 或 `ActionReceipt`；`submitting` / `unknown` 期间 Enter 与按钮都不会再触发 |
| Composer | `runStatus` + `onStop` | `canStopRun` 或 `cancelling` 时按钮为「停止生成 / 停止待确认」，Enter 不发送 |
| Composer | `mentionOptions` / `commandOptions` | 传入即启用对应菜单；无 `onMentionQuery` / `onCommandQuery` 时组件本地过滤，有则由宿主过滤 |
| Composer | `onCommand(option, match)` | 返回 `'insert'` 把 `/query` 替换为 token；否则删除已键入的 `/query`，由宿主分发动作。组件从不执行命令 |
| Composer | `onDisabledCommand` | 选中不可用命令：不分发，原因显示在反馈行 |
| Composer | `blocked` | `true` / 原因文案：textarea 只读 + `aria-disabled`，原因作为 placeholder 与反馈 |
| Composer | `intervention` | 干预卡停靠插槽（grid-rows 展开 / 收起） |
| ComposerInput | `onTriggerChange` / `onMenuKey` / `onTokenRemoved` / `tokenKind` / `submitOn` | 见源码 JSDoc；ref 句柄 `focus / insertToken / replaceRange / getSelection / element` |
| AttachmentList | `onRemove` / `onRetry` | 无回调不画按钮；移除只是 UI 引用动作 |
| SendStopButton | `canSend` `mode` `runStatus` `sendReceipt` `stopReceipt` `onSend` `onStop` `onRetry(kind, actionId)` `onRetrySave` `disabledReason` | 状态由 `resolveSendStop` 决定（导出，可单测） |
| ModelPicker | `providers` `selectedModel` `onModelChange` `effort` `onEffortChange` `effortLabels` `loading` `error` `disabled` | 受控；不触碰草稿；思考强度档位开放扩展（见下） |
| PermissionPicker | `modes` `value` `onChange` | `risk: 'elevated'` 先确认；`onChange` 可返回 Promise（确认按钮 loading，失败停留并提示） |

辅助纯函数（包入口导出）：`filterMentionOptions`、`filterCommandOptions`、`orderCommandOptions`、`splitMentionQuery`、`drillQuery`、`defaultMentionTokenName`、`moveActiveIndex`、`removeTokens`、`resolveSendStop`、`normalizeEfforts`。

### 自定义思考强度与能力标签（ADR-0013 §1）

`ModelOptionView.efforts` 接受两种元素：字符串 id（标签查文案表）或 `{ id, label, description }`（自带文案，含 Radio 描述行）。档位 id 不限于内置六档（off / low / medium / high / max / xhigh），厂商档位、数值档位均可。标签解析优先级：`effortLabels` 属性 > 选项自带 `label` > `composer.effort` 文案表 > id 原文（保证永不空白）。文案表支持按键增补：

```tsx
// 方式一：选项自带文案
efforts: ['low', { id: 'adaptive', label: '自适应', description: '按输入长度自动调整' }]
// 方式二：组件属性
<ModelPicker effortLabels={{ 'deep-research': '深度研究' }} … />
// 方式三：Provider 文案表（与内置键按键合并，内置标签不丢）
<AgentMessagesProvider messages={{ composer: { effort: { 'deep-research': '深度研究' } } }}>
```

`capabilities` 同理：内置五种（image / video / tools / reasoning / long-context）有文案，自定义能力（如 `audio-native`）显示原始 id，可经 `composer.capability` 文案表增补。`AttachmentList` 的 `kind` / `referenceKind` 同样开放：未知类别回落到 `file` / `custom` 图标与原始 id 文案，可经 `composer.kind` / `composer.referenceKind` 增补。

## 受控
- `Composer` / `ComposerInput`：`value` + `onValueChange` 受控，或 `defaultValue` 非受控。宿主外部改值（发送后清空、恢复草稿）会重新检测触发符，菜单不会残留。
- `ModelPicker`：`selectedModel` / `effort` 受控；`open` 可选受控。`PermissionPicker`：`value` 受控。

## 可访问性
- 真实 textarea：名称来自 `aria-label` 或文案 `消息内容`；`aria-describedby` 指向键盘提示（「Enter 发送，Shift + Enter 换行…」）与反馈行。镜像层 `aria-hidden`。
- 启用菜单时 textarea 为 `role="combobox"`，带 `aria-expanded`、`aria-controls`、`aria-autocomplete="list"`、`aria-activedescendant`；候选为 `role="listbox"` / `role="option"`（`aria-selected`、不可用 `aria-disabled` + 可见原因），分组为 `role="group"` 并以可见标题命名。焦点始终在 textarea，鼠标 `mousedown` 不抢焦点。
- 发送 / 停止是同一个 `<button>`：名称在「发送 / 正在发送 / 停止生成 / 停止待确认 / 结果待确认 / 重试同一发送 / 重试保存」间切换；不可用时 `aria-disabled`（仍可聚焦），原因经 Tooltip 与 `aria-describedby` 同时提供。
- 附件卡片 `role="list"`；移除按钮名「移除 文件名」；上传中用 Progress（已知进度）或带名称的 Spinner；状态均为文字 + 字形。
- ModelPicker：触发器名「模型：vision-1，思考强度：均衡」；不可用模型 `aria-disabled` 并以原因为描述，当前项 `aria-current`；关闭后焦点回到触发器。
- PermissionPicker：提升权限项带「需确认」文字，触发器换警示字形；确认框为 `role="alertdialog"`，初始焦点在「取消」，关闭后焦点回到触发器。

## 键盘
| 位置 | 按键 | 行为 |
| --- | --- | --- |
| 输入框 | Enter / Shift+Enter | 发送 / 换行（`submitOn="mod-enter"` 时 Ctrl/⌘+Enter 发送） |
| 输入框 | IME 合成中 | Enter、Tab、方向键不交给发送与菜单（`compositionstart/end` + `isComposing` + keyCode 229） |
| 输入框 | Backspace / Delete 紧邻 token | 整体删除 token 与一个相邻空格（原生编辑命令，可撤销） |
| 输入框 | ← / → 跨 token | 光标越过 token；点击落在 token 内部吸附到较近边缘 |
| 菜单打开 | ↑ / ↓ | 移动活动项，**在两端停住不循环** |
| 菜单打开 | Enter / Tab | 选择；文件夹上 Enter / Tab 进入（query 变为 `name/`） |
| 菜单打开 | Esc | 关闭并记住「触发符 + 位置 + 整个词」；光标移开再回来不会重开，修改该词后重开 |
| ModelPicker 模型层 | ↑ / ↓ / Home / End | 在模型按钮间移动；思考强度为 RadioGroup（方向键选择） |

## 状态矩阵
| 状态 | Composer 表现 | 按钮 |
| --- | --- | --- |
| empty | placeholder；反馈行空 | 发送（不可用，原因「输入内容后才能发送」） |
| focused | 框上焦点环（`:focus-within`，`--rl-focus-ring`） | — |
| multiline | 高度随镜像测量增长，夹在 `--rl-agent-composer-min / max` 之间，超出内滚 | — |
| mentions | token 着色（仅背景 + 阴影，不改字宽）；引用卡片 | — |
| sending | `submitStatus="submitting"`，Enter 无效 | 正在发送（aria-busy） |
| queued / running | Enter 无效 | 停止生成 |
| cancelling / 停止已发出 | — | 停止待确认（不可再点） |
| unknown 回执 | 反馈「发送结果待确认，未重复发送」 | 结果待确认（或重试同一动作，回传原 actionId） |
| rejected | 反馈「发送失败，草稿已保留」+ 重试 | 发送 |
| draft saving / saved / error | 「正在保存草稿 / 草稿已保存 / 草稿保存失败，内容仍保留在本机」+ 重试保存 | — |
| blocked | 只读 + aria-disabled，原因作 placeholder | 发送（不可用） |
| drag-over | 虚线框 +「松开以添加文件」 | — |

## Motion
| 部位 | 所有者 | 预设 |
| --- | --- | --- |
| @ / 菜单出现 | `MotionPresence` `fade` | fast |
| 发送 ↔ 停止图标 | motion/react `opacity` 叠放交叉淡入（`useSwapTransition`） | 进 base / 出 fast；快切从当前不透明度接续 |
| ModelPicker 层级下钻 | motion/react `x`（单轴 16px）+ opacity | panel |
| 干预插槽 | CSS `grid-template-rows` 0fr ↔ 1fr | `--rl-motion-base` |
| 输入框高度 | 无动画（即时测量） | — |

## 减动
`MotionConfig reducedMotion` / 系统减动 / `data-rl-motion="reduce"`：菜单即时显隐，图标直接替换，下钻无位移，干预插槽 CSS 时长归零（收起时内容立即卸载）。本族无 `@keyframes`。

## 测试
- 单测：`packages/agent/test/composer-input.test.tsx`（镜像、提交、IME 三重判断、触发检测、整体删除、剪切后的 token 回收、光标吸附、句柄）、`composer.test.tsx`（菜单 combobox 语义、夹紧导航、下钻、Esc 记忆、禁用命令、发送载荷、防重复、运行中、阻塞、拖放 / 粘贴、多实例、减动）、`composer-parts.test.tsx`（SendStop 全部状态、附件、缩略图来源守卫、ModelPicker 两层与焦点、PermissionPicker 确认）。
- E2E：`apps/docs/e2e/agent-composer.spec.ts`（Chromium）：@ 插入 token 与整体删除（含撤销恢复）、文件夹下钻、Esc 不重开、禁用命令、Shift+Enter / Enter 与发送 → 停止 → 待确认 → 发送、IME Enter 不发送、提升权限确认、模型下钻与焦点归还、axe（明 / 暗、菜单打开）、320 无横向溢出。
- 未覆盖：真实中文输入法（需人工验收，ADR-0010）；Firefox / WebKit；高对比度模式下 token 轮廓的人工检查。
