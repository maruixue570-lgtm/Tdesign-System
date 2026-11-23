# UI / 交互设计

## 用户目标
制作一个文本字数统计工具，输入后主动统计，在当前页展示结果。

## 假设
- 仅在本地统计文本，不上传内容
- 本示例只证明设计结构，不代表已接入模型或通过真实渲染验收

## 页面：pages/counter/index
模式：tool / 点击处理
选择理由：用户完成输入后主动执行，结果简短，适合原页展示。

### input
填写待统计文本
布局：flow
组件：
- Textarea / t-textarea / `tdesign-miniprogram/textarea/textarea`；文档：https://tdesign.tencent.com/miniprogram/components/textarea

### execute
明确触发统计
布局：flow
组件：
- Button / t-button / `tdesign-miniprogram/button/button`；文档：https://tdesign.tencent.com/miniprogram/components/button

### result
展示字数及复制结果入口
布局：flow
组件：
- Typography / t-typography / `tdesign-miniprogram/typography/typography`；文档：https://tdesign.tencent.com/miniprogram/components/typography
- Button / t-button / `tdesign-miniprogram/button/button`；文档：https://tdesign.tencent.com/miniprogram/components/button

### 布局行为
滚动：页面自然滚动，输入与结果分组
键盘：编辑时允许滚动至当前输入位置，提交后按需收起键盘
安全区：不固定底栏，页面底部预留安全区

### 视觉决策
- L03：文本输入与结果以分组留白区分，不给每个文本字段再套卡片。
- L05：界面只显示业务文案，组件名、状态字段和实现注释留在设计文档。

### 生效规则
- G01
- G02
- G03
- G04
- G05
- G06
- G07
- G08
- 根据输入对象选择 Input、Textarea 或 Upload，不能要求所有工具都有上传
- 参数放在输入之后；高级低频参数可折叠
- 即时计算可不设执行按钮；耗时处理需明确触发与加载反馈
- 默认内容随页滚动；固定操作栏必须有必要性并预留底部空间
- 输入与结果使用清楚的分组和留白；不为每个参数额外嵌套卡片

## 待确认
无。仍需在实际工程核验组件API、渲染与行为；此设计文档不是发布批准。