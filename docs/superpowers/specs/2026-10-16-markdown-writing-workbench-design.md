# Markdown 内容层、编辑器层与写作工作台设计方案

> 状态：Proposed / ArchitectureStudy
> 日期：2026-10-16
> 范围：仅讨论 WzRhineLab-UI 组件项目；本文件不包含代码实现、版本发布或消费项目接入。

## 1. 目标与成功标准

WzRhineLab-UI 需要一套面向 Markdown 写作的可复用能力，覆盖三类体验：

1. 长文档的安全阅读与预览；
2. Markdown 原文编辑、预览和两栏切换；
3. 文件树、文档标签、编辑区、目录和状态栏组成的写作工作台。

成功标准是：

- 普通 `@wzrhine/react` 页面不加载编辑器和 Markdown 重型依赖；
- 内容渲染、编辑器内核和页面组合有清楚的包边界；
- Markdown 原文是首期唯一事实源，编辑器内核可以替换；
- 源码、预览、只读和双栏模式使用同一份文档状态；
- 长中文、代码块、表格、图片失败、坏链接、IME、保存失败和窄屏都有可验证行为；
- 组件只表达 UI 状态和用户意图，文件读取、保存、权限和业务数据不进入公共包。

本方案采用三个阶段：先建立内容层，再建立编辑器层，最后交付写作工作台 recipe。完全所见即所得、协同编辑、知识图谱和插件市场不属于首期范围。

## 2. 当前项目能力与缺口

| 现有能力 | 可直接复用的场景 | 本次不需要重复建设的内容 | 缺口 |
| --- | --- | --- | --- |
| `Workbench` | 工作台外壳、索引栏、主内容区、焦点回收 | 不新增第二个全局外壳 | 文档标签和编辑/预览组合需由 recipe 承担 |
| `Tree` | 文件夹和 Markdown 文件树 | 不另建文件树底座 | 首期不加入拖拽排序和虚拟化 |
| `Tabs` | 编辑/预览模式、阅读/来源切换 | 不复制普通标签页 | 文档标签需要关闭、未保存标记和焦点恢复 |
| `ResizeHandle` | 侧栏宽度和面板调整 | 不急于抽象通用 SplitPane | 只有在多个页面复用后才上移新的分栏组件 |
| `ScrollArea` | 编辑区、预览区和代码块滚动 | 不重造滚动容器 | 大文档性能先测量再决定虚拟化 |
| `CommandPalette` / `ContextMenu` | 命令入口、文档操作菜单 | 不在内容包内建立命令总线 | 命令注册和快捷键作用域留给宿主 |
| `SectionIndex` | Markdown 标题目录 | 不新增重复的目录 UI | 增加标题提取、slug 和定位适配器 |
| `IconButton.pressed` | 图标型切换工具 | 可继续用于窄工具栏 | 需要带文字的 `ToggleButton` / `ToggleGroup` |
| `@wzrhine/agent` 的 `CodeBlock` / `FilePreview` | Agent 产物和文件查看 | 不直接把 Agent 组件当通用编辑器 | 评估共享代码块和内容 renderer 的兼容导出 |
| `Textarea` | 简单文本输入和降级只读编辑 | 不把 Textarea 假装成长文编辑器 | 需要独立编辑器宿主合同 |

## 3. 建议的包与依赖边界

```text
@wzrhine/tokens
        ↓
@wzrhine/react
        ↓
@wzrhine/patterns

@wzrhine/react + @wzrhine/tokens
        ├── @wzrhine/content   可选内容阅读层
        └── @wzrhine/editor    可选编辑器层

Showcase / recipes
        ↓
组合公开包，提供参考工作台
```

### 3.1 `@wzrhine/content`（候选包名）

内容层只负责把已获得的内容安全地呈现出来，不负责读取文件、下载远程资源或保存文档。

建议能力：

