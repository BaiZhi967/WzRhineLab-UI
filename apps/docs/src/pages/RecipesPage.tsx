import * as React from 'react';
import '@wzrhine/patterns/styles.css';
import {
  Alert,
  Button,
  Checkbox,
  DataTable,
  Field,
  Fieldset,
  Form,
  Input,
  MetadataList,
  MotionPresence,
  Pagination,
  RecordHeader,
  Select,
  Skeleton,
  StatusBadge,
  Switch,
} from '@wzrhine/react';
import type { DataTableColumn } from '@wzrhine/react';
import {
  AppliedFilters,
  ListDetail,
  QueryToolbar,
  ResourceGrid,
  SectionIndex,
  SelectionToolbar,
  ViewSwitcher,
} from '@wzrhine/patterns';
import { PageHeader, Specimen, SpecimenGrid } from '../ui/Specimen';

/**
 * Page recipes (P030-07): runnable compositions over public entries only. Each recipe names its
 * data adaptation points (adapter) and the state owner — the library owns no query, selection or
 * persistence. Sample data is static specimen data, never real measurements.
 */

interface ArchiveRow {
  id: string;
  title: string;
  category: string;
  year: number;
}

const allRows: ArchiveRow[] = [
  { id: 'ARC-1024', title: '近海沉积样本分析', category: '样本', year: 2026 },
  { id: 'ARC-1025', title: '潮间带微生物群落观测', category: '观测', year: 2026 },
  { id: 'ARC-1026', title: '年度浮游生物普查底稿', category: '普查', year: 2025 },
  { id: 'ARC-1027', title: '深海热液区水样采集记录', category: '样本', year: 2025 },
  { id: 'ARC-1028', title: '湿地鸟类迁徙路线整理', category: '观测', year: 2024 },
  { id: 'ARC-1029', title: '冰川消融速率年度汇总', category: '汇总', year: 2026 },
  { id: 'ARC-1030', title: '海底地形测绘草图', category: '测绘', year: 2024 },
  { id: 'ARC-1031', title: '大气沉降物采样记录', category: '样本', year: 2025 },
];

/** Categories present in the sample rows; drives the condition chips. */
const CATEGORIES = [...new Set(allRows.map((row) => row.category))];

function buildColumns(marked: ReadonlySet<string>): Array<DataTableColumn<ArchiveRow>> {
  return [
    { key: 'id', header: '编号', rowHeader: true, mono: true },
    { key: 'title', header: '题名' },
    { key: 'category', header: '类别' },
    { key: 'year', header: '年份', align: 'end' },
    {
      key: 'marked',
      header: '标记',
      cell: (row) => (marked.has(row.id) ? <StatusBadge status="success">已标记</StatusBadge> : null),
    },
  ];
}

