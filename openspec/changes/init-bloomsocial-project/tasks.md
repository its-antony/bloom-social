# BloomSocial 实现任务清单

## 1. 项目初始化

- [x] 1.1 创建 `contract-project/` 目录，初始化 Hardhat v3 项目
- [x] 1.2 创建 `frontend-project/` 目录，初始化 Next.js 14 项目
- [x] 1.3 创建 `graph-project/` 目录，初始化 The Graph 子图项目
- [x] 1.4 更新 `openspec/project.md` 记录项目约定

## 2. 智能合约开发 (contract-project)

### 2.1 基础合约
- [x] 2.1.1 编写 `BloomToken.sol` (ERC-20)
- [x] 2.1.2 编写权重计算库 `WeightLib.sol`（查表法实现 exp 衰减）
- [x] 2.1.3 编写 `BloomContent.sol` 核心合约结构

### 2.2 核心功能
- [x] 2.2.1 实现 `createContent()` 函数
- [x] 2.2.2 实现 `like()` 函数（含权重计算、资金分配）
- [x] 2.2.3 实现 `claimAuthorReward()` 函数
- [x] 2.2.4 实现 `claimLikerReward()` 函数
- [x] 2.2.5 实现 `getEstimatedReward()` view 函数

### 2.3 关注功能
- [x] 2.3.1 实现 `follow()` / `unfollow()` 函数

### 2.4 测试与部署
- [x] 2.4.1 编写单元测试（点赞、领取、权重计算）
- [x] 2.4.2 编写部署脚本
- [ ] 2.4.3 部署到 Sepolia 测试网
- [ ] 2.4.4 验证合约（Etherscan）

## 3. The Graph 子图开发 (graph-project)

- [x] 3.1 定义 `schema.graphql`（Content, Like, User, Follow 实体）
- [x] 3.2 配置 `subgraph.yaml`（指定合约地址、事件）
- [x] 3.3 编写事件处理器 `src/mapping.ts`
- [ ] 3.4 本地测试子图（使用 graph-node）
- [ ] 3.5 部署到 The Graph Hosted Service 或 Subgraph Studio

## 4. 前端开发 (frontend-project)

### 4.1 项目配置
- [x] 4.1.1 配置 wagmi + viem + RainbowKit
- [x] 4.1.2 配置 TanStack Query
- [x] 4.1.3 配置 Tailwind CSS
- [x] 4.1.4 设置合约 ABI 和地址

### 4.2 钱包与布局
- [x] 4.2.1 实现钱包连接组件
- [x] 4.2.2 实现 Layout 组件（Header, Footer）
- [x] 4.2.3 实现响应式导航

### 4.3 首页与内容页
- [x] 4.3.1 实现首页内容列表（从 The Graph 获取）
- [x] 4.3.2 实现内容卡片组件
- [x] 4.3.3 实现内容详情页 `/content/[id]`
- [x] 4.3.4 实现点赞者列表组件

### 4.4 交互功能
- [x] 4.4.1 实现点赞功能（approve + like）
- [x] 4.4.2 实现作者领取奖励功能
- [x] 4.4.3 实现点赞者领取奖励功能
- [x] 4.4.4 实现交易状态反馈 (pending/success/error)

### 4.5 发布与用户页
- [ ] 4.5.1 实现内容发布页面（含 IPFS 上传）
- [ ] 4.5.2 实现用户主页 `/profile/[address]`
- [ ] 4.5.3 实现关注/取消关注功能
- [ ] 4.5.4 实现"我的主页" `/my`

### 4.6 优化
- [ ] 4.6.1 实现骨架屏加载状态
- [ ] 4.6.2 实现错误边界处理
- [ ] 4.6.3 移动端适配优化

## 5. 集成测试

- [ ] 5.1 端到端测试：创建内容 → 点赞 → 领取
- [ ] 5.2 验证分红计算正确性
- [ ] 5.3 验证 The Graph 数据同步

## 6. 文档

- [ ] 6.1 编写合约接口文档
- [ ] 6.2 编写前端开发说明
- [ ] 6.3 编写部署指南
