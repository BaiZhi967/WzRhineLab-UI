import * as React from 'react';
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { ArchiveCard, Button, MetadataList, RecordHeader, StatusIndicator, Timeline } from '../src';
import type { MetadataItem } from '../src';

const items: MetadataItem[] = [
  { label: '编号', value: 'ARC-1024', mono: true },
  { label: '类别', value: '实验记录' },
  { label: '采集日期', value: '2026-10-09', dateTime: '2026-10-09', mono: true },
  { label: '直径', value: '42 mm', mono: true, hint: '以最宽处计' },
  { label: '负责人', value: undefined },
  { label: '备注', value: '' },
];

describe('MetadataList', () => {
  it('renders a description list of term / definition pairs', () => {
    const { container } = render(<MetadataList items={items} aria-label="关键元数据" />);
    const list = container.querySelector('dl')!;
    expect(list).toHaveAttribute('aria-label', '关键元数据');
    expect(list.querySelectorAll('dt')).toHaveLength(4);
    expect(list.querySelectorAll('dd')).toHaveLength(4);
    expect(screen.getByText('编号').tagName).toBe('DT');
    expect(screen.getByText('ARC-1024').closest('dd')).toHaveAttribute('data-mono', 'true');
  });

  it('hides empty values by default instead of inventing placeholders', () => {
    render(<MetadataList items={items} />);
    expect(screen.queryByText('负责人')).toBeNull();
    expect(screen.queryByText('备注')).toBeNull();
  });

  it('placeholder mode keeps the row and announces it as not recorded', () => {
    render(<MetadataList items={items} empty="placeholder" />);
    const owner = screen.getByText('负责人').closest('.rl-meta__item')!;
    const value = owner.querySelector('dd')!;
    expect(value).toHaveAttribute('data-empty', 'true');
    expect(value).toHaveTextContent('未记录');
    expect(within(value).getByText('—')).toHaveAttribute('aria-hidden', 'true');
  });

  it('wraps dated values in <time dateTime> and shows hints', () => {
    render(<MetadataList items={items} />);
    const time = screen.getByText('2026-10-09');
    expect(time.tagName).toBe('TIME');
    expect(time).toHaveAttribute('datetime', '2026-10-09');
    expect(screen.getByText('以最宽处计')).toBeInTheDocument();
  });

  it('renders nothing when every value is empty', () => {
    const { container } = render(<MetadataList items={[{ label: 'A', value: null }]} />);
    expect(container.querySelector('dl')).toBeNull();
  });

  it('exposes layout, columns and size attributes and forwards refs', () => {
    const ref = React.createRef<HTMLDListElement>();
    render(<MetadataList ref={ref} items={items} layout="stacked" columns={2} size="sm" data-testid="m" />);
    const list = screen.getByTestId('m');
    expect(ref.current).toBe(list);
    expect(list).toHaveAttribute('data-layout', 'stacked');
    expect(list).toHaveAttribute('data-columns', '2');
    expect(list).toHaveAttribute('data-size', 'sm');
  });

  it('accepts rich values and wide items', () => {
    render(<MetadataList items={[{ label: '链接', value: <a href="#r">REC-7</a>, wide: true }]} />);
    expect(screen.getByRole('link', { name: 'REC-7' })).toBeInTheDocument();
    expect(screen.getByText('链接').closest('.rl-meta__item')).toHaveAttribute('data-wide', 'true');
  });
});

