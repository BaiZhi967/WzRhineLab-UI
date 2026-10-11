import * as React from 'react';
import { MotionConfig } from 'motion/react';
import { Button, IconButton, Menu, MenuItem } from '@wzrhine/react';
import {
  AgentIcon,
  AttachmentList,
  Composer,
  MentionMenu,
  ModelPicker,
  PermissionPicker,
  SendStopButton,
  SlashCommandMenu,
  encodeToken,
  filterMentionOptions,
  orderCommandOptions,
  removeTokens,
  splitMentionQuery,
} from '@wzrhine/agent';
import type {
  ActionStatus,
  AttachmentView,
  CommandOption,
  ComposerInputHandle,
  ComposerProps,
  ComposerToken,
  DraftStatus,
  MentionOption,
  ModelEffort,
  ModelProviderView,
  PermissionModeView,
  ReferenceView,
  RunStatus,
  SendInput,
} from '@wzrhine/agent';
import { PageHeader, Specimen, SpecimenGrid } from '../ui/Specimen';

/*
 * Composer family showcase (atlas 14–19). Every file, model, provider and number on this page is
 * sample data (示例); nothing is uploaded, sent or executed.
 */

// ---------- sample data (示例) ----------
const tree: Record<string, MentionOption[]> = {
  '': [
    { id: 'd-src', label: 'src', kind: 'folder', drillable: true, detail: 'src/', group: '文件夹（示例）' },
    { id: 'd-data', label: 'data', kind: 'folder', drillable: true, detail: 'data/', group: '文件夹（示例）' },
    { id: 'f-readme', label: 'README.md', kind: 'file', detail: 'README.md', group: '文件（示例）' },
    { id: 'f-report', label: 'report.pdf', kind: 'file', detail: 'docs/report.pdf', group: '文件（示例）' },
    { id: 'f-env', label: 'secret.env', kind: 'file', detail: '.env', group: '文件（示例）', disabled: true, disabledReason: '被忽略规则排除' },
  ],
  'src/': [
    { id: 'f-agent', label: 'agent.ts', kind: 'file', detail: 'src/agent.ts', group: 'src/（示例）' },
    { id: 'f-sync', label: 'sync-state.ts', kind: 'file', detail: 'src/sync-state.ts', group: 'src/（示例）' },
    { id: 'd-comp', label: 'components', kind: 'folder', drillable: true, detail: 'src/components/', group: 'src/（示例）' },
  ],
  'src/components/': [
    { id: 'f-composer', label: 'composer.tsx', kind: 'file', detail: 'src/components/composer.tsx', group: 'src/components/（示例）' },
  ],
  'data/': [{ id: 'f-csv', label: 'measurement.csv', kind: 'file', detail: 'data/measurement.csv', group: 'data/（示例）' }],
};

const commandsBase: CommandOption[] = [
  { id: 'c-analyze', name: 'analyze', label: '分析运行流程', kind: 'command', description: '整理为分析任务（示例命令）', aliases: ['an'], shortcut: 'Ctrl Shift A' },
  { id: 'c-compact', name: 'compact', label: '整理上下文', kind: 'command', description: '压缩较早的历史（示例命令）' },
  { id: 'c-fork', name: 'fork', label: '分叉对话', kind: 'command', disabled: true, disabledReason: '运行中不能分叉' },
  { id: 's-review', name: 'review', label: '代码审阅', kind: 'skill', description: '按清单审阅改动（示例技能）' },
  { id: 's-chart', name: 'chart', label: '绘制图表', kind: 'skill', description: '把表格数据画成图（示例技能）' },
];

