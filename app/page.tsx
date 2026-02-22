import TopBar from "@/components/TopBar";
import CompanyCard from "@/components/CompanyCard";
import companiesData from "@/data/companies.json";
import { CompanyIndex } from "@/types";

const companies = companiesData as CompanyIndex[];

export default function Home() {
  const buys  = companies.filter(c => c.recommendation === "BUY").length;
  const avoid = companies.filter(c => c.recommendation === "AVOID" || c.recommendation === "SELL").length;
  const hold  = companies.filter(c => c.recommendation === "HOLD").length;

  return (
    <div style={{ minHeight: "100vh", background: "var(--page-bg)" }}>
      <TopBar />

      {/* Sub-header / page bar */}
      <div style={{
        background: "#ffffff",
        borderBottom: "1px solid #e5e7eb",
        padding: "0 24px",
      }}>
        <div style={{
          maxWidth: 1280,
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: 52,
        }}>
          <div>
            <h1 style={{
              fontSize: 16,
              fontWeight: 700,
              color: "#1d2d3e",
              margin: 0,
              fontFamily: "'IBM Plex Sans', sans-serif",
            }}>
              Coverage Universe
            </h1>
            <p style={{ fontSize: 11, color: "#8696a9", margin: "1px 0 0", fontFamily: "'IBM Plex Sans', sans-serif" }}>
              Independent DCF valuations · FCFF methodology · Damodaran ERP
            </p>
          </div>

          {/* Stats row */}
          <div style={{ display: "flex", gap: 4 }}>
            {[
              { label: "Total", value: companies.length, color: "#0057d2", bg: "#eaf2ff", border: "#c8dcf8" },
              { label: "Buy",   value: buys,             color: "#107e3e", bg: "#f0faf5", border: "#a3d9b8" },
              { label: "Hold",  value: hold,             color: "#e76500", bg: "#fff8f0", border: "#f9c784" },
              { label: "Avoid", value: avoid,            color: "#bb0000", bg: "#fff5f5", border: "#f5c0c0" },
            ].map(s => (
              <div key={s.label} style={{
                display: "flex", flexDirection: "column", alignItems: "center",
                padding: "4px 14px",
                background: s.bg,
                border: `1px solid ${s.border}`,
                borderRadius: 6,
              }}>
                <span style={{ fontSize: 16, fontWeight: 700, color: s.color, fontFamily: "'IBM Plex Mono', monospace", lineHeight: 1.2 }}>
                  {s.value}
                </span>
                <span style={{ fontSize: 9, color: s.color, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Grid */}
      <main style={{ maxWidth: 1280, margin: "0 auto", padding: "24px" }}>
        <div className="stagger" style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
          gap: 16,
        }}>
          {companies.map(company => (
            <CompanyCard key={company.id} company={company} />
          ))}

          {/* Coming soon placeholder */}
          <div style={{
            border: "2px dashed #d1d5db",
            borderRadius: 6,
            minHeight: 220,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            background: "transparent",
            opacity: 0.5,
          }}>
            <div style={{ fontSize: 24, color: "#8696a9" }}>+</div>
            <div style={{
              fontSize: 11,
              color: "#8696a9",
              fontWeight: 600,
              letterSpacing: "0.06em",
              textAlign: "center",
              textTransform: "uppercase",
            }}>
              Next Coverage<br />Coming Soon
            </div>
          </div>
        </div>

        {/* Footer note */}
        <div style={{
          marginTop: 32,
          paddingTop: 16,
          borderTop: "1px solid #e5e7eb",
          display: "flex",
          gap: 24,
          flexWrap: "wrap",
          fontSize: 10,
          color: "#8696a9",
          letterSpacing: "0.04em",
          fontFamily: "'IBM Plex Sans', sans-serif",
        }}>
          <span>Model: FCFF DCF · 15Y explicit + terminal</span>
          <span>Discount rate: CAPM (rf + β × ERP)</span>
          <span>Country ERP: Damodaran (country-adjusted)</span>
          <span>⚠ Educational only · Not investment advice</span>
        </div>
      </main>
    </div>
  );
}
