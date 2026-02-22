"use client";
import Link from "next/link";
import { CompanyIndex } from "@/types";

const REC: Record<string, { color: string; bg: string; border: string }> = {
  BUY:   { color: "var(--green)",  bg: "var(--green-bg)",  border: "rgba(48,209,88,0.3)"  },
  HOLD:  { color: "var(--amber)",  bg: "var(--amber-bg)",  border: "rgba(255,214,10,0.3)" },
  AVOID: { color: "var(--red)",    bg: "var(--red-bg)",    border: "rgba(255,69,58,0.3)"  },
  SELL:  { color: "var(--red)",    bg: "var(--red-bg)",    border: "rgba(255,69,58,0.3)"  },
};

export default function CompanyCard({ company }: { company: CompanyIndex }) {
  const rs  = REC[company.recommendation] || REC.HOLD;
  const up  = company.upsideToBase >= 0;
  const max = company.upsideValue * 1.15;
  const pricePct  = Math.min((company.price      / max) * 100, 100);
  const basePct   = Math.min((company.baseValue  / max) * 100, 100);
  const upsidePct = Math.min((company.upsideValue/ max) * 100, 100);

  return (
    <Link href={`/company/${company.id}`} style={{ textDecoration: "none", display: "block" }}>
      <div className="glass" style={{ padding: "18px 18px 16px", cursor: "pointer" }}>
        {/* Top accent line */}
        <div style={{ position: "absolute", top: 0, left: "20%", right: "20%", height: 1, background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)", borderRadius: 1 }} />

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "var(--t1)", letterSpacing: "-0.03em", lineHeight: 1.1 }}>{company.ticker}</div>
            <div style={{ fontSize: 11, color: "var(--t3)", marginTop: 2, lineHeight: 1.3 }}>{company.name}</div>
          </div>
          <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 20, color: rs.color, background: rs.bg, border: `1px solid ${rs.border}`, flexShrink: 0, letterSpacing: "0.05em" }}>
            {company.recommendation}
          </span>
        </div>

        {/* Tags */}
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 14 }}>
          {[company.sector, company.country].map(t => (
            <span key={t} style={{ fontSize: 10, padding: "2px 8px", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, color: "var(--t2)", fontWeight: 500 }}>{t}</span>
          ))}
        </div>

        {/* Price spectrum bar */}
        <div style={{ position: "relative", height: 6, background: "rgba(255,255,255,0.07)", borderRadius: 6, marginBottom: 14 }}>
          {/* Fill price → base */}
          <div style={{ position: "absolute", top: 0, left: `${pricePct}%`, width: `${Math.max(basePct - pricePct, 0)}%`, height: "100%", background: "linear-gradient(90deg, rgba(48,209,88,0.4), var(--green))", borderRadius: 6 }} />
          {/* Price dot */}
          <div style={{ position: "absolute", top: "50%", left: `${pricePct}%`, width: 12, height: 12, background: "var(--amber)", borderRadius: "50%", border: "2px solid rgba(0,0,0,0.6)", transform: "translate(-50%,-50%)", boxShadow: "0 0 10px var(--amber)", zIndex: 3 }} />
          {/* Base dot */}
          <div style={{ position: "absolute", top: "50%", left: `${basePct}%`, width: 12, height: 12, background: "var(--green)", borderRadius: "50%", border: "2px solid rgba(0,0,0,0.6)", transform: "translate(-50%,-50%)", boxShadow: "0 0 10px var(--green)", zIndex: 2 }} />
          {/* Upside tick */}
          <div style={{ position: "absolute", top: -3, left: `${upsidePct}%`, width: 2, height: 12, background: "var(--blue)", borderRadius: 1, transform: "translateX(-50%)" }} />
        </div>

        {/* Values row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 4, marginBottom: 12 }}>
          {[
            { l: "Price",    v: `$${company.price.toFixed(2)}`,      c: "var(--amber)" },
            { l: "Base IV",  v: `$${company.baseValue.toFixed(2)}`,  c: "var(--green)" },
            { l: "Upside",   v: `$${company.upsideValue.toFixed(2)}`,c: "var(--blue)"  },
          ].map(item => (
            <div key={item.l} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 9, color: "var(--t4)", marginBottom: 2, letterSpacing: "0.05em", textTransform: "uppercase" }}>{item.l}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: item.c, fontFamily: "var(--mono)" }}>{item.v}</div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 10, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <span style={{ fontSize: 10, color: "var(--t4)" }}>{company.asOfDate}</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: up ? "var(--green)" : "var(--red)", fontFamily: "var(--mono)" }}>
            {up ? "+" : ""}{company.upsideToBase.toFixed(1)}% to base
          </span>
        </div>
      </div>
    </Link>
  );
}
