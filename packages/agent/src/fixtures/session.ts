import type {
  ApprovalView,
  ArtifactView,
  ContextUsageView,
  ConversationSection,
  LedgerEventView,
  MessageView,
  PinnedSummaryView,
  QuestionnaireView,
  RunView,
  SubagentView,
  TerminalView,
  ToolCallView,
} from '@wzrhine/agent-core';

/*
 * Static agent fixture (ADR-0011 §11): one deterministic session that tests, the showcase and the
 * example app share. Every value is illustrative sample data, labelled as such where it is shown;
 * nothing here pretends to be a live measurement. Not part of the package entry: import from
 * `@wzrhine/agent/fixtures` is not offered; the showcase imports this file directly.
 */

const t = (minute: number) => `2026-10-11T14:${String(minute).padStart(2, '0')}:00+08:00`;

export const sampleConversations: ConversationSection[] = [
  {
    id: 'pinned',
    label: 'Pinned',
    items: [
      { id: 'c-ocean', title: '海洋塑料样本分析', preview: '4 条消息', updatedAt: t(2), pinned: true, runStatus: 'completed' },
      { id: 'c-helix', title: 'Helix aurelia study — long English title that must truncate cleanly', preview: '12 messages', updatedAt: t(1), pinned: true, unread: 1, runStatus: 'completed' },
    ],
  },
  {
    id: 'recent',
    label: 'Recent',
    items: [
      { id: 'c-coral', title: '珊瑚礁图像分类', preview: '6 条消息', updatedAt: t(20), runStatus: 'running', runPhase: 'executing-tool' },
      { id: 'c-sat', title: '卫星影像处理', preview: '14 条消息', updatedAt: t(18), runStatus: 'waiting', runPhase: 'waiting-approval', attention: 'approval' },
      { id: 'c-lab', title: '实验报告草稿', preview: '3 条消息', updatedAt: t(10), runStatus: 'failed', attention: 'error' },
      { id: 'c-enzyme', title: '酶结构比对：一个非常非常长的中文标题用于验证单行截断与时间列不被挤压', preview: '9 条消息', updatedAt: t(5), runStatus: 'idle' },
    ],
  },
];

const readTool: ToolCallView = {
  id: 'op-1',
  sequence: 1,
  name: 'read_file',
  displayName: '读取文件',
  subject: 'data/reef/manifest.csv',
  category: 'read',
  status: 'completed',
  summary: '1.2 KB · 可继续读取',
  elapsedMs: 120,
  authorization: { decision: 'auto', source: '只读自动允许' },
  detail: {
    kind: 'file-read',
    path: 'data/reef/manifest.csv',
    range: { start: 1, end: 40, unit: 'lines' },
    preview: 'id,species,confidence\nR-01,staghorn,sample\nR-02,brain,sample',
    eof: false,
    nextOffset: 41,
    totalLines: 128,
    bytes: 1229,
  },
  detailsLoaded: true,
};

const commandTool: ToolCallView = {
  id: 'op-2',
  sequence: 2,
  name: 'run_command',
  displayName: '执行命令',
  subject: 'python classify.py --input ./images',
  category: 'execute',
  status: 'running',
  elapsedMs: 8400,
  authorization: { decision: 'approved', source: '用户允许本次' },
  detail: {
    kind: 'command',
    command: 'python classify.py --input ./images',
    cwd: '/workspace/reef',
    shell: 'bash',
    execution: 'running',
    terminalId: 'term-a',
    output: { kind: 'terminal', content: 'Loading model…\nProcessing image 1/3\nProcessing image 2/3', status: 'partial' },
  },
  detailsLoaded: true,
};

const editTool: ToolCallView = {
  id: 'op-3',
  sequence: 3,
  name: 'edit_file',
  displayName: '编辑文件',
  subject: 'src/config.py',
  category: 'write',
  status: 'waiting-approval',
  detail: {
    kind: 'file-edit',
    path: 'src/config.py',
    edits: [{ id: 'e1', range: { start: 12, end: 13, unit: 'lines' }, before: 'debug = true', after: 'debug = false\nlog_level = "info"', strategy: '精确匹配' }],
    expectedVersion: 'v7',
    materialReady: true,
  },
  detailsLoaded: true,
};

