import * as React from 'react';
import { Alert, Button, Field, Fieldset, Form, Input, Radio, RadioGroup, Switch, Text } from '@wzrhine/react';
import type { FaultMode, Faults } from './resources';
import { useSettings } from './DeskStore';
import { setSettingsWriteFailure } from './settings';

/**
 * Settings page (P030-08 / P030-07 recipe): grouped preferences with dirty/saving/saved/error
 * facts, plus the fault-injection panel and demo-data reset. UI 偏好之外不保存任何东西；凭据与
 * 权限留在宿主。
 *
 * The save goes through the local settings adapter and `saved` is only reported when the write
 * actually succeeded (audit F03 — this page used to announce "已写入本机浏览器" from a bare
 * timer, without ever touching storage).
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
  const { settings, save: persist } = useSettings();
  // Draft values: the committed settings are the baseline the form compares against.
  const [nickname, setNickname] = React.useState(settings.nickname);
  const [digest, setDigest] = React.useState(settings.digest);
  const [saveState, setSaveState] = React.useState<SaveState>('idle');
  const [errorMessage, setErrorMessage] = React.useState('');

  const dirty = nickname !== settings.nickname || digest !== settings.digest;
  const saveTimer = React.useRef<number | undefined>(undefined);
  const saveToken = React.useRef(0);
  React.useEffect(() => () => window.clearTimeout(saveTimer.current), []);

  // An *external* change has to replace the draft: "restore demo data" wipes stored settings
  // while this page is mounted. A successful save commits the draft itself, so afterwards the
  // stored value already equals the draft — that comparison is what tells the two apart, instead
  // of inspecting `saveState` (which would clear the receipt we just produced).
  const draft = React.useRef({ nickname, digest });
  draft.current = { nickname, digest };
  React.useEffect(() => {
    if (settings.nickname === draft.current.nickname && settings.digest === draft.current.digest) return;
    setNickname(settings.nickname);
    setDigest(settings.digest);
    setSaveState('idle');
    setErrorMessage('');
    // A save in flight belongs to the replaced draft; its receipt must not land.
    saveToken.current += 1;
    window.clearTimeout(saveTimer.current);
  }, [settings]);

  // The error fault makes the adapter's write fail, so the demo exercises a real failure path
  // instead of a fake one.
  React.useEffect(() => {
    setSettingsWriteFailure(faults.mode === 'error');
    return () => setSettingsWriteFailure(false);
  }, [faults.mode]);

  const save = () => {
    const token = ++saveToken.current;
    const snapshot = { nickname, digest };
    setSaveState('saving');
    // The delay only simulates a round trip; the write itself is synchronous below.
    saveTimer.current = window.setTimeout(() => {
      // A newer save (or a reset) started meanwhile: drop this receipt rather than letting it
      // mark later edits as saved.
      if (saveToken.current !== token) return;
      const result = persist(snapshot);
      if (result.ok) {
        setSaveState('saved');
        setErrorMessage('');
      } else {
        setSaveState('error');
        setErrorMessage(result.message);
      }
    }, 300);
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
          {saveState === 'saved' && !dirty && (
            <Alert tone="success" title="设置已保存">已写入本机浏览器（重新加载后保留）。</Alert>
          )}
          {saveState === 'error' && (
            <Alert tone="danger" title="保存失败">
              <p className="settings__hint">{errorMessage}输入未丢失，可直接重试。</p>
              <Button variant="secondary" size="sm" onClick={save}>重试</Button>
            </Alert>
          )}
          <Fieldset legend="偏好">
            <Field label="显示昵称">
              <Input value={nickname} onChange={(event) => setNickname(event.target.value)} />
            </Field>
            <Field label="结果摘要" description="仅本地演示。">
              <Switch label="启用摘要" checked={digest} onCheckedChange={setDigest} />
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
            {/* `loading` keeps the button focusable (aria-disabled) and blocks repeat submits. */}
            <Button type="submit" loading={saveState === 'saving'}>
              {saveState === 'saving' ? '保存中…' : '保存设置'}
            </Button>
            {dirty && saveState !== 'saving' && <span className="settings__hint">有未保存的修改。</span>}
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
