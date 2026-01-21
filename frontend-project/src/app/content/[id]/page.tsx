"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import {
  BLOOM_CONTENT_ADDRESS,
  BLOOM_CONTENT_ABI,
  BLOOM_TOKEN_ADDRESS,
  BLOOM_TOKEN_ABI,
} from "@/lib/contracts";
import { fetchContentDetail } from "@/lib/graph";
import {
  truncateAddress,
  formatTokenAmount,
  formatNumber,
  getTimeRemaining,
  formatDate,
  addressToColor,
  addressToInitials,
  calculatePercentage,
} from "@/lib/utils";

export default function ContentDetailPage() {
  const params = useParams();
  const contentId = params.id as string;
  const { address, isConnected } = useAccount();

  // Fetch from Graph for content details
  const { data: graphContent, refetch: refetchGraph } = useQuery({
    queryKey: ["content", contentId],
    queryFn: () => fetchContentDetail(contentId),
    refetchInterval: 10000,
  });

  // Contract reads for real-time data
  const { data: contractContent, refetch: refetchContract } = useReadContract({
    address: BLOOM_CONTENT_ADDRESS,
    abi: BLOOM_CONTENT_ABI,
    functionName: "getContent",
    args: [BigInt(contentId)],
  });

  const { data: likeInfo, refetch: refetchLikeInfo } = useReadContract({
    address: BLOOM_CONTENT_ADDRESS,
    abi: BLOOM_CONTENT_ABI,
    functionName: "getLikeInfo",
    args: [BigInt(contentId), address!],
    query: { enabled: !!address },
  });

  const { data: estimatedReward, refetch: refetchReward } = useReadContract({
    address: BLOOM_CONTENT_ADDRESS,
    abi: BLOOM_CONTENT_ABI,
    functionName: "getEstimatedReward",
    args: [BigInt(contentId), address!],
    query: { enabled: !!address && likeInfo?.[0] !== 0n },
  });

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: BLOOM_TOKEN_ADDRESS,
    abi: BLOOM_TOKEN_ABI,
    functionName: "allowance",
    args: [address!, BLOOM_CONTENT_ADDRESS],
    query: { enabled: !!address },
  });

  // Write contracts
  const { writeContract: approve, data: approveTxHash } = useWriteContract();
  const { writeContract: like, data: likeTxHash } = useWriteContract();
  const { writeContract: claimAuthor, data: claimAuthorTxHash } = useWriteContract();
  const { writeContract: claimLiker, data: claimLikerTxHash } = useWriteContract();

  // Transaction states
  const { isLoading: isApproving, isSuccess: approveSuccess } = useWaitForTransactionReceipt({
    hash: approveTxHash,
  });

  const { isLoading: isLiking, isSuccess: likeSuccess } = useWaitForTransactionReceipt({
    hash: likeTxHash,
  });

  const { isLoading: isClaimingAuthor, isSuccess: claimAuthorSuccess } = useWaitForTransactionReceipt({
    hash: claimAuthorTxHash,
  });

  const { isLoading: isClaimingLiker, isSuccess: claimLikerSuccess } = useWaitForTransactionReceipt({
    hash: claimLikerTxHash,
  });

  // Refetch after successful transactions
  if (approveSuccess) {
    refetchAllowance();
  }

  if (likeSuccess || claimAuthorSuccess || claimLikerSuccess) {
    refetchContract();
    refetchLikeInfo();
    refetchReward();
    refetchGraph();
  }

  // Loading state
  if (!contractContent) {
    return (
      <div className="min-h-screen bg-[var(--paper)]">
        <Header />
        <main className="container-newspaper py-8">
          <div className="max-w-3xl mx-auto">
            {/* Skeleton */}
            <div className="card card-bordered">
              <div className="p-6 border-b border-[var(--border-light)]">
                <div className="h-6 skeleton w-48 mb-2"></div>
                <div className="h-4 skeleton w-32"></div>
              </div>
              <div className="p-6 space-y-4">
                <div className="h-4 skeleton w-full"></div>
                <div className="h-4 skeleton w-3/4"></div>
                <div className="h-4 skeleton w-1/2"></div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Parse contract data
  const [
    author,
    likeAmount,
    deadline,
    authorPool,
    likerRewardPool,
    totalWeight,
    likeCount,
    contentURI,
    ,
    authorClaimed,
  ] = contractContent;

  const timeInfo = getTimeRemaining(deadline);
  const isAuthor = address?.toLowerCase() === author.toLowerCase();
  const hasLiked = likeInfo?.[0] !== 0n;
  const likerWeight = likeInfo?.[1] || 0n;
  const hasClaimedLiker = likeInfo?.[2];
  const needsApproval = (allowance || 0n) < likeAmount;
  const totalPool = authorPool + likerRewardPool;

  const handleLike = () => {
    if (needsApproval) {
      approve({
        address: BLOOM_TOKEN_ADDRESS,
        abi: BLOOM_TOKEN_ABI,
        functionName: "approve",
        args: [BLOOM_CONTENT_ADDRESS, likeAmount],
      });
    } else {
      like({
        address: BLOOM_CONTENT_ADDRESS,
        abi: BLOOM_CONTENT_ABI,
        functionName: "like",
        args: [BigInt(contentId)],
      });
    }
  };

  return (
    <div className="min-h-screen bg-[var(--paper)]">
      <Header />

      <main className="container-newspaper py-8">
        {/* Back Link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-[var(--ink-muted)] hover:text-[var(--ink)] mb-8 transition-colors"
        >
          <span>←</span>
          <span>返回发现</span>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <article className="card card-bordered">
              {/* Author Header */}
              <div className="flex items-center justify-between p-6 border-b border-[var(--border-light)]">
                <Link
                  href={`/profile/${author}`}
                  className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                >
                  <div
                    className="w-12 h-12 flex items-center justify-center text-white font-bold"
                    style={{ backgroundColor: addressToColor(author) }}
                  >
                    {addressToInitials(author)}
                  </div>
                  <div>
                    <div className="font-mono text-[var(--ink)]">
                      {truncateAddress(author)}
                    </div>
                    <div className="text-xs text-[var(--ink-faint)]">作者</div>
                  </div>
                </Link>

                <span
                  className={`tag ${timeInfo.isExpired ? "tag-ended" : "tag-active"}`}
                >
                  {timeInfo.isExpired ? "已结束" : "进行中"}
                </span>
              </div>

              {/* Content Body */}
              <div className="p-6 overflow-hidden">
                <div className="prose max-w-none break-all">
                  {contentURI}
                </div>
              </div>

              {/* Stats Footer */}
              <div className="grid grid-cols-4 border-t border-[var(--border-light)]">
                <div className="p-4 text-center border-r border-[var(--border-light)]">
                  <div className="stat-label">赏金池</div>
                  <div className="font-mono font-medium text-lg">
                    {formatTokenAmount(totalPool)}
                  </div>
                  <div className="text-xs text-[var(--ink-faint)]">BLOOM</div>
                </div>
                <div className="p-4 text-center border-r border-[var(--border-light)]">
                  <div className="stat-label">点赞数</div>
                  <div className="font-mono font-medium text-lg">
                    {formatNumber(likeCount)}
                  </div>
                  <div className="text-xs text-[var(--ink-faint)]">人</div>
                </div>
                <div className="p-4 text-center border-r border-[var(--border-light)]">
                  <div className="stat-label">点赞价格</div>
                  <div className="font-mono font-medium text-lg">
                    {formatTokenAmount(likeAmount)}
                  </div>
                  <div className="text-xs text-[var(--ink-faint)]">BLOOM</div>
                </div>
                <div className="p-4 text-center">
                  <div className="stat-label">
                    {timeInfo.isExpired ? "状态" : "剩余"}
                  </div>
                  <div
                    className={`font-mono font-medium text-lg ${
                      timeInfo.isExpired
                        ? "text-[var(--ink-muted)]"
                        : timeInfo.totalSeconds < 86400
                        ? "text-[var(--accent-red)]"
                        : ""
                    }`}
                  >
                    {timeInfo.isExpired ? "已结束" : timeInfo.display}
                  </div>
                </div>
              </div>
            </article>

            {/* Likers List */}
            {graphContent?.likers && graphContent.likers.length > 0 && (
              <div className="card card-bordered mt-8">
                <div className="p-4 border-b border-[var(--border-light)] bg-[var(--paper)]">
                  <span className="text-sm font-medium uppercase tracking-wider text-[var(--ink-muted)]">
                    点赞者列表 ({graphContent.likers.length})
                  </span>
                </div>
                <div className="divide-y divide-[var(--border-light)]">
                  {graphContent.likers.slice(0, 10).map((liker, i) => (
                    <div key={liker.id} className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 flex items-center justify-center text-white text-xs font-bold bg-[var(--ink)]">
                          #{liker.likeIndex}
                        </div>
                        <Link
                          href={`/profile/${liker.liker}`}
                          className="font-mono text-sm hover:text-[var(--accent-green)]"
                        >
                          {truncateAddress(liker.liker)}
                        </Link>
                      </div>
                      <div className="text-right">
                        <div className="font-mono text-sm">
                          {calculatePercentage(BigInt(liker.weight), BigInt(graphContent.totalWeight))}%
                        </div>
                        <div className="text-xs text-[var(--ink-faint)]">权重</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar - Actions */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-6">
              {/* Action Card */}
              <div className="card card-bordered">
                {/* Case 1: Not connected */}
                {!isConnected && (
                  <div className="p-6 text-center">
                    <div className="text-3xl mb-4">{"🔗"}</div>
                    <h3 className="font-display text-lg mb-2">请先连接钱包</h3>
                    <p className="text-sm text-[var(--ink-muted)]">
                      连接钱包后可以点赞支持或领取奖励
                    </p>
                  </div>
                )}

                {/* Case 2: Active content, not liked, not author */}
                {isConnected && !timeInfo.isExpired && !hasLiked && !isAuthor && (
                  <div className="p-6">
                    <h3 className="font-display text-xl mb-4">支持这篇内容</h3>
                    <div className="mb-4 p-4 bg-[var(--paper)] border border-[var(--border-light)]">
                      <div className="text-sm text-[var(--ink-muted)] mb-1">点赞需支付</div>
                      <div className="font-mono text-2xl font-medium">
                        {formatTokenAmount(likeAmount)} BLOOM
                      </div>
                    </div>
                    <button
                      onClick={handleLike}
                      disabled={isApproving || isLiking}
                      className="btn btn-primary w-full btn-lg disabled:opacity-50"
                    >
                      {isApproving
                        ? "授权中..."
                        : isLiking
                        ? "点赞中..."
                        : needsApproval
                        ? "授权并点赞"
                        : "❤️ 点赞支持"}
                    </button>
                    <p className="mt-3 text-xs text-[var(--ink-faint)] text-center">
                      越早点赞，权重越高，奖励越多
                    </p>
                  </div>
                )}

                {/* Case 3: Active content, already liked */}
                {isConnected && !timeInfo.isExpired && hasLiked && (
                  <div className="p-6">
                    <div className="flex items-center gap-2 text-[var(--accent-green)] mb-4">
                      <span className="text-xl">✓</span>
                      <span className="font-medium">你已点赞支持</span>
                    </div>

                    <div className="space-y-3 mb-4">
                      <div className="flex justify-between">
                        <span className="text-[var(--ink-muted)]">你的点赞顺序</span>
                        <span className="font-mono font-medium">第 {likeInfo?.[0]?.toString()} 位</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[var(--ink-muted)]">你的权重占比</span>
                        <span className="font-mono font-medium">
                          {totalWeight > 0n
                            ? calculatePercentage(likerWeight, totalWeight)
                            : "0"}%
                        </span>
                      </div>
                    </div>

                    <div className="p-4 bg-[var(--paper)] border border-[var(--border-light)]">
                      <div className="text-sm text-[var(--ink-muted)] mb-1">预估可领取奖励</div>
                      <div className="font-mono text-2xl font-medium text-[var(--accent-green)]">
                        {estimatedReward ? formatTokenAmount(estimatedReward) : "0"} BLOOM
                      </div>
                      <div className="text-xs text-[var(--ink-faint)] mt-1">
                        此金额会随新点赞者加入而增长
                      </div>
                    </div>

                    <p className="mt-4 text-xs text-[var(--ink-faint)] text-center">
                      内容将于 {formatDate(deadline)} 结束，届时可领取奖励
                    </p>
                  </div>
                )}

                {/* Case 4: Expired content, author can claim */}
                {isConnected && timeInfo.isExpired && isAuthor && !authorClaimed && (
                  <div className="p-6">
                    <div className="text-3xl mb-4 text-center">{"🎉"}</div>
                    <h3 className="font-display text-xl mb-4 text-center">
                      内容已结束，可以领取奖励了！
                    </h3>

                    <div className="p-4 bg-[var(--paper)] border border-[var(--border-light)] mb-4">
                      <div className="text-sm text-[var(--ink-muted)] mb-1">作者奖励</div>
                      <div className="font-mono text-2xl font-medium">
                        {formatTokenAmount(authorPool)} BLOOM
                      </div>
                      <div className="text-xs text-[var(--ink-faint)]">赏金池的 70%</div>
                    </div>

                    <button
                      onClick={() =>
                        claimAuthor({
                          address: BLOOM_CONTENT_ADDRESS,
                          abi: BLOOM_CONTENT_ABI,
                          functionName: "claimAuthorReward",
                          args: [BigInt(contentId)],
                        })
                      }
                      disabled={isClaimingAuthor}
                      className="btn btn-primary w-full btn-lg disabled:opacity-50"
                    >
                      {isClaimingAuthor ? "领取中..." : "领取作者奖励"}
                    </button>
                  </div>
                )}

                {/* Case 5: Expired content, liker can claim */}
                {isConnected && timeInfo.isExpired && hasLiked && !hasClaimedLiker && (
                  <div className="p-6">
                    <div className="text-3xl mb-4 text-center">{"🎉"}</div>
                    <h3 className="font-display text-xl mb-4 text-center">
                      内容已结束，可以领取奖励了！
                    </h3>

                    <div className="p-4 bg-[var(--paper)] border border-[var(--border-light)] mb-4">
                      <div className="text-sm text-[var(--ink-muted)] mb-1">你的点赞奖励</div>
                      <div className="font-mono text-2xl font-medium">
                        {estimatedReward ? formatTokenAmount(estimatedReward) : "0"} BLOOM
                      </div>
                      <div className="text-xs text-[var(--ink-faint)]">
                        你的权重: {totalWeight > 0n ? calculatePercentage(likerWeight, totalWeight) : "0"}%
                      </div>
                    </div>

                    <button
                      onClick={() =>
                        claimLiker({
                          address: BLOOM_CONTENT_ADDRESS,
                          abi: BLOOM_CONTENT_ABI,
                          functionName: "claimLikerReward",
                          args: [BigInt(contentId)],
                        })
                      }
                      disabled={isClaimingLiker}
                      className="btn btn-primary w-full btn-lg disabled:opacity-50"
                    >
                      {isClaimingLiker ? "领取中..." : "领取点赞奖励"}
                    </button>
                  </div>
                )}

                {/* Case 6: Already claimed */}
                {isConnected && timeInfo.isExpired && ((isAuthor && authorClaimed) || (hasLiked && hasClaimedLiker)) && (
                  <div className="p-6 text-center">
                    <div className="text-3xl mb-4">✓</div>
                    <h3 className="font-display text-lg mb-2">奖励已领取</h3>
                    <p className="text-sm text-[var(--ink-muted)]">
                      你的奖励已经转入钱包
                    </p>
                  </div>
                )}

                {/* Case 7: Expired, no stake */}
                {isConnected && timeInfo.isExpired && !isAuthor && !hasLiked && (
                  <div className="p-6 text-center">
                    <div className="text-3xl mb-4">{"⏰"}</div>
                    <h3 className="font-display text-lg mb-2">内容已结束</h3>
                    <p className="text-sm text-[var(--ink-muted)]">
                      你没有点赞这篇内容
                    </p>
                  </div>
                )}
              </div>

              {/* Distribution Info */}
              <div className="card card-bordered">
                <div className="p-4 border-b border-[var(--border-light)] bg-[var(--paper)]">
                  <span className="text-sm font-medium uppercase tracking-wider text-[var(--ink-muted)]">
                    资金分配
                  </span>
                </div>
                <div className="p-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-[var(--ink-muted)]">作者</span>
                    <span className="font-mono">
                      {formatTokenAmount(authorPool)} BLOOM (70%)
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--ink-muted)]">点赞者</span>
                    <span className="font-mono">
                      {formatTokenAmount(likerRewardPool)} BLOOM (25%)
                    </span>
                  </div>
                  <div className="flex justify-between text-[var(--ink-faint)]">
                    <span>协议费用</span>
                    <span className="font-mono">5%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
