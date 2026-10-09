import * as React from 'react';
import { StatusBadge } from '@wzrhine/react';
import type { StatusBadgeAppearance, StatusBadgeSize, StatusKind } from '@wzrhine/react';
import { Playground } from '../ui/Playground';
import { PageHeader, Specimen, SpecimenGrid } from '../ui/Specimen';
import { Segmented, TextField } from '../ui/controls';

const statuses: Array<{ value: StatusKind; label: string; shape: string }> = [
  { value: 'neutral', label: '草稿', shape: '空心圆' },
  { value: 'info', label: '审核中', shape: '实心圆' },
  { value: 'success', label: '已归档', shape: '实心圆' },
  { value: 'warning', label: '需复核', shape: '菱形' },
  { value: 'danger', label: '校验失败', shape: '方形' },
];

function BadgePlayground() {
  const [status, setStatus] = React.useState<StatusKind>('info');
  const [size, setSize] = React.useState<StatusBadgeSize>('md');
  const [appearance, setAppearance] = React.useState<StatusBadgeAppearance>('subtle');
  const [label, setLabel] = React.useState('审核中');
  const props = [
    `status="${status}"`,
    size !== 'md' && `size="${size}"`,
    appearance !== 'subtle' && `appearance="${appearance}"`,
  ].filter(Boolean);
  return (
    <Playground
      id="badge-playground"
      title="StatusBadge"
      code={`<StatusBadge ${props.join(' ')}>${label || '…'}</StatusBadge>`}
      controls={
        <>
          <Segmented
            legend="status"
            name="pg-status"
            value={status}
            onChange={setStatus}
            options={statuses.map((s) => ({ value: s.value, label: s.value }))}
          />
          <Segmented
            legend="size"
            name="pg-badge-size"
            value={size}
            onChange={setSize}
            options={[
              { value: 'sm', label: 'sm' },
              { value: 'md', label: 'md' },
            ]}
          />
          <Segmented
            legend="appearance"
            name="pg-appearance"
            value={appearance}
            onChange={setAppearance}
            options={[
              { value: 'subtle', label: 'subtle' },
              { value: 'outline', label: 'outline' },
            ]}
          />
          <TextField label="label" value={label} onChange={setLabel} />
        </>
      }
    >
      <div className="sc-playground__demo">
        <StatusBadge status={status} size={size} appearance={appearance}>
          {label || '…'}
        </StatusBadge>
      </div>
    </Playground>
  );
}

export function StatusBadgePage() {
  return (
    <div className="sc-page">
      <PageHeader index="05" section="Components / Data" title="StatusBadge">
        <p>
          业务状态标签。<code>status</code> 描述语义，与视觉 variant 分离。颜色从不单独承担含义：每个状态都有可见文字，指示器形状也随状态变化。
        </p>
      </PageHeader>
      <SpecimenGrid>
        <BadgePlayground />
        <Specimen id="badge-matrix" index="01" title="Status × appearance" note="徽标不是点击目标；需要交互时请使用 Button 或后续的 Chip。">
          <div className="sc-table-wrap" tabIndex={0} role="region" aria-label="StatusBadge 矩阵（可横向滚动）">
            <table className="sc-matrix">
              <thead>
                <tr>
                  <th scope="col">status</th>
                  <th scope="col">subtle · md</th>
                  <th scope="col">subtle · sm</th>
                  <th scope="col">outline · md</th>
                  <th scope="col">指示器</th>
                </tr>
              </thead>
              <tbody>
                {statuses.map((s) => (
                  <tr key={s.value}>
                    <th scope="row">
                      <code className="sc-mono-sm">{s.value}</code>
                    </th>
                    <td>
                      <StatusBadge status={s.value}>{s.label}</StatusBadge>
                    </td>
                    <td>
                      <StatusBadge status={s.value} size="sm">
                        {s.label}
                      </StatusBadge>
                    </td>
                    <td>
                      <StatusBadge status={s.value} appearance="outline">
                        {s.label}
                      </StatusBadge>
                    </td>
                    <td className="sc-small">{s.shape}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Specimen>
        <Specimen id="badge-truncate" index="02" title="Overflow" span="half" note="超出容器时省略，并保留 title 供悬停查看完整文本。">
          <div className="sc-narrow sc-narrow--tight">
            <StatusBadge status="warning" title="需要跨部门复核的长状态描述文本">
              需要跨部门复核的长状态描述文本
            </StatusBadge>
          </div>
        </Specimen>
        <Specimen id="badge-inline" index="03" title="Inline usage" span="half" note="与正文基线对齐。">
          <p className="sc-body">
            样本记录当前 <StatusBadge status="info" size="sm">审核中</StatusBadge>，提交后将变为{' '}
            <StatusBadge status="success" size="sm">已归档</StatusBadge>。
          </p>
        </Specimen>
      </SpecimenGrid>
    </div>
  );
}
