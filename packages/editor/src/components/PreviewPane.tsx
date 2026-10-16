'use client';

import * as React from 'react';
import { MarkdownRenderer, type MarkdownImageRenderer, type MarkdownRenderStatus } from '@wzrhine/content';

export interface PreviewPaneProps extends Omit<React.HTMLAttributes<HTMLElement>, 'children'> {
  source: string;
  status?: MarkdownRenderStatus;
  error?: React.ReactNode;
  onRetry?: () => void;
  retryLabel?: string;
  onLinkActivate?: (href: string) => void;
  renderImage?: MarkdownImageRenderer;
}

export const PreviewPane = React.forwardRef<HTMLElement, PreviewPaneProps>(function PreviewPane(
  { source, status, error, onRetry, retryLabel, onLinkActivate, renderImage, className, ...rest },
  ref,
) {
  return (
    <MarkdownRenderer
      {...rest}
      ref={ref}
      source={source}
      status={status}
      error={error}
      onRetry={onRetry}
      retryLabel={retryLabel}
      onLinkActivate={onLinkActivate}
      renderImage={renderImage}
      className={['rl-editor__preview-pane', className].filter(Boolean).join(' ')}
    />
  );
});
