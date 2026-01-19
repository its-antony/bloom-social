# Smart Contract Specification

## ADDED Requirements

### Requirement: BloomToken ERC-20 代币

系统 SHALL 提供一个符合 ERC-20 标准的 BLOOM 代币合约。

#### Scenario: 代币基本属性
- **WHEN** 查询代币信息
- **THEN** 名称为 "Bloom Token"，符号为 "BLOOM"，精度为 18

#### Scenario: 测试网铸造
- **WHEN** 用户调用 mint 函数（仅测试网）
- **THEN** 向用户地址铸造指定数量的 BLOOM

---

### Requirement: 内容创建

系统 SHALL 允许作者创建带有分红规则的内容。

#### Scenario: 成功创建内容
- **WHEN** 作者调用 createContent(likeAmount, duration, contentURI, contentHash)
- **THEN** 创建一个新的内容记录，设置截止时间为 block.timestamp + duration
- **THEN** 发出 ContentCreated 事件

#### Scenario: 参数验证
- **WHEN** likeAmount 为 0 或 duration 为 0
- **THEN** 交易回滚，返回错误

---

### Requirement: 点赞功能

系统 SHALL 允许用户对内容进行付费点赞，并按规则分配资金。

#### Scenario: 成功点赞
- **WHEN** 用户对进行中的内容调用 like(contentId)
- **THEN** 从用户账户转入 likeAmount 的 BLOOM
- **THEN** 按比例分配：70% 进入作者池，25% 进入点赞者奖励池，5% 进入协议金库
- **THEN** 记录用户的点赞顺序 likeIndex，计算并存储权重 w(i)
- **THEN** 累加 totalWeight
- **THEN** 发出 Liked 事件

#### Scenario: 重复点赞拒绝
- **WHEN** 用户对同一内容再次点赞
- **THEN** 交易回滚，返回 "Already liked" 错误

#### Scenario: 已结束内容点赞拒绝
- **WHEN** 当前时间 >= 内容截止时间
- **THEN** 交易回滚，返回 "Content ended" 错误

---

### Requirement: 权重计算

系统 SHALL 使用指数衰减函数计算点赞者权重。

#### Scenario: 权重公式
- **WHEN** 第 i 个用户点赞（i 从 1 开始）
- **THEN** 权重 w(i) = 0.2 + 0.8 × exp(-0.20 × (i-1))
- **THEN** 使用 1e18 精度存储

#### Scenario: 首位点赞者权重
- **WHEN** 第 1 个用户点赞
- **THEN** 权重接近 1.0（1e18）

#### Scenario: 后期点赞者权重下限
- **WHEN** 第 N 个用户点赞（N 很大）
- **THEN** 权重不低于 0.2（2e17）

---

### Requirement: 作者领取奖励

系统 SHALL 允许作者在内容结束后领取收益。

#### Scenario: 成功领取作者奖励
- **WHEN** 当前时间 >= 截止时间
- **AND** 作者调用 claimAuthorReward(contentId)
- **THEN** 将 authorPool 中的全部 BLOOM 转给作者
- **THEN** 发出 AuthorRewardClaimed 事件

#### Scenario: 内容进行中拒绝领取
- **WHEN** 当前时间 < 截止时间
- **THEN** 交易回滚，返回 "Content still active" 错误

#### Scenario: 重复领取拒绝
- **WHEN** 作者已领取过
- **THEN** 交易回滚，返回 "Already claimed" 错误

---

### Requirement: 点赞者领取奖励

系统 SHALL 允许点赞者在内容结束后按权重领取分红。

#### Scenario: 成功领取点赞者奖励
- **WHEN** 当前时间 >= 截止时间
- **AND** 点赞者调用 claimLikerReward(contentId)
- **THEN** 计算 reward = likerRewardPool × w(i) / totalWeight
- **THEN** 将 reward 数量的 BLOOM 转给点赞者
- **THEN** 标记 claimed = true
- **THEN** 发出 LikerRewardClaimed 事件

#### Scenario: 非点赞者拒绝领取
- **WHEN** 用户未对该内容点赞
- **THEN** 交易回滚，返回 "Not a liker" 错误

#### Scenario: 重复领取拒绝
- **WHEN** 点赞者已领取过
- **THEN** 交易回滚，返回 "Already claimed" 错误

---

### Requirement: 预估奖励查询

系统 SHALL 提供实时预估奖励的 view 函数。

#### Scenario: 查询预估奖励
- **WHEN** 调用 getEstimatedReward(contentId, liker)
- **THEN** 返回 likerRewardPool × w(i) / totalWeight
- **THEN** 不消耗 Gas

---

### Requirement: 关注功能

系统 SHALL 允许用户关注/取消关注其他用户。

#### Scenario: 成功关注
- **WHEN** 用户 A 调用 follow(addressB)
- **THEN** 记录关注关系
- **THEN** 发出 Followed 事件

#### Scenario: 取消关注
- **WHEN** 用户 A 调用 unfollow(addressB)
- **THEN** 移除关注关系
- **THEN** 发出 Unfollowed 事件

#### Scenario: 自己关注自己拒绝
- **WHEN** 用户尝试关注自己
- **THEN** 交易回滚

---

### Requirement: 协议金库

系统 SHALL 累计协议费用到指定金库地址。

#### Scenario: 协议费用累计
- **WHEN** 每次点赞发生
- **THEN** 5% 的点赞金额累计到协议金库

#### Scenario: 金库地址配置
- **WHEN** 部署合约时
- **THEN** 设置协议金库地址（可由管理员更新）

---

### Requirement: 事件定义

系统 SHALL 发出以下事件供链下索引。

#### Scenario: ContentCreated 事件
- **WHEN** 创建内容
- **THEN** 发出 ContentCreated(contentId, author, likeAmount, deadline, contentURI, contentHash)

#### Scenario: Liked 事件
- **WHEN** 用户点赞
- **THEN** 发出 Liked(contentId, liker, likeIndex, weight, amount)

#### Scenario: AuthorRewardClaimed 事件
- **WHEN** 作者领取
- **THEN** 发出 AuthorRewardClaimed(contentId, author, amount)

#### Scenario: LikerRewardClaimed 事件
- **WHEN** 点赞者领取
- **THEN** 发出 LikerRewardClaimed(contentId, liker, amount)

#### Scenario: Followed 事件
- **WHEN** 关注
- **THEN** 发出 Followed(follower, followee)

#### Scenario: Unfollowed 事件
- **WHEN** 取消关注
- **THEN** 发出 Unfollowed(follower, followee)
