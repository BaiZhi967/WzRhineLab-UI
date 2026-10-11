import type * as React from 'react';
import type { ArtifactView, MessagePartView, ToolCallView } from '@wzrhine/agent-core';

/*
 * Renderer injection points for the message family (ADR-0010 §4). The package ships no Markdown
 * parser, highlighter or tool / artifact UI of its own beyond safe fallbacks; hosts plug them in.
 */

export interface MarkdownRenderContext {
  /** Part or thinking id the source belongs to. */
  id: string;
  /** The source is still growing; a renderer may skip expensive work until it settles. */
  streaming: boolean;
}

export type CodePart = Extract<MessagePartView, { type: 'code' }>;
export type CustomPart = Extract<MessagePartView, { type: 'custom' }>;

/**
 * Content renderers. Every entry is optional: without `markdown` the source is shown as plain
 * text (line breaks kept, fenced code as a CodeBlock, HTML never parsed); without `code` the
 * built-in CodeBlock is used; a `custom` part whose `renderer` key is missing shows a readable
 * fallback with its summary instead of rendering nothing.
 */
export interface MessagePartRenderers {
  markdown?: (source: string, context: MarkdownRenderContext) => React.ReactNode;
  code?: (part: CodePart) => React.ReactNode;
  custom?: Record<string, (part: CustomPart) => React.ReactNode>;
}

/** Renders a tool call (wired to the tools family's ToolRecord by the host). */
export type ToolRenderer = (tool: ToolCallView) => React.ReactNode;

/** Renders an artifact (wired to the workspace family's ArtifactCard by the host). */
export type ArtifactRenderer = (artifact: ArtifactView) => React.ReactNode;
