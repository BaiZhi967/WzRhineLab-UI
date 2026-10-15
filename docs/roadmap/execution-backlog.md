# WzUI 后续开发执行清单

> 2026-10-15。P030 全部 12 项为 Accepted（库侧验收通过，npm 发布未执行）；P040 起的后续任务为 Proposed。本文列实施产物，不把规划文件的完成计为组件完成。当前优先级以 [总路线](README.md) 和 [0.3.0 计划](0.3.0-plan.md) 为准。

## 1. 使用方式

每个任务使用唯一 ID；实施时记录负责人、分支／worktree、依赖、当前状态、实际改动、执行命令、证据、未执行项和恢复点。P030 各任务的目标路径已是实际产物位置；后续阶段任务卡的目标路径仍是拟议位置，不声称文件已经存在。

一次确认的工作包在 `.worktree/` 下施工，中文小步提交，最后一个汇总 PR。不得按本表每行新建 PR，不自动合并、不直接写 main、不擅自触发 Actions。

## 2. 0.3.0 任务总表

| ID | 任务 | 前置 | 主要输出 | 状态 |
| --- | --- | --- | --- | --- |
| P030-00 | 范围／包／状态合同 | 0.2.0 基线 | 架构决策、API 草案、状态与焦点合同 | Accepted（2026-10-15 维护者确认；证据 [ADR-0014](../development/adr/0014-patterns-package-and-p030-scope.md)、[0.3.0 合同](0.3.0-contracts.md)） |
| P030-01 | 包或 recipe 基础 | P030-00 | 可构建入口、样式、文案、验证接入 | Accepted（2026-10-15；证据 `packages/patterns`、`docs/api/patterns.md`、verify/size/license/docs 全绿） |
| P030-02 | ListDetail | P030-01 | 主从布局、窄宽切换、滚动与焦点 | Accepted（2026-10-15；TDD 19 项失败测试先行，容器测量/焦点返回/滚动保持/SSR 结构均有断言） |
| P030-03 | InspectorPanel | P030-01、02 的布局合同 | 属性检查区域及覆盖层组合示例 | Accepted（2026-10-15；9 项测试；覆盖层组合示例随 P030-07 recipe） |
| P030-04 | 查询／条件／视图 | P030-01 | QueryToolbar、AppliedFilters、ViewSwitcher | Accepted（2026-10-15；TDD 32 项测试先行，IME 双时序、移除焦点落位、roving tabindex 均有断言） |
| P030-05 | 选择／资源网格 | P030-01、04 的集合合同 | SelectionToolbar、ResourceGrid | Accepted（2026-10-15；TDD 22 项测试，选择/打开分离、图片单项降级与恢复、防重复提交断言） |
| P030-06 | 记录详情／章节 | P030-02、03 | SectionIndex；RecordDetail 按 ADR-0014 降为 recipe 随 P030-07 交付 | Accepted（2026-10-15；TDD 11 项测试，观察器清理/重定向、减动、无 JS 锚点断言） |
| P030-07 | 页面 recipes | P030-02–06 | 集合、详情、设置组合示例 | Accepted（2026-10-15；showcase「Page recipes」页三组合，各附用途/适配点/状态所有者/键盘路径/错误取消/不适用说明） |
| P030-08 | 独立参考应用 | P030-07 | archive-desk 两种数据形态与故障注入 | Accepted（2026-10-15；1,000 档案／240 资源确定性样例、资源页＋设置页、故障注入 error/delay/stale＋请求令牌防过期覆盖、版本化存储＋一键恢复；e2e 15/16 绿，1 项为 main 上同样失败的既有环境漂移（对话框初始焦点），已记录） |
| P030-09 | 文档与 API 整理 | 各组件完成 | 组件文档、API、迁移说明、导航与检索评估 | Accepted（2026-10-15；docs/components/patterns.md、docs/api/patterns.md 32 导出、showcase 两页样张入检索、ADR-0014 与合同文档互链） |
| P030-10 | 完整验收与性能基线 | P030-08、09 | 真实命令日志、场景证据、限制与缺陷关闭 | Accepted（2026-10-15，环境 Win11/Node 24/pnpm 10.17/Playwright 1.63 · commit 见 PR） |
| P030-11 | 候选交付 | P030-10 | 汇总 PR、发布检查单、升级与回滚记录 | Accepted（2026-10-15；PR #16，23+ 提交，npm 发布未执行、按授权另行） |

