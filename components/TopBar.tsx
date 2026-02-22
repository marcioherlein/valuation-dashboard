"use client";
import Link from "next/link";

export default function TopBar() {
  return (
    <header style={{
      background: "rgba(0,0,0,0.6)",
      backdropFilter: "blur(40px) saturate(180%)",
      WebkitBackdropFilter: "blur(40px) saturate(180%)",
      borderBottom: "1px solid rgba(255,255,255,0.10)",
      height: 52,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0 20px",
      position: "sticky",
      top: 0,
      zIndex: 200,
    }}>
      {/* Logo */}
      <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{
          width: 30, height: 30,
          background: "linear-gradient(145deg, #0a84ff, #bf5af2)",
          borderRadius: 9,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 13, fontWeight: 800, color: "#fff",
          boxShadow: "0 4px 12px rgba(10,132,255,0.45), inset 0 1px 0 rgba(255,255,255,0.3)",
          flexShrink: 0,
        }}>
          V
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 1 }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: "rgba(255,255,255,0.95)", letterSpacing: "-0.03em" }}>VAL</span>
          <span style={{ fontSize: 16, fontWeight: 300, color: "rgba(255,255,255,0.45)", letterSpacing: "-0.01em" }}>-X</span>
        </div>
      </Link>

      {/* Nav */}
      <div style={{ display: "flex", gap: 2 }}>
        {[{ label: "Markets", href: "#markets" }, { label: "Coverage", href: "#coverage" }].map(item => (
          <a key={item.label} href={item.href} style={{
            fontSize: 13, fontWeight: 500,
            color: "rgba(255,255,255,0.55)",
            padding: "5px 12px", borderRadius: 10,
            textDecoration: "none", transition: "color 0.15s, background 0.15s",
          }}
            onMouseEnter={e => { const el = e.currentTarget; el.style.color = "rgba(255,255,255,0.95)"; el.style.background = "rgba(255,255,255,0.08)"; }}
            onMouseLeave={e => { const el = e.currentTarget; el.style.color = "rgba(255,255,255,0.55)"; el.style.background = "transparent"; }}
          >{item.label}</a>
        ))}
      </div>

      {/* Badge */}
      <div style={{
        fontSize: 10, fontWeight: 600,
        color: "rgba(255,214,10,0.9)",
        background: "rgba(255,214,10,0.12)",
        border: "1px solid rgba(255,214,10,0.25)",
        borderRadius: 8, padding: "3px 9px",
        letterSpacing: "0.03em",
        whiteSpace: "nowrap",
      }}>
        <span className="hide-mobile">Educational · </span>Not Investment Advice
      </div>
    </header>
  );
}
