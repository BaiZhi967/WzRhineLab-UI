import * as React from 'react';
import '@wzrhine/content/styles.css';
import { CodeBlock, ContentMessagesProvider, MarkdownRenderer, extractHeadings } from '@wzrhine/content';
import { SectionIndex } from '@wzrhine/patterns';
import { PageHeader, Specimen, SpecimenGrid } from '../ui/Specimen';

const source = [
  '## 研究记录',
  '',
  '这是一段用于展示的 Markdown 内容。',
  '',
  '## 研究记录',
  '',
  '| 项目 | 状态 |',
  '| --- | --- |',
  '| 样本 | 已归档 |',
  '',
  '- [x] 完成整理',
  '',
  '[安全链接](https://example.com) [危险链接](javascript:alert(1))',
  '',
  '```ts',
  'const answer = 42;',
  '```',
].join('\n');

function MarkdownSpecimen() {
  return (
    <section className="sc-playground__canvas" aria-label="MarkdownRenderer">
      <MarkdownRenderer
        source={source}
        onLinkActivate={() => {}}
        components={{
          input: ({ checked, ...props }) => <input {...props} checked={checked} aria-label={checked ? '已完成任务' : '未完成任务'} />,
        }}
        renderImage={({ src, alt }) => <img src={src} alt={alt} loading="lazy" decoding="async" />}
      />
    </section>
  );
}

function CodeSpecimen() {
  return (
    <section className="sc-playground__canvas" aria-label="CodeBlock">
      <CodeBlock
        code={['const answer = 42;', 'console.log(answer);', ...Array.from({ length: 16 }, (_, index) => `const sample${index + 1} = ${index + 1};`)].join('\n')}
        language="ts"
        filename="answer.ts"
        showLineNumbers
        maxHeight="12rem"
      />
    </section>
  );
}

function StateSpecimen() {
  const [retried, setRetried] = React.useState(false);
  return (
    <section className="sc-playground__canvas" aria-label="Markdown states">
      <ContentMessagesProvider messages={{ code: { copy: '复制代码' } }}>
        <div className="content-states">
          <MarkdownRenderer source="" status="loading" />
          <MarkdownRenderer source="" status="empty" />
          {retried ? (
            <p>已重试</p>
          ) : (
            <MarkdownRenderer source="" status="error" error={<p>读取失败</p>} onRetry={() => setRetried(true)} retryLabel="重试" />
          )}
        </div>
      </ContentMessagesProvider>
    </section>
  );
}

function HeadingIndexSpecimen() {
  const sections = extractHeadings(source).map(({ id, text }) => ({ id, label: text }));
  return (
    <section className="sc-playground__canvas" aria-label="HeadingIndex">
      <SectionIndex label="Markdown 章节目录" sections={sections} />
    </section>
  );
}

export function ContentPage() {
  return (
    <ContentMessagesProvider>
      <PageHeader index="41" section="Archive & Content" title="Markdown 内容层">
        <p>
          <code>@wzrhine/content</code> 提供只读 Markdown 渲染、GFM、标题索引和代码块。原始 HTML 默认关闭；编辑器、文件系统和 WYSIWYM 属于后续独立工作包。
        </p>
      </PageHeader>
      <SpecimenGrid>
        <Specimen id="content-markdown" index="01" title="MarkdownRenderer · GFM 与安全链接" span="full" note="标题 ID、表格、任务列表、危险 URL 和代码围栏使用同一份 source">
          <MarkdownSpecimen />
        </Specimen>
        <Specimen id="content-code" index="02" title="CodeBlock · 复制与滚动" span="full" note="代码区可聚焦，行号不参与复制，复制状态使用 status 播报">
          <CodeSpecimen />
        </Specimen>
        <Specimen id="content-states" index="03" title="内容状态 · loading / empty / error" span="full" note="状态由调用者提供，错误重试不改变内容层所有权">
          <StateSpecimen />
        </Specimen>
        <Specimen id="content-headings" index="04" title="HeadingIndex · SectionIndex 组合" span="half" note="标题索引生成稳定 ID，目录 UI 继续复用 @wzrhine/patterns">
          <HeadingIndexSpecimen />
        </Specimen>
      </SpecimenGrid>
    </ContentMessagesProvider>
  );
}