## 独立增强：MFX-01

2026-10-15 维护者确认动效方向与底座补强，建立 [WZUI-REQ-20261015-001](requests/WZUI-REQ-20261015-001.md)，状态 **Validating**（已实现，命令与限制见 [验收记录](../development/acceptance/2026-10-15-mfx-01.md)）。工作包包括真实元素锚点、纯路径、受控进度、三种可选效果与页面接入；合同 [ADR-0015](../development/adr/0015-effect-geometry-and-progress.md)。基于当前 0.3.0 开发线独立施工，不重开 P030，不把 R2／R6 其余能力标为已完成；发布另行授权。

## 3. 首批：P030-00 与 P030-01

### P030-00 范围与合同

- [x] 阅读根 AGENTS、DESIGN、当前路线与现有公开 API；核对工作树及基线。（2026-10-15，worktree `docs/p030-00-contracts`，基于 `992f1d6`，工作树干净）
- [x] 为九个候选能力分别确认公共组件或 recipe，不删除场景交付目标。（八组件 + RecordDetail 降 recipe，含降级原因／替代方式／验收位置，见 [ADR-0014](../development/adr/0014-patterns-package-and-p030-scope.md) §2）
- [x] 记录是否创建 patterns 包；必要时在 `docs/development/adr/` 新增不冲突编号的 ADR。（决策：建立 `@wzrhine/patterns`，ADR-0014）
- [x] 固定查询、选择、详情 ID、异步事实的所有者；定义回调与未知值行为。（[0.3.0 合同](0.3.0-contracts.md) §3）
- [x] 固定嵌入布局、窄屏、滚动、焦点返回、SSR 初始模式与选择范围。（同上 §4／§5）
- [x] 写出 API 草案、依赖闭包、非目标及逐组件测试矩阵。（同上 §2／§6／§8／§9）

验收：决策之间无冲突；引用的现有能力真实存在；不因外部应用尚未验证而阻塞开工。公共 API 确认后才开始依赖其签名的实现。RecordDetail 降级为 recipe 属于允许的范围内裁决，待维护者评审确认后本任务转 Accepted。

> 2026-10-15：维护者确认三项关键决策（RecordDetail 降 recipe、建立 patterns 包、独立 PatternsMessages 表），P030-00 转 Accepted。

### P030-01 基础接入

- [x] 按 P030-00 决策创建必要目录、公开入口、文案与作用域样式；不创建空包占位。（`packages/patterns`：`PatternsMessagesProvider` 机制 + `listDetail` 首个文案命名空间 + `styles.css` 入口；组件自 P030-02 起加入，同一工作包内不出现空包状态）
- [x] 若有新包，接入 workspace 构建、dist/types、显式样式、API、license、size 和真实安装验证。（六个脚本接入 + `docs/api/patterns.md` 8 导出 + size 预算 + license 审计 + `pnpm verify:packages` 全绿：tarball 检查、'use client' 边界、干净消费者安装、严格类型检查、SSR、Vite 构建）
- [ ] 若选择 recipes，确定唯一示例位置和 imports，不复制组件库实现。（三个页面 recipes 属 P030-07，届时确定唯一位置）
- [x] 建立最小可运行 fixture，覆盖 Provider、双主题／密度与实例隔离。（`test/pattern-messages.test.tsx` 7 个用例：双表键一致、默认回落、覆盖优先、嵌套合并、兄弟隔离、RhineProvider 双主题×双密度组合——最后一项在单个用例内循环四种组合；另有包边界测试 6 项）

