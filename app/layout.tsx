import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VAL-X · Markets & Valuation",
  description: "Live markets + institutional-grade DCF valuation dashboard",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
