"use client";
import Link from "next/link";
import { useState, useEffect } from "react";

export default function TopBar() {
  const [time, setTime] = useState("");
  const [date, setDate] = useState("");

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }));
      setDate(now.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }));
    };
    update();
    const id = setInterval(update, 30000);
    return () => clearInterval(id);
  }, []);

  return (
    <header style={{
      background: "rgba(10,15,30,0.85)",
      backdropFilter: "blur(20px)",
      WebkitBackdropFilter: "blur(20px)",
      borderBottom: "1px solid rgba(255,255,255,0.07)",
      height: 52,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0 28px",
      position: "sticky",
      top: 0,
      zIndex: 200,
    }}>
      {/* Logo */}
      <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{
          width: 28, height: 28,
          background: "linear-gradient(135deg, var(--blue), var(--purple))",
          borderRadius: 8,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 12, fontWeight: 800, color: "#fff",
          letterSpacing: "-0.02em",
          boxShadow: "0 0 16px rgba(41,151,255,0.4)",
        }}>
          V
        </div>
        <div>
          <span style={{ fontSize: 15, fontWeight: 700, color: "var(--text-1)", letterSpacing: "-0.02em" }}>
            VAL
          </span>
          <span style={{ fontSize: 15, fontWeight: 300, color: "var(--text-2)", letterSpacing: "-0.01em" }}>
            -X
          </span>
        </div>
      </Link>

      {/* Nav pills */}
      <div style={{ display: "flex", gap: 2 }}>
        {[
          { label: "Markets", href: "#markets" },
          { label: "Coverage", href: "#coverage" },
        ].map(item => (
          <a key={item.label} href={item.href} style={{
            fontSize: 12, fontWeight: 500, color: "var(--text-2)",
            padding: "5px 14px", borderRadius: 20,
            background: "transparent", textDecoration: "none",
            transition: "all 0.15s",
          }}
            onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = "var(--text-1)"; (e.currentTarget as HTMLAnchorElement).style.background = "rgba(255,255,255,0.06)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = "var(--text-2)"; (e.currentTarget as HTMLAnchorElement).style.background = "transparent"; }}
          >
            {item.label}
          </a>
        ))}
      </div>

      {/* Right side */}
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <span style={{
          fontSize: 10, fontWeight: 600, color: "var(--amber)",
          background: "var(--amber-dim)",
          border: "1px solid rgba(255,159,10,0.25)",
          borderRadius: 6, padding: "3px 8px", letterSpacing: "0.04em",
        }}>
          Educational · Not Investment Advice
        </span>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-1)", fontFamily: "var(--mono)" }}>{time}</div>
          <div style={{ fontSize: 9, color: "var(--text-3)" }}>{date}</div>
        </div>
      </div>
    </header>
  );
}
