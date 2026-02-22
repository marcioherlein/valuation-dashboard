"use client";
import { useState } from "react";
import Link from "next/link";
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from "recharts";
import { CompanyDetail, ForecastRow } from "@/types";

// ─── Shared styles ────────────────────────────────────────────────────────────
const FONT = "'IBM Plex Sans', sans-serif";
const MONO = "'IBM Plex Mono', monospace";

const BLUE  = "#0057d2";
const BLUE2 = "#3b8ef3";
const BLUE3 = "#eaf2ff";
const GREEN  = "#107e3e";
const GREEN2 = "#f0faf5";
const RED    = "#bb0000";
const RED2   = "#fff5f5";
const AMBER  = "#e76500";
const AMBER2 = "#fff8f0";

const tooltipStyle = {
  contentStyle: {
    background: "#ffffff",
    border: "1px solid #d1d5db",
    borderRadius: 6,
    fontSize: 11,
    fontFamily: FONT,
    color: "#1d2d3e",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
  },
  labelStyle: { color: "#8696a9", fontSize: 10 },
};

// ─── Tiny helpers ─────────────────────────────────────────────────────────────
function Panel({ title, children, style = {} }: { title: string; children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div className="panel" style={{ overflow: "hidden", ...style }}>
      <div className="panel-header">
        <div style={{ width: 3, height: 14, background: BLUE, borderRadius: 2 }} />
        {title}
      </div>
      <div style={{ padding: 16 }}>{children}</div>
    </div>
  );
}

function DataCell({ label, value, color, large }: { label: string; value: string; color?: string; large?: boolean }) {
  return (
    <div>
      <div className="data-label" style={{ marginBottom: 4 }}>{label}</div>
      <div style={{
        fontSize: large ? 20 : 14,
        fontWeight: 700,
        color: color || "#1d2d3e",
        fontFamily: MONO,
        lineHeight: 1.2,
      }}>{value}</div>
    </div>
  );
}

function RecTag({ rec }: { rec: string }) {
  const styles: Record<string, { color: string; bg: string; border: string }> = {
    BUY:   { color: GREEN,  bg: GREEN2, border: "#a3d9b8" },
    HOLD:  { color: AMBER,  bg: AMBER2, border: "#f9c784" },
    AVOID: { color: RED,    bg: RED2,   border: "#f5c0c0" },
    SELL:  { color: RED,    bg: RED2,   border: "#f5c0c0" },
  };
  const s = styles[rec] || styles.HOLD;
  return (
    <span style={{
      fontSize: 11, fontWeight: 700, letterSpacing: "0.08em",
      color: s.color, background: s.bg,
      border: `1px solid ${s.border}`,
      borderRadius: 4, padding: "4px 12px",
      fontFamily: FONT,
    }}>
      {rec}
    </span>
  );
}

function ScenarioToggle({
  scenario, setScenario
}: { scenario: "base" | "upside"; setScenario: (s: "base" | "upside") => void }) {
  return (
    <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
      {(["base", "upside"] as const).map(s => {
        const active = scenario === s;
        const color = s === "base" ? GREEN : BLUE;
        return (
          <button key={s} onClick={() => setScenario(s)} style={{
            fontSize: 11, fontWeight: 600, letterSpacing: "0.04em",
            padding: "5px 14px", borderRadius: 4, cursor: "pointer",
            fontFamily: FONT,
            background: active ? (s === "base" ? GREEN2 : BLUE3) : "#f8f9fa",
            border: `1px solid ${active ? color : "#d1d5db"}`,
            color: active ? color : "#8696a9",
            transition: "all 0.15s",
          }}>
            {s === "base" ? "Base Case" : "Upside Case"}
          </button>
        );
      })}
    </div>
  );
}