const mcpTool: ToolCallView = {
  id: 'op-4',
  sequence: 4,
  name: 'mcp.execute',
  displayName: 'MCP 工具',
  subject: 'specimens · analyze',
  category: 'network',
  status: 'unknown',
  summary: '远端结果待确认',
  detail: {
    kind: 'mcp',
    server: 'specimens',
    tool: 'analyze',
    endpoint: 'wzrhinelab://specimens/v1/analyze',
    catalogRevision: 'cat-12',
    arguments: { type: 'dataset', id: 'sp-001' },
    remote: 'unknown',
  },
  detailsLoaded: true,
};

const codeModeTool: ToolCallView = {
  id: 'op-5',
  sequence: 5,
  name: 'code_mode',
  displayName: 'Code Mode',
  subject: '批量读取并改写配置',
  category: 'execute',
  status: 'partial',
  elapsedMs: 18_200,
  script: { language: 'typescript', source: "const files = await tools.find_files({ glob: '**/*.py' });\nfor (const f of files) await tools.read_file({ path: f });" },
  children: [
    { id: 'op-5a', parentId: 'op-5', sequence: 6, name: 'read_file', displayName: '读取文件', subject: 'src/config.py', category: 'read', status: 'completed', elapsedMs: 2100 },
    { id: 'op-5b', parentId: 'op-5', sequence: 7, name: 'edit_file', displayName: '编辑文件', subject: 'src/config.py', category: 'write', status: 'failed', summary: '文件已变化', elapsedMs: 6300 },
  ],
};

export const sampleTools: ToolCallView[] = [readTool, commandTool, editTool, mcpTool, codeModeTool];

export const sampleRun: RunView = {
  id: 'run-2187',
  status: 'running',
  phase: 'executing-tool',
  elapsedMs: 18_400,
  model: 'sample-model',
  syncStatus: 'live',
  actionStatus: 'idle',
  toolCount: 5,
  calls: [
    {
      id: 'call-1',
      ordinal: 1,
      status: 'completed',
      elapsedMs: 4200,
      blocks: [
        {
          type: 'thinking',
          id: 'th-1',
          thinking: { id: 'th-1', label: '思考 1', status: 'completed', summary: '先读取样本清单，确认图片数量与字段。', elapsedMs: 4200 },
        },
        { type: 'tool', id: 'b-op-1', tool: readTool },
      ],
    },
    {
      id: 'call-2',
      ordinal: 2,
      status: 'running',
      blocks: [
        {
          type: 'thinking',
          id: 'th-2',
          thinking: { id: 'th-2', label: '思考 2', status: 'streaming', latestLine: '正在核对分类脚本的输入目录…', elapsedMs: 12_400 },
        },
        { type: 'text', id: 'tx-2', text: '接下来运行分类脚本并检查配置。' },
        { type: 'tool', id: 'b-op-2', tool: commandTool },
        { type: 'tool', id: 'b-op-5', tool: codeModeTool },
        { type: 'pending-record', id: 'pr-1', label: '1 条工具记录稍后到达' },
      ],
    },
  ],
};

export const sampleArtifacts: ArtifactView[] = [
  { id: 'a-1', title: 'classification_results.csv', kind: 'data', size: 2150, status: 'saved', change: 'created', path: 'out/classification_results.csv' },
  { id: 'a-2', title: 'reef_report.md', kind: 'markdown', status: 'generating', path: 'out/reef_report.md' },
  { id: 'a-3', title: 'figure-1.png', kind: 'image', status: 'partial', reason: '图片已生成，本地保存未完成', path: 'out/figure-1.png' },
];

