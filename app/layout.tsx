import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VAL-X | Buy-Side Valuation Terminal",
  description: "Institutional-grade DCF valuation dashboard",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
