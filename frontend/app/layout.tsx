import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MegaSwap - MegaETH DEX",
  description: "The fastest DEX on MegaETH Mainnet",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