const providers: ModelProviderView[] = [
  {
    id: 'pa',
    label: '提供商 A（示例）',
    models: [
      { id: 'vision-1', label: 'vision-1', providerId: 'pa', capabilities: ['image', 'tools', 'reasoning'], efforts: ['low', 'medium', 'high'] },
      { id: 'text-1', label: 'text-1-long-context-preview-edition', providerId: 'pa', capabilities: ['tools', 'long-context'], efforts: ['medium'] },
      { id: 'legacy-0', label: 'legacy-0', providerId: 'pa', disabled: true, unavailableReason: '已停止服务（示例）' },
    ],
  },
  {
    id: 'pb',
    label: '提供商 B（示例）',
    disabled: true,
    unavailableReason: '尚未配置密钥',
    models: [{ id: 'video-2', label: 'video-2', providerId: 'pb', capabilities: ['video', 'image'] }],
  },
];

const permissionModes: PermissionModeView[] = [
  { id: 'confirm', label: '确认更改', description: '每次写入与命令前询问' },
  { id: 'auto', label: '自动编辑', description: '工作区内的写入自动执行，命令仍需确认' },
  { id: 'full', label: '完全访问', description: '写入与终端命令自动执行，不在沙箱中', risk: 'elevated' },
];

// Inline SVG data URL drawn for this page (no external image).
const sampleThumb =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><rect width="40" height="40" fill="#D8DDD3"/><path d="M6 32 16 20l7 8 5-5 6 9Z" fill="#7B8579"/></svg>',
  );

const sampleAttachments: AttachmentView[] = [
  { id: 'a-png', name: 'sample.png', kind: 'image', mimeType: 'image/png', size: 182_000, status: 'ready', thumbnail: sampleThumb, alt: '示例缩略图' },
  { id: 'a-pdf', name: 'report-2026-q3-measurement-summary.pdf', kind: 'pdf', size: 2_400_000, status: 'uploading', progress: 0.42 },
  { id: 'a-csv', name: 'measurement.csv', kind: 'text', size: 48_000, status: 'uploading' },
  { id: 'a-zip', name: 'raw-images.zip', kind: 'file', size: 12_400_000, status: 'failed', reason: '示例：网络中断' },
  { id: 'a-old', name: 'old-config.json', kind: 'code', status: 'disabled', reason: '示例：格式不受支持' },
];

const sampleReferences: ReferenceView[] = [
  { id: 'r-agent', kind: 'file', label: 'src/agent.ts', detail: 'src/agent.ts' },
  { id: 'r-gone', kind: 'file', label: 'src/removed.ts', status: 'stale', reason: '示例：文件已被删除' },
  { id: 'r-skill', kind: 'skill', label: 'review' },
];

const tokenValue = `请结合 ${encodeToken('@', 'src/agent.ts')} 和 ${encodeToken('/', 'review')} 分析运行流程，并指出可能的状态同步问题（示例）。`;
const multiline = '第一行：说明背景（示例）\n第二行：列出要检查的文件\n第三行：期望输出的格式\n第四行：补充约束';

function noop() {}

// Page-local layout (showcase stylesheet is shared; these stay inline and token-based).
const layout = {
  states: { display: 'grid', gap: 'var(--rl-space-6)', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 22rem), 1fr))', alignItems: 'start' },
  state: { display: 'grid', gap: 'var(--rl-space-2)', minWidth: 0 },
  matrix: { display: 'flex', flexWrap: 'wrap', gap: 'var(--rl-space-4)', margin: 0, padding: 0, listStyle: 'none' },
  matrixItem: { display: 'grid', justifyItems: 'center', gap: 'var(--rl-space-1)', minWidth: '5.5rem' },
  pickers: { display: 'flex', flexWrap: 'wrap', gap: 'var(--rl-space-2)', alignItems: 'center', minWidth: 0 },
  sent: { margin: 0, paddingInlineStart: 'var(--rl-space-6)', font: 'var(--rl-type-body-sm)', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' },
  dock: { margin: 0, padding: 'var(--rl-space-3)', border: 'var(--rl-border-width) dashed var(--rl-border-strong)', borderRadius: 'var(--rl-radius-sm)', font: 'var(--rl-type-body-sm)' },
} satisfies Record<string, React.CSSProperties>;

function useTimers() {
  const timers = React.useRef<number[]>([]);
  React.useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);
  return React.useCallback((fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  }, []);
}

