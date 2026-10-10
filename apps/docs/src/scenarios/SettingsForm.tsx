import * as React from 'react';
import {
  AlertDialog,
  Button,
  Checkbox,
  CheckboxGroup,
  Field,
  Input,
  MetadataList,
  Popover,
  PopoverClose,
  Radio,
  RadioGroup,
  Select,
  StatusIndicator,
  Tab,
  TabList,
  TabPanel,
  Tabs,
  Switch,
  Textarea,
  useToast,
} from '@wzrhine/react';

/**
 * Scenario 3 · 设置表单. A multi-section settings form with validation, dirty tracking, a
 * discard confirmation and a save toast. Values stay in memory; nothing is sent anywhere.
 */

interface Settings {
  labName: string;
  idPrefix: string;
  retentionDays: string;
  defaultCategory: string;
  contact: string;
  visibility: string;
  doubleReview: boolean;
  reminders: string[];
  footer: string;
}

const initial: Settings = {
  labName: '示例实验室',
  idPrefix: 'ARC',
  retentionDays: '365',
  defaultCategory: 'experiment',
  contact: '',
  visibility: 'internal',
  doubleReview: true,
  reminders: [],
  footer: '',
};

const reminderLabels: Record<string, string> = { review: '待复核', expiring: '草稿即将过期', weekly: '每周摘要' };
const visibilityLabels: Record<string, string> = { public: '公开', internal: '内部', restricted: '受限' };

function validate(s: Settings): Partial<Record<keyof Settings, string>> {
  const errors: Partial<Record<keyof Settings, string>> = {};
  if (!s.labName.trim()) errors.labName = '请填写实验室名称。';
  if (!/^[A-Z]{2,5}$/.test(s.idPrefix)) errors.idPrefix = '前缀应为 2–5 个大写字母，例如 ARC。';
  const days = Number(s.retentionDays);
  if (!Number.isInteger(days) || days < 30 || days > 3650) errors.retentionDays = '保留天数应为 30–3650 之间的整数。';
  if (s.contact && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.contact)) errors.contact = '请输入有效的邮箱地址，或留空。';
  if (s.reminders.length > 0 && !s.contact) errors.reminders = '开启提醒需要先填写联系邮箱。';
  return errors;
}

