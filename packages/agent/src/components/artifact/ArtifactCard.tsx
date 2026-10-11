'use client';

import * as React from 'react';
import { Button, IconButton, Spinner } from '@wzrhine/react';
import type { AgentTone, ArtifactKind, ArtifactView, StatusGlyphName } from '@wzrhine/agent-core';
import { useAgentFormat } from '../../provider/AgentMessages.js';
import { AgentEntrance } from '../../motion/agent-motion.js';
import { StatusGlyph } from '../../primitives/StatusGlyph.js';
import { AgentIcon } from '../../primitives/icons.js';
import type { AgentIconName } from '../../primitives/icons.js';
import { cx } from '../../utils/cx.js';
import { Heading, useIsNewId, useWorkspaceMessages } from '../workspace/shared.js';
import type { HeadingLevel, WorkspaceMessagesProp } from '../workspace/shared.js';

export const artifactKindIcon: Record<ArtifactKind, AgentIconName> = {
  text: 'file',
  markdown: 'file',
  code: 'code',
  image: 'image',
  file: 'file',
  diff: 'layers',
  data: 'database',
  unknown: 'file',
};

const statusGlyph: Record<ArtifactView['status'], { glyph: StatusGlyphName; tone: AgentTone }> = {
  generating: { glyph: 'pending', tone: 'info' },
  partial: { glyph: 'unknown', tone: 'warning' },
  saved: { glyph: 'done', tone: 'success' },
  failed: { glyph: 'failed', tone: 'danger' },
  unavailable: { glyph: 'stopped', tone: 'neutral' },
  stale: { glyph: 'unknown', tone: 'warning' },
};

/** Only same-origin / data / blob thumbnails are drawn; anything else falls back to the kind icon. */
function isSafeThumbnail(src: string): boolean {
  return /^(data:image\/|blob:|\/|\.\/)/.test(src);
}

export type ArtifactCardProps = Omit<React.HTMLAttributes<HTMLElement>, 'children'> & {
  artifact: ArtifactView;
  onOpen?: (artifact: ArtifactView) => void;
  onDownload?: (artifact: ArtifactView) => void;
  /** Shows the file in its folder (host file manager). */
  onReveal?: (artifact: ArtifactView) => void;
  /** Retries a failed artifact. */
  onRetry?: (artifact: ArtifactView) => void;
  /** Custom preview (chart, rendered markdown…); default: image thumbnail, text excerpt or kind icon. */
  renderPreview?: (artifact: ArtifactView) => React.ReactNode;
  headingLevel?: HeadingLevel;
  messages?: WorkspaceMessagesProp;
};

/**
 * ArtifactCard (atlas 29): one generated file / report / image. 「已保存」 appears only for
 * `status: 'saved'`; `generating` shows a Spinner without a percentage; `partial` and `failed`
 * keep their reason as visible text. Actions render only with their callbacks; deleted or
 * unavailable artifacts cannot be opened or downloaded.
 *
 * Accessibility: an `<article>` named by its title heading; image previews need `alt` (falls
 * back to an empty alt plus the visible title, so nothing is read twice). Motion: none here;
 * `ArtifactList` gives new items one AgentEntrance.
 */
