import * as React from 'react';
import { Button, Field, Select, StatusBadge } from '@wzrhine/react';
import type { InputSize, SelectGroup, SelectOption } from '@wzrhine/react';
import { Playground } from '../ui/Playground';
import { PageHeader, Specimen, SpecimenGrid } from '../ui/Specimen';
import { Segmented, Toggle } from '../ui/controls';

const categories: SelectOption[] = [
  { value: 'specimen', label: '样本' },
  { value: 'experiment', label: '实验记录' },
  { value: 'field-report', label: '外勤报告' },
  { value: 'personnel', label: '人员档案', disabled: true },
];

const grouped: SelectGroup[] = [
  {
    label: 'RESEARCH',
    options: [
      { value: 'biology', label: '生物' },
      { value: 'geology', label: '地质' },
      { value: 'atmosphere', label: '大气' },
    ],
  },
  {
    label: 'ARCHIVE',
    options: [
      { value: 'document', label: '文档' },
      { value: 'imagery', label: '影像' },
    ],
  },
];

function SelectPlayground() {
  const [size, setSize] = React.useState<InputSize>('md');
  const [required, setRequired] = React.useState(false);
  const [disabled, setDisabled] = React.useState(false);
  const [readOnly, setReadOnly] = React.useState(false);
  const [invalid, setInvalid] = React.useState(false);
  const [value, setValue] = React.useState<string | null>(null);

  const selectProps = [
    'options={categories}',
    'value={value}',
    'onValueChange={setValue}',
    size !== 'md' && `size="${size}"`,
    required && 'required',
    readOnly && 'readOnly',
  ].filter(Boolean);

  return (
    <Playground
      id="select-playground"
      title="Select"
      code={[
        `<Field label="记录类别"${required ? ' required' : ''}${disabled ? ' disabled' : ''}${invalid ? ' invalid error="请选择类别。"' : ''}>`,
        '  <Select',
        ...selectProps.map((p) => `    ${p}`),
        '  />',
        '</Field>',
      ].join('\n')}
      controls={
        <>
          <Segmented
            legend="size"
            name="pg-sel-size"
            value={size}
            onChange={setSize}
            options={(['sm', 'md', 'lg'] as const).map((s) => ({ value: s, label: s }))}
          />
          <Toggle label="required" checked={required} onChange={setRequired} />
          <Toggle label="invalid（外部错误）" checked={invalid} onChange={setInvalid} />
          <Toggle label="disabled" checked={disabled} onChange={setDisabled} />
          <Toggle label="readOnly" checked={readOnly} onChange={setReadOnly} />
          <p className="sc-small sc-control-note">当前值：{value ?? 'null'}</p>
        </>
      }
    >
      <div className="sc-field-frame">
        <Field label="记录类别" required={required} disabled={disabled} invalid={invalid} error="请选择类别。" description="用于档案检索的筛选。">
          <Select
            options={categories}
            value={value}
            onValueChange={setValue}
            size={size}
            required={required}
            readOnly={readOnly}
            placeholder="选择类别"
          />
        </Field>
      </div>
    </Playground>
  );
}

function FilterForm() {
  const [submitted, setSubmitted] = React.useState<Record<string, string> | null>(null);
  return (
    <form
      className="sc-filter"
      aria-label="档案筛选"
      onSubmit={(e) => {
        e.preventDefault();
        setSubmitted(Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>);
      }}
    >
      <Field label="学科">
        <Select name="discipline" options={grouped} defaultValue="geology" />
      </Field>
      <Field label="状态">
        <Select
          name="status"
          defaultValue="review"
          options={[
            { value: 'draft', label: '草稿' },
            { value: 'review', label: '审核中' },
            { value: 'archived', label: '已归档' },
          ]}
        />
      </Field>
      <div className="sc-filter__actions">
        <Button type="submit" variant="secondary">
          应用筛选
        </Button>
      </div>
      <p className="sc-small sc-filter__result" role="status">
        {submitted ? (
          <>
            提交：
            {Object.entries(submitted).map(([k, v]) => (
              <StatusBadge key={k} size="sm" appearance="outline">
                {k}={v}
              </StatusBadge>
            ))}
          </>
        ) : (
          '尚未提交'
        )}
      </p>
    </form>
  );
}

export function SelectPage() {
  return (
    <div className="sc-page">
      <PageHeader index="11" section="Navigation & Overlay" title="Select">
        <p>
          基于 Base UI Select：<code>combobox</code> + <code>listbox</code> 语义，方向键、Home/End 与首字母定位，Esc 取消不改值，关闭后焦点回到触发器。
          放在 <code>Field</code> 内自动获得标签、说明与错误；通过 <code>name</code> 参与原生表单提交。
        </p>
      </PageHeader>
      <SpecimenGrid>
        <SelectPlayground />
        <Specimen id="select-form" align="start" index="01" title="Groups in a form" span="half" note="分组标签为 mono 元信息；值随表单 FormData 提交。">
          <FilterForm />
        </Specimen>
        <Specimen id="select-states" index="02" title="States" span="half" align="start" note="disabled 选项可被浏览但不可选择。">
          <div className="sc-stack">
            <Field label="默认">
              <Select options={categories} placeholder="选择类别" />
            </Field>
            <Field label="无效" invalid error="该类别不可用于当前项目。">
              <Select options={categories} defaultValue="field-report" />
            </Field>
            <Field label="禁用" disabled>
              <Select options={categories} defaultValue="specimen" />
            </Field>
          </div>
        </Specimen>
      </SpecimenGrid>
    </div>
  );
}
