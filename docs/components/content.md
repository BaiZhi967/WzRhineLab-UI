# Markdown 内容层（@wzrhine/content）

- 状态：**R2 / 0.4.x 候选** · ADR：[0016](../development/adr/0016-content-package-and-markdown-safety.md) · 设计方案：[Markdown 内容层、编辑器层与写作工作台设计方案](../superpowers/specs/2026-10-16-markdown-writing-workbench-design.md)
- 定位：只读 Markdown 内容渲染、标题索引和代码块；不包含编辑器、文件系统、保存服务或 WYSIWYM。
- 源码：`packages/content/src/` · Showcase：计划加入 `#/archive/content`

## 用途 / 非用途

| 用于 | 不用于 |
| --- | --- |
| Markdown 文章、笔记、Agent 产物和侧栏预览 | 长文档编辑、撤销重做、光标和选区 |
| GFM 表格、任务列表、引用、链接、图片和代码围栏 | 文件读取、远程请求、下载和权限判断 |
| 标题 ID 和目录数据 | 协同编辑、反向链接、图谱、PDF/Office |

## 安装

```sh
pnpm add @wzrhine/content @wzrhine/react @wzrhine/tokens react react-dom motion
```

```tsx
import '@wzrhine/tokens/styles.css';
import '@wzrhine/react/styles.css';
import '@wzrhine/content/styles.css';
import { MarkdownRenderer } from '@wzrhine/content';

<MarkdownRenderer source={'# 研究记录\n\n正文内容。'} />;
```

## `MarkdownRenderer`

`MarkdownRenderer` 受控接收 `source`，使用 `remark-gfm` 支持表格、任务列表和删除线。原始 HTML 默认跳过；链接和图片经过 URL 策略，允许相对路径、锚点、`http`、`https`、`mailto` 和 `tel`，拒绝危险协议。代码围栏使用 `CodeBlock`，高亮内容由 `components.code` 或 children 注入。

```tsx
<MarkdownRenderer
  source={source}
  onLinkActivate={(href) => openPreview(href)}
  renderImage={({ src, alt }) => <AuthorizedImage src={src} alt={alt} />}
/>
```

状态由调用者提供：

```tsx
<MarkdownRenderer source="" status="loading" />
<MarkdownRenderer source="" status="empty" />
<MarkdownRenderer source="" status="error" error={<p>读取失败</p>} onRetry={reload} retryLabel="重试" />
```

## `CodeBlock`

代码块使用 `figure/figcaption/pre/code` 语义结构，代码滚动区可聚焦，行号不参与复制。`onCopy` 可注入宿主复制动作；未提供时使用浏览器 Clipboard API。复制成功和失败通过 `role="status"` 播报，不移动焦点。

## 标题索引和 URL 策略

```ts
import { extractHeadings, resolveMarkdownUrl } from '@wzrhine/content';

const sections = extractHeadings(source);
const href = resolveMarkdownUrl(input, 'link');
```

`extractHeadings` 支持 ATX 和 setext 标题，忽略围栏代码，重复标题自动追加稳定后缀。标题数据可以直接转换给 `@wzrhine/patterns` 的 `SectionIndex`。

## 可访问性与响应式

- 标题使用真实 heading 层级并生成稳定 ID；
- 表格使用原生 table 语义，代码块使用可聚焦滚动区；
- 加载、错误、空内容和图片失败均保留可读状态；
- `reduced-motion` 不增加持续动画；
- 长中文、英文长词、长代码和表格在 320/390/768/1280/1920 宽度下不得撑破页面；
- SSR 不读取浏览器 API，图片 resolver 和对象 URL 由调用方负责。

## 已知限制

当前包只负责只读内容层。编辑器、文档标签、保存状态、写作工作台和完整 WYSIWYM 将在后续 `@wzrhine/editor` 与 recipe 工作包中单独设计。
