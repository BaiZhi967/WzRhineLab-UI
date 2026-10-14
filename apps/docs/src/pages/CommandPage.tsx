import * as React from 'react';
import { Button, Combobox, CommandPalette, FileDropZone, MenuItem, MenuSeparator, ScrollArea, SplitButton } from '@wzrhine/react';
import type { CommandItem, ComboboxOption, FileRejection } from '@wzrhine/react';
import { FileText } from '../icons';
import { PageHeader, Specimen, SpecimenGrid } from '../ui/Specimen';

/** Sample archive categories (示例), grouped, with one disabled option. */
const categories: ComboboxOption[] = [
  { value: 'exp', label: '实验记录', group: '记录（示例）', description: '按批次归档' },
  { value: 'obs', label: '观测日志', group: '记录（示例）' },
  { value: 'review', label: '复核意见', group: '记录（示例）' },
  { value: 'spec', label: '样本档案', group: '样本（示例）' },
  { value: 'sealed', label: '封存样本', group: '样本（示例）', disabled: true, description: '需要档案管理员权限' },
  { value: 'device', label: '设备台账', group: '设施（示例）' },
  { value: 'calib', label: '校准证书', group: '设施（示例）' },
];

/** A fixed list "searched" with a simulated delay; no network request is made. */
const remoteRecords: ComboboxOption[] = Array.from({ length: 12 }, (_, i) => ({
  value: `ARC-${1020 + i}`,
  label: `ARC-${1020 + i} · 示例记录 ${i + 1}`,
}));

function BasicCombobox() {
  const [value, setValue] = React.useState<string | null>(null);
  const label = categories.find((c) => c.value === value)?.label;
  return (
    <div className="sc-card-list">
      <Combobox
        label="档案类别"
        description="输入关键字筛选；↓ 展开，Enter 选择。"
        items={categories}
        value={value}
        onValueChange={setValue}
        name="category"
        placeholder="例如：样本"
      />
      <p className="sc-small" aria-live="polite">
        当前值：{value ? `${value}（${label}）` : '未选择'}
      </p>
    </div>
  );
}

function AsyncCombobox() {
  const [query, setQuery] = React.useState('');
  const [results, setResults] = React.useState<ComboboxOption[]>([]);
  const [loading, setLoading] = React.useState(false);
  const timer = React.useRef<number | undefined>(undefined);
  React.useEffect(() => () => window.clearTimeout(timer.current), []);
  const search = (next: string) => {
    setQuery(next);
    window.clearTimeout(timer.current);
    const trimmed = next.trim();
    if (trimmed === '') {
      setLoading(false);
      setResults([]);
      return;
    }
    setLoading(true);
    // Simulated latency; the latest query wins because earlier timers are cleared.
    timer.current = window.setTimeout(() => {
      setResults(remoteRecords.filter((r) => r.label.toLowerCase().includes(trimmed.toLowerCase())));
      setLoading(false);
    }, 600);
  };
  return (
    <Combobox
      label="远程检索（模拟）"
      description="filter={null}：结果由调用方提供，延迟 600ms 为模拟。"
      items={results}
      filter={null}
      loading={loading}
      inputValue={query}
      onInputValueChange={search}
      placeholder="例如：1024"
    />
  );
}

function StateCombobox() {
  return (
    <div className="sc-card-list">
      <Combobox label="复核类别" items={categories} invalid error="请选择复核类别（示例错误）。" />
      <Combobox label="小尺寸" size="sm" items={categories} defaultValue="obs" />
      <Combobox label="已禁用" items={categories} defaultValue="exp" disabled />
    </div>
  );
}

const commands: CommandItem[] = [
  { id: 'new-record', label: '新建实验记录', group: '记录（示例）', shortcut: 'Ctrl N', keywords: ['create', 'new'] },
  { id: 'export', label: '导出当前档案', group: '记录（示例）', description: '导出为 CSV（示例）', keywords: ['csv', 'export'] },
  { id: 'review', label: '提交复核', group: '记录（示例）', keywords: ['review'] },
  { id: 'theme', label: '切换明暗主题', group: '界面（示例）', keywords: ['theme', 'dark'] },
  { id: 'density', label: '切换紧凑密度', group: '界面（示例）', keywords: ['density', 'compact'] },
  { id: 'purge', label: '清除本地缓存', group: '系统（示例）', disabled: true, disabledReason: '需要管理员权限（示例）' },
];

function PaletteDemo() {
  const [last, setLast] = React.useState<CommandItem | null>(null);
  return (
    <div className="sc-card-list">
      <div className="sc-row">
        <CommandPalette
          hotkey="mod+k"
          commands={commands}
          onSelect={(command) => setLast(command)}
          trigger={<Button variant="secondary">打开命令面板</Button>}
        />
        <span className="sc-small">
          快捷键 <kbd>Ctrl K</kbd> / <kbd>⌘ K</kbd>
        </span>
      </div>
      <p className="sc-small" aria-live="polite" data-testid="last-command">
        上次执行：{last ? last.label : '无'}
      </p>
    </div>
  );
}

