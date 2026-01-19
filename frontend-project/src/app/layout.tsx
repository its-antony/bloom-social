import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";

export const metadata: Metadata = {
  title: "BloomSocial - \u94fe\u4e0a\u5185\u5bb9\u5e73\u53f0",
  description: "\u65e9\u671f\u652f\u6301\u8005\uff0c\u66f4\u591a\u56de\u62a5 | \u4f5c\u8005\u53d1\u5e03\u5185\u5bb9\uff0c\u8bfb\u8005\u4ed8\u8d39\u70b9\u8d5e\uff0c\u8d8a\u65e9\u652f\u6301\u83b7\u5f97\u8d8a\u591a\u5956\u52b1",
  keywords: ["Web3", "\u5185\u5bb9\u5e73\u53f0", "\u533a\u5757\u94fe", "BLOOM", "\u70b9\u8d5e", "\u5956\u52b1"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="bg-[var(--paper)] text-[var(--ink)] antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
