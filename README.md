# 小程序设计知识库 · Miniapp Design Library

把 TDesign 小程序的基础组件、页面组织模式、设计约束与 SPEC 输出契约整理成一个可浏览、可导出、可接入生成流程的项目。

## 这是什么

项目包含两部分：

1. **`index.html`** — 可视化设计知识库（单文件，离线可用）。包含 65 个 TDesign 基础组件、8 类可组合的页面组织模式 / 24 种布局变体、8 条通用设计规则、SPEC 输出契约与来源边界。支持搜索、结构预览、导出 JSON / Markdown。
2. **`constraint-pack/`** — 可执行的约束包 v1.1。给 AI 生成环节使用：加载规则、校验 SPEC、最多 3 轮修复、派生 Markdown、工程白名单校验、签名交付门禁。包含 31 项自动测试。

知识库 HTML 数据版本为 `0.4.0`，约束包版本为 `1.1.0`；两者独立版本管理。

## 快速开始

直接在浏览器打开 `index.html` 即可浏览知识库，无需构建或联网。

运行约束包自检（需 Node.js 18+）：

```bash
cd constraint-pack
node tests/run.mjs
```

离线回放 demo：

```bash
cd constraint-pack
node scripts/design-stage.mjs --request examples/request.json \
  --adapter adapters/example-replay.mjs --out /tmp/design-demo
```

接入真实模型、后续代码生成与最终门禁见 `constraint-pack/README.md` 和 `constraint-pack/HANDOFF.md`。

## 目录

```
.
├── index.html            # 知识库页面（最新版，单文件自包含）
└── constraint-pack/      # 可执行约束包 v1.1
    ├── README.md         # 接入说明
    ├── HANDOFF.md        # 给生成环节同事的一页交接
    ├── docs/knowledge.html
    ├── rules/            # 模式、全局规则、布局约束、视觉指导
    ├── components/registry.json
    ├── schema/           # plan-spec JSON Schema
    ├── scripts/          # 设计阶段、校验、签名、门禁
    ├── adapters/         # 模型适配器示例
    ├── examples/         # 请求、SPEC、输出与评审证据样例
    └── tests/run.mjs
```

## 状态与边界

- 知识库为审阅稿（review draft），尚未部署到公开站点。
- 八类模式是项目建议，不是 TDesign 官方分类；不穷尽所有小程序，允许自定义并写明理由。
- `constraint-pack/policy.json` 中 `approvedVersions` 默认为空，需项目维护人批准实际安装的 TDesign 版本后才放行。
- `check-spec` / `validate` 只做结构检查；`design_ready` 仅表示可进入代码生成，不代表可发布。发布需真人验证并由可信环境签名，`gate` 通过后才可继续。
- 知识库页面中的界面示意是 HTML 模拟，不是真实小程序渲染结果；组件属性、事件与插槽以锁定版本的官方文档为准。
