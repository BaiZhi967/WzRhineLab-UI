import * as React from 'react';
import { Alert, Button, Callout, EmptyState, Skeleton, Spinner, Surface } from '@wzrhine/react';
import type { AlertTone, EmptyStateKind } from '@wzrhine/react';
import { PageHeader, Specimen, SpecimenGrid } from '../ui/Specimen';
import { Segmented } from '../ui/controls';

const toneCopy: Record<AlertTone, { title: string; body: string }> = {
  neutral: { title: '草稿未提交', body: '修改仅保存在本页（示例）。' },
  info: { title: '本周例行维护', body: '周四 22:00 起档案服务只读（示例时间）。' },
  success: { title: '校验通过', body: '12 条记录可以导出（示例数据）。' },
  warning: { title: '3 条记录未通过校验', body: '导出前请先修正标记的字段（示例数据）。' },
  danger: { title: '导出失败', body: '档案服务暂时不可用，请稍后重试（示例）。' },
};
const tones = Object.keys(toneCopy) as AlertTone[];

function ToneMatrix() {
  return (
    <div className="sc-card-list">
      {tones.map((tone) => (
        <Alert key={tone} tone={tone} title={toneCopy[tone].title}>
          {toneCopy[tone].body}
        </Alert>
      ))}
      <Alert tone="info">没有标题的提示：只放一句正文（示例）。</Alert>
      <Alert
        tone="warning"
        title="2 条记录缺少采集日期"
        action={
          <Button size="sm" variant="secondary">
            查看记录
          </Button>
        }
      >
        补全后才能提交复核（示例数据）。
      </Alert>
    </div>
  );
}

/** A dismissed alert leaves the DOM; focus goes to the control that can bring it back. */
function DismissDemo() {
  const [open, setOpen] = React.useState(true);
  const restoreRef = React.useRef<HTMLButtonElement>(null);
  const dismissed = React.useRef(false);
  React.useEffect(() => {
    if (!open && dismissed.current) restoreRef.current?.focus();
  }, [open]);
  return (
    <div className="sc-card-list">
      {open && (
        <Alert
          tone="warning"
          title="3 条记录未通过校验"
          onDismiss={() => {
            dismissed.current = true;
            setOpen(false);
          }}
        >
          导出前请先修正（示例数据）。
        </Alert>
      )}
      <div className="sc-row">
        <Button ref={restoreRef} size="sm" variant="secondary" onClick={() => setOpen(true)}>
          重新显示提示
        </Button>
        <span className="sc-small">关闭后焦点移到此按钮。</span>
      </div>
    </div>
  );
}

/** Live alerts: the polite container is mounted before its content changes, so the change is announced. */
function LiveDemo() {
  const [state, setState] = React.useState<'idle' | 'running' | 'done' | 'failed'>('idle');
  const timer = React.useRef<number | undefined>(undefined);
  React.useEffect(() => () => window.clearTimeout(timer.current), []);
  const run = (fail: boolean) => {
    window.clearTimeout(timer.current);
    setState('running');
    timer.current = window.setTimeout(() => setState(fail ? 'failed' : 'done'), 800);
  };
  const message =
    state === 'done'
      ? { tone: 'success' as const, title: '校验完成', body: '12 条示例记录全部通过。' }
      : state === 'running'
        ? { tone: 'neutral' as const, title: '正在校验…', body: '示例记录 12 条。' }
        : { tone: 'neutral' as const, title: '尚未校验', body: '点击「校验示例记录」开始。' };
  return (
    <div className="sc-card-list">
      <div className="sc-row">
        <Button size="sm" loading={state === 'running'} onClick={() => run(false)}>
          校验示例记录
        </Button>
        <Button size="sm" variant="ghost" onClick={() => run(true)}>
          模拟校验失败
        </Button>
      </div>
      <Alert live="polite" tone={message.tone} title={message.title}>
        {message.body}
      </Alert>
      {state === 'failed' && (
        <Alert live="assertive" tone="danger" title="校验失败">
          示例服务返回错误，请重试。
        </Alert>
      )}
    </div>
  );
}

const kinds: { kind: EmptyStateKind; title: string; description: string; action?: string }[] = [
  { kind: 'empty', title: '这个批次还没有记录', description: '导入或新建记录后会显示在这里。' },
  { kind: 'no-results', title: '没有符合条件的记录', description: '调整筛选条件后重试。', action: '清除筛选' },
  { kind: 'no-permission', title: '没有查看该批次的权限', description: '联系档案管理员申请访问（示例）。' },
  { kind: 'first-use', title: '创建第一条观测记录', description: '记录编号会自动生成。', action: '新建记录' },
];

function EmptyDemo() {
  const [size, setSize] = React.useState<'sm' | 'md'>('md');
  return (
    <div className="sc-stack sc-stack--wide">
      <Segmented
        legend="size"
        name="empty-size"
        value={size}
        onChange={setSize}
        options={[
          { value: 'md', label: 'md · 整块区域' },
          { value: 'sm', label: 'sm · 卡片 / 表格内' },
        ]}
      />
      <div className="sc-stat-row">
        {kinds.map((k) => (
          <Surface key={k.kind} as="div" tone="subtle" padding="sm" data-kind={k.kind}>
            <EmptyState
              kind={k.kind}
              size={size}
              headingLevel={3}
              title={k.title}
              description={k.description}
              action={
                k.action ? (
                  <Button size="sm" variant="secondary">
                    {k.action}
                  </Button>
                ) : undefined
              }
            />
          </Surface>
        ))}
      </div>
      <Surface as="div" padding="sm">
        <EmptyState kind="no-results" size="sm" title="段落标题（未传 headingLevel）" description="用于表格单元格等不宜出现标题的位置。" />
      </Surface>
    </div>
  );
}