/** Sample "server" index searched with a simulated delay; no network request is made. */
const remoteCommands: CommandItem[] = Array.from({ length: 10 }, (_, i) => ({
  id: `open-${1020 + i}`,
  label: `打开 ARC-${1020 + i}`,
  description: `示例记录 ${i + 1}`,
  group: '远程结果（示例）',
  meta: `${i + 2} 天前`,
  icon: <FileText />,
}));

function AsyncPaletteDemo() {
  const [query, setQuery] = React.useState('');
  const [results, setResults] = React.useState<CommandItem[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [last, setLast] = React.useState('');
  const timer = React.useRef<number | undefined>(undefined);
  React.useEffect(() => () => window.clearTimeout(timer.current), []);
  const search = (next: string) => {
    setQuery(next);
    window.clearTimeout(timer.current);
    const trimmed = next.trim();
    if (trimmed === '') {
      setLoading(false);
      setResults([]);
      return;
    }
    setLoading(true);
    // Simulated latency; the latest query wins because earlier timers are cleared.
    timer.current = window.setTimeout(() => {
      setResults(remoteCommands.filter((c) => c.label.includes(trimmed)));
      setLoading(false);
    }, 600);
  };
  return (
    <div className="sc-card-list">
      <CommandPalette
        title="远程命令搜索"
        placeholder="例如：1024"
        commands={results}
        filter={null}
        query={query}
        onQueryChange={search}
        loading={loading}
        emptyText={query.trim() === '' ? '输入编号开始搜索（示例）' : undefined}
        onSelect={(command) => setLast(command.label)}
        trigger={<Button variant="secondary">远程搜索记录</Button>}
      />
      <p className="sc-small" aria-live="polite" data-testid="async-query">
        查询：{query === '' ? '（空）' : query} · 上次执行：{last || '无'}
      </p>
    </div>
  );
}

function SplitDemo() {
  const [last, setLast] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const timer = React.useRef<number | undefined>(undefined);
  React.useEffect(() => () => window.clearTimeout(timer.current), []);
  const run = (what: string) => {
    setBusy(true);
    setLast(`正在${what}…`);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      setBusy(false);
      setLast(`已${what}（示例，未生成文件）`);
    }, 600);
  };
  return (
    <div className="sc-card-list">
      <div className="sc-row">
        <SplitButton label="导出 CSV" menuLabel="更多导出格式" loading={busy} onClick={() => run('导出 CSV')}>
          <MenuItem onSelect={() => run('导出 JSON')}>导出 JSON</MenuItem>
          <MenuItem onSelect={() => run('导出 PDF 报告')}>导出 PDF 报告</MenuItem>
          <MenuSeparator />
          <MenuItem disabled>导出到归档库（需要权限）</MenuItem>
        </SplitButton>
        <SplitButton label="提交复核" menuLabel="更多提交方式" variant="accent" onClick={() => setLast('提交复核（示例）')}>
          <MenuItem onSelect={() => setLast('提交并通知负责人（示例）')}>提交并通知负责人</MenuItem>
        </SplitButton>
      </div>
      <div className="sc-row">
        <SplitButton label="保存" menuLabel="更多保存方式" variant="secondary" size="sm" onClick={() => setLast('保存（示例）')}>
          <MenuItem onSelect={() => setLast('另存为副本（示例）')}>另存为副本</MenuItem>
        </SplitButton>
        <SplitButton label="复制编号" menuLabel="更多复制方式" variant="ghost" size="sm" onClick={() => setLast('复制编号（示例）')}>
          <MenuItem onSelect={() => setLast('复制链接（示例）')}>复制链接</MenuItem>
        </SplitButton>
        <SplitButton label="已禁用" menuLabel="更多操作" disabled>
          <MenuItem>不可用</MenuItem>
        </SplitButton>
      </div>
      <p className="sc-small" aria-live="polite" data-testid="split-last">
        {last || '尚未执行'}
      </p>
    </div>
  );
}

const logLines = Array.from({ length: 40 }, (_, i) => `[示例] 10:${String(i).padStart(2, '0')}:00  批次 B-${200 + i} 已归档，共 ${(i * 7) % 23 + 3} 条记录`);

