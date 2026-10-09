import * as React from 'react';
import { Tab, TabList, TabPanel, Tabs } from '@wzrhine/react';
import { ArchiveSearch } from '../scenarios/ArchiveSearch';
import { ExperimentMonitor } from '../scenarios/ExperimentMonitor';
import { SettingsForm } from '../scenarios/SettingsForm';
import { PageHeader } from '../ui/Specimen';

/** M3 acceptance scenarios (ROADMAP: 档案检索 / 实验监测 / 设置表单). */
export function ScenariosPage() {
  return (
    <div className="sc-page">
      <PageHeader index="17" section="Data & Archive" title="Acceptance scenarios">
        <p>
          ROADMAP M3 的三个验收场景，用真实交互流程组合本组件库：检索与筛选、按规程推进实验、带校验的设置表单。数据为标注过的静态样例记录，
          没有随机数、定时刷新的「实时读数」或伪造指标；所有计数与状态都由数据推导。
        </p>
      </PageHeader>
      <Tabs defaultValue="search">
        <TabList aria-label="验收场景">
          <Tab value="search">档案检索</Tab>
          <Tab value="monitor">实验监测</Tab>
          <Tab value="settings">设置表单</Tab>
        </TabList>
        <TabPanel value="search">
          <ArchiveSearch />
        </TabPanel>
        <TabPanel value="monitor">
          <ExperimentMonitor />
        </TabPanel>
        <TabPanel value="settings">
          <SettingsForm />
        </TabPanel>
      </Tabs>
    </div>
  );
}
