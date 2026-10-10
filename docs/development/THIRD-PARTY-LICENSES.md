# Third-party licenses（运行时依赖）

> 由 `scripts/license-audit.mjs` 根据实际安装的依赖树生成。范围：三个可发布包的 dependencies 与 peerDependencies 及其传递依赖。开发工具不随包发布，不在范围内。

共 17 个包：MIT × 16，0BSD × 1。允许的许可证：MIT、ISC、BSD-2-Clause、BSD-3-Clause、Apache-2.0、0BSD。

| 包 | 版本 | 许可证 | 引入方 |
| --- | --- | --- | --- |
| `@babel/runtime` | 7.29.10 | MIT | @wzrhine/react |
| `@base-ui/react` | 1.9.0 | MIT | @wzrhine/react |
| `@base-ui/utils` | 0.5.0 | MIT | @wzrhine/react |
| `@floating-ui/core` | 1.8.0 | MIT | @wzrhine/react |
| `@floating-ui/dom` | 1.8.0 | MIT | @wzrhine/react |
| `@floating-ui/react-dom` | 2.1.9 | MIT | @wzrhine/react |
| `@floating-ui/utils` | 0.2.12 | MIT | @wzrhine/react |
| `framer-motion` | 12.43.0 | MIT | @wzrhine/effects、@wzrhine/react |
| `motion` | 12.43.0 | MIT | @wzrhine/effects、@wzrhine/react |
| `motion-dom` | 12.43.0 | MIT | @wzrhine/effects、@wzrhine/react |
| `motion-utils` | 12.39.0 | MIT | @wzrhine/effects、@wzrhine/react |
| `react` | 19.3.0 | MIT | @wzrhine/effects、@wzrhine/react |
| `react-dom` | 19.3.0 | MIT | @wzrhine/effects、@wzrhine/react |
| `reselect` | 5.3.0 | MIT | @wzrhine/react |
| `scheduler` | 0.28.0 | MIT | @wzrhine/effects、@wzrhine/react |
| `tslib` | 2.8.1 | 0BSD | @wzrhine/effects、@wzrhine/react |
| `use-sync-external-store` | 1.7.0 | MIT | @wzrhine/react |

## 非代码素材

- 字体：仓库不内置字体文件。tokens 只声明字体栈（Inter、Noto Sans SC、IBM Plex Mono 等），由使用方自行按上游许可引入（STYLE.md §2）。
- 图标：Showcase 与组件内的 SVG 图标为本项目原创绘制，未使用第三方图标库。
- 图片：`docs/concepts/images/` 为本项目原创的概念图，仅用于设计参考，不随 npm 包发布（`files` 只包含 `dist`、README、CHANGELOG）。
