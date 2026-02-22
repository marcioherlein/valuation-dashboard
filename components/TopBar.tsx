"use client";
import Link from "next/link";
import { useState, useEffect } from "react";

export default function TopBar() {
  const [time, setTime] = useState("");

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(
        now.toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" }) +
        " · " +
        now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })
      );
    };
    update();
    const id = setInterval(update, 30000);
    return () => clearInterval(id);
  }, []);

  return (
    <header style={{
      background: "#0057d2",
      height: 44,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0 24px",
      position: "sticky",
      top: 0,
      zIndex: 100,
      boxShadow: "0 2px 6px rgba(0,87,210,0.30)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{
          background: "#ffffff",
          borderRadius: 4,
          padding: "2px 8px",
          fontSize: 12,
          fontWeight: 800,
          color: "#0057d2",
          fontFamily: "'IBM Plex Sans', sans-serif",
          letterSpacing: "0.05em",
        }}>
          VAL-X
        </div>
        <div style={{ width: 1, height: 18, background: "rgba(255,255,255,0.3)" }} />
        <Link href="/" style={{
          fontSize: 13,
          fontWeight: 500,
          color: "rgba(255,255,255,0.95)",
          textDecoration: "none",
          fontFamily: "'IBM Plex Sans', sans-serif",
        }}>
          Equity Coverage Universe
        </Link>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 11, fontFamily: "'IBM Plex Sans', sans-serif" }}>
        <span style={{
          background: "rgba(255,255,255,0.15)",
          border: "1px solid rgba(255,255,255,0.3)",
          borderRadius: 3,
          padding: "2px 8px",
          fontSize: 10,
          fontWeight: 600,
          color: "rgba(255,255,255,0.9)",
          letterSpacing: "0.04em",
        }}>
          EDUCATIONAL · NOT INVESTMENT ADVICE
        </span>
        <span style={{ color: "rgba(255,255,255,0.75)" }}>{time}</span>
      </div>
    </header>
  );
}
