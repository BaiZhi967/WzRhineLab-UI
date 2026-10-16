'use client';

import * as React from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Alert, Button, EmptyState, Spinner } from '@wzrhine/react';
import { CodeBlock } from './CodeBlock.js';
import { extractHeadings, type MarkdownHeading, type MarkdownHeadingDepth } from '../markdown/heading-index.js';
import { resolveMarkdownUrl } from '../markdown/url-policy.js';
import { useContentMessages } from '../provider/ContentMessages.js';

export type MarkdownRenderStatus = 'ready' | 'loading' | 'empty' | 'error';

export interface MarkdownImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src' | 'alt'> {
  src: string;
  alt: string;
  title?: string;
}

export type MarkdownImageRenderer = (image: MarkdownImageProps) => React.ReactNode;

export type MarkdownRendererProps = Omit<React.HTMLAttributes<HTMLElement>, 'children'> & {
  source: string;
  status?: MarkdownRenderStatus;
  error?: React.ReactNode;
  onRetry?: () => void;
  retryLabel?: string;
  components?: Partial<Components>;
  onLinkActivate?: (href: string) => void;
  renderImage?: MarkdownImageRenderer;
};

function childrenText(children: React.ReactNode): string {
  if (Array.isArray(children)) return children.map(childrenText).join('');
  if (typeof children === 'string' || typeof children === 'number') return String(children);
  if (React.isValidElement<{ children?: React.ReactNode }>(children)) return childrenText(children.props.children);
  return '';
}

function headingRenderer(depth: MarkdownHeadingDepth, headings: readonly MarkdownHeading[], cursor: { value: number }) {
  return function Heading({ children, node: _node, ...props }: { children?: React.ReactNode; node?: unknown } & React.HTMLAttributes<HTMLHeadingElement>) {
    const text = childrenText(children);
    const heading = headings[cursor.value];
    if (heading && heading.depth === depth) cursor.value += 1;
    const Tag = `h${depth}` as keyof React.JSX.IntrinsicElements;
    return React.createElement(Tag, { ...props, id: heading?.id }, children);
  };
}

function ImageFallback({ alt, message }: { alt: string; message: string }) {
  return <span role="status" aria-label={alt} className="rl-content-markdown__image-fallback">{message}</span>;
}

function NativeImage({ image, message }: { image: MarkdownImageProps; message: string }) {
  const [failed, setFailed] = React.useState(false);
  if (failed) return <ImageFallback alt={image.alt} message={message} />;
  return <img {...image} loading="lazy" decoding="async" onError={() => setFailed(true)} />;
}

export const MarkdownRenderer = React.forwardRef<HTMLElement, MarkdownRendererProps>(function MarkdownRenderer(
  {
    source,
    status = 'ready',
    error,
    onRetry,
    retryLabel,
    components,
    onLinkActivate,
    renderImage,
    className,
    ...rest
  },
  ref,
) {
  const messages = useContentMessages();
  const headings = React.useMemo(() => extractHeadings(source), [source]);
  const headingCursor = { value: 0 };
  const { a: customAnchor, img: customImage, ...customComponents } = components ?? {};
  const retryText = retryLabel ?? messages.state.retry;

  if (status === 'loading') {
    return <section {...rest} ref={ref} className={['rl-content-markdown', className].filter(Boolean).join(' ')} data-state="loading" aria-busy="true"><Spinner size="lg" label={messages.state.loading} aria-label={messages.state.loading} aria-busy="true" /></section>;
  }
  if (status === 'empty' || (status === 'ready' && source.trim() === '')) {
    return <section {...rest} ref={ref} className={['rl-content-markdown', className].filter(Boolean).join(' ')} data-state="empty"><EmptyState data-testid="rl-content-empty" title={messages.state.empty} kind="empty" size="md" /></section>;
  }
  if (status === 'error') {
    return (
      <section {...rest} ref={ref} className={['rl-content-markdown', className].filter(Boolean).join(' ')} data-state="error">
        <Alert tone="danger" live="assertive" action={onRetry && <Button size="sm" variant="secondary" onClick={onRetry}>{retryText}</Button>}>
          {error}
        </Alert>
      </section>
    );
  }

  const builtIns: Components = {
    h1: headingRenderer(1, headings, headingCursor),
    h2: headingRenderer(2, headings, headingCursor),
    h3: headingRenderer(3, headings, headingCursor),
    h4: headingRenderer(4, headings, headingCursor),
    h5: headingRenderer(5, headings, headingCursor),
    h6: headingRenderer(6, headings, headingCursor),
    pre: ({ children }) => <>{children}</>,
    code: ({ children, className: codeClassName, node: _node, ...props }) => {
      const code = String(children).replace(/\n$/, '');
      const language = codeClassName?.match(/language-([\w-]+)/)?.[1];
      if (codeClassName || String(children).includes('\n')) return <CodeBlock code={code} language={language} />;
      return <code {...props} className={codeClassName}>{children}</code>;
    },
    a: ({ href, children, node: _node, ...props }) => {
      const safe = href ? resolveMarkdownUrl(href, 'link') : undefined;
      if (!safe) return <span {...props}>{children}</span>;
      if (customAnchor) return React.createElement(customAnchor, { ...props, href: safe, children });
      return <a {...props} href={safe} onClick={(event) => { if (onLinkActivate) { event.preventDefault(); onLinkActivate(safe); } }}>{children}</a>;
    },
    img: ({ src, alt, title, node: _node, ...props }) => {
      const safe = src ? resolveMarkdownUrl(src, 'image') : undefined;
      if (!safe) return <ImageFallback alt={alt ?? ''} message={messages.image.unavailable} />;
      const image: MarkdownImageProps = { ...props, src: safe, alt: alt ?? '', title };
      if (customImage) return React.createElement(customImage, image);
      return renderImage ? renderImage(image) : <NativeImage image={image} message={messages.image.unavailable} />;
    },
  };

  return (
    <section {...rest} ref={ref} className={['rl-content-markdown', className].filter(Boolean).join(' ')} data-state="ready">
      <ReactMarkdown remarkPlugins={[remarkGfm]} skipHtml urlTransform={(url, key, _node) => resolveMarkdownUrl(url, key === 'src' ? 'image' : 'link') ?? ''} components={{ ...builtIns, ...customComponents }}>
        {source}
      </ReactMarkdown>
    </section>
  );
});