// ---------- interactive demo ----------
type DemoRun = 'idle' | 'submitting' | 'running' | 'stop-pending' | 'completed';

const runLabel: Record<DemoRun, string> = {
  idle: '空闲',
  submitting: '发送中',
  running: '运行中',
  'stop-pending': '停止待确认',
  completed: '已完成',
};

function ComposerDemo() {
  const later = useTimers();
  const inputRef = React.useRef<ComposerInputHandle>(null);
  const [value, setValue] = React.useState('');
  const [mentionQuery, setMentionQuery] = React.useState<string | null>(null);
  const [references, setReferences] = React.useState<ReferenceView[]>([]);
  const [attachments, setAttachments] = React.useState<AttachmentView[]>([]);
  const [skills, setSkills] = React.useState<string[]>([]);
  const [model, setModel] = React.useState('vision-1');
  const [effort, setEffort] = React.useState<ModelEffort>('medium');
  const [mode, setMode] = React.useState('confirm');
  const [run, setRun] = React.useState<DemoRun>('idle');
  const [draft, setDraft] = React.useState<DraftStatus>('clean');
  const [sent, setSent] = React.useState<string[]>([]);
  const [log, setLog] = React.useState('');

  const mentionOptions = React.useMemo(() => {
    if (mentionQuery === null) return [];
    return filterMentionOptions(tree[splitMentionQuery(mentionQuery).directory] ?? [], mentionQuery);
  }, [mentionQuery]);
  const commandOptions = React.useMemo(
    () => commandsBase.map((c) => (c.kind === 'skill' ? { ...c, selected: skills.includes(c.name) } : c)),
    [skills],
  );

  const runStatus: RunStatus = run === 'running' ? 'running' : run === 'stop-pending' ? 'cancelling' : run === 'completed' ? 'completed' : 'idle';
  const submitStatus: ActionStatus = run === 'submitting' ? 'submitting' : 'idle';

  const send = (input: SendInput) => {
    setSent((s) => [...s, input.text]);
    setLog('');
    setValue('');
    setReferences([]);
    setAttachments([]);
    setSkills([]);
    setDraft('clean');
    setRun('submitting');
    later(() => setRun('running'), 700);
  };

  const stop = () => {
    setRun('stop-pending');
    later(() => setRun('completed'), 1400);
  };

  const edit = (next: string) => {
    setValue(next);
    setDraft('saving');
    later(() => setDraft((d) => (d === 'saving' ? 'saved' : d)), 600);
  };

  const unbind = (token: ComposerToken) => {
    if (token.trigger === '@') setReferences((r) => r.filter((x) => x.label !== token.name));
    else setSkills((s) => s.filter((n) => n !== token.name));
  };
  const addSample = () => {
    const id = `img-${Date.now()}`;
    setAttachments((a) => [...a, { id, name: '示例图片.png', kind: 'image', size: 96_000, status: 'uploading', progress: 0.1, thumbnail: sampleThumb, alt: '示例缩略图' }]);
    later(() => setAttachments((a) => a.map((x) => (x.id === id ? { ...x, progress: 0.6 } : x))), 400);
    later(() => setAttachments((a) => a.map((x) => (x.id === id ? { ...x, status: 'ready', progress: undefined } : x))), 900);
  };
  const addFailing = () => {
    const id = `zip-${Date.now()}`;
    setAttachments((a) => [...a, { id, name: '示例数据.zip', kind: 'file', size: 4_200_000, status: 'failed', reason: '示例：上传中断' }]);
  };
  const typeAtEnd = (text: string) => {
    const at = value.length;
    inputRef.current?.replaceRange(at, at, text);
    inputRef.current?.focus();
  };

  return (
    <div className="sc-card-list">
      <Composer
        ref={inputRef}
        value={value}
        onValueChange={edit}
        mentionOptions={mentionOptions}
        onMentionQuery={setMentionQuery}
        onReferenceAdd={(option, name) =>
          setReferences((r) => (r.some((x) => x.label === name) ? r : [...r, { id: `${option.id}-${r.length}`, kind: option.kind, label: name, detail: option.detail }]))
        }
        commandOptions={commandOptions}
        onCommand={(option) => {
          if (option.kind === 'skill') {
            setSkills((s) => (s.includes(option.name) ? s : [...s, option.name]));
            return 'insert';
          }
          setLog(`已分发命令（示例，未执行）：/${option.name}`);
          return undefined;
        }}
        onDisabledCommand={(option) => setLog(`未分发：/${option.name}`)}
        onTokenRemoved={unbind}
        references={references}
        onRemoveReference={(ref) => {
          setReferences((r) => r.filter((x) => x.id !== ref.id));
          setValue((v) => removeTokens(v, '@', ref.label));
        }}
        attachments={attachments}
        onRemoveAttachment={(att) => setAttachments((a) => a.filter((x) => x.id !== att.id))}
        onRetryAttachment={(att) => {
          setAttachments((a) => a.map((x) => (x.id === att.id ? { ...x, status: 'uploading', progress: undefined } : x)));
          later(() => setAttachments((a) => a.map((x) => (x.id === att.id ? { ...x, status: 'ready' } : x))), 900);
        }}
        onFilesDrop={(files) => setLog(`收到拖放文件 ${files.length} 个（示例，未上传）`)}
        onFilesPaste={(files) => setLog(`收到粘贴文件 ${files.length} 个（示例，未上传）`)}
        onSubmit={send}
        submitStatus={submitStatus}
        runStatus={runStatus}
        onStop={stop}
        draftStatus={draft}
        onRetryDraftSave={() => {
          setDraft('saving');
          later(() => setDraft('saved'), 600);
        }}
        maxLength={2000}
        toolbarStart={
          <Menu trigger={<IconButton size="sm" label="添加内容" icon={<AgentIcon name="plus" />} />}>
            <MenuItem icon={<AgentIcon name="image" />} onSelect={addSample}>
              添加图片（示例）
            </MenuItem>
            <MenuItem icon={<AgentIcon name="attach" />} onSelect={addFailing}>
              添加会失败的附件（示例）
            </MenuItem>
            <MenuItem icon={<AgentIcon name="at" />} onSelect={() => typeAtEnd(value === '' || /\s$/.test(value) ? '@' : ' @')}>
              引用文件
            </MenuItem>
            <MenuItem icon={<AgentIcon name="slash" />} onSelect={() => typeAtEnd(value === '' || value.endsWith('\n') ? '/' : '\n/')}>
              使用技能
            </MenuItem>
          </Menu>
        }
        toolbarEnd={
          <>
            <ModelPicker providers={providers} selectedModel={model} onModelChange={setModel} effort={effort} onEffortChange={setEffort} />
            <PermissionPicker modes={permissionModes} value={mode} onChange={setMode} />
          </>
        }
      />
      <div className="sc-row">
        <Button size="sm" variant="secondary" onClick={() => setDraft('error')}>
          模拟草稿保存失败
        </Button>
        <span className="sc-small" role="status" data-testid="demo-log">
          {log || `运行状态（示例）：${runLabel[run]}`}
        </span>
      </div>
      <section aria-label="已发送消息（示例）" className="sc-card-list">
        <p className="sc-small">已发送消息（示例）</p>
        <ol style={layout.sent} data-testid="sent-messages">
          {sent.map((text, i) => (
            <li key={i}>{text}</li>
          ))}
        </ol>
      </section>
    </div>
  );
}

