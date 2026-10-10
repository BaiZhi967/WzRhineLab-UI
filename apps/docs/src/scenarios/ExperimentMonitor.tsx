import * as React from 'react';
import {
  Button,
  Dialog,
  DialogClose,
  Field,
  Input,
  MetadataList,
  RecordHeader,
  Progress,
  StatusIndicator,
  Surface,
  Timeline,
  useToast,
} from '@wzrhine/react';
import type { TimelineEvent } from '@wzrhine/react';
import { protocol, records } from './data';

/**
 * Scenario 2 · 实验监测. Tracks progress through a fixed protocol. Nothing ticks on a timer and
 * no sensor values are shown: each step is completed by the operator, and the timeline records
 * the moment it happened (the user's own clock). This keeps the screen honest while still
 * exercising live-region status, a confirm dialog and toasts.
 */

const experiment = records.find((r) => r.id === 'ARC-1024')!;

function formatNow(d: Date) {
  const pad = (n: number) => String(n).padStart(2, '0');
  return {
    iso: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`,
    label: `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`,
  };
}

export function ExperimentMonitor() {
  const toast = useToast();
  const [done, setDone] = React.useState(0);
  const [log, setLog] = React.useState<TimelineEvent[]>([]);
  const [note, setNote] = React.useState('');
  const [confirmReset, setConfirmReset] = React.useState(false);
  const finished = done >= protocol.length;
  const current = protocol[done];

  const completeStep = () => {
    if (!current) return;
    const at = formatNow(new Date());
    setLog((l) => [
      {
        id: `${current.id}-${l.length}`,
        title: `完成：${current.title}`,
        dateTime: at.iso,
        time: at.label,
        description: note.trim() || current.description,
        tone: 'success',
        actor: '当前操作员',
      },
      ...l,
    ]);
    setNote('');
    const next = done + 1;
    setDone(next);
    if (next >= protocol.length) toast.show({ title: '流程已完成', description: '可提交复核。', status: 'success' });
  };

  const reset = () => {
    setDone(0);
    setLog([]);
    setNote('');
    toast.show({ title: '已重置演示流程', status: 'neutral' });
  };

  const state = finished
    ? ({ tone: 'success', label: '已完成', detail: `${protocol.length} / ${protocol.length} 步` } as const)
    : done === 0
      ? ({ tone: 'neutral', label: '未开始', detail: `0 / ${protocol.length} 步` } as const)
      : ({ tone: 'info', label: '进行中', detail: `${done} / ${protocol.length} 步` } as const);

  return (
    <div className="sc-scenario sc-scenario--monitor">
      <RecordHeader
        headingLevel={2}
        trail={[{ label: '实验' }, { label: experiment.id }]}
        recordId={experiment.id}
        status={{ tone: state.tone, label: state.label }}
        title={experiment.title}
        classification={['实验记录', experiment.discipline]}
        summary="按规程逐步执行；每一步由操作员确认完成，时间线记录确认时刻。"
        meta={[
          { label: '负责人', value: experiment.owner },
          { label: '地点', value: experiment.location },
        ]}
      />

      <div className="sc-monitor">
        <Surface aria-labelledby="monitor-steps" className="sc-monitor__steps">
          <div className="sc-scenario__pane-head">
            <h3 id="monitor-steps" className="sc-specimen__title">
              规程步骤
            </h3>
            <StatusIndicator tone={state.tone} label={state.label} detail={state.detail} live />
          </div>
          <Progress
            label="规程进度"
            hideLabel
            size="sm"
            value={done}
            max={protocol.length}
            tone={finished ? 'success' : 'neutral'}
            getValueText={(_, v) => `已完成 ${v} / ${protocol.length} 步`}
            valueText={false}
          />
          <ol className="sc-steps">
            {protocol.map((step, index) => {
              const status = index < done ? 'done' : index === done ? 'current' : 'todo';
              return (
                <li key={step.id} className="sc-steps__item" data-status={status} aria-current={status === 'current' ? 'step' : undefined}>
                  <span className="sc-steps__index" aria-hidden="true">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span className="sc-steps__text">
                    <span className="sc-steps__title">{step.title}</span>
                    <span className="sc-small">{step.description}</span>
                  </span>
                  <span className="sc-steps__state">{status === 'done' ? '已完成' : status === 'current' ? '当前' : '待执行'}</span>
                </li>
              );
            })}
          </ol>
          <form
            className="sc-monitor__form"
            onSubmit={(e) => {
              e.preventDefault();
              completeStep();
            }}
          >
            <Field label="步骤备注" optional description="留空则使用规程说明。">
              <Input value={note} onValueChange={setNote} disabled={finished} maxLength={80} />
            </Field>
            <div className="sc-row">
              <Button type="submit" disabled={finished}>
                {current ? `完成「${current.title}」` : '流程已完成'}
              </Button>
              <Button type="button" variant="ghost" disabled={done === 0} onClick={() => setConfirmReset(true)}>
                重置
              </Button>
            </div>
          </form>
        </Surface>

        <Surface aria-labelledby="monitor-log" className="sc-monitor__log">
          <h3 id="monitor-log" className="sc-specimen__title">
            操作时间线
          </h3>
          <Timeline events={log} aria-label="操作时间线" reversed emptyText="尚未完成任何步骤。" />
          <MetadataList
            size="sm"
            items={[
              { label: '已完成', value: `${done} 步`, mono: true },
              { label: '剩余', value: `${protocol.length - done} 步`, mono: true },
            ]}
          />
        </Surface>
      </div>

      <Dialog
        open={confirmReset}
        onOpenChange={setConfirmReset}
        title="重置演示流程？"
        description="将清空已完成的步骤与时间线。"
        size="sm"
        dismissOnOutsideClick={false}
        actions={
          <>
            <DialogClose>
              <Button variant="ghost">取消</Button>
            </DialogClose>
            <DialogClose>
              <Button onClick={reset}>重置</Button>
            </DialogClose>
          </>
        }
      />
    </div>
  );
}
