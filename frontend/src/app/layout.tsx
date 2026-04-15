import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "做個白日夢冒險",
  description: "點進去，換個世界換一種活法",
  openGraph: {
    title: "做個白日夢冒險",
    description: "點進去，換個世界換一種活法",
  },
};

// Fixed star positions (no Math.random at render time → no hydration mismatch)
const STARS = [
  { w: 1, h: 1, t: 5,  l: 12, dur: 3.2, delay: 0.4 },
  { w: 2, h: 2, t: 15, l: 78, dur: 4.5, delay: 1.1 },
  { w: 1, h: 1, t: 28, l: 45, dur: 2.8, delay: 0.7 },
  { w: 2, h: 2, t: 42, l: 92, dur: 5.1, delay: 2.3 },
  { w: 1, h: 1, t: 55, l: 23, dur: 3.8, delay: 0.2 },
  { w: 2, h: 2, t: 68, l: 67, dur: 4.2, delay: 1.8 },
  { w: 1, h: 1, t: 80, l: 8,  dur: 2.6, delay: 3.1 },
  { w: 1, h: 1, t: 10, l: 55, dur: 3.5, delay: 0.9 },
  { w: 2, h: 2, t: 35, l: 35, dur: 4.8, delay: 1.5 },
  { w: 1, h: 1, t: 60, l: 88, dur: 3.1, delay: 2.7 },
  { w: 1, h: 1, t: 72, l: 42, dur: 5.5, delay: 0.3 },
  { w: 2, h: 2, t: 22, l: 15, dur: 2.9, delay: 1.9 },
  { w: 1, h: 1, t: 88, l: 62, dur: 4.1, delay: 3.4 },
  { w: 1, h: 1, t: 48, l: 5,  dur: 3.7, delay: 0.6 },
  { w: 2, h: 2, t: 92, l: 30, dur: 2.4, delay: 2.1 },
  { w: 1, h: 1, t: 18, l: 70, dur: 4.9, delay: 1.3 },
  { w: 1, h: 1, t: 75, l: 52, dur: 3.3, delay: 0.8 },
  { w: 2, h: 2, t: 33, l: 85, dur: 5.2, delay: 2.5 },
  { w: 1, h: 1, t: 64, l: 18, dur: 4.0, delay: 1.0 },
  { w: 1, h: 1, t: 95, l: 75, dur: 3.6, delay: 3.2 },
];

// Deterministic global background — HD pixel art GBA-style top-down overworld map
// Portrait-oriented (9:16), pixelated rendering keeps it crisp on all screen sizes
const BG_PROMPT = encodeURIComponent(
  "8-bit pixel art, GBA Pokemon Emerald overworld map, top-down view, HD high resolution. " +
  "Bright vivid lime green grass tiles with subtle darker green checker dot texture pattern. " +
  "Rectangular flower garden plots: rows of red white yellow pink blue pixel flowers, " +
  "each plot bordered by gray stone fence tiles. " +
  "Sandy tan dirt path cutting diagonally through the map. " +
  "Dark green tree clusters with round layered canopy tops in corners and edges. " +
  "Small blue water pond tiles in bottom right corner with light blue ripple pixels. " +
  "Crisp hard pixel edges, zero anti-aliasing, zero blur, zero glow, zero gradients. " +
  "Ultra vivid saturated GBA color palette, clean tile grid aesthetic. " +
  "No characters, no text, no UI, no HUD."
);
const GLOBAL_BG_URL = `https://image.pollinations.ai/prompt/${BG_PROMPT}?width=720&height=1280&nologo=true&seed=777&model=flux-schnell`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // backgroundColor on <html> is the darkest fallback (no flash of bright colour)
    <html lang="zh-TW" style={{ backgroundColor: "#0a1a0e" }}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        {/* ── Fixed pixel-art background ── position:fixed works on iOS/Android unlike backgroundAttachment:fixed */}
        <div
          className="bg-pixel-art"
          style={{
            position: "fixed", inset: 0, zIndex: -2,
            backgroundImage: `url("${GLOBAL_BG_URL}")`,
            backgroundSize: "cover",
            backgroundPosition: "center center",
            backgroundRepeat: "no-repeat",
          }}
        />

        {/* Very light overlay — lets bg show through clearly */}
        <div style={{
          position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none",
          background: "rgba(5, 10, 21, 0.08)",
        }} />

        {STARS.map((s, i) => (
          <span
            key={i}
            className="star"
            style={{
              width: `${s.w}px`,
              height: `${s.h}px`,
              top: `${s.t}%`,
              left: `${s.l}%`,
              ["--dur" as string]: `${s.dur}s`,
              ["--delay" as string]: `${s.delay}s`,
              opacity: 0.4,
            }}
          />
        ))}

        <div style={{ position: "relative", zIndex: 10, width: "100%", minHeight: "100vh" }}>
          {children}
        </div>
      </body>
    </html>
  );
}