// ─── Section: Summary Metrics ─────────────────────────────────────────────────
function SummaryMetrics({ data }: { data: CompanyDetail }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 0 }}>
      {[
        { label: "Current Price",       value: `$${data.price.toFixed(2)}`,                   color: AMBER },
        { label: "Base Intrinsic Value",value: `$${data.valuation.base.toFixed(2)}`,           color: GREEN },
        { label: "Upside Intrinsic Val.",value: `$${data.valuation.upside.toFixed(2)}`,         color: BLUE  },
        { label: "Market Cap",          value: `$${(data.marketCap / 1e9).toFixed(2)}B`,        color: "#1d2d3e" },
        { label: "Upside to Base",      value: `+${data.valuation.upsideToBase.toFixed(1)}%`,  color: GREEN },
        { label: "Upside to Bull",      value: `+${data.valuation.upsideToBull.toFixed(1)}%`,  color: BLUE  },
        { label: "Valuation Method",    value: data.valuation.method,                          color: "#1d2d3e" },
        { label: "Explicit Horizon",    value: `${data.valuation.horizon}Y + terminal`,        color: "#1d2d3e" },
      ].map(item => (
        <div key={item.label} style={{
          padding: "12px 14px",
          background: "#f8f9fa",
          border: "1px solid #e5e7eb",
          borderRadius: 6,
        }}>
          <DataCell label={item.label} value={item.value} color={item.color} />
        </div>
      ))}
    </div>
  );
}

