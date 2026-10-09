import * as React from 'react';
import { StatusBadge, Surface } from '@wzrhine/react';
import type { SurfacePadding, SurfaceTone } from '@wzrhine/react';
import { Playground } from '../ui/Playground';
import { PageHeader, Specimen, SpecimenGrid } from '../ui/Specimen';
import { Segmented, Toggle } from '../ui/controls';

const tones: Array<{ value: SurfaceTone; label: string }> = [
  { value: 'default', label: 'default' },
  { value: 'subtle', label: 'subtle' },
  { value: 'raised', label: 'raised' },
];
const paddings: SurfacePadding[] = ['none', 'sm', 'md', 'lg'];

function SampleRecord({ titleId }: { titleId?: string }) {
  return (
    <div className="sc-record">
      <p className="sc-record__id">REC-EXAMPLE</p>
      <h3 id={titleId} className="sc-record__title">
        示例档案记录
      </h3>
      <p className="sc-small">展示用占位内容，不代表真实监测数据。</p>
      <dl className="sc-record__meta">
        <div>
          <dt>类别</dt>
          <dd>示例</dd>
        </div>
        <div>
          <dt>状态</dt>
          <dd>
            <StatusBadge status="info" size="sm">
              审核中
            </StatusBadge>
          </dd>
        </div>
      </dl>
    </div>
  );
}

function SurfacePlayground() {
  const [tone, setTone] = React.useState<SurfaceTone>('default');
  const [padding, setPadding] = React.useState<SurfacePadding>('md');
  const [bordered, setBordered] = React.useState(true);
  const props = [
    tone !== 'default' && `tone="${tone}"`,
    padding !== 'md' && `padding="${padding}"`,
    !bordered && 'bordered={false}',
  ].filter(Boolean);
  return (
    <Playground
      id="surface-playground"
      title="Surface"
      code={`<Surface${props.length ? ` ${props.join(' ')}` : ''} aria-labelledby="record-title">\n  …\n</Surface>`}
      controls={
        <>
          <Segmented legend="tone" name="pg-tone" value={tone} onChange={setTone} options={tones} />
          <Segmented
            legend="padding"
            name="pg-padding"
            value={padding}
            onChange={setPadding}
            options={paddings.map((p) => ({ value: p, label: p }))}
          />
          <Toggle label="bordered" checked={bordered} onChange={setBordered} />
        </>
      }
    >
      <Surface tone={tone} padding={padding} bordered={bordered} aria-labelledby="pg-record-title" className="sc-fill">
        <SampleRecord titleId="pg-record-title" />
      </Surface>
    </Playground>
  );
}

export function SurfacePage() {
  return (
    <div className="sc-page">
      <PageHeader index="03" section="Components / Layout" title="Surface">
        <p>
          内容容器。层级首先由底色明度表达，<code>raised</code> 才使用轻阴影。默认渲染 <code>&lt;section&gt;</code>，
          提供 <code>aria-labelledby</code> 时成为 region 地标；纯视觉分组请用 <code>as="div"</code>。
        </p>
      </PageHeader>
      <SpecimenGrid>
        <SurfacePlayground />
        <Specimen id="surface-tones" index="01" title="Tones" note="边框为 --rl-border-subtle 装饰线，不作为交互边界。">
          <div className="sc-tone-row">
            {tones.map((t) => (
              <Surface key={t.value} as="div" tone={t.value} padding="sm">
                <p className="sc-mono-sm sc-muted">tone="{t.value}"</p>
                <p className="sc-small">
                  {t.value === 'default' && '内容表面，默认层级。'}
                  {t.value === 'subtle' && '次级区域，侧栏或分组背景。'}
                  {t.value === 'raised' && '浮起层，仅在需要分离时使用。'}
                </p>
              </Surface>
            ))}
          </div>
        </Specimen>
        <Specimen id="surface-nesting" index="02" title="Nesting" note="嵌套时内层使用 subtle，避免层层加阴影。">
          <Surface as="div">
            <p className="sc-subhead">外层 · default</p>
            <Surface as="div" tone="subtle" padding="sm">
              <p className="sc-small">内层 · subtle · padding sm</p>
            </Surface>
          </Surface>
        </Specimen>
      </SpecimenGrid>
    </div>
  );
}