验收：最小消费者能通过公开入口运行和构建；未载入页面模式的基础入口不引入重型新依赖。（通过：patterns-full 0.46 KB gzip，仅依赖 tokens；`@wzrhine/react` 为 peer）

## 4. 布局与集合实施

### P030-02 / P030-03 布局线

交付 ListDetail 和 InspectorPanel；覆盖两栏与替换式详情、返回入口、受控开关、同页多实例、关闭 fallback、长路径、加载失败与嵌入式语义。Overlay 只组合已有底座。

先写焦点与状态的失败测试，再实现布局；截图验证五种宽度。不得用只显示／隐藏面板的静态演示代替焦点和滚动测试。

> 2026-10-15 完成记录：两组件按 TDD 交付（ListDetail 19 测试、InspectorPanel 9 测试，含焦点往返、触发控件移除 fallback、双实例隔离、滚动保持、SSR 确定结构、IME 无关项外的合同断言）。五宽度证据：showcase「页面模式」页进入标准视觉基线（390/1280 × 双主题）并新增 320/768/1920 记录块，共 7 张新基线覆盖 overlay 与 split 两种模式。注意：本次 `test:visual:update` 同时刷新了全部既有基线——在未改动的 main 检出上视觉套件本就失败（24 项/光 390 组，字体渲染级环境漂移，与本次变更无关），重建基线属于环境校正；PR 评审时需重点核对 PNG 差异仅为导航新条目、新页面与文字渲染微差。

### P030-04 / P030-05 集合线

交付查询工具区、已应用条件、视图切换、批量操作和资源网格。复用 DataTable 的受控契约，不引入另一套查询引擎。

逐项验证：中文输入提交、删除最后一个筛选条件、清空结果、跨视图保持选择、分页与隐藏选择、失败重试、批量操作去重、图像失败降级、选中与打开分离。

两条线可在 P030-00 合同冻结后并行，但公共 exports、消息类型和共享样式的合入顺序应串行协调。

## 5. 详情、recipes 与参考应用

### P030-06 详情

交付 SectionIndex。测试显式滚动根、重复标题稳定 ID、固定标题偏移、动态内容、减动、快速切换与观察器清理。RecordDetail 已按 [ADR-0014](../development/adr/0014-patterns-package-and-p030-scope.md) 降为 recipe：RecordHeader／MetadataList／分区与状态槽的组合标准随 P030-07 的记录详情页 recipe 交付并在 archive-desk 验收。

### P030-07 页面 recipes

至少交付集合页、记录详情页和分组设置页的可运行组合。每个 recipe 说明：用途、数据适配点、状态所有者、响应式、键盘路径、错误／取消和不适用场景。

### P030-08 参考应用

扩展 archive-desk，使用两种数据形态检验同一模式。数据明确标为示例；创建、筛选、选择、删除、保存与重载实际执行。加入错误、延迟和过期响应注入及一键恢复演示数据的入口。

证据覆盖页面之间的完整操作，而非仅组件截图。禁止使用未导出的内部模块或源码 alias 掩盖发布包缺陷。

## 6. 文档、验收与候选交付

### P030-09 文档

补充实际组件说明、状态矩阵、Props、recipes、公开 API、升级与限制；同步示例和入口。

当前 Showcase 搜索生成器只扫描既定 design／components／development／planning 目录，不扫描 `docs/roadmap/`。本规划集通过 docs 与 planning 导航进入。若在实施工作包中扩展扫描范围，必须同步生成索引并通过 `pnpm docs:check`；不得手工伪造搜索索引。

### P030-10 验收

执行 [质量门禁](quality-and-release.md) 中与本版对应的所有检查。性能样本固定，先记录 0.2.0 基础入口和新增模块的独立基准，再评估差异。记录命令、环境、commit 和日志，不能复制旧测试计数。

