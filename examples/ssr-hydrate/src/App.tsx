import * as React from 'react';
import {
  Button,
  DataTable,
  Dialog,
  DialogClose,
  Field,
  Input,
  MetadataList,
  RecordHeader,
  RhineProvider,
  Select,
  StatusIndicator,
  Tab,
  TabList,
  TabPanel,
  Tabs,
  Timeline,
  Tooltip,
  useToast,
} from '@wzrhine/react';
import type { DataTableColumn, RhineTheme } from '@wzrhine/react';

/**
 * Record detail page rendered on the server and hydrated in the browser. Everything that
 * reaches the first render comes from `data` (serialised into the page), never from `Date`,
 * `Math.random` or `window`, so server and client markup match exactly.
 */

export interface PageData {
  theme: RhineTheme;
  record: {
    id: string;
    title: string;
    discipline: string;
    owner: string;
    created: string;
    updated: string;
    summary: string;
  };
  samples: { id: string; label: string; mass: string; status: 'ok' | 'recheck' }[];
  events: { id: string; title: string; at: string }[];
}

const columns: DataTableColumn<PageData['samples'][number]>[] = [
  { key: 'id', header: '样本', mono: true, rowHeader: true },
  { key: 'label', header: '说明' },
  { key: 'mass', header: '质量', mono: true, align: 'end' },
  {
    key: 'status',
    header: '状态',
    cell: (s) => <StatusIndicator tone={s.status === 'ok' ? 'success' : 'warning'} label={s.status === 'ok' ? '合格' : '需复核'} />,
  },
];

function Detail({ data }: { data: PageData }) {
  const toast = useToast();
  const [hydrated, setHydrated] = React.useState(false);
  const [note, setNote] = React.useState('');
  const [reviewer, setReviewer] = React.useState<string | null>('a');
  React.useEffect(() => setHydrated(true), []);
  const { record } = data;

  return (
    <main className="ssr-page" data-hydrated={hydrated || undefined}>
      <RecordHeader
        recordId={record.id}
        title={record.title}
        status={{ tone: 'info', label: '审核中' }}
        trail={[{ label: '档案', href: '#' }, { label: '实验记录', href: '#' }, { label: record.id }]}
        classification={['实验记录', record.discipline, '示例数据']}
        summary={record.summary}
        meta={[
          { label: '负责人', value: record.owner },
          { label: '创建', value: record.created, mono: true, dateTime: record.created },
          { label: '更新', value: record.updated, mono: true, dateTime: record.updated },
        ]}
        actions={
          <Dialog
            trigger={<Button>提交复核意见</Button>}
            title="提交复核意见"
            size="sm"
            actions={
              <>
                <DialogClose>
                  <Button variant="ghost">取消</Button>
                </DialogClose>
                <DialogClose>
                  <Button onClick={() => toast.show({ title: '复核意见已提交', description: '演示：未发送到服务器。', status: 'success' })}>提交</Button>
                </DialogClose>
              </>
            }
          >
            <div className="ssr-form">
              <Field label="复核人">
                <Select
                  value={reviewer}
                  onValueChange={setReviewer}
                  options={[
                    { value: 'a', label: '示例审核员 A' },
                    { value: 'b', label: '示例审核员 B' },
                  ]}
                />
              </Field>
              <Field label="意见" optional>
                <Input value={note} onValueChange={setNote} maxLength={60} />
              </Field>
            </div>
          </Dialog>
        }
      />

      <Tabs defaultValue="samples">
        <TabList aria-label="记录内容">
          <Tab value="samples">样本</Tab>
          <Tab value="history">处理记录</Tab>
          <Tab value="info">元数据</Tab>
        </TabList>
        <TabPanel value="samples">
          <DataTable caption="样本清单" columns={columns} rows={data.samples} getRowId={(s) => s.id} />
        </TabPanel>
        <TabPanel value="history">
          <Timeline aria-label="处理记录" events={data.events.map((e) => ({ id: e.id, title: e.title, dateTime: e.at }))} />
        </TabPanel>
        <TabPanel value="info">
          <MetadataList
            items={[
              { label: '编号', value: record.id, mono: true },
              { label: '学科', value: record.discipline },
              { label: '保密级别', value: '' },
            ]}
            empty="placeholder"
          />
        </TabPanel>
      </Tabs>

      <p className="ssr-footnote">
        <Tooltip content="页面先在服务器渲染为 HTML，再在浏览器中接管交互。">
          <Button size="sm" variant="ghost">
            关于本页
          </Button>
        </Tooltip>
      </p>
    </main>
  );
}

export function App({ data }: { data: PageData }) {
  return (
    <RhineProvider theme={data.theme} className="ssr-root">
      <Detail data={data} />
    </RhineProvider>
  );
}
