import * as React from 'react';
import {
  AnnotationTrace,
  CalibrationReticle,
  MotionPlayer,
  SignalPath,
} from '@wzrhine/effects';
import type { MotionDemoProps } from '@wzrhine/effects';
import { Button } from '@wzrhine/react';
import { Specimen, SpecimenGrid } from '../ui/Specimen';

function CalibrationDemo({ active }: MotionDemoProps) {
  return (
    <div className="rl-demo-signature-stage rl-demo-signature-stage--reticle">
      <CalibrationReticle active={active} className="rl-demo-signature-reticle" />
      <div className="rl-demo-signature-target" aria-hidden="true">
        <span className="rl-demo-signature-target__cross" />
        <span className="rl-demo-signature-target__label">抽象校准面</span>
      </div>
    </div>
  );
}

function SignalPathDemo({ active }: MotionDemoProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const fromRef = React.useRef<HTMLDivElement>(null);
  const toRef = React.useRef<HTMLDivElement>(null);

  return (
    <div className="rl-demo-signature-stage rl-demo-signature-stage--path">
      <div ref={containerRef} className="rl-demo-signature-path-host">
        <div ref={fromRef} className="rl-demo-signature-path-node">
          <span className="sc-mono-sm sc-muted">SOURCE</span>
          <span>输入节点</span>
        </div>
        <div ref={toRef} className="rl-demo-signature-path-node">
          <span className="sc-mono-sm sc-muted">TARGET</span>
          <span>接收节点与长文本说明</span>
        </div>
        <SignalPath
          containerRef={containerRef}
          fromRef={fromRef}
          toRef={toRef}
          fromAnchor="bottom"
          toAnchor="bottom"
          route="rail"
          active={active}
          tracking={false}
          className="rl-demo-signature-signal"
        />
      </div>
    </div>
  );
}

function AnnotationTraceDemo({ active }: MotionDemoProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const fromRef = React.useRef<HTMLDivElement>(null);
  const toRef = React.useRef<HTMLDivElement>(null);

  return (
    <div className="rl-demo-signature-stage rl-demo-signature-stage--trace">
      <div ref={containerRef} className="rl-demo-signature-trace-host">
        <div ref={fromRef} className="rl-demo-signature-trace-node">
          <span className="sc-mono-sm sc-muted">OBJECT</span>
          <span>结构对象</span>
        </div>
        <div ref={toRef} className="rl-demo-signature-trace-note">
          <span className="sc-mono-sm sc-muted">NOTE</span>
          <span>说明标注保持独立，不承载操作。</span>
        </div>
        <AnnotationTrace
          containerRef={containerRef}
          fromRef={fromRef}
          toRef={toRef}
          fromAnchor="right"
          toAnchor="left"
          route="curve"
          active={active}
          tracking={false}
          className="rl-demo-signature-annotation"
        />
      </div>
    </div>
  );
}

