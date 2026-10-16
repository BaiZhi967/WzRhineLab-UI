import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

Object.defineProperty(Range.prototype, 'getClientRects', {
  configurable: true,
  value: () => [],
});
Object.defineProperty(Range.prototype, 'getBoundingClientRect', {
  configurable: true,
  value: () => ({ left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0, x: 0, y: 0, toJSON: () => ({}) }),
});

afterEach(() => cleanup());
