import * as React from 'react';
import { Button } from '@wzrhine/react';
import type { ButtonSize, ButtonVariant } from '@wzrhine/react';
import { Archive, ArrowRight, Download, Plus } from '../icons';
import { Playground } from '../ui/Playground';
import { PageHeader, Specimen, SpecimenGrid } from '../ui/Specimen';
import { Segmented, TextField, Toggle } from '../ui/controls';

const variants: Array<{ value: ButtonVariant; label: string; note: string }> = [
  { value: 'primary', label: 'Primary', note: '深墨填充，页面主操作' },
  { value: 'accent', label: 'Accent', note: '研究橙信号，每个视图至多一处' },
  { value: 'secondary', label: 'Secondary', note: '描边，次级操作' },
  { value: 'ghost', label: 'Ghost', note: '无边框，低强调或工具栏' },
];
const sizes: ButtonSize[] = ['sm', 'md', 'lg'];

function useFakeTask(ms = 1600) {
  const [busy, setBusy] = React.useState(false);
  const [runs, setRuns] = React.useState(0);
  React.useEffect(() => {
    if (!busy) return;
    const t = window.setTimeout(() => {
      setBusy(false);
      setRuns((n) => n + 1);
    }, ms);
    return () => window.clearTimeout(t);
  }, [busy, ms]);
  return { busy, runs, start: () => setBusy(true) };
}

function ButtonPlayground() {
  const [variant, setVariant] = React.useState<ButtonVariant>('primary');
  const [size, setSize] = React.useState<ButtonSize>('md');
  const [disabled, setDisabled] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [icon, setIcon] = React.useState<'none' | 'start' | 'end'>('none');
  const [label, setLabel] = React.useState('保存记录');
  const [clicks, setClicks] = React.useState(0);

  const props = [
    variant !== 'primary' && `variant="${variant}"`,
    size !== 'md' && `size="${size}"`,
    disabled && 'disabled',
    loading && 'loading',
    icon === 'start' && 'iconStart={<Download />}',
    icon === 'end' && 'iconEnd={<ArrowRight />}',
  ].filter(Boolean);
  const code = `<Button${props.length ? ` ${props.join(' ')}` : ''} onClick={save}>\n  ${label || '…'}\n</Button>`;

  return (
    <Playground
      id="button-playground"
      title="Button"
      code={code}
      controls={
        <>
          <Segmented legend="variant" name="pg-variant" value={variant} onChange={setVariant} options={variants} />
          <Segmented
            legend="size"
            name="pg-size"
            value={size}
            onChange={setSize}
            options={sizes.map((s) => ({ value: s, label: s }))}
          />
          <Segmented
            legend="icon"
            name="pg-icon"
            value={icon}
            onChange={setIcon}
            options={[
              { value: 'none', label: '无' },
              { value: 'start', label: 'start' },
              { value: 'end', label: 'end' },
            ]}
          />
          <Toggle label="disabled" checked={disabled} onChange={setDisabled} />
          <Toggle label="loading" checked={loading} onChange={setLoading} description="保持焦点与名称，阻止重复激活" />
          <TextField label="label" value={label} onChange={setLabel} />
        </>
      }
    >
      <div className="sc-playground__demo">
        <Button
          variant={variant}
          size={size}
          disabled={disabled}
          loading={loading}
          iconStart={icon === 'start' ? <Download /> : undefined}
          iconEnd={icon === 'end' ? <ArrowRight /> : undefined}
          onClick={() => setClicks((n) => n + 1)}
        >
          {label || '…'}
        </Button>
        <p className="sc-small sc-mono-sm" aria-live="polite">
          onClick × {clicks}
        </p>
      </div>
    </Playground>
  );
}

function StateMatrix() {
  const columns = ['default', 'disabled', 'loading'] as const;
  return (
    <div className="sc-table-wrap" tabIndex={0} role="region" aria-label="Button 状态矩阵（可横向滚动）">
      <table className="sc-matrix">
        <thead>
          <tr>
            <th scope="col">variant</th>
            {columns.map((c) => (
              <th key={c} scope="col">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {variants.map((v) => (
            <tr key={v.value}>
              <th scope="row">
                <code className="sc-mono-sm">{v.value}</code>
                <span className="sc-small">{v.note}</span>
              </th>
              <td>
                <Button variant={v.value}>{v.label}</Button>
              </td>
              <td>
                <Button variant={v.value} disabled>
                  {v.label}
                </Button>
              </td>
              <td>
                <Button variant={v.value} loading>
                  {v.label}
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ButtonPage() {
  const task = useFakeTask();
  return (
    <div className="sc-page">
      <PageHeader index="02" section="Components / Actions" title="Button">
        <p>
          原生 <code>&lt;button&gt;</code>，默认 <code>type="button"</code>。<code>loading</code> 阻止重复激活但保留焦点与可访问名称；
          <code>disabled</code> 使用原生禁用并移出 Tab 顺序。
        </p>
      </PageHeader>

      <SpecimenGrid>
        <ButtonPlayground />

        <Specimen
          id="button-matrix"
          index="01"
          title="State matrix"
          note="hover 120ms · press 80ms（scale 0.985）· 加载时内容淡出、宽度不变。"
        >
          <StateMatrix />
        </Specimen>

        <Specimen id="button-sizes" index="02" title="Sizes" span="half" align="start" center note="高度来自 --rl-control-height-*，随密度变化。">
          <div className="sc-row sc-row--baseline">
            {sizes.map((s) => (
              <Button key={s} size={s} variant="secondary">
                Size {s}
              </Button>
            ))}
          </div>
        </Specimen>

        <Specimen id="button-icons" index="03" title="With icons" span="half" align="start" center note="图标为装饰（aria-hidden），名称来自文字。">
          <div className="sc-row">
            <Button iconStart={<Plus />}>新建记录</Button>
            <Button variant="secondary" iconStart={<Download />}>
              导出
            </Button>
            <Button variant="ghost" iconEnd={<ArrowRight />}>
              查看详情
            </Button>
          </div>
        </Specimen>

        <Specimen
          id="button-loading"
          index="04"
          title="Loading flow"
          span="half"
          center
          note="点击后 1.6s 内重复点击不会触发第二次提交；完成后焦点仍在按钮上。"
        >
          <div className="sc-row">
            <Button variant="accent" loading={task.busy} onClick={task.start} iconStart={<Archive />}>
              归档样本
            </Button>
          </div>
          <p className="sc-small" role="status">
            {task.busy ? '正在归档…' : task.runs > 0 ? `已完成 ${task.runs} 次归档（演示）` : '尚未执行'}
          </p>
        </Specimen>

        <Specimen
          id="button-long"
          index="05"
          title="Long content"
          span="half"
          center
          note="长中文与长英文词在容器内换行，不撑破网格。"
        >
          <div className="sc-narrow">
            <Button variant="secondary">提交跨部门样本复核申请并通知全部相关研究人员</Button>
            <Button variant="ghost">Supercalifragilisticexpialidocious-archive-identifier</Button>
          </div>
        </Specimen>
      </SpecimenGrid>
    </div>
  );
}
