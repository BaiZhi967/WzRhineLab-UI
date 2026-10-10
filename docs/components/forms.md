# Choice controls · Textarea · Fieldset · Form

- 状态：**Beta（M7）** · 底座：Base UI Checkbox / CheckboxGroup / Radio / RadioGroup / Switch / Field / Fieldset / Form / Separator（ADR-0001）
- 源码：`packages/react/src/components/{Checkbox,Radio,Switch,Textarea,Fieldset,Form,Separator,VisuallyHidden}.tsx`，样式 `forms.css` · Showcase：`#/components/choice`，场景「设置表单」

## 用途 / 非用途
| 组件 | 用于 | 不用于 |
| --- | --- | --- |
| `Checkbox` | 独立的是 / 否选项、需要勾选的确认项；在 `CheckboxGroup` 中多选 | 立即生效的开关（用 `Switch`） |
| `CheckboxGroup` | 一组可多选、全部可见的选项 | 超过约 8 项（考虑 Select 多选或筛选列表） |
| `RadioGroup` + `Radio` | 2–6 个互斥且全部可见的选项 | 超过 6 项（用 `Select`）；只有一个选项 |
| `Switch` | 立即生效的设置（`role="switch"`） | 提交后才生效、需要「必填」的选项（用 `Checkbox`） |
| `Textarea` | 多行文本，可计数、可自动增高 | 单行（用 `Input`）；富文本 |
| `Fieldset` | 给一组相关字段加可见标题，整组禁用 | 仅为视觉分隔（用 `Separator` 或标题） |
| `Form` | 提交时统一校验、聚焦第一个错误、接收服务端错误 | 不需要校验的简单搜索框（原生 `<form>` 即可） |
| `Separator` / `VisuallyHidden` | 内容分组之间的细线 / 只给读屏的文字 | 作为交互区域唯一边界（DESIGN.md §3）；隐藏可聚焦控件 |

## API
```tsx
<Form onSubmit={save} errors={serverErrors}>
  <RadioGroup label="复核结论" name="verdict" required error="请选择复核结论。" orientation="horizontal">
    <Radio value="pass" label="通过" />
    <Radio value="revise" label="退回修改" description="需注明原因。" />
  </RadioGroup>
  <CheckboxGroup label="问题类型" name="issues" optional defaultValue={[]}>
    <Checkbox value="data" label="数据缺失" />
    <Checkbox value="format" label="格式不符" />
  </CheckboxGroup>
  <Field label="复核意见" required error="请填写复核意见。" errorMatch="valueMissing">
    <Textarea name="note" required rows={3} maxLength={200} showCount autoResize maxRows={8} />
  </Field>
  <Switch name="notify" label="通知记录负责人" defaultChecked />
  <Checkbox name="ack" value="yes" required label="我已核对样本编号" error="提交前请确认。" />
  <Button type="submit">提交复核</Button>
</Form>
```

| 组件 | 关键属性 |
| --- | --- |
| `Checkbox` | `label` *必填*、`hideLabel`、`description`、`checked` / `defaultChecked` / `onCheckedChange`、`indeterminate`、`name` + `value`、`required` + `error`、`invalid`、`disabled`、`readOnly` |
| `CheckboxGroup` | `label` *必填*（legend）、`name`、`value` / `defaultValue` / `onValueChange(string[])`、`validate`、`error` / `invalid`、`required` / `optional`（视觉标记）、`orientation`、`disabled` |
| `RadioGroup` | `label` *必填*、`name`、`value` / `defaultValue` / `onValueChange`、`required` + `error`、`invalid`、`orientation`、`disabled`、`readOnly` |
| `Radio` | `value` *必填*、`label` *必填*、`description`、`disabled`；只能放在 `RadioGroup` 内（否则 Base UI 抛错） |
| `Switch` | `label` *必填*、`hideLabel`、`description`、`checked` / `defaultChecked` / `onCheckedChange`、`name`（选中时提交 `on`，可用 `value` 改）、`disabled`、`readOnly`；没有 `required` |
| `Textarea` | `rows`（默认 3）、`autoResize` + `maxRows`、`resize`（`vertical` / `none`）、`maxLength` + `showCount`、`mono`、`value` / `defaultValue` / `onValueChange`、`readOnly`、`disabled`、`invalid` |
| `Fieldset` | `legend` *必填*、`description`、`disabled`（作用于组内所有控件，包括 Base UI 控件） |
| `Form` | 原生 form 属性 + `errors`（`{ [name]: string \| string[] }`）、`onFormSubmit(values)`、`validationMode`、`actionsRef` |
| `Separator` | `orientation`、`tone`（`subtle` / `default` / `strong`）、`decorative`（移出可访问树） |
| `VisuallyHidden` | `as`、`focusable`（获得焦点时显现，用于跳转链接） |

可访问名称只能来自 `label`：`aria-label` / `aria-labelledby` 在类型上被禁止，避免读屏名称与可见文字不一致。表格行等已有上下文的地方用 `hideLabel`。

## 受控行为
与其他组件一致：`value` / `defaultValue` / `onValueChange`（组、Textarea），`checked` / `defaultChecked` / `onCheckedChange`（Checkbox、Switch）。`CheckboxGroup` 的值是 `string[]`，`RadioGroup` 的值是选中项的 `value`。

