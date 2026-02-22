"use client";
import { useEffect, useState, useCallback } from "react";

interface Quote {
  symbol: string;
  label: string;
  group: string;
  price: number | null;
  change: number | null;
  changePct: number | null;
}

function TickerItem({ q }: { q: Quote }) {
  if (q.price === null) return null;
  const up = (q.changePct ?? 0) >= 0;
  const color = up ? "var(--green)" : "var(--red)";
  const isVix = q.symbol === "^VIX";

  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 8,
      padding: "0 20px",
      borderRight: "1px solid rgba(255,255,255,0.07)",
      flexShrink: 0,
    }}>
      <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-2)", letterSpacing: "0.04em" }}>
        {q.label}
      </span>
      <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-1)", fontFamily: "var(--mono)" }}>
        {isVix ? q.price?.toFixed(2) : `$${q.price?.toFixed(2)}`}
      </span>
      <span style={{ fontSize: 11, fontWeight: 600, color, fontFamily: "var(--mono)" }}>
        {up ? "▲" : "▼"} {Math.abs(q.changePct ?? 0).toFixed(2)}%
      </span>
    </span>
  );
}

export default function MarketTicker({ quotes }: { quotes: Quote[] }) {
  // Duplicate for seamless loop
  const items = [...quotes, ...quotes].filter(q => q.price !== null);
  if (items.length === 0) return null;

  return (
    <div style={{
      background: "rgba(255,255,255,0.03)",
      borderBottom: "1px solid var(--border)",
      height: 36,
      display: "flex",
      alignItems: "center",
      overflow: "hidden",
    }}>
      <div style={{
        flexShrink: 0,
        padding: "0 16px",
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: "0.12em",
        color: "var(--blue)",
        borderRight: "1px solid var(--border)",
        whiteSpace: "nowrap",
        height: "100%",
        display: "flex",
        alignItems: "center",
      }}>
        LIVE
        <span style={{
          display: "inline-block", width: 6, height: 6,
          background: "var(--green)", borderRadius: "50%",
          marginLeft: 6,
          animation: "pulse-dot 1.5s ease-in-out infinite",
        }} />
      </div>
      <div className="ticker-wrap" style={{ flex: 1 }}>
        <div className="ticker-inner">
          {items.map((q, i) => <TickerItem key={`${q.symbol}-${i}`} q={q} />)}
        </div>
      </div>
    </div>
  );
}
