"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { fetchContents } from "@/lib/graph";
import { ContentCard, ContentCardSkeleton } from "./ContentCard";
import Link from "next/link";

type SortOption = "createdAt" | "likeCount" | "authorPool";

const sortOptions: { value: SortOption; label: string }[] = [
  { value: "createdAt", label: "最新" },
  { value: "authorPool", label: "赏金最高" },
  { value: "likeCount", label: "点赞最多" },
];

export function ContentList() {
  const [sortBy, setSortBy] = useState<SortOption>("createdAt");

  const {
    data: contents,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["contents", sortBy],
    queryFn: () => fetchContents(20, 0, sortBy, "desc"),
    refetchInterval: 15000,
  });

  return (
    <div>
      {/* Sort Controls */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-2">
          <span className="text-sm text-[var(--ink-muted)] uppercase tracking-wider">
            排序
          </span>
          <div className="flex border border-[var(--ink)]">
            {sortOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setSortBy(option.value)}
                className={`
                  px-4 py-2 text-sm font-medium uppercase tracking-wider
                  transition-colors
                  ${
                    sortBy === option.value
                      ? "bg-[var(--ink)] text-white"
                      : "bg-white text-[var(--ink-muted)] hover:text-[var(--ink)]"
                  }
                `}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="swiss-grid swiss-grid-3">
          {[...Array(6)].map((_, i) => (
            <ContentCardSkeleton key={i} index={i} />
          ))}
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="empty-state">
          <div className="empty-state-icon">{"⚠️"}</div>
          <h3 className="font-display text-xl mb-2">加载失败</h3>
          <p className="text-[var(--ink-muted)] mb-4">
            网络错误，请检查网络连接
          </p>
          <button onClick={() => refetch()} className="btn">
            重试
          </button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && contents?.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">{"✍️"}</div>
          <h3 className="font-display text-xl mb-2">还没有内容</h3>
          <p className="text-[var(--ink-muted)] mb-4">
            成为第一个发布者，开启你的创作之旅
          </p>
          <Link href="/create" className="btn btn-primary">
            发布内容
          </Link>
        </div>
      )}

      {/* Content Grid */}
      {!isLoading && !error && contents && contents.length > 0 && (
        <div className="swiss-grid swiss-grid-3">
          {contents.map((content, index) => (
            <ContentCard key={content.id} content={content} index={index} />
          ))}
        </div>
      )}
    </div>
  );
}
