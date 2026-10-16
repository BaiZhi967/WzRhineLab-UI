// Side-effect free: styles are opt-in via `@wzrhine/content/styles.css`.
export { extractHeadings, slugifyHeading } from './markdown/heading-index.js';
export type { MarkdownHeading, MarkdownHeadingDepth } from './markdown/heading-index.js';
export { resolveMarkdownUrl } from './markdown/url-policy.js';
export type { MarkdownUrlKind } from './markdown/url-policy.js';
