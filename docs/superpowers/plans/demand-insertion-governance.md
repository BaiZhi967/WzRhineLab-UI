# 需求插入与 Agent 引导机制实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 WzRhineLab-UI 建立一个由真实消费项目驱动、可提前交付、可回填主线的组件需求插入机制，并让 Agent 能够按顺序引导用户补充需求信息。

**Architecture:** 保留 M8–M18 作为默认能力顺序，在其旁边增加需求插入队列。每项插入需求必须经历场景确认、归属判断、最小范围、依赖合同、双层验收和路线回填；组件库内部完成不等于消费项目需求已解决。

**Tech Stack:** Markdown 规划文档、GitHub branch / pull request、现有 pnpm workspace、WzRhineLab-UI 的 Base UI 1.9.0、tokens、motion/react 和既有测试门禁。

**Spec:** `docs/planning/demand-insertion-workflow.md`

## Global Constraints

- 不使用具体时间、季度或周数安排，只使用 M 编号、任务序号和依赖顺序。
- `@wzrhine/react` 继续使用 Base UI 1.9.0 作为统一 headless 行为底座。
- Canvas、WebGL、Rive、Lottie、GSAP 等高成本能力不得进入基础组件依赖链。
- 真实消费项目可以改变优先级，但不能绕过组件 API、可访问性、reduced motion、响应式、SSR 和测试门禁。
- 业务实体、账号、权限、接口和文件系统绑定的完整模块留在消费项目。
- 插入组件完成后必须记录主线暂停点、恢复点、目标里程碑和剩余增强。
- 所有声称已支持或已解决的能力都必须有组件库和消费项目的真实验收证据。

## Review Focus

- 用户只给出组件名称、没有真实页面时，Agent 是否继续追问而不是直接实现。
- 组件能否由现有组件组合完成时，Agent 是否优先建议消费项目组合。
- 提前实现后，目标里程碑是否仍然保持未完成状态。
- 消费项目未安装或未运行组件时，是否被错误标记为已解决。
- 新 headless 底座、渲染内核或 package 边界变化是否被升级为 ADR。
- 拒绝或延期的需求是否保留原因、替代方案和再次触发条件。

## 文件边界

### Task 1：需求插入协议

- Create: `docs/planning/demand-insertion-workflow.md`
- 内容：术语、插入条件、Agent 分阶段问询、归属决策、最小支持闭环、双层验收、状态、路线回填、Tree 示例和维护要求。

### Task 2：需求记录模板

- Create: `docs/planning/templates/component-demand.md`
- 内容：场景、归属、最小范围、状态矩阵、API、依赖、可访问性、动效、双层验收、主线暂停 / 恢复和路线回填字段。

### Task 3：规划入口与组件规则

- Modify: `docs/planning/README.md`
- Modify: `docs/planning/component-platform-plan.md`
- 内容：链接新协议，补充真实需求插入、归属、最小支持范围和消费项目验证规则。

### Task 4：执行入口

- Modify: `docs/planning/execution-backlog.md`
- 内容：增加需求插入队列、范围卡、恢复点和回填清单，避免插入工作脱离执行追踪。

### Task 5：验证和 PR

- 检查所有相对链接；
- 扫描规划目录，确认没有新增具体时间排期；
- 复核 M8–M18 顺序未被改写；
- 通过独立分支创建 PR，PR body 说明文档变更、验证结果和未执行的代码检查。

## 验收结果

- [ ] Agent 可按顺序询问真实场景、归属、范围、依赖、契约、验收和路线影响。
- [ ] 用户不需要一次填写完整模板。
- [ ] 单个真实项目阻塞可以触发提前插入。
- [ ] 插入组件与目标里程碑完成状态分离。
- [ ] 组件库和消费项目验收分开记录。
- [ ] 新架构边界会进入 ADR / 架构评估。
- [ ] 规划仍然只使用任务顺序，不使用具体时间安排。
