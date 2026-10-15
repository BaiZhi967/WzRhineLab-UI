'use client';

import * as React from 'react';
import { motion, useTransform } from 'motion/react';
import { useEffectProgress } from './useEffectProgress.js';

export interface CalibrationReticleProps {
  active?: boolean;
  className?: string;
  onSettled?: (active: boolean) => void;
}

/** Decorative alignment structure. It does not represent a sensor reading or task result. */
export function CalibrationReticle({ active = false, className, onSettled }: CalibrationReticleProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  const { progress, state, reduced } = useEffectProgress({ active, viewportRef: ref, onSettled });
  const outer = useTransform(progress, [0, 1], [-32, 0]);
  const inner = useTransform(progress, [0, 1], [45, 0]);
  const reticle = useTransform(progress, [0, 1], [1.35, 1]);
  return <div ref={ref} className={['rl-calibration', className].filter(Boolean).join(' ')}
    data-state={state} data-active={active} data-reduced={reduced} aria-hidden="true">
    <svg className="rl-calibration__svg" viewBox="0 0 320 260" focusable="false">
      <g className="rl-calibration__structure">
        <path d="M20 130H300M160 10V250" />
        <circle cx="160" cy="130" r="108" />
        <circle cx="160" cy="130" r="100" />
        <path d="M160 18V30M160 230V242M48 130H60M260 130H272M81 51L89 59M231 201L239 209M81 209L89 201M231 59L239 51" />
      </g>
      <motion.g style={{ rotate: outer, transformOrigin: '160px 130px', transformBox: 'view-box' }}>
        <path className="rl-calibration__arc" d="M72 104A92 92 0 0 1 188 42M248 156A92 92 0 0 1 132 218" />
      </motion.g>
      <motion.g style={{ rotate: inner, transformOrigin: '160px 130px', transformBox: 'view-box' }}>
        <circle className="rl-calibration__structure" cx="160" cy="130" r="72" />
        <path className="rl-calibration__signal" d="M101 94A69 69 0 0 1 223 156M219 166A69 69 0 0 1 97 104" />
      </motion.g>
      <motion.g style={{ scale: reticle, transformOrigin: '160px 130px', transformBox: 'view-box' }}>
        <path className="rl-calibration__signal" d="M141 111H132V120M179 111H188V120M141 149H132V140M179 149H188V140" />
        <circle className="rl-calibration__signal" cx="160" cy="130" r="4" />
      </motion.g>
    </svg>
  </div>;
}
