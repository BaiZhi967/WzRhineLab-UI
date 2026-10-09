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
