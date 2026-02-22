"use client";
import { useState } from "react";
import Link from "next/link";
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, Legend,
} from "recharts";
import { CompanyDetail, ForecastRow } from "@/types";

// ─── helpers ────────────────────────────────────────────────────────────────
const fmt = {
  usd: (v: number) => `$${v.toFixed(2)}`,
  b: (v: number) => `$${v.toFixed(2)}B`,
  pct: (v: number) => `${v.toFixed(1)}%`,
  k: (v: number) => `${(v / 1000).toFixed(0)}K`,
  m: (v: number) => `$${(v / 1e6).toFixed(0)}M`,
};

function Panel({ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`panel ${className}`} style={{ overflow: "hidden" }}>
      <div className="panel-header">{title}</div>
      <div style={{ padding: 14 }}>{children}</div>
    </div>
  );
}

function DataCell({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div>
      <div className="data-label" style={{ marginBottom: 3 }}>{label}</div>
      <div className="data-value" style={{ color: color || "var(--text-primary)" }}>{value}</div>
    </div>
  );
}

function RecTag({ rec }: { rec: string }) {
  const map: Record<string, string> = {
    AVOID: "var(--accent-red)", BUY: "var(--accent-green)",
    HOLD: "var(--accent-amber)", SELL: "var(--accent-red)",
  };
  const c = map[rec] || "var(--text-muted)";
  return (
    <span style={{
      fontSize: 11, fontWeight: 700, letterSpacing: "0.2em",
      color: c, border: `1px solid ${c}`, background: `${c}15`,
      borderRadius: 2, padding: "3px 10px",
    }}>{rec}</span>
  );
}

const tooltipStyle = {
  contentStyle: {
    background: "var(--bg-panel)", border: "1px solid var(--border-bright)",
    borderRadius: 2, fontSize: 10, fontFamily: "'IBM Plex Mono', monospace",
    color: "var(--text-primary)",
  },
  labelStyle: { color: "var(--text-muted)", fontSize: 9, letterSpacing: "0.1em" },
};

// ─── Section: Investment Summary ─────────────────────────────────────────────
function SectionSummary({ data }: { data: CompanyDetail }) {
  return (
    <div className="stagger" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10, marginBottom: 12 }}>
      <DataCell label="Current Price" value={fmt.usd(data.price)} color="var(--accent-amber)" />
      <DataCell label="Base Intrinsic Value" value={fmt.usd(data.valuation.base)} color="var(--accent-green)" />
      <DataCell label="Upside Intrinsic Value" value={fmt.usd(data.valuation.upside)} color="var(--accent-purple)" />
      <DataCell label="Market Cap" value={`$${(data.marketCap / 1e9).toFixed(2)}B`} />
      <DataCell label="Upside to Base" value={`+${data.valuation.upsideToBase.toFixed(1)}%`} color="var(--accent-green)" />
      <DataCell label="Upside to Bull" value={`+${data.valuation.upsideToBull.toFixed(1)}%`} color="var(--accent-purple)" />
      <DataCell label="Method" value={data.valuation.method} />
      <DataCell label="Horizon" value={`${data.valuation.horizon}Y + terminal`} />
    </div>
  );
}

