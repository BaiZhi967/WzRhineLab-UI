import * as React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MotionConfig } from 'motion/react';
import { describe, expect, it, vi } from 'vitest';
import type { AttachmentView, ModelEffort, ModelProviderView, PermissionModeView, ReferenceView } from '@wzrhine/agent-core';
import { AttachmentList } from '../src/components/composer/AttachmentList';
import { ModelPicker } from '../src/components/composer/ModelPicker';
import { PermissionPicker } from '../src/components/composer/PermissionPicker';
import { SendStopButton } from '../src/components/composer/SendStopButton';
import { isSafeThumbnail, resolveSendStop } from '../src/components/composer/composer-utils';

const png = 'data:image/png;base64,iVBORw0KGgo=';

describe('SendStopButton', () => {
  const button = () => document.querySelector('.rl-agent-send') as HTMLButtonElement;

  it('send ↔ stop on one element; focus is kept; labels switch', async () => {
    const user = userEvent.setup();
    const onSend = vi.fn();
    const onStop = vi.fn();
    const { rerender } = render(<SendStopButton canSend onSend={onSend} onStop={onStop} runStatus="idle" />);
    const el = button();
    expect(el).toHaveAccessibleName('发送');
    await user.click(el);
    expect(onSend).toHaveBeenCalledTimes(1);
    expect(el).toHaveFocus();
    rerender(<SendStopButton canSend onSend={onSend} onStop={onStop} runStatus="running" />);
    expect(button()).toBe(el);
    expect(el).toHaveFocus();
    expect(el).toHaveAccessibleName('停止生成');
    expect(el).toHaveAttribute('data-icon', 'stop');
    await user.click(el);
    expect(onStop).toHaveBeenCalledTimes(1);
    expect(onSend).toHaveBeenCalledTimes(1);
  });

  it('stop sent ≠ stopped: submitting / accepted / cancelling show 停止待确认 and are inert', async () => {
    const user = userEvent.setup();
    const onStop = vi.fn();
    for (const props of [{ stopReceipt: 'submitting' as const }, { stopReceipt: 'accepted' as const }, { runStatus: 'cancelling' as const }]) {
      const { unmount } = render(<SendStopButton canSend={false} onStop={onStop} runStatus="running" {...props} />);
      expect(button()).toHaveAccessibleName('停止待确认');
      expect(button()).toHaveAttribute('aria-disabled', 'true');
      await user.click(button());
      unmount();
    }
    expect(onStop).not.toHaveBeenCalled();
  });

  it('unknown receipt: inert 结果待确认, or retry with the same actionId when safe', async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    const onSend = vi.fn();
    const { rerender } = render(<SendStopButton canSend onSend={onSend} sendReceipt={{ status: 'unknown', actionId: 'a-1', retryable: false }} onRetry={onRetry} />);
    expect(button()).toHaveAccessibleName('结果待确认');
    await user.click(button());
    expect(onRetry).not.toHaveBeenCalled();
    expect(onSend).not.toHaveBeenCalled();
    rerender(<SendStopButton canSend onSend={onSend} sendReceipt={{ status: 'unknown', actionId: 'a-1', retryable: true }} onRetry={onRetry} />);
    expect(button()).toHaveAccessibleName('重试同一发送');
    await user.click(button());
    expect(onRetry).toHaveBeenCalledWith('send', 'a-1');
    expect(onSend).not.toHaveBeenCalled();
    rerender(<SendStopButton canSend={false} onStop={() => {}} runStatus="running" stopReceipt={{ status: 'unknown', actionId: 's-9' }} onRetry={onRetry} />);
    expect(button()).toHaveAccessibleName('重试同一停止');
    await user.click(button());
    expect(onRetry).toHaveBeenLastCalledWith('stop', 's-9');
  });

  it('sending is busy; empty is described by the reason; retry-save', async () => {
    const user = userEvent.setup();
    const onRetrySave = vi.fn();
    const { rerender } = render(<SendStopButton canSend onSend={() => {}} sendReceipt="submitting" />);
    expect(button()).toHaveAccessibleName('正在发送');
    expect(button()).toHaveAttribute('aria-busy', 'true');
    rerender(<SendStopButton canSend={false} onSend={() => {}} disabledReason="示例原因" />);
    expect(button()).toHaveAttribute('aria-disabled', 'true');
    expect(button()).toHaveAccessibleDescription('示例原因');
    rerender(<SendStopButton canSend onSend={() => {}} draftStatus="error" onRetrySave={onRetrySave} />);
    expect(button()).toHaveAccessibleName('重试保存');
    await user.click(button());
    expect(onRetrySave).toHaveBeenCalled();
  });

  it('without callbacks nothing is actionable', () => {
    render(<SendStopButton canSend runStatus="running" />);
    expect(button()).toHaveAttribute('aria-disabled', 'true');
  });

  it('reduced motion: icons swap without animation', () => {
    render(
      <MotionConfig reducedMotion="always">
        <SendStopButton canSend onSend={() => {}} />
      </MotionConfig>,
    );
    const icons = document.querySelectorAll('.rl-agent-send__icon');
    expect(icons).toHaveLength(3);
    expect(icons[0]).toHaveAttribute('data-visible');
  });

  it('resolveSendStop covers modes', () => {
    const base = { canSend: true, hasSend: true, hasStop: true, hasRetry: false, hasRetrySave: false };
    expect(resolveSendStop({ ...base, mode: 'stop' }).state).toBe('stop');
    expect(resolveSendStop({ ...base, runStatus: 'queued' }).state).toBe('stop');
    expect(resolveSendStop({ ...base, runStatus: 'completed' }).state).toBe('send');
    expect(resolveSendStop({ ...base, runStatus: 'running', hasStop: false }).enabled).toBe(false);
  });
});

