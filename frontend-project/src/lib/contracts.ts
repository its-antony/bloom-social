import { Address } from "viem";

export const BLOOM_TOKEN_ADDRESS =
  (process.env.NEXT_PUBLIC_BLOOM_TOKEN_ADDRESS as Address) ||
  "0x0000000000000000000000000000000000000000";

export const BLOOM_CONTENT_ADDRESS =
  (process.env.NEXT_PUBLIC_BLOOM_CONTENT_ADDRESS as Address) ||
  "0x0000000000000000000000000000000000000000";

export const BLOOM_TOKEN_ABI = [
  {
    inputs: [{ name: "spender", type: "address" }, { name: "amount", type: "uint256" }],
    name: "approve",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "owner", type: "address" }, { name: "spender", type: "address" }],
    name: "allowance",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "faucet",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

export const BLOOM_CONTENT_ABI = [
  {
    inputs: [
      { name: "likeAmount", type: "uint256" },
      { name: "duration", type: "uint256" },
      { name: "contentURI", type: "string" },
      { name: "contentHash", type: "bytes32" },
    ],
    name: "createContent",
    outputs: [{ name: "contentId", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "contentId", type: "uint256" }],
    name: "like",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "contentId", type: "uint256" }],
    name: "claimAuthorReward",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "contentId", type: "uint256" }],
    name: "claimLikerReward",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "contentId", type: "uint256" }],
    name: "getContent",
    outputs: [
      { name: "author", type: "address" },
      { name: "likeAmount", type: "uint256" },
      { name: "deadline", type: "uint256" },
      { name: "authorPool", type: "uint256" },
      { name: "likerRewardPool", type: "uint256" },
      { name: "totalWeight", type: "uint256" },
      { name: "likeCount", type: "uint256" },
      { name: "contentURI", type: "string" },
      { name: "contentHash", type: "bytes32" },
      { name: "authorClaimed", type: "bool" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "contentId", type: "uint256" },
      { name: "liker", type: "address" },
    ],
    name: "getLikeInfo",
    outputs: [
      { name: "likeIndex", type: "uint256" },
      { name: "weight", type: "uint256" },
      { name: "claimed", type: "bool" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "contentId", type: "uint256" },
      { name: "liker", type: "address" },
    ],
    name: "getEstimatedReward",
    outputs: [{ name: "estimatedReward", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "followee", type: "address" }],
    name: "follow",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "followee", type: "address" }],
    name: "unfollow",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "follower", type: "address" },
      { name: "followee", type: "address" },
    ],
    name: "isFollowing",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "contentId", type: "uint256" },
      { indexed: true, name: "author", type: "address" },
      { indexed: false, name: "likeAmount", type: "uint256" },
      { indexed: false, name: "deadline", type: "uint256" },
      { indexed: false, name: "contentURI", type: "string" },
      { indexed: false, name: "contentHash", type: "bytes32" },
    ],
    name: "ContentCreated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "contentId", type: "uint256" },
      { indexed: true, name: "liker", type: "address" },
      { indexed: false, name: "likeIndex", type: "uint256" },
      { indexed: false, name: "weight", type: "uint256" },
      { indexed: false, name: "amount", type: "uint256" },
    ],
    name: "Liked",
    type: "event",
  },
] as const;

export const GRAPH_URL =
  process.env.NEXT_PUBLIC_GRAPH_URL ||
  "https://api.studio.thegraph.com/query/97819/bloom-social/version/latest";
