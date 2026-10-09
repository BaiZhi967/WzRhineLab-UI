import * as React from 'react';
import {
  Button,
  Dialog,
  DialogClose,
  IconButton,
  Menu,
  MenuCheckboxItem,
  MenuGroup,
  MenuItem,
  MenuRadioGroup,
  MenuRadioItem,
  MenuSeparator,
  StatusBadge,
  useToast,
} from '@wzrhine/react';
import type { MenuAlign } from '@wzrhine/react';
import { Archive, Download, Grid, Plus } from '../icons';
import { Playground } from '../ui/Playground';
import { PageHeader, Specimen, SpecimenGrid } from '../ui/Specimen';
import { Segmented } from '../ui/controls';

function More(p: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor" aria-hidden="true" focusable="false" {...p}>
      <circle cx="5.5" cy="12" r="1.6" />
      <circle cx="12" cy="12" r="1.6" />
      <circle cx="18.5" cy="12" r="1.6" />
    </svg>
  );
}

function MenuPlayground() {
  const [align, setAlign] = React.useState<MenuAlign>('start');
  const [last, setLast] = React.useState('—');
  const [compact, setCompact] = React.useState(false);
  const [sort, setSort] = React.useState('recent');
  return (
    <Playground
      id="menu-playground"
      title="Menu"
      code={[
        `<Menu trigger={<IconButton icon={<More />} label="记录操作" />}${align !== 'start' ? ` align="${align}"` : ''}>`,
        '  <MenuItem icon={<Download />} shortcut="Ctrl E" onSelect={exportRecord}>导出</MenuItem>',
        '  <MenuItem tone="danger" onSelect={confirmArchive}>归档…</MenuItem>',
        '  <MenuSeparator />',
        '  <MenuCheckboxItem checked={compact} onCheckedChange={setCompact}>紧凑显示</MenuCheckboxItem>',
        '  <MenuRadioGroup label="排序" value={sort} onValueChange={setSort}>',
        '    <MenuRadioItem value="recent">最近更新</MenuRadioItem>',
        '  </MenuRadioGroup>',
        '</Menu>',
      ].join('\n')}
      controls={
        <>
          <Segmented
            legend="align"
            name="pg-menu-align"
            value={align}
            onChange={setAlign}
            options={(['start', 'center', 'end'] as const).map((v) => ({ value: v, label: v }))}
          />
          <dl className="sc-kv">
            <div>
              <dt>最后操作</dt>
              <dd aria-live="polite">{last}</dd>
            </div>
            <div>
              <dt>紧凑显示</dt>
              <dd>{String(compact)}</dd>
            </div>
            <div>
              <dt>排序</dt>
              <dd>{sort}</dd>
            </div>
          </dl>
        </>
      }
    >
      <div className="sc-playground__demo">
        <Menu trigger={<IconButton icon={<More />} label="记录操作" variant="secondary" />} align={align}>
          <MenuGroup label="操作">
            <MenuItem icon={<Download />} shortcut="Ctrl E" onSelect={() => setLast('导出')}>
              导出
            </MenuItem>
            <MenuItem icon={<Plus />} onSelect={() => setLast('复制为新记录')}>
              复制为新记录
            </MenuItem>
            <MenuItem disabled>移动到项目（无权限）</MenuItem>
            <MenuItem icon={<Archive />} tone="danger" onSelect={() => setLast('归档')}>
              归档…
            </MenuItem>
          </MenuGroup>
          <MenuSeparator />
          <MenuCheckboxItem checked={compact} onCheckedChange={setCompact}>
            紧凑显示
          </MenuCheckboxItem>
          <MenuRadioGroup label="排序" value={sort} onValueChange={setSort}>
            <MenuRadioItem value="recent">最近更新</MenuRadioItem>
            <MenuRadioItem value="id">编号</MenuRadioItem>
            <MenuRadioItem value="status">状态</MenuRadioItem>
          </MenuRadioGroup>
        </Menu>
      </div>
    </Playground>
  );
}

