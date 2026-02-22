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
    <div style={{ minHeight: "100vh" }}>
      <TopBar />

      {/* ── Hero ticker ───────────────────────────────────────────────────────── */}
      <div id="markets" style={{ scrollMarginTop: 52 }}>

        {/* Markets section */}
        <section style={{
          padding: "36px 32px 40px",
          maxWidth: 1360,
          margin: "0 auto",
        }}>
          <MarketDashboard />
        </section>

        {/* Divider */}
        <div style={{
          height: 1,
          background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.08) 20%, rgba(255,255,255,0.08) 80%, transparent)",
          margin: "0 32px",
        }} />
      </div>

      {/* ── Coverage section ──────────────────────────────────────────────────── */}
      <section id="coverage" style={{
        padding: "40px 32px 60px",
        maxWidth: 1360,
        margin: "0 auto",
        scrollMarginTop: 52,
      }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 24 }}>
          <div>
            <h2 style={{
              fontSize: 22, fontWeight: 700, color: "var(--text-1)",
              letterSpacing: "-0.02em", marginBottom: 4,
            }}>
              Equity Coverage
            </h2>
            <p style={{ fontSize: 12, color: "var(--text-3)", lineHeight: 1.5 }}>
              Independent DCF valuations · FCFF methodology · Damodaran country-adjusted ERP
            </p>
          </div>

          {/* Stats pills */}
          <div style={{ display: "flex", gap: 8 }}>
            {[
              { label: "Total",    value: companies.length, color: "var(--blue)",  bg: "var(--blue-dim)"  },
              { label: "Buy",      value: buys,             color: "var(--green)", bg: "var(--green-dim)" },
              { label: "Avoid",    value: avoid,            color: "var(--red)",   bg: "var(--red-dim)"   },
            ].map(s => (
              <div key={s.label} style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "6px 14px",
                background: s.bg,
                border: `1px solid ${s.color}33`,
                borderRadius: 20,
              }}>
                <span style={{ fontSize: 16, fontWeight: 700, color: s.color, fontFamily: "var(--mono)" }}>
                  {s.value}
                </span>
                <span style={{ fontSize: 10, fontWeight: 600, color: s.color, opacity: 0.8, letterSpacing: "0.05em" }}>
                  {s.label.toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Company grid */}
        <div className="stagger" style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
          gap: 14,
        }}>
          {companies.map(company => (
            <CompanyCard key={company.id} company={company} />
          ))}

          {/* Coming soon */}
          <div style={{
            border: "1px dashed rgba(255,255,255,0.10)",
            borderRadius: 16,
            minHeight: 200,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            opacity: 0.4,
            transition: "opacity 0.2s",
          }}
            onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.opacity = "0.6"}
            onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.opacity = "0.4"}
          >
            <div style={{
              width: 36, height: 36,
              borderRadius: "50%",
              border: "1px dashed rgba(255,255,255,0.2)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 18, color: "var(--text-3)",
            }}>+</div>
            <div style={{
              fontSize: 11, fontWeight: 500, color: "var(--text-3)",
              textAlign: "center", letterSpacing: "0.05em",
            }}>
              Next coverage<br />coming soon
            </div>
          </div>
        </div>

        {/* Footer note */}
        <div style={{
          marginTop: 40, paddingTop: 20,
          borderTop: "1px solid rgba(255,255,255,0.06)",
          display: "flex", gap: 28, flexWrap: "wrap",
          fontSize: 10, color: "var(--text-3)", letterSpacing: "0.04em",
        }}>
          <span>Model: FCFF DCF · 15Y explicit + terminal value</span>
          <span>Discount: CAPM (rf + β × country ERP)</span>
          <span>ERP source: Damodaran (Jan 2026)</span>
          <span>Market data: Yahoo Finance (60s delay)</span>
          <span>⚠ Educational only · Not investment advice</span>
        </div>
      </section>
    </div>
  );
}
