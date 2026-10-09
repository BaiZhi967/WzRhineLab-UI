import { useState } from 'react';
import { Button, StatusBadge, Surface } from '@wzrhine/react';

const menu = ['Overview', 'Components', 'Motion', 'Tokens', 'Guides'];
const swatches = [
  ['Canvas', '#F3F2ED'], ['Surface', '#FCFBF7'], ['Ink', '#20251F'],
  ['Research', '#E56A32'], ['Data', '#226A84'], ['Success', '#23734A'],
] as const;
export default function App() {
  const [section, setSection] = useState('Overview');
  const [dark, setDark] = useState(false);
  const [busy, setBusy] = useState(false);
  return (
    <div className="rl-theme showcase" data-rl-theme={dark ? 'dark' : 'light'}>
      <aside className="sidebar">
        <a href="/" className="brand"><span className="brand-mark" aria-hidden="true">◩</span><span>WZRHINE <b>LAB</b><small>RESEARCH INTERFACE SYSTEM</small></span></a>
        <p className="sidebar-caption">RESEARCH BUILDS<br />BETTER INTERFACES.</p>
        <nav aria-label="主导航">{menu.map((item, i) => <button key={item} className={section === item ? 'nav-item active' : 'nav-item'} type="button" aria-current={section === item ? 'page' : undefined} onClick={() => setSection(item)}><span>{item}</span><span className="mono">0{i + 1}</span></button>)}</nav>
        <div className="sidebar-bottom mono">DESIGN SYSTEM / 0.1<br />INTERNAL RESEARCH BUILD</div>
      </aside>
      <main className="content">
        <header className="topbar"><div className="mono">CATALOG / v0.1.0 <span className="dim"> // CLASS A / DRAFT</span></div><Button variant="ghost" size="sm" onClick={() => setDark(v => !v)} aria-label={dark ? '切换到浅色' : '切换到深色'}>{dark ? 'Light theme' : 'Dark theme'}</Button></header>
        <div className="body">
          <div className="eyebrow mono">01 / DESIGN SYSTEM / {section.toUpperCase()}</div>
          <div className="hero-grid"><div><h1>RESEARCH<br/>UI SYSTEM<span className="period">.</span></h1><p className="tagline">A component library for ideas in motion.</p><p className="lede">温暖而理性的科研档案界面语言。语义化设计 Tokens、可组合的 React 组件，以及克制、清晰、可中断的 Motion 反馈。</p><div className="actions"><Button onClick={() => setSection('Components')}>Browse components →</Button><Button variant="secondary" onClick={() => setSection('Tokens')}>Explore tokens</Button></div></div><div className="orbital" aria-hidden="true"><div className="orbital-ring one"/><div className="orbital-ring two"/><div className="orbital-core"/><div className="orbital-label mono">ARCHIVE / 001<br/>STATUS: READY<br/>RESEARCH: ACTIVE</div></div></div>
          <div className="divider mono">02 / FOUNDATION MODULES <span>INTERFACE SPECIMENS</span></div>
          <div className="cards">
            <Surface><p className="module-index mono">01 / ACTIONS</p><h2>Component States</h2><p>Primary · Secondary · Ghost · Loading</p><div className="button-stack"><Button onClick={() => setBusy(true)} loading={busy}>{busy ? 'Processing…' : 'Start processing'}</Button>{busy && <Button variant="ghost" size="sm" onClick={() => setBusy(false)}>Reset loading demo</Button>}<Button variant="secondary">Secondary action</Button><Button variant="ghost">Ghost action →</Button></div></Surface>
            <Surface><p className="module-index mono">02 / STATUS</p><h2>Information State</h2><p>永远将状态文本与颜色关联。</p><div className="badge-list"><StatusBadge status="success">Completed</StatusBadge><StatusBadge status="info">Processing</StatusBadge><StatusBadge status="warning">Review required</StatusBadge><StatusBadge status="danger">Failed</StatusBadge></div></Surface>
            <Surface><p className="module-index mono">03 / TOKENS</p><h2>Color Grammar</h2><p>科研机构的暖纸色和少量信号强调。</p><div className="swatches">{swatches.map(([name, color]) => <div key={name}><span style={{ background: color }}/><small>{name}<br/>{color}</small></div>)}</div></Surface>
          </div><footer className="footer mono">WZRHINE LAB // ORIGINAL DESIGN EXPLORATION <span>REACT + MOTION // 2026</span></footer>
        </div>
      </main>
    </div>
  );
}
