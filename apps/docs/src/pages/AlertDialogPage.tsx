import * as React from 'react';
import { AlertDialog, Button, Dialog, DialogClose, Field, IconButton, Input, Menu, MenuItem, StatusBadge } from '@wzrhine/react';
import type { AlertDialogTone } from '@wzrhine/react';
import { Download } from '../icons';
import { Playground } from '../ui/Playground';
import { PageHeader, Specimen, SpecimenGrid } from '../ui/Specimen';
import { Segmented, Toggle } from '../ui/controls';

function More(p: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor" aria-hidden="true" focusable="false" {...p}>
      <circle cx="5.5" cy="12" r="1.6" />
      <circle cx="12" cy="12" r="1.6" />
      <circle cx="18.5" cy="12" r="1.6" />
    </svg>
  );
}

function AlertDialogPlayground() {
  const [tone, setTone] = React.useState<AlertDialogTone>('danger');
  const [eyebrow, setEyebrow] = React.useState(true);
  const [deleted, setDeleted] = React.useState(0);
  const props = [
    eyebrow && 'eyebrow="ARCHIVE / DELETE"',
    'title="删除 REC-0101？"',
    'description="删除后无法恢复，关联的时间线也会一并移除。"',
    'confirmLabel="删除记录"',
    tone !== 'danger' && `tone="${tone}"`,
    'onConfirm={remove}',
  ].filter(Boolean);
  return (
    <Playground
      id="alert-dialog-playground"
      title="AlertDialog"
      code={['<AlertDialog', '  trigger={<Button variant="ghost">删除记录…</Button>}', ...props.map((p) => `  ${p}`), '/>'].join('\n')}
      controls={
        <>
          <Segmented
            legend="tone"
            name="pg-adlg-tone"
            value={tone}
            onChange={setTone}
            options={[
              { value: 'danger', label: 'danger' },
              { value: 'default', label: 'default' },
            ]}
          />
          <Toggle label="eyebrow" checked={eyebrow} onChange={setEyebrow} />
          <p className="sc-small sc-control-note">初始焦点在「取消」上；外部点击不关闭，Esc 等同取消。</p>
        </>
      }
    >
      <div className="sc-playground__demo sc-stack">
        <AlertDialog
          trigger={<Button variant="ghost">删除记录…</Button>}
          eyebrow={eyebrow ? 'ARCHIVE / DELETE' : undefined}
          title="删除 REC-0101？"
          description="删除后无法恢复，关联的时间线也会一并移除。"
          confirmLabel="删除记录"
          tone={tone}
          onConfirm={() => setDeleted((n) => n + 1)}
        />
        <p className="sc-small" role="status">
          {deleted > 0 ? `已确认删除 ${deleted} 次（演示，不会删除任何数据）` : '尚未确认'}
        </p>
      </div>
    </Playground>
  );
}

function AsyncConfirm() {
  const [failNext, setFailNext] = React.useState(false);
  const [result, setResult] = React.useState<string | null>(null);
  const failRef = React.useRef(failNext);
  failRef.current = failNext;

  return (
    <>
      <Toggle label="模拟请求失败" checked={failNext} onChange={setFailNext} description="开启后确认会失败，弹窗保持打开并显示错误。" />
      <div className="sc-row">
        <AlertDialog
          trigger={<Button variant="secondary">清空回收站…</Button>}
          eyebrow="ARCHIVE / PURGE"
          title="清空回收站？"
          description="回收站中的 12 条样例记录将被永久删除。"
          confirmLabel="清空"
          errorText="清空未完成：服务暂不可用（演示），请重试。"
          onConfirm={() =>
            new Promise<void>((resolve, reject) => {
              const fail = failRef.current;
              window.setTimeout(() => {
                if (fail) {
                  reject(new Error('sample failure'));
                } else {
                  setResult('已清空回收站（演示）');
                  resolve();
                }
              }, 1200);
            })
          }
        >
          <p className="sc-small">请求进行中时无法取消，Esc 也不会关闭。</p>
        </AlertDialog>
      </div>
      <p className="sc-small" role="status">
        {result ? (
          <>
            <StatusBadge status="success" size="sm">
              完成
            </StatusBadge>{' '}
            {result}
          </>
        ) : (
          '回收站：12 条（样例数据）'
        )}
      </p>
    </>
  );
}

