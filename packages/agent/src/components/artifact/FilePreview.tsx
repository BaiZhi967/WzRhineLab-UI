'use client';

import * as React from 'react';
import { Alert, Breadcrumb, Button, IconButton, Menu, MenuGroup, MenuItem, MenuSeparator, Skeleton, Tab, TabList, TabPanel, Tabs } from '@wzrhine/react';
import type { BreadcrumbItem } from '@wzrhine/react';
import type { FilePreviewMode, FilePreviewView } from '@wzrhine/agent-core';
import { useAgentFormat } from '../../provider/AgentMessages.js';
import { AgentIcon } from '../../primitives/icons.js';
import { cx } from '../../utils/cx.js';
import { Heading, useWorkspaceMessages } from '../workspace/shared.js';
import type { HeadingLevel, WorkspaceMessagesProp } from '../workspace/shared.js';

const TEXT_KINDS: FilePreviewView['kind'][] = ['text', 'markdown', 'code'];
const DEFAULT_ZOOMS: readonly number[] = [25, 50, 100, 200, 400];
/** A zoom percentage of the image's natural width, or `fit` (scale to the preview width). */
export type FilePreviewZoom = number | 'fit';

/** One way to open the file, offered by the host (an editor, the system viewer, a folder). */
export interface FileOpenTarget {
  id: string;
  label: string;
  /** `app` opens the file; `reveal` shows it in a folder. Default `app`. */
  group?: 'app' | 'reveal';
}

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
  /** Ways to open the file. With `onOpenWith` they render a split button + menu. */
  openTargets?: FileOpenTarget[];
  /** Target used by the primary half of the split button; default the first `app` target. */
  defaultOpenTarget?: string;
  onOpenWith?: (targetId: string, file: FilePreviewView) => void;
  /** Copies `file.path` (menu item 「复制路径」); default writes it to the clipboard. */
  onCopyPath?: (path: string, file: FilePreviewView) => void | Promise<void>;
  /** Image zoom percentages (of the natural width); a 「适应宽度」 option is always added. */
  zoomLevels?: number[];
  /** Initial image zoom; default `fit`. */
  defaultZoom?: FilePreviewZoom;
  /**
   * Workspace root. Paths under it show as a workspace-relative breadcrumb (root name first);
   * paths outside it get the 「外部」 badge.
   */
  breadcrumbRoot?: string;
  /** Copy the loaded text. Default true for text-like files. */
  copyable?: boolean;
  headingLevel?: HeadingLevel;
  messages?: WorkspaceMessagesProp;
};

