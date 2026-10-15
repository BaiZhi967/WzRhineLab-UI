// Optional showcase effects. Import styles from `@wzrhine/effects/styles.css`.
// Kept out of @wzrhine/react so base components never pull in effect code (ARCHITECTURE.md).
export { ArchiveReveal } from './ArchiveReveal.js';
export type { ArchiveRevealProps } from './ArchiveReveal.js';
export { ScanSurface } from './ScanSurface.js';
export type { ScanSurfaceProps } from './ScanSurface.js';
export { OrbitalDiagram } from './OrbitalDiagram.js';
export type { OrbitalDiagramProps, OrbitNode } from './OrbitalDiagram.js';
export { MotionPlayer } from './MotionPlayer.js';
export type { MotionDemoProps, MotionLane, MotionPlayerProps } from './MotionPlayer.js';
export { EffectClock, useEffectTiming } from './clock.js';
export type { EffectClockProps, EffectTiming } from './clock.js';
export { isWide, isWideGlyph, maskText, scrambleCells, scrambleText, stepToward } from './scramble.js';
export type { ScrambleCell } from './scramble.js';
export { useInViewport, usePageVisible } from './usePageVisible.js';
export { CalibrationReticle } from './CalibrationReticle.js';
export type { CalibrationReticleProps } from './CalibrationReticle.js';
export { SignalPath } from './SignalPath.js';
export type { SignalPathProps } from './SignalPath.js';
export { AnnotationTrace } from './AnnotationTrace.js';
export type { AnnotationTraceProps } from './AnnotationTrace.js';
export { createEffectPath } from './geometry.js';
export type { EffectPoint, EffectAnchorSide, EffectPathKind } from './geometry.js';
export { effectAnchorPoint, toEffectPoint } from './geometry.js';
export type { EffectRect, EffectCoordinateSpace, EffectPathOptions } from './geometry.js';
export { useElementAnchors } from './useElementAnchors.js';
export type { ElementAnchor, ElementAnchorsOptions, ElementAnchorsResult } from './useElementAnchors.js';
export { useEffectProgress } from './useEffectProgress.js';
export type { EffectProgressOptions, EffectProgressResult, EffectProgressPreset, EffectProgressState } from './useEffectProgress.js';