function SignalGeometryFixture() {
  const [width, setWidth] = React.useState(100);
  const [active, setActive] = React.useState(false);
  const [tracking, setTracking] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const node0Ref = React.useRef<HTMLDivElement>(null);
  const node1Ref = React.useRef<HTMLDivElement>(null);
  const node2Ref = React.useRef<HTMLDivElement>(null);

  return (
    <div className="rl-demo-signal-geometry-shell">
      <div className="rl-demo-signal-geometry-controls">
        <label className="rl-demo-signal-geometry-range" htmlFor="signal-geometry-width">
          <span className="sc-control-label">关系区域宽度</span>
          <input
            id="signal-geometry-width"
            type="range"
            min="50"
            max="100"
            step="1"
            value={width}
            onChange={(event) => setWidth(Number(event.target.value))}
          />
        </label>
        <output className="sc-mono-sm" htmlFor="signal-geometry-width">
          {width}%
        </output>
        <label className="rl-demo-signal-geometry-toggle">
          <input type="checkbox" checked={tracking} onChange={(event) => setTracking(event.target.checked)} />
          <span>跟踪运动端点</span>
        </label>
        <Button size="sm" variant="secondary" onClick={() => setActive((value) => !value)} aria-pressed={active}>
          切换演示阶段
        </Button>
      </div>
      <div className="rl-demo-signal-geometry-frame">
        <div
          ref={containerRef}
          data-testid="signal-geometry"
          className="rl-demo-signal-geometry"
          style={{ width: `${width}%` }}
        >
          <div className="rl-demo-signal-geometry__nodes">
            <div ref={node0Ref} data-testid="signal-node-0" className="rl-demo-signal-node">
              <span className="sc-mono-sm sc-muted">NODE 00</span>
              <strong>样本登记与输入</strong>
              <span>节点宽度可变，连接从真实卡片底边出发。</span>
            </div>
            <div ref={node1Ref} data-testid="signal-node-1" className="rl-demo-signal-node">
              <span className="sc-mono-sm sc-muted">NODE 01</span>
              <strong>结构观测与多行标注</strong>
              <span>不等宽内容用于验证换行、边框、padding 与间距变化。</span>
            </div>
            <div ref={node2Ref} data-testid="signal-node-2" className="rl-demo-signal-node">
              <span className="sc-mono-sm sc-muted">NODE 02</span>
              <strong>归档确认</strong>
              <span>示意节点</span>
            </div>
          </div>
          <div className="rl-demo-signal-overlay" data-testid="signal-overlay" aria-hidden="true">
            <SignalPath
              containerRef={containerRef}
              fromRef={node0Ref}
              toRef={node1Ref}
              fromAnchor="bottom"
              toAnchor="bottom"
              route="rail"
              bend={24}
              active={active}
              tracking={tracking}
              className="rl-demo-signal-01"
            />
            <SignalPath
              containerRef={containerRef}
              fromRef={node1Ref}
              toRef={node2Ref}
              fromAnchor="bottom"
              toAnchor="bottom"
              route="rail"
              bend={24}
              active={active}
              tracking={tracking}
              className="rl-demo-signal-12"
            />
          </div>
        </div>
      </div>
      <p className="sc-small sc-muted">真实 DOM 节点由宿主布局，关系线只负责局部坐标内的装饰与受控传导。</p>
    </div>
  );
}

export function SignatureEffectsLab() {
  return (
    <>
      <SpecimenGrid>
        <Specimen
          id="fx-calibration-reticle"
          index="06"
          title="CalibrationReticle · 校准"
          span="half"
          align="start"
          note="抽象仪器装饰只反映 active 视觉状态；不代表真实设备读数，也不自动播放。"
        >
          <MotionPlayer
            title="CalibrationReticle"
            spec="受控 active · 继承播放器速度 · 减动直接定位"
            interruptAfterMs={180}
            demo={(props) => <CalibrationDemo {...props} />}
          />
        </Specimen>
        <Specimen
          id="fx-signal-path"
          index="07"
          title="SignalPath · 关系线"
          span="half"
          align="start"
          note="连接真实 DOM 节点的 bottom 锚点；rail 路径向下避开卡片内容，ref 失效时不保留旧坐标。"
        >
          <MotionPlayer
            title="SignalPath"
            spec="rail · bottom / bottom · 可中断路径传导"
            interruptAfterMs={180}
            demo={(props) => <SignalPathDemo {...props} />}
          />
        </Specimen>
        <Specimen
          id="fx-annotation-trace"
          index="08"
          title="AnnotationTrace · 标注"
          span="full"
          align="start"
          note="right 到 left 的曲线标注只做空间关系提示；说明内容本身始终可读且不延迟焦点。"
        >
          <MotionPlayer
            title="AnnotationTrace"
            spec="curve · right / left · 非交互装饰"
            interruptAfterMs={180}
            demo={(props) => <AnnotationTraceDemo {...props} />}
          />
        </Specimen>
        <Specimen
          id="fx-signal-geometry"
          index="09"
          title="Geometry fixture · 真实节点连接"
          span="full"
          align="start"
          note="使用真实卡片、不同列比例、长文本、多行布局与可调容器宽度验证路径端点；两条路径分别固定为 rl-demo-signal-01 与 rl-demo-signal-12。"
        >
          <SignalGeometryFixture />
        </Specimen>
      </SpecimenGrid>
    </>
  );
}
