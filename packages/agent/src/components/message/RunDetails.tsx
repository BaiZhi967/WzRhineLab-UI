'use client';

import * as React from 'react';
import type { Completeness, RunDetailsView, TokenUsageView } from '@wzrhine/agent-core';
import { useAgentFormat, useAgentMessages } from '../../provider/AgentMessages.js';
import type { AgentFormat } from '../../provider/AgentMessages.js';
import type { AgentMessageMessages } from '../../provider/messages/message.js';
import { cx } from '../../utils/cx.js';

/**
 * RunDetails: what actually ran for one turn, as a `<dl>` of labelled rows (`<div>` groups of
 * `<dt>` + `<dd>`). Rows, in order: permission, provider, model, model id (mono), effort, start
 * (`<time>`), elapsed, last activity (`<time>`), chat usage, cache read / write, tool-model usage,
 * compaction tokens, error code (mono), notes.
 *
 * Missing ≠ zero: a field that is `undefined` omits its row; nothing is ever shown as 0 unless
 * the view-model says 0. Elapsed follows `elapsedKind`: `exact` (or absent) → the duration,
 * `lower-bound` → "至少 N", `unknown` (or a lower bound without a value) → "未记录". Usage rows
 * always carry their completeness tag, including "完整统计" for `exact`, so a partial count is
 * never read as the full figure. Tool-model usage adds "N 次调用未返回用量".
 *
 * Static content: no motion, no live region. Name the list from its context (AgentMessage puts
 * it inside the "运行详情" disclosure; standalone, pass `aria-labelledby`).
 */
export type RunDetailsProps = Omit<React.HTMLAttributes<HTMLDListElement>, 'children'> & {
  details: RunDetailsView;
};

type Row = { key: string; label: string; value: React.ReactNode; mono?: boolean };

const isNum = (v: number | undefined): v is number => typeof v === 'number' && Number.isFinite(v);

/** Whether the view-model would render at least one row. */
export function hasRunDetails(details: RunDetailsView | undefined): details is RunDetailsView {
  if (!details) return false;
  return (
    details.permission !== undefined ||
    details.provider !== undefined ||
    details.model !== undefined ||
    details.modelId !== undefined ||
    details.effort !== undefined ||
    details.startedAt !== undefined ||
    isNum(details.elapsedMs) ||
    details.elapsedKind !== undefined ||
    details.lastActivityAt !== undefined ||
    details.usage !== undefined ||
    details.toolModelUsage !== undefined ||
    isNum(details.compactionTokens) ||
    details.errorCode !== undefined ||
    (details.notes?.length ?? 0) > 0
  );
}

function Stamp({ iso, fmt }: { iso: string; fmt: AgentFormat }) {
  return (
    <time className="rl-agent-details__time" dateTime={iso}>
      {fmt.date(iso)} {fmt.time(iso)}
    </time>
  );
}

function Tag({ completeness, t }: { completeness: Completeness; t: AgentMessageMessages }) {
  return (
    <span className="rl-agent-details__tag" data-completeness={completeness}>
      {t.detailsCompleteness[completeness]}
    </span>
  );
}

/** "输入 1.2K / 输出 300 / 合计 1.5K" from the numbers that exist; null when none do. */
function usageNumbers(usage: TokenUsageView, t: AgentMessageMessages, fmt: AgentFormat): React.ReactNode {
  const items = (
    [
      [t.usageInput, usage.input],
      [t.usageOutput, usage.output],
      [t.usageTotal, usage.total],
    ] as Array<[string, number | undefined]>
  ).filter((item): item is [string, number] => isNum(item[1]));
  if (items.length === 0) return null;
  return (
    <span className="rl-agent-details__numbers">
      {items.map(([label, value], i) => (
        <React.Fragment key={label}>
          {i > 0 && (
            <span className="rl-agent-details__sep" aria-hidden="true">
              {' / '}
            </span>
          )}
          <span className="rl-agent-details__number">
            {label} <span className="rl-agent-details__value">{t.detailsTokens(fmt.compact(value))}</span>
          </span>
        </React.Fragment>
      ))}
    </span>
  );
}

function elapsedValue(details: RunDetailsView, t: AgentMessageMessages, fmt: AgentFormat): React.ReactNode | undefined {
  const { elapsedKind: kind, elapsedMs: ms } = details;
  if (kind === 'unknown') return t.detailsNotRecorded;
  if (kind === 'lower-bound') return isNum(ms) ? t.detailsElapsedAtLeast(fmt.duration(ms)) : t.detailsNotRecorded;
  return isNum(ms) ? fmt.duration(ms) : undefined;
}

