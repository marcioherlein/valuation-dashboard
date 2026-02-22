"use client";
import { useState } from "react";
import Link from "next/link";
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from "recharts";
import { CompanyDetail, ForecastRow } from "@/types";

const FONT = "'DM Sans', -apple-system, sans-serif";
const MONO = "'DM Mono', monospace";

const C = {
  blue:   "var(--blue)",
  green:  "var(--green)",
  red:    "var(--red)",
  amber:  "var(--amber)",
  purple: "var(--purple)",
  text1:  "var(--text-1)",
  text2:  "var(--text-2)",
  text3:  "var(--text-3)",
  border: "rgba(255,255,255,0.08)",
};

const tooltip = {
  contentStyle: {
    background: "#0f1629",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 10,
    fontSize: 11,
    fontFamily: FONT,
    color: C.text1,
    boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
  },
  labelStyle: { color: C.text3, fontSize: 10 },
};

/* ── building blocks ─────────────────────────────────────────────────────── */
function GlassPanel({ title, children, style = {} }: { title: string; children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div className="glass-card" style={{ overflow: "hidden", ...style }}>
      <div style={{
        padding: "12px 18px 10px",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        display: "flex", alignItems: "center", gap: 8,
      }}>
        <div style={{ width: 3, height: 14, background: C.blue, borderRadius: 2 }} />
        <span style={{ fontSize: 11, fontWeight: 600, color: C.text3, letterSpacing: "0.08em", textTransform: "uppercase" }}>
          {title}
        </span>
      </div>
      <div style={{ padding: 18 }}>{children}</div>
    </div>
  );
}

