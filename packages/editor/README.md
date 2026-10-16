# @wzrhine/editor

Engine-neutral Markdown editor contracts and UI primitives. The package is an R4 candidate and does not yet provide a complete WYSIWYM editor.
# @wzrhine/editor

Markdown 编辑器层的 engine-neutral 合同、源码编辑 UI 和可选 CodeMirror 6 adapter。当前包支持源码编辑、只读预览、source/preview/split 模式、文档标签、工具栏命令和保存状态展示；完整 WYSIWYM 文档模型暂不属于本包。

## 安装

只使用合同和 UI 组件时：

```sh
pnpm add @wzrhine/editor @wzrhine/content @wzrhine/react @wzrhine/tokens react react-dom motion
```

需要 CodeMirror 源码编辑时，再安装可选 peer：

```sh
pnpm add @codemirror/commands @codemirror/lang-markdown @codemirror/search @codemirror/state @codemirror/view
```

```tsx
import '@wzrhine/tokens/styles.css';
import '@wzrhine/react/styles.css';
import '@wzrhine/content/styles.css';
import '@wzrhine/editor/styles.css';
import { EditorModeView } from '@wzrhine/editor';
import { createCodeMirrorAdapter } from '@wzrhine/editor/codemirror';

<EditorModeView
  mode="split"
  source={markdown}
  adapter={createCodeMirrorAdapter()}
  onModeChange={setMode}
  onChange={({ source }) => setMarkdown(source)}
/>
```

## 数据边界

`source` 是唯一事实源。editor 只把文本、selection、composition、命令和状态回传给宿主，不读取文件、不发起网络请求、不保存文档，也不决定冲突合并。`PreviewPane` 委托 `@wzrhine/content/MarkdownRenderer`，因此预览与源码共享同一个 Markdown 字符串。

`@wzrhine/editor` 根入口不加载 CodeMirror；只有 `@wzrhine/editor/codemirror` 会加载可选编辑内核。SSR 可以使用根入口和 `EditorSurface` 的 fallback DOM，adapter 只在客户端创建编辑器实例。

## 键盘、IME 与状态

- `EditorToolbar` 传递 engine-neutral `EditorCommand`，只读或 composition 期间会禁用格式化动作；撤销/重做由 adapter 的历史栈处理。
- `DocumentTabs` 是受控标签集合，关闭保护由调用者通过 `onCloseRequest` 决定。
- `SaveStatus` 只展示 `clean`、`dirty`、`saving`、`saved`、`error`、`conflict`；保存、重试和冲突解决动作由调用者提供。
- 完整 WYSIWYM、协同光标、反向链接、图谱、文件系统和持久化服务由后续宿主 recipe 负责。

## Showcase

本地静态 fixture 见 `apps/docs` 的 `#/archive/editor`，展示 `DocumentTabs`、`EditorToolbar`、CodeMirror、`PreviewPane`、三种模式和响应式布局。页面不访问本地文件或服务端。
