import TopBar from "@/components/TopBar";
import CompanyCard from "@/components/CompanyCard";
import companiesData from "@/data/companies.json";
import { CompanyIndex } from "@/types";

const companies = companiesData as CompanyIndex[];

const STATS = [
  { label: "Coverage", value: companies.length.toString(), unit: "companies" },
  { label: "BUY", value: companies.filter(c => c.recommendation === "BUY").length.toString(), unit: "" },
  { label: "AVOID / SELL", value: companies.filter(c => c.recommendation === "AVOID" || c.recommendation === "SELL").length.toString(), unit: "" },
  { label: "Method", value: "FCFF DCF", unit: "primary" },
];

export default function Home() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)" }}>
      <TopBar />

      {/* Hero bar */}
      <div style={{
        borderBottom: "1px solid var(--border)",
        background: "var(--bg-secondary)",
        padding: "12px 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        <div>
          <h1 style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", margin: 0, letterSpacing: "0.08em" }}>
            EQUITY COVERAGE UNIVERSE
          </h1>
          <p style={{ fontSize: 10, color: "var(--text-muted)", margin: "2px 0 0", letterSpacing: "0.06em" }}>
            Independent DCF valuations · forensic buy-side methodology
          </p>
        </div>
        <div style={{ display: "flex", gap: 28 }}>
          {STATS.map(s => (
            <div key={s.label} style={{ textAlign: "right" }}>
              <div style={{ fontSize: 9, color: "var(--text-muted)", letterSpacing: "0.12em", textTransform: "uppercase" }}>{s.label}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--accent-blue)" }}>
                {s.value} <span style={{ fontSize: 9, color: "var(--text-muted)" }}>{s.unit}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Grid */}
      <main style={{ padding: "24px", maxWidth: 1280, margin: "0 auto" }}>
        <div className="stagger" style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
          gap: 14,
        }}>
          {companies.map(company => (
            <CompanyCard key={company.id} company={company} />
          ))}

          {/* Placeholder card for future companies */}
          <div className="panel" style={{
            padding: 20,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: 220,
            borderStyle: "dashed",
            opacity: 0.4,
          }}>
            <div style={{ fontSize: 22, marginBottom: 8, color: "var(--text-muted)" }}>+</div>
            <div style={{ fontSize: 10, color: "var(--text-muted)", letterSpacing: "0.12em", textAlign: "center" }}>
              NEXT COVERAGE<br />COMING SOON
            </div>
          </div>
        </div>

        {/* Methodology note */}
        <div style={{
          marginTop: 32,
          borderTop: "1px solid var(--border)",
          paddingTop: 16,
          display: "flex",
          gap: 32,
          fontSize: 9,
          color: "var(--text-muted)",
          letterSpacing: "0.08em",
        }}>
          <span>MODEL: FCFF DCF · 15Y EXPLICIT + TERMINAL</span>
          <span>DISCOUNT: CAPM (rf + β × ERP)</span>
          <span>ERP SOURCE: DAMODARAN (country-adjusted)</span>
          <span>⚠ EDUCATIONAL · NOT INVESTMENT ADVICE</span>
        </div>
      </main>
    </div>
  );
}