// ---------- static specimens ----------
function StateSpecimen({ label, initial = '', ...rest }: Partial<ComposerProps> & { label: string; initial?: string }) {
  const [value, setValue] = React.useState(initial);
  return (
    <div style={layout.state}>
      <p className="sc-small">{label}</p>
      <Composer
        aria-label={`消息内容（${label}）`}
        value={value}
        onValueChange={setValue}
        onSubmit={noop}
        toolbarEnd={<ModelPicker providers={providers} selectedModel="vision-1" effort="medium" onModelChange={noop} onEffortChange={noop} />}
        {...rest}
      />
    </div>
  );
}

function MenuSpecimens() {
  const [mentionIndex, setMentionIndex] = React.useState(1);
  const [commandIndex, setCommandIndex] = React.useState(0);
  const commands = orderCommandOptions(commandsBase).map((c) => (c.name === 'review' ? { ...c, selected: true } : c));
  return (
    <div className="sc-card-list">
      <MentionMenu
        id="spec-mention"
        side="inline"
        open
        query="src/s"
        options={filterMentionOptions(tree['src/']!, 'src/s')}
        activeIndex={mentionIndex}
        onActiveIndexChange={setMentionIndex}
        onSelect={noop}
        onDrill={noop}
      />
      <SlashCommandMenu id="spec-command" side="inline" open query="" options={commands} activeIndex={commandIndex} onActiveIndexChange={setCommandIndex} onSelect={noop} />
      <MentionMenu id="spec-mention-loading" side="inline" open query="" options={[]} loading activeIndex={-1} onActiveIndexChange={noop} onSelect={noop} />
      <MentionMenu id="spec-mention-empty" side="inline" open query="zz" options={[]} activeIndex={-1} onActiveIndexChange={noop} onSelect={noop} />
      <MentionMenu id="spec-mention-error" side="inline" open query="" options={[]} error="示例：读取超时" onRetry={noop} activeIndex={-1} onActiveIndexChange={noop} onSelect={noop} />
    </div>
  );
}

