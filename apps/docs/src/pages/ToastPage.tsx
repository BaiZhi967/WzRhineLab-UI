import * as React from 'react';
import { Button, useToast } from '@wzrhine/react';
import type { ToastStatus } from '@wzrhine/react';
import { Playground } from '../ui/Playground';
import { PageHeader, Specimen, SpecimenGrid } from '../ui/Specimen';
import { Segmented, TextField, Toggle } from '../ui/controls';

const statuses: ToastStatus[] = ['neutral', 'info', 'success', 'warning', 'danger'];

function ToastPlayground() {
  const toast = useToast();
  const [status, setStatus] = React.useState<ToastStatus>('success');
  const [title, setTitle] = React.useState('记录已归档');
  const [description, setDescription] = React.useState('REC-EXAMPLE 已变为只读。');
  const [persist, setPersist] = React.useState(false);
  const [high, setHigh] = React.useState(false);
  const [action, setAction] = React.useState(true);

  const opts = [
    `title: '${title || '…'}'`,
    description && `description: '${description}'`,
    `status: '${status}'`,
    persist && 'timeout: 0',
    high && "priority: 'high'",
    action && "action: { label: '撤销', onClick: undo }",
  ].filter(Boolean);

  return (
    <Playground
      id="toast-playground"
      title="Toast"
      code={['const toast = useToast();', '', 'toast.show({', ...opts.map((o) => `  ${o},`), '});'].join('\n')}
      controls={
        <>
          <Segmented legend="status" name="pg-toast-status" value={status} onChange={setStatus} options={statuses.map((s) => ({ value: s, label: s }))} />
          <TextField label="title" value={title} onChange={setTitle} />
          <TextField label="description" value={description} onChange={setDescription} />
          <Toggle label="action（撤销）" checked={action} onChange={setAction} />
          <Toggle label="timeout: 0（不自动消失）" checked={persist} onChange={setPersist} description="需要用户处理的错误使用" />
          <Toggle label="priority: high" checked={high} onChange={setHigh} description="读屏立即播报，仅用于失败或紧急" />
        </>
      }
    >
      <div className="sc-playground__demo">
        <Button
          onClick={() =>
            toast.show({
              title: title || '…',
              description: description || undefined,
              status,
              timeout: persist ? 0 : undefined,
              priority: high ? 'high' : undefined,
              action: action ? { label: '撤销', onClick: () => toast.show({ title: '已撤销（演示）', status: 'neutral' }) } : undefined,
            })
          }
        >
          显示通知
        </Button>
        <p className="sc-small">通知出现在视口右下角；悬停或聚焦时暂停计时并展开堆叠。</p>
      </div>
    </Playground>
  );
}

function SyncDemo() {
  const toast = useToast();
  const [running, setRunning] = React.useState(false);
  const run = () => {
    setRunning(true);
    const id = toast.show({ title: '正在同步档案…', description: '共 3 条记录（演示）', status: 'info', timeout: 0 });
    window.setTimeout(() => {
      toast.update(id, { title: '同步完成', description: '3 条记录已更新（演示）', status: 'success', timeout: 4000 });
      setRunning(false);
    }, 1500);
  };
  return (
    <div className="sc-row">
      <Button variant="secondary" loading={running} onClick={run}>
        同步档案
      </Button>
      <Button
        variant="ghost"
        onClick={() =>
          toast.show({
            title: '同步失败',
            description: '网络连接中断（演示）。',
            status: 'danger',
            priority: 'high',
            timeout: 0,
            action: { label: '重试', onClick: run },
          })
        }
      >
        模拟失败
      </Button>
    </div>
  );
}

/** Repeated action → one toast: the same id updates in place and restarts its timer. */
function CopyDemo() {
  const toast = useToast();
  const count = React.useRef(0);
  return (
    <div className="sc-row">
      <Button
        variant="secondary"
        onClick={() => {
          count.current += 1;
          toast.show({
            id: 'copy-record-id',
            title: '已复制编号 ARC-1024',
            description: count.current > 1 ? `本次共复制 ${count.current} 次（演示）` : undefined,
            status: 'success',
          });
        }}
      >
        复制编号
      </Button>
      <span className="sc-small">连续点击只保留一条通知。</span>
    </div>
  );
}

const sampleItems = [
  { id: 'ARC-0007', title: '沉积物样本 · 第三批次' },
  { id: 'ARC-0012', title: '晶体结构观测记录' },
  { id: 'ARC-0019', title: '采样点坐标复核' },
];

