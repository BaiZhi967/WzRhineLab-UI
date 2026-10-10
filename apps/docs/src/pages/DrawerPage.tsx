import * as React from 'react';
import { Button, Checkbox, CheckboxGroup, Drawer, Field, Input, MetadataList, Select, StatusBadge } from '@wzrhine/react';
import type { DrawerSide, DrawerSize } from '@wzrhine/react';
import { Playground } from '../ui/Playground';
import { PageHeader, Specimen, SpecimenGrid } from '../ui/Specimen';
import { Segmented, Toggle } from '../ui/controls';

function DrawerPlayground() {
  const [side, setSide] = React.useState<DrawerSide>('end');
  const [size, setSize] = React.useState<DrawerSize>('md');
  const [eyebrow, setEyebrow] = React.useState(true);
  const props = [
    eyebrow && 'eyebrow="ARCHIVE / DETAIL"',
    'title="ARC-1024"',
    'description="记录详情（样例）"',
    side !== 'end' && `side="${side}"`,
    size !== 'md' && `size="${size}"`,
  ].filter(Boolean);
  return (
    <Playground
      id="drawer-playground"
      title="Drawer"
      code={[
        '<Drawer',
        '  trigger={<Button variant="secondary">查看详情</Button>}',
        ...props.map((p) => `  ${p}`),
        '>',
        '  <MetadataList items={…} />',
        '</Drawer>',
      ].join('\n')}
      controls={
        <>
          <Segmented
            legend="side"
            name="pg-drawer-side"
            value={side}
            onChange={setSide}
            options={[
              { value: 'end', label: 'end' },
              { value: 'start', label: 'start' },
            ]}
          />
          <Segmented
            legend="size"
            name="pg-drawer-size"
            value={size}
            onChange={setSize}
            options={[
              { value: 'sm', label: 'sm' },
              { value: 'md', label: 'md' },
              { value: 'lg', label: 'lg' },
            ]}
          />
          <Toggle label="eyebrow" checked={eyebrow} onChange={setEyebrow} />
          <p className="sc-small sc-control-note">视口窄于 40rem 时改为底部弹出，side 与 size 不再生效。</p>
        </>
      }
    >
      <div className="sc-playground__demo">
        <Drawer
          trigger={<Button variant="secondary">查看详情</Button>}
          eyebrow={eyebrow ? 'ARCHIVE / DETAIL' : undefined}
          title="ARC-1024"
          description="记录详情（样例）"
          side={side}
          size={size}
        >
          <MetadataList
            aria-label="记录元数据"
            items={[
              { label: '编号', value: 'ARC-1024', mono: true },
              { label: '类别', value: '样本' },
              { label: '负责人', value: '示例研究员 A' },
              { label: '存放位置', value: '样本库 · A 区' },
            ]}
          />
          <p className="sc-small">样例档案记录，不代表真实数据。</p>
        </Drawer>
      </div>
    </Playground>
  );
}

const categoryOptions = [
  { value: 'all', label: '全部类别' },
  { value: 'specimen', label: '样本' },
  { value: 'experiment', label: '实验记录' },
  { value: 'report', label: '外勤报告' },
];

function FilterDrawer() {
  const [open, setOpen] = React.useState(false);
  const [applied, setApplied] = React.useState<string | null>(null);

  const apply = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const parts = [String(data.get('q') || '（无关键词）'), ...data.getAll('flags').map(String)];
    setApplied(parts.join(' · '));
    setOpen(false);
  };

  return (
    <>
      <Drawer
        open={open}
        onOpenChange={setOpen}
        trigger={<Button variant="secondary">筛选…</Button>}
        side="start"
        size="sm"
        eyebrow="ARCHIVE / FILTER"
        title="筛选档案"
        description="条件仅作用于本页样例数据。"
        actions={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              取消
            </Button>
            <Button type="submit" form="drawer-filter-form">
              应用筛选
            </Button>
          </>
        }
      >
        <form id="drawer-filter-form" className="sc-stack" onSubmit={apply}>
          <Field label="关键词">
            <Input name="q" placeholder="编号或标题" />
          </Field>
          <Field label="类别">
            <Select name="category" defaultValue="all" options={categoryOptions} />
          </Field>
          <CheckboxGroup label="附加条件" name="flags" optional>
            <Checkbox value="待复核" label="只看待复核" />
            <Checkbox value="含影像" label="含影像资料" />
          </CheckboxGroup>
        </form>
      </Drawer>
      <p className="sc-small" role="status">
        {applied ? `已应用：${applied}（演示）` : '未应用筛选'}
      </p>
    </>
  );
}

function SizeVariants() {
  return (
    <div className="sc-row">
      {(['sm', 'md', 'lg'] as const).map((size) => (
        <Drawer
          key={size}
          trigger={<Button variant="ghost">打开 {size}</Button>}
          title={`尺寸 ${size}`}
          description={`宽度取 --rl-dialog-width-${size}`}
          size={size}
        >
          <p className="sc-small">宽屏时复用 Dialog 的宽度 token，且不超过视口宽度减去 48px。</p>
        </Drawer>
      ))}
    </div>
  );
}

