// Optional showcase effects. Import styles from `@wzrhine/effects/styles.css`.
// Kept out of @wzrhine/react so base components never pull in effect code (ARCHITECTURE.md).
export { ArchiveReveal } from './ArchiveReveal';
export type { ArchiveRevealProps } from './ArchiveReveal';
export { ScanSurface } from './ScanSurface';
export type { ScanSurfaceProps } from './ScanSurface';
export { OrbitalDiagram } from './OrbitalDiagram';
export type { OrbitalDiagramProps, OrbitNode } from './OrbitalDiagram';
export { MotionPlayer } from './MotionPlayer';
export type { MotionDemoProps, MotionLane, MotionPlayerProps } from './MotionPlayer';
export { EffectClock, useEffectTiming } from './clock';
export type { EffectClockProps, EffectTiming } from './clock';
export { isWide, isWideGlyph, maskText, scrambleCells, scrambleText, stepToward } from './scramble';
export type { ScrambleCell } from './scramble';
export { useInViewport, usePageVisible } from './usePageVisible';
