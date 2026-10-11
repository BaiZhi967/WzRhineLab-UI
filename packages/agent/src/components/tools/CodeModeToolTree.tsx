'use client';

import * as React from 'react';
import type { ToolCallView, ToolStatus } from '@wzrhine/agent-core';
import { buildTree } from '@wzrhine/agent-core';
import { Collapsible } from '@wzrhine/react';
import { useAgentMessages } from '../../provider/AgentMessages.js';
import { cx } from '../../utils/cx.js';
import { ToolRecord } from './ToolRecord.js';
import type { ToolRowSharedProps } from './ToolActivity.js';
import { orderTools } from './ToolActivity.js';
import { ACTIVE_TOOL_STATUSES, ActionButton, CodeView, FAILED_TOOL_STATUSES, Notice } from './shared.js';

/**
 * Outcome of a parent from its direct children only. Each child keeps its own status; the
 * parent's own status is never used to paint the children.
 */
export function childOutcome(children: readonly Pick<ToolCallView, 'status'>[]): {
  kind: 'empty' | 'running' | 'done' | 'partial' | 'failed' | 'unknown';
  failed: number;
  running: number;
  unknown: number;
  total: number;
} {
  const total = children.length;
  const failed = children.filter((c) => FAILED_TOOL_STATUSES.includes(c.status)).length;
  const running = children.filter((c) => ACTIVE_TOOL_STATUSES.includes(c.status)).length;
  const unknown = children.filter((c) => c.status === 'unknown' || c.status === 'partial').length;
  const done = children.filter((c) => c.status === 'completed').length;
  let kind: ReturnType<typeof childOutcome>['kind'];
  if (total === 0) kind = 'empty';
  else if (running > 0) kind = 'running';
  else if (failed === total) kind = 'failed';
  else if (failed > 0) kind = 'partial';
  else if (unknown > 0) kind = 'unknown';
  else if (done === total) kind = 'done';
  else kind = 'partial';
  return { kind, failed, running, unknown, total };
}

/**
 * ScriptDisclosure: 「查看脚本」 for a Code Mode parent. The script mounts on open, scrolls inside
 * its own region and states when it is truncated (`onOpenFull` only when given).
 */
export function ScriptDisclosure({
  script,
  onOpenFull,
  defaultOpen,
}: {
  script: NonNullable<ToolCallView['script']>;
  onOpenFull?: () => void;
  defaultOpen?: boolean;
}) {
  const m = useAgentMessages().tools;
  return (
    <Collapsible
      className="rl-agent-script"
      defaultOpen={defaultOpen}
      trigger={<span>{m.viewScript}</span>}
      triggerProps={{ className: 'rl-agent-script__trigger' }}
    >
      <CodeView code={script.source} label={m.scriptLabel(script.language)} startLine={1} />
      {script.truncated && (
        <Notice
          tone="info"
          action={
            onOpenFull && (
              <ActionButton icon="external" onClick={onOpenFull}>
                {m.openFullScript}
              </ActionButton>
            )
          }
        >
          {m.scriptTruncated}
        </Notice>
      )}
    </Collapsible>
  );
}

function Outcome({ children }: { children: readonly ToolCallView[] }) {
  const m = useAgentMessages().tools;
  const o = childOutcome(children);
  const text =
    o.kind === 'empty'
      ? m.outcomeEmpty
      : o.kind === 'running'
        ? m.outcomeRunning(o.running, o.total)
        : o.kind === 'failed'
          ? m.outcomeAllFailed(o.total)
          : o.kind === 'partial'
            ? m.outcomePartial(o.failed)
            : o.kind === 'unknown'
              ? m.outcomeUnknown(o.unknown)
              : m.outcomeAllDone(o.total);
  const tone =
    o.kind === 'failed' ? 'danger' : o.kind === 'partial' || o.kind === 'unknown' ? 'warning' : o.kind === 'done' ? 'success' : 'neutral';
  return (
    <p className="rl-agent-tree__outcome" data-tone={tone} data-outcome={o.kind}>
      {text}
    </p>
  );
}

