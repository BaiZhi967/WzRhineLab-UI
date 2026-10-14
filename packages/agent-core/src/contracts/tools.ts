import type { ActionReceipt } from './actions.js';
import type { ToolStatus } from './status.js';

/**
 * Tool view-models (ADR-0011 §5). `ToolCallView` is the common row; `detail` is a discriminated
 * union for the tools the library renders specially. Unknown tools use `{ kind: 'generic' }`.
 * Summaries never pose as full results: anything cut carries `truncated` and a way to load more.
 */

/** Read / write / execute / network / model: drives the category chip and icon. The listed values
 * have built-in copy + icon; any other string falls back to the `other` icon and renders its raw
 * id as the chip label (ADR-0013 §2). */
export type ToolCategory = 'read' | 'write' | 'execute' | 'network' | 'model' | 'agent' | 'question' | 'other';

/** Where the permission for this call came from. Shown as text, never inferred. */
export interface ToolAuthorizationView {
  decision: 'auto' | 'approved' | 'denied' | 'pending' | 'expired';
  /** Human-readable source: "只读自动允许", "命中常用命令规则"… */
  source?: string;
}

export interface ToolOutputView {
  kind: 'text' | 'json' | 'code' | 'terminal' | 'list' | 'error' | 'empty';
  /** One-line result summary ("返回 12 项", "exit 1"). */
  summary?: string;
  /** The loaded portion. */
  content?: string;
  language?: string;
  /**
   * `display`: the UI shows a limited snippet, the full output exists (load more / open full).
   * `execution`: the tool itself cut its output (limit reached). They must never be conflated.
   */
  truncated?: 'display' | 'execution';
  /** Total size of the full output, when known (bytes or lines, see `totalUnit`). */
  total?: number;
  totalUnit?: 'bytes' | 'lines' | 'items';
  status?: 'loading' | 'partial' | 'complete' | 'unavailable';
  error?: string;
}

/** A unified diff hunk set for one file. */
export interface DiffLineView {
  kind: 'context' | 'add' | 'remove' | 'meta';
  text: string;
  oldLine?: number;
  newLine?: number;
}

export interface DiffHunkView {
  id: string;
  header?: string;
  lines: DiffLineView[];
}

export interface FileDiffView {
  path: string;
  /** Target path for moves / renames. */
  movedTo?: string;
  change: 'add' | 'delete' | 'update' | 'move';
  hunks: DiffHunkView[];
  additions?: number;
  deletions?: number;
  /** Lines omitted from the shown hunks. */
  truncated?: boolean;
  binary?: boolean;
  /** No trailing newline at end of file (old / new). */
  noNewlineAtEnd?: { old?: boolean; new?: boolean };
  status?: 'preview' | 'proposed' | 'applied' | 'conflict' | 'unavailable';
  conflictReason?: string;
  revision?: string;
  /** Whether additions/deletions came from a complete, trustworthy observation. */
  statsReliable?: boolean;
  /** Original material before the write, when the host provides it. */
  before?: MaterialPageView;
  /** True when this operation created the target rather than modifying it. */
  created?: boolean;
  /** Observed byte size used when line statistics are unavailable. */
  observedBytes?: number;
}

/**
 * One page of stored material (old file content, manifests, patches, terminal output). The next
 * offset comes from the real result only; the host keeps the history of previous offsets.
 */
export interface MaterialPageView {
  /** Start of this page. */
  offset: number;
  /** Start of the next page; absent at the end. */
  nextOffset?: number;
  /** Length of this page in `unit`. */
  length: number;
  /** Total size when known. */
  total?: number;
  unit: 'bytes' | 'lines' | 'items';
  /** This page reaches the end of the material. */
  complete: boolean;
  content?: string;
  status: 'loading' | 'ready' | 'error';
  reason?: string;
}

export interface ReadRangeView {
  /** 1-based lines or byte offsets, see `unit`. */
  start: number;
  end?: number;
  unit: 'lines' | 'bytes';
}