/** Recipe 1 · collection page: the caller owns query / filters / view / selection / paging. */
function CollectionRecipe() {
  const [query, setQuery] = React.useState('');
  const [pending, setPending] = React.useState('');
  const [filters, setFilters] = React.useState<Array<{ id: string; label: string; category: string }>>([]);
  const [view, setView] = React.useState<'list' | 'grid'>('list');
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  // Result of the batch action, so it is observable in both views.
  const [marked, setMarked] = React.useState<ReadonlySet<string>>(new Set());
  const [page, setPage] = React.useState(1);
  const pageSize = 5;

  // Conditions carry the field they filter on, so the adapter matches `category` instead of
  // substring-matching the chip's own label.
  const filtered = React.useMemo(() => {
    const keyword = query.trim();
    return allRows.filter((row) => {
      const hitKeyword = !keyword || row.title.includes(keyword) || row.id.includes(keyword.toUpperCase());
      const hitFilters = filters.every((filter) => row.category === filter.category);
      return hitKeyword && hitFilters;
    });
  }, [query, filters]);

  // Adapter duty (documented): a query change resets the page.
  const commitQuery = (next: string) => {
    setQuery(next);
    setPage(1);
  };

  const toolbarRef = React.useRef<HTMLDivElement | null>(null);
  // Removing the last condition unmounts the region, so the page lands focus on the search box.
  const returnFocusToSearch = () => {
    window.requestAnimationFrame(() => {
      toolbarRef.current?.querySelector<HTMLInputElement>('input[type="search"]')?.focus();
    });
  };
  const removeFilter = (id: string) => {
    setFilters((prev) => prev.filter((f) => f.id !== id));
    setPage(1);
    if (filters.length === 1) returnFocusToSearch();
  };
  const pageRows = filtered.slice((page - 1) * pageSize, page * pageSize);
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));

  return (
    <div className="recipes-stack" ref={toolbarRef}>
      <QueryToolbar
        query={query}
        pendingQuery={pending}
        onPendingQueryChange={setPending}
        onQueryChange={commitQuery}
        onReset={() => {
          setPending('');
          commitQuery('');
          setFilters([]);
          setSelected(new Set());
        }}
        resultSummary={<span>共 {filtered.length} 条结果</span>}
      >
        {/* One chip per category, keyed by the category itself: ids stay stable and unique no
            matter which chips were removed in between (an index-based id could collide). */}
        {CATEGORIES.map((category) => (
          <Button
            key={category}
            variant="secondary"
            size="sm"
            aria-pressed={filters.some((f) => f.category === category)}
            onClick={() => {
              setFilters((prev) =>
                prev.some((f) => f.category === category)
                  ? prev.filter((f) => f.category !== category)
                  : [...prev, { id: `category:${category}`, label: `类别：${category}`, category }],
              );
              setPage(1);
            }}
          >
            {category}
          </Button>
        ))}
      </QueryToolbar>
      {filters.length > 0 && (
        <AppliedFilters
          filters={filters}
          onRemove={removeFilter}
          onClearAll={() => {
            setFilters([]);
            setPage(1);
            returnFocusToSearch();
          }}
        />
      )}
      <div className="recipes-toolbar-row">
        <ViewSwitcher
          label="视图"
          value={view}
          onValueChange={setView}
          options={[
            { value: 'list', label: '列表' },
            { value: 'grid', label: '网格' },
          ]}
        />
        {selected.size > 0 && (
          <SelectionToolbar
            selectedCount={selected.size}
            scope="page"
            totalLabel={`当前页 ${pageRows.length} 条 / 已加载 ${filtered.length} 条`}
            onClear={() => setSelected(new Set())}
            actions={[
              {
                id: 'mark',
                label: '标记所选',
                // A real state change, not an empty callback: the marked ids show up in the rows
                // below. A recipe should demonstrate the whole loop.
                onRun: () => {
                  setMarked((prev) => new Set([...prev, ...selected]));
                  setSelected(new Set());
                },
              },
            ]}
          />
        )}
        {marked.size > 0 && (
          <Button variant="ghost" size="sm" onClick={() => setMarked(new Set())}>
            清除 {marked.size} 条标记
          </Button>
        )}
      </div>
      {/* Both branches are real collections over the same ids, query result and selection set,
          so switching the view keeps a record identifiable, selectable and openable. */}
      {view === 'list' ? (
        <DataTable
          caption="档案记录"
          columns={buildColumns(marked)}
          rows={pageRows}
          getRowId={(row) => row.id}
          selectedIds={selected}
          onSelectionChange={setSelected}
          emptyText={query || filters.length ? '没有匹配的记录' : '还没有任何记录'}
          emptyDescription={query || filters.length ? '调整关键词或清除条件后重试。' : undefined}
          emptyAction={
            query || filters.length ? (
              <Button variant="ghost" size="sm" onClick={() => { commitQuery(''); setFilters([]); }}>
                清除全部条件
              </Button>
            ) : undefined
          }
        />
      ) : (
        <ResourceGrid
          label="档案记录"
          items={pageRows}
          getItemId={(row) => row.id}
          getItemTitle={(row) => row.title}
          getItemLabel={(row) => `选择 ${row.title}`}
          getItemSpec={(row) => ({
            badge: marked.has(row.id) ? <StatusBadge status="success">已标记</StatusBadge> : undefined,
            description: `${row.id} · ${row.category} · ${row.year}`,
          })}
          selectedIds={selected}
          onSelectionChange={setSelected}
          emptyText={query || filters.length ? '没有匹配的记录' : '还没有任何记录'}
          emptyAction={
            query || filters.length ? (
              <Button variant="ghost" size="sm" onClick={() => { commitQuery(''); setFilters([]); }}>
                清除全部条件
              </Button>
            ) : undefined
          }
        />
      )}
      <Pagination page={page} pageCount={pageCount} onPageChange={setPage} totalItems={filtered.length} pageSize={pageSize} showStatus />
    </div>
  );
}

