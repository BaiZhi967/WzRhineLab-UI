import * as React from 'react';
import '@wzrhine/effects/styles.css';
import { CalibrationReticle } from '@wzrhine/effects';
import { Button } from '@wzrhine/react';

/** Optional home recipe: mounting shows an idle diagram, never an animation or a device status. */
export default function ResearchHeroScene() {
  const [active, setActive] = React.useState(false);
  const descriptionId = React.useId();

  return (
    <section className="rl-demo-instrument" aria-label="Research instrument" aria-describedby={descriptionId}>
      <div className="rl-demo-instrument__copy">
        <p className="sc-eyebrow">Instrument study · 可选 recipe</p>
        <h2 className="rl-demo-instrument__title">Research instrument</h2>
        <p id={descriptionId} className="rl-demo-instrument__description">
          抽象装置示意，用同心结构与括角表达空间对准；不是品牌标志或真实设备，不采集数据，也不生成测量读数。
        </p>
        <div className="rl-demo-instrument__actions">
          <Button variant="secondary" onClick={() => setActive((value) => !value)}>
            {active ? '恢复初始' : '对准结构'}
          </Button>
          <p className="sc-small" aria-live="polite">示意目标：{active ? '对准' : '初始'}</p>
        </div>
        <p className="sc-small">仅按按钮播放或反向；减动直接呈现目标，离开视口或隐藏页面时暂停。</p>
      </div>
      <figure className="rl-demo-instrument__figure">
        <div className="rl-demo-instrument__drawing">
          <CalibrationReticle active={active} className="rl-demo-instrument__reticle" />
        </div>
        <figcaption className="rl-demo-instrument__caption">CALIBRATION STUDY · 抽象几何结构</figcaption>
      </figure>
    </section>
  );
}
