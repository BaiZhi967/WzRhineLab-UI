import * as React from 'react';
import { Button, IconButton, Text, Tooltip } from '@wzrhine/react';
import type { TooltipSide } from '@wzrhine/react';
import { Archive, Download, Grid, Pin, Refresh } from '../icons';
import { Playground } from '../ui/Playground';
import { PageHeader, Specimen, SpecimenGrid } from '../ui/Specimen';
import { Segmented, TextField, Toggle } from '../ui/controls';

const sides: TooltipSide[] = ['top', 'right', 'bottom', 'left'];

function TooltipPlayground() {
  const [side, setSide] = React.useState<TooltipSide>('top');
  const [disabled, setDisabled] = React.useState(false);
  const [label, setLabel] = React.useState('导出档案');
  const text = label || '…';
  return (
    <Playground
      id="tooltip-playground"
      title="Tooltip"
      code={[
        `<Tooltip content="${text}"${side !== 'top' ? ` side="${side}"` : ''}${disabled ? ' disabled' : ''}>`,
        `  <IconButton icon={<Download />} label="${text}" />`,
        '</Tooltip>',
      ].join('\n')}
      controls={
        <>
          <Segmented legend="side" name="pg-tt-side" value={side} onChange={setSide} options={sides.map((s) => ({ value: s, label: s }))} />
          <Toggle label="disabled" checked={disabled} onChange={setDisabled} />
          <TextField label="content（与 label 一致）" value={label} onChange={setLabel} />
          <p className="sc-small sc-control-note">
            提示只是视觉标签：读屏与触屏用户读不到它。触发器自身必须有同样的可访问名称。
          </p>
        </>
      }
    >
      <div className="sc-playground__demo">
        <Tooltip content={text} side={side} disabled={disabled}>
          <IconButton icon={<Download />} label={text} variant="secondary" />
        </Tooltip>
        <p className="sc-small">悬停或 Tab 聚焦按钮</p>
      </div>
    </Playground>
  );
}

export function TooltipPage() {
  return (
    <div className="sc-page">
      <PageHeader index="09" section="Navigation & Overlay" title="Tooltip">
        <p>
          基于 Base UI Tooltip。仅作为图标按钮或截断文本的<strong>视觉标签</strong>：悬停 500ms 或键盘聚焦时出现，Esc 关闭，
          相邻触发器之间移动时即时切换。重要信息请写在可见文字里。
        </p>
      </PageHeader>
      <SpecimenGrid>
        <TooltipPlayground />
        <Specimen id="tt-toolbar" index="01" title="Toolbar labels" span="half" note="Tooltip 内容与 IconButton 的 label 一致；fast 120ms 淡入，减动时不缩放。">
          <div className="sc-toolbar" role="toolbar" aria-label="档案操作">
            {[
              { icon: <Refresh />, label: '刷新列表' },
              { icon: <Download />, label: '导出档案' },
              { icon: <Archive />, label: '归档所选' },
              { icon: <Pin />, label: '固定到侧栏' },
              { icon: <Grid />, label: '网格视图' },
            ].map((t) => (
              <Tooltip key={t.label} content={t.label}>
                <IconButton icon={t.icon} label={t.label} />
              </Tooltip>
            ))}
          </div>
        </Specimen>
        <Specimen id="tt-truncate" index="02" title="Truncated text" span="half" note="截断文本的触发器需可聚焦；按钮的可访问名称仍是完整标题。">
          <div className="sc-narrow">
            <Tooltip content="跨部门样本复核流程与归档规范（第三版）">
              <Button variant="ghost">
                <Text as="span" variant="body-sm" truncate>
                  跨部门样本复核流程与归档规范（第三版）
                </Text>
              </Button>
            </Tooltip>
          </div>
        </Specimen>
        <Specimen id="tt-dont" index="03" title="Do / Don't" note="Base UI 指南：tooltip 不是可访问信息的载体。">
          <ul className="sc-rules">
            <li data-kind="do">为仅图标按钮补充视觉名称，内容与 aria-label 一致</li>
            <li data-kind="do">提示截断的标题或编号全称</li>
            <li data-kind="dont">放置操作说明、错误原因或任何唯一可见的信息</li>
            <li data-kind="dont">在提示内放置链接或按钮（请改用 Popover）</li>
          </ul>
        </Specimen>
      </SpecimenGrid>
    </div>
  );
}