/**
 * Recipe 2 · record detail page: RecordDetail-as-recipe (ADR-0014 §2) over public parts.
 * The simulated read carries a request token and an explicit failure switch, so switching records
 * quickly cannot let an older response land on a newer one, and the error path is reproducible.
 */
function DetailRecipe() {
  const [detailId, setDetailId] = React.useState<string | null>('ARC-1024');
  const [phase, setPhase] = React.useState<'ready' | 'loading' | 'error'>('ready');
  const [failNext, setFailNext] = React.useState(false);
  const requestRef = React.useRef(0);
  const timer = React.useRef<number | undefined>(undefined);
  React.useEffect(() => () => window.clearTimeout(timer.current), []);

  const load = (id: string) => {
    // Adapter duty: issue the read, drop responses from superseded requests, and only then
    // report facts back.
    const token = ++requestRef.current;
    setDetailId(id);
    setPhase('loading');
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      if (requestRef.current !== token) return; // a newer record was opened meanwhile
      setPhase(failNext ? 'error' : 'ready');
    }, 300);
  };
  const row = allRows.find((item) => item.id === detailId);
  return (
    <div className="recipes-detail">
      <ListDetail
        mode="auto"
        modeThreshold={640}
        detailId={detailId}
        onDetailChange={(id) => { if (id === null) setDetailId(null); }}
        listLabel="档案集合"
        detailLabel="档案详情"
        list={
          <div className="recipes-stack">
            <ul className="recipes-list">
              {allRows.slice(0, 4).map((item) => (
                <li key={item.id}>
                  <Button variant="ghost" onClick={() => load(item.id)}>
                    {item.id} · {item.title}
                  </Button>
                </li>
              ))}
            </ul>
            <Checkbox label="让下一次读取失败（演示错误路径）" checked={failNext} onCheckedChange={setFailNext} />
          </div>
        }
        detail={
          phase === 'loading' ? (
            <div className="recipes-stack" aria-busy="true">
              <Skeleton shape="text" />
              <Skeleton shape="text" />
              <Skeleton shape="block" />
            </div>
          ) : phase === 'error' ? (
            <Alert tone="danger" title="详情读取失败">
              <p className="recipes-hint">取消上面的开关后重试即可成功；旧内容不会被伪装成新记录。</p>
              {/* Retry re-issues the read instead of parking the UI in `loading` forever. */}
              <Button variant="secondary" size="sm" onClick={() => detailId && load(detailId)}>
                重试
              </Button>
            </Alert>
          ) : row ? (
            <div className="recipes-stack">
              {/* Only this aria-hidden marker remounts. Record identity, links and focus are never
                  kept in an exit layer or gated on animation completion. */}
              <div className="rl-demo-detail-marker-slot" aria-hidden="true">
                <MotionPresence key={row.id} show initial preset="fade" className="rl-demo-detail-marker">
                  <span />
                </MotionPresence>
              </div>
              <RecordHeader
                recordId={row.id}
                title={row.title}
                status={{ tone: 'success', label: row.category }}
                headingLevel={2}
                meta={[{ label: '年份', value: String(row.year) }, { label: '入库', value: '2026-09-30' }]}
              />
              {/* Every section id below has a matching heading: an index entry without a target
                  would silently do nothing on click. */}
              <SectionIndex
                label="本记录章节"
                sections={[
                  { id: 'recipe-summary', label: '概览' },
                  { id: 'recipe-method', label: '方法' },
                  { id: 'recipe-result', label: '结果' },
                ]}
              />
              <section id="recipe-summary">
                <h3>概览</h3>
                <p>正文区由调用者组合；章节 id 与内容标题一一对应。</p>
              </section>
              <MetadataList
                layout="stacked"
                items={[
                  { label: '采样站点', value: 'ST-07 近海平台' },
                  { label: '保存条件', value: '4°C 避光' },
                ]}
              />
              <section id="recipe-method">
                <h3>方法</h3>
                <p>分层取样、现场冷藏运输；实验室筛分后称重并记录含水率。</p>
              </section>
              <section id="recipe-result">
                <h3>结果</h3>
                <p>示例文本仅用于排版演示，不代表真实监测指标。</p>
              </section>
            </div>
          ) : null
        }
      />
    </div>
  );
}

type SaveState = 'idle' | 'dirty' | 'saving' | 'saved' | 'error';

interface SettingsValues {
  nickname: string;
  digest: boolean;
  format: string;
  showDeleted: boolean;
}

