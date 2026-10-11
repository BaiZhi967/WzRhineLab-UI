// Server Component (no 'use client'): every @wzrhine/react import below comes straight from the
// package entry. Components that only take serialisable props render here; the ones that need
// function props (DataTable's getRowId / cell, AlertDialog's onConfirm) live in small client files.
import { Alert, Button, MetadataList, RecordHeader, Tab, TabList, TabPanel, Tabs, paginate } from '@wzrhine/react';
import { RecordActions } from './actions';
import { pageSize, record, samples } from './data';
import { SamplesTable } from './samples-table';

export default async function Page({ searchParams }: { searchParams: Promise<{ page?: string | string[] }> }) {
  const { page: pageParam } = await searchParams;
  const pageCount = Math.ceil(samples.length / pageSize);
  const requested = Number(Array.isArray(pageParam) ? pageParam[0] : pageParam);
  const page = Number.isInteger(requested) && requested >= 1 && requested <= pageCount ? requested : 1;
  // Pure helper, called on the server: only this page's rows are serialised to the client table.
  const rows = paginate(samples, page, pageSize);

  return (
    <main className="next-page">
      <RecordHeader
        recordId={record.id}
        title={record.title}
        status={{ tone: 'info', label: '审核中' }}
        trail={[{ label: '档案', href: '/' }, { label: '实验记录', href: '/' }, { label: record.id }]}
        classification={['实验记录', record.discipline, '示例数据']}
        summary={record.summary}
        meta={[
          { label: '负责人', value: record.owner },
          { label: '创建', value: record.created, mono: true, dateTime: record.created },
          { label: '更新', value: record.updated, mono: true, dateTime: record.updated },
        ]}
        actions={<RecordActions recordId={record.id} />}
      />

      <Alert tone="info" title="示例数据">
        本页数值为写死的示例，不是真实监测结果。页面由 Next.js 服务器组件渲染。
      </Alert>

      <Tabs defaultValue="samples">
        <TabList aria-label="记录内容">
          <Tab value="samples">样本</Tab>
          <Tab value="info">元数据</Tab>
        </TabList>
        <TabPanel value="samples">
          <SamplesTable rows={rows} caption={`样本清单（示例）· 第 ${page} / ${pageCount} 页`} />
          {/* Server-side paging: a plain GET form, so it works before (and without) JavaScript. */}
          <form method="get" action="/" className="next-actions" aria-label="样本分页">
            <Button type="submit" name="page" value={String(page - 1)} variant="secondary" size="sm" disabled={page <= 1}>
              上一页
            </Button>
            <Button type="submit" name="page" value={String(page + 1)} variant="secondary" size="sm" disabled={page >= pageCount}>
              下一页
            </Button>
          </form>
        </TabPanel>
        <TabPanel value="info">
          <MetadataList
            items={[
              { label: '编号', value: record.id, mono: true },
              { label: '学科', value: record.discipline },
              { label: '样本数', value: String(samples.length), mono: true },
              { label: '保密级别', value: '' },
            ]}
            empty="placeholder"
          />
        </TabPanel>
      </Tabs>
    </main>
  );
}
