import * as React from 'react';
import '@wzrhine/effects/styles.css';
import { MotionPlayer } from '@wzrhine/effects';
import type { MotionDemoProps } from '@wzrhine/effects';
import {
  AgentEntrance,
  AgentSpark,
  AgentStatus,
  ApprovalPanel,
  JumpToLatest,
  SendStopButton,
  ThinkingBlock,
  ToolRecord,
  runPhaseMeta,
  useAgentMessages,
} from '@wzrhine/agent';
import type { RunPhase, SparkPhase } from '@wzrhine/agent';
import { PageHeader, Specimen, SpecimenGrid } from '../ui/Specimen';
import { sampleApproval, sampleTools } from '../../../../packages/agent/src/fixtures/session';

/*
 * Agent motion catalogue (ADR-0012). Each pattern is shown in the four review lanes
 * (Default / Slow ×0.25 / Reduced / Interrupt) of the effects MotionPlayer. Sample data only.
 */

const sparkPhases: SparkPhase[] = ['thinking', 'responding', 'executing', 'waiting', 'done', 'error', 'idle'];
const phases: RunPhase[] = ['thinking', 'responding', 'executing-tool', 'waiting-approval', 'compacting', 'cancelling'];

function SparkMatrix() {
  const labels = useAgentMessages().status;
  return (
    <ul className="sc-agent-motion-grid" aria-label="AgentSpark 阶段（示例）">
      {sparkPhases.map((phase) => (
        <li key={phase}>
          <AgentSpark phase={phase} size="md" />
          <span className="sc-small">{phase}</span>
        </li>
      ))}
      {phases.map((phase) => (
        <li key={phase}>
          <AgentStatus glyph={runPhaseMeta[phase].glyph} tone={runPhaseMeta[phase].tone} active={runPhaseMeta[phase].active} label={labels.phase[phase]} />
        </li>
      ))}
    </ul>
  );
}

function EntranceDemo({ active }: MotionDemoProps) {
  return (
    <div className="sc-lab-slot">
      {active ? (
        <ul className="sc-lab-list" aria-label="新到达的工具行（示例）">
          {sampleTools.slice(0, 4).map((tool, index) => (
            <AgentEntrance key={tool.id} as="li" kind="row" index={index}>
              <span className="sc-mono-sm">{tool.name}</span>
            </AgentEntrance>
          ))}
        </ul>
      ) : (
        <p className="sc-small sc-muted">（等待新行）</p>
      )}
    </div>
  );
}

function CardDemo({ active }: MotionDemoProps) {
  return (
    <div className="sc-lab-slot">
      {active ? (
        <AgentEntrance kind="card">
          <ApprovalPanel approval={sampleApproval} density="compact" onApprove={() => undefined} onReject={() => undefined} />
        </AgentEntrance>
      ) : (
        <p className="sc-small sc-muted">（无待审批）</p>
      )}
    </div>
  );
}

function DisclosureDemo({ active }: MotionDemoProps) {
  return (
    <div className="sc-lab-slot">
      <ToolRecord tool={sampleTools[0]!} expanded={active} onExpandedChange={() => undefined} />
    </div>
  );
}

function ThinkingDemo({ active }: MotionDemoProps) {
  return (
    <div className="sc-lab-slot">
      <ThinkingBlock
        thinking={{ id: 'th-demo', label: '思考 1', status: 'streaming', summary: '先读取样本清单，再确认图片数量（示例）。', latestLine: '正在核对输入目录…', elapsedMs: 4200 }}
        expanded={active}
        onExpandedChange={() => undefined}
      />
    </div>
  );
}

function SendStopDemo({ active }: MotionDemoProps) {
  return (
    <div className="sc-lab-slot">
      <SendStopButton canSend runStatus={active ? 'running' : 'idle'} onSend={() => undefined} onStop={() => undefined} />
    </div>
  );
}

function JumpDemo({ active }: MotionDemoProps) {
  return (
    <div className="sc-lab-slot sc-agent-jump-slot">
      <JumpToLatest atLatest={!active} unreadCount={3} onJump={() => undefined} />
    </div>
  );
}

export function AgentMotionPage() {
  return (
    <>
      <PageHeader index="37" section="Agent UI" title="Agent motion">
        <p>
          Agent 动效全部来自 Rhine 预设与生命周期（ADR-0012）：首次出现才入场、折叠走高度过渡、循环只在页面可见且元素在视口内时运行，减动时保留全部信息。下面每个模式都有 Default / Slow ×0.25 / Reduced / Interrupt 四组对照。
        </p>
      </PageHeader>
      <SpecimenGrid>
        <Specimen id="agent-spark" index="M1" title="AgentSpark 与阶段状态" note="CSS keyframes，周期 = loop × 1–2；不可见、离屏、减动时停在各自的静态帧。">
          <SparkMatrix />
        </Specimen>
        <Specimen id="agent-entrance" index="M2" title="工具行入场（错峰）" note="opacity + 4px 上移，fast；每项 24ms，封顶 120ms；减动无位移。">
          <MotionPlayer title="AgentEntrance row" demo={EntranceDemo} />
        </Specimen>
        <Specimen id="agent-card" index="M3" title="审批卡入场" note="opacity + 8px 上移 + scale .985，panel；减动无位移缩放。">
          <MotionPlayer title="AgentEntrance card" demo={CardDemo} />
        </Specimen>
        <Specimen id="agent-disclosure" index="M4" title="工具详情折叠" note="Collapsible 高度过渡（base），中途切换从当前高度反向。">
          <MotionPlayer title="ToolRecord disclosure" demo={DisclosureDemo} />
        </Specimen>
        <Specimen id="agent-thinking" index="M5" title="思考块展开" note="与工具详情同一套高度过渡；流式预览不重放入场。">
          <MotionPlayer title="ThinkingBlock" demo={ThinkingDemo} />
        </Specimen>
        <Specimen id="agent-send-stop" index="M6" title="发送 ↔ 停止" note="同一个按钮，两枚图标交叉淡入（base / fast），焦点不丢失；减动直接替换。">
          <MotionPlayer title="SendStopButton" demo={SendStopDemo} />
        </Specimen>
        <Specimen id="agent-jump" index="M7" title="返回最新消息" note="MotionPresence fade（fast）；出现时不抢焦点。">
          <MotionPlayer title="JumpToLatest" demo={JumpDemo} />
        </Specimen>
      </SpecimenGrid>
    </>
  );
}
