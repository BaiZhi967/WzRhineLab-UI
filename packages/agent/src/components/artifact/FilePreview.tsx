'use client';

import * as React from 'react';
import { Alert, Button, IconButton, Skeleton, Tab, TabList, TabPanel, Tabs } from '@wzrhine/react';
import type { FilePreviewMode, FilePreviewView } from '@wzrhine/agent-core';
import { useAgentFormat } from '../../provider/AgentMessages.js';
import { AgentIcon } from '../../primitives/icons.js';
import { cx } from '../../utils/cx.js';
import { Heading, useWorkspaceMessages } from '../workspace/shared.js';
import type { HeadingLevel, WorkspaceMessagesProp } from '../workspace/shared.js';

const TEXT_KINDS: FilePreviewView['kind'][] = ['text', 'markdown', 'code'];
const ZOOMS = [50, 100, 200] as const;
export type FilePreviewZoom = (typeof ZOOMS)[number];

export type FilePreviewProps = Omit<React.HTMLAttributes<HTMLElement>, 'children'> & {
  file: FilePreviewView;
  /** Active tab (controlled). */
  mode?: FilePreviewMode;
  defaultMode?: FilePreviewMode;
  onModeChange?: (mode: FilePreviewMode) => void;
  /** Markdown renderer for the preview tab; default shows the source. */
  renderMarkdown?: (source: string) => React.ReactNode;
  /** Code renderer (highlighting); default is numbered plain lines. */
  renderCode?: (code: string, language?: string) => React.ReactNode;
  onRetry?: () => void;
  onReload?: () => void;
  /** Loads the next chunk of a partially loaded file. */
  onLoadMore?: () => void;
  onOpenExternal?: (file: FilePreviewView) => void;
  /** Adds the file as a reference to the conversation. */
  onReference?: (file: FilePreviewView) => void;
  onClose?: () => void;
  /** Copy the loaded text. Default true for text-like files. */
  copyable?: boolean;
  headingLevel?: HeadingLevel;
  messages?: WorkspaceMessagesProp;
};

/**
 * FilePreview (atlas 30): read-only preview of a file the adapter loaded. Tabs (`@wzrhine/react`,
 * arrow keys) switch preview / raw / metadata; text is real, selectable text in its own focusable
 * scroll region, with decorative line numbers that are not copied. Images get their `alt` and a
 * 50 / 100 / 200% zoom inside a scroll container. Binary and unknown kinds say 「无法预览此类型」
 * and offer 「在外部打开」. Partial loads say how much is loaded and offer 「加载更多」; a changed
 * file keeps the old content with 「文件已更新」 + 「重新加载」.
 *
 * The component reads nothing itself; the clipboard is the only browser API it touches.
 * Motion: none (tab indicator is the Tabs component's own CSS transition).
 */
export const FilePreview = React.forwardRef<HTMLElement, FilePreviewProps>(function FilePreview(
  {
    file,
    mode,
    defaultMode = 'preview',
    onModeChange,
    renderMarkdown,
    renderCode,
    onRetry,
    onReload,
    onLoadMore,
    onOpenExternal,
    onReference,
    onClose,
    copyable,
    headingLevel = 3,
    messages: override,
    className,
    ...rest
  },
  ref,
) {
  const m = useWorkspaceMessages(override);
  const format = useAgentFormat();
  const id = React.useId();
  const titleId = `${id}-title`;
  const textual = TEXT_KINDS.includes(file.kind);
  const [innerMode, setInnerMode] = React.useState<FilePreviewMode>(defaultMode);
  const modes: FilePreviewMode[] = textual ? ['preview', 'raw', 'metadata'] : ['preview', 'metadata'];
  const requested = mode ?? innerMode;
  const active = modes.includes(requested) ? requested : 'preview';
  const hasContent = file.content !== undefined && file.status !== 'loading' && file.status !== 'missing' && file.status !== 'unavailable' && file.status !== 'error';
  const canCopy = (copyable ?? true) && textual && hasContent && Boolean(file.content);

  const changeMode = (next: string) => {
    const key = next as FilePreviewMode;
    if (mode === undefined) setInnerMode(key);
    onModeChange?.(key);
  };

  return (
    <section {...rest} ref={ref} className={cx('rl-agent-file', className)} aria-labelledby={titleId} data-kind={file.kind} data-status={file.status}>
      <header className="rl-agent-file__header">
        <AgentIcon name={file.kind === 'image' ? 'image' : file.kind === 'code' ? 'code' : 'file'} className="rl-agent-file__icon" />
        <div className="rl-agent-file__identity">
          <Heading level={headingLevel} id={titleId} className="rl-agent-file__name" title={file.name}>
            {file.name}
          </Heading>
          {(file.path || file.external || file.version) && (
            <p className="rl-agent-file__path">
              {file.path && (
                <span className="rl-agent-file__path-text" title={file.path}>
                  {file.path}
                </span>
              )}
              {file.external && <span className="rl-agent-file__badge">{m.fileExternal}</span>}
              {file.version && <span className="rl-agent-file__version">{m.artifactVersion(file.version)}</span>}
            </p>
          )}
        </div>
        {onClose && <IconButton size="sm" variant="ghost" icon={<AgentIcon name="close" />} label={m.fileClose} onClick={onClose} />}
      </header>
      <FileActions file={file} canCopy={canCopy} onOpenExternal={onOpenExternal} onReference={onReference} m={m} />
      <FileNotices file={file} onRetry={onRetry} onReload={onReload} onLoadMore={onLoadMore} m={m} format={format} />
      <Tabs value={active} onValueChange={changeMode} size="sm" className="rl-agent-file__tabs">
        <TabList aria-label={m.fileModes}>
          {modes.map((key) => (
            <Tab key={key} value={key}>
              {m.fileMode[key]}
            </Tab>
          ))}
        </TabList>
        <TabPanel value="preview" className="rl-agent-file__panel">
          <FileBody file={file} raw={false} renderMarkdown={renderMarkdown} renderCode={renderCode} onOpenExternal={onOpenExternal} m={m} />
        </TabPanel>
        {textual && (
          <TabPanel value="raw" className="rl-agent-file__panel">
            <FileBody file={file} raw renderMarkdown={renderMarkdown} renderCode={renderCode} onOpenExternal={onOpenExternal} m={m} />
          </TabPanel>
        )}
        <TabPanel value="metadata" className="rl-agent-file__panel">
          <FileMetadata file={file} m={m} format={format} />
        </TabPanel>
      </Tabs>
    </section>
  );
});