describe('AttachmentList', () => {
  const attachments: AttachmentView[] = [
    { id: 'a', name: 'sample.png', kind: 'image', size: 2048, status: 'ready', thumbnail: png, alt: '示例缩略图' },
    { id: 'b', name: 'report-with-a-very-long-name.pdf', kind: 'pdf', size: 1_048_576, status: 'uploading', progress: 0.4 },
    { id: 'c', name: 'data.csv', kind: 'text', status: 'uploading' },
    { id: 'd', name: 'fail.zip', kind: 'file', status: 'failed', reason: '示例：网络中断' },
    { id: 'e', name: 'remote.png', kind: 'image', status: 'ready', thumbnail: 'https://example.invalid/x.png' },
  ];
  const references: ReferenceView[] = [
    { id: 'r1', kind: 'file', label: 'agent.ts', detail: 'src/agent.ts' },
    { id: 'r2', kind: 'file', label: 'old.ts', status: 'stale' },
  ];

  it('renders a list of fixed cards with names, meta and statuses', () => {
    render(<AttachmentList attachments={attachments} references={references} />);
    const list = screen.getByRole('list', { name: '待发送的附件与引用' });
    expect(within(list).getAllByRole('listitem')).toHaveLength(7);
    expect(screen.getByRole('img', { name: '示例缩略图' })).toHaveAttribute('src', png);
    // Non same-origin thumbnails fall back to the icon.
    expect(screen.queryByRole('img', { name: 'remote.png' })).not.toBeInTheDocument();
    expect(screen.getByText('图片 · 2 KB')).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: '正在上传 report-with-a-very-long-name.pdf' })).toBeInTheDocument();
    expect(screen.getByRole('status', { name: '' })).toHaveTextContent('正在上传 data.csv');
    expect(screen.getByText('上传失败')).toBeInTheDocument();
    expect(screen.getByText('引用已失效')).toBeInTheDocument();
    expect(screen.getByText('report-with-a-very-long-name.pdf')).toHaveAttribute('title', 'report-with-a-very-long-name.pdf');
    // No callbacks → no buttons.
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('remove and retry buttons are named after the file', async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn();
    const onRetry = vi.fn();
    render(<AttachmentList attachments={attachments} references={references} onRemove={onRemove} onRetry={onRetry} />);
    await user.click(screen.getByRole('button', { name: '移除 sample.png' }));
    expect(onRemove).toHaveBeenCalledWith({ type: 'attachment', attachment: attachments[0] });
    await user.click(screen.getByRole('button', { name: '移除 agent.ts' }));
    expect(onRemove).toHaveBeenCalledWith({ type: 'reference', reference: references[0] });
    await user.click(screen.getByRole('button', { name: '重试上传 fail.zip' }));
    expect(onRetry).toHaveBeenCalledWith(attachments[3]);
  });

  it('renders nothing when empty', () => {
    const { container } = render(<AttachmentList />);
    expect(container).toBeEmptyDOMElement();
  });

  it('thumbnail guard', () => {
    expect(isSafeThumbnail(png)).toBe(true);
    expect(isSafeThumbnail('blob:http://x/1')).toBe(true);
    expect(isSafeThumbnail('/img/a.png')).toBe(true);
    expect(isSafeThumbnail('https://a.test/x.png', 'https://a.test')).toBe(true);
    expect(isSafeThumbnail('https://b.test/x.png', 'https://a.test')).toBe(false);
    expect(isSafeThumbnail('javascript:alert(1)', 'https://a.test')).toBe(false);
    expect(isSafeThumbnail(undefined)).toBe(false);
  });
});

