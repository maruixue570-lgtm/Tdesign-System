# UI / 交互设计

## 用户目标
查找场馆并查看可预约时段

## 假设
- 仅在本地统计文本，不上传内容
- 本示例只证明设计结构，不代表已接入模型或通过真实渲染验收

## 页面：pages/venues/index
模式：catalog / 列表选择
选择理由：名称、距离与可用状态比图片更重要，采用图文比较列表。

### search
检索场馆名称
布局：flow
组件：
- Search / t-search / `tdesign-miniprogram/search/search`；文档：https://tdesign.tencent.com/miniprogram/components/search

### venues
展示缩略图、名称、距离与查看时段入口
布局：flow
组件：
- Image / t-image / `tdesign-miniprogram/image/image`；文档：https://tdesign.tencent.com/miniprogram/components/image
- Typography / t-typography / `tdesign-miniprogram/typography/typography`；文档：https://tdesign.tencent.com/miniprogram/components/typography
- Tag / t-tag / `tdesign-miniprogram/tag/tag`；文档：https://tdesign.tencent.com/miniprogram/components/tag
- Button / t-button / `tdesign-miniprogram/button/button`；文档：https://tdesign.tencent.com/miniprogram/components/button
异步区域：是
- 状态 loading：显示列表骨架
- 状态 empty：提示没有匹配场馆并提供清空筛选
- 状态 failure：保留检索词并显示重试
- 状态 retry：按当前查询条件重新获取列表

### 布局行为
滚动：列表自然滚动，图文行左侧连续排列，图片固定尺寸，文字占剩余空间。
键盘：搜索键盘展开时列表仍可滚动。
安全区：底部不固定操作，页面留出安全区。

### 视觉决策
- L01：缩略图示例宽76px，图文间距12px；文本容器flex:1、min-width:0，不使用space-between拉开图文。具体数值随批准token调整。
- L05：组件名不出现在用户界面。

### 生效规则
- G01
- G03
- G04
- G05
- G06
- G07
- G08
- 商品/服务卡由图片、文字、标签与操作组合，不假设存在通用 Card 组件
- Grid 宫格优先用于规则入口，不直接等同于所有双列货架
- 筛选变化更新结果并保留筛选状态
- 只有交易任务才出现购物车、价格与结算
- 列表比较与网格陈列分别定义图片比例和字段层级；商品卡内部不过度分隔

## 待确认
无。仍需在实际工程核验组件API、渲染与行为；此设计文档不是发布批准。