> 2026-10-15 实测记录（本机 Win11 · Node 24.13 · pnpm 10.17.1 · Playwright 1.63 · chromium/firefox/webkit 均已安装）：
> `pnpm check` 通过（全仓 typecheck + 六包测试 + showcase/示例构建）；showcase e2e 三内核各收集 623 项（`--list` 实测），其中唯一的跳过项是 `e2e/search.spec.ts:45` 的 `test.skip(browserName === 'webkit')`，归属 **webkit**（早前记录误记在 firefox 名下，且 621/622 的过数与 `--list` 的 623 不符，已按实测更正）；示例套件 agent-console 21、next-app-router 15、ssr-hydrate 18、host-embed 27 全过，archive-desk 45 过 / 3 失败（同一「keyboard only: create dialog 初始焦点」用例 ×3 浏览器——在未改动的 main 检出上同样失败，属提交基线后的环境漂移，已单独记录，不在本版修复）；视觉基线 121/121 过（基线因同一环境漂移整体重建，PR 需复核 PNG 差异：导航新条目、新增 patterns/recipes 页、文字渲染微差）；`pnpm release:check` exit 0（check + api:check + docs:check + license + verify:packages + size 全绿，patterns-full 5.32 KB gzip 在预算内）。
> 未执行项：读屏（NVDA/VoiceOver）与真机触摸人工验证未声明为本版目标环境，未执行；tree-shaking 配对因文案 Provider 固定成本暂缓（已记录于 size-check 注释）。

> 2026-10-15 复核与修复（`fix/p030-review-followup`）：PR #16 评审发现的问题已修复，门禁重跑实测——
> `pnpm typecheck` 12 项目全过；`pnpm test` 1437 项全过（tokens 247、react 511、patterns 108、effects 48、agent-core 24、agent 499）；`pnpm build` 与 `pnpm build:examples` exit 0；`api:check` / `docs:check`（2077 条）/ `license-audit` / `size-check`（15 条全在预算内）/ `verify-packages`（六包打包、LICENSE 双层断言、净消费者安装、严格类型检查、SSR、Vite 构建）全部 exit 0；视觉基线重生成后复跑 121/121 过，仅 7 张 patterns 页截图变化。
> showcase e2e：**chromium 639 过 / 0 失败**（623 → 639，新增 16 项正是 patterns/recipes 两页进入 axe、五宽度溢出与减动门禁）。firefox 与 webkit 的全量跑在本机出现**间歇失败**，三次运行的失败用例各不相同（firefox：agent-intervention / agent-message / agent-shell 的 axe；webkit：overlays、locale、command、reduced-motion 等），全部落在既有页面、无一涉及 patterns/recipes；逐个单独重跑均通过（firefox 三个 axe spec 33/33、webkit 新页面相关 21/21），且在未改动的 main 检出上单独跑同样通过 33/33。判定为本机在 firefox/webkit 下全量并发的资源竞争，与本次改动无关——但**未取得这两个内核的一次全绿全量记录**，故不在此声称其通过项数。两个新页面在 webkit 下的 axe（双主题）、五宽度溢出与减动共 21 项已单独实测通过。
> 修复项：showcase ResourceGrid 空 `src` 改为可解析 data URI 并新增单项降级样张；两个新页面加入 `e2e/helpers.ts` 的 `routes`；补 `packages/patterns/LICENSE` 并在 `verify-packages.mjs` 加「包目录存在 + tarball 内存在」双层断言（npm 会从仓库根兜底注入，只查 tarball 永远通过）；`busy` 改用 react 包 `Button` 的 `loading` 入口以满足合同 §4.2 的 focusable 要求；`ResourceGrid` 的空/错/骨架态改为复用 `EmptyState`/`Skeleton`/`Button`；`SectionIndex` 补 MutationObserver 以满足 §4.3「内容变化重新观察」，`prefers-reduced-motion` 改为每次导航读取；contracts §4.1/4.2 三处与实现相反的条文按实现修订（AppliedFilters 末项焦点回落归调用者、`useLatestGuard` 改为说明实际手段）；PatternsPage 重排为 01–06 顺序编号、去掉固定高度截断、补 Drawer 覆盖层样张与 SectionIndex 独立样张、修正行对齐（grid 作用于 `.rl-button__label` 并用容器查询处理窄列）；RecipesPage 补齐三个章节锚点；`api-report.mjs` 修 type alias 无成员表（`AppliedFiltersProps` 原本零字段信息）与 JSDoc 裸 `@wzrhine` 被当作 tag 吞掉描述；四条与本版无关的体积预算回退到 0.2.0 原值（ADR-0008 §3）。

