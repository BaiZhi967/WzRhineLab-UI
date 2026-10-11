import * as React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { FileDiffView, ToolCallView } from '@wzrhine/agent-core';
import {
  ApplyPatchDetail,
  DiffPreview,
  EditFileDetail,
  FileReadDetail,
  FileWriteDetail,
  GenericToolDetail,
  MCPExecuteDetail,
  ManageFilesDetail,
  MultiFileDiff,
  NativeModelDetail,
  QuestionToolDetail,
  RunCommandDetail,
  SubagentToolDetail,
  ToolDetail,
  ToolOutput,
} from '../src/index';

const diff: FileDiffView = {
  path: 'src/config.py',
  change: 'update',
  status: 'proposed',
  hunks: [
    {
      id: 'h0',
      header: '@@ -1,2 +1,2 @@',
      lines: [
        { kind: 'context', text: 'import os', oldLine: 1, newLine: 1 },
        { kind: 'remove', text: 'debug = True', oldLine: 2 },
        { kind: 'add', text: 'debug = False', newLine: 2 },
      ],
    },
  ],
};

describe('ToolOutput', () => {
  it('text output is a focusable named scroll region with copy', async () => {
    const user = userEvent.setup();
    const onCopyText = vi.fn();
    render(<ToolOutput output={{ kind: 'text', content: 'hello', summary: '1 行' }} onCopyText={onCopyText} />);
    const region = screen.getByRole('region', { name: '文本' });
    expect(region).toHaveAttribute('tabindex', '0');
    expect(region).toHaveTextContent('hello');
    await user.click(screen.getByRole('button', { name: '复制' }));
    expect(onCopyText).toHaveBeenCalledWith('hello');
    expect(await screen.findByText('已复制', { selector: '[role="status"]' })).toBeInTheDocument();
  });

  it('json is pretty-printed when it parses, raw otherwise', () => {
    const { rerender } = render(<ToolOutput output={{ kind: 'json', content: '{"a":1}' }} />);
    expect(screen.getByRole('region', { name: 'JSON' }).textContent).toBe('{\n  "a": 1\n}');
    rerender(<ToolOutput output={{ kind: 'json', content: '{not json' }} />);
    expect(screen.getByRole('region', { name: 'JSON' }).textContent).toBe('{not json');
  });

  it('list renders a ul; empty, unavailable and loading states', () => {
    const { rerender } = render(<ToolOutput output={{ kind: 'list', content: 'a\nb\n\nc' }} />);
    expect(within(screen.getByRole('region')).getAllByRole('listitem')).toHaveLength(3);
    rerender(<ToolOutput output={{ kind: 'empty' }} />);
    expect(screen.getByText('无输出')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '复制' })).toBeNull();
    rerender(<ToolOutput output={{ kind: 'text', status: 'unavailable' }} />);
    expect(screen.getByText('输出不可用')).toBeInTheDocument();
    rerender(<ToolOutput output={{ kind: 'text', status: 'loading' }} />);
    expect(screen.getByText('正在读取输出…').closest('[aria-busy="true"]')).not.toBeNull();
  });

  it('display vs execution truncation are distinct; buttons only with callbacks', async () => {
    const user = userEvent.setup();
    const more = vi.fn();
    const { rerender } = render(<ToolOutput output={{ kind: 'terminal', content: 'x', truncated: 'display' }} />);
    expect(screen.getByText('仅显示部分输出，完整内容可继续加载')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '加载更多' })).toBeNull();
    rerender(<ToolOutput output={{ kind: 'terminal', content: 'x', truncated: 'display' }} onLoadMore={more} onOpenFull={() => {}} />);
    await user.click(screen.getByRole('button', { name: '加载更多' }));
    expect(more).toHaveBeenCalled();
    expect(screen.getByRole('button', { name: '查看完整输出' })).toBeInTheDocument();
    expect(screen.queryByText('工具输出已达上限，结果本身被截断')).toBeNull();
    rerender(<ToolOutput output={{ kind: 'terminal', content: 'x', truncated: 'execution' }} onLoadMore={more} />);
    expect(screen.getByText('工具输出已达上限，结果本身被截断')).toBeInTheDocument();
    expect(screen.queryByText('仅显示部分输出，完整内容可继续加载')).toBeNull();
    expect(screen.queryByRole('button', { name: '加载更多' })).toBeNull();
  });

  it('error kind shows the error text', () => {
    render(<ToolOutput output={{ kind: 'error', error: 'Permission denied', content: 'trace' }} />);
    expect(screen.getByText('Permission denied')).toBeInTheDocument();
    expect(document.querySelector('.rl-agent-output')).toHaveAttribute('data-kind', 'error');
  });
});