function ScrollDemo() {
  const [ups, setUps] = React.useState(0);
  return (
    <div className="sc-card-list">
      <div style={{ border: 'var(--rl-border-width) solid var(--rl-border-default)', borderRadius: 'var(--rl-radius-sm)', background: 'var(--rl-bg-surface)' }}>
        <ScrollArea label="运行日志（示例）" maxHeight="12rem" onScrollIntentUp={() => setUps((n) => n + 1)}>
          <ol style={{ margin: 0, padding: 'var(--rl-space-2) var(--rl-space-3)', listStyle: 'none', font: 'var(--rl-type-mono)' }}>
            {logLines.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ol>
        </ScrollArea>
      </div>
      <p className="sc-small" data-testid="scroll-intent">
        向上滚动意图：{ups} 次（Tab 聚焦日志后用 ↑ ↓ / PageUp / PageDown 滚动）
      </p>
    </div>
  );
}

function formatBytes(bytes: number) {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${bytes} B`;
}

const reasonText: Record<FileRejection['reason'], string> = { type: '类型不符', size: '超过 1 MB', count: '超过数量上限' };

function DropDemo() {
  const [files, setFiles] = React.useState<File[]>([]);
  const [rejected, setRejected] = React.useState<FileRejection[]>([]);
  return (
    <div className="sc-card-list">
      <FileDropZone
        label="样本图像"
        description="仅图像文件，单个不超过 1 MB，最多 3 个。不会上传，只在本页列出。"
        accept="image/*"
        multiple
        maxFiles={3}
        maxSize={1024 * 1024}
        onFiles={(next) => {
          setFiles(next);
          setRejected([]);
        }}
        onReject={setRejected}
      />
      <div>
        <h3 className="sc-subhead">已接收</h3>
        {files.length === 0 ? (
          <p className="sc-small">暂无文件</p>
        ) : (
          <ul className="sc-card-list" data-testid="accepted-files">
            {files.map((f) => (
              <li key={`${f.name}-${f.size}`} className="sc-small">
                {f.name} · {formatBytes(f.size)}
              </li>
            ))}
          </ul>
        )}
      </div>
      {rejected.length > 0 && (
        <div>
          <h3 className="sc-subhead">未接收</h3>
          <ul className="sc-card-list">
            {rejected.map((r) => (
              <li key={`${r.file.name}-${r.reason}`} className="sc-small">
                {r.file.name} · {reasonText[r.reason]}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export function CommandPage() {
  return (
    <div className="sc-page">
      <PageHeader index="26" section="Advanced interaction" title="Combobox · CommandPalette · FileDropZone · SplitButton · ScrollArea">
        <p>
          可搜索选择、全局命令与附件拖放（ADR-0010 §2）。<code>Combobox</code> 与 <code>CommandPalette</code> 基于 Base UI Combobox / Autocomplete 与
          Dialog；<code>FileDropZone</code> 是原生 <code>{'<input type="file">'}</code> 加拖放目标，不包含上传逻辑；<code>SplitButton</code> 组合 Button 与 Menu；<code>ScrollArea</code> 基于 Base UI scroll-area。本页类别、命令与记录均为示例。
        </p>
      </PageHeader>
      <SpecimenGrid>
        <Specimen
          id="command-combobox"
          index="01"
          title="Combobox"
          span="half"
          align="start"
          note="分组、禁用项、清除按钮；输入框是 role=combobox，选项经 aria-activedescendant 高亮。弹层 opacity + 4px 位移 --rl-motion-fast，减动时只淡入。"
        >
          <BasicCombobox />
        </Specimen>
        <Specimen
          id="command-combobox-async"
          index="02"
          title="Async search"
          span="half"
          align="start"
          note="loading 时显示 Spinner 与「正在搜索…」（Combobox.Status 礼貌宣告），列表 aria-busy；结果为本地固定列表的模拟检索。"
        >
          <AsyncCombobox />
        </Specimen>
        <Specimen id="command-combobox-states" index="03" title="Combobox states" span="half" align="start" note="invalid + error 走 Field 的错误语义；size 与 Input / Select 一致；disabled 同时禁用输入与按钮。">
          <StateCombobox />
        </Specimen>
        <Specimen
          id="command-palette"
          index="04"
          title="CommandPalette"
          span="half"
          align="start"
          note="Dialog + 内联 Autocomplete：焦点留在输入框，↑ ↓ 移动，Enter 执行，Esc 关闭并把焦点还给打开前的元素。禁用命令显示原因、不可执行。动效同 Dialog。"
        >
          <PaletteDemo />
        </Specimen>
        <Specimen
          id="command-palette-async"
          index="04.1"
          title="CommandPalette · async"
          span="half"
          align="start"
          note="受控 query + onQueryChange，filter={null} 交给调用方；loading 时状态行礼貌宣告「正在搜索命令…」，列表 aria-busy。命令可带 icon（装饰）与 meta。延迟 600ms 为模拟。"
        >
          <AsyncPaletteDemo />
        </Specimen>
        <Specimen
          id="command-split"
          index="06"
          title="SplitButton"
          span="half"
          align="start"
          note="role=group（名称 = label）内两个真实按钮共用一个边框：主操作是 Button，右侧 IconButton 打开 Menu（Enter / Space / ↓）。loading 时菜单按钮一并禁用。"
        >
          <SplitDemo />
        </Specimen>
        <Specimen
          id="command-scroll"
          index="07"
          title="ScrollArea"
          span="half"
          align="start"
          note="原生滚动容器 + 叠加滚动条（Base UI）。视口是带名称的 region，溢出时可 Tab 聚焦并用键盘滚动；forced-colors 下隐藏叠加层、恢复系统滚动条。"
        >
          <ScrollDemo />
        </Specimen>
        <Specimen
          id="command-drop"
          index="05"
          title="FileDropZone"
          note="可聚焦的原生文件输入 + 可见「选择文件」标签；拖入时 data-drag-over 高亮。校验与原生 accept 一致（扩展名、MIME 通配），拒绝原因写入礼貌 live region。"
        >
          <DropDemo />
        </Specimen>
      </SpecimenGrid>
    </div>
  );
}