- `MarkdownRenderer`：Markdown → 语义 HTML/React 内容；支持自定义 renderer；默认不执行原始 HTML；
- `MarkdownDocument`：文档元信息、标题列表、稳定 slug、章节范围和内容统计；
- `ContentFrame`：可读正文宽度、标题元信息、引用、附件和预览工具栏的插槽；首版优先作为 recipe；
- `CodeBlock`：从 Agent 领域抽取共享行为时保留兼容导出；渲染高亮由宿主或可选 renderer 注入；
- 链接、图片和附件 resolver 合同：只接收宿主授权后的 URL 或渲染结果；
- `HeadingIndex` 纯函数：为现有 `SectionIndex` 提供标题数据。

内容层的安全边界：

- 原始 HTML 默认关闭；
- 链接协议明确允许列表，至少区分 `http`、`https`、相对路径和不受支持协议；
- 本地路径不等于可访问 URL；
- 图片、对象 URL、Worker 和观察器由调用方提供并负责释放；
- 未知 Markdown 扩展显示可解释 fallback，不静默丢失内容。

### 3.2 `@wzrhine/editor`（候选包名）

编辑器层只定义编辑器宿主和交互合同，不把具体编辑器内核暴露给上层。

建议能力：

- `EditorHost`：编辑器内核适配接口；
- `EditorSurface`：编辑区容器、只读、焦点、选区和状态展示；
- `DocumentTabs`：多文档、当前文档、关闭、未保存标记、关闭保护和焦点恢复；
- `EditorToolbar`：格式命令、模式切换、撤销/重做和插入入口；
- `SaveStatus`：clean、dirty、saving、saved、error、conflict；
- `PreviewPane`：接入 `MarkdownRenderer` 的只读预览区；
- `EditorModeSwitcher`：source、preview、split 三种模式的受控切换。

具体内核采用可选 adapter，不进入 `@wzrhine/react`。首期只要求源码编辑和 Markdown 预览，完全 WYSIWYM 另走独立 ADR 和实验。

### 3.3 写作工作台 recipe

首期工作台使用现有组件组合，不先增加新的全局布局组件：

```text
Workbench
├── NavRail
├── Tree                         文件树
├── DocumentTabs                 文档标签
├── EditorToolbar                格式和模式操作
├── EditorSurface                源码编辑
├── PreviewPane                  Markdown 预览
├── SectionIndex                 章节目录
└── SaveStatus                   保存状态
```

建议提供三个 recipe：

| Recipe | 用途 | 必须状态 |
| --- | --- | --- |
| `WritingWorkbench` | 文件树、标签、编辑和目录的完整组合 | 初始、加载、空文档、编辑中、保存中、保存失败、冲突 |
| `EditorPreviewSplit` | 独立嵌入式编辑/预览双栏 | source、preview、split、只读、窄容器降级 |
| `ReadingLayout` | 长文阅读、目录、来源和附件 | loading、空、错误、图片失败、无目录 |

Recipe 只组合公开 API 和宿主 slots，不持有文件系统、路由、查询缓存或业务权限。

## 4. 状态和数据合同

首期以 Markdown 原文作为唯一事实源。编辑器内部文档对象、语法树和选区属于临时状态，不能替代宿主的 `source`。

```ts
type DocumentView = {
  id: string;
  title: string;
  source: string;
  mode: 'source' | 'preview' | 'split';
  readOnly?: boolean;
  revision?: string;
  selection?: { from: number; to: number };
  saveStatus: 'clean' | 'dirty' | 'saving' | 'saved' | 'error' | 'conflict';
};

type DocumentActions = {
  onChange?: (source: string) => void;
  onSelectionChange?: (selection: { from: number; to: number }) => void;
  onSave?: () => void | Promise<void>;
  onModeChange?: (mode: DocumentView['mode']) => void;
  onOpenLink?: (href: string) => void;
  onInsertAsset?: () => void;
};
```

| 状态 | 所有者 | 公共层职责 |
| --- | --- | --- |
| 原文、文档 ID、revision | 调用者 | 受控输入和稳定 identity |
| 光标、选区、组合输入 | 编辑器适配器 | 反馈变化，不能替宿主保存 |
| 保存状态、冲突、重试 | 调用者 | 只呈现事实和发出操作意图 |
| 目录数据 | `MarkdownDocument` 派生 | 生成稳定章节数据，主动导航由调用者确认 |
| 当前模式 | 调用者 | `source` / `preview` / `split` 受控切换 |
| 标签顺序和打开文档 | 工作台宿主 | `DocumentTabs` 只呈现和回调 |
| 命令注册和快捷键作用域 | 宿主 recipe | 公共组件不建立全局 command store |

