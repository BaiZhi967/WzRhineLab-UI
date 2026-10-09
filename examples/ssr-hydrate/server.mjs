#!/usr/bin/env node
/**
 * Minimal production SSR server for the example (no framework, no extra dependencies).
 * Serves dist/client assets and renders `/` with the server bundle. `?theme=dark` selects the
 * theme on the server, so the first paint is already themed (no flash before hydration).
 * Binds to 127.0.0.1 only: this is a local demo with no authentication.
 */
import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { extname, join, normalize, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const root = resolve(import.meta.dirname, 'dist');
const clientDir = join(root, 'client');
const template = readFileSync(join(clientDir, 'index.html'), 'utf8');
const { render } = await import(pathToFileURL(join(root, 'server', 'entry-server.js')).href);
const port = Number(process.env.PORT ?? 4176);
const types = { '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.json': 'application/json' };

createServer((req, res) => {
  const url = new URL(req.url ?? '/', 'http://localhost');
  if (url.pathname.startsWith('/assets/')) {
    const file = normalize(join(clientDir, url.pathname));
    if (!file.startsWith(clientDir) || !existsSync(file) || !statSync(file).isFile()) {
      res.writeHead(404).end('not found');
      return;
    }
    res.writeHead(200, { 'content-type': types[extname(file)] ?? 'application/octet-stream' });
    res.end(readFileSync(file));
    return;
  }
  if (url.pathname !== '/') {
    res.writeHead(404).end('not found');
    return;
  }
  const theme = ['dark', 'system'].includes(url.searchParams.get('theme')) ? url.searchParams.get('theme') : 'light';
  const { html, state } = render(theme);
  const page = template
    .replace('<!--ssr-outlet-->', html)
    .replace('</head>', `<script>window.__PAGE_DATA__=${state}</script></head>`);
  res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
  res.end(page);
}).listen(port, '127.0.0.1', () => console.log(`ssr example on http://127.0.0.1:${port}`));
