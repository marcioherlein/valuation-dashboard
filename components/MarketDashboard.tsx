"use client";
import { useState, useEffect, useCallback } from "react";

interface Quote {
  symbol: string;
  label: string;
  group: string;
  price: number | null;
  change: number | null;
  changePct: number | null;
}

interface MarketData {
  data: Quote[];
  timestamp: number;
}

/* ── tiny sparkline using SVG ─────────────────────────────────────────────── */
function MiniBar({ pct }: { pct: number }) {
  const up = pct >= 0;
  const w = Math.min(Math.abs(pct) * 8, 100);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4, width: 80 }}>
      <div style={{
        height: 4, width: `${w}%`, maxWidth: 60,
        background: up ? "var(--green)" : "var(--red)",
        borderRadius: 2, opacity: 0.8,
        minWidth: 2,
      }} />
    </div>
  );
}

/* ── single quote card ───────────────────────────────────────────────────── */
function QuoteCard({ q, large }: { q: Quote; large?: boolean }) {
  const up = (q.changePct ?? 0) >= 0;
  const color = up ? "var(--green)" : "var(--red)";
  const dimColor = up ? "var(--green-dim)" : "var(--red-dim)";
  const isVix = q.symbol === "^VIX";
  // VIX: high = bad (red), low = good (green)
  const vixUp = isVix && (q.changePct ?? 0) > 0;
  const displayColor = isVix ? (vixUp ? "var(--red)" : "var(--green)") : color;
  const displayDim = isVix ? (vixUp ? "var(--red-dim)" : "var(--green-dim)") : dimColor;

  if (q.price === null) return (
    <div className="glass-card" style={{ padding: large ? "18px 20px" : "14px 16px", opacity: 0.3 }}>
      <div style={{ fontSize: 11, color: "var(--text-3)" }}>{q.label}</div>
      <div style={{ fontSize: 13, color: "var(--text-3)", marginTop: 4 }}>—</div>
    </div>
  );

  return (
    <div className="glass-card" style={{ padding: large ? "18px 20px" : "14px 16px" }}>
      {/* Label + symbol */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-2)", letterSpacing: "0.03em" }}>
            {q.label}
          </div>
          <div style={{ fontSize: 9, color: "var(--text-3)", marginTop: 1 }}>{q.symbol}</div>
        </div>
        <div style={{
          fontSize: 9, fontWeight: 700, padding: "2px 7px",
          background: displayDim, color: displayColor,
          borderRadius: 6, letterSpacing: "0.04em",
        }}>
          {up ? "▲" : "▼"}
        </div>
      </div>

      {/* Price */}
      <div style={{
        fontSize: large ? 22 : 18,
        fontWeight: 700,
        color: "var(--text-1)",
        fontFamily: "var(--mono)",
        letterSpacing: "-0.02em",
        lineHeight: 1,
        marginBottom: 8,
      }}>
        {isVix ? q.price.toFixed(2) : `$${q.price.toFixed(2)}`}
      </div>

      {/* Change */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: displayColor, fontFamily: "var(--mono)" }}>
          {(q.changePct ?? 0) >= 0 ? "+" : ""}{(q.changePct ?? 0).toFixed(2)}%
        </div>
        <MiniBar pct={q.changePct ?? 0} />
      </div>
    </div>
  );
}

/* ── group header ─────────────────────────────────────────────────────────── */
function GroupLabel({ label, count }: { label: string; count: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
      <span className="section-label">{label}</span>
      <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
      <span style={{ fontSize: 10, color: "var(--text-3)" }}>{count} symbols</span>
    </div>
  );
}

/* ── last updated ─────────────────────────────────────────────────────────── */
function LastUpdated({ ts, loading }: { ts: number | null; loading: boolean }) {
  if (loading) return (
    <span style={{ fontSize: 10, color: "var(--blue)", fontWeight: 500 }}>
      Refreshing…
    </span>
  );
  if (!ts) return null;
  const d = new Date(ts);
  const hhmm = d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  return (
    <span style={{ fontSize: 10, color: "var(--text-3)" }}>
      Updated {hhmm}
    </span>
  );
}