function Metric({ label, value, color, sub }: { label: string; value: string; color?: string; sub?: string }) {
  return (
    <div style={{ padding: "12px 14px", background: "rgba(255,255,255,0.03)", borderRadius: 10, border: "1px solid rgba(255,255,255,0.06)" }}>
      <div style={{ fontSize: 9, fontWeight: 600, color: C.text3, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 5 }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 700, color: color || C.text1, fontFamily: MONO, letterSpacing: "-0.02em", lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 10, color: C.text3, marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function RecTag({ rec }: { rec: string }) {
  const s: Record<string, { c: string; bg: string; b: string }> = {
    BUY:   { c: C.green,  bg: "var(--green-dim)",  b: "rgba(48,209,88,0.3)" },
    HOLD:  { c: C.amber,  bg: "var(--amber-dim)",  b: "rgba(255,159,10,0.3)" },
    AVOID: { c: C.red,    bg: "var(--red-dim)",    b: "rgba(255,69,58,0.3)" },
    SELL:  { c: C.red,    bg: "var(--red-dim)",    b: "rgba(255,69,58,0.3)" },
  };
  const { c, bg, b } = s[rec] || s.HOLD;
  return (
    <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", color: c, background: bg, border: `1px solid ${b}`, borderRadius: 20, padding: "5px 14px", fontFamily: FONT }}>
      {rec}
    </span>
  );
}

function Toggle({ value, onChange, options }: { value: string; onChange: (v: "base" | "upside") => void; options: { id: "base" | "upside"; label: string; color: string }[] }) {
  return (
    <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
      {options.map(o => {
        const active = value === o.id;
        return (
          <button key={o.id} onClick={() => onChange(o.id)} style={{
            fontSize: 11, fontWeight: 600, padding: "5px 14px", borderRadius: 20,
            cursor: "pointer", fontFamily: FONT, border: `1px solid ${active ? o.color + "55" : "rgba(255,255,255,0.1)"}`,
            background: active ? o.color + "20" : "transparent",
            color: active ? o.color : C.text3, transition: "all 0.15s",
          }}>{o.label}</button>
        );
      })}
    </div>
  );
}

/* ── sections ────────────────────────────────────────────────────────────── */
function SummarySection({ data }: { data: CompanyDetail }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Key metrics */}
      <GlassPanel title="Key Metrics">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
          <Metric label="Current Price"      value={`$${data.price.toFixed(2)}`}                                color={C.amber} />
          <Metric label="Base Intrinsic Val" value={`$${data.valuation.base.toFixed(2)}`}                      color={C.green} />
          <Metric label="Upside Intrinsic"   value={`$${data.valuation.upside.toFixed(2)}`}                    color={C.blue}  />
          <Metric label="Market Cap"         value={`$${(data.marketCap / 1e9).toFixed(2)}B`}                              />
          <Metric label="Upside to Base"     value={`+${data.valuation.upsideToBase.toFixed(1)}%`}             color={C.green} />
          <Metric label="Upside to Bull"     value={`+${data.valuation.upsideToBull.toFixed(1)}%`}             color={C.blue}  />
          <Metric label="Method"             value={data.valuation.method}                                                  />
          <Metric label="Horizon"            value={`${data.valuation.horizon}Y + terminal`}                               />
        </div>
      </GlassPanel>

      {/* Valuation spectrum */}
      <GlassPanel title="Valuation Spectrum">
        {(() => {
          const max = data.valuation.upside * 1.15;
          const pct = (v: number) => `${Math.min((v / max) * 100, 100).toFixed(1)}%`;
          const markers = [
            { label: "Current Price", value: data.price, color: C.amber, sub: "Market" },
            { label: "Base IV",       value: data.valuation.base,   color: C.green, sub: "Base case" },
            { label: "Upside IV",     value: data.valuation.upside, color: C.blue,  sub: "Bull case" },
          ];
          return (
            <>
              <div style={{ position: "relative", height: 60, marginBottom: 14 }}>
                {/* Track */}
                <div style={{ position: "absolute", top: 24, left: 0, right: 0, height: 8, background: "rgba(255,255,255,0.06)", borderRadius: 6 }} />
                {/* Fill */}
                <div style={{ position: "absolute", top: 24, left: 0, width: pct(data.valuation.base), height: 8, background: "linear-gradient(90deg, rgba(41,151,255,0.4), var(--green))", borderRadius: 6 }} />
                {markers.map(m => (
                  <div key={m.label} style={{ position: "absolute", top: 14, left: pct(m.value), transform: "translateX(-50%)", zIndex: 3 }}>
                    <div style={{ width: 2, height: 28, background: m.color, margin: "0 auto", borderRadius: 2, boxShadow: `0 0 8px ${m.color}` }} />
                    <div style={{ fontSize: 9, color: m.color, fontWeight: 700, textAlign: "center", marginTop: 4, whiteSpace: "nowrap", fontFamily: MONO }}>
                      ${m.value.toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                {markers.map(m => (
                  <div key={m.label} style={{ padding: "12px 14px", background: "rgba(255,255,255,0.03)", border: `1px solid ${m.color}30`, borderLeft: `3px solid ${m.color}`, borderRadius: 10 }}>
                    <div style={{ fontSize: 9, color: C.text3, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>{m.label}</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: m.color, fontFamily: MONO }}>${m.value.toFixed(2)}</div>
                    <div style={{ fontSize: 10, color: C.text3, marginTop: 2 }}>{m.sub}</div>
                  </div>
                ))}
              </div>
            </>
          );
        })()}
      </GlassPanel>

      {/* Reverse DCF */}
      <GlassPanel title="Reverse DCF — What the Market Implies">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
          {[
            { label: "Implied Terminal EBIT Margin", value: `${data.reverseDCF.impliedTerminalEBITMargin.toFixed(2)}%`, sub: "Holding Base growth path" },
            { label: "Implied Delivery Scale Factor", value: `${data.reverseDCF.impliedScaleFactor.toFixed(3)}×`, sub: "Holding Base margin path" },
          ].map(item => (
            <div key={item.label} style={{ padding: "14px 16px", background: "var(--amber-dim)", border: "1px solid rgba(255,159,10,0.25)", borderLeft: `3px solid ${C.amber}`, borderRadius: 10 }}>
              <div style={{ fontSize: 9, color: C.text3, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>{item.label}</div>
              <div style={{ fontSize: 26, fontWeight: 700, color: C.amber, fontFamily: MONO }}>{item.value}</div>
              <div style={{ fontSize: 10, color: C.text3, marginTop: 4 }}>{item.sub}</div>
            </div>
          ))}
        </div>
        <div style={{ padding: "12px 14px", background: "rgba(255,159,10,0.06)", border: "1px solid rgba(255,159,10,0.2)", borderRadius: 10, fontSize: 12, color: C.text2, lineHeight: 1.7, fontFamily: FONT }}>
          <span style={{ fontWeight: 700, color: C.amber }}>Market read: </span>
          {data.reverseDCF.interpretation}
        </div>
      </GlassPanel>

      {/* Bridge + Catalysts row */}
      <div style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: 14 }}>
        <GlassPanel title="EV → Equity Bridge">
          {(() => {
            const b = data.bridge;
            const ev = data.marketCap + b.borrowings + b.mezzanine - b.cash;
            const rows = [
              { label: "Market Cap",             value: data.marketCap, color: C.amber, sign: "" },
              { label: "+ Borrowings",            value: b.borrowings,  color: C.red,   sign: "+" },
              { label: "+ Redeemable NCI",        value: b.mezzanine,   color: C.red,   sign: "+" },
              { label: "− Cash & Liquid Assets",  value: b.cash,        color: C.green, sign: "−" },
            ];
            return (
              <>
                {rows.map((r, i) => (
                  <div key={r.label} style={{ display: "flex", justifyContent: "space-between", padding: "7px 10px", borderBottom: "1px solid rgba(255,255,255,0.04)", background: i % 2 === 0 ? "rgba(255,255,255,0.02)" : "transparent", borderRadius: 4 }}>
                    <span style={{ fontSize: 12, color: C.text2 }}>{r.label}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: r.color, fontFamily: MONO }}>{r.sign} ${(r.value / 1e9).toFixed(3)}B</span>
                  </div>
                ))}
                <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 10px", background: "var(--blue-dim)", border: "1px solid rgba(41,151,255,0.2)", borderRadius: 8, marginTop: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: C.text1 }}>= Enterprise Value</span>
                  <span style={{ fontSize: 16, fontWeight: 700, color: C.blue, fontFamily: MONO }}>${(ev / 1e9).toFixed(3)}B</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginTop: 10 }}>
                  {[
                    { l: "EV/Sales 2025E", v: `${data.multiples.evSales2025E?.toFixed(2)}×` },
                    { l: "P/Sales 2025E",  v: `${data.multiples.pSales2025E?.toFixed(2)}×` },
                    { l: "P/Book Sep'25",  v: `${data.multiples.pBook?.toFixed(1)}×` },
                  ].map(m => (
                    <div key={m.l} style={{ textAlign: "center", padding: "8px 4px", background: "rgba(255,255,255,0.03)", borderRadius: 8, border: "1px solid rgba(255,255,255,0.06)" }}>
                      <div style={{ fontSize: 9, color: C.text3, marginBottom: 3 }}>{m.l}</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: C.blue, fontFamily: MONO }}>{m.v}</div>
                    </div>
                  ))}
                </div>
              </>
            );
          })()}
        </GlassPanel>

        <GlassPanel title="Catalysts">
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {data.catalysts.map((c, i) => (
              <div key={i} style={{ display: "flex", gap: 10, padding: "8px 10px", background: "rgba(48,209,88,0.05)", border: "1px solid rgba(48,209,88,0.15)", borderRadius: 8 }}>
                <span style={{ color: C.green, fontSize: 12, flexShrink: 0, marginTop: 1 }}>→</span>
                <span style={{ fontSize: 11, color: C.text2, lineHeight: 1.5, fontFamily: FONT }}>{c}</span>
              </div>
            ))}
          </div>
        </GlassPanel>
      </div>
    </div>
  );
}

