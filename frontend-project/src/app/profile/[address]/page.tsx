"use client";

import { useParams } from "next/navigation";
import { useAccount, useWriteContract, useReadContract, useWaitForTransactionReceipt } from "wagmi";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Header } from "@/components/Header";
import { ContentCard, ContentCardSkeleton } from "@/components/ContentCard";
import { fetchUserContents, fetchUser } from "@/lib/graph";
import { BLOOM_CONTENT_ADDRESS, BLOOM_CONTENT_ABI } from "@/lib/contracts";
import {
  formatTokenAmount,
  formatNumber,
  truncateAddress,
  addressToColor,
  addressToInitials,
} from "@/lib/utils";

export default function ProfilePage() {
  const params = useParams();
  const profileAddress = params.address as string;
  const { address: connectedAddress, isConnected } = useAccount();

  const isOwnProfile =
    connectedAddress?.toLowerCase() === profileAddress.toLowerCase();

  // Fetch user stats
  const { data: userStats, isLoading: statsLoading } = useQuery({
    queryKey: ["user", profileAddress],
    queryFn: () => fetchUser(profileAddress),
  });

  // Fetch user's contents
  const { data: userContents, isLoading: contentsLoading } = useQuery({
    queryKey: ["userContents", profileAddress],
    queryFn: () => fetchUserContents(profileAddress),
  });

  // Check if following
  const { data: isFollowing, refetch: refetchFollowing } = useReadContract({
    address: BLOOM_CONTENT_ADDRESS,
    abi: BLOOM_CONTENT_ABI,
    functionName: "isFollowing",
    args: [connectedAddress!, profileAddress as `0x${string}`],
    query: { enabled: !!connectedAddress && !isOwnProfile },
  });

  // Follow/Unfollow mutations
  const { writeContract: followUser, data: followTxHash } = useWriteContract();
  const { writeContract: unfollowUser, data: unfollowTxHash } = useWriteContract();

  const { isLoading: isFollowLoading, isSuccess: followSuccess } = useWaitForTransactionReceipt({
    hash: followTxHash,
  });

  const { isLoading: isUnfollowLoading, isSuccess: unfollowSuccess } = useWaitForTransactionReceipt({
    hash: unfollowTxHash,
  });

  // Refetch after follow/unfollow
  if (followSuccess || unfollowSuccess) {
    refetchFollowing();
  }

  const handleFollow = () => {
    followUser({
      address: BLOOM_CONTENT_ADDRESS,
      abi: BLOOM_CONTENT_ABI,
      functionName: "follow",
      args: [profileAddress as `0x${string}`],
    });
  };

  const handleUnfollow = () => {
    unfollowUser({
      address: BLOOM_CONTENT_ADDRESS,
      abi: BLOOM_CONTENT_ABI,
      functionName: "unfollow",
      args: [profileAddress as `0x${string}`],
    });
  };

  const isActionLoading = isFollowLoading || isUnfollowLoading;

  return (
    <div className="min-h-screen bg-[var(--paper)]">
      <Header />

      <main className="container-newspaper py-8">
        {/* Back Link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-[var(--ink-muted)] hover:text-[var(--ink)] mb-6 transition-colors"
        >
          <span>←</span>
          <span>返回发现</span>
        </Link>

        {/* Profile Header */}
        <div className="card card-bordered mb-8">
          <div className="p-8">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              {/* Avatar */}
              <div
                className="w-24 h-24 flex items-center justify-center text-white text-3xl font-bold flex-shrink-0"
                style={{ backgroundColor: addressToColor(profileAddress) }}
              >
                {addressToInitials(profileAddress)}
              </div>

              {/* Info */}
              <div className="flex-1 text-center md:text-left">
                <h1 className="font-mono text-2xl mb-2">
                  {truncateAddress(profileAddress, 6)}
                </h1>

                {/* Stats */}
                <div className="flex flex-wrap justify-center md:justify-start gap-6 mt-4">
                  <div>
                    <div className="stat-value">
                      {userStats ? formatNumber(BigInt(userStats.contentsCreated)) : "0"}
                    </div>
                    <div className="stat-label">内容</div>
                  </div>
                  <div>
                    <div className="stat-value">
                      {userStats ? formatNumber(BigInt(userStats.followersCount)) : "0"}
                    </div>
                    <div className="stat-label">粉丝</div>
                  </div>
                  <div>
                    <div className="stat-value">
                      {userStats ? formatTokenAmount(userStats.totalEarned) : "0"}
                    </div>
                    <div className="stat-label">BLOOM 收益</div>
                  </div>
                </div>
              </div>

              {/* Follow Button */}
              {isConnected && !isOwnProfile && (
                <div className="flex-shrink-0">
                  {isFollowing ? (
                    <button
                      onClick={handleUnfollow}
                      disabled={isActionLoading}
                      className="btn group relative overflow-hidden disabled:opacity-50"
                    >
                      <span className="group-hover:opacity-0 transition-opacity">
                        已关注
                      </span>
                      <span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-[var(--accent-red)]">
                        取消关注
                      </span>
                    </button>
                  ) : (
                    <button
                      onClick={handleFollow}
                      disabled={isActionLoading}
                      className="btn btn-primary disabled:opacity-50"
                    >
                      {isActionLoading ? "处理中..." : "关注"}
                    </button>
                  )}
                </div>
              )}

              {/* Own Profile Link */}
              {isOwnProfile && (
                <Link href="/my" className="btn">
                  管理我的主页
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="mb-6 pb-4 border-b border-[var(--border-light)]">
          <h2 className="font-display text-2xl">
            {isOwnProfile ? "我的内容" : "Ta 发布的内容"}
          </h2>
        </div>

        {/* Contents Grid */}
        {contentsLoading ? (
          <div className="swiss-grid swiss-grid-3">
            {[...Array(6)].map((_, i) => (
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
            <h3 className="font-display text-xl mb-2">
              {isOwnProfile ? "你还没有发布内容" : "Ta 还没有发布内容"}
            </h3>
            {isOwnProfile && (
              <>
                <p className="text-[var(--ink-muted)] mb-4">
                  开始创作，让早期支持者与你一起获益
                </p>
                <Link href="/create" className="btn btn-primary">
                  发布内容
                </Link>
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
