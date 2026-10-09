import * as React from 'react';
import { ThemeScope } from '../app/ThemeScope';
import type { DensitySetting, ThemeSetting } from '../app/settings';
import { CodeBlock } from './Specimen';
import { Segmented } from './controls';

type PreviewTheme = 'inherit' | Exclude<ThemeSetting, 'system'>;
type PreviewWidth = 'fluid' | '320' | '480';
type PreviewDensity = 'inherit' | DensitySetting;

interface PlaygroundProps {
  id: string;
  title: string;
  controls: React.ReactNode;
  code: string;
  children: React.ReactNode;
}

/** Adjustable preview: prop controls on one side, a re-themable canvas and generated JSX on the other. */
export function Playground({ id, title, controls, code, children }: PlaygroundProps) {
  const [theme, setTheme] = React.useState<PreviewTheme>('inherit');
  const [width, setWidth] = React.useState<PreviewWidth>('fluid');
  const [density, setDensity] = React.useState<PreviewDensity>('inherit');
  const headingId = `${id}-title`;

  return (
    <section className="sc-playground" aria-labelledby={headingId}>
      <header className="sc-playground__header">
        <h2 id={headingId} className="sc-specimen__title">
          {title}
        </h2>
        <span className="sc-specimen__index" aria-hidden="true">
          Playground
        </span>
      </header>
      <div className="sc-playground__layout">
        <form className="sc-playground__controls" onSubmit={(e) => e.preventDefault()} aria-label={`${title} 属性`}>
          {controls}
        </form>
        <div className="sc-playground__stage">
          <div className="sc-playground__toolbar" role="group" aria-label="预览环境">
            <Segmented
              legend="预览主题"
              name={`${id}-theme`}
              value={theme}
              onChange={setTheme}
              options={[
                { value: 'inherit', label: '跟随' },
                { value: 'light', label: 'Light' },
                { value: 'dark', label: 'Dark' },
              ]}
            />
            <Segmented
              legend="预览密度"
              name={`${id}-density`}
              value={density}
              onChange={setDensity}
              options={[
                { value: 'inherit', label: '跟随' },
                { value: 'comfortable', label: '舒适' },
                { value: 'compact', label: '紧凑' },
              ]}
            />
            <Segmented
              legend="预览宽度"
              name={`${id}-width`}
              value={width}
              onChange={setWidth}
              options={[
                { value: 'fluid', label: '自适应' },
                { value: '480', label: '480' },
                { value: '320', label: '320' },
              ]}
            />
          </div>
          <ThemeScope
            className="sc-playground__canvas"
            theme={theme === 'inherit' ? undefined : theme}
            density={density === 'inherit' ? undefined : density}
          >
            <div className="sc-playground__frame" data-width={width}>
              {children}
            </div>
          </ThemeScope>
          <CodeBlock code={code} label="JSX" />
        </div>
      </div>
    </section>
  );
}
