import './widget.css';
import { mountArchiveWidget } from './widget';
import type { WidgetHandle } from './widget';

/**
 * Host page glue. Plain DOM code, the way a legacy portal would integrate the widget.
 * `window.__widgetEvents` lets the E2E suite observe host callbacks.
 */

declare global {
  interface Window {
    __widgetEvents: string[];
  }
}

window.__widgetEvents = [];
const slotA = document.getElementById('widget-a')!;
const slotB = document.getElementById('widget-b')!;
let handles: WidgetHandle[] = [];
let dark = false;

function mount() {
  if (handles.length) return;
  handles = [
    mountArchiveWidget(slotA, {
      title: '档案调阅',
      onRequest: (id) => window.__widgetEvents.push(`a:${id}`),
    }),
    mountArchiveWidget(slotB, {
      title: '窄栏挂件',
      theme: 'dark',
      density: 'compact',
      onRequest: (id) => window.__widgetEvents.push(`b:${id}`),
    }),
  ];
}

document.getElementById('mount')!.addEventListener('click', mount);
document.getElementById('unmount')!.addEventListener('click', () => {
  handles.forEach((h) => h.unmount());
  handles = [];
});
document.getElementById('toggle-theme')!.addEventListener('click', () => {
  dark = !dark;
  handles[0]?.update({ theme: dark ? 'dark' : 'light' });
});

mount();
