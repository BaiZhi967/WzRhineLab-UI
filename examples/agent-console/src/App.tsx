import * as React from 'react';
import { AgentMessagesProvider, agentEnUS, agentZhCN } from '@wzrhine/agent';
import { RhineProvider, Switch, enUS, zhCN } from '@wzrhine/react';
import type { RhineTheme } from '@wzrhine/react';
import { AgentConsole } from './AgentConsole';
import { copy } from './copy';
import type { Locale } from './copy';

/*
 * Agent console example (M12). Only public entries are used: @wzrhine/agent, @wzrhine/react,
 * @wzrhine/tokens and their styles.css. Each AgentConsole owns an adapter over its own mock
 * runtime; this file only holds page-level settings (theme, locale, second instance).
 */
export function App() {
  const [theme, setTheme] = React.useState<RhineTheme>('light');
  const [locale, setLocale] = React.useState<Locale>('zh');
  const [showSecondary, setShowSecondary] = React.useState(true);
  const t = copy[locale];
  const english = locale === 'en';

  React.useEffect(() => {
    document.documentElement.lang = english ? 'en' : 'zh-CN';
    document.title = english ? 'Agent console · WzRhineLab UI sample app' : 'Agent 控制台 · WzRhineLab UI 示例应用';
  }, [english]);

  const page = (
    <div className="app">
      <header className="app__bar">
        <div className="app__heading">
          <h1>{t.title}</h1>
          <p className="app__intro">{t.intro}</p>
        </div>
        <div className="app__settings" role="group" aria-label={t.settings}>
          <Switch label={t.dark} checked={theme === 'dark'} onCheckedChange={(on) => setTheme(on ? 'dark' : 'light')} />
          <Switch label={t.english} checked={english} onCheckedChange={(on) => setLocale(on ? 'en' : 'zh')} />
          <Switch label={t.showSecondary} checked={showSecondary} onCheckedChange={setShowSecondary} />
        </div>
      </header>
      <main className="app__main">
        <section className="app__section" aria-labelledby="primary-title">
          <h2 id="primary-title">{t.primary}</h2>
          <AgentConsole instance="primary" copy={t} />
        </section>
        {showSecondary && (
          <section className="app__section" aria-labelledby="secondary-title" data-testid="secondary-section">
            <h2 id="secondary-title">{t.secondary}</h2>
            <p className="app__hint">{t.secondaryHint}</p>
            <AgentConsole instance="secondary" copy={t} initialConversation="c-sensor" />
          </section>
        )}
      </main>
    </div>
  );

  return (
    <RhineProvider
      theme={theme}
      messages={english ? enUS : zhCN}
      locale={english ? 'en-US' : 'zh-CN'}
      lang={english ? 'en' : 'zh-CN'}
      className="app-root"
    >
      {/* Same tree in both locales, so switching keeps drafts, runs and receipts. */}
      <AgentMessagesProvider messages={english ? agentEnUS : agentZhCN}>{page}</AgentMessagesProvider>
    </RhineProvider>
  );
}