function RowActions() {
  const [confirm, setConfirm] = React.useState<string | null>(null);
  const [archived, setArchived] = React.useState<string[]>([]);
  const toast = useToast();
  const rows = ['REC-0101', 'REC-0102', 'REC-0103'];
  return (
    <>
      <div className="sc-table-wrap" tabIndex={0} role="region" aria-label="记录列表（可横向滚动）">
        <table className="sc-table">
          <thead>
            <tr>
              <th scope="col">编号</th>
              <th scope="col">状态</th>
              <th scope="col">
                <span className="sc-visually-hidden">操作</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((id) => (
              <tr key={id}>
                <td>
                  <code className="sc-mono-sm">{id}</code>
                </td>
                <td>
                  <StatusBadge size="sm" status={archived.includes(id) ? 'success' : 'info'}>
                    {archived.includes(id) ? '已归档' : '审核中'}
                  </StatusBadge>
                </td>
                <td className="sc-num">
                  <Menu trigger={<IconButton icon={<More />} label={`${id} 的操作`} size="sm" />} align="end">
                    <MenuItem icon={<Download />} onSelect={() => toast.show({ title: `已导出 ${id}`, status: 'success' })}>
                      导出
                    </MenuItem>
                    <MenuItem icon={<Archive />} tone="danger" disabled={archived.includes(id)} onSelect={() => setConfirm(id)}>
                      归档…
                    </MenuItem>
                  </Menu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Dialog
        open={confirm !== null}
        onOpenChange={(open) => !open && setConfirm(null)}
        eyebrow="ARCHIVE / CONFIRM"
        title={`归档 ${confirm ?? ''}`}
        description="归档后记录变为只读。"
        size="sm"
        dismissOnOutsideClick={false}
        actions={
          <>
            <DialogClose>
              <Button variant="ghost">取消</Button>
            </DialogClose>
            <DialogClose>
              <Button
                onClick={() => {
                  if (!confirm) return;
                  setArchived((list) => [...list, confirm]);
                  toast.show({ title: `${confirm} 已归档`, status: 'success' });
                }}
              >
                确认归档
              </Button>
            </DialogClose>
          </>
        }
      />
    </>
  );
}

export function MenuPage() {
  return (
    <div className="sc-page">
      <PageHeader index="13" section="Navigation & Overlay" title="Menu">
        <p>
          基于 Base UI Menu 的操作菜单：<code>menu</code> / <code>menuitem</code> 语义，方向键移动、首字母定位、Home/End，
          Esc 或点击外部关闭，选择后焦点回到触发器。用于对象上的命令；选值请用 Select，切换视图请用 Tabs。
        </p>
      </PageHeader>
      <SpecimenGrid>
        <MenuPlayground />
        <Specimen id="menu-rows" index="01" title="Row actions" note="危险操作（归档）先打开确认 Dialog，结果用 Toast 告知；每行触发器有包含编号的名称。">
          <RowActions />
        </Specimen>
        <Specimen id="menu-rules" index="02" title="Do / Don't" span="half" align="start" note="快捷键提示只是视觉标注，需要另行绑定。">
          <ul className="sc-rules">
            <li data-kind="do">把 5–9 个相关命令分组，用分隔线区分破坏性操作</li>
            <li data-kind="do">不可用的命令保留并禁用，让用户知道它存在</li>
            <li data-kind="dont">把导航链接、表单字段或长说明放进菜单</li>
          </ul>
        </Specimen>
        <Specimen id="menu-view" index="03" title="View options" span="half" align="start" note="勾选与单选项选择后菜单保持打开，便于连续调整。">
          <Menu trigger={<Button variant="secondary" iconStart={<Grid />}>视图选项</Button>}>
            <MenuCheckboxItem defaultChecked>显示编号</MenuCheckboxItem>
            <MenuCheckboxItem>显示缩略图</MenuCheckboxItem>
            <MenuSeparator />
            <MenuRadioGroup label="密度" defaultValue="comfortable">
              <MenuRadioItem value="comfortable">舒适</MenuRadioItem>
              <MenuRadioItem value="compact">紧凑</MenuRadioItem>
            </MenuRadioGroup>
          </Menu>
        </Specimen>
      </SpecimenGrid>
    </div>
  );
}
