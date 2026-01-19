# Frontend Specification

## ADDED Requirements

### Requirement: 钱包连接

系统 SHALL 支持用户通过 Web3 钱包连接平台。

#### Scenario: 连接钱包
- **WHEN** 用户点击"连接钱包"按钮
- **THEN** 显示 RainbowKit 钱包选择弹窗
- **THEN** 用户选择钱包后完成连接

#### Scenario: 显示已连接状态
- **WHEN** 钱包已连接
- **THEN** 显示地址缩略（0x1234...5678）
- **THEN** 显示 BLOOM 余额

#### Scenario: 断开连接
- **WHEN** 用户点击已连接的地址
- **THEN** 显示断开连接选项

---

### Requirement: 首页内容列表

系统 SHALL 在首页展示内容列表。

#### Scenario: 加载内容列表
- **WHEN** 用户访问首页 `/`
- **THEN** 从 The Graph 获取内容列表
- **THEN** 按创建时间倒序展示

#### Scenario: 内容卡片展示
- **WHEN** 展示内容卡片
- **THEN** 显示：作者地址、赏金池金额、点赞人数、剩余时间/已结束状态

#### Scenario: 加载状态
- **WHEN** 数据加载中
- **THEN** 显示骨架屏或加载指示器

---

### Requirement: 内容详情页

系统 SHALL 提供内容详情查看和交互功能。

#### Scenario: 查看内容
- **WHEN** 用户访问 `/content/[id]`
- **THEN** 从 IPFS 加载内容正文
- **THEN** 显示赏金池详情、点赞者列表

#### Scenario: 显示实时奖励预估
- **WHEN** 用户已点赞该内容
- **THEN** 显示"预估可领取奖励"金额
- **THEN** 金额随新点赞者加入实时更新

---

### Requirement: 点赞功能

系统 SHALL 允许用户对内容进行付费点赞。

#### Scenario: 显示点赞按钮
- **WHEN** 内容进行中且用户未点赞
- **THEN** 显示"点赞 (X BLOOM)"按钮

#### Scenario: 执行点赞
- **WHEN** 用户点击点赞按钮
- **THEN** 检查 BLOOM 授权额度
- **THEN** 如未授权，先发起 approve 交易
- **THEN** 发起 like 交易
- **THEN** 显示交易状态（pending → success/fail）

#### Scenario: 已点赞状态
- **WHEN** 用户已点赞
- **THEN** 按钮变为"已点赞"，不可再次点击

#### Scenario: 内容已结束
- **WHEN** 当前时间 >= 截止时间
- **THEN** 隐藏点赞按钮

---

### Requirement: 领取奖励

系统 SHALL 允许用户领取已结束内容的奖励。

#### Scenario: 作者领取按钮
- **WHEN** 内容已结束且当前用户是作者
- **THEN** 显示"领取作者奖励 (X BLOOM)"按钮

#### Scenario: 点赞者领取按钮
- **WHEN** 内容已结束且当前用户已点赞
- **THEN** 显示"领取点赞奖励 (X BLOOM)"按钮

#### Scenario: 执行领取
- **WHEN** 用户点击领取按钮
- **THEN** 发起 claim 交易
- **THEN** 显示交易状态

#### Scenario: 已领取状态
- **WHEN** 用户已领取
- **THEN** 显示"已领取"，按钮不可点击

---

### Requirement: 发布内容

系统 SHALL 允许用户发布新内容。

#### Scenario: 发布表单
- **WHEN** 用户访问发布页面
- **THEN** 显示表单：内容正文、点赞金额、有效期

#### Scenario: 上传到 IPFS
- **WHEN** 用户提交内容
- **THEN** 将内容上传到 IPFS，获取 CID

#### Scenario: 创建链上记录
- **WHEN** IPFS 上传成功
- **THEN** 调用 createContent 合约方法
- **THEN** 显示交易状态

---

### Requirement: 用户主页

系统 SHALL 提供用户主页展示。

#### Scenario: 查看他人主页
- **WHEN** 访问 `/profile/[address]`
- **THEN** 显示：用户发布的内容、粉丝数、关注数、总收益

#### Scenario: 关注按钮
- **WHEN** 查看他人主页且未关注
- **THEN** 显示"关注"按钮

#### Scenario: 取消关注
- **WHEN** 已关注该用户
- **THEN** 显示"已关注"，点击可取消

---

### Requirement: 我的主页

系统 SHALL 提供当前用户的个人主页。

#### Scenario: 我的点赞记录
- **WHEN** 访问 `/my`
- **THEN** 显示我点赞过的所有内容

#### Scenario: 我的收益总览
- **WHEN** 访问 `/my`
- **THEN** 显示：总收益、可领取奖励、已领取金额

#### Scenario: 批量领取提示
- **WHEN** 有多个可领取奖励
- **THEN** 列出所有可领取的内容

---

### Requirement: 交易状态反馈

系统 SHALL 提供清晰的交易状态反馈。

#### Scenario: 交易 pending
- **WHEN** 交易已提交等待确认
- **THEN** 显示加载动画和"交易处理中"

#### Scenario: 交易成功
- **WHEN** 交易确认成功
- **THEN** 显示成功提示，刷新相关数据

#### Scenario: 交易失败
- **WHEN** 交易失败或用户拒绝
- **THEN** 显示错误信息

---

### Requirement: 响应式布局

系统 SHALL 支持移动端和桌面端访问。

#### Scenario: 桌面端布局
- **WHEN** 屏幕宽度 >= 1024px
- **THEN** 使用宽屏布局

#### Scenario: 移动端布局
- **WHEN** 屏幕宽度 < 768px
- **THEN** 使用单列布局，优化触控交互
