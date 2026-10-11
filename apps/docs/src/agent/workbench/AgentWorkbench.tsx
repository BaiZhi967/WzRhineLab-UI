import * as React from 'react';
import { Button } from '@wzrhine/react';
import {
  AgentHeader,
  AgentMessage,
  AgentShell,
  AgentSidePane,
  ApprovalPanel,
  ArtifactCard,
  Composer,
  ContextUsage,
  DiffPreview,
  InterventionDock,
  MessageList,
  ModelPicker,
  PersistentTerminal,
  PermissionPicker,
  PinnedSummary,
  RunSummary,
  SubAgentList,
  ToolActivity,
  ToolRecord,
  ConversationList,
  filterMentionOptions,
} from '@wzrhine/agent';
import type { MentionOption, ModelEffort, ModelProviderView, PermissionModeView } from '@wzrhine/agent';
import {
  sampleArtifacts,
  sampleContextUsage,
  samplePinnedSummary,
  sampleSubagents,
  sampleTerminals,
} from '../../../../../packages/agent/src/fixtures/session';
import { useDemoSession } from './useDemoSession';

/*
 * Integrated Agent workbench (ADR-0010 §5): every family wired through one scripted adapter.
 * The adapter (useDemoSession) owns the snapshot; components only render it and emit actions.
 * All data is sample data (示例).
 */

const files: MentionOption[] = [
  { id: 'f-config', label: 'config.py', kind: 'file', detail: 'src/config.py', group: '文件（示例）' },
  { id: 'f-classify', label: 'classify.py', kind: 'file', detail: 'src/classify.py', group: '文件（示例）' },
  { id: 'f-manifest', label: 'manifest.csv', kind: 'file', detail: 'data/reef/manifest.csv', group: '文件（示例）' },
];

const providers: ModelProviderView[] = [
  {
    id: 'p1',
    label: '提供商 A（示例）',
    models: [
      { id: 'sample-model', label: 'sample-model', providerId: 'p1', capabilities: ['tools', 'image'], efforts: ['low', 'medium', 'high'] },
      { id: 'sample-mini', label: 'sample-mini', providerId: 'p1', capabilities: ['tools'], efforts: ['low', 'medium'] },
    ],
  },
];

const modes: PermissionModeView[] = [
  { id: 'confirm', label: '确认更改', description: '写入与命令前询问' },
  { id: 'full', label: '完全访问', description: '自动执行，不在沙箱中', risk: 'elevated' },
];

