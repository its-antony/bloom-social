# Graph Indexer Specification

## ADDED Requirements

### Requirement: 内容实体索引

系统 SHALL 索引所有内容创建事件并维护内容实体。

#### Scenario: 索引 ContentCreated 事件
- **WHEN** ContentCreated 事件被发出
- **THEN** 创建 Content 实体
- **THEN** 记录 id, author, likeAmount, deadline, contentURI, contentHash, createdAt

#### Scenario: 更新内容统计
- **WHEN** Liked 事件被发出
- **THEN** 更新对应 Content 的 authorPool, likerRewardPool, totalWeight, likeCount

---

### Requirement: 点赞实体索引

系统 SHALL 索引所有点赞事件并维护点赞实体。

#### Scenario: 索引 Liked 事件
- **WHEN** Liked 事件被发出
- **THEN** 创建 Like 实体
- **THEN** 记录 id (contentId-liker), content, liker, likeIndex, weight, likedAt
- **THEN** 设置 claimed = false

#### Scenario: 更新领取状态
- **WHEN** LikerRewardClaimed 事件被发出
- **THEN** 更新对应 Like 实体的 claimed = true

---

### Requirement: 用户实体索引

系统 SHALL 维护用户统计数据。

#### Scenario: 创建用户实体
- **WHEN** 用户首次创建内容或点赞
- **THEN** 创建 User 实体（如不存在）

#### Scenario: 更新作者收益
- **WHEN** AuthorRewardClaimed 事件被发出
- **THEN** 累加 User 的 totalEarned

#### Scenario: 更新点赞统计
- **WHEN** Liked 事件被发出
- **THEN** 累加点赞者的 totalLiked

#### Scenario: 更新关注统计
- **WHEN** Followed 事件被发出
- **THEN** 累加被关注者的 followersCount
- **THEN** 累加关注者的 followingCount

#### Scenario: 更新取消关注统计
- **WHEN** Unfollowed 事件被发出
- **THEN** 减少被关注者的 followersCount
- **THEN** 减少关注者的 followingCount

---

### Requirement: 关注关系索引

系统 SHALL 索引关注关系。

#### Scenario: 索引 Followed 事件
- **WHEN** Followed 事件被发出
- **THEN** 创建 Follow 实体
- **THEN** 记录 id (follower-followee), follower, followee, followedAt

#### Scenario: 索引 Unfollowed 事件
- **WHEN** Unfollowed 事件被发出
- **THEN** 删除对应的 Follow 实体

---

### Requirement: 内容列表查询

系统 SHALL 提供内容列表查询接口。

#### Scenario: 查询最新内容
- **WHEN** 查询 contents(orderBy: createdAt, orderDirection: desc)
- **THEN** 返回按创建时间倒序的内容列表

#### Scenario: 查询进行中内容
- **WHEN** 查询 contents(where: { deadline_gt: currentTimestamp })
- **THEN** 返回未截止的内容列表

#### Scenario: 查询用户发布的内容
- **WHEN** 查询 contents(where: { author: address })
- **THEN** 返回该作者发布的所有内容

---

### Requirement: 用户点赞记录查询

系统 SHALL 提供用户点赞记录查询接口。

#### Scenario: 查询用户点赞列表
- **WHEN** 查询 likes(where: { liker: address })
- **THEN** 返回该用户的所有点赞记录

#### Scenario: 查询可领取奖励
- **WHEN** 查询 likes(where: { liker: address, claimed: false })
- **THEN** 返回该用户未领取的点赞记录

---

### Requirement: 内容点赞者查询

系统 SHALL 提供内容点赞者列表查询。

#### Scenario: 查询内容点赞者
- **WHEN** 查询 content(id).likers
- **THEN** 返回该内容的所有点赞记录（包含点赞者地址、顺序、权重）

---

### Requirement: 关注关系查询

系统 SHALL 提供关注关系查询接口。

#### Scenario: 查询用户粉丝
- **WHEN** 查询 follows(where: { followee: address })
- **THEN** 返回关注该用户的所有用户

#### Scenario: 查询用户关注列表
- **WHEN** 查询 follows(where: { follower: address })
- **THEN** 返回该用户关注的所有用户

#### Scenario: 检查关注状态
- **WHEN** 查询 follow(id: "follower-followee")
- **THEN** 如存在返回实体，否则返回 null

---

### Requirement: 全局统计查询

系统 SHALL 提供全局统计数据。

#### Scenario: 查询协议统计
- **WHEN** 查询 protocolStats
- **THEN** 返回总内容数、总点赞数、总交易金额
