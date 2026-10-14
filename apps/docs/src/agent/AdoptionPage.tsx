import * as React from 'react';
import '@wzrhine/effects/styles.css';
import {
  AgentMessagesProvider,
  Composer,
  ContextUsage,
  ModelPicker,
  PermissionPicker,
  ReferencePicker,
  RunOverview,
  SkillPicker,
  TerminalList,
  ToolRecord,
} from '@wzrhine/agent';
import type { SkillOption } from '@wzrhine/agent';
import { AgentHeader, AgentShell } from '@wzrhine/agent';
import { ArchiveReveal, OrbitalDiagram, ScanSurface } from '@wzrhine/effects';
import { Button, Icon, NavGroup, NavItem, NavList, NavRail, Tree, Workbench } from '@wzrhine/react';
import { PageHeader, Specimen, SpecimenGrid } from '../ui/Specimen';

const providers = [{ id: 'local', label: '本地模型', models: [{ id: 'atlas', label: 'Atlas 14', providerId: 'local', efforts: ['low', 'medium', 'high', 'xhigh'] as const, capabilities: ['tools', 'reasoning'] as const }] }] satisfies React.ComponentProps<typeof ModelPicker>['providers'];
const skills = [{ id: 'search', label: '检索资料', source: '工作区' }, { id: 'review', label: '审阅变更', source: '内置' }] satisfies React.ComponentProps<typeof SkillPicker>['skills'];
const terminals: NonNullable<React.ComponentProps<typeof TerminalList>['terminals']> = [{ id: 'terminal-1', name: '终端 A', status: 'running', stoppable: true, source: '本轮运行', activity: '正在执行', tail: 'pnpm test' }];
const subagents: NonNullable<React.ComponentProps<typeof RunOverview>['subagents']> = [
  { id: 'child-1', name: '资料核查', task: '核对引用来源', status: 'running', phase: 'executing-tool' },
  { id: 'child-2', name: '旧记录', task: '上一轮运行快照', status: 'completed', inherited: true },
];
const permissionModes = [{ id: 'safe', label: '安全模式', risk: 'normal' as const }, { id: 'elevated', label: '增强权限', risk: 'elevated' as const }];
const demoTool = {
  id: 'tool-read-1',
  name: 'read_file',
  displayName: '读取文件',
  category: 'read' as const,
  status: 'completed' as const,
  subject: 'src/agent.tsx',
  detail: { kind: 'file-read' as const, path: 'src/agent.tsx', preview: 'export function Agent() {}', nextOffset: 128, nextOffsetUnit: 'lines' as const },
} satisfies React.ComponentProps<typeof ToolRecord>['tool'];

function AdoptionWorkbench() {
  const [indexOpen, setIndexOpen] = React.useState(true);
  const [contextOpen, setContextOpen] = React.useState(true);
  const [skillsSelected, setSkillsSelected] = React.useState<SkillOption[]>([]);
  const [referenceOpen, setReferenceOpen] = React.useState(false);
  const [overviewOpen, setOverviewOpen] = React.useState(true);
  return (
    <AgentMessagesProvider>
      <AgentShell
        indexOpen={indexOpen}
        onIndexOpenChange={setIndexOpen}
        viewKey="adoption"
        direction="forward"
        contextOpen={contextOpen}
        onContextOpenChange={setContextOpen}
        contextLabel="运行概览"
        breakpoints={{ context: 60, index: 40 }}
        rail={<NavRail aria-label="Agent 模块" collapsed><NavItem label="Agent" icon={<Icon name="MessagesSquare" />} active /><NavItem label="设置" icon={<Icon name="Settings" />} /></NavRail>}
        index={<NavList aria-label="Agent 页面"><NavGroup label="运行"><NavItem label="当前运行" active badge={<span>2</span>} /><NavItem label="历史运行" /></NavGroup><NavGroup label="资源"><NavItem label="终端" /><NavItem label="产物" /></NavGroup></NavList>}
        header={
          <AgentHeader
            title="Wpi 接入验收工作台"
            contextLabel="切换运行概览"
            actions={<Button size="sm" variant="ghost" onClick={() => setIndexOpen((open) => !open)}>{indexOpen ? '收起索引' : '打开索引'}</Button>}
          />
        }
        conversation={<div className="sc-card-list"><p>组件只接收 adapter 提供的快照，流式内容可以在阅读区独立滚动。</p><ScanSurface scanKey={skillsSelected.length}><div className="sc-effect-card"><ArchiveReveal text="RUN-0.2.0" revealed duration={480} /></div></ScanSurface><Tree label="工作区" nodes={[{ id: 'src', label: 'src', hasChildren: true, children: [{ id: 'agent', label: 'agent.tsx' }] }, { id: 'docs', label: 'docs' }]} defaultExpandedIds={['src']} /><ContextUsage usage={{ used: 12400, max: 32000, unit: 'tokens', completeness: 'estimated', estimated: true, segments: [{ id: 'input', label: '输入', value: 8200, tone: 'info' }, { id: 'output', label: '输出', value: 4200, tone: 'accent' }] }} variant="full" segmentScale="fit-used" /></div>}
        composer={<Composer allowEmptyText attachments={[{ id: 'a', name: 'screen.png', kind: 'image', status: 'ready' }]} onSubmit={() => undefined} toolbarEnd={<><SkillPicker skills={skills} selected={skillsSelected} onChange={setSkillsSelected} max={4} /><ReferencePicker open={referenceOpen} onOpenChange={setReferenceOpen} value="src/agent.tsx" items={[{ path: 'src/agent.tsx', name: 'agent.tsx', kind: 'file' }]} onAdd={async () => true} /></>} />}
        context={<RunOverview open={overviewOpen} onOpenChange={setOverviewOpen} facts={[{ label: '模型', value: 'Atlas 14 · 极深' }, { label: '上下文', value: '12.4K / 32K' }]} subagents={subagents} terminals={<TerminalList terminals={terminals} total={1} />} sections={[{ id: 'notes', title: '运行事实', content: <p>权限、消息与用量均来自当前快照。</p> }]} />}
      />
    </AgentMessagesProvider>
  );
}