// ─── Section: Valuation Bar ───────────────────────────────────────────────────
function ValuationSpectrum({ data }: { data: CompanyDetail }) {
  const max = data.valuation.upside * 1.15;
  const pct = (v: number) => `${Math.min((v / max) * 100, 100).toFixed(1)}%`;

  const items = [
    { label: "CURRENT", value: data.price, color: "var(--accent-amber)" },
    { label: "BASE IV", value: data.valuation.base, color: "var(--accent-green)" },
    { label: "UPSIDE IV", value: data.valuation.upside, color: "var(--accent-purple)" },
  ];

  return (
    <Panel title="Valuation Spectrum — Price vs Intrinsic Value">
      <div style={{ position: "relative", height: 48, marginBottom: 20 }}>
        {/* Track */}
        <div style={{ position: "absolute", top: 20, left: 0, right: 0, height: 6, background: "var(--bg-secondary)", borderRadius: 3, border: "1px solid var(--border)" }} />
        {/* Fill to base */}
        <div style={{ position: "absolute", top: 20, left: 0, width: pct(data.valuation.base), height: 6, background: "rgba(0,255,136,0.2)", borderRadius: 3 }} />
        {/* Markers */}
        {items.map(item => (
          <div key={item.label} style={{ position: "absolute", top: 10, left: pct(item.value), transform: "translateX(-50%)" }}>
            <div style={{ width: 2, height: 26, background: item.color, margin: "0 auto" }} />
            <div style={{ fontSize: 8, color: item.color, letterSpacing: "0.1em", whiteSpace: "nowrap", textAlign: "center", marginTop: 2 }}>
              {item.label}<br />${item.value.toFixed(2)}
            </div>
          </div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginTop: 36 }}>
        {items.map(item => (
          <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 8, height: 8, background: item.color, borderRadius: 1, flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: 9, color: "var(--text-muted)", letterSpacing: "0.1em" }}>{item.label}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: item.color }}>${item.value.toFixed(2)}</div>
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

// ─── Section: Revenue & EBIT Chart ───────────────────────────────────────────
function ForecastCharts({ data }: { data: CompanyDetail }) {
  const [scenario, setScenario] = useState<"base" | "upside">("base");
  const sc = scenario === "base" ? data.scenarios.base : data.scenarios.upside;

  const chartData = sc.forecast.map((row: ForecastRow) => ({
    year: row.year,
    revenue: row.revenue,
    ebit: row.ebit,
    fcff: row.fcff,
    pvFCFF: row.pvFCFF,
  }));

  return (
    <div>
      {/* Scenario toggle */}
      <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
        {(["base", "upside"] as const).map(s => (
          <button
            key={s}
            onClick={() => setScenario(s)}
            style={{
              fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase",
              padding: "4px 12px", borderRadius: 2, cursor: "pointer",
              fontFamily: "'IBM Plex Mono', monospace",
              background: scenario === s ? (s === "base" ? "rgba(0,255,136,0.15)" : "rgba(167,139,250,0.15)") : "transparent",
              border: `1px solid ${scenario === s ? (s === "base" ? "var(--accent-green)" : "var(--accent-purple)") : "var(--border)"}`,
              color: scenario === s ? (s === "base" ? "var(--accent-green)" : "var(--accent-purple)") : "var(--text-muted)",
            }}
          >
            {s === "base" ? "BASE CASE" : "UPSIDE CASE"}
          </button>
        ))}
        <span style={{ fontSize: 9, color: "var(--text-muted)", alignSelf: "center", marginLeft: 8 }}>
          IV: <span style={{ color: scenario === "base" ? "var(--accent-green)" : "var(--accent-purple)", fontWeight: 700 }}>
            ${sc.intrinsicValue.toFixed(2)}
          </span>
        </span>
      </div>

      {/* Revenue chart */}
      <Panel title="Revenue Forecast (USD Billions)">
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={scenario === "base" ? "#00ff88" : "#a78bfa"} stopOpacity={0.3} />
                <stop offset="95%" stopColor={scenario === "base" ? "#00ff88" : "#a78bfa"} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="year" tick={{ fontSize: 9 }} />
            <YAxis tick={{ fontSize: 9 }} tickFormatter={v => `$${v}B`} />
            <Tooltip {...tooltipStyle} formatter={(v: number) => [`$${v.toFixed(2)}B`, "Revenue"]} />
            <Area type="monotone" dataKey="revenue" stroke={scenario === "base" ? "var(--accent-green)" : "var(--accent-purple)"} fill="url(#revGrad)" strokeWidth={1.5} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </Panel>

      {/* EBIT + FCFF */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 10 }}>
        <Panel title="EBIT (USD Billions)">
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" tick={{ fontSize: 9 }} />
              <YAxis tick={{ fontSize: 9 }} tickFormatter={v => `$${v}B`} />
              <Tooltip {...tooltipStyle} formatter={(v: number) => [`$${v.toFixed(3)}B`, "EBIT"]} />
              <ReferenceLine y={0} stroke="var(--border-bright)" strokeDasharray="3 3" />
              <Bar dataKey="ebit" fill={scenario === "base" ? "rgba(0,255,136,0.5)" : "rgba(167,139,250,0.5)"} stroke={scenario === "base" ? "var(--accent-green)" : "var(--accent-purple)"} strokeWidth={1} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>

        <Panel title="FCFF (USD Billions)">
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" tick={{ fontSize: 9 }} />
              <YAxis tick={{ fontSize: 9 }} tickFormatter={v => `$${v}B`} />
              <Tooltip {...tooltipStyle} formatter={(v: number) => [`$${v.toFixed(3)}B`, "FCFF"]} />
              <ReferenceLine y={0} stroke="var(--border-bright)" strokeDasharray="3 3" />
              <Bar dataKey="fcff" fill="rgba(56,189,248,0.4)" stroke="var(--accent-blue)" strokeWidth={1} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>
      </div>
    </div>
  );
}

// ─── Section: Forecast Table ─────────────────────────────────────────────────
function ForecastTable({ data }: { data: CompanyDetail }) {
  const [scenario, setScenario] = useState<"base" | "upside">("base");
  const sc = scenario === "base" ? data.scenarios.base : data.scenarios.upside;

  return (
    <Panel title="Forecast Table — Deliveries / Revenue / EBIT / FCFF">
      <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
        {(["base", "upside"] as const).map(s => (
          <button key={s} onClick={() => setScenario(s)} style={{
            fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase",
            padding: "3px 10px", borderRadius: 2, cursor: "pointer",
            fontFamily: "'IBM Plex Mono', monospace",
            background: scenario === s ? "rgba(56,189,248,0.12)" : "transparent",
            border: `1px solid ${scenario === s ? "var(--accent-blue)" : "var(--border)"}`,
            color: scenario === s ? "var(--accent-blue)" : "var(--text-muted)",
          }}>
            {s === "base" ? "BASE" : "UPSIDE"}
          </button>
        ))}
      </div>
      <div style={{ overflowX: "auto" }}>
        <table className="terminal-table">
          <thead>
            <tr>
              <th>Year</th>
              <th>Deliveries</th>
              <th>Revenue ($B)</th>
              <th>EBIT ($B)</th>
              <th>EBIT Margin</th>
              <th>FCFF ($B)</th>
              <th>PV(FCFF) ($B)</th>
            </tr>
          </thead>
          <tbody>
            {sc.forecast.map((row: ForecastRow) => {
              const ebitMargin = row.ebit / row.revenue * 100;
              return (
                <tr key={row.year}>
                  <td>{row.year}</td>
                  <td>{(row.deliveries / 1000).toFixed(0)}K</td>
                  <td>${row.revenue.toFixed(2)}</td>
                  <td className={row.ebit < 0 ? "negative" : "positive"}>${row.ebit.toFixed(3)}</td>
                  <td className={ebitMargin < 0 ? "negative" : "positive"}>{ebitMargin.toFixed(1)}%</td>
                  <td className={row.fcff < 0 ? "negative" : "positive"}>${row.fcff.toFixed(3)}</td>
                  <td className={row.pvFCFF < 0 ? "negative" : "positive"}>${row.pvFCFF.toFixed(3)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

// ─── Section: Key Drivers ────────────────────────────────────────────────────
function KeyDrivers({ data }: { data: CompanyDetail }) {
  const kd = data.keyDrivers;
  const quarterlyData = data.financials.quarterly.map(q => ({
    period: q.period,
    revenue: q.revenue / 1e9,
  }));

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
      <Panel title="Key Volume Drivers — 2025">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <DataCell label="FY2025 Deliveries" value={kd.deliveries2025.toLocaleString()} color="var(--accent-green)" />
          <DataCell label="YoY Delivery Growth" value={`+${kd.deliveriesGrowthYoY}%`} color="var(--accent-green)" />
          <DataCell label="Q4 2025 Deliveries (Rec.)" value={kd.q4Deliveries.toLocaleString()} color="var(--accent-blue)" />
          <DataCell label="Jan 2026 Deliveries" value={kd.jan2026Deliveries.toLocaleString()} color="var(--accent-blue)" />
          <DataCell label="Jan 2026 YoY Growth" value={`+${kd.jan2026GrowthYoY}%`} color="var(--accent-green)" />
          <DataCell label="Revenue / Vehicle" value={`$${kd.revenuePerVehicle2025E.toLocaleString()}`} />
          <DataCell label="FY2025 Revenue Proxy" value={`$${(kd.fy2025RevenueProxy / 1e9).toFixed(2)}B`} />
          <DataCell label="Q3 Pos. Op. Cash Flow" value={data.breakeven.q3PositiveOpCashFlow ? "YES ✓" : "NO"} color={data.breakeven.q3PositiveOpCashFlow ? "var(--accent-green)" : "var(--accent-red)"} />
        </div>
      </Panel>

      <Panel title="Quarterly Revenue Build — 2025 ($B)">
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={quarterlyData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="period" tick={{ fontSize: 8 }} />
            <YAxis tick={{ fontSize: 9 }} tickFormatter={v => `$${v.toFixed(1)}B`} />
            <Tooltip {...tooltipStyle} formatter={(v: number) => [`$${v.toFixed(2)}B`, "Revenue"]} />
            <Bar dataKey="revenue" fill="rgba(56,189,248,0.4)" stroke="var(--accent-blue)" strokeWidth={1} />
          </BarChart>
        </ResponsiveContainer>
      </Panel>
    </div>
  );
}

// ─── Section: Discount Rate ───────────────────────────────────────────────────
function DiscountRate({ data }: { data: CompanyDetail }) {
  const dr = data.discountRate;
  return (
    <Panel title="Discount Rate — CAPM Build">
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, marginBottom: 14 }}>
        <DataCell label="Risk-Free Rate" value={fmt.pct(dr.rf)} />
        <DataCell label="× Beta" value={dr.beta.toFixed(2)} />
        <DataCell label="Country ERP (China)" value={fmt.pct(dr.erp)} />
        <DataCell label="Cost of Equity" value={fmt.pct(dr.costOfEquity)} color="var(--accent-blue)" />
        <DataCell label="Terminal Growth" value={fmt.pct(dr.terminalGrowth)} color="var(--accent-amber)" />
      </div>
      <div style={{
        padding: "8px 12px",
        background: "var(--bg-secondary)",
        border: "1px solid var(--border)",
        borderRadius: 2,
        fontSize: 10,
        color: "var(--text-secondary)",
        fontFamily: "'IBM Plex Mono', monospace",
      }}>
        CoE = rf + β × ERP &nbsp;=&nbsp; {dr.rf}% + {dr.beta} × {dr.erp}% &nbsp;=&nbsp;
        <span style={{ color: "var(--accent-blue)", fontWeight: 700 }}>{dr.costOfEquity.toFixed(3)}%</span>
        {dr.fxRMBtoUSD && (
          <span style={{ marginLeft: 24, color: "var(--text-muted)" }}>
            FX: 1 USD = {dr.fxRMBtoUSD} RMB (constant)
          </span>
        )}
      </div>
    </Panel>
  );
}

// ─── Section: Reverse DCF ─────────────────────────────────────────────────────
function ReverseDCF({ data }: { data: CompanyDetail }) {
  const r = data.reverseDCF;
  return (
    <Panel title="Reverse DCF — What the Market Implies at $5.07">
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 14 }}>
        <div>
          <div className="data-label" style={{ marginBottom: 4 }}>Implied Terminal EBIT Margin</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: "var(--accent-amber)", fontFamily: "'IBM Plex Mono', monospace" }}>
            {r.impliedTerminalEBITMargin.toFixed(2)}%
          </div>
          <div style={{ fontSize: 9, color: "var(--text-muted)", marginTop: 3 }}>Holding Base delivery growth path constant</div>
        </div>
        <div>
          <div className="data-label" style={{ marginBottom: 4 }}>Implied Delivery Scale Factor</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: "var(--accent-amber)", fontFamily: "'IBM Plex Mono', monospace" }}>
            {r.impliedScaleFactor.toFixed(3)}×
          </div>
          <div style={{ fontSize: 9, color: "var(--text-muted)", marginTop: 3 }}>Holding Base EBIT margin path constant</div>
        </div>
      </div>
      <div style={{
        padding: "10px 14px",
        background: "rgba(255,184,48,0.06)",
        border: "1px solid rgba(255,184,48,0.3)",
        borderRadius: 2,
        fontSize: 11,
        color: "var(--text-secondary)",
        lineHeight: 1.6,
      }}>
        <span style={{ color: "var(--accent-amber)", fontWeight: 600 }}>MARKET READS: </span>
        {r.interpretation}
      </div>
    </Panel>
  );
}

