import * as React from 'react';
import { Button, Field, Input, StatusBadge } from '@wzrhine/react';
import type { InputSize } from '@wzrhine/react';
import { Search } from '../icons';
import { Playground } from '../ui/Playground';
import { PageHeader, Specimen, SpecimenGrid } from '../ui/Specimen';
import { Segmented, TextField, Toggle } from '../ui/controls';

const sizes: InputSize[] = ['sm', 'md', 'lg'];

function FieldPlayground() {
  const [size, setSize] = React.useState<InputSize>('md');
  const [layout, setLayout] = React.useState<'stacked' | 'inline'>('stacked');
  const [required, setRequired] = React.useState(true);
  const [disabled, setDisabled] = React.useState(false);
  const [readOnly, setReadOnly] = React.useState(false);
  const [invalid, setInvalid] = React.useState(false);
  const [mono, setMono] = React.useState(true);
  const [label, setLabel] = React.useState('记录编号');

  const fieldProps = [
    `label="${label || '…'}"`,
    'description="由归档系统分配，格式 ARC-0000。"',
    invalid && 'invalid',
    invalid && 'error="该编号已存在。"',
    required && 'required',
    disabled && 'disabled',
    layout !== 'stacked' && `layout="${layout}"`,
  ].filter(Boolean);
  const inputProps = [
    required && 'required',
    readOnly && 'readOnly',
    size !== 'md' && `size="${size}"`,
    mono && 'mono',
    'placeholder="ARC-0000"',
  ].filter(Boolean);

  return (
    <Playground
      id="field-playground"
      title="Field + Input"
      code={`<Field\n  ${fieldProps.join('\n  ')}\n>\n  <Input ${inputProps.join(' ')} />\n</Field>`}
      controls={
        <>
          <Segmented
            legend="size"
            name="pg-field-size"
            value={size}
            onChange={setSize}
            options={sizes.map((s) => ({ value: s, label: s }))}
          />
          <Segmented
            legend="layout"
            name="pg-field-layout"
            value={layout}
            onChange={setLayout}
            options={[
              { value: 'stacked', label: 'stacked' },
              { value: 'inline', label: 'inline' },
            ]}
          />
          <Toggle label="required" checked={required} onChange={setRequired} />
          <Toggle label="invalid（外部错误）" checked={invalid} onChange={setInvalid} />
          <Toggle label="disabled" checked={disabled} onChange={setDisabled} />
          <Toggle label="readOnly" checked={readOnly} onChange={setReadOnly} description="可聚焦、可复制，不可编辑" />
          <Toggle label="mono" checked={mono} onChange={setMono} />
          <TextField label="label" value={label} onChange={setLabel} />
        </>
      }
    >
      <div className="sc-field-frame">
        <Field
          label={label || '…'}
          description="由归档系统分配，格式 ARC-0000。"
          error="该编号已存在。"
          invalid={invalid}
          required={required}
          disabled={disabled}
          layout={layout}
        >
          <Input
            required={required}
            readOnly={readOnly}
            size={size}
            mono={mono}
            placeholder="ARC-0000"
            defaultValue={readOnly ? 'ARC-1024' : undefined}
          />
        </Field>
      </div>
    </Playground>
  );
}

type SubmitState = { status: 'idle' } | { status: 'saving' } | { status: 'saved'; id: string };

