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
              action: action ? { label: '撤销', onClick: () => toast.show({ title: '已撤销', status: 'neutral' }) } : undefined,
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
        <Specimen id="toast-rules" index="02" title="Do / Don't" span="half" align="start" note="通知是对操作结果的补充，结果本身应在页面上可见。">
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
