"use client";
import Link from "next/link";
import { CompanyIndex } from "@/types";

function RecBadge({ rec }: { rec: string }) {
  const styles: Record<string, { color: string; bg: string; border: string }> = {
    BUY:   { color: "#107e3e", bg: "#f0faf5", border: "#a3d9b8" },
    HOLD:  { color: "#e76500", bg: "#fff8f0", border: "#f9c784" },
    AVOID: { color: "#bb0000", bg: "#fff5f5", border: "#f5c0c0" },
    SELL:  { color: "#bb0000", bg: "#fff5f5", border: "#f5c0c0" },
  };
  const s = styles[rec] || styles.HOLD;
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, letterSpacing: "0.08em",
      color: s.color, background: s.bg,
      border: `1px solid ${s.border}`,
      borderRadius: 4, padding: "2px 8px",
      fontFamily: "'IBM Plex Sans', sans-serif",
    }}>
      {rec}
    </span>
  );
}

function ValuationBar({ price, base, upside }: { price: number; base: number; upside: number }) {
  const max = upside * 1.12;
  const pPct = Math.min((price / max) * 100, 100);
  const bPct = Math.min((base / max) * 100, 100);
  const uPct = Math.min((upside / max) * 100, 100);

  const isUndervalued = base > price;

  return (
    <div style={{ marginTop: 12 }}>
      {/* Bar track */}
      <div style={{ position: "relative", height: 8, background: "#f0f4ff", borderRadius: 6, border: "1px solid #d6e4f7", overflow: "visible" }}>
        {/* Fill to base (green if under, grey if over) */}
        <div style={{
          position: "absolute", top: 0, left: 0, height: "100%",
          width: `${Math.min(bPct, pPct <= bPct ? bPct : pPct)}%`,
          background: isUndervalued ? "linear-gradient(90deg, #c8dcf8, #3b8ef3)" : "#e5e7eb",
          borderRadius: 6,
        }} />
        {/* Price marker */}
        <div style={{
          position: "absolute", top: -4, bottom: -4,
          left: `${pPct}%`, width: 2,
          background: "#e76500", borderRadius: 2,
          transform: "translateX(-50%)",
          zIndex: 3,
        }} />
        {/* Base IV marker */}
        <div style={{
          position: "absolute", top: -4, bottom: -4,
          left: `${bPct}%`, width: 2,
          background: "#107e3e", borderRadius: 2,
          transform: "translateX(-50%)",
          zIndex: 2,
        }} />
        {/* Upside marker */}
        <div style={{
          position: "absolute", top: -4, bottom: -4,
          left: `${uPct}%`, width: 2,
          background: "#0057d2", borderRadius: 2,
          transform: "translateX(-50%)",
          zIndex: 2,
        }} />
      </div>
      {/* Legend */}
      <div style={{ display: "flex", gap: 14, marginTop: 8, flexWrap: "wrap" }}>
        {[
          { label: "Price", value: `$${price.toFixed(2)}`, color: "#e76500" },
          { label: "Base IV", value: `$${base.toFixed(2)}`, color: "#107e3e" },
          { label: "Upside IV", value: `$${upside.toFixed(2)}`, color: "#0057d2" },
        ].map(item => (
          <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: item.color, flexShrink: 0 }} />
            <span style={{ fontSize: 10, color: "#8696a9", fontFamily: "'IBM Plex Sans', sans-serif" }}>{item.label} </span>
            <span style={{ fontSize: 10, fontWeight: 700, color: item.color, fontFamily: "'IBM Plex Mono', monospace" }}>{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function CompanyCard({ company }: { company: CompanyIndex }) {
  const upside = company.upsideToBase;
  const upsideColor = upside >= 0 ? "#107e3e" : "#bb0000";

  return (
    <Link href={`/company/${company.id}`} style={{ textDecoration: "none" }}>
      <div
        className="panel"
        style={{ cursor: "pointer", transition: "box-shadow 0.18s, transform 0.18s", overflow: "hidden" }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLDivElement).style.boxShadow = "0 4px 16px rgba(0,87,210,0.15)";
          (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)";
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLDivElement).style.boxShadow = "0 1px 4px rgba(0,0,0,0.07)";
          (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
        }}
      >
        {/* Blue accent top strip */}
        <div style={{ height: 3, background: "linear-gradient(90deg, #0057d2, #3b8ef3)" }} />

        <div style={{ padding: "14px 16px 16px" }}>
          {/* Header row */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 4 }}>
            <div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                <span style={{ fontSize: 18, fontWeight: 700, color: "#1d2d3e", fontFamily: "'IBM Plex Sans', sans-serif" }}>
                  {company.ticker}
                </span>
                <span style={{ fontSize: 11, color: "#8696a9", fontWeight: 500 }}>{company.exchange}</span>
              </div>
              <div style={{ fontSize: 12, color: "#556b82", marginTop: 1 }}>{company.name}</div>
            </div>
            <RecBadge rec={company.recommendation} />
          </div>

          {/* Tags */}
          <div style={{ display: "flex", gap: 6, marginTop: 8, marginBottom: 4, flexWrap: "wrap" }}>
            {[company.sector, company.country].map(tag => (
              <span key={tag} style={{
                fontSize: 10, padding: "2px 7px",
                background: "#eaf2ff", color: "#0057d2",
                border: "1px solid #c8dcf8", borderRadius: 3,
                fontWeight: 500, fontFamily: "'IBM Plex Sans', sans-serif",
              }}>
                {tag}
              </span>
            ))}
          </div>

          {/* Valuation bar */}
          <ValuationBar price={company.price} base={company.baseValue} upside={company.upsideValue} />

          {/* Footer */}
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            marginTop: 12, paddingTop: 10,
            borderTop: "1px solid #f0f0f0",
          }}>
            <span style={{ fontSize: 10, color: "#8696a9" }}>As of {company.asOfDate}</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: upsideColor, fontFamily: "'IBM Plex Mono', monospace" }}>
              {upside >= 0 ? "+" : ""}{upside.toFixed(1)}% to base
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
