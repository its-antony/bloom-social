"use client";

import Link from "next/link";
import { GraphContent } from "@/lib/graph";
import {
  truncateAddress,
  formatTokenAmount,
  formatNumber,
  getTimeRemaining,
  addressToColor,
  addressToInitials,
  truncateText,
} from "@/lib/utils";

interface ContentCardProps {
  content: GraphContent;
  index?: number;
}

export function ContentCard({ content, index = 0 }: ContentCardProps) {
  const timeInfo = getTimeRemaining(content.deadline);
  const totalPool =
    BigInt(content.authorPool) + BigInt(content.likerRewardPool);

  return (
    <Link
      href={`/content/${content.id}`}
      className={`
        card block group
        opacity-0 animate-fadeIn
        ${index < 6 ? `stagger-${index + 1}` : ""}
      `}
      style={{ animationFillMode: "forwards" }}
    >
      {/* Author Header */}
      <div className="flex items-center gap-3 p-4 border-b border-[var(--border-light)]">
        {/* Avatar */}
        <div
          className="w-10 h-10 flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
          style={{ backgroundColor: addressToColor(content.author) }}
        >
          {addressToInitials(content.author)}
        </div>

        <div className="flex-1 min-w-0">
          <div className="font-mono text-sm text-[var(--ink-light)]">
            {truncateAddress(content.author)}
          </div>
          <div className="text-xs text-[var(--ink-faint)]">
            作者
          </div>
        </div>

        {/* Status Tag */}
        <span
          className={`tag flex-shrink-0 ${
            timeInfo.isExpired ? "tag-ended" : "tag-active"
          }`}
        >
          {timeInfo.isExpired ? "已结束" : "进行中"}
        </span>
      </div>

      {/* Content Preview */}
      <div className="p-4 overflow-hidden">
        <p className="text-[var(--ink)] leading-relaxed min-h-[4.5rem] break-all">
          {content.contentURI.startsWith("ipfs://")
            ? "正在从 IPFS 加载内容..."
            : truncateText(content.contentURI, 100)}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 border-t border-[var(--border-light)]">
        {/* Pool Amount */}
        <div className="p-4 text-center border-r border-[var(--border-light)]">
          <div className="stat-label">赏金池</div>
          <div className="font-mono font-medium text-[var(--ink)]">
            {formatTokenAmount(totalPool)}
          </div>
          <div className="text-xs text-[var(--ink-faint)]">BLOOM</div>
        </div>

        {/* Like Count */}
        <div className="p-4 text-center border-r border-[var(--border-light)]">
          <div className="stat-label">点赞数</div>
          <div className="font-mono font-medium text-[var(--ink)]">
            {formatNumber(BigInt(content.likeCount))}
          </div>
          <div className="text-xs text-[var(--ink-faint)]">人</div>
        </div>

        {/* Time Remaining */}
        <div className="p-4 text-center">
          <div className="stat-label">
            {timeInfo.isExpired ? "状态" : "剩余"}
          </div>
          <div
            className={`font-mono font-medium ${
              timeInfo.isExpired
                ? "text-[var(--ink-muted)]"
                : timeInfo.totalSeconds < 86400
                ? "text-[var(--accent-red)]"
                : "text-[var(--ink)]"
            }`}
          >
            {timeInfo.isExpired
              ? timeInfo.display
              : timeInfo.days > 0
              ? `${timeInfo.days}天`
              : `${timeInfo.hours}小时`}
          </div>
          {!timeInfo.isExpired && (
            <div className="text-xs text-[var(--ink-faint)]">
              {timeInfo.days > 0 ? `${timeInfo.hours}小时` : `${timeInfo.minutes}分`}
            </div>
          )}
        </div>
      </div>

      {/* Like Amount Footer */}
      <div className="px-4 py-3 bg-[var(--paper)] border-t border-[var(--border-light)] flex items-center justify-between">
        <span className="text-xs text-[var(--ink-muted)] uppercase tracking-wider">
          点赞价格
        </span>
        <span className="font-mono font-medium text-[var(--accent-green)]">
          {formatTokenAmount(content.likeAmount)} BLOOM
        </span>
      </div>

      {/* Hover indicator */}
      <div className="h-0.5 bg-[var(--ink)] transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
    </Link>
  );
}

// Skeleton loader for ContentCard
export function ContentCardSkeleton({ index = 0 }: { index?: number }) {
  return (
    <div
      className={`
        card opacity-0 animate-fadeIn
        ${index < 6 ? `stagger-${index + 1}` : ""}
      `}
      style={{ animationFillMode: "forwards" }}
    >
      {/* Author Header Skeleton */}
      <div className="flex items-center gap-3 p-4 border-b border-[var(--border-light)]">
        <div className="w-10 h-10 skeleton"></div>
        <div className="flex-1">
          <div className="h-4 skeleton w-24 mb-2"></div>
          <div className="h-3 skeleton w-12"></div>
        </div>
        <div className="h-6 skeleton w-16"></div>
      </div>

      {/* Content Skeleton */}
      <div className="p-4 space-y-2">
        <div className="h-4 skeleton w-full"></div>
        <div className="h-4 skeleton w-3/4"></div>
        <div className="h-4 skeleton w-1/2"></div>
      </div>

      {/* Stats Skeleton */}
      <div className="grid grid-cols-3 border-t border-[var(--border-light)]">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={`p-4 text-center ${i < 2 ? "border-r border-[var(--border-light)]" : ""}`}
          >
            <div className="h-3 skeleton w-12 mx-auto mb-2"></div>
            <div className="h-5 skeleton w-16 mx-auto"></div>
          </div>
        ))}
      </div>

      {/* Footer Skeleton */}
      <div className="px-4 py-3 bg-[var(--paper)] border-t border-[var(--border-light)] flex items-center justify-between">
        <div className="h-3 skeleton w-16"></div>
        <div className="h-4 skeleton w-24"></div>
      </div>
    </div>
  );
}
