# BloomSocial 技术架构设计

## Context

BloomSocial 是一个教学目的的链上内容平台，核心是「早期支持者奖励机制」。项目需要展示完整的 Web3 开发流程：智能合约 → 事件索引 → 前端交互。

**约束条件**：
- MVP 阶段，简洁优先
- 教学目的，代码可读性 > 极致优化
- 测试网部署（Sepolia / Base Sepolia）

## Goals / Non-Goals

**Goals**:
- 实现完整的点赞-分红-领取流程
- 演示链上状态与链下索引的协作
- 提供清晰的代码结构供学员学习

**Non-Goals**:
- 生产级安全审计
- Gas 极致优化
- 多链部署

---

## Decisions

### D1: 项目结构

```
lesson_project_bloom_social/
├── contract-project/          # Hardhat v3 项目
│   ├── contracts/
│   │   ├── BloomToken.sol     # ERC-20 代币
│   │   └── BloomContent.sol   # 核心业务合约
│   ├── scripts/
│   ├── test/
│   └── hardhat.config.ts
├── frontend-project/          # Next.js 项目
│   ├── src/
│   │   ├── app/               # App Router
│   │   ├── components/
│   │   ├── hooks/
│   │   └── lib/
│   └── package.json
└── graph-project/             # The Graph 子图
    ├── src/
    ├── schema.graphql
    └── subgraph.yaml
```

**理由**：三个项目独立，职责清晰，便于分模块教学。

---

### D2: 智能合约架构

#### 合约 1: BloomToken.sol
- 标准 ERC-20，固定 18 位精度
- Mint 功能（仅测试阶段）
- 符号：BLOOM

#### 合约 2: BloomContent.sol

**状态变量**：
```solidity
// 分配比例（bps = 万分比）
uint16 public constant AUTHOR_BPS = 7000;   // 70%
uint16 public constant LIKER_BPS = 2500;    // 25%
uint16 public constant PROTOCOL_BPS = 500;  // 5%

// 权重函数参数
uint256 public constant W_MAX = 1e18;       // 1.0
uint256 public constant W_MIN = 2e17;       // 0.2
uint256 public constant K = 2e17;           // 0.20

// 内容结构
struct Content {
    address author;
    uint256 likeAmount;          // 每次点赞金额
    uint256 deadline;            // 截止时间
    uint256 authorPool;          // 作者池累计
    uint256 likerRewardPool;     // 点赞者奖励池累计
    uint256 totalWeight;         // 权重总和（1e18 精度）
    uint256 likeCount;           // 点赞人数
    string contentURI;           // IPFS URI
    bytes32 contentHash;         // 内容哈希
}

// 点赞记录
struct LikeInfo {
    uint256 likeIndex;           // 点赞顺序（从 1 开始）
    uint256 weight;              // 该用户的权重（1e18 精度）
    bool claimed;                // 是否已领取
}
```

**核心函数**：
- `createContent(likeAmount, duration, contentURI, contentHash)` - 创建内容
- `like(contentId)` - 点赞
- `claimAuthorReward(contentId)` - 作者领取
- `claimLikerReward(contentId)` - 点赞者领取
- `getEstimatedReward(contentId, liker)` - 预估奖励（view）

**权重计算（Solidity 实现）**：
```solidity
// w(i) = 0.2 + 0.8 × exp(-0.20 × (i-1))
// 使用整数运算，1e18 精度
function calculateWeight(uint256 likeIndex) public pure returns (uint256) {
    // 使用 PRBMath 或简化的 Taylor 展开
    // 或预计算查表法（前 100 个值）
}
```

**理由**：
- 使用 bps 避免浮点误差
- 1e18 精度与 ERC-20 保持一致
- 懒惰计算：无需 finalize 函数，deadline 后自动可领取

---

### D3: 前端技术栈

| 技术 | 版本 | 用途 |
|-----|------|------|
| Next.js | 15.x+ | App Router, SSR（避免 CVE-2025-29927 中间件漏洞） |
| wagmi | 2.x | React Hooks for Ethereum |
| viem | 2.x | TypeScript Ethereum 库 |
| @rainbow-me/rainbowkit | 2.x | 钱包连接 UI |
| TanStack Query | 5.x | 数据获取与缓存 |
| Tailwind CSS | 4.x | 样式 |

**页面结构**：
- `/` - 首页（内容列表）
- `/content/[id]` - 内容详情页
- `/profile/[address]` - 用户主页
- `/my` - 我的主页（点赞记录、奖励领取）

**理由**：wagmi + viem 是当前 React Web3 开发的标准栈，学习曲线友好。

---

### D4: The Graph 索引设计

**Schema (GraphQL)**：
```graphql
type Content @entity {
  id: ID!                       # contentId
  author: Bytes!
  likeAmount: BigInt!
  deadline: BigInt!
  authorPool: BigInt!
  likerRewardPool: BigInt!
  totalWeight: BigInt!
  likeCount: BigInt!
  contentURI: String!
  contentHash: Bytes!
  createdAt: BigInt!
  likers: [Like!]! @derivedFrom(field: "content")
}

type Like @entity {
  id: ID!                       # contentId-liker
  content: Content!
  liker: Bytes!
  likeIndex: BigInt!
  weight: BigInt!
  claimed: Boolean!
  likedAt: BigInt!
}

type User @entity {
  id: ID!                       # address
  totalEarned: BigInt!
  totalLiked: BigInt!
  followersCount: BigInt!
  followingCount: BigInt!
}
```

**索引事件**：
- `ContentCreated(contentId, author, likeAmount, deadline, contentURI, contentHash)`
- `Liked(contentId, liker, likeIndex, weight, amount)`
- `AuthorRewardClaimed(contentId, author, amount)`
- `LikerRewardClaimed(contentId, liker, amount)`
- `Followed(follower, followee)`
- `Unfollowed(follower, followee)`

**理由**：The Graph 提供高效的历史数据查询，避免前端直接遍历链上数据。

---

## Risks / Trade-offs

| 风险 | 缓解措施 |
|-----|---------|
| exp() 在链上计算昂贵 | 使用查表法（预计算前 100 个值）或简化近似 |
| 大量点赞者时 Gas 高 | MVP 不优化，记录后续可用 Merkle Tree 批量领取 |
| 测试网 RPC 不稳定 | 前端配置多个 RPC fallback |

## Migration Plan

N/A（全新项目）

## Open Questions

1. **exp() 链上实现**：是使用 PRBMath 库还是预计算查表？
   - 建议：MVP 用查表法（前 100 个值），简单可靠

2. **内容存储**：使用 IPFS 还是 Arweave？
   - 建议：MVP 用 IPFS（免费、学习曲线低）

3. **关注关系**：是否放在 BloomContent 合约还是单独合约？
   - 建议：放在 BloomContent 中，减少合约数量
