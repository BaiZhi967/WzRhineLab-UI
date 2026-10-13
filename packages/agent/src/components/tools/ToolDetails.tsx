'use client';

import * as React from 'react';
import type { AgentTone, StatusGlyphName, ToolCallView, ToolDetailView } from '@wzrhine/agent-core';
import { lineDiff } from '@wzrhine/agent-core';
import { useAgentFormat, useAgentMessages } from '../../provider/AgentMessages.js';
import { AgentSpark } from '../../primitives/AgentSpark.js';
import { cx } from '../../utils/cx.js';
import { DiffPreview, MultiFileDiff } from './DiffPreview.js';
import { ChunkPager } from './ChunkPager.js';
import type { ChunkPagerActions } from './ChunkPager.js';
import { ToolOutput } from './ToolOutput.js';
import type { ToolOutputProps } from './ToolOutput.js';
import { ActionButton, CodeView, CopyButton, MetaList, Notice, Pill, toDisplayJson } from './shared.js';

/*
 * Tool-specific detail views (atlas 37–44 + question / sub-task / generic). Each one renders a
 * `ToolDetailView` variant and is exported for standalone use (e.g. inside an approval card).
 * `ToolDetail` dispatches by `detail.kind`; anything unknown falls back to GenericToolDetail.
 * Rules shared by all of them:
 * - real result info only: next offsets, exit codes and save states come from the data, never
 *   computed; a callback without data (or data without a callback) renders no button;
 * - unknown is a warning, never success; danger (delete, non-sandboxed, non-zero exit) is said in
 *   text, not colour alone;
 * - wide content (code, diffs, tables) scrolls inside its own focusable region.
 */

type DetailOf<K extends ToolDetailView['kind']> = Extract<ToolDetailView, { kind: K }>;

type DetailBase = Omit<React.HTMLAttributes<HTMLDivElement>, 'children'>;

function Section({ title, children, className }: { title?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <div className={cx('rl-agent-detail__section', className)}>
      {title != null && <p className="rl-agent-detail__title">{title}</p>}
      {children}
    </div>
  );
}

function fileName(path: string) {
  const parts = path.split(/[\\/]/);
  return parts[parts.length - 1] || path;
}

// ---------------------------------------------------------------------------------------------
// file-read

export type FileReadDetailProps = DetailBase & {
  detail: DetailOf<'file-read'>;
  /** Continue reading from the runtime-provided `nextOffset`. Rendered only when `nextOffset` exists. */
  onReadMore?: (nextOffset: number) => void;
};

