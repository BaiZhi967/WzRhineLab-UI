import * as React from 'react';
import { Text } from '@wzrhine/react';
import type { TextTone, TextVariant } from '@wzrhine/react';
import { Playground } from '../ui/Playground';
import { PageHeader, Specimen, SpecimenGrid } from '../ui/Specimen';
import { Segmented, TextField, Toggle } from '../ui/controls';

const variants: TextVariant[] = [
  'display',
  'heading-1',
  'heading-2',
  'heading-3',
  'body',
  'body-sm',
  'label',
  'meta',
  'mono',
  'eyebrow',
];
const tones: TextTone[] = ['primary', 'muted', 'subtle', 'accent', 'danger', 'success', 'warning', 'info'];

const sample: Record<TextVariant, string> = {
  display: 'Research archive',
  'heading-1': '样本档案总览',
  'heading-2': '实验记录',
  'heading-3': '观测条件',
  body: '记录在归档后变为只读，可在档案检索中按类别、状态与时间筛选。',
  'body-sm': '紧凑信息用于表格单元格与侧栏说明。',
  label: '记录编号',
  meta: '最后更新 · 2026-10-09',
  mono: 'REC-EXAMPLE · 12.5 mm',
  eyebrow: '01 / Archive record',
};

function TextPlayground() {
  const [variant, setVariant] = React.useState<TextVariant>('heading-2');
  const [tone, setTone] = React.useState<TextTone | 'inherit'>('inherit');
  const [truncate, setTruncate] = React.useState(false);
  const [content, setContent] = React.useState('实验记录');
  const props = [`variant="${variant}"`, tone !== 'inherit' && `tone="${tone}"`, truncate && 'truncate'].filter(Boolean);
  return (
    <Playground
      id="text-playground"
      title="Text"
      code={`<Text ${props.join(' ')}>\n  ${content || '…'}\n</Text>`}
      controls={
        <>
          <Segmented
            legend="variant"
            name="pg-text-variant"
            value={variant}
            onChange={setVariant}
            options={variants.map((v) => ({ value: v, label: v }))}
          />
          <Segmented
            legend="tone"
            name="pg-text-tone"
            value={tone}
            onChange={setTone}
            options={[{ value: 'inherit', label: 'inherit' }, ...tones.map((t) => ({ value: t, label: t }))]}
          />
          <Toggle label="truncate" checked={truncate} onChange={setTruncate} description="单行省略，建议同时提供 title" />
          <TextField label="内容" value={content} onChange={setContent} />
        </>
      }
    >
      <div className="sc-text-frame">
        <Text variant={variant} as="p" tone={tone === 'inherit' ? undefined : tone} truncate={truncate} title={truncate ? content : undefined}>
          {content || '…'}
        </Text>
      </div>
    </Playground>
  );
}

export function TextPage() {
  return (
    <div className="sc-page">
      <PageHeader index="06" section="Components / Typography" title="Text">
        <p>
          排版原语，直接映射 <code>--rl-type-*</code> 角色。<code>variant</code> 只决定视觉，<code>as</code> 决定语义元素，
          保证标题层级正确的同时可自由选择字号。<code>eyebrow</code> 为档案编号样式，仅用于短英文或编号，不用于中文正文。
        </p>
      </PageHeader>
      <SpecimenGrid>
        <TextPlayground />
        <Specimen id="text-scale" index="01" title="Scale" note="默认元素：display / heading-1 → h1，heading-2 → h2，heading-3 → h3，body → p，其余为 span。">
          <dl className="sc-type-list">
            {variants.map((v) => (
              <div key={v} className="sc-type-row">
                <dt>
                  <code className="sc-mono-sm">{v}</code>
                </dt>
                <dd>
                  <Text variant={v} as="span">
                    {sample[v]}
                  </Text>
                </dd>
              </div>
            ))}
          </dl>
        </Specimen>
        <Specimen id="text-tones" index="02" title="Tones" span="half" note="状态色文字须与图标或标签同时出现，不单靠颜色传达含义。">
          <ul className="sc-tone-list">
            {tones.map((t) => (
              <li key={t}>
                <code className="sc-mono-sm">{t}</code>
                <Text variant="body-sm" tone={t} as="span">
                  校验结果说明文本
                </Text>
              </li>
            ))}
          </ul>
        </Specimen>
        <Specimen id="text-record" index="03" title="Composition" span="half" note="档案标题区：eyebrow 编号 + heading + meta，全部为 Text。">
          <div className="sc-record">
            <Text variant="eyebrow" tone="accent">
              REC / EXAMPLE
            </Text>
            <Text variant="heading-3" as="h3">
              示例档案记录
            </Text>
            <Text variant="body-sm" tone="muted">
              展示用占位内容，不代表真实监测数据。
            </Text>
            <Text variant="meta" tone="subtle" numeric as="time" dateTime="2026-10-09">
              更新于 2026-10-09
            </Text>
          </div>
        </Specimen>
      </SpecimenGrid>
    </div>
  );
}
