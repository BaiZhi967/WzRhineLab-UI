# COMPONENTS · 组件设计与 API 规范（Draft 0.1）

## 层级
1. **Primitives**：Button, IconButton, Text, Surface, Separator, VisuallyHidden。
2. **Fields**：Field, Input, Textarea, Checkbox, Radio, Switch, Select。
3. **Navigation / Overlay**：Tabs, Breadcrumb, Menu, Popover, Tooltip, Dialog, Toast。
4. **Data**：Table, Pagination, Badge, StatusIndicator, Progress, Stat。
5. **Rhine Patterns（原创科研/档案语法）**：RecordHeader, ArchiveCard, MetadataList, InstrumentPanel, SectionIndex, ExperimentTimeline。
6. **Optional showcase**：ArchiveReveal, OrbitalDiagram, ScanSurface。不得让普通组件依赖 WebGL。

## 命名与 API
使用 PascalCase 组件名、camelCase 属性；导出所有公开 Props 类型。状态语义要与外观分离，例如 `variant="primary"` 描述按钮视觉，`status="warning"` 描述业务状态。支持原生 DOM Props、`ref`、`className`、`data-slot`（必要时）。优先 CSS tokens 而不是用海量布尔属性改变视觉。受控/非受控 API 必须有一致 `value/defaultValue/onValueChange` 模式。

### 标准 Button 合约
```tsx
<Button variant="primary" size="md" loading={saving} onClick={save}>
  保存记录
</Button>
```
要求 type=button 默认防止表单误提交；loading 时阻止重复提交、保留可读名称；icon-only 必须提供可访问名称；disabled 必须禁用交互；按压动效不应影响布局或点击命中。

### 标准档案卡
```tsx
<ArchiveCard id="ARC-1024" title="分子结构观测" category="实验记录"
  status="review" updatedAt="2026-10-09" onOpen={openRecord} />
```
必须可显示真实 ID、标题、类别、状态及时间，任意缺省字段需安全隐藏。不要生成伪造时间、设备读数或随机权限信息。

## 设计状态与边界
组件需在 default/hover/focus-visible/pressed/selected/disabled/loading/invalid/empty 适用状态下逐一评审；至少覆盖窄屏长中文、英文长词、浏览器缩放 200%、高对比/减动、键盘与屏幕阅读器基本语义。图标文字组合必须中心对齐，按钮不因 loading 内容变更大幅抖动。

## 技术边界
复杂交互（Dialog/Select/Menu/Popover/Tabs）优先使用成熟 headless 原语，M1 通过 ADR 选定 Base UI 或 React Aria Components 或 Radix，避免同时引入三套。底座不是视觉框架，所有 UI 风格仍来自项目 tokens。Motion 作为可选行为层，基础组件没有 JS 动画时仍可用。

## 组件文档模板
每个组件文档必须具备：用途 / 非用途 / API / 受控行为 / 可访问性 / 键盘 / 状态矩阵 / Motion 时序 / reduce 方案 / 主题与密度 / 用例与反例 / 测试清单 / 变更记录。

## API 稳定政策
`0.x` 允许破坏性改动但必须在 changelog 说明；M5 才冻结稳定导出。禁止为迁就单个设计稿引入不可组合的布局 API。复杂高阶组件应将业务数据映射交给使用者（render props/slots/children），避免与具体后端数据模型耦合。