/** Undo is a shortcut: the page shows the result and keeps its own restore entry. */
function UndoDemo() {
  const toast = useToast();
  const [items, setItems] = React.useState(sampleItems);
  const [deleted, setDeleted] = React.useState<typeof sampleItems>([]);
  const restore = (id: string) => {
    const item = sampleItems.find((i) => i.id === id);
    if (!item) return;
    setDeleted((d) => d.filter((i) => i.id !== id));
    // Back in its original position.
    setItems((list) => (list.some((i) => i.id === id) ? list : sampleItems.filter((i) => i.id === id || list.includes(i))));
  };
  const remove = (id: string) => {
    const item = items.find((i) => i.id === id);
    if (!item) return;
    setItems((list) => list.filter((i) => i.id !== id));
    setDeleted((d) => [...d, item]);
    toast.show({
      id: `deleted-${id}`,
      title: `已删除 ${id}`,
      description: '演示数据，仅在本页内存中。',
      status: 'warning',
      action: { label: '撤销', onClick: () => restore(id) },
    });
  };
  return (
    <div className="sc-card-list" data-testid="undo-demo">
      <ul className="sc-card-list" aria-label="示例记录">
        {items.map((item) => (
          <li key={item.id} className="sc-row">
            <span className="sc-mono-sm">{item.id}</span>
            <span>{item.title}</span>
            <Button size="sm" variant="ghost" onClick={() => remove(item.id)} aria-label={`删除 ${item.id}`}>
              删除
            </Button>
          </li>
        ))}
        {items.length === 0 && <li className="sc-small">列表为空。</li>}
      </ul>
      {deleted.length > 0 && (
        <div className="sc-card-list" role="group" aria-label="已删除（可恢复）">
          <p className="sc-small">已删除 {deleted.length} 条（演示）：</p>
          {deleted.map((item) => (
            <div key={item.id} className="sc-row">
              <span className="sc-mono-sm">{item.id}</span>
              <Button size="sm" variant="secondary" onClick={() => restore(item.id)}>
                恢复 {item.id}
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/** toast.promise: one toast follows the work from 处理中 to the result. */
function PromiseDemo() {
  const toast = useToast();
  const [fail, setFail] = React.useState(false);
  const [result, setResult] = React.useState<string | null>(null);
  const run = () => {
    setResult(null);
    const work = new Promise<number>((resolve, reject) => {
      window.setTimeout(() => (fail ? reject(new Error('示例服务超时')) : resolve(24)), 1200);
    });
    toast
      .promise(work, {
        loading: { title: '正在导出示例记录…', description: '共 24 条（演示）' },
        success: (n) => ({ title: '导出完成', description: `${n} 条示例记录已生成（未写入文件）。` }),
        error: (e) => ({ title: '导出失败', description: e instanceof Error ? e.message : '未知错误', action: { label: '重试', onClick: run } }),
      })
      .then(
        (n) => setResult(`最近一次：成功，${n} 条（演示）`),
        () => setResult('最近一次：失败（演示）'),
      );
  };
  return (
    <div className="sc-card-list">
      <div className="sc-row">
        <Button variant="secondary" onClick={run}>
          导出示例记录
        </Button>
        <Toggle label="模拟失败" checked={fail} onChange={setFail} />
      </div>
      <p className="sc-small" data-testid="promise-result">
        {result ?? '尚未导出。'}
      </p>
    </div>
  );
}

export function ToastPage() {
  return (
    <div className="sc-page">
      <PageHeader index="14" section="Navigation & Overlay" title="Toast">
        <p>
          基于 Base UI Toast。<code>RhineProvider</code> 挂载唯一的通知视口，组件中调用 <code>useToast()</code> 即可。视口是
          polite 实时区域，F6 可跳入；<code>priority: 'high'</code> 立即播报。悬停或聚焦时暂停计时并展开堆叠，触屏可滑动关闭。
        </p>
      </PageHeader>
      <SpecimenGrid>
        <ToastPlayground />
        <Specimen id="toast-sync" index="01" title="Progress → result" span="half" align="start" note="update() 原地替换内容，不叠加新通知；失败通知不自动消失并提供重试。">
          <SyncDemo />
        </Specimen>
        <Specimen id="toast-dedupe" index="02" title="Dedupe by id" span="half" align="start" note="show({ id }) 遇到仍在显示的同 id 通知时原地更新并重新计时，不堆叠。">
          <CopyDemo />
        </Specimen>
        <Specimen
          id="toast-undo"
          index="03"
          title="Undo action"
          span="half"
          align="start"
          note="点击操作后通知默认关闭（action.keepOpen 可保留）；带操作的通知至少停留 10 秒。撤销只是捷径：结果与「恢复」入口仍在页面上。"
        >
          <UndoDemo />
        </Specimen>
        <Specimen id="toast-promise" index="04" title="toast.promise" span="half" align="start" note="同一条通知从「处理中」更新为成功或失败；失败默认 priority: 'high' 且不自动消失。">
          <PromiseDemo />
        </Specimen>
        <Specimen id="toast-rules" index="05" title="Do / Don't" span="half" align="start" note="通知是对操作结果的补充，结果本身应在页面上可见。">
          <ul className="sc-rules">
            <li data-kind="do">一句话说明结果，附编号等具体对象</li>
            <li data-kind="do">可撤销的操作提供「撤销」</li>
            <li data-kind="dont">用通知承载表单校验错误（请放在字段旁）</li>
            <li data-kind="dont">对每次自动保存都弹通知</li>
          </ul>
        </Specimen>
      </SpecimenGrid>
    </div>
  );
}