type M = ReturnType<typeof useWorkspaceMessages>;
type F = ReturnType<typeof useAgentFormat>;

function FileActions({
  file,
  canCopy,
  onOpenExternal,
  onReference,
  m,
}: {
  file: FilePreviewView;
  canCopy: boolean;
  onOpenExternal?: FilePreviewProps['onOpenExternal'];
  onReference?: FilePreviewProps['onReference'];
  m: M;
}) {
  const [copy, setCopy] = React.useState<'idle' | 'copied' | 'failed'>('idle');
  const timer = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  React.useEffect(() => () => clearTimeout(timer.current), []);
  React.useEffect(() => setCopy('idle'), [file.content]);
  if (!canCopy && !onOpenExternal && !onReference) return null;

  const doCopy = async () => {
    clearTimeout(timer.current);
    try {
      if (typeof navigator === 'undefined' || !navigator.clipboard) throw new Error('clipboard');
      await navigator.clipboard.writeText(file.content ?? '');
      setCopy('copied');
    } catch {
      setCopy('failed');
    }
    timer.current = setTimeout(() => setCopy('idle'), 2000);
  };

  return (
    <div className="rl-agent-file__actions">
      {canCopy && (
        <Button size="sm" variant="ghost" iconStart={<AgentIcon name={copy === 'copied' ? 'check' : 'copy'} />} onClick={() => void doCopy()}>
          {copy === 'copied' ? m.fileCopied : copy === 'failed' ? m.fileCopyFailed : m.fileCopy}
        </Button>
      )}
      {onReference && (
        <Button size="sm" variant="ghost" iconStart={<AgentIcon name="at" />} onClick={() => onReference(file)}>
          {m.fileReference}
        </Button>
      )}
      {onOpenExternal && (
        <Button size="sm" variant="ghost" iconStart={<AgentIcon name="external" />} onClick={() => onOpenExternal(file)}>
          {m.fileOpenExternal}
        </Button>
      )}
      <span className="rl-agent-sr" role="status">
        {copy === 'copied' ? m.fileCopied : copy === 'failed' ? m.fileCopyFailed : ''}
      </span>
    </div>
  );
}

function FileNotices({
  file,
  onRetry,
  onReload,
  onLoadMore,
  m,
  format,
}: Pick<FilePreviewProps, 'file' | 'onRetry' | 'onReload' | 'onLoadMore'> & { m: M; format: F }) {
  const notices: React.ReactNode[] = [];
  if (file.status === 'error') {
    notices.push(
      <Alert key="error" tone="danger" title={m.fileError} action={onRetry && <Button size="sm" variant="secondary" onClick={onRetry}>{m.fileRetry}</Button>}>
        {file.reason}
      </Alert>,
    );
  }
  if (file.status === 'missing' || file.status === 'unavailable') {
    notices.push(
      <Alert key="gone" tone="warning" title={file.status === 'missing' ? m.fileMissing : m.fileUnavailable}>
        {file.reason}
      </Alert>,
    );
  }
  if (file.status === 'changed') {
    notices.push(
      <Alert key="changed" tone="info" title={m.fileChanged} action={onReload && <Button size="sm" variant="secondary" onClick={onReload}>{m.fileReload}</Button>}>
        {file.reason}
      </Alert>,
    );
  }
  if (file.partial || file.status === 'large-file') {
    const loaded = file.partial ? format.bytes(file.partial.loadedBytes) : undefined;
    const total = file.partial?.totalBytes ?? file.size;
    const text = loaded ? (total !== undefined ? m.fileLoaded(loaded, format.bytes(total)) : m.fileLoadedNoTotal(loaded)) : undefined;
    notices.push(
      <Alert key="partial" tone="warning" title={m.fileLargeFile} action={onLoadMore && <Button size="sm" variant="secondary" onClick={onLoadMore}>{m.fileLoadMore}</Button>}>
        {text}
      </Alert>,
    );
  }
  if (notices.length === 0) return null;
  return <div className="rl-agent-file__notices">{notices}</div>;
}

