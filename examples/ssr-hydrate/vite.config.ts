import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Bundle the workspace packages into the server build: their dev exports point at TS sources.
  ssr: { noExternal: [/^@wzrhine\//, /^@base-ui\//] },
  build: { manifest: true },
});
