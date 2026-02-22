"use client";
import Link from "next/link";
import { CompanyIndex } from "@/types";

function RecBadge({ rec }: { rec: string }) {
  const map: Record<string, { color: string; bg: string }> = {
    BUY:   { color: "var(--accent-green)", bg: "rgba(0,255,136,0.08)" },
    AVOID: { color: "var(--accent-red)",   bg: "rgba(255,69,96,0.08)"  },
    HOLD:  { color: "var(--accent-amber)", bg: "rgba(255,184,48,0.08)" },
    SELL:  { color: "var(--accent-red)",   bg: "rgba(255,69,96,0.08)"  },
  };
  const s = map[rec] || map.HOLD;
  return (
    <span style={{
      fontSize: 9,
      fontWeight: 700,
      letterSpacing: "0.18em",
      color: s.color,
      background: s.bg,
      border: `1px solid ${s.color}`,
      borderRadius: 2,
      padding: "2px 6px",
    }}>{rec}</span>
  );
}

function UpsideBar({ price, base, upside }: { price: number; base: number; upside: number }) {
  const max = upside * 1.1;
  const pPct = (price / max) * 100;
  const bPct = (base / max) * 100;
  const uPct = (upside / max) * 100;
  return (
    <div style={{ position: "relative", height: 20, marginTop: 8 }}>
      <div style={{ position: "absolute", inset: 0, background: "var(--bg-secondary)", borderRadius: 2, overflow: "hidden" }}>
        <div style={{ width: `${uPct}%`, height: "100%", background: "rgba(167,139,250,0.15)" }} />
      </div>
      <div style={{ position: "absolute", inset: 0, background: "transparent", borderRadius: 2, overflow: "hidden" }}>
        <div style={{ width: `${bPct}%`, height: "100%", background: "rgba(0,255,136,0.12)" }} />
      </div>
      {/* Price marker */}
      <div style={{ position: "absolute", top: 0, bottom: 0, left: `${pPct}%`, width: 2, background: "var(--accent-amber)", borderRadius: 1 }} />
      {/* Base marker */}
      <div style={{ position: "absolute", top: 0, bottom: 0, left: `${bPct}%`, width: 2, background: "var(--accent-green)", borderRadius: 1 }} />
      {/* Upside marker */}
      <div style={{ position: "absolute", top: 0, bottom: 0, left: `${uPct}%`, width: 2, background: "var(--accent-purple)", borderRadius: 1 }} />
      {/* Labels */}
      <div style={{ position: "absolute", top: 3, left: `${pPct + 1}%`, fontSize: 8, color: "var(--accent-amber)" }}>P</div>
      <div style={{ position: "absolute", top: 3, left: `${bPct + 1}%`, fontSize: 8, color: "var(--accent-green)" }}>B</div>
      <div style={{ position: "absolute", top: 3, left: `${Math.max(uPct - 10, 0)}%`, fontSize: 8, color: "var(--accent-purple)" }}>U</div>
    </div>
  );
}

export default function CompanyCard({ company }: { company: CompanyIndex }) {
  const upsideColor = company.upsideToBase >= 0 ? "var(--accent-green)" : "var(--accent-red)";

  return (
    <Link href={`/company/${company.id}`} style={{ textDecoration: "none" }}>
      <div
        className="panel scan-lines"
        style={{
          padding: 0,
          cursor: "pointer",
          transition: "border-color 0.15s, transform 0.15s",
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLDivElement).style.borderColor = "var(--border-bright)";
          (e.currentTarget as HTMLDivElement).style.transform = "translateY(-1px)";
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLDivElement).style.borderColor = "var(--border)";
          (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
        }}
      >
        {/* Header row */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 14px 8px",
          borderBottom: "1px solid var(--border)",
        }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>{company.ticker}</span>
            <span style={{ fontSize: 10, color: "var(--text-muted)" }}>{company.exchange}</span>
          </div>
          <RecBadge rec={company.recommendation} />
        </div>

        <div style={{ padding: "10px 14px 12px" }}>
          {/* Company name + metadata */}
          <div style={{ fontSize: 11, color: "var(--text-secondary)", marginBottom: 10 }}>
            {company.name}
          </div>
          <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
            <span style={{ fontSize: 9, background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: 2, padding: "1px 5px", color: "var(--text-muted)", letterSpacing: "0.08em" }}>
              {company.sector}
            </span>
            <span style={{ fontSize: 9, background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: 2, padding: "1px 5px", color: "var(--text-muted)", letterSpacing: "0.08em" }}>
              {company.country}
            </span>
          </div>

          {/* Price / Base / Upside grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 10 }}>
            <div>
              <div className="data-label" style={{ marginBottom: 2 }}>Price</div>
              <div className="data-value" style={{ color: "var(--accent-amber)", fontSize: 14 }}>
                {company.currency === "USD" ? "$" : ""}{company.price.toFixed(2)}
              </div>
            </div>
            <div>
              <div className="data-label" style={{ marginBottom: 2 }}>Base IV</div>
              <div className="data-value" style={{ color: "var(--accent-green)", fontSize: 14 }}>
                ${company.baseValue.toFixed(2)}
              </div>
            </div>
            <div>
              <div className="data-label" style={{ marginBottom: 2 }}>Upside IV</div>
              <div className="data-value" style={{ color: "var(--accent-purple)", fontSize: 14 }}>
                ${company.upsideValue.toFixed(2)}
              </div>
            </div>
          </div>

          {/* Visual bar */}
          <UpsideBar price={company.price} base={company.baseValue} upside={company.upsideValue} />

          {/* Upside % */}
          <div style={{ marginTop: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 9, color: "var(--text-muted)" }}>
              As of {company.asOfDate}
            </span>
            <span style={{ fontSize: 11, fontWeight: 600, color: upsideColor }}>
              {company.upsideToBase >= 0 ? "+" : ""}{company.upsideToBase.toFixed(1)}% to base
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
