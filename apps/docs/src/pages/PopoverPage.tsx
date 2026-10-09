import * as React from 'react';
import { Button, Field, Input, Popover, PopoverClose, Select, StatusBadge, Text } from '@wzrhine/react';
import type { PopoverAlign, PopoverSide, PopoverSize } from '@wzrhine/react';
import { Archive } from '../icons';
import { Playground } from '../ui/Playground';
import { PageHeader, Specimen, SpecimenGrid } from '../ui/Specimen';
import { Segmented, Toggle } from '../ui/controls';

function PopoverPlayground() {
  const [side, setSide] = React.useState<PopoverSide>('bottom');
  const [align, setAlign] = React.useState<PopoverAlign>('center');
  const [size, setSize] = React.useState<PopoverSize>('md');
  const [arrow, setArrow] = React.useState(true);
  const [hover, setHover] = React.useState(false);
  const props = [
    'title="筛选条件"',
    side !== 'bottom' && `side="${side}"`,
    align !== 'center' && `align="${align}"`,
    size !== 'md' && `size="${size}"`,
    arrow && 'arrow',
    hover && 'openOnHover',
  ].filter(Boolean);
  return (
    <Playground
      id="popover-playground"
      title="Popover"
      code={[
        '<Popover',
        '  trigger={<Button variant="secondary">筛选…</Button>}',
        ...props.map((p) => `  ${p}`),
        '  actions={<PopoverClose><Button size="sm">完成</Button></PopoverClose>}',
        '>',
        '  <Field label="编号前缀"><Input /></Field>',
        '</Popover>',
      ].join('\n')}
      controls={
        <>
          <Segmented
            legend="side"
            name="pg-pop-side"
            value={side}
            onChange={setSide}
            options={(['top', 'right', 'bottom', 'left'] as const).map((v) => ({ value: v, label: v }))}
          />
          <Segmented
            legend="align"
            name="pg-pop-align"
            value={align}
            onChange={setAlign}
            options={(['start', 'center', 'end'] as const).map((v) => ({ value: v, label: v }))}
          />
          <Segmented
            legend="size"
            name="pg-pop-size"
            value={size}
            onChange={setSize}
            options={(['sm', 'md', 'lg'] as const).map((v) => ({ value: v, label: v }))}
          />
          <Toggle label="arrow" checked={arrow} onChange={setArrow} />
          <Toggle label="openOnHover" checked={hover} onChange={setHover} description="点击与键盘仍可打开" />
        </>
      }
    >
      <div className="sc-playground__demo">
        <Popover
          trigger={<Button variant="secondary">筛选…</Button>}
          title="筛选条件"
          description="仅影响当前列表。"
          side={side}
          align={align}
          size={size}
          arrow={arrow}
          openOnHover={hover}
          actions={
            <PopoverClose>
              <Button size="sm">完成</Button>
            </PopoverClose>
          }
        >
          <Field label="编号前缀">
            <Input defaultValue="ARC" mono size="sm" />
          </Field>
        </Popover>
      </div>
    </Playground>
  );
}

export function PopoverPage() {
  const [owner, setOwner] = React.useState('示例研究员');
  return (
    <div className="sc-page">
      <PageHeader index="12" section="Navigation & Overlay" title="Popover">
        <p>
          基于 Base UI Popover 的非模态浮层。与 Tooltip 不同，它可以放交互内容，触屏与读屏用户都能访问：触发器带
          <code>aria-expanded</code>，浮层是有名称的 dialog，打开时焦点进入、关闭后归还，Esc 或点击外部关闭。
        </p>
      </PageHeader>
      <SpecimenGrid>
        <PopoverPlayground />
        <Specimen id="pop-edit" index="01" title="Inline edit" span="half" align="start" note="编辑后关闭，结果写回页面；背景仍可操作（非模态）。">
          <dl className="sc-record__meta">
            <div>
              <dt>负责人</dt>
              <dd className="sc-inline-edit">
                <span>{owner}</span>
                <Popover
                  trigger={<Button variant="ghost" size="sm">修改</Button>}
                  title="修改负责人"
                  size="sm"
                  arrow
                  actions={
                    <PopoverClose>
                      <Button size="sm">保存</Button>
                    </PopoverClose>
                  }
                >
                  <Field label="姓名">
                    <Input value={owner} onValueChange={setOwner} size="sm" />
                  </Field>
                </Popover>
              </dd>
            </div>
            <div>
              <dt>类别</dt>
              <dd>
                <Select aria-label="类别" size="sm" defaultValue="specimen" options={[{ value: 'specimen', label: '样本' }, { value: 'report', label: '外勤报告' }]} />
              </dd>
            </div>
          </dl>
        </Specimen>
        <Specimen id="pop-preview" index="02" title="Preview on hover" span="half" align="start" note="openOnHover 适合预览；预览内容也必须能通过点击或聚焦获得。">
          <p className="sc-body">
            关联记录{' '}
            <Popover
              trigger={
                <Button variant="ghost" size="sm" iconStart={<Archive />}>
                  REC-EXAMPLE
                </Button>
              }
              aria-label="REC-EXAMPLE 预览"
              openOnHover
              size="sm"
            >
              <div className="sc-record">
                <Text variant="eyebrow" tone="accent">
                  REC / EXAMPLE
                </Text>
                <Text variant="label" as="p">
                  示例档案记录
                </Text>
                <Text variant="meta" tone="muted">
                  展示用占位内容，不代表真实数据。
                </Text>
                <span>
                  <StatusBadge status="info" size="sm">
                    审核中
                  </StatusBadge>
                </span>
              </div>
            </Popover>{' '}
            已同步。
          </p>
        </Specimen>
        <Specimen id="pop-rules" index="03" title="Popover vs Tooltip vs Dialog" note="选择浮层类型的依据是内容是否可交互、是否必须先处理。">
          <div className="sc-table-wrap" tabIndex={0} role="region" aria-label="浮层选择（可横向滚动）">
            <table className="sc-table">
              <thead>
                <tr>
                  <th scope="col">组件</th>
                  <th scope="col">可交互内容</th>
                  <th scope="col">触屏 / 读屏</th>
                  <th scope="col">背景</th>
                  <th scope="col">用途</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Tooltip</td>
                  <td>否</td>
                  <td>不可用</td>
                  <td>可操作</td>
                  <td>图标按钮的视觉名称</td>
                </tr>
                <tr>
                  <td>Popover</td>
                  <td>是</td>
                  <td>可用</td>
                  <td>可操作</td>
                  <td>筛选、行内编辑、预览</td>
                </tr>
                <tr>
                  <td>Dialog</td>
                  <td>是</td>
                  <td>可用</td>
                  <td>隔离</td>
                  <td>必须先完成的确认或表单</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Specimen>
      </SpecimenGrid>
    </div>
  );
}