const initialSettings: SettingsValues = { nickname: '白芷', digest: true, format: 'csv', showDeleted: false };

/**
 * Recipe 3 · grouped settings page: dirty/saving/saved/error facts, save runs in the adapter.
 * Every control is controlled and every value round-trips through the committed snapshot, so the
 * specimen shows the whole save loop rather than a form that only reports "dirty".
 */
function SettingsRecipe() {
  const [committed, setCommitted] = React.useState<SettingsValues>(initialSettings);
  const [draft, setDraft] = React.useState<SettingsValues>(initialSettings);
  const [state, setState] = React.useState<SaveState>('idle');
  // Deterministic instead of Math.random(): a specimen whose outcome flips at random cannot be
  // screenshotted or asserted on. The failure is an explicit, user-visible switch.
  const [failNext, setFailNext] = React.useState(false);
  const timer = React.useRef<number | undefined>(undefined);
  React.useEffect(() => () => window.clearTimeout(timer.current), []);

  const dirty =
    draft.nickname !== committed.nickname ||
    draft.digest !== committed.digest ||
    draft.format !== committed.format ||
    draft.showDeleted !== committed.showDeleted;

  const set = <K extends keyof SettingsValues>(key: K) => (value: SettingsValues[K]) =>
    setDraft((prev) => ({ ...prev, [key]: value }));

  const save = () => {
    setState('saving');
    // Adapter duty: persist and report success or failure; the UI never marks success itself.
    timer.current = window.setTimeout(() => {
      if (failNext) {
        setState('error');
        return;
      }
      setCommitted(draft);
      setState('saved');
    }, 500);
  };

  return (
    <Form
      onSubmit={(event) => {
        event.preventDefault();
        save();
      }}
    >
      <div className="recipes-stack">
        {state === 'saved' && !dirty && (
          <Alert tone="success" title="设置已保存">本地适配器已写入，下方「已保存的值」同步更新。</Alert>
        )}
        {state === 'error' && (
          <Alert tone="danger" title="保存失败">
            <p className="recipes-hint">输入未丢失，可直接重试。</p>
            <Button variant="secondary" size="sm" onClick={save}>重试</Button>
          </Alert>
        )}
        <Fieldset legend="偏好">
          <Field label="显示昵称">
            <Input value={draft.nickname} onValueChange={set('nickname')} />
          </Field>
          <Field label="结果摘要邮件" description="仅本地演示，不发送任何邮件。">
            <Switch checked={draft.digest} onCheckedChange={set('digest')} label="订阅摘要" />
          </Field>
        </Fieldset>
        <Fieldset legend="数据">
          <Field label="默认导出格式">
            <Select
              options={[
                { value: 'csv', label: 'CSV' },
                { value: 'json', label: 'JSON' },
              ]}
              value={draft.format}
              // Select can report null (cleared); the recipe keeps a concrete default.
              onValueChange={(value) => set('format')(value ?? 'csv')}
            />
          </Field>
          <Checkbox label="在列表中显示已删除记录" checked={draft.showDeleted} onCheckedChange={set('showDeleted')} />
        </Fieldset>
        <Fieldset legend="演示开关">
          <Checkbox label="让下一次保存失败（演示错误路径）" checked={failNext} onCheckedChange={setFailNext} />
        </Fieldset>
        <div className="recipes-toolbar-row">
          {/* loading keeps the button focusable and blocks repeat submits. */}
          <Button type="submit" loading={state === 'saving'}>
            {state === 'saving' ? '保存中…' : '保存设置'}
          </Button>
          {dirty && state !== 'saving' && <span className="recipes-hint">有未保存的修改；离开前请保存。</span>}
        </div>
        <RecipeNotes
          items={[
            ['已保存的值', `${committed.nickname} · 摘要 ${committed.digest ? '开' : '关'} · ${committed.format.toUpperCase()} · 已删除记录 ${committed.showDeleted ? '显示' : '隐藏'}`],
          ]}
        />
      </div>
    </Form>
  );
}