function SkeletonDemo() {
  const [loading, setLoading] = React.useState(true);
  return (
    <div className="sc-stack sc-stack--wide">
      <div className="sc-row">
        <Button size="sm" variant="secondary" onClick={() => setLoading((v) => !v)}>
          {loading ? '模拟加载完成' : '重新加载'}
        </Button>
      </div>
      <div className="sc-stat-row">
        <Surface as="section" padding="sm" aria-label="记录摘要（示例）" aria-busy={loading || undefined} data-testid="skeleton-card">
          {loading ? (
            <div className="sc-card-list">
              <div className="sc-row">
                <Skeleton shape="circle" width="var(--rl-space-8)" />
                <Skeleton width="8rem" />
              </div>
              <Skeleton lines={3} />
              <span className="sc-visually-hidden">正在加载记录摘要</span>
            </div>
          ) : (
            <div className="sc-card-list">
              <strong>ARC-1024 · 示例记录</strong>
              <p className="sc-small">沉积物采样第三批次。本卡片内容为示例，用于演示加载完成后的状态。</p>
            </div>
          )}
        </Surface>
        <div className="sc-card-list">
          <p className="sc-small">shape="block" height="var(--rl-space-16)"</p>
          <Skeleton shape="block" height="var(--rl-space-16)" />
          <p className="sc-small">lines={2} width="60%"</p>
          <Skeleton lines={2} width="60%" />
        </div>
      </div>
    </div>
  );
}

function SpinnerDemo() {
  return (
    <div className="sc-card-list">
      <div className="sc-row">
        <Spinner size="sm" />
        <Spinner size="md" />
        <Spinner size="lg" />
        <span className="sc-small">无 label：装饰性（aria-hidden）</span>
      </div>
      <div className="sc-row">
        <Spinner size="md" label="正在加载批次列表（示例）" />
        <span className="sc-small" aria-hidden="true">
          有 label：role="status"，文字仅读屏可见
        </span>
      </div>
    </div>
  );
}

export function FeedbackPage() {
  return (
    <div className="sc-page">
      <PageHeader index="23" section="Components" title="Alert & feedback">
        <p>
          页面内的状态与占位（ADR-0006）：<code>Alert</code> 显式选择宣告方式，<code>Callout</code> 是不宣告的旁注，<code>EmptyState</code>{' '}
          说明为什么没有内容以及下一步，<code>Skeleton</code> 与 <code>Spinner</code> 只负责视觉，语义交给容器的 <code>aria-busy</code>{' '}
          和状态文字。本页文案与数字均为示例。
        </p>
      </PageHeader>
      <SpecimenGrid>
        <Specimen
          id="feedback-tones"
          index="01"
          title="Alert tones"
          note="颜色之外必有图标与文字；正文始终为 fg-primary。默认 live=off：页面加载时已存在的提示不宣告。"
        >
          <ToneMatrix />
        </Specimen>
        <Specimen
          id="feedback-live"
          index="02"
          title="Live alert"
          span="half"
          align="start"
          note="polite → role=status，容器先挂载、再更新内容；assertive → role=alert，只用于失败。同一消息不再用 Toast 重复宣告。"
        >
          <LiveDemo />
        </Specimen>
        <Specimen
          id="feedback-dismiss"
          index="03"
          title="Dismissible alert"
          span="half"
          align="start"
          note="组件不持有隐藏状态：调用方移除提示，并把焦点移到合理位置（此处为「重新显示提示」）。"
        >
          <DismissDemo />
        </Specimen>
        <Specimen id="feedback-callout" index="04" title="Callout" span="half" align="start" note='role="note"，不宣告、不可关闭；用于数据来源、限制条件等旁注。'>
          <div className="sc-card-list">
            <Callout tone="info" title="关于样例数据">
              本页数值由固定种子生成，不代表真实监测。
            </Callout>
            <Callout tone="warning" title="导出限制">
              单次最多导出 1000 条记录（示例规则）。
            </Callout>
            <Callout tone="neutral">字段说明以档案规范为准。</Callout>
          </div>
        </Specimen>
        <Specimen id="feedback-spinner" index="05" title="Spinner" span="half" align="start" note="sm 14 / md 16 / lg 20（icon-size）；线性旋转 --rl-motion-loop，减动时静止为较长弧线。">
          <SpinnerDemo />
        </Specimen>
        <Specimen
          id="feedback-skeleton"
          index="06"
          title="Skeleton"
          note="Skeleton 始终 aria-hidden；容器设 aria-busy 并提供「正在加载」文字。呼吸动画 --rl-motion-loop，减动时为静态色块。"
        >
          <SkeletonDemo />
        </Specimen>
        <Specimen
          id="feedback-empty"
          index="07"
          title="EmptyState"
          note="kind 只影响默认图标（装饰性）；headingLevel 让标题成为 h2–h6，不传则为段落。无 live 角色：空结果由筛选计数宣告。"
        >
          <EmptyDemo />
        </Specimen>
      </SpecimenGrid>
    </div>
  );
}