function ForecastSection({ data }: { data: CompanyDetail }) {
  const [sc, setSc] = useState<"base" | "upside">("base");
  const scenario = sc === "base" ? data.scenarios.base : data.scenarios.upside;
  const color = sc === "base" ? C.green : C.blue;
  const chartData = scenario.forecast.map((r: ForecastRow) => ({ year: r.year, revenue: r.revenue, ebit: r.ebit, fcff: r.fcff }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Toggle value={sc} onChange={setSc} options={[
          { id: "base",   label: "Base Case",   color: C.green },
          { id: "upside", label: "Upside Case", color: C.blue  },
        ]} />
        <span style={{ fontSize: 13, fontWeight: 700, color, fontFamily: MONO }}>
          IV: ${scenario.intrinsicValue.toFixed(2)}
        </span>
      </div>

      <GlassPanel title="Revenue Forecast (USD Billions)">
        <ResponsiveContainer width="100%" height={210}>
          <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="revG" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={color} stopOpacity={0.25} />
                <stop offset="95%" stopColor={color} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="year" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `$${v}B`} />
            <Tooltip {...tooltip} formatter={(v: number) => [`$${v.toFixed(2)}B`, "Revenue"]} />
            <Area type="monotone" dataKey="revenue" stroke={color} fill="url(#revG)" strokeWidth={2} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </GlassPanel>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <GlassPanel title="EBIT (USD Billions)">
          <ResponsiveContainer width="100%" height={170}>
            <BarChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" tick={{ fontSize: 9 }} />
              <YAxis tick={{ fontSize: 9 }} tickFormatter={v => `$${v}B`} />
              <Tooltip {...tooltip} formatter={(v: number) => [`$${v.toFixed(3)}B`, "EBIT"]} />
              <ReferenceLine y={0} stroke="rgba(255,255,255,0.15)" strokeDasharray="4 4" />
              <Bar dataKey="ebit" fill={color + "40"} stroke={color} strokeWidth={1} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </GlassPanel>
        <GlassPanel title="FCFF (USD Billions)">
          <ResponsiveContainer width="100%" height={170}>
            <BarChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" tick={{ fontSize: 9 }} />
              <YAxis tick={{ fontSize: 9 }} tickFormatter={v => `$${v}B`} />
              <Tooltip {...tooltip} formatter={(v: number) => [`$${v.toFixed(3)}B`, "FCFF"]} />
              <ReferenceLine y={0} stroke="rgba(255,255,255,0.15)" strokeDasharray="4 4" />
              <Bar dataKey="fcff" fill="rgba(41,151,255,0.3)" stroke={C.blue} strokeWidth={1} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </GlassPanel>
      </div>

      <GlassPanel title="Detailed Forecast Table">
        <Toggle value={sc} onChange={setSc} options={[
          { id: "base",   label: "Base",   color: C.green },
          { id: "upside", label: "Upside", color: C.blue  },
        ]} />
        <div style={{ overflowX: "auto" }}>
          <table className="val-table">
            <thead>
              <tr>
                <th>Year</th><th>Deliveries</th><th>Revenue ($B)</th>
                <th>EBIT ($B)</th><th>EBIT Margin</th><th>FCFF ($B)</th><th>PV(FCFF) ($B)</th>
              </tr>
            </thead>
            <tbody>
              {scenario.forecast.map((r: ForecastRow) => {
                const m = (r.ebit / r.revenue) * 100;
                return (
                  <tr key={r.year}>
                    <td>{r.year}</td>
                    <td>{(r.deliveries / 1000).toFixed(0)}K</td>
                    <td>${r.revenue.toFixed(2)}</td>
                    <td className={r.ebit < 0 ? "neg" : "pos"}>${r.ebit.toFixed(3)}</td>
                    <td className={m < 0 ? "neg" : "pos"}>{m.toFixed(1)}%</td>
                    <td className={r.fcff < 0 ? "neg" : "pos"}>${r.fcff.toFixed(3)}</td>
                    <td className={r.pvFCFF < 0 ? "neg" : "pos"}>${r.pvFCFF.toFixed(3)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </GlassPanel>
    </div>
  );
}

function DriversSection({ data }: { data: CompanyDetail }) {
  const kd = data.keyDrivers;
  const quarterly = data.financials.quarterly.map(q => ({
    period: q.period.replace(" 2025", "").replace(" 2025E", "E"),
    revenue: q.revenue / 1e9,
  }));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <GlassPanel title="Volume & Growth Drivers — 2025">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {[
              { l: "FY2025 Deliveries",      v: kd.deliveries2025.toLocaleString(),       c: C.green },
              { l: "YoY Growth",             v: `+${kd.deliveriesGrowthYoY}%`,            c: C.green },
              { l: "Q4 Record Deliveries",   v: kd.q4Deliveries.toLocaleString(),          c: C.blue  },
              { l: "Jan 2026 Deliveries",    v: kd.jan2026Deliveries.toLocaleString(),     c: C.blue  },
              { l: "Jan 2026 YoY Growth",    v: `+${kd.jan2026GrowthYoY}%`,               c: C.green },
              { l: "Revenue / Vehicle",      v: `$${kd.revenuePerVehicle2025E.toLocaleString()}`, c: C.text1 },
              { l: "FY2025 Revenue Proxy",   v: `$${(kd.fy2025RevenueProxy / 1e9).toFixed(2)}B`, c: C.text1 },
              { l: "Q3 Positive Op CF",      v: "Yes ✓",                                  c: C.green },
            ].map(item => <Metric key={item.l} label={item.l} value={item.v} color={item.c} />)}
          </div>
        </GlassPanel>
        <GlassPanel title="Quarterly Revenue Build — 2025">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={quarterly} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `$${v.toFixed(1)}B`} />
              <Tooltip {...tooltip} formatter={(v: number) => [`$${v.toFixed(2)}B`, "Revenue"]} />
              <Bar dataKey="revenue" fill="rgba(41,151,255,0.3)" stroke={C.blue} strokeWidth={1.5} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </GlassPanel>
      </div>
      <GlassPanel title="Breakeven Evidence — Q3 / Q4 2025">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
          {[
            { l: "Q3 Positive Op CF",       v: "Yes ✓",        c: C.green },
            { l: "Q3 Pos CF Net of Capex",  v: "Yes ✓",        c: C.green },
            { l: "Q4 GAAP Op Profit",       v: "$29M–$100M",   c: C.amber },
            { l: "Q4 Non-GAAP Op Profit",   v: "$100M–$172M",  c: C.green },
          ].map(item => <Metric key={item.l} label={item.l} value={item.v} color={item.c} />)}
        </div>
      </GlassPanel>
    </div>
  );
}

function DCFSection({ data }: { data: CompanyDetail }) {
  const dr = data.discountRate;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <GlassPanel title="CAPM Discount Rate Build">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10, marginBottom: 14 }}>
          {[
            { l: "Risk-Free Rate", v: `${dr.rf.toFixed(2)}%`,          c: C.text1 },
            { l: "Beta",           v: dr.beta.toFixed(2),               c: C.text1 },
            { l: "China ERP",      v: `${dr.erp.toFixed(2)}%`,          c: C.text1 },
            { l: "Cost of Equity", v: `${dr.costOfEquity.toFixed(3)}%`, c: C.blue  },
            { l: "Terminal Growth",v: `${dr.terminalGrowth.toFixed(1)}%`,c: C.amber },
          ].map(item => <Metric key={item.l} label={item.l} value={item.v} color={item.c} />)}
        </div>
        <div style={{ padding: "12px 16px", background: "var(--blue-dim)", border: "1px solid rgba(41,151,255,0.2)", borderRadius: 10, fontSize: 13, fontFamily: MONO, color: C.text2 }}>
          CoE = rf + β × ERP = {dr.rf}% + {dr.beta} × {dr.erp}% = <span style={{ color: C.blue, fontWeight: 700 }}>{dr.costOfEquity.toFixed(3)}%</span>
          {dr.fxRMBtoUSD && <span style={{ marginLeft: 24, fontSize: 11, color: C.text3 }}>FX constant: 1 USD = {dr.fxRMBtoUSD} RMB</span>}
        </div>
      </GlassPanel>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        {(["base", "upside"] as const).map(s => {
          const sc = data.scenarios[s];
          const color = s === "base" ? C.green : C.blue;
          return (
            <GlassPanel key={s} title={`${sc.label} Case Assumptions`}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
                <Metric label="Intrinsic Value"  value={`$${sc.intrinsicValue.toFixed(2)}`} color={color} />
                <Metric label="Sales-to-Capital" value={`${sc.salestoCapital}×`} />
              </div>
              {[
                { label: "Delivery Growth Path", values: sc.deliveryGrowthPath.map(g => `${g}%`), color },
                { label: "EBIT Margin Path",     values: sc.ebitMarginPath.map(m => `${m}%`),     color: C.blue },
              ].map(row => (
                <div key={row.label} style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 9, color: C.text3, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6, fontWeight: 600 }}>{row.label}</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                    {row.values.map((v, i) => (
                      <span key={i} style={{ fontSize: 11, padding: "3px 8px", fontFamily: MONO, background: row.color + "15", border: `1px solid ${row.color}30`, borderRadius: 6, color: row.color, fontWeight: 600 }}>{v}</span>
                    ))}
                  </div>
                </div>
              ))}
            </GlassPanel>
          );
        })}
      </div>
    </div>
  );
}

