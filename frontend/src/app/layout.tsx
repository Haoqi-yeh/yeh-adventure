import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PADNE - 像素藝術動態敘事引擎",
  description: "九把刀風格文字冒險遊戲",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-TW">
      <body>{children}</body>
    </html>
  );
}