/**
 * CodeModeToolTree (atlas 13): a Code Mode / script parent and the calls it spawned. Nested
 * `<ul>` lists carry the hierarchy (each list is named 「X 的子操作」), CSS borders draw the
 * connectors. Every node is a full ToolRecord with its own status — never merged with the parent
 * — and the outcome line is computed from the direct children (「部分完成：1 个子操作失败」).
 * Recursion handles any depth.
 *
 * Pass `root` (with `children`) or a flat `tools` list with `parentId` (built with `buildTree`;
 * every root found is rendered). Expanded rows: uncontrolled, or `expandedIds` /
 * `onExpandedChange`. Rows appear without entrance motion (deep trees would re-flow); disclosure
 * height comes from Collapsible.
 */
export type CodeModeToolTreeProps = Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> &
  ToolRowSharedProps & {
    root?: ToolCallView;
    tools?: readonly ToolCallView[];
    expandedIds?: readonly string[];
    defaultExpandedIds?: readonly string[];
    onExpandedChange?: (ids: string[]) => void;
    /** Replace a node's row. Return `undefined` to use ToolRecord. */
    renderTool?: (tool: ToolCallView, depth: number) => React.ReactNode | undefined;
    /** Open the full script of a truncated parent. */
    onViewScript?: (tool: ToolCallView) => void;
    /** Tree name; defaults to the root's display name. */
    label?: string;
  };

type TreeNode = ToolCallView & { children?: ToolCallView[] };

export const CodeModeToolTree = React.forwardRef<HTMLDivElement, CodeModeToolTreeProps>(function CodeModeToolTree(
  {
    root,
    tools,
    expandedIds,
    defaultExpandedIds,
    onExpandedChange,
    renderTool,
    onViewScript,
    label,
    onLoadDetails,
    renderDetail,
    detailActions,
    detailsErrors,
    className,
    ...rest
  },
  ref,
) {
  const m = useAgentMessages().tools;
  const roots: TreeNode[] = React.useMemo(() => {
    if (root) return [root];
    if (!tools) return [];
    const flat = tools.flatMap(function flatten(t: ToolCallView): ToolCallView[] {
      return [t, ...(t.children ?? []).flatMap(flatten)];
    });
    // `buildTree` needs plain items; nested children are re-derived from parentId.
    return buildTree(flat.map(({ children: _children, ...t }) => t));
  }, [root, tools]);

  const [inner, setInner] = React.useState<string[]>(() => [...(defaultExpandedIds ?? [])]);
  const open = expandedIds ?? inner;
  const toggle = (id: string, next: boolean) => {
    const list = next ? [...open.filter((x) => x !== id), id] : open.filter((x) => x !== id);
    if (expandedIds === undefined) setInner(list);
    onExpandedChange?.(list);
  };

  const renderNode = (node: TreeNode, depth: number): React.ReactNode => {
    const children = orderTools(node.children ?? []);
    const name = node.displayName ?? node.name;
    const custom = renderTool?.(node, depth);
    const isParent = children.length > 0 || node.script != null;
    return (
      <li key={node.id} className="rl-agent-tree__node" data-depth={depth}>
        {custom !== undefined ? (
          custom
        ) : (
          <ToolRecord
            tool={node}
            expanded={open.includes(node.id)}
            onExpandedChange={(next) => toggle(node.id, next)}
            onLoadDetails={onLoadDetails}
            detailsError={detailsErrors?.[node.id]}
            renderDetail={renderDetail}
            detailActions={detailActions}
          />
        )}
        {isParent && (
          <div className="rl-agent-tree__parent-meta">
            {node.script && <ScriptDisclosure script={node.script} onOpenFull={onViewScript ? () => onViewScript(node) : undefined} />}
            {children.length > 0 && <Outcome>{children}</Outcome>}
          </div>
        )}
        {children.length > 0 && (
          <ul className="rl-agent-tree__children" aria-label={m.childList(name)}>
            {children.map((child) => renderNode(child as TreeNode, depth + 1))}
          </ul>
        )}
      </li>
    );
  };

  const treeLabel = label ?? (roots[0] ? (roots[0].displayName ?? roots[0].name) : undefined);
  return (
    <div {...rest} ref={ref} className={cx('rl-agent-tree', className)}>
      <ul className="rl-agent-tree__root" aria-label={treeLabel}>
        {roots.map((node) => renderNode(node, 0))}
      </ul>
      {roots.some((r) => (r.children?.length ?? 0) > 0 && isSettled(r.status)) && <p className="rl-agent-tree__note">{m.parentNotice}</p>}
    </div>
  );
});

function isSettled(status: ToolStatus) {
  return !ACTIVE_TOOL_STATUSES.includes(status);
}