function FromMenu() {
  const [target, setTarget] = React.useState<string | null>(null);
  const [archived, setArchived] = React.useState<string[]>([]);
  const id = 'REC-0102';
  return (
    <>
      <div className="sc-row">
        <code className="sc-mono-sm">{id}</code>
        <StatusBadge size="sm" status={archived.includes(id) ? 'success' : 'info'}>
          {archived.includes(id) ? '已归档' : '审核中'}
        </StatusBadge>
        <Menu trigger={<IconButton icon={<More />} label={`${id} 的操作`} variant="secondary" size="sm" />} align="end">
          <MenuItem icon={<Download />}>导出</MenuItem>
          <MenuItem tone="danger" onSelect={() => setTarget(id)}>
            归档…
          </MenuItem>
        </Menu>
      </div>
      <AlertDialog
        open={target !== null}
        onOpenChange={(open) => {
          if (!open) setTarget(null);
        }}
        title={`归档 ${target ?? id}？`}
        description="归档后记录变为只读，仍可在档案检索中查看。"
        confirmLabel="归档"
        tone="default"
        onConfirm={() => {
          if (target) setArchived((a) => [...a, target]);
        }}
      />
    </>
  );
}

function CloseGuard() {
  const [open, setOpen] = React.useState(false);
  const [note, setNote] = React.useState('');
  const [saved, setSaved] = React.useState('');
  const [confirmDiscard, setConfirmDiscard] = React.useState(false);
  const dirty = note !== saved;
  const noteRef = React.useRef<HTMLInputElement>(null);

  return (
    <>
      <Dialog
        trigger={<Button variant="secondary">编辑备注…</Button>}
        open={open}
        onOpenChange={(next) => {
          if (next) setNote(saved);
          setOpen(next);
        }}
        eyebrow="ARCHIVE / NOTE"
        title="编辑样本备注"
        description="未保存就关闭时会先确认。"
        initialFocus={noteRef}
        onCloseRequest={() => {
          if (!dirty) return;
          setConfirmDiscard(true);
          return false;
        }}
        actions={
          <>
            <DialogClose>
              <Button variant="ghost">取消</Button>
            </DialogClose>
            <Button
              onClick={() => {
                setSaved(note);
                setOpen(false);
              }}
            >
              保存
            </Button>
          </>
        }
      >
        <Field label="备注" optional>
          <Input ref={noteRef} value={note} onValueChange={setNote} maxLength={80} />
        </Field>
        <AlertDialog
          open={confirmDiscard}
          onOpenChange={setConfirmDiscard}
          title="放弃未保存的更改？"
          description="输入的备注将丢失。"
          cancelLabel="继续编辑"
          confirmLabel="放弃"
          onConfirm={() => {
            setNote(saved);
            setOpen(false);
          }}
        />
      </Dialog>
      <p className="sc-small" role="status">
        {saved ? `已保存备注：${saved}（演示）` : '尚无备注'}
      </p>
    </>
  );
}

export function AlertDialogPage() {
  return (
    <div className="sc-page">
      <PageHeader index="21" section="Navigation & Overlay" title="AlertDialog">
        <p>
          破坏性或不可撤销操作的确认，基于 Base UI AlertDialog：<code>role="alertdialog"</code>、强制模态、外部点击不关闭、Esc
          等同取消。初始焦点在「取消」上，确认按钮在后。<code>onConfirm</code> 可返回 Promise：等待期间确认按钮 loading、无法取消；失败时保持打开并用{' '}
          <code>role="alert"</code> 显示错误。动效与 Dialog 相同。
        </p>
      </PageHeader>
      <SpecimenGrid>
        <AlertDialogPlayground />
        <Specimen
          id="alert-dialog-async"
          index="01"
          title="Async confirm"
          span="half"
          note="演示请求固定 1.2 秒后完成；失败开关只影响下一次确认。"
        >
          <div className="sc-stack">
            <AsyncConfirm />
          </div>
        </Specimen>
        <Specimen
          id="alert-dialog-menu"
          index="02"
          title="Opened from a menu"
          span="half"
          note="受控用法：菜单项只设置状态；关闭后焦点回到菜单按钮。"
        >
          <div className="sc-stack">
            <FromMenu />
          </div>
        </Specimen>
        <Specimen
          id="alert-dialog-guard"
          index="03"
          title="Dialog close guard"
          span="half"
          note="Dialog 的 onCloseRequest 返回 false 时取消本次关闭，并打开嵌套的 AlertDialog。"
        >
          <div className="sc-stack">
            <CloseGuard />
          </div>
        </Specimen>
        <Specimen id="alert-dialog-rules" index="04" title="Usage rules" span="half" note="以上行为均在三内核 E2E 中断言。">
          <ul className="sc-rules">
            <li data-kind="do">description 写清后果；确认按钮用动作命名（「删除记录」而不是「确定」）</li>
            <li data-kind="do">取消在前、确认在后，初始焦点在取消上</li>
            <li data-kind="do">异步确认失败时留在弹窗内重试，不要关闭后再弹 Toast</li>
            <li data-kind="dont">用 AlertDialog 展示普通信息或表单；那是 Dialog 的用途</li>
          </ul>
        </Specimen>
      </SpecimenGrid>
    </div>
  );
}
