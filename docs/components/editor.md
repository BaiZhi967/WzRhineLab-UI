# Markdown 编辑器层（`@wzrhine/editor`）

- 状态：**R4 候选 / 0.6.x 开发线** · 计划：[Markdown 编辑器层计划](../superpowers/plans/2026-10-16-markdown-editor-layer.md)
- 源码：`packages/editor/src/` · Showcase：`#/archive/editor`
- 预览依赖：`@wzrhine/content` · 控件依赖：`@wzrhine/react` · 源码内核：可选 CodeMirror 6

## 用途和边界

编辑器层提供源码编辑合同、文档标签、工具栏、预览和 source/preview/split 模式组合。`source` 是唯一事实源；文件读取、持久化、自动保存、冲突合并、路由和权限由宿主持有。当前实现不建立块级文档模型，因此不提供完整 WYSIWYM、协同光标、反向链接或图谱。

| 用于 | 不用于 |
| --- | --- |
| Markdown 源码编辑、撤销/重做、选择和 IME 状态 | 文件系统、网络请求、持久化和权限判断 |
| 只读 Markdown 预览与 source/preview/split 模式 | WYSIWYM 块模型、拖拽块和协同编辑 |
| 文档标签、格式命令、保存/冲突状态展示 | 冲突策略、远程同步和业务保存 API |

## 安装和入口

根入口不加载 CodeMirror：

```sh
pnpm add @wzrhine/editor @wzrhine/content @wzrhine/react @wzrhine/tokens react react-dom motion
```

使用源码 adapter 时显式安装可选 peer，并从子路径导入：

```sh
pnpm add @codemirror/commands @codemirror/lang-markdown @codemirror/search @codemirror/state @codemirror/view
```

```tsx
import '@wzrhine/editor/styles.css';
import { EditorModeView } from '@wzrhine/editor';
import { createCodeMirrorAdapter } from '@wzrhine/editor/codemirror';
```

`./codemirror` 是唯一加载 CodeMirror 的入口，便于不需要源码编辑的消费者保持轻量。`./styles.css` 需要由宿主显式导入。

## 数据流和状态所有权

```text
宿主 source ──▶ EditorSurface / PreviewPane
     ▲              │
     └── EditorChange / onSelectionChange
```

`EditorHost` 暴露 `getSnapshot`、`setSource`、`focus`、`dispatch`、`subscribe` 和 `destroy`，不暴露 CodeMirror `EditorState`。宿主应在 `onChange` 中更新 Markdown 原文，再把同一个值传回 `EditorModeView`。`EditorModeView` 只根据 `mode` 挂载源码、预览或分栏，不复制内容状态。

保存状态由 `SaveStatus` 展示；`retry` 和 `resolveConflict` 只回调宿主。冲突状态下是否锁定源码由宿主通过 `readOnly` 决定。

## 交互合同

- `DocumentTabs` 使用受控 `activeId`；脏状态通过 `dirty` 传入；关闭前确认通过 `onCloseRequest` 传入。
- `EditorToolbar` 接收 engine-neutral `EditorCommand`，支持 undo、redo、mark、heading、list、link 和 text insertion。`readOnly` 或 `composing` 时命令按钮禁用。
- CodeMirror adapter 将用户输入、选择、composition、focus/blur 和外部 source 替换转成合同事件；外部替换不会创建另一份 Markdown 事实源。
- `PreviewPane` 委托 `MarkdownRenderer`，继承内容层的 URL 安全、GFM、标题 ID、图片和状态合同。
- `EditorModeView` 的 split 布局使用 token 和容器查询，窄容器自动堆叠；可调整分隔条只有传入 `resizableDivider` 时出现。

## 可访问性和 SSR

- 标签、工具栏、模式切换和预览使用真实 ARIA 语义；CodeMirror 挂载失败时保留错误状态，不渲染空白区域。
- composition 期间不触发格式化命令，避免 IME Enter 被宿主误判为提交。
- 根入口可在没有 CodeMirror 的环境导入；源码 adapter 通过客户端子入口加载。
- 主题、密度和减动由 `RhineProvider` 统一提供，编辑器 CSS 只使用 `rl-editor-*` 类和 `--rl-*` tokens。

## Showcase 和限制

`apps/docs` 的 `#/archive/editor` 使用两个本地 fixture 文档演示标签、工具栏、源码输入、预览同步、分栏、保存失败、冲突提示和窄屏布局。它不读取文件、不发起网络、不代表实际持久化实现。完整 WYSIWYM 和业务 recipe 将在后续工作包单独设计。
