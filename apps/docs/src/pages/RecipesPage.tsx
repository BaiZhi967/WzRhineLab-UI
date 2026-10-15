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
  Switch,
} from '@wzrhine/react';
import type { DataTableColumn } from '@wzrhine/react';
import {
  AppliedFilters,
  ListDetail,
  QueryToolbar,
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

const columns: Array<DataTableColumn<ArchiveRow>> = [
  { key: 'id', header: '编号', rowHeader: true, mono: true },
  { key: 'title', header: '题名' },
  { key: 'category', header: '类别' },
  { key: 'year', header: '年份', align: 'end' },
];

/** Recipe 1 · collection page: the caller owns query / filters / view / selection / paging. */
function CollectionRecipe() {
  const [query, setQuery] = React.useState('');
  const [pending, setPending] = React.useState('');
  const [filters, setFilters] = React.useState<Array<{ id: string; label: string }>>([]);
  const [view, setView] = React.useState<'list' | 'grid'>('list');
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [page, setPage] = React.useState(1);
  const pageSize = 5;

  const filtered = React.useMemo(() => {
    const keyword = query.trim();
    return allRows.filter((row) => {
      const hitKeyword = !keyword || row.title.includes(keyword) || row.id.includes(keyword.toUpperCase());
      const hitFilters = filters.every((filter) => filter.label === '' || row.title.includes(filter.label.split('：')[1] ?? ''));
      return hitKeyword && hitFilters;
    });
  }, [query, filters]);

  // Adapter duty (documented): a query change resets the page.
  const commitQuery = (next: string) => {
    setQuery(next);
    setPage(1);
  };
  const pageRows = filtered.slice((page - 1) * pageSize, page * pageSize);
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));

  return (
    <div className="recipes-stack">
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
        <Button variant="secondary" size="sm" onClick={() => setFilters((prev) => [...prev, { id: `f${prev.length}`, label: '类别：样本' }])}>
          加一个类别条件
        </Button>
      </QueryToolbar>
      {filters.length > 0 && (
        <AppliedFilters filters={filters} onRemove={(id) => setFilters((prev) => prev.filter((f) => f.id !== id))} onClearAll={() => setFilters([])} />
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
            actions={[{ id: 'export', label: '导出所选', onRun: () => {} }]}
          />
        )}
      </div>
      {view === 'list' ? (
        <DataTable
          caption="档案记录"
          columns={columns}
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
        <ul className="recipes-grid">
          {pageRows.map((row) => (
            <li key={row.id} className="recipes-grid__card">
              <p className="recipes-grid__id">{row.id}</p>
              <p className="recipes-grid__title">{row.title}</p>
              <p className="recipes-grid__meta">{row.category} · {row.year}</p>
            </li>
          ))}
        </ul>
      )}
      <Pagination page={page} pageCount={pageCount} onPageChange={setPage} totalItems={filtered.length} pageSize={pageSize} showStatus />
    </div>
  );
}

