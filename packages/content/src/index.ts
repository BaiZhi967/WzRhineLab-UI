// Side-effect free: styles are opt-in via `@wzrhine/content/styles.css`.
export { extractHeadings, slugifyHeading } from './markdown/heading-index.js';
export type { MarkdownHeading, MarkdownHeadingDepth } from './markdown/heading-index.js';
export { resolveMarkdownUrl } from './markdown/url-policy.js';
export type { MarkdownUrlKind } from './markdown/url-policy.js';
export {
  ContentMessagesProvider,
  contentEnUS,
  contentZhCN,
  mergeContentMessages,
  useContentMessages,
} from './provider/ContentMessages.js';
export type { ContentMessages, ContentMessagesOverrides, ContentMessagesProviderProps } from './provider/ContentMessages.js';
