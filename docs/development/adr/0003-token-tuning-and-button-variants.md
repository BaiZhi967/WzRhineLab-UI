# ADR-0003 · Token 对比度校准与 Button variant 语义

- 状态：**Accepted**（Sprint 01）· 日期：2026-10-09
- 影响：`docs/design/STYLE.md` §1 色值表、`@wzrhine/react` Button `variant` API

## 背景
STYLE.md Draft 0.1 的色值为「建议初始值」，并要求「明确通过对比度验收」。Sprint 01 为 tokens 建立了自动对比度测试（`packages/tokens/test`，覆盖组件实际使用的 28 组前景/背景 × 明/暗/系统三主题），并用 axe 对 Showcase 实测。部分初始值在真实组合下不达标或缺少必需角色。

## 决策
### 1. 色值校准（浅色）
| token | 初始值 | 采用值 | 原因 |
| --- | --- | --- | --- |
| `--rl-fg-muted` | `#60685F` | `#505850` | 在 `bg-subtle` / `bg-pressed` 上需 ≥4.5:1 |
| `--rl-border-subtle` | `#CFD3CA` | `#DCDCD4` | 仅装饰；拉开与 `border-default` 的层级 |
| `--rl-accent-text` | `#AA431C` | `#A8421B` | 微调，保持画布 ≥5.4:1 |
| `--rl-info` / `success` / `warning` / `danger` | 初始值 | 略加深 | 在各自 `*-subtle` 徽标底色上 ≥4.5:1 |

新增角色：`fg-subtle`、`fg-inverse`、`fg-on-accent`、`fg-disabled`、`bg-raised`、`bg-hover`、`bg-pressed`、`bg-inverse`、`bg-disabled`、`border-default`、`accent-hover`、`accent-subtle`、`*-subtle` 状态底色、`inverse-hover`。暗色主题全部角色独立定义，`data-rl-theme="system"` 在系统暗色时镜像暗色值（测试保证二者完全一致）。

### 2. 焦点色独立
`--rl-focus` 由复用 `accent-text` 改为独立蓝墨色（浅 `#1F5AA8` / 暗 `#8DB8F2`）。依据 STYLE.md「焦点色、选中背景、危险语义不能简单复用 brand 角色」；同时避免焦点环与 Accent 按钮同色而不可见。

### 3. Button variant
| variant | 视觉 | 用途 |
| --- | --- | --- |
| `primary` | 深墨底 + 暖白字 | 页面主操作（**变更**：原为橙底） |
| `accent` | 研究橙底 + 深墨字 | 每个视图至多一处的信号操作（**新增**） |
| `secondary` | 表面底 + strong 描边 | 次级操作 |
| `ghost` | 透明 | 工具栏、低强调 |

依据：STYLE.md §6「禁止所有按钮统一橙底白字」与 DESIGN.md「小面积研究橙」；概念图 01 的主行动按钮同样为深墨底。橙色因此保留为稀缺信号。

## 代价
- `variant="primary"` 视觉发生破坏性变化（0.x 允许，需写入 changelog）。
- 色值与 Draft 0.1 文档不同，STYLE.md 同步更新并指向 `tokens.css` 为权威值。

## 验证
`pnpm --filter @wzrhine/tokens test`（170 通过）与 Playwright axe 明/暗 12 页 0 violations，见 `docs/development/acceptance/2026-10-09-sprint-01.md`。
