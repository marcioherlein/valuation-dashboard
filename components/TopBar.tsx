"use client";
import Link from "next/link";
import { useState, useEffect } from "react";

export default function TopBar() {
  const [time, setTime] = useState("");

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(now.toUTCString().replace("GMT", "UTC").slice(0, -4));
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <header style={{
      background: "var(--bg-secondary)",
      borderBottom: "1px solid var(--border)",
      padding: "0 20px",
      height: 40,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      position: "sticky",
      top: 0,
      zIndex: 100,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        <Link href="/" style={{ textDecoration: "none" }}>
          <span style={{
            fontSize: 13,
            fontWeight: 700,
            color: "var(--accent-blue)",
            letterSpacing: "0.15em",
            fontFamily: "'IBM Plex Mono', monospace",
          }}>
            VAL<span style={{ color: "var(--accent-green)" }}>-X</span>
          </span>
        </Link>
        <span style={{ color: "var(--border-bright)", fontSize: 11 }}>|</span>
        <span style={{ fontSize: 10, color: "var(--text-muted)", letterSpacing: "0.1em" }}>
          BUY-SIDE VALUATION TERMINAL
        </span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 20, fontSize: 10, color: "var(--text-muted)", letterSpacing: "0.08em" }}>
        <span style={{ color: "var(--accent-amber)", fontSize: 9 }}>
          ⚠ EDUCATIONAL · NOT INVESTMENT ADVICE
        </span>
        <span style={{ color: "var(--border-bright)" }}>|</span>
        <span>{time}<span className="cursor-blink" style={{ marginLeft: 2 }}>▊</span></span>
      </div>
    </header>
  );
}
