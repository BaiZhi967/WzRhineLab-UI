import * as React from 'react';
import { Alert, Button, Field, Fieldset, Form, Input, Radio, RadioGroup, Switch, Text } from '@wzrhine/react';
import type { FaultMode, Faults } from './resources';

/**
 * Settings page (P030-08 / P030-07 recipe): grouped preferences with dirty/saving/saved/error
 * facts (the adapter executes the save), plus the fault-injection panel and demo-data reset.
 * UI 偏好之外不保存任何东西；凭据与权限留在宿主。
 */

type SaveState = 'idle' | 'dirty' | 'saving' | 'saved' | 'error';

export function SettingsPage({
  faults,
  onFaultsChange,
  onResetAll,
}: {
  faults: Faults;
  onFaultsChange: (next: Faults) => void;
  onResetAll: () => void;
}) {
  const [nickname, setNickname] = React.useState('示例研究员');
  const [digest, setDigest] = React.useState(true);
  const [saveState, setSaveState] = React.useState<SaveState>('idle');

  const save = () => {
    setSaveState('saving');
    // Adapter: persist locally; the error fault turns the save into a failure demo.
    window.setTimeout(() => setSaveState(faults.mode === 'error' ? 'error' : 'saved'), 300);
  };

  return (
    <div className="desk settings">
      <Text as="h2" variant="heading-2">设置</Text>
      <Form
        onSubmit={(event) => {
          event.preventDefault();
          save();
        }}
      >
        <div className="settings__stack">
          {saveState === 'saved' && <Alert tone="success" title="设置已保存">已写入本机浏览器。</Alert>}
          {saveState === 'error' && (
            <Alert tone="danger" title="保存失败">
              <Button variant="secondary" size="sm" onClick={save}>重试</Button>
            </Alert>
          )}
          <Fieldset legend="偏好">
            <Field label="显示昵称">
              <Input value={nickname} onChange={(event) => { setNickname(event.target.value); setSaveState('dirty'); }} />
            </Field>
            <Field label="结果摘要" description="仅本地演示。">
              <Switch label="启用摘要" checked={digest} onCheckedChange={(next) => { setDigest(next); setSaveState('dirty'); }} />
            </Field>
          </Fieldset>

          <Fieldset legend="故障注入（演示适配器）">
            <p className="settings__hint">
              只影响资源页的读取管线与保存结果：用于验证等待态、错误恢复与过期响应防护。
            </p>
            <RadioGroup
              label="注入模式"
              value={faults.mode}
              onValueChange={(mode) => onFaultsChange({ ...faults, mode: mode as FaultMode })}
              orientation="vertical"
            >
              <Radio value="none" label="无（正常）" />
              <Radio value="error" label="错误（读取/保存失败）" />
              <Radio value="delay" label="延迟（慢响应）" />
              <Radio value="stale" label="过期（返回请求时的旧结果）" />
            </RadioGroup>
            <Field label="延迟毫秒" layout="inline">
              <Input
                type="number"
                value={String(faults.delayMs)}
                onChange={(event) => onFaultsChange({ ...faults, delayMs: Math.max(100, Number(event.target.value) || 600) })}
              />
            </Field>
          </Fieldset>

          <div className="settings__row">
            <Button type="submit" disabled={saveState === 'saving'}>{saveState === 'saving' ? '保存中…' : '保存设置'}</Button>
            {saveState === 'dirty' && <span className="settings__hint">有未保存的修改。</span>}
            <Button type="button" variant="ghost" onClick={onResetAll}>恢复演示数据</Button>
          </div>
          <p className="settings__hint">
            本地存储带命名空间与版本（wzrhine-example:archive-desk:*）；「恢复演示数据」清空本机修改并回到 1,000 条档案 / 240 条资源的初始样例。
          </p>
        </div>
      </Form>
    </div>
  );
}
