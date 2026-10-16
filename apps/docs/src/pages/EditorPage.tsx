import * as React from 'react';
import '@wzrhine/content/styles.css';
import '@wzrhine/editor/styles.css';
import { Button, Workbench } from '@wzrhine/react';
import { SectionIndex } from '@wzrhine/patterns';
import { useMediaQuery } from '../app/settings';
import {
  DocumentTabs,
  EditorMessagesProvider,
  EditorModeView,
  EditorToolbar,
  SaveStatus,
  editorZhCN,
  type DocumentTab,
  type EditorCommand,
  type EditorHost,
  type SaveStatusKind,
} from '@wzrhine/editor';
import { createCodeMirrorAdapter } from '@wzrhine/editor/codemirror';
import { extractHeadings } from '@wzrhine/content';
import { PageHeader, Specimen, SpecimenGrid } from '../ui/Specimen';

const fixtureDocuments = [
  {
    id: 'writing-workbench',
    title: '写作工作台.md',
    source: ['# 写作工作台', '', '这是一个本地 fixture 文档，用来验证 Markdown 源码、预览和分栏模式。', '', '## 设计原则', '', '- Markdown 原文是唯一事实源', '- 预览由内容层渲染', '- WYSIWYM 暂不接入', '', '## 下一步', '', '继续补充编辑器命令、保存与冲突处理。'].join('\n'),
  },
  {
    id: 'field-notes',
    title: '田野笔记.md',
    source: ['# 田野笔记', '', '记录来自本地静态 fixture。', '', '## 观察', '', '> 先建立稳定的源码流，再扩展更高阶的编辑体验。'].join('\n'),
  },
] as const;

type FixtureDocument = (typeof fixtureDocuments)[number];

function initialSources(): Record<string, string> {
  return Object.fromEntries(fixtureDocuments.map((document) => [document.id, document.source]));
}