export function AgentWorkbench() {
  const session = useDemoSession();
  const [contextOpen, setContextOpen] = React.useState(true);
  const [tab, setTab] = React.useState('summary');
  const [value, setValue] = React.useState('');
  const [mentionQuery, setMentionQuery] = React.useState<string | null>(null);
  const [model, setModel] = React.useState('sample-model');
  const [effort, setEffort] = React.useState<ModelEffort>('medium');
  const [mode, setMode] = React.useState('confirm');

  const conversation = session.sections.flatMap((s) => s.items).find((c) => c.id === session.selectedId);
  const running = session.run.status === 'running' || session.run.status === 'waiting' || session.run.status === 'cancelling';
  const renderTool = React.useCallback((tool: Parameters<typeof ToolRecord>[0]['tool']) => <ToolRecord tool={tool} />, []);
  const renderArtifact = React.useCallback((artifact: Parameters<typeof ArtifactCard>[0]['artifact']) => <ArtifactCard artifact={artifact} />, []);

  const mentionOptions = mentionQuery === null ? [] : filterMentionOptions(files, mentionQuery);

  const messageList = (
    <MessageList
      messages={session.messages}
      isStreaming={running}
      messageProps={{ renderTool, renderArtifact }}
      renderMessage={(message) => (
        <AgentMessage
          message={message}
          renderTool={renderTool}
          renderArtifact={renderArtifact}
          footer={
            message.status === 'streaming' && session.tools.length > 0 ? (
              <ToolActivity tools={session.tools} active={running} elapsedMs={session.run.elapsedMs} defaultExpanded />
            ) : undefined
          }
        />
      )}
      footer={
        session.stage === 'done' ? (
          <RunSummary
            run={{
              id: session.run.id,
              status: session.run.status,
              elapsedMs: session.run.elapsedMs,
              toolCount: session.tools.length,
              failedTools: session.tools.filter((t) => t.status === 'failed' || t.status === 'denied').length,
              persistence: 'saved',
              sideEffects: session.tools.some((t) => t.id === 'op-3' && t.status === 'completed'),
              usage: { tokens: 9_600, completeness: 'estimated' },
            }}
          />
        ) : undefined
      }
    />
  );

  const intervention = session.approval ? (
    <InterventionDock>
      <ApprovalPanel
        key={session.approval.operationId}
        approval={session.approval}
        density="compact"
        onApprove={session.approve}
        onReject={session.reject}
        renderMaterial={(approval) => (approval.diff || approval.tool.detail?.kind === 'file-edit' ? <DiffPreview before="debug = true" after={'debug = false\nlog_level = "info"'} /> : null)}
      />
    </InterventionDock>
  ) : null;

  const composer = (
    <Composer
      value={value}
      onValueChange={setValue}
      placeholder="向 Agent 描述任务，@ 引用文件（示例）"
      mentionOptions={mentionOptions}
      onMentionQuery={setMentionQuery}
      references={session.references}
      onReferenceAdd={(option, name) => session.addReference({ id: option.id, kind: option.kind, label: name, detail: option.detail })}
      onRemoveReference={session.removeReference}
      onSubmit={(input) => {
        session.send(input);
        setValue('');
      }}
      submitStatus={session.submitStatus}
      runStatus={session.run.status}
      onStop={session.stop}
      blocked={session.approval?.status === 'waiting' ? '请先在上方处理审批（示例）' : undefined}
      intervention={intervention}
      toolbarEnd={
        <>
          <ContextUsage usage={sampleContextUsage} variant="ring" />
          <PermissionPicker modes={modes} value={mode} onChange={(id) => setMode(id)} />
          <ModelPicker providers={providers} selectedModel={model} onModelChange={(id) => setModel(id)} effort={effort} onEffortChange={setEffort} />
        </>
      }
    />
  );

  const context = (
    <AgentSidePane
      activeTab={tab}
      onTabChange={setTab}
      onClose={() => setContextOpen(false)}
      sections={[
        {
          id: 'summary',
          label: '摘要',
          content: (
            <div className="sc-card-list">
              <PinnedSummary summary={samplePinnedSummary} defaultExpanded />
              <ContextUsage usage={sampleContextUsage} variant="full" />
            </div>
          ),
        },
        {
          id: 'files',
          label: '产物',
          count: sampleArtifacts.length,
          content: (
            <div className="sc-card-list">
              {sampleArtifacts.map((artifact) => (
                <ArtifactCard key={artifact.id} artifact={artifact} />
              ))}
            </div>
          ),
        },
        { id: 'terminal', label: '终端', count: 1, content: <PersistentTerminal terminal={sampleTerminals[0]!} /> },
        { id: 'agents', label: '子任务', count: sampleSubagents.length, content: <SubAgentList agents={sampleSubagents} /> },
      ]}
    />
  );

  return (
    <div className="sc-agent-workbench">
      <div className="sc-row">
        <p className="sc-small" role="status">
          演示阶段（示例）：{stageLabel[session.stage]}
        </p>
        <Button size="sm" variant="secondary" onClick={session.reset}>
          重置演示
        </Button>
      </div>
      <AgentShell
        index={<ConversationList sections={session.sections} selectedId={session.selectedId} onSelect={session.select} />}
        header={
          <AgentHeader
            title={conversation?.title ?? '珊瑚礁图像分类'}
            identity={{ id: 'agent', name: 'Research agent', role: '示例 Agent' }}
            runStatus={session.run.status}
            runPhase={session.run.phase}
            syncStatus={session.run.syncStatus}
            contextOpen={contextOpen}
            onToggleContext={() => setContextOpen((open) => !open)}
            pending={session.approval?.status === 'waiting'}
          />
        }
        conversation={messageList}
        composer={composer}
        context={context}
        contextOpen={contextOpen}
        onContextOpenChange={(open) => setContextOpen(open)}
        mainLabel="对话（示例）"
        activeId={session.selectedId}
      />
    </div>
  );
}

const stageLabel: Record<ReturnType<typeof useDemoSession>['stage'], string> = {
  idle: '空闲，输入任务后按 Enter 发送',
  thinking: '思考中',
  tool: '执行工具',
  approval: '等待你批准文件修改',
  finishing: '收尾中',
  done: '本轮已结束',
};
