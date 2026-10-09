# IconButton · Text

- 状态：**Beta（M1-B）** · 源码：`packages/react/src/components/IconButton.tsx`、`Text.tsx`
- Showcase：`#/components/icon-button`、`#/components/text`

## IconButton
仅图标的原生 `<button>`。

```tsx
<IconButton icon={<Download />} label="导出档案" />
<IconButton icon={<Grid />} label="网格视图" pressed={grid} onClick={toggle} />
```

| 属性 | 说明 |
| --- | --- |
| `icon` *必填* | 装饰图标，`aria-hidden` |
| `label` 或 `aria-labelledby` *二选一必填* | 可访问名称；类型层面禁止缺省或同时提供。`label` 同时作为 `title` 悬停提示 |
| `variant` | `ghost`（默认）/ `secondary` / `primary` |
| `size` | `sm` / `md` / `lg`，命中区域 = `--rl-control-height-*`（紧凑模式最小 28px，高于 WCAG 2.2 的 24px） |
| `pressed` | 开关型工具，渲染 `aria-pressed`；视觉为 accent-subtle 底 + 深墨描边，与 hover/focus 区分 |
| `disabled` | 原生禁用 |

非用途：有可见文字的操作请用 `Button iconStart`；名称应具体（「关闭通知」而非「关闭」）。按压反馈与 Button 共用 `pressScale` / `transition.press`，减动时取消缩放。

## Text
排版原语，`variant` 映射 `--rl-type-*` 角色，`as` 决定语义元素（视觉与标题层级解耦）。

```tsx
<Text variant="eyebrow" tone="accent">REC / EXAMPLE</Text>
<Text variant="heading-3" as="h2">示例档案记录</Text>
<Text variant="meta" tone="subtle" numeric as="time" dateTime="2026-10-09">更新于 2026-10-09</Text>
```

| 属性 | 说明 |
| --- | --- |
| `variant` | display / heading-1/2/3 / body / body-sm / label / meta / mono / eyebrow |
| `as` | 语义元素；默认 display、heading-1 → h1，heading-2 → h2，heading-3 → h3，body → p，其余 span |
| `tone` | primary / muted / subtle / accent / danger / success / warning / info；状态色需配合图标或标签 |
| `truncate` | 单行省略，建议同时提供 `title` |
| `numeric` | 等宽数字（表格、元数据对齐） |

`eyebrow` 为档案编号样式（mono、大写、字距），仅用于短英文或编号，不用于中文正文。

## 测试
`packages/react/test/Text-IconButton.test.tsx`（8 项）、类型测试（IconButton 命名约束、Text variant 枚举）、`apps/docs/e2e/fields.spec.ts` 中 IconButton 项（3 项）。