/** Recipe 2 · record detail page: RecordDetail-as-recipe (ADR-0014 §2) over public parts. */
function DetailRecipe() {
  const [detailId, setDetailId] = React.useState<string | null>('ARC-1024');
  const [phase, setPhase] = React.useState<'ready' | 'loading' | 'error'>('ready');
  const load = (id: string) => {
    setDetailId(id);
    setPhase('loading');
    // Adapter duty: fetch, cancel stale responses, and only then report facts back.
    window.setTimeout(() => setPhase('ready'), 300);
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
          <ul className="recipes-list">
            {allRows.slice(0, 4).map((item) => (
              <li key={item.id}>
                <Button variant="ghost" onClick={() => load(item.id)}>
                  {item.id} · {item.title}
                </Button>
              </li>
            ))}
          </ul>
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
              <Button variant="secondary" size="sm" onClick={() => setPhase('loading')}>重试</Button>
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

/** Recipe 3 · grouped settings page: dirty/saving/saved/error facts, save runs in the adapter. */
function SettingsRecipe() {
  const [nickname, setNickname] = React.useState('白芷');
  const [digest, setDigest] = React.useState(true);
  const [state, setState] = React.useState<SaveState>('idle');
  const save = () => {
    setState('saving');
    // Adapter duty: persist locally and report success or failure; the UI never marks success itself.
    window.setTimeout(() => setState(Math.random() > 0.5 ? 'saved' : 'error'), 500);
  };
  return (
    <Form
      onSubmit={(event) => {
        event.preventDefault();
        save();
      }}
    >
      <div className="recipes-stack">
        {state === 'saved' && <Alert tone="success" title="设置已保存">本地适配器已写入。</Alert>}
        {state === 'error' && (
          <Alert tone="danger" title="保存失败">
            <Button variant="secondary" size="sm" onClick={save}>重试</Button>
          </Alert>
        )}
        <Fieldset legend="偏好">
          <Field label="显示昵称">
            <Input value={nickname} onChange={(event) => { setNickname(event.target.value); setState('dirty'); }} />
          </Field>
          <Field label="结果摘要邮件" description="仅本地演示，不发送任何邮件。">
            <Switch checked={digest} onCheckedChange={(next) => { setDigest(next); setState('dirty'); }} label="订阅摘要" />
          </Field>
        </Fieldset>
        <Fieldset legend="数据">
          <Field label="默认导出格式">
            <Select options={[{ value: 'csv', label: 'CSV' }, { value: 'json', label: 'JSON' }]} value="csv" onValueChange={() => setState('dirty')} />
          </Field>
          <Checkbox label="在列表中显示已删除记录" onCheckedChange={() => setState('dirty')} checked={false} />
        </Fieldset>
        <div className="recipes-toolbar-row">
          <Button type="submit" disabled={state === 'saving'}>{state === 'saving' ? '保存中…' : '保存设置'}</Button>
          {state === 'dirty' && <span className="recipes-hint">有未保存的修改；离开前请保存。</span>}
        </div>
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
      </PageHeader>
      <SpecimenGrid>
        <Specimen id="recipe-collection" index="01" title="Recipe · 集合页" span="full" note="查询、条件、视图、选择与分页全部由调用者持有；查询变更重置页码">
          <CollectionRecipe />
          <RecipeNotes
            items={[
              ['用途', '档案／资源集合的查找与批量操作起点。'],
              ['数据适配点', 'filtered/pageRows 计算即 adapter：真实宿主换成请求 + 取消 + 去重。'],
              ['状态所有者', '页面组件（query、filters、view、selected、page）；组件只回传意图。'],
              ['键盘路径', '搜索框提交 → 条件移除落相邻焦点 → 视图方向键切换 → 表格行选择 → 分页保持焦点。'],
              ['错误与取消', '空结果与无记录分开呈现（EmptyState）；错误态在 adapter 层注入后由表格状态呈现。'],
              ['不适用场景', '需要服务端全结果选择、无限滚动或虚拟化时另行立项。'],
            ]}
          />
        </Specimen>
        <Specimen id="recipe-detail" index="02" title="Recipe · 记录详情页" span="full" note="ListDetail + RecordHeader + MetadataList + SectionIndex；加载/错误/旧数据由调用者控制">
          <DetailRecipe />
          <RecipeNotes
            items={[
              ['用途', '从集合进入记录详情、章节定位并返回。'],
              ['数据适配点', 'load(id) 演示异步详情；真实宿主需取消过期响应，避免旧记录覆盖新记录。'],
              ['状态所有者', 'detailId 与 phase 由页面持有；窄宽模式由 ListDetail 容器测量。'],
              ['键盘路径', '列表条目打开 → 焦点进详情返回入口 → 章节锚点导航 → 返回回到触发条目。'],
              ['错误与取消', 'loading 用 Skeleton + aria-busy；错误用 Alert + 重试；不把旧内容伪装成新记录。'],
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
              ['数据适配点', 'save() 为本地演示适配器；真实宿主接持久化并回报成功/失败。'],
              ['状态所有者', '表单值与保存事实由页面持有；UI 不把输入直接标成已保存。'],
              ['键盘路径', '标准表单 Tab 顺序；提交按钮 saving 期间禁用防重复提交。'],
              ['错误与取消', '失败显示 Alert + 重试，输入不丢失；离开保护由宿主路由层实现。'],
              ['不适用场景', '涉及凭据、权限或服务端会话的设置不放入本 recipe。'],
            ]}
          />
        </Specimen>
      </SpecimenGrid>
    </>
  );
}
