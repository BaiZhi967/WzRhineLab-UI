# Third-party licenses（运行时依赖）

> 由 `scripts/license-audit.mjs` 根据实际安装的依赖树生成。范围：可发布包的 dependencies 与 peerDependencies 及其传递依赖。开发工具不随包发布，不在范围内。

共 17 个包：MIT × 16，0BSD × 1。允许的许可证：MIT、ISC、BSD-2-Clause、BSD-3-Clause、Apache-2.0、0BSD。

| 包 | 版本 | 许可证 | 许可文件 · 版权声明 | 来源 | 引入方 |
| --- | --- | --- | --- | --- | --- |
| `@babel/runtime` | 7.29.10 | MIT | `LICENSE` · Copyright (c) 2014-present Sebastian McKenzie and other contributors | [github.com/babel/babel](https://github.com/babel/babel) | @wzrhine/agent、@wzrhine/react |
| `@base-ui/react` | 1.9.0 | MIT | `LICENSE` · Copyright (c) 2019 Material-UI SAS | [github.com/mui/base-ui](https://github.com/mui/base-ui) | @wzrhine/agent、@wzrhine/react |
| `@base-ui/utils` | 0.5.0 | MIT | `LICENSE` · Copyright (c) 2019 Material-UI SAS | [github.com/mui/base-ui](https://github.com/mui/base-ui) | @wzrhine/agent、@wzrhine/react |
| `@floating-ui/core` | 1.8.0 | MIT | `LICENSE` · Copyright (c) 2021-present Floating UI contributors | [github.com/floating-ui/floating-ui](https://github.com/floating-ui/floating-ui) | @wzrhine/agent、@wzrhine/react |
| `@floating-ui/dom` | 1.8.0 | MIT | `LICENSE` · Copyright (c) 2021-present Floating UI contributors | [github.com/floating-ui/floating-ui](https://github.com/floating-ui/floating-ui) | @wzrhine/agent、@wzrhine/react |
| `@floating-ui/react-dom` | 2.1.9 | MIT | `LICENSE` · Copyright (c) 2021-present Floating UI contributors | [github.com/floating-ui/floating-ui](https://github.com/floating-ui/floating-ui) | @wzrhine/agent、@wzrhine/react |
| `@floating-ui/utils` | 0.2.12 | MIT | `LICENSE` · Copyright (c) 2021-present Floating UI contributors | [github.com/floating-ui/floating-ui](https://github.com/floating-ui/floating-ui) | @wzrhine/agent、@wzrhine/react |
| `framer-motion` | 14.1.0 | MIT | `LICENSE.md` · Copyright (c) 2018 Framer B.V. | [github.com/motiondivision/motion/](https://github.com/motiondivision/motion/) | @wzrhine/agent、@wzrhine/effects、@wzrhine/react |
| `motion` | 14.1.0 | MIT | `LICENSE.md` · Copyright (c) 2024 [Motion](https://motion.dev) B.V. | [github.com/motiondivision/motion](https://github.com/motiondivision/motion) | @wzrhine/agent、@wzrhine/effects、@wzrhine/react |
| `motion-dom` | 14.1.0 | MIT | `LICENSE.md` · Copyright (c) 2024 [Motion](https://motion.dev) B.V. | [github.com/motiondivision/motion](https://github.com/motiondivision/motion) | @wzrhine/agent、@wzrhine/effects、@wzrhine/react |
| `motion-utils` | 14.1.0 | MIT | `LICENSE.md` · Copyright (c) 2024 [Motion](https://motion.dev) B.V. | [github.com/motiondivision/motion](https://github.com/motiondivision/motion) | @wzrhine/agent、@wzrhine/effects、@wzrhine/react |
| `react` | 19.3.0 | MIT | `LICENSE` · Copyright (c) Meta Platforms, Inc. and affiliates. | [github.com/react/react](https://github.com/react/react) | @wzrhine/agent、@wzrhine/effects、@wzrhine/react |
| `react-dom` | 19.3.0 | MIT | `LICENSE` · Copyright (c) Meta Platforms, Inc. and affiliates. | [github.com/react/react](https://github.com/react/react) | @wzrhine/agent、@wzrhine/effects、@wzrhine/react |
| `reselect` | 5.3.0 | MIT | `LICENSE` · Copyright (c) 2015-2018 Reselect Contributors | [github.com/reduxjs/reselect](https://github.com/reduxjs/reselect) | @wzrhine/agent、@wzrhine/react |
| `scheduler` | 0.28.0 | MIT | `LICENSE` · Copyright (c) Meta Platforms, Inc. and affiliates. | [github.com/react/react](https://github.com/react/react) | @wzrhine/agent、@wzrhine/effects、@wzrhine/react |
| `tslib` | 2.8.1 | 0BSD | `LICENSE.txt` · Copyright (c) Microsoft Corporation. | [github.com/Microsoft/tslib](https://github.com/Microsoft/tslib) | @wzrhine/agent、@wzrhine/effects、@wzrhine/react |
| `use-sync-external-store` | 1.7.0 | MIT | `LICENSE` · Copyright (c) Meta Platforms, Inc. and affiliates. | [github.com/react/react](https://github.com/react/react) | @wzrhine/agent、@wzrhine/react |

## 非代码素材

- 字体：仓库不内置字体文件。tokens 只声明字体栈（Inter、Noto Sans SC、IBM Plex Mono 等），由使用方自行按上游许可引入（STYLE.md §2）。
- 图标：Showcase 与组件内的 SVG 图标为本项目原创绘制，未使用第三方图标库。
- 图片：`docs/concepts/images/` 为本项目原创的概念图，仅用于设计参考，不随 npm 包发布（`files` 只包含 `dist`、README、CHANGELOG）。
