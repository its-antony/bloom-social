import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { sepolia, baseSepolia, hardhat } from "wagmi/chains";

export const config = getDefaultConfig({
  appName: "BloomSocial",
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "YOUR_PROJECT_ID",
  chains: [sepolia, baseSepolia, hardhat],
  ssr: true,
});
