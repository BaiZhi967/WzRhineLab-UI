import * as React from 'react';
import { MotionConfig } from 'motion/react';
import { IconButton } from '@wzrhine/react';
import { groupLabels, hrefFor, routes, useHashRoute } from './app/routes';
import type { RouteGroup, RouteId } from './app/routes';
import { ThemeScope } from './app/ThemeScope';
import { useMediaQuery, useResolvedTheme, useSettings } from './app/settings';
import { BrandMark, Close, Menu } from './icons';
import { Segmented } from './ui/controls';
import { ButtonPage } from './pages/ButtonPage';
import { FoundationsPage } from './pages/Foundations';
import { MotionPage } from './pages/MotionPage';
import { OverviewPage } from './pages/Overview';
import { StatusBadgePage } from './pages/StatusBadgePage';
import { SurfacePage } from './pages/SurfacePage';
import { OverlaysLab } from './pages/lab/OverlaysLab';
import { IconButtonPage } from './pages/IconButtonPage';
import { TextPage } from './pages/TextPage';
import { FieldPage } from './pages/FieldPage';
import { PortalContainerContext } from './app/portal';

const groups: RouteGroup[] = ['start', 'foundations', 'components', 'motion', 'lab'];

function Navigation({ current, onNavigate }: { current: RouteId; onNavigate?: () => void }) {
  return (
    <nav className="sc-nav" aria-label="主导航">
      {groups.map((group) => (
        <div key={group} className="sc-nav__group">
          <p className="sc-nav__heading" id={`nav-${group}`}>
            {groupLabels[group]}
          </p>
          <ul aria-labelledby={`nav-${group}`}>
            {routes
              .filter((r) => r.group === group)
              .map((r) => (
                <li key={r.id}>
                  <a
                    className="sc-nav__link"
                    href={hrefFor(r.id)}
                    aria-current={current === r.id ? 'page' : undefined}
                    onClick={onNavigate}
                  >
                    <span>{r.label}</span>
                    <span className="sc-nav__index" aria-hidden="true">
                      {r.index}
                    </span>
                  </a>
                </li>
              ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function Brand() {
  return (
    <a className="sc-brand" href={hrefFor('overview')}>
      <BrandMark className="sc-brand__mark" />
      <span className="sc-brand__text">
        <span className="sc-brand__name">
          WZRHINE <span className="sc-brand__light">LAB</span>
        </span>
        <span className="sc-brand__tag">Research Interface System</span>
      </span>
    </a>
  );
}

function focusPageHeading(main: HTMLElement | null) {
  main?.querySelector<HTMLElement>('h1')?.focus();
}

export default function App() {
  const route = useHashRoute();
  const [settings, update] = useSettings();
  const resolvedTheme = useResolvedTheme(settings.theme);
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const mainRef = React.useRef<HTMLElement>(null);
  const portalRef = React.useRef<HTMLDivElement>(null);
  const appRef = React.useRef<HTMLDivElement>(null);
  const menuButtonRef = React.useRef<HTMLButtonElement>(null);
  const firstRender = React.useRef(true);

  React.useEffect(() => {
    document.title = `${route.label} · WzRhineLab UI`;
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    // Land keyboard and screen reader users on the new page's heading.
    focusPageHeading(mainRef.current);
    window.scrollTo({ top: 0 });
  }, [route.id, route.label]);

  React.useEffect(() => {
    if (isDesktop) setDrawerOpen(false);
  }, [isDesktop]);

  const restoreFocusRef = React.useRef(false);

  const closeDrawer = React.useCallback(() => {
    // The menu button sits inside the inert frame until React commits; focus it after the re-render.
    restoreFocusRef.current = true;
    setDrawerOpen(false);
  }, []);

  React.useEffect(() => {
    if (drawerOpen || !restoreFocusRef.current) return;
    restoreFocusRef.current = false;
    menuButtonRef.current?.focus();
  }, [drawerOpen]);

  React.useEffect(() => {
    if (!drawerOpen) return;
    document.querySelector<HTMLElement>('#sidebar a, #sidebar button')?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeDrawer();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [drawerOpen, closeDrawer]);

  React.useEffect(() => {
    const meta = document.querySelector('meta[name="theme-color"]');
    const el = appRef.current;
    if (!meta || !el) return;
    meta.setAttribute('content', getComputedStyle(el).getPropertyValue('--rl-bg-canvas').trim());
  }, [resolvedTheme]);

  const page = (() => {
    switch (route.id) {
      case 'foundations':
        return <FoundationsPage themeKey={`${resolvedTheme}-${settings.density}`} />;
      case 'button':
        return <ButtonPage />;
      case 'surface':
        return <SurfacePage />;
      case 'status-badge':
        return <StatusBadgePage />;
      case 'motion':
        return <MotionPage />;
      case 'icon-button':
        return <IconButtonPage />;
      case 'text':
        return <TextPage />;
      case 'field':
        return <FieldPage />;
      case 'lab-overlays':
        return <OverlaysLab />;
      default:
        return <OverviewPage />;
    }
  })();

  const sidebarHidden = !isDesktop && !drawerOpen;

  return (
    <MotionConfig reducedMotion={settings.motion === 'reduce' ? 'always' : 'user'}>
      <ThemeScope
        ref={appRef}
        className="sc-app"
        theme={settings.theme}
        density={settings.density}
        motion={settings.motion}
      >
        <a
          className="sc-skip"
          href="#main"
          onClick={(e) => {
            e.preventDefault();
            focusPageHeading(mainRef.current);
          }}
        >
          跳到主要内容
        </a>

        <aside
          id="sidebar"
          className="sc-sidebar"
          aria-label="侧栏"
          inert={sidebarHidden || undefined}
          data-hidden={sidebarHidden || undefined}
          data-open={drawerOpen || undefined}
        >
          <div className="sc-sidebar__top">
            <Brand />
            {!isDesktop && (
              <IconButton icon={<Close />} label="关闭导航" variant="secondary" onClick={closeDrawer} />
            )}
          </div>
          <Navigation current={route.id} onNavigate={() => setDrawerOpen(false)} />
          <p className="sc-sidebar__foot">
            Design system 0.0.0
            <br />
            Internal preview · not published
          </p>
        </aside>
        {drawerOpen && <div className="sc-scrim" aria-hidden="true" onClick={closeDrawer} />}

        <div className="sc-frame" inert={drawerOpen || undefined}>
          <header className="sc-topbar">
            {!isDesktop && (
              <IconButton
                ref={menuButtonRef}
                icon={<Menu />}
                label="打开导航"
                variant="secondary"
                aria-expanded={drawerOpen}
                aria-controls="sidebar"
                onClick={() => setDrawerOpen(true)}
              />
            )}
            <p className="sc-topbar__crumb">
              <span className="sc-topbar__index">{route.index}</span>
              <span aria-hidden="true">/</span>
              <span>{groupLabels[route.group]}</span>
              {route.group === 'components' && (
                <>
                  <span aria-hidden="true">/</span>
                  <span>{route.label}</span>
                </>
              )}
            </p>
            <div className="sc-topbar__settings" role="group" aria-label="显示设置">
              <Segmented
                legend="主题"
                name="theme"
                hideLegend
                value={settings.theme}
                onChange={(v) => update('theme', v)}
                options={[
                  { value: 'light', label: 'Light' },
                  { value: 'dark', label: 'Dark' },
                  { value: 'system', label: 'System' },
                ]}
              />
              <Segmented
                legend="密度"
                name="density"
                hideLegend
                value={settings.density}
                onChange={(v) => update('density', v)}
                options={[
                  { value: 'comfortable', label: '舒适' },
                  { value: 'compact', label: '紧凑' },
                ]}
              />
              <Segmented
                legend="动效"
                name="motion"
                hideLegend
                value={settings.motion}
                onChange={(v) => update('motion', v)}
                options={[
                  { value: 'user', label: '跟随系统' },
                  { value: 'reduce', label: '减少' },
                ]}
              />
            </div>
          </header>

          <main id="main" ref={mainRef} className="sc-main">
            <PortalContainerContext.Provider value={portalRef}>{page}</PortalContainerContext.Provider>
          </main>

          <footer className="sc-footer">
            <span>WzRhineLab UI · original design exploration</span>
            <span>Not affiliated with any game franchise</span>
          </footer>
        </div>
        {/* Popups portal here: outside the inert frame, inside the themed root. */}
        <div ref={portalRef} className="sc-portal" />
      </ThemeScope>
    </MotionConfig>
  );
}