function buildRows(details: RunDetailsView, t: AgentMessageMessages, fmt: AgentFormat): Row[] {
  const rows: Row[] = [];
  const add = (row: Row | false | undefined) => {
    if (row && row.value !== undefined && row.value !== null) rows.push(row);
  };
  add(details.permission !== undefined && { key: 'permission', label: t.detailsPermission, value: details.permission });
  add(details.provider !== undefined && { key: 'provider', label: t.detailsProvider, value: details.provider });
  add(details.model !== undefined && { key: 'model', label: t.detailsModel, value: details.model });
  add(details.modelId !== undefined && { key: 'model-id', label: t.detailsModelId, value: details.modelId, mono: true });
  add(details.effort !== undefined && { key: 'effort', label: t.detailsEffort, value: details.effort });
  add(details.startedAt !== undefined && { key: 'started', label: t.detailsStartedAt, value: <Stamp iso={details.startedAt} fmt={fmt} /> });
  add({ key: 'elapsed', label: t.detailsElapsed, value: elapsedValue(details, t, fmt) });
  add(details.lastActivityAt !== undefined && { key: 'last-activity', label: t.detailsLastActivity, value: <Stamp iso={details.lastActivityAt} fmt={fmt} /> });

  const usage = details.usage;
  if (usage) {
    add({
      key: 'usage',
      label: t.detailsChatUsage,
      value: (
        <>
          {usageNumbers(usage, t, fmt)}
          <Tag completeness={usage.completeness} t={t} />
          {usage.note && <span className="rl-agent-details__note">{usage.note}</span>}
        </>
      ),
    });
    const cache = (
      [
        [t.detailsCacheRead, usage.cacheRead],
        [t.detailsCacheWrite, usage.cacheWrite],
      ] as Array<[string, number | undefined]>
    ).filter((item): item is [string, number] => isNum(item[1]));
    add(
      cache.length > 0 && {
        key: 'cache',
        label: t.detailsCache,
        value: (
          <span className="rl-agent-details__numbers">
            {cache.map(([label, value], i) => (
              <React.Fragment key={label}>
                {i > 0 && (
                  <span className="rl-agent-details__sep" aria-hidden="true">
                    {' / '}
                  </span>
                )}
                <span className="rl-agent-details__number">
                  {label} <span className="rl-agent-details__value">{t.detailsTokens(fmt.compact(value))}</span>
                </span>
              </React.Fragment>
            ))}
          </span>
        ),
      },
    );
  }

  const tool = details.toolModelUsage;
  if (tool) {
    const unreported = isNum(tool.unreportedCalls) && tool.unreportedCalls > 0 ? tool.unreportedCalls : undefined;
    add({
      key: 'tool-usage',
      label: t.detailsToolModelUsage,
      value: (
        <>
          {usageNumbers(tool, t, fmt)}
          <Tag completeness={tool.completeness} t={t} />
          {unreported !== undefined && <span className="rl-agent-details__unreported">{t.detailsUnreportedCalls(unreported)}</span>}
          {tool.note && <span className="rl-agent-details__note">{tool.note}</span>}
        </>
      ),
    });
  }

  add(
    isNum(details.compactionTokens) && {
      key: 'compaction',
      label: t.detailsCompaction,
      value: <span className="rl-agent-details__value">{t.detailsTokens(fmt.compact(details.compactionTokens))}</span>,
    },
  );
  add(details.errorCode !== undefined && { key: 'error-code', label: t.detailsErrorCode, value: details.errorCode, mono: true });
  const notes = details.notes?.filter((note) => note.trim() !== '') ?? [];
  add(
    notes.length > 0 && {
      key: 'notes',
      label: t.detailsNotes,
      value: (
        <ul className="rl-agent-details__notes">
          {notes.map((note, i) => (
            <li key={i}>{note}</li>
          ))}
        </ul>
      ),
    },
  );
  return rows;
}

export const RunDetails = React.forwardRef<HTMLDListElement, RunDetailsProps>(function RunDetails({ details, className, ...rest }, ref) {
  const t = useAgentMessages().message;
  const fmt = useAgentFormat();
  const rows = buildRows(details, t, fmt);
  if (rows.length === 0) return null;
  return (
    <dl {...rest} ref={ref} className={cx('rl-agent-details', className)}>
      {rows.map((row) => (
        <div key={row.key} className="rl-agent-details__row" data-row={row.key}>
          <dt className="rl-agent-details__label">{row.label}</dt>
          <dd className="rl-agent-details__data" data-mono={row.mono || undefined}>
            {row.value}
          </dd>
        </div>
      ))}
    </dl>
  );
});
