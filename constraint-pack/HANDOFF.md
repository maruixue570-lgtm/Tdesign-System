# 给负责生成环节的同事

这套包约束的是“需求 → 设计SPEC → 小程序代码 → 检查交付”。HTML是展示入口，机器规则和脚本才是执行入口。

## 第一阶段：设计模块（瑞雪负责的范围）

调用 `runDesignStage({request, generate})`，或执行 `scripts/design-stage.mjs`。
`generate`接你们已有模型，框架会加载规则、校验输出、返回错误并最多重试3次。
输出：`plan-spec.json`、`ui-interaction.md`、`design-report.json`。
`design_ready`表示设计结构可以交下一阶段；`needs_clarification`和`blocked`需要处理。

## 后续生成阶段（宿主工程接入）

- 每次生成与修改都携带规则，不只首次会话。
- 安装批准的确切 TDesign 版本，按registry引用真实组件。
- 运行validate；失败修复，不能当作普通日志忽略。
- 完成真实API、视觉与行为评审，使用可信签名记录。
- 由不可跳过的CI运行gate，检查退出码及releaseAllowed。

## 设计侧已经提供

65个基础组件映射；八类可组合模式和24种变体；通用规则；视觉指导；图文列表与对话气泡等具体约束；SPEC schema；可执行模块接口与示例；校验与签名门禁。

## 同事需要提供

1. 现有模型调用接口。
2. 原生微信小程序工程路径及批准的TDesign版本。
3. 实际需要的子组件、业务组件和平台能力扩展清单。
4. 真实编译/预览能力与评审责任人。
5. 将规则、校验器和公钥置于生成Agent不可修改的可信环境。

## 五分钟验收

运行 `node tests/run.mjs`，应通过31项测试。
运行README中的离线demo，确认得到设计SPEC、Markdown与报告。
将一个组件改为不在白名单的名称，再检查，必须失败。
未配置版本或没有签名审批时，实际工程gate必须失败。

注意：回放demo不是模型；测试假依赖不是官方组件；示例HTML不是实际小程序渲染。
