'use client';

// DataTable needs function props (getRowId, column `cell`), and functions cannot cross the
// Server → Client boundary. So the column definitions live in this client file; the server page
// passes only plain row objects.
import { DataTable, StatusIndicator } from '@wzrhine/react';
import type { DataTableColumn } from '@wzrhine/react';
import type { SampleRow } from './data';

const columns: DataTableColumn<SampleRow>[] = [
  { key: 'id', header: '样本', mono: true, rowHeader: true },
  { key: 'label', header: '说明' },
  { key: 'mass', header: '质量', mono: true, align: 'end' },
  {
    key: 'status',
    header: '状态',
    cell: (s) => <StatusIndicator tone={s.status === 'ok' ? 'success' : 'warning'} label={s.status === 'ok' ? '合格' : '需复核'} />,
  },
];

export function SamplesTable({ rows, caption }: { rows: SampleRow[]; caption: string }) {
  return <DataTable caption={caption} columns={columns} rows={rows} getRowId={(s) => s.id} />;
}