export const ArtifactCard = React.forwardRef<HTMLElement, ArtifactCardProps>(function ArtifactCard(
  { artifact, onOpen, onDownload, onReveal, onRetry, renderPreview, headingLevel = 3, messages: override, className, ...rest },
  ref,
) {
  const m = useWorkspaceMessages(override);
  const format = useAgentFormat();
  const id = React.useId();
  const titleId = `${id}-title`;
  const reasonId = `${id}-reason`;
  const glyph = statusGlyph[artifact.status];
  const gone = artifact.status === 'unavailable' || artifact.change === 'deleted';
  const busy = artifact.status === 'generating';

  const preview = renderPreview ? (
    renderPreview(artifact)
  ) : artifact.kind === 'image' && artifact.preview && isSafeThumbnail(artifact.preview) ? (
    <img className="rl-agent-artifact__thumb" src={artifact.preview} alt={artifact.alt ?? ''} loading="lazy" />
  ) : artifact.preview && artifact.kind !== 'image' ? (
    <span className="rl-agent-artifact__excerpt" aria-hidden="true">
      {artifact.preview}
    </span>
  ) : (
    <AgentIcon name={artifactKindIcon[artifact.kind]} className="rl-agent-artifact__kind-icon" />
  );

  return (
    <article
      {...rest}
      ref={ref}
      className={cx('rl-agent-artifact', className)}
      aria-labelledby={titleId}
      aria-describedby={artifact.reason ? reasonId : undefined}
      aria-busy={busy || undefined}
      data-status={artifact.status}
      data-kind={artifact.kind}
    >
      <div className="rl-agent-artifact__preview">{preview}</div>
      <div className="rl-agent-artifact__body">
        <Heading level={headingLevel} id={titleId} className="rl-agent-artifact__title" title={artifact.path ?? artifact.title}>
          {artifact.title}
        </Heading>
        <p className="rl-agent-artifact__meta">
          <span>{m.artifactKind[artifact.kind]}</span>
          {artifact.size !== undefined && <span>{format.bytes(artifact.size)}</span>}
          {artifact.version && <span>{m.artifactVersion(artifact.version)}</span>}
          {artifact.change && (
            <span className="rl-agent-artifact__change" data-change={artifact.change}>
              {m.artifactChange[artifact.change]}
            </span>
          )}
        </p>
        <p className="rl-agent-artifact__status" data-tone={glyph.tone}>
          {busy ? <Spinner size="sm" /> : <StatusGlyph name={glyph.glyph} tone={glyph.tone} />}
          <span>{m.artifactStatus[artifact.status]}</span>
        </p>
        {artifact.reason && (
          <p id={reasonId} className="rl-agent-artifact__reason">
            {artifact.reason}
          </p>
        )}
      </div>
      {(onOpen || onDownload || onReveal || (onRetry && artifact.status === 'failed')) && (
        <div className="rl-agent-artifact__actions">
          {artifact.status === 'failed' && onRetry && (
            <Button size="sm" variant="secondary" iconStart={<AgentIcon name="retry" />} aria-label={m.artifactRetryNamed(artifact.title)} onClick={() => onRetry(artifact)}>
              {m.artifactRetry}
            </Button>
          )}
          {onOpen && !gone && artifact.status !== 'failed' && (
            <Button size="sm" variant="secondary" aria-label={m.artifactOpenNamed(artifact.title)} onClick={() => onOpen(artifact)}>
              {m.artifactOpen}
            </Button>
          )}
          {onDownload && !gone && !busy && artifact.status !== 'failed' && (
            <IconButton size="sm" variant="ghost" icon={<AgentIcon name="download" />} label={m.artifactDownload(artifact.title)} onClick={() => onDownload(artifact)} />
          )}
          {onReveal && !gone && artifact.path && (
            <IconButton size="sm" variant="ghost" icon={<AgentIcon name="folder" />} label={m.artifactReveal(artifact.title)} onClick={() => onReveal(artifact)} />
          )}
        </div>
      )}
    </article>
  );
});

export type ArtifactListProps = Omit<React.HTMLAttributes<HTMLUListElement>, 'children'> &
  Pick<ArtifactCardProps, 'onOpen' | 'onDownload' | 'onReveal' | 'onRetry' | 'renderPreview' | 'headingLevel' | 'messages'> & {
    artifacts: ArtifactView[];
  };

/**
 * Artifacts as a list (`<ul>`). Duplicate ids are dropped; items present on first render are
 * static, items added later enter once (AgentEntrance `row`, reduced → no movement).
 */
export function ArtifactList({ artifacts, onOpen, onDownload, onReveal, onRetry, renderPreview, headingLevel, messages: override, className, ...rest }: ArtifactListProps) {
  const m = useWorkspaceMessages(override);
  const unique = React.useMemo(() => {
    const seen = new Set<string>();
    return artifacts.filter((a) => (seen.has(a.id) ? false : (seen.add(a.id), true)));
  }, [artifacts]);
  const isNew = useIsNewId(unique.map((a) => a.id));
  if (unique.length === 0) return <p className="rl-agent-artifact-list__empty">{m.artifactEmpty}</p>;
  return (
    <ul {...rest} className={cx('rl-agent-artifact-list', className)} aria-label={rest['aria-label'] ?? m.artifactList}>
      {unique.map((artifact) => (
        <AgentEntrance as="li" key={artifact.id} kind="row" animate={isNew(artifact.id)} className="rl-agent-artifact-list__item">
          <ArtifactCard
            artifact={artifact}
            onOpen={onOpen}
            onDownload={onDownload}
            onReveal={onReveal}
            onRetry={onRetry}
            renderPreview={renderPreview}
            headingLevel={headingLevel}
            messages={override}
          />
        </AgentEntrance>
      ))}
    </ul>
  );
}
