import * as React from 'react';
import { createRoot } from 'react-dom/client';
import '@wzrhine/tokens/styles.css';
import '@wzrhine/react/styles.css';
import '@wzrhine/agent/styles.css';
import './app.css';
import { App } from './App';

const root = document.getElementById('root');
if (!root) throw new Error('Root element missing');

createRoot(root).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
