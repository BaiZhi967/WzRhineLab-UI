import * as React from 'react';
import {
  AgentHeader,
  AgentMessage,
  AgentShell,
  AgentSidePane,
  ApprovalPanel,
  ArtifactCard,
  Composer,
  ContextUsage,
  ConversationList,
  DiffPreview,
  InterventionDock,
  MessageList,
  PersistentTerminal,
  SubAgentList,
  ToolActivity,
  ToolRecord,
} from '@wzrhine/agent';
import type { ApprovalView, ArtifactView, ComposerToken, MentionOption, ReferenceView, ToolCallView } from '@wzrhine/agent';
import { useAgentConsole } from './adapter/adapter';
import type { AdapterLogEntry } from './adapter/adapter';
import type { AppCopy } from './copy';
import { sampleContextUsage, sampleFiles, sampleSubagents } from './sampleData';

/*
 * One complete console: its own adapter (and so its own mock runtime), composer draft, references,
 * pane state and adapter log. Rendering it twice proves there is no shared module state.
 */

const renderTool = (tool: ToolCallView) => <ToolRecord tool={tool} />;
const renderArtifact = (artifact: ArtifactView) => <ArtifactCard artifact={artifact} headingLevel={4} />;

function renderMaterial(approval: ApprovalView) {
  const detail = approval.tool.detail;
  if (detail?.kind !== 'file-edit') return null;
  const edit = detail.edits[0];
  if (!edit) return null;
  return <DiffPreview path={detail.path} before={edit.before} after={edit.after} status="proposed" />;
}

const ACTIVE = ['queued', 'running', 'waiting', 'cancelling'];

export interface AgentConsoleProps {
  /** Short instance name used in landmark labels and test hooks. */
  instance: 'primary' | 'secondary';
  copy: AppCopy;
  initialConversation?: string;
}

export function AgentConsole({ instance, copy, initialConversation }: AgentConsoleProps) {
  const session = useAgentConsole(initialConversation);
  const name = copy.instance[instance];
  const [value, setValue] = React.useState('');
  const [references, setReferences] = React.useState<ReferenceView[]>([]);
  const [contextOpen, setContextOpen] = React.useState(true);
  const [tab, setTab] = React.useState('context');

  const running = ACTIVE.includes(session.run.status);
  const approval = session.approval;
  const approvalOpen = approval !== undefined && (approval.status === 'waiting' || approval.status === 'submitting' || approval.status === 'unknown');

  const addReference = (option: MentionOption, tokenName: string) =>
    setReferences((current) => (current.some((r) => r.id === option.id) ? current : [...current, { id: option.id, kind: option.kind, label: tokenName, detail: option.detail, status: 'ready' }]));
  const removeReference = (reference: ReferenceView) => setReferences((current) => current.filter((r) => r.id !== reference.id));
  const onTokenRemoved = (token: ComposerToken) => setReferences((current) => current.filter((r) => r.label !== token.name));

  const messageList = (
    <MessageList
      messages={session.messages}
      isStreaming={running}
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
    />
  );

  const intervention = approval ? (
    <InterventionDock>
      <ApprovalPanel
        key={approval.operationId}
        approval={approval}
        density="compact"
        headingLevel={4}
        onApprove={session.approve}
        onReject={session.reject}
        renderMaterial={renderMaterial}
      />
    </InterventionDock>
  ) : null;

  const composer = (
    <Composer
      id={`console-${instance}-composer`}
      aria-label={copy.composerLabel(name)}
      value={value}
      onValueChange={setValue}
      placeholder={copy.placeholder}
      mentionOptions={sampleFiles}
      references={references}
      onReferenceAdd={addReference}
      onRemoveReference={removeReference}
      onTokenRemoved={onTokenRemoved}
      onSubmit={(input) => {
        void session.send(input).then((result) => {
          if (result.status !== 'accepted') return;
          setValue('');
          setReferences([]);
        });
      }}
      submitStatus={session.submitReceipt}
      runStatus={session.run.status}
      onStop={() => void session.stop()}
      stopStatus={session.stopReceipt}
      blocked={approvalOpen ? copy.blockedByApproval : undefined}
      intervention={intervention}
    />
  );

  const context = (
    <AgentSidePane
      label={copy.paneLabel(name)}
      headingLevel={3}
      activeTab={tab}
      onTabChange={setTab}
      sections={[
        { id: 'context', label: copy.tabs.context, content: <ContextUsage usage={sampleContextUsage} variant="full" /> },
        { id: 'terminal', label: copy.tabs.terminal, count: 1, content: <PersistentTerminal terminal={session.terminal} headingLevel={4} /> },
        {
          id: 'agents',
          label: copy.tabs.agents,
          count: sampleSubagents.length,
          content: <SubAgentList agents={sampleSubagents} title={copy.subagentsTitle} headingLevel={5} />,
        },
      ]}
    />
  );

  return (
    <div className="console" data-instance={instance}>
      <div className="console__frame" data-size={instance === 'secondary' ? 'small' : undefined}>
        <AgentShell
          index={
            <ConversationList
              sections={session.sections}
              selectedId={session.selectedId}
              onSelect={session.select}
              headingLevel={3}
              label={copy.indexLabel(name)}
            />
          }
          header={
            <AgentHeader
              title={session.conversation?.title}
              identity={{ id: `agent-${instance}`, name: '研究助手（示例）', role: copy.agentRole }}
              runStatus={session.run.status}
              runPhase={session.run.phase}
              syncStatus={session.run.syncStatus}
              pending={approvalOpen}
              headingLevel={3}
            />
          }
          conversation={messageList}
          composer={composer}
          context={context}
          contextOpen={contextOpen}
          onContextOpenChange={(open) => setContextOpen(open)}
          mainLabel={copy.mainLabel(name)}
          indexLabel={copy.indexLabel(name)}
          contextLabel={copy.paneLabel(name)}
          activeId={session.selectedId}
        />
      </div>
      <AdapterLog entries={session.log} title={copy.logTitle(name)} hint={copy.logHint} instance={instance} />
    </div>
  );
}

function AdapterLog({ entries, title, hint, instance }: { entries: AdapterLogEntry[]; title: string; hint: string; instance: string }) {
  const titleId = `adapter-log-${instance}-title`;
  const shown = [...entries].reverse();
  return (
    <section className="console-log" aria-labelledby={titleId} data-testid={`adapter-log-${instance}`}>
      <h3 id={titleId} className="console-log__title">
        {title}
      </h3>
      <p className="console-log__hint">{hint}</p>
      <div className="console-log__scroll" tabIndex={0} role="region" aria-labelledby={titleId}>
        <ol className="console-log__list" reversed>
          {shown.map((entry) => (
            <li key={entry.id} className="console-log__entry" data-kind={entry.kind} data-command={entry.command} data-action-id={entry.actionId}>
              <span className="console-log__kind">{entry.kind}</span>
              <span className="console-log__text">{entry.text}</span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
