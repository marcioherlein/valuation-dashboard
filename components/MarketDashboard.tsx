"use client";
import { useState, useEffect, useCallback } from "react";

interface Quote {
  symbol: string; label: string; group: string;
  price: number | null; change: number | null; changePct: number | null;
}

function QuoteCard({ q }: { q: Quote }) {
  const up = (q.changePct ?? 0) >= 0;
  const color     = up ? "var(--green)"    : "var(--red)";
  const colorBg   = up ? "var(--green-bg)" : "var(--red-bg)";
  const arrow     = up ? "▲" : "▼";
  const noData    = q.price === null;

  return (
    <div className="glass" style={{ padding: "14px 16px", minWidth: 0 }}>
      {/* Label row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--t2)", letterSpacing: "0.01em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{q.label}</div>
          <div style={{ fontSize: 10, color: "var(--t4)", marginTop: 1 }}>{q.symbol}</div>
        </div>
        {!noData && (
          <span style={{ fontSize: 10, fontWeight: 700, color, background: colorBg, borderRadius: 6, padding: "2px 6px", flexShrink: 0 }}>{arrow}</span>
        )}
      </div>

      {/* Price */}
      {noData ? (
        <div className="skeleton" style={{ height: 28, width: "70%", marginBottom: 8 }} />
      ) : (
        <div style={{ fontSize: 20, fontWeight: 700, color: "var(--t1)", fontFamily: "var(--mono)", letterSpacing: "-0.03em", lineHeight: 1, marginBottom: 8 }}>
          ${q.price!.toFixed(2)}
        </div>
      )}

      {/* Change */}
      {noData ? (
        <div className="skeleton" style={{ height: 14, width: "50%" }} />
      ) : (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 12, fontWeight: 600, color, fontFamily: "var(--mono)" }}>
            {up ? "+" : ""}{(q.changePct ?? 0).toFixed(2)}%
          </span>
          {/* Mini progress bar */}
          <div style={{ height: 3, width: 48, background: "rgba(255,255,255,0.08)", borderRadius: 3, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${Math.min(Math.abs(q.changePct ?? 0) * 10, 100)}%`, background: color, borderRadius: 3 }} />
          </div>
        </div>
      )}
    </div>
  );
}

function SectionHead({ label }: { label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
      <span style={{ fontSize: 11, fontWeight: 700, color: "var(--t3)", letterSpacing: "0.08em", textTransform: "uppercase" }}>{label}</span>
      <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.07)" }} />
    </div>
  );
}

export default function MarketDashboard() {
  const [data,      setData]      = useState<Quote[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [lastUpdate,setLastUpdate]= useState<string>("");
  const [error,     setError]     = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch("/api/markets");
      const json = await res.json();
      setData(json.data ?? []);
      setError(false);
      const d = new Date(json.timestamp);
      setLastUpdate(d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }));
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); const id = setInterval(load, 90_000); return () => clearInterval(id); }, [load]);

  const indices = data.filter(q => q.group === "indices");
  const sectors = data.filter(q => q.group === "sectors");
  const global  = data.filter(q => q.group === "global");

  const withData  = data.filter(q => q.price !== null && q.changePct !== null);
  const best      = [...withData].sort((a,b) => (b.changePct??0)-(a.changePct??0))[0];
  const worst     = [...withData].sort((a,b) => (a.changePct??0)-(b.changePct??0))[0];

  // Skeleton placeholders
  const skeletons = (n: number) => Array(n).fill(null).map((_,i) => (
    <div key={i} className="glass" style={{ padding: "14px 16px" }}>
      <div className="skeleton" style={{ height: 12, width: "60%", marginBottom: 10 }} />
      <div className="skeleton" style={{ height: 24, width: "75%", marginBottom: 8 }} />
      <div className="skeleton" style={{ height: 12, width: "45%" }} />
    </div>
  ));

  const GRID4: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 };
  const GRID4_MOB: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 8 };

  return (
    <div>
      {/* Section header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: "var(--t1)", letterSpacing: "-0.03em", marginBottom: 2 }}>Global Markets</h2>
          <p style={{ fontSize: 12, color: "var(--t3)" }}>Live · auto-refreshes every 90s</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          {best && (
            <div style={{ background: "var(--green-bg)", border: "1px solid rgba(48,209,88,0.25)", borderRadius: 10, padding: "5px 12px" }}>
              <span style={{ fontSize: 10, color: "var(--t3)" }}>TOP </span>
              <span style={{ fontSize: 11, fontWeight: 700, color: "var(--green)" }}>{best.label} +{(best.changePct??0).toFixed(2)}%</span>
            </div>
          )}
          {worst && worst.symbol !== best?.symbol && (
            <div style={{ background: "var(--red-bg)", border: "1px solid rgba(255,69,58,0.25)", borderRadius: 10, padding: "5px 12px" }}>
              <span style={{ fontSize: 10, color: "var(--t3)" }}>LOW </span>
              <span style={{ fontSize: 11, fontWeight: 700, color: "var(--red)" }}>{worst.label} {(worst.changePct??0).toFixed(2)}%</span>
            </div>
          )}
          <button onClick={load} style={{
            background: "rgba(10,132,255,0.15)", border: "1px solid rgba(10,132,255,0.3)",
            borderRadius: 10, padding: "6px 14px", color: "var(--blue)",
            fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font)",
          }}>↻ {loading ? "Loading…" : lastUpdate ? `Updated ${lastUpdate}` : "Refresh"}</button>
        </div>
      </div>

      {error && (
        <div style={{ padding: "10px 14px", marginBottom: 16, background: "var(--red-bg)", border: "1px solid rgba(255,69,58,0.3)", borderRadius: 12, fontSize: 12, color: "var(--red)" }}>
          ⚠ Could not load market data — tap Refresh to try again.
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
        {/* Indices */}
        <div>
          <SectionHead label="US Indices & Volatility" />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 10 }}>
            {loading && !data.length ? skeletons(4) : indices.map(q => <QuoteCard key={q.symbol} q={q} />)}
          </div>
        </div>

        {/* Sectors */}
        <div>
          <SectionHead label="US Sectors (SPDR ETFs)" />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 10 }}>
            {loading && !data.length ? skeletons(8) : sectors.map(q => <QuoteCard key={q.symbol} q={q} />)}
          </div>
        </div>

        {/* Global */}
        <div>
          <SectionHead label="International" />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 10 }}>
            {loading && !data.length ? skeletons(4) : global.map(q => <QuoteCard key={q.symbol} q={q} />)}
          </div>
        </div>
      </div>
    </div>
  );
}