function RisksSection({ data }: { data: CompanyDetail }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: 14 }}>
      <GlassPanel title="Risk Register">
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {data.risks.map(r => (
            <div key={r.rank} style={{ display: "flex", gap: 12, padding: "10px 12px", background: "rgba(255,69,58,0.04)", border: "1px solid rgba(255,69,58,0.12)", borderLeft: `3px solid ${C.red}`, borderRadius: 10 }}>
              <div style={{ flexShrink: 0, width: 22, height: 22, background: "var(--red-dim)", border: "1px solid rgba(255,69,58,0.3)", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: C.red, fontFamily: MONO }}>
                {r.rank}
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.text1, marginBottom: 2 }}>{r.title}</div>
                <div style={{ fontSize: 11, color: C.text2, lineHeight: 1.6 }}>{r.detail}</div>
              </div>
            </div>
          ))}
        </div>
      </GlassPanel>
      <GlassPanel title="Management Questions">
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {data.managementQuestions.map((q, i) => (
            <div key={i} style={{ display: "flex", gap: 12, padding: "10px 0", borderBottom: i < data.managementQuestions.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
              <span style={{ flexShrink: 0, fontSize: 10, fontWeight: 700, color: C.blue, fontFamily: MONO, background: "var(--blue-dim)", border: "1px solid rgba(41,151,255,0.25)", borderRadius: 6, padding: "2px 7px", height: "fit-content" }}>Q{i + 1}</span>
              <span style={{ fontSize: 11, color: C.text2, lineHeight: 1.6 }}>{q}</span>
            </div>
          ))}
        </div>
      </GlassPanel>
    </div>
  );
}