const logEntries = Array.from({ length: 40 }, (_, i) => ({
  id: `LOG-${String(i + 1).padStart(3, '0')}`,
  text: ['样本移入冷藏柜', '复核意见已登记', '影像资料已关联'][i % 3]!,
}));

function LongDrawer() {
  return (
    <Drawer
      trigger={<Button variant="secondary">查看操作日志</Button>}
      eyebrow="ARCHIVE / LOG"
      title="操作日志"
      description="40 条样例日志；头部与底部固定，正文单独滚动。"
      actions={<Button variant="ghost">导出（演示）</Button>}
    >
      <ol className="sc-drawer-log">
        {logEntries.map((entry) => (
          <li key={entry.id}>
            <code className="sc-mono-sm">{entry.id}</code> {entry.text}（样例）
          </li>
        ))}
      </ol>
    </Drawer>
  );
}

function GuardedDrawer() {
  const [open, setOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [saved, setSaved] = React.useState<string | null>(null);
  const [refused, setRefused] = React.useState(0);
  const noteRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (!saving) return;
    const t = window.setTimeout(() => {
      setSaving(false);
      setSaved(noteRef.current?.value || '（无备注）');
      setOpen(false);
    }, 1500);
    return () => window.clearTimeout(t);
  }, [saving]);

  return (
    <>
      <Drawer
        open={open}
        onOpenChange={(next) => {
          if (next) setRefused(0);
          setOpen(next);
        }}
        trigger={<Button>编辑备注…</Button>}
        eyebrow="ARCHIVE / EDIT"
        title="编辑记录备注"
        description="保存中无法关闭：Esc、遮罩与关闭按钮都会被拒绝。"
        initialFocus={noteRef}
        onCloseRequest={() => {
          if (!saving) return undefined;
          setRefused((n) => n + 1);
          return false;
        }}
        actions={
          <>
            <Button variant="ghost" disabled={saving} onClick={() => setOpen(false)}>
              取消
            </Button>
            <Button loading={saving} onClick={() => setSaving(true)}>
              保存
            </Button>
          </>
        }
      >
        <Field label="备注" optional description="最多 120 字。">
          <Input ref={noteRef} maxLength={120} placeholder="例如：复核完成" />
        </Field>
        <p className="sc-small" aria-live="polite">
          {saving ? `保存中…${refused > 0 ? `已拒绝 ${refused} 次关闭请求。` : ''}` : ''}
        </p>
      </Drawer>
      <p className="sc-small" role="status">
        {saved ? (
          <>
            <StatusBadge status="success" size="sm">
              已保存
            </StatusBadge>{' '}
            备注：{saved}（演示）
          </>
        ) : (
          '尚未保存'
        )}
      </p>
    </>
  );
}

export function DrawerPage() {
  return (
    <div className="sc-page">
      <PageHeader index="22" section="Navigation & Overlay" title="Drawer">
        <p>
          基于 Base UI Drawer：焦点进入与循环、Esc 与遮罩关闭、滚动锁定、背景隔离、关闭后焦点归还与滑动关闭由底座负责。宽屏从书写方向的{' '}
          <code>side</code> 一侧滑入；视口窄于 40rem 时改为底部弹出（最高 85% 视口高度）。进出场由 CSS transition 负责（panel 280ms），
          拖动时跟手；减动时只淡入淡出。面板挂载到最近的 <code>RhineProvider</code>，继承主题与密度。
        </p>
      </PageHeader>
      <SpecimenGrid>
        <DrawerPlayground />
        <Specimen id="drawer-filter" index="01" title="Filter drawer" span="half" note='side="start" · size="sm"；底部操作栏固定，提交按钮经 form 属性关联表单。'>
          <div className="sc-stack">
            <FilterDrawer />
          </div>
        </Specimen>
        <Specimen id="drawer-guard" index="02" title="Close guard" span="half" note="onCloseRequest 返回 false 时取消本次关闭，焦点不动。">
          <div className="sc-stack">
            <GuardedDrawer />
          </div>
        </Specimen>
        <Specimen id="drawer-sizes" index="03" title="Sizes" span="half" note="sm 400 / md 520 / lg 720（--rl-dialog-width-*）。">
          <SizeVariants />
        </Specimen>
        <Specimen id="drawer-long" index="04" title="Long content" span="half" note="正文溢出时成为可聚焦的滚动区域，键盘可滚动。">
          <LongDrawer />
        </Specimen>
        <Specimen id="drawer-rules" index="05" title="Behaviour" note="以上行为在 Chromium / Firefox / WebKit E2E 中断言。">
          <ul className="sc-rules">
            <li data-kind="do">与当前页面并列查看的内容：记录详情、筛选条件</li>
            <li data-kind="do">Esc、遮罩、关闭按钮或滑动关闭，焦点回到触发按钮</li>
            <li data-kind="do">快速连续开关不会残留面板，动画从当前位置接续</li>
            <li data-kind="dont">需要确认后果的操作（用 AlertDialog）；多步骤长流程（用独立页面）</li>
          </ul>
        </Specimen>
      </SpecimenGrid>
    </div>
  );
}