/** FileReadDetail (atlas 37): path, range, preview with line numbers from `range.start`, real result info. */
export function FileReadDetail({ detail, onReadMore, className, ...rest }: FileReadDetailProps) {
  const m = useAgentMessages().tools;
  const fmt = useAgentFormat();
  const unit = detail.nextOffsetUnit ?? detail.range?.unit ?? 'lines';
  const startLine = detail.range?.unit === 'lines' ? detail.range.start : detail.range ? undefined : 1;
  // Only facts the runtime reported; nothing is inferred (no "next offset" without `nextOffset`).
  const facts = [
    detail.eof === true && m.readEof,
    detail.eof === false && (detail.nextOffset != null ? m.readContinue(detail.nextOffset, unit) : m.readNotEof),
    detail.eof === undefined && detail.nextOffset != null && m.readContinue(detail.nextOffset, unit),
    detail.totalLines != null && m.readTotalLines(fmt.number(detail.totalLines)),
    detail.bytes != null && m.readBytes(fmt.bytes(detail.bytes)),
  ].filter((x): x is string => typeof x === 'string');
  return (
    <div {...rest} className={cx('rl-agent-detail', className)} data-kind="file-read">
      <MetaList
        items={[
          { label: m.path, value: detail.path, mono: true },
          detail.version != null && { label: m.currentVersion, value: detail.version, mono: true },
          detail.range && {
            label: m.editRange,
            value: m.readRange(detail.range.start, detail.range.end, detail.range.unit),
          },
        ]}
      />
      {detail.error ? (
        <Notice tone={detail.error === 'not-found' ? 'warning' : 'danger'}>{m.readError[detail.error](fileName(detail.path))}</Notice>
      ) : (
        detail.preview != null && <CodeView code={detail.preview} label={m.readPreview(detail.path)} startLine={startLine} />
      )}
      {!detail.error && facts.length > 0 && (
        <ul className="rl-agent-detail__facts" aria-label={m.readResult}>
          {facts.map((fact, i) => (
            <li key={i}>{fact}</li>
          ))}
        </ul>
      )}
      {detail.nextOffset != null && onReadMore && (
        <div className="rl-agent-detail__actions">
          <ActionButton icon="arrow-down" onClick={() => onReadMore(detail.nextOffset!)}>
            {m.readMore}
          </ActionButton>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------------------------
// file-write

export type FileWriteDetailProps = DetailBase & {
  detail: DetailOf<'file-write'>;
  onReload?: () => void;
  onViewFull?: () => void;
  beforeActions?: ChunkPagerActions;
  display?: 'verbatim' | 'diff';
};

/** FileWriteDetail (atlas 38): target, write mode, expected vs current version, proposal diff. */
export function FileWriteDetail({ detail, onReload, onViewFull, beforeActions, display = 'diff', className, ...rest }: FileWriteDetailProps) {
  const m = useAgentMessages().tools;
  const conflict = detail.expectedVersion != null && detail.currentVersion != null && detail.expectedVersion !== detail.currentVersion;
  return (
    <div {...rest} className={cx('rl-agent-detail', className)} data-kind="file-write">
      <MetaList
        items={[
          { label: m.writeTarget, value: detail.path, mono: true },
          { label: m.writeModeLabel, value: m.writeMode[detail.mode] },
          detail.expectedVersion != null && {
            label: m.expectedVersion,
            value: detail.expectedVersion,
            mono: true,
          },
          detail.currentVersion != null && {
            label: m.currentVersion,
            value: detail.currentVersion,
            mono: true,
          },
        ]}
      />
      {conflict && (
        <Notice
          tone="warning"
          action={
            onReload && (
              <ActionButton icon="retry" onClick={onReload}>
                {m.reloadFile}
              </ActionButton>
            )
          }
        >
          {m.versionConflict(detail.expectedVersion!, detail.currentVersion!)}
        </Notice>
      )}
      {detail.materialReady === false && <Notice tone="info">{m.materialPending}</Notice>}
      {detail.diff?.before && <ChunkPager page={detail.diff.before} label={m.expectedVersion} canGoBack={false} {...beforeActions} />}
      {detail.diff && display === 'diff' && (
        <DiffPreview
          diff={conflict && !detail.diff.status ? { ...detail.diff, status: 'conflict' } : detail.diff}
          onReload={conflict ? undefined : onReload}
          onViewFull={onViewFull}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------------------------
// file-edit

export type EditFileDetailProps = DetailBase & {
  detail: DetailOf<'file-edit'>;
  pageActions?: ChunkPagerActions;
  display?: 'verbatim' | 'diff';
};

/** EditFileDetail (atlas 39): every edit as 「编辑 N」 with range, strategy and a before/after diff. */
export function EditFileDetail({ detail, pageActions, display = 'diff', className, ...rest }: EditFileDetailProps) {
  const m = useAgentMessages().tools;
  return (
    <div {...rest} className={cx('rl-agent-detail', className)} data-kind="file-edit">
      <MetaList
        items={[
          { label: m.path, value: detail.path, mono: true },
          detail.expectedVersion != null && {
            label: m.expectedVersion,
            value: detail.expectedVersion,
            mono: true,
          },
        ]}
      />
      {detail.materialReady === false && <Notice tone="info">{m.materialPending}</Notice>}
      {detail.replacementCount !== undefined && <p className="rl-agent-detail__aside">{m.editTitle(detail.replacementCount)}</p>}
      {detail.complete === false && <Notice tone="info">{m.editTruncated}</Notice>}
      {detail.page && <ChunkPager page={detail.page} label={m.editRange} canGoBack={false} {...pageActions} />}
      <ol className="rl-agent-detail__edits">
        {detail.edits.map((edit, i) => {
          const result = lineDiff(edit.before, edit.after);
          const offset = edit.range?.unit === 'lines' ? edit.range.start - 1 : 0;
          const lines = result.hunk.lines.map((line) => ({
            ...line,
            oldLine: line.oldLine != null ? line.oldLine + offset : undefined,
            newLine: line.newLine != null ? line.newLine + offset : undefined,
          }));
          return (
            <li key={edit.id} className="rl-agent-detail__edit">
              <p className="rl-agent-detail__title">
                {m.editTitle(i + 1)}
                {edit.range && (
                  <span className="rl-agent-detail__aside">{m.readRange(edit.range.start, edit.range.end, edit.range.unit)}</span>
                )}
                {edit.strategy && (
                  <span className="rl-agent-detail__aside">
                    {m.editStrategy} · {edit.strategy}
                  </span>
                )}
              </p>
              {display === 'verbatim' ? <><CodeView code={edit.before} label={m.expectedVersion} /><CodeView code={edit.after} label={m.currentVersion} /></> : <DiffPreview
                hideHeader
                diff={{
                  path: `${detail.path} · ${m.editTitle(i + 1)}`,
                  change: 'update',
                  hunks: [{ ...result.hunk, id: `${edit.id}-h`, lines }],
                  truncated: edit.truncated || result.truncated,
                }}
              />}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

// ---------------------------------------------------------------------------------------------
// patch

export type ApplyPatchDetailProps = DetailBase & {
  detail: DetailOf<'patch'>;
  onReload?: (path: string) => void;
  onViewFull?: (path: string) => void;
  rawActions?: ChunkPagerActions;
};

/** ApplyPatchDetail (atlas 40): per-file change and status; a conflict names its files. */
export function ApplyPatchDetail({ detail, onReload, onViewFull, rawActions, className, ...rest }: ApplyPatchDetailProps) {
  const m = useAgentMessages().tools;
  const conflicts = detail.files.filter((f) => f.status === 'conflict').map((f) => f.path);
  return (
    <div {...rest} className={cx('rl-agent-detail', className)} data-kind="patch">
      {detail.revision && <p className="rl-agent-detail__aside">{m.revision(detail.revision)}</p>}
      {detail.baseVersion && <p className="rl-agent-detail__aside">{m.expectedVersion} {detail.baseVersion}</p>}
      {detail.raw && <ChunkPager page={detail.raw} label={m.patchFiles} canGoBack={false} {...rawActions} />}
      {conflicts.length > 0 && <Notice tone="warning">{m.patchConflict(conflicts.join(', '))}</Notice>}
      {detail.materialReady === false && <Notice tone="info">{m.materialPending}</Notice>}
      {detail.hunksAvailable === false ? <ul aria-label={m.patchFiles}>{detail.files.map((file) => <li key={file.path}>{file.path}</li>)}</ul> : <MultiFileDiff files={detail.files} label={m.patchFiles} onReload={onReload} onViewFull={onViewFull} />}
    </div>
  );
}

// ---------------------------------------------------------------------------------------------
// manage-files

export type ManageFilesDetailProps = DetailBase & {
  detail: DetailOf<'manage-files'>;
  onLoadMore?: () => void;
  loadingMore?: boolean;
  pageActions?: ChunkPagerActions;
};

const opStatusMeta: Record<
  NonNullable<DetailOf<'manage-files'>['operations'][number]['status']>,
  { glyph: StatusGlyphName; tone: AgentTone }
> = {
  pending: { glyph: 'pending', tone: 'neutral' },
  completed: { glyph: 'done', tone: 'success' },
  failed: { glyph: 'failed', tone: 'danger' },
  conflict: { glyph: 'failed', tone: 'warning' },
};

/** ManageFilesDetail (atlas 41): operation table; delete rows carry 「不能自动恢复」 in text. */
export function ManageFilesDetail({ detail, onLoadMore, loadingMore, pageActions, className, ...rest }: ManageFilesDetailProps) {
  const m = useAgentMessages().tools;
  return (
    <div {...rest} className={cx('rl-agent-detail', className)} data-kind="manage-files">
      {detail.materialReady === false && <Notice tone="info">{m.materialPending}</Notice>}
      {detail.counts && <dl className="rl-agent-detail__counts">{Object.entries(detail.counts).map(([kind, count]) => <div key={kind}><dt>{m.manageOp[kind as keyof typeof m.manageOp]}</dt><dd>{count}</dd></div>)}</dl>}
      {detail.page && <ChunkPager page={detail.page} label={m.manageList} canGoBack={false} {...pageActions} />}
      <div className="rl-agent-detail__table-scroll" role="region" tabIndex={0} aria-label={m.codeRegion(m.manageList)}>
        <table className="rl-agent-ops">
          <caption className="rl-agent-sr">{m.manageList}</caption>
          <thead>
            <tr>
              <th scope="col">{m.manageColumns.type}</th>
              <th scope="col">{m.manageColumns.path}</th>
              <th scope="col">{m.manageColumns.status}</th>
            </tr>
          </thead>
          <tbody>
            {detail.operations.map((op) => {
              const danger = op.type === 'delete';
              return (
                <tr key={op.id} data-danger={danger || undefined}>
                  <th scope="row" className="rl-agent-ops__type">
                    {m.manageOp[op.type]}
                  </th>
                  <td className="rl-agent-ops__path">
                    <code>{op.source}</code>
                    {op.target && (
                      <>
                        <span aria-hidden="true"> → </span>
                        <span className="rl-agent-sr"> {m.manageTarget} </span>
                        <code>{op.target}</code>
                      </>
                    )}
                    {(op.recursive || danger || op.reason) && (
                      <span className="rl-agent-ops__notes">
                        {op.recursive && <span>{m.manageRecursive}</span>}
                        {danger && <span className="rl-agent-ops__danger">{m.manageIrreversible}</span>}
                        {op.reason && <span>{op.reason}</span>}
                      </span>
                    )}
                  </td>
                  <td>{op.status && <Pill {...opStatusMeta[op.status]} label={m.manageStatus[op.status]} />}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {detail.hasMore && onLoadMore && (
        <div className="rl-agent-detail__actions">
          <ActionButton icon="arrow-down" onClick={onLoadMore} busy={loadingMore}>
            {m.manageLoadMore}
          </ActionButton>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------------------------
// command

export type RunCommandDetailProps = DetailBase & {
  detail: DetailOf<'command'>;
  onOpenTerminal?: (terminalId: string) => void;
  /** Passed through to the output (display truncation). */
  outputProps?: Pick<ToolOutputProps, 'onLoadMore' | 'onOpenFull' | 'loadingMore' | 'onCopyText'>;
  onCopyText?: (text: string) => void | Promise<void>;
};

const executionMeta: Record<
  NonNullable<DetailOf<'command'>['execution']>,
  { glyph: StatusGlyphName; tone: AgentTone; active?: boolean }
> = {
  pending: { glyph: 'pending', tone: 'neutral', active: true },
  running: { glyph: 'terminal', tone: 'accent', active: true },
  returned: { glyph: 'done', tone: 'neutral' },
  background: { glyph: 'terminal', tone: 'info', active: true },
  'timed-out': { glyph: 'failed', tone: 'warning' },
  'cancel-unconfirmed': { glyph: 'stopping', tone: 'warning', active: true },
};

/** RunCommandDetail (atlas 42): command, cwd, shell, timeout, execution state, exit code, terminal output. */
export function RunCommandDetail({ detail, onOpenTerminal, outputProps, onCopyText, className, ...rest }: RunCommandDetailProps) {
  const m = useAgentMessages().tools;
  const fmt = useAgentFormat();
  const failed = detail.exitCode != null && detail.exitCode !== 0;
  return (
    <div {...rest} className={cx('rl-agent-detail', className)} data-kind="command">
      <div className="rl-agent-command">
        <span className="rl-agent-command__prompt" aria-hidden="true">
          $
        </span>
        <div className="rl-agent-command__scroll" role="region" tabIndex={0} aria-label={m.commandLabel}>
          <code className="rl-agent-command__text">{detail.command}</code>
        </div>
        <CopyButton text={detail.command} label={m.copyCommand} onCopyText={onCopyText} />
      </div>
      <MetaList
        items={[
          detail.cwd && { label: m.commandCwd, value: detail.cwd, mono: true },
          detail.shell && {
            label: m.commandShell,
            value: detail.shell,
            mono: true,
          },
          detail.timeoutMs != null && {
            label: m.commandTimeout,
            value: fmt.duration(detail.timeoutMs),
            mono: true,
          },
        ]}
      />
      <div className="rl-agent-detail__row">
        {detail.execution && <Pill {...executionMeta[detail.execution]} label={m.commandExecution[detail.execution]} />}
        {detail.exitCode != null ? (
          <span className="rl-agent-command__exit" data-failed={failed || undefined}>
            {failed ? m.exitCodeFailed(detail.exitCode) : m.exitCode(detail.exitCode)}
          </span>
        ) : (
          detail.execution &&
          detail.execution !== 'running' &&
          detail.execution !== 'pending' &&
          detail.execution !== 'background' && <span className="rl-agent-command__exit">{m.exitCodeMissing}</span>
        )}
        {detail.terminalId && onOpenTerminal && (
          <ActionButton icon="terminal" onClick={() => onOpenTerminal(detail.terminalId!)}>
            {m.openTerminal}
          </ActionButton>
        )}
      </div>
      {detail.sandboxed === false && <Notice tone="warning">{m.unsandboxed}</Notice>}
      {detail.output && (
        <ToolOutput
          output={{
            ...detail.output,
            kind: detail.output.kind === 'text' ? 'terminal' : detail.output.kind,
          }}
          label={m.commandOutput}
          {...outputProps}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------------------------
// mcp

export type MCPExecuteDetailProps = DetailBase & {
  detail: DetailOf<'mcp'>;
  /** Ask the adapter to reconcile an unknown remote result. Shown only for `remote: 'unknown'`. */
  onReconcile?: () => void;
  outputProps?: Pick<ToolOutputProps, 'onLoadMore' | 'onOpenFull' | 'loadingMore' | 'onCopyText'>;
};

const remoteMeta: Record<NonNullable<DetailOf<'mcp'>['remote']>, { glyph: StatusGlyphName; tone: AgentTone; active?: boolean }> = {
  pending: { glyph: 'pending', tone: 'info', active: true },
  completed: { glyph: 'done', tone: 'success' },
  failed: { glyph: 'failed', tone: 'danger' },
  unknown: { glyph: 'unknown', tone: 'warning' },
};

/** MCPExecuteDetail (atlas 43): server, tool, endpoint, catalog revision, full arguments, remote status. */
export function MCPExecuteDetail({ detail, onReconcile, outputProps, className, ...rest }: MCPExecuteDetailProps) {
  const m = useAgentMessages().tools;
  return (
    <div {...rest} className={cx('rl-agent-detail', className)} data-kind="mcp">
      <MetaList
        items={[
          { label: m.mcpServer, value: detail.server, mono: true },
          { label: m.mcpTool, value: detail.tool, mono: true },
          detail.endpoint && {
            label: m.mcpEndpoint,
            value: detail.endpoint,
            mono: true,
          },
          detail.catalogRevision && {
            label: m.mcpCatalog,
            value: detail.catalogRevision,
            mono: true,
          },
        ]}
      />
      {detail.catalogStale && <Notice tone="warning">{m.mcpCatalogStale}</Notice>}
      {detail.remote === 'unknown' ? (
        <Notice
          tone="warning"
          action={
            onReconcile && (
              <ActionButton icon="retry" onClick={onReconcile}>
                {m.mcpReconcile}
              </ActionButton>
            )
          }
        >
          {m.mcpRemote.unknown}
        </Notice>
      ) : (
        detail.remote && (
          <div className="rl-agent-detail__row">
            <Pill {...remoteMeta[detail.remote]} label={m.mcpRemote[detail.remote]} />
          </div>
        )
      )}
      {detail.arguments !== undefined && (
        <ToolOutput output={{ kind: 'json', content: toDisplayJson(detail.arguments) }} label={m.mcpArguments} />
      )}
      {detail.output && <ToolOutput output={detail.output} {...outputProps} />}
    </div>
  );
}

// ---------------------------------------------------------------------------------------------
// model

export type NativeModelDetailProps = DetailBase & {
  detail: DetailOf<'model'>;
  /** The tool call is still running: show activity without a percentage. */
  running?: boolean;
  /** Save the generated material again (never calls the model again). Shown for partial / failed saves. */
  onRetrySave?: () => void;
  retrying?: boolean;
};

const saveMeta: Record<NonNullable<DetailOf<'model'>['save']>, { glyph: StatusGlyphName; tone: AgentTone; active?: boolean }> = {
  pending: { glyph: 'pending', tone: 'neutral' },
  saving: { glyph: 'saving', tone: 'info', active: true },
  saved: { glyph: 'done', tone: 'success' },
  partial: { glyph: 'unknown', tone: 'warning' },
  failed: { glyph: 'failed', tone: 'danger' },
};

/** NativeModelDetail (atlas 44): provider · model, purpose, inputs, params, results and save state. */
export function NativeModelDetail({ detail, running, onRetrySave, retrying, className, ...rest }: NativeModelDetailProps) {
  const m = useAgentMessages().tools;
  const fmt = useAgentFormat();
  const hintId = React.useId();
  const params = detail.params ? Object.entries(detail.params) : [];
  const canRetry = (detail.save === 'partial' || detail.save === 'failed' || detail.saveRetry === true) && onRetrySave;
  return (
    <div {...rest} className={cx('rl-agent-detail', className)} data-kind="model">
      <MetaList
        items={[
          {
            label: m.modelProvider,
            value: m.modelTitle(detail.provider, detail.model),
            mono: true,
          },
          detail.purpose && { label: m.modelPurpose, value: detail.purpose },
          detail.endpoint && { label: m.mcpEndpoint, value: detail.endpoint, mono: true },
          detail.route && { label: 'Route', value: detail.route, mono: true },
          detail.timeoutMs !== undefined && { label: m.commandTimeout, value: fmt.duration(detail.timeoutMs) },
          detail.sha256 && { label: 'SHA-256', value: detail.sha256, mono: true },
          detail.stopReason && { label: 'Stop reason', value: detail.stopReason },
          detail.remote !== undefined && { label: 'Remote', value: String(detail.remote) },
        ]}
      />
      {detail.arguments !== undefined && <ToolOutput output={{ kind: 'json', content: toDisplayJson(detail.arguments) }} label={m.mcpArguments} />}
      {detail.saveError && <Notice tone="danger">{detail.saveError}</Notice>}
      {running && (
        <p className="rl-agent-detail__activity" role="status">
          <AgentSpark phase="executing" />
          <span>{m.modelRunning}</span>
        </p>
      )}
      {detail.inputs && detail.inputs.length > 0 && (
        <Section title={m.modelInputs}>
          <ul className="rl-agent-detail__list">
            {detail.inputs.map((input) => (
              <li key={input.id}>
                <span className="rl-agent-detail__item-label">{input.label}</span>
                {[
                  input.mimeType,
                  input.size != null ? fmt.bytes(input.size) : undefined,
                  input.destination ? m.modelDestination(input.destination) : undefined,
                ]
                  .filter(Boolean)
                  .map((part, i) => (
                    <span key={i} className="rl-agent-detail__aside">
                      {part}
                    </span>
                  ))}
              </li>
            ))}
          </ul>
        </Section>
      )}
      {params.length > 0 && (
        <Section title={m.modelParams}>
          <MetaList
            items={params.map(([k, v]) => ({
              label: k,
              value: String(v),
              mono: true,
            }))}
          />
        </Section>
      )}
      {detail.results && detail.results.length > 0 && (
        <Section title={m.modelResults}>
          <ul className="rl-agent-detail__results">
            {detail.results.map((r) => (
              <li key={r.id} className="rl-agent-detail__result-item">
                {r.preview && <img className="rl-agent-detail__thumb" src={r.preview} alt={r.alt ?? r.label} />}
                <span className="rl-agent-detail__item-label">{r.label}</span>
                <Pill
                  glyph={r.saved ? 'done' : 'unknown'}
                  tone={r.saved ? 'success' : 'warning'}
                  label={r.saved ? m.modelResultSaved : m.modelResultUnsaved}
                />
              </li>
            ))}
          </ul>
        </Section>
      )}
      {detail.save && (
        <div className="rl-agent-detail__row">
          <Pill {...saveMeta[detail.save]} label={m.modelSave[detail.save]} />
          {canRetry && (
            <>
              <ActionButton icon="retry" onClick={onRetrySave} busy={retrying} describedBy={hintId}>
                {m.modelRetrySave}
              </ActionButton>
              <span id={hintId} className="rl-agent-detail__aside">
                {m.modelRetrySaveHint}
              </span>
            </>
          )}
        </div>
      )}
      {detail.costNotice && <Notice tone="info">{detail.costNotice}</Notice>}
    </div>
  );
}

// ---------------------------------------------------------------------------------------------
// question / agent / generic

export type QuestionToolDetailProps = DetailBase & {
  detail: DetailOf<'question'>;
};

/** QuestionToolDetail: question count and each answer (or 「已跳过」). */
export function QuestionToolDetail({ detail, className, ...rest }: QuestionToolDetailProps) {
  const m = useAgentMessages().tools;
  return (
    <div {...rest} className={cx('rl-agent-detail', className)} data-kind="question">
      <p className="rl-agent-detail__aside">{m.questionCount(detail.count)}</p>
      {detail.answers && detail.answers.length > 0 ? (
        <dl className="rl-agent-detail__answers" aria-label={m.questionAnswers}>
          {detail.answers.map((a, i) => (
            <div key={i} className="rl-agent-detail__answer">
              <dt>{a.question}</dt>
              <dd data-skipped={a.skipped || undefined}>{a.skipped || a.answer == null ? m.questionSkipped : a.answer}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="rl-agent-detail__aside">{m.questionNoAnswers}</p>
      )}
    </div>
  );
}

export type SubagentToolDetailProps = DetailBase & {
  detail: DetailOf<'agent'>;
  onOpenChild?: (childConversationId: string) => void;
};

/** SubagentToolDetail: sub-task name, task and a link to the child conversation. */
export function SubagentToolDetail({ detail, onOpenChild, className, ...rest }: SubagentToolDetailProps) {
  const m = useAgentMessages().tools;
  return (
    <div {...rest} className={cx('rl-agent-detail', className)} data-kind="agent">
      <MetaList items={[{ label: m.agentName, value: detail.agentName }, detail.task && { label: m.agentTask, value: detail.task }]} />
      {detail.childConversationId && onOpenChild && (
        <div className="rl-agent-detail__actions">
          <ActionButton icon="external" onClick={() => onOpenChild(detail.childConversationId!)}>
            {m.openChild}
          </ActionButton>
        </div>
      )}
    </div>
  );
}

export type GenericToolDetailProps = DetailBase & {
  detail: DetailOf<'generic'>;
  outputProps?: Pick<ToolOutputProps, 'onLoadMore' | 'onOpenFull' | 'loadingMore' | 'onCopyText'>;
};

/** GenericToolDetail: any tool without a special view — input JSON + output. */
export function GenericToolDetail({ detail, outputProps, className, ...rest }: GenericToolDetailProps) {
  const m = useAgentMessages().tools;
  return (
    <div {...rest} className={cx('rl-agent-detail', className)} data-kind="generic">
      {detail.input !== undefined && <ToolOutput output={{ kind: 'json', content: toDisplayJson(detail.input) }} label={m.inputLabel} />}
      {detail.output && <ToolOutput output={detail.output} {...outputProps} />}
      {detail.input === undefined && !detail.output && <p className="rl-agent-detail__aside">{m.noDetails}</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------------------------
// dispatcher

/** Callbacks the built-in detail views can emit, keyed by what they act on. */
export interface ToolDetailActions {
  onReadMore?: (tool: ToolCallView, nextOffset: number) => void;
  onReload?: (tool: ToolCallView, path?: string) => void;
  onViewFull?: (tool: ToolCallView, path?: string) => void;
  onLoadMoreOperations?: (tool: ToolCallView) => void;
  onOpenTerminal?: (terminalId: string, tool: ToolCallView) => void;
  onReconcile?: (tool: ToolCallView) => void;
  onRetrySave?: (tool: ToolCallView) => void;
  onOpenChild?: (childConversationId: string, tool: ToolCallView) => void;
  onLoadMoreOutput?: (tool: ToolCallView) => void;
  onOpenFullOutput?: (tool: ToolCallView) => void;
  onCopyText?: (text: string) => void | Promise<void>;
}

export type ToolDetailProps = ToolDetailActions & {
  tool: ToolCallView;
  detail?: ToolDetailView;
};

/** Render the built-in detail view for `detail.kind` (or the generic one). */
export function ToolDetail({ tool, detail = tool.detail, ...actions }: ToolDetailProps) {
  if (!detail) return null;
  const outputProps = {
    onLoadMore: actions.onLoadMoreOutput ? () => actions.onLoadMoreOutput!(tool) : undefined,
    onOpenFull: actions.onOpenFullOutput ? () => actions.onOpenFullOutput!(tool) : undefined,
    onCopyText: actions.onCopyText,
  };
  switch (detail.kind) {
    case 'file-read':
      return <FileReadDetail detail={detail} onReadMore={actions.onReadMore ? (n) => actions.onReadMore!(tool, n) : undefined} />;
    case 'file-write':
      return (
        <FileWriteDetail
          detail={detail}
          onReload={actions.onReload ? () => actions.onReload!(tool, detail.path) : undefined}
          onViewFull={actions.onViewFull ? () => actions.onViewFull!(tool, detail.path) : undefined}
        />
      );
    case 'file-edit':
      return <EditFileDetail detail={detail} />;
    case 'patch':
      return (
        <ApplyPatchDetail
          detail={detail}
          onReload={actions.onReload ? (p) => actions.onReload!(tool, p) : undefined}
          onViewFull={actions.onViewFull ? (p) => actions.onViewFull!(tool, p) : undefined}
        />
      );
    case 'manage-files':
      return (
        <ManageFilesDetail
          detail={detail}
          onLoadMore={actions.onLoadMoreOperations ? () => actions.onLoadMoreOperations!(tool) : undefined}
        />
      );
    case 'command':
      return (
        <RunCommandDetail
          detail={detail}
          onCopyText={actions.onCopyText}
          outputProps={outputProps}
          onOpenTerminal={actions.onOpenTerminal ? (id) => actions.onOpenTerminal!(id, tool) : undefined}
        />
      );
    case 'mcp':
      return (
        <MCPExecuteDetail
          detail={detail}
          outputProps={outputProps}
          onReconcile={actions.onReconcile ? () => actions.onReconcile!(tool) : undefined}
        />
      );
    case 'model':
      return (
        <NativeModelDetail
          detail={detail}
          running={tool.status === 'running' || tool.status === 'queued'}
          onRetrySave={actions.onRetrySave ? () => actions.onRetrySave!(tool) : undefined}
        />
      );
    case 'question':
      return <QuestionToolDetail detail={detail} />;
    case 'agent':
      return <SubagentToolDetail detail={detail} onOpenChild={actions.onOpenChild ? (id) => actions.onOpenChild!(id, tool) : undefined} />;
    case 'generic':
      return <GenericToolDetail detail={detail} outputProps={outputProps} />;
    default:
      // Future variants: never drop them silently.
      return <GenericToolDetail detail={{ kind: 'generic', input: detail }} />;
  }
}
