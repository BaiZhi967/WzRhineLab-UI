import * as React from 'react';
import {
  Button,
  Checkbox,
  CheckboxGroup,
  Field,
  Fieldset,
  Form,
  Input,
  Radio,
  RadioGroup,
  Separator,
  StatusBadge,
  Switch,
  Textarea,
} from '@wzrhine/react';
import { Playground } from '../ui/Playground';
import { PageHeader, Specimen, SpecimenGrid } from '../ui/Specimen';
import { Segmented, TextField, Toggle } from '../ui/controls';

type Kind = 'checkbox' | 'radio' | 'switch';

function ChoicePlayground() {
  const [kind, setKind] = React.useState<Kind>('checkbox');
  const [orientation, setOrientation] = React.useState<'vertical' | 'horizontal'>('vertical');
  const [disabled, setDisabled] = React.useState(false);
  const [invalid, setInvalid] = React.useState(false);
  const [description, setDescription] = React.useState(true);
  const [label, setLabel] = React.useState('通知方式');

  const desc = description ? '\n  description="可在个人设置中修改。"' : '';
  const flags = `${disabled ? '\n  disabled' : ''}${invalid ? '\n  invalid\n  error="请至少选择一项。"' : ''}`;
  const orient = orientation !== 'vertical' ? `\n  orientation="${orientation}"` : '';
  const code =
    kind === 'checkbox'
      ? `<CheckboxGroup\n  label="${label || '…'}"\n  name="channels"\n  defaultValue={['email']}${desc}${orient}${flags}\n>\n  <Checkbox value="email" label="邮件" />\n  <Checkbox value="digest" label="每周摘要" />\n  <Checkbox value="sms" label="短信" />\n</CheckboxGroup>`
      : kind === 'radio'
        ? `<RadioGroup\n  label="${label || '…'}"\n  name="channel"\n  defaultValue="email"${desc}${orient}${flags}\n>\n  <Radio value="email" label="邮件" />\n  <Radio value="digest" label="每周摘要" />\n  <Radio value="sms" label="短信" />\n</RadioGroup>`
        : `<Switch\n  label="${label || '…'}"${description ? '\n  description="可在个人设置中修改。"' : ''}${disabled ? '\n  disabled' : ''}\n/>`;

  const groupProps = {
    label: label || '…',
    description: description ? '可在个人设置中修改。' : undefined,
    orientation,
    disabled,
    invalid,
    error: '请至少选择一项。',
  };

  return (
    <Playground
      id="choice-playground"
      title="Choice controls"
      code={code}
      controls={
        <>
          <Segmented
            legend="control"
            name="pg-choice-kind"
            value={kind}
            onChange={setKind}
            options={[
              { value: 'checkbox', label: 'checkbox' },
              { value: 'radio', label: 'radio' },
              { value: 'switch', label: 'switch' },
            ]}
          />
          <Segmented
            legend="orientation"
            name="pg-choice-orientation"
            value={orientation}
            onChange={setOrientation}
            options={[
              { value: 'vertical', label: 'vertical' },
              { value: 'horizontal', label: 'horizontal' },
            ]}
          />
          <Toggle label="description" checked={description} onChange={setDescription} />
          <Toggle label="invalid（外部错误）" checked={invalid} onChange={setInvalid} description="Switch 不适用" />
          <Toggle label="disabled" checked={disabled} onChange={setDisabled} />
          <TextField label="label" value={label} onChange={setLabel} />
        </>
      }
    >
      <div className="sc-field-frame">
        {kind === 'checkbox' && (
          <CheckboxGroup {...groupProps} name="pg-channels" defaultValue={['email']}>
            <Checkbox value="email" label="邮件" />
            <Checkbox value="digest" label="每周摘要" />
            <Checkbox value="sms" label="短信" />
          </CheckboxGroup>
        )}
        {kind === 'radio' && (
          <RadioGroup {...groupProps} name="pg-channel" defaultValue="email">
            <Radio value="email" label="邮件" />
            <Radio value="digest" label="每周摘要" />
            <Radio value="sms" label="短信" />
          </RadioGroup>
        )}
        {kind === 'switch' && (
          <Switch label={label || '…'} description={description ? '可在个人设置中修改。' : undefined} disabled={disabled} />
        )}
      </div>
    </Playground>
  );
}

type Submitted = Array<[string, string]>;

function ReviewForm() {
  const [submitted, setSubmitted] = React.useState<Submitted | null>(null);
  return (
    <Form
      className="sc-form"
      aria-labelledby="review-form-title"
      onSubmit={(e) => {
        e.preventDefault();
        setSubmitted([...new FormData(e.currentTarget).entries()].map(([k, v]) => [k, String(v)]));
      }}
    >
      <h3 id="review-form-title" className="sc-subhead sc-form__title">
        提交复核（演示）
      </h3>
      <RadioGroup label="复核结论" name="verdict" required error="请选择复核结论。" orientation="horizontal">
        <Radio value="pass" label="通过" />
        <Radio value="revise" label="退回修改" />
        <Radio value="reject" label="不通过" />
      </RadioGroup>
      <CheckboxGroup
        label="问题类型"
        name="issues"
        optional
        description="退回或不通过时建议勾选。"
        orientation="horizontal"
      >
        <Checkbox value="data" label="数据缺失" />
        <Checkbox value="format" label="格式不符" />
        <Checkbox value="source" label="来源不明" />
      </CheckboxGroup>
      <Field label="复核意见" required error="请填写复核意见。" errorMatch="valueMissing">
        <Textarea name="note" required rows={3} maxLength={200} showCount autoResize maxRows={8} />
      </Field>
      <Switch name="notify" label="通知记录负责人" defaultChecked />
      <Checkbox name="ack" value="yes" required label="我已核对样本编号与原始记录一致" error="提交前请确认。" />
      <div className="sc-form__actions">
        <p className="sc-small sc-form__status" role="status">
          {submitted && (
            <>
              <StatusBadge status="success" size="sm">
                已提交
              </StatusBadge>{' '}
              <code>{submitted.map(([k, v]) => `${k}=${v.replace(/\n/g, '⏎')}`).join(' · ')}</code>
            </>
          )}
        </p>
        <Button type="reset" variant="ghost" onClick={() => setSubmitted(null)}>
          重置
        </Button>
        <Button type="submit">提交复核</Button>
      </div>
    </Form>
  );
}

