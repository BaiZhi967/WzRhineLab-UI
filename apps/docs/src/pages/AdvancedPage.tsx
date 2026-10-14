import * as React from 'react';
import {
  Accordion,
  AccordionItem,
  Button,
  ContextMenu,
  Menu,
  MenuCheckboxItem,
  MenuItem,
  MenuSeparator,
  NumberField,
  Slider,
  StatusBadge,
  Surface,
  useToast,
} from '@wzrhine/react';
import type { SliderMark } from '@wzrhine/react';
import { ThemeScope } from '../app/ThemeScope';
import { PageHeader, Specimen, SpecimenGrid } from '../ui/Specimen';

/** M12 group 1 (ADR-0010 §2): Accordion, Slider, NumberField, ContextMenu. All values are samples. */

const effortMarks: SliderMark[] = [
  { value: 0, label: '关闭' },
  { value: 1, label: '低' },
  { value: 2, label: '中' },
  { value: 3, label: '高' },
  { value: 4, label: '最高' },
];

const sections = [
  { value: 'scope', title: '适用范围', content: '本规程适用于样本库内部档案的借阅与归还（示例文本）。', meta: '01' },
  { value: 'method', title: '采样方法', content: '按批次抽取，每批不少于 3 份；记录采集时间与操作人（示例文本）。', meta: '02' },
  {
    value: 'long',
    title: '长标题：跨部门联合复核流程中的样本交接、签收与异常上报规则说明',
    content: '标题在窄屏下换行，箭头保持在行尾，不挤压文字（示例文本）。',
    meta: '03',
  },
  { value: 'locked', title: '审批记录（需要权限）', content: '—', meta: '04', disabled: true },
];

function AccordionDemo() {
  const [open, setOpen] = React.useState<string[]>(['scope']);
  return (
    <div className="sc-card-list">
      <Accordion items={sections} value={open} onValueChange={setOpen} />
      <p className="sc-small">展开：{open.length > 0 ? open.join(', ') : '无'}</p>
    </div>
  );
}

function MultipleAccordionDemo() {
  return (
    <Accordion multiple defaultValue={['a', 'b']} headingLevel={3}>
      <AccordionItem value="a" title="采样设置" meta="3 项">
        批次、间隔与重试次数（示例）。
      </AccordionItem>
      <AccordionItem value="b" title="通知" meta="2 项">
        完成后通知记录负责人（示例）。
      </AccordionItem>
      <AccordionItem value="c" title="高级">
        仅管理员可见的设置（示例）。
      </AccordionItem>
    </Accordion>
  );
}

function EffortDemo() {
  const [effort, setEffort] = React.useState(2);
  return (
    <Slider
      label="执行强度（示例）"
      min={0}
      max={4}
      marks={effortMarks}
      value={effort}
      onValueChange={setEffort}
      showValue
      name="effort"
      description="档位越高，单次运行耗时越长（示例说明，非真实指标）。"
    />
  );
}

function SliderStates() {
  return (
    <div className="sc-card-list">
      <Slider label="阈值" defaultValue={40} step={5} showValue formatValue={(v) => `${v}%`} />
      <Slider label="比例（Intl percent）" defaultValue={0.35} min={0} max={1} step={0.05} format={{ style: 'percent' }} showValue />
      <Slider
        label="温度区间（示例）"
        defaultValue={[18, 26]}
        min={10}
        max={40}
        thumbLabels={['温度下限', '温度上限']}
        showValue
        formatValue={(v) => `${v} ℃`}
      />
      <Slider label="禁用" defaultValue={60} disabled showValue />
    </div>
  );
}

function NumberFieldDemo() {
  const [value, setValue] = React.useState<number | null>(4);
  return (
    <div className="sc-card-list">
      <NumberField
        label="并发上限"
        description="1–8 个任务（示例）。↑/↓ 调整，Shift 一次 10。"
        min={1}
        max={8}
        value={value}
        onValueChange={setValue}
        unit="个"
        name="concurrency"
      />
      <p className="sc-small">当前值：{value ?? '空'}</p>
    </div>
  );
}

function NumberFieldStates() {
  return (
    <div className="sc-card-list">
      <NumberField label="预算（EUR 格式）" defaultValue={1234.5} format={{ style: 'currency', currency: 'EUR' }} step={10} />
      <NumberField label="采样比例" defaultValue={0.25} min={0} max={1} step={0.05} format={{ style: 'percent' }} />
      <NumberField label="重试次数" defaultValue={12} invalid error="不能超过 10 次（示例）。" />
      <NumberField label="小尺寸" size="sm" defaultValue={3} />
      <NumberField label="只读" defaultValue={5} readOnly />
      <NumberField label="禁用" defaultValue={2} disabled />
    </div>
  );
}

const rows = [
  { id: 'REC-0142', title: '沉积物样本 · 第三批次', status: '审核中' },
  { id: 'REC-0143', title: '水体样本 · 第一批次', status: '已归档' },
];

