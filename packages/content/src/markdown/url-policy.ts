export type MarkdownUrlKind = 'link' | 'image';

const CONTROL_CHARACTERS = /[\u0000-\u001f\u007f]/;
const SAFE_LINK_SCHEMES = new Set(['http', 'https', 'mailto', 'tel']);
const SAFE_IMAGE_SCHEMES = new Set(['http', 'https']);

export function resolveMarkdownUrl(url: string, kind: MarkdownUrlKind): string | undefined {
  if (CONTROL_CHARACTERS.test(url)) return undefined;
  const value = url.trim();
  if (!value) return undefined;
  if (value.startsWith('#') || value.startsWith('/') || value.startsWith('./') || value.startsWith('../')) return value;

  const scheme = value.match(/^([a-z][a-z\d+.-]*):/i)?.[1]?.toLocaleLowerCase();
  if (!scheme) return value;
  const allowed = kind === 'link' ? SAFE_LINK_SCHEMES : SAFE_IMAGE_SCHEMES;
  return allowed.has(scheme) ? value : undefined;
}
