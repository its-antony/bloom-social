# Change: 初始化 BloomSocial 项目

## Why

BloomSocial 是一个链上内容平台的教学项目，需要实现：
- 用户通过钱包登录，进行链上关注、发布内容、点赞等操作
- 创新的「早期支持者奖励机制」：越早点赞的人获得越多分红
- 完整的 Web3 技术栈：智能合约 + 前端 + 事件索引

## What Changes

### 新增三个子项目

1. **contract-project/** - 智能合约项目
   - 使用 Hardhat v3 + Solidity
   - 实现 BloomToken (ERC-20) 和 BloomContent 核心合约
   - 部署到测试网 (Sepolia / Base Sepolia)

2. **frontend-project/** - 前端项目
   - 使用 Next.js 15+ + wagmi + viem
   - 钱包连接、内容浏览、点赞、领取奖励等功能

3. **graph-project/** - The Graph 索引项目
   - 索引合约事件
   - 提供 GraphQL 查询接口

### 核心经济模型

- **分配比例（固定）**：作者 70% | 点赞者 25% | 协议 5%
- **权重函数**：`w(i) = 0.2 + 0.8 × exp(-0.20 × (i-1))`，i 为点赞顺序
- **懒惰计算**：无需 Finalize，截止时间到达后可直接领取

## Impact

- Affected specs: `smart-contract`, `frontend`, `graph-indexer`（全部新增）
- Affected code: 全新项目，无现有代码
- **BREAKING**: N/A（新项目）

## Out of Scope (MVP)

- 全文搜索
- 推荐算法
- 复杂反女巫机制
- 多链支持
- DAO 治理