// ─── Section: Valuation Spectrum ──────────────────────────────────────────────
function ValuationSpectrum({ data }: { data: CompanyDetail }) {
  const max = data.valuation.upside * 1.15;
  const pct = (v: number) => `${Math.min((v / max) * 100, 100).toFixed(1)}%`;

  const markers = [
    { label: "Current Price", value: data.price, color: AMBER, sublabel: "Market" },
    { label: "Base IV",       value: data.valuation.base,   color: GREEN, sublabel: "Base case" },
    { label: "Upside IV",     value: data.valuation.upside, color: BLUE,  sublabel: "Upside case" },
  ];

  return (
    <Panel title="Valuation Spectrum — Price vs. Intrinsic Value">
      {/* Bar */}
      <div style={{ position: "relative", height: 56, marginBottom: 8 }}>
        {/* Track */}
        <div style={{
          position: "absolute", top: 20, left: 0, right: 0, height: 10,
          background: "#f0f4ff", borderRadius: 6, border: "1px solid #d6e4f7",
        }} />
        {/* Filled to base */}
        <div style={{
          position: "absolute", top: 20, left: 0, width: pct(data.valuation.base), height: 10,
          background: "linear-gradient(90deg, #c8dcf8, #3b8ef3)",
          borderRadius: 6,
        }} />
        {/* Markers */}
        {markers.map(m => (
          <div key={m.label} style={{
            position: "absolute", top: 12, left: pct(m.value),
            transform: "translateX(-50%)", zIndex: 3,
          }}>
            <div style={{ width: 2, height: 26, background: m.color, margin: "0 auto", borderRadius: 2 }} />
            <div style={{ fontSize: 9, color: m.color, fontWeight: 700, whiteSpace: "nowrap", textAlign: "center", marginTop: 3 }}>
              ${m.value.toFixed(2)}
            </div>
          </div>
        ))}
      </div>

      {/* Legend cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginTop: 18 }}>
        {markers.map(m => (
          <div key={m.label} style={{
            padding: "10px 14px",
            background: m.color === AMBER ? AMBER2 : m.color === GREEN ? GREEN2 : BLUE3,
            border: `1px solid ${m.color === AMBER ? "#f9c784" : m.color === GREEN ? "#a3d9b8" : "#c8dcf8"}`,
            borderRadius: 6,
            borderLeft: `3px solid ${m.color}`,
          }}>
            <div style={{ fontSize: 10, color: "#8696a9", fontWeight: 600, marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              {m.label}
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: m.color, fontFamily: MONO }}>
              ${m.value.toFixed(2)}
            </div>
            <div style={{ fontSize: 10, color: "#556b82", marginTop: 2 }}>{m.sublabel}</div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

// ─── Section: Reverse DCF ─────────────────────────────────────────────────────
function ReverseDCF({ data }: { data: CompanyDetail }) {
  const r = data.reverseDCF;
  return (
    <Panel title="Reverse DCF — What the Market Implies at Current Price">
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 14 }}>
        {[
          { label: "Implied Terminal EBIT Margin", value: `${r.impliedTerminalEBITMargin.toFixed(2)}%`, sub: "Holding Base delivery growth path" },
          { label: "Implied Delivery Scale Factor", value: `${r.impliedScaleFactor.toFixed(3)}×`, sub: "Holding Base EBIT margin path" },
        ].map(item => (
          <div key={item.label} style={{
            padding: "14px 16px",
            background: AMBER2,
            border: `1px solid #f9c784`,
            borderLeft: `3px solid ${AMBER}`,
            borderRadius: 6,
          }}>
            <div className="data-label" style={{ marginBottom: 6 }}>{item.label}</div>
            <div style={{ fontSize: 26, fontWeight: 700, color: AMBER, fontFamily: MONO }}>{item.value}</div>
            <div style={{ fontSize: 10, color: "#8696a9", marginTop: 4 }}>{item.sub}</div>
          </div>
        ))}
      </div>
      <div style={{
        padding: "10px 14px",
        background: "#fffbf0",
        border: "1px solid #f9c784",
        borderRadius: 6,
        fontSize: 12,
        color: "#556b82",
        lineHeight: 1.6,
      }}>
        <span style={{ fontWeight: 700, color: AMBER }}>Market read: </span>
        {r.interpretation}
      </div>
    </Panel>
  );
}

// ─── Section: Forecast Charts ─────────────────────────────────────────────────
function ForecastCharts({ data }: { data: CompanyDetail }) {
  const [scenario, setScenario] = useState<"base" | "upside">("base");
  const sc = scenario === "base" ? data.scenarios.base : data.scenarios.upside;
  const color = scenario === "base" ? GREEN : BLUE;
  const colorLight = scenario === "base" ? "#a3d9b8" : "#c8dcf8";

  const chartData = sc.forecast.map((row: ForecastRow) => ({
    year: row.year, revenue: row.revenue, ebit: row.ebit, fcff: row.fcff, pvFCFF: row.pvFCFF,
  }));

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <ScenarioToggle scenario={scenario} setScenario={setScenario} />
        <span style={{ fontSize: 12, color: "#556b82", fontFamily: MONO, fontWeight: 700 }}>
          IV: <span style={{ color }}>$ {sc.intrinsicValue.toFixed(2)}</span>
        </span>
      </div>

      <Panel title="Revenue Forecast (USD Billions)">
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={color} stopOpacity={0.2} />
                <stop offset="95%" stopColor={color} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="year" tick={{ fontSize: 10, fontFamily: FONT }} />
            <YAxis tick={{ fontSize: 10, fontFamily: FONT }} tickFormatter={v => `$${v}B`} />
            <Tooltip {...tooltipStyle} formatter={(v: number) => [`$${v.toFixed(2)}B`, "Revenue"]} />
            <Area type="monotone" dataKey="revenue" stroke={color} fill="url(#revGrad)" strokeWidth={2} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </Panel>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
        <Panel title="EBIT (USD Billions)">
          <ResponsiveContainer width="100%" height={170}>
            <BarChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" tick={{ fontSize: 9, fontFamily: FONT }} />
              <YAxis tick={{ fontSize: 9, fontFamily: FONT }} tickFormatter={v => `$${v}B`} />
              <Tooltip {...tooltipStyle} formatter={(v: number) => [`$${v.toFixed(3)}B`, "EBIT"]} />
              <ReferenceLine y={0} stroke="#d1d5db" strokeDasharray="4 4" />
              <Bar dataKey="ebit" fill={colorLight} stroke={color} strokeWidth={1} radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>

        <Panel title="FCFF (USD Billions)">
          <ResponsiveContainer width="100%" height={170}>
            <BarChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" tick={{ fontSize: 9, fontFamily: FONT }} />
              <YAxis tick={{ fontSize: 9, fontFamily: FONT }} tickFormatter={v => `$${v}B`} />
              <Tooltip {...tooltipStyle} formatter={(v: number) => [`$${v.toFixed(3)}B`, "FCFF"]} />
              <ReferenceLine y={0} stroke="#d1d5db" strokeDasharray="4 4" />
              <Bar dataKey="fcff" fill="#c8dcf8" stroke={BLUE2} strokeWidth={1} radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>
      </div>
    </div>
  );
}

// ─── Section: Forecast Table ──────────────────────────────────────────────────
function ForecastTable({ data }: { data: CompanyDetail }) {
  const [scenario, setScenario] = useState<"base" | "upside">("base");
  const sc = scenario === "base" ? data.scenarios.base : data.scenarios.upside;

  return (
    <Panel title="Detailed Forecast Table">
      <ScenarioToggle scenario={scenario} setScenario={setScenario} />
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
              const margin = (row.ebit / row.revenue) * 100;
              return (
                <tr key={row.year}>
                  <td>{row.year}</td>
                  <td>{(row.deliveries / 1000).toFixed(0)}K</td>
                  <td>${row.revenue.toFixed(2)}</td>
                  <td className={row.ebit < 0 ? "negative" : "positive"}>${row.ebit.toFixed(3)}</td>
                  <td className={margin < 0 ? "negative" : "positive"}>{margin.toFixed(1)}%</td>
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

// ─── Section: Key Drivers ─────────────────────────────────────────────────────
function KeyDrivers({ data }: { data: CompanyDetail }) {
  const kd = data.keyDrivers;
  const quarterly = data.financials.quarterly.map(q => ({
    period: q.period.replace(" 2025", "").replace(" 2025E", "E"),
    revenue: q.revenue / 1e9,
  }));

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
      <Panel title="Volume & Revenue Drivers — 2025">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {[
            { label: "FY2025 Deliveries",      value: kd.deliveries2025.toLocaleString(),       color: GREEN },
            { label: "YoY Growth",             value: `+${kd.deliveriesGrowthYoY}%`,            color: GREEN },
            { label: "Q4 Deliveries (record)", value: kd.q4Deliveries.toLocaleString(),          color: BLUE },
            { label: "Jan 2026 Deliveries",    value: kd.jan2026Deliveries.toLocaleString(),     color: BLUE },
            { label: "Jan 2026 YoY Growth",    value: `+${kd.jan2026GrowthYoY}%`,               color: GREEN },
            { label: "Revenue / Vehicle",      value: `$${kd.revenuePerVehicle2025E.toLocaleString()}`, color: "#1d2d3e" },
            { label: "FY2025 Revenue Proxy",   value: `$${(kd.fy2025RevenueProxy / 1e9).toFixed(2)}B`, color: "#1d2d3e" },
            { label: "Q3 Pos. Operating CF",   value: data.breakeven.q3PositiveOpCashFlow ? "Yes ✓" : "No", color: data.breakeven.q3PositiveOpCashFlow ? GREEN : RED },
          ].map(item => (
            <div key={item.label} style={{ padding: "8px 10px", background: "#f8f9fa", border: "1px solid #e5e7eb", borderRadius: 4 }}>
              <DataCell label={item.label} value={item.value} color={item.color} />
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Quarterly Revenue Build — 2025 ($B)">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={quarterly} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="period" tick={{ fontSize: 10, fontFamily: FONT }} />
            <YAxis tick={{ fontSize: 10, fontFamily: FONT }} tickFormatter={v => `$${v.toFixed(1)}B`} />
            <Tooltip {...tooltipStyle} formatter={(v: number) => [`$${v.toFixed(2)}B`, "Revenue"]} />
            <Bar dataKey="revenue" fill="#c8dcf8" stroke={BLUE} strokeWidth={1} radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Panel>
    </div>
  );
}

// ─── Section: Discount Rate ────────────────────────────────────────────────────
function DiscountRate({ data }: { data: CompanyDetail }) {
  const dr = data.discountRate;
  return (
    <Panel title="Discount Rate — CAPM Build">
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10, marginBottom: 14 }}>
        {[
          { label: "Risk-Free Rate", value: `${dr.rf.toFixed(2)}%` },
          { label: "Beta", value: dr.beta.toFixed(2) },
          { label: "China ERP", value: `${dr.erp.toFixed(2)}%` },
          { label: "Cost of Equity", value: `${dr.costOfEquity.toFixed(3)}%`, color: BLUE },
          { label: "Terminal Growth", value: `${dr.terminalGrowth.toFixed(1)}%`, color: AMBER },
        ].map(item => (
          <div key={item.label} style={{ padding: "10px 12px", background: "#f8f9fa", border: "1px solid #e5e7eb", borderRadius: 4 }}>
            <DataCell label={item.label} value={item.value} color={item.color} />
          </div>
        ))}
      </div>
      <div style={{
        padding: "10px 14px",
        background: BLUE3,
        border: "1px solid #c8dcf8",
        borderRadius: 6,
        fontSize: 12,
        fontFamily: MONO,
        color: "#556b82",
      }}>
        CoE = rf + β × ERP &nbsp;=&nbsp;
        {dr.rf}% + {dr.beta} × {dr.erp}% &nbsp;=&nbsp;
        <span style={{ color: BLUE, fontWeight: 700 }}>{dr.costOfEquity.toFixed(3)}%</span>
        {dr.fxRMBtoUSD && (
          <span style={{ marginLeft: 24, color: "#8696a9", fontSize: 11 }}>
            FX constant: 1 USD = {dr.fxRMBtoUSD} RMB
          </span>
        )}
      </div>
    </Panel>
  );
}

// ─── Section: Scenario Assumptions ───────────────────────────────────────────
function ScenarioAssumptions({ data }: { data: CompanyDetail }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
      {(["base", "upside"] as const).map(s => {
        const sc = data.scenarios[s];
        const color = s === "base" ? GREEN : BLUE;
        const bg    = s === "base" ? GREEN2 : BLUE3;
        const border = s === "base" ? "#a3d9b8" : "#c8dcf8";
        return (
          <Panel key={s} title={`${sc.label} Case Assumptions`}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
              <div style={{ padding: "10px 12px", background: bg, border: `1px solid ${border}`, borderRadius: 4 }}>
                <DataCell label="Intrinsic Value" value={`$${sc.intrinsicValue.toFixed(2)}`} color={color} />
              </div>
              <div style={{ padding: "10px 12px", background: "#f8f9fa", border: "1px solid #e5e7eb", borderRadius: 4 }}>
                <DataCell label="Sales-to-Capital" value={`${sc.salestoCapital}×`} />
              </div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <div className="data-label" style={{ marginBottom: 6 }}>Delivery Growth Path (2026–2034)</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                {sc.deliveryGrowthPath.map((g, i) => (
                  <span key={i} style={{
                    fontSize: 11, padding: "3px 8px", fontFamily: MONO,
                    background: bg, border: `1px solid ${border}`,
                    borderRadius: 3, color, fontWeight: 600,
                  }}>{g}%</span>
                ))}
              </div>
            </div>
            <div>
              <div className="data-label" style={{ marginBottom: 6 }}>EBIT Margin Path</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                {sc.ebitMarginPath.map((m, i) => (
                  <span key={i} style={{
                    fontSize: 11, padding: "3px 8px", fontFamily: MONO,
                    background: BLUE3, border: "1px solid #c8dcf8",
                    borderRadius: 3, color: BLUE, fontWeight: 600,
                  }}>{m}%</span>
                ))}
              </div>
            </div>
          </Panel>
        );
      })}
    </div>
  );
}

// ─── Section: EV Bridge ────────────────────────────────────────────────────────
function Bridge({ data }: { data: CompanyDetail }) {
  const b = data.bridge;
  const mc = data.marketCap;
  const ev = mc + b.borrowings + b.mezzanine - b.cash;

  const rows = [
    { label: "Market Cap",              value: mc,          color: AMBER,        sign: "" },
    { label: "+ Borrowings",            value: b.borrowings, color: RED,          sign: "+" },
    { label: "+ Redeemable NCI (mezz)", value: b.mezzanine,  color: RED,          sign: "+" },
    { label: "− Cash & Liquid Assets",  value: b.cash,       color: GREEN,        sign: "−" },
  ];

  return (
    <Panel title="EV → Equity Bridge (FY2024 Annual Report)">
      <div style={{ marginBottom: 14 }}>
        {rows.map((row, i) => (
          <div key={row.label} style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "8px 12px",
            borderBottom: "1px solid #f0f0f0",
            background: i % 2 === 0 ? "#fafafa" : "#ffffff",
          }}>
            <span style={{ fontSize: 12, color: "#556b82", fontFamily: FONT }}>{row.label}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: row.color, fontFamily: MONO }}>
              {row.sign} ${(row.value / 1e9).toFixed(3)}B
            </span>
          </div>
        ))}
        {/* EV result */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "10px 12px",
          background: BLUE3, border: `1px solid #c8dcf8`,
          borderRadius: 4, marginTop: 6,
        }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#1d2d3e" }}>= Enterprise Value</span>
          <span style={{ fontSize: 16, fontWeight: 700, color: BLUE, fontFamily: MONO }}>
            ${(ev / 1e9).toFixed(3)}B
          </span>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
        {[
          { label: "EV / Sales 2025E", value: `${data.multiples.evSales2025E?.toFixed(2)}×` },
          { label: "P / Sales 2025E",  value: `${data.multiples.pSales2025E?.toFixed(2)}×` },
          { label: "P / Book (Sep 25)",value: `${data.multiples.pBook?.toFixed(1)}×` },
        ].map(m => (
          <div key={m.label} style={{ padding: "8px 12px", background: "#f8f9fa", border: "1px solid #e5e7eb", borderRadius: 4 }}>
            <DataCell label={m.label} value={m.value} color={BLUE} />
          </div>
        ))}
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
            display: "flex", gap: 12, padding: "10px 12px",
            background: "#fafafa", border: "1px solid #e5e7eb",
            borderRadius: 6,
            borderLeft: "3px solid #f5c0c0",
          }}>
            <div style={{
              flexShrink: 0, width: 24, height: 24,
              background: RED2, border: `1px solid #f5c0c0`,
              borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 10, fontWeight: 700, color: RED, fontFamily: MONO,
            }}>
              {risk.rank}
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#1d2d3e", marginBottom: 3, fontFamily: FONT }}>
                {risk.title}
              </div>
              <div style={{ fontSize: 11, color: "#556b82", lineHeight: 1.6, fontFamily: FONT }}>
                {risk.detail}
              </div>
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

