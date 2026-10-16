# ADR-0017 · 编辑器包与 Markdown 源码适配器

- 状态：Accepted for R4 implementation planning
- 日期：2026-10-16
- 范围：`@wzrhine/editor` 候选包；不改变 `@wzrhine/react` 的依赖链

## Context

WzRhineLab-UI 已有 `@wzrhine/content` 只读 Markdown 内容层，但还没有编辑器合同。编辑需求需要源码、选区、中文输入、撤销重做、粘贴、只读和保存状态，同时不能让普通内容页承担编辑器运行时。

## Decision

建立可选的 `@wzrhine/editor` 包：

- 根入口只导出 engine-neutral 合同、状态组件、文档标签、工具栏和预览组合；
- `@wzrhine/editor/codemirror` 是唯一允许导入 CodeMirror 的入口；
- CodeMirror 作为 optional peer dependencies，普通根入口不要求安装；
- 源码编辑 adapter 使用 CodeMirror 6 的 immutable state/transaction 模型，映射为 `EditorHost` 的 `source`、`selection`、`composing` 和 `dispatch(command)`；
- `@wzrhine/content/MarkdownRenderer` 负责只读预览；
- 宿主负责文件读写、保存、revision、冲突、路由、权限和命令注册；
- Markdown 原文是唯一事实源，编辑器内部 state、syntax tree 和 selection 不反向成为业务文档；
- 首期支持 source、preview、split，不实现完整 WYSIWYM、协同编辑、远程光标、块拖拽或插件下载。

CodeMirror 方案依据其官方状态/事务模型和 Markdown language package；ProseMirror/Milkdown 等 WYSIWYM 方案不在本 ADR 中选型，未来需要独立 ADR 和往返数据实验。

## Package boundary

`@wzrhine/editor` 的运行时依赖只有 `@wzrhine/content` 和 `@wzrhine/tokens`；`@wzrhine/react`、React、React DOM 和 Motion 为 peer。CodeMirror 的 `commands`、`lang-markdown`、`search`、`state`、`view` 为 optional peers。任何将 CodeMirror 导入 root entry、或把编辑器依赖加入 `@wzrhine/react` 的变更都违反本决策。

## Consequences

优点：阅读页不加载编辑器；编辑器内核可以替换；宿主仍拥有保存真实性和冲突处理；发布门禁可以分别测量 core 与 adapter。代价：消费者安装 `./codemirror` 时必须显式安装 CodeMirror peers；某些格式化命令只能由 adapter 支持；WYSIWYM 需要后续独立工作包。

## Verification

实现必须覆盖：root import 不加载 CodeMirror、adapter subpath 可安装、IME/selection/undo/redo、SSR fallback、dirty/conflict 状态、tarball consumer、optional dependency license、core/adapter size、320/390/768/1280/1920 和 Showcase source/preview/split 闭环。

