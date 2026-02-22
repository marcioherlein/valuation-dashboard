"use client";
import Link from "next/link";
import { CompanyIndex } from "@/types";

const REC_STYLE: Record<string, { color: string; bg: string; border: string }> = {
  BUY:   { color: "var(--green)",  bg: "var(--green-dim)", border: "rgba(48,209,88,0.3)" },
  HOLD:  { color: "var(--amber)",  bg: "var(--amber-dim)", border: "rgba(255,159,10,0.3)" },
  AVOID: { color: "var(--red)",    bg: "var(--red-dim)",   border: "rgba(255,69,58,0.3)"  },
  SELL:  { color: "var(--red)",    bg: "var(--red-dim)",   border: "rgba(255,69,58,0.3)"  },
};

function UpsideArc({ price, base, upside }: { price: number; base: number; upside: number }) {
  const max = upside * 1.15;
  const pricePct = Math.min((price / max) * 100, 100);
  const basePct  = Math.min((base  / max) * 100, 100);
  const upsidePct= Math.min((upside/ max) * 100, 100);

  return (
    <div style={{ margin: "14px 0 10px" }}>
      {/* Track */}
      <div style={{ position: "relative", height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 6 }}>
        {/* Fill price→base */}
        <div style={{
          position: "absolute", top: 0, left: `${pricePct}%`,
          width: `${basePct - pricePct}%`,
          height: "100%", background: "linear-gradient(90deg, rgba(48,209,88,0.5), var(--green))",
          borderRadius: 6,
        }} />
        {/* Price dot */}
        <div style={{
          position: "absolute", top: "50%", left: `${pricePct}%`,
          width: 10, height: 10, background: "var(--amber)",
          borderRadius: "50%", border: "2px solid var(--bg)",
          transform: "translate(-50%, -50%)", zIndex: 3,
          boxShadow: "0 0 8px var(--amber)",
        }} />
        {/* Base dot */}
        <div style={{
          position: "absolute", top: "50%", left: `${basePct}%`,
          width: 10, height: 10, background: "var(--green)",
          borderRadius: "50%", border: "2px solid var(--bg)",
          transform: "translate(-50%, -50%)", zIndex: 3,
          boxShadow: "0 0 8px var(--green)",
        }} />
        {/* Upside tick */}
        <div style={{
          position: "absolute", top: -3, left: `${upsidePct}%`,
          width: 2, height: 12, background: "var(--blue)", borderRadius: 1,
          transform: "translateX(-50%)",
        }} />
      </div>

      {/* Legend */}
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
        {[
          { label: "Price", value: `$${price.toFixed(2)}`, color: "var(--amber)" },
          { label: "Base", value: `$${base.toFixed(2)}`, color: "var(--green)" },
          { label: "Upside", value: `$${upside.toFixed(2)}`, color: "var(--blue)" },
        ].map(item => (
          <div key={item.label} style={{ textAlign: "center" }}>
            <div style={{ fontSize: 9, color: "var(--text-3)", marginBottom: 1 }}>{item.label}</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: item.color, fontFamily: "var(--mono)" }}>
              {item.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function CompanyCard({ company }: { company: CompanyIndex }) {
  const rs = REC_STYLE[company.recommendation] || REC_STYLE.HOLD;
  const upside = company.upsideToBase;
  const isUp = upside >= 0;

  return (
    <Link href={`/company/${company.id}`} style={{ textDecoration: "none" }}>
      <div className="glass-card" style={{ padding: "18px 20px", cursor: "pointer" }}>
        {/* Top row */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text-1)", letterSpacing: "-0.02em" }}>
              {company.ticker}
            </div>
            <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 1 }}>{company.name}</div>
          </div>
          <span style={{
            fontSize: 10, fontWeight: 700, letterSpacing: "0.06em",
            padding: "3px 10px", borderRadius: 20,
            color: rs.color, background: rs.bg,
            border: `1px solid ${rs.border}`,
          }}>
            {company.recommendation}
          </span>
        </div>

        {/* Tags */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
          {[company.sector, company.country, company.exchange].map(tag => (
            <span key={tag} style={{
              fontSize: 9, fontWeight: 500, padding: "2px 7px",
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.10)",
              borderRadius: 5, color: "var(--text-2)", letterSpacing: "0.03em",
            }}>{tag}</span>
          ))}
        </div>

        {/* Price spectrum */}
        <UpsideArc price={company.price} base={company.baseValue} upside={company.upsideValue} />

        {/* Footer */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          paddingTop: 10, borderTop: "1px solid rgba(255,255,255,0.06)",
        }}>
          <span style={{ fontSize: 10, color: "var(--text-3)" }}>
            {company.asOfDate}
          </span>
          <span style={{
            fontSize: 13, fontWeight: 700, fontFamily: "var(--mono)",
            color: isUp ? "var(--green)" : "var(--red)",
          }}>
            {isUp ? "+" : ""}{upside.toFixed(1)}% to base
          </span>
        </div>
      </div>
    </Link>
  );
}
