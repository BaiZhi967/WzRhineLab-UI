import * as React from 'react';
import {
  borderWidths,
  colorGroups,
  contrastPairs,
  contrastRatio,
  densityTokens,
  minimumContrast,
  radiusScale,
  spaceScale,
  typeRoles,
} from '@wzrhine/tokens';
import { Button, StatusBadge } from '@wzrhine/react';
import { ThemeScope } from '../app/ThemeScope';
import { PageHeader, Specimen, SpecimenGrid } from '../ui/Specimen';

/** Reads computed token values from the live theme scope so swatches never duplicate hex literals. */
function useTokenValues(names: readonly string[], deps: React.DependencyList) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [values, setValues] = React.useState<Record<string, string>>({});
  React.useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const read = () => {
      const style = getComputedStyle(el);
      setValues(Object.fromEntries(names.map((n) => [n, style.getPropertyValue(n).trim()])));
    };
    read();
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    media.addEventListener('change', read);
    return () => media.removeEventListener('change', read);
  }, deps);
  return [ref, values] as const;
}

function ColorSection({ themeKey }: { themeKey: string }) {
  const names = React.useMemo(() => colorGroups.flatMap((g) => g.tokens.map((t) => t.name)), []);
  const [ref, values] = useTokenValues(names, [themeKey]);
  return (
    <div ref={ref} className="sc-color-groups">
      {colorGroups.map((group) => (
        <div key={group.id} className="sc-color-group">
          <h3 className="sc-subhead">{group.label}</h3>
          <p className="sc-small">{group.description}</p>
          <ul className="sc-swatches">
            {group.tokens.map((token) => (
              <li key={token.name} className="sc-swatch">
                <span className="sc-swatch__chip" style={{ background: `var(${token.name})` }} aria-hidden="true" />
                <span className="sc-swatch__text">
                  <code className="sc-swatch__name">{token.name.replace('--rl-', '')}</code>
                  <span className="sc-swatch__role">{token.role}</span>
                </span>
                <code className="sc-swatch__value">{values[token.name]?.toUpperCase() ?? ''}</code>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function ContrastTable({ themeKey }: { themeKey: string }) {
  const names = React.useMemo(() => [...new Set(contrastPairs.flatMap((p) => [p.fg, p.bg]))], []);
  const [ref, values] = useTokenValues(names, [themeKey]);
  return (
    <div ref={ref} className="sc-table-wrap" tabIndex={0} role="region" aria-label="对比度表（可横向滚动）">
      <table className="sc-table">
        <caption className="sc-visually-hidden">当前主题下的实测对比度</caption>
        <thead>
          <tr>
            <th scope="col">样例</th>
            <th scope="col">用途</th>
            <th scope="col">前景 / 背景</th>
            <th scope="col" className="sc-num">
              对比度
            </th>
            <th scope="col">门槛</th>
          </tr>
        </thead>
        <tbody>
          {contrastPairs.map((pair) => {
            const fg = values[pair.fg] ?? '';
            const bg = values[pair.bg] ?? '';
            const ratio = contrastRatio(fg, bg);
            const min = minimumContrast[pair.level];
            const pass = ratio >= min;
            return (
              <tr key={`${pair.fg}-${pair.bg}`}>
                <td>
                  <span
                    className="sc-contrast-sample"
                    style={{ color: `var(${pair.fg})`, background: `var(${pair.bg})` }}
                    aria-hidden="true"
                  >
                    {pair.level === 'non-text' ? '▮' : 'Aa'}
                  </span>
                </td>
                <td>{pair.usage}</td>
                <td>
                  <code className="sc-mono-sm">
                    {pair.fg.replace('--rl-', '')} / {pair.bg.replace('--rl-', '')}
                  </code>
                </td>
                <td className="sc-num">
                  <code className="sc-mono-sm">{Number.isFinite(ratio) ? `${ratio.toFixed(2)}:1` : '—'}</code>
                </td>
                <td>
                  <StatusBadge status={pass ? 'success' : 'danger'} size="sm" appearance="outline">
                    {pass ? '通过' : '未通过'} ≥{min}
                  </StatusBadge>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function FoundationsPage({ themeKey }: { themeKey: string }) {
  return (
    <div className="sc-page">
      <PageHeader index="01" section="Foundations" title="Design Tokens">
        <p>
          所有视觉值以 <code>--rl-*</code> 语义变量提供，作用域限定在 <code>.rl-theme</code> 容器。本页数值从当前主题实时读取，
          切换主题即可复核。
        </p>
      </PageHeader>

      <SpecimenGrid>
        <Specimen id="color" index="01" title="Color" note="浅色为默认；暗色与 system 主题的每一对组合由单元测试验证 WCAG 2.2 AA。">
          <ColorSection themeKey={themeKey} />
        </Specimen>

        <Specimen
          id="contrast"
          index="02"
          title="Contrast · 实测"
          description="组件实际使用的前景/背景组合。文本 ≥4.5:1，控件边界与焦点 ≥3:1。"
          note="对比度由 @wzrhine/tokens 的 contrastRatio() 在浏览器中按计算值实时求得。"
        >
          <ContrastTable themeKey={themeKey} />
        </Specimen>

        <Specimen id="type" index="03" title="Typography" span="two-thirds" note="中文段落不额外加字距；仅英文编号与 mono 使用 tracking。">
          <dl className="sc-type-list">
            {typeRoles.map((role) => (
              <div key={role.name} className="sc-type-row">
                <dt>
                  <code className="sc-mono-sm">{role.name}</code>
                  <span className="sc-small">{role.spec}</span>
                </dt>
                <dd style={{ font: `var(${role.token})` }} className="sc-type-sample">
                  {role.name === 'mono' ? 'ARC-1024 · 2026-10-09 · 12.5 mm' : `${role.usage} Research archive`}
                </dd>
              </div>
            ))}
          </dl>
        </Specimen>

        <Specimen id="space" index="04" title="Spacing" span="third" align="start" note="4px 基础刻度；常用 8 / 12 / 16 / 24 / 32 / 48。">
          <ul className="sc-space-list">
            {spaceScale.map((s) => (
              <li key={s.token}>
                <code className="sc-mono-sm">{s.token.replace('--rl-', '')}</code>
                <span className="sc-space-bar" style={{ width: `var(${s.token})` }} aria-hidden="true" />
                <span className="sc-mono-sm sc-muted">{s.px}px</span>
              </li>
            ))}
          </ul>
        </Specimen>

        <Specimen id="radius" index="05" title="Radius & Border" span="half" note="切角 / 准星仅用于 Archive/Instrument 变体，不作为通用装饰。">
          <ul className="sc-radius-list">
            {radiusScale.map((r) => (
              <li key={r.token}>
                <span className="sc-radius-sample" style={{ borderRadius: `var(${r.token})` }} aria-hidden="true" />
                <code className="sc-mono-sm">{r.token.replace('--rl-', '')}</code>
                <span className="sc-small">{r.usage}</span>
              </li>
            ))}
          </ul>
          <ul className="sc-border-list">
            {borderWidths.map((b) => (
              <li key={b.token}>
                <span className="sc-border-sample" style={{ borderTopWidth: `var(${b.token})` }} aria-hidden="true" />
                <code className="sc-mono-sm">{b.token.replace('--rl-', '')}</code>
                <span className="sc-small">{b.usage}</span>
              </li>
            ))}
          </ul>
        </Specimen>

        <Specimen
          id="focus"
          index="06"
          title="Focus"
          span="half"
          align="start"
          note="焦点色为独立的蓝墨色，不复用品牌橙或危险红。按 Tab 键查看实际焦点环。"
        >
          <div className="sc-focus-demo">
            <Button variant="secondary">Tab 到这里</Button>
            <Button variant="primary">Primary</Button>
            <Button variant="accent">Accent</Button>
          </div>
          <p className="sc-small">
            <code>outline: var(--rl-focus-ring)</code> · <code>outline-offset: var(--rl-focus-offset)</code>
          </p>
        </Specimen>

        <Specimen
          id="density"
          index="07"
          title="Density"
          note="紧凑模式面向桌面鼠标密集场景；最小控件高度 28px，仍高于 WCAG 2.2 的 24px 目标下限。"
        >
          <div className="sc-density-compare">
            {(['comfortable', 'compact'] as const).map((density) => (
              <ThemeScope key={density} density={density} className="sc-density-pane">
                <p className="sc-subhead">{density === 'comfortable' ? 'Comfortable · 默认' : 'Compact'}</p>
                <div className="sc-row">
                  <Button size="sm" variant="secondary">
                    Small
                  </Button>
                  <Button variant="secondary">Medium</Button>
                  <Button size="lg" variant="secondary">
                    Large
                  </Button>
                </div>
              </ThemeScope>
            ))}
          </div>
          <ul className="sc-token-inline">
            {densityTokens.map((d) => (
              <li key={d.token}>
                <code className="sc-mono-sm">{d.token.replace('--rl-', '')}</code>
                <span className="sc-small">{d.usage}</span>
              </li>
            ))}
          </ul>
        </Specimen>
      </SpecimenGrid>
    </div>
  );
}
