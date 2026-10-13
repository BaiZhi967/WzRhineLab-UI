'use client';

import * as React from 'react';
import { IconButton } from '@wzrhine/react';
import { AgentIcon } from '../../primitives/icons.js';
import { useAgentMessages } from '../../provider/AgentMessages.js';
import { cx } from '../../utils/cx.js';
import { useClipboardAvailable, useCopy } from './use-copy.js';
import type { CopyHandler } from './use-copy.js';

/**
 * CodeBlock: a `<figure>` with a caption (language / file name) and a copy button over a
 * horizontally scrollable `<pre><code>`. Long lines never widen the page; the scroller is
 * focusable (`tabIndex=0`, named by the caption) so keyboard users can scroll it. No highlighting
 * is done here: pass `children` (or MessagePart `renderers.code`) for a highlighted rendering.
 *
 * Copy: `onCopy` if given, else the Clipboard API; the button is not rendered when neither
 * exists. The copied / failed state is announced through the button's own name and a polite
 * status, then resets after a short delay. No motion.
 */
export type CodeBlockProps = Omit<React.HTMLAttributes<HTMLElement>, 'children' | 'onCopy'> & {
  code: string;
  language?: string;
  filename?: string;
  /** Show a line-number gutter (decorative, not copied). */
  showLineNumbers?: boolean;
  /** CSS length; taller code scrolls vertically inside the block. */
  maxHeight?: string;
  /** `false` hides the copy button. Default: shown when a copy path exists. */
  copyable?: boolean;
  onCopy?: CopyHandler;
  /** Replaces the plain `<code>` content (e.g. host-highlighted tokens). The copy text stays `code`. */
  children?: React.ReactNode;
  /** Copy-button name override. */
  copyLabel?: string;
};

export const CodeBlock = React.forwardRef<HTMLElement, CodeBlockProps>(function CodeBlock(
  { code, language, filename, showLineNumbers = false, maxHeight, copyable = true, onCopy, children, copyLabel, className, style, ...rest },
  ref,
) {
  const t = useAgentMessages().message;
  const captionId = React.useId();
  const clipboard = useClipboardAvailable();
  const { state, failed, copy } = useCopy(onCopy);
  const canCopy = copyable && (onCopy !== undefined || clipboard);
  const caption = filename ?? language ?? t.codeLabel;
  const lines = React.useMemo(() => (showLineNumbers ? code.split('\n') : []), [code, showLineNumbers]);
  const name = state === 'copied' ? t.copied : state === 'failed' ? t.copyFailed : (copyLabel ?? t.copyCode);
  const scrollStyle = maxHeight ? ({ '--rl-agent-code-max-height': maxHeight } as React.CSSProperties) : undefined;

  return (
    <figure {...rest} ref={ref} className={cx('rl-agent-code', className)} style={style} data-line-numbers={showLineNumbers || undefined}>
      <figcaption className="rl-agent-code__caption">
        <AgentIcon name={filename ? 'file' : 'code'} className="rl-agent-code__icon" />
        <span id={captionId} className="rl-agent-code__title">
          {caption}
        </span>
        {filename && language && <span className="rl-agent-code__lang">{language}</span>}
        {canCopy && (
          <IconButton
            className="rl-agent-code__copy"
            size="sm"
            variant="ghost"
            label={name}
            data-state={state}
            icon={<AgentIcon name={state === 'copied' ? 'check' : 'copy'} />}
            onClick={() => void copy(code)}
          />
        )}
        {canCopy && (
          <span className="rl-agent-sr" role="status">
            {state === 'copied' ? t.copied : state === 'failed' ? t.copyFailed : ''}
          </span>
        )}
      </figcaption>
      {failed && <p className="rl-agent-code__error" role="alert">{t.copyFailed}</p>}
      <div className="rl-agent-code__scroll" tabIndex={0} role="region" aria-labelledby={captionId} style={scrollStyle} data-max-height={maxHeight ? '' : undefined}>
        {showLineNumbers && (
          <span className="rl-agent-code__gutter" aria-hidden="true">
            {lines.map((_, i) => (
              <span key={i}>{i + 1}</span>
            ))}
          </span>
        )}
        <pre className="rl-agent-code__pre">
          <code className="rl-agent-code__code" data-language={language}>
            {children ?? code}
          </code>
        </pre>
      </div>
    </figure>
  );
});