describe('DiffPreview', () => {
  it('header stats, visible sign column and spoken add/remove', () => {
    render(<DiffPreview diff={diff} />);
    expect(screen.getByText('src/config.py')).toBeInTheDocument();
    expect(screen.getByText('新增 1 行，删除 1 行')).toBeInTheDocument();
    expect(screen.getByText('待批准')).toBeInTheDocument();
    const region = screen.getByRole('region', { name: 'src/config.py 的差异' });
    expect(region).toHaveAttribute('tabindex', '0');
    const signs = Array.from(region.querySelectorAll('.rl-agent-diff__sign')).map((s) => s.textContent);
    expect(signs).toContain('+');
    expect(signs).toContain('−');
    expect(
      within(region).getByText('新增', {
        selector: '.rl-agent-sr',
        exact: false,
      }),
    ).toBeInTheDocument();
    expect(
      within(region).getByText('删除', {
        selector: '.rl-agent-sr',
        exact: false,
      }),
    ).toBeInTheDocument();
    // Line numbers are hidden from assistive tech.
    expect(region.querySelector('.rl-agent-diff__ln')).toHaveAttribute('aria-hidden', 'true');
  });

  it('before/after convenience uses lineDiff', () => {
    render(<DiffPreview path="a.txt" before={'one\ntwo'} after={'one\nthree'} />);
    expect(screen.getByText('新增 1 行，删除 1 行')).toBeInTheDocument();
    expect(screen.getByText('three')).toBeInTheDocument();
    expect(screen.getByText('预览')).toBeInTheDocument();
  });

  it('conflict, binary, truncated, no newline', async () => {
    const user = userEvent.setup();
    const reload = vi.fn();
    const full = vi.fn();
    const { rerender } = render(<DiffPreview diff={{ ...diff, status: 'conflict' }} onReload={reload} />);
    expect(screen.getByText('文件版本冲突')).toBeInTheDocument();
    expect(screen.getByText(/重新读取最新文件后再决定/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '重新读取文件' }));
    expect(reload).toHaveBeenCalled();
    rerender(<DiffPreview diff={{ ...diff, binary: true, hunks: [] }} />);
    expect(screen.getByText('二进制文件，不显示内容差异')).toBeInTheDocument();
    rerender(<DiffPreview diff={{ ...diff, truncated: true, noNewlineAtEnd: { new: true } }} onViewFull={full} />);
    expect(screen.getByText('仅显示部分差异')).toBeInTheDocument();
    expect(screen.getByText('新文件末尾没有换行符')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '查看完整差异' }));
    expect(full).toHaveBeenCalled();
  });

  it('MultiFileDiff keeps per-file status and opens the first + conflicting files', () => {
    const files: FileDiffView[] = [
      { ...diff, path: 'a.py', status: 'applied' },
      { ...diff, path: 'b.py', status: 'proposed' },
      { ...diff, path: 'c.py', status: 'conflict' },
    ];
    render(<MultiFileDiff files={files} />);
    const list = screen.getByRole('list', { name: '改动的文件' });
    const triggers = within(list)
      .getAllByRole('button', { expanded: true })
      .concat(within(list).getAllByRole('button', { expanded: false }));
    expect(triggers).toHaveLength(3);
    expect(within(list).getByRole('button', { name: /a\.py/ })).toHaveAttribute('aria-expanded', 'true');
    expect(within(list).getByRole('button', { name: /b\.py/ })).toHaveAttribute('aria-expanded', 'false');
    expect(within(list).getByRole('button', { name: /c\.py/ })).toHaveAttribute('aria-expanded', 'true');
    expect(within(list).getByText('已应用')).toBeInTheDocument();
    expect(within(list).getByText('版本冲突')).toBeInTheDocument();
    expect(screen.getByText('3 个文件')).toBeInTheDocument();
  });
});

