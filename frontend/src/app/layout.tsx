import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Yeh Adventure",
  description: "A clean text adventure experiment built for fast iteration.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-TW">
      <body>{children}</body>
    </html>
  );
}