/* ── main export ─────────────────────────────────────────────────────────── */
export default function MarketDashboard() {
  const [data, setData] = useState<Quote[]>([]);
  const [timestamp, setTimestamp] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetch_ = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/markets");
      const json: MarketData = await res.json();
      setData(json.data);
      setTimestamp(json.timestamp);
      setError(false);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch_();
    const id = setInterval(fetch_, 60_000); // refresh every 60s
    return () => clearInterval(id);
  }, [fetch_]);

  const indices = data.filter(q => q.group === "indices");
  const sectors = data.filter(q => q.group === "sectors");
  const global  = data.filter(q => q.group === "global");

  // VIX special
  const vix = indices.find(q => q.symbol === "^VIX");
  const mainIndices = indices.filter(q => q.symbol !== "^VIX");

  const pctSorted = [...sectors].sort((a, b) => (b.changePct ?? 0) - (a.changePct ?? 0));
  const best = pctSorted[0];
  const worst = pctSorted[pctSorted.length - 1];

  return (
    <div style={{ marginBottom: 0 }}>
      {/* Section header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: "var(--text-1)", letterSpacing: "-0.02em", marginBottom: 3 }}>
            Global Markets
          </h2>
          <p style={{ fontSize: 12, color: "var(--text-3)" }}>
            Live · 60s refresh · US indices, sectors & international
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {best && best.price && (
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 9, color: "var(--text-3)", marginBottom: 1 }}>TOP SECTOR</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--green)" }}>
                {best.label} +{(best.changePct ?? 0).toFixed(2)}%
              </div>
            </div>
          )}
          {worst && worst.price && (
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 9, color: "var(--text-3)", marginBottom: 1 }}>LAGGARD</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--red)" }}>
                {worst.label} {(worst.changePct ?? 0).toFixed(2)}%
              </div>
            </div>
          )}
          <button onClick={fetch_} style={{
            background: "rgba(41,151,255,0.12)", border: "1px solid rgba(41,151,255,0.25)",
            borderRadius: 8, padding: "6px 14px", color: "var(--blue)",
            fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font)",
            transition: "all 0.15s",
          }}
            onMouseEnter={e => (e.currentTarget.style.background = "rgba(41,151,255,0.2)")}
            onMouseLeave={e => (e.currentTarget.style.background = "rgba(41,151,255,0.12)")}
          >
            ↻ Refresh
          </button>
          <LastUpdated ts={timestamp} loading={loading} />
        </div>
      </div>

      {error && (
        <div style={{
          padding: "12px 16px", marginBottom: 16,
          background: "var(--red-dim)", border: "1px solid rgba(255,69,58,0.3)",
          borderRadius: 10, fontSize: 12, color: "var(--red)",
        }}>
          ⚠ Market data unavailable — Yahoo Finance may be rate-limiting. Data will refresh automatically.
        </div>
      )}

      {/* Skeleton shimmer while loading */}
      {loading && data.length === 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
          {Array(8).fill(0).map((_, i) => (
            <div key={i} className="glass-card" style={{ height: 100, position: "relative", overflow: "hidden" }}>
              <div style={{
                position: "absolute", inset: 0,
                background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.04), transparent)",
                animation: "shimmer 1.5s infinite",
              }} />
            </div>
          ))}
        </div>
      )}

      {data.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {/* US Indices + VIX */}
          <div>
            <GroupLabel label="US Indices & Volatility" count={indices.length} />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
              {mainIndices.map(q => <QuoteCard key={q.symbol} q={q} large />)}
              {vix && <QuoteCard key="vix" q={vix} large />}
            </div>
          </div>

          {/* US Sectors */}
          <div>
            <GroupLabel label="US Sectors (SPDR ETFs)" count={sectors.length} />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
              {sectors.map(q => <QuoteCard key={q.symbol} q={q} />)}
            </div>
          </div>

          {/* Global */}
          <div>
            <GroupLabel label="International Markets" count={global.length} />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
              {global.map(q => <QuoteCard key={q.symbol} q={q} />)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
