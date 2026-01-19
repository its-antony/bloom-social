# Project Context

## Purpose

BloomSocial 是一个链上内容平台的教学项目，核心创新是「早期支持者奖励机制」：越早点赞的人获得越多分红。项目目的是展示完整的 Web3 开发流程。

## Tech Stack

### 智能合约 (contract-project/)
- Hardhat 2.22+ (Solidity 0.8.24)
- OpenZeppelin Contracts 5.0
- TypeScript
- Ethers.js v6

### 前端 (frontend-project/)
- Next.js 15+ (App Router)
- React 19
- wagmi 2.x + viem 2.x
- RainbowKit 2.x
- TanStack Query 5.x
- Tailwind CSS 4.x

### 索引 (graph-project/)
- The Graph
- AssemblyScript

## Project Conventions

### Code Style
- 使用 TypeScript，开启 strict 模式
- Solidity 使用 NatSpec 注释
- 前端组件使用 "use client" 标记客户端组件
- 变量命名：camelCase（JS/TS）、snake_case（Solidity 局部变量）

### Architecture Patterns
- 智能合约：单一职责，分离 Token 和业务逻辑
- 前端：组件化，hooks 抽象合约交互
- 数据获取：The Graph 查询历史数据，链上读取实时状态

### Testing Strategy
- 智能合约：Hardhat 单元测试，覆盖核心场景
- 前端：组件测试（可选）
- 集成测试：手动测试 E2E 流程

### Git Workflow
- 主分支：main
- 功能分支：feature/xxx
- 提交信息：英文，动词开头

## Domain Context

### 经济模型
- **分配比例**：作者 70% | 点赞者 25% | 协议 5%
- **权重函数**：`w(i) = 0.2 + 0.8 × exp(-0.20 × (i-1))`
- **懒惰计算**：无需 Finalize，截止时间到达后可直接领取

### 关键概念
- **Content**：用户发布的内容，有点赞金额和截止时间
- **Like**：用户支付代币点赞，获得权重
- **Weight**：早期点赞者权重高，用于分配奖励

## Important Constraints

- 教学目的，代码可读性优先于极致优化
- MVP 阶段，不考虑生产级安全审计
- 测试网部署（Sepolia / Base Sepolia）

## External Dependencies

- **IPFS**：内容存储
- **The Graph**：事件索引和 GraphQL 查询
- **WalletConnect**：钱包连接
- **Alchemy/Infura**：RPC 节点
