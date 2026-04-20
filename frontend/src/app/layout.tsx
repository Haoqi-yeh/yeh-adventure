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

function PineTree({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) {
  const w = 28 * scale;
  const h = 36 * scale;
  return (
    <g transform={`translate(${x} ${y})`} shapeRendering="crispEdges">
      <rect x={w * 0.42} y={h * 0.74} width={w * 0.16} height={h * 0.16} fill="#6f4d2b" />
      <polygon points={`${w * 0.5},0 ${w * 0.1},${h * 0.45} ${w * 0.9},${h * 0.45}`} fill="#285a2f" />
      <polygon points={`${w * 0.5},${h * 0.12} ${w * 0.04},${h * 0.62} ${w * 0.96},${h * 0.62}`} fill="#356f38" />
      <polygon points={`${w * 0.5},${h * 0.26} 0,${h * 0.78} ${w},${h * 0.78}`} fill="#4b8c46" />
      <polygon points={`${w * 0.5},${h * 0.12} ${w * 0.32},${h * 0.38} ${w * 0.68},${h * 0.38}`} fill="#87bf5a" />
    </g>
  );
}

function FlowerBed({ x, y, w, h }: { x: number; y: number; w: number; h: number }) {
  const flowers = [];
  for (let row = 0; row < 3; row += 1) {
    for (let col = 0; col < 4; col += 1) {
      const fx = x + 12 + col * 18 + (row % 2) * 4;
      const fy = y + 12 + row * 16;
      const color = (row + col) % 2 === 0 ? "#ff9fc5" : "#ffe27a";
      flowers.push(
        <g key={`${row}-${col}`} transform={`translate(${fx} ${fy})`} shapeRendering="crispEdges">
          <rect x={3} y={7} width={2} height={4} fill="#4b8c46" />
          <rect x={1} y={4} width={6} height={6} fill={color} />
          <rect x={3} y={2} width={2} height={10} fill="#fff8ef" opacity="0.45" />
        </g>
      );
    }
  }

  return (
    <g shapeRendering="crispEdges">
      <rect x={x} y={y} width={w} height={h} fill="#93ddd5" />
      <rect x={x + 4} y={y + 4} width={w - 8} height={h - 8} fill="#8fe1d8" />
      <rect x={x} y={y} width={w} height={6} fill="#7a7f86" />
      <rect x={x} y={y + h - 6} width={w} height={6} fill="#7a7f86" />
      <rect x={x} y={y} width={6} height={h} fill="#7a7f86" />
      <rect x={x + w - 6} y={y} width={6} height={h} fill="#7a7f86" />
      {flowers}
    </g>
  );
}

function GrassPatch({ x, y, w, h }: { x: number; y: number; w: number; h: number }) {
  const blades = [];
  for (let row = 0; row < Math.floor(h / 10); row += 1) {
    for (let col = 0; col < Math.floor(w / 10); col += 1) {
      blades.push(
        <g key={`${row}-${col}`} transform={`translate(${x + col * 10} ${y + row * 10})`} shapeRendering="crispEdges">
          <rect x={0} y={6} width={10} height={4} fill={row % 2 === 0 ? "#476f43" : "#4f7a49"} />
          <rect x={2} y={0} width={2} height={8} fill="#6d945a" />
          <rect x={6} y={1} width={2} height={8} fill="#7ca869" />
        </g>
      );
    }
  }

  return <g>{blades}</g>;
}

function RouteMapBackground() {
  return (
    <svg
      viewBox="0 0 320 640"
      preserveAspectRatio="xMidYMid slice"
      className="bg-pixel-art"
      style={{ position: "fixed", inset: 0, zIndex: -2, width: "100%", height: "100%" }}
    >
      <defs>
        <pattern id="groundDots" width="12" height="12" patternUnits="userSpaceOnUse">
          <rect width="12" height="12" fill="#98ddd7" />
          <rect x="2" y="2" width="1" height="1" fill="#b7ede7" />
          <rect x="8" y="7" width="1" height="1" fill="#7ac8c0" />
        </pattern>
        <pattern id="sandDots" width="14" height="14" patternUnits="userSpaceOnUse">
          <rect width="14" height="14" fill="#f5e29d" />
          <rect x="3" y="3" width="1" height="1" fill="#f9efbf" />
          <rect x="10" y="9" width="1" height="1" fill="#d8c378" />
        </pattern>
      </defs>

      <rect width="320" height="640" fill="url(#groundDots)" shapeRendering="crispEdges" />

      <rect x="0" y="0" width="320" height="24" fill="#3a6f39" shapeRendering="crispEdges" />
      <rect x="0" y="24" width="320" height="10" fill="#588d4f" shapeRendering="crispEdges" />
      <rect x="0" y="610" width="320" height="30" fill="#3a6f39" shapeRendering="crispEdges" />
      <rect x="0" y="600" width="320" height="10" fill="#588d4f" shapeRendering="crispEdges" />

      <path
        d="M190 70 H270 V145 H228 V210 H300 V285 H225 V360 H285 V450 H200 V520 H250 V640 H110 V558 H155 V475 H95 V390 H148 V300 H82 V225 H140 V150 H98 V70 Z"
        fill="url(#sandDots)"
        shapeRendering="crispEdges"
      />

      <FlowerBed x={16} y={74} w={96} h={76} />
      <FlowerBed x={18} y={198} w={96} h={76} />
      <FlowerBed x={18} y={468} w={92} h={70} />

      <GrassPatch x={186} y={168} w={86} h={120} />
      <GrassPatch x={22} y={320} w={92} h={100} />
      <GrassPatch x={168} y={500} w={92} h={76} />

      <rect x="214" y="18" width="74" height="44" fill="#7f6b58" shapeRendering="crispEdges" />
      <rect x="220" y="24" width="62" height="32" fill="#9a846e" shapeRendering="crispEdges" />
      <rect x="226" y="30" width="50" height="20" fill="#b6a38e" shapeRendering="crispEdges" />

      <rect x="198" y="86" width="16" height="18" fill="#7d7f87" shapeRendering="crispEdges" />
      <rect x="200" y="88" width="12" height="14" fill="#d7d8dc" shapeRendering="crispEdges" />
      <rect x="203" y="92" width="6" height="3" fill="#d27aa3" shapeRendering="crispEdges" />

      <g shapeRendering="crispEdges">
        <rect x="134" y="408" width="58" height="8" fill="#8a653a" />
        <rect x="138" y="416" width="50" height="20" fill="#b78d58" />
        <rect x="142" y="420" width="42" height="3" fill="#dcbf8f" />
        <rect x="142" y="427" width="42" height="3" fill="#dcbf8f" />
      </g>

      <g shapeRendering="crispEdges">
        <circle cx="256" cy="124" r="10" fill="#9a8f85" />
        <circle cx="275" cy="134" r="7" fill="#aba097" />
        <circle cx="246" cy="146" r="6" fill="#bdb3ab" />
        <circle cx="66" cy="438" r="8" fill="#9a8f85" />
        <circle cx="82" cy="450" r="6" fill="#bdb3ab" />
      </g>

      <PineTree x={8} y={8} scale={1.15} />
      <PineTree x={38} y={10} scale={1.05} />
      <PineTree x={72} y={6} scale={1.1} />
      <PineTree x={104} y={10} scale={1.05} />
      <PineTree x={286} y={10} scale={1.1} />
      <PineTree x={276} y={300} scale={1.2} />
      <PineTree x={246} y={324} scale={1.05} />
      <PineTree x={212} y={328} scale={1.1} />
      <PineTree x={14} y={562} scale={1.15} />
      <PineTree x={48} y={580} scale={1.05} />
      <PineTree x={220} y={580} scale={1.15} />
      <PineTree x={258} y={562} scale={1.1} />
    </svg>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-TW" style={{ backgroundColor: "#98ddd7" }}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <RouteMapBackground />

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
