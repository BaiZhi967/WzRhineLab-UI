# @wzrhine/content

面向 WzRhineLab UI 的可选 Markdown 内容层：安全渲染、GFM、标题索引和代码块。该包不提供文档编辑器、文件系统或 WYSIWYM 引擎。

```sh
pnpm add @wzrhine/content @wzrhine/react @wzrhine/tokens react react-dom motion
```

```tsx
import '@wzrhine/tokens/styles.css';
import '@wzrhine/react/styles.css';
import '@wzrhine/content/styles.css';
import { MarkdownRenderer } from '@wzrhine/content';

export function Preview({ source }: { source: string }) {
  return <MarkdownRenderer source={source} />;
}
```

原始 HTML 默认关闭；链接和图片经过安全 URL 策略；文件读取、远程资源授权、保存和编辑器状态由调用方负责。完整说明见 [内容层文档](../../docs/components/content.md)。
