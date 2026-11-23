# 宿主接入细节

完整命令见README；入口见index.mjs。

## 模型上下文

loadContext每次从同一套规则源加载：policy、registry、patterns、global-rules、visual-guidance、layout-constraints及schema。
宿主必须将可信规则放在系统/开发者指令，将用户提示词放在任务数据；不要让用户提示词覆盖规则。
八类模式总量不大，当前全部加载，避免关键词检索漏选场景。
生成结果只接受结构化SPEC，Markdown从同一SPEC派生，减少两份文档不一致。

## 自动修复

generate(context, feedback)接收attempt、previousErrors、previousSpec。
结构错误返回具体编号，最多3轮。API异常同样进入重试记录，耗尽后blocked。
缺失业务信息放进unresolved，输出needs_clarification，不能把猜测当确认。
后续代码生成错误由宿主按相同方式处理，本包不擅自执行未知的生成/构建命令。

## 版本与组件

policy.approvedVersions默认空，由维护人核准实际安装的版本后配置。
registry的approvedProperties:null意味着API待认证，不意味着任意属性合法。
基础组件子项如FormItem、GridItem以及平台video/map等不自动放行。按项目需要显式登记和扩展校验，禁止直接放开所有t-*标签。
Chat扩展不隐式当作基础库存在，项目确认后单独接入。

## 检查与审批

validate返回机器检查结果，永远不会直接发布。
review使用Ed25519签名，绑定源码、SPEC、规则及版本指纹。
签名由独立评审环境产生；公钥及检查脚本必须由宿主控制，生成Agent不能替换。
证据记录至少覆盖API/编译、视觉/窄屏/键盘、行为/异常。
签名只能证明审批来源，视觉与行为评审是否充分仍由团队负责。
最终必须由CI运行gate并检查退出码，不能只让模型自行报告“通过”。

## 文件位置

生成工程只放源码、依赖与工程配置。报告、审批、临时输出与派生Markdown放在工程之外，避免改变代码指纹。
规则包放在独立只读目录；CI wrapper为ci/verify.sh。
私钥不进源码、不进分发ZIP、不提供给生成Agent。