function RecipeNotes({ items }: { items: Array<[string, string]> }) {
  return (
    <dl className="recipes-notes">
      {items.map(([term, value]) => (
        <div key={term} className="recipes-notes__row">
          <dt>{term}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function RecipesPage() {
  return (
    <>
      <PageHeader index="40" section="Archive & Patterns" title="页面 Recipes">
        <p>
          三个可运行页面组合，只使用公开入口：集合页、记录详情页（RecordDetail 按 ADR-0014 以 recipe 形态交付）与分组设置页。
          每个 recipe 标注数据适配点与状态所有者——查询、选择、保存与存储都留在宿主一侧。
        </p>
        <p>
          <strong>交互范围</strong>：查询、条件、视图切换、选择、批量标记、分页、详情读取（含错误与重试）与设置保存都是
          <strong>真实可操作</strong>的，结果在页面内可见。以下部分是<strong>样张</strong>：数据为固定示例行，
          「保存」只写入本页内存而不落盘（真实宿主在此接持久化），异步读取用定时器模拟并带请求令牌。
          需要观察错误路径时，用各 recipe 内的「让下一次…失败」开关——不使用随机结果，以便截图与断言可复现。
        </p>
      </PageHeader>
      <SpecimenGrid>
        <Specimen id="recipe-collection" index="01" title="Recipe · 集合页" span="full" note="查询、条件、视图、选择与分页全部由调用者持有；查询变更重置页码">
          <CollectionRecipe />
          <RecipeNotes
            items={[
              ['用途', '档案／资源集合的查找与批量操作起点。'],
              ['数据适配点', 'filtered/pageRows 计算即 adapter：真实宿主换成请求 + 取消 + 去重。'],
              ['状态所有者', '页面组件（query、filters、view、selected、page）；组件只回传意图。'],
              ['键盘路径', '搜索框提交 → 条件移除落相邻焦点（最后一项移除后回搜索框）→ 视图方向键切换 → 选择 → 分页保持焦点。'],
              ['批量动作', '「标记所选」真实改变数据：标记在列表与网格两种视图中都可见，可再清除。'],
              ['错误与取消', '空结果与无记录分开呈现（EmptyState）；条件 ID 按类别生成，移除中间项后不会重复。'],
              ['不适用场景', '需要服务端全结果选择、无限滚动或虚拟化时另行立项。'],
            ]}
          />
        </Specimen>
        <Specimen id="recipe-detail" index="02" title="Recipe · 记录详情页" span="full" note="ListDetail + RecordHeader + MetadataList + SectionIndex；加载/错误/旧数据由调用者控制">
          <DetailRecipe />
          <RecipeNotes
            items={[
              ['用途', '从集合进入记录详情、章节定位并返回。'],
              ['数据适配点', 'load(id) 用定时器模拟异步详情，并带请求令牌：快速切换记录时旧响应被丢弃。'],
              ['状态所有者', 'detailId 与 phase 由页面持有；窄宽模式由 ListDetail 容器测量。'],
              ['键盘路径', '列表条目打开 → 焦点进详情返回入口 → 章节锚点导航 → 返回回到触发条目。'],
              ['错误与取消', 'loading 用 Skeleton + aria-busy；错误用 Alert + 重试（重试真的重发）；不把旧内容伪装成新记录。开关控制失败，不用随机值。'],
              ['局部动效', 'MotionPresence 只作用于 aria-hidden 的视觉标记；标题、章节链接即时更新，不保留旧控件、不延迟焦点。'],
              ['不适用场景', '需要拖拽分栏、多窗格停靠或第二个应用外壳时不适用。'],
            ]}
          />
        </Specimen>
        <Specimen id="recipe-settings" index="03" title="Recipe · 分组设置页" span="full" note="Form/Fieldset 组合 + dirty/saving/saved/error 事实；保存由 adapter 执行">
          <SettingsRecipe />
          <RecipeNotes
            items={[
              ['用途', '本地偏好与显示设置的分组表单。'],
              ['数据适配点', 'save() 只写入本页内存（样张，不落盘）；真实宿主接持久化并回报成功/失败。archive-desk 的设置页演示了真实落盘版本。'],
              ['状态所有者', '草稿与已提交快照分开；dirty 由两者比较得出，UI 不把输入直接标成已保存。'],
              ['键盘路径', '标准表单 Tab 顺序；提交按钮 saving 期间保持可聚焦（aria-disabled）并防重复提交。'],
              ['错误与取消', '失败显示 Alert + 重试，输入不丢失；离开保护由宿主路由层实现。'],
              ['不适用场景', '涉及凭据、权限或服务端会话的设置不放入本 recipe。'],
            ]}
          />
        </Specimen>
      </SpecimenGrid>
    </>
  );
}
