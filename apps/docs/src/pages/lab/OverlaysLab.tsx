import * as React from 'react';
import { Dialog } from '@base-ui/react/dialog';
import { Field } from '@base-ui/react/field';
import { Select } from '@base-ui/react/select';
import { AnimatePresence, motion } from 'motion/react';
import { Button, StatusBadge, transition, useRhineMotion } from '@wzrhine/react';
import { usePortalContainer } from '../../app/portal';
import { PageHeader, Specimen, SpecimenGrid } from '../../ui/Specimen';
import './overlays-lab.css';

/**
 * ADR-0001 validation page. Not a public component: proves Base UI + motion/react + --rl-* tokens
 * compose correctly before Dialog/Select are promoted into @wzrhine/react (M2).
 */

const categories = [
  { value: 'specimen', label: '样本' },
  { value: 'experiment', label: '实验记录' },
  { value: 'field-report', label: '外勤报告' },
  { value: 'personnel', label: '人员档案' },
];

function Check() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
      <path d="m3 8.5 3.5 3.5L13 4.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Chevron() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
      <path d="m4 6 4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ArchiveDialog({ onConfirm }: { onConfirm: (note: string) => void }) {
  const [open, setOpen] = React.useState(false);
  const [note, setNote] = React.useState('');
  const motionPrefs = useRhineMotion();
  const container = usePortalContainer();
  const offset = motionPrefs.reduced ? 0 : 8;

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger render={<Button variant="secondary" />}>归档记录…</Dialog.Trigger>
      <AnimatePresence>
        {open && (
          <Dialog.Portal keepMounted container={container}>
            <Dialog.Backdrop
              className="rl-dialog__backdrop"
              render={
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={motionPrefs.get('fast')}
                />
              }
            />
            <Dialog.Popup
              className="rl-dialog__popup"
              render={
                <motion.div
                  initial={{ opacity: 0, y: offset }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: offset }}
                  transition={motionPrefs.reduced ? transition.instant : transition.panel}
                />
              }
            >
              <p className="rl-dialog__eyebrow">ARCHIVE / CONFIRM</p>
              <Dialog.Title className="rl-dialog__title">确认归档</Dialog.Title>
              <Dialog.Description className="rl-dialog__description">
                归档后记录变为只读，仍可在档案检索中查看。
              </Dialog.Description>
              <Field.Root className="lab-field">
                <Field.Label className="lab-field__label">归档备注</Field.Label>
                <Field.Control
                  className="lab-field__control"
                  value={note}
                  onValueChange={setNote}
                  placeholder="可选"
                />
                <Field.Description className="lab-field__description">仅内部可见。</Field.Description>
              </Field.Root>
              <div className="rl-dialog__actions">
                <Dialog.Close render={<Button variant="ghost" />}>取消</Dialog.Close>
                <Button
                  variant="primary"
                  onClick={() => {
                    onConfirm(note);
                    setOpen(false);
                  }}
                >
                  确认归档
                </Button>
              </div>
            </Dialog.Popup>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}

function CategorySelect({ value, onChange }: { value: string | null; onChange: (v: string | null) => void }) {
  const container = usePortalContainer();
  return (
    <Field.Root className="lab-field">
      <Field.Label className="lab-field__label" nativeLabel={false} render={<div />}>
        记录类别
      </Field.Label>
      <Select.Root items={categories} value={value} onValueChange={(v) => onChange(v as string | null)}>
        <Select.Trigger className="lab-select__trigger">
          <Select.Value className="lab-select__value" placeholder="选择类别" />
          <Select.Icon className="lab-select__icon">
            <Chevron />
          </Select.Icon>
        </Select.Trigger>
        <Select.Portal container={container}>
          <Select.Positioner className="lab-select__positioner" sideOffset={4} alignItemWithTrigger={false}>
            <Select.Popup className="lab-select__popup">
              <Select.List className="lab-select__list">
                {categories.map((c) => (
                  <Select.Item key={c.value} value={c.value} className="lab-select__item">
                    <Select.ItemIndicator className="lab-select__indicator">
                      <Check />
                    </Select.ItemIndicator>
                    <Select.ItemText>{c.label}</Select.ItemText>
                  </Select.Item>
                ))}
              </Select.List>
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>
      <Field.Description className="lab-field__description">选择后用于档案检索的筛选。</Field.Description>
    </Field.Root>
  );
}

export function OverlaysLab() {
  const [log, setLog] = React.useState<string[]>([]);
  const [category, setCategory] = React.useState<string | null>(null);
  const push = (entry: string) => setLog((l) => [entry, ...l].slice(0, 5));

  return (
    <div className="sc-page">
      <PageHeader index="LAB" section="ADR-0001 / Validation" title="Base UI overlays">
        <p>
          交互底座验证页：Base UI 负责焦点、键盘与 ARIA，视觉全部来自 <code>--rl-*</code> tokens，动画走 <code>useRhineMotion()</code>。
          这里的 Dialog / Select 尚不是公开组件，M2 才会进入 <code>@wzrhine/react</code>。
        </p>
      </PageHeader>
      <SpecimenGrid>
        <Specimen
          id="lab-dialog"
          index="01"
          title="Dialog"
          span="half"
          note="Tab 循环在弹窗内 · Esc 关闭 · 焦点归还触发按钮 · 背景滚动锁定 · panel 280ms，减动时只显隐。"
        >
          <div className="sc-row">
            <ArchiveDialog onConfirm={(note) => push(`已确认归档${note ? `（备注：${note}）` : ''}`)} />
          </div>
          <ul className="lab-log" aria-live="polite" aria-label="操作记录">
            {log.length === 0 ? <li className="sc-small">尚无操作</li> : log.map((l, i) => <li key={i}>{l}</li>)}
          </ul>
        </Specimen>
        <Specimen
          id="lab-select"
          index="02"
          title="Select"
          span="half"
          note="方向键移动 · Enter 选择 · Esc 取消不改值 · 弹层在视口内碰撞避让。"
        >
          <CategorySelect value={category} onChange={setCategory} />
          <p className="sc-small">
            当前值：{' '}
            {category ? (
              <StatusBadge status="info" size="sm">
                {categories.find((c) => c.value === category)?.label}
              </StatusBadge>
            ) : (
              '未选择'
            )}
          </p>
        </Specimen>
      </SpecimenGrid>
    </div>
  );
}
