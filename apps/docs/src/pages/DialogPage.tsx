import * as React from 'react';
import { Button, Dialog, DialogClose, Field, Input, StatusBadge } from '@wzrhine/react';
import type { DialogSize } from '@wzrhine/react';
import { Archive } from '../icons';
import { Playground } from '../ui/Playground';
import { PageHeader, Specimen, SpecimenGrid } from '../ui/Specimen';
import { Segmented, Toggle } from '../ui/controls';

function DialogPlayground() {
  const [size, setSize] = React.useState<DialogSize>('md');
  const [eyebrow, setEyebrow] = React.useState(true);
  const [dismiss, setDismiss] = React.useState(true);
  const props = [
    eyebrow && 'eyebrow="ARCHIVE / CONFIRM"',
    'title="确认归档"',
    'description="归档后记录变为只读。"',
    size !== 'md' && `size="${size}"`,
    !dismiss && 'dismissOnOutsideClick={false}',
  ].filter(Boolean);
  return (
    <Playground
      id="dialog-playground"
      title="Dialog"
      code={[
        '<Dialog',
        '  trigger={<Button variant="secondary">归档记录…</Button>}',
        ...props.map((p) => `  ${p}`),
        '  actions={<>',
        '    <DialogClose><Button variant="ghost">取消</Button></DialogClose>',
        '    <DialogClose><Button onClick={archive}>确认归档</Button></DialogClose>',
        '  </>}',
        '/>',
      ].join('\n')}
      controls={
        <>
          <Segmented
            legend="size"
            name="pg-dlg-size"
            value={size}
            onChange={setSize}
            options={[
              { value: 'sm', label: 'sm' },
              { value: 'md', label: 'md' },
              { value: 'lg', label: 'lg' },
            ]}
          />
          <Toggle label="eyebrow" checked={eyebrow} onChange={setEyebrow} />
          <Toggle label="点击遮罩关闭" checked={dismiss} onChange={setDismiss} description="破坏性确认建议关闭" />
          <p className="sc-small sc-control-note">预览主题/密度切换会作用于弹窗：弹窗挂载在该预览的 RhineProvider 内。</p>
        </>
      }
    >
      <div className="sc-playground__demo">
        <Dialog
          trigger={<Button variant="secondary">归档记录…</Button>}
          eyebrow={eyebrow ? 'ARCHIVE / CONFIRM' : undefined}
          title="确认归档"
          description="归档后记录变为只读，仍可在档案检索中查看。"
          size={size}
          dismissOnOutsideClick={dismiss}
          actions={
            <>
              <DialogClose>
                <Button variant="ghost">取消</Button>
              </DialogClose>
              <DialogClose>
                <Button>确认归档</Button>
              </DialogClose>
            </>
          }
        />
      </div>
    </Playground>
  );
}

function FormDialog() {
  const [saved, setSaved] = React.useState<string | null>(null);
  const [open, setOpen] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const noteRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (!busy) return;
    const t = window.setTimeout(() => {
      setBusy(false);
      setSaved(noteRef.current?.value || '（无备注）');
      setOpen(false);
    }, 900);
    return () => window.clearTimeout(t);
  }, [busy]);

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(next) => !busy && setOpen(next)}
        trigger={<Button iconStart={<Archive />}>归档并备注…</Button>}
        eyebrow="ARCHIVE / NOTE"
        title="归档样本记录"
        description="备注仅内部可见。保存期间不可关闭。"
        initialFocus={noteRef}
        dismissOnOutsideClick={false}
        actions={
          <>
            <DialogClose>
              <Button variant="ghost" disabled={busy}>
                取消
              </Button>
            </DialogClose>
            <Button loading={busy} onClick={() => setBusy(true)}>
              保存并归档
            </Button>
          </>
        }
      >
        <Field label="归档备注" optional description="最多 120 字。">
          <Input ref={noteRef} maxLength={120} placeholder="例如：复核完成" />
        </Field>
      </Dialog>
      <p className="sc-small" role="status">
        {saved ? (
          <>
            <StatusBadge status="success" size="sm">
              已归档
            </StatusBadge>{' '}
            备注：{saved}（演示）
          </>
        ) : (
          '尚未归档'
        )}
      </p>
    </>
  );
}

export function DialogPage() {
  return (
    <div className="sc-page">
      <PageHeader index="10" section="Navigation & Overlay" title="Dialog">
        <p>
          基于 Base UI Dialog：焦点陷阱、Esc、滚动锁定、背景隔离与关闭后焦点归还由底座负责；进出场走 motion/react
          （panel 280ms + 8px 上浮，遮罩 120ms），减动时只淡入淡出。弹窗挂载到最近的 <code>RhineProvider</code>，继承主题与密度。
        </p>
      </PageHeader>
      <SpecimenGrid>
        <DialogPlayground />
        <Specimen id="dialog-form" index="01" title="Form in dialog" span="half" note="initialFocus 指向输入框；保存中禁止关闭，按钮 loading 阻止重复提交。">
          <div className="sc-stack">
            <FormDialog />
          </div>
        </Specimen>
        <Specimen id="dialog-rules" index="02" title="Behaviour" span="half" note="以上行为均在 Chromium E2E 中断言。">
          <ul className="sc-rules">
            <li data-kind="do">Tab / Shift+Tab 在弹窗内循环</li>
            <li data-kind="do">Esc 或「取消」关闭，焦点回到触发按钮</li>
            <li data-kind="do">快速连续开关不会残留弹窗或排队播放动画</li>
            <li data-kind="dont">在弹窗中再打开长流程；超过一屏的任务请用独立页面</li>
          </ul>
        </Specimen>
      </SpecimenGrid>
    </div>
  );
}