// ─── Section: EV→Equity Bridge ───────────────────────────────────────────────
function Bridge({ data }: { data: CompanyDetail }) {
  const b = data.bridge;
  const mc = data.marketCap;
  const ev = mc + b.borrowings + b.mezzanine - b.cash;

  const items = [
    { label: "Market Cap", value: mc, sign: 1, color: "var(--accent-amber)" },
    { label: "+ Borrowings", value: b.borrowings, sign: 1, color: "var(--accent-red)" },
    { label: "+ Mezzanine", value: b.mezzanine, sign: 1, color: "var(--accent-red)" },
    { label: "− Cash & Liquid Assets", value: -b.cash, sign: -1, color: "var(--accent-green)" },
    { label: "= Enterprise Value", value: ev, sign: 1, color: "var(--accent-blue)" },
  ];

  return (
    <Panel title="EV → Equity Bridge (FY2024 Annual Report)">
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {items.map((item, i) => {
          const isResult = i === items.length - 1;
          return (
            <div key={item.label} style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "6px 10px",
              background: isResult ? "rgba(56,189,248,0.08)" : "transparent",
              border: isResult ? "1px solid rgba(56,189,248,0.3)" : "none",
              borderTop: isResult ? undefined : (i === 0 ? "1px solid var(--border)" : "none"),
              borderRadius: isResult ? 2 : 0,
            }}>
              <span style={{ fontSize: 10, color: isResult ? "var(--text-primary)" : "var(--text-secondary)" }}>
                {item.label}
              </span>
              <span style={{ fontSize: 11, fontWeight: 700, color: item.color, fontFamily: "'IBM Plex Mono', monospace" }}>
                ${(Math.abs(item.value) / 1e9).toFixed(3)}B
              </span>
            </div>
          );
        })}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginTop: 12 }}>
        <DataCell label="EV/Sales 2025E" value={`${data.multiples.evSales2025E?.toFixed(2)}×`} color="var(--accent-blue)" />
        <DataCell label="P/Sales 2025E" value={`${data.multiples.pSales2025E?.toFixed(2)}×`} color="var(--accent-blue)" />
        <DataCell label="P/Book (Sep 25)" value={`${data.multiples.pBook?.toFixed(1)}×`} color="var(--accent-blue)" />
      </div>
    </Panel>
  );
}

