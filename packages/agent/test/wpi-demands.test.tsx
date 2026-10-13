import * as React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Composer, ModelPicker, ReferencePicker, RunOverview, SkillPicker } from '../src/index.js';
import { AgentMessagesProvider } from '../src/provider/AgentMessages.js';
import { RhineProvider } from '@wzrhine/react';

const wrap = (ui: React.ReactNode) => render(<RhineProvider><AgentMessagesProvider>{ui}</AgentMessagesProvider></RhineProvider>);

describe('Wpi adoption Agent components', () => {
  it('allows an attachment-only send and exposes draft retry state', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    wrap(<Composer allowEmptyText onSubmit={onSubmit} attachments={[{ id: 'a', name: 'photo.png', kind: 'image', status: 'ready' }]} />);
    await user.click(screen.getByRole('button', { name: '发送' }));
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ text: '', attachments: expect.any(Array) }));
    expect(screen.getByRole('button', { name: '发送' })).toBeInTheDocument();
  });

  it('shows an invalid effort and lets the host reset it', async () => {
    const user = userEvent.setup();
    const onReset = vi.fn();
    wrap(<ModelPicker providers={[{ id: 'p', label: 'Provider', models: [{ id: 'm', label: 'Model', providerId: 'p', efforts: ['low'] }] }]} selectedModel="m" effort="xhigh" effortState="invalid" onEffortReset={onReset} defaultOpen />);
    await user.click(screen.getByRole('button', { name: /重置|reset/i }));
    expect(onReset).toHaveBeenCalledOnce();
  });

  it('supports bounded multi-select skills and promise-based reference add', async () => {
    const user = userEvent.setup();
    const onSkills = vi.fn();
    const onAdd = vi.fn().mockResolvedValue(true);
    wrap(<><SkillPicker skills={[{ id: 's1', label: 'Search', source: 'workspace' }, { id: 's2', label: 'Code', source: 'builtin' }]} selected={[]} max={1} onChange={onSkills} open /><ReferencePicker open value="src/a.ts" onValueChange={vi.fn()} items={[{ path: 'src/a.ts', name: 'a.ts', kind: 'file' }]} onAdd={onAdd} /></>);
    await user.click(screen.getByRole('option', { name: /Search/ }));
    expect(onSkills).toHaveBeenCalledWith([expect.objectContaining({ id: 's1' })]);
    await user.click(screen.getByRole('button', { name: 'a.ts' }));
    expect(onAdd).toHaveBeenCalledWith('src/a.ts');
  });

  it('renders a collapsible run overview and remembers section state through props', async () => {
    const user = userEvent.setup();
    const onOpen = vi.fn();
    wrap(<RunOverview open facts={[{ label: '模型', value: 'Model' }, { label: '消息', value: '2' }]} sections={[{ id: 'children', title: '子 Agent', content: <p>Child</p> }]} onOpenChange={onOpen} />);
    expect(screen.getByText('Model')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /收起|Collapse/ }));
    expect(onOpen).toHaveBeenCalledWith(false);
  });
});