function RecordForm() {
  const [state, setState] = React.useState<SubmitState>({ status: 'idle' });
  const formRef = React.useRef<HTMLFormElement>(null);

  React.useEffect(() => {
    if (state.status !== 'saving') return;
    const t = window.setTimeout(() => {
      const id = new FormData(formRef.current!).get('recordId') as string;
      setState({ status: 'saved', id });
    }, 1200);
    return () => window.clearTimeout(t);
  }, [state.status]);

  return (
    <form
      ref={formRef}
      className="sc-form"
      aria-labelledby="record-form-title"
      onSubmit={(e) => {
        e.preventDefault();
        if (!e.currentTarget.checkValidity()) return;
        setState({ status: 'saving' });
      }}
    >
      <h3 id="record-form-title" className="sc-subhead">
        新建样本记录（演示）
      </h3>
      <Field
        label="档案编号"
        description="格式 ARC-0000。"
        error="格式应为 ARC 加四位数字，例如 ARC-1024。"
        required
        validationMode="onBlur"
        validate={(v) => (v === '' || /^ARC-\d{4}$/.test(String(v)) ? null : '格式应为 ARC 加四位数字，例如 ARC-1024。')}
      >
        <Input name="recordId" required mono placeholder="ARC-0000" autoComplete="off" />
      </Field>
      <Field label="样本名称" required error="请填写样本名称。" errorMatch="valueMissing" validationMode="onBlur">
        <Input name="name" required maxLength={80} />
      </Field>
      <Field label="直径" optional description="以样本最宽处计。">
        <Input name="diameter" inputMode="decimal" suffix="mm" mono />
      </Field>
      <Field label="创建人" description="由登录身份自动填写。">
        <Input name="owner" readOnly defaultValue="示例研究员" />
      </Field>
      <div className="sc-form__actions">
        <Button type="reset" variant="ghost" onClick={() => setState({ status: 'idle' })}>
          重置
        </Button>
        <Button type="submit" loading={state.status === 'saving'}>
          保存记录
        </Button>
      </div>
      <p className="sc-small" role="status">
        {state.status === 'saving' && '正在保存…'}
        {state.status === 'saved' && (
          <>
            <StatusBadge status="success" size="sm">
              已保存
            </StatusBadge>{' '}
            {state.id}（演示，不写入任何后端）
          </>
        )}
      </p>
    </form>
  );
}

export function FieldPage() {
  return (
    <div className="sc-page">
      <PageHeader index="07" section="Components / Fields" title="Field & Input">
        <p>
          基于 Base UI Field（ADR-0001）：label、description、error 自动关联到控件的 <code>aria-labelledby</code> /{' '}
          <code>aria-describedby</code> / <code>aria-invalid</code>。错误由图标 + 文字 + 边框三重表达，不只靠颜色。
        </p>
      </PageHeader>
      <SpecimenGrid>
        <FieldPlayground />
        <Specimen
          id="field-form"
          index="01"
          title="Validation flow"
          span="half"
          note="失焦时校验；只有修改过的必填项才报 valueMissing，提交时全部校验。保存期间按钮 loading，阻止重复提交。"
        >
          <RecordForm />
        </Specimen>
        <Specimen id="field-states" index="02" title="States" span="half" note="readOnly 可聚焦可复制；disabled 移出 Tab 顺序。">
          <div className="sc-stack">
            <Field label="默认">
              <Input placeholder="输入内容" />
            </Field>
            <Field label="无效" invalid error="该编号已存在。">
              <Input defaultValue="ARC-1024" mono />
            </Field>
            <Field label="只读">
              <Input readOnly defaultValue="2026-10-09 14:00" mono />
            </Field>
            <Field label="禁用" disabled>
              <Input defaultValue="不可编辑" />
            </Field>
          </div>
        </Specimen>
        <Specimen id="field-adornments" index="03" title="Adornments" span="half" note="前缀图标为装饰；后缀单位文字会被读屏作为描述读出。">
          <div className="sc-stack">
            <Input aria-label="搜索档案" type="search" prefix={<Search />} placeholder="搜索档案编号或名称" />
            <Field label="温度">
              <Input inputMode="decimal" suffix="°C" mono defaultValue="-20" />
            </Field>
          </div>
        </Specimen>
        <Specimen id="field-inline" index="04" title="Inline layout" span="half" note="标签列宽 --rl-field-label-width；窄容器请使用 stacked。">
          <div className="sc-stack">
            <Field label="分类" layout="inline">
              <Input defaultValue="实验记录" />
            </Field>
            <Field label="负责人" layout="inline" description="可填写多人，以逗号分隔。">
              <Input />
            </Field>
          </div>
        </Specimen>
      </SpecimenGrid>
    </div>
  );
}
