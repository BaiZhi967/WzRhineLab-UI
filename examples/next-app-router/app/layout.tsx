import '@wzrhine/tokens/styles.css';
import '@wzrhine/react/styles.css';
import './app.css';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
// RhineProvider is a client component ('use client' in the package); a Server Component layout
// renders it directly, no wrapper file needed. Its children stay server-rendered.
import { RhineProvider } from '@wzrhine/react';

export const metadata: Metadata = {
  title: 'WzRhineLab UI · Next.js App Router 示例',
  description: '服务器组件直接导入 @wzrhine/react 的示例页面。',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <RhineProvider theme="light" className="next-root">
          {children}
        </RhineProvider>
      </body>
    </html>
  );
}