export function ChoicePage() {
  return (
    <div className="sc-page">
      <PageHeader index="15" section="Components / Fields" title="Choice & Textarea">
        <p>
          Checkbox、RadioGroup、Switch、Textarea、Fieldset 与 Form，全部基于 Base UI（ADR-0001），与 Field 共用标签、描述与错误样式。
          整行都是 <code>&lt;label&gt;</code>，点击文字即可切换；值通过隐藏的原生 input 随表单提交。
        </p>
      </PageHeader>
      <SpecimenGrid>
        <ChoicePlayground />
        <Specimen
          id="choice-form"
          index="01"
          title="Form submission"
          note="Form 在提交时校验全部字段并把焦点移到第一个错误项；下方状态行显示浏览器实际提交的 FormData。"
        >
          <ReviewForm />
        </Specimen>
        <Specimen id="choice-states" index="02" title="States" span="third" align="start" note="disabled 移出 Tab 顺序；readOnly 可聚焦、不可切换。">
          <div className="sc-stack">
            <Checkbox label="未选" />
            <Checkbox label="已选" defaultChecked />
            <Checkbox label="部分选中" indeterminate />
            <Checkbox label="无效" invalid error="必须确认。" />
            <Checkbox label="禁用" disabled defaultChecked />
            <Separator tone="subtle" />
            <Switch label="关闭" />
            <Switch label="开启" defaultChecked />
            <Switch label="只读" readOnly defaultChecked />
            <Switch label="禁用" disabled />
          </div>
        </Specimen>
        <Specimen id="choice-radio" index="03" title="RadioGroup" span="third" align="start" note="方向键在组内移动并选中；禁用项被跳过。超过 6 项改用 Select。">
          <RadioGroup label="保密级别" name="demo-level" defaultValue="internal" description="决定记录的可见范围。">
            <Radio value="public" label="公开" />
            <Radio value="internal" label="内部" description="仅本机构成员可见。" />
            <Radio value="restricted" label="受限" description="需项目负责人授权。" />
            <Radio value="secret" label="机密" disabled />
          </RadioGroup>
        </Specimen>
        <Specimen id="choice-fieldset" index="04" title="Fieldset" span="third" align="start" note="disabled 作用于组内所有控件，包括 Base UI 控件。">
          <FieldsetDemo />
        </Specimen>
        <Specimen id="choice-textarea" index="05" title="Textarea" span="half" align="start" note="autoResize 依赖 CSS field-sizing（Chromium）；其他内核保持 rows 高度并可手动拉伸。">
          <div className="sc-stack">
            <Field label="摘要" description="自动增高，最多 6 行。">
              <Textarea rows={2} autoResize maxRows={6} placeholder="输入多行内容" />
            </Field>
            <Field label="原始记录" description="只读：可聚焦、可复制。">
              <Textarea readOnly mono rows={3} defaultValue={'ARC-1024 · 2026-10-09\n温度 -20 °C（示例值）'} />
            </Field>
            <Field label="禁用" disabled>
              <Textarea rows={2} defaultValue="不可编辑" />
            </Field>
          </div>
        </Specimen>
        <Specimen id="choice-long" index="06" title="Long text" span="half" align="start" note="长中文与无空格长串在文字列内换行，控件不被挤压。">
          <div className="sc-stack">
            <Checkbox
              label="在复核通过后自动将该记录及其全部附件、关联样本与历史版本一并移入长期档案库，并通知所有订阅者"
              description="此操作可以在归档后 30 天内撤销。"
            />
            <Checkbox label="ARC-1024-SAMPLE-OBSERVATION-LONG-IDENTIFIER-WITHOUT-SPACES" />
            <Switch label="对所有新建的实验记录默认启用双人复核流程，并在每周一上午汇总待办事项" />
          </div>
        </Specimen>
      </SpecimenGrid>
    </div>
  );
}

function FieldsetDemo() {
  const [locked, setLocked] = React.useState(false);
  return (
    <div className="sc-stack">
      <Switch label="锁定联系方式" checked={locked} onCheckedChange={setLocked} />
      <Fieldset legend="联系方式" description="用于接收复核提醒。" disabled={locked}>
        <Field label="邮箱">
          <Input type="email" placeholder="name@example.org" />
        </Field>
        <Checkbox label="同时抄送项目负责人" />
      </Fieldset>
    </div>
  );
}
