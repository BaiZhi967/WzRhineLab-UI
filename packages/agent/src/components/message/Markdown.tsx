'use client';

import * as React from 'react';
import { cx } from '../../utils/cx.js';
import { CodeBlock } from './CodeBlock.js';
import type { CopyHandler } from './use-copy.js';
import { splitFences } from './plain-text.js';
import type { MarkdownRenderContext, MessagePartRenderers } from './renderers.js';

/**
 * Markdown source through the host renderer, or the safe plain-text fallback: paragraphs keep
 * their line breaks (`white-space: pre-wrap`), fenced code becomes a CodeBlock, and no HTML is
 * ever parsed — `<b>` stays the four visible characters it is.
 */
export function MarkdownContent({
  source,
  context,
  renderers,
  onCopy,
  className,
}: {
  source: string;
  context: MarkdownRenderContext;
  renderers?: MessagePartRenderers;
  onCopy?: CopyHandler;
  className?: string;
}) {
  if (renderers?.markdown) return <div className={cx('rl-agent-md', className)}>{renderers.markdown(source, context)}</div>;
  return <PlainText source={source} onCopy={onCopy} className={className} />;
}

export function PlainText({ source, onCopy, className }: { source: string; onCopy?: CopyHandler; className?: string }) {
  const segments = React.useMemo(() => splitFences(source), [source]);
  return (
    <div className={cx('rl-agent-md', className)} data-fallback="">
      {segments.map((segment, i) =>
        segment.kind === 'code' ? (
          <CodeBlock key={i} code={segment.code} language={segment.language} onCopy={onCopy} />
        ) : (
          segment.paragraphs.map((p, j) => (
            <p key={`${i}-${j}`} className="rl-agent-md__p">
              {p}
            </p>
          ))
        ),
      )}
    </div>
  );
}