describe('RecordHeader', () => {
  function Full() {
    return (
      <RecordHeader
        trail={[{ label: '档案', href: '#/archive' }, { label: '样本', href: '#/archive/specimens' }, { label: 'ARC-1024' }]}
        recordId="ARC-1024"
        status={{ tone: 'info', label: '审核中' }}
        title="分子结构观测"
        classification={['实验记录', '材料学', undefined, '']}
        summary="用于记录结构观测流程的示例档案。"
        meta={[
          { label: '创建', value: '2026-10-01', dateTime: '2026-10-01', mono: true },
          { label: '更新', value: '2026-10-09', dateTime: '2026-10-09', mono: true },
          { label: '访问级别', value: undefined },
        ]}
        actions={<Button variant="secondary">导出</Button>}
      />
    );
  }

  it('is a banner-like header with the title as the page heading', () => {
    render(<Full />);
    const heading = screen.getByRole('heading', { level: 1, name: '分子结构观测' });
    expect(heading.closest('header')).toHaveAttribute('data-slot', 'record-header');
    expect(screen.getByText('ARC-1024', { selector: '.rl-record__id' })).toBeInTheDocument();
  });

  it('renders the trail as breadcrumb navigation with the current record marked', () => {
    render(<Full />);
    const nav = screen.getByRole('navigation', { name: '档案位置' });
    const links = within(nav).getAllByRole('link');
    expect(links.map((l) => l.textContent)).toEqual(['档案', '样本']);
    expect(within(nav).getByText('ARC-1024')).toHaveAttribute('aria-current', 'page');
    expect(within(nav).getAllByRole('listitem')).toHaveLength(3);
  });

  it('shows status as text, never colour alone', () => {
    render(<Full />);
    const badge = screen.getByText('审核中').closest('.rl-badge')!;
    expect(badge).toHaveAttribute('data-status', 'info');
  });

  it('drops empty classification terms and empty meta values', () => {
    const { container } = render(<Full />);
    expect(container.querySelectorAll('.rl-record__term')).toHaveLength(2);
    expect(screen.queryByText('访问级别')).toBeNull();
    expect(screen.getByText('2026-10-09').tagName).toBe('TIME');
  });

  it('renders only the title when nothing else is known', () => {
    const { container } = render(<RecordHeader title="未命名记录" headingLevel={2} />);
    expect(screen.getByRole('heading', { level: 2, name: '未命名记录' })).toBeInTheDocument();
    expect(container.querySelector('nav')).toBeNull();
    expect(container.querySelector('.rl-record__id-row')).toBeNull();
    expect(container.querySelector('dl')).toBeNull();
    expect(container.querySelector('.rl-record__actions')).toBeNull();
    expect(container.querySelector('header')).not.toHaveAttribute('data-has-meta');
  });

  it('keeps actions reachable and forwards native attributes', () => {
    const ref = React.createRef<HTMLElement>();
    render(<RecordHeader ref={ref} title="T" actions={<Button>编辑</Button>} aria-describedby="x" />);
    expect(ref.current?.tagName).toBe('HEADER');
    expect(ref.current).toHaveAttribute('aria-describedby', 'x');
    expect(screen.getByRole('button', { name: '编辑' })).toBeInTheDocument();
  });
});

describe('ArchiveCard', () => {
  const base = { id: 'ARC-1024', title: '分子结构观测' } as const;

  it('static card is an article named by its title with only the given fields', () => {
    const { container } = render(<ArchiveCard {...base} />);
    const card = screen.getByRole('article', { name: '分子结构观测' });
    expect(card).toHaveTextContent('ARC-1024');
    expect(container.querySelector('time')).toBeNull();
    expect(container.querySelector('.rl-badge')).toBeNull();
    expect(container.querySelector('.rl-archive-card__class')).toBeNull();
    expect(container.querySelector('img')).toBeNull();
  });

  it('href renders one link named by the title, described by date and status', () => {
    render(
      <ArchiveCard
        {...base}
        category="实验记录"
        subcategory="材料学"
        status={{ tone: 'warning', label: '需复核' }}
        updatedAt="2026-10-09"
        href="#/archive/ARC-1024"
      />,
    );
    const link = screen.getByRole('link', { name: '分子结构观测' });
    expect(link).toHaveAttribute('href', '#/archive/ARC-1024');
    expect(link).toHaveAccessibleDescription(/2026-10-09/);
    expect(link).toHaveAccessibleDescription(/需复核/);
    expect(screen.getByText('2026-10-09')).toHaveAttribute('datetime', '2026-10-09');
    expect(screen.getAllByRole('link')).toHaveLength(1);
  });

  it('onOpen renders a button; selected exposes aria-pressed', async () => {
    const user = userEvent.setup();
    const onOpen = vi.fn();
    render(<ArchiveCard {...base} onOpen={onOpen} selected />);
    const button = screen.getByRole('button', { name: '分子结构观测' });
    expect(button).toHaveAttribute('aria-pressed', 'true');
    expect(button).toHaveAttribute('data-selected', 'true');
    await user.click(button);
    button.focus();
    await user.keyboard('{Enter}');
    expect(onOpen).toHaveBeenCalledTimes(2);
  });

  it('a selected link uses aria-current instead', () => {
    render(<ArchiveCard {...base} href="#x" selected />);
    expect(screen.getByRole('link')).toHaveAttribute('aria-current', 'true');
  });

  it('media requires explicit alt text and lazy-loads', () => {
    render(<ArchiveCard {...base} media={{ src: 'data:image/gif;base64,R0lGODlhAQABAAAAACw=', alt: '样本显微照片' }} layout="tile" />);
    const img = screen.getByRole('img', { name: '样本显微照片' });
    expect(img).toHaveAttribute('loading', 'lazy');
    expect(img.closest('.rl-archive-card')).toHaveAttribute('data-layout', 'tile');
  });
});

