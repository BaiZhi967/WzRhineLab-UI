import * as React from 'react';
import '@wzrhine/effects/styles.css';
import { ArchiveReveal, MotionPlayer, OrbitalDiagram, ScanSurface } from '@wzrhine/effects';
import { Button, MetadataList, StatusIndicator, Tab, TabList, TabPanel, Tabs } from '@wzrhine/react';
import { PageHeader, Specimen, SpecimenGrid } from '../ui/Specimen';
import { records } from '../scenarios/data';

/**
 * M4 showcase effects. Lives in the optional @wzrhine/effects package; the base component
 * package never imports it. Every effect is shown through the MotionPlayer with Default /
 * Slow ×0.25 / Reduced / Interrupt lanes, as MOTION.md requires for showcase animation.
 */

const SignatureEffectsLab = React.lazy(() =>
  import('./SignatureEffectsLab').then((module) => ({ default: module.SignatureEffectsLab })),
);

const sample = records[0]!;

const orbitNodes = [
  { id: 'reg', label: '样本登记', ring: 0, angle: 30 },
  { id: 'pre', label: '预处理', ring: 1, angle: 140 },
  { id: 'obs', label: '结构观测', ring: 1, angle: 300, active: true },
  { id: 'tmp', label: '温控观测', ring: 2, angle: 210 },
  { id: 'arc', label: '结论与归档', ring: 2, angle: 70 },
];

function ScanDemo({ play }: { play: number }) {
  return (
    <ScanSurface scanKey={play} duration={900}>
      <div className="sc-effect-card">
        <span className="sc-mono-sm sc-muted">{sample.id}</span>
        <span className="sc-subhead">{sample.title}</span>
        <StatusIndicator tone="info" label="复核扫描" detail={play === 0 ? '未执行' : `第 ${play} 次`} />
      </div>
    </ScanSurface>
  );
}

export function ShowcaseEffectsPage() {
  const [revealed, setRevealed] = React.useState(false);
  const [scan, setScan] = React.useState(0);
  const [spin, setSpin] = React.useState(false);

  return (
    <div className="sc-page">
      <PageHeader index="19" section="Motion" title="Showcase effects">
        <p>
          原创展示动效，位于可选包 <code>@wzrhine/effects</code>，基础组件包不会引入它们。规则：内容始终先于动画可读，动画不延迟业务结果；
          只在用户主动触发时播放一次，不默认无限循环；页面不可见或减少动态效果时停止。每个效果都用 MotionPlayer 并排展示
          Default、Slow ×0.25、Reduced、Interrupt 四种状态。
        </p>
      </PageHeader>

      <SpecimenGrid>
        <Specimen
          id="fx-reveal-player"
          index="01"
          title="ArchiveReveal · 解密"
          note="真实文字始终在无障碍树中，乱码字形 aria-hidden；中途反向时从当前进度回退；乱码确定性生成，无随机数；减动时直接切换。"
        >
          <MotionPlayer
            title="ArchiveReveal"
            spec="640ms · 逐字从左到右 · 48ms 字形帧"
            interruptAfterMs={260}
            demo={({ active }) => (
              <span className="sc-effect-reveal">
                <ArchiveReveal text={`${sample.id} · ${sample.title}`} revealed={active} concealedLabel="受限记录" />
              </span>
            )}
          />
        </Specimen>

        <Specimen
          id="fx-scan-player"
          index="02"
          title="ScanSurface · 扫描"
          note="每次触发只扫一遍；内容立即可交互（扫描线 pointer-events: none）；减动时改为短暂的静态描边。"
        >
          <MotionPlayer title="ScanSurface" spec="900ms · ease-in-out · 单次" interruptAfterMs={300} demo={({ play }) => <ScanDemo play={play} />} />
        </Specimen>

        <Specimen
          id="fx-orbit"
          index="03"
          title="OrbitalDiagram · 轨道"
          span="half"
          align="start"
          note="仪器语法的装饰结构：标签是真实的无障碍列表，图形 aria-hidden；旋转需显式开启，离开视口或页面隐藏时停止，减动时不旋转。"
        >
          <OrbitalDiagram nodes={orbitNodes} rings={3} center={sample.id} label="实验流程阶段" animate={spin} />
          <div className="sc-row">
            <Button size="sm" variant="secondary" onClick={() => setSpin((v) => !v)} aria-pressed={spin}>
              {spin ? '停止旋转' : '缓慢旋转'}
            </Button>
          </div>
        </Specimen>

        <Specimen
          id="fx-in-context"
          index="04"
          title="In context"
          span="half"
          align="start"
          note="效果作用在已经加载的数据上：先显示元数据，再按需揭示受限字段；扫描只是视觉回执，不改变数据。"
        >
          <ScanSurface scanKey={scan}>
            <div className="sc-effect-panel">
              <MetadataList
                size="sm"
                items={[
                  { label: '编号', value: sample.id, mono: true },
                  { label: '负责人', value: sample.owner },
                  {
                    label: '存放位置',
                    value: <ArchiveReveal text={sample.location ?? '未记录'} revealed={revealed} concealedLabel="存放位置已隐藏" />,
                  },
                ]}
              />
            </div>
          </ScanSurface>
          <div className="sc-row">
            <Button size="sm" variant="secondary" onClick={() => setRevealed((v) => !v)} aria-pressed={revealed}>
              {revealed ? '隐藏位置' : '显示位置'}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setScan((n) => n + 1)}>
              重新扫描
            </Button>
          </div>
        </Specimen>

        <Specimen id="fx-budget" index="05" title="Budget & rules" note="以下体积为本地 Vite 库模式实测（外置 react / motion），记录在 M4 验收文档中。">
          <Tabs defaultValue="rules" variant="segmented" size="sm">
            <TabList aria-label="展示效果说明">
              <Tab value="rules">规则</Tab>
              <Tab value="lifecycle">生命周期</Tab>
            </TabList>
            <TabPanel value="rules">
              <ul className="sc-rules">
                <li data-kind="do">只在用户触发时播放，结果在动画前就已可读</li>
                <li data-kind="do">每个效果都有减动等价表现，并可在中途反向</li>
                <li data-kind="dont">在业务页默认开启无限循环、全屏扫描或闪烁</li>
                <li data-kind="dont">用动画延迟显示业务数据，或伪造「处理中」读数</li>
              </ul>
            </TabPanel>
            <TabPanel value="lifecycle">
              <ul className="sc-rules">
                <li data-kind="do">页面隐藏（visibilitychange）时暂停逐帧循环</li>
                <li data-kind="do">轨道离开视口（IntersectionObserver）时停止旋转</li>
                <li data-kind="do">动画完成或组件卸载时取消 requestAnimationFrame</li>
              </ul>
            </TabPanel>
          </Tabs>
        </Specimen>
      </SpecimenGrid>

      <React.Suspense fallback={<p className="sc-small" role="status">正在加载仪器与关系线实验…</p>}>
        <SignatureEffectsLab />
      </React.Suspense>
    </div>
  );
}
