# 小程序设计约束包 v1.1

本包交给负责生成环节的同事接入。目标：每次生成和修改，都读取相同的设计约束，优先使用批准的 TDesign 组件，输出设计文档并接受检查。

**它是可执行的规则与接入包，不是已接入模型的独立应用。** 宿主必须把入口和检查接进自己的流程，才会生效。

## 先打开

- `HANDOFF.md`：给同事的一页接入清单。
- `docs/knowledge.html`：组件、八类模式、24种布局的可视化文档，已同步最新图文间距与气泡调整。
- `examples/ui-interaction.md`：工具型输出样例。
- `examples/catalog-interaction.md`：场馆列表输出样例，明确图片76px、间距12px、文字占剩余空间只是项目示例值。

## 不联网快速验收

要求 Node.js 18+。本约束包自身无第三方依赖，不需要 npm install。

```bash
node tests/run.mjs
node scripts/design-stage.mjs --request examples/request.json --adapter adapters/example-replay.mjs --out /tmp/design-demo
```

第一条运行31项正反例测试。第二条回放固定样例，输出 `plan-spec.json`、`ui-interaction.md`、`design-report.json`。
**回放不是AI生成，不会理解新的需求。** 用于检查模块能否读取规则、检查结构和输出文件。

## 接你们现有模型

复制 `adapters/host-adapter.example.mjs` 为宿主适配器，实现唯一入口：

```javascript
export async function generate(context, feedback) {
  // 调用你们已有的模型或 Agent。
  // context 包含全局规则、65个组件映射、八类模式、视觉原则与输出schema。
  // feedback 包含本轮错误和上一版SPEC，供最多3轮修复。
  // 返回解析后的SPEC对象，不要返回Markdown或带围栏的JSON字符串。
}
```

执行：

```bash
node scripts/design-stage.mjs --request request.json --adapter /trusted/host-adapter.mjs --out /outside-project/design-output
```

或者作为模块导入：

```javascript
import { runDesignStage } from './index.mjs';
const result = await runDesignStage({ request, generate: yourExistingModelAdapter });
```

每次调用会重新加载规则；结构错误最多修复3轮。`design_ready` 只允许进入后续代码生成，不代表可以发布；信息不足为 `needs_clarification`，不能冒充成功。

## 接后续代码生成

宿主将本包约束、SPEC与派生Markdown传给后续Agent。代码工程必须安装真实 TDesign，不使用HTML模拟件替代。
项目维护人先确定确切版本，将工程 package.json 锁定为该版本并安装，然后显式批准：

```bash
node scripts/configure-project.mjs --project /path/to/miniapp --approve-version X.Y.Z
node scripts/audit-registry.mjs --project /path/to/miniapp --out /outside-project/registry-audit.json
```

`X.Y.Z`必须替换成项目实际安装并批准的版本；包内未擅自选“最新版”。默认 `approvedVersions:[]`，未配置时工程检查不放行。
注册表为65个基础组件目录映射；子组件、业务组件和平台能力需要维护人按实际工程扩展。不存在的实现路径会被拦截，不会因为有目录名就假定可用。

检查实际代码：

```bash
node scripts/validate.mjs --spec /outside-project/plan-spec.json --project /path/to/miniapp --out /outside-project/validation-report.json
```

检查范围：SPEC结构、模式/变体、组件白名单、必需状态定义、静态WXML标签、组件引入路径、安装文件、批准版本一致性。
`validate`退出码0只是机器检查通过；发布状态仍是 `needs_human_review`。

## 最终交付检查

组件属性与事件、真实小程序渲染、实际交互行为仍需验证。本包使用签名评审记录，避免模型仅写一个“已通过”的JSON就获得放行。

1. 可信评审环境生成一次密钥：`node scripts/review-keygen.mjs --out /trusted/keys`。私钥不能交给生成Agent。
2. 按 `examples/review-evidence.template.json` 的三类内容完成真实验证，填写证据记录。
3. 评审环境设置 `DESIGN_REVIEW_PRIVATE_KEY` 为私钥路径，运行：

```bash
node scripts/sign-review.mjs --report /outside-project/validation-report.json --evidence /trusted/evidence.json --reviewer REVIEWER --out /trusted/signed-review.json
```

4. 可信交付环境设置 `DESIGN_REVIEW_PUBLIC_KEY` 为公钥路径，运行：

```bash
node scripts/gate.mjs --spec /outside-project/plan-spec.json --project /path/to/miniapp --review /trusted/signed-review.json --out /outside-project/gate-report.json
```

只有gate退出码0且 `releaseAllowed:true` 才能继续交付。源码、SPEC、规则或受检查依赖发生变化后，原审批失效。签名默认7天有效。
报告、评审记录、派生Markdown放到被扫描工程之外，避免报告自身改变源码指纹。

## 信任边界

- 生成Agent：只写候选SPEC和小程序工程。
- 维护人：管理本包、批准版本、组件扩展和宿主适配器。
- 评审人：在独立环境持有私钥，核对实际证据。
- CI/交付系统：使用只读规则包和可信公钥，强制执行gate；不能允许Agent跳过或替换检查脚本。

即使签名有效，也只能证明由持有私钥者批准了对应内容，不能自动证明评审证据真实或设计美观。
外部用户绕开你们的软件自行编程，不在本包可控制范围内。

## 当前已实现与待接入

已实现：规则加载、模型适配接口、结构验证、三轮修复、Markdown派生、组件映射检查、签名交付门禁、31项自动测试、最新知识库页面。
待宿主完成：接入真实模型、批准实际版本、确认复合组件/平台能力、认证API、执行真实渲染与交互评审、把门禁设为不可跳过。

本包不是小程序编译器。当前不会自动验证全部官方属性、事件、插槽，也不能仅靠静态扫描判断图片间距、气泡美观或识别所有手绘控件。视觉规则进入真实评审，不伪造自动通过结果。