function SendStopMatrix() {
  const rows: Array<{ label: string; props: React.ComponentProps<typeof SendStopButton> }> = [
    { label: '可发送', props: { canSend: true, onSend: noop } },
    { label: '空 · 禁用', props: { canSend: false, onSend: noop, disabledReason: '输入内容后才能发送' } },
    { label: '发送中', props: { canSend: true, onSend: noop, sendReceipt: 'submitting' } },
    { label: '排队 · 可停止', props: { canSend: false, onSend: noop, onStop: noop, runStatus: 'queued' } },
    { label: '运行 · 可停止', props: { canSend: false, onSend: noop, onStop: noop, runStatus: 'running' } },
    { label: '停止待确认', props: { canSend: false, onStop: noop, runStatus: 'cancelling' } },
    { label: '回执未知', props: { canSend: true, onSend: noop, sendReceipt: { status: 'unknown', actionId: 'act-1', retryable: false } } },
    { label: '未知 · 可重试', props: { canSend: true, onSend: noop, onRetry: noop, sendReceipt: { status: 'unknown', actionId: 'act-1', retryable: true } } },
    { label: '重试保存', props: { canSend: true, onSend: noop, draftStatus: 'error', onRetrySave: noop } },
  ];
  return (
    <ul style={layout.matrix}>
      {rows.map((row) => (
        <li key={row.label} style={layout.matrixItem}>
          <SendStopButton {...row.props} />
          <span className="sc-small">{row.label}</span>
        </li>
      ))}
    </ul>
  );
}

function PickerSpecimens() {
  const [model, setModel] = React.useState('vision-1');
  const [effort, setEffort] = React.useState<ModelEffort>('high');
  const [mode, setMode] = React.useState('confirm');
  const [elevated, setElevated] = React.useState('full');
  return (
    <div style={layout.pickers}>
      <ModelPicker providers={providers} selectedModel={model} onModelChange={setModel} effort={effort} onEffortChange={setEffort} />
      <ModelPicker providers={providers} selectedModel="text-1" onModelChange={noop} />
      <ModelPicker providers={providers} selectedModel={null} disabled />
      <PermissionPicker modes={permissionModes} value={mode} onChange={setMode} />
      <PermissionPicker modes={permissionModes} value={elevated} onChange={setElevated} />
    </div>
  );
}