describe('StatusIndicator', () => {
  it('shows a decorative marker plus visible text and detail', () => {
    const { container } = render(<StatusIndicator tone="success" label="已同步" detail="2 分钟前" />);
    expect(screen.getByText('已同步')).toBeVisible();
    expect(screen.getByText('2 分钟前')).toBeVisible();
    expect(container.querySelector('.rl-status__marker')).toHaveAttribute('aria-hidden', 'true');
    expect(container.querySelector('.rl-status')).toHaveAttribute('data-tone', 'success');
  });

  it('live mode is a polite status region; default is not', () => {
    const { rerender } = render(<StatusIndicator label="离线" />);
    expect(screen.queryByRole('status')).toBeNull();
    rerender(<StatusIndicator label="同步中" live tone="info" />);
    expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite');
    expect(screen.getByRole('status')).toHaveTextContent('同步中');
  });

  it('pulse is opt-in', () => {
    const { container, rerender } = render(<StatusIndicator label="在线" />);
    expect(container.querySelector('.rl-status')).not.toHaveAttribute('data-pulse');
    rerender(<StatusIndicator label="在线" pulse />);
    expect(container.querySelector('.rl-status')).toHaveAttribute('data-pulse', 'true');
  });
});

describe('Timeline', () => {
  const events = [
    { id: 'e1', title: '样本入库', dateTime: '2026-10-01T09:00', time: '10-01 09:00', actor: '示例研究员', tone: 'success' as const },
    { id: 'e2', title: '结构观测', dateTime: '2026-10-05T14:30', description: '完成第一轮观测。' },
    { id: 'e3', title: '复核请求', dateTime: '2026-10-09', tone: 'warning' as const },
  ];

  it('is an ordered list in the given order with machine-readable times', () => {
    render(<Timeline events={events} aria-label="实验时间线" />);
    const list = screen.getByRole('list', { name: '实验时间线' });
    expect(list.tagName).toBe('OL');
    const items = within(list).getAllByRole('listitem');
    expect(items.map((i) => i.querySelector('.rl-timeline__title')!.textContent)).toEqual(['样本入库', '结构观测', '复核请求']);
    expect(within(items[0]!).getByText('10-01 09:00')).toHaveAttribute('datetime', '2026-10-01T09:00');
    expect(within(items[2]!).getByText('2026-10-09').tagName).toBe('TIME');
  });

  it('renders optional description, actor and tone only when given', () => {
    render(<Timeline events={events} />);
    expect(screen.getByText('完成第一轮观测。')).toBeInTheDocument();
    expect(screen.getByText('示例研究员')).toBeInTheDocument();
    const items = screen.getAllByRole('listitem');
    expect(items[1]).toHaveAttribute('data-tone', 'neutral');
    expect(items[2]).toHaveAttribute('data-tone', 'warning');
    expect(items[1]!.querySelector('.rl-timeline__actor')).toBeNull();
  });

  it('shows an explicit empty state instead of invented events', () => {
    render(<Timeline events={[]} emptyText="尚无实验记录" />);
    expect(screen.queryByRole('list')).toBeNull();
    expect(screen.getByText('尚无实验记录')).toBeInTheDocument();
  });

  it('passes reversed to the ordered list for newest-first logs', () => {
    render(<Timeline events={events} reversed />);
    expect(screen.getByRole('list')).toHaveAttribute('reversed');
  });
});
