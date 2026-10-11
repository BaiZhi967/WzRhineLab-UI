import * as React from 'react';
import { PageHeader, Specimen, SpecimenGrid } from '../ui/Specimen';
import { hrefFor } from '../app/routes';
import type { RouteId } from '../app/routes';
import { AgentWorkbench } from './workbench/AgentWorkbench';

/*
 * Agent UI overview: the integrated workbench plus an index that maps every concept-atlas entry
 * (docs/concepts/agent, 46 components) to the component that implements it.
 */

const atlas: { group: string; route: RouteId; items: [number, string, string][] }[] = [
  {
    group: '工作台',
    route: 'agent-shell',
    items: [
      [1, 'AgentShell', 'AgentShell + ResizeHandle'],
      [2, 'AgentHeader', 'AgentHeader'],
      [3, 'ConversationList', 'ConversationList'],
      [4, 'ConversationRow', 'ConversationRow'],
      [26, 'AgentSidePane', 'AgentSidePane'],
    ],
  },
  {
    group: '对话与思考',
    route: 'agent-message',
    items: [
      [5, 'AgentMessage', 'AgentMessage + MessageActions'],
      [6, 'MessagePart', 'MessagePart（13 类）+ CodeBlock'],
      [7, 'MessageList', 'MessageList'],
      [8, 'ThinkingBlock', 'ThinkingBlock'],
      [9, 'AgentProcess', 'AgentProcess'],
      [10, 'RunStatus', 'RunStatus'],
      [25, 'AgentSpark', 'AgentSpark'],
      [32, 'CitationChip', 'CitationChip'],
      [35, 'JumpToLatest', 'JumpToLatest'],
    ],
  },
  {
    group: '工具与执行',
    route: 'agent-tools',
    items: [
      [11, 'ToolActivity', 'ToolActivity'],
      [12, 'ToolRecord', 'ToolRecord'],
      [13, 'CodeModeToolTree', 'CodeModeToolTree'],
      [31, 'DiffPreview', 'DiffPreview + MultiFileDiff'],
      [37, 'FileReadTool', 'FileReadDetail'],
      [38, 'FileWriteTool', 'FileWriteDetail'],
      [39, 'EditFileTool', 'EditFileDetail'],
      [40, 'ApplyPatchTool', 'ApplyPatchDetail'],
      [41, 'ManageFilesTool', 'ManageFilesDetail'],
      [42, 'RunCommandTool', 'RunCommandDetail'],
      [43, 'MCPExecuteTool', 'MCPExecuteDetail'],
      [44, 'NativeModelTool', 'NativeModelDetail'],
      [45, 'ToolOutput', 'ToolOutput'],
      [46, 'ToolHistory', 'ToolHistory'],
    ],
  },
  {
    group: '输入与选择',
    route: 'agent-composer',
    items: [
      [14, 'Composer', 'Composer + ComposerInput'],
      [15, 'MentionMenu', 'MentionMenu'],
      [16, 'SlashCommandMenu', 'SlashCommandMenu'],
      [17, 'AttachmentList', 'AttachmentList'],
      [18, 'SendStopButton', 'SendStopButton'],
      [19, 'ModelPicker', 'ModelPicker + PermissionPicker'],
    ],
  },
  {
    group: '人工干预与恢复',
    route: 'agent-intervention',
    items: [
      [20, 'ApprovalPanel', 'ApprovalPanel + InterventionDock'],
      [21, 'QuestionnaireCard', 'QuestionnaireCard'],
      [34, 'ErrorRecoveryNotice', 'ErrorRecoveryNotice'],
    ],
  },
  {
    group: '终端、子任务、上下文与产物',
    route: 'agent-workspace',
    items: [
      [22, 'PersistentTerminal', 'PersistentTerminal + TerminalTabs'],
      [23, 'TerminalRow', 'TerminalRow + TerminalList'],
      [24, 'SubAgentCard', 'SubAgentCard + SubAgentList'],
      [27, 'ContextUsage', 'ContextUsage'],
      [28, 'PinnedSummary', 'PinnedSummary'],
      [29, 'ArtifactCard', 'ArtifactCard + ArtifactList'],
      [30, 'FilePreview', 'FilePreview'],
      [33, 'ActivityLedger', 'ActivityLedger'],
      [36, 'RunSummary', 'RunSummary + CompactionNotice'],
    ],
  },
];

export function AgentOverviewPage() {
  const total = atlas.reduce((n, g) => n + g.items.length, 0);
  return (
    <>
      <PageHeader index="30" section="Agent UI" title="Agent workbench">
        <p>
          <code>@wzrhine/agent</code> 的完整工作台：会话索引、消息流、工具记录、审批、Composer 与上下文面板由同一个示例 adapter 驱动。输入任务后按 Enter，演示会依次经过思考、执行工具、等待批准与收尾。所有数据都是示例。
        </p>
      </PageHeader>
      <SpecimenGrid>
        <Specimen
          id="agent-workbench"
          index="W1"
          title="集成工作台"
          description="组件只接收快照并发出动作；演示 adapter 把动作转成下一份快照（ADR-0011 §1）。"
          note="宽屏三栏；窄于约 64rem 时上下文面板变成抽屉，窄于约 40rem 时会话索引也变成抽屉。"
        >
          <AgentWorkbench />
        </Specimen>
        <Specimen id="agent-atlas" index="W2" title={`概念图册覆盖（${total} / 46）`} description="docs/concepts/agent 中每个组件对应的实现与展示页。">
          <div className="sc-table-wrap">
            <table className="sc-agent-atlas">
              <caption className="sc-small">图册编号 → 组件</caption>
              <thead>
                <tr>
                  <th scope="col">编号</th>
                  <th scope="col">图册组件</th>
                  <th scope="col">实现</th>
                  <th scope="col">分组</th>
                </tr>
              </thead>
              <tbody>
                {atlas.flatMap((g) =>
                  g.items
                    .slice()
                    .sort((a, b) => a[0] - b[0])
                    .map(([n, name, impl]) => (
                      <tr key={n}>
                        <td className="sc-mono-sm">{String(n).padStart(2, '0')}</td>
                        <td>{name}</td>
                        <td>
                          <code>{impl}</code>
                        </td>
                        <td>
                          <a href={hrefFor(g.route)}>{g.group}</a>
                        </td>
                      </tr>
                    )),
                )}
              </tbody>
            </table>
          </div>
        </Specimen>
      </SpecimenGrid>
    </>
  );
}
