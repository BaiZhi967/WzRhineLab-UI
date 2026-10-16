import { describe, expect, it } from 'vitest';
import { resolveMarkdownUrl } from '../src/markdown/url-policy.js';

describe('resolveMarkdownUrl', () => {
  it.each(['relative/image.png', '/assets/image.png', '#section', 'https://example.com/a', 'http://example.com/a'])('allows safe image URL %s', (url) => {
    expect(resolveMarkdownUrl(url, 'image')).toBe(url);
  });

  it.each(['mailto:writer@example.com', 'tel:+8613800000000', 'https://example.com/a'])('allows safe link URL %s', (url) => {
    expect(resolveMarkdownUrl(url, 'link')).toBe(url);
  });

  it.each(['javascript:alert(1)', 'JaVaScRiPt:alert(1)', 'vbscript:msgbox(1)', 'file:///secret.txt', 'data:text/html,evil'])('rejects unsafe link URL %s', (url) => {
    expect(resolveMarkdownUrl(url, 'link')).toBeUndefined();
  });

  it.each(['javascript:alert(1)', 'data:image/png;base64,AAAA', 'file:///secret.png'])('rejects unsafe image URL %s', (url) => {
    expect(resolveMarkdownUrl(url, 'image')).toBeUndefined();
  });

  it('rejects protocol-relative external URLs', () => {
    expect(resolveMarkdownUrl('//evil.example/asset.png', 'image')).toBeUndefined();
    expect(resolveMarkdownUrl('//evil.example/page', 'link')).toBeUndefined();
  });

  it('rejects control characters after trimming surrounding whitespace', () => {
    expect(resolveMarkdownUrl('  https://example.com/\n', 'link')).toBeUndefined();
  });
});
