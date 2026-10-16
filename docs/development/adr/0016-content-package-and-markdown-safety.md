# ADR-0016 · Markdown 内容包与安全边界

- 状态：Accepted for R2 implementation planning
- 日期：2026-10-16
- 范围：`@wzrhine/content` 候选包；不改变 `@wzrhine/react`、`@wzrhine/agent` 或编辑器层

## Context

WzRhineLab-UI 需要统一呈现 Markdown 文章、笔记、代码、引用和图片。现有 `@wzrhine/react` 提供通用交互，`@wzrhine/agent` 提供 Agent 领域文件和消息视图，但没有可跨领域复用的 Markdown 内容合同。把 parser、HTML 执行、文件读取或编辑器内核放进基础 React 包会扩大依赖链和安全边界。

## Decision

建立独立的可选 `@wzrhine/content` 包，首期提供只读内容能力：

- `MarkdownRenderer` 使用 `react-markdown` 与 `remark-gfm`；
- 原始 HTML 默认跳过，不提供首版 `allowRawHtml` 开关；
- 链接和图片统一经过纯函数 URL 策略；允许相对路径、锚点、`http`、`https`、`mailto`、`tel`，拒绝 `javascript`、`vbscript`、`file`、未知协议和图片 `data:` URL；
- 代码块使用独立 `CodeBlock`，高亮内容通过 `children` 或 renderer 注入，不内置高亮引擎；
- 标题索引使用纯函数生成稳定 ID，供 `SectionIndex` 或其他目录 UI 消费；
- 文件、网络、存储、对象 URL、Worker、权限和业务动作由宿主提供；
- 包通过 `@wzrhine/react` peer 复用按钮、Provider、tokens 和可访问行为，但不直接依赖 Base UI 或 Agent 包；
- Markdown 原文保持唯一事实源；本 ADR 不建立编辑器状态、保存服务或 WYSIWYM 文档模型。

## Dependency and licensing

`react-markdown` 与 `remark-gfm` 作为包运行时依赖，许可证在 `license:audit` 中按真实依赖树核对。内容包不引入 `rehype-raw`、高亮引擎、文件系统、网络客户端或编辑器内核。任何新增 parser、sanitize、Worker 或编辑器依赖都需要新的 ADR 或补充本决策。

## Consequences

优点：内容层可以独立安装和 tree-shake；安全策略集中维护；Agent、阅读页和未来工作台可以共享 renderer 合同。代价：渲染器不会自动支持任意 HTML 或任意 Markdown 扩展；需要宿主为图片、链接和高亮提供明确适配；WYSIWYM 仍需后续独立的 editor 包和决策。

## Verification

实现必须覆盖：HTML 不执行、危险 URL 不激活、重复/CJK 标题稳定、长代码局部滚动、SSR/hydration、CSS 隔离、真实 tarball 安装、许可证和包体预算。