function ContextMenuDemo() {
  const toast = useToast();
  const [pinned, setPinned] = React.useState<string[]>([]);
  return (
    <div className="sc-card-list">
      {rows.map((row) => {
        const isPinned = pinned.includes(row.id);
        const togglePin = (next: boolean) => setPinned((list) => (next ? [...list, row.id] : list.filter((id) => id !== row.id)));
        const items = (
          <>
            <MenuItem onSelect={() => toast.show({ title: `已复制 ${row.id}（示例）` })}>复制编号</MenuItem>
            <MenuCheckboxItem checked={isPinned} onCheckedChange={togglePin}>
              固定到顶部
            </MenuCheckboxItem>
            <MenuSeparator />
            <MenuItem tone="danger" disabled={row.status === '已归档'}>
              归档…
            </MenuItem>
          </>
        );
        return (
          <div key={row.id} className="sc-row">
            <ContextMenu
              trigger={
                <Surface
                  as="div"
                  padding="sm"
                  className="sc-row"
                  role="group"
                  aria-label={`档案行 ${row.id}`}
                  aria-describedby="advanced-context-hint"
                >
                  <code className="sc-mono-sm">{row.id}</code>
                  <span>{row.title}</span>
                  <StatusBadge size="sm" status={row.status === '已归档' ? 'success' : 'info'}>
                    {row.status}
                  </StatusBadge>
                  {isPinned && <span className="sc-small">已固定</span>}
                </Surface>
              }
            >
              {items}
            </ContextMenu>
            {/* The same commands stay reachable without the context menu. */}
            <Menu trigger={<Button size="sm" variant="ghost">{`操作 ${row.id}`}</Button>} align="end">
              {items}
            </Menu>
          </div>
        );
      })}
      <p id="advanced-context-hint" className="sc-small">
        右键或 Shift+F10 打开菜单；触屏长按。每行右侧按钮提供同样的操作。
      </p>
    </div>
  );
}

function CompactDemo() {
  return (
    <ThemeScope density="compact" className="sc-density-pane">
      <p className="sc-subhead">Compact</p>
      <NumberField label="并发上限（紧凑）" defaultValue={4} min={1} max={8} />
      <Slider label="执行强度（紧凑）" min={0} max={4} marks={effortMarks} defaultValue={1} />
      <Accordion
        items={[
          { value: 'x', title: '紧凑分区一', content: '示例内容。' },
          { value: 'y', title: '紧凑分区二', content: '示例内容。' },
        ]}
      />
    </ThemeScope>
  );
}

export function AdvancedPage() {
  return (
    <div className="sc-page">
      <PageHeader index="25" section="Advanced interaction" title="Accordion · Slider · NumberField · ContextMenu">
        M12 高级交互（ADR-0010 §2），全部基于 Base UI。页面中的数值与档位均为示例，不代表真实监测指标。
      </PageHeader>
      <SpecimenGrid>
        <Specimen
          id="advanced-accordion"
          index="01"
          title="Accordion · single"
          span="half"
          align="start"
          note="标题（默认 h3）包裹按钮；高度 --accordion-panel-height 过渡 --rl-motion-base，可中断；减动即时。Tab 在标题间移动（Base UI 1.9 遵循新版 APG，无方向键漫游）。"
        >
          <AccordionDemo />
        </Specimen>
        <Specimen id="advanced-accordion-multiple" index="02" title="Accordion · multiple" span="half" align="start" note="multiple：可同时展开多项；meta 是按钮名称的一部分。">
          <MultipleAccordionDemo />
        </Specimen>
        <Specimen id="advanced-slider-states" index="03" title="Slider · states" span="half" align="start" note="format 使用 RhineProvider locale；区间滑块每个滑块有独立名称。">
          <SliderStates />
        </Specimen>
        <Specimen id="advanced-number-states" index="04" title="NumberField · states" span="half" align="start" note="Intl 格式、invalid、sm、readOnly、disabled。">
          <NumberFieldStates />
        </Specimen>
        <Specimen
          id="advanced-effort"
          index="05"
          title="Slider · discrete marks"
          span="half"
          align="start"
          note="marks 渲染刻度与标签（aria-hidden）；档位标签即 aria-valuetext。方向键 / PageUp / Home / End。"
        >
          <EffortDemo />
        </Specimen>
        <Specimen
          id="advanced-number"
          index="06"
          title="NumberField"
          span="half"
          align="start"
          note="步进按钮不在 Tab 顺序中（方向键等效），名称来自 numberField 文案；到达边界时禁用。"
        >
          <NumberFieldDemo />
        </Specimen>
        <Specimen id="advanced-context" index="07" title="ContextMenu" span="two-thirds" align="start" note="复用 Menu 部件与 rl-menu 样式；Esc 关闭并把焦点还给行。">
          <ContextMenuDemo />
        </Specimen>
        <Specimen id="advanced-compact" index="08" title="Compact density" span="third" align="start">
          <CompactDemo />
        </Specimen>
      </SpecimenGrid>
    </div>
  );
}