// ─── Section: Management Questions ────────────────────────────────────────────
function ManagementQs({ data }: { data: CompanyDetail }) {
  return (
    <Panel title="Management Questions — Model-Linked">
      <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
        {data.managementQuestions.map((q, i) => (
          <div key={i} style={{
            display: "flex", gap: 14, padding: "10px 0",
            borderBottom: i < data.managementQuestions.length - 1 ? "1px solid #f0f0f0" : "none",
          }}>
            <span style={{
              flexShrink: 0, fontSize: 11, fontWeight: 700,
              color: BLUE, fontFamily: MONO,
              background: BLUE3, border: "1px solid #c8dcf8",
              borderRadius: 4, padding: "2px 8px", height: "fit-content",
            }}>
              Q{i + 1}
            </span>
            <span style={{ fontSize: 12, color: "#556b82", lineHeight: 1.6, fontFamily: FONT }}>{q}</span>
          </div>
        ))}
      </div>
    </Panel>
  );
}

// ─── Tabs definition ──────────────────────────────────────────────────────────
const TABS = [
  { id: "summary",  label: "Summary" },
  { id: "forecast", label: "Forecast & Charts" },
  { id: "drivers",  label: "Key Drivers" },
  { id: "dcf",      label: "DCF Inputs" },
  { id: "risks",    label: "Risks & Questions" },
];

