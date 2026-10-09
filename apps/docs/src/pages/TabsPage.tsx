import * as React from 'react';
import { StatusBadge, Tab, TabList, TabPanel, Tabs, Text } from '@wzrhine/react';
import type { TabsSize, TabsVariant } from '@wzrhine/react';
import { Playground } from '../ui/Playground';
import { PageHeader, Specimen, SpecimenGrid } from '../ui/Specimen';
import { Segmented, Toggle } from '../ui/controls';

const views = [
  { value: 'overview', label: '概览' },
  { value: 'metadata', label: '元数据', meta: '12' },
  { value: 'imagery', label: '影像', meta: '4' },
  { value: 'history', label: '历史' },
] as const;

function RecordTabs({
  variant,
  size,
  disableHistory = false,
}: {
  variant: TabsVariant;
  size: TabsSize;
  disableHistory?: boolean;
}) {
  return (
    <Tabs defaultValue="overview" variant={variant} size={size}>
      <TabList aria-label="记录视图">
        {views.map((v) => (
          <Tab key={v.value} value={v.value} meta={'meta' in v ? v.meta : undefined} disabled={v.value === 'history' && disableHistory}>
            {v.label}
          </Tab>
        ))}
      </TabList>
      {views.map((v) => (
        <TabPanel key={v.value} value={v.value}>
          <div className="sc-tab-panel">
            <Text variant="eyebrow" tone="subtle">
              Panel / {v.value}
            </Text>
            <Text variant="body-sm" tone="muted">
              {v.label}视图的示例内容。面板可通过 Tab 键进入，读屏会读出其对应的标签名。
            </Text>
          </div>
        </TabPanel>
      ))}
    </Tabs>
  );
}

function TabsPlayground() {
  const [variant, setVariant] = React.useState<TabsVariant>('line');
  const [size, setSize] = React.useState<TabsSize>('md');
  const [disabled, setDisabled] = React.useState(false);
  const rootProps = ['defaultValue="overview"', variant !== 'line' && `variant="${variant}"`, size !== 'md' && `size="${size}"`]
    .filter(Boolean)
    .join(' ');
  return (
    <Playground
      id="tabs-playground"
      title="Tabs"
      code={[
        `<Tabs ${rootProps}>`,
        '  <TabList aria-label="记录视图">',
        '    <Tab value="overview">概览</Tab>',
        '    <Tab value="metadata" meta="12">元数据</Tab>',
        `    <Tab value="history"${disabled ? ' disabled' : ''}>历史</Tab>`,
        '  </TabList>',
        '  <TabPanel value="overview">…</TabPanel>',
        '</Tabs>',
      ].join('\n')}
      controls={
        <>
          <Segmented
            legend="variant"
            name="pg-tabs-variant"
            value={variant}
            onChange={setVariant}
            options={[
              { value: 'line', label: 'line' },
              { value: 'segmented', label: 'segmented' },
            ]}
          />
          <Segmented
            legend="size"
            name="pg-tabs-size"
            value={size}
            onChange={setSize}
            options={[
              { value: 'sm', label: 'sm' },
              { value: 'md', label: 'md' },
            ]}
          />
          <Toggle label="禁用「历史」" checked={disabled} onChange={setDisabled} description="仍可被方向键发现，但不可激活" />
        </>
      }
    >
      <div className="sc-tabs-frame">
        <RecordTabs variant={variant} size={size} disableHistory={disabled} />
      </div>
    </Playground>
  );
}

export function TabsPage() {
  return (
    <div className="sc-page">
      <PageHeader index="08" section="Navigation & Overlay" title="Tabs">
        <p>
          基于 Base UI Tabs。左右方向键移动焦点、Home/End 跳到首尾，Enter / Space 激活（手动激活，避免切换昂贵面板）。
          指示器沿 <code>--rl-motion-base</code> 200ms 滑动，快速连续切换时从当前位置改道；减动时直接定位。
        </p>
      </PageHeader>
      <SpecimenGrid>
        <TabsPlayground />
        <Specimen id="tabs-line" align="start" index="01" title="Line" span="half" note="默认：页面级视图切换。研究橙指示线是本页唯一的信号色。">
          <RecordTabs variant="line" size="md" />
        </Specimen>
        <Specimen id="tabs-segmented" align="start" index="02" title="Segmented" span="half" note="面板内的紧凑切换，例如图表时间范围。">
          <Tabs defaultValue="30d" variant="segmented" size="sm">
            <TabList aria-label="时间范围">
              <Tab value="7d">7 天</Tab>
              <Tab value="30d">30 天</Tab>
              <Tab value="1y">1 年</Tab>
            </TabList>
            {['7d', '30d', '1y'].map((v) => (
              <TabPanel key={v} value={v}>
                <p className="sc-small">
                  已选择范围 <StatusBadge size="sm">{v}</StatusBadge>（演示，无真实数据）
                </p>
              </TabPanel>
            ))}
          </Tabs>
        </Specimen>
        <Specimen id="tabs-overflow" index="03" title="Overflow" note="标签过多时列表横向滚动，不换行、不缩小字号。">
          <Tabs defaultValue="t1">
            <TabList aria-label="实验阶段">
              {Array.from({ length: 9 }, (_, i) => (
                <Tab key={i} value={`t${i + 1}`}>
                  阶段 {String(i + 1).padStart(2, '0')}
                </Tab>
              ))}
            </TabList>
            {Array.from({ length: 9 }, (_, i) => (
              <TabPanel key={i} value={`t${i + 1}`}>
                <p className="sc-small">阶段 {String(i + 1).padStart(2, '0')} 的示例说明。</p>
              </TabPanel>
            ))}
          </Tabs>
        </Specimen>
      </SpecimenGrid>
    </div>
  );
}