// ─── Section: Risks ───────────────────────────────────────────────────────────
function Risks({ data }: { data: CompanyDetail }) {
  return (
    <Panel title="Risk Register">
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {data.risks.map(risk => (
          <div key={risk.rank} style={{
            display: "flex", gap: 12, padding: "8px 10px",
            background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: 2,
          }}>
            <div style={{
              flexShrink: 0, width: 22, height: 22, border: "1px solid var(--accent-red)",
              borderRadius: 2, display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 9, fontWeight: 700, color: "var(--accent-red)",
            }}>{risk.rank}</div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-primary)", marginBottom: 2 }}>{risk.title}</div>
              <div style={{ fontSize: 10, color: "var(--text-secondary)", lineHeight: 1.5 }}>{risk.detail}</div>
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

// ─── Section: Management Qs ───────────────────────────────────────────────────
function ManagementQs({ data }: { data: CompanyDetail }) {
  return (
    <Panel title="Management Questions — Model-Linked">
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {data.managementQuestions.map((q, i) => (
          <div key={i} style={{
            display: "flex", gap: 12, padding: "8px 10px",
            borderBottom: i < data.managementQuestions.length - 1 ? "1px solid var(--border)" : "none",
          }}>
            <span style={{ fontSize: 11, color: "var(--accent-blue)", fontWeight: 700, flexShrink: 0 }}>Q{i + 1}</span>
            <span style={{ fontSize: 10, color: "var(--text-secondary)", lineHeight: 1.6 }}>{q}</span>
          </div>
        ))}
      </div>
    </Panel>
  );
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────
const TABS = [
  { id: "summary",   label: "SUMMARY" },
  { id: "forecast",  label: "FORECAST" },
  { id: "drivers",   label: "DRIVERS" },
  { id: "dcf",       label: "DCF INPUTS" },
  { id: "risks",     label: "RISKS" },
];

// ─── Main Export ──────────────────────────────────────────────────────────────
export default function CompanyReport({ data }: { data: CompanyDetail }) {
  const [tab, setTab] = useState("summary");

  return (
    <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 0 40px" }}>
      {/* Breadcrumb + header */}
      <div style={{
        padding: "12px 24px",
        borderBottom: "1px solid var(--border)",
        background: "var(--bg-secondary)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        <div>
          <div style={{ fontSize: 9, color: "var(--text-muted)", marginBottom: 4 }}>
            <Link href="/" style={{ color: "var(--accent-blue)", textDecoration: "none" }}>← COVERAGE</Link>
            {" "}/{" "}{data.ticker}
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
            <span style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)" }}>{data.ticker}</span>
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{data.name}</span>
            <span style={{ fontSize: 10, color: "var(--text-muted)" }}>{data.exchange} · {data.instrument}</span>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 9, color: "var(--text-muted)", marginBottom: 2 }}>AS OF {data.asOfDate}</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "var(--accent-amber)" }}>${data.price.toFixed(2)}</div>
          </div>
          <RecTag rec={data.recommendation} />
        </div>
      </div>

      {/* Thesis bar */}
      <div style={{
        padding: "10px 24px",
        background: "rgba(56,189,248,0.04)",
        borderBottom: "1px solid var(--border)",
        fontSize: 10, color: "var(--text-secondary)", lineHeight: 1.6,
      }}>
        <span style={{ color: "var(--accent-blue)", fontWeight: 600, marginRight: 8 }}>THESIS</span>
        {data.thesis}
      </div>

      {/* Tab bar */}
      <div style={{
        display: "flex",
        gap: 0,
        borderBottom: "1px solid var(--border)",
        background: "var(--bg-secondary)",
        padding: "0 24px",
      }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              fontSize: 9, letterSpacing: "0.14em", fontWeight: 600,
              padding: "10px 16px", cursor: "pointer", border: "none",
              borderBottom: tab === t.id ? "2px solid var(--accent-blue)" : "2px solid transparent",
              background: "transparent",
              color: tab === t.id ? "var(--accent-blue)" : "var(--text-muted)",
              fontFamily: "'IBM Plex Mono', monospace",
              transition: "color 0.15s",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div style={{ padding: "16px 24px" }} className="fade-in">
        {tab === "summary" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <Panel title="Investment Summary">
              <SectionSummary data={data} />
              {/* Catalysts */}
              <div style={{ marginTop: 12, borderTop: "1px solid var(--border)", paddingTop: 12 }}>
                <div className="data-label" style={{ marginBottom: 6 }}>CATALYSTS</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {data.catalysts.map((c, i) => (
                    <div key={i} style={{ display: "flex", gap: 8, fontSize: 10, color: "var(--text-secondary)" }}>
                      <span style={{ color: "var(--accent-green)" }}>→</span>
                      <span>{c}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Panel>
            <ValuationSpectrum data={data} />
            <ReverseDCF data={data} />
            <Bridge data={data} />
          </div>
        )}

        {tab === "forecast" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <ForecastCharts data={data} />
            <ForecastTable data={data} />
          </div>
        )}

        {tab === "drivers" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <KeyDrivers data={data} />
            {/* Breakeven evidence */}
            <Panel title="Breakeven Evidence — Q3/Q4 2025">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12 }}>
                <DataCell label="Q3 Positive Op. CF" value="YES ✓" color="var(--accent-green)" />
                <DataCell label="Q3 Pos. CF Net of Capex" value="YES ✓" color="var(--accent-green)" />
                <DataCell label="Q4 GAAP Op. Profit" value="$29M–$100M" color="var(--accent-amber)" />
                <DataCell label="Q4 Non-GAAP Op. Profit" value="$100M–$172M" color="var(--accent-green)" />
              </div>
            </Panel>
          </div>
        )}

        {tab === "dcf" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <DiscountRate data={data} />
            {/* Scenario assumptions side-by-side */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {(["base", "upside"] as const).map(s => {
                const sc = s === "base" ? data.scenarios.base : data.scenarios.upside;
                const color = s === "base" ? "var(--accent-green)" : "var(--accent-purple)";
                return (
                  <Panel key={s} title={`${sc.label} Case Assumptions`}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
                      <DataCell label="Intrinsic Value" value={`$${sc.intrinsicValue.toFixed(2)}`} color={color} />
                      <DataCell label="Sales-to-Capital" value={`${sc.salestoCapital}×`} />
                    </div>
                    <div style={{ marginBottom: 8 }}>
                      <div className="data-label" style={{ marginBottom: 6 }}>Delivery Growth Path (2026–2034)</div>
                      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                        {sc.deliveryGrowthPath.map((g, i) => (
                          <span key={i} style={{
                            fontSize: 9, padding: "2px 6px",
                            background: `${color}15`, border: `1px solid ${color}40`,
                            borderRadius: 2, color: color,
                          }}>{g}%</span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="data-label" style={{ marginBottom: 6 }}>EBIT Margin Path</div>
                      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                        {sc.ebitMarginPath.map((m, i) => (
                          <span key={i} style={{
                            fontSize: 9, padding: "2px 6px",
                            background: "rgba(56,189,248,0.1)", border: "1px solid rgba(56,189,248,0.3)",
                            borderRadius: 2, color: "var(--accent-blue)",
                          }}>{m}%</span>
                        ))}
                      </div>
                    </div>
                  </Panel>
                );
              })}
            </div>
          </div>
        )}

        {tab === "risks" && (
          <div style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: 12 }}>
            <Risks data={data} />
            <ManagementQs data={data} />
          </div>
        )}
      </div>
    </div>
  );
}
