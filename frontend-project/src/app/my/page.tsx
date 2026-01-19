"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Header } from "@/components/Header";
import { ContentCard, ContentCardSkeleton } from "@/components/ContentCard";
import { fetchUserContents, fetchUserLikes, fetchUser, fetchUserFollowing, GraphContent, GraphLike } from "@/lib/graph";
import {
  formatTokenAmount,
  formatNumber,
  getTimeRemaining,
  truncateAddress,
  addressToColor,
  addressToInitials,
  calculatePercentage,
} from "@/lib/utils";

type Tab = "contents" | "likes" | "following";

export default function MyPage() {
  const { address, isConnected } = useAccount();
  const [activeTab, setActiveTab] = useState<Tab>("contents");

  // Fetch user stats
  const { data: userStats } = useQuery({
    queryKey: ["user", address],
    queryFn: () => fetchUser(address!),
    enabled: !!address,
  });

  // Fetch user's contents
  const { data: userContents, isLoading: contentsLoading } = useQuery({
    queryKey: ["userContents", address],
    queryFn: () => fetchUserContents(address!),
    enabled: !!address,
  });

  // Fetch user's likes
  const { data: userLikes, isLoading: likesLoading } = useQuery({
    queryKey: ["userLikes", address],
    queryFn: () => fetchUserLikes(address!),
    enabled: !!address,
  });

  // Fetch user's following
  const { data: userFollowing, isLoading: followingLoading } = useQuery({
    queryKey: ["userFollowing", address],
    queryFn: () => fetchUserFollowing(address!),
    enabled: !!address,
  });

  // Calculate claimable rewards
  const claimableAuthorReward = userContents?.reduce((acc, content) => {
    const timeInfo = getTimeRemaining(content.deadline);
    if (timeInfo.isExpired && !content.authorClaimed) {
      return acc + BigInt(content.authorPool);
    }
    return acc;
  }, 0n) || 0n;

  const claimableLikerReward = userLikes?.reduce((acc, like) => {
    const timeInfo = getTimeRemaining(like.content.deadline);
    if (timeInfo.isExpired && !like.claimed) {
      const reward = BigInt(like.content.totalWeight) > 0n
        ? (BigInt(like.weight) * BigInt(like.content.likerRewardPool)) / BigInt(like.content.totalWeight)
        : 0n;
      return acc + reward;
    }
    return acc;
  }, 0n) || 0n;

  const totalClaimable = claimableAuthorReward + claimableLikerReward;

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-[var(--paper)]">
        <Header />
        <main className="container-newspaper py-8">
          <div className="card card-bordered p-8 text-center max-w-md mx-auto">
            <div className="text-4xl mb-4">{"🔗"}</div>
            <h2 className="font-display text-2xl mb-2">请先连接钱包</h2>
            <p className="text-[var(--ink-muted)]">
              连接钱包后可以查看你的内容和收益
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--paper)]">
      <Header />

      <main className="container-newspaper py-8">
        {/* Page Header */}
        <div className="mb-8 pb-6 border-b-2 border-[var(--ink)]">
          <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight mb-2">
            我的主页
          </h1>
          <p className="text-[var(--ink-muted)] font-mono">
            {address ? truncateAddress(address, 6) : ""}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Total Earnings */}
          <div className="card card-bordered p-6">
            <div className="stat-label">总收益</div>
            <div className="stat-value text-3xl mt-1">
              {userStats ? formatTokenAmount(userStats.totalEarned) : "0"}
            </div>
            <div className="text-sm text-[var(--ink-faint)]">BLOOM</div>
          </div>

          {/* Claimable */}
          <div className="card card-bordered p-6 bg-[var(--accent-green)] text-white">
            <div className="stat-label text-white/70">可领取</div>
            <div className="stat-value text-3xl mt-1 text-white">
              {formatTokenAmount(totalClaimable)}
            </div>
            <div className="text-sm text-white/70">BLOOM</div>
            {totalClaimable > 0n && (
              <div className="mt-2 text-xs text-white/90">
                → 查看下方内容领取
              </div>
            )}
          </div>

          {/* Content Count */}
          <div className="card card-bordered p-6">
            <div className="stat-label">内容数</div>
            <div className="stat-value text-3xl mt-1">
              {userStats ? formatNumber(BigInt(userStats.contentsCreated)) : "0"}
            </div>
            <div className="text-sm text-[var(--ink-faint)]">篇</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="tabs mb-8">
          <button
            className={`tab ${activeTab === "contents" ? "active" : ""}`}
            onClick={() => setActiveTab("contents")}
          >
            我的内容 ({userContents?.length || 0})
          </button>
          <button
            className={`tab ${activeTab === "likes" ? "active" : ""}`}
            onClick={() => setActiveTab("likes")}
          >
            我的点赞 ({userLikes?.length || 0})
          </button>
          <button
            className={`tab ${activeTab === "following" ? "active" : ""}`}
            onClick={() => setActiveTab("following")}
          >
            我的关注 ({userFollowing?.length || 0})
          </button>
        </div>

        {/* Tab Content: My Contents */}
        {activeTab === "contents" && (
          <div>
            {contentsLoading ? (
              <div className="swiss-grid swiss-grid-3">
                {[...Array(3)].map((_, i) => (
                  <ContentCardSkeleton key={i} index={i} />
                ))}
              </div>
            ) : userContents && userContents.length > 0 ? (
              <div className="swiss-grid swiss-grid-3">
                {userContents.map((content, index) => (
                  <ContentCard key={content.id} content={content} index={index} />
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">{"✍️"}</div>
                <h3 className="font-display text-xl mb-2">你还没有发布内容</h3>
                <p className="text-[var(--ink-muted)] mb-4">
                  开始创作，让早期支持者与你一起获益
                </p>
                <Link href="/create" className="btn btn-primary">
                  发布内容
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Tab Content: My Likes */}
        {activeTab === "likes" && (
          <div>
            {likesLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="card card-bordered p-4">
                    <div className="h-4 skeleton w-3/4 mb-2"></div>
                    <div className="h-4 skeleton w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : userLikes && userLikes.length > 0 ? (
              <div className="space-y-4">
                {userLikes.map((like) => {
                  const timeInfo = getTimeRemaining(like.content.deadline);
                  const estimatedReward = BigInt(like.content.totalWeight) > 0n
                    ? (BigInt(like.weight) * BigInt(like.content.likerRewardPool)) / BigInt(like.content.totalWeight)
                    : 0n;

                  return (
                    <Link
                      key={like.id}
                      href={`/content/${like.content.id}`}
                      className="card block hover:border-[var(--ink)] transition-colors"
                    >
                      <div className="p-4 flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="font-mono text-sm text-[var(--ink-muted)]">
                              by {truncateAddress(like.content.author)}
                            </span>
                            <span
                              className={`tag ${
                                timeInfo.isExpired ? "tag-ended" : "tag-active"
                              }`}
                            >
                              {timeInfo.isExpired ? "已结束" : "进行中"}
                            </span>
                          </div>
                          <div className="text-sm text-[var(--ink)] line-clamp-1">
                            {like.content.contentURI.startsWith("ipfs://")
                              ? "内容存储在 IPFS"
                              : like.content.contentURI}
                          </div>
                        </div>

                        <div className="text-right ml-4 flex-shrink-0">
                          <div className="text-xs text-[var(--ink-muted)]">
                            第 {like.likeIndex} 位 | {calculatePercentage(BigInt(like.weight), BigInt(like.content.totalWeight))}%
                          </div>
                          <div className="font-mono font-medium mt-1">
                            {timeInfo.isExpired && !like.claimed ? (
                              <span className="text-[var(--accent-green)]">
                                可领取: {formatTokenAmount(estimatedReward)} BLOOM
                              </span>
                            ) : like.claimed ? (
                              <span className="text-[var(--ink-muted)]">已领取</span>
                            ) : (
                              <span>
                                预估: {formatTokenAmount(estimatedReward)} BLOOM
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">{"❤️"}</div>
                <h3 className="font-display text-xl mb-2">你还没有点赞过内容</h3>
                <p className="text-[var(--ink-muted)] mb-4">
                  去发现页面支持优质内容，早期支持获得更多回报
                </p>
                <Link href="/" className="btn btn-primary">
                  去发现
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Tab Content: Following */}
        {activeTab === "following" && (
          <div>
            {followingLoading ? (
              <div className="swiss-grid swiss-grid-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="card card-bordered p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 skeleton"></div>
                      <div className="flex-1">
                        <div className="h-4 skeleton w-24 mb-2"></div>
                        <div className="h-3 skeleton w-16"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : userFollowing && userFollowing.length > 0 ? (
              <div className="swiss-grid swiss-grid-3">
                {userFollowing.map((follow) => (
                  <Link
                    key={follow.id}
                    href={`/profile/${follow.followee}`}
                    className="card block hover:border-[var(--ink)] transition-colors"
                  >
                    <div className="p-4 flex items-center gap-4">
                      <div
                        className="w-12 h-12 flex items-center justify-center text-white font-bold flex-shrink-0"
                        style={{ backgroundColor: addressToColor(follow.followee) }}
                      >
                        {addressToInitials(follow.followee)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-mono text-[var(--ink)]">
                          {truncateAddress(follow.followee)}
                        </div>
                        <div className="text-xs text-[var(--ink-faint)]">
                          已关注
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">{"👥"}</div>
                <h3 className="font-display text-xl mb-2">你还没有关注任何人</h3>
                <p className="text-[var(--ink-muted)] mb-4">
                  关注优质创作者，及时获取他们的新内容
                </p>
                <Link href="/" className="btn btn-primary">
                  去发现
                </Link>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
