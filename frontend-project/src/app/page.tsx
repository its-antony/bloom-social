import { Header } from "@/components/Header";
import { ContentList } from "@/components/ContentList";

export default function Home() {
  return (
    <div className="min-h-screen bg-[var(--paper)]">
      <Header />

      <main className="container-newspaper py-8">
        {/* Page Header - Newspaper Style */}
        <div className="mb-8 pb-6 border-b-2 border-[var(--ink)]">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight mb-2">
                发现内容
              </h1>
              <p className="text-[var(--ink-muted)] text-lg">
                早期支持优质内容，获得更多回报
              </p>
            </div>

            {/* Stats Summary */}
            <div className="flex gap-6 text-right">
              <div>
                <div className="stat-label">如何运作</div>
                <div className="text-sm text-[var(--ink-light)]">
                  作者 70% · 点赞者 25% · 协议 5%
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* How it works - Newspaper pull quote style */}
        <div className="mb-12 py-6 border-y border-[var(--border-light)] bg-white">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center">
            <div className="px-4">
              <div className="text-2xl mb-2">✍️</div>
              <div className="font-display font-medium mb-1">创作</div>
              <div className="text-sm text-[var(--ink-muted)]">
                作者发布内容，设定点赞价格
              </div>
            </div>
            <div className="px-4 md:border-l border-[var(--border-light)]">
              <div className="text-2xl mb-2">❤️</div>
              <div className="font-display font-medium mb-1">支持</div>
              <div className="text-sm text-[var(--ink-muted)]">
                读者付费点赞，资金进入赏金池
              </div>
            </div>
            <div className="px-4 md:border-l border-[var(--border-light)]">
              <div className="text-2xl mb-2">⏳</div>
              <div className="font-display font-medium mb-1">等待</div>
              <div className="text-sm text-[var(--ink-muted)]">
                内容有效期内持续积累赏金
              </div>
            </div>
            <div className="px-4 md:border-l border-[var(--border-light)]">
              <div className="text-2xl mb-2">💰</div>
              <div className="font-display font-medium mb-1">领取</div>
              <div className="text-sm text-[var(--ink-muted)]">
                结束后领取奖励，早期支持者更多
              </div>
            </div>
          </div>
        </div>

        {/* Content List */}
        <ContentList />

        {/* Footer */}
        <footer className="mt-16 pt-8 border-t-2 border-[var(--ink)]">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-[var(--ink-muted)]">
            <div className="font-display text-lg text-[var(--ink)]">
              Bloom<span className="font-normal italic">Social</span>
            </div>
            <div className="flex gap-6">
              <span>链上内容平台</span>
              <span>·</span>
              <span>早期支持者 · 更多回报</span>
            </div>
            <div className="font-mono text-xs">
              &copy; {new Date().getFullYear()}
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
