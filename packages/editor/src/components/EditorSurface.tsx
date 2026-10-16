'use client';

import * as React from 'react';
import type { EditorAdapter, EditorChange, EditorHost, EditorSelection } from '../contracts.js';

export interface EditorSurfaceProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children' | 'onChange'> {
  adapter: EditorAdapter;
  source: string;
  readOnly?: boolean;
  selection?: EditorSelection;
  onChange?: (change: EditorChange) => void;
  onSelectionChange?: (selection: EditorSelection) => void;
  onCompositionChange?: (composing: boolean) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  placeholder?: React.ReactNode;
}

export const EditorSurface = React.forwardRef<HTMLDivElement, EditorSurfaceProps>(function EditorSurface(
  { adapter, source, readOnly = false, selection, onChange, onSelectionChange, onCompositionChange, onFocus, onBlur, placeholder, className, ...rest },
  ref,
) {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const hostRef = React.useRef<EditorHost | null>(null);
  const callbacks = React.useRef({ onChange, onSelectionChange, onCompositionChange, onFocus, onBlur });
  callbacks.current = { onChange, onSelectionChange, onCompositionChange, onFocus, onBlur };
  const [error, setError] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.replaceChildren();
    setError(false);
    setMounted(false);
    let host: EditorHost;
    try {
      host = adapter.create(container, {
        source,
        selection,
        ariaLabel: rest['aria-label'],
        readOnly,
        onChange: (change) => {
          callbacks.current.onChange?.(change);
        },
        onSelectionChange: (nextSelection) => callbacks.current.onSelectionChange?.(nextSelection),
        onCompositionChange: (composing) => callbacks.current.onCompositionChange?.(composing),
        onFocus: () => callbacks.current.onFocus?.(),
        onBlur: () => callbacks.current.onBlur?.(),
      });
      hostRef.current = host;
      setMounted(true);
    } catch {
      setError(true);
      hostRef.current = null;
      setMounted(false);
    }
    return () => {
      hostRef.current?.destroy();
      hostRef.current = null;
      setMounted(false);
    };
  }, [adapter, readOnly]);

  React.useEffect(() => {
    const host = hostRef.current;
    if (host && host.getSnapshot().source !== source) host.setSource(source);
  }, [source]);

  return (
    <div {...rest} ref={ref} className={['rl-editor__surface', className].filter(Boolean).join(' ')} data-state={error ? 'error' : 'ready'} role="textbox" aria-multiline="true">
      <div ref={containerRef} className="rl-editor__surface-host" aria-label={rest['aria-label']} />
      {error && <div className="rl-editor__surface-error" role="alert">Editor unavailable</div>}
      {!error && placeholder && source.length === 0 && <div className="rl-editor__surface-placeholder" aria-hidden="true">{placeholder}</div>}
      {!error && !mounted && <pre className="rl-editor__surface-fallback" aria-hidden="true">{source}</pre>}
    </div>
  );
});
