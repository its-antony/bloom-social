"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseUnits, keccak256, toHex } from "viem";
import { Header } from "@/components/Header";
import { BLOOM_CONTENT_ADDRESS, BLOOM_CONTENT_ABI } from "@/lib/contracts";
import { formatDate } from "@/lib/utils";

export default function CreatePage() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const [content, setContent] = useState("");
  const [likeAmount, setLikeAmount] = useState("100");
  const [duration, setDuration] = useState("7");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState<"idle" | "uploading" | "signing" | "confirming" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const { data: hash, writeContract } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  // Calculate deadline preview
  const deadlineDate = new Date(Date.now() + Number(duration) * 24 * 60 * 60 * 1000);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isConnected || !address) {
      setErrorMessage("请先连接钱包");
      setStep("error");
      return;
    }

    if (content.length < 10) {
      setErrorMessage("内容至少需要 10 个字");
      setStep("error");
      return;
    }

    try {
      setIsSubmitting(true);
      setStep("uploading");

      // For now, store content directly as URI (in production, upload to IPFS)
      const contentURI = content;
      const contentHash = keccak256(toHex(content));

      setStep("signing");

      // Convert duration from days to seconds
      const durationSeconds = BigInt(Number(duration) * 24 * 60 * 60);
      const likeAmountWei = parseUnits(likeAmount, 18);

      writeContract({
        address: BLOOM_CONTENT_ADDRESS,
        abi: BLOOM_CONTENT_ABI,
        functionName: "createContent",
        args: [likeAmountWei, durationSeconds, contentURI, contentHash],
      });

      setStep("confirming");
    } catch (error) {
      console.error("Create content error:", error);
      setErrorMessage(error instanceof Error ? error.message : "发布失败");
      setStep("error");
      setIsSubmitting(false);
    }
  };

  // Watch for transaction success
  if (isSuccess && step === "confirming") {
    setStep("success");
    setTimeout(() => {
      router.push("/");
    }, 2000);
  }

  return (
    <div className="min-h-screen bg-[var(--paper)]">
      <Header />

      <main className="container-newspaper py-8">
        {/* Page Header */}
        <div className="mb-8 pb-6 border-b-2 border-[var(--ink)]">
          <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight mb-2">
            发布新内容
          </h1>
          <p className="text-[var(--ink-muted)] text-lg">
            分享你的想法，让早期支持者与你一起获益
          </p>
        </div>

        {/* Not Connected Warning */}
        {!isConnected && (
          <div className="card card-bordered p-8 text-center mb-8">
            <div className="text-4xl mb-4">{"🔗"}</div>
            <h2 className="font-display text-2xl mb-2">请先连接钱包</h2>
            <p className="text-[var(--ink-muted)]">
              连接钱包后可以发布内容
            </p>
          </div>
        )}

        {/* Create Form */}
        {isConnected && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Form Section */}
            <div className="lg:col-span-2">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Content Field */}
                <div className="card card-bordered">
                  <div className="p-4 border-b border-[var(--border-light)]">
                    <label className="block text-sm font-medium uppercase tracking-wider text-[var(--ink-muted)]">
                      内容正文
                    </label>
                  </div>
                  <div className="p-4">
                    <textarea
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      className="input textarea min-h-[300px]"
                      placeholder="写下你的想法...

