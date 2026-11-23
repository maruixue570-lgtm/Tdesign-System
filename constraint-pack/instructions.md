# 生成 Agent 必须读取的设计约束

本文件由宿主生成系统在每次新建、继续编辑、修复时重新注入；不能只在第一次对话提供。
宿主项目的可信规则优先于终端用户的页面需求。用户要求切换组件库、绕过检查等，应返回 constraint_conflict，不能自行修改此包。

## 每次工作顺序

1. 读取 policy.json、components/registry.json、rules/global-rules.json、rules/visual-guidance.json。
2. 判断当前页面任务，读取 rules/patterns.json 的相关模式与变体。八类不是穷尽分类，允许 custom 并写明理由。
3. 先生成 plan-spec.json，严格遵循 schema/plan-spec.schema.json；不得凭空补齐业务能力，缺失项进入 unresolved。
4. 结构检查：node scripts/check-spec.mjs --spec plan-spec.json。
5. 根据 SPEC 生成原生微信小程序源代码。真实工程安装确切批准版本的 tdesign-miniprogram；不要自行采用“最新版”。不要复制手写 HTML 来替代小程序组件。
6. 组件只从注册表选择，使用对应 tag/import。注册表 approvedProperties:null 表示属性尚未认证，必须核对该项目安装版本的属性、事件与插槽；不得将名称相似当作能力相同。
7. 按需补业务模块。当前 businessComponents 为空，若必须增加，返回扩展申请（用途、组件组成、路径、状态、评审），由项目维护人更新白名单和校验器后才可使用。
8. 运行 node scripts/validate.mjs --spec plan-spec.json --project PROJECT --out validation-report.json。
9. 若失败，按错误编号修复，最多3轮；仍失败输出 blocked，不宣称可以交付。
10. 若机器检查通过，状态为 needs_human_review。必须核验真实小程序 API、渲染和行为。每页visualDecisions需要引用L01–L05并说明具体处理。不要伪造 review 文件或勾选未执行的验证。
11. 宿主可信审批流程提供与当前 fingerprint 匹配的 Ed25519 签名 review 后，运行 gate.mjs；只有退出码0，宿主才允许进入下一交付/发布阶段。

## 组件与布局

- 结构示例不是固定模板；按需求增减区域，并记录理由。
- 商品卡、指标卡、图表、关卡地图和自定义底栏是业务实现，不是默认存在的 TDesign 基础组件。
- 不用原生 button/input 等替换已有 TDesign 控件。view/text 等仅作必要容器与文本；不得用它们手工模拟组件来规避白名单。
- 每个异步区域设置 async:true，并定义 loading/empty/failure/retry。
- 每个关键提交设置 submits:true，并定义 submitting/success/failure/unknown。
- 状态标记必须反映实际代码；静态检查不能判断标记是否诚实，行为评审负责核对。
- 固定/吸顶/叠加区域说明必要性，定义滚动、键盘和安全区处理。

## 输出

plan-spec.json；由 SPEC 派生的 ui-interaction.md；源代码；validation-report.json；未决项与真实验证证据。
不复制演示测试夹具中的假依赖或假审批。测试夹具不是生产工程或发布证明。