/* ── main ────────────────────────────────────────────────────────────────── */
const TABS = [
  { id: "summary",  label: "Summary"       },
  { id: "forecast", label: "Forecast"       },
  { id: "drivers",  label: "Key Drivers"    },
  { id: "dcf",      label: "DCF Inputs"     },
  { id: "risks",    label: "Risks"          },
];

export default function CompanyReport({ data }: { data: CompanyDetail }) {
  const [tab, setTab] = useState("summary");

  return (
    <div style={{ maxWidth: 1360, margin: "0 auto", paddingBottom: 60 }}>
      {/* Company header */}
      <div style={{ padding: "24px 32px 0" }}>
        <div style={{ fontSize: 11, color: C.text3, marginBottom: 10 }}>
          <Link href="/" style={{ color: C.blue }}>← Coverage Universe</Link>
          {" / "}{data.ticker}
        </div>

        <div className="glass-card" style={{ padding: "20px 24px", marginBottom: 0 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
            <div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 4 }}>
                <span style={{ fontSize: 28, fontWeight: 700, color: C.text1, letterSpacing: "-0.03em" }}>{data.ticker}</span>
                <span style={{ fontSize: 15, color: C.text2 }}>{data.name}</span>
                <span style={{ fontSize: 10, background: "var(--blue-dim)", color: C.blue, border: "1px solid rgba(41,151,255,0.25)", borderRadius: 6, padding: "2px 8px", fontWeight: 600 }}>
                  {data.exchange} · {data.instrument}
                </span>
              </div>
              <div style={{ fontSize: 12, color: C.text2, maxWidth: 640, lineHeight: 1.6 }}>
                <span style={{ fontWeight: 700, color: C.blue }}>Thesis: </span>{data.thesis}
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 16, flexShrink: 0 }}>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 10, color: C.text3, marginBottom: 2 }}>As of {data.asOfDate}</div>
                <div style={{ fontSize: 26, fontWeight: 700, color: C.amber, fontFamily: MONO, letterSpacing: "-0.02em" }}>${data.price.toFixed(2)}</div>
              </div>
              <RecTag rec={data.recommendation} />
            </div>
          </div>

          {/* Tab bar inside header card */}
          <div style={{ display: "flex", gap: 4, marginTop: 18, borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: 14 }}>
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                fontSize: 12, fontWeight: tab === t.id ? 600 : 400,
                padding: "6px 16px", borderRadius: 20, cursor: "pointer",
                border: "none", fontFamily: FONT, transition: "all 0.15s",
                background: tab === t.id ? "var(--blue-dim)" : "transparent",
                color: tab === t.id ? C.blue : C.text3,
              }}>{t.label}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: "16px 32px" }} key={tab} className="fade-up">
        {tab === "summary"  && <SummarySection  data={data} />}
        {tab === "forecast" && <ForecastSection data={data} />}
        {tab === "drivers"  && <DriversSection  data={data} />}
        {tab === "dcf"      && <DCFSection       data={data} />}
        {tab === "risks"    && <RisksSection     data={data} />}
      </div>
    </div>
  );
}