describe('tool details', () => {
  it('FileReadDetail: range, line numbers from range.start, continue only from nextOffset', async () => {
    const user = userEvent.setup();
    const more = vi.fn();
    const { rerender } = render(
      <FileReadDetail
        detail={{
          kind: 'file-read',
          path: 'a.csv',
          range: { start: 41, end: 42, unit: 'lines' },
          preview: 'x\ny',
          eof: false,
          nextOffset: 43,
          totalLines: 128,
          bytes: 2048,
        }}
        onReadMore={more}
      />,
    );
    expect(screen.getByText('第 41–42 行')).toBeInTheDocument();
    expect(screen.getByText('可从第 43 行继续读取')).toBeInTheDocument();
    expect(screen.getByText('共 128 行')).toBeInTheDocument();
    expect(screen.getByText('大小 2 KB')).toBeInTheDocument();
    const lns = Array.from(screen.getByRole('region', { name: 'a.csv 内容预览' }).querySelectorAll('.rl-agent-code__ln')).map(
      (n) => n.textContent,
    );
    expect(lns).toEqual(['41', '42']);
    await user.click(screen.getByRole('button', { name: '继续读取' }));
    expect(more).toHaveBeenCalledWith(43);
    rerender(<FileReadDetail detail={{ kind: 'file-read', path: 'a.csv', eof: false }} onReadMore={more} />);
    expect(screen.getByText('尚未读到文件末尾')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '继续读取' })).toBeNull();
    rerender(
      <FileReadDetail
        detail={{
          kind: 'file-read',
          path: 'dir/missing.csv',
          error: 'not-found',
        }}
      />,
    );
    expect(screen.getByText('找不到文件：missing.csv')).toBeInTheDocument();
    rerender(<FileReadDetail detail={{ kind: 'file-read', path: 'a.csv', eof: true }} />);
    expect(screen.getByText('已读到文件末尾')).toBeInTheDocument();
  });

  it('FileWriteDetail: mode, version conflict and material pending', () => {
    render(
      <FileWriteDetail
        detail={{
          kind: 'file-write',
          path: 'out.md',
          mode: 'overwrite',
          expectedVersion: 'v3',
          currentVersion: 'v4',
          materialReady: false,
          diff,
        }}
        onReload={() => {}}
      />,
    );
    expect(screen.getByText('覆盖写入')).toBeInTheDocument();
    expect(screen.getByText('文件版本已变化：期望 v3，当前 v4')).toBeInTheDocument();
    expect(screen.getByText('正在读取完整材料…')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '重新读取文件' })).toBeInTheDocument();
  });

  it('EditFileDetail: numbered edits with before/after and real line numbers', () => {
    render(
      <EditFileDetail
        detail={{
          kind: 'file-edit',
          path: 'src/config.py',
          expectedVersion: 'v7',
          edits: [
            {
              id: 'e1',
              range: { start: 12, end: 12, unit: 'lines' },
              before: 'debug = true',
              after: 'debug = false',
              strategy: '精确匹配',
              truncated: true,
            },
          ],
        }}
      />,
    );
    expect(screen.getByText('编辑 1')).toBeInTheDocument();
    expect(screen.getByText('匹配方式 · 精确匹配')).toBeInTheDocument();
    expect(screen.getByText('debug = true')).toBeInTheDocument();
    expect(screen.getByText('debug = false')).toBeInTheDocument();
    expect(screen.getByText('仅显示部分差异')).toBeInTheDocument();
    const ln = document.querySelector('.rl-agent-diff__line[data-kind="remove"] .rl-agent-diff__ln');
    expect(ln?.textContent).toBe('12');
  });

  it('ApplyPatchDetail names conflicting files', () => {
    render(
      <ApplyPatchDetail
        detail={{
          kind: 'patch',
          revision: 'r9',
          files: [
            { ...diff, path: 'a.py' },
            { ...diff, path: 'b.py', status: 'conflict' },
          ],
        }}
      />,
    );
    expect(screen.getByText('补丁冲突：b.py')).toBeInTheDocument();
    expect(screen.getByText('修订 r9')).toBeInTheDocument();
  });

  it('ManageFilesDetail: table, delete flagged in text, load more only with hasMore + callback', async () => {
    const user = userEvent.setup();
    const more = vi.fn();
    const { rerender } = render(
      <ManageFilesDetail
        detail={{
          kind: 'manage-files',
          hasMore: true,
          operations: [
            {
              id: '1',
              type: 'move',
              source: 'a.txt',
              target: 'b.txt',
              status: 'completed',
            },
            {
              id: '2',
              type: 'delete',
              source: 'tmp',
              recursive: true,
              status: 'pending',
            },
          ],
        }}
        onLoadMore={more}
      />,
    );
    const table = screen.getByRole('table', { name: '文件操作' });
    expect(within(table).getAllByRole('row')).toHaveLength(3);
    expect(within(table).getByText('不能自动恢复')).toBeInTheDocument();
    expect(within(table).getByText('包含子目录')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '加载更多文件操作' }));
    expect(more).toHaveBeenCalled();
    rerender(<ManageFilesDetail detail={{ kind: 'manage-files', operations: [] }} onLoadMore={more} />);
    expect(screen.queryByRole('button', { name: '加载更多文件操作' })).toBeNull();
  });

  it('RunCommandDetail: execution states, exit codes, sandbox and terminal', async () => {
    const user = userEvent.setup();
    const openTerminal = vi.fn();
    const { rerender } = render(
      <RunCommandDetail
        detail={{
          kind: 'command',
          command: 'python verify.py',
          cwd: '/w',
          shell: 'bash',
          timeoutMs: 120_000,
          execution: 'returned',
          exitCode: 1,
          sandboxed: false,
          terminalId: 't1',
          output: { kind: 'text', content: '[ERROR] 1 failed' },
        }}
        onOpenTerminal={openTerminal}
      />,
    );
    expect(screen.getByRole('region', { name: '命令' })).toHaveTextContent('python verify.py');
    expect(screen.getByText('调用已返回')).toBeInTheDocument();
    expect(screen.getByText('退出码 1 · 请检查输出')).toBeInTheDocument();
    expect(screen.getByText(/非沙箱/)).toBeInTheDocument();
    expect(screen.getByText('2m 00s')).toBeInTheDocument();
    expect(document.querySelector('.rl-agent-output')).toHaveAttribute('data-kind', 'terminal');
    await user.click(screen.getByRole('button', { name: '打开终端' }));
    expect(openTerminal).toHaveBeenCalledWith('t1');
    expect(screen.getByRole('button', { name: '复制命令' })).toBeInTheDocument();
    rerender(
      <RunCommandDetail
        detail={{
          kind: 'command',
          command: 'x',
          execution: 'background',
          terminalId: 't1',
        }}
      />,
    );
    expect(screen.getByText('后台仍在运行')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '打开终端' })).toBeNull();
    rerender(
      <RunCommandDetail
        detail={{
          kind: 'command',
          command: 'x',
          execution: 'cancel-unconfirmed',
        }}
      />,
    );
    expect(screen.getByText('停止尚未确认')).toBeInTheDocument();
    rerender(<RunCommandDetail detail={{ kind: 'command', command: 'x', execution: 'timed-out' }} />);
    expect(screen.getByText('已超时')).toBeInTheDocument();
    expect(screen.getByText('退出码未记录')).toBeInTheDocument();
    rerender(
      <RunCommandDetail
        detail={{
          kind: 'command',
          command: 'x',
          execution: 'returned',
          exitCode: 0,
        }}
      />,
    );
    expect(screen.getByText('退出码 0')).toBeInTheDocument();
  });

  it('MCPExecuteDetail: unknown remote with reconcile, stale catalog, full arguments', async () => {
    const user = userEvent.setup();
    const reconcile = vi.fn();
    const { rerender } = render(
      <MCPExecuteDetail
        detail={{
          kind: 'mcp',
          server: 's',
          tool: 't',
          catalogRevision: 'c1',
          catalogStale: true,
          arguments: { id: 1 },
          remote: 'unknown',
        }}
        onReconcile={reconcile}
      />,
    );
    expect(screen.getByText('目录已变化，旧材料不可信')).toBeInTheDocument();
    expect(screen.getByText('远端结果待确认，需要核对')).toBeInTheDocument();
    expect(screen.getByRole('region', { name: '完整参数' }).textContent).toBe('{\n  "id": 1\n}');
    await user.click(screen.getByRole('button', { name: '核对远端结果' }));
    expect(reconcile).toHaveBeenCalled();
    rerender(<MCPExecuteDetail detail={{ kind: 'mcp', server: 's', tool: 't', remote: 'unknown' }} />);
    expect(screen.queryByRole('button', { name: '核对远端结果' })).toBeNull();
  });

  it('NativeModelDetail: partial save with retry-save hint; running has no percentage', async () => {
    const user = userEvent.setup();
    const retry = vi.fn();
    const { rerender } = render(
      <NativeModelDetail
        detail={{
          kind: 'model',
          provider: 'p',
          model: 'm',
          purpose: '生成图示',
          inputs: [
            {
              id: 'i',
              label: 'a.png',
              size: 1024,
              mimeType: 'image/png',
              destination: 'p',
            },
          ],
          params: { size: '1024x1024', n: 2 },
          results: [
            {
              id: 'r1',
              label: 'r1.png',
              saved: true,
              preview: 'data:image/gif;base64,R0lGODlhAQABAAAAACw=',
              alt: '示例图 1',
            },
            { id: 'r2', label: 'r2.png', saved: false },
          ],
          save: 'partial',
          costNotice: '示例：本次调用按图片计费',
        }}
        onRetrySave={retry}
      />,
    );
    expect(screen.getByText('部分材料已保存')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: '示例图 1' })).toBeInTheDocument();
    const btn = screen.getByRole('button', { name: '重新保存' });
    expect(btn).toHaveAccessibleDescription('只重新保存，不会再次调用模型');
    await user.click(btn);
    expect(retry).toHaveBeenCalled();
    rerender(<NativeModelDetail detail={{ kind: 'model', provider: 'p', model: 'm' }} running />);
    expect(screen.getByRole('status')).toHaveTextContent('模型调用进行中');
    expect(screen.queryByText(/%/)).toBeNull();
  });

  it('Question, subagent and generic details', async () => {
    const user = userEvent.setup();
    const openChild = vi.fn();
    const { rerender } = render(
      <QuestionToolDetail
        detail={{
          kind: 'question',
          questionnaireId: 'q',
          count: 2,
          answers: [
            { question: 'A?', answer: 'yes' },
            { question: 'B?', skipped: true },
          ],
        }}
      />,
    );
    expect(screen.getByText('2 个问题')).toBeInTheDocument();
    expect(screen.getByText('已跳过')).toBeInTheDocument();
    rerender(
      <SubagentToolDetail
        detail={{
          kind: 'agent',
          agentName: '核查',
          task: '检查',
          childConversationId: 'c9',
        }}
        onOpenChild={openChild}
      />,
    );
    await user.click(screen.getByRole('button', { name: '打开子任务' }));
    expect(openChild).toHaveBeenCalledWith('c9');
    rerender(
      <GenericToolDetail
        detail={{
          kind: 'generic',
          input: { q: 'x' },
          output: { kind: 'text', content: 'ok' },
        }}
      />,
    );
    expect(screen.getByRole('region', { name: '输入参数' })).toHaveTextContent('"q": "x"');
    expect(screen.getByRole('region', { name: '文本' })).toHaveTextContent('ok');
  });

  it('ToolDetail dispatches by kind and routes callbacks with the tool', async () => {
    const user = userEvent.setup();
    const onReadMore = vi.fn();
    const tool: ToolCallView = {
      id: 'x',
      name: 'read_file',
      status: 'completed',
      detail: { kind: 'file-read', path: 'a', nextOffset: 5 },
    };
    const { rerender } = render(<ToolDetail tool={tool} onReadMore={onReadMore} />);
    await user.click(screen.getByRole('button', { name: '继续读取' }));
    expect(onReadMore).toHaveBeenCalledWith(tool, 5);
    rerender(<ToolDetail tool={{ ...tool, detail: { kind: 'future-kind' } as never }} />);
    expect(screen.getByRole('region', { name: '输入参数' })).toHaveTextContent('future-kind');
  });
});
