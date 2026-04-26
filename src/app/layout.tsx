import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ThreeBody Atlas",
  description: "Interactive 2D visualizations of known three-body solutions.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}