const providers: ModelProviderView[] = [
  {
    id: 'pa',
    label: '提供商 A（示例）',
    models: [
      { id: 'vision-1', label: 'vision-1', providerId: 'pa', capabilities: ['image', 'tools'], efforts: ['low', 'medium', 'high'] },
      { id: 'text-1', label: 'text-1-with-a-very-long-model-name', providerId: 'pa', capabilities: ['reasoning', 'long-context'], efforts: ['medium'] },
      { id: 'old-1', label: 'old-1', providerId: 'pa', disabled: true, unavailableReason: '已下线' },
    ],
  },
  { id: 'pb', label: '提供商 B（示例）', disabled: true, unavailableReason: '尚未配置密钥', models: [{ id: 'b-1', label: 'b-1', providerId: 'pb' }] },
];

function PickerHarness({ onModel, onEffort }: { onModel?: (id: string) => void; onEffort?: (e: ModelEffort) => void }) {
  const [model, setModel] = React.useState('vision-1');
  const [effort, setEffort] = React.useState<ModelEffort>('medium');
  return (
    <ModelPicker
      providers={providers}
      selectedModel={model}
      effort={effort}
      onModelChange={(id) => {
        setModel(id);
        onModel?.(id);
      }}
      onEffortChange={(e) => {
        setEffort(e);
        onEffort?.(e);
      }}
    />
  );
}

describe('ModelPicker', () => {
  it('trigger names model and effort; effort layer uses radios', async () => {
    const user = userEvent.setup();
    const onEffort = vi.fn();
    render(<PickerHarness onEffort={onEffort} />);
    const trigger = screen.getByRole('button', { name: '模型：vision-1，思考强度：均衡' });
    await user.click(trigger);
    const dialog = await screen.findByRole('dialog', { name: '模型与思考强度' });
    const group = within(dialog).getByRole('radiogroup', { name: '思考强度' });
    expect(within(group).getAllByRole('radio')).toHaveLength(3);
    expect(within(group).getByRole('radio', { name: '均衡' })).toBeChecked();
    await user.click(within(group).getByRole('radio', { name: '深入' }));
    expect(onEffort).toHaveBeenCalledWith('high');
    expect(screen.getByRole('button', { name: '模型：vision-1，思考强度：深入' })).toBeInTheDocument();
  });

  it('drills into the model layer, reads unavailable reasons, selects and returns', async () => {
    const user = userEvent.setup();
    const onModel = vi.fn();
    render(<PickerHarness onModel={onModel} />);
    await user.click(screen.getByRole('button', { name: /^模型：/ }));
    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: /切换模型/ }));
    const back = within(dialog).getByRole('button', { name: '返回思考强度' });
    expect(back).toHaveFocus();
    expect(within(dialog).getByRole('region', { name: '提供商 A（示例）' })).toBeInTheDocument();
    const old = within(dialog).getByRole('button', { name: /old-1/ });
    expect(old).toHaveAttribute('aria-disabled', 'true');
    expect(old).toHaveAccessibleDescription(/不可用：已下线/);
    const providerModel = within(dialog).getByRole('button', { name: /b-1/ });
    expect(providerModel).toHaveAttribute('aria-disabled', 'true');
    expect(providerModel).toHaveAccessibleDescription(/尚未配置密钥/);
    expect(within(dialog).getByRole('button', { name: /vision-1/ })).toHaveAttribute('aria-current', 'true');
    expect(within(dialog).getByRole('button', { name: /vision-1/ })).toHaveAccessibleDescription(/图片,s?工具/);
    await user.click(old);
    expect(onModel).not.toHaveBeenCalled();
    // ↓ moves between model buttons.
    within(dialog).getByRole('button', { name: /vision-1/ }).focus();
    await user.keyboard('{ArrowDown}');
    expect(within(dialog).getByRole('button', { name: /text-1/ })).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(onModel).toHaveBeenCalledWith('text-1');
    expect(within(dialog).getByRole('button', { name: /切换模型/ })).toHaveFocus();
  });

  it('Escape closes and focus returns to the trigger', async () => {
    const user = userEvent.setup();
    render(<PickerHarness />);
    const trigger = screen.getByRole('button', { name: /^模型：/ });
    await user.click(trigger);
    await screen.findByRole('dialog');
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(trigger).toHaveFocus();
  });

  it('loading / error / disabled', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<ModelPicker providers={providers} defaultLayer="models" defaultOpen loading />);
    expect(await screen.findByText('正在读取模型…')).toBeInTheDocument();
    rerender(<ModelPicker providers={providers} defaultLayer="models" defaultOpen error />);
    expect(screen.getByRole('alert')).toHaveTextContent('模型列表读取失败');
    rerender(<ModelPicker providers={providers} disabled />);
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.getByRole('button', { name: '模型：选择模型' })).toBeDisabled());
  });
});

