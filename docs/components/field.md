# Field & Input

- 状态：**Beta（M1-B）** · 底座：Base UI Field / Input（ADR-0001）
- 源码：`packages/react/src/components/Field.tsx`、`Input.tsx` · Showcase：`#/components/field`

## 用途 / 非用途
用于单行文本、编号、数值输入及其标签、说明和错误。**不用于**：多行文本（`Textarea`）、选择（`Select`、`RadioGroup`）、开关（`Switch`），见 [forms.md](forms.md)。

## API
```tsx
<Field label="档案编号" description="格式 ARC-0000。" error="格式不正确。" required
       validationMode="onBlur" validate={(v) => (/^ARC-\d{4}$/.test(String(v)) ? null : '格式不正确。')}>
  <Input name="recordId" required mono placeholder="ARC-0000" />
</Field>
```

| Field 属性 | 说明 |
| --- | --- |
| `label` *必填* | 渲染原生 `<label>`，自动关联控件 |
| `description` | 常驻提示，进入 `aria-describedby` |
| `error` / `errorMatch` | 错误文本；默认任何原生校验失败时显示，`errorMatch` 限定某个 ValidityState 键 |
| `invalid` | 外部校验结果（服务端、表单库）；与 `error` 搭配时始终显示错误 |
| `validate` / `validationMode` | Base UI 校验：`onSubmit`（默认）/`onBlur`/`onChange` |
| `required` / `optional` | 视觉标记；原生必填仍需在 `Input` 上设置 `required` |
| `disabled` | 传递到控件，移出 Tab 顺序 |
| `layout` | `stacked`（默认）/ `inline`（标签列宽 `--rl-field-label-width`） |

| Input 属性 | 说明 |
| --- | --- |
| `size` | `sm` / `md` / `lg`，高度来自 `--rl-control-height-*` |
| `prefix` | 装饰图标，`aria-hidden` |
| `suffix` | 单位文字（如 `mm`），加入 `aria-describedby` 被读屏读出 |
| `mono` | 等宽数值、编号 |
| `readOnly` | 可聚焦、可复制，`--rl-bg-readonly` 底色 |
| `invalid` | Field 之外单独使用时标记无效 |
| `value` / `defaultValue` / `onValueChange` | 受控 / 非受控 |

## 可访问性与键盘
- 名称：Field 的 label；单独使用 Input 时必须提供 `aria-label`。
- 描述顺序：控件自身的 `aria-describedby` → suffix → description → error。
- 错误以「三角图标 + 文字 + 红色边框加粗」表达，不只依赖颜色；`aria-invalid` 同步。
- Base UI 降噪：未修改过的必填项在失焦时不报 `valueMissing`，提交时仍会校验。
- 键盘：Tab 进入/离开；点击标签聚焦控件；disabled 不可聚焦，readOnly 可聚焦。

## 状态矩阵
default · hover（边框加深）· focus-visible（外包 2px 焦点环，包含前后缀）· invalid · readOnly · disabled · 带前缀/后缀 · inline 布局。

## Motion
仅边框/底色 120ms 过渡（`--rl-motion-fast`），减动时为 0。错误出现不做位移动画。

## 测试
`packages/react/test/Field-Input.test.tsx`（11 项）、`apps/docs/e2e/fields.spec.ts`（6 项 Field 相关）、`base-ui-spike` 中 Field 项。

## 变更记录
- 0.0.0 · 2026-10-09：首次加入。
