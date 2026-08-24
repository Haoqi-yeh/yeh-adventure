import type { Metadata } from "next";
import "./globals.css";
import { LOGIN_BACKGROUND } from "@/lib/assets/game-art";

export const metadata: Metadata = {
  title: "做個白日夢冒險",
  description: "點進去，換個世界換一種活法",
  openGraph: {
    title: "做個白日夢冒險",
    description: "點進去，換個世界換一種活法",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-TW" style={{ backgroundColor: "#98ddd7" }}>
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="alternate icon" href="/favicon.svg" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <div
          className="bg-pixel-art"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: -2,
            width: "100%",
            height: "100%",
            backgroundImage: `url("${LOGIN_BACKGROUND.src}")`,
            backgroundSize: "cover",
            backgroundPosition: "center center",
            backgroundRepeat: "no-repeat",
          }}
        />

        <div style={{
          position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none",
          background: "rgba(255, 255, 255, 0.05)",
        }} />

        <div style={{ position: "relative", zIndex: 10, width: "100%", minHeight: "100vh" }}>
          {children}
        </div>
      </body>
    </html>
  );
}
