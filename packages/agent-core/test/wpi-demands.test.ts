import { describe, expect, it } from 'vitest';
import {
  encodeToken,
  pathCrumbs,
  reconcileTokens,
  type ContextUsageView,
  type FileDiffView,
  type TerminalView,
  type ToolCallView,
  type ToolDetailView,
} from '../src/index.js';

describe('Wpi adoption contracts', () => {
  it('accepts xhigh effort and reconciles token bindings with spaces', () => {
    const token = encodeToken('@', 'Research Skill');
    expect(reconcileTokens(`${token} tail`, [{ trigger: '@', name: 'Research Skill', id: 'skill-1' }])).toEqual([
      { trigger: '@', name: 'Research Skill', id: 'skill-1' },
    ]);
    const effort: import('../src/index.js').ModelEffort = 'xhigh';
    expect(effort).toBe('xhigh');
  });

  it('treats relative paths as workspace-root crumbs', () => {
    expect(pathCrumbs('src/index.ts')).toEqual(['src', 'index.ts']);
    expect(pathCrumbs('C:/workspace/src/index.ts', 'C:/workspace')).toEqual(['workspace', 'src', 'index.ts']);
  });

  it('exposes the material and runtime facts needed by Wpi', () => {
    const diff: FileDiffView = {
      path: 'src/a.ts', change: 'update', hunks: [], statsReliable: false, created: false, observedBytes: 12,
      before: { offset: 0, length: 2, unit: 'lines', complete: true, status: 'ready' },
    };
    const details: ToolDetailView = {
      kind: 'file-edit', path: 'src/a.ts', edits: [], replacementCount: 2, complete: false,
      page: { offset: 0, length: 1, unit: 'lines', complete: false, status: 'ready' },
    };
    const patch: ToolDetailView = {
      kind: 'patch', files: [diff], hunksAvailable: false, baseVersion: 'v1',
      raw: { offset: 0, length: 10, unit: 'bytes', complete: true, status: 'ready' },
    };
    const model: ToolDetailView = {
      kind: 'model', provider: 'local', model: 'm', endpoint: 'http://model', route: '/v1', timeoutMs: 1000,
      sha256: 'hash', arguments: { prompt: 'x' }, remote: true, stopReason: 'end', saveRetry: true, saveError: 'failed',
    };
    const tool: ToolCallView = { id: 't', name: 'x', status: 'failed', failure: { code: 'E', message: 'no', retryable: true } };
    const terminal: TerminalView = { id: 'term', name: 'Terminal', status: 'running', source: 'agent', stopReason: 'user', activity: 'busy', tail: 'out' };
    const usage: ContextUsageView = { unit: 'tokens', completeness: 'estimated', estimated: true };
    expect([details, patch, model, tool, terminal, usage]).toHaveLength(6);
  });
});