export function AgentComposerPage() {
  return (
    <>
      <PageHeader index="AG" section="Agent UI" title="Composer">
        智能体输入器：真实 textarea 负责输入法、选区与撤销，镜像层只给 @ 文件与 / 技能 token 着色；附件、模型、权限与发送 / 停止在同一框内。页面中的文件、模型、提供商与数值均为示例。
      </PageHeader>
      <SpecimenGrid>
        <Specimen
          id="composer-demo"
          index="14"
          title="交互演示"
          description="输入 @ 引用文件（Tab 进入文件夹），输入 / 选择命令或技能；Enter 发送，Shift + Enter 换行。发送后模拟：发送中 → 运行中（停止生成）→ 停止待确认 → 已完成。"
          note="菜单 fade（fast）；发送 / 停止图标交叉淡入（base / fast）；减动时直接切换。"
        >
          <ComposerDemo />
        </Specimen>

        <Specimen id="composer-states" index="14.1" title="状态矩阵" description="空 / 聚焦（框上的焦点环）/ 多行 / token / 发送中 / 排队 / 运行中 / 草稿失败 / 发送失败 / 已完成 / 阻塞 / 减动。">
          <div style={layout.states}>
            <StateSpecimen label="空态" />
            <StateSpecimen label="可发送 · 草稿已保存" initial="请检查最近一次运行的日志（示例）" draftStatus="saved" />
            <StateSpecimen label="多行" initial={multiline} />
            <StateSpecimen label="文件 + 技能 token" initial={tokenValue} commandOptions={commandsBase} references={[sampleReferences[0]!, sampleReferences[2]!]} onRemoveReference={noop} />
            <StateSpecimen label="发送中" initial="正在发送的消息（示例）" submitStatus="submitting" />
            <StateSpecimen label="排队中 · 可停止" runStatus="queued" onStop={noop} />
            <StateSpecimen label="运行中 · 可停止" initial="下一条想法（示例）" runStatus="running" onStop={noop} />
            <StateSpecimen label="草稿保存失败" initial="仍保留在本机的草稿（示例）" draftStatus="error" onRetryDraftSave={noop} />
            <StateSpecimen label="发送失败 · 草稿保留" initial="发送失败的消息（示例）" submitStatus="rejected" />
            <StateSpecimen label="已完成" runStatus="completed" draftStatus="saved" />
            <StateSpecimen label="等待回答 · 输入阻塞" blocked intervention={<p style={layout.dock}>示例：问卷卡停靠在输入框上方的插槽</p>} />
            <MotionConfig reducedMotion="always">
              <StateSpecimen label="减动" initial="减动下图标直接替换（示例）" runStatus="running" onStop={noop} />
            </MotionConfig>
          </div>
        </Specimen>

        <Specimen
          id="composer-menus"
          index="15–16"
          title="@ 引用 / 斜杠命令菜单"
          description="listbox + aria-activedescendant，焦点始终在 textarea；分组、匹配高亮、路径、可进入的文件夹、不可用原因、加载 / 空 / 错误。"
          span="half"
          align="start"
        >
          <MenuSpecimens />
        </Specimen>

        <Specimen id="composer-attachments" index="17" title="附件与引用" description="固定卡片尺寸：上传进度变化不推动相邻卡片；长文件名截断，完整名在 title 与读屏文本中。" span="half" align="start">
          <AttachmentList attachments={sampleAttachments} references={sampleReferences} onRemove={noop} onRetry={noop} />
        </Specimen>

        <Specimen id="composer-send" index="18" title="发送 / 停止" description="同一个按钮元素：发送 ↔ 停止生成，焦点不丢失；停止待确认与回执未知不可重复触发。" span="half" align="start">
          <SendStopMatrix />
        </Specimen>

        <Specimen
          id="composer-pickers"
          index="19"
          title="模型 / 权限选择"
          description="模型选择器两层下钻（思考强度 → 模型列表），不可用模型读出原因；完全访问需二次确认。"
          note="下钻：x 单轴 + opacity（panel）；减动即时切换。"
          span="half"
          align="start"
        >
          <PickerSpecimens />
        </Specimen>
      </SpecimenGrid>
    </>
  );
}