## 表单提交
值通过 Base UI 的隐藏原生 `<input>` 进入 `FormData`，服务端看到的和普通表单一样（单测与 E2E 都直接断言 `FormData`）：
- Checkbox：选中时提交 `name=value`（`value` 缺省为 `on`）；未选中不提交。
- CheckboxGroup：每个选中项提交一次 `name=value`。
- RadioGroup：提交 `name=选中值`；未选不提交。
- Switch：选中时提交 `name=on`。
- Textarea：原样提交，保留换行。

`Form` 在提交时校验所有字段、显示错误、把焦点移到第一个错误控件，全部通过后才调用 `onSubmit`。服务端返回的错误传给 `errors`，按 `name` 显示在对应的 Field / CheckboxGroup / RadioGroup / Checkbox 下（替换静态 `error` 文本），用户修改该字段后自动清除。用原生 `<form>` 也可以，但必填错误只会在用户改动后逐项出现（Base UI 降噪，见 ADR-0001），提交时不会统一显示。

## 可访问性与键盘
- 整行（控件 + 文字）是一个 `<label>`：文字就是名称，也是点击区域；行高至少 `--rl-control-height-sm`（32px），满足 WCAG 2.2 目标尺寸 24×24。
- 组用 `fieldset` 语义（`role="group"` / `radiogroup`），legend 命名，组描述与错误进入组和每个选项的 `aria-describedby`。
- 必填星号 `aria-hidden`，必填语义来自 `aria-required` / 原生 `required`；星号用 CSS 中的不换行字符粘在最后一个字上。
- 键盘：Checkbox / Switch 用 Space 切换；RadioGroup 只有一个 Tab 停靠点（选中项，未选时为第一项），方向键移动并选中，跳过禁用项、首尾循环。
- 边界：未选中控件使用 `--rl-border-strong` 2px 边框（与 Input 相同的 3:1 非文本对比基线），选中态改为实心深墨填充；焦点环 2px `--rl-focus`。
- forced-colors：边框 `ButtonText`、选中 `Highlight`、禁用 `GrayText`。

## 状态矩阵
default · hover（边框加深）· focus-visible · checked · indeterminate（Checkbox）· invalid（红边框 + 图标与文字错误）· readOnly（可聚焦、不可切换，浅底）· disabled（移出 Tab 顺序）· 长中文 / 无空格长串（文字列内换行，控件不被挤压）· 横向排列（自动换行）。

## Motion 与减动
- Checkbox 勾号：`opacity` 120ms（`--rl-motion-fast`）。
- Radio 圆点：`opacity` + `scale` 120ms。
- Switch 滑块：`translate` 200ms（`--rl-motion-base`）。用 CSS 过渡，连续快速切换时从当前位置继续，不排队。
- 减动（系统设置或 `RhineProvider motion="reduce"`）：时长 token 归零，Radio 与 Switch 额外设为 `transition: none`；E2E 断言滑块 `transition-duration` 为 0。

## 主题与密度
颜色全部来自语义 token，明暗主题自动适配。控件尺寸固定为 `--rl-icon-size-lg`（20px），行高跟随 `--rl-control-height-sm`，紧凑密度下行高缩为 28px。Textarea 的行高按 `1lh` 计算，跟随字体 token。

## 用例与反例
- ✅ 设置页「启用双人复核」用 Switch：切换即生效。
- ✅ 提交前「我已核对」用必填 Checkbox。
- ❌ 用 Switch 表示「同意条款」：需要提交时校验，应为 Checkbox。
- ❌ 7 个以上互斥选项用 RadioGroup：改用 Select。
- ❌ 只用 Separator 分隔两个可点击区域：交互边界应由控件自身的边框和焦点表达。

## 已知限制
- `Textarea autoResize` 依赖 CSS `field-sizing: content`（Chromium 123+）。Firefox / WebKit 保持 `rows` 高度，可手动拉伸。
- `CheckboxGroup` 没有原生的「至少选一项」，需用 `validate` 实现；`required` 只是视觉标记。
- `CheckboxGroup` 的 `aria-invalid` 设在每个选项上（Base UI 行为），组本身带 `data-invalid`。
- DataTable 的行选择仍使用原生 checkbox（`accent-color`），没有改用 `Checkbox`。原因：行内控件需要在紧凑密度下与 28px 行高对齐，改动会影响 M3 的视觉基线与已有 API。留待 M8 与分页一并评估。

## 测试
- 单测：`packages/react/test/forms.test.tsx`（35 项：名称、描述、错误、键盘、受控、FormData、禁用、只读、Fieldset 禁用传递、减动、Form 服务端错误），`types.test-d.tsx` 中 M7 类型反向测试。
- E2E：`apps/docs/e2e/choice.spec.ts`（11 项：Form 提交与聚焦、键盘、Fieldset、焦点环、320px 换行与对齐、必填星号不单独换行、减动、明暗 axe），`archive.spec.ts`「设置表单」场景新增 1 项；三内核运行。
- 视觉基线：`choice-*` 页面四张，States 近景明 / 暗 / forced-colors 三张。

## 变更记录
- 0.0.0 · 2026-10-10：首次加入（M7）。`Field` 内部改为与新控件共用标签与错误部件，外观与 API 不变；带 `name` 的 Field 现在会显示 `<Form errors>` 中的服务端错误。