export type ToolDetailView =
  | { kind: 'generic'; input?: unknown; output?: ToolOutputView }
  | {
      kind: 'file-read';
      path: string;
      range?: ReadRangeView;
      preview?: string;
      /** Real result info only. `nextOffset` comes from the runtime, never computed here. */
      eof?: boolean;
      nextOffset?: number;
      totalLines?: number;
      bytes?: number;
      version?: string;
      nextOffsetUnit?: 'lines' | 'bytes';
      error?: 'not-found' | 'forbidden' | 'error';
    }
  | {
      kind: 'file-write';
      path: string;
      mode: 'create' | 'overwrite' | 'append';
      diff?: FileDiffView;
      /** Version the proposal expects; a mismatch is a conflict. */
      expectedVersion?: string;
      currentVersion?: string;
      /** Full proposal loaded and verified by the adapter. Approval needs it. */
      materialReady?: boolean;
    }
  | {
      kind: 'file-edit';
      path: string;
      edits: {
        id: string;
        range?: ReadRangeView;
        before: string;
        after: string;
        /** Matching strategy label ("精确", "忽略缩进"…). */
        strategy?: string;
        truncated?: boolean;
      }[];
      expectedVersion?: string;
      materialReady?: boolean;
      replacementCount?: number;
      page?: MaterialPageView;
      complete?: boolean;
    }
  | {
      kind: 'patch';
      files: FileDiffView[];
      revision?: string;
      materialReady?: boolean;
      hunksAvailable?: boolean;
      baseVersion?: string;
      raw?: MaterialPageView;
    }
  | {
      kind: 'manage-files';
      operations: {
        id: string;
        type: 'mkdir' | 'move' | 'copy' | 'rename' | 'delete';
        source: string;
        target?: string;
        recursive?: boolean;
        status?: 'pending' | 'completed' | 'failed' | 'conflict';
        reason?: string;
      }[];
      /** More operations exist than are loaded. */
      hasMore?: boolean;
      materialReady?: boolean;
      counts?: Partial<Record<'mkdir' | 'move' | 'copy' | 'rename' | 'delete', number>>;
      total?: number;
      page?: MaterialPageView;
    }
  | {
      kind: 'command';
      command: string;
      cwd?: string;
      shell?: string;
      /** Milliseconds. */
      timeoutMs?: number;
      exitCode?: number;
      /**
       * `returned`: the call returned (the process may live on in a terminal).
       * `background`: still running after the call returned.
       */
      execution?: 'pending' | 'running' | 'returned' | 'background' | 'timed-out' | 'cancel-unconfirmed';
      output?: ToolOutputView;
      terminalId?: string;
      sandboxed?: boolean;
    }
  | {
      kind: 'mcp';
      server: string;
      tool: string;
      endpoint?: string;
      catalogRevision?: string;
      /** The catalog changed since the proposal: old material cannot be trusted. */
      catalogStale?: boolean;
      arguments?: unknown;
      output?: ToolOutputView;
      remote?: 'pending' | 'completed' | 'failed' | 'unknown';
    }
  | {
      kind: 'model';
      provider: string;
      model: string;
      purpose?: string;
      inputs?: { id: string; label: string; size?: number; mimeType?: string; destination?: string }[];
      params?: Record<string, string | number | boolean>;
      results?: { id: string; label: string; preview?: string; alt?: string; saved: boolean }[];
      save?: 'pending' | 'saving' | 'saved' | 'partial' | 'failed';
      /** Running model calls show activity without a number. */
      costNotice?: string;
      endpoint?: string;
      route?: string;
      timeoutMs?: number;
      sha256?: string;
      arguments?: unknown;
      remote?: boolean | 'pending' | 'completed' | 'failed' | 'unknown';
      stopReason?: string;
      saveRetry?: boolean;
      saveError?: string;
    }
  | {
      kind: 'question';
      questionnaireId: string;
      count: number;
      answers?: { question: string; answer?: string; skipped?: boolean }[];
    }
  | {
      kind: 'agent';
      agentName: string;
      task?: string;
      childConversationId?: string;
    };

export type ToolDetailKind = ToolDetailView['kind'];

export interface ToolCallView {
  /** Operation id; never shown twice in one list (adapter dedupes). */
  id: string;
  /** Monotonic order across live rows and history. */
  sequence?: number;
  /** Raw tool name (`read_file`, `mcp.execute`). */
  name: string;
  /** Localised name. Falls back to `name`. */
  displayName?: string;
  /** Main argument shown in the row: path, command, pattern… */
  subject?: string;
  category?: ToolCategory | (string & {});
  status: ToolStatus;
  /** One-line result summary. */
  summary?: string;
  startedAt?: string;
  elapsedMs?: number;
  authorization?: ToolAuthorizationView;
  detail?: ToolDetailView;
  /** Full record not loaded; expanding calls `onLoadDetails`. */
  detailsLoaded?: boolean;
  /** Parent operation for nested (Code Mode / script) calls. */
  parentId?: string;
  children?: ToolCallView[];
  /** Script source for Code Mode parents. */
  script?: { language?: string; source: string; truncated?: boolean };
  receipt?: ActionReceipt;
  /** Structured failure information; a failed row may still be retryable. */
  failure?: { code?: string; message: string; retryable?: boolean };
  /** Host-level busy/disabled state, with an optional explanation. */
  disabled?: boolean | { reason?: string };
}