## 5. 交互、可访问性与响应式

- 编辑器文本区必须是实际可输入元素或编辑器内核提供的等价语义，不使用 `div onClick` 模拟输入。
- IME 组合期间，Enter、Backspace 和格式命令不能误提交或破坏选区。
- 工具栏使用可见的 `focus-visible`；关闭文档后焦点回到文档标签或触发元素。
- 保存状态使用 `aria-live` 合并播报，不能逐字符播报。
- 编辑器加载失败时保留原文或只读预览，并提供重试；不能显示空白面板。
- reduced-motion 下不使用光标跳动、持续扫描或大幅面板位移。
- 320/390：单列，文件树和目录改为 Drawer/Popover；
- 768：允许编辑区与预览区二选一或上下排列；
- 1280/1920：三栏工作台和可调整侧栏；
- 长中文、英文长词、路径和代码块必须换行或局部滚动，不撑破页面。

## 6. 性能、SSR 和安全

- 编辑器层和 parser/highlighter 使用可选入口或动态加载；
- 不在模块顶层读取 `window`、`document`、文件 API 或存储；
- SSR 首屏可输出只读预览或普通文本，客户端再挂载编辑器；
- 首期不承诺无限长文档或虚拟化，先用长文 fixture 测量输入延迟、解析时间和 DOM 数量；
- 对象 URL、Worker、监听器、定时器和异步结果都有卸载释放路径；
- 外部内容按不可信内容处理，HTML、链接、图片和附件访问必须经过明确策略。

## 7. 开发和发布管理

### 7.1 需求和决策

- 本文件作为整体架构设计；
- 三份需求卡分别记录内容层、编辑器层和工作台 recipe；
- 新包、新编辑器内核、Markdown 执行边界和许可证先建立 ADR；
- 需求状态保持 `Triaged` 或 `Backlog`，未创建实现任务前不写 `Scheduled`。

### 7.2 实施顺序

1. 内容层安全策略、标题解析和 Markdown renderer 合同；
2. 内容层参考场景和 `ReadingLayout` recipe；
3. `Toolbar`、`ToggleButton` 等基础交互能力；
4. 编辑器宿主合同和源码编辑 adapter；
5. `DocumentTabs`、`SaveStatus`、`EditorPreviewSplit`；
6. `WritingWorkbench` 完整 recipe；
7. 评估 WYSIWYM、搜索替换、反向链接、标签和属性面板。

### 7.3 每个组件的完成定义

必须提供用途、非用途、受控行为、状态矩阵、键盘和焦点、IME、主题/密度、reduced-motion、SSR、资源释放、响应式、文档、API report、包体和真实打包安装证据。

工作台 recipe 必须提供可运行参考场景，但不把示例数据、文件系统和保存服务伪装成公共能力。

## 8. 非目标与开放决策

本方案暂不包含：

- 多人协同、实时光标和冲突自动合并；
- 知识库索引、反向链接数据库和图谱；
- 完整 PDF/Office 引擎；
- 节点图、Canvas、看板和块级拖拽；
- 插件市场和运行时下载编辑器；
- 为了“完整”而新增通用布局、全局 Store 或路由器。

待确认的架构决策只有一项：是否在 R4 之前保持“Markdown 原文 + 源码编辑 + 预览”路线，不提前承诺完全 WYSIWYM。未确认前，编辑器层保持 engine-neutral。

## 9. 概念参考图

以下图片位于项目 `.tmp`，只用于设计讨论，不属于发布资产：

- `.tmp/writing-workbench-desktop.png`：三栏工作台；
- `.tmp/writing-workbench-split-editor.png`：源码/预览双栏；
- `.tmp/writing-workbench-reading-mode.png`：长文阅读、目录和来源。
