import * as React from 'react';
import { Input } from '@wzrhine/react';
import { Search } from '../icons';
import index from '../search-index.json';

/**
 * Documentation search (M9.5). The index is generated from routes, specimens, Markdown headings
 * and API reports by `scripts/docs-index.mjs`; matching is a plain case-insensitive substring
 * search over title and section, which is enough for a few thousand short entries.
 * Results are a native list of links below a search input, announced through a status line.
 */

type Kind = 'page' | 'specimen' | 'doc' | 'api';
interface Entry {
  kind: Kind;
  title: string;
  section: string;
  href: string;
}

const kindLabel: Record<Kind, string> = { page: '页面', specimen: '示例', doc: '文档', api: 'API' };
const kindRank: Record<Kind, number> = { page: 0, api: 1, specimen: 2, doc: 3 };
const LIMIT = 12;

const entries: Entry[] = (index.rows as [number, string, string, string][]).map(([k, title, section, href]) => ({
  kind: index.kinds[k] as Kind,
  title,
  section,
  href: href.startsWith('#') || href.startsWith('http') ? href : `${index.repo}${href}`,
}));

export function searchDocs(query: string): Entry[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const scored: { entry: Entry; score: number }[] = [];
  for (const entry of entries) {
    const title = entry.title.toLowerCase();
    const at = title.indexOf(q);
    const inSection = at < 0 && entry.section.toLowerCase().includes(q);
    if (at < 0 && !inSection) continue;
    // Exact title, then prefix, then substring, then section-only matches; pages and API first within each.
    const score = (title === q ? 0 : at === 0 ? 1 : at > 0 ? 2 : 3) * 10 + kindRank[entry.kind];
    scored.push({ entry, score });
  }
  return scored.sort((a, b) => a.score - b.score || a.entry.title.length - b.entry.title.length).map((s) => s.entry);
}

export function DocSearch({ onNavigate }: { onNavigate?: () => void }) {
  const [query, setQuery] = React.useState('');
  const listId = React.useId();
  const all = React.useMemo(() => searchDocs(query), [query]);
  const results = all.slice(0, LIMIT);
  const active = query.trim().length > 0;

  return (
    <search className="sc-search" aria-label="搜索文档">
      <Input
        type="search"
        size="sm"
        aria-label="搜索组件、文档与 API"
        placeholder="搜索组件、文档与 API"
        prefix={<Search />}
        value={query}
        onValueChange={setQuery}
        aria-controls={active ? listId : undefined}
        onKeyDown={(e) => {
          if (e.key === 'Escape') setQuery('');
        }}
      />
      <p className="sc-search__status rl-visually-hidden" role="status">
        {active ? (all.length === 0 ? '没有匹配的结果' : `共 ${all.length} 条结果${all.length > LIMIT ? `，显示前 ${LIMIT} 条` : ''}`) : ''}
      </p>
      {active && (
        <ul id={listId} className="sc-search__results" aria-label="搜索结果">
          {results.length === 0 ? (
            <li className="sc-search__empty">没有匹配的结果</li>
          ) : (
            results.map((r) => {
              const external = !r.href.startsWith('#');
              return (
                <li key={`${r.kind}${r.href}${r.title}`}>
                  <a
                    className="sc-search__link"
                    href={r.href}
                    {...(external ? { target: '_blank', rel: 'noreferrer' } : {})}
                    onClick={() => {
                      setQuery('');
                      onNavigate?.();
                    }}
                  >
                    <span className="sc-search__title">{r.title}</span>
                    <span className="sc-search__meta">
                      {kindLabel[r.kind]} · {r.section}
                      {external && <span className="rl-visually-hidden">（在新标签页打开）</span>}
                    </span>
                  </a>
                </li>
              );
            })
          )}
        </ul>
      )}
    </search>
  );
}