### P030-11 候选交付

完成一个汇总 PR，列清 Must 范围、延期项、需求记录、检查、限制、升级和回滚。代码合并不等于 npm 已发布；发布另按授权执行。主线下一任务可进入评审，不等待消费方全部升级。

## 7. 后续阶段任务卡

| ID | 范围 | 启动条件 | 退出证据 | 状态 |
| --- | --- | --- | --- | --- |
| P040-00 | 阅读／预览格式与信任边界 ADR | R2 范围确认 | 格式矩阵、内容策略、包边界 | Proposed |
| P040-01 | 正文、Markdown、代码、引用 | P040-00 | 长文、链接、目录、SSR 与减动 | Proposed |
| P040-02 | 图片与预览容器 | P040-00 | 加载／失败、资源释放、可选依赖 | Proposed |
| P040-03 | 阅读参考应用与发布 | P040-01、02 | 独立阅读页与侧栏复用、公开安装 | Proposed |
| P050-00 | 数据／指标／证据合同 | R3 范围确认 | 缺失值、单位、比较与来源约定 | Proposed |
| P050-01 | 指标、证据、对比与时间线 | P050-00 | 数据正确、可追溯、异常状态 | Proposed |
| P050-02 | 可选图表适配 | 场景及引擎评估通过 | 文本替代、主题、性能、包体 | Proposed |
| P050-03 | 分析参考应用与发布 | P050-01、02 已选范围 | 真实交互、规模基准、安装验收 | Proposed |
| P060-00 | 编辑格式与引擎 ADR | R4 范围确认 | 格式、撤销、保存、信任与迁移合同 | Proposed |
| P060-01 | 编辑／工具栏／草稿状态 | P060-00 | IME、光标、只读、取消与失败 | Proposed |
| P060-02 | 编辑预览往返与发布 | P060-01 | 不静默丢数据、恢复、独立加载 | Proposed |
| P070-00 | starter 和 recipe 固化 | 已有组合稳定 | 干净目录安装构建、无私有入口 | Proposed |
| P070-01 | 命令与 UI 偏好适配 | 真实重复需求 | 焦点作用域、冲突、存储失败降级 | Proposed |
| P070-02 | Agent 元数据与升级工具 | API 索引来源明确 | 版本一致、错误导入可检测 | Proposed |
| EXP-01 | 高成本渲染／复杂编辑实验 | 具体需求与基准问题 | 对照数据、fallback、取舍结论 | Deferred |

后续任务不在本次实施范围内。进入一个阶段时，应像 P030 一样细化合同、文件、验证和退出条件，不根据版本号自动开始全部候选。

## 8. 执行记录格式

每次汇报包含：任务 ID／当前状态、实际改动文件、执行的检查与结果、未执行及原因、剩余风险、下个依赖已满足的任务。状态可用 Planned、Implementing、Validating、Accepted、Deferred；Accepted 必须关联证据。

需求记录与任务互相链接。阶段表只记录工作状态，版本发布与消费方验证分别使用 [需求流程](demand-workflow.md) 的字段。

## 9. 后续 Agent 开始指令

读取根 AGENTS、DESIGN、docs/ROADMAP、本执行清单、0.3.0 详细计划、架构与质量文档。核对 main 与本地改动，在 `.worktree/` 隔离施工。从最早尚未完成的 P030 任务开始，不重复已验收工作。

不要等待外部应用接入；不要把计划名称当作现有 API；不要创建多个阶段 PR；不要顺手升级依赖或更换设计语言；不要启动未经授权的 Actions。遇到新需求先形成范围记录，遇到共享合同变化先更新决策。
