'use client';

import * as React from 'react';
import { ResizeHandle } from '@wzrhine/react';
import type { MarkdownImageRenderer, MarkdownRenderStatus } from '@wzrhine/content';
import type { EditorAdapter, EditorChange, EditorMode, EditorSelection } from '../contracts.js';
import { EditorModeSwitcher } from './EditorModeSwitcher.js';
import { EditorSurface } from './EditorSurface.js';
import { PreviewPane } from './PreviewPane.js';

export interface EditorModeViewProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children' | 'onChange'> {
  mode: EditorMode;
  source: string;
  adapter: EditorAdapter;
  readOnly?: boolean;
  onChange?: (change: EditorChange) => void;
  onSelectionChange?: (selection: EditorSelection) => void;
  onCompositionChange?: (composing: boolean) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  onModeChange: (mode: EditorMode) => void;
  previewStatus?: MarkdownRenderStatus;
  previewError?: React.ReactNode;
  onRetry?: () => void;
  onLinkActivate?: (href: string) => void;
  renderImage?: MarkdownImageRenderer;
  toolbar?: React.ReactNode;
  status?: React.ReactNode;
  resizableDivider?: boolean;
  splitSize?: number;
  onSplitSizeChange?: (size: number) => void;
  splitMin?: number;
  splitMax?: number;
}

function SourcePane({ props, className }: { props: EditorModeViewProps; className?: string }) {
  return (
    <div className={['rl-editor__mode-pane', 'rl-editor__source-pane', className].filter(Boolean).join(' ')} data-testid="editor-source-pane">
      <EditorSurface
        adapter={props.adapter}
        source={props.source}
        readOnly={props.readOnly}
        onChange={props.onChange}
        onSelectionChange={props.onSelectionChange}
        onCompositionChange={props.onCompositionChange}
        onFocus={props.onFocus}
        onBlur={props.onBlur}
        aria-label="Markdown source"
      />
    </div>
  );
}

function PreviewPaneView({ props, className }: { props: EditorModeViewProps; className?: string }) {
  return (
    <div className={['rl-editor__mode-pane', 'rl-editor__preview-pane-wrap', className].filter(Boolean).join(' ')} data-testid="editor-preview-pane">
      <PreviewPane
        source={props.source}
        status={props.previewStatus}
        error={props.previewError}
        onRetry={props.onRetry}
        onLinkActivate={props.onLinkActivate}
        renderImage={props.renderImage}
        aria-label="Markdown preview"
      />
    </div>
  );
}

export const EditorModeView = React.forwardRef<HTMLDivElement, EditorModeViewProps>(function EditorModeView(
  {
    mode,
    source,
    adapter,
    readOnly,
    onChange,
    onSelectionChange,
    onCompositionChange,
    onFocus,
    onBlur,
    onModeChange,
    previewStatus,
    previewError,
    onRetry,
    onLinkActivate,
    renderImage,
    toolbar,
    status,
    resizableDivider = false,
    splitSize,
    onSplitSizeChange,
    splitMin = 240,
    splitMax = 720,
    className,
    style,
    ...rest
  },
  ref,
) {
  const props: EditorModeViewProps = {
    mode,
    source,
    adapter,
    readOnly,
    onChange,
    onSelectionChange,
    onCompositionChange,
    onFocus,
    onBlur,
    onModeChange,
    previewStatus,
    previewError,
    onRetry,
    onLinkActivate,
    renderImage,
  };
  const splitStyle = { ...style, ...(splitSize === undefined ? {} : { '--rl-editor-split-start': `${splitSize}px` }) } as React.CSSProperties;
  return (
    <div {...rest} ref={ref} className={['rl-editor__mode-view', `rl-editor__mode-view--${mode}`, className].filter(Boolean).join(' ')} style={splitStyle} data-mode={mode}>
      {toolbar}
      <EditorModeSwitcher value={mode} onModeChange={onModeChange} />
      {status}
      {mode === 'source' && <SourcePane props={props} />}
      {mode === 'preview' && <PreviewPaneView props={props} />}
      {mode === 'split' && (
        <div className="rl-editor__split-view">
          <SourcePane props={props} />
          {resizableDivider ? (
            <ResizeHandle
              className="rl-editor__split-divider"
              min={splitMin}
              max={splitMax}
              size={splitSize}
              onSizeChange={onSplitSizeChange}
              label="Resize editor preview"
              pane="end"
            />
          ) : (
            <span className="rl-editor__split-divider" aria-hidden="true" />
          )}
          <PreviewPaneView props={props} />
        </div>
      )}
    </div>
  );
});
