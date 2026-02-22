"use client";
import { useState, useEffect, useCallback } from "react";
import { LineChart, Line, ResponsiveContainer, Tooltip } from "recharts";

interface Quote {
  symbol: string; label: string; group: string;
  price: number | null; change: number | null; changePct: number | null;
}

// Simulated intraday sparkline data based on changePct
function buildSparkline(changePct: number | null) {
  const n = 20;
  const pts: { v: number }[] = [];
  let v = 100;
  for (let i = 0; i < n; i++) {
    const progress = i / (n - 1);
    const trend = (changePct ?? 0) * progress * 0.6;
    const noise = (Math.random() - 0.5) * 0.8;
    v = 100 + trend + noise;
    pts.push({ v });
  }
  return pts;
}

function Sparkline({ pct }: { pct: number | null }) {
  const up = (pct ?? 0) >= 0;
  const color = up ? "var(--green)" : "var(--red)";
  const data = buildSparkline(pct);
  return (
    <ResponsiveContainer width="100%" height={36}>
      <LineChart data={data} margin={{ top: 2, right: 0, bottom: 2, left: 0 }}>
        <Line type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

function QuoteCard({ q }: { q: Quote }) {
  const up = (q.changePct ?? 0) >= 0;
  const color = up ? "var(--green)" : "var(--red)";
  const colorBg = up ? "var(--green-bg)" : "var(--red-bg)";
  const noData = q.price === null;

  return (
    <div className="glass" style={{ padding: "12px 14px 8px", minWidth: 0, display:"flex", flexDirection:"column" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:6 }}>
        <div style={{ minWidth:0 }}>
          <div style={{ fontSize:11, fontWeight:600, color:"var(--t2)", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis", fontFamily:"var(--font)" }}>{q.label}</div>
          <div style={{ fontSize:9, color:"var(--t4)", marginTop:1, fontFamily:"var(--font)" }}>{q.symbol}</div>
        </div>
        {!noData && (
          <span style={{ fontSize:9, fontWeight:700, color, background:colorBg, borderRadius:5, padding:"2px 6px", flexShrink:0, fontFamily:"var(--font)" }}>
            {up ? "▲" : "▼"} {Math.abs(q.changePct??0).toFixed(2)}%
          </span>
        )}
      </div>

      {noData ? (
        <div className="skeleton" style={{ height:22, width:"70%", marginBottom:6 }} />
      ) : (
        <div style={{ fontSize:18, fontWeight:700, color:"var(--t1)", fontFamily:"var(--mono)", letterSpacing:"-0.03em", lineHeight:1, marginBottom:4 }}>
          ${q.price!.toFixed(q.price! >= 100 ? 1 : 2)}
        </div>
      )}

      {/* Sparkline */}
      {!noData && <Sparkline pct={q.changePct} />}

      {!noData && (
        <div style={{ fontSize:11, fontWeight:600, color, fontFamily:"var(--mono)", marginTop:2 }}>
          {up ? "+" : ""}{(q.changePct??0).toFixed(2)}% today
        </div>
      )}
    </div>
  );
}

function SectionHead({ label, count }: { label: string; count: number }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
      <span style={{ fontSize:11, fontWeight:700, color:"var(--t4)", letterSpacing:"0.08em", textTransform:"uppercase", fontFamily:"var(--font)" }}>{label}</span>
      <div style={{ flex:1, height:1, background:"rgba(255,255,255,0.07)" }} />
      <span style={{ fontSize:10, color:"var(--t4)", fontFamily:"var(--font)" }}>{count}</span>
    </div>
  );
}

export default function MarketDashboard() {
  const [data,       setData]       = useState<Quote[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [lastUpdate, setLastUpdate] = useState<string>("");
  const [source,     setSource]     = useState<string>("");
  const [error,      setError]      = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch("/api/markets");
      const json = await res.json();
      setData(json.data ?? []);
      setSource(json.source ?? "");
      setError(false);
      const d = new Date(json.timestamp);
      setLastUpdate(d.toLocaleTimeString("en-US", { hour:"2-digit", minute:"2-digit" }));
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

  const withData = data.filter(q => q.price !== null && q.changePct !== null);
  const best  = [...withData].sort((a,b) => (b.changePct??0)-(a.changePct??0))[0];
  const worst = [...withData].sort((a,b) => (a.changePct??0)-(b.changePct??0))[0];

  const skeletons = (n: number) => Array(n).fill(null).map((_,i) => (
    <div key={i} className="glass" style={{ padding:"12px 14px", minHeight:110 }}>
      <div className="skeleton" style={{ height:11, width:"60%", marginBottom:8 }} />
      <div className="skeleton" style={{ height:20, width:"70%", marginBottom:10 }} />
      <div className="skeleton" style={{ height:36, width:"100%", marginBottom:6 }} />
      <div className="skeleton" style={{ height:11, width:"40%" }} />
    </div>
  ));

  return (
    <div>
      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20, flexWrap:"wrap", gap:10 }}>
        <div>
          <h2 style={{ fontSize:22, fontWeight:700, color:"var(--t1)", letterSpacing:"-0.03em", marginBottom:2, fontFamily:"var(--font)" }}>Global Markets</h2>
          <p style={{ fontSize:12, color:"var(--t3)", fontFamily:"var(--font)" }}>
            Live · auto-refreshes every 90s{source ? ` · via ${source}` : ""}
          </p>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
          {best?.price && (
            <div style={{ background:"var(--green-bg)", border:"1px solid var(--green-border)", borderRadius:10, padding:"5px 12px" }}>
              <span style={{ fontSize:10, color:"var(--t3)", fontFamily:"var(--font)" }}>TOP </span>
              <span style={{ fontSize:11, fontWeight:700, color:"var(--green)", fontFamily:"var(--font)" }}>{best.label} +{(best.changePct??0).toFixed(2)}%</span>
            </div>
          )}
          {worst?.price && worst.symbol !== best?.symbol && (
            <div style={{ background:"var(--red-bg)", border:"1px solid var(--red-border)", borderRadius:10, padding:"5px 12px" }}>
              <span style={{ fontSize:10, color:"var(--t3)", fontFamily:"var(--font)" }}>LOW </span>
              <span style={{ fontSize:11, fontWeight:700, color:"var(--red)", fontFamily:"var(--font)" }}>{worst.label} {(worst.changePct??0).toFixed(2)}%</span>
            </div>
          )}
          <button onClick={load} style={{
            background:"var(--blue-bg)", border:"1px solid var(--blue-border)", borderRadius:10,
            padding:"6px 14px", color:"var(--blue)", fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"var(--font)",
          }}>↻ {loading ? "Loading…" : lastUpdate ? `Updated ${lastUpdate}` : "Refresh"}</button>
        </div>
      </div>

      {error && (
        <div style={{ padding:"10px 14px", marginBottom:14, background:"var(--red-bg)", border:"1px solid var(--red-border)", borderRadius:12, fontSize:12, color:"var(--red)", fontFamily:"var(--font)" }}>
          ⚠ Market data unavailable — tap Refresh to retry.
        </div>
      )}

      <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
        {[
          { label:"US Indices & Volatility", items: indices },
          { label:"US Sectors (SPDR ETFs)",  items: sectors },
          { label:"International",            items: global  },
        ].map(({ label, items }) => (
          <div key={label}>
            <SectionHead label={label} count={items.length} />
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(150px, 1fr))", gap:8 }}>
              {loading && !data.length ? skeletons(items.length || 4) : items.map(q => <QuoteCard key={q.symbol} q={q} />)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
