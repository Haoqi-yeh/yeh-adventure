import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "做個白日夢冒險",
  description: "沉浸式九把刀風格文字冒險遊戲",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-TW">
      <body>
        {/* 漂浮星點 */}
        {[...Array(20)].map((_, i) => (
          <span
            key={i}
            className="star"
            style={{
              width:  `${Math.random() * 2 + 1}px`,
              height: `${Math.random() * 2 + 1}px`,
              top:    `${Math.random() * 100}%`,
              left:   `${Math.random() * 100}%`,
              ["--dur"   as string]: `${Math.random() * 4 + 2}s`,
              ["--delay" as string]: `${Math.random() * 4}s`,
              opacity: Math.random() * 0.5 + 0.1,
            }}
          />
        ))}
        <div className="relative z-10">{children}</div>
      </body>
    </html>
  );
}