/**
 * FilePreview (atlas 30): read-only preview of a file the adapter loaded. Tabs (`@wzrhine/react`,
 * arrow keys) switch preview / raw / metadata; text is real, selectable text in its own focusable
 * scroll region, with decorative line numbers that are not copied. Images get their `alt` and a
 * zoom group (`zoomLevels`, default 25–400% of the natural width, plus 「适应宽度」) inside a scroll
 * container. Binary and unknown kinds say 「无法预览此类型」 and offer 「在外部打开」. Partial loads
 * say how much is loaded and offer 「加载更多」; a changed file keeps the old content with
 * 「文件已更新」 + 「重新加载」, and `onReload` is also always offered as 「重新读取」.
 *
 * The path is a `Breadcrumb` (`<nav>` + `<ol>`), workspace-relative under `breadcrumbRoot`.
 * `openTargets` + `onOpenWith` draw a split control: the primary button opens with the default
 * target, the menu button (`Menu`: arrow keys, Escape, focus return) lists every target plus
 * 「复制路径」 and 「在对话中引用」.
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
    openTargets,
    defaultOpenTarget,
    onOpenWith,
    onCopyPath,
    zoomLevels,
    defaultZoom,
    breadcrumbRoot,
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
  const crumbs = React.useMemo(() => pathCrumbs(file.path, breadcrumbRoot), [file.path, breadcrumbRoot]);
  const external = Boolean(file.external) || crumbs?.outside === true;

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
          {crumbs && (
            <Breadcrumb
              className="rl-agent-file__crumbs"
              items={crumbs.items}
              label={m.fileBreadcrumb(file.name)}
              expandLabel={m.fileBreadcrumbExpand}
              title={file.path}
            />
          )}
          {(external || file.version) && (
            <p className="rl-agent-file__path">
              {external && <span className="rl-agent-file__badge">{m.fileExternal}</span>}
              {file.version && <span className="rl-agent-file__version">{m.artifactVersion(file.version)}</span>}
            </p>
          )}
        </div>
        {onClose && <IconButton size="sm" variant="ghost" icon={<AgentIcon name="close" />} label={m.fileClose} onClick={onClose} />}
      </header>
      <FileActions
        file={file}
        canCopy={canCopy}
        onOpenExternal={onOpenExternal}
        onReference={onReference}
        onReload={onReload}
        openTargets={openTargets}
        defaultOpenTarget={defaultOpenTarget}
        onOpenWith={onOpenWith}
        onCopyPath={onCopyPath}
        m={m}
      />
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
          <FileBody
            file={file}
            raw={false}
            renderMarkdown={renderMarkdown}
            renderCode={renderCode}
            onOpenExternal={onOpenExternal}
            zoomLevels={zoomLevels}
            defaultZoom={defaultZoom}
            m={m}
          />
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

type CopyState = 'idle' | 'copied' | 'failed' | 'path-copied' | 'path-failed';

async function writeClipboard(text: string): Promise<void> {
  if (typeof navigator === 'undefined' || !navigator.clipboard) throw new Error('clipboard');
  await navigator.clipboard.writeText(text);
}

function FileActions({
  file,
  canCopy,
  onOpenExternal,
  onReference,
  onReload,
  openTargets,
  defaultOpenTarget,
  onOpenWith,
  onCopyPath,
  m,
}: {
  file: FilePreviewView;
  canCopy: boolean;
  m: M;
} & Pick<FilePreviewProps, 'onOpenExternal' | 'onReference' | 'onReload' | 'openTargets' | 'defaultOpenTarget' | 'onOpenWith' | 'onCopyPath'>) {
  const [copy, setCopy] = React.useState<CopyState>('idle');
  const timer = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  React.useEffect(() => () => clearTimeout(timer.current), []);
  React.useEffect(() => setCopy('idle'), [file.content, file.path]);
  const targets = onOpenWith ? (openTargets ?? []) : [];
  const split = targets.length > 0;
  if (!canCopy && !onOpenExternal && !onReference && !onReload && !split) return null;

  const run = async (write: () => void | Promise<void>, ok: CopyState, fail: CopyState) => {
    clearTimeout(timer.current);
    try {
      await write();
      setCopy(ok);
    } catch {
      setCopy(fail);
    }
    timer.current = setTimeout(() => setCopy('idle'), 2000);
  };
  const copyContent = () => run(() => writeClipboard(file.content ?? ''), 'copied', 'failed');
  const copyPath = () => run(() => (onCopyPath ? onCopyPath(file.path!, file) : writeClipboard(file.path!)), 'path-copied', 'path-failed');
  const announced = { idle: '', copied: m.fileCopied, failed: m.fileCopyFailed, 'path-copied': m.fileCopiedPath, 'path-failed': m.fileCopyPathFailed }[copy];

  return (
    <div className="rl-agent-file__actions">
      {split && (
        <OpenWithSplit
          file={file}
          targets={targets}
          defaultTarget={defaultOpenTarget}
          onOpenWith={onOpenWith!}
          onCopyPath={file.path ? () => void copyPath() : undefined}
          onReference={onReference}
          m={m}
        />
      )}
      {canCopy && (
        <Button size="sm" variant="ghost" iconStart={<AgentIcon name={copy === 'copied' ? 'check' : 'copy'} />} onClick={() => void copyContent()}>
          {copy === 'copied' ? m.fileCopied : copy === 'failed' ? m.fileCopyFailed : m.fileCopy}
        </Button>
      )}
      {onReference && (
        <Button size="sm" variant="ghost" iconStart={<AgentIcon name="at" />} onClick={() => onReference(file)}>
          {m.fileReference}
        </Button>
      )}
      {onReload && (
        <Button size="sm" variant="ghost" iconStart={<AgentIcon name="retry" />} onClick={onReload}>
          {m.fileReread}
        </Button>
      )}
      {onOpenExternal && (
        <Button size="sm" variant="ghost" iconStart={<AgentIcon name="external" />} onClick={() => onOpenExternal(file)}>
          {m.fileOpenExternal}
        </Button>
      )}
      <span className="rl-agent-sr" role="status">
        {announced}
      </span>
    </div>
  );
}

/**
 * Local split control: the primary button opens with the default target; the adjoining menu
 * button (its own accessible name) opens a `Menu` with every target grouped by app / reveal,
 * then 「复制路径」 and 「在对话中引用」. Both halves are real buttons in the tab order.
 */
