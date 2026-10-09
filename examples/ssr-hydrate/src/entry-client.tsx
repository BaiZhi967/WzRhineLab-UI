import * as React from 'react';
import { hydrateRoot } from 'react-dom/client';
import '@wzrhine/tokens/styles.css';
import '@wzrhine/react/styles.css';
import './app.css';
import { App } from './App';
import type { PageData } from './App';

declare global {
  interface Window {
    __PAGE_DATA__: PageData;
    /** Recoverable hydration errors, collected for the E2E suite. */
    __hydrationErrors: string[];
  }
}

window.__hydrationErrors = [];
const root = document.getElementById('root');
if (!root) throw new Error('Root element missing');

hydrateRoot(
  root,
  <React.StrictMode>
    <App data={window.__PAGE_DATA__} />
  </React.StrictMode>,
  {
    onRecoverableError: (error) => {
      window.__hydrationErrors.push(String((error as Error)?.message ?? error));
    },
  },
);
