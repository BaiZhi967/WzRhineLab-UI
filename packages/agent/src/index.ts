// @wzrhine/agent: Agent UI components (ADR-0010 … ADR-0012). View-models in (`@wzrhine/agent-core`),
// actions out; no runtime, transport, cache or SDK dependency. Styles are opt-in via
// `@wzrhine/agent/styles.css`; this entry has no CSS side effects.

// ---------- provider & copy ----------
export { AgentMessagesProvider, agentEnUS, agentZhCN, mergeAgentMessages, useAgentFormat, useAgentMessages } from './provider/AgentMessages.js';
export type { AgentFormat, AgentMessages, AgentMessagesOverrides, AgentMessagesProviderProps } from './provider/AgentMessages.js';

// ---------- primitives & motion ----------
export { AgentIcon } from './primitives/icons.js';
export type { AgentIconName, AgentIconProps } from './primitives/icons.js';
export { StatusGlyph } from './primitives/StatusGlyph.js';
export type { StatusGlyphProps } from './primitives/StatusGlyph.js';
export { AgentStatus, statusProps } from './primitives/AgentStatus.js';
export type { AgentStatusProps } from './primitives/AgentStatus.js';
export { AgentSpark } from './primitives/AgentSpark.js';
export type { AgentSparkProps } from './primitives/AgentSpark.js';
export { AGENT_STAGGER_CAP_MS, AGENT_STAGGER_MS, AgentEntrance, agentStaggerDelay, loopAttributes, useAgentLoop, useSwapTransition } from './motion/agent-motion.js';
export type { AgentEntranceKind, AgentEntranceProps } from './motion/agent-motion.js';

// ---------- contracts (re-exported for convenience) ----------
export * from '@wzrhine/agent-core';

// ---------- shell & conversation ----------
// @agent-shell-exports

// ---------- message, thinking & process ----------
// @agent-message-exports

// ---------- tools & execution ----------
// @agent-tools-exports

// ---------- composer & selection ----------
// @agent-composer-exports

// ---------- approval & questionnaire ----------
// @agent-intervention-exports

// ---------- terminals, sub-agents, context & artifacts ----------
// @agent-workspace-exports
