import * as React from 'react';
import { StatusBadge, Surface } from '@wzrhine/react';
import { hrefFor } from '../app/routes';
import type { RouteId } from '../app/routes';
import { ArrowRight } from '../icons';
import { LinkButton } from '../ui/LinkButton';
import { SectionRule } from '../ui/Specimen';

// Keep the optional effects import out of the main docs entry. The recipe is idle on mount.
const ResearchHeroScene = React.lazy(() => import('./ResearchHeroScene'));

const entries: Array<{ id: RouteId; index: string; title: string; body: string; meta: string }> = [
  {
    id: 'foundations',
    index: '01',
    title: 'Foundations',
    body: '色彩、字体、间距、边框、圆角、密度与焦点。全部以 --rl-* 语义变量提供。',
    meta: 'Tokens · Theme · Density',
  },
  {
    id: 'button',
    index: '02',
    title: 'Components',
    body: 'Button、Surface、StatusBadge 的状态矩阵与可调整预览。',
    meta: '3 primitives · M1-A',
  },
  {
    id: 'motion',
    index: '03',
    title: 'Motion',
    body: '统一的时长与缓动、按压与加载反馈、减少动态效果的等价表现。',
    meta: 'motion/react · reduce',
  },
];

const status: Array<{ label: string; state: 'success' | 'info' | 'neutral' }> = [
  { label: 'Tokens · 明暗主题', state: 'success' },
  { label: 'Button / Surface / StatusBadge', state: 'success' },
  { label: 'Headless 底座 ADR', state: 'info' },
  { label: 'Input / Field / IconButton', state: 'neutral' },
];

const stateLabel = { success: '已实现', info: '进行中', neutral: '计划' } as const;

export function OverviewPage() {
  return (
    <div className="sc-page">
      <header className="sc-hero">
        <div className="sc-hero__main">
          <p className="sc-eyebrow">
            <span className="sc-eyebrow__index">00</span>
            <span aria-hidden="true">/</span>
            Research Interface System
          </p>
          <h1 className="sc-hero__title" tabIndex={-1}>
            Research UI
            <br />
            System<span className="sc-hero__period">.</span>
          </h1>
          <p className="sc-hero__lede">
            面向科研与档案场景的 React 组件库。暖白纸面、深墨文字、精密分隔线，以及克制的研究橙信号。
          </p>
          <div className="sc-hero__actions">
            <LinkButton href={hrefFor('button')} iconEnd={<ArrowRight />}>
              浏览组件
            </LinkButton>
            <LinkButton href={hrefFor('foundations')} variant="secondary">
              查看 Foundations
            </LinkButton>
          </div>
        </div>
        <dl className="sc-hero__meta" aria-label="构建信息">
          <div>
            <dt>Package</dt>
            <dd>@wzrhine/react · 0.0.0</dd>
          </div>
          <div>
            <dt>Milestone</dt>
            <dd>M0 验收 → M1-A</dd>
          </div>
          <div>
            <dt>Stack</dt>
            <dd>React 19 · motion/react</dd>
          </div>
          <div>
            <dt>Status</dt>
            <dd>未发布 · 内部预览</dd>
          </div>
        </dl>
      </header>

      <React.Suspense fallback={<p className="sc-small" role="status">正在加载抽象仪器示意…</p>}>
        <ResearchHeroScene />
      </React.Suspense>

      <SectionRule index="01" label="Entry points" meta="Foundations · Components · Motion" />
      <nav className="sc-entries" aria-label="展示入口">
        {entries.map((entry) => (
          <a key={entry.id} className="sc-entry" href={hrefFor(entry.id)}>
            <span className="sc-entry__index">{entry.index}</span>
            <span className="sc-entry__title">{entry.title}</span>
            <span className="sc-entry__body">{entry.body}</span>
            <span className="sc-entry__meta">
              {entry.meta}
              <ArrowRight className="sc-entry__arrow" />
            </span>
          </a>
        ))}
      </nav>

      <SectionRule index="02" label="Build status" meta="真实进度，非演示数据" />
      <Surface as="div" padding="sm" className="sc-status">
        <ul className="sc-status__list">
          {status.map((item) => (
            <li key={item.label}>
              <span>{item.label}</span>
              <StatusBadge status={item.state} size="sm">
                {stateLabel[item.state]}
              </StatusBadge>
            </li>
          ))}
        </ul>
      </Surface>
    </div>
  );
}
