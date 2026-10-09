import * as React from 'react';
import { ArchiveCard, DataTable, MetadataList, RecordHeader, StatusIndicator, Timeline } from '@wzrhine/react';
import { PageHeader, Specimen, SpecimenGrid } from '../ui/Specimen';
import { Segmented, Toggle } from '../ui/controls';
import { Playground } from '../ui/Playground';
import { categoryLabel, records, statusLabel, statusTone } from '../scenarios/data';

const sample = records[0]!;

function MetadataPlayground() {
  const [layout, setLayout] = React.useState<'inline' | 'stacked'>('inline');
  const [columns, setColumns] = React.useState<'1' | '2' | '3'>('2');
  const [placeholder, setPlaceholder] = React.useState(false);
  return (
    <Playground
      id="meta-playground"
      title="MetadataList"
      code={[
        `<MetadataList layout="${layout}" columns={${columns}}${placeholder ? ' empty="placeholder"' : ''} items={[`,
        "  { label: '编号', value: record.id, mono: true },",
        "  { label: '负责人', value: record.owner },",
        "  { label: '存放位置', value: record.location },  // 缺省时隐藏",
        "  { label: '更新', value: record.updated, dateTime: record.updated, mono: true },",
        ']} />',
      ].join('\n')}
      controls={
        <>
          <Segmented
            legend="layout"
            name="pg-meta-layout"
            value={layout}
            onChange={setLayout}
            options={[
              { value: 'inline', label: 'inline' },
              { value: 'stacked', label: 'stacked' },
            ]}
          />
          <Segmented
            legend="columns"
            name="pg-meta-columns"
            value={columns}
            onChange={setColumns}
            options={[
              { value: '1', label: '1' },
              { value: '2', label: '2' },
              { value: '3', label: '3' },
            ]}
          />
          <Toggle label='empty="placeholder"' checked={placeholder} onChange={setPlaceholder} description="保留缺省行，读作「未记录」" />
        </>
      }
    >
      <div className="sc-meta-frame">
        <MetadataList
          layout={layout}
          columns={Number(columns) as 1 | 2 | 3}
          empty={placeholder ? 'placeholder' : 'hide'}
          items={[
            { label: '编号', value: sample.id, mono: true },
            { label: '负责人', value: sample.owner },
            { label: '类别', value: categoryLabel[sample.category] },
            { label: '学科', value: sample.discipline },
            { label: '创建', value: sample.created, dateTime: sample.created, mono: true },
            { label: '更新', value: sample.updated, dateTime: sample.updated, mono: true },
            { label: '访问级别', value: undefined },
          ]}
        />
      </div>
    </Playground>
  );
}

export function ArchivePage() {
  const [selected, setSelected] = React.useState('ARC-1031');
  return (
    <div className="sc-page">
      <PageHeader index="16" section="Data & Archive" title="Archive patterns">
        <p>
          档案识别组件：RecordHeader、MetadataList、ArchiveCard、StatusIndicator、Timeline、DataTable。除标题与编号外所有字段都可缺省，
          缺省即隐藏——组件不会生成时间、读数或权限等虚假信息。本页数据均为标注过的样例记录。
        </p>
      </PageHeader>
      <SpecimenGrid>
        <Specimen id="arc-header" index="01" title="RecordHeader" note="位置路径是面包屑导航；状态以文字 + 形状表达；元数据在宽容器中位于标题右侧，窄容器自动换到下方。">
          <RecordHeader
            headingLevel={2}
            trail={[{ label: '档案', href: '#/archive' }, { label: '实验记录' }, { label: sample.id }]}
            recordId={sample.id}
            status={{ tone: statusTone[sample.status], label: statusLabel[sample.status] }}
            title={sample.title}
            classification={[categoryLabel[sample.category], sample.discipline]}
            summary={sample.summary}
            meta={[
              { label: '创建', value: sample.created, dateTime: sample.created, mono: true },
              { label: '更新', value: sample.updated, dateTime: sample.updated, mono: true },
              { label: '负责人', value: sample.owner },
            ]}
          />
        </Specimen>

        <MetadataPlayground />

        <Specimen id="arc-cards" index="02" title="ArchiveCard" span="half" align="start" note="整张卡片是一个按钮或链接，名称为标题；日期与状态作为描述。选中态为左侧研究橙细线。">
          <ul className="sc-card-list" aria-label="档案卡片示例">
            {records.slice(1, 4).map((r) => (
              <li key={r.id}>
                <ArchiveCard
                  id={r.id}
                  title={r.title}
                  category={categoryLabel[r.category]}
                  subcategory={r.discipline}
                  status={{ tone: statusTone[r.status], label: statusLabel[r.status] }}
                  updatedAt={r.updated}
                  selected={selected === r.id}
                  onOpen={() => setSelected(r.id)}
                />
              </li>
            ))}
            <li>
              <ArchiveCard id="ARC-0000" title="仅有编号与标题的记录" />
            </li>
          </ul>
        </Specimen>

        <Specimen id="arc-status" index="03" title="StatusIndicator" span="half" align="start" note="形状随状态变化；live 模式通过 polite 实时区域播报变化；脉冲仅用于真实在线连接，减动时停止。">
          <ul className="sc-status-list">
            <li>
              <StatusIndicator tone="neutral" label="草稿" />
            </li>
            <li>
              <StatusIndicator tone="info" label="审核中" detail="提交于 10-08" />
            </li>
            <li>
              <StatusIndicator tone="success" label="已归档" />
            </li>
            <li>
              <StatusIndicator tone="warning" label="需复核" detail="坐标缺失" />
            </li>
            <li>
              <StatusIndicator tone="danger" label="同步失败" />
            </li>
          </ul>
        </Specimen>

        <Specimen id="arc-timeline" index="04" title="Timeline" span="half" align="start" note="有序列表；时间由调用方提供，组件不排序、不生成、不改写时间。">
          <Timeline
            aria-label="记录历史"
            events={[
              { id: 't1', title: '创建记录', dateTime: sample.created, actor: sample.owner },
              { id: 't2', title: '提交复核', dateTime: '2026-10-02', tone: 'info', description: '附三组观测结果。' },
              { id: 't3', title: '复核意见：补充温控数据', dateTime: '2026-10-05', tone: 'warning' },
              { id: 't4', title: '更新观测结论', dateTime: sample.updated, tone: 'success' },
            ]}
          />
        </Specimen>

        <Specimen id="arc-table" index="05" title="DataTable" span="half" align="start" note="原生 table + caption；宽表在可聚焦区域内横向滚动。完整的排序与选择见「档案检索」场景。">
          <DataTable
            caption="最近更新的档案"
            density="compact"
            columns={[
              { key: 'id', header: '编号', mono: true, rowHeader: true },
              { key: 'title', header: '标题' },
              { key: 'updated', header: '更新', mono: true, align: 'end' },
            ]}
            rows={records.slice(0, 4)}
            getRowId={(r) => r.id}
          />
        </Specimen>
      </SpecimenGrid>
    </div>
  );
}
