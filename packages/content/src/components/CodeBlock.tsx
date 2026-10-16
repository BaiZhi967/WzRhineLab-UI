'use client';

import * as React from 'react';
import { Icon, IconButton } from '@wzrhine/react';
import { useContentMessages } from '../provider/ContentMessages.js';

export type CodeCopyHandler = (code: string) => void | Promise<void>;

export type CodeBlockProps = Omit<React.HTMLAttributes<HTMLElement>, 'children' | 'onCopy'> & {
  code: string;
  language?: string;
  filename?: string;
  showLineNumbers?: boolean;
  maxHeight?: string;
  copyable?: boolean;
  onCopy?: CodeCopyHandler;
  children?: React.ReactNode;
  copyLabel?: string;
};

type CopyState = 'idle' | 'copied' | 'failed';

function copyIcon(state: CopyState) {
  return (
    <Icon name={state === 'copied' ? 'Check' : 'Copy'} size="1em">
      {state === 'copied' ? <path d="m5 12 4 4L19 6" /> : <><rect x="8" y="8" width="11" height="11" rx="1" /><path d="M5 16V5a1 1 0 0 1 1-1h10" /></>}
    </Icon>
  );
}

export const CodeBlock = React.forwardRef<HTMLElement, CodeBlockProps>(function CodeBlock(
  {
    code,
    language,
    filename,
    showLineNumbers = false,
    maxHeight,
    copyable = true,
    onCopy,
    children,
    copyLabel,
    className,
    style,
    ...rest
  },
  ref,
) {
  const messages = useContentMessages();
  const captionId = React.useId();
  const [state, setState] = React.useState<CopyState>('idle');
  const timer = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  React.useEffect(() => () => clearTimeout(timer.current), []);

  const hasClipboard = typeof navigator !== 'undefined' && typeof navigator.clipboard?.writeText === 'function';
  const canCopy = copyable && Boolean(onCopy || hasClipboard);
  const caption = filename ?? language ?? messages.code.label;
  const lines = showLineNumbers ? code.split('\n') : [];
  const name = state === 'copied' ? messages.code.copied : state === 'failed' ? messages.code.copyFailed : (copyLabel ?? messages.code.copy);
  const codeStyle = maxHeight
    ? ({ ...style, '--rl-content-code-max-height': maxHeight } as React.CSSProperties)
    : style;

  const copy = async () => {
    if (!canCopy) return;
    clearTimeout(timer.current);
    try {
      if (onCopy) await onCopy(code);
      else await navigator.clipboard.writeText(code);
      setState('copied');
    } catch {
      setState('failed');
    }
    timer.current = setTimeout(() => setState('idle'), 1800);
  };

  return (
    <figure {...rest} ref={ref} className={['rl-content-code', className].filter(Boolean).join(' ')} style={codeStyle}>
      <figcaption className="rl-content-code__caption">
        <span id={captionId} className="rl-content-code__title">{caption}</span>
        {filename && language && <span className="rl-content-code__language">{language}</span>}
        {canCopy && <IconButton size="sm" variant="ghost" label={name} icon={copyIcon(state)} onClick={() => void copy()} />}
      </figcaption>
      {canCopy && <span className="rl-content-code__status" role="status">{state === 'idle' ? '' : name}</span>}
      <div className="rl-content-code__scroll" tabIndex={0} role="region" aria-labelledby={captionId}>
        {showLineNumbers && (
          <span className="rl-content-code__gutter" aria-hidden="true">
            {lines.map((_, index) => <span key={index}>{index + 1}</span>)}
          </span>
        )}
        <pre className="rl-content-code__pre"><code className="rl-content-code__code" data-language={language}>{children ?? code}</code></pre>
      </div>
    </figure>
  );
});