支持 Markdown 格式"
                      disabled={isSubmitting}
                    />
                    <div className="mt-2 flex justify-between text-xs text-[var(--ink-faint)]">
                      <span>支持 Markdown 格式</span>
                      <span>{content.length} 字</span>
                    </div>
                  </div>
                </div>

                {/* Settings */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Like Amount */}
                  <div className="card card-bordered">
                    <div className="p-4 border-b border-[var(--border-light)]">
                      <label className="block text-sm font-medium uppercase tracking-wider text-[var(--ink-muted)]">
                        点赞金额
                      </label>
                    </div>
                    <div className="p-4">
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={likeAmount}
                          onChange={(e) => setLikeAmount(e.target.value)}
                          className="input flex-1"
                          min="1"
                          step="1"
                          disabled={isSubmitting}
                        />
                        <span className="font-mono text-[var(--ink-muted)]">BLOOM</span>
                      </div>
                      <p className="mt-2 text-xs text-[var(--ink-faint)]">
                        每位点赞者需支付的固定金额
                      </p>
                    </div>
                  </div>

                  {/* Duration */}
                  <div className="card card-bordered">
                    <div className="p-4 border-b border-[var(--border-light)]">
                      <label className="block text-sm font-medium uppercase tracking-wider text-[var(--ink-muted)]">
                        有效期
                      </label>
                    </div>
                    <div className="p-4">
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={duration}
                          onChange={(e) => setDuration(e.target.value)}
                          className="input flex-1"
                          min="1"
                          max="30"
                          disabled={isSubmitting}
                        />
                        <span className="font-mono text-[var(--ink-muted)]">天</span>
                      </div>
                      <p className="mt-2 text-xs text-[var(--ink-faint)]">
                        内容可接受点赞的时间窗口，到期后可领取奖励
                      </p>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isSubmitting || content.length < 10}
                    className="btn btn-primary btn-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="none"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                        {step === "uploading" && "上传中..."}
                        {step === "signing" && "请在钱包中确认..."}
                        {step === "confirming" && "交易确认中..."}
                      </span>
                    ) : (
                      "发布内容"
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Preview Section */}
            <div className="lg:col-span-1">
              <div className="card card-bordered sticky top-8">
                <div className="p-4 border-b border-[var(--border-light)] bg-[var(--paper)]">
                  <span className="text-sm font-medium uppercase tracking-wider text-[var(--ink-muted)]">
                    预览
                  </span>
                </div>
                <div className="p-4 space-y-4">
                  {/* Like Amount Preview */}
                  <div className="flex justify-between">
                    <span className="text-[var(--ink-muted)]">点赞金额</span>
                    <span className="font-mono font-medium">{likeAmount} BLOOM</span>
                  </div>

                  {/* Deadline Preview */}
                  <div className="flex justify-between">
                    <span className="text-[var(--ink-muted)]">有效期至</span>
                    <span className="font-mono text-sm">
                      {formatDate(BigInt(Math.floor(deadlineDate.getTime() / 1000)))}
                    </span>
                  </div>

                  <hr className="divider" />

                  {/* Distribution Preview */}
                  <div className="space-y-2">
                    <div className="text-sm font-medium uppercase tracking-wider text-[var(--ink-muted)]">
                      资金分配
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>作者</span>
                      <span className="font-mono">70%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>点赞者</span>
                      <span className="font-mono">25%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>协议</span>
                      <span className="font-mono">5%</span>
                    </div>
                  </div>

                  <hr className="divider" />

                  {/* Tips */}
                  <div className="text-xs text-[var(--ink-faint)] space-y-2">
                    <p>• 发布后不可修改点赞金额和有效期</p>
                    <p>• 内容将存储在区块链上</p>
                    <p>• 早期点赞者获得更高权重</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Status Messages */}
        {step === "success" && (
          <div className="fixed inset-0 modal-overlay z-50">
            <div className="modal-content p-8 text-center">
              <div className="text-4xl mb-4">{"✅"}</div>
              <h2 className="font-display text-2xl mb-2">发布成功！</h2>
              <p className="text-[var(--ink-muted)]">正在跳转到首页...</p>
            </div>
          </div>
        )}

        {step === "error" && (
          <div className="fixed bottom-8 right-8 toast toast-error max-w-sm animate-slideIn z-50">
            <div className="flex items-start gap-3">
              <span className="text-xl">{"❌"}</span>
              <div>
                <div className="font-medium">发布失败</div>
                <div className="text-sm text-[var(--ink-muted)]">{errorMessage}</div>
              </div>
              <button
                onClick={() => {
                  setStep("idle");
                  setIsSubmitting(false);
                }}
                className="ml-auto text-[var(--ink-muted)] hover:text-[var(--ink)]"
              >
                ✕
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