export const sampleMessages: MessageView[] = [
  {
    id: 'm-1',
    role: 'user',
    author: '你',
    createdAt: t(20),
    status: 'complete',
    sequence: 1,
    parts: [
      { type: 'text', id: 'm-1-p1', text: '分析这些水下图像，分类珊瑚类型，并给出置信度摘要。' },
      { type: 'attachment', id: 'm-1-p2', attachment: { id: 'att-1', name: 'reef_images.zip', kind: 'file', size: 12_400_000, status: 'ready' } },
      { type: 'reference', id: 'm-1-p3', reference: { id: 'ref-1', kind: 'file', label: 'classify.py', detail: 'src/classify.py', status: 'ready' } },
    ],
  },
  {
    id: 'm-2',
    role: 'assistant',
    author: 'Research agent',
    createdAt: t(20),
    status: 'complete',
    sequence: 2,
    runId: 'run-2186',
    parts: [
      {
        type: 'markdown',
        id: 'm-2-p1',
        source: '我会先检查样本清单，再运行分类流程。初步结论见下表（示例数据）：\n\n| 类型 | 样本 |\n| --- | --- |\n| 鹿角珊瑚 | 12 |\n| 脑珊瑚 | 7 |',
      },
      { type: 'citation', id: 'm-2-p2', citation: { id: 'ci-1', index: 1, title: 'manifest.csv', sourceType: 'file', locator: 'data/reef/manifest.csv' } },
      { type: 'citation', id: 'm-2-p3', citation: { id: 'ci-2', index: 2, title: '已删除的旧报告', sourceType: 'file', unavailable: true, reason: '文件已不存在' } },
      { type: 'code', id: 'm-2-p4', language: 'python', code: 'model = load("coralnet-v2")\nresults = model.predict(images)' },
      { type: 'artifact', id: 'm-2-p5', artifact: sampleArtifacts[0]! },
      { type: 'custom', id: 'm-2-p6', renderer: 'chart', payload: { series: 3 }, summary: '图表：3 组示例数据' },
    ],
    usage: { input: 12_400, output: 3_100, total: 15_500, completeness: 'exact' },
  },
  {
    id: 'm-3',
    role: 'user',
    author: '你',
    createdAt: t(21),
    status: 'complete',
    sequence: 3,
    parts: [{ type: 'text', id: 'm-3-p1', text: '继续，把配置里的调试开关关掉。' }],
  },
  {
    id: 'm-4',
    role: 'assistant',
    author: 'Research agent',
    createdAt: t(21),
    status: 'streaming',
    sequence: 4,
    runId: 'run-2187',
    parts: [
      { type: 'status', id: 'm-4-p0', status: 'running', phase: 'executing-tool' },
      { type: 'markdown', id: 'm-4-p1', source: '正在运行分类脚本，完成后会修改 `src/config.py`。', streaming: true },
    ],
  },
];

export const sampleApproval: ApprovalView = {
  operationId: 'op-3',
  revision: '7',
  status: 'waiting',
  tool: { name: 'edit_file', displayName: '编辑文件', subject: 'src/config.py', category: 'write', detail: editTool.detail },
  summary: '把 src/config.py 中的 debug 改为 false，并新增 log_level。',
  reason: '修改代码文件',
  risk: 'medium',
  scope: '1 个文件 · 工作区内',
  evidence: [
    { id: 'ev-1', label: '目标文件', value: 'src/config.py', format: 'path' },
    { id: 'ev-2', label: '期望版本', value: 'v7', format: 'text' },
  ],
  availability: { allowed: true },
  scopes: ['once', 'session'],
};

export const sampleQuestionnaire: QuestionnaireView = {
  id: 'q-1',
  revision: '3',
  status: 'waiting',
  title: '需要你的回答',
  draftStatus: 'saved',
  submitStatus: 'idle',
  questions: [
    {
      id: 'q-1-a',
      kind: 'single',
      title: '输出形式',
      prompt: '分类结果以哪种形式交付？',
      options: [
        { id: 'report', label: '报告', description: '生成结构化研究报告' },
        { id: 'table', label: '表格', description: '以表格形式呈现结果' },
        { id: 'chart', label: '图示', description: '生成图表与可视化' },
      ],
      allowCustom: true,
    },
    {
      id: 'q-1-b',
      kind: 'multiple',
      title: '包含内容',
      options: [
        { id: 'data', label: '包含数据表' },
        { id: 'figures', label: '包含图表' },
        { id: 'summary', label: '包含结论' },
      ],
    },
    { id: 'q-1-c', kind: 'text', title: '补充说明', prompt: '还有需要注意的地方吗？', maxLength: 2000 },
  ],
  answers: [{ questionId: 'q-1-a', optionIds: ['table'] }],
};

