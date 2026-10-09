import * as React from 'react';
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Button, MetadataList, RecordHeader } from '../src';
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
