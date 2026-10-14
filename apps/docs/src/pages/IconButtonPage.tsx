import * as React from 'react';
import { Icon, IconButton } from '@wzrhine/react';
import type { ButtonSize, IconButtonVariant, IconName } from '@wzrhine/react';
import { Archive, Close, Download, Grid, Pin, Plus, Refresh } from '../icons';
import { Playground } from '../ui/Playground';
import { PageHeader, Specimen, SpecimenGrid } from '../ui/Specimen';
import { Segmented, TextField, Toggle } from '../ui/controls';

const customs: Array<{ name: IconName; label: string; note: string }> = [
  { name: 'Agent', label: '智能体', note: '品牌与子智能体角标' },
  { name: 'Caliper', label: '精密测量', note: '游标卡尺' },
  { name: 'Sample', label: '样本容器', note: '宽口样本瓶' },
  { name: 'Index', label: '索引卡', note: '档案索引' },
];

const variants: Array<{ value: IconButtonVariant; label: string; note: string }> = [
  { value: 'ghost', label: 'ghost', note: '默认：工具栏、表格行内' },
  { value: 'secondary', label: 'secondary', note: '需要明确边界的独立操作' },
  { value: 'primary', label: 'primary', note: '深墨填充，少量使用' },
];
const sizes: ButtonSize[] = ['sm', 'md', 'lg'];

function IconButtonPlayground() {
  const [variant, setVariant] = React.useState<IconButtonVariant>('secondary');
  const [size, setSize] = React.useState<ButtonSize>('md');
  const [disabled, setDisabled] = React.useState(false);
  const [toggle, setToggle] = React.useState(false);
  const [pressed, setPressed] = React.useState(false);
  const [label, setLabel] = React.useState('固定到侧栏');

  const props = [
    `icon={<Pin />}`,
    `label="${label || '…'}"`,
    variant !== 'ghost' && `variant="${variant}"`,
    size !== 'md' && `size="${size}"`,
    disabled && 'disabled',
    toggle && `pressed={${pressed}}`,
  ].filter(Boolean);

  return (
    <Playground
      id="icon-button-playground"
      title="IconButton"
      code={`<IconButton\n  ${props.join('\n  ')}\n/>`}
      controls={
        <>
          <Segmented legend="variant" name="pg-ib-variant" value={variant} onChange={setVariant} options={variants} />
          <Segmented
            legend="size"
            name="pg-ib-size"
            value={size}
            onChange={setSize}
            options={sizes.map((s) => ({ value: s, label: s }))}
          />
          <Toggle label="disabled" checked={disabled} onChange={setDisabled} />
          <Toggle label="作为开关（pressed）" checked={toggle} onChange={setToggle} description="渲染 aria-pressed" />
          <TextField label="label（必填）" value={label} onChange={setLabel} />
          <p className="sc-small sc-control-note">label 同时作为可访问名称与悬停提示；类型层面禁止缺省。</p>
        </>
      }
    >
      <div className="sc-playground__demo">
        <IconButton
          icon={<Pin />}
          label={label || '…'}
          variant={variant}
          size={size}
          disabled={disabled}
          pressed={toggle ? pressed : undefined}
          onClick={() => setPressed((v) => !v)}
        />
        {toggle && (
          <p className="sc-small sc-mono-sm" aria-live="polite">
            aria-pressed={String(pressed)}
          </p>
        )}
      </div>
    </Playground>
  );
}

export function IconButtonPage() {
  const [grid, setGrid] = React.useState(true);
  return (
    <div className="sc-page">
      <PageHeader index="03" section="Components / Actions" title="IconButton">
        <p>
          仅图标的按钮。<code>label</code> 为必填属性（类型强制），同时提供可访问名称与悬停提示；图标本身 <code>aria-hidden</code>。
          命中区域与 <code>--rl-control-height-*</code> 一致，不随图标尺寸缩小。
        </p>
      </PageHeader>
      <SpecimenGrid>
        <IconButtonPlayground />
        <Specimen id="ib-matrix" index="01" title="State matrix" note="pressed 使用 accent-subtle 底色 + 深墨描边，与 hover、focus 视觉独立。">
          <div className="sc-table-wrap" tabIndex={0} role="region" aria-label="IconButton 状态矩阵（可横向滚动）">
            <table className="sc-matrix">
              <thead>
                <tr>
                  <th scope="col">variant</th>
                  <th scope="col">sm</th>
                  <th scope="col">md</th>
                  <th scope="col">lg</th>
                  <th scope="col">pressed</th>
                  <th scope="col">disabled</th>
                </tr>
              </thead>
              <tbody>
                {variants.map((v) => (
                  <tr key={v.value}>
                    <th scope="row">
                      <code className="sc-mono-sm">{v.value}</code>
                      <span className="sc-small">{v.note}</span>
                    </th>
                    {sizes.map((s) => (
                      <td key={s}>
                        <IconButton icon={<Download />} label={`导出（${v.value} ${s}）`} variant={v.value} size={s} />
                      </td>
                    ))}
                    <td>
                      <IconButton icon={<Pin />} label={`固定（${v.value}）`} variant={v.value} pressed />
                    </td>
                    <td>
                      <IconButton icon={<Archive />} label={`归档（${v.value}，不可用）`} variant={v.value} disabled />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Specimen>
        <Specimen id="ib-toolbar" index="02" title="Toolbar" span="half" note="同一组工具使用同一 variant 与 size；开关类工具使用 pressed。">
          <div className="sc-toolbar" role="toolbar" aria-label="档案列表工具">
            <IconButton icon={<Plus />} label="新建记录" />
            <IconButton icon={<Refresh />} label="刷新" />
            <IconButton icon={<Download />} label="导出" />
            <span className="sc-toolbar__sep" aria-hidden="true" />
            <IconButton icon={<Grid />} label="网格视图" pressed={grid} onClick={() => setGrid((v) => !v)} />
          </div>
        </Specimen>
        <Specimen id="ib-dismiss" index="03" title="Dismiss" span="half" note="关闭按钮使用具体名称（「关闭通知」），而不是笼统的「关闭」。">
          <div className="sc-dismiss">
            <span className="sc-body">样本 REC-EXAMPLE 已同步。</span>
            <IconButton icon={<Close />} label="关闭通知" size="sm" />
          </div>
        </Specimen>
        <Specimen id="ib-custom" index="04" title="Custom icons" span="half" note="WzRhineLab 定制字形（公共 Icon 注册表，approved 2026-10-14）；基础图标来自 Lucide 基础层，统一 1.75 线宽。">
          <div className="sc-toolbar" role="toolbar" aria-label="WzRhineLab 定制图标">
            {customs.map((c) => (
              <IconButton key={c.name} icon={<Icon name={c.name} size={16} />} label={`${c.label}（${c.note}）`} />
            ))}
          </div>
        </Specimen>
      </SpecimenGrid>
    </div>
  );
}