export const sampleTerminals: TerminalView[] = [
  {
    id: 'term-a',
    name: '终端 A',
    backend: 'pty',
    cwd: '/workspace/reef',
    shell: 'bash',
    lastCommand: 'python classify.py --input ./images',
    status: 'running',
    stoppable: true,
    output: '$ python classify.py --input ./images\nLoading model…\nProcessing image 1/3\nProcessing image 2/3',
    calls: 3,
  },
  { id: 'term-b', name: '终端 B', backend: 'process', cwd: '/workspace', lastCommand: 'npm test', status: 'stop-pending', stoppable: true },
  { id: 'term-c', name: '继承终端', backend: 'pty', cwd: '/workspace/a/very/long/path/that/needs/to/truncate/but/stay/readable', status: 'ended', exitCode: 0, readOnly: true, inherited: true },
];

export const sampleSubagents: SubagentView[] = [
  { id: 's-1', name: '文件核查', task: '检查输入文件完整性', parentLabel: '父任务 #2', status: 'queued', usage: { tokens: 0, completeness: 'partial' } },
  { id: 's-2', name: '测试分析', task: '运行数据分析脚本', parentLabel: '父任务 #2', status: 'running', phase: 'executing-tool', elapsedMs: 32_100, usage: { tokens: 4_200, completeness: 'partial' } },
  { id: 's-3', name: '结果汇总', task: '整理分析结果', parentLabel: '父任务 #2', status: 'waiting-children' },
  { id: 's-4', name: '报告校对', task: '核对引用', parentLabel: '父任务 #2', status: 'needs-attention', pendingInput: 1 },
];

export const sampleContextUsage: ContextUsageView = {
  used: 12_400,
  max: 32_000,
  unit: 'tokens',
  completeness: 'estimated',
  label: '上下文',
  segments: [
    { id: 'messages', label: '消息', value: 6_800, tone: 'info' },
    { id: 'tools', label: '工具结果', value: 4_100, tone: 'accent' },
    { id: 'other', label: '其他', value: 1_500, tone: 'neutral' },
  ],
};

export const samplePinnedSummary: PinnedSummaryView = {
  id: 'ps-1',
  title: '固定摘要',
  body: '对水下图像中的珊瑚类型分类，关注物种识别、置信度与环境背景。',
  status: 'current',
  tags: ['marine-biology', 'image-classification'],
  sources: [{ id: 'ci-1', index: 1, title: 'manifest.csv', sourceType: 'file', locator: 'data/reef/manifest.csv' }],
  updatedAt: t(19),
};

export const sampleLedger: LedgerEventView[] = [
  { id: 'ev-1', sequence: 1, actor: 'user', title: '发送消息', at: t(20), outcome: 'neutral' },
  { id: 'ev-2', sequence: 2, actor: 'agent', title: '开始思考', at: t(20), outcome: 'info' },
  { id: 'ev-3', sequence: 3, actor: 'tool', title: 'read_file · data/reef/manifest.csv', at: t(20), outcome: 'success' },
  { id: 'ev-4', sequence: 4, actor: 'tool', title: 'run_command · classify.py', at: t(21), outcome: 'info' },
  { id: 'ev-5', sequence: 5, actor: 'system', title: '连接短暂中断后恢复', at: t(21), outcome: 'warning' },
  { id: 'ev-6', sequence: 6, actor: 'agent', title: '请求批准：编辑 src/config.py', at: t(22), outcome: 'warning' },
];