export function AdoptionPage() {
  const [selected, setSelected] = React.useState(false);
  return (
    <div className="sc-page">
      <PageHeader index="38" section="Agent UI" title="Wpi adoption readiness">
        <p>Showcase 现在包含 0.2.0 接入前的组件与动效验收路径：工作台、导航、树、Composer、选择器、工具上下文、运行概览、终端和三种一次性效果都由公开入口驱动。</p>
      </PageHeader>
      <SpecimenGrid>
        <Specimen id="agent-adoption-workbench" index="01" title="完整接入工作台" note="在 320–1920px 宽度下检查索引收起、焦点回退、滚动归属和受控面板状态。">
          <div className="sc-agent-workbench"><AdoptionWorkbench /></div>
        </Specimen>
        <Specimen id="agent-adoption-motion" index="02" title="一次性动效与选中态" span="half" align="start" note="ArchiveReveal、ScanSurface 与 OrbitalDiagram 都先渲染真实内容；页面隐藏或减少动效时停止。">
          <div className="sc-card-list">
            <OrbitalDiagram size={280} label="接入阶段" selectedLabel="当前" nodes={[{ id: 'a', label: '契约', ring: 0, angle: 20 }, { id: 'b', label: '组件', ring: 1, angle: 145, selected }, { id: 'c', label: '验收', ring: 2, angle: 280, tone: 'success' }]} />
            <Button size="sm" variant="secondary" onClick={() => setSelected((value) => !value)} aria-pressed={selected}>切换选中节点</Button>
          </div>
        </Specimen>
        <Specimen id="agent-adoption-contracts" index="03" title="接入标准" span="half" align="start">
          <ul className="sc-rules"><li data-kind="do">所有异步动作携带稳定 actionId 与回执状态</li><li data-kind="do">材料不完整或统计不可靠时明确提示，不猜测事实</li><li data-kind="do">Provider、消息表和 CSS 入口可独立 tree-shake</li><li data-kind="dont">不在 Wpi 复制组件视觉 CSS 或动效实现</li></ul>
        </Specimen>
        <Specimen id="agent-adoption-react-foundation" index="04" title="React 外壳与导航" note="同页同时展示可下沉的 Workbench、导航、树与拖动句柄；Wpi 只需注入路由内容。">
          <div style={{ minHeight: '15rem' }}>
            <Workbench
              indexLabel="接入索引"
              mainLabel="接入内容"
              rail={<NavRail aria-label="公共模块" collapsed><NavItem label="Agent" icon={<Icon name="MessagesSquare" />} active /><NavItem label="设置" icon={<Icon name="Settings" />} /></NavRail>}
              index={<NavList aria-label="公共分类"><NavGroup label="Agent"><NavItem label="运行" active /><NavItem label="工具" /></NavGroup></NavList>}
              header={<strong>React foundation</strong>}
            >
              <p>Workbench 的 header、index、reading column 和 ResizeHandle 都来自公共入口。</p>
            </Workbench>
          </div>
        </Specimen>
        <Specimen id="agent-adoption-async" index="05" title="模型、权限与工具材料" span="half" align="start" note="ModelPicker / PermissionPicker 的回执由宿主控制；ToolRecord 只渲染已交付的材料。">
          <div className="sc-card-list">
            <div className="sc-row"><ModelPicker providers={providers} selectedModel="atlas" effort="medium" /><PermissionPicker modes={permissionModes} value="safe" onChange={() => undefined} /></div>
            <ToolRecord tool={demoTool} defaultExpanded />
          </div>
        </Specimen>
      </SpecimenGrid>
    </div>
  );
}