export function SettingsForm() {
  const toast = useToast();
  const [saved, setSaved] = React.useState(initial);
  const [draft, setDraft] = React.useState(initial);
  const [submitted, setSubmitted] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [confirmDiscard, setConfirmDiscard] = React.useState(false);
  const [tab, setTab] = React.useState('general');

  const errors = validate(draft);
  const errorCount = Object.keys(errors).length;
  const dirty = (Object.keys(draft) as (keyof Settings)[]).some((k) => JSON.stringify(draft[k]) !== JSON.stringify(saved[k]));
  const show = (key: keyof Settings) => (submitted ? errors[key] : undefined);
  const set =
    <K extends keyof Settings>(key: K) =>
    (value: Settings[K]) =>
      setDraft((d) => ({ ...d, [key]: value }));

  React.useEffect(() => {
    if (!saving) return;
    const t = window.setTimeout(() => {
      setSaved(draft);
      setSaving(false);
      setSubmitted(false);
      toast.show({ title: '设置已保存', description: '演示：仅保存在当前页面内存中。', status: 'success' });
    }, 800);
    return () => window.clearTimeout(t);
  }, [saving, draft, toast]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (errorCount > 0) {
      // Open the tab that holds the first invalid field so the error is visible.
      const fieldTab: Partial<Record<keyof Settings, string>> = {
        labName: 'general',
        contact: 'general',
        reminders: 'general',
        idPrefix: 'archive',
        retentionDays: 'archive',
      };
      const first = (['labName', 'contact', 'reminders', 'idPrefix', 'retentionDays'] as const).find((k) => errors[k]);
      if (first) setTab(fieldTab[first]!);
      toast.show({ title: `有 ${errorCount} 项需要修正`, status: 'danger', priority: 'high' });
      return;
    }
    setSaving(true);
  };

  return (
    <form className="sc-scenario sc-scenario--settings" aria-labelledby="settings-title" onSubmit={onSubmit} noValidate>
      <div className="sc-scenario__pane-head">
        <h2 id="settings-title" className="sc-specimen__title">
          档案设置
        </h2>
        <StatusIndicator
          live
          tone={saving ? 'info' : submitted && errorCount ? 'danger' : dirty ? 'warning' : 'success'}
          label={saving ? '正在保存' : submitted && errorCount ? `${errorCount} 项错误` : dirty ? '有未保存的更改' : '已保存'}
        />
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabList aria-label="设置分组">
          <Tab value="general" meta={submitted && (errors.labName || errors.contact || errors.reminders) ? '!' : undefined}>
            常规
          </Tab>
          <Tab value="archive" meta={submitted && (errors.idPrefix || errors.retentionDays) ? '!' : undefined}>
            档案规则
          </Tab>
          <Tab value="summary">概览</Tab>
        </TabList>

        <TabPanel value="general" keepMounted className="sc-settings__panel">
          <Field label="实验室名称" required error={show('labName')} invalid={!!show('labName')}>
            <Input value={draft.labName} onValueChange={set('labName')} required maxLength={40} />
          </Field>
          <Field label="联系邮箱" optional description="用于接收复核提醒。" error={show('contact')} invalid={!!show('contact')}>
            <Input type="email" value={draft.contact} onValueChange={set('contact')} autoComplete="email" />
          </Field>
          <CheckboxGroup
            label="邮件提醒"
            optional
            orientation="horizontal"
            value={draft.reminders}
            onValueChange={set('reminders')}
            invalid={!!show('reminders')}
            error={show('reminders')}
          >
            {Object.entries(reminderLabels).map(([value, label]) => (
              <Checkbox key={value} value={value} label={label} />
            ))}
          </CheckboxGroup>
          <Field label="记录页脚" optional description="显示在每份导出记录的末尾，可多行。">
            <Textarea value={draft.footer} onValueChange={set('footer')} rows={2} autoResize maxRows={6} maxLength={200} showCount />
          </Field>
        </TabPanel>

        <TabPanel value="archive" keepMounted className="sc-settings__panel">
          <Field label="编号前缀" required description="新建记录编号形如 前缀-0000。" error={show('idPrefix')} invalid={!!show('idPrefix')}>
            <Input value={draft.idPrefix} onValueChange={(v) => set('idPrefix')(v.toUpperCase())} mono maxLength={5} />
          </Field>
          <Field label="草稿保留天数" required error={show('retentionDays')} invalid={!!show('retentionDays')}>
            <Input value={draft.retentionDays} onValueChange={set('retentionDays')} inputMode="numeric" suffix="天" mono />
          </Field>
          <RadioGroup label="新建记录默认可见范围" orientation="horizontal" value={draft.visibility} onValueChange={(v) => set('visibility')(String(v))}>
            <Radio value="public" label="公开" />
            <Radio value="internal" label="内部" />
            <Radio value="restricted" label="受限" description="需项目负责人授权。" />
          </RadioGroup>
          <Switch
            label="启用双人复核"
            description="记录需两名成员复核后才能归档。"
            checked={draft.doubleReview}
            onCheckedChange={set('doubleReview')}
          />
          <Field label="默认类别">
            <Select
              value={draft.defaultCategory}
              onValueChange={(v) => set('defaultCategory')(v ?? 'experiment')}
              options={[
                { value: 'specimen', label: '样本' },
                { value: 'experiment', label: '实验记录' },
                { value: 'field-report', label: '外勤报告' },
                { value: 'document', label: '文档' },
              ]}
            />
          </Field>
          <Popover
            trigger={<Button variant="ghost" size="sm">编号规则说明</Button>}
            title="编号规则"
            size="sm"
            actions={
              <PopoverClose>
                <Button size="sm">知道了</Button>
              </PopoverClose>
            }
          >
            <p className="sc-small">编号由前缀与四位序号组成，序号按创建顺序递增，不复用已删除的序号。</p>
          </Popover>
        </TabPanel>

        <TabPanel value="summary" className="sc-settings__panel">
          <MetadataList
            aria-label="当前已保存的设置"
            items={[
              { label: '实验室', value: saved.labName },
              { label: '编号示例', value: `${saved.idPrefix}-0001`, mono: true },
              { label: '草稿保留', value: `${saved.retentionDays} 天`, mono: true },
              { label: '联系邮箱', value: saved.contact },
              { label: '默认可见范围', value: visibilityLabels[saved.visibility] },
              { label: '双人复核', value: saved.doubleReview ? '启用' : '关闭' },
              { label: '邮件提醒', value: saved.reminders.map((r) => reminderLabels[r]).join('、') },
              { label: '记录页脚', value: saved.footer },
            ]}
            empty="placeholder"
          />
        </TabPanel>
      </Tabs>

      <div className="sc-form__actions">
        <Button type="button" variant="ghost" disabled={!dirty || saving} onClick={() => setConfirmDiscard(true)}>
          放弃更改
        </Button>
        <Button type="submit" loading={saving} disabled={!dirty}>
          保存设置
        </Button>
      </div>

      <AlertDialog
        open={confirmDiscard}
        onOpenChange={setConfirmDiscard}
        title="放弃未保存的更改？"
        description="表单将恢复为上次保存的内容。"
        cancelLabel="继续编辑"
        confirmLabel="放弃更改"
        onConfirm={() => {
          setDraft(saved);
          setSubmitted(false);
        }}
      />
    </form>
  );
}