function FileBody({
  file,
  raw,
  renderMarkdown,
  renderCode,
  onOpenExternal,
  m,
}: {
  file: FilePreviewView;
  raw: boolean;
  renderMarkdown?: FilePreviewProps['renderMarkdown'];
  renderCode?: FilePreviewProps['renderCode'];
  onOpenExternal?: FilePreviewProps['onOpenExternal'];
  m: M;
}) {
  if (file.status === 'loading') {
    return (
      <div className="rl-agent-file__loading" aria-busy="true">
        <Skeleton lines={4} />
        <span className="rl-agent-sr">{m.fileLoading}</span>
      </div>
    );
  }
  if (file.status === 'error' || file.status === 'missing' || file.status === 'unavailable') {
    return <p className="rl-agent-file__empty">{m.fileNoContent}</p>;
  }
  if (file.kind === 'binary' || file.kind === 'unknown') {
    return (
      <div className="rl-agent-file__unsupported">
        <AgentIcon name="file" />
        <p>{m.fileUnsupported}</p>
        {onOpenExternal && (
          <Button size="sm" variant="secondary" iconStart={<AgentIcon name="external" />} onClick={() => onOpenExternal(file)}>
            {m.fileOpenExternal}
          </Button>
        )}
      </div>
    );
  }
  if (file.content === undefined || file.content === '') return <p className="rl-agent-file__empty">{m.fileNoContent}</p>;
  if (file.kind === 'image') return <ImagePreview file={file} m={m} />;

  const label = m.fileContent(file.name);
  if (!raw && file.kind === 'markdown' && renderMarkdown) {
    return (
      <div className="rl-agent-file__scroll rl-agent-file__markdown" role="region" aria-label={label} tabIndex={0}>
        {renderMarkdown(file.content)}
      </div>
    );
  }
  if (!raw && file.kind === 'code' && renderCode) {
    return (
      <div className="rl-agent-file__scroll" role="region" aria-label={label} tabIndex={0}>
        {renderCode(file.content, file.language)}
      </div>
    );
  }
  return <NumberedText text={file.content} label={label} numbered={!raw} />;
}

/** Plain text with decorative (not copied, not read) line numbers. */
function NumberedText({ text, label, numbered }: { text: string; label: string; numbered: boolean }) {
  const lines = React.useMemo(() => text.replace(/\n$/, '').split('\n'), [text]);
  return (
    <div className="rl-agent-file__scroll" role="region" aria-label={label} tabIndex={0}>
      <pre className="rl-agent-file__code" data-numbered={numbered || undefined}>
        {numbered
          ? lines.map((line, i) => (
              <span key={i} className="rl-agent-file__line">
                <span className="rl-agent-file__ln" aria-hidden="true">
                  {i + 1}
                </span>
                <span className="rl-agent-file__text">{line}</span>
                {'\n'}
              </span>
            ))
          : text}
      </pre>
    </div>
  );
}

function ImagePreview({ file, m }: { file: FilePreviewView; m: M }) {
  const [zoom, setZoom] = React.useState<FilePreviewZoom>(100);
  const style = { '--rl-agent-file-zoom': zoom / 100 } as React.CSSProperties;
  return (
    <div className="rl-agent-file__image">
      <div className="rl-agent-file__zoom" role="group" aria-label={m.fileZoom}>
        {ZOOMS.map((z) => (
          <button key={z} type="button" className="rl-agent-file__zoom-option" aria-pressed={zoom === z} onClick={() => setZoom(z)}>
            {z}%
          </button>
        ))}
      </div>
      <div className="rl-agent-file__scroll rl-agent-file__canvas" role="region" aria-label={m.fileContent(file.name)} tabIndex={0}>
        <img className="rl-agent-file__img" src={file.content} alt={file.alt ?? file.name} style={style} data-zoom={zoom} />
      </div>
    </div>
  );
}

function FileMetadata({ file, m, format }: { file: FilePreviewView; m: M; format: F }) {
  const rows: { label: string; value: string }[] = [{ label: m.fileMeta.name, value: file.name }];
  if (file.path) rows.push({ label: m.fileMeta.path, value: file.path });
  rows.push({ label: m.fileMeta.type, value: file.mimeType ?? m.artifactKind[file.kind === 'binary' ? 'file' : file.kind] });
  if (file.language) rows.push({ label: m.fileMeta.language, value: file.language });
  if (file.size !== undefined) rows.push({ label: m.fileMeta.size, value: format.bytes(file.size) });
  if (file.version) rows.push({ label: m.fileMeta.version, value: file.version });
  for (const extra of file.metadata ?? []) rows.push(extra);
  return (
    <dl className="rl-agent-file__meta">
      {rows.map((row, i) => (
        <div key={`${row.label}-${i}`} className="rl-agent-file__meta-row">
          <dt>{row.label}</dt>
          <dd>{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}
