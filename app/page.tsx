"use client";
import TopBar from "@/components/TopBar";
import MarketDashboard from "@/components/MarketDashboard";
import CompanyCard from "@/components/CompanyCard";
import companiesData from "@/data/companies.json";
import { CompanyIndex } from "@/types";

const companies = companiesData as CompanyIndex[];

export default function Home() {
  const buys  = companies.filter(c => c.recommendation === "BUY").length;
  const avoid = companies.filter(c => c.recommendation === "AVOID" || c.recommendation === "SELL").length;

  return (
    <div style={{ minHeight: "100dvh" }}>
      <TopBar />

      {/* Markets */}
      <section id="markets" style={{ padding: "28px 16px 32px", maxWidth: 1360, margin: "0 auto" }}>
        <MarketDashboard />
      </section>

      {/* Divider */}
      <div style={{ height: 1, background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.08) 20%, rgba(255,255,255,0.08) 80%, transparent)", margin: "0 16px" }} />

      {/* Coverage */}
      <section id="coverage" style={{ padding: "28px 16px 60px", maxWidth: 1360, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: "var(--t1)", letterSpacing: "-0.03em", marginBottom: 3 }}>Equity Coverage</h2>
            <p style={{ fontSize: 12, color: "var(--t3)" }}>Independent DCF · FCFF methodology · Damodaran ERP</p>
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {[
              { l: "Total", v: companies.length, c: "var(--blue)",  bg: "var(--blue-bg)"  },
              { l: "Buy",   v: buys,             c: "var(--green)", bg: "var(--green-bg)" },
              { l: "Avoid", v: avoid,            c: "var(--red)",   bg: "var(--red-bg)"   },
            ].map(s => (
              <div key={s.l} style={{ display: "flex", alignItems: "center", gap: 7, padding: "5px 12px", background: s.bg, border: `1px solid ${s.c}33`, borderRadius: 20 }}>
                <span style={{ fontSize: 15, fontWeight: 700, color: s.c, fontFamily: "var(--mono)" }}>{s.v}</span>
                <span style={{ fontSize: 10, fontWeight: 600, color: s.c, opacity: 0.8, letterSpacing: "0.05em" }}>{s.l.toUpperCase()}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Grid */}
        <div className="stagger" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
          {companies.map(c => <CompanyCard key={c.id} company={c} />)}
          {/* Coming soon */}
          <div style={{ border: "1px dashed rgba(255,255,255,0.10)", borderRadius: 18, minHeight: 180, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, opacity: 0.35 }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", border: "1px dashed rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, color: "var(--t3)" }}>+</div>
            <div style={{ fontSize: 11, color: "var(--t3)", textAlign: "center", letterSpacing: "0.04em" }}>Next coverage<br />coming soon</div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ marginTop: 36, paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", gap: 20, flexWrap: "wrap", fontSize: 10, color: "var(--t4)", letterSpacing: "0.03em" }}>
          <span>FCFF DCF · 15Y explicit + terminal</span>
          <span>CAPM discount rate</span>
          <span>Damodaran ERP (Jan 2026)</span>
          <span>Market data via Stooq</span>
          <span>⚠ Educational · Not investment advice</span>
        </div>
      </section>
    </div>
  );
}
