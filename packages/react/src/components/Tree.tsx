'use client';

import * as React from 'react';
import { cx } from '../utils/cx.js';
import { useRhineMessages } from '../provider/messages.js';
import { Icon } from './Icon.js';

export interface TreeNode {
  id: string;
  label: React.ReactNode;
  textValue?: string;
  children?: TreeNode[];
  loading?: boolean;
  error?: React.ReactNode;
  disabled?: boolean;
  hasChildren?: boolean;
}
export type TreeProps = Omit<React.HTMLAttributes<HTMLDivElement>, 'children' | 'onSelect'> & {
  label: string;
  nodes: readonly TreeNode[];
  selectedId?: string;
  defaultSelectedId?: string;
  onSelect?: (node: TreeNode) => void;
  expandedIds?: readonly string[];
  defaultExpandedIds?: readonly string[];
  onExpandedChange?: (ids: string[]) => void;
  onToggle?: (node: TreeNode, expanded: boolean) => void;
  onLoadChildren?: (node: TreeNode) => void | Promise<void>;
  onRetry?: (node: TreeNode) => void | Promise<void>;
  empty?: React.ReactNode;
  renderActions?: (node: TreeNode) => React.ReactNode;
};

export function Tree({ label, nodes, selectedId, defaultSelectedId, onSelect, expandedIds, defaultExpandedIds = [], onExpandedChange, onToggle, onLoadChildren, onRetry, empty, renderActions, className, onKeyDown, ...rest }: TreeProps) {
  const m = useRhineMessages().tree;
  const uid = React.useId();
  const rootRef = React.useRef<HTMLDivElement>(null);
  const [selected, setSelected] = React.useState(defaultSelectedId);
  const [innerExpanded, setExpanded] = React.useState<string[]>([...defaultExpandedIds]);
  const [focused, setFocused] = React.useState<string | undefined>(selectedId ?? defaultSelectedId ?? nodes[0]?.id);
  const requested = React.useRef(new Set<string>());
  const expanded = new Set(expandedIds ?? innerExpanded);
  const active = selectedId ?? selected;
  const flat: Array<{ node: TreeNode; parent?: string }> = [];
  const visited = new Set<string>();
  const walk = (list: readonly TreeNode[], parent?: string) => list.forEach((node) => {
    if (visited.has(node.id)) return;
    visited.add(node.id);
    flat.push({ node, parent });
    if (expanded.has(node.id) && node.children) walk(node.children, node.id);
  });
  walk(nodes);
  React.useEffect(() => {
    if (!onLoadChildren) return;
    for (const { node } of flat) {
      if (expanded.has(node.id) && node.hasChildren && node.children === undefined && !node.loading && !node.error && !requested.current.has(node.id)) {
        requested.current.add(node.id);
        void onLoadChildren(node);
      }
    }
  }, [expandedIds, innerExpanded, nodes, onLoadChildren]);
  React.useEffect(() => {
    if (selectedId !== undefined) setFocused(selectedId);
  }, [selectedId]);
  const focus = (id: string | undefined) => {
    if (!id) return;
    setFocused(id);
    rootRef.current?.querySelectorAll<HTMLElement>('[role="treeitem"]').forEach((el) => { if (el.dataset.treeId === id) el.focus(); });
  };
  const select = (node: TreeNode) => {
    if (node.disabled) return;
    if (selectedId === undefined) setSelected(node.id);
    onSelect?.(node);
  };
  const toggle = (node: TreeNode, open = !expanded.has(node.id)) => {
    if (node.disabled || (!node.hasChildren && !node.children?.length)) return;
    const ids = open ? [...expanded, node.id] : [...expanded].filter((id) => id !== node.id);
    if (expandedIds === undefined) setExpanded(ids);
    onExpandedChange?.(ids);
    onToggle?.(node, open);
    if (open && node.hasChildren && node.children === undefined && !node.loading && !node.error && !requested.current.has(node.id)) {
      requested.current.add(node.id);
      void onLoadChildren?.(node);
    }
  };
  const typeahead = React.useRef({ value: '', at: 0 });
  const keyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(event);
    if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
    const element = event.target as HTMLElement;
    if (element.getAttribute('role') !== 'treeitem') return;
    const index = flat.findIndex(({ node }) => node.id === element.dataset.treeId);
    const current = flat[index];
    if (!current) return;
    const { node, parent } = current;
    let next: string | undefined;
    if (event.key === 'ArrowDown') next = flat[Math.min(index + 1, flat.length - 1)]?.node.id;
    else if (event.key === 'ArrowUp') next = flat[Math.max(index - 1, 0)]?.node.id;
    else if (event.key === 'Home') next = flat[0]?.node.id;
    else if (event.key === 'End') next = flat.at(-1)?.node.id;
    else if (event.key === 'ArrowRight') { if (expanded.has(node.id)) next = node.children?.[0]?.id; else toggle(node, true); }
    else if (event.key === 'ArrowLeft') { if (expanded.has(node.id)) toggle(node, false); else next = parent; }
    else if (event.key === 'Enter' || event.key === ' ') select(node);
    else if (event.key.length === 1 && !event.nativeEvent.isComposing) {
      const now = Date.now();
      const query = now - typeahead.current.at < 600 ? typeahead.current.value + event.key : event.key;
      typeahead.current = { value: query, at: now };
      const reordered = [...flat.slice(index + 1), ...flat.slice(0, index + 1)];
      next = reordered.find(({ node: candidate }) => !candidate.disabled && (candidate.textValue ?? String(candidate.label)).toLocaleLowerCase().startsWith(query.toLocaleLowerCase()))?.node.id;
    } else return;
    event.preventDefault();
    if (next) focus(next);
  };
  const tabStop = flat.some(({ node }) => node.id === focused) ? focused : flat[0]?.node.id;
  const renderNodes = (list: readonly TreeNode[], depth = 1): React.ReactNode => list.map((node, index) => {
    const open = expanded.has(node.id);
    const branch = Boolean(node.hasChildren || node.children?.length);
    const name = node.textValue ?? String(node.label);
    const labelId = `${uid}-${node.id}-label`;
    return <li key={node.id} role="treeitem" data-tree-id={node.id} aria-level={depth} aria-posinset={index + 1} aria-setsize={list.length} aria-selected={active === node.id} aria-labelledby={labelId} aria-expanded={branch ? open : undefined} aria-disabled={node.disabled || undefined} tabIndex={tabStop === node.id ? 0 : -1} className="rl-tree__item" onFocus={(event) => { if (event.target === event.currentTarget) setFocused(node.id); }}>
      <div className="rl-tree__row" data-selected={active === node.id || undefined}>
        {branch && <button type="button" className="rl-tree__toggle" tabIndex={-1} disabled={node.disabled} aria-label={open ? m.collapse(name) : m.expand(name)} onClick={() => { focus(node.id); toggle(node); }}><Icon name={open ? 'ChevronDown' : 'ChevronRight'} /></button>}
        <button type="button" className="rl-tree__select" tabIndex={-1} disabled={node.disabled} onClick={() => { focus(node.id); select(node); }}><span id={labelId} className="rl-tree__label">{node.label}</span></button>
        {renderActions?.(node)}
      </div>
      {open && <>
        {node.loading && <p role="status" className="rl-tree__note">{m.loading}</p>}
        {node.error && <div className="rl-tree__note"><p role="alert">{node.error}</p>{(onRetry || onLoadChildren) && <button type="button" onClick={() => (onRetry ?? onLoadChildren)?.(node)}>{m.retry(name)}</button>}</div>}
        {node.children?.length ? <ul role="group">{renderNodes(node.children, depth + 1)}</ul> : null}
      </>}
    </li>;
  });
  return <div {...rest} ref={rootRef} className={cx('rl-tree', className)} onKeyDown={keyDown}><ul role="tree" aria-label={label} className="rl-tree__root">{renderNodes(nodes)}</ul>{nodes.length === 0 && <p>{empty ?? m.empty}</p>}</div>;
}
