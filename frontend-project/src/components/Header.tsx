"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount, useReadContract } from "wagmi";
import { useState } from "react";
import { BLOOM_TOKEN_ADDRESS, BLOOM_TOKEN_ABI } from "@/lib/contracts";
import { formatTokenAmount, truncateAddress, addressToColor, addressToInitials } from "@/lib/utils";

const navItems = [
  { href: "/", label: "发现" },
  { href: "/create", label: "发布" },
  { href: "/my", label: "我的" },
];

export function Header() {
  const pathname = usePathname();
  const { address, isConnected } = useAccount();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { data: balance } = useReadContract({
    address: BLOOM_TOKEN_ADDRESS,
    abi: BLOOM_TOKEN_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  return (
    <header className="bg-white border-b border-[var(--ink)]">
      {/* Top bar with date - newspaper style */}
      <div className="border-b border-[var(--border-light)] py-2">
        <div className="container-newspaper flex items-center justify-between text-xs text-[var(--ink-muted)]">
          <span className="font-mono tracking-wide">
            {new Date().toLocaleDateString("zh-CN", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </span>
          <span className="hidden sm:block tracking-widest uppercase">
            早期支持者 · 更多回报
          </span>
        </div>
      </div>

      {/* Main header */}
      <div className="container-newspaper">
        {/* Logo and nav row */}
        <div className="flex items-center justify-between py-4">
          {/* Logo */}
          <Link href="/" className="group">
            <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight text-[var(--ink)] group-hover:text-[var(--accent-green)] transition-colors">
              Bloom<span className="font-normal italic">Social</span>
            </h1>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  px-4 py-2 text-sm font-medium uppercase tracking-wider
                  transition-all duration-150
                  ${
                    pathname === item.href
                      ? "text-[var(--ink)] border-b-2 border-[var(--ink)]"
                      : "text-[var(--ink-muted)] hover:text-[var(--ink)] border-b-2 border-transparent"
                  }
                `}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Right side: Balance + Connect */}
          <div className="flex items-center gap-4">
            {/* Balance Display (Desktop) */}
            {isConnected && balance !== undefined && (
              <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-[var(--paper-dark)] border border-[var(--border-light)]">
                <span className="text-xs uppercase tracking-wider text-[var(--ink-muted)]">
                  余额
                </span>
                <span className="font-mono font-medium text-[var(--ink)]">
                  {formatTokenAmount(balance)} BLOOM
                </span>
              </div>
            )}

            {/* Connect Button */}
            <ConnectButton.Custom>
              {({
                account,
                chain,
                openAccountModal,
                openChainModal,
                openConnectModal,
                mounted,
              }) => {
                const ready = mounted;
                const connected = ready && account && chain;

                return (
                  <div
                    {...(!ready && {
                      "aria-hidden": true,
                      style: {
                        opacity: 0,
                        pointerEvents: "none",
                        userSelect: "none",
                      },
                    })}
                  >
                    {(() => {
                      if (!connected) {
                        return (
                          <button onClick={openConnectModal} className="btn btn-primary">
                            连接钱包
                          </button>
                        );
                      }

                      if (chain.unsupported) {
                        return (
                          <button onClick={openChainModal} className="btn" style={{ borderColor: "var(--error)", color: "var(--error)" }}>
                            错误网络
                          </button>
                        );
                      }

                      return (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={openChainModal}
                            className="hidden sm:flex items-center gap-1 btn btn-ghost btn-sm"
                          >
                            {chain.hasIcon && chain.iconUrl && (
                              <img
                                alt={chain.name ?? "Chain icon"}
                                src={chain.iconUrl}
                                className="w-4 h-4"
                              />
                            )}
                            <span className="text-xs">{chain.name}</span>
                          </button>

                          <button
                            onClick={openAccountModal}
                            className="flex items-center gap-2 btn btn-sm"
                          >
                            {/* Avatar */}
                            <div
                              className="w-6 h-6 flex items-center justify-center text-white text-xs font-bold"
                              style={{ backgroundColor: addressToColor(account.address) }}
                            >
                              {addressToInitials(account.address)}
                            </div>
                            <span className="font-mono text-xs">
                              {truncateAddress(account.address)}
                            </span>
                          </button>
                        </div>
                      );
                    })()}
                  </div>
                );
              }}
            </ConnectButton.Custom>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 hover:bg-[var(--paper-dark)] transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {mobileMenuOpen ? (
                  <path
                    strokeLinecap="square"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="square"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[var(--ink)] bg-white">
          <nav className="container-newspaper py-4 flex flex-col gap-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`
                  px-4 py-3 text-sm font-medium uppercase tracking-wider
                  border-l-2 transition-all
                  ${
                    pathname === item.href
                      ? "text-[var(--ink)] border-l-[var(--ink)] bg-[var(--paper-dark)]"
                      : "text-[var(--ink-muted)] border-l-transparent hover:border-l-[var(--ink-muted)] hover:bg-[var(--paper)]"
                  }
                `}
              >
                {item.label}
              </Link>
            ))}

            {/* Mobile Balance */}
            {isConnected && balance !== undefined && (
              <div className="mt-4 px-4 py-3 bg-[var(--paper-dark)] border-t border-[var(--border-light)]">
                <div className="text-xs uppercase tracking-wider text-[var(--ink-muted)] mb-1">
                  BLOOM 余额
                </div>
                <div className="font-mono font-medium text-lg">
                  {formatTokenAmount(balance)} BLOOM
                </div>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
