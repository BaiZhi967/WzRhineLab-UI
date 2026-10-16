import { describe, expect, it } from 'vitest';
import { extractHeadings, slugifyHeading } from '../src/markdown/heading-index.js';

describe('slugifyHeading', () => {
  it('normalizes formatting punctuation and whitespace while preserving CJK text', () => {
    expect(slugifyHeading('  **研究** 计划 & Notes  ')).toBe('研究-计划-notes');
  });

  it('uses a deterministic fallback for empty heading text', () => {
    expect(slugifyHeading('***')).toBe('heading');
  });
});

describe('extractHeadings', () => {
  it('extracts ATX headings with stable duplicate ids and source lines', () => {
    const headings = extractHeadings('# Intro\n\n## Intro\n\n# Intro #');
    expect(headings).toEqual([
      { id: 'intro', depth: 1, text: 'Intro', line: 1 },
      { id: 'intro-2', depth: 2, text: 'Intro', line: 3 },
      { id: 'intro-3', depth: 1, text: 'Intro', line: 5 },
    ]);
  });

  it('extracts setext headings and ignores headings inside fenced code', () => {
    const source = ['Title', '=====', '', '```md', '# Hidden', '```', '', 'Sub', '-----'].join('\n');
    expect(extractHeadings(source)).toEqual([
      { id: 'title', depth: 1, text: 'Title', line: 1 },
      { id: 'sub', depth: 2, text: 'Sub', line: 8 },
    ]);
  });

  it('keeps heading order and Unicode labels', () => {
    expect(extractHeadings('# 研究计划\n### 方法')).toEqual([
      { id: '研究计划', depth: 1, text: '研究计划', line: 1 },
      { id: '方法', depth: 3, text: '方法', line: 2 },
    ]);
  });
});