// ─── Main Export ──────────────────────────────────────────────────────────────
export default function CompanyReport({ data }: { data: CompanyDetail }) {
  const [tab, setTab] = useState("summary");

  return (
    <div style={{ maxWidth: 1280, margin: "0 auto", paddingBottom: 48 }}>
      {/* Company header */}
      <div style={{
        background: "#ffffff",
        borderBottom: "1px solid #e5e7eb",
      }}>
        <div style={{ padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 11, color: "#8696a9", marginBottom: 6, fontFamily: FONT }}>
              <Link href="/" style={{ color: BLUE }}>← Coverage Universe</Link>
              {" / "}{data.ticker}
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
              <span style={{ fontSize: 22, fontWeight: 700, color: "#1d2d3e", fontFamily: FONT }}>{data.ticker}</span>
              <span style={{ fontSize: 14, color: "#556b82", fontFamily: FONT }}>{data.name}</span>
              <span style={{
                fontSize: 10, background: BLUE3, color: BLUE,
                border: "1px solid #c8dcf8", borderRadius: 3,
                padding: "2px 7px", fontWeight: 600,
              }}>{data.exchange} · {data.instrument}</span>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 10, color: "#8696a9", marginBottom: 2, fontFamily: FONT }}>As of {data.asOfDate}</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: AMBER, fontFamily: MONO }}>${data.price.toFixed(2)}</div>
            </div>
            <RecTag rec={data.recommendation} />
          </div>
        </div>

        {/* Thesis */}
        <div style={{
          padding: "10px 24px 14px",
          borderTop: "1px solid #f0f4ff",
          background: BLUE3,
          fontSize: 12, color: "#556b82", lineHeight: 1.6, fontFamily: FONT,
        }}>
          <span style={{ fontWeight: 700, color: BLUE }}>Thesis: </span>
          {data.thesis}
        </div>

        {/* Tabs */}
        <div style={{
          display: "flex", gap: 0,
          borderTop: "1px solid #e5e7eb",
          padding: "0 24px",
          background: "#ffffff",
        }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              fontSize: 12, fontWeight: tab === t.id ? 700 : 500,
              padding: "10px 16px", cursor: "pointer",
              border: "none", borderBottom: `2px solid ${tab === t.id ? BLUE : "transparent"}`,
              background: "transparent",
              color: tab === t.id ? BLUE : "#8696a9",
              fontFamily: FONT,
              transition: "all 0.15s",
            }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div style={{ padding: "20px 24px" }} className="fade-in" key={tab}>
        {tab === "summary" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Panel title="Investment Summary">
              <SummaryMetrics data={data} />
              <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid #e5e7eb" }}>
                <div className="data-label" style={{ marginBottom: 8 }}>Catalysts</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {data.catalysts.map((c, i) => (
                    <div key={i} style={{ display: "flex", gap: 10, fontSize: 12, color: "#556b82", fontFamily: FONT }}>
                      <span style={{ color: GREEN, fontWeight: 700, flexShrink: 0 }}>→</span>
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
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <ForecastCharts data={data} />
            <ForecastTable data={data} />
          </div>
        )}

        {tab === "drivers" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <KeyDrivers data={data} />
            <Panel title="Breakeven Evidence — Q3 / Q4 2025">
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
                {[
                  { label: "Q3 Positive Op. CF",       value: "Yes ✓", color: GREEN },
                  { label: "Q3 Pos. CF Net of Capex",  value: "Yes ✓", color: GREEN },
                  { label: "Q4 GAAP Op. Profit",       value: "$29M–$100M", color: AMBER },
                  { label: "Q4 Non-GAAP Op. Profit",   value: "$100M–$172M", color: GREEN },
                ].map(item => (
                  <div key={item.label} style={{ padding: "12px 14px", background: "#f8f9fa", border: "1px solid #e5e7eb", borderRadius: 6 }}>
                    <DataCell label={item.label} value={item.value} color={item.color} />
                  </div>
                ))}
              </div>
            </Panel>
          </div>
        )}

        {tab === "dcf" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <DiscountRate data={data} />
            <ScenarioAssumptions data={data} />
          </div>
        )}

        {tab === "risks" && (
          <div style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: 14 }}>
            <Risks data={data} />
            <ManagementQs data={data} />
          </div>
        )}
      </div>
    </div>
  );
}
