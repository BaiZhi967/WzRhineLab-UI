import * as React from 'react';
import { renderToString } from 'react-dom/server';
import { App } from './App';
import type { PageData } from './App';
import { loadPage } from './data';

export function render(theme: PageData['theme']) {
  const data = loadPage(theme);
  const html = renderToString(
    <React.StrictMode>
      <App data={data} />
    </React.StrictMode>,
  );
  // `<` is escaped so record text can never close the script element.
  const state = JSON.stringify(data).replace(/</g, '\\u003c');
  return { html, state };
}