const modes: PermissionModeView[] = [
  { id: 'confirm', label: '确认更改', description: '每次写入前询问' },
  { id: 'auto', label: '自动编辑', description: '工作区内自动写入' },
  { id: 'full', label: '完全访问', description: '自动执行命令', risk: 'elevated' },
];

function PermissionHarness({ onChange }: { onChange: (id: string) => void }) {
  const [value, setValue] = React.useState('confirm');
  return (
    <PermissionPicker
      modes={modes}
      value={value}
      onChange={(id) => {
        onChange(id);
        setValue(id);
      }}
    />
  );
}

describe('PermissionPicker', () => {
  it('normal modes switch directly from the menu', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<PermissionHarness onChange={onChange} />);
    await user.click(screen.getByRole('button', { name: '权限模式：确认更改' }));
    const menu = await screen.findByRole('menu');
    expect(within(menu).getByRole('menuitemradio', { name: /确认更改/ })).toHaveAttribute('aria-checked', 'true');
    expect(within(menu).getByRole('menuitemradio', { name: /完全访问/ })).toHaveTextContent('需确认');
    await user.click(within(menu).getByRole('menuitemradio', { name: /自动编辑/ }));
    expect(onChange).toHaveBeenCalledWith('auto');
    expect(screen.getByRole('button', { name: '权限模式：自动编辑' })).toBeInTheDocument();
  });

  it('elevated modes ask for confirmation; cancel keeps the mode and returns focus', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<PermissionHarness onChange={onChange} />);
    const trigger = screen.getByRole('button', { name: '权限模式：确认更改' });
    await user.click(trigger);
    await user.click(await screen.findByRole('menuitemradio', { name: /完全访问/ }));
    const dialog = await screen.findByRole('alertdialog', { name: '启用「完全访问」？' });
    expect(onChange).not.toHaveBeenCalled();
    await user.click(within(dialog).getByRole('button', { name: '取消' }));
    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument());
    expect(onChange).not.toHaveBeenCalled();
    await waitFor(() => expect(trigger).toHaveFocus());

    await user.click(trigger);
    await user.click(await screen.findByRole('menuitemradio', { name: /完全访问/ }));
    await user.click(within(await screen.findByRole('alertdialog')).getByRole('button', { name: '启用完全访问' }));
    expect(onChange).toHaveBeenCalledWith('full');
    const elevated = screen.getByRole('button', { name: '权限模式：完全访问' });
    expect(elevated).toHaveAttribute('data-risk', 'elevated');
  });

  it('no callback → disabled trigger', () => {
    render(<PermissionPicker modes={modes} value="confirm" />);
    expect(screen.getByRole('button', { name: '权限模式：确认更改' })).toBeDisabled();
  });
});