function EditorFixture() {
  const isWide = useMediaQuery('(min-width: 1024px)');
  const [documents, setDocuments] = React.useState<readonly FixtureDocument[]>(fixtureDocuments);
  const [activeId, setActiveId] = React.useState<string>(fixtureDocuments[0]!.id);
  const [sources, setSources] = React.useState<Record<string, string>>(initialSources);
  const [mode, setMode] = React.useState<'source' | 'preview' | 'split'>('split');
  const [saveStatus, setSaveStatus] = React.useState<SaveStatusKind>('clean');
  const [closeRequest, setCloseRequest] = React.useState<DocumentTab | null>(null);
  const [lastAction, setLastAction] = React.useState('等待编辑操作');
  const hostRef = React.useRef<EditorHost | null>(null);
  const adapter = React.useMemo(() => {
    const base = createCodeMirrorAdapter();
    return {
      create(container: HTMLElement, options: Parameters<typeof base.create>[1]) {
        const host = base.create(container, options);
        hostRef.current = host;
        return {
          ...host,
          destroy() {
            host.destroy();
            if (hostRef.current === host) hostRef.current = null;
          },
        };
      },
    };
  }, []);

  const activeDocument = documents.find((document) => document.id === activeId) ?? documents[0]!;
  const source = sources[activeDocument.id] ?? '';
  const dirty = source !== activeDocument.source;
  const headings = React.useMemo(() => extractHeadings(source).map((heading) => ({ id: heading.id, label: heading.text })), [source]);
  const tabs = documents.map((document) => ({ id: document.id, title: document.title, dirty: sources[document.id] !== document.source, closable: documents.length > 1 }));

  const updateSource = React.useCallback((next: string) => {
    setSources((previous) => ({ ...previous, [activeDocument.id]: next }));
    setSaveStatus('dirty');
    setLastAction('Markdown 原文已更新');
  }, [activeDocument.id]);

  const closeDocument = React.useCallback((id: string) => {
    setDocuments((previous) => {
      const index = previous.findIndex((document) => document.id === id);
      const next = previous.filter((document) => document.id !== id);
      if (id === activeId && next.length > 0) setActiveId(next[index]?.id ?? next[index - 1]!.id);
      return next;
    });
    setCloseRequest(null);
    setLastAction('已关闭 fixture 文档');
  }, [activeId]);

  const dispatchCommand = (command: EditorCommand) => {
    if (command.type === 'undo' || command.type === 'redo' || command.type === 'toggle-mark' || command.type === 'set-heading' || command.type === 'toggle-list' || command.type === 'insert-link' || command.type === 'insert-text') {
      const dispatched = hostRef.current?.dispatch(command) ?? false;
      setLastAction(dispatched ? `已执行 ${command.type}` : '当前模式没有可用的源码焦点');
    }
  };

  const toolbarCommands = [
    { id: 'undo', label: '撤销', command: { type: 'undo' } as const, shortcut: 'Mod-Z' },
    { id: 'redo', label: '重做', command: { type: 'redo' } as const, shortcut: 'Mod-Shift-Z' },
    { id: 'bold', label: '粗体', command: { type: 'toggle-mark', mark: 'bold' } as const, shortcut: 'Mod-B' },
    { id: 'heading', label: '二级标题', command: { type: 'set-heading', level: 2 } as const },
    { id: 'bullet', label: '无序列表', command: { type: 'toggle-list', kind: 'bullet' } as const },
  ];

  return (
    <EditorMessagesProvider messages={editorZhCN}>
      <Workbench
        className="sc-editor-workbench"
        indexOpen={isWide}
        indexLabel="文档章节"
        mainLabel="Markdown 写作工作台"
        index={<SectionIndex sections={headings} label="文档章节" />}
        header={
          <DocumentTabs
            tabs={tabs}
            activeId={activeDocument.id}
            onActiveChange={setActiveId}
            onCloseRequest={(tab) => {
              if (tab.dirty) setCloseRequest(tab);
              else closeDocument(tab.id);
            }}
          />
        }
      >
        <div className="sc-editor-workbench__content">
          <EditorModeView
            mode={mode}
            source={source}
            adapter={adapter}
            onModeChange={setMode}
            onChange={(change) => updateSource(change.source)}
            onSelectionChange={() => undefined}
            onCompositionChange={(composing) => setLastAction(composing ? '正在输入组合字符' : '组合输入已完成')}
            onLinkActivate={(href) => setLastAction(`已打开安全链接：${href}`)}
            toolbar={
              <EditorToolbar
                commands={toolbarCommands}
                onCommand={dispatchCommand}
                readOnly={saveStatus === 'conflict'}
                composing={lastAction === '正在输入组合字符'}
                toolbarEnd={
                  <div className="sc-editor-toolbar-actions">
                    <Button size="sm" variant="secondary" onClick={() => setSaveStatus('error')}>模拟保存失败</Button>
                    <Button size="sm" variant="ghost" onClick={() => setSaveStatus('conflict')}>模拟冲突</Button>
                  </div>
                }
              />
            }
            status={
              <div className="sc-editor-status-row">
                <SaveStatus
                  status={saveStatus}
                  onRetry={() => { setSaveStatus(dirty ? 'dirty' : 'saved'); setLastAction('已重试保存'); }}
                  onResolveConflict={() => { setSaveStatus('dirty'); setLastAction('冲突保留本地 Markdown 原文'); }}
                />
                <span className="sc-editor-fixture-note" role="status" aria-live="polite">{lastAction}</span>
              </div>
            }
          />
          {closeRequest && (
            <div className="sc-editor-close-guard" role="alertdialog" aria-label="关闭未保存文档">
              <p>{closeRequest.title} 有未保存的 Markdown 更改。</p>
              <Button size="sm" tone="danger" onClick={() => closeDocument(closeRequest.id)}>放弃更改并关闭</Button>
              <Button size="sm" variant="ghost" onClick={() => setCloseRequest(null)}>取消</Button>
            </div>
          )}
        </div>
      </Workbench>
    </EditorMessagesProvider>
  );
}

export function EditorPage() {
  return (
    <div className="sc-page">
      <PageHeader index="42" section="Data & Archive" title="Markdown writing workbench">
        <p>本页是写作工作台的静态 fixture：DocumentTabs、EditorToolbar、CodeMirror 源码层、PreviewPane 和 source/preview/split 模式共享同一个 Markdown 原文。WYSIWYM 暂不接入。</p>
      </PageHeader>
      <SpecimenGrid>
        <Specimen id="editor-workbench" index="01" title="写作工作台 recipe" note="所有保存、冲突和关闭动作都由页面内存状态模拟，不读取文件、不调用网络。">
          <EditorFixture />
        </Specimen>
      </SpecimenGrid>
    </div>
  );
}