function OpenWithSplit({
  file,
  targets,
  defaultTarget,
  onOpenWith,
  onCopyPath,
  onReference,
  m,
}: {
  file: FilePreviewView;
  targets: FileOpenTarget[];
  defaultTarget?: string;
  onOpenWith: NonNullable<FilePreviewProps['onOpenWith']>;
  onCopyPath?: () => void;
  onReference?: FilePreviewProps['onReference'];
  m: M;
}) {
  const apps = targets.filter((t) => (t.group ?? 'app') === 'app');
  const reveals = targets.filter((t) => t.group === 'reveal');
  const primary = targets.find((t) => t.id === defaultTarget) ?? apps[0] ?? targets[0]!;
  const extras = Boolean(onCopyPath || onReference);
  return (
    <span className="rl-agent-file__split" role="group" aria-label={m.fileOpenGroup.app}>
      <Button
        size="sm"
        variant="secondary"
        className="rl-agent-file__split-main"
        iconStart={<AgentIcon name={primary.group === 'reveal' ? 'folder' : 'external'} />}
        onClick={() => onOpenWith(primary.id, file)}
      >
        {m.fileOpenWith(primary.label)}
      </Button>
      <Menu
        align="end"
        trigger={
          <IconButton size="sm" variant="secondary" className="rl-agent-file__split-menu" icon={<AgentIcon name="chevron-down" />} label={m.fileOpenTargets(file.name)} />
        }
      >
        {apps.length > 0 && (
          <MenuGroup label={m.fileOpenGroup.app}>
            {apps.map((t) => (
              <MenuItem key={t.id} icon={<AgentIcon name="external" />} onSelect={() => onOpenWith(t.id, file)}>
                {t.label}
              </MenuItem>
            ))}
          </MenuGroup>
        )}
        {reveals.length > 0 && (
          <MenuGroup label={m.fileOpenGroup.reveal}>
            {reveals.map((t) => (
              <MenuItem key={t.id} icon={<AgentIcon name="folder" />} onSelect={() => onOpenWith(t.id, file)}>
                {t.label}
              </MenuItem>
            ))}
          </MenuGroup>
        )}
        {extras && <MenuSeparator />}
        {onCopyPath && (
          <MenuItem icon={<AgentIcon name="copy" />} onSelect={onCopyPath}>
            {m.fileCopyPath}
          </MenuItem>
        )}
        {onReference && (
          <MenuItem icon={<AgentIcon name="at" />} onSelect={() => onReference(file)}>
            {m.fileReference}
          </MenuItem>
        )}
      </Menu>
    </span>
  );
}

/**
 * Breadcrumb items for a path. Under `root` the path is shown relative to it (root's last segment
 * first); outside it (or for absolute paths without a root match) `outside` is true.
 */
export function pathCrumbs(path: string | undefined, root?: string): { items: BreadcrumbItem[]; outside: boolean } | undefined {
  if (!path) return undefined;
  const norm = (p: string) => p.replace(/\\/g, '/').replace(/\/+$/, '');
  const full = norm(path);
  let segments: string[];
  let outside = false;
  if (root) {
    const base = norm(root);
    const under = full === base || full.startsWith(`${base}/`) || (/^[a-z]:/i.test(base) && full.toLowerCase().startsWith(`${base.toLowerCase()}/`));
    if (under) {
      const rootName = base.split('/').filter(Boolean).pop() ?? base;
      segments = [rootName, ...full.slice(base.length).split('/').filter(Boolean)];
    } else {
      outside = true;
      segments = full.split('/').filter(Boolean);
    }
  } else {
    segments = full.split('/').filter(Boolean);
  }
  if (segments.length === 0) segments = [full];
  return { items: segments.map((label) => ({ label })), outside };
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
  zoomLevels,
  defaultZoom,
  m,
}: {
  file: FilePreviewView;
  raw: boolean;
  renderMarkdown?: FilePreviewProps['renderMarkdown'];
  renderCode?: FilePreviewProps['renderCode'];
  onOpenExternal?: FilePreviewProps['onOpenExternal'];
  zoomLevels?: number[];
  defaultZoom?: FilePreviewZoom;
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
  if (file.kind === 'image') return <ImagePreview file={file} levels={zoomLevels} defaultZoom={defaultZoom} m={m} />;

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

/**
 * Image with a zoom group. Percentages are of the natural width (known after load); before the
 * image has loaded, or when the browser reports no natural size, they fall back to a share of the
 * preview width. `fit` scales the image down to the preview width, never up.
 */
function ImagePreview({ file, levels, defaultZoom = 'fit', m }: { file: FilePreviewView; levels?: number[]; defaultZoom?: FilePreviewZoom; m: M }) {
  const options = React.useMemo(() => {
    const list = (levels && levels.length > 0 ? levels : DEFAULT_ZOOMS).filter((z) => Number.isFinite(z) && z > 0);
    return [...new Set(list)].sort((a, b) => a - b);
  }, [levels]);
  const [zoom, setZoom] = React.useState<FilePreviewZoom>(defaultZoom);
  const [natural, setNatural] = React.useState<number | undefined>(undefined);
  const style: React.CSSProperties =
    zoom === 'fit'
      ? {}
      : natural
        ? { width: `${(natural * zoom) / 100}px` }
        : ({ '--rl-agent-file-zoom': zoom / 100 } as React.CSSProperties);
  return (
    <div className="rl-agent-file__image">
      <div className="rl-agent-file__zoom" role="group" aria-label={m.fileZoom}>
        <button type="button" className="rl-agent-file__zoom-option" aria-pressed={zoom === 'fit'} onClick={() => setZoom('fit')}>
          {m.fileZoomFit}
        </button>
        {options.map((z) => (
          <button key={z} type="button" className="rl-agent-file__zoom-option" aria-pressed={zoom === z} onClick={() => setZoom(z)}>
            {z}%
          </button>
        ))}
      </div>
      <div className="rl-agent-file__scroll rl-agent-file__canvas" role="region" aria-label={m.fileContent(file.name)} tabIndex={0}>
        <img
          className="rl-agent-file__img"
          src={file.content}
          alt={file.alt ?? file.name}
          style={style}
          data-zoom={zoom}
          onLoad={(event) => setNatural(event.currentTarget.naturalWidth || undefined)}
        />
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
