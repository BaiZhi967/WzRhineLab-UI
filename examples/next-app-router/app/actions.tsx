'use client';

// Client island: state, event handlers and the toast queue (from the RhineProvider in the
// server layout) are only available below a 'use client' boundary.
import { AlertDialog, Button, useToast } from '@wzrhine/react';

export function RecordActions({ recordId }: { recordId: string }) {
  const toast = useToast();
  return (
    <AlertDialog
      trigger={<Button variant="secondary">撤回审核</Button>}
      title="撤回审核申请？"
      description={`记录 ${recordId} 将退回草稿状态（演示：不会修改任何数据）。`}
      confirmLabel="撤回审核"
      cancelLabel="取消"
      tone="default"
      onConfirm={() => {
        toast.show({ title: '已撤回审核', description: '演示：未发送到服务器。', status: 'success' });
      }}
    />
  );
}
