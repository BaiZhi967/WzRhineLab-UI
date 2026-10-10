import * as React from 'react';
import '@wzrhine/effects/styles.css';
import { MotionPlayer } from '@wzrhine/effects';
import type { MotionDemoProps } from '@wzrhine/effects';
import { LayoutGroup } from 'motion/react';
import { ArchiveCard, ArchiveIdentity, MotionPresence, RhineMotionGroup, RhineMotionItem } from '@wzrhine/react';
import { categoryLabel, records } from '../scenarios/data';

/**
 * M10 four-lane comparisons for the @wzrhine/react motion primitives. Code-split from MotionPage
 * because MotionPlayer lives in the optional effects package. Records are the labelled sample
 * fixtures used across the showcase.
 */

const sample = records.slice(0, 5);

function PresenceDemo({ active }: MotionDemoProps) {
  return (
    <div className="sc-lab-slot">
      <MotionPresence show={active} preset="panel" className="sc-lab-panel">
        <span className="sc-mono-sm sc-muted">{sample[0]!.id}</span>
        <span className="sc-subhead">{sample[0]!.title}</span>
      </MotionPresence>
      {!active && <p className="sc-small sc-muted">（已收起）</p>}
    </div>
  );
}

function GroupDemo({ active }: MotionDemoProps) {
  return (
    <div className="sc-lab-slot">
      <RhineMotionGroup show={active} as="ul" className="sc-lab-list" aria-label="样例记录">
        {sample.map((r) => (
          <RhineMotionItem key={r.id} as="li">
            <span className="sc-mono-sm">{r.id}</span>
            <span className="sc-small">{categoryLabel[r.category]}</span>
          </RhineMotionItem>
        ))}
      </RhineMotionGroup>
      {!active && <p className="sc-small sc-muted">（已收起）</p>}
    </div>
  );
}

function IdentityDemo({ active, lane }: MotionDemoProps) {
  const r = sample[1]!;
  // The same record appears in all four lanes; LayoutGroup scopes its shared identity to one lane.
  return (
    <LayoutGroup id={`identity-${lane}`}>
      <div className="sc-lab-slot">
        {active ? (
          <div className="sc-lab-detail">
            <span className="sc-subhead">{r.title}</span>
            <ArchiveIdentity id={r.id} />
          </div>
        ) : (
          <ArchiveCard id={r.id} title={r.title} category={categoryLabel[r.category]} motion="identity" />
        )}
      </div>
    </LayoutGroup>
  );
}

export default function MotionCoreLab() {
  return (
    <>
      <MotionPlayer
        title="MotionPresence · panel"
        spec="panel 280ms · ease-out · 8px；减动：仅透明度 ≤120ms"
        interruptAfterMs={120}
        demo={(p) => <PresenceDemo {...p} />}
      />
      <MotionPlayer
        title="RhineMotionGroup · rise"
        spec="base 200ms · 每项 24ms · 总延时 ≤120ms；减动：无错峰、无位移"
        interruptAfterMs={140}
        demo={(p) => <GroupDemo {...p} />}
      />
      <MotionPlayer
        title="ArchiveCard · 身份连续"
        spec="scene 420ms · ease-in-out · layout=position；减动：直接切换"
        interruptAfterMs={180}
        demo={(p) => <IdentityDemo {...p} />}
      />
    </>
  );
}
