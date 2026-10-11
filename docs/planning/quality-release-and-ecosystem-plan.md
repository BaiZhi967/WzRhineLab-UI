# 质量、发布与生态长期规划

## 1. 质量原则

WzRhineLab-UI 以以下顺序判断一个变更是否合格：

1. 语义和可访问性；
2. 行为正确；
3. API 一致；
4. 视觉与设计系统一致；
5. 可维护性；
6. 性能；
7. 装饰性。

视觉效果不能覆盖交互缺陷。自动化测试通过不能替代真实设备和屏幕阅读器验收。

## 2. 质量门禁

### 代码和类型

- TypeScript strict；
- typecheck；
- 公开 Props 类型检查；
- 包导出检查；
- Base UI 类型不泄漏；
- API report 无意外漂移；
- 单组件可以被 tree-shake；
- CSS 入口明确，不产生全局污染。

### 行为

- 单元测试；
- 受控 / 非受控；
- 键盘；
- focus-visible；
- disabled；
- loading；
- invalid；
- empty；
- error；
- async completion；
- Escape；
- portal；
- focus restore。

### 浏览器

- Chromium；
- Firefox；
- WebKit；
- 320 / 390 / 768 / 1280 / 1920；
- 200% 缩放；
- forced colors；
- reduced motion；
- 触摸设备；
- 真实屏幕阅读器。

### 视觉

- 视觉回归；
- 明色；
- 暗色；
- forced colors；
- 长中文；
- 英文长词；
- 低分辨率；
- 宽屏留白；
- 高密度数据；
- loading / empty / error / success。

### 性能

- 包体积；
- 首次渲染；
- hydration；
- 动画帧时间；
- layout shift；
- 页面隐藏后是否停止；
- effects lazy loading；
- Canvas / WebGL 初始化；
- 内存和资源释放。

### 供应链和许可

- package license；
- transitive dependencies；
- third-party code；
- third-party image、icon、font；
- 复制式组件来源；
- 商业和自定义许可；
- registry 生成内容；
- 发布包内容。

## 3. 当前应保留的验证命令

~~~sh
pnpm check
pnpm test:e2e:all
pnpm test:examples:all
pnpm test:visual
pnpm api:check
pnpm license:audit
pnpm verify:packages
pnpm release:check
~~~

每次验收记录必须区分：

- 真实执行并通过；
- 真实执行但存在 flake；
- 没有执行；
- 需要人工完成；
- 因环境限制无法验证。

## 4. 兼容性策略

### React

当前 README 和 package peer 声明允许 React 18 和 React 19，但维护者已经决定暂不正式支持 React 18。下一阶段需要做出明确选择：

A. 保留 React 18 声明并完成验证；  
B. 只支持 React 19，收窄 peer；  
C. 继续保留声明但在文档中明确 experimental。

在决策完成前，不应声称 React 18 已支持。

### 浏览器

建议正式支持矩阵：

- Chromium：当前稳定版及前一个主要版本；
- Firefox：当前稳定版及前一个主要版本；
- WebKit：当前稳定版及前一个主要版本；
- 移动 Safari / Chrome：至少完成手动关键流程；
- 旧浏览器不在首个公共版本的承诺范围内，除非真实应用提出需求。

### CSS

- 所有公共类名使用 rl-；
- token 使用 --rl-*；
- 主题作用域使用 .rl-theme 或 data-rl-theme；
- 不污染 :root 和宿主原生标签；
- 需要宿主隔离的关键控件必须有 host-embed 反向测试。

## 5. 发布分层

### 内部开发

- 包可以是 private；
- 允许 API 变化；
- 重点是设计和场景验证；
- 每次里程碑有验收记录。

### Preview

- npm scope 和 license 已确定；
- 发布包可以安装；
- 允许 0.x 破坏性变化；
- 变更必须有 changelog；
- 不承诺 React 18 或所有浏览器。

### Public 0.x

- package export 稳定；
- 核心组件文档齐全；
- 安装和 SSR 验证；
- 公开许可证；
- 第三方许可证清单；
- 迁移指南；
- 至少一个真实应用示例。

### 1.0

- API 破坏性变化有迁移期；
- 组件和 token deprecation 有周期；
- 浏览器和 React 支持矩阵明确；
- 公开问题响应和安全处理流程；
- 性能预算和回归门禁稳定。

## 6. 许可证计划

发布前必须完成：

1. 选择根目录源代码许可证；
2. 确定是否所有 packages 使用同一许可证；
3. 确定 concepts、images、research 资料的权利范围；
4. 对第三方代码和 assets 建立来源；
5. 逐项审查 MIT、Apache、BSD、Commons Clause、自定义商业许可；
6. 不因为一个 README 写着 MIT 就跳过实际 LICENSE 文件；
7. 对 copy-first 组件标注原始来源和修改范围；
8. 将 license audit 纳入 release:check。

在许可证确定前，README 保持“未获得复用授权”的表述。

## 7. 文档生态

M9.5–M15 逐步建设（M9.5 先做组件搜索索引、安装 / 导出文档、升级指南与 changelog）：

- 组件搜索；
- API 文档；
- 状态矩阵；
- 键盘和无障碍说明；
- 主题和 token 页面；
- 动效模式页面；
- 效果 playground；
- SSR 示例；
- host-embed 示例；
- migration guide；
- changelog；
- deprecated API 页面；
- 性能和 bundle 页面；
- 许可证和来源页面。

文档中的示例不使用伪造的真实监测数据、生产指标、权限或设备信息。

## 8. CI 策略

当前项目因为 Actions 配额限制，暂时不增加自动 workflow。

未来恢复 CI 资源后，优先顺序：

1. workflow_dispatch；
2. main 手动 release check；
3. PR typecheck、unit 和 build；
4. 视觉回归和三内核 E2E；
5. package publish dry run；
6. 公开发布前的安全和许可证检查。

是否启用 push/PR 自动触发，需要维护者单独确认。

## 9. 生态策略

### 不做

- 不把项目变成所有 UI 库的集合；
- 不同时维护 Base UI、Radix、React Aria 和 Ark UI 的行为版本；
- 不把 Tailwind、Panda、MUI theme 作为隐式运行时依赖；
- 不把 Canvas/WebGL 强行绑定到基础组件；
- 不直接复制许可不清晰的动画源码；
- 不为了组件数量制造低复用组件。

### 可以做

- source registry；
- CLI；
- agent-readable component metadata；
- 领域模板；
- 动效模式卡片；
- 可复制的 effects 示例；
- 组件状态和测试模板；
- 从 docs 生成 API index。